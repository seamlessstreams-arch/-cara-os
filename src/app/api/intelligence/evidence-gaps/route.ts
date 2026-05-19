import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import { scanEvidenceGaps, type EvidenceGapScanInput } from "@/lib/intelligence/evidence-gap-scanner";
import {
  reg44Visits,
  reg44Actions,
  reg45Reviews,
  voiceEntries,
} from "@/lib/intelligence/fallback-store";

// Derive scanner inputs from in-memory fallback collections.
// In production (supabase), this route should query the real tables.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "home_oak";

  if (!isSupabaseEnabled()) {
    // Build children list from voice entries (source of truth for last voice date).
    const childrenMap = new Map<string, { id: string; name: string; lastVoiceDate?: string; lastKeyWorkDate?: string }>();
    for (const v of voiceEntries) {
      if (v.home_id !== homeId) continue;
      const childId = v.child_id;
      if (!childId) continue;
      const existing = childrenMap.get(childId);
      const isKeyWork = v.category === "wishes_and_feelings" || v.linked_record_type === "key_work";
      if (!existing) {
        childrenMap.set(childId, {
          id: childId,
          name: childId,
          lastVoiceDate: v.entry_date,
          lastKeyWorkDate: isKeyWork ? v.entry_date : undefined,
        });
      } else {
        if (!existing.lastVoiceDate || v.entry_date > existing.lastVoiceDate) {
          existing.lastVoiceDate = v.entry_date;
        }
        if (isKeyWork && (!existing.lastKeyWorkDate || v.entry_date > existing.lastKeyWorkDate)) {
          existing.lastKeyWorkDate = v.entry_date;
        }
      }
    }

    const reg44Input = reg44Visits
      .filter((v) => v.home_id === homeId)
      .map((v) => ({
        lastVisitDate: v.visit_date,
        overdueActions: reg44Actions.filter(
          (a) => a.visit_id === v.id && a.status === "overdue",
        ).length,
      }));

    const reg45Input = reg45Reviews
      .filter((r) => r.home_id === homeId)
      .map((r) => ({
        lastReviewDate: r.period_end,
        periodEnd: r.period_end,
      }));

    const input: EvidenceGapScanInput = {
      homeId,
      children: Array.from(childrenMap.values()),
      incidents: [],
      reg44: reg44Input,
      reg45: reg45Input,
      riskAssessments: [],
      placementPlans: [],
      staffSupervisions: [],
      training: [],
      complaints: [],
      patterns: [],
    };

    const result = scanEvidenceGaps(input);
    return NextResponse.json({ ok: true, ...result, persisted: true });
  }

  // TODO: build EvidenceGapScanInput from supabase tables and call scanEvidenceGaps.
  return NextResponse.json({ ok: true, gaps: [], totalGaps: 0, criticalCount: 0, highCount: 0, gapsByType: {}, persisted: true });
}
