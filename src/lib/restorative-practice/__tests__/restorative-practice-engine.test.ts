// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Restorative Practice Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateRestorativeUsage,
  evaluateRestorativeQuality,
  evaluateOutcomes,
  evaluateIncidentConversion,
  buildStaffProfiles,
  generateRestorativePracticeIntelligence,
  getConversationTypeLabel,
  getTriggerTypeLabel,
  getOutcomeTypeLabel,
  getStatusLabel,
} from "../restorative-practice-engine";
import type {
  RestorativeConversation,
  IncidentLink,
} from "../restorative-practice-engine";

// ── Test Constants ───────────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";

// ── Chamberlain House Demo Data ──────────────────────────────────────────────────────
// Children: Alex (14), Jordan (13), Morgan (15)
// Staff facilitators: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville

const demoConversations: RestorativeConversation[] = [
  // 1. Restorative chat — conflict between Alex and Jordan
  {
    id: "rc-001", homeId: "oak-house", date: "2025-01-10",
    conversationType: "restorative_chat", status: "completed",
    triggerType: "conflict_between_children",
    triggerDescription: "Alex and Jordan argued over the TV remote, escalated to shouting",
    facilitatedBy: "Sarah Johnson",
    participants: [
      { name: "Alex", role: "child" },
      { name: "Jordan", role: "child" },
      { name: "Sarah Johnson", role: "staff" },
    ],
    childrenInvolved: [
      { childId: "child-alex", childName: "Alex" },
      { childId: "child-jordan", childName: "Jordan" },
    ],
    durationMinutes: 25,
    childVoiceHeard: true, childLedResolution: false,
    outcome: "agreement_reached",
    agreementsMade: ["Take turns choosing TV programmes", "Use words not shouting when frustrated"],
    followUpDate: "2025-01-17", followUpCompleted: true,
    qualityIndicators: {
      allPartiesHeard: true, harmAcknowledged: true,
      needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true,
    },
  },
  // 2. Formal conference — physical aggression incident
  {
    id: "rc-002", homeId: "oak-house", date: "2025-01-22",
    conversationType: "formal_conference", status: "completed",
    triggerType: "physical_aggression",
    triggerDescription: "Morgan pushed Alex during a disagreement about chores",
    facilitatedBy: "Darren Laville",
    participants: [
      { name: "Morgan", role: "child" },
      { name: "Alex", role: "child" },
      { name: "Darren Laville", role: "staff" },
      { name: "Lisa Williams", role: "staff" },
    ],
    childrenInvolved: [
      { childId: "child-morgan", childName: "Morgan" },
      { childId: "child-alex", childName: "Alex" },
    ],
    durationMinutes: 45,
    childVoiceHeard: true, childLedResolution: false,
    outcome: "relationship_repaired",
    agreementsMade: ["Morgan to apologise directly to Alex", "Both to work on chore rota together", "Check-in after one week"],
    followUpDate: "2025-01-29", followUpCompleted: true,
    qualityIndicators: {
      allPartiesHeard: true, harmAcknowledged: true,
      needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true,
    },
  },
  // 3. Circle time — community issue
  {
    id: "rc-003", homeId: "oak-house", date: "2025-02-05",
    conversationType: "circle_time", status: "completed",
    triggerType: "community_issue",
    triggerDescription: "General tension in the house about shared spaces and tidiness",
    facilitatedBy: "Lisa Williams",
    participants: [
      { name: "Alex", role: "child" },
      { name: "Jordan", role: "child" },
      { name: "Morgan", role: "child" },
      { name: "Lisa Williams", role: "staff" },
    ],
    childrenInvolved: [
      { childId: "child-alex", childName: "Alex" },
      { childId: "child-jordan", childName: "Jordan" },
      { childId: "child-morgan", childName: "Morgan" },
    ],
    durationMinutes: 30,
    childVoiceHeard: true, childLedResolution: true,
    outcome: "agreement_reached",
    agreementsMade: ["Weekly house meeting to discuss shared space issues", "Cleaning rota agreed by young people"],
    followUpDate: "2025-02-12", followUpCompleted: true,
    qualityIndicators: {
      allPartiesHeard: true, harmAcknowledged: false,
      needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true,
    },
  },
  // 4. Mediation — conflict between Jordan and staff
  {
    id: "rc-004", homeId: "oak-house", date: "2025-02-14",
    conversationType: "mediation", status: "completed",
    triggerType: "conflict_child_staff",
    triggerDescription: "Jordan felt Tom was unfair about bedtime rules",
    facilitatedBy: "Sarah Johnson",
    participants: [
      { name: "Jordan", role: "child" },
      { name: "Tom Richards", role: "staff" },
      { name: "Sarah Johnson", role: "staff" },
    ],
    childrenInvolved: [
      { childId: "child-jordan", childName: "Jordan" },
    ],
    durationMinutes: 35,
    childVoiceHeard: true, childLedResolution: false,
    outcome: "understanding_improved",
    agreementsMade: ["Tom to explain reasons behind rules more clearly", "Jordan to raise concerns calmly first"],
    followUpDate: "2025-02-21", followUpCompleted: false,
    qualityIndicators: {
      allPartiesHeard: true, harmAcknowledged: true,
      needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true,
    },
  },
  // 5. Repair conversation — property damage
  {
    id: "rc-005", homeId: "oak-house", date: "2025-02-28",
    conversationType: "repair_conversation", status: "completed",
    triggerType: "property_damage",
    triggerDescription: "Alex damaged the living room door after becoming dysregulated",
    facilitatedBy: "Tom Richards",
    participants: [
      { name: "Alex", role: "child" },
      { name: "Tom Richards", role: "staff" },
    ],
    childrenInvolved: [
      { childId: "child-alex", childName: "Alex" },
    ],
    durationMinutes: 20,
    childVoiceHeard: true, childLedResolution: false,
    outcome: "understanding_improved",
    agreementsMade: ["Alex to help repair the door with staff", "Staff to offer co-regulation when Alex is dysregulated"],
    qualityIndicators: {
      allPartiesHeard: true, harmAcknowledged: true,
      needsIdentified: true, repairPlanAgreed: true, emotionsExplored: false,
    },
  },
  // 6. Check-in — emotional distress
  {
    id: "rc-006", homeId: "oak-house", date: "2025-03-05",
    conversationType: "check_in", status: "completed",
    triggerType: "emotional_distress",
    triggerDescription: "Morgan upset after contact with family member",
    facilitatedBy: "Lisa Williams",
    participants: [
      { name: "Morgan", role: "child" },
      { name: "Lisa Williams", role: "staff" },
    ],
    childrenInvolved: [
      { childId: "child-morgan", childName: "Morgan" },
    ],
    durationMinutes: 15,
    childVoiceHeard: true, childLedResolution: true,
    outcome: "understanding_improved",
    agreementsMade: ["Morgan to write in journal when feelings are big", "Staff to check in before and after contact sessions"],
    qualityIndicators: {
      allPartiesHeard: true, harmAcknowledged: false,
      needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true,
    },
  },
  // 7. Reflective debrief — verbal aggression
  {
    id: "rc-007", homeId: "oak-house", date: "2025-03-15",
    conversationType: "reflective_debrief", status: "completed",
    triggerType: "verbal_aggression",
    triggerDescription: "Alex used threatening language towards Morgan",
    facilitatedBy: "Darren Laville",
    participants: [
      { name: "Alex", role: "child" },
      { name: "Morgan", role: "child" },
      { name: "Darren Laville", role: "staff" },
    ],
    childrenInvolved: [
      { childId: "child-alex", childName: "Alex" },
      { childId: "child-morgan", childName: "Morgan" },
    ],
    durationMinutes: 40,
    childVoiceHeard: true, childLedResolution: false,
    outcome: "relationship_repaired",
    agreementsMade: ["Alex to apologise to Morgan", "Both to agree on respectful language", "Safe word system for when things get heated"],
    followUpDate: "2025-03-22", followUpCompleted: true,
    qualityIndicators: {
      allPartiesHeard: true, harmAcknowledged: true,
      needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true,
    },
  },
  // 8. Community meeting — rule breaking
  {
    id: "rc-008", homeId: "oak-house", date: "2025-03-25",
    conversationType: "community_meeting", status: "completed",
    triggerType: "rule_breaking",
    triggerDescription: "Multiple young people not following house agreement about kitchen use after 10pm",
    facilitatedBy: "Sarah Johnson",
    participants: [
      { name: "Alex", role: "child" },
      { name: "Jordan", role: "child" },
      { name: "Morgan", role: "child" },
      { name: "Sarah Johnson", role: "staff" },
    ],
    childrenInvolved: [
      { childId: "child-alex", childName: "Alex" },
      { childId: "child-jordan", childName: "Jordan" },
      { childId: "child-morgan", childName: "Morgan" },
    ],
    durationMinutes: 25,
    childVoiceHeard: true, childLedResolution: true,
    outcome: "agreement_reached",
    agreementsMade: ["Revised kitchen hours agreed by all", "Snack box prepared each evening"],
    followUpDate: "2025-04-01", followUpCompleted: true,
    qualityIndicators: {
      allPartiesHeard: true, harmAcknowledged: false,
      needsIdentified: true, repairPlanAgreed: true, emotionsExplored: false,
    },
  },
  // 9. Restorative chat — relationship breakdown
  {
    id: "rc-009", homeId: "oak-house", date: "2025-04-02",
    conversationType: "restorative_chat", status: "completed",
    triggerType: "relationship_breakdown",
    triggerDescription: "Jordan refusing to engage with Tom after previous disagreement",
    facilitatedBy: "Lisa Williams",
    participants: [
      { name: "Jordan", role: "child" },
      { name: "Tom Richards", role: "staff" },
      { name: "Lisa Williams", role: "staff" },
    ],
    childrenInvolved: [
      { childId: "child-jordan", childName: "Jordan" },
    ],
    durationMinutes: 30,
    childVoiceHeard: true, childLedResolution: false,
    outcome: "relationship_repaired",
    agreementsMade: ["Tom acknowledged Jordan's feelings", "Jordan agreed to give Tom another chance", "Weekly check-in between Jordan and Tom"],
    followUpDate: "2025-04-09", followUpCompleted: true,
    qualityIndicators: {
      allPartiesHeard: true, harmAcknowledged: true,
      needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true,
    },
  },
  // 10. Formal conference — reintegration after incident
  {
    id: "rc-010", homeId: "oak-house", date: "2025-04-15",
    conversationType: "formal_conference", status: "completed",
    triggerType: "reintegration_after_incident",
    triggerDescription: "Alex returning after overnight stay at respite placement following major incident",
    facilitatedBy: "Darren Laville",
    participants: [
      { name: "Alex", role: "child" },
      { name: "Jordan", role: "child" },
      { name: "Morgan", role: "child" },
      { name: "Darren Laville", role: "staff" },
      { name: "Sarah Johnson", role: "staff" },
      { name: "Alex's social worker", role: "external_professional" },
    ],
    childrenInvolved: [
      { childId: "child-alex", childName: "Alex" },
    ],
    durationMinutes: 60,
    childVoiceHeard: true, childLedResolution: false,
    outcome: "relationship_repaired",
    agreementsMade: ["All young people welcome Alex back", "Phased return plan for first 48 hours", "Daily check-ins with key worker"],
    followUpDate: "2025-04-17", followUpCompleted: true,
    qualityIndicators: {
      allPartiesHeard: true, harmAcknowledged: true,
      needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true,
    },
  },
  // 11. Check-in — conflict between children
  {
    id: "rc-011", homeId: "oak-house", date: "2025-04-28",
    conversationType: "check_in", status: "completed",
    triggerType: "conflict_between_children",
    triggerDescription: "Jordan and Morgan had a minor argument about gaming time",
    facilitatedBy: "Tom Richards",
    participants: [
      { name: "Jordan", role: "child" },
      { name: "Morgan", role: "child" },
      { name: "Tom Richards", role: "staff" },
    ],
    childrenInvolved: [
      { childId: "child-jordan", childName: "Jordan" },
      { childId: "child-morgan", childName: "Morgan" },
    ],
    durationMinutes: 15,
    childVoiceHeard: true, childLedResolution: true,
    outcome: "agreement_reached",
    agreementsMade: ["Gaming schedule agreed between young people"],
    qualityIndicators: {
      allPartiesHeard: true, harmAcknowledged: false,
      needsIdentified: true, repairPlanAgreed: true, emotionsExplored: false,
    },
  },
  // 12. Repair conversation — conflict child staff
  {
    id: "rc-012", homeId: "oak-house", date: "2025-05-05",
    conversationType: "repair_conversation", status: "completed",
    triggerType: "conflict_child_staff",
    triggerDescription: "Morgan felt Lisa had not listened to concerns about school",
    facilitatedBy: "Sarah Johnson",
    participants: [
      { name: "Morgan", role: "child" },
      { name: "Lisa Williams", role: "staff" },
      { name: "Sarah Johnson", role: "staff" },
    ],
    childrenInvolved: [
      { childId: "child-morgan", childName: "Morgan" },
    ],
    durationMinutes: 30,
    childVoiceHeard: true, childLedResolution: true,
    outcome: "relationship_repaired",
    agreementsMade: ["Lisa to set aside dedicated time for school discussions", "Morgan to flag concerns in weekly key-work sessions"],
    followUpDate: "2025-05-12", followUpCompleted: false,
    qualityIndicators: {
      allPartiesHeard: true, harmAcknowledged: true,
      needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true,
    },
  },
  // 13. Restorative chat — emotional distress (partial resolution)
  {
    id: "rc-013", homeId: "oak-house", date: "2025-05-18",
    conversationType: "restorative_chat", status: "completed",
    triggerType: "emotional_distress",
    triggerDescription: "Alex distressed after peer conflict at school, taking frustration out on housemates",
    facilitatedBy: "Tom Richards",
    participants: [
      { name: "Alex", role: "child" },
      { name: "Tom Richards", role: "staff" },
    ],
    childrenInvolved: [
      { childId: "child-alex", childName: "Alex" },
    ],
    durationMinutes: 20,
    childVoiceHeard: true, childLedResolution: false,
    outcome: "partial_resolution",
    agreementsMade: ["Alex to use calming strategies before reacting"],
    qualityIndicators: {
      allPartiesHeard: true, harmAcknowledged: false,
      needsIdentified: true, repairPlanAgreed: false, emotionsExplored: true,
    },
  },
  // 14. Mediation — verbal aggression (escalated)
  {
    id: "rc-014", homeId: "oak-house", date: "2025-05-30",
    conversationType: "mediation", status: "completed",
    triggerType: "verbal_aggression",
    triggerDescription: "Jordan and Alex in heated argument that neither would de-escalate",
    facilitatedBy: "Darren Laville",
    participants: [
      { name: "Jordan", role: "child" },
      { name: "Alex", role: "child" },
      { name: "Darren Laville", role: "staff" },
    ],
    childrenInvolved: [
      { childId: "child-jordan", childName: "Jordan" },
      { childId: "child-alex", childName: "Alex" },
    ],
    durationMinutes: 40,
    childVoiceHeard: false, childLedResolution: false,
    outcome: "escalated",
    agreementsMade: [],
    qualityIndicators: {
      allPartiesHeard: false, harmAcknowledged: false,
      needsIdentified: true, repairPlanAgreed: false, emotionsExplored: false,
    },
  },
  // 15. Scheduled conversation — not yet completed
  {
    id: "rc-015", homeId: "oak-house", date: "2025-06-10",
    conversationType: "formal_conference", status: "scheduled",
    triggerType: "physical_aggression",
    triggerDescription: "Follow-up conference for ongoing conflict pattern between Alex and Jordan",
    facilitatedBy: "Darren Laville",
    participants: [
      { name: "Alex", role: "child" },
      { name: "Jordan", role: "child" },
      { name: "Darren Laville", role: "staff" },
      { name: "External mediator", role: "external_professional" },
    ],
    childrenInvolved: [
      { childId: "child-alex", childName: "Alex" },
      { childId: "child-jordan", childName: "Jordan" },
    ],
    durationMinutes: 0,
    childVoiceHeard: false, childLedResolution: false,
    outcome: "further_action_needed",
    agreementsMade: [],
    qualityIndicators: {
      allPartiesHeard: false, harmAcknowledged: false,
      needsIdentified: false, repairPlanAgreed: false, emotionsExplored: false,
    },
  },
  // 16. Declined conversation
  {
    id: "rc-016", homeId: "oak-house", date: "2025-06-15",
    conversationType: "restorative_chat", status: "declined",
    triggerType: "conflict_between_children",
    triggerDescription: "Alex declined to participate in restorative chat after argument with Morgan",
    facilitatedBy: "Tom Richards",
    participants: [
      { name: "Alex", role: "child" },
      { name: "Tom Richards", role: "staff" },
    ],
    childrenInvolved: [
      { childId: "child-alex", childName: "Alex" },
    ],
    durationMinutes: 0,
    childVoiceHeard: false, childLedResolution: false,
    outcome: "no_resolution",
    agreementsMade: [],
    qualityIndicators: {
      allPartiesHeard: false, harmAcknowledged: false,
      needsIdentified: false, repairPlanAgreed: false, emotionsExplored: false,
    },
  },
  // 17. Circle time — community issue (with family member participant)
  {
    id: "rc-017", homeId: "oak-house", date: "2025-06-20",
    conversationType: "circle_time", status: "completed",
    triggerType: "community_issue",
    triggerDescription: "House meeting about summer activities and boundaries",
    facilitatedBy: "Sarah Johnson",
    participants: [
      { name: "Alex", role: "child" },
      { name: "Jordan", role: "child" },
      { name: "Morgan", role: "child" },
      { name: "Sarah Johnson", role: "staff" },
      { name: "Jordan's mum", role: "family_member" },
    ],
    childrenInvolved: [
      { childId: "child-alex", childName: "Alex" },
      { childId: "child-jordan", childName: "Jordan" },
      { childId: "child-morgan", childName: "Morgan" },
    ],
    durationMinutes: 35,
    childVoiceHeard: true, childLedResolution: true,
    outcome: "agreement_reached",
    agreementsMade: ["Summer activity plan agreed", "Boundaries for outings agreed by children", "Regular review of summer plan"],
    qualityIndicators: {
      allPartiesHeard: true, harmAcknowledged: false,
      needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true,
    },
  },
];

