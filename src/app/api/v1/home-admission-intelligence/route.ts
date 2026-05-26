// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ADMISSION & PLACEMENT INTELLIGENCE API ROUTE
// GET /api/v1/home-admission-intelligence
// Synthesises admission referral data to assess impact assessment compliance,
// matching consideration quality, decision timeliness, and alignment with the
// Statement of Purpose.
// CHR 2015 Reg 14. SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeAdmission,
  type AdmissionReferralInput,
} from "@/lib/engines/home-admission-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Home context ─────────────────────────────────────────────────────
  const youngPeople = (store.youngPeople ?? []) as any[];
  const totalChildren = youngPeople.length;
  const home = (store.home ?? {}) as any;
  const registeredBeds = typeof home.max_beds === "number" ? home.max_beds : 0;

  // ── Admission Referrals ──────────────────────────────────────────────
  const referrals: AdmissionReferralInput[] = ((store.admissionReferrals ?? []) as any[])
    .map((r: any) => {
      const referralDate = (r.referral_date ?? today).toString().slice(0, 10);
      const decisionDate = r.decision_date ? r.decision_date.toString().slice(0, 10) : "";

      // Compute days_to_decision from referral_date to decision_date
      let daysToDecision = -1;
      if (decisionDate) {
        const refMs = new Date(referralDate).getTime();
        const decMs = new Date(decisionDate).getTime();
        if (!isNaN(refMs) && !isNaN(decMs)) {
          daysToDecision = Math.round((decMs - refMs) / 86_400_000);
        }
      }

      return {
        id: r.id ?? "",
        referral_date: referralDate,
        referral_source: r.referral_source ?? "local_authority",
        status: r.status ?? "new",
        presenting_needs_count: Array.isArray(r.presenting_needs) ? r.presenting_needs.length : 0,
        risk_factors_count: Array.isArray(r.risk_factors) ? r.risk_factors.length : 0,
        impact_assessment_complete: !!(r.impact_assessment_complete),
        has_matching_considerations: !!(r.matching_considerations),
        has_decision_reason: !!(r.decision_reason),
        decision_date: decisionDate,
        days_to_decision: daysToDecision,
      };
    });

  // ── Compute ───────────────────────────────────────────────────────────
  const result = computeHomeAdmission({
    today,
    total_children: totalChildren,
    registered_beds: registeredBeds,
    referrals,
  });

  return NextResponse.json({ data: result });
}
