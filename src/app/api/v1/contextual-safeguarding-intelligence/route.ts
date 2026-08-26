// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTEXTUAL SAFEGUARDING INTELLIGENCE API ROUTE
// GET /api/v1/contextual-safeguarding-intelligence
// Returns exploitation screening coverage, child risk profiles, locality risk
// mapping, safety plan status, referral tracking, and Cara intelligence.
// Reg 12 — protection from harm, extra-familial risks
// Reg 13 — leadership and management
// Reg 34 — fitness of workers to safeguard
// SCCIF: "Helped & Protected" — contextual safeguarding evidence
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import {
  computeContextualSafeguardingIntelligence,
  type ExploitationScreeningInput,
  type LocalityRiskInput,
  type ChildRef,
  type StaffRef,
} from "@/lib/engines/contextual-safeguarding-intelligence-engine";

export async function GET() {
  const [exploitationScreeningsList, localityRisksList, staffList, youngPeopleList] = await Promise.all([
      dal.exploitationScreenings.findAll(),
      dal.localityRisks.findAll(),
      dal.staff.findAll(),
      dal.youngPeople.findAll(),
    ]);

  const screenings: ExploitationScreeningInput[] = (exploitationScreeningsList ?? []).map((r: any) => ({
    id: r.id,
    child_id: r.child_id,
    screening_type: r.exploitation_type ?? "cse",
    date: typeof r.date === "string" ? r.date.slice(0, 10) : r.date,
    risk_level: mapRiskLevel(r.risk_level),
    screened_by: r.completed_by ?? "",
    referral_made: !!(r.nrm_referral || r.social_worker_notified || r.police_ref),
    referral_to: getReferralTo(r),
    safety_plan_in_place: !!(r.safety_plan && r.safety_plan.trim().length > 0),
    next_screening_due: typeof r.next_review_date === "string" ? r.next_review_date.slice(0, 10) : (r.next_review_date ?? ""),
  }));

  const localityRisks: LocalityRiskInput[] = (localityRisksList ?? []).map((r: any) => ({
    id: r.id,
    location_name: r.location ?? "",
    location_type: mapLocationType(r.category),
    risk_type: mapRiskType(r.category),
    risk_level: r.risk_level ?? "medium",
    last_reviewed: typeof r.last_reviewed === "string" ? r.last_reviewed.slice(0, 10) : (r.last_reviewed ?? ""),
    mitigations: (r.mitigations ?? []).map((m: any) => typeof m === "string" ? m : m.measure ?? ""),
  }));

  const children: ChildRef[] = (youngPeopleList ?? []).map((yp: any) => ({
    id: yp.id,
    name: yp.preferred_name ?? `${yp.first_name} ${yp.last_name}`,
  }));

  const staff: StaffRef[] = (staffList ?? [])
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  const result = computeContextualSafeguardingIntelligence({ screenings, localityRisks, children, staff });
  return NextResponse.json({ data: result });
}

// ── Mapping Helpers ─────────────────────────────────────────────────────────

function mapRiskLevel(level: string): string {
  const map: Record<string, string> = {
    low: "no_concern",
    medium: "emerging",
    high: "moderate",
    very_high: "high",
  };
  return map[level] ?? level ?? "no_concern";
}

function getReferralTo(r: any): string {
  const parts: string[] = [];
  if (r.nrm_referral) parts.push("NRM");
  if (r.police_ref) parts.push("Police");
  if (r.social_worker_notified) parts.push("Social Worker");
  if (r.multi_agency_involved?.length > 0) parts.push(...r.multi_agency_involved);
  return parts.join(", ");
}

function mapLocationType(category: string): string {
  const map: Record<string, string> = {
    county_lines: "residential",
    cse: "residential",
    trafficking: "residential",
    anti_social_behaviour: "venue",
    drug_activity: "park",
    gang_activity: "venue",
    road_safety: "transport_hub",
    environmental: "park",
    community_tensions: "venue",
    online_risks: "online",
    other: "venue",
  };
  return map[category] ?? "venue";
}

function mapRiskType(category: string): string {
  const map: Record<string, string> = {
    county_lines: "exploitation",
    cse: "grooming",
    trafficking: "exploitation",
    anti_social_behaviour: "gang_activity",
    drug_activity: "drug_dealing",
    gang_activity: "gang_activity",
    road_safety: "drug_dealing",
    environmental: "drug_dealing",
    community_tensions: "gang_activity",
    online_risks: "online_harm",
    other: "exploitation",
  };
  return map[category] ?? "exploitation";
}
