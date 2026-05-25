// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ADMISSION & REFERRAL INTELLIGENCE API ROUTE
// GET /api/v1/admission-referral-intelligence
// Returns referral pipeline, impact assessment compliance, decision analytics,
// occupancy management, and ARIA admission intelligence.
// Reg 11 — matching; Reg 12 — impact assessments.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeAdmissionReferralIntelligence,
  type ReferralInput,
  type ReferralSource,
  type ReferralStatus,
} from "@/lib/engines/admission-referral-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map referrals ───────────────────────────────────────────────────────────
  const referrals: ReferralInput[] = store.admissionReferrals.map((r) => ({
    id: r.id,
    child_name: r.child_name,
    age: r.age,
    gender: r.gender,
    referral_date: r.referral_date,
    referral_source: r.referral_source as ReferralSource,
    local_authority: r.local_authority,
    status: r.status as ReferralStatus,
    presenting_needs: r.presenting_needs ?? [],
    risk_factors: r.risk_factors ?? [],
    impact_assessment_complete: r.impact_assessment_complete ?? false,
    decision_date: r.decision_date || null,
    decision_reason: r.decision_reason || null,
    estimated_placement_date: r.estimated_placement_date || null,
  }));

  // ── Occupancy ───────────────────────────────────────────────────────────────
  const currentOccupancy = store.youngPeople.length;
  const maxOccupancy = 5; // Oak House registered for 5

  // ── Run engine ──────────────────────────────────────────────────────────────
  const result = computeAdmissionReferralIntelligence({
    referrals,
    current_occupancy: currentOccupancy,
    max_occupancy: maxOccupancy,
  });

  return NextResponse.json({ data: result });
}
