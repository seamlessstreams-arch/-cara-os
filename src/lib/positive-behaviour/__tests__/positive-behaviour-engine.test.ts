// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Positive Behaviour Support Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateBehaviourSupportPlans,
  evaluateDeEscalation,
  evaluateRewardSanctionBalance,
  evaluateIncidentPatterns,
  buildChildBehaviourProfiles,
  generatePositiveBehaviourIntelligence,
  getRatingLabel,
  getBSPStatusLabel,
  getDeEscalationOutcomeLabel,
  getRecognitionTypeLabel,
  getSanctionTypeLabel,
  getImprovementTrendLabel,
  getSeverityLabel,
  getStrategyTypeLabel,
} from "../positive-behaviour-engine";
import type {
  BehaviourSupportPlan,
  DeEscalationRecord,
  RecognitionRecord,
  SanctionRecord,
  BehaviourIncident,
} from "../positive-behaviour-engine";

// ── Test Constants ───────────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";
const REFERENCE_DATE = "2025-06-01";

// ── Oak House Demo Data ──────────────────────────────────────────────────────
// Children: Alex (14, anxiety triggers), Jordan (13, peer conflict),
//           Morgan (15, emotional dysregulation)
// Staff: Sarah Johnson (RM), Tom Richards (RSW), Lisa Williams (Senior RSW),
//        Darren Laville (RM)

// --- Behaviour Support Plans ---

const demoPlans: BehaviourSupportPlan[] = [
  {
    id: "bsp-001",
    childId: "child-alex",
    childName: "Alex",
    createdDate: "2025-01-05",
    lastReviewDate: "2025-04-10",
    nextReviewDate: "2025-07-10",
    status: "active",
    primaryNeeds: ["Anxiety management", "Emotional regulation"],
    triggers: ["Unexpected changes to routine", "Loud environments", "Peer conflict", "Contact with birth family"],
    proactiveStrategies: ["Visual daily schedule", "Morning check-in with keyworker", "Sensory toolkit available"],
    activeStrategies: ["Offer calm space", "Use agreed safe phrases", "Reduce verbal demands"],
    reactiveStrategies: ["Guide to regulation room", "Low arousal approach", "Post-incident debrief within 2 hours"],
    childInvolvedInCreation: true,
    familyInvolvedInCreation: true,
    attachedRiskAssessment: true,
  },
  {
    id: "bsp-002",
    childId: "child-jordan",
    childName: "Jordan",
    createdDate: "2025-01-12",
    lastReviewDate: "2025-04-15",
    nextReviewDate: "2025-07-15",
    status: "active",
    primaryNeeds: ["Peer relationship skills", "Conflict resolution"],
    triggers: ["Perceived unfairness", "Being told no", "Peer teasing", "Boredom"],
    proactiveStrategies: ["Social stories about friendships", "Structured activities after school", "Weekly key-work session"],
    activeStrategies: ["Redirect to preferred activity", "Use humour appropriately", "Offer choices"],
    reactiveStrategies: ["Brief time away from situation", "Staff co-regulation", "Restorative conversation within 24 hours"],
    childInvolvedInCreation: true,
    familyInvolvedInCreation: false,
    attachedRiskAssessment: true,
  },
  {
    id: "bsp-003",
    childId: "child-morgan",
    childName: "Morgan",
    createdDate: "2025-02-01",
    lastReviewDate: "2025-05-01",
    nextReviewDate: "2025-08-01",
    status: "active",
    primaryNeeds: ["Emotional dysregulation", "Trauma response management"],
    triggers: ["Family contact", "Feeling unheard", "Transitions between activities", "Perceived rejection"],
    proactiveStrategies: ["Therapeutic life story work", "Mindfulness sessions", "Pre-warning before transitions", "Emotional literacy activities"],
    activeStrategies: ["Name the emotion", "Offer sensory tools", "Lower voice and slow pace"],
    reactiveStrategies: ["Safe space protocol", "De-escalation script", "Immediate post-incident support"],
    childInvolvedInCreation: true,
    familyInvolvedInCreation: true,
    attachedRiskAssessment: true,
  },
];

// --- De-Escalation Records ---

const demoDeEscalations: DeEscalationRecord[] = [
  {
    id: "de-001", childId: "child-alex", childName: "Alex",
    date: "2025-01-15", staffMember: "Sarah Johnson",
    triggerDescription: "Routine change caused anxiety spike",
    strategiesUsed: ["Calm voice", "Offered sensory toolkit", "Visual schedule reminder"],
    outcome: "successful", durationMinutes: 12,
    followUpAction: "Updated visual schedule",
    physicalInterventionAvoided: true,
  },
  {
    id: "de-002", childId: "child-jordan", childName: "Jordan",
    date: "2025-01-20", staffMember: "Tom Richards",
    triggerDescription: "Argument with peer about game rules",
    strategiesUsed: ["Redirect to different activity", "Humour", "Offered choices"],
    outcome: "successful", durationMinutes: 8,
    physicalInterventionAvoided: true,
  },
  {
    id: "de-003", childId: "child-morgan", childName: "Morgan",
    date: "2025-02-05", staffMember: "Lisa Williams",
    triggerDescription: "Upset after family contact session",
    strategiesUsed: ["Named the emotion", "Offered sensory tools", "Quiet space"],
    outcome: "partially_successful", durationMinutes: 25,
    followUpAction: "Key-work session booked for next day",
    physicalInterventionAvoided: true,
  },
  {
    id: "de-004", childId: "child-alex", childName: "Alex",
    date: "2025-02-18", staffMember: "Darren Laville",
    triggerDescription: "Loud noise in common room triggered anxiety",
    strategiesUsed: ["Guided to regulation room", "Low arousal approach", "Breathing exercises"],
    outcome: "successful", durationMinutes: 15,
    physicalInterventionAvoided: true,
  },
  {
    id: "de-005", childId: "child-jordan", childName: "Jordan",
    date: "2025-02-25", staffMember: "Sarah Johnson",
    triggerDescription: "Told cannot go out due to weather",
    strategiesUsed: ["Offered choices", "Redirect to indoor activity"],
    outcome: "successful", durationMinutes: 10,
    physicalInterventionAvoided: true,
  },
  {
    id: "de-006", childId: "child-morgan", childName: "Morgan",
    date: "2025-03-08", staffMember: "Tom Richards",
    triggerDescription: "Transition from activity triggered emotional outburst",
    strategiesUsed: ["Low voice", "Slow pace", "Named the emotion", "Safe space protocol"],
    outcome: "unsuccessful", durationMinutes: 35,
    followUpAction: "Staff debrief and strategy review",
    physicalInterventionAvoided: false,
  },
  {
    id: "de-007", childId: "child-alex", childName: "Alex",
    date: "2025-03-20", staffMember: "Lisa Williams",
    triggerDescription: "Peer conflict at school carried into home",
    strategiesUsed: ["Calm space", "Safe phrases", "Reduced verbal demands"],
    outcome: "successful", durationMinutes: 18,
    physicalInterventionAvoided: true,
  },
  {
    id: "de-008", childId: "child-jordan", childName: "Jordan",
    date: "2025-04-02", staffMember: "Darren Laville",
    triggerDescription: "Perceived unfairness about screen time allocation",
    strategiesUsed: ["Offered choices", "Explained reasoning calmly", "Brief time away"],
    outcome: "successful", durationMinutes: 7,
    physicalInterventionAvoided: true,
  },
  {
    id: "de-009", childId: "child-morgan", childName: "Morgan",
    date: "2025-04-15", staffMember: "Sarah Johnson",
    triggerDescription: "Feeling unheard during group discussion",
    strategiesUsed: ["Active listening", "Named the emotion", "One-to-one time"],
    outcome: "successful", durationMinutes: 20,
    physicalInterventionAvoided: true,
  },
  {
    id: "de-010", childId: "child-alex", childName: "Alex",
    date: "2025-05-01", staffMember: "Tom Richards",
    triggerDescription: "News about family contact changes",
    strategiesUsed: ["Calm voice", "Offered sensory toolkit", "Guided to regulation room"],
    outcome: "partially_successful", durationMinutes: 22,
    followUpAction: "Keyworker to discuss contact arrangements",
    physicalInterventionAvoided: true,
  },
  {
    id: "de-011", childId: "child-jordan", childName: "Jordan",
    date: "2025-05-10", staffMember: "Lisa Williams",
    triggerDescription: "Boredom on rainy day escalated to agitation",
    strategiesUsed: ["Structured activity", "Redirect", "Humour"],
    outcome: "successful", durationMinutes: 5,
    physicalInterventionAvoided: true,
  },
  {
    id: "de-012", childId: "child-morgan", childName: "Morgan",
    date: "2025-05-20", staffMember: "Darren Laville",
    triggerDescription: "Perceived rejection from peer group",
    strategiesUsed: ["Named the emotion", "Offered sensory tools", "De-escalation script", "Safe space"],
    outcome: "successful", durationMinutes: 28,
    physicalInterventionAvoided: true,
  },
];

