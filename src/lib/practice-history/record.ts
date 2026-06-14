import "server-only";

// CARA — practice analysis history write-through.
// Called best-effort from the analyse routes so PACE + Writing-to-the-Child
// scores accrue into a trend. METADATA ONLY — never record content. Capped
// in-memory ring (durable history lands with Supabase via migration 420).

import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import type { PaceAnalysisRecord, WritingReviewRecord } from "./types";

const RING_CAP = 4000;
function pushCapped<T>(arr: T[], row: T): void {
  arr.push(row);
  if (arr.length > RING_CAP) arr.splice(0, arr.length - RING_CAP);
}

export function recordPaceAnalysis(input: {
  homeId?: string | null;
  childId?: string | null;
  staffId?: string | null;
  context: string;
  score: number;
  band: string;
  flagCount: number;
  managerReviewRequired: boolean;
}): void {
  const store = getStore();
  const row: PaceAnalysisRecord = {
    id: generateId("pace_hist"),
    at: new Date().toISOString(),
    home_id: input.homeId ?? "home_oak",
    child_id: input.childId ?? null,
    staff_id: input.staffId ?? null,
    context: input.context,
    score: Math.max(0, Math.min(100, Math.round(input.score))),
    band: input.band,
    flag_count: Math.max(0, Math.round(input.flagCount)),
    manager_review_required: !!input.managerReviewRequired,
  };
  pushCapped(store.caraPaceAnalyses, row);
}

export function recordWritingReview(input: {
  homeId?: string | null;
  staffId?: string | null;
  recordType: string;
  overallScore: number;
  flagCount: number;
}): void {
  const store = getStore();
  const row: WritingReviewRecord = {
    id: generateId("writing_hist"),
    at: new Date().toISOString(),
    home_id: input.homeId ?? "home_oak",
    staff_id: input.staffId ?? null,
    record_type: input.recordType,
    overall_score: Math.max(0, Math.min(100, Math.round(input.overallScore))),
    flag_count: Math.max(0, Math.round(input.flagCount)),
  };
  pushCapped(store.caraWritingReviews, row);
}