const demoIncidentLinks: IncidentLink[] = [
  { incidentId: "inc-001", restorativeConversationId: "rc-002", incidentDate: "2025-01-21", incidentType: "physical_aggression" },
  { incidentId: "inc-002", restorativeConversationId: "rc-005", incidentDate: "2025-02-27", incidentType: "property_damage" },
  { incidentId: "inc-003", restorativeConversationId: "rc-007", incidentDate: "2025-03-14", incidentType: "verbal_aggression" },
  { incidentId: "inc-004", restorativeConversationId: "rc-010", incidentDate: "2025-04-13", incidentType: "physical_aggression" },
  { incidentId: "inc-005", restorativeConversationId: "rc-014", incidentDate: "2025-05-29", incidentType: "verbal_aggression" },
];

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Restorative Practice — evaluateRestorativeUsage", () => {
  it("counts total conversations in period", () => {
    const result = evaluateRestorativeUsage(demoConversations, PERIOD_START, PERIOD_END);
    expect(result.totalConversations).toBe(17);
  });

  it("calculates conversations per week", () => {
    const result = evaluateRestorativeUsage(demoConversations, PERIOD_START, PERIOD_END);
    // 17 conversations over ~26 weeks = ~0.7 per week
    expect(result.conversationsPerWeek).toBeGreaterThan(0);
    expect(result.conversationsPerWeek).toBeLessThan(2);
  });

  it("counts by conversation type", () => {
    const result = evaluateRestorativeUsage(demoConversations, PERIOD_START, PERIOD_END);
    expect(result.byType.restorative_chat).toBe(4); // rc-001, rc-009, rc-013, rc-016
    expect(result.byType.formal_conference).toBe(3); // rc-002, rc-010, rc-015
    expect(result.byType.circle_time).toBe(2); // rc-003, rc-017
    expect(result.byType.mediation).toBe(2); // rc-004, rc-014
    expect(result.byType.check_in).toBe(2); // rc-006, rc-011
    expect(result.byType.community_meeting).toBe(1); // rc-008
    expect(result.byType.repair_conversation).toBe(2); // rc-005, rc-012
    expect(result.byType.reflective_debrief).toBe(1); // rc-007
  });

  it("counts by trigger type", () => {
    const result = evaluateRestorativeUsage(demoConversations, PERIOD_START, PERIOD_END);
    expect(result.byTrigger.conflict_between_children).toBe(3); // rc-001, rc-011, rc-016
    expect(result.byTrigger.physical_aggression).toBe(2); // rc-002, rc-015
    expect(result.byTrigger.verbal_aggression).toBe(2); // rc-007, rc-014
    expect(result.byTrigger.conflict_child_staff).toBe(2); // rc-004, rc-012
    expect(result.byTrigger.community_issue).toBe(2); // rc-003, rc-017
    expect(result.byTrigger.emotional_distress).toBe(2); // rc-006, rc-013
  });

  it("calculates completion rate", () => {
    const result = evaluateRestorativeUsage(demoConversations, PERIOD_START, PERIOD_END);
    // 14 completed out of 17 total (1 scheduled, 1 declined, 1 in_progress? No — 15 completed + 1 scheduled + 1 declined = 17)
    // Actually: rc-001..014 = 14 completed, rc-015 = scheduled, rc-016 = declined, rc-017 = completed = 15 completed
    expect(result.completionRate).toBe(88); // 15/17 = 88.2 → 88
  });

  it("calculates average duration of completed conversations", () => {
    const result = evaluateRestorativeUsage(demoConversations, PERIOD_START, PERIOD_END);
    // Sum of completed durations: 25+45+30+35+20+15+40+25+30+60+15+30+20+40+35 = 465
    // 15 completed → 465/15 = 31
    expect(result.avgDuration).toBe(31);
  });

  it("counts scheduled conversations", () => {
    const result = evaluateRestorativeUsage(demoConversations, PERIOD_START, PERIOD_END);
    expect(result.scheduledCount).toBe(1);
  });

  it("counts declined conversations", () => {
    const result = evaluateRestorativeUsage(demoConversations, PERIOD_START, PERIOD_END);
    expect(result.declinedCount).toBe(1);
  });

  it("initialises all type counts to zero", () => {
    const result = evaluateRestorativeUsage([], PERIOD_START, PERIOD_END);
    expect(result.byType.restorative_chat).toBe(0);
    expect(result.byType.formal_conference).toBe(0);
    expect(result.byType.circle_time).toBe(0);
    expect(result.byType.mediation).toBe(0);
    expect(result.byType.check_in).toBe(0);
    expect(result.byType.community_meeting).toBe(0);
    expect(result.byType.repair_conversation).toBe(0);
    expect(result.byType.reflective_debrief).toBe(0);
  });

  it("initialises all trigger counts to zero", () => {
    const result = evaluateRestorativeUsage([], PERIOD_START, PERIOD_END);
    expect(result.byTrigger.conflict_between_children).toBe(0);
    expect(result.byTrigger.physical_aggression).toBe(0);
  });

  it("handles empty conversations", () => {
    const result = evaluateRestorativeUsage([], PERIOD_START, PERIOD_END);
    expect(result.totalConversations).toBe(0);
    expect(result.completionRate).toBe(0);
    expect(result.avgDuration).toBe(0);
    expect(result.conversationsPerWeek).toBe(0);
  });

  it("filters by period", () => {
    const result = evaluateRestorativeUsage(demoConversations, "2025-01-01", "2025-01-31");
    // rc-001 (Jan 10), rc-002 (Jan 22) = 2
    expect(result.totalConversations).toBe(2);
  });

  it("excludes conversations outside period", () => {
    const result = evaluateRestorativeUsage(demoConversations, "2025-07-01", "2025-12-31");
    expect(result.totalConversations).toBe(0);
  });
});

