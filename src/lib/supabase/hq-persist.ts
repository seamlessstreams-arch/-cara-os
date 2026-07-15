// ══════════════════════════════════════════════════════════════════════════════
// CARA HQ — write-through helpers
//
// Same contract as cara-persist.ts: best-effort, never throws, no-op while
// Supabase is off. Organisations and break-glass grants keep their application
// TEXT ids (org_…, bg_…) so later updates address the same row — migration 414.
// ══════════════════════════════════════════════════════════════════════════════

import { isSupabaseEnabled, createServerClient } from "./server";
import type {
  HqAiUsageRow,
  HqBreakGlassGrant,
  HqHome,
  HqOrganisation,
  HqUsageEvent,
} from "@/lib/hq/hq-types";

// Generated Database types don't know the 414 tables yet — narrow untyped
// escape hatch, payload shapes mirrored from the migration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawClient = { from(table: string): any };
function raw(c: NonNullable<ReturnType<typeof createServerClient>>): RawClient {
  return c as unknown as RawClient;
}

export async function persistHqOrganisation(o: HqOrganisation): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    await raw(c).from("organisations").insert({
      id: o.id,
      name: o.name,
      plan: o.plan,
      status: o.status,
      primary_contact_name: o.primary_contact_name,
      primary_contact_email: o.primary_contact_email,
      first_home_name: o.first_home_name,
    });
  } catch {
    /* best-effort */
  }
}

/**
 * Write the provisioned home to `homes` and link it to its customer.
 *
 * Unlike the persist* helpers around it, this one REPORTS failure. Everything
 * else here is telemetry, where losing a row costs a metric. This row is the
 * home itself: if it silently fails, HQ shows a home that does not exist and
 * the tenant deployment it was created for has nothing to point at. The caller
 * decides what to tell the person who pressed the button.
 */
export async function persistHqHome(h: HqHome): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseEnabled()) return { ok: true }; // demo: the store IS the record
  const c = createServerClient();
  if (!c) return { ok: false, error: "No database connection configured." };
  try {
    const { error } = await raw(c).from("homes").insert({
      id: h.id,
      org_id: h.org_id,
      name: h.name,
      address: h.address,
      ofsted_urn: h.ofsted_urn,
      max_beds: h.max_beds,
    });
    if (error) return { ok: false, error: error.message ?? "Insert failed." };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Insert failed." };
  }
}

/**
 * Read customers back from the database.
 *
 * The gap this closes: provisioning wrote to `organisations` AND to the
 * in-memory store, but every read came from the store alone. The store is
 * per-serverless-instance and re-seeds on a cold start, so a real customer was
 * written to Postgres and then never seen again.
 *
 * Returns null on failure rather than [] — an empty list and a broken read must
 * not look identical to the caller.
 */
export async function loadHqOrganisations(): Promise<HqOrganisation[] | null> {
  if (!isSupabaseEnabled()) return null;
  const c = createServerClient();
  if (!c) return null;
  try {
    const { data, error } = await raw(c)
      .from("organisations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return null;
    return data as HqOrganisation[];
  } catch {
    return null;
  }
}

/** Read provisioned homes back, newest first. Null on failure — see above. */
export async function loadHqHomes(): Promise<HqHome[] | null> {
  if (!isSupabaseEnabled()) return null;
  const c = createServerClient();
  if (!c) return null;
  try {
    const { data, error } = await raw(c)
      .from("homes")
      .select("id, org_id, name, address, ofsted_urn, max_beds, created_at")
      .not("org_id", "is", null)
      .order("created_at", { ascending: false });
    if (error || !data) return null;
    return data as HqHome[];
  } catch {
    return null;
  }
}

export async function persistHqOrgStatus(orgId: string, status: HqOrganisation["status"]): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    await raw(c).from("organisations").update({ status }).eq("id", orgId);
  } catch {
    /* best-effort */
  }
}

export async function persistHqUsageEvent(e: HqUsageEvent): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    // identity pk — demo id travels in meta for traceability
    await raw(c).from("usage_events").insert({
      at: e.at,
      org_id: e.org_id,
      user_label: e.user_label,
      kind: e.kind,
      meta: { ...e.meta, app_id: e.id },
    });
  } catch {
    /* best-effort */
  }
}

export async function persistHqAiUsage(r: HqAiUsageRow): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    await raw(c).from("ai_usage").insert({
      at: r.at,
      org_id: r.org_id,
      feature: r.feature,
      model: r.model,
      tokens_input: r.tokens_input,
      tokens_output: r.tokens_output,
      cost_gbp: r.cost_gbp,
      estimated: r.estimated,
    });
  } catch {
    /* best-effort */
  }
}

export async function persistHqBreakGlass(g: HqBreakGlassGrant): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    await raw(c).from("break_glass_grants").insert({
      id: g.id,
      admin_label: g.admin_label,
      org_id: g.org_id,
      reason: g.reason,
      granted_at: g.granted_at,
      expires_at: g.expires_at,
      revoked_at: g.revoked_at,
    });
  } catch {
    /* best-effort */
  }
}

export async function persistHqBreakGlassRevoke(grantId: string, revokedAt: string): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    await raw(c).from("break_glass_grants").update({ revoked_at: revokedAt }).eq("id", grantId);
  } catch {
    /* best-effort */
  }
}
