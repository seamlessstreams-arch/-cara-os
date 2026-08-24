// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME BUILDING & OPS SAFETY INTELLIGENCE ENGINE
// Evacuation plans, grab bags, asbestos, secure storage, room searches, fire risk.
// Pure deterministic engine. CHR 2015 Reg 25/12.
// ══════════════════════════════════════════════════════════════════════════════

import { below, meets, rate } from "@/lib/metrics/rate";

export interface EvacuationPlanInput {
  id: string; scenario_type: string;
  last_drill_date: string; next_drill_due: string;
  reviewed_date: string; approved_by_fire_officer: boolean;
  child_considerations_count: number;
}

export interface GrabBagInput {
  id: string; child_id: string;
  last_checked: string; next_check_due: string;
  items_count: number; items_present_count: number;
  overall_status: string; // "complete" | "partial" | "incomplete" | "overdue"
}

export interface AsbestosRecordInput {
  id: string; acm_identified: boolean;
  condition_rating: string; // "good" | "fair" | "poor" | "damaged"
  next_inspection_due: string;
  tradesperson_briefings_required: boolean;
  flags_count: number;
}

export interface SecureStorageInput {
  id: string; category: string;
  last_checked: string; next_check_due: string;
  status: string; // "verified" | "due_check" | "overdue" | "flagged"
  access_log_count: number;
}

export interface RoomSearchInput {
  id: string; child_id: string; date: string;
  child_informed: boolean; child_present: boolean;
  items_found: boolean; follow_up_required: boolean;
  follow_up_completed: boolean;
  child_distress_level: string; // "none" | "mild" | "moderate" | "severe"
}

export interface FireRiskInput {
  id: string; risk_category: string;
  residual_risk_level: string; // "high" | "medium" | "low"
  status: string; // "open" | "in_progress" | "completed" | "overdue"
  target_completion_date: string;
  next_review_date: string;
}

export interface HomeBuildingOpsSafetyInput {
  today: string;
  evacuation_plans: EvacuationPlanInput[];
  grab_bags: GrabBagInput[];
  asbestos_records: AsbestosRecordInput[];
  secure_storage: SecureStorageInput[];
  room_searches: RoomSearchInput[];
  fire_risk_items: FireRiskInput[];
  total_children: number;
}

export type BuildingOpsSafetyRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface EvacuationSummary { total: number; drills_current: number; /** null when the population is empty — nothing measured, not 0%. */ fire_officer_approved_rate: number | null; overdue_drills: number; }
export interface GrabBagSummary { total: number; /** null when the population is empty — nothing measured, not 0%. */ complete_rate: number | null; overdue_checks: number; }
export interface AsbestosSummary { total: number; acm_present: number; poor_condition_count: number; overdue_inspections: number; }
export interface SecureStorageSummary { total: number; /** null when the population is empty — nothing measured, not 0%. */ verified_rate: number | null; overdue_checks: number; flagged_count: number; }
export interface RoomSearchSummary { total: number; /** null when the population is empty — nothing measured, not 0%. */ child_informed_rate: number | null; /** null when the population is empty — nothing measured, not 0%. */ follow_up_completion_rate: number | null; high_distress_count: number; }
export interface FireRiskSummary { total: number; high_risk_count: number; overdue_actions: number; completed_rate: number | null; }

export interface HomeBuildingOpsSafetyResult {
  building_ops_rating: BuildingOpsSafetyRating; building_ops_score: number; headline: string;
  evacuation: EvacuationSummary; grab_bags: GrabBagSummary; asbestos: AsbestosSummary;
  secure_storage: SecureStorageSummary; room_searches: RoomSearchSummary; fire_risk: FireRiskSummary;
  strengths: string[]; concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// Was `d === 0 ? 0 : …`: nothing recorded read as 0%, not as unmeasured.
function pct(n: number, d: number): number | null { return rate(n, d); }
function daysBetween(a: string, b: string): number { return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000); }

