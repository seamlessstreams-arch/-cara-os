// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME LOCALITY SAFEGUARDING INTELLIGENCE API ROUTE
// GET /api/v1/home-locality-safeguarding-intelligence
// Synthesises locality risks, exploitation screenings, and missing episodes
// to assess the home's awareness and response to local community risks,
// exploitation concerns, and contextual safeguarding mapping.
// CHR 2015 Reg 12, Reg 34, Reg 35. SCCIF: "Safety and well-being."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeLocalitySafeguarding,
  type LocalityRiskInput,
  type ExploitationScreeningInput,
  type MissingEpisodeInput,
} from "@/lib/engines/home-locality-safeguarding-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const youngPeople = (store.youngPeople ?? []) as any[];
    const total_children = youngPeople.length;

    // Locality risks
    const rawRisks = (store.localityRisks ?? []) as any[];
    const risks: LocalityRiskInput[] = rawRisks.map((r: any) => ({
      id: r.id ?? "",
      category: r.category ?? "",
      risk_level: r.risk_level ?? "low",
      location: r.location ?? "",
      has_description: !!(r.description && r.description.trim().length > 0),
      has_intelligence: !!(r.intelligence && r.intelligence.trim().length > 0),
      mitigations_count: Array.isArray(r.mitigations) ? r.mitigations.length : 0,
      effective_mitigations: Array.isArray(r.mitigations) ? r.mitigations.filter((m: any) => m.effectiveness === "effective").length : 0,
      last_reviewed: r.last_reviewed ? r.last_reviewed.toString().slice(0, 10) : "",
      next_review: r.next_review ? r.next_review.toString().slice(0, 10) : "",
      has_impact_assessment: !!(r.impact_on_yp && r.impact_on_yp.trim().length > 0),
    }));

    // Exploitation screenings
    const rawScreenings = (store.exploitationScreenings ?? []) as any[];
    const screenings: ExploitationScreeningInput[] = rawScreenings.map((s: any) => ({
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      date: (s.date ?? today).toString().slice(0, 10),
      exploitation_type: s.exploitation_type ?? "",
      risk_level: s.risk_level ?? "low",
      previous_risk_level: s.previous_risk_level ?? "low",
      status: s.status ?? "open",
      risk_indicators_count: Array.isArray(s.risk_indicators) ? s.risk_indicators.length : 0,
      indicators_present: Array.isArray(s.risk_indicators) ? s.risk_indicators.filter((i: any) => i.present).length : 0,
      protective_factors_count: Array.isArray(s.protective_factors) ? s.protective_factors.length : 0,
      has_safety_plan: !!(s.safety_plan && s.safety_plan.trim().length > 0),
      has_direct_work: !!(s.direct_work && s.direct_work.trim().length > 0),
      has_management_oversight: !!(s.management_oversight && s.management_oversight.trim().length > 0),
      multi_agency_count: Array.isArray(s.multi_agency_involved) ? s.multi_agency_involved.length : 0,
      social_worker_notified: s.social_worker_notified ?? false,
      nrm_referral: s.nrm_referral ?? false,
    }));

    // Missing episodes
    const rawMissing = (store.missingEpisodes ?? []) as any[];
    const missing: MissingEpisodeInput[] = rawMissing.map((m: any) => ({
      id: m.id ?? "",
      child_id: m.child_id ?? "",
      date_missing: (m.date_missing ?? today).toString().slice(0, 10),
      date_returned: m.date_returned ? m.date_returned.toString().slice(0, 10) : "",
      return_interview_completed: m.return_interview_completed ?? false,
      police_notified: !!(m.police_notified || m.reported_to_police),
      social_worker_notified: m.social_worker_notified ?? false,
    }));

    const result = computeLocalitySafeguarding({ today, total_children, risks, screenings, missing });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
