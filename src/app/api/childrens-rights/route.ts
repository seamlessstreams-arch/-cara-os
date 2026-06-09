// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Children's Rights & Advocacy Intelligence API Route
//
// GET  → returns Chamberlain House demo children's rights intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateChildrensRightsIntelligence } from "@/lib/childrens-rights/childrens-rights-engine";
import type {
  ChildrensGuide,
  AdvocacyRecord,
  RightsAwarenessAssessment,
  ParticipationRecord,
  ComplaintAccessRecord,
  FeedbackRecord,
} from "@/lib/childrens-rights/childrens-rights-engine";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

const CHILD_IDS = ["alex", "jordan", "morgan"];
const CHILD_NAMES: Record<string, string> = {
  alex: "Alex",
  jordan: "Jordan",
  morgan: "Morgan",
};

function getDemoData() {
  const guides: ChildrensGuide[] = [
    { id: "guide-01", childId: "alex", childName: "Alex", providedDate: "2025-01-15", lastUpdatedDate: "2025-04-01", status: "current", ageAppropriate: true, accessibleFormat: true, coversComplaints: true, coversAdvocacy: true, coversRights: true, coversOfstedContact: true, childConfirmedUnderstanding: true, reviewDate: "2025-07-01" },
    { id: "guide-02", childId: "jordan", childName: "Jordan", providedDate: "2025-02-01", lastUpdatedDate: "2025-02-01", status: "current", ageAppropriate: true, accessibleFormat: true, coversComplaints: true, coversAdvocacy: true, coversRights: true, coversOfstedContact: true, childConfirmedUnderstanding: true, reviewDate: "2025-08-01" },
    { id: "guide-03", childId: "morgan", childName: "Morgan", providedDate: "2024-06-01", lastUpdatedDate: "2024-06-01", status: "needs_update", ageAppropriate: false, accessibleFormat: true, coversComplaints: true, coversAdvocacy: false, coversRights: true, coversOfstedContact: false, childConfirmedUnderstanding: false, reviewDate: "2025-01-01" },
  ];

  const advocacy: AdvocacyRecord[] = [
    { id: "adv-01", childId: "alex", childName: "Alex", advocacyType: "independent_advocate", status: "active", offeredDate: "2025-01-20", engagedDate: "2025-02-01", reason: "Advocacy for LAC review", childSatisfied: true },
    { id: "adv-02", childId: "jordan", childName: "Jordan", advocacyType: "nyas", status: "active", offeredDate: "2025-03-01", engagedDate: "2025-03-15", reason: "Support with education complaints", childSatisfied: true },
    { id: "adv-03", childId: "morgan", childName: "Morgan", advocacyType: "ofsted_contact", status: "completed", offeredDate: "2025-01-10", engagedDate: "2025-01-12", completedDate: "2025-02-01", reason: "Placement concerns", outcome: "Concern addressed", childSatisfied: true },
  ];

  const awareness: RightsAwarenessAssessment[] = [
    { id: "aware-01", childId: "alex", childName: "Alex", assessmentDate: "2025-03-01", assessedBy: "Tom Richards", rightsUnderstood: ["know_your_rights", "complaints_process", "advocacy_access", "participation_in_decisions", "privacy", "contact_with_family", "education", "health", "leisure_and_play", "protection_from_harm"], rightsNotUnderstood: ["cultural_identity", "freedom_of_expression"], actionsPlanned: ["Discuss cultural identity in key worker sessions"], followUpDate: "2025-06-01" },
    { id: "aware-02", childId: "jordan", childName: "Jordan", assessmentDate: "2025-03-15", assessedBy: "Lisa Williams", rightsUnderstood: ["know_your_rights", "complaints_process", "advocacy_access", "participation_in_decisions", "privacy", "education", "health", "cultural_identity", "leisure_and_play", "freedom_of_expression", "protection_from_harm"], rightsNotUnderstood: ["contact_with_family"], actionsPlanned: ["Explore contact rights"], followUpDate: "2025-06-15" },
    { id: "aware-03", childId: "morgan", childName: "Morgan", assessmentDate: "2025-02-01", assessedBy: "Sarah Johnson", rightsUnderstood: ["know_your_rights", "complaints_process", "privacy", "education", "health", "protection_from_harm"], rightsNotUnderstood: ["advocacy_access", "participation_in_decisions", "contact_with_family", "cultural_identity", "leisure_and_play", "freedom_of_expression"], actionsPlanned: ["Rights awareness sessions", "Advocacy introduction session"], followUpDate: "2025-05-01" },
  ];

  const participation: ParticipationRecord[] = [
    { id: "part-01", childId: "alex", childName: "Alex", date: "2025-03-10", decisionArea: "Bedroom decoration", participationLevel: "child_led", childViewRecorded: true, viewInfluencedOutcome: true, feedbackMechanism: "key_worker_session" },
    { id: "part-02", childId: "alex", childName: "Alex", date: "2025-04-15", decisionArea: "Education placement", participationLevel: "shared_decision", childViewRecorded: true, viewInfluencedOutcome: true, feedbackMechanism: "review_meeting" },
    { id: "part-03", childId: "jordan", childName: "Jordan", date: "2025-03-20", decisionArea: "Activity schedule", participationLevel: "shared_decision", childViewRecorded: true, viewInfluencedOutcome: true, feedbackMechanism: "house_meeting" },
    { id: "part-04", childId: "jordan", childName: "Jordan", date: "2025-05-10", decisionArea: "Pocket money", participationLevel: "child_led", childViewRecorded: true, viewInfluencedOutcome: true, feedbackMechanism: "key_worker_session" },
    { id: "part-05", childId: "morgan", childName: "Morgan", date: "2025-03-25", decisionArea: "Care plan review", participationLevel: "consulted", childViewRecorded: true, viewInfluencedOutcome: false, feedbackMechanism: "review_meeting" },
  ];

  const complaintAccess: ComplaintAccessRecord[] = [
    { id: "comp-01", childId: "alex", childName: "Alex", date: "2025-03-01", knowsHowToComplain: true, feelsAbleToComplain: true, complaintsFormAccessible: true, advocacyOfferedIfNeeded: true },
    { id: "comp-02", childId: "jordan", childName: "Jordan", date: "2025-03-15", knowsHowToComplain: true, feelsAbleToComplain: true, complaintsFormAccessible: true, advocacyOfferedIfNeeded: true },
    { id: "comp-03", childId: "morgan", childName: "Morgan", date: "2025-02-01", knowsHowToComplain: true, feelsAbleToComplain: false, complaintsFormAccessible: true, advocacyOfferedIfNeeded: false, barrierIdentified: "Feels complaints won't be taken seriously" },
  ];

  const feedback: FeedbackRecord[] = [
    { id: "fb-01", childId: "alex", childName: "Alex", date: "2025-03-10", mechanism: "house_meeting", feedbackGiven: "Wants later bedtime at weekends", acknowledged: true, actionTaken: "Weekend bedtime extended", outcomeSharedWithChild: true, childSatisfied: true },
    { id: "fb-02", childId: "jordan", childName: "Jordan", date: "2025-03-20", mechanism: "key_worker_session", feedbackGiven: "Doesn't like Tuesday menu", acknowledged: true, actionTaken: "Menu reviewed", outcomeSharedWithChild: true, childSatisfied: true },
    { id: "fb-03", childId: "morgan", childName: "Morgan", date: "2025-04-01", mechanism: "reg44_visit", feedbackGiven: "Feels listened to most of the time", acknowledged: true, outcomeSharedWithChild: true },
    { id: "fb-04", childId: "morgan", childName: "Morgan", date: "2025-05-15", mechanism: "key_worker_session", feedbackGiven: "Would like university visit", acknowledged: true, actionTaken: "Visit scheduled", outcomeSharedWithChild: true, childSatisfied: true },
  ];

  return { guides, advocacy, awareness, participation, complaintAccess, feedback };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { guides, advocacy, awareness, participation, complaintAccess, feedback } = getDemoData();
    const referenceDate = new Date().toISOString().split("T")[0];
    const result = generateChildrensRightsIntelligence(
      guides, advocacy, awareness, participation, complaintAccess, feedback,
      CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30", referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate children's rights intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      guides, advocacy, awareness, participation, complaintAccess, feedback,
      childIds, childNames, homeId, periodStart, periodEnd, referenceDate,
    } = body;

    if (!guides || !advocacy || !awareness || !participation || !complaintAccess || !feedback || !childIds || !childNames || !homeId || !periodStart || !periodEnd || !referenceDate) {
      return NextResponse.json(
        { error: "Missing required fields: guides, advocacy, awareness, participation, complaintAccess, feedback, childIds, childNames, homeId, periodStart, periodEnd, referenceDate" },
        { status: 400 },
      );
    }

    if (!Array.isArray(guides) || !Array.isArray(advocacy) || !Array.isArray(awareness) || !Array.isArray(participation) || !Array.isArray(complaintAccess) || !Array.isArray(feedback) || !Array.isArray(childIds)) {
      return NextResponse.json(
        { error: "guides, advocacy, awareness, participation, complaintAccess, feedback, and childIds must be arrays" },
        { status: 400 },
      );
    }

    const result = generateChildrensRightsIntelligence(
      guides, advocacy, awareness, participation, complaintAccess, feedback,
      childIds, childNames, homeId, periodStart, periodEnd, referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process children's rights data", details: String(error) },
      { status: 500 },
    );
  }
}
