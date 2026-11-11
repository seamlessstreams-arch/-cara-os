// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — AUDIT SERVICE
// Immutable audit trail for every AI action. Append-only.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type { CaraStudioAuditLog, CaraAuditAction } from "@/types/cara-studio";
import type { Json } from "@/lib/supabase/types";

export async function writeStudioAuditLog(
  entry: Partial<CaraStudioAuditLog>,
): Promise<void> {
  const sb = createServerClient();
  if (!sb) return; // No-op in in-memory mode

  try {
    await sb.from("cara_studio_audit_log").insert({
      home_id: entry.home_id,
      actor_id: entry.actor_id,
      action_type: entry.action_type,
      artifact_id: entry.artifact_id ?? null,
      source_ids: entry.source_ids ?? [],
      prompt_summary: entry.prompt_summary ?? null,
      model_provider: entry.model_provider ?? null,
      model_name: entry.model_name ?? null,
      request_metadata: (entry.request_metadata ?? null) as Json,
      response_metadata: (entry.response_metadata ?? null) as Json,
      before_state: (entry.before_state ?? null) as Json,
      after_state: (entry.after_state ?? null) as Json,
      ip_address: entry.ip_address ?? null,
      user_agent: entry.user_agent ?? null,
    });
  } catch (err) {
    // Audit log failures must never break primary operations
    console.error("[cara-studio] Failed to write audit log:", err);
  }
}

export async function getAuditTrail(
  artifactId: string,
): Promise<CaraStudioAuditLog[]> {
  const sb = createServerClient();
  if (!sb) return [];

  try {
    const { data } = await sb.from("cara_studio_audit_log")
      .select("*")
      .eq("artifact_id", artifactId)
      .order("created_at", { ascending: true });
    // Rows and the domain type share columns; nullability is the recorded gap.
    return (data ?? []) as unknown as CaraStudioAuditLog[];
  } catch {
    return [];
  }
}

export interface HomeAuditTrailOptions {
  actorId?: string;
  actionType?: CaraAuditAction;
  artifactId?: string;
  sinceIso?: string;
  limit?: number;
}

/**
 * Home-wide audit trail (newest-first) with the same filters as the live-tail
 * viewer. Counterpart to loadAuditTrail (the in-memory store reader) for the
 * live tenant, where the store is emptied and the real rows live in
 * cara_studio_audit_log (written by writeStudioAuditLog). Returns [] on any
 * failure — the tail viewer degrades to empty, it never 500s.
 */
export async function getHomeAuditTrail(
  homeId: string,
  opts: HomeAuditTrailOptions = {},
): Promise<CaraStudioAuditLog[]> {
  const sb = createServerClient();
  if (!sb) return [];

  try {
    let query = sb.from("cara_studio_audit_log")
      .select("*")
      .eq("home_id", homeId)
      .order("created_at", { ascending: false });

    if (opts.actorId) query = query.eq("actor_id", opts.actorId);
    if (opts.actionType) query = query.eq("action_type", opts.actionType);
    if (opts.artifactId) query = query.eq("artifact_id", opts.artifactId);
    if (opts.sinceIso) query = query.gte("created_at", opts.sinceIso);

    const limit = opts.limit && opts.limit > 0 ? Math.min(opts.limit, 500) : 200;
    query = query.limit(limit);

    const { data } = await query;
    return (data ?? []) as unknown as CaraStudioAuditLog[];
  } catch {
    return [];
  }
}

/**
 * Distinct actor ids in the home's audit trail, for the filter dropdown.
 * Counterpart to loadAuditActors for the live tenant.
 */
export async function getHomeAuditActors(homeId: string): Promise<string[]> {
  const sb = createServerClient();
  if (!sb) return [];

  try {
    const { data } = await sb.from("cara_studio_audit_log")
      .select("actor_id")
      .eq("home_id", homeId);
    const actors = new Set<string>();
    for (const row of (data ?? []) as { actor_id: string | null }[]) {
      if (row.actor_id) actors.add(row.actor_id);
    }
    return Array.from(actors).sort();
  } catch {
    return [];
  }
}
