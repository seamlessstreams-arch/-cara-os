// ==============================================================================
// API: /api/safeguarding-oversight
//
// Safeguarding Oversight Intelligence
//
// GET  — Returns safeguarding assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateSafeguardingOversightIntelligence,
  getDBSStatusLabel,
  getTrainingLevelLabel,
  getReferralTypeLabel,
  getReferralOutcomeLabel,
  getConcernCategoryLabel,
  getConcernPriorityLabel,
  getRatingLabel,
} from "@/lib/safeguarding-oversight";
import type {
  StaffSafeguardingRecord,
  SafeguardingReferral,
  SafeguardingAudit,
  DSLOversight,
} from "@/lib/safeguarding-oversight";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_STAFF: StaffSafeguardingRecord[] = [
  { id: "ss-dl", staffId: "staff-darren", staffName: "Darren Laville", role: "Registered Manager", dbsStatus: "enhanced_current", dbsDate: "2025-01-15", trainingLevel: "level_3_current", lastTrainingDate: "2025-09-01", designatedSafeguardingLead: true, deputyDSL: false, saferRecruitmentTrained: true, preventTrained: true },
  { id: "ss-sj", staffId: "staff-sarah", staffName: "Sarah Johnson", role: "Senior RSW", dbsStatus: "enhanced_current", dbsDate: "2025-03-10", trainingLevel: "level_3_current", lastTrainingDate: "2025-10-01", designatedSafeguardingLead: false, deputyDSL: true, saferRecruitmentTrained: true, preventTrained: true },
  { id: "ss-tr", staffId: "staff-tom", staffName: "Tom Richards", role: "RSW", dbsStatus: "enhanced_current", dbsDate: "2025-06-20", trainingLevel: "level_2_current", lastTrainingDate: "2026-01-15", designatedSafeguardingLead: false, deputyDSL: false, saferRecruitmentTrained: false, preventTrained: true },
  { id: "ss-lw", staffId: "staff-lisa", staffName: "Lisa Williams", role: "Senior RSW", dbsStatus: "enhanced_current", dbsDate: "2025-04-01", trainingLevel: "level_2_current", lastTrainingDate: "2025-11-01", designatedSafeguardingLead: false, deputyDSL: false, saferRecruitmentTrained: true, preventTrained: true },
];

const DEMO_REFERRALS: SafeguardingReferral[] = [
  { id: "sr-1", childId: "child-jordan", childName: "Jordan", referralType: "mash", outcome: "action_taken", dateReferred: "2026-02-20", dateOutcome: "2026-03-05", referredBy: "Darren Laville", concernCategory: "peer_on_peer", concernPriority: "high", timelyReferral: true, managementInformed: true, parentNotified: true, childInformed: true, recordedAppropriately: true },
  { id: "sr-2", childId: "child-jordan", childName: "Jordan", referralType: "camhs", outcome: "referred_on", dateReferred: "2026-03-10", dateOutcome: "2026-03-15", referredBy: "Sarah Johnson", concernCategory: "self_harm", concernPriority: "high", timelyReferral: true, managementInformed: true, parentNotified: false, childInformed: true, recordedAppropriately: true },
];

const DEMO_AUDITS: SafeguardingAudit[] = [
  { id: "sa-1", homeId: "oak-house", auditDate: "2026-02-01", auditor: "Darren Laville", policiesUpToDate: true, riskAssessmentsCurrentForAllChildren: true, bodyMapProtocolFollowed: true, whistleblowingPolicyAccessible: true, childrenKnowHowToComplain: true, safeguardingDisplayed: true, visitorsSignedIn: true, mobilePhonePolicy: true, photographyPolicy: true, overallCompliant: true },
  { id: "sa-2", homeId: "oak-house", auditDate: "2026-04-15", auditor: "Darren Laville", policiesUpToDate: true, riskAssessmentsCurrentForAllChildren: true, bodyMapProtocolFollowed: true, whistleblowingPolicyAccessible: true, childrenKnowHowToComplain: true, safeguardingDisplayed: true, visitorsSignedIn: true, mobilePhonePolicy: true, photographyPolicy: true, overallCompliant: true },
];

const DEMO_DSL_REVIEWS: DSLOversight[] = [
  { id: "do-1", dslName: "Darren Laville", reviewDate: "2026-03-01", openCasesReviewed: 2, openCasesTotal: 2, supervisionOfConcerns: true, multiAgencyAttendance: true, trainingDelivered: true, policyReviewCompleted: true, incidentDebriefsConducted: true, staffSupportProvided: true },
  { id: "do-2", dslName: "Darren Laville", reviewDate: "2026-04-01", openCasesReviewed: 1, openCasesTotal: 1, supervisionOfConcerns: true, multiAgencyAttendance: true, trainingDelivered: false, policyReviewCompleted: false, incidentDebriefsConducted: true, staffSupportProvided: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateSafeguardingOversightIntelligence(
    DEMO_STAFF,
    DEMO_REFERRALS,
    DEMO_AUDITS,
    DEMO_DSL_REVIEWS,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        dbsStatusLabels: Object.fromEntries(
          (["enhanced_current", "enhanced_expiring", "enhanced_expired", "basic_only", "not_completed", "update_service"] as const).map(
            (s) => [s, getDBSStatusLabel(s)],
          ),
        ),
        trainingLevelLabels: Object.fromEntries(
          (["level_3_current", "level_2_current", "level_1_current", "refresher_due", "expired", "not_completed"] as const).map(
            (l) => [l, getTrainingLevelLabel(l)],
          ),
        ),
        referralTypeLabels: Object.fromEntries(
          (["lado", "mash", "police", "social_care", "prevent", "channel", "camhs", "nspcc", "internal_safeguarding"] as const).map(
            (t) => [t, getReferralTypeLabel(t)],
          ),
        ),
        referralOutcomeLabels: Object.fromEntries(
          (["action_taken", "no_further_action", "ongoing_investigation", "referred_on", "awaiting_outcome", "withdrawn"] as const).map(
            (o) => [o, getReferralOutcomeLabel(o)],
          ),
        ),
        concernCategoryLabels: Object.fromEntries(
          (["physical_abuse", "emotional_abuse", "sexual_abuse", "neglect", "exploitation", "radicalisation", "online_harm", "peer_on_peer", "self_harm", "domestic_abuse", "honour_based", "fgm", "trafficking"] as const).map(
            (c) => [c, getConcernCategoryLabel(c)],
          ),
        ),
        concernPriorityLabels: Object.fromEntries(
          (["immediate", "high", "medium", "low"] as const).map(
            (p) => [p, getConcernPriorityLabel(p)],
          ),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map(
            (r) => [r, getRatingLabel(r)],
          ),
        ),
      },
    },
  });
}

// -- POST -----------------------------------------------------------------------

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { staff, referrals, audits, dslReviews, homeId, periodStart, periodEnd } = body as {
    staff?: StaffSafeguardingRecord[];
    referrals?: SafeguardingReferral[];
    audits?: SafeguardingAudit[];
    dslReviews?: DSLOversight[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateSafeguardingOversightIntelligence(
    staff ?? [],
    referrals ?? [],
    audits ?? [],
    dslReviews ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
