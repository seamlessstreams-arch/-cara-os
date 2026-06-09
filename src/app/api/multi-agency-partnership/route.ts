// ══════════════════════════════════════════════════════════════════════════════
// API: /api/multi-agency-partnership
//
// Multi-Agency Partnership Intelligence
//
// GET  — Returns partnership assessment with demo Chamberlain House data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateMultiAgencyPartnershipIntelligence,
  getAgencyTypeLabel,
  getEngagementQualityLabel,
  getMeetingTypeLabel,
  getReferralOutcomeLabel,
} from "@/lib/multi-agency-partnership";
import type {
  AgencyRelationship,
  MultiAgencyMeeting,
  AgencyReferral,
  InformationSharingRecord,
} from "@/lib/multi-agency-partnership";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

const DEMO_RELATIONSHIPS: AgencyRelationship[] = [
  {
    id: "rel-001",
    agencyType: "social_work",
    agencyName: "Meadowfield Children's Services",
    namedContact: "Sarah Thompson (Team Manager)",
    engagementQuality: "excellent",
    lastContactDate: "2026-05-16",
    contactFrequency: "twice weekly",
    informationSharingAgreementInPlace: true,
    feedbackReceived: "very_positive",
  },
  {
    id: "rel-002",
    agencyType: "camhs",
    agencyName: "Meadowfield CAMHS",
    namedContact: "Dr Anika Patel",
    engagementQuality: "good",
    lastContactDate: "2026-05-14",
    contactFrequency: "weekly",
    informationSharingAgreementInPlace: true,
    feedbackReceived: "positive",
  },
  {
    id: "rel-003",
    agencyType: "education",
    agencyName: "Riverside Academy",
    namedContact: "Mr James Carter (Designated Teacher)",
    engagementQuality: "good",
    lastContactDate: "2026-05-15",
    contactFrequency: "weekly",
    informationSharingAgreementInPlace: true,
    feedbackReceived: "positive",
  },
  {
    id: "rel-004",
    agencyType: "police",
    agencyName: "Meadowfield Police — Child Protection Unit",
    namedContact: "DS Karen Owens",
    engagementQuality: "good",
    lastContactDate: "2026-05-12",
    contactFrequency: "monthly",
    informationSharingAgreementInPlace: true,
    feedbackReceived: "positive",
  },
  {
    id: "rel-005",
    agencyType: "advocacy",
    agencyName: "NYAS (National Youth Advocacy Service)",
    namedContact: "Tom Richards (Advocate)",
    engagementQuality: "excellent",
    lastContactDate: "2026-05-13",
    contactFrequency: "fortnightly",
    informationSharingAgreementInPlace: true,
    feedbackReceived: "very_positive",
  },
];

const DEMO_MEETINGS: MultiAgencyMeeting[] = [
  {
    id: "mtg-001",
    childId: "child-alex",
    meetingType: "looked_after_review",
    meetingDate: "2026-05-10",
    agenciesInvited: ["social_work", "camhs", "education", "advocacy"],
    agenciesAttended: ["social_work", "camhs", "education", "advocacy"],
    homeRepresentativeAttended: true,
    minutesCirculated: true,
    actionsIdentified: 6,
    actionsCompleted: 5,
    childParticipated: true,
  },
  {
    id: "mtg-002",
    childId: "child-jordan",
    meetingType: "professionals",
    meetingDate: "2026-05-08",
    agenciesInvited: ["social_work", "education", "camhs"],
    agenciesAttended: ["social_work", "education"],
    homeRepresentativeAttended: true,
    minutesCirculated: true,
    actionsIdentified: 4,
    actionsCompleted: 3,
    childParticipated: false,
  },
  {
    id: "mtg-003",
    childId: "child-alex",
    meetingType: "strategy",
    meetingDate: "2026-05-05",
    agenciesInvited: ["social_work", "police", "camhs"],
    agenciesAttended: ["social_work", "police", "camhs"],
    homeRepresentativeAttended: true,
    minutesCirculated: true,
    actionsIdentified: 5,
    actionsCompleted: 5,
    childParticipated: false,
  },
  {
    id: "mtg-004",
    childId: "child-morgan",
    meetingType: "education_review",
    meetingDate: "2026-05-02",
    agenciesInvited: ["education", "social_work", "camhs"],
    agenciesAttended: ["education", "social_work", "camhs"],
    homeRepresentativeAttended: true,
    minutesCirculated: true,
    actionsIdentified: 3,
    actionsCompleted: 3,
    childParticipated: true,
  },
];

