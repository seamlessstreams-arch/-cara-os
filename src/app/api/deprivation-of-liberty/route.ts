// ══════════════════════════════════════════════════════════════════════════════
// API: /api/deprivation-of-liberty
//
// Deprivation of Liberty Intelligence
//
// GET  — Returns DoLS assessment with realistic Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  generateDeprivationOfLibertyIntelligence,
  getRestrictionTypeLabel,
  getAuthorisationStatusLabel,
  getReviewOutcomeLabel,
  getProportionalityLabel,
  getChildViewStatusLabel,
  getSafeguardTypeLabel,
} from "@/lib/deprivation-of-liberty";
import type {
  RestrictionRecord,
  DoLSReview,
  ChildRightsSafeguard,
  LegalCompliance,
} from "@/lib/deprivation-of-liberty";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

// Morgan — court-authorised continuous supervision & locked doors (self-harm risk)
// Alex — LA-authorised technology monitoring (online safety concern)
// Jordan — no restrictions

const DEMO_RESTRICTIONS: RestrictionRecord[] = [
  {
    id: "rest-morgan-01",
    childId: "child-morgan",
    childName: "Morgan",
    restrictionType: "continuous_supervision",
    startDate: "2026-02-01",
    isActive: true,
    authorisationStatus: "court_authorised",
    authorisedBy: "Family Court — Judge Thompson",
    authorisationDate: "2026-01-28",
    authorisationExpiryDate: "2026-07-28",
    proportionality: "proportionate",
    bestInterestsAssessmentCompleted: true,
    leastRestrictiveOptionConsidered: true,
    riskAssessmentLinked: true,
  },
  {
    id: "rest-morgan-02",
    childId: "child-morgan",
    childName: "Morgan",
    restrictionType: "locked_doors",
    startDate: "2026-02-01",
    isActive: true,
    authorisationStatus: "court_authorised",
    authorisedBy: "Family Court — Judge Thompson",
    authorisationDate: "2026-01-28",
    authorisationExpiryDate: "2026-07-28",
    proportionality: "proportionate",
    bestInterestsAssessmentCompleted: true,
    leastRestrictiveOptionConsidered: true,
    riskAssessmentLinked: true,
  },
  {
    id: "rest-alex-01",
    childId: "child-alex",
    childName: "Alex",
    restrictionType: "technology_monitoring",
    startDate: "2026-03-01",
    isActive: true,
    authorisationStatus: "local_authority_authorised",
    authorisedBy: "Placing Authority Social Worker",
    authorisationDate: "2026-02-28",
    authorisationExpiryDate: "2026-08-28",
    proportionality: "proportionate",
    bestInterestsAssessmentCompleted: true,
    leastRestrictiveOptionConsidered: true,
    riskAssessmentLinked: true,
  },
];

const DEMO_REVIEWS: DoLSReview[] = [
  {
    id: "rev-morgan-01",
    restrictionId: "rest-morgan-01",
    childId: "child-morgan",
    reviewDate: "2026-03-15",
    reviewedBy: "Darren Laville",
    outcome: "continued",
    childViewStatus: "views_obtained",
    familyConsulted: true,
    independentPersonInvolved: true,
    proportionalityReassessed: true,
    nextReviewDue: "2026-06-15",
    lessRestrictiveAlternativesConsidered: true,
  },
  {
    id: "rev-morgan-02",
    restrictionId: "rest-morgan-02",
    childId: "child-morgan",
    reviewDate: "2026-03-15",
    reviewedBy: "Darren Laville",
    outcome: "modified",
    childViewStatus: "views_obtained",
    familyConsulted: true,
    independentPersonInvolved: true,
    proportionalityReassessed: true,
    nextReviewDue: "2026-06-15",
    lessRestrictiveAlternativesConsidered: true,
  },
  {
    id: "rev-alex-01",
    restrictionId: "rest-alex-01",
    childId: "child-alex",
    reviewDate: "2026-04-01",
    reviewedBy: "Sarah Johnson",
    outcome: "continued",
    childViewStatus: "views_obtained",
    familyConsulted: true,
    independentPersonInvolved: false,
    proportionalityReassessed: true,
    nextReviewDue: "2026-07-01",
    lessRestrictiveAlternativesConsidered: true,
  },
];