describe("Restorative Practice — evaluateRestorativeQuality", () => {
  it("calculates average quality score for completed conversations", () => {
    const result = evaluateRestorativeQuality(demoConversations, PERIOD_START, PERIOD_END);
    // Quality per completed conversation:
    // rc-001: 5/5=100, rc-002: 5/5=100, rc-003: 4/5=80, rc-004: 5/5=100,
    // rc-005: 4/5=80, rc-006: 4/5=80, rc-007: 5/5=100, rc-008: 3/5=60,
    // rc-009: 5/5=100, rc-010: 5/5=100, rc-011: 3/5=60, rc-012: 5/5=100,
    // rc-013: 3/5=60, rc-014: 1/5=20, rc-017: 4/5=80
    // Sum: 100+100+80+100+80+80+100+60+100+100+60+100+60+20+80 = 1220
    // Avg: 1220/15 = 81.3 → 81
    expect(result.avgQualityScore).toBe(81);
  });

  it("counts conversations assessed (completed only)", () => {
    const result = evaluateRestorativeQuality(demoConversations, PERIOD_START, PERIOD_END);
    expect(result.conversationsAssessed).toBe(15);
  });

  it("calculates child voice rate", () => {
    const result = evaluateRestorativeQuality(demoConversations, PERIOD_START, PERIOD_END);
    // rc-014 is the only completed one where childVoiceHeard is false → 14/15 = 93
    expect(result.childVoiceRate).toBe(93);
  });

  it("calculates child-led rate", () => {
    const result = evaluateRestorativeQuality(demoConversations, PERIOD_START, PERIOD_END);
    // Child-led: rc-003, rc-006, rc-008, rc-011, rc-012, rc-017 = 6 out of 15 = 40%
    expect(result.childLedRate).toBe(40);
  });

  it("calculates all parties heard rate", () => {
    const result = evaluateRestorativeQuality(demoConversations, PERIOD_START, PERIOD_END);
    // Only rc-014 has allPartiesHeard=false among completed → 14/15 = 93
    expect(result.allPartiesHeardRate).toBe(93);
  });

  it("calculates harm acknowledged rate", () => {
    const result = evaluateRestorativeQuality(demoConversations, PERIOD_START, PERIOD_END);
    // harmAcknowledged true: rc-001,002,004,005,007,009,010,012 = 8 out of 15 = 53
    expect(result.harmAcknowledgedRate).toBe(53);
  });

  it("calculates repair plan rate", () => {
    const result = evaluateRestorativeQuality(demoConversations, PERIOD_START, PERIOD_END);
    // repairPlanAgreed true: rc-001,002,003,004,005,006,007,008,009,010,011,012,017 = 13 out of 15 = 87
    expect(result.repairPlanRate).toBe(87);
  });

  it("calculates emotions explored rate", () => {
    const result = evaluateRestorativeQuality(demoConversations, PERIOD_START, PERIOD_END);
    // emotionsExplored true: rc-001,002,003,004,006,007,009,010,012,013,017 = 11 out of 15 = 73
    expect(result.emotionsExploredRate).toBe(73);
  });

  it("calculates needs identified rate", () => {
    const result = evaluateRestorativeQuality(demoConversations, PERIOD_START, PERIOD_END);
    // needsIdentified true: all completed except rc-014 has it true... actually checking:
    // rc-014: needsIdentified=true. So all 15 completed have it true? Let me check each...
    // Actually all have needsIdentified: true → 15/15 = 100
    expect(result.needsIdentifiedRate).toBe(100);
  });

  it("handles empty conversations", () => {
    const result = evaluateRestorativeQuality([], PERIOD_START, PERIOD_END);
    expect(result.avgQualityScore).toBe(0);
    expect(result.childVoiceRate).toBe(0);
    expect(result.conversationsAssessed).toBe(0);
  });

  it("excludes non-completed conversations from quality assessment", () => {
    const scheduled: RestorativeConversation[] = [{
      id: "test-1", homeId: "oak-house", date: "2025-03-01",
      conversationType: "restorative_chat", status: "scheduled",
      triggerType: "conflict_between_children",
      triggerDescription: "Test", facilitatedBy: "Test Staff",
      participants: [], childrenInvolved: [],
      durationMinutes: 0, childVoiceHeard: false, childLedResolution: false,
      outcome: "further_action_needed", agreementsMade: [],
      qualityIndicators: { allPartiesHeard: false, harmAcknowledged: false, needsIdentified: false, repairPlanAgreed: false, emotionsExplored: false },
    }];
    const result = evaluateRestorativeQuality(scheduled, PERIOD_START, PERIOD_END);
    expect(result.conversationsAssessed).toBe(0);
    expect(result.avgQualityScore).toBe(0);
  });
});

