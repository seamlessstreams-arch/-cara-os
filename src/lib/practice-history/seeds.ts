// ═══════════════════════════════════════════════════════════════════════════
// CARA — practice analysis history seeds (demo realism)
//
// ~8 weeks of metadata-only analyses so the trend card reads sensibly in the
// in-memory demo (the whole store is per-instance + seeded; live analyses
// append on top via the route write-throughs). A gently improving trajectory.
// No record content — scores + flag counts only.
// ═══════════════════════════════════════════════════════════════════════════

import type { PaceAnalysisRecord, WritingReviewRecord } from "./types";

const DAY = 864e5;
const HOME = "home_oak";

// Deterministic-ish spread: base score climbs ~3/week (older=lower), small wobble.
function scoreForWeek(weeksAgo: number, idx: number, base: number): number {
  const climb = (7 - weeksAgo) * 3;       // older weeks lower
  const wobble = ((idx * 17) % 11) - 5;   // -5..+5
  return Math.max(20, Math.min(96, base + climb + wobble));
}

const PACE_CONTEXTS = ["INCIDENT", "DEBRIEF", "PHYSICAL_INTERVENTION", "DAILY_LOG", "KEY_WORK"];
const WRITING_TYPES = ["incident", "daily_log", "missing_episode", "family_time", "key_work"];
const CHILDREN = ["yp_alex", "yp_jordan", "yp_casey", null];
const STAFF = ["staff_darren", "staff_anna", "staff_ryan", "staff_chervelle"];

export function seedPaceAnalyses(): PaceAnalysisRecord[] {
  const rows: PaceAnalysisRecord[] = [];
  let n = 0;
  for (let w = 7; w >= 0; w--) {
    const perWeek = 3 + (w % 2); // 3–4 per week
    for (let k = 0; k < perWeek; k++) {
      const score = scoreForWeek(w, n, 52);
      const band = score >= 80 ? "strong" : score >= 65 ? "developing" : score >= 45 ? "emerging" : "needs_attention";
      const flagCount = score >= 70 ? 0 : score >= 50 ? 1 : 2;
      rows.push({
        id: `pace_hist_${++n}`,
        at: new Date(Date.now() - (w * 7 + k * 2 + 1) * DAY).toISOString(),
        home_id: HOME,
        child_id: CHILDREN[n % CHILDREN.length],
        staff_id: STAFF[n % STAFF.length],
        context: PACE_CONTEXTS[n % PACE_CONTEXTS.length],
        score,
        band,
        flag_count: flagCount,
        manager_review_required: score < 50,
      });
    }
  }
  return rows;
}

export function seedWritingReviews(): WritingReviewRecord[] {
  const rows: WritingReviewRecord[] = [];
  let n = 0;
  for (let w = 7; w >= 0; w--) {
    const perWeek = 3 + ((w + 1) % 2);
    for (let k = 0; k < perWeek; k++) {
      const score = scoreForWeek(w, n + 3, 49);
      const flagCount = score >= 75 ? 0 : score >= 55 ? 1 : 2;
      rows.push({
        id: `writing_hist_${++n}`,
        at: new Date(Date.now() - (w * 7 + k * 2 + 2) * DAY).toISOString(),
        home_id: HOME,
        staff_id: STAFF[n % STAFF.length],
        record_type: WRITING_TYPES[n % WRITING_TYPES.length],
        overall_score: score,
        flag_count: flagCount,
      });
    }
  }
  return rows;
}
