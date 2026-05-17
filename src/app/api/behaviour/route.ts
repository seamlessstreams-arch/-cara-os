// ══════════════════════════════════════════════════════════════════════════════
// API: /api/behaviour — Behaviour & Positive Relationships
//
// GET  — returns home metrics, individual analysis, or combined dashboard data
// POST — analyse specific child or custom dataset
//
// CHR 2015 Reg 19 — Behaviour management
// CHR 2015 Reg 20 — Restraint
// SCCIF — Children's behaviour managed using positive strategies
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  analyseChildBehaviour,
  calculateHomeBehaviourMetrics,
} from "@/lib/behaviour";
import type {
  BehaviourIncident,
  PositiveEvent,
  BehaviourSupportPlan,
} from "@/lib/behaviour";

// ── GET Handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const homeId = url.searchParams.get("homeId") ?? "home-oak";
  const childId = url.searchParams.get("childId");
  const mode = url.searchParams.get("mode") ?? "dashboard";
  const now = new Date().toISOString();

  const incidents = getDemoIncidents(homeId);
  const positives = getDemoPositives(homeId);
  const plans = getDemoPlans(homeId);

  if (mode === "metrics") {
    return NextResponse.json(calculateHomeBehaviourMetrics(incidents, positives, plans, homeId, now));
  }

  if (mode === "child" && childId) {
    const result = analyseChildBehaviour(incidents, positives, plans, childId, now);
    return NextResponse.json(result);
  }

  // Dashboard mode
  const metrics = calculateHomeBehaviourMetrics(incidents, positives, plans, homeId, now);
  const childIds = [...new Set(incidents.map(i => i.childId))];
  const childAnalyses = childIds.map(cid => analyseChildBehaviour(incidents, positives, plans, cid, now));

  return NextResponse.json({
    metrics,
    children: childAnalyses,
    recentPositive: positives.slice(0, 5),
  });
}

// ── POST Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "analyse_child") {
    const { incidents, positiveEvents, supportPlans, childId, now } = body;
    if (!childId) return NextResponse.json({ error: "childId required" }, { status: 400 });
    return NextResponse.json(
      analyseChildBehaviour(
        incidents as BehaviourIncident[],
        (positiveEvents ?? []) as PositiveEvent[],
        (supportPlans ?? []) as BehaviourSupportPlan[],
        childId,
        now,
      )
    );
  }

  if (action === "metrics") {
    const { incidents, positiveEvents, supportPlans, homeId, now } = body;
    if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
    return NextResponse.json(
      calculateHomeBehaviourMetrics(
        incidents as BehaviourIncident[],
        (positiveEvents ?? []) as PositiveEvent[],
        (supportPlans ?? []) as BehaviourSupportPlan[],
        homeId,
        now,
      )
    );
  }

  return NextResponse.json({ error: "Invalid action. Use 'analyse_child' or 'metrics'" }, { status: 400 });
}

// ── Demo Data ─────────────────────────────────────────────────────────────