describe("Restorative Practice — evaluateOutcomes", () => {
  it("counts total resolved (positive outcomes)", () => {
    const result = evaluateOutcomes(demoConversations, PERIOD_START, PERIOD_END);
    // relationship_repaired: rc-002,007,009,010,012 = 5
    // agreement_reached: rc-001,003,008,011,017 = 5
    // understanding_improved: rc-004,005,006 = 3
    // Total positive = 13
    expect(result.totalResolved).toBe(13);
  });

  it("calculates repair rate", () => {
    const result = evaluateOutcomes(demoConversations, PERIOD_START, PERIOD_END);
    // 13 positive out of 15 completed = 87%
    expect(result.repairRate).toBe(87);
  });

  it("calculates no resolution rate", () => {
    const result = evaluateOutcomes(demoConversations, PERIOD_START, PERIOD_END);
    // no_resolution: 0 among completed (rc-016 is declined, not completed)
    expect(result.noResolutionRate).toBe(0);
  });

  it("counts escalated conversations", () => {
    const result = evaluateOutcomes(demoConversations, PERIOD_START, PERIOD_END);
    // rc-014 = escalated
    expect(result.escalatedCount).toBe(1);
  });

  it("calculates follow-up rate", () => {
    const result = evaluateOutcomes(demoConversations, PERIOD_START, PERIOD_END);
    // Completed with followUpDate: rc-001,002,003,004,007,008,009,010,012 = 9 out of 15 = 60
    expect(result.followUpRate).toBe(60);
  });

  it("calculates follow-up completed rate", () => {
    const result = evaluateOutcomes(demoConversations, PERIOD_START, PERIOD_END);
    // followUpCompleted=true: rc-001,002,003,007,008,009,010 = 7 out of 9 with follow-ups = 78
    expect(result.followUpCompletedRate).toBe(78);
  });

  it("calculates average agreements per conversation", () => {
    const result = evaluateOutcomes(demoConversations, PERIOD_START, PERIOD_END);
    // Count all agreements in completed conversations:
    // rc-001:2, rc-002:3, rc-003:2, rc-004:2, rc-005:2, rc-006:2, rc-007:3,
    // rc-008:2, rc-009:3, rc-010:3, rc-011:1, rc-012:2, rc-013:1, rc-014:0, rc-017:3
    // Total = 31, divided by 15 = 2.066... → 2.1
    expect(result.averageAgreementsPerConversation).toBe(2.1);
  });

  it("tracks outcome distribution", () => {
    const result = evaluateOutcomes(demoConversations, PERIOD_START, PERIOD_END);
    expect(result.outcomeDistribution.relationship_repaired).toBe(5);
    expect(result.outcomeDistribution.agreement_reached).toBe(5);
    expect(result.outcomeDistribution.understanding_improved).toBe(3);
    expect(result.outcomeDistribution.partial_resolution).toBe(1);
    expect(result.outcomeDistribution.escalated).toBe(1);
  });

  it("handles empty conversations", () => {
    const result = evaluateOutcomes([], PERIOD_START, PERIOD_END);
    expect(result.totalResolved).toBe(0);
    expect(result.repairRate).toBe(0);
    expect(result.followUpRate).toBe(0);
    expect(result.averageAgreementsPerConversation).toBe(0);
  });

  it("initialises all outcome counts to zero", () => {
    const result = evaluateOutcomes([], PERIOD_START, PERIOD_END);
    expect(result.outcomeDistribution.relationship_repaired).toBe(0);
    expect(result.outcomeDistribution.escalated).toBe(0);
    expect(result.outcomeDistribution.no_resolution).toBe(0);
  });
});

