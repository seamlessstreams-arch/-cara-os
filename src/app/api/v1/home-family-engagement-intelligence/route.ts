// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FAMILY ENGAGEMENT INTELLIGENCE API ROUTE
// GET /api/v1/home-family-engagement-intelligence
// Synthesises family time sessions and family relationship records to assess
// contact quality, child voice capture, social worker notification,
// relationship trajectories, and family engagement across the home.
// CHR 2015 Reg 7, 8, 9. SCCIF: "Effective."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeFamilyEngagement,
  type FamilyTimeInput,
  type FamilyRelationshipInput,
} from "@/lib/engines/home-family-engagement-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Children ──────────────────────────────────────────────────────────
  const youngPeople = (store.youngPeople ?? []) as any[];
  const totalChildren = youngPeople.length;
  const childIds = youngPeople.map((yp: any) => yp.id as string);

  // ── Family Time Sessions ──────────────────────────────────────────────
  const familyTimeSessions: FamilyTimeInput[] = ((store.familyTimeSessions ?? []) as any[])
    .map((s: any) => ({
      id: s.id,
      date: (s.date ?? today).toString().slice(0, 10),
      child_id: s.child_id ?? "",
      duration_minutes: typeof s.duration_minutes === "number" ? s.duration_minutes : 0,
      supervision_level: s.supervision_level ?? "supervised",
      was_safe: !!(s.was_it_safe),
      has_concerns: Array.isArray(s.concerns_raised) ? s.concerns_raised.length > 0 : false,
      has_positive_observations: Array.isArray(s.positive_observations) ? s.positive_observations.length > 0 : false,
      has_child_voice: !!(s.child_voice_after),
      report_sent_to_sw: !!(s.report_sent_to_sw),
      has_recommendations: Array.isArray(s.recommendations_for_next) ? s.recommendations_for_next.length > 0 : false,
    }));

  // ── Family Relationship Records ───────────────────────────────────────
  const familyRelationships: FamilyRelationshipInput[] = ((store.familyRelationshipRecords ?? []) as any[])
    .map((r: any) => ({
      id: r.id,
      assessment_date: (r.assessment_date ?? today).toString().slice(0, 10),
      child_id: r.child_id ?? "",
      relationship_type: r.relationship_type ?? "parent",
      quality_1_to_10: typeof r.quality_1_to_10 === "number" ? r.quality_1_to_10 : 0,
      trajectory: r.trajectory ?? "stable",
      has_child_wishes: !!(r.child_wishes_and_feelings),
      has_interventions: Array.isArray(r.interventions_active) ? r.interventions_active.length > 0 : false,
      has_risk_factors: Array.isArray(r.risk_factors) ? r.risk_factors.length > 0 : false,
      has_protective_factors: Array.isArray(r.protective_factors) ? r.protective_factors.length > 0 : false,
      next_review: (r.next_review ?? "").toString().slice(0, 10),
    }));

  // ── Compute ───────────────────────────────────────────────────────────
  const result = computeHomeFamilyEngagement({
    today,
    total_children: totalChildren,
    child_ids: childIds,
    family_time_sessions: familyTimeSessions,
    family_relationships: familyRelationships,
  });

  return NextResponse.json({ data: result });
}