const DEMO_REFERRALS: AgencyReferral[] = [
  {
    id: "ref-001",
    childId: "child-alex",
    referredTo: "camhs",
    referralDate: "2026-04-20",
    outcome: "accepted",
    responseTimeDays: 5,
    appropriateReferral: true,
    followUpCompleted: true,
  },
  {
    id: "ref-002",
    childId: "child-jordan",
    referredTo: "education",
    referralDate: "2026-04-25",
    outcome: "completed",
    responseTimeDays: 7,
    appropriateReferral: true,
    followUpCompleted: true,
  },
];

const DEMO_INFO_SHARING: InformationSharingRecord[] = [
  {
    id: "info-001",
    childId: "child-alex",
    sharedWith: "social_work",
    shareDate: "2026-05-14",
    quality: "timely_comprehensive",
    consentObtained: true,
    timeliness: true,
    relevantToChildPlan: true,
  },
  {
    id: "info-002",
    childId: "child-alex",
    sharedWith: "camhs",
    shareDate: "2026-05-12",
    quality: "timely_comprehensive",
    consentObtained: true,
    timeliness: true,
    relevantToChildPlan: true,
  },
  {
    id: "info-003",
    childId: "child-jordan",
    sharedWith: "education",
    shareDate: "2026-05-10",
    quality: "timely_partial",
    consentObtained: true,
    timeliness: true,
    relevantToChildPlan: true,
  },
  {
    id: "info-004",
    childId: "child-morgan",
    sharedWith: "social_work",
    shareDate: "2026-05-08",
    quality: "timely_comprehensive",
    consentObtained: true,
    timeliness: true,
    relevantToChildPlan: true,
  },
  {
    id: "info-005",
    childId: "child-morgan",
    sharedWith: "police",
    shareDate: "2026-05-06",
    quality: "timely_comprehensive",
    consentObtained: true,
    timeliness: true,
    relevantToChildPlan: true,
  },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateMultiAgencyPartnershipIntelligence(
    DEMO_RELATIONSHIPS,
    DEMO_MEETINGS,
    DEMO_REFERRALS,
    DEMO_INFO_SHARING,
    "oak-house",
    "2026-05-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        relationshipLabels: DEMO_RELATIONSHIPS.map((r) => ({
          id: r.id,
          agencyTypeLabel: getAgencyTypeLabel(r.agencyType),
          qualityLabel: getEngagementQualityLabel(r.engagementQuality),
        })),
        meetingLabels: DEMO_MEETINGS.map((m) => ({
          id: m.id,
          typeLabel: getMeetingTypeLabel(m.meetingType),
        })),
        referralLabels: DEMO_REFERRALS.map((r) => ({
          id: r.id,
          agencyLabel: getAgencyTypeLabel(r.referredTo),
          outcomeLabel: getReferralOutcomeLabel(r.outcome),
        })),
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
    relationships, meetings, referrals, informationSharing,
    homeId, periodStart, periodEnd,
  } = body as {
    relationships?: AgencyRelationship[];
    meetings?: MultiAgencyMeeting[];
    referrals?: AgencyReferral[];
    informationSharing?: InformationSharingRecord[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateMultiAgencyPartnershipIntelligence(
    relationships ?? [],
    meetings ?? [],
    referrals ?? [],
    informationSharing ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
