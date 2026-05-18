// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Positive Behaviour Support Intelligence API Route
//
// GET  → returns Oak House demo intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generatePositiveBehaviourIntelligence } from "@/lib/positive-behaviour/positive-behaviour-engine";
import type {
  BehaviourSupportPlan,
  DeEscalationRecord,
  RecognitionRecord,
  SanctionRecord,
  BehaviourIncident,
} from "@/lib/positive-behaviour/positive-behaviour-engine";

// ── Oak House Demo Data ──────────────────────────────────────────────────────

function getDemoData(): {
  plans: BehaviourSupportPlan[];
  deescalations: DeEscalationRecord[];
  recognitions: RecognitionRecord[];
  sanctions: SanctionRecord[];
  incidents: BehaviourIncident[];
} {
  const plans: BehaviourSupportPlan[] = [
    {
      id: "bsp-001", childId: "child-alex", childName: "Alex",
      createdDate: "2025-01-05", lastReviewDate: "2025-04-10", nextReviewDate: "2025-07-10",
      status: "active",
      primaryNeeds: ["Anxiety management", "Emotional regulation"],
      triggers: ["Unexpected changes to routine", "Loud environments", "Peer conflict", "Contact with birth family"],
      proactiveStrategies: ["Visual daily schedule", "Morning check-in with keyworker", "Sensory toolkit available"],
      activeStrategies: ["Offer calm space", "Use agreed safe phrases", "Reduce verbal demands"],
      reactiveStrategies: ["Guide to regulation room", "Low arousal approach", "Post-incident debrief within 2 hours"],
      childInvolvedInCreation: true, familyInvolvedInCreation: true, attachedRiskAssessment: true,
    },
    {
      id: "bsp-002", childId: "child-jordan", childName: "Jordan",
      createdDate: "2025-01-12", lastReviewDate: "2025-04-15", nextReviewDate: "2025-07-15",
      status: "active",
      primaryNeeds: ["Peer relationship skills", "Conflict resolution"],
      triggers: ["Perceived unfairness", "Being told no", "Peer teasing", "Boredom"],
      proactiveStrategies: ["Social stories about friendships", "Structured activities after school", "Weekly key-work session"],
      activeStrategies: ["Redirect to preferred activity", "Use humour appropriately", "Offer choices"],
      reactiveStrategies: ["Brief time away from situation", "Staff co-regulation", "Restorative conversation within 24 hours"],
      childInvolvedInCreation: true, familyInvolvedInCreation: false, attachedRiskAssessment: true,
    },
    {
      id: "bsp-003", childId: "child-morgan", childName: "Morgan",
      createdDate: "2025-02-01", lastReviewDate: "2025-05-01", nextReviewDate: "2025-08-01",
      status: "active",
      primaryNeeds: ["Emotional dysregulation", "Trauma response management"],
      triggers: ["Family contact", "Feeling unheard", "Transitions between activities", "Perceived rejection"],
      proactiveStrategies: ["Therapeutic life story work", "Mindfulness sessions", "Pre-warning before transitions", "Emotional literacy activities"],
      activeStrategies: ["Name the emotion", "Offer sensory tools", "Lower voice and slow pace"],
      reactiveStrategies: ["Safe space protocol", "De-escalation script", "Immediate post-incident support"],
      childInvolvedInCreation: true, familyInvolvedInCreation: true, attachedRiskAssessment: true,
    },
  ];

  const deescalations: DeEscalationRecord[] = [
    {
      id: "de-001", childId: "child-alex", childName: "Alex",
      date: "2025-01-15", staffMember: "Sarah Johnson",
      triggerDescription: "Routine change caused anxiety spike",
      strategiesUsed: ["Calm voice", "Offered sensory toolkit", "Visual schedule reminder"],
      outcome: "successful", durationMinutes: 12,
      followUpAction: "Updated visual schedule", physicalInterventionAvoided: true,
    },
    {
      id: "de-002", childId: "child-jordan", childName: "Jordan",
      date: "2025-01-20", staffMember: "Tom Richards",
      triggerDescription: "Argument with peer about game rules",
      strategiesUsed: ["Redirect to different activity", "Humour", "Offered choices"],
      outcome: "successful", durationMinutes: 8, physicalInterventionAvoided: true,
    },
    {
      id: "de-003", childId: "child-morgan", childName: "Morgan",
      date: "2025-02-05", staffMember: "Lisa Williams",
      triggerDescription: "Upset after family contact session",
      strategiesUsed: ["Named the emotion", "Offered sensory tools", "Quiet space"],
      outcome: "partially_successful", durationMinutes: 25,
      followUpAction: "Key-work session booked for next day", physicalInterventionAvoided: true,
    },
    {
      id: "de-004", childId: "child-alex", childName: "Alex",
      date: "2025-02-18", staffMember: "Darren Laville",
      triggerDescription: "Loud noise in common room triggered anxiety",
      strategiesUsed: ["Guided to regulation room", "Low arousal approach", "Breathing exercises"],
      outcome: "successful", durationMinutes: 15, physicalInterventionAvoided: true,
    },
    {
      id: "de-005", childId: "child-jordan", childName: "Jordan",
      date: "2025-02-25", staffMember: "Sarah Johnson",
      triggerDescription: "Told cannot go out due to weather",
      strategiesUsed: ["Offered choices", "Redirect to indoor activity"],
      outcome: "successful", durationMinutes: 10, physicalInterventionAvoided: true,
    },
    {
      id: "de-006", childId: "child-morgan", childName: "Morgan",
      date: "2025-03-08", staffMember: "Tom Richards",
      triggerDescription: "Transition from activity triggered emotional outburst",
      strategiesUsed: ["Low voice", "Slow pace", "Named the emotion", "Safe space protocol"],
      outcome: "unsuccessful", durationMinutes: 35,
      followUpAction: "Staff debrief and strategy review", physicalInterventionAvoided: false,
    },
    {
      id: "de-007", childId: "child-alex", childName: "Alex",
      date: "2025-03-20", staffMember: "Lisa Williams",
      triggerDescription: "Peer conflict at school carried into home",
      strategiesUsed: ["Calm space", "Safe phrases", "Reduced verbal demands"],
      outcome: "successful", durationMinutes: 18, physicalInterventionAvoided: true,
    },
    {
      id: "de-008", childId: "child-jordan", childName: "Jordan",
      date: "2025-04-02", staffMember: "Darren Laville",
      triggerDescription: "Perceived unfairness about screen time allocation",
      strategiesUsed: ["Offered choices", "Explained reasoning calmly", "Brief time away"],
      outcome: "successful", durationMinutes: 7, physicalInterventionAvoided: true,
    },
    {
      id: "de-009", childId: "child-morgan", childName: "Morgan",
      date: "2025-04-15", staffMember: "Sarah Johnson",
      triggerDescription: "Feeling unheard during group discussion",
      strategiesUsed: ["Active listening", "Named the emotion", "One-to-one time"],
      outcome: "successful", durationMinutes: 20, physicalInterventionAvoided: true,
    },
    {
      id: "de-010", childId: "child-alex", childName: "Alex",
      date: "2025-05-01", staffMember: "Tom Richards",
      triggerDescription: "News about family contact changes",
      strategiesUsed: ["Calm voice", "Offered sensory toolkit", "Guided to regulation room"],
      outcome: "partially_successful", durationMinutes: 22,
      followUpAction: "Keyworker to discuss contact arrangements", physicalInterventionAvoided: true,
    },
    {
      id: "de-011", childId: "child-jordan", childName: "Jordan",
      date: "2025-05-10", staffMember: "Lisa Williams",
      triggerDescription: "Boredom on rainy day escalated to agitation",
      strategiesUsed: ["Structured activity", "Redirect", "Humour"],
      outcome: "successful", durationMinutes: 5, physicalInterventionAvoided: true,
    },
    {
      id: "de-012", childId: "child-morgan", childName: "Morgan",
      date: "2025-05-20", staffMember: "Darren Laville",
      triggerDescription: "Perceived rejection from peer group",
      strategiesUsed: ["Named the emotion", "Offered sensory tools", "De-escalation script", "Safe space"],
      outcome: "successful", durationMinutes: 28, physicalInterventionAvoided: true,
    },
  ];

  const recognitions: RecognitionRecord[] = [
    { id: "rec-001", childId: "child-alex", childName: "Alex", date: "2025-01-12", givenBy: "Sarah Johnson", type: "verbal_praise", reason: "Used calming strategies independently when feeling anxious", childResponse: "Smiled and said thanks" },
    { id: "rec-002", childId: "child-jordan", childName: "Jordan", date: "2025-01-18", givenBy: "Tom Richards", type: "activity_reward", reason: "Resolved conflict with Alex peacefully", childResponse: "Chose extra gaming time" },
    { id: "rec-003", childId: "child-morgan", childName: "Morgan", date: "2025-01-25", givenBy: "Lisa Williams", type: "written_recognition", reason: "Helped younger child settle in during visit" },
    { id: "rec-004", childId: "child-alex", childName: "Alex", date: "2025-02-08", givenBy: "Darren Laville", type: "privilege", reason: "Maintained calm for a full week despite triggers", childResponse: "Chose to stay up late on Friday" },
    { id: "rec-005", childId: "child-jordan", childName: "Jordan", date: "2025-02-20", givenBy: "Sarah Johnson", type: "verbal_praise", reason: "Apologised to Morgan without being asked" },
    { id: "rec-006", childId: "child-morgan", childName: "Morgan", date: "2025-03-01", givenBy: "Tom Richards", type: "achievement_certificate", reason: "Completed anger management module", childResponse: "Proud — displayed certificate in room" },
    { id: "rec-007", childId: "child-alex", childName: "Alex", date: "2025-03-15", givenBy: "Lisa Williams", type: "special_outing", reason: "Three consecutive weeks of positive behaviour", childResponse: "Chose cinema trip with keyworker" },
    { id: "rec-008", childId: "child-jordan", childName: "Jordan", date: "2025-03-28", givenBy: "Darren Laville", type: "activity_reward", reason: "Helped organise house activity for everyone" },
    { id: "rec-009", childId: "child-morgan", childName: "Morgan", date: "2025-04-05", givenBy: "Sarah Johnson", type: "verbal_praise", reason: "Used words to express frustration instead of actions" },
    { id: "rec-010", childId: "child-alex", childName: "Alex", date: "2025-04-18", givenBy: "Tom Richards", type: "written_recognition", reason: "Supported another child during a difficult moment" },
    { id: "rec-011", childId: "child-jordan", childName: "Jordan", date: "2025-04-25", givenBy: "Lisa Williams", type: "privilege", reason: "Consistently followed house agreements for a month", childResponse: "Chose extra pocket money" },
    { id: "rec-012", childId: "child-morgan", childName: "Morgan", date: "2025-05-05", givenBy: "Darren Laville", type: "verbal_praise", reason: "Managed transition between activities without support" },
    { id: "rec-013", childId: "child-alex", childName: "Alex", date: "2025-05-15", givenBy: "Sarah Johnson", type: "achievement_certificate", reason: "Completed mindfulness course" },
    { id: "rec-014", childId: "child-jordan", childName: "Jordan", date: "2025-05-22", givenBy: "Tom Richards", type: "special_outing", reason: "Outstanding effort in managing peer relationships", childResponse: "Chose bowling trip" },
    { id: "rec-015", childId: "child-morgan", childName: "Morgan", date: "2025-05-30", givenBy: "Lisa Williams", type: "written_recognition", reason: "Demonstrated excellent emotional regulation during family contact" },
  ];

  const sanctions: SanctionRecord[] = [
    { id: "san-001", childId: "child-jordan", childName: "Jordan", date: "2025-01-22", issuedBy: "Tom Richards", type: "verbal_warning", reason: "Swearing at another child during an argument", proportionate: true, childInformed: true, childViewRecorded: true, parentNotified: true, restorationPlanned: true },
    { id: "san-002", childId: "child-alex", childName: "Alex", date: "2025-02-10", issuedBy: "Sarah Johnson", type: "loss_of_privilege", reason: "Deliberately broke shared gaming controller", proportionate: true, childInformed: true, childViewRecorded: true, parentNotified: true, restorationPlanned: true },
    { id: "san-003", childId: "child-morgan", childName: "Morgan", date: "2025-03-12", issuedBy: "Darren Laville", type: "restorative_task", reason: "Damaged door during emotional outburst", proportionate: true, childInformed: true, childViewRecorded: true, parentNotified: false, restorationPlanned: true },
    { id: "san-004", childId: "child-jordan", childName: "Jordan", date: "2025-04-08", issuedBy: "Lisa Williams", type: "verbal_warning", reason: "Refusing to follow house agreement about bedtime", proportionate: true, childInformed: true, childViewRecorded: false, parentNotified: true, restorationPlanned: false },
  ];

  const incidents: BehaviourIncident[] = [
    { id: "inc-001", childId: "child-alex", childName: "Alex", date: "2025-01-18", time: "16:30", description: "Alex became distressed after unexpected visitor", antecedent: "Unexpected change to routine", behaviour: "Shouting, pacing, covering ears", consequence: "De-escalation successful, Alex went to calm room", severityLevel: "medium", physicalInterventionUsed: false, deEscalationAttempted: true, staffInvolved: ["Sarah Johnson"], debriefCompleted: true },
    { id: "inc-002", childId: "child-jordan", childName: "Jordan", date: "2025-01-25", time: "18:45", description: "Jordan and Alex had physical altercation over remote control", antecedent: "Peer conflict", behaviour: "Pushing, shouting, throwing cushions", consequence: "Both separated, restorative conversation next day", severityLevel: "high", physicalInterventionUsed: false, deEscalationAttempted: true, staffInvolved: ["Tom Richards", "Lisa Williams"], debriefCompleted: true },
    { id: "inc-003", childId: "child-morgan", childName: "Morgan", date: "2025-02-08", time: "19:30", description: "Morgan became emotionally dysregulated after phone call with parent", antecedent: "Family contact", behaviour: "Crying, screaming, hitting walls", consequence: "Staff supported to safe space, therapeutic support offered", severityLevel: "high", physicalInterventionUsed: false, deEscalationAttempted: true, staffInvolved: ["Lisa Williams", "Darren Laville"], debriefCompleted: true },
    { id: "inc-004", childId: "child-alex", childName: "Alex", date: "2025-02-15", time: "08:15", description: "Alex refused to get ready for school, verbal aggression toward staff", antecedent: "Unexpected change to routine", behaviour: "Verbal aggression, door slamming", consequence: "Late to school, keyworker follow-up", severityLevel: "low", physicalInterventionUsed: false, deEscalationAttempted: true, staffInvolved: ["Tom Richards"], debriefCompleted: true },
    { id: "inc-005", childId: "child-jordan", childName: "Jordan", date: "2025-03-05", time: "15:00", description: "Jordan kicked a door after being told activity was cancelled", antecedent: "Told no", behaviour: "Kicking door, swearing", consequence: "Verbal warning, restorative conversation", severityLevel: "medium", physicalInterventionUsed: false, deEscalationAttempted: true, staffInvolved: ["Sarah Johnson"], debriefCompleted: true },
    { id: "inc-006", childId: "child-morgan", childName: "Morgan", date: "2025-03-10", time: "20:15", description: "Morgan refused to engage with bedtime routine, escalated to property damage", antecedent: "Transition between activities", behaviour: "Throwing objects, broken lamp", consequence: "Safe space protocol, post-incident review", severityLevel: "high", physicalInterventionUsed: true, deEscalationAttempted: true, staffInvolved: ["Tom Richards", "Darren Laville"], debriefCompleted: true },
    { id: "inc-007", childId: "child-alex", childName: "Alex", date: "2025-03-22", time: "12:30", description: "Alex argued with peer at lunch, left the table upset", antecedent: "Peer conflict", behaviour: "Verbal argument, walked away upset", consequence: "Keyworker check-in, self-regulated within 20 minutes", severityLevel: "low", physicalInterventionUsed: false, deEscalationAttempted: false, staffInvolved: ["Lisa Williams"], debriefCompleted: false },
    { id: "inc-008", childId: "child-jordan", childName: "Jordan", date: "2025-04-10", time: "17:00", description: "Jordan verbally aggressive toward staff after losing privileges", antecedent: "Told no", behaviour: "Swearing, threatening language", consequence: "Staff remained calm, offered space, followed up next day", severityLevel: "medium", physicalInterventionUsed: false, deEscalationAttempted: true, staffInvolved: ["Darren Laville"], debriefCompleted: true },
    { id: "inc-009", childId: "child-morgan", childName: "Morgan", date: "2025-04-20", time: "10:00", description: "Morgan became upset during group activity, threw materials", antecedent: "Feeling unheard", behaviour: "Throwing craft materials, shouting", consequence: "Activity paused, one-to-one conversation", severityLevel: "medium", physicalInterventionUsed: false, deEscalationAttempted: true, staffInvolved: ["Sarah Johnson"], debriefCompleted: true },
    { id: "inc-010", childId: "child-alex", childName: "Alex", date: "2025-05-05", time: "22:00", description: "Alex had a nightmare, became distressed and aggressive when woken", antecedent: "Unexpected change to routine", behaviour: "Screaming, hitting out at staff", consequence: "Night staff supported, calmed within 30 minutes", severityLevel: "medium", physicalInterventionUsed: false, deEscalationAttempted: true, staffInvolved: ["Tom Richards"], debriefCompleted: true },
    { id: "inc-011", childId: "child-jordan", childName: "Jordan", date: "2025-05-18", time: "14:30", description: "Jordan refused to come inside, threw stones at fence", antecedent: "Boredom", behaviour: "Stone throwing, refusing requests", consequence: "Staff waited patiently, Jordan came in after 15 minutes", severityLevel: "low", physicalInterventionUsed: false, deEscalationAttempted: true, staffInvolved: ["Lisa Williams"], debriefCompleted: true },
    { id: "inc-012", childId: "child-morgan", childName: "Morgan", date: "2025-05-25", time: "09:30", description: "Morgan had a critical incident — self-harm attempt after distressing news", antecedent: "Family contact", behaviour: "Self-harm attempt", consequence: "Immediate first aid, CAMHS referral, one-to-one supervision", severityLevel: "critical", physicalInterventionUsed: false, deEscalationAttempted: true, staffInvolved: ["Darren Laville", "Sarah Johnson", "Lisa Williams"], debriefCompleted: true },
  ];

  return { plans, deescalations, recognitions, sanctions, incidents };
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { plans, deescalations, recognitions, sanctions, incidents } = getDemoData();
    const result = generatePositiveBehaviourIntelligence(
      plans, deescalations, recognitions, sanctions, incidents,
      "oak-house", "2025-01-01", "2025-06-30", "2025-06-01",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate positive behaviour intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      plans, deescalations, recognitions, sanctions, incidents,
      homeId, periodStart, periodEnd, referenceDate,
    } = body;

    if (!plans || !deescalations || !recognitions || !sanctions || !incidents || !homeId || !periodStart || !periodEnd || !referenceDate) {
      return NextResponse.json(
        { error: "Missing required fields: plans, deescalations, recognitions, sanctions, incidents, homeId, periodStart, periodEnd, referenceDate" },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(plans) ||
      !Array.isArray(deescalations) ||
      !Array.isArray(recognitions) ||
      !Array.isArray(sanctions) ||
      !Array.isArray(incidents)
    ) {
      return NextResponse.json(
        { error: "plans, deescalations, recognitions, sanctions, and incidents must be arrays" },
        { status: 400 },
      );
    }

    const result = generatePositiveBehaviourIntelligence(
      plans, deescalations, recognitions, sanctions, incidents,
      homeId, periodStart, periodEnd, referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process positive behaviour data", details: String(error) },
      { status: 500 },
    );
  }
}