function getDemoIncidents(homeId: string): BehaviourIncident[] {
  return [
    {
      id: "beh-001", childId: "child-001", childName: "Jordan Williams", homeId,
      date: "2026-05-14T15:30:00Z", time: "15:30", severity: "medium", type: "verbal_aggression",
      description: "Shouting at staff when asked to do homework",
      antecedent: "Requested to start homework before screen time", behaviour: "Shouting, swearing, slammed door",
      consequence: "Offered space, calmed after 15 minutes, apologised",
      interventionsUsed: ["verbal_reassurance", "offer_space", "repair_conversation"],
      deEscalationAttempted: true, deEscalationSuccessful: true, restraintUsed: false,
      injuryOccurred: false, triggers: ["homework", "transitions"],
      staffInvolved: ["staff-sw-01"], witnesses: [], followUpActions: ["Keywork session"],
      recordedBy: "staff-sw-01", recordedAt: "2026-05-14T16:00:00Z",
    },
    {
      id: "beh-002", childId: "child-002", childName: "Aisha Patel", homeId,
      date: "2026-05-12T20:00:00Z", time: "20:00", severity: "high", type: "self_harm",
      description: "Scratching arms after phone call with mother",
      antecedent: "Upsetting phone call with birth mother", behaviour: "Scratching forearms, crying",
      consequence: "First aid, emotional support, CAMHS notified",
      interventionsUsed: ["verbal_reassurance", "sensory_regulation", "distraction"],
      deEscalationAttempted: true, deEscalationSuccessful: true, restraintUsed: false,
      injuryOccurred: true, injuryDetails: "Superficial scratches to both forearms",
      triggers: ["family_contact", "emotional_distress"],
      staffInvolved: ["staff-rw-01"], witnesses: ["staff-sw-01"],
      followUpActions: ["CAMHS notified", "Safety plan review", "Keywork session"],
      recordedBy: "staff-rw-01", recordedAt: "2026-05-12T20:30:00Z",
    },
    {
      id: "beh-003", childId: "child-003", childName: "Callum Thompson", homeId,
      date: "2026-05-10T13:00:00Z", time: "13:00", severity: "critical", type: "physical_aggression",
      description: "Punched another child during dispute over console",
      antecedent: "Argument with peer over game controller", behaviour: "Punched peer in face, threw controller",
      consequence: "Physical intervention required, separated, debriefed",
      interventionsUsed: ["de_escalation_script", "separation", "physical_intervention"],
      deEscalationAttempted: true, deEscalationSuccessful: false, restraintUsed: true,
      restraintType: "standing", restraintDuration: 2,
      restraintDebriefChild: true, restraintDebriefStaff: true,
      injuryOccurred: true, injuryDetails: "Bruise to peer's cheek",
      triggers: ["peer_conflict", "impulse_control"],
      staffInvolved: ["staff-sw-01", "staff-rw-01"], witnesses: ["child-001"],
      followUpActions: ["Restorative meeting", "BSP review", "Notify SW"],
      recordedBy: "staff-sw-01", recordedAt: "2026-05-10T13:30:00Z",
    },
    {
      id: "beh-004", childId: "child-001", childName: "Jordan Williams", homeId,
      date: "2026-05-08T08:30:00Z", time: "08:30", severity: "low", type: "non_compliance",
      description: "Refused to get up for school",
      antecedent: "Morning routine, school day", behaviour: "Stayed in bed, ignored staff",
      consequence: "10 minute extension offered, eventually got up",
      interventionsUsed: ["planned_ignoring", "reward_offered"],
      deEscalationAttempted: false, restraintUsed: false,
      injuryOccurred: false, triggers: ["morning_routine", "tiredness"],
      staffInvolved: ["staff-rw-01"], witnesses: [],
      followUpActions: ["Discussed in keywork"],
      recordedBy: "staff-rw-01", recordedAt: "2026-05-08T09:00:00Z",
    },
    {
      id: "beh-005", childId: "child-003", childName: "Callum Thompson", homeId,
      date: "2026-05-05T17:00:00Z", time: "17:00", severity: "medium", type: "property_damage",
      description: "Kicked hole in bedroom wall after argument",
      antecedent: "Told he couldn't attend friend's party due to risk assessment",
      behaviour: "Kicked wall repeatedly, threw bedding",
      consequence: "Given space, repair conversation next day",
      interventionsUsed: ["offer_space", "natural_consequence", "repair_conversation"],
      deEscalationAttempted: true, deEscalationSuccessful: false, restraintUsed: false,
      injuryOccurred: false, triggers: ["restriction", "fairness_perception"],
      staffInvolved: ["staff-sw-01"], witnesses: [],
      followUpActions: ["Discuss repair of wall", "Review risk assessment decision with child"],
      recordedBy: "staff-sw-01", recordedAt: "2026-05-05T17:30:00Z",
    },
  ];
}