export function computeHomeBuildingOpsSafety(input: HomeBuildingOpsSafetyInput): HomeBuildingOpsSafetyResult {
  const { today, evacuation_plans, grab_bags, asbestos_records, secure_storage, room_searches, fire_risk_items, total_children } = input;

  if (total_children === 0 && evacuation_plans.length === 0 && grab_bags.length === 0 && asbestos_records.length === 0 && secure_storage.length === 0 && room_searches.length === 0 && fire_risk_items.length === 0) {
    return {
      building_ops_rating: "insufficient_data", building_ops_score: 0,
      headline: "No building and operations safety data available for analysis.",
      evacuation: { total: 0, drills_current: 0, fire_officer_approved_rate: null, overdue_drills: 0 },
      grab_bags: { total: 0, complete_rate: null, overdue_checks: 0 },
      asbestos: { total: 0, acm_present: 0, poor_condition_count: 0, overdue_inspections: 0 },
      secure_storage: { total: 0, verified_rate: null, overdue_checks: 0, flagged_count: 0 },
      room_searches: { total: 0, child_informed_rate: null, follow_up_completion_rate: null, high_distress_count: 0 },
      fire_risk: { total: 0, high_risk_count: 0, overdue_actions: 0, completed_rate: null },
      strengths: [], concerns: [], recommendations: [], insights: [],
    };
  }

  // ── Summaries ────────────────────────────────────────────────────────────
  const drillsCurrent = evacuation_plans.filter(e => e.next_drill_due && daysBetween(today, e.next_drill_due) >= 0).length;
  const overdueDrills = evacuation_plans.filter(e => e.next_drill_due && daysBetween(today, e.next_drill_due) < 0).length;
  const foApproved = evacuation_plans.filter(e => e.approved_by_fire_officer).length;
  const evacuation: EvacuationSummary = {
    total: evacuation_plans.length, drills_current: drillsCurrent,
    fire_officer_approved_rate: pct(foApproved, evacuation_plans.length),
    overdue_drills: overdueDrills,
  };

  const gbComplete = grab_bags.filter(g => g.overall_status === "complete").length;
  const gbOverdue = grab_bags.filter(g => g.next_check_due && daysBetween(today, g.next_check_due) < 0).length;
  const grabBagSummary: GrabBagSummary = {
    total: grab_bags.length, complete_rate: pct(gbComplete, grab_bags.length), overdue_checks: gbOverdue,
  };

  const acmPresent = asbestos_records.filter(a => a.acm_identified).length;
  const poorCondition = asbestos_records.filter(a => a.condition_rating === "poor" || a.condition_rating === "damaged").length;
  const asbestosOverdue = asbestos_records.filter(a => a.next_inspection_due && daysBetween(today, a.next_inspection_due) < 0).length;
  const asbestos: AsbestosSummary = {
    total: asbestos_records.length, acm_present: acmPresent,
    poor_condition_count: poorCondition, overdue_inspections: asbestosOverdue,
  };

  const ssVerified = secure_storage.filter(s => s.status === "verified").length;
  const ssOverdue = secure_storage.filter(s => s.next_check_due && daysBetween(today, s.next_check_due) < 0).length;
  const ssFlagged = secure_storage.filter(s => s.status === "flagged").length;
  const secureStorageSummary: SecureStorageSummary = {
    total: secure_storage.length, verified_rate: pct(ssVerified, secure_storage.length),
    overdue_checks: ssOverdue, flagged_count: ssFlagged,
  };

  const rsInformed = room_searches.filter(r => r.child_informed).length;
  const rsNeedFollow = room_searches.filter(r => r.follow_up_required);
  const rsFollowDone = rsNeedFollow.filter(r => r.follow_up_completed).length;
  const rsHighDistress = room_searches.filter(r => r.child_distress_level === "severe" || r.child_distress_level === "moderate").length;
  const roomSearchSummary: RoomSearchSummary = {
    total: room_searches.length,
    child_informed_rate: pct(rsInformed, room_searches.length),
    follow_up_completion_rate: pct(rsFollowDone, rsNeedFollow.length),
    high_distress_count: rsHighDistress,
  };

  const frHigh = fire_risk_items.filter(f => f.residual_risk_level === "high").length;
  const frOverdue = fire_risk_items.filter(f => f.status === "overdue" || (f.target_completion_date && f.status !== "completed" && daysBetween(today, f.target_completion_date) < 0)).length;
  const frCompleted = fire_risk_items.filter(f => f.status === "completed").length;
  const fireRiskSummary: FireRiskSummary = {
    total: fire_risk_items.length, high_risk_count: frHigh,
    overdue_actions: frOverdue, completed_rate: pct(frCompleted, fire_risk_items.length),
  };

  // ── Score: base 52 + 8 modifiers (max ±28) ──────────────────────────────
  let score = 52;

  // Mod 1: Evacuation preparedness (±5)
  let mod1 = 0;
  if (evacuation_plans.length > 0) {
    if (overdueDrills === 0 && meets(evacuation.fire_officer_approved_rate, 80)) mod1 = 5;
    else if (overdueDrills <= 1 && meets(evacuation.fire_officer_approved_rate, 50)) mod1 = 3;
    else if (overdueDrills <= 2) mod1 = 1;
    else if (overdueDrills >= 4) mod1 = -5;
    else mod1 = -2;
  } else if (total_children >= 1) {
    mod1 = -3;
  }
  score += mod1;

  // Mod 2: Grab bag readiness (±4)
  let mod2 = 0;
  if (grab_bags.length > 0) {
    if (meets(grabBagSummary.complete_rate, 90) && gbOverdue === 0) mod2 = 4;
    else if (meets(grabBagSummary.complete_rate, 70)) mod2 = 2;
    else if (meets(grabBagSummary.complete_rate, 50)) mod2 = 0;
    else if (below(grabBagSummary.complete_rate, 30)) mod2 = -4;
    else mod2 = -2;
  } else if (total_children >= 2) {
    mod2 = -2;
  }
  score += mod2;

  // Mod 3: Asbestos management (±3) — safety-critical
  let mod3 = 0;
  if (asbestos_records.length > 0) {
    if (poorCondition === 0 && asbestosOverdue === 0) mod3 = 3;
    else if (poorCondition <= 1 && asbestosOverdue <= 1) mod3 = 1;
    else if (poorCondition >= 2 || asbestosOverdue >= 3) mod3 = -3;
    else mod3 = -1;
  }
  // No asbestos records = neutral (may not be applicable)
  score += mod3;

  // Mod 4: Fire risk management (±4)
  let mod4 = 0;
  if (fire_risk_items.length > 0) {
    if (frHigh === 0 && frOverdue === 0 && meets(fireRiskSummary.completed_rate, 70)) mod4 = 4;
    else if (frHigh <= 1 && frOverdue <= 1) mod4 = 2;
    else if (frHigh <= 2) mod4 = 0;
    else if (frHigh >= 4 || frOverdue >= 4) mod4 = -4;
    else mod4 = -2;
  } else if (total_children >= 1) {
    mod4 = -2;
  }
  score += mod4;

  // Mod 5: Secure storage compliance (±3)
  let mod5 = 0;
  if (secure_storage.length > 0) {
    if (meets(secureStorageSummary.verified_rate, 90) && ssFlagged === 0) mod5 = 3;
    else if (meets(secureStorageSummary.verified_rate, 70)) mod5 = 1;
    else if (below(secureStorageSummary.verified_rate, 40) || ssFlagged >= 3) mod5 = -3;
    else mod5 = 0;
  }
  // No secure storage = neutral
  score += mod5;

  // Mod 6: Room search practice (±3) — neutral if no searches needed
  let mod6 = 0;
  if (room_searches.length > 0) {
    if (meets(roomSearchSummary.child_informed_rate, 90) && meets(roomSearchSummary.follow_up_completion_rate, 80)) mod6 = 3;
    else if (meets(roomSearchSummary.child_informed_rate, 70)) mod6 = 1;
    else if (below(roomSearchSummary.child_informed_rate, 50)) mod6 = -3;
    else mod6 = 0;
  }
  // No room searches = neutral
  score += mod6;

  // Mod 7: Child welfare in building ops (±3)
  let mod7 = 0;
  const childConsiderations = evacuation_plans.filter(e => e.child_considerations_count > 0).length;
  const childConsidRate = pct(childConsiderations, evacuation_plans.length);
  if (evacuation_plans.length > 0 && room_searches.length > 0) {
    if (meets(childConsidRate, 80) && rsHighDistress === 0) mod7 = 3;
    else if (meets(childConsidRate, 60)) mod7 = 1;
    else if (below(childConsidRate, 30) || rsHighDistress >= 3) mod7 = -3;
    else mod7 = 0;
  } else if (evacuation_plans.length > 0) {
    if (meets(childConsidRate, 80)) mod7 = 3;
    else if (meets(childConsidRate, 60)) mod7 = 1;
    else if (below(childConsidRate, 30)) mod7 = -2;
    else mod7 = 0;
  }
  score += mod7;

  // Mod 8: Review currency & compliance (±3)
  let mod8 = 0;
  const totalOverdue = overdueDrills + gbOverdue + asbestosOverdue + ssOverdue + frOverdue;
  const totalCheckable = evacuation_plans.length + grab_bags.length + asbestos_records.length + secure_storage.length + fire_risk_items.length;
  if (totalCheckable > 0) {
    const overdueRate = pct(totalOverdue, totalCheckable);
    if (overdueRate === 0) mod8 = 3;
    else if ((overdueRate !== null && overdueRate <= 15)) mod8 = 1;
    else if (meets(overdueRate, 50)) mod8 = -3;
    else mod8 = -1;
  }
  score += mod8;

  score = Math.max(0, Math.min(100, score));

  // ── Rating ───────────────────────────────────────────────────────────────
  const building_ops_rating: BuildingOpsSafetyRating = score >= 80 ? "outstanding" : score >= 65 ? "good" : score >= 45 ? "adequate" : "inadequate";

  // ── Strengths ────────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (overdueDrills === 0 && evacuation_plans.length > 0) strengths.push("All evacuation drills are current — the home is prepared for emergency situations.");
  if (meets(evacuation.fire_officer_approved_rate, 80) && evacuation_plans.length > 0) strengths.push("Evacuation plans approved by fire officer — external validation of fire safety arrangements.");
  if (meets(grabBagSummary.complete_rate, 90) && grab_bags.length > 0) strengths.push("Grab bags are fully stocked and current — children's essential items are ready for emergencies.");
  if (poorCondition === 0 && asbestos_records.length > 0) strengths.push("All asbestos-containing materials in good or fair condition — no immediate health risks.");
  if (frHigh === 0 && fire_risk_items.length > 0) strengths.push("No high-level fire risks identified — effective fire risk management.");
  if (meets(secureStorageSummary.verified_rate, 90) && secure_storage.length > 0) strengths.push("All secure storage verified — hazardous materials and medications properly secured.");
  if (meets(roomSearchSummary.child_informed_rate, 90) && room_searches.length > 0) strengths.push("Room searches conducted with excellent child communication — rights-respecting practice.");
  if (mod8 >= 3) strengths.push("All safety checks and reviews are current — no overdue inspections or assessments.");

  // ── Concerns ─────────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (evacuation_plans.length === 0 && total_children >= 1) concerns.push("No evacuation plans in place — the home lacks documented emergency procedures.");
  if (overdueDrills >= 3) concerns.push(`${overdueDrills} evacuation drills are overdue — children and staff may not know emergency procedures.`);
  if (poorCondition >= 2) concerns.push(`${poorCondition} asbestos records show poor/damaged condition — immediate specialist assessment required.`);
  if (frHigh >= 3) concerns.push(`${frHigh} high-level fire risks identified — urgent remediation needed.`);
  if (ssFlagged >= 2) concerns.push(`${ssFlagged} secure storage items flagged — potential access to hazardous materials.`);
  if (below(grabBagSummary.complete_rate, 50) && grab_bags.length > 0) concerns.push("Less than half of grab bags are complete — children's emergency essentials may be missing.");
  if (below(roomSearchSummary.child_informed_rate, 50) && room_searches.length > 0) concerns.push("Children are not consistently informed before room searches — this undermines trust and dignity.");
  if (fire_risk_items.length === 0 && total_children >= 1) concerns.push("No fire risk assessment recorded — fire safety compliance cannot be evidenced.");
  if (totalOverdue >= 5) concerns.push(`${totalOverdue} safety checks are overdue across building operations — compliance is lapsing.`);

  // ── Recommendations ──────────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 0;
  if (poorCondition >= 1) recommendations.push({ rank: ++rank, recommendation: "Commission specialist asbestos assessment for areas with poor/damaged ACM.", urgency: "immediate", regulatory_ref: "Reg 25" });
  if (frHigh >= 3) recommendations.push({ rank: ++rank, recommendation: "Implement fire risk remediation plan for all high-risk items.", urgency: "immediate", regulatory_ref: "Reg 25" });
  if (evacuation_plans.length === 0 && total_children >= 1) recommendations.push({ rank: ++rank, recommendation: "Create documented evacuation plans for all emergency scenarios.", urgency: "immediate", regulatory_ref: "Reg 25" });
  if (overdueDrills >= 2) recommendations.push({ rank: ++rank, recommendation: `Schedule ${overdueDrills} overdue evacuation drills as a matter of urgency.`, urgency: "soon", regulatory_ref: "Reg 25" });
  if (below(grabBagSummary.complete_rate, 70) && grab_bags.length > 0) recommendations.push({ rank: ++rank, recommendation: "Restock and verify all grab bags to ensure emergency readiness.", urgency: "soon", regulatory_ref: "Reg 25" });
  if (ssFlagged >= 1) recommendations.push({ rank: ++rank, recommendation: `Investigate and resolve ${ssFlagged} flagged secure storage items.`, urgency: "soon", regulatory_ref: "Reg 12" });
  if (fire_risk_items.length === 0 && total_children >= 1) recommendations.push({ rank: ++rank, recommendation: "Conduct and record a comprehensive fire risk assessment.", urgency: "soon", regulatory_ref: "Reg 25" });
  if (totalOverdue >= 3) recommendations.push({ rank: ++rank, recommendation: `Complete ${totalOverdue} overdue safety reviews to restore compliance.`, urgency: "planned", regulatory_ref: "Reg 25" });

  // ── Insights ─────────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];
  if (building_ops_rating === "outstanding") insights.push({ text: "Building and operations safety is outstanding — comprehensive preparedness with current checks and child-centred practice.", severity: "positive" });
  if (building_ops_rating === "inadequate") insights.push({ text: "Building safety falls below acceptable standards — children may be at risk from fire, structural, or environmental hazards.", severity: "critical" });
  if (poorCondition >= 1 && frHigh >= 2) insights.push({ text: "Combined asbestos and fire risk concerns suggest the building environment needs urgent multi-disciplinary safety review.", severity: "critical" });
  if (meets(evacuation.fire_officer_approved_rate, 80) && meets(grabBagSummary.complete_rate, 90) && overdueDrills === 0) insights.push({ text: "Emergency preparedness is exemplary — fire officer approval, current drills, and fully stocked grab bags demonstrate proactive safety culture.", severity: "positive" });
  if (meets(roomSearchSummary.child_informed_rate, 90) && rsHighDistress === 0 && room_searches.length > 0) insights.push({ text: "Room search practice is rights-respecting with no high distress — searches conducted with dignity and transparency.", severity: "positive" });

  // ── Headline ─────────────────────────────────────────────────────────────
  let headline = "";
  if (building_ops_rating === "outstanding") headline = "Outstanding building safety — current drills, compliant storage, and proactive risk management.";
  else if (building_ops_rating === "good") headline = "Good building safety with effective fire and emergency preparedness.";
  else if (building_ops_rating === "adequate") headline = "Adequate building safety — some overdue checks or gaps in emergency preparedness need attention.";
  else headline = "Building safety needs urgent improvement — significant hazards or compliance gaps identified.";

  return {
    building_ops_rating, building_ops_score: score, headline,
    evacuation, grab_bags: grabBagSummary, asbestos, secure_storage: secureStorageSummary,
    room_searches: roomSearchSummary, fire_risk: fireRiskSummary,
    strengths, concerns, recommendations, insights,
  };
}