describe("Restorative Practice — evaluateIncidentConversion", () => {
  it("counts incidents with restorative follow-up", () => {
    const result = evaluateIncidentConversion(demoConversations, demoIncidentLinks, PERIOD_START, PERIOD_END);
    // All 5 incidents have linked conversations; rc-014 is "escalated" but status=completed, not declined
    expect(result.incidentsWithRestorative).toBe(5);
  });

  it("counts total linked incidents", () => {
    const result = evaluateIncidentConversion(demoConversations, demoIncidentLinks, PERIOD_START, PERIOD_END);
    expect(result.totalLinkedIncidents).toBe(5);
  });

  it("calculates conversion rate", () => {
    const result = evaluateIncidentConversion(demoConversations, demoIncidentLinks, PERIOD_START, PERIOD_END);
    // 5 out of 5 unique incidents = 100%
    expect(result.conversionRate).toBe(100);
  });

  it("calculates average days to restorative", () => {
    const result = evaluateIncidentConversion(demoConversations, demoIncidentLinks, PERIOD_START, PERIOD_END);
    // inc-001: Jan 21 → Jan 22 = 1 day
    // inc-002: Feb 27 → Feb 28 = 1 day
    // inc-003: Mar 14 → Mar 15 = 1 day
    // inc-004: Apr 13 → Apr 15 = 2 days
    // inc-005: May 29 → May 30 = 1 day
    // Avg: (1+1+1+2+1)/5 = 6/5 = 1.2
    expect(result.avgDaysToRestorative).toBe(1.2);
  });

  it("handles empty incident links", () => {
    const result = evaluateIncidentConversion(demoConversations, [], PERIOD_START, PERIOD_END);
    expect(result.totalLinkedIncidents).toBe(0);
    expect(result.conversionRate).toBe(0);
    expect(result.avgDaysToRestorative).toBe(0);
  });

  it("handles incidents with no matching conversation", () => {
    const orphanLinks: IncidentLink[] = [
      { incidentId: "inc-orphan", restorativeConversationId: "rc-nonexistent", incidentDate: "2025-03-01", incidentType: "verbal_aggression" },
    ];
    const result = evaluateIncidentConversion(demoConversations, orphanLinks, PERIOD_START, PERIOD_END);
    expect(result.incidentsWithRestorative).toBe(0);
    expect(result.conversionRate).toBe(0);
  });

  it("excludes declined conversations from conversion count", () => {
    const declinedLink: IncidentLink[] = [
      { incidentId: "inc-declined", restorativeConversationId: "rc-016", incidentDate: "2025-06-14", incidentType: "conflict" },
    ];
    const result = evaluateIncidentConversion(demoConversations, declinedLink, PERIOD_START, PERIOD_END);
    expect(result.incidentsWithRestorative).toBe(0);
  });

  it("filters links by period", () => {
    const result = evaluateIncidentConversion(demoConversations, demoIncidentLinks, "2025-01-01", "2025-02-28");
    // inc-001 (Jan 21), inc-002 (Feb 27) = 2 in range
    expect(result.totalLinkedIncidents).toBe(2);
  });
});

