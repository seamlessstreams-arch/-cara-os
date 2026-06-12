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
import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import type { HqBreakGlassGrant, HqOrganisation, HqUsageEvent } from "./hq-types";
import {
  persistHqBreakGlass,
  persistHqBreakGlassRevoke,
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
  plan: z.enum(["pilot", "essentials", "professional", "group"]),
  manager_name: z.string().trim().min(2, "Manager name required."),
  manager_email: z.string().trim().email("Valid manager email required."),
});
export type ProvisionCustomerInput = z.infer<typeof ProvisionCustomerSchema>;

/**
 * Creates the customer organisation record (store + write-through).
 * Manager SIGN-IN provisioning (auth user + temp password) deliberately does
 * not exist yet — there is no login flow in the product, so generating
 * credentials would be theatre. It activates with Supabase Auth.
 */
export function provisionCustomer(input: ProvisionCustomerInput, actor: HqActor): HqOrganisation {
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
  store.hqOrganisations.push(org);
  void persistHqOrganisation(org);
  logUsageEvent("customer_provisioned", {
    orgId: org.id,
    userLabel: actor.id,
    meta: { plan: org.plan },
  });
  return org;
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
