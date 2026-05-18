// ==============================================================================
// API: /api/data-protection
//
// Data Protection & GDPR Intelligence
//
// GET  -- Returns data protection assessment with Oak House demo data
// POST -- Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import { generateDataProtectionIntelligence } from "@/lib/data-protection";
import type {
  DataBreach,
  ConsentRecord,
  SubjectAccessRequest,
  DataGovernance,
} from "@/lib/data-protection/data-protection-engine";

// -- Label Maps ---------------------------------------------------------------

const breachSeverityLabels: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const breachStatusLabels: Record<string, string> = {
  detected: "Detected",
  reported: "Reported",
  investigating: "Investigating",
  resolved: "Resolved",
  closed: "Closed",
};

const consentTypeLabels: Record<string, string> = {
  photography: "Photography",
  social_media: "Social Media",
  data_sharing: "Data Sharing",
  medical_info: "Medical Information",
  education_records: "Education Records",
  therapeutic_records: "Therapeutic Records",
  contact_info: "Contact Information",
  location_tracking: "Location Tracking",
};

const consentStatusLabels: Record<string, string> = {
  given: "Given",
  refused: "Refused",
  withdrawn: "Withdrawn",
  not_sought: "Not Sought",
  expired: "Expired",
};

const sarStatusLabels: Record<string, string> = {
  received: "Received",
  acknowledged: "Acknowledged",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
  refused: "Refused",
};

const ratingLabels: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Demo Data: Oak House -----------------------------------------------------

const DEMO_BREACHES: DataBreach[] = [
  {
    id: "breach-1",
    detectedDate: "2026-02-10",
    reportedDate: "2026-02-11",
    severity: "medium",
    status: "resolved",
    childrenAffected: 1,
    staffAffected: 0,
    icoNotified: true,
    icoNotifiedWithin72Hours: true,
    containmentMeasures: [
      "Email recalled",
      "Recipient contacted and confirmed deletion",
      "Access permissions reviewed",
    ],
    rootCauseIdentified: true,
    lessonsLearned:
      "Staff reminded about double-checking recipient addresses. Auto-complete disabled for external emails containing child data.",
  },
];

