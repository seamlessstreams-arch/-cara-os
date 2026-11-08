// ══════════════════════════════════════════════════════════════════════════════
// ARTEFACT EDIT SCORES — persist the per-section change scores computed at commit.
//
// Phase 1.3. Scores only (no full text). Live-safe: writes `cara_studio_artifact_
// edit_scores` on a live tenant; reports not-persisted (never throws) otherwise.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { SB } from "@/lib/supabase/loose-client";
import type { SectionEditScore } from "./edit-distance";

export async function recordArtifactEditScores(
  artifactId: string,
  homeId: string,
  scores: SectionEditScore[],
  versionId?: string | null,
): Promise<{ persisted: boolean; count: number }> {
  if (!isSupabaseEnabled() || scores.length === 0) return { persisted: false, count: 0 };
  const c = createServerClient();
  if (!c) return { persisted: false, count: 0 };

  const rows = scores.map((s) => ({
    home_id: homeId,
    artifact_id: artifactId,
    version_id: versionId ?? null,
    section_key: s.section_key,
    change_score: s.change_score,
    ai_len: s.ai_len,
    committed_len: s.committed_len,
  }));

  const { error } = await (c as unknown as SB).from("cara_studio_artifact_edit_scores").insert(rows);
  if (error) return { persisted: false, count: 0 };
  return { persisted: true, count: rows.length };
}