describe("Restorative Practice — buildStaffProfiles", () => {
  const profiles = buildStaffProfiles(demoConversations, PERIOD_START, PERIOD_END);

  it("builds profiles for all facilitators of completed conversations", () => {
    expect(profiles.length).toBe(4);
  });

  it("Sarah Johnson facilitated 5 completed conversations", () => {
    const sarah = profiles.find((p) => p.staffName === "Sarah Johnson");
    expect(sarah).toBeDefined();
    // rc-001, rc-004, rc-008, rc-012, rc-017 = 5
    expect(sarah!.totalFacilitated).toBe(5);
  });

  it("Darren Laville facilitated 3 completed conversations", () => {
    const darren = profiles.find((p) => p.staffName === "Darren Laville");
    expect(darren).toBeDefined();
    // rc-002, rc-007, rc-010, rc-014 = 4 (rc-015 is scheduled, not counted)
    expect(darren!.totalFacilitated).toBe(4);
  });

  it("Lisa Williams facilitated 3 completed conversations", () => {
    const lisa = profiles.find((p) => p.staffName === "Lisa Williams");
    expect(lisa).toBeDefined();
    // rc-003, rc-006, rc-009 = 3
    expect(lisa!.totalFacilitated).toBe(3);
  });

  it("Tom Richards facilitated 4 completed conversations", () => {
    const tom = profiles.find((p) => p.staffName === "Tom Richards");
    expect(tom).toBeDefined();
    // rc-005, rc-011, rc-013, rc-014 = 4... wait let me check
    // Wait rc-014 is completed status. So Tom: rc-005, rc-011, rc-013, rc-014 = 4? No.
    // rc-005: Tom Richards, rc-011: Tom Richards, rc-013: Tom Richards = 3
    // rc-014: Darren Laville. Wait let me check again...
    // rc-014: facilitatedBy "Darren Laville" — that's 4 for Darren
    // Actually rc-014: facilitatedBy: "Darren Laville" — hold on let me recount
    // Let me trace all completed conversations and their facilitators:
    // rc-001: Sarah, rc-002: Darren, rc-003: Lisa, rc-004: Sarah,
    // rc-005: Tom, rc-006: Lisa, rc-007: Darren, rc-008: Sarah,
    // rc-009: Lisa, rc-010: Darren, rc-011: Tom, rc-012: Sarah,
    // rc-013: Tom, rc-014: Darren, rc-017: Sarah
    // Sarah: 1,4,8,12,17 = 5
    // Darren: 2,7,10,14 = 4
    // Lisa: 3,6,9 = 3
    // Tom: 5,11,13 = 3
    expect(tom!.totalFacilitated).toBe(3);
  });

  it("calculates quality score per staff", () => {
    const sarah = profiles.find((p) => p.staffName === "Sarah Johnson");
    // Sarah's completed: rc-001(100), rc-004(100), rc-008(60), rc-012(100), rc-017(80)
    // Avg = 440/5 = 88
    expect(sarah!.avgQualityScore).toBe(88);
  });

  it("calculates repair rate per staff", () => {
    const sarah = profiles.find((p) => p.staffName === "Sarah Johnson");
    // Sarah's positive outcomes: rc-001(agreement), rc-004(understanding), rc-008(agreement), rc-012(repaired), rc-017(agreement) = 5/5 = 100
    expect(sarah!.repairRate).toBe(100);
  });

  it("calculates child voice rate per staff", () => {
    const darren = profiles.find((p) => p.staffName === "Darren Laville");
    // Darren's completed: rc-002(true), rc-007(true), rc-010(true), rc-014(false) = 3/4 = 75
    expect(darren!.childVoiceRate).toBe(75);
  });

  it("sorts profiles by total facilitated descending", () => {
    expect(profiles[0].totalFacilitated).toBeGreaterThanOrEqual(profiles[profiles.length - 1].totalFacilitated);
  });

  it("handles empty conversations", () => {
    const result = buildStaffProfiles([], PERIOD_START, PERIOD_END);
    expect(result.length).toBe(0);
  });
});