const DEMO_CONSENT_RECORDS: ConsentRecord[] = [
  // Alex - 5 types covering photography, data_sharing, medical_info, therapeutic_records, education_records
  { id: "consent-alex-1", childId: "child-alex", childName: "Alex", consentType: "photography", status: "given", obtainedDate: "2026-01-10", reviewDate: "2027-01-10", obtainedFrom: "Social Worker", ageAppropriateExplained: true },
  { id: "consent-alex-2", childId: "child-alex", childName: "Alex", consentType: "data_sharing", status: "given", obtainedDate: "2026-01-10", reviewDate: "2027-01-10", obtainedFrom: "Social Worker", ageAppropriateExplained: true },
  { id: "consent-alex-3", childId: "child-alex", childName: "Alex", consentType: "medical_info", status: "given", obtainedDate: "2026-01-10", reviewDate: "2027-01-10", obtainedFrom: "Social Worker", ageAppropriateExplained: true },
  { id: "consent-alex-4", childId: "child-alex", childName: "Alex", consentType: "therapeutic_records", status: "given", obtainedDate: "2026-01-10", reviewDate: "2027-01-10", obtainedFrom: "Social Worker", ageAppropriateExplained: true },
  { id: "consent-alex-5", childId: "child-alex", childName: "Alex", consentType: "education_records", status: "given", obtainedDate: "2026-01-10", reviewDate: "2027-01-10", obtainedFrom: "Social Worker", ageAppropriateExplained: true },
  // Jordan - 5 types
  { id: "consent-jordan-1", childId: "child-jordan", childName: "Jordan", consentType: "photography", status: "given", obtainedDate: "2026-02-01", reviewDate: "2027-02-01", obtainedFrom: "Parent", ageAppropriateExplained: true },
  { id: "consent-jordan-2", childId: "child-jordan", childName: "Jordan", consentType: "data_sharing", status: "given", obtainedDate: "2026-02-01", reviewDate: "2027-02-01", obtainedFrom: "Parent", ageAppropriateExplained: true },
  { id: "consent-jordan-3", childId: "child-jordan", childName: "Jordan", consentType: "medical_info", status: "given", obtainedDate: "2026-02-01", reviewDate: "2027-02-01", obtainedFrom: "Parent", ageAppropriateExplained: true },
  { id: "consent-jordan-4", childId: "child-jordan", childName: "Jordan", consentType: "therapeutic_records", status: "given", obtainedDate: "2026-02-01", reviewDate: "2027-02-01", obtainedFrom: "Parent", ageAppropriateExplained: true },
  { id: "consent-jordan-5", childId: "child-jordan", childName: "Jordan", consentType: "education_records", status: "given", obtainedDate: "2026-02-01", reviewDate: "2027-02-01", obtainedFrom: "Parent", ageAppropriateExplained: true },
  // Morgan - 5 types
  { id: "consent-morgan-1", childId: "child-morgan", childName: "Morgan", consentType: "photography", status: "given", obtainedDate: "2026-01-20", reviewDate: "2027-01-20", obtainedFrom: "Social Worker", ageAppropriateExplained: true },
  { id: "consent-morgan-2", childId: "child-morgan", childName: "Morgan", consentType: "data_sharing", status: "given", obtainedDate: "2026-01-20", reviewDate: "2027-01-20", obtainedFrom: "Social Worker", ageAppropriateExplained: true },
  { id: "consent-morgan-3", childId: "child-morgan", childName: "Morgan", consentType: "medical_info", status: "given", obtainedDate: "2026-01-20", reviewDate: "2027-01-20", obtainedFrom: "Social Worker", ageAppropriateExplained: true },
  { id: "consent-morgan-4", childId: "child-morgan", childName: "Morgan", consentType: "therapeutic_records", status: "given", obtainedDate: "2026-01-20", reviewDate: "2027-01-20", obtainedFrom: "Social Worker", ageAppropriateExplained: true },
  { id: "consent-morgan-5", childId: "child-morgan", childName: "Morgan", consentType: "education_records", status: "given", obtainedDate: "2026-01-20", reviewDate: "2027-01-20", obtainedFrom: "Social Worker", ageAppropriateExplained: true },
];

const DEMO_SAR_REQUESTS: SubjectAccessRequest[] = [
  {
    id: "sar-1",
    requestDate: "2026-02-15",
    requesterType: "parent",
    status: "completed",
    acknowledgedWithin5Days: true,
    completedWithin30Days: true,
    redactionCompleted: true,
    qualityChecked: true,
  },
];

const DEMO_GOVERNANCE: DataGovernance[] = [
  {
    id: "gov-1",
    dataProtectionOfficerAppointed: true,
    dpiaCompleted: true,
    retentionScheduleInPlace: true,
    privacyNoticesUpToDate: true,
    staffTrainingCompliance: 95,
    lastAuditDate: "2026-02-01",
    dataProcessingRegisterMaintained: true,
    thirdPartyAgreementsReviewed: true,
  },
];

// -- GET ----------------------------------------------------------------------

export async function GET() {
  const result = generateDataProtectionIntelligence(
    DEMO_BREACHES,
    DEMO_CONSENT_RECORDS,
    DEMO_SAR_REQUESTS,
    DEMO_GOVERNANCE,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        breachSeverityLabels,
        breachStatusLabels,
        consentTypeLabels,
        consentStatusLabels,
        sarStatusLabels,
        ratingLabels,
      },
    },
  });
}

// -- POST ---------------------------------------------------------------------

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { breaches, consentRecords, sarRequests, governance, homeId, periodStart, periodEnd, referenceDate } = body as {
    breaches?: DataBreach[];
    consentRecords?: ConsentRecord[];
    sarRequests?: SubjectAccessRequest[];
    governance?: DataGovernance[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
    referenceDate?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateDataProtectionIntelligence(
    breaches ?? [],
    consentRecords ?? [],
    sarRequests ?? [],
    governance ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
    referenceDate,
  );

  return NextResponse.json({ data: result });
}
