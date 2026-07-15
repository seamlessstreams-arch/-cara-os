import "server-only";

// ══════════════════════════════════════════════════════════════════════════════
// CARA HQ — service layer (route-facing)
//
// Gate: HQ endpoints are platform-owner only (x-user-role: platform_admin) —
// a separate identity from every care role; org managers never see HQ.
// Until Supabase Auth lands this is the same demo-persona header convention
// the rest of the API uses; real session identity replaces it at the gate.
//
// 🔴 Safeguarding boundary: every read/write here touches HQ METADATA only.
// Break-glass records intent — it does not open children's records, and no
// HQ code path reads them.
// ══════════════════════════════════════════════════════════════════════════════

import { z } from "zod";
import type { NextRequest } from "next/server";
import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import type { HqBreakGlassGrant, HqHome, HqOrganisation, HqUsageEvent } from "./hq-types";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  loadHqHomes,
  loadHqOrganisations,
  persistHqBreakGlass,
  persistHqBreakGlassRevoke,
  persistHqHome,
  persistHqOrganisation,
  persistHqOrgStatus,
  persistHqUsageEvent,
} from "@/lib/supabase/hq-persist";

export interface HqActor {
  id: string;
  role: string;
}

export function hqActorFromHeaders(headers: Headers): HqActor {
  return {
    id: headers.get("x-user-id") ?? "anonymous",
    role: headers.get("x-user-role") ?? "",
  };
}

/**
 * Resolve the HQ actor for a request.
 *
 * Activated mode (Supabase configured): the actor is derived from the validated
 * session — ONLY a `super_admin` staff member is treated as the platform owner.
 * The client-supplied X-User-Role header is ignored here, closing the spoofable
 * admin gate. No session → an empty role (isPlatformAdmin → false).
 *
 * Demo mode: the X-User-Role header convention, unchanged.
 */
export async function resolveHqActor(request: NextRequest): Promise<HqActor> {
  const { isSupabaseEnabled } = await import("@/lib/supabase/server");
  if (isSupabaseEnabled()) {
    const { resolveStaffSession } = await import("@/lib/supabase/auth");
    let session: Awaited<ReturnType<typeof resolveStaffSession>> | null = null;
    try {
      session = await resolveStaffSession(request);
    } catch {
      session = null;
    }
    if (!session) return { id: "anonymous", role: "" };
    // The platform-owner identity in activated mode is the super_admin staff role.
    return {
      id: session.userId,
      role: session.role === "super_admin" ? "platform_admin" : session.role,
    };
  }
  return hqActorFromHeaders(request.headers);
}

export function isPlatformAdmin(actor: HqActor): boolean {
  return actor.role === "platform_admin";
}

/** Append a usage event — store always, Supabase best-effort. */
export function logUsageEvent(
  kind: string,
  opts: { orgId?: string | null; userLabel?: string | null; meta?: Record<string, unknown> } = {},
): HqUsageEvent {
  const store = getStore();
  const event: HqUsageEvent = {
    id: generateId("usage"),
    at: new Date().toISOString(),
    // Activity without an explicit org belongs to this deployment's own organisation.
    org_id: opts.orgId ?? store.hqOrganisations[0]?.id ?? null,
    user_label: opts.userLabel ?? null,
    kind,
    meta: opts.meta ?? {},
  };
  store.hqUsageEvents.push(event);
  void persistHqUsageEvent(event);
  return event;
}

// ── Provisioning ──────────────────────────────────────────────────────────────

export const ProvisionCustomerSchema = z.object({
  org_name: z.string().trim().min(2, "Customer name required."),
  first_home_name: z.string().trim().min(2, "First home/site name required."),
  // `homes.address` is NOT NULL — a home cannot be provisioned without one, so
  // this is required rather than politely optional.
  first_home_address: z.string().trim().min(5, "Home address required."),
  first_home_ofsted_urn: z.string().trim().optional(),
  first_home_max_beds: z.coerce.number().int().min(1).max(60).default(3),
  plan: z.enum(["pilot", "essentials", "professional", "group"]),
  manager_name: z.string().trim().min(2, "Manager name required."),
  manager_email: z.string().trim().email("Valid manager email required."),
});
export type ProvisionCustomerInput = z.infer<typeof ProvisionCustomerSchema>;

export type ProvisionResult =
  | { ok: true; org: HqOrganisation; home: HqHome }
  | { ok: false; error: string };

/**
 * Provision a customer: the organisation AND its first home.
 *
 * `first_home_name` used to be a text note on the org — the type said so:
 * "real multi-tenant home provisioning lands with auth". Auth has landed, so
 * the home is now an actual `homes` row that a tenant deployment can point
 * SUPABASE_HOME_ID at. Before this, nothing in the app ever wrote to `homes`.
 *
 * The org is best-effort write-through (as before); the HOME is not. If the
 * home cannot be written, this reports failure rather than returning a success
 * that leaves HQ showing a home which exists nowhere but one server's memory.
 *
 * Manager SIGN-IN provisioning (auth user + temp password) is still deliberately
 * absent — see the login door. Creating credentials here would be theatre.
 */
