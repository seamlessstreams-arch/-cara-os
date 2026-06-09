// ══════════════════════════════════════════════════════════════════════════════
// API: /api/sexual-health-relationships-education
//
// Sexual Health & Relationships Education Intelligence
//
// GET  — Returns RSE metrics with demo data (Chamberlain House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateSexualHealthRelationshipsEducationIntelligence,
  getTopicAreaLabels,
  getDeliveryMethodLabels,
  getAgeAppropriatenessLabels,
  getEngagementLevelLabels,
  getRatingLabels,
  getRatingLabel,
} from "@/lib/sexual-health-relationships-education";
import type {
  RSESession,
  SexualHealthReferral,
  RSEPolicy,
  StaffRSETraining,
} from "@/lib/sexual-health-relationships-education";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  sessions: RSESession[];
  referrals: SexualHealthReferral[];
  policies: RSEPolicy[];
  training: StaffRSETraining[];
} {
  const sessions: RSESession[] = [
    // Alex (14) sessions
    {
      id: "rse-001",
      childId: "child-alex",
      childName: "Alex",
      sessionDate: "2026-02-10",
      topicArea: "consent",
      deliveryMethod: "one_to_one",
      deliveredBy: "Sarah Johnson",
      ageAppropriateness: "fully_appropriate",
      childEngagement: "highly_engaged",
      consentObtained: true,
      followUpRequired: false,
      followUpCompleted: false,
    },
    {
      id: "rse-002",
      childId: "child-alex",
      childName: "Alex",
      sessionDate: "2026-03-05",
      topicArea: "healthy_relationships",
      deliveryMethod: "keyworker_session",
      deliveredBy: "Sarah Johnson",
      ageAppropriateness: "fully_appropriate",
      childEngagement: "engaged",
      consentObtained: true,
      followUpRequired: true,
      followUpCompleted: true,
    },
    {
      id: "rse-003",
      childId: "child-alex",
      childName: "Alex",
      sessionDate: "2026-04-12",
      topicArea: "online_safety",
      deliveryMethod: "group_session",
      deliveredBy: "Tom Richards",
      ageAppropriateness: "fully_appropriate",
      childEngagement: "engaged",
      consentObtained: true,
      followUpRequired: false,
      followUpCompleted: false,
    },
    // Jordan (13) sessions
    {
      id: "rse-004",
      childId: "child-jordan",
      childName: "Jordan",
      sessionDate: "2026-02-15",
      topicArea: "body_autonomy",
      deliveryMethod: "one_to_one",
      deliveredBy: "Lisa Williams",
      ageAppropriateness: "fully_appropriate",
      childEngagement: "highly_engaged",
      consentObtained: true,
      followUpRequired: false,
      followUpCompleted: false,
    },
    {
      id: "rse-005",
      childId: "child-jordan",
      childName: "Jordan",
      sessionDate: "2026-03-20",
      topicArea: "boundaries",
      deliveryMethod: "keyworker_session",
      deliveredBy: "Lisa Williams",
      ageAppropriateness: "fully_appropriate",
      childEngagement: "engaged",
      consentObtained: true,
      followUpRequired: true,
      followUpCompleted: true,
    },
    {
      id: "rse-006",
      childId: "child-jordan",
      childName: "Jordan",
      sessionDate: "2026-04-18",
      topicArea: "emotional_wellbeing",
      deliveryMethod: "group_session",
      deliveredBy: "Tom Richards",
      ageAppropriateness: "mostly_appropriate",
      childEngagement: "partially_engaged",
      consentObtained: true,
      followUpRequired: true,
      followUpCompleted: false,
    },
    // Morgan (15) sessions
    {
      id: "rse-007",
      childId: "child-morgan",
      childName: "Morgan",
      sessionDate: "2026-01-25",
      topicArea: "contraception",
      deliveryMethod: "external_professional",
      deliveredBy: "School Nurse",
      ageAppropriateness: "fully_appropriate",
      childEngagement: "highly_engaged",
      consentObtained: true,
      followUpRequired: false,
      followUpCompleted: false,
    },
    {
      id: "rse-008",
      childId: "child-morgan",
      childName: "Morgan",
      sessionDate: "2026-02-28",
      topicArea: "sti_awareness",
      deliveryMethod: "external_professional",
      deliveredBy: "School Nurse",
      ageAppropriateness: "fully_appropriate",
      childEngagement: "engaged",
      consentObtained: true,
      followUpRequired: false,
      followUpCompleted: false,
    },
    {
      id: "rse-009",
      childId: "child-morgan",
      childName: "Morgan",
      sessionDate: "2026-03-15",
      topicArea: "lgbtq_identity",
      deliveryMethod: "one_to_one",
      deliveredBy: "Darren Laville",
      ageAppropriateness: "fully_appropriate",
      childEngagement: "highly_engaged",
      consentObtained: true,
      followUpRequired: false,
      followUpCompleted: false,
    },
    {
      id: "rse-010",
      childId: "child-morgan",
      childName: "Morgan",
      sessionDate: "2026-04-22",
      topicArea: "exploitation_awareness",
      deliveryMethod: "group_session",
      deliveredBy: "Darren Laville",
      ageAppropriateness: "fully_appropriate",
      childEngagement: "engaged",
      consentObtained: true,
      followUpRequired: true,
      followUpCompleted: true,
    },
  ];

  const referrals: SexualHealthReferral[] = [
    {
      id: "shref-001",
      childId: "child-morgan",
      childName: "Morgan",
      referralDate: "2026-02-01",
      referralType: "Sexual health clinic",
      serviceAccessed: true,
      confidentialityMaintained: true,
      consentObtained: true,
      outcomeRecorded: true,
    },
    {
      id: "shref-002",
      childId: "child-alex",
      childName: "Alex",
      referralDate: "2026-04-10",
      referralType: "Counselling service",
      serviceAccessed: true,
      confidentialityMaintained: true,
      consentObtained: true,
      outcomeRecorded: true,
    },
  ];

  const policies: RSEPolicy[] = [
    {
      id: "rsepol-001",
      policyReviewDate: "2026-01-10",
      policyCurrent: true,
      ageAppropriateResources: true,
      lgbtqInclusive: true,
      culturallySensitive: true,
      parentCarerConsulted: true,
      externalProfessionalsInvolved: true,
      childrenConsulted: true,
    },
  ];

  const training: StaffRSETraining[] = [
    {
      id: "rsetrain-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      rseDeliveryTrained: true,
      safeguardingSexual: true,
      consentEducation: true,
      lgbtqAwareness: true,
      cseCseAwareness: true,
      ageAppropriateCommunication: true,
    },
    {
      id: "rsetrain-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      rseDeliveryTrained: true,
      safeguardingSexual: true,
      consentEducation: true,
      lgbtqAwareness: true,
      cseCseAwareness: true,
      ageAppropriateCommunication: true,
    },
    {
      id: "rsetrain-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      rseDeliveryTrained: true,
      safeguardingSexual: true,
      consentEducation: true,
      lgbtqAwareness: false,
      cseCseAwareness: true,
      ageAppropriateCommunication: true,
    },
    {
      id: "rsetrain-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      rseDeliveryTrained: true,
      safeguardingSexual: true,
      consentEducation: true,
      lgbtqAwareness: true,
      cseCseAwareness: true,
      ageAppropriateCommunication: true,
    },
  ];

  return { sessions, referrals, policies, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { sessions, referrals, policies, training } = generateDemoData();

  const result = generateSexualHealthRelationshipsEducationIntelligence(
    sessions,
    referrals,
    policies,
    training,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        topicAreaLabels: getTopicAreaLabels(),
        deliveryMethodLabels: getDeliveryMethodLabels(),
        ageAppropriatenessLabels: getAgeAppropriatenessLabels(),
        engagementLevelLabels: getEngagementLevelLabels(),
        ratingLabels: getRatingLabels(),
        ratingLabel: getRatingLabel(result.rating),
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    sessions,
    referrals,
    policies,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    sessions?: RSESession[];
    referrals?: SexualHealthReferral[];
    policies?: RSEPolicy[];
    training?: StaffRSETraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 },
    );
  }

  const result = generateSexualHealthRelationshipsEducationIntelligence(
    sessions ?? [],
    referrals ?? [],
    policies ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
