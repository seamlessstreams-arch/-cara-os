// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — AUDIT SERVICE
// Immutable audit trail for every AI action. Append-only.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type { CaraStudioAuditLog } from "@/types/cara-studio";
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
