// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Consent Management Intelligence API Route
//
// GET  → returns Oak House demo consent management intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateConsentManagementIntelligence } from "@/lib/consent-management/consent-management-engine";
import type {
  ConsentRecord,
  DelegatedAuthority,
  GillickAssessment,
  ConsentAudit,
} from "@/lib/consent-management/consent-management-engine";

// ── Oak House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const records: ConsentRecord[] = [
    // Alex — comprehensive consents (LA holds PR)
    { id: "c-a1", homeId: "oak-house", childId: "child-alex", childName: "Alex", consentArea: "medical_routine", consentHolder: "local_authority", consentHolderName: "LA Wandsworth", status: "granted", dateRecorded: "2025-01-10", evidenceOnFile: true, childInformed: true, childAgreed: true },
    { id: "c-a2", homeId: "oak-house", childId: "child-alex", childName: "Alex", consentArea: "medical_emergency", consentHolder: "local_authority", consentHolderName: "LA Wandsworth", status: "granted", dateRecorded: "2025-01-10", evidenceOnFile: true, childInformed: true, childAgreed: true },
    { id: "c-a3", homeId: "oak-house", childId: "child-alex", childName: "Alex", consentArea: "medication", consentHolder: "local_authority", consentHolderName: "LA Wandsworth", status: "granted", dateRecorded: "2025-01-10", evidenceOnFile: true, childInformed: true, childAgreed: true },
    { id: "c-a4", homeId: "oak-house", childId: "child-alex", childName: "Alex", consentArea: "education", consentHolder: "local_authority", consentHolderName: "LA Wandsworth", status: "granted", dateRecorded: "2025-01-10", evidenceOnFile: true, childInformed: true, childAgreed: true },
    { id: "c-a5", homeId: "oak-house", childId: "child-alex", childName: "Alex", consentArea: "photography", consentHolder: "child_gillick", consentHolderName: "Alex", status: "granted", dateRecorded: "2025-02-01", evidenceOnFile: true, childInformed: true, childAgreed: true },
    { id: "c-a6", homeId: "oak-house", childId: "child-alex", childName: "Alex", consentArea: "internet_social_media", consentHolder: "child_gillick", consentHolderName: "Alex", status: "granted", dateRecorded: "2025-02-01", evidenceOnFile: true, childInformed: true, childAgreed: true },
    { id: "c-a7", homeId: "oak-house", childId: "child-alex", childName: "Alex", consentArea: "haircut", consentHolder: "delegated_carer", consentHolderName: "Sarah Johnson", status: "granted", dateRecorded: "2025-01-15", evidenceOnFile: true, childInformed: true, childAgreed: true },
    { id: "c-a8", homeId: "oak-house", childId: "child-alex", childName: "Alex", consentArea: "overnight_stay", consentHolder: "local_authority", consentHolderName: "LA Wandsworth", status: "granted", dateRecorded: "2025-01-10", evidenceOnFile: true, childInformed: true, childAgreed: true },
    { id: "c-a9", homeId: "oak-house", childId: "child-alex", childName: "Alex", consentArea: "immunisation", consentHolder: "local_authority", consentHolderName: "LA Wandsworth", status: "granted", dateRecorded: "2025-01-10", evidenceOnFile: true, childInformed: true },
    { id: "c-a10", homeId: "oak-house", childId: "child-alex", childName: "Alex", consentArea: "contact", consentHolder: "local_authority", consentHolderName: "LA Wandsworth", status: "granted", dateRecorded: "2025-01-10", evidenceOnFile: true, childInformed: true },
    { id: "c-a11", homeId: "oak-house", childId: "child-alex", childName: "Alex", consentArea: "independent_activity", consentHolder: "delegated_carer", consentHolderName: "Sarah Johnson", status: "granted", dateRecorded: "2025-01-15", evidenceOnFile: true, childInformed: true, childAgreed: true },
    { id: "c-a12", homeId: "oak-house", childId: "child-alex", childName: "Alex", consentArea: "data_sharing", consentHolder: "local_authority", consentHolderName: "LA Wandsworth", status: "granted", dateRecorded: "2025-01-10", evidenceOnFile: true, childInformed: true },

    // Jordan — good coverage (mother holds PR, shares with LA)
    { id: "c-j1", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", consentArea: "medical_routine", consentHolder: "parent_mother", consentHolderName: "Maria Williams", status: "granted", dateRecorded: "2025-01-05", evidenceOnFile: true, childInformed: true, childAgreed: true },
    { id: "c-j2", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", consentArea: "medical_emergency", consentHolder: "parent_mother", consentHolderName: "Maria Williams", status: "granted", dateRecorded: "2025-01-05", evidenceOnFile: true, childInformed: true },
    { id: "c-j3", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", consentArea: "medication", consentHolder: "parent_mother", consentHolderName: "Maria Williams", status: "granted", dateRecorded: "2025-01-05", evidenceOnFile: true, childInformed: true },
    { id: "c-j4", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", consentArea: "education", consentHolder: "parent_mother", consentHolderName: "Maria Williams", status: "granted", dateRecorded: "2025-01-05", evidenceOnFile: true, childInformed: true },
    { id: "c-j5", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", consentArea: "photography", consentHolder: "parent_mother", consentHolderName: "Maria Williams", status: "refused", dateRecorded: "2025-01-05", evidenceOnFile: true, childInformed: true, childAgreed: false },
    { id: "c-j6", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", consentArea: "haircut", consentHolder: "delegated_carer", consentHolderName: "Tom Richards", status: "granted", dateRecorded: "2025-01-15", evidenceOnFile: true, childInformed: true },
    { id: "c-j7", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", consentArea: "immunisation", consentHolder: "parent_mother", consentHolderName: "Maria Williams", status: "granted", dateRecorded: "2025-01-05", evidenceOnFile: true, childInformed: true },
    { id: "c-j8", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", consentArea: "contact", consentHolder: "parent_mother", consentHolderName: "Maria Williams", status: "granted", dateRecorded: "2025-01-05", evidenceOnFile: true, childInformed: true },

    // Morgan — gaps in consent
    { id: "c-m1", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", consentArea: "medical_routine", consentHolder: "local_authority", consentHolderName: "LA Bromley", status: "granted", dateRecorded: "2025-01-20", evidenceOnFile: true, childInformed: true },
    { id: "c-m2", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", consentArea: "medical_emergency", consentHolder: "local_authority", consentHolderName: "LA Bromley", status: "granted", dateRecorded: "2025-01-20", evidenceOnFile: true, childInformed: false },
    { id: "c-m3", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", consentArea: "medication", consentHolder: "local_authority", consentHolderName: "LA Bromley", status: "expired", dateRecorded: "2025-01-20", expiryDate: "2025-04-01", evidenceOnFile: true, childInformed: true },
    { id: "c-m4", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", consentArea: "education", consentHolder: "local_authority", consentHolderName: "LA Bromley", status: "granted", dateRecorded: "2025-01-20", evidenceOnFile: false, childInformed: false },
    { id: "c-m5", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", consentArea: "photography", consentHolder: "local_authority", consentHolderName: "LA Bromley", status: "not_sought", dateRecorded: "2025-02-01", evidenceOnFile: false, childInformed: false },
    { id: "c-m6", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", consentArea: "immunisation", consentHolder: "local_authority", consentHolderName: "LA Bromley", status: "granted", dateRecorded: "2025-01-20", evidenceOnFile: true, childInformed: true },
  ];

  const delegations: DelegatedAuthority[] = [
    { id: "da-a1", homeId: "oak-house", childId: "child-alex", childName: "Alex", area: "haircut", delegatedTo: "key_worker", delegatedToName: "Sarah Johnson", agreedDate: "2025-01-15", reviewDate: "2025-07-15", documentedInPlacementPlan: true, parentAgreed: false, localAuthorityAgreed: true },
    { id: "da-a2", homeId: "oak-house", childId: "child-alex", childName: "Alex", area: "independent_activity", delegatedTo: "registered_manager", delegatedToName: "Darren Laville", agreedDate: "2025-01-15", reviewDate: "2025-07-15", documentedInPlacementPlan: true, parentAgreed: false, localAuthorityAgreed: true },
    { id: "da-j1", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", area: "haircut", delegatedTo: "any_carer", agreedDate: "2025-01-10", reviewDate: "2025-07-10", documentedInPlacementPlan: true, parentAgreed: true, localAuthorityAgreed: true },
    { id: "da-j2", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", area: "education", delegatedTo: "key_worker", delegatedToName: "Tom Richards", agreedDate: "2025-01-10", reviewDate: "2025-07-10", documentedInPlacementPlan: true, parentAgreed: true, localAuthorityAgreed: true },
    { id: "da-j3", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", area: "overnight_stay", delegatedTo: "registered_manager", delegatedToName: "Darren Laville", agreedDate: "2025-01-10", reviewDate: "2025-07-10", documentedInPlacementPlan: true, parentAgreed: true, localAuthorityAgreed: true },
    { id: "da-m1", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", area: "haircut", delegatedTo: "any_carer", agreedDate: "2024-09-01", reviewDate: "2025-03-01", documentedInPlacementPlan: false, parentAgreed: false, localAuthorityAgreed: true },
  ];

  const gillickAssessments: GillickAssessment[] = [
    { id: "ga-a1", homeId: "oak-house", childId: "child-alex", childName: "Alex", assessmentDate: "2025-02-01", assessedBy: "Sarah Johnson", area: "photography", outcome: "competent", reasoning: "Alex understands risks of sharing images and can make informed decisions", childViews: "I know what's safe to share online", reviewDate: "2025-08-01", parentInformed: true },
    { id: "ga-a2", homeId: "oak-house", childId: "child-alex", childName: "Alex", assessmentDate: "2025-02-01", assessedBy: "Sarah Johnson", area: "internet_social_media", outcome: "competent", reasoning: "Alex demonstrates understanding of online safety and privacy", childViews: "I use the internet responsibly and know about privacy settings", reviewDate: "2025-08-01", parentInformed: true },
    { id: "ga-a3", homeId: "oak-house", childId: "child-alex", childName: "Alex", assessmentDate: "2025-03-15", assessedBy: "Sarah Johnson", area: "medical_routine", outcome: "partially_competent", reasoning: "Alex understands basic medical decisions but needs support for complex ones", childViews: "I can decide about most things but want help with big decisions", reviewDate: "2025-09-15", parentInformed: true },
    { id: "ga-j1", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", assessmentDate: "2025-03-01", assessedBy: "Tom Richards", area: "internet_social_media", outcome: "not_competent", reasoning: "Jordan needs more support understanding online risks", childViews: "I want to use TikTok like my friends", reviewDate: "2025-06-01", parentInformed: true },
  ];

  const audits: ConsentAudit[] = [
    { id: "audit-1", homeId: "oak-house", auditDate: "2025-03-15", auditor: "Lisa Williams", totalRecordsChecked: 25, compliantRecords: 22, issuesFound: ["3 records missing written evidence", "1 expired consent not renewed"], actionsRequired: ["Obtain written evidence for 3 records", "Renew expired consent"], actionsCompleted: 2, nextAuditDate: "2025-09-15" },
  ];

  return { records, delegations, gillickAssessments, audits };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { records, delegations, gillickAssessments, audits } = getDemoData();
    const childIds = ["child-alex", "child-jordan", "child-morgan"];
    const result = generateConsentManagementIntelligence(
      records, delegations, gillickAssessments, audits,
      childIds, "oak-house", "2025-01-01", "2025-06-30", new Date().toISOString().split("T")[0],
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate consent management intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { records, delegations, gillickAssessments, audits, childIds, homeId, periodStart, periodEnd, referenceDate } = body;

    if (!childIds || !homeId || !periodStart || !periodEnd || !referenceDate) {
      return NextResponse.json(
        { error: "Missing required fields: childIds, homeId, periodStart, periodEnd, referenceDate" },
        { status: 400 },
      );
    }

    if (!Array.isArray(records) || !Array.isArray(delegations) || !Array.isArray(gillickAssessments) || !Array.isArray(audits) || !Array.isArray(childIds)) {
      return NextResponse.json(
        { error: "records, delegations, gillickAssessments, audits, and childIds must be arrays" },
        { status: 400 },
      );
    }

    const result = generateConsentManagementIntelligence(
      records, delegations, gillickAssessments, audits,
      childIds, homeId, periodStart, periodEnd, referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process consent management data", details: String(error) },
      { status: 500 },
    );
  }
}