const DEMO_SAFEGUARDS: ChildRightsSafeguard[] = [
  // Morgan — full safeguard suite
  { id: "sg-m01", childId: "child-morgan", restrictionId: "rest-morgan-01", safeguardType: "advocacy", inPlace: true, arrangedDate: "2026-02-01", providerName: "NYAS" },
  { id: "sg-m02", childId: "child-morgan", restrictionId: "rest-morgan-01", safeguardType: "legal_representation", inPlace: true, arrangedDate: "2026-01-25", providerName: "Howard & Partners Solicitors" },
  { id: "sg-m03", childId: "child-morgan", restrictionId: "rest-morgan-01", safeguardType: "rights_information_given", inPlace: true, arrangedDate: "2026-02-01" },
  { id: "sg-m04", childId: "child-morgan", restrictionId: "rest-morgan-01", safeguardType: "family_notification", inPlace: true, arrangedDate: "2026-01-28" },
  { id: "sg-m05", childId: "child-morgan", restrictionId: "rest-morgan-01", safeguardType: "ofsted_notification", inPlace: true, arrangedDate: "2026-01-29" },
  { id: "sg-m06", childId: "child-morgan", restrictionId: "rest-morgan-01", safeguardType: "independent_reviewer", inPlace: true, arrangedDate: "2026-02-05", providerName: "IRO — Jane Carter" },
  { id: "sg-m07", childId: "child-morgan", restrictionId: "rest-morgan-01", safeguardType: "complaints_process_explained", inPlace: true, arrangedDate: "2026-02-01" },
  // Alex — core safeguards
  { id: "sg-a01", childId: "child-alex", restrictionId: "rest-alex-01", safeguardType: "advocacy", inPlace: true, arrangedDate: "2026-03-01", providerName: "NYAS" },
  { id: "sg-a02", childId: "child-alex", restrictionId: "rest-alex-01", safeguardType: "rights_information_given", inPlace: true, arrangedDate: "2026-03-01" },
  { id: "sg-a03", childId: "child-alex", restrictionId: "rest-alex-01", safeguardType: "family_notification", inPlace: true, arrangedDate: "2026-03-01" },
  { id: "sg-a04", childId: "child-alex", restrictionId: "rest-alex-01", safeguardType: "ofsted_notification", inPlace: true, arrangedDate: "2026-03-02" },
];

const DEMO_LEGAL: LegalCompliance[] = [
  {
    id: "leg-morgan",
    childId: "child-morgan",
    courtOrderInPlace: true,
    courtOrderExpiryDate: "2026-07-28",
    s25ApplicationMade: false,
    s25Outcome: "not_applicable",
    localAuthorityNotified: true,
    ofstedNotified: true,
    cafeassInvolved: true,
    lastLegalReviewDate: "2026-03-15",
  },
  {
    id: "leg-alex",
    childId: "child-alex",
    courtOrderInPlace: false,
    s25ApplicationMade: false,
    s25Outcome: "not_applicable",
    localAuthorityNotified: true,
    ofstedNotified: true,
    cafeassInvolved: false,
    lastLegalReviewDate: "2026-04-01",
  },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateDeprivationOfLibertyIntelligence(
    DEMO_RESTRICTIONS,
    DEMO_REVIEWS,
    DEMO_SAFEGUARDS,
    DEMO_LEGAL,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  const enrichedProfiles = result.childProfiles.map((p) => ({
    ...p,
    proportionalityLabel: getProportionalityLabel(p.proportionalityStatus),
  }));

  return NextResponse.json({
    data: {
      ...result,
      childProfiles: enrichedProfiles,
      meta: {
        restrictionTypeLabels: Object.fromEntries(
          ([
            "locked_doors", "continuous_supervision", "medication_covert",
            "movement_restriction", "technology_monitoring", "seclusion",
            "physical_restraint", "chemical_restraint", "environmental_restriction",
            "communication_restriction",
          ] as const).map((t) => [t, getRestrictionTypeLabel(t)]),
        ),
        authorisationStatusLabels: Object.fromEntries(
          ([
            "court_authorised", "local_authority_authorised", "pending_application",
            "not_required", "expired", "refused", "under_review",
          ] as const).map((s) => [s, getAuthorisationStatusLabel(s)]),
        ),
        reviewOutcomeLabels: Object.fromEntries(
          (["continued", "modified", "ceased", "escalated", "deferred"] as const).map(
            (o) => [o, getReviewOutcomeLabel(o)],
          ),
        ),
        proportionalityLabels: Object.fromEntries(
          ([
            "proportionate", "potentially_disproportionate", "disproportionate", "not_assessed",
          ] as const).map((p) => [p, getProportionalityLabel(p)]),
        ),
        childViewStatusLabels: Object.fromEntries(
          ([
            "views_obtained", "views_sought_not_obtained", "views_not_sought",
            "non_verbal_observation_used",
          ] as const).map((v) => [v, getChildViewStatusLabel(v)]),
        ),
        safeguardTypeLabels: Object.fromEntries(
          ([
            "independent_reviewer", "advocacy", "legal_representation",
            "family_notification", "local_authority_notification",
            "ofsted_notification", "rights_information_given", "complaints_process_explained",
          ] as const).map((s) => [s, getSafeguardTypeLabel(s)]),
        ),
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    restrictions,
    reviews,
    safeguards,
    legalCompliance,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    restrictions?: RestrictionRecord[];
    reviews?: DoLSReview[];
    safeguards?: ChildRightsSafeguard[];
    legalCompliance?: LegalCompliance[];
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

  const result = generateDeprivationOfLibertyIntelligence(
    restrictions ?? [],
    reviews ?? [],
    safeguards ?? [],
    legalCompliance ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
