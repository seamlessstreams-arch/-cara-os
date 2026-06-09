// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Restorative Practice Intelligence API Route
//
// GET  → returns Chamberlain House demo intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateRestorativePracticeIntelligence } from "@/lib/restorative-practice/restorative-practice-engine";
import type { RestorativeConversation, IncidentLink } from "@/lib/restorative-practice/restorative-practice-engine";

// ── Chamberlain House Demo Data ──────────────────────────────────────────────────────

function getDemoData(): {
  conversations: RestorativeConversation[];
  incidentLinks: IncidentLink[];
} {
  const conversations: RestorativeConversation[] = [
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
      durationMinutes: 25, childVoiceHeard: true, childLedResolution: false,
      outcome: "agreement_reached",
      agreementsMade: ["Take turns choosing TV programmes", "Use words not shouting when frustrated"],
      followUpDate: "2025-01-17", followUpCompleted: true,
      qualityIndicators: { allPartiesHeard: true, harmAcknowledged: true, needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true },
    },
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
      durationMinutes: 45, childVoiceHeard: true, childLedResolution: false,
      outcome: "relationship_repaired",
      agreementsMade: ["Morgan to apologise directly to Alex", "Both to work on chore rota together", "Check-in after one week"],
      followUpDate: "2025-01-29", followUpCompleted: true,
      qualityIndicators: { allPartiesHeard: true, harmAcknowledged: true, needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true },
    },
    {
      id: "rc-003", homeId: "oak-house", date: "2025-02-05",
      conversationType: "circle_time", status: "completed",
      triggerType: "community_issue",
      triggerDescription: "General tension about shared spaces and tidiness",
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
      durationMinutes: 30, childVoiceHeard: true, childLedResolution: true,
      outcome: "agreement_reached",
      agreementsMade: ["Weekly house meeting to discuss shared space issues", "Cleaning rota agreed by young people"],
      followUpDate: "2025-02-12", followUpCompleted: true,
      qualityIndicators: { allPartiesHeard: true, harmAcknowledged: false, needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true },
    },
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
      childrenInvolved: [{ childId: "child-jordan", childName: "Jordan" }],
      durationMinutes: 35, childVoiceHeard: true, childLedResolution: false,
      outcome: "understanding_improved",
      agreementsMade: ["Tom to explain reasons behind rules more clearly", "Jordan to raise concerns calmly first"],
      followUpDate: "2025-02-21", followUpCompleted: false,
      qualityIndicators: { allPartiesHeard: true, harmAcknowledged: true, needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true },
    },
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
      childrenInvolved: [{ childId: "child-alex", childName: "Alex" }],
      durationMinutes: 20, childVoiceHeard: true, childLedResolution: false,
      outcome: "understanding_improved",
      agreementsMade: ["Alex to help repair the door with staff", "Staff to offer co-regulation when Alex is dysregulated"],
      qualityIndicators: { allPartiesHeard: true, harmAcknowledged: true, needsIdentified: true, repairPlanAgreed: true, emotionsExplored: false },
    },
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
      childrenInvolved: [{ childId: "child-morgan", childName: "Morgan" }],
      durationMinutes: 15, childVoiceHeard: true, childLedResolution: true,
      outcome: "understanding_improved",
      agreementsMade: ["Morgan to write in journal when feelings are big", "Staff to check in before and after contact sessions"],
      qualityIndicators: { allPartiesHeard: true, harmAcknowledged: false, needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true },
    },
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
      durationMinutes: 40, childVoiceHeard: true, childLedResolution: false,
      outcome: "relationship_repaired",
      agreementsMade: ["Alex to apologise to Morgan", "Both to agree on respectful language", "Safe word system for when things get heated"],
      followUpDate: "2025-03-22", followUpCompleted: true,
      qualityIndicators: { allPartiesHeard: true, harmAcknowledged: true, needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true },
    },
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
      durationMinutes: 25, childVoiceHeard: true, childLedResolution: true,
      outcome: "agreement_reached",
      agreementsMade: ["Revised kitchen hours agreed by all", "Snack box prepared each evening"],
      followUpDate: "2025-04-01", followUpCompleted: true,
      qualityIndicators: { allPartiesHeard: true, harmAcknowledged: false, needsIdentified: true, repairPlanAgreed: true, emotionsExplored: false },
    },
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
      childrenInvolved: [{ childId: "child-jordan", childName: "Jordan" }],
      durationMinutes: 30, childVoiceHeard: true, childLedResolution: false,
      outcome: "relationship_repaired",
      agreementsMade: ["Tom acknowledged Jordan's feelings", "Jordan agreed to give Tom another chance", "Weekly check-in between Jordan and Tom"],
      followUpDate: "2025-04-09", followUpCompleted: true,
      qualityIndicators: { allPartiesHeard: true, harmAcknowledged: true, needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true },
    },
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
      childrenInvolved: [{ childId: "child-alex", childName: "Alex" }],
      durationMinutes: 60, childVoiceHeard: true, childLedResolution: false,
      outcome: "relationship_repaired",
      agreementsMade: ["All young people welcome Alex back", "Phased return plan for first 48 hours", "Daily check-ins with key worker"],
      followUpDate: "2025-04-17", followUpCompleted: true,
      qualityIndicators: { allPartiesHeard: true, harmAcknowledged: true, needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true },
    },
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
      durationMinutes: 15, childVoiceHeard: true, childLedResolution: true,
      outcome: "agreement_reached",
      agreementsMade: ["Gaming schedule agreed between young people"],
      qualityIndicators: { allPartiesHeard: true, harmAcknowledged: false, needsIdentified: true, repairPlanAgreed: true, emotionsExplored: false },
    },
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
      childrenInvolved: [{ childId: "child-morgan", childName: "Morgan" }],
      durationMinutes: 30, childVoiceHeard: true, childLedResolution: true,
      outcome: "relationship_repaired",
      agreementsMade: ["Lisa to set aside dedicated time for school discussions", "Morgan to flag concerns in weekly key-work sessions"],
      followUpDate: "2025-05-12", followUpCompleted: false,
      qualityIndicators: { allPartiesHeard: true, harmAcknowledged: true, needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true },
    },
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
      childrenInvolved: [{ childId: "child-alex", childName: "Alex" }],
      durationMinutes: 20, childVoiceHeard: true, childLedResolution: false,
      outcome: "partial_resolution",
      agreementsMade: ["Alex to use calming strategies before reacting"],
      qualityIndicators: { allPartiesHeard: true, harmAcknowledged: false, needsIdentified: true, repairPlanAgreed: false, emotionsExplored: true },
    },
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
      durationMinutes: 40, childVoiceHeard: false, childLedResolution: false,
      outcome: "escalated",
      agreementsMade: [],
      qualityIndicators: { allPartiesHeard: false, harmAcknowledged: false, needsIdentified: true, repairPlanAgreed: false, emotionsExplored: false },
    },
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
      durationMinutes: 0, childVoiceHeard: false, childLedResolution: false,
      outcome: "further_action_needed",
      agreementsMade: [],
      qualityIndicators: { allPartiesHeard: false, harmAcknowledged: false, needsIdentified: false, repairPlanAgreed: false, emotionsExplored: false },
    },
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
      childrenInvolved: [{ childId: "child-alex", childName: "Alex" }],
      durationMinutes: 0, childVoiceHeard: false, childLedResolution: false,
      outcome: "no_resolution",
      agreementsMade: [],
      qualityIndicators: { allPartiesHeard: false, harmAcknowledged: false, needsIdentified: false, repairPlanAgreed: false, emotionsExplored: false },
    },
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
      durationMinutes: 35, childVoiceHeard: true, childLedResolution: true,
      outcome: "agreement_reached",
      agreementsMade: ["Summer activity plan agreed", "Boundaries for outings agreed by children", "Regular review of summer plan"],
      qualityIndicators: { allPartiesHeard: true, harmAcknowledged: false, needsIdentified: true, repairPlanAgreed: true, emotionsExplored: true },
    },
  ];

  const incidentLinks: IncidentLink[] = [
    { incidentId: "inc-001", restorativeConversationId: "rc-002", incidentDate: "2025-01-21", incidentType: "physical_aggression" },
    { incidentId: "inc-002", restorativeConversationId: "rc-005", incidentDate: "2025-02-27", incidentType: "property_damage" },
    { incidentId: "inc-003", restorativeConversationId: "rc-007", incidentDate: "2025-03-14", incidentType: "verbal_aggression" },
    { incidentId: "inc-004", restorativeConversationId: "rc-010", incidentDate: "2025-04-13", incidentType: "physical_aggression" },
    { incidentId: "inc-005", restorativeConversationId: "rc-014", incidentDate: "2025-05-29", incidentType: "verbal_aggression" },
  ];

  return { conversations, incidentLinks };
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { conversations, incidentLinks } = getDemoData();
    const result = generateRestorativePracticeIntelligence(
      conversations,
      incidentLinks,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate restorative practice intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conversations, incidentLinks, homeId, periodStart, periodEnd } = body;

    if (!conversations || !incidentLinks || !homeId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Missing required fields: conversations, incidentLinks, homeId, periodStart, periodEnd" },
        { status: 400 },
      );
    }

    if (!Array.isArray(conversations) || !Array.isArray(incidentLinks)) {
      return NextResponse.json(
        { error: "conversations and incidentLinks must be arrays" },
        { status: 400 },
      );
    }

    const result = generateRestorativePracticeIntelligence(
      conversations,
      incidentLinks,
      homeId,
      periodStart,
      periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process restorative practice data", details: String(error) },
      { status: 500 },
    );
  }
}