// --- Recognition Records ---

const demoRecognitions: RecognitionRecord[] = [
  {
    id: "rec-001", childId: "child-alex", childName: "Alex",
    date: "2025-01-12", givenBy: "Sarah Johnson",
    type: "verbal_praise", reason: "Used calming strategies independently when feeling anxious",
    childResponse: "Smiled and said thanks",
  },
  {
    id: "rec-002", childId: "child-jordan", childName: "Jordan",
    date: "2025-01-18", givenBy: "Tom Richards",
    type: "activity_reward", reason: "Resolved conflict with Alex peacefully",
    childResponse: "Chose extra gaming time",
  },
  {
    id: "rec-003", childId: "child-morgan", childName: "Morgan",
    date: "2025-01-25", givenBy: "Lisa Williams",
    type: "written_recognition", reason: "Helped younger child settle in during visit",
  },
  {
    id: "rec-004", childId: "child-alex", childName: "Alex",
    date: "2025-02-08", givenBy: "Darren Laville",
    type: "privilege", reason: "Maintained calm for a full week despite triggers",
    childResponse: "Chose to stay up late on Friday",
  },
  {
    id: "rec-005", childId: "child-jordan", childName: "Jordan",
    date: "2025-02-20", givenBy: "Sarah Johnson",
    type: "verbal_praise", reason: "Apologised to Morgan without being asked",
  },
  {
    id: "rec-006", childId: "child-morgan", childName: "Morgan",
    date: "2025-03-01", givenBy: "Tom Richards",
    type: "achievement_certificate", reason: "Completed anger management module",
    childResponse: "Proud — displayed certificate in room",
  },
  {
    id: "rec-007", childId: "child-alex", childName: "Alex",
    date: "2025-03-15", givenBy: "Lisa Williams",
    type: "special_outing", reason: "Three consecutive weeks of positive behaviour",
    childResponse: "Chose cinema trip with keyworker",
  },
  {
    id: "rec-008", childId: "child-jordan", childName: "Jordan",
    date: "2025-03-28", givenBy: "Darren Laville",
    type: "activity_reward", reason: "Helped organise house activity for everyone",
  },
  {
    id: "rec-009", childId: "child-morgan", childName: "Morgan",
    date: "2025-04-05", givenBy: "Sarah Johnson",
    type: "verbal_praise", reason: "Used words to express frustration instead of actions",
  },
  {
    id: "rec-010", childId: "child-alex", childName: "Alex",
    date: "2025-04-18", givenBy: "Tom Richards",
    type: "written_recognition", reason: "Supported another child during a difficult moment",
  },
  {
    id: "rec-011", childId: "child-jordan", childName: "Jordan",
    date: "2025-04-25", givenBy: "Lisa Williams",
    type: "privilege", reason: "Consistently followed house agreements for a month",
    childResponse: "Chose extra pocket money",
  },
  {
    id: "rec-012", childId: "child-morgan", childName: "Morgan",
    date: "2025-05-05", givenBy: "Darren Laville",
    type: "verbal_praise", reason: "Managed transition between activities without support",
  },
  {
    id: "rec-013", childId: "child-alex", childName: "Alex",
    date: "2025-05-15", givenBy: "Sarah Johnson",
    type: "achievement_certificate", reason: "Completed mindfulness course",
  },
  {
    id: "rec-014", childId: "child-jordan", childName: "Jordan",
    date: "2025-05-22", givenBy: "Tom Richards",
    type: "special_outing", reason: "Outstanding effort in managing peer relationships",
    childResponse: "Chose bowling trip",
  },
  {
    id: "rec-015", childId: "child-morgan", childName: "Morgan",
    date: "2025-05-30", givenBy: "Lisa Williams",
    type: "written_recognition", reason: "Demonstrated excellent emotional regulation during family contact",
  },
];

// --- Sanction Records ---

const demoSanctions: SanctionRecord[] = [
  {
    id: "san-001", childId: "child-jordan", childName: "Jordan",
    date: "2025-01-22", issuedBy: "Tom Richards",
    type: "verbal_warning", reason: "Swearing at another child during an argument",
    proportionate: true, childInformed: true,
    childViewRecorded: true, parentNotified: true,
    restorationPlanned: true,
  },
  {
    id: "san-002", childId: "child-alex", childName: "Alex",
    date: "2025-02-10", issuedBy: "Sarah Johnson",
    type: "loss_of_privilege", reason: "Deliberately broke shared gaming controller",
    proportionate: true, childInformed: true,
    childViewRecorded: true, parentNotified: true,
    restorationPlanned: true,
  },
  {
    id: "san-003", childId: "child-morgan", childName: "Morgan",
    date: "2025-03-12", issuedBy: "Darren Laville",
    type: "restorative_task", reason: "Damaged door during emotional outburst",
    proportionate: true, childInformed: true,
    childViewRecorded: true, parentNotified: false,
    restorationPlanned: true,
  },
  {
    id: "san-004", childId: "child-jordan", childName: "Jordan",
    date: "2025-04-08", issuedBy: "Lisa Williams",
    type: "verbal_warning", reason: "Refusing to follow house agreement about bedtime",
    proportionate: true, childInformed: true,
    childViewRecorded: false, parentNotified: true,
    restorationPlanned: false,
  },
];

// --- Behaviour Incidents ---