export async function provisionCustomer(
  input: ProvisionCustomerInput,
  actor: HqActor,
): Promise<ProvisionResult> {
  const store = getStore();
  const now = new Date().toISOString();
  const org: HqOrganisation = {
    id: generateId("org"),
    name: input.org_name,
    plan: input.plan,
    status: "active",
    primary_contact_name: input.manager_name,
    primary_contact_email: input.manager_email,
    first_home_name: input.first_home_name,
    created_at: now,
    updated_at: now,
  };
  const home: HqHome = {
    // uuid, not generateId("home"): `homes.id` is a uuid column, and minting it
    // here keeps the in-memory copy and the row on the same id.
    id: crypto.randomUUID(),
    org_id: org.id,
    name: input.first_home_name,
    address: input.first_home_address,
    ofsted_urn: input.first_home_ofsted_urn?.trim() || null,
    max_beds: input.first_home_max_beds,
    created_at: now,
  };

  // Write the home first: it is the part that can genuinely fail, and failing
  // before the org exists leaves nothing half-created to explain.
  const written = await persistHqHome(home);
  if (!written.ok) {
    return { ok: false, error: `Home could not be created: ${written.error}` };
  }

  store.hqOrganisations.push(org);
  store.hqHomes.push(home);
  void persistHqOrganisation(org);
  logUsageEvent("customer_provisioned", {
    orgId: org.id,
    userLabel: actor.id,
    meta: { plan: org.plan, home_id: home.id },
  });
  return { ok: true, org, home };
}

/**
 * The customer list, read from the database when there is one.
 *
 * Reads used to come from the store alone, which is per-serverless-instance and
 * re-seeds on a cold start — so a provisioned customer was written to Postgres
 * and then vanished from the UI while still sitting in the table.
 *
 * Returns null when the database is connected but unreadable. An empty list and
 * a failed read must not render identically.
 */
export async function listCustomers(): Promise<HqOrganisation[] | null> {
  if (isSupabaseEnabled()) return await loadHqOrganisations();
  return [...getStore().hqOrganisations].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Provisioned homes, from the database when there is one. Null = unreadable. */
export async function listHomes(): Promise<HqHome[] | null> {
  if (isSupabaseEnabled()) return await loadHqHomes();
  return [...getStore().hqHomes].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// ── Status ────────────────────────────────────────────────────────────────────

export const SetOrgStatusSchema = z.object({
  status: z.enum(["active", "suspended", "churned"]),
});

export function setOrgStatus(
  orgId: string,
  status: HqOrganisation["status"],
  actor: HqActor,
): HqOrganisation | null {
  const store = getStore();
  const org = store.hqOrganisations.find((o) => o.id === orgId);
  if (!org) return null;
  org.status = status;
  org.updated_at = new Date().toISOString();
  void persistHqOrgStatus(orgId, status);
  logUsageEvent("status_changed", { orgId, userLabel: actor.id, meta: { to: status } });
  return org;
}

// ── Break-glass ───────────────────────────────────────────────────────────────

export const BreakGlassSchema = z.object({
  reason: z.string().trim().min(10, "Give a clear, auditable reason."),
  hours: z.coerce.number().min(1).max(72),
});

export function recordBreakGlass(
  orgId: string,
  input: z.infer<typeof BreakGlassSchema>,
  actor: HqActor,
): HqBreakGlassGrant | null {
  const store = getStore();
  const org = store.hqOrganisations.find((o) => o.id === orgId);
  if (!org) return null;
  const now = Date.now();
  const grant: HqBreakGlassGrant = {
    id: generateId("bg"),
    admin_label: actor.id,
    org_id: orgId,
    reason: input.reason,
    granted_at: new Date(now).toISOString(),
    expires_at: new Date(now + input.hours * 3600e3).toISOString(),
    revoked_at: null,
  };
  store.hqBreakGlassGrants.push(grant);
  void persistHqBreakGlass(grant);
  logUsageEvent("break_glass_recorded", { orgId, userLabel: actor.id, meta: { hours: input.hours } });
  return grant;
}

export function revokeBreakGlass(grantId: string, actor: HqActor): HqBreakGlassGrant | null {
  const store = getStore();
  const grant = store.hqBreakGlassGrants.find((g) => g.id === grantId);
  if (!grant || grant.revoked_at) return null;
  grant.revoked_at = new Date().toISOString();
  void persistHqBreakGlassRevoke(grant.id, grant.revoked_at);
  logUsageEvent("break_glass_revoked", { orgId: grant.org_id, userLabel: actor.id });
  return grant;
}