function getDemoPositives(homeId: string): PositiveEvent[] {
  return [
    { id: "pos-001", childId: "child-001", childName: "Jordan Williams", homeId, date: "2026-05-15T16:00:00Z", type: "prosocial_behaviour", description: "Helped set the table without being asked", acknowledgedBy: "staff-rw-01", sharedWithTeam: true, recordedBy: "staff-rw-01" },
    { id: "pos-002", childId: "child-001", childName: "Jordan Williams", homeId, date: "2026-05-13T10:00:00Z", type: "academic_achievement", description: "Got 85% on maths test — personal best", acknowledgedBy: "staff-sw-01", sharedWithTeam: true, recordedBy: "staff-sw-01" },
    { id: "pos-003", childId: "child-002", childName: "Aisha Patel", homeId, date: "2026-05-14T14:00:00Z", type: "emotional_regulation", description: "Used breathing technique independently when upset", acknowledgedBy: "staff-rm-01", sharedWithTeam: true, recordedBy: "staff-rm-01" },
    { id: "pos-004", childId: "child-002", childName: "Aisha Patel", homeId, date: "2026-05-11T18:00:00Z", type: "helping_others", description: "Taught younger child to braid hair — patient and kind", acknowledgedBy: "staff-rw-01", sharedWithTeam: true, recordedBy: "staff-rw-01" },
    { id: "pos-005", childId: "child-003", childName: "Callum Thompson", homeId, date: "2026-05-13T12:00:00Z", type: "conflict_resolution", description: "Apologised to peer and discussed what happened calmly", acknowledgedBy: "staff-sw-01", sharedWithTeam: true, recordedBy: "staff-sw-01" },
    { id: "pos-006", childId: "child-001", childName: "Jordan Williams", homeId, date: "2026-05-10T09:00:00Z", type: "target_met", description: "Full week of managing morning routine independently", acknowledgedBy: "staff-rm-01", sharedWithTeam: true, recordedBy: "staff-rm-01" },
    { id: "pos-007", childId: "child-003", childName: "Callum Thompson", homeId, date: "2026-05-08T15:00:00Z", type: "community_participation", description: "Volunteered at community garden without prompting", acknowledgedBy: "staff-sw-01", sharedWithTeam: true, recordedBy: "staff-sw-01" },
  ];
}

function getDemoPlans(homeId: string): BehaviourSupportPlan[] {
  return [
    {
      id: "bsp-001", childId: "child-001", childName: "Jordan Williams", homeId,
      createdAt: "2026-02-01T00:00:00Z", reviewDate: "2026-06-01T00:00:00Z",
      lastReviewedAt: "2026-04-15T00:00:00Z", isActive: true,
      knownTriggers: ["transitions", "homework", "morning_routine", "fairness_perception"],
      earlyWarningSignals: ["Short answers", "Pacing", "Increased volume"],
      deEscalationStrategies: ["Offer space", "Countdown from 10", "Preferred activity after task"],
      preferredInterventions: ["verbal_reassurance", "offer_space", "reward_offered"],
      rewardTargets: ["Managing transitions calmly", "Completing homework before screen time"],
      restrictedPracticeThreshold: "Physical intervention only if immediate risk of harm",
      childContributed: true, socialWorkerAgreed: true, parentCarerInformed: true,
    },
    {
      id: "bsp-002", childId: "child-002", childName: "Aisha Patel", homeId,
      createdAt: "2026-01-15T00:00:00Z", reviewDate: "2026-07-15T00:00:00Z",
      lastReviewedAt: "2026-04-01T00:00:00Z", isActive: true,
      knownTriggers: ["family_contact", "emotional_distress", "rejection_perceived"],
      earlyWarningSignals: ["Withdrawal", "Picking at skin", "Refusing food"],
      deEscalationStrategies: ["Sensory box", "Named adult", "Journaling"],
      preferredInterventions: ["verbal_reassurance", "sensory_regulation", "distraction"],
      rewardTargets: ["Using coping strategies", "Asking for help"],
      restrictedPracticeThreshold: "Only to prevent active self-harm after verbal strategies exhausted",
      childContributed: true, socialWorkerAgreed: true, parentCarerInformed: true,
    },
    {
      id: "bsp-003", childId: "child-003", childName: "Callum Thompson", homeId,
      createdAt: "2026-03-01T00:00:00Z", reviewDate: "2026-06-01T00:00:00Z",
      lastReviewedAt: "2026-05-01T00:00:00Z", isActive: true,
      knownTriggers: ["peer_conflict", "restriction", "impulse_control", "fairness_perception"],
      earlyWarningSignals: ["Clenched jaw", "Invading personal space", "Rapid speech"],
      deEscalationStrategies: ["Walk outside", "Gym time", "Talk to named adult"],
      preferredInterventions: ["de_escalation_script", "offer_space", "separation"],
      rewardTargets: ["Walking away from conflict", "Using words not hands"],
      restrictedPracticeThreshold: "Standing hold only if immediate risk to others, max 3 minutes",
      childContributed: true, socialWorkerAgreed: true, parentCarerInformed: true,
    },
  ];
}
