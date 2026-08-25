import { above, below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME COMMUNITY ACCESS INTELLIGENCE ENGINE
// Home-level engine aggregating transport safety, transport risk assessments,
// independent travel development, trip planning quality, and community
// engagement across all children. Surfaces whether the home is providing safe,
// well-planned community access that promotes independence and engagement.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 9 (enjoyment & achievement), Reg 12 (independence).
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface TransportLogInput {
  id: string;
  date: string;
  driver_licence_checked: boolean;
  vehicle_checked: boolean;
  incident_during_journey: boolean;
  behaviour_during_journey: string; // "excellent" | "good" | "challenging" | "incident_logged"
  passengers: { child_id: string }[];
}

export interface TransportRAInput {
  id: string;
  signedOffByRM: boolean;
  hazards: { description: string }[];
  emergencyProcedure: string;
  breakdownProcedure: string;
  nextReviewDate: string;
  inUseStatus: boolean;
}

export interface IndependentTravelInput {
  id: string;
  child_id: string;
  current_stage: string; // "stage_1_accompanied" | "stage_2_staff_shadowing" | "stage_3_solo_familiar" | "stage_4_solo_new" | "independent_traveller"
  routes_mastered: { route: string }[];
  child_confidence: string; // "anxious" | "cautious" | "building" | "confident" | "highly_confident"
  child_voice: string;
  review_date: string;
}

export interface TripPlanInput {
  id: string;
  start_date: string;
  manager_approval: boolean;
  social_worker_approval: { approved: boolean }[];
  risk_assessment: { completed: boolean } | null;
  children_views: string;
  post_trip_evaluation: { completed: boolean } | null;
  young_people: { child_id: string }[];
  status: string; // "planning" | "approved" | "completed" | "cancelled"
}

export interface CommunityEngagementInput {
  id: string;
  date: string;
  young_people: string[];
  activity_type: string;
  outcomes: string[];
  child_feedback: string;
  builds_connections: boolean;
  ongoing_commitment: boolean;
}

export interface HomeCommunityAccessInput {
  today: string;
  transport_logs: TransportLogInput[];
  transport_ras: TransportRAInput[];
  independent_travel_records: IndependentTravelInput[];
  trip_plans: TripPlanInput[];
  community_engagements: CommunityEngagementInput[];
  total_children: number;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type CommunityAccessRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface TransportSafetySummary {
  total_logs: number;
  licence_checked_rate: number | null;
  vehicle_checked_rate: number | null;
  incident_rate: number | null;
  excellent_behaviour_rate: number | null;
}

export interface TransportRASummary {
  total_ras: number;
  active_ras: number;
  signed_off_rate: number | null;
  avg_hazards_documented: number | null;
  emergency_procedure_rate: number | null;
  breakdown_procedure_rate: number | null;
  overdue_reviews: number;
}

export interface IndependentTravelSummary {
  total_records: number;
  /** null when the population is empty — nothing measured, not 0%. */
  child_coverage: number | null;
  solo_or_independent_rate: number | null;
  avg_routes_mastered: number | null;
  confident_or_highly_rate: number | null;
  overdue_reviews: number;
}

export interface TripPlanningSummary {
  total_trips: number;
  completed_trips: number;
  manager_approval_rate: number | null;
  sw_approval_rate: number | null;
  risk_assessment_rate: number | null;
  children_views_rate: number | null;
  post_trip_evaluation_rate: number | null;
}

export interface CommunityEngagementSummary {
  total_engagements_90d: number;
  unique_children_90d: number;
  /** null when the population is empty — nothing measured, not 0%. */
  child_coverage_90d: number | null;
  builds_connections_rate: number | null;
  ongoing_commitment_rate: number | null;
  unique_activity_types: number;
}

export interface HomeCommunityAccessResult {
  community_access_rating: CommunityAccessRating;
  community_access_score: number | null;
  headline: string;
  transport_safety: TransportSafetySummary;
  transport_ra: TransportRASummary;
  independent_travel: IndependentTravelSummary;
  trip_planning: TripPlanningSummary;
  community_engagement: CommunityEngagementSummary;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeCommunityAccess(
  input: HomeCommunityAccessInput,
): HomeCommunityAccessResult {
  const {
    today, transport_logs, transport_ras, independent_travel_records,
    trip_plans, community_engagements, total_children,
  } = input;

  // ── Insufficient data guard ──────────────────────────────────────────
  if (
    total_children === 0 &&
    transport_logs.length === 0 &&
    transport_ras.length === 0 &&
    independent_travel_records.length === 0 &&
    trip_plans.length === 0 &&
    community_engagements.length === 0
  ) {
    return {
      community_access_rating: "insufficient_data",
      community_access_score: 0,
      headline: "No community access data available for analysis.",
      transport_safety: { total_logs: 0, licence_checked_rate: null, vehicle_checked_rate: null, incident_rate: null, excellent_behaviour_rate: null },
      transport_ra: { total_ras: 0, active_ras: 0, signed_off_rate: null, avg_hazards_documented: 0, emergency_procedure_rate: null, breakdown_procedure_rate: null, overdue_reviews: 0 },
      independent_travel: { total_records: 0, child_coverage: null, solo_or_independent_rate: null, avg_routes_mastered: 0, confident_or_highly_rate: null, overdue_reviews: 0 },
      trip_planning: { total_trips: 0, completed_trips: 0, manager_approval_rate: null, sw_approval_rate: null, risk_assessment_rate: null, children_views_rate: null, post_trip_evaluation_rate: null },
      community_engagement: { total_engagements_90d: 0, unique_children_90d: 0, child_coverage_90d: 0, builds_connections_rate: null, ongoing_commitment_rate: null, unique_activity_types: 0 },
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  // ── Transport Safety ─────────────────────────────────────────────────
  const tlLicenceChecked = transport_logs.filter(l => l.driver_licence_checked).length;
  const tlLicenceRate = rate(tlLicenceChecked, transport_logs.length);
  const tlVehicleChecked = transport_logs.filter(l => l.vehicle_checked).length;
  const tlVehicleRate = rate(tlVehicleChecked, transport_logs.length);
  const tlIncidents = transport_logs.filter(l => l.incident_during_journey).length;
  const tlIncidentRate = rate(tlIncidents, transport_logs.length);
  const tlExcellent = transport_logs.filter(l => l.behaviour_during_journey === "excellent").length;
  const tlGood = transport_logs.filter(l => l.behaviour_during_journey === "good").length;
  const tlExcellentRate = rate(tlExcellent + tlGood, transport_logs.length);

  const transport_safety: TransportSafetySummary = {
    total_logs: transport_logs.length,
    licence_checked_rate: tlLicenceRate,
    vehicle_checked_rate: tlVehicleRate,
    incident_rate: tlIncidentRate,
    excellent_behaviour_rate: tlExcellentRate,
  };

  // ── Transport Risk Assessments ───────────────────────────────────────
  const activeRAs = transport_ras.filter(ra => ra.inUseStatus);
  const raSignedOff = transport_ras.filter(ra => ra.signedOffByRM).length;
  const raSignedOffRate = rate(raSignedOff, transport_ras.length);
  const raAvgHazards = transport_ras.length > 0
    ? Math.round((transport_ras.reduce((s, ra) => s + ra.hazards.length, 0) / transport_ras.length) * 10) / 10
    : null;
  const raEmergency = transport_ras.filter(ra => ra.emergencyProcedure && ra.emergencyProcedure.trim().length > 0).length;
  const raEmergencyRate = rate(raEmergency, transport_ras.length);
  const raBreakdown = transport_ras.filter(ra => ra.breakdownProcedure && ra.breakdownProcedure.trim().length > 0).length;
  const raBreakdownRate = rate(raBreakdown, transport_ras.length);
  const raOverdue = transport_ras.filter(ra => daysBetween(ra.nextReviewDate, today) > 0).length;

  const transport_ra: TransportRASummary = {
    total_ras: transport_ras.length,
    active_ras: activeRAs.length,
    signed_off_rate: raSignedOffRate,
    avg_hazards_documented: raAvgHazards,
    emergency_procedure_rate: raEmergencyRate,
    breakdown_procedure_rate: raBreakdownRate,
    overdue_reviews: raOverdue,
  };

  // ── Independent Travel ───────────────────────────────────────────────
  const itChildIds = new Set(independent_travel_records.map(r => r.child_id));
  const itCoverage = rate(itChildIds.size, total_children);
  const soloStages = ["stage_3_solo_familiar", "stage_4_solo_new", "independent_traveller"];
  const itSoloIndep = independent_travel_records.filter(r => soloStages.includes(r.current_stage)).length;
  const itSoloIndepRate = rate(itSoloIndep, independent_travel_records.length);
  const itAvgRoutes = independent_travel_records.length > 0
    ? Math.round((independent_travel_records.reduce((s, r) => s + r.routes_mastered.length, 0) / independent_travel_records.length) * 10) / 10
    : null;
  const confidentStages = ["confident", "highly_confident"];
  const itConfident = independent_travel_records.filter(r => confidentStages.includes(r.child_confidence)).length;
  const itConfidentRate = rate(itConfident, independent_travel_records.length);
  const itOverdue = independent_travel_records.filter(r => daysBetween(r.review_date, today) > 0).length;

  const independent_travel: IndependentTravelSummary = {
    total_records: independent_travel_records.length,
    child_coverage: itCoverage,
    solo_or_independent_rate: itSoloIndepRate,
    avg_routes_mastered: itAvgRoutes,
    confident_or_highly_rate: itConfidentRate,
    overdue_reviews: itOverdue,
  };

  // ── Trip Planning ────────────────────────────────────────────────────
  const completedTrips = trip_plans.filter(t => t.status === "completed");
  const nonCancelledTrips = trip_plans.filter(t => t.status !== "cancelled");
  const tpManagerApproved = nonCancelledTrips.filter(t => t.manager_approval).length;
  const tpManagerRate = rate(tpManagerApproved, nonCancelledTrips.length);
  const tpSwApproved = nonCancelledTrips.filter(t =>
    t.social_worker_approval.length > 0 &&
    t.social_worker_approval.every(sw => sw.approved),
  ).length;
  const tpSwRate = rate(tpSwApproved, nonCancelledTrips.length);
  const tpRA = nonCancelledTrips.filter(t => t.risk_assessment && t.risk_assessment.completed).length;
  const tpRARate = rate(tpRA, nonCancelledTrips.length);
  const tpChildViews = nonCancelledTrips.filter(t => t.children_views && t.children_views.trim().length > 0).length;
  const tpChildViewsRate = rate(tpChildViews, nonCancelledTrips.length);
  const tpPostEval = completedTrips.filter(t => t.post_trip_evaluation && t.post_trip_evaluation.completed).length;
  const tpPostEvalRate = rate(tpPostEval, completedTrips.length);

  const trip_planning: TripPlanningSummary = {
    total_trips: trip_plans.length,
    completed_trips: completedTrips.length,
    manager_approval_rate: tpManagerRate,
    sw_approval_rate: tpSwRate,
    risk_assessment_rate: tpRARate,
    children_views_rate: tpChildViewsRate,
    post_trip_evaluation_rate: tpPostEvalRate,
  };

  // ── Community Engagement (90d window) ────────────────────────────────
  const ce90d = community_engagements.filter(e => {
    const d = daysBetween(e.date, today);
    return d >= 0 && d <= 90;
  });
  const ceAllChildren = new Set(ce90d.flatMap(e => e.young_people));
  const ceCoverage90d = rate(ceAllChildren.size, total_children);
  const ceBuildsConn = ce90d.filter(e => e.builds_connections).length;
  const ceBuildsConnRate = rate(ceBuildsConn, ce90d.length);
  const ceOngoing = ce90d.filter(e => e.ongoing_commitment).length;
  const ceOngoingRate = rate(ceOngoing, ce90d.length);
  const ceTypes = new Set(ce90d.map(e => e.activity_type));

  const community_engagement: CommunityEngagementSummary = {
    total_engagements_90d: ce90d.length,
    unique_children_90d: ceAllChildren.size,
    child_coverage_90d: ceCoverage90d,
    builds_connections_rate: ceBuildsConnRate,
    ongoing_commitment_rate: ceOngoingRate,
    unique_activity_types: ceTypes.size,
  };

  // ═══════════════════════════════════════════════════════════════════════
  // SCORING — base 52 + 8 modifiers (max +28) -> max 80
  // ═══════════════════════════════════════════════════════════════════════

  let score = 52;

  // ── Mod 1: Transport Safety & Compliance (+-5) ─────────────────────
  {
    let m = 0;
    if (transport_logs.length > 0) {
      // Licence check rate
      if (meets(tlLicenceRate, 90)) m += 1;
      else if (below(tlLicenceRate, 50)) m -= 1;

      // Vehicle check rate
      if (meets(tlVehicleRate, 90)) m += 1;
      else if (below(tlVehicleRate, 50)) m -= 1;

      // Incident rate (low = good)
      if (tlIncidentRate === 0) m += 1;
      else if (above(tlIncidentRate, 20)) m -= 2;
      else if (above(tlIncidentRate, 10)) m -= 1;

      // Behaviour quality
      if (meets(tlExcellentRate, 80)) m += 2;
      else if (meets(tlExcellentRate, 60)) m += 1;
      else if (below(tlExcellentRate, 30)) m -= 1;
    } else {
      if (total_children >= 2) m -= 2;
    }
    score += Math.max(-5, Math.min(5, m));
  }

  // ── Mod 2: Transport Risk Assessment Quality (+-4) ─────────────────
  {
    let m = 0;
    if (transport_ras.length > 0) {
      // Signed off by RM
      if (meets(raSignedOffRate, 80)) m += 1;
      else if (below(raSignedOffRate, 40)) m -= 1;

      // Hazard documentation
      if ((raAvgHazards ?? 0) >= 2) m += 1;
      else if ((raAvgHazards ?? 0) < 1 && transport_ras.length > 0) m -= 1;

      // Emergency + breakdown procedures
      if (meets(raEmergencyRate, 90) && meets(raBreakdownRate, 90)) m += 1;
      else if (below(raEmergencyRate, 50) || below(raBreakdownRate, 50)) m -= 1;

      // Review compliance
      if (raOverdue === 0) m += 1;
      else if (raOverdue >= 3) m -= 2;
      else m -= 1;
    } else {
      if (total_children >= 2) m -= 2;
    }
    score += Math.max(-4, Math.min(4, m));
  }

  // ── Mod 3: Independent Travel Development (+-3) ────────────────────
  {
    let m = 0;
    if (independent_travel_records.length > 0) {
      // Child coverage
      if (meets(itCoverage, 80)) m += 1;
      else if (below(itCoverage, 40)) m -= 1;

      // Solo/independent rate
      if (meets(itSoloIndepRate, 60)) m += 1;
      else if (below(itSoloIndepRate, 20)) m -= 1;

      // Confidence levels
      if (meets(itConfidentRate, 60)) m += 1;
      else if (below(itConfidentRate, 20)) m -= 1;
    } else {
      if (total_children >= 2) m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 4: Trip Planning & Quality (+-4) ────────────────────────────
  {
    let m = 0;
    if (nonCancelledTrips.length > 0) {
      // Manager approval
      if (meets(tpManagerRate, 80)) m += 1;
      else if (below(tpManagerRate, 40)) m -= 1;

      // Risk assessment presence
      if (meets(tpRARate, 80)) m += 1;
      else if (below(tpRARate, 40)) m -= 1;

      // Children's views
      if (meets(tpChildViewsRate, 80)) m += 1;
      else if (below(tpChildViewsRate, 40)) m -= 1;

      // Post-trip evaluation
      if (completedTrips.length > 0) {
        if (meets(tpPostEvalRate, 80)) m += 1;
        else if (below(tpPostEvalRate, 30)) m -= 1;
      }
    } else {
      if (total_children >= 2) m -= 2;
    }
    score += Math.max(-4, Math.min(4, m));
  }

  // ── Mod 5: Community Engagement Breadth (+-3) ──────────────────────
  {
    let m = 0;
    if (ce90d.length > 0) {
      // Engagement frequency
      if (ce90d.length >= 10) m += 1;
      else if (ce90d.length < 3) m -= 1;

      // Builds connections rate
      if (meets(ceBuildsConnRate, 70)) m += 1;
      else if (below(ceBuildsConnRate, 30)) m -= 1;

      // Ongoing commitment
      if (meets(ceOngoingRate, 50)) m += 1;
      else if (below(ceOngoingRate, 20)) m -= 1;
    } else {
      if (total_children >= 2) m -= 2;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 6: Child Voice Across Community Access (+-3) ───────────────
  {
    let m = 0;
    const voiceSources: number[] = [];

    // Child voice in travel records
    if (independent_travel_records.length > 0) {
      const itVoice = independent_travel_records.filter(r => r.child_voice && r.child_voice.trim().length > 0).length;
      voiceSources.push(rate(itVoice, independent_travel_records.length)!);
    }

    // Children's views in trips
    if (nonCancelledTrips.length > 0) {
      voiceSources.push(tpChildViewsRate!);
    }

    // Child feedback in community engagement
    if (ce90d.length > 0) {
      const ceFeedback = ce90d.filter(e => e.child_feedback && e.child_feedback.trim().length > 0).length;
      voiceSources.push(rate(ceFeedback, ce90d.length)!);
    }

    if (voiceSources.length > 0) {
      const avgVoice = Math.round(voiceSources.reduce((s, v) => s + v, 0) / voiceSources.length);
      if (avgVoice >= 90) m += 3;
      else if (avgVoice >= 70) m += 2;
      else if (avgVoice >= 50) m += 1;
      else if (avgVoice < 30) m -= 2;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 7: Review Compliance (+-3) ─────────────────────────────────
  {
    let m = 0;
    const totalOverdue = itOverdue + raOverdue;
    const totalReviewable = independent_travel_records.length + transport_ras.length;

    if (totalReviewable > 0) {
      if (totalOverdue === 0) m += 3;
      else if (totalOverdue <= 2) m += 1;
      else if (totalOverdue >= 5) m -= 3;
      else m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 8: Outcome Documentation (+-3) ─────────────────────────────
  {
    let m = 0;
    const docSources: number[] = [];

    // Outcomes in community engagements
    if (ce90d.length > 0) {
      const ceWithOutcomes = ce90d.filter(e => e.outcomes && e.outcomes.length > 0).length;
      docSources.push(rate(ceWithOutcomes, ce90d.length)!);
    }

    // Post-trip evaluation completion
    if (completedTrips.length > 0) {
      docSources.push(tpPostEvalRate!);
    }

    // Routes mastered documentation
    if (independent_travel_records.length > 0) {
      const withRoutes = independent_travel_records.filter(r => r.routes_mastered.length > 0).length;
      docSources.push(rate(withRoutes, independent_travel_records.length)!);
    }

    if (docSources.length > 0) {
      const avgDoc = Math.round(docSources.reduce((s, v) => s + v, 0) / docSources.length);
      if (avgDoc >= 90) m += 3;
      else if (avgDoc >= 70) m += 2;
      else if (avgDoc >= 50) m += 1;
      else if (avgDoc < 30) m -= 2;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Clamp ────────────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, score));

  // ── Rating ───────────────────────────────────────────────────────────
  let community_access_rating: CommunityAccessRating;
  if (score >= 80) community_access_rating = "outstanding";
  else if (score >= 65) community_access_rating = "good";
  else if (score >= 45) community_access_rating = "adequate";
  else community_access_rating = "inadequate";

  // ═══════════════════════════════════════════════════════════════════════
  // NARRATIVE
  // ═══════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: HomeCommunityAccessResult["recommendations"] = [];
  const insights: HomeCommunityAccessResult["insights"] = [];
  let rank = 0;

  // Transport safety strengths
  if (transport_logs.length > 0 && meets(tlLicenceRate, 90) && meets(tlVehicleRate, 90)) {
    strengths.push(`Excellent transport compliance — ${tlLicenceRate}% licence checks and ${tlVehicleRate}% vehicle checks completed.`);
  }
  if (transport_logs.length > 0 && tlIncidentRate === 0) {
    strengths.push("Zero incidents during journeys — strong evidence of safe transport practice.");
  }

  // Transport RA strengths
  if (transport_ras.length > 0 && meets(raSignedOffRate, 80) && raOverdue === 0) {
    strengths.push(`Transport risk assessments are well-maintained — ${raSignedOffRate}% signed off by RM with no overdue reviews.`);
  }

  // Independent travel strengths
  if (independent_travel_records.length > 0 && meets(itSoloIndepRate, 60) && meets(itConfidentRate, 60)) {
    strengths.push(`Strong independent travel development — ${itSoloIndepRate}% at solo or independent stage with ${itConfidentRate}% reporting confidence.`);
  }

  // Trip planning strengths
  if (nonCancelledTrips.length > 0 && meets(tpManagerRate, 80) && meets(tpRARate, 80)) {
    strengths.push(`Robust trip planning — ${tpManagerRate}% manager-approved with ${tpRARate}% risk assessments completed.`);
  }

  // Community engagement strengths
  if (ce90d.length >= 10 && meets(ceBuildsConnRate, 70)) {
    strengths.push(`Active community engagement programme — ${ce90d.length} engagements in 90 days with ${ceBuildsConnRate}% building lasting connections.`);
  }

  // Transport safety concerns
  if (transport_logs.length > 0 && below(tlLicenceRate, 50)) {
    concerns.push(`Low driver licence check rate — only ${tlLicenceRate}%. Every journey must have a verified licence check.`);
    recommendations.push({ rank: ++rank, recommendation: "Implement mandatory licence checks before every journey. Add this to pre-departure checklists.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  }
  if (transport_logs.length > 0 && above(tlIncidentRate, 20)) {
    concerns.push(`High incident rate during transport — ${tlIncidentRate}% of journeys involved incidents. Review transport safety practices urgently.`);
    recommendations.push({ rank: ++rank, recommendation: "Review all transport incidents and implement additional safeguards for journeys.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  }
  if (transport_logs.length === 0 && total_children >= 2) {
    concerns.push("No transport logs recorded — journey safety cannot be evidenced.");
  }

  // Transport RA concerns
  if (transport_ras.length > 0 && raOverdue >= 3) {
    concerns.push(`${raOverdue} transport risk assessments are overdue for review — children may be travelling on outdated risk assessments.`);
    recommendations.push({ rank: ++rank, recommendation: "Urgently review overdue transport risk assessments to ensure current hazard identification.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  }
  if (transport_ras.length === 0 && total_children >= 2) {
    concerns.push("No transport risk assessments in place — journey risks are not being formally assessed.");
    recommendations.push({ rank: ++rank, recommendation: "Create transport risk assessments for all regular journeys undertaken by children.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  }

  // Independent travel concerns
  if (independent_travel_records.length === 0 && total_children >= 2) {
    concerns.push("No independent travel records — children's travel development is not being tracked.");
    recommendations.push({ rank: ++rank, recommendation: "Implement independent travel assessments for all children to promote safe independence.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 12" });
  }

  // Trip planning concerns
  if (nonCancelledTrips.length > 0 && below(tpManagerRate, 40)) {
    concerns.push(`Low manager approval rate on trips — only ${tpManagerRate}%. Trips should be formally approved.`);
  }
  if (nonCancelledTrips.length === 0 && total_children >= 2) {
    concerns.push("No trip plans recorded — children may not be accessing community experiences.");
    recommendations.push({ rank: ++rank, recommendation: "Develop a programme of trips and outings to broaden children's community experiences.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 9" });
  }

  // Community engagement concerns
  if (ce90d.length === 0 && total_children >= 2) {
    concerns.push("No community engagements recorded in 90 days — children may be isolated from their communities.");
    recommendations.push({ rank: ++rank, recommendation: "Establish regular community engagement opportunities — clubs, volunteering, local groups.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 9" });
  }
  if (ce90d.length > 0 && below(ceBuildsConnRate, 30)) {
    concerns.push(`Low connection-building rate in community engagements — only ${ceBuildsConnRate}%. Activities should foster lasting community ties.`);
  }

  // ── Cara Insights ────────────────────────────────────────────────────
  if (community_access_rating === "outstanding") {
    insights.push({ text: `Community access is outstanding (${score}%). Children enjoy safe, well-planned transport, developing independence in travel, varied trips, and strong community engagement. This evidences excellent Reg 9 and Reg 12 compliance.`, severity: "positive" });
  }
  if (community_access_rating === "inadequate") {
    insights.push({ text: `Community access is inadequate (${score}%). Significant gaps in transport safety, travel development, or community engagement. This is a potential regulatory concern under CHR 2015 Reg 9/12.`, severity: "critical" });
  }
  if (transport_logs.length > 0 && tlIncidentRate === 0 && meets(tlLicenceRate, 90) && meets(tlVehicleRate, 90)) {
    insights.push({ text: "Transport operations demonstrate exemplary safety practice — zero incidents with consistent compliance checks. This would be viewed very favourably at inspection.", severity: "positive" });
  }
  if (independent_travel_records.length > 0 && meets(itSoloIndepRate, 60) && (itAvgRoutes ?? 0) >= 3) {
    insights.push({ text: `Children are developing strong independent travel skills — ${itSoloIndepRate}% at solo/independent stage with an average of ${itAvgRoutes} routes mastered. This demonstrates effective independence promotion under Reg 12.`, severity: "positive" });
  }
  if (ce90d.length > 0 && meets(ceOngoingRate, 50) && meets(ceBuildsConnRate, 70)) {
    insights.push({ text: "Community engagements are building sustained connections — children are developing lasting ties to their communities, supporting long-term outcomes.", severity: "positive" });
  }

  // ── Headline ─────────────────────────────────────────────────────────
  let headline: string;
  if (community_access_rating === "outstanding") {
    headline = "Community access is outstanding — safe transport, strong independence development, and rich community engagement across the home.";
  } else if (community_access_rating === "good") {
    headline = "Good community access with effective transport safety and growing independence, with some areas for improvement.";
  } else if (community_access_rating === "adequate") {
    headline = "Adequate community access but gaps in transport compliance, travel development, or community engagement need attention.";
  } else {
    headline = "Significant community access gaps — transport safety, independence development, and community engagement require urgent improvement.";
  }

  return {
    community_access_rating,
    community_access_score: score,
    headline,
    transport_safety,
    transport_ra,
    independent_travel,
    trip_planning,
    community_engagement,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