const demoIncidents: BehaviourIncident[] = [
  {
    id: "inc-001", childId: "child-alex", childName: "Alex",
    date: "2025-01-18", time: "16:30",
    description: "Alex became distressed after unexpected visitor",
    antecedent: "Unexpected change to routine",
    behaviour: "Shouting, pacing, covering ears",
    consequence: "De-escalation successful, Alex went to calm room",
    severityLevel: "medium",
    physicalInterventionUsed: false, deEscalationAttempted: true,
    staffInvolved: ["Sarah Johnson"], debriefCompleted: true,
  },
  {
    id: "inc-002", childId: "child-jordan", childName: "Jordan",
    date: "2025-01-25", time: "18:45",
    description: "Jordan and Alex had physical altercation over remote control",
    antecedent: "Peer conflict",
    behaviour: "Pushing, shouting, throwing cushions",
    consequence: "Both separated, restorative conversation next day",
    severityLevel: "high",
    physicalInterventionUsed: false, deEscalationAttempted: true,
    staffInvolved: ["Tom Richards", "Lisa Williams"], debriefCompleted: true,
  },
  {
    id: "inc-003", childId: "child-morgan", childName: "Morgan",
    date: "2025-02-08", time: "19:30",
    description: "Morgan became emotionally dysregulated after phone call with parent",
    antecedent: "Family contact",
    behaviour: "Crying, screaming, hitting walls",
    consequence: "Staff supported to safe space, therapeutic support offered",
    severityLevel: "high",
    physicalInterventionUsed: false, deEscalationAttempted: true,
    staffInvolved: ["Lisa Williams", "Darren Laville"], debriefCompleted: true,
  },
  {
    id: "inc-004", childId: "child-alex", childName: "Alex",
    date: "2025-02-15", time: "08:15",
    description: "Alex refused to get ready for school, verbal aggression toward staff",
    antecedent: "Unexpected change to routine",
    behaviour: "Verbal aggression, door slamming",
    consequence: "Late to school, keyworker follow-up",
    severityLevel: "low",
    physicalInterventionUsed: false, deEscalationAttempted: true,
    staffInvolved: ["Tom Richards"], debriefCompleted: true,
  },
  {
    id: "inc-005", childId: "child-jordan", childName: "Jordan",
    date: "2025-03-05", time: "15:00",
    description: "Jordan kicked a door after being told activity was cancelled",
    antecedent: "Told no",
    behaviour: "Kicking door, swearing",
    consequence: "Verbal warning, restorative conversation",
    severityLevel: "medium",
    physicalInterventionUsed: false, deEscalationAttempted: true,
    staffInvolved: ["Sarah Johnson"], debriefCompleted: true,
  },
  {
    id: "inc-006", childId: "child-morgan", childName: "Morgan",
    date: "2025-03-10", time: "20:15",
    description: "Morgan refused to engage with bedtime routine, escalated to property damage",
    antecedent: "Transition between activities",
    behaviour: "Throwing objects, broken lamp",
    consequence: "Safe space protocol, post-incident review",
    severityLevel: "high",
    physicalInterventionUsed: true, deEscalationAttempted: true,
    staffInvolved: ["Tom Richards", "Darren Laville"], debriefCompleted: true,
  },
  {
    id: "inc-007", childId: "child-alex", childName: "Alex",
    date: "2025-03-22", time: "12:30",
    description: "Alex argued with peer at lunch, left the table upset",
    antecedent: "Peer conflict",
    behaviour: "Verbal argument, walked away upset",
    consequence: "Keyworker check-in, self-regulated within 20 minutes",
    severityLevel: "low",
    physicalInterventionUsed: false, deEscalationAttempted: false,
    staffInvolved: ["Lisa Williams"], debriefCompleted: false,
  },
  {
    id: "inc-008", childId: "child-jordan", childName: "Jordan",
    date: "2025-04-10", time: "17:00",
    description: "Jordan verbally aggressive toward staff after losing privileges",
    antecedent: "Told no",
    behaviour: "Swearing, threatening language",
    consequence: "Staff remained calm, offered space, followed up next day",
    severityLevel: "medium",
    physicalInterventionUsed: false, deEscalationAttempted: true,
    staffInvolved: ["Darren Laville"], debriefCompleted: true,
  },
  {
    id: "inc-009", childId: "child-morgan", childName: "Morgan",
    date: "2025-04-20", time: "10:00",
    description: "Morgan became upset during group activity, threw materials",
    antecedent: "Feeling unheard",
    behaviour: "Throwing craft materials, shouting",
    consequence: "Activity paused, one-to-one conversation",
    severityLevel: "medium",
    physicalInterventionUsed: false, deEscalationAttempted: true,
    staffInvolved: ["Sarah Johnson"], debriefCompleted: true,
  },
  {
    id: "inc-010", childId: "child-alex", childName: "Alex",
    date: "2025-05-05", time: "22:00",
    description: "Alex had a nightmare, became distressed and aggressive when woken",
    antecedent: "Unexpected change to routine",
    behaviour: "Screaming, hitting out at staff",
    consequence: "Night staff supported, calmed within 30 minutes",
    severityLevel: "medium",
    physicalInterventionUsed: false, deEscalationAttempted: true,
    staffInvolved: ["Tom Richards"], debriefCompleted: true,
  },
  {
    id: "inc-011", childId: "child-jordan", childName: "Jordan",
    date: "2025-05-18", time: "14:30",
    description: "Jordan refused to come inside, threw stones at fence",
    antecedent: "Boredom",
    behaviour: "Stone throwing, refusing requests",
    consequence: "Staff waited patiently, Jordan came in after 15 minutes",
    severityLevel: "low",
    physicalInterventionUsed: false, deEscalationAttempted: true,
    staffInvolved: ["Lisa Williams"], debriefCompleted: true,
  },
  {
    id: "inc-012", childId: "child-morgan", childName: "Morgan",
    date: "2025-05-25", time: "09:30",
    description: "Morgan had a critical incident — self-harm attempt after distressing news",
    antecedent: "Family contact",
    behaviour: "Self-harm attempt",
    consequence: "Immediate first aid, CAMHS referral, one-to-one supervision",
    severityLevel: "critical",
    physicalInterventionUsed: false, deEscalationAttempted: true,
    staffInvolved: ["Darren Laville", "Sarah Johnson", "Lisa Williams"],
    debriefCompleted: true,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// evaluateBehaviourSupportPlans
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateBehaviourSupportPlans", () => {
  it("counts total and active plans", () => {
    const result = evaluateBehaviourSupportPlans(demoPlans, REFERENCE_DATE);
    expect(result.totalPlans).toBe(3);
    expect(result.activePlans).toBe(3);
  });

  it("calculates unique children with active plans", () => {
    const result = evaluateBehaviourSupportPlans(demoPlans, REFERENCE_DATE);
    expect(result.uniqueChildrenWithActivePlans).toBe(3);
  });

  it("calculates 100% plan coverage when all children have active plans", () => {
    const result = evaluateBehaviourSupportPlans(demoPlans, REFERENCE_DATE);
    expect(result.planCoverageRate).toBe(100);
  });

  it("calculates partial coverage when some children lack plans", () => {
    const partial = [demoPlans[0], demoPlans[1]]; // Alex and Jordan only
    const withExtra: BehaviourSupportPlan[] = [
      ...partial,
      { ...demoPlans[2], status: "expired" as const },
    ];
    const result = evaluateBehaviourSupportPlans(withExtra, REFERENCE_DATE);
    expect(result.planCoverageRate).toBe(67); // 2 of 3
  });

  it("identifies plans reviewed on time", () => {
    const result = evaluateBehaviourSupportPlans(demoPlans, REFERENCE_DATE);
    expect(result.plansReviewedOnTime).toBe(3);
    expect(result.planCurrencyRate).toBe(100);
  });

  it("detects overdue plan reviews", () => {
    const overdue = [
      { ...demoPlans[0], nextReviewDate: "2025-05-01" }, // overdue
      demoPlans[1],
      demoPlans[2],
    ];
    const result = evaluateBehaviourSupportPlans(overdue, REFERENCE_DATE);
    expect(result.plansReviewedOnTime).toBe(2);
    expect(result.planCurrencyRate).toBe(67);
  });

  it("calculates child involvement rate", () => {
    const result = evaluateBehaviourSupportPlans(demoPlans, REFERENCE_DATE);
    expect(result.childInvolvementRate).toBe(100);
  });

  it("calculates family involvement rate", () => {
    const result = evaluateBehaviourSupportPlans(demoPlans, REFERENCE_DATE);
    // Alex: true, Jordan: false, Morgan: true = 67%
    expect(result.familyInvolvementRate).toBe(67);
  });

  it("calculates strategy comprehensiveness rate", () => {
    const result = evaluateBehaviourSupportPlans(demoPlans, REFERENCE_DATE);
    expect(result.strategyComprehensivenessRate).toBe(100);
  });

  it("detects incomplete strategy types", () => {
    const incomplete = [
      { ...demoPlans[0], reactiveStrategies: [] }, // missing reactive
      demoPlans[1],
      demoPlans[2],
    ];
    const result = evaluateBehaviourSupportPlans(incomplete, REFERENCE_DATE);
    expect(result.strategyComprehensivenessRate).toBe(67);
  });

  it("calculates risk assessment attachment rate", () => {
    const result = evaluateBehaviourSupportPlans(demoPlans, REFERENCE_DATE);
    expect(result.riskAssessmentAttachmentRate).toBe(100);
  });

  it("returns empty children-without-plans when all covered", () => {
    const result = evaluateBehaviourSupportPlans(demoPlans, REFERENCE_DATE);
    expect(result.childrenWithoutPlans).toEqual([]);
  });

  it("identifies children without active plans", () => {
    const withExpired: BehaviourSupportPlan[] = [
      demoPlans[0],
      demoPlans[1],
      { ...demoPlans[2], status: "expired" as const },
    ];
    const result = evaluateBehaviourSupportPlans(withExpired, REFERENCE_DATE);
    expect(result.childrenWithoutPlans).toContain("child-morgan");
  });

  it("handles empty plans array", () => {
    const result = evaluateBehaviourSupportPlans([], REFERENCE_DATE);
    expect(result.totalPlans).toBe(0);
    expect(result.activePlans).toBe(0);
    expect(result.planCoverageRate).toBe(0);
    expect(result.childInvolvementRate).toBe(0);
    expect(result.strategyComprehensivenessRate).toBe(0);
  });

  it("handles plans all in draft status", () => {
    const drafts = demoPlans.map((p) => ({ ...p, status: "draft" as const }));
    const result = evaluateBehaviourSupportPlans(drafts, REFERENCE_DATE);
    expect(result.activePlans).toBe(0);
    expect(result.planCoverageRate).toBe(0);
  });

  it("calculates correct coverage with multiple plans per child", () => {
    const multi = [
      ...demoPlans,
      { ...demoPlans[0], id: "bsp-004", status: "archived" as const },
    ];
    const result = evaluateBehaviourSupportPlans(multi, REFERENCE_DATE);
    expect(result.totalPlans).toBe(4);
    expect(result.uniqueChildrenWithActivePlans).toBe(3);
    expect(result.planCoverageRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateDeEscalation
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDeEscalation", () => {
  it("counts total records", () => {
    const result = evaluateDeEscalation(demoDeEscalations);
    expect(result.totalRecords).toBe(12);
  });

  it("calculates success rate", () => {
    const result = evaluateDeEscalation(demoDeEscalations);
    // 9 successful out of 12
    expect(result.successRate).toBe(75);
  });

  it("calculates partial success rate", () => {
    const result = evaluateDeEscalation(demoDeEscalations);
    // 2 partial out of 12
    expect(result.partialSuccessRate).toBe(17);
  });

  it("calculates unsuccessful rate", () => {
    const result = evaluateDeEscalation(demoDeEscalations);
    // 1 unsuccessful out of 12
    expect(result.unsuccessRate).toBe(8);
  });

  it("calculates physical intervention avoidance rate", () => {
    const result = evaluateDeEscalation(demoDeEscalations);
    // 11 out of 12 avoided PI
    expect(result.physicalInterventionAvoidanceRate).toBe(92);
  });

  it("calculates average duration", () => {
    const result = evaluateDeEscalation(demoDeEscalations);
    expect(result.averageDurationMinutes).toBeGreaterThan(0);
    expect(typeof result.averageDurationMinutes).toBe("number");
  });

  it("counts strategy variety", () => {
    const result = evaluateDeEscalation(demoDeEscalations);
    expect(result.strategyVariety).toBeGreaterThanOrEqual(10);
  });

  it("builds per-child patterns", () => {
    const result = evaluateDeEscalation(demoDeEscalations);
    expect(result.perChildPatterns.length).toBe(3);
    const alex = result.perChildPatterns.find(
      (p) => p.childId === "child-alex",
    );
    expect(alex).toBeDefined();
    expect(alex!.totalAttempts).toBe(4);
  });

  it("calculates per-child success rate", () => {
    const result = evaluateDeEscalation(demoDeEscalations);
    const jordan = result.perChildPatterns.find(
      (p) => p.childId === "child-jordan",
    );
    expect(jordan).toBeDefined();
    // All 4 of Jordan's de-escalations were successful
    expect(jordan!.successRate).toBe(100);
  });

  it("calculates per-child PI avoidance rate", () => {
    const result = evaluateDeEscalation(demoDeEscalations);
    const morgan = result.perChildPatterns.find(
      (p) => p.childId === "child-morgan",
    );
    expect(morgan).toBeDefined();
    // Morgan: 3 out of 4 avoided PI
    expect(morgan!.piAvoidanceRate).toBe(75);
  });

  it("returns zero values for empty records", () => {
    const result = evaluateDeEscalation([]);
    expect(result.totalRecords).toBe(0);
    expect(result.successRate).toBe(0);
    expect(result.physicalInterventionAvoidanceRate).toBe(0);
    expect(result.averageDurationMinutes).toBe(0);
    expect(result.strategyVariety).toBe(0);
    expect(result.perChildPatterns).toEqual([]);
  });

  it("sorts per-child patterns by total attempts descending", () => {
    const result = evaluateDeEscalation(demoDeEscalations);
    for (let i = 1; i < result.perChildPatterns.length; i++) {
      expect(result.perChildPatterns[i - 1].totalAttempts).toBeGreaterThanOrEqual(
        result.perChildPatterns[i].totalAttempts,
      );
    }
  });

  it("handles all successful outcomes", () => {
    const allSuccess = demoDeEscalations.map((r) => ({
      ...r,
      outcome: "successful" as const,
    }));
    const result = evaluateDeEscalation(allSuccess);
    expect(result.successRate).toBe(100);
    expect(result.unsuccessRate).toBe(0);
  });

  it("calculates per-child average duration", () => {
    const result = evaluateDeEscalation(demoDeEscalations);
    const alex = result.perChildPatterns.find(
      (p) => p.childId === "child-alex",
    );
    expect(alex).toBeDefined();
    expect(alex!.avgDuration).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateRewardSanctionBalance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRewardSanctionBalance", () => {
  it("counts total recognitions and sanctions", () => {
    const result = evaluateRewardSanctionBalance(demoRecognitions, demoSanctions);
    expect(result.totalRecognitions).toBe(15);
    expect(result.totalSanctions).toBe(4);
  });

  it("calculates reward:sanction ratio", () => {
    const result = evaluateRewardSanctionBalance(demoRecognitions, demoSanctions);
    expect(result.rewardSanctionRatio).toBe(3.8);
  });

  it("detects ratio meets target (>=3:1)", () => {
    const result = evaluateRewardSanctionBalance(demoRecognitions, demoSanctions);
    expect(result.ratioMeetsTarget).toBe(true);
  });

  it("detects ratio below target", () => {
    const fewRecognitions = demoRecognitions.slice(0, 2);
    const result = evaluateRewardSanctionBalance(fewRecognitions, demoSanctions);
    expect(result.ratioMeetsTarget).toBe(false);
  });

  it("counts recognition type variety", () => {
    const result = evaluateRewardSanctionBalance(demoRecognitions, demoSanctions);
    // All 6 types are used in demo data
    expect(result.recognitionTypeVariety).toBe(6);
  });

  it("calculates sanction proportionality rate", () => {
    const result = evaluateRewardSanctionBalance(demoRecognitions, demoSanctions);
    expect(result.sanctionProportionalityRate).toBe(100);
  });

  it("calculates child voice in sanctions rate", () => {
    const result = evaluateRewardSanctionBalance(demoRecognitions, demoSanctions);
    // 3 of 4 have childViewRecorded
    expect(result.childVoiceInSanctionsRate).toBe(75);
  });

  it("calculates parent notification rate", () => {
    const result = evaluateRewardSanctionBalance(demoRecognitions, demoSanctions);
    // 3 of 4 have parentNotified
    expect(result.parentNotificationRate).toBe(75);
  });

  it("calculates restoration planning rate", () => {
    const result = evaluateRewardSanctionBalance(demoRecognitions, demoSanctions);
    // 3 of 4 have restorationPlanned
    expect(result.restorationPlanningRate).toBe(75);
  });

  it("handles zero sanctions (ratio is count of recognitions)", () => {
    const result = evaluateRewardSanctionBalance(demoRecognitions, []);
    expect(result.rewardSanctionRatio).toBe(15);
    expect(result.ratioMeetsTarget).toBe(true);
  });

  it("handles zero recognitions and zero sanctions", () => {
    const result = evaluateRewardSanctionBalance([], []);
    expect(result.rewardSanctionRatio).toBe(0);
    expect(result.ratioMeetsTarget).toBe(false);
    expect(result.recognitionTypeVariety).toBe(0);
  });

  it("handles zero recognitions with some sanctions", () => {
    const result = evaluateRewardSanctionBalance([], demoSanctions);
    expect(result.rewardSanctionRatio).toBe(0);
    expect(result.ratioMeetsTarget).toBe(false);
  });

  it("detects disproportionate sanctions", () => {
    const disproportionate = demoSanctions.map((s) => ({
      ...s,
      proportionate: false,
    }));
    const result = evaluateRewardSanctionBalance(demoRecognitions, disproportionate);
    expect(result.sanctionProportionalityRate).toBe(0);
  });

  it("handles single recognition type", () => {
    const singleType = demoRecognitions.map((r) => ({
      ...r,
      type: "verbal_praise" as const,
    }));
    const result = evaluateRewardSanctionBalance(singleType, demoSanctions);
    expect(result.recognitionTypeVariety).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateIncidentPatterns
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIncidentPatterns", () => {
  it("counts total incidents", () => {
    const result = evaluateIncidentPatterns(demoIncidents);
    expect(result.totalIncidents).toBe(12);
  });

  it("breaks down severity levels", () => {
    const result = evaluateIncidentPatterns(demoIncidents);
    expect(result.severityBreakdown.low).toBe(3);
    expect(result.severityBreakdown.medium).toBe(5);
    expect(result.severityBreakdown.high).toBe(3);
    expect(result.severityBreakdown.critical).toBe(1);
  });

  it("analyses time-of-day patterns", () => {
    const result = evaluateIncidentPatterns(demoIncidents);
    expect(result.timeOfDayPatterns.morning).toBeGreaterThanOrEqual(0);
    expect(result.timeOfDayPatterns.afternoon).toBeGreaterThanOrEqual(0);
    expect(result.timeOfDayPatterns.evening).toBeGreaterThanOrEqual(0);
    expect(result.timeOfDayPatterns.night).toBeGreaterThanOrEqual(0);
    // Total should equal total incidents
    const total = Object.values(result.timeOfDayPatterns).reduce(
      (sum, v) => sum + v,
      0,
    );
    expect(total).toBe(12);
  });

  it("identifies antecedent patterns", () => {
    const result = evaluateIncidentPatterns(demoIncidents);
    expect(result.antecedentAnalysis.length).toBeGreaterThan(0);
    // Most common antecedents
    const topAntecedent = result.antecedentAnalysis[0];
    expect(topAntecedent.count).toBeGreaterThanOrEqual(2);
  });

  it("sorts antecedents by frequency descending", () => {
    const result = evaluateIncidentPatterns(demoIncidents);
    for (let i = 1; i < result.antecedentAnalysis.length; i++) {
      expect(result.antecedentAnalysis[i - 1].count).toBeGreaterThanOrEqual(
        result.antecedentAnalysis[i].count,
      );
    }
  });

  it("calculates debrief completion rate", () => {
    const result = evaluateIncidentPatterns(demoIncidents);
    // 11 of 12 debriefs completed
    expect(result.debriefCompletionRate).toBe(92);
  });

  it("calculates physical intervention rate", () => {
    const result = evaluateIncidentPatterns(demoIncidents);
    // 1 of 12 used PI
    expect(result.physicalInterventionRate).toBe(8);
  });

  it("calculates de-escalation attempted rate", () => {
    const result = evaluateIncidentPatterns(demoIncidents);
    // 11 of 12 attempted de-escalation
    expect(result.deEscalationAttemptedRate).toBe(92);
  });

  it("generates monthly breakdown", () => {
    const result = evaluateIncidentPatterns(demoIncidents);
    expect(result.monthlyBreakdown.length).toBeGreaterThan(0);
    // Should be sorted by month
    for (let i = 1; i < result.monthlyBreakdown.length; i++) {
      expect(
        result.monthlyBreakdown[i - 1].month.localeCompare(
          result.monthlyBreakdown[i].month,
        ),
      ).toBeLessThanOrEqual(0);
    }
  });

  it("determines frequency trend", () => {
    const result = evaluateIncidentPatterns(demoIncidents);
    expect(["increasing", "stable", "decreasing"]).toContain(
      result.frequencyTrend,
    );
  });

  it("detects increasing trend", () => {
    const increasing: BehaviourIncident[] = [
      { ...demoIncidents[0], date: "2025-01-10" },
      { ...demoIncidents[1], date: "2025-04-10", id: "inc-x1" },
      { ...demoIncidents[2], date: "2025-04-15", id: "inc-x2" },
      { ...demoIncidents[3], date: "2025-04-20", id: "inc-x3" },
    ];
    const result = evaluateIncidentPatterns(increasing);
    expect(result.frequencyTrend).toBe("increasing");
  });

  it("detects decreasing trend", () => {
    const decreasing: BehaviourIncident[] = [
      { ...demoIncidents[0], date: "2025-01-05", id: "inc-d1" },
      { ...demoIncidents[1], date: "2025-01-10", id: "inc-d2" },
      { ...demoIncidents[2], date: "2025-01-15", id: "inc-d3" },
      { ...demoIncidents[3], date: "2025-06-20", id: "inc-d4" },
    ];
    const result = evaluateIncidentPatterns(decreasing);
    expect(result.frequencyTrend).toBe("decreasing");
  });

  it("returns stable for evenly distributed incidents", () => {
    const stable: BehaviourIncident[] = [
      { ...demoIncidents[0], date: "2025-01-10", id: "inc-s1" },
      { ...demoIncidents[1], date: "2025-03-10", id: "inc-s2" },
    ];
    const result = evaluateIncidentPatterns(stable);
    expect(result.frequencyTrend).toBe("stable");
  });

  it("handles empty incidents array", () => {
    const result = evaluateIncidentPatterns([]);
    expect(result.totalIncidents).toBe(0);
    expect(result.severityBreakdown).toEqual({ low: 0, medium: 0, high: 0, critical: 0 });
    expect(result.debriefCompletionRate).toBe(0);
    expect(result.frequencyTrend).toBe("stable");
    expect(result.monthlyBreakdown).toEqual([]);
  });

  it("handles incidents without antecedents", () => {
    const noAntecedent = demoIncidents.map((i) => ({
      ...i,
      antecedent: undefined,
    }));
    const result = evaluateIncidentPatterns(noAntecedent);
    expect(result.antecedentAnalysis).toEqual([]);
  });

  it("classifies time of day correctly", () => {
    const morningIncident: BehaviourIncident[] = [
      { ...demoIncidents[0], time: "08:00" },
    ];
    const afternoonIncident: BehaviourIncident[] = [
      { ...demoIncidents[0], time: "14:00" },
    ];
    const eveningIncident: BehaviourIncident[] = [
      { ...demoIncidents[0], time: "19:00" },
    ];
    const nightIncident: BehaviourIncident[] = [
      { ...demoIncidents[0], time: "23:00" },
    ];
    expect(evaluateIncidentPatterns(morningIncident).timeOfDayPatterns.morning).toBe(1);
    expect(evaluateIncidentPatterns(afternoonIncident).timeOfDayPatterns.afternoon).toBe(1);
    expect(evaluateIncidentPatterns(eveningIncident).timeOfDayPatterns.evening).toBe(1);
    expect(evaluateIncidentPatterns(nightIncident).timeOfDayPatterns.night).toBe(1);
  });

  it("handles all incidents at critical severity", () => {
    const allCritical = demoIncidents.map((i) => ({
      ...i,
      severityLevel: "critical" as const,
    }));
    const result = evaluateIncidentPatterns(allCritical);
    expect(result.severityBreakdown.critical).toBe(12);
    expect(result.severityBreakdown.low).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildBehaviourProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildBehaviourProfiles", () => {
  it("builds profiles for all children", () => {
    const profiles = buildChildBehaviourProfiles(
      demoPlans, demoDeEscalations, demoRecognitions, demoSanctions, demoIncidents,
    );
    expect(profiles.length).toBe(3);
  });

  it("identifies child plan status", () => {
    const profiles = buildChildBehaviourProfiles(
      demoPlans, demoDeEscalations, demoRecognitions, demoSanctions, demoIncidents,
    );
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex).toBeDefined();
    expect(alex!.planStatus).toBe("active");
  });

  it("calculates per-child de-escalation success rate", () => {
    const profiles = buildChildBehaviourProfiles(
      demoPlans, demoDeEscalations, demoRecognitions, demoSanctions, demoIncidents,
    );
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(jordan).toBeDefined();
    expect(jordan!.deEscalationSuccessRate).toBe(100);
  });

  it("calculates per-child reward:sanction ratio", () => {
    const profiles = buildChildBehaviourProfiles(
      demoPlans, demoDeEscalations, demoRecognitions, demoSanctions, demoIncidents,
    );
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex).toBeDefined();
    // Alex: 5 recognitions / 1 sanction = 5
    expect(alex!.rewardSanctionRatio).toBe(5);
  });

  it("counts per-child incidents", () => {
    const profiles = buildChildBehaviourProfiles(
      demoPlans, demoDeEscalations, demoRecognitions, demoSanctions, demoIncidents,
    );
    const morgan = profiles.find((p) => p.childId === "child-morgan");
    expect(morgan).toBeDefined();
    expect(morgan!.incidentCount).toBe(4);
  });

  it("breaks down per-child incident severity", () => {
    const profiles = buildChildBehaviourProfiles(
      demoPlans, demoDeEscalations, demoRecognitions, demoSanctions, demoIncidents,
    );
    const morgan = profiles.find((p) => p.childId === "child-morgan");
    expect(morgan!.incidentSeverityBreakdown.critical).toBe(1);
    expect(morgan!.incidentSeverityBreakdown.high).toBe(2);
  });

  it("determines improvement trend", () => {
    const profiles = buildChildBehaviourProfiles(
      demoPlans, demoDeEscalations, demoRecognitions, demoSanctions, demoIncidents,
    );
    for (const p of profiles) {
      expect(["improving", "stable", "declining", "insufficient_data"]).toContain(
        p.improvementTrend,
      );
    }
  });

  it("generates strengths for child with good data", () => {
    const profiles = buildChildBehaviourProfiles(
      demoPlans, demoDeEscalations, demoRecognitions, demoSanctions, demoIncidents,
    );
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(jordan!.strengths.length).toBeGreaterThan(0);
  });

  it("generates concerns for child with critical incidents", () => {
    const profiles = buildChildBehaviourProfiles(
      demoPlans, demoDeEscalations, demoRecognitions, demoSanctions, demoIncidents,
    );
    const morgan = profiles.find((p) => p.childId === "child-morgan");
    expect(morgan!.concerns.length).toBeGreaterThan(0);
    expect(morgan!.concerns.some((c) => c.includes("high or critical"))).toBe(true);
  });

  it("sorts profiles by incident count descending", () => {
    const profiles = buildChildBehaviourProfiles(
      demoPlans, demoDeEscalations, demoRecognitions, demoSanctions, demoIncidents,
    );
    for (let i = 1; i < profiles.length; i++) {
      expect(profiles[i - 1].incidentCount).toBeGreaterThanOrEqual(
        profiles[i].incidentCount,
      );
    }
  });

  it("handles child with no plan", () => {
    const profiles = buildChildBehaviourProfiles(
      [], demoDeEscalations, demoRecognitions, demoSanctions, demoIncidents,
    );
    for (const p of profiles) {
      expect(p.planStatus).toBe("no_plan");
      expect(p.concerns.some((c) => c.includes("No behaviour support plan"))).toBe(true);
    }
  });

  it("handles child with zero sanctions", () => {
    const profiles = buildChildBehaviourProfiles(
      demoPlans, demoDeEscalations, demoRecognitions, [], demoIncidents,
    );
    const alex = profiles.find((p) => p.childId === "child-alex");
    // 5 recognitions / 0 sanctions = 5 (represented as total recognitions)
    expect(alex!.rewardSanctionRatio).toBe(5);
  });

  it("handles empty data across all sources", () => {
    const profiles = buildChildBehaviourProfiles([], [], [], [], []);
    expect(profiles).toEqual([]);
  });

  it("detects expired plan status", () => {
    const expiredPlans = demoPlans.map((p) => ({
      ...p,
      status: "expired" as const,
    }));
    const profiles = buildChildBehaviourProfiles(
      expiredPlans, demoDeEscalations, demoRecognitions, demoSanctions, demoIncidents,
    );
    for (const p of profiles) {
      expect(p.planStatus).toBe("expired");
      expect(p.concerns.some((c) => c.includes("expired"))).toBe(true);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generatePositiveBehaviourIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generatePositiveBehaviourIntelligence", () => {
  const fullResult = generatePositiveBehaviourIntelligence(
    demoPlans, demoDeEscalations, demoRecognitions, demoSanctions, demoIncidents,
    "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
  );

  it("returns correct homeId", () => {
    expect(fullResult.homeId).toBe("oak-house");
  });

  it("returns correct period", () => {
    expect(fullResult.periodStart).toBe(PERIOD_START);
    expect(fullResult.periodEnd).toBe(PERIOD_END);
  });

  it("calculates overall score between 0 and 100", () => {
    expect(fullResult.overallScore).toBeGreaterThanOrEqual(0);
    expect(fullResult.overallScore).toBeLessThanOrEqual(100);
  });

  it("assigns a valid rating", () => {
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(
      fullResult.rating,
    );
  });

  it("produces a good or outstanding rating for demo data", () => {
    // Demo data is designed to be positive
    expect(["outstanding", "good"]).toContain(fullResult.rating);
  });

  it("includes BSP evaluation results", () => {
    expect(fullResult.bspEvaluation).toBeDefined();
    expect(fullResult.bspEvaluation.totalPlans).toBe(3);
  });

  it("includes de-escalation results", () => {
    expect(fullResult.deEscalation).toBeDefined();
    expect(fullResult.deEscalation.totalRecords).toBe(12);
  });

  it("includes reward:sanction balance results", () => {
    expect(fullResult.rewardSanctionBalance).toBeDefined();
    expect(fullResult.rewardSanctionBalance.totalRecognitions).toBe(15);
  });

  it("includes incident pattern results", () => {
    expect(fullResult.incidentPatterns).toBeDefined();
    expect(fullResult.incidentPatterns.totalIncidents).toBe(12);
  });

  it("includes child profiles", () => {
    expect(fullResult.childProfiles).toBeDefined();
    expect(fullResult.childProfiles.length).toBe(3);
  });

  it("generates strengths", () => {
    expect(fullResult.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement", () => {
    expect(fullResult.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions", () => {
    expect(fullResult.actions.length).toBeGreaterThan(0);
  });

  it("generates regulatory links", () => {
    expect(fullResult.regulatoryLinks.length).toBe(5);
    expect(fullResult.regulatoryLinks[0]).toContain("Reg 35");
    expect(fullResult.regulatoryLinks[1]).toContain("Reg 19");
    expect(fullResult.regulatoryLinks[2]).toContain("SCCIF");
    expect(fullResult.regulatoryLinks[3]).toContain("NICE CG158");
    expect(fullResult.regulatoryLinks[4]).toContain("UNCRC Article 3");
  });

  // ── Scoring edge cases ──────────────────────────────────────────────

  it("scores outstanding (>=80) with perfect data", () => {
    const perfectPlans = demoPlans.map((p) => ({
      ...p,
      childInvolvedInCreation: true,
      familyInvolvedInCreation: true,
      attachedRiskAssessment: true,
    }));
    const perfectDe = demoDeEscalations.map((d) => ({
      ...d,
      outcome: "successful" as const,
      physicalInterventionAvoided: true,
    }));
    const perfectSanctions = demoSanctions.map((s) => ({
      ...s,
      proportionate: true,
      childViewRecorded: true,
      restorationPlanned: true,
    }));
    const noIncidents: BehaviourIncident[] = [];

    const result = generatePositiveBehaviourIntelligence(
      perfectPlans, perfectDe, demoRecognitions, perfectSanctions, noIncidents,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("scores inadequate (<40) with poor data", () => {
    const noPlans: BehaviourSupportPlan[] = [];
    const noDe: DeEscalationRecord[] = [];
    const noRec: RecognitionRecord[] = [];
    const noSanc: SanctionRecord[] = [];
    const noInc: BehaviourIncident[] = [];

    const result = generatePositiveBehaviourIntelligence(
      noPlans, noDe, noRec, noSanc, noInc,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("gives full incident score (25) when no incidents exist", () => {
    const result = generatePositiveBehaviourIntelligence(
      demoPlans, demoDeEscalations, demoRecognitions, demoSanctions, [],
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    // With good BSP, good de-escalation, good R:S and no incidents (25 pts)
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
  });

  it("generates urgent action when children lack BSPs", () => {
    const partialPlans = [demoPlans[0]]; // Only Alex
    const result = generatePositiveBehaviourIntelligence(
      partialPlans, demoDeEscalations, demoRecognitions, demoSanctions, demoIncidents,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates urgent action when no de-escalation records", () => {
    const result = generatePositiveBehaviourIntelligence(
      demoPlans, [], demoRecognitions, demoSanctions, demoIncidents,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("No de-escalation records"))).toBe(true);
  });

  it("notes increasing incident trend as area for improvement", () => {
    const increasing = demoIncidents.map((inc, i) => ({
      ...inc,
      date: i < 2 ? "2025-01-10" : "2025-06-10",
      id: `inc-trend-${i}`,
    }));
    const result = generatePositiveBehaviourIntelligence(
      demoPlans, demoDeEscalations, demoRecognitions, demoSanctions, increasing,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(
      result.areasForImprovement.some((a) => a.includes("increasing")),
    ).toBe(true);
  });

  it("identifies strength for good PI avoidance", () => {
    expect(
      fullResult.strengths.some((s) => s.includes("Physical intervention avoided")),
    ).toBe(true);
  });

  it("identifies strength for reward:sanction ratio meeting target", () => {
    expect(
      fullResult.strengths.some((s) => s.includes("Reward:sanction ratio")),
    ).toBe(true);
  });

  it("includes BSP coverage as a strength when all children covered", () => {
    expect(
      fullResult.strengths.some((s) => s.includes("active behaviour support plans")),
    ).toBe(true);
  });

  it("includes child involvement as a strength when high", () => {
    expect(
      fullResult.strengths.some((s) => s.includes("involved in creating")),
    ).toBe(true);
  });

  it("maps rating thresholds correctly — outstanding", () => {
    // Score >= 80 = outstanding
    const result = generatePositiveBehaviourIntelligence(
      demoPlans, demoDeEscalations.map((d) => ({ ...d, outcome: "successful" as const, physicalInterventionAvoided: true })),
      demoRecognitions, demoSanctions.map((s) => ({ ...s, childViewRecorded: true, restorationPlanned: true })),
      [],
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    if (result.overallScore >= 80) {
      expect(result.rating).toBe("outstanding");
    }
  });

  it("maps rating thresholds correctly — good", () => {
    // Score 60-79 = good
    if (fullResult.overallScore >= 60 && fullResult.overallScore < 80) {
      expect(fullResult.rating).toBe("good");
    }
  });

  it("clamps score between 0 and 100", () => {
    expect(fullResult.overallScore).toBeGreaterThanOrEqual(0);
    expect(fullResult.overallScore).toBeLessThanOrEqual(100);
  });

  it("mentions debrief completion as strength when high", () => {
    expect(
      fullResult.strengths.some((s) => s.includes("Debrief")),
    ).toBe(true);
  });

  it("identifies UNCRC Article 3 in regulatory links", () => {
    expect(
      fullResult.regulatoryLinks.some((r) => r.includes("UNCRC Article 3")),
    ).toBe(true);
  });

  it("produces consistent results when called multiple times", () => {
    const result2 = generatePositiveBehaviourIntelligence(
      demoPlans, demoDeEscalations, demoRecognitions, demoSanctions, demoIncidents,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result2.overallScore).toBe(fullResult.overallScore);
    expect(result2.rating).toBe(fullResult.rating);
    expect(result2.strengths.length).toBe(fullResult.strengths.length);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Edge cases & additional coverage
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles single plan", () => {
    const result = evaluateBehaviourSupportPlans([demoPlans[0]], REFERENCE_DATE);
    expect(result.totalPlans).toBe(1);
    expect(result.planCoverageRate).toBe(100);
  });

  it("handles single de-escalation record", () => {
    const result = evaluateDeEscalation([demoDeEscalations[0]]);
    expect(result.totalRecords).toBe(1);
    expect(result.successRate).toBe(100);
  });

  it("handles single recognition", () => {
    const result = evaluateRewardSanctionBalance([demoRecognitions[0]], []);
    expect(result.totalRecognitions).toBe(1);
    expect(result.ratioMeetsTarget).toBe(true);
  });

  it("handles single sanction", () => {
    const result = evaluateRewardSanctionBalance([], [demoSanctions[0]]);
    expect(result.totalSanctions).toBe(1);
    expect(result.ratioMeetsTarget).toBe(false);
  });

  it("handles single incident", () => {
    const result = evaluateIncidentPatterns([demoIncidents[0]]);
    expect(result.totalIncidents).toBe(1);
    expect(result.monthlyBreakdown.length).toBe(1);
    expect(result.frequencyTrend).toBe("stable");
  });

  it("handles under_review plan status", () => {
    const reviewPlans = demoPlans.map((p) => ({
      ...p,
      status: "under_review" as const,
    }));
    const result = evaluateBehaviourSupportPlans(reviewPlans, REFERENCE_DATE);
    expect(result.activePlans).toBe(0);
  });

  it("handles archived plan status", () => {
    const archivedPlans = demoPlans.map((p) => ({
      ...p,
      status: "archived" as const,
    }));
    const result = evaluateBehaviourSupportPlans(archivedPlans, REFERENCE_DATE);
    expect(result.activePlans).toBe(0);
    expect(result.planCoverageRate).toBe(0);
  });

  it("handles not_attempted de-escalation outcome", () => {
    const notAttempted: DeEscalationRecord[] = [
      { ...demoDeEscalations[0], outcome: "not_attempted" },
    ];
    const result = evaluateDeEscalation(notAttempted);
    expect(result.successRate).toBe(0);
    expect(result.unsuccessRate).toBe(0);
  });

  it("handles all sanctions with no child view recorded", () => {
    const noVoice = demoSanctions.map((s) => ({
      ...s,
      childViewRecorded: false,
    }));
    const result = evaluateRewardSanctionBalance(demoRecognitions, noVoice);
    expect(result.childVoiceInSanctionsRate).toBe(0);
  });

  it("handles all incidents without debrief", () => {
    const noDebrief = demoIncidents.map((i) => ({
      ...i,
      debriefCompleted: false,
    }));
    const result = evaluateIncidentPatterns(noDebrief);
    expect(result.debriefCompletionRate).toBe(0);
  });

  it("handles all incidents with physical intervention", () => {
    const allPI = demoIncidents.map((i) => ({
      ...i,
      physicalInterventionUsed: true,
    }));
    const result = evaluateIncidentPatterns(allPI);
    expect(result.physicalInterventionRate).toBe(100);
  });

  it("handles night-time incidents correctly", () => {
    const nightIncident: BehaviourIncident[] = [
      { ...demoIncidents[0], time: "02:30" },
    ];
    const result = evaluateIncidentPatterns(nightIncident);
    expect(result.timeOfDayPatterns.night).toBe(1);
  });

  it("handles early morning boundary (06:00 is morning)", () => {
    const earlyMorning: BehaviourIncident[] = [
      { ...demoIncidents[0], time: "06:00" },
    ];
    const result = evaluateIncidentPatterns(earlyMorning);
    expect(result.timeOfDayPatterns.morning).toBe(1);
  });

  it("handles late night boundary (05:59 is night)", () => {
    const lateNight: BehaviourIncident[] = [
      { ...demoIncidents[0], time: "05:59" },
    ];
    const result = evaluateIncidentPatterns(lateNight);
    expect(result.timeOfDayPatterns.night).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getRatingLabel", () => {
  it("returns Outstanding for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });

  it("returns Good for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });

  it("returns Requires Improvement for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });

  it("returns Inadequate for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

describe("getBSPStatusLabel", () => {
  it("returns Active for active", () => {
    expect(getBSPStatusLabel("active")).toBe("Active");
  });

  it("returns Draft for draft", () => {
    expect(getBSPStatusLabel("draft")).toBe("Draft");
  });

  it("returns Under Review for under_review", () => {
    expect(getBSPStatusLabel("under_review")).toBe("Under Review");
  });

  it("returns Expired for expired", () => {
    expect(getBSPStatusLabel("expired")).toBe("Expired");
  });

  it("returns Archived for archived", () => {
    expect(getBSPStatusLabel("archived")).toBe("Archived");
  });

  it("returns No Plan for no_plan", () => {
    expect(getBSPStatusLabel("no_plan")).toBe("No Plan");
  });
});

describe("getDeEscalationOutcomeLabel", () => {
  it("returns Successful for successful", () => {
    expect(getDeEscalationOutcomeLabel("successful")).toBe("Successful");
  });

  it("returns Partially Successful for partially_successful", () => {
    expect(getDeEscalationOutcomeLabel("partially_successful")).toBe("Partially Successful");
  });

  it("returns Unsuccessful for unsuccessful", () => {
    expect(getDeEscalationOutcomeLabel("unsuccessful")).toBe("Unsuccessful");
  });

  it("returns Not Attempted for not_attempted", () => {
    expect(getDeEscalationOutcomeLabel("not_attempted")).toBe("Not Attempted");
  });
});

describe("getRecognitionTypeLabel", () => {
  it("returns Verbal Praise for verbal_praise", () => {
    expect(getRecognitionTypeLabel("verbal_praise")).toBe("Verbal Praise");
  });

  it("returns Written Recognition for written_recognition", () => {
    expect(getRecognitionTypeLabel("written_recognition")).toBe("Written Recognition");
  });

  it("returns Activity Reward for activity_reward", () => {
    expect(getRecognitionTypeLabel("activity_reward")).toBe("Activity Reward");
  });

  it("returns Privilege for privilege", () => {
    expect(getRecognitionTypeLabel("privilege")).toBe("Privilege");
  });

  it("returns Achievement Certificate for achievement_certificate", () => {
    expect(getRecognitionTypeLabel("achievement_certificate")).toBe("Achievement Certificate");
  });

  it("returns Special Outing for special_outing", () => {
    expect(getRecognitionTypeLabel("special_outing")).toBe("Special Outing");
  });
});

describe("getSanctionTypeLabel", () => {
  it("returns Verbal Warning for verbal_warning", () => {
    expect(getSanctionTypeLabel("verbal_warning")).toBe("Verbal Warning");
  });

  it("returns Loss of Privilege for loss_of_privilege", () => {
    expect(getSanctionTypeLabel("loss_of_privilege")).toBe("Loss of Privilege");
  });

  it("returns Restorative Task for restorative_task", () => {
    expect(getSanctionTypeLabel("restorative_task")).toBe("Restorative Task");
  });

  it("returns Time Out for time_out", () => {
    expect(getSanctionTypeLabel("time_out")).toBe("Time Out");
  });

  it("returns Other for other", () => {
    expect(getSanctionTypeLabel("other")).toBe("Other");
  });
});

describe("getImprovementTrendLabel", () => {
  it("returns Improving for improving", () => {
    expect(getImprovementTrendLabel("improving")).toBe("Improving");
  });

  it("returns Stable for stable", () => {
    expect(getImprovementTrendLabel("stable")).toBe("Stable");
  });

  it("returns Declining for declining", () => {
    expect(getImprovementTrendLabel("declining")).toBe("Declining");
  });

  it("returns Insufficient Data for insufficient_data", () => {
    expect(getImprovementTrendLabel("insufficient_data")).toBe("Insufficient Data");
  });
});

describe("getSeverityLabel", () => {
  it("returns Low for low", () => {
    expect(getSeverityLabel("low")).toBe("Low");
  });

  it("returns Medium for medium", () => {
    expect(getSeverityLabel("medium")).toBe("Medium");
  });

  it("returns High for high", () => {
    expect(getSeverityLabel("high")).toBe("High");
  });

  it("returns Critical for critical", () => {
    expect(getSeverityLabel("critical")).toBe("Critical");
  });
});

describe("getStrategyTypeLabel", () => {
  it("returns Proactive for proactive", () => {
    expect(getStrategyTypeLabel("proactive")).toBe("Proactive");
  });

  it("returns Active for active", () => {
    expect(getStrategyTypeLabel("active")).toBe("Active");
  });

  it("returns Reactive for reactive", () => {
    expect(getStrategyTypeLabel("reactive")).toBe("Reactive");
  });
});