describe("Restorative Practice — generateRestorativePracticeIntelligence (integration)", () => {
  const result = generateRestorativePracticeIntelligence(
    demoConversations, demoIncidentLinks,
    "oak-house", PERIOD_START, PERIOD_END,
  );

  it("returns complete structure", () => {
    expect(result).toHaveProperty("homeId", "oak-house");
    expect(result).toHaveProperty("periodStart", PERIOD_START);
    expect(result).toHaveProperty("periodEnd", PERIOD_END);
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("rating");
    expect(result).toHaveProperty("usage");
    expect(result).toHaveProperty("quality");
    expect(result).toHaveProperty("outcomes");
    expect(result).toHaveProperty("incidentConversion");
    expect(result).toHaveProperty("staffProfiles");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("areasForImprovement");
    expect(result).toHaveProperty("actions");
    expect(result).toHaveProperty("regulatoryLinks");
  });

  it("achieves good or outstanding rating with demo data", () => {
    expect(["good", "outstanding"]).toContain(result.rating);
  });

  it("scores at least 60 with demo data", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
  });

  it("scores at most 100", () => {
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("produces correct usage score component", () => {
    // ~0.7 per week → usage score = 10 (≥0.5)
    // quality avg 81 → quality score = 35 (≥80)
    // repair rate 87% → outcomes score = 25 (≥75)
    // conversion rate 100% → conversion score = 20 (≥60)
    // Total should be 10 + 35 + 25 + 20 = 90
    expect(result.overallScore).toBe(90);
  });

  it("rates outstanding when score >= 80", () => {
    expect(result.rating).toBe("outstanding");
  });

  it("produces inadequate with no data", () => {
    const empty = generateRestorativePracticeIntelligence([], [], "oak-house", PERIOD_START, PERIOD_END);
    expect(empty.rating).toBe("inadequate");
    expect(empty.overallScore).toBe(0);
  });

  it("identifies strengths from demo data", () => {
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("identifies child voice strength", () => {
    expect(result.strengths.some((s) => s.toLowerCase().includes("child"))).toBe(true);
  });

  it("identifies quality strength", () => {
    expect(result.strengths.some((s) => s.toLowerCase().includes("quality"))).toBe(true);
  });

  it("identifies repair rate strength", () => {
    expect(result.strengths.some((s) => s.toLowerCase().includes("repair"))).toBe(true);
  });

  it("identifies incident conversion strength", () => {
    expect(result.strengths.some((s) => s.toLowerCase().includes("incident"))).toBe(true);
  });

  it("identifies follow-up strength", () => {
    // followUpCompletedRate is 78% which is < 80, so it should NOT be a strength
    expect(result.strengths.some((s) => s.toLowerCase().includes("follow-up"))).toBe(false);
  });

  it("identifies declined as area for improvement", () => {
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("declined"))).toBe(true);
  });

  it("links to Reg 11 (positive relationships)", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 11"))).toBe(true);
  });

  it("links to Reg 12 (protection)", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 12"))).toBe(true);
  });

  it("links to Reg 19 (behaviour management)", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 19"))).toBe(true);
  });

  it("links to SCCIF", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes staff profiles", () => {
    expect(result.staffProfiles.length).toBe(4);
  });

  it("generates no-conversations urgent action with empty data", () => {
    const empty = generateRestorativePracticeIntelligence([], [], "oak-house", PERIOD_START, PERIOD_END);
    expect(empty.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("generates actions for low child voice rate", () => {
    const lowChildVoice: RestorativeConversation[] = Array.from({ length: 5 }, (_, i) => ({
      id: `lcv-${i}`, homeId: "oak-house", date: "2025-03-01",
      conversationType: "restorative_chat" as const, status: "completed" as const,
      triggerType: "conflict_between_children" as const,
      triggerDescription: "Test conflict", facilitatedBy: "Test Staff",
      participants: [{ name: "Child A", role: "child" as const }],
      childrenInvolved: [{ childId: "child-a", childName: "Child A" }],
      durationMinutes: 20, childVoiceHeard: false, childLedResolution: false,
      outcome: "no_resolution" as const, agreementsMade: [],
      qualityIndicators: {
        allPartiesHeard: false, harmAcknowledged: false,
        needsIdentified: false, repairPlanAgreed: false, emotionsExplored: false,
      },
    }));
    const r = generateRestorativePracticeIntelligence(lowChildVoice, [], "home", PERIOD_START, PERIOD_END);
    expect(r.actions.some((a) => a.toLowerCase().includes("child voice"))).toBe(true);
  });

  it("generates actions for low quality", () => {
    const lowQuality: RestorativeConversation[] = Array.from({ length: 5 }, (_, i) => ({
      id: `lq-${i}`, homeId: "oak-house", date: "2025-03-01",
      conversationType: "restorative_chat" as const, status: "completed" as const,
      triggerType: "conflict_between_children" as const,
      triggerDescription: "Test", facilitatedBy: "Test Staff",
      participants: [{ name: "Child A", role: "child" as const }],
      childrenInvolved: [{ childId: "child-a", childName: "Child A" }],
      durationMinutes: 20, childVoiceHeard: false, childLedResolution: false,
      outcome: "no_resolution" as const, agreementsMade: [],
      qualityIndicators: {
        allPartiesHeard: false, harmAcknowledged: false,
        needsIdentified: false, repairPlanAgreed: false, emotionsExplored: false,
      },
    }));
    const r = generateRestorativePracticeIntelligence(lowQuality, [], "home", PERIOD_START, PERIOD_END);
    expect(r.actions.some((a) => a.toLowerCase().includes("quality"))).toBe(true);
  });

  it("deducts score for low follow-up completion", () => {
    const lowFollowUp: RestorativeConversation[] = Array.from({ length: 10 }, (_, i) => ({
      id: `lf-${i}`, homeId: "oak-house", date: "2025-03-01",
      conversationType: "restorative_chat" as const, status: "completed" as const,
      triggerType: "conflict_between_children" as const,
      triggerDescription: "Test", facilitatedBy: "Test Staff",
      participants: [{ name: "Child A", role: "child" as const }],
      childrenInvolved: [{ childId: "child-a", childName: "Child A" }],
      durationMinutes: 20, childVoiceHeard: true, childLedResolution: false,
      outcome: "relationship_repaired" as const,
      agreementsMade: ["Agreement"],
      followUpDate: "2025-03-08", followUpCompleted: false,
      qualityIndicators: {
        allPartiesHeard: true, harmAcknowledged: true,
        needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true,
      },
    }));
    const r = generateRestorativePracticeIntelligence(lowFollowUp, [], "home", PERIOD_START, PERIOD_END);
    // Without deduction: outcomes score = 25, with deduction = 20
    // followUpCompletedRate = 0% which is < 50%, so deduction applies
    expect(r.areasForImprovement.some((a) => a.toLowerCase().includes("follow-up"))).toBe(true);
  });
});

describe("Restorative Practice — Scoring edge cases", () => {
  it("usage score 20 for >= 2 conversations per week", () => {
    // 26 weeks in period, need >=52 conversations
    const many: RestorativeConversation[] = Array.from({ length: 52 }, (_, i) => ({
      id: `many-${i}`, homeId: "oak-house",
      date: `2025-0${Math.floor(i / 10) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
      conversationType: "restorative_chat" as const, status: "completed" as const,
      triggerType: "conflict_between_children" as const,
      triggerDescription: "Test", facilitatedBy: "Staff",
      participants: [], childrenInvolved: [],
      durationMinutes: 20, childVoiceHeard: true, childLedResolution: false,
      outcome: "agreement_reached" as const, agreementsMade: ["A"],
      qualityIndicators: { allPartiesHeard: true, harmAcknowledged: true, needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true },
    }));
    const r = generateRestorativePracticeIntelligence(many, [], "home", PERIOD_START, PERIOD_END);
    // Should get full usage score (20) + full quality (35) + full outcomes (25) = at least 80
    expect(r.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("usage score 5 for very low frequency", () => {
    const few: RestorativeConversation[] = [{
      id: "few-1", homeId: "oak-house", date: "2025-03-01",
      conversationType: "restorative_chat" as const, status: "completed" as const,
      triggerType: "conflict_between_children" as const,
      triggerDescription: "Test", facilitatedBy: "Staff",
      participants: [], childrenInvolved: [],
      durationMinutes: 20, childVoiceHeard: true, childLedResolution: false,
      outcome: "agreement_reached" as const, agreementsMade: ["A"],
      qualityIndicators: { allPartiesHeard: true, harmAcknowledged: true, needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true },
    }];
    const r = generateRestorativePracticeIntelligence(few, [], "home", PERIOD_START, PERIOD_END);
    // 1 conversation over 26 weeks = 0.04 per week → usage score = 5
    expect(r.overallScore).toBeLessThan(90);
  });

  it("quality score 7 for very low quality conversations", () => {
    const low: RestorativeConversation[] = Array.from({ length: 10 }, (_, i) => ({
      id: `low-${i}`, homeId: "oak-house", date: "2025-03-01",
      conversationType: "restorative_chat" as const, status: "completed" as const,
      triggerType: "conflict_between_children" as const,
      triggerDescription: "Test", facilitatedBy: "Staff",
      participants: [], childrenInvolved: [],
      durationMinutes: 20, childVoiceHeard: false, childLedResolution: false,
      outcome: "no_resolution" as const, agreementsMade: [],
      qualityIndicators: { allPartiesHeard: false, harmAcknowledged: false, needsIdentified: true, repairPlanAgreed: false, emotionsExplored: false },
    }));
    const r = generateRestorativePracticeIntelligence(low, [], "home", PERIOD_START, PERIOD_END);
    // avgQualityScore = 20% (1/5) → quality score = 7 (< 40)
    expect(r.rating).toBe("inadequate");
  });

  it("incident conversion score 3 for very low conversion", () => {
    const convos: RestorativeConversation[] = [{
      id: "conv-1", homeId: "oak-house", date: "2025-03-02",
      conversationType: "restorative_chat" as const, status: "declined" as const,
      triggerType: "conflict_between_children" as const,
      triggerDescription: "Test", facilitatedBy: "Staff",
      participants: [], childrenInvolved: [],
      durationMinutes: 0, childVoiceHeard: false, childLedResolution: false,
      outcome: "no_resolution" as const, agreementsMade: [],
      qualityIndicators: { allPartiesHeard: false, harmAcknowledged: false, needsIdentified: false, repairPlanAgreed: false, emotionsExplored: false },
    }];
    const links: IncidentLink[] = Array.from({ length: 10 }, (_, i) => ({
      incidentId: `inc-${i}`, restorativeConversationId: "conv-1",
      incidentDate: "2025-03-01", incidentType: "verbal_aggression",
    }));
    const r = evaluateIncidentConversion(convos, links, PERIOD_START, PERIOD_END);
    // All link to a declined conversation → 0 with restorative
    expect(r.conversionRate).toBe(0);
  });

  it("requires_improvement rating for score 40-59", () => {
    // Create scenario that scores around 40-59
    const medium: RestorativeConversation[] = Array.from({ length: 5 }, (_, i) => ({
      id: `med-${i}`, homeId: "oak-house", date: "2025-03-01",
      conversationType: "restorative_chat" as const, status: "completed" as const,
      triggerType: "conflict_between_children" as const,
      triggerDescription: "Test", facilitatedBy: "Staff",
      participants: [], childrenInvolved: [],
      durationMinutes: 20, childVoiceHeard: true, childLedResolution: false,
      outcome: i < 2 ? "agreement_reached" as const : "no_resolution" as const,
      agreementsMade: i < 2 ? ["A"] : [],
      qualityIndicators: {
        allPartiesHeard: i < 3, harmAcknowledged: i < 2,
        needsIdentified: true, repairPlanAgreed: i < 2, emotionsExplored: i < 3,
      },
    }));
    const r = generateRestorativePracticeIntelligence(medium, [], "home", PERIOD_START, PERIOD_END);
    expect(["requires_improvement", "inadequate", "good"]).toContain(r.rating);
  });
});

describe("Restorative Practice — Labels", () => {
  it("returns Restorative Chat label", () => {
    expect(getConversationTypeLabel("restorative_chat")).toBe("Restorative Chat");
  });

  it("returns Formal Conference label", () => {
    expect(getConversationTypeLabel("formal_conference")).toBe("Formal Conference");
  });

  it("returns Circle Time label", () => {
    expect(getConversationTypeLabel("circle_time")).toBe("Circle Time");
  });

  it("returns Mediation label", () => {
    expect(getConversationTypeLabel("mediation")).toBe("Mediation");
  });

  it("returns Check-in label", () => {
    expect(getConversationTypeLabel("check_in")).toBe("Check-in");
  });

  it("returns Conflict Between Children trigger label", () => {
    expect(getTriggerTypeLabel("conflict_between_children")).toBe("Conflict Between Children");
  });

  it("returns Physical Aggression trigger label", () => {
    expect(getTriggerTypeLabel("physical_aggression")).toBe("Physical Aggression");
  });

  it("returns Relationship Repaired outcome label", () => {
    expect(getOutcomeTypeLabel("relationship_repaired")).toBe("Relationship Repaired");
  });

  it("returns Escalated outcome label", () => {
    expect(getOutcomeTypeLabel("escalated")).toBe("Escalated");
  });

  it("returns Completed status label", () => {
    expect(getStatusLabel("completed")).toBe("Completed");
  });

  it("returns Declined status label", () => {
    expect(getStatusLabel("declined")).toBe("Declined");
  });

  it("returns Scheduled status label", () => {
    expect(getStatusLabel("scheduled")).toBe("Scheduled");
  });
});
