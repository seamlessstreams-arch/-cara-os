// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Attachment & Relationships API Route
//
// GET  → returns Chamberlain House demo attachment/relationships intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateAttachmentRelationshipsIntelligence } from "@/lib/attachment-relationships/attachment-relationships-engine";
import type {
  AttachmentAssessment,
  RelationshipRecord,
  RelationshipInteraction,
  StabilityIndicator,
  PeerRelationship,
} from "@/lib/attachment-relationships/attachment-relationships-engine";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const assessments: AttachmentAssessment[] = [
    { id: "aa-01", homeId: "oak-house", childId: "child-alex", childName: "Alex", assessmentDate: "2025-03-01", assessor: "Dr Karen Thompson", assessorRole: "psychologist", attachmentStyle: "anxious_ambivalent", previousStyle: "disorganised", strengthAreas: ["Responds to consistent caregivers", "Seeks comfort when distressed"], vulnerabilityAreas: ["Separation anxiety", "Hypervigilance"], therapeuticRecommendations: ["PACE approach", "DDP-informed key work"], informedCareApproach: true, sharedWithTeam: true, reviewDate: "2025-09-01" },
    { id: "aa-02", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", assessmentDate: "2025-02-15", assessor: "Dr Karen Thompson", assessorRole: "psychologist", attachmentStyle: "secure", strengthAreas: ["Trusts caregivers", "Good peer relationships", "Seeks help appropriately"], vulnerabilityAreas: [], therapeuticRecommendations: ["Continue current approach"], informedCareApproach: true, sharedWithTeam: true, reviewDate: "2025-08-15" },
    { id: "aa-03", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", assessmentDate: "2025-04-01", assessor: "Dr Karen Thompson", assessorRole: "psychologist", attachmentStyle: "anxious_avoidant", previousStyle: "disorganised", strengthAreas: ["Independent", "Creative interests"], vulnerabilityAreas: ["Avoids emotional closeness", "Masks distress", "Difficulty trusting adults"], therapeuticRecommendations: ["Gradual trust-building", "Non-verbal connection activities"], informedCareApproach: true, sharedWithTeam: true, reviewDate: "2025-10-01" },
  ];

  const relationships: RelationshipRecord[] = [
    { id: "rel-01", homeId: "oak-house", childId: "child-alex", childName: "Alex", personId: "s-01", personName: "Sarah Johnson", relationshipType: "key_worker", quality: "strong", trend: "strengthening", startDate: "2025-01-15", lastReviewDate: "2025-05-01", trustScore: 8, consistencyScore: 9, childRating: 8, notes: "Strong bond, Alex seeks Sarah out when distressed" },
    { id: "rel-02", homeId: "oak-house", childId: "child-alex", childName: "Alex", personId: "s-02", personName: "Tom Richards", relationshipType: "staff_member", quality: "developing", trend: "strengthening", startDate: "2025-02-01", lastReviewDate: "2025-05-01", trustScore: 6, consistencyScore: 7, childRating: 7, notes: "Growing connection through shared activities" },
    { id: "rel-03", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", personId: "s-02", personName: "Tom Richards", relationshipType: "key_worker", quality: "strong", trend: "stable", startDate: "2025-01-10", lastReviewDate: "2025-05-01", trustScore: 9, consistencyScore: 9, childRating: 9, notes: "Excellent rapport, Jordan describes Tom as 'like a big brother'" },
    { id: "rel-04", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", personId: "s-03", personName: "Lisa Williams", relationshipType: "secondary_key_worker", quality: "strong", trend: "stable", startDate: "2025-01-10", lastReviewDate: "2025-05-01", trustScore: 8, consistencyScore: 8, childRating: 8, notes: "Consistent support, particularly for education" },
    { id: "rel-05", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", personId: "s-03", personName: "Lisa Williams", relationshipType: "key_worker", quality: "developing", trend: "strengthening", startDate: "2025-02-01", lastReviewDate: "2025-05-01", trustScore: 5, consistencyScore: 6, childRating: 5, notes: "Morgan is beginning to seek Lisa out — significant progress" },
    { id: "rel-06", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", personId: "s-04", personName: "Darren Laville", relationshipType: "staff_member", quality: "developing", trend: "stable", startDate: "2025-01-15", lastReviewDate: "2025-05-01", trustScore: 6, consistencyScore: 7, childRating: 6, notes: "Morgan responds to Darren's calm approach" },
  ];

  const interactions: RelationshipInteraction[] = [
    { id: "int-01", homeId: "oak-house", childId: "child-alex", childName: "Alex", staffId: "s-01", staffName: "Sarah Johnson", date: "2025-04-01", context: "key_work_session", durationMins: 45, qualityRating: 8, childInitiated: false, positiveIndicators: ["Made eye contact", "Shared feelings about school"], concernIndicators: [], attachmentRelevant: true, regulationSupport: true },
    { id: "int-02", homeId: "oak-house", childId: "child-alex", childName: "Alex", staffId: "s-01", staffName: "Sarah Johnson", date: "2025-04-08", context: "daily_living", durationMins: 20, qualityRating: 7, childInitiated: true, positiveIndicators: ["Sought Sarah for morning routine"], concernIndicators: [], attachmentRelevant: true, regulationSupport: false },
    { id: "int-03", homeId: "oak-house", childId: "child-alex", childName: "Alex", staffId: "s-02", staffName: "Tom Richards", date: "2025-04-15", context: "activity", durationMins: 60, qualityRating: 8, childInitiated: false, positiveIndicators: ["Relaxed", "Laughing"], concernIndicators: [], attachmentRelevant: false, regulationSupport: false },
    { id: "int-04", homeId: "oak-house", childId: "child-alex", childName: "Alex", staffId: "s-01", staffName: "Sarah Johnson", date: "2025-05-01", context: "crisis_support", durationMins: 30, qualityRating: 9, childInitiated: true, positiveIndicators: ["Sought Sarah when upset", "Accepted comfort"], concernIndicators: [], attachmentRelevant: true, regulationSupport: true },
    { id: "int-05", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", staffId: "s-02", staffName: "Tom Richards", date: "2025-04-02", context: "key_work_session", durationMins: 40, qualityRating: 9, childInitiated: false, positiveIndicators: ["Open discussion", "Future planning"], concernIndicators: [], attachmentRelevant: true, regulationSupport: false },
    { id: "int-06", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", staffId: "s-03", staffName: "Lisa Williams", date: "2025-04-10", context: "community_outing", durationMins: 120, qualityRating: 9, childInitiated: true, positiveIndicators: ["Engaged throughout", "Helped plan"], concernIndicators: [], attachmentRelevant: false, regulationSupport: false },
    { id: "int-07", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", staffId: "s-02", staffName: "Tom Richards", date: "2025-05-05", context: "meal_time", durationMins: 25, qualityRating: 8, childInitiated: true, positiveIndicators: ["Natural conversation"], concernIndicators: [], attachmentRelevant: true, regulationSupport: false },
    { id: "int-08", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", staffId: "s-03", staffName: "Lisa Williams", date: "2025-04-05", context: "key_work_session", durationMins: 50, qualityRating: 6, childInitiated: false, positiveIndicators: ["Stayed for full session"], concernIndicators: ["Limited eye contact"], attachmentRelevant: true, regulationSupport: true },
    { id: "int-09", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", staffId: "s-04", staffName: "Darren Laville", date: "2025-04-20", context: "bedtime_routine", durationMins: 15, qualityRating: 7, childInitiated: false, positiveIndicators: ["Accepted goodnight"], concernIndicators: [], attachmentRelevant: true, regulationSupport: true },
    { id: "int-10", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", staffId: "s-03", staffName: "Lisa Williams", date: "2025-05-10", context: "education_support", durationMins: 35, qualityRating: 7, childInitiated: false, positiveIndicators: ["Focused on work"], concernIndicators: [], attachmentRelevant: false, regulationSupport: false },
  ];

  const stability: StabilityIndicator[] = [
    { id: "stab-01", homeId: "oak-house", childId: "child-alex", childName: "Alex", date: "2025-05-01", keyWorkerConsistency: true, staffTeamStability: true, routineConsistency: 8, placementSecurityScore: 8, belongingScore: 8, childFeelsSafe: true, childFeelsValued: true, significantChanges: [] },
    { id: "stab-02", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", date: "2025-05-01", keyWorkerConsistency: true, staffTeamStability: true, routineConsistency: 9, placementSecurityScore: 9, belongingScore: 9, childFeelsSafe: true, childFeelsValued: true, significantChanges: [] },
    { id: "stab-03", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", date: "2025-05-01", keyWorkerConsistency: true, staffTeamStability: true, routineConsistency: 6, placementSecurityScore: 6, belongingScore: 5, childFeelsSafe: true, childFeelsValued: false, significantChanges: ["New school placement started"] },
  ];

  const peers: PeerRelationship[] = [
    { id: "peer-01", homeId: "oak-house", childId: "child-alex", childName: "Alex", peerId: "child-jordan", peerName: "Jordan", quality: "developing", trend: "strengthening", positiveInteractions: 15, negativeInteractions: 3, conflictsResolved: 2, conflictsUnresolved: 0, sharedActivities: ["Football", "Gaming"], staffMediationNeeded: false },
    { id: "peer-02", homeId: "oak-house", childId: "child-alex", childName: "Alex", peerId: "child-morgan", peerName: "Morgan", quality: "inconsistent", trend: "fluctuating", positiveInteractions: 8, negativeInteractions: 6, conflictsResolved: 3, conflictsUnresolved: 1, sharedActivities: ["Art"], staffMediationNeeded: true },
    { id: "peer-03", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", peerId: "child-morgan", peerName: "Morgan", quality: "developing", trend: "stable", positiveInteractions: 10, negativeInteractions: 2, conflictsResolved: 1, conflictsUnresolved: 0, sharedActivities: ["Music", "Board games"], staffMediationNeeded: false },
  ];

  return { assessments, relationships, interactions, stability, peers };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { assessments, relationships, interactions, stability, peers } = getDemoData();
    const referenceDate = new Date().toISOString().split("T")[0];
    const childIds = ["child-alex", "child-jordan", "child-morgan"];
    const result = generateAttachmentRelationshipsIntelligence(
      assessments, relationships, interactions, stability, peers,
      childIds, "oak-house", "2025-01-01", "2025-06-30", referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate attachment & relationships intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assessments, relationships, interactions, stabilityIndicators, peerRelationships, childIds, homeId, periodStart, periodEnd, referenceDate } = body;

    if (!childIds || !homeId || !periodStart || !periodEnd || !referenceDate) {
      return NextResponse.json(
        { error: "Missing required fields: childIds, homeId, periodStart, periodEnd, referenceDate" },
        { status: 400 },
      );
    }

    if (!Array.isArray(assessments) || !Array.isArray(relationships) || !Array.isArray(interactions) || !Array.isArray(stabilityIndicators) || !Array.isArray(peerRelationships) || !Array.isArray(childIds)) {
      return NextResponse.json(
        { error: "assessments, relationships, interactions, stabilityIndicators, peerRelationships, and childIds must be arrays" },
        { status: 400 },
      );
    }

    const result = generateAttachmentRelationshipsIntelligence(
      assessments, relationships, interactions, stabilityIndicators, peerRelationships,
      childIds, homeId, periodStart, periodEnd, referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process attachment & relationships data", details: String(error) },
      { status: 500 },
    );
  }
}
