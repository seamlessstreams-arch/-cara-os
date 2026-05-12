// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — AUDIT SERVICE
// Immutable audit trail for every AI action. Append-only.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type { AriaStudioAuditLog } from "@/types/aria-studio";

export async function writeStudioAuditLog(
  entry: Partial<AriaStudioAuditLog>,
): Promise<void> {
  const sb = createServerClient();
  if (!sb) return; // No-op in in-memory mode

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (sb.from("aria_studio_audit_log") as any).insert({
      home_id: entry.home_id,
      actor_id: entry.actor_id,
      action_type: entry.action_type,
      artifact_id: entry.artifact_id ?? null,
      source_ids: entry.source_ids ?? [],
      prompt_summary: entry.prompt_summary ?? null,
      model_provider: entry.model_provider ?? null,
      model_name: entry.model_name ?? null,
      request_metadata: entry.request_metadata ?? null,
      response_metadata: entry.response_metadata ?? null,
      before_state: entry.before_state ?? null,
      after_state: entry.after_state ?? null,
      ip_address: entry.ip_address ?? null,
      user_agent: entry.user_agent ?? null,
    });
  } catch (err) {
    // Audit log failures must never break primary operations
    console.error("[aria-studio] Failed to write audit log:", err);
  }
}

export async function getAuditTrail(
  artifactId: string,
): Promise<AriaStudioAuditLog[]> {
  const sb = createServerClient();
  if (!sb) return [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (sb.from("aria_studio_audit_log") as any)
      .select("*")
      .eq("artifact_id", artifactId)
      .order("created_at", { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}
