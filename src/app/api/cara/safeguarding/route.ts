// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/safeguarding — Safeguarding Intelligence
//
// Analyses safeguarding: missing episodes, restraint, bullying, exploitation.
// Pure deterministic — no AI. Returns structured assessment.
// CHR 2015 Reg 12 alignment (Protection of children).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseSafeguarding } from "@/lib/cara/safeguarding-intelligence";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type {
  SafeguardingInput,
  MissingEpisode,
  RestraintIncident,
  BullyingIncident,
  SafeguardingReferral,
  RiskLevel,
} from "@/lib/cara/safeguarding-intelligence";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const childId = url.searchParams.get("childId");

    if (!childId) {
      return NextResponse.json(
        { error: "childId query parameter is required" },
        { status: 400 },
      );
    }

    const sb = createServerClient();
    let input: SafeguardingInput;

    if (sb && isSupabaseEnabled()) {
      input = await fetchData(sb, childId);
    } else {
      input = buildDemoData(childId);
    }

    const assessment = analyseSafeguarding(input);

    return NextResponse.json({ success: true, data: assessment });
  } catch (err) {
    console.error("[cara/safeguarding] Error:", err);
    return NextResponse.json(
      { error: "Safeguarding intelligence failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ── Supabase Fetch ──────────────────────────────────────────────────────────

async function fetchData(sb: any, childId: string): Promise<SafeguardingInput> {
  const { data: child } = await (sb.from("children") as SB)
    .select("id, first_name, last_name, date_of_birth")
    .eq("id", childId)
    .single();

  const childName = child ? `${child.first_name} ${child.last_name}` : "Unknown";
  const age = child?.date_of_birth
    ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31557600000)
    : 15;

  // Missing episodes (last 6 months)
  const cutoff6m = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);
  const { data: rawMissing } = await (sb.from("missing_episodes") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff6m)
    .order("date", { ascending: true });

  const missingEpisodes: MissingEpisode[] = (rawMissing ?? []).map((m: any) => ({
    date: m.date,
    durationHours: m.duration_hours ?? 4,
    severity: m.severity ?? "missing",
    returnInterviewCompleted: m.return_interview_completed ?? false,
    returnInterviewWithin72Hours: m.return_interview_within_72h ?? false,
    policeInvolved: m.police_involved ?? false,
    triggerIdentified: m.trigger_identified ?? false,
  }));

  // Restraint incidents (last 6 months)
  const { data: rawRestraint } = await (sb.from("restraint_incidents") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff6m)
    .order("date", { ascending: true });

  const restraintIncidents: RestraintIncident[] = (rawRestraint ?? []).map((r: any) => ({
    date: r.date,
    type: r.type ?? "physical",
    durationMinutes: r.duration_minutes ?? 5,
    debrief: r.debrief ?? false,
    injuryToChild: r.injury_to_child ?? false,
    injuryToStaff: r.injury_to_staff ?? false,
    ofstedNotified: r.ofsted_notified ?? false,
  }));

  // Bullying incidents (last 6 months)
  const { data: rawBullying } = await (sb.from("bullying_incidents") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff6m)
    .order("date", { ascending: true });

  const bullyingIncidents: BullyingIncident[] = (rawBullying ?? []).map((b: any) => ({
    date: b.date,
    role: b.role ?? "victim",
    type: b.type ?? "verbal",
    actionTaken: b.action_taken ?? true,
    resolved: b.resolved ?? false,
  }));

  // Safeguarding referrals (last 12 months)
  const cutoff12m = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
  const { data: rawReferrals } = await (sb.from("safeguarding_referrals") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff12m)
    .order("date", { ascending: true });

  const safeguardingReferrals: SafeguardingReferral[] = (rawReferrals ?? []).map((r: any) => ({
    date: r.date,
    type: r.type ?? "other",
    outcome: r.outcome ?? "resolved",
    agencyInvolved: r.agency ?? "Local Authority",
  }));

  // Config
  const { data: config } = await (sb.from("safeguarding_config") as SB)
    .select("*")
    .eq("child_id", childId)
    .single();

  return {
    childId,
    childName,
    age,
    missingEpisodes,
    missingTrend: config?.missing_trend ?? "stable",
    restraintIncidents,
    restraintTrend: config?.restraint_trend ?? "stable",
    bullyingIncidents,
    safeguardingReferrals,
    cseRiskLevel: (config?.cse_risk ?? "none") as RiskLevel,
    cceRiskLevel: (config?.cce_risk ?? "none") as RiskLevel,
    radicalisationRiskLevel: (config?.radicalisation_risk ?? "none") as RiskLevel,
    onlineSafetyRiskLevel: (config?.online_risk ?? "none") as RiskLevel,
    riskAssessmentCurrent: config?.risk_assessment_current ?? true,
    riskAssessmentDate: config?.risk_assessment_date ?? undefined,
    safeguardingPlanInPlace: config?.safeguarding_plan ?? true,
    locationRiskAssessmentDone: config?.location_ra_done ?? true,
    childAwareOfRisks: config?.child_aware ?? true,
    onlineSafetyPlanInPlace: config?.online_safety_plan ?? true,
    antibullyingPolicyShared: config?.antibullying_shared ?? true,
    restraintPolicyShared: config?.restraint_policy_shared ?? true,
    independentReturnInterviews: config?.independent_ri ?? true,
    staffSafeguardingTrained: config?.staff_trained ?? true,
    designatedSafeguardingLead: config?.dsl_in_place ?? true,
    localaSafeguardingContactKnown: config?.la_contact_known ?? true,
    childKnowsHowToComplain: config?.child_knows_complain ?? true,
    regularSafeguardingAudits: config?.regular_audits ?? true,
  };
}

// ── Demo Data ───────────────────────────────────────────────────────────────

function buildDemoData(childId: string): SafeguardingInput {
  const isJordan = childId.includes("jordan") || childId === "child_1";

  if (!isJordan) {
    // Sam — good safeguarding profile, no incidents
    return {
      childId,
      childName: "Sam",
      age: 14,
      missingEpisodes: [],
      missingTrend: "stable",
      restraintIncidents: [],
      restraintTrend: "stable",
      bullyingIncidents: [],
      safeguardingReferrals: [],
      cseRiskLevel: "none",
      cceRiskLevel: "none",
      radicalisationRiskLevel: "none",
      onlineSafetyRiskLevel: "none",
      riskAssessmentCurrent: true,
      riskAssessmentDate: "2026-03-10",
      safeguardingPlanInPlace: true,
      locationRiskAssessmentDone: true,
      childAwareOfRisks: true,
      onlineSafetyPlanInPlace: true,
      antibullyingPolicyShared: true,
      restraintPolicyShared: true,
      independentReturnInterviews: true,
      staffSafeguardingTrained: true,
      designatedSafeguardingLead: true,
      localaSafeguardingContactKnown: true,
      childKnowsHowToComplain: true,
      regularSafeguardingAudits: true,
    };
  }

  // Jordan — some complexity: 2 missing episodes (decreasing), 1 restraint, CSE low risk
  return {
    childId,
    childName: "Jordan",
    age: 15,
    missingEpisodes: [
      {
        date: "2026-02-10",
        durationHours: 6,
        severity: "missing",
        returnInterviewCompleted: true,
        returnInterviewWithin72Hours: true,
        policeInvolved: true,
        triggerIdentified: true,
      },
      {
        date: "2026-03-22",
        durationHours: 3,
        severity: "unauthorised_absence",
        returnInterviewCompleted: true,
        returnInterviewWithin72Hours: true,
        policeInvolved: false,
        triggerIdentified: true,
      },
    ],
    missingTrend: "decreasing",
    restraintIncidents: [
      {
        date: "2026-01-15",
        type: "physical",
        durationMinutes: 4,
        debrief: true,
        injuryToChild: false,
        injuryToStaff: false,
        ofstedNotified: true,
      },
    ],
    restraintTrend: "decreasing",
    bullyingIncidents: [
      {
        date: "2026-02-20",
        role: "victim",
        type: "verbal",
        actionTaken: true,
        resolved: true,
      },
    ],
    safeguardingReferrals: [
      {
        date: "2025-11-01",
        type: "cse",
        outcome: "no_further_action",
        agencyInvolved: "MACE Panel",
      },
    ],
    cseRiskLevel: "low",
    cceRiskLevel: "none",
    radicalisationRiskLevel: "none",
    onlineSafetyRiskLevel: "low",
    riskAssessmentCurrent: true,
    riskAssessmentDate: "2026-04-01",
    safeguardingPlanInPlace: true,
    locationRiskAssessmentDone: true,
    childAwareOfRisks: true,
    onlineSafetyPlanInPlace: true,
    antibullyingPolicyShared: true,
    restraintPolicyShared: true,
    independentReturnInterviews: true,
    staffSafeguardingTrained: true,
    designatedSafeguardingLead: true,
    localaSafeguardingContactKnown: true,
    childKnowsHowToComplain: true,
    regularSafeguardingAudits: true,
  };
}
