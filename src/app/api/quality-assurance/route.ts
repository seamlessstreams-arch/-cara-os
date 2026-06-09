// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Quality Assurance & Continuous Improvement API Route
//
// GET  → returns Chamberlain House demo QA intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateQualityAssuranceIntelligence } from "@/lib/quality-assurance/quality-assurance-engine";
import type {
  InternalAudit,
  ActionPlanItem,
  QualityImprovementInitiative,
  SelfEvaluationRecord,
  QualityMonitoringRecord,
} from "@/lib/quality-assurance/quality-assurance-engine";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const audits: InternalAudit[] = [
    { id: "aud-01", homeId: "oak-house", auditArea: "safeguarding", auditDate: "2025-02-15", conductedBy: "Darren Laville", rating: "good", findingsCount: 3, criticalFindings: 0, strengthsIdentified: ["Strong DBS tracking"], areasForImprovement: ["Update safeguarding policy"], previousRating: "requires_improvement", nextScheduledDate: "2025-08-15" },
    { id: "aud-02", homeId: "oak-house", auditArea: "medication", auditDate: "2025-03-01", conductedBy: "Sarah Johnson", rating: "outstanding", findingsCount: 1, criticalFindings: 0, strengthsIdentified: ["Excellent accuracy"], areasForImprovement: [], previousRating: "good", nextScheduledDate: "2025-09-01" },
    { id: "aud-03", homeId: "oak-house", auditArea: "care_planning", auditDate: "2025-03-15", conductedBy: "Lisa Williams", rating: "good", findingsCount: 4, criticalFindings: 0, strengthsIdentified: ["Child voice evident"], areasForImprovement: ["Review schedule adherence"], nextScheduledDate: "2025-09-15" },
    { id: "aud-04", homeId: "oak-house", auditArea: "record_keeping", auditDate: "2025-04-01", conductedBy: "Darren Laville", rating: "requires_improvement", findingsCount: 7, criticalFindings: 1, strengthsIdentified: ["Good digital systems"], areasForImprovement: ["Daily log quality", "Missing signatures"], previousRating: "good", nextScheduledDate: "2025-07-01" },
    { id: "aud-05", homeId: "oak-house", auditArea: "behaviour_management", auditDate: "2025-05-01", conductedBy: "Sarah Johnson", rating: "outstanding", findingsCount: 1, criticalFindings: 0, strengthsIdentified: ["Strong PBS approach"], areasForImprovement: [], previousRating: "good", nextScheduledDate: "2025-11-01" },
  ];

  const actions: ActionPlanItem[] = [
    { id: "act-01", homeId: "oak-house", source: "internal_audit", description: "Update safeguarding policy", priority: "high", assignedTo: "Darren Laville", createdDate: "2025-02-16", targetDate: "2025-03-16", completedDate: "2025-03-10", status: "completed", impactAssessed: true },
    { id: "act-02", homeId: "oak-house", source: "internal_audit", description: "Address record keeping gaps", priority: "critical", assignedTo: "Sarah Johnson", createdDate: "2025-04-02", targetDate: "2025-04-09", completedDate: "2025-04-07", status: "completed", impactAssessed: true },
    { id: "act-03", homeId: "oak-house", source: "reg44_visit", description: "Review missing procedure", priority: "high", assignedTo: "Darren Laville", createdDate: "2025-03-01", targetDate: "2025-04-01", completedDate: "2025-03-28", status: "completed", impactAssessed: false },
    { id: "act-04", homeId: "oak-house", source: "self_evaluation", description: "Staff training programme", priority: "medium", assignedTo: "Sarah Johnson", createdDate: "2025-05-01", targetDate: "2025-08-01", status: "in_progress", impactAssessed: false },
  ];

  const initiatives: QualityImprovementInitiative[] = [
    { id: "qi-01", homeId: "oak-house", title: "You Said, We Did Board", description: "Visual feedback board", startDate: "2025-02-01", targetEndDate: "2025-04-01", completedDate: "2025-03-20", status: "completed", leadBy: "Lisa Williams", linkedAuditAreas: ["children_rights"], measurableOutcome: "80% children feel heard", baselineMeasure: "45%", currentMeasure: "85%", targetMeasure: "80%", childrenInvolved: true, staffInvolved: true },
    { id: "qi-02", homeId: "oak-house", title: "Record Keeping Improvement", description: "Daily log quality initiative", startDate: "2025-04-15", targetEndDate: "2025-07-15", status: "active", leadBy: "Sarah Johnson", linkedAuditAreas: ["record_keeping"], measurableOutcome: "90% logs good quality", baselineMeasure: "55%", currentMeasure: "72%", targetMeasure: "90%", childrenInvolved: false, staffInvolved: true },
  ];

  const evaluations: SelfEvaluationRecord[] = [
    { id: "se-01", homeId: "oak-house", domain: "overall_experiences", evaluationDate: "2025-04-01", evaluatedBy: "Darren Laville", currentRating: "good", evidenceBase: ["Children's feedback", "Outcomes data"], strengths: ["Strong child voice"], areasForDevelopment: ["Transition planning"], improvementPriorities: ["Transition planning"], childVoiceIncluded: true, staffVoiceIncluded: true, externalFeedbackIncluded: true, nextReviewDate: "2025-10-01" },
    { id: "se-02", homeId: "oak-house", domain: "help_and_protection", evaluationDate: "2025-04-15", evaluatedBy: "Sarah Johnson", currentRating: "good", evidenceBase: ["Safeguarding audits"], strengths: ["Robust safeguarding"], areasForDevelopment: ["Multi-agency sharing"], improvementPriorities: ["Multi-agency protocols"], childVoiceIncluded: true, staffVoiceIncluded: true, externalFeedbackIncluded: false, nextReviewDate: "2025-10-15" },
    { id: "se-03", homeId: "oak-house", domain: "leadership_and_management", evaluationDate: "2025-05-01", evaluatedBy: "Darren Laville", currentRating: "outstanding", evidenceBase: ["Staff data", "Quality monitoring"], strengths: ["Strong supervision", "Robust audit cycle"], areasForDevelopment: ["Record keeping"], improvementPriorities: ["Daily log quality"], childVoiceIncluded: false, staffVoiceIncluded: true, externalFeedbackIncluded: true, nextReviewDate: "2025-11-01" },
  ];

  const monitoring: QualityMonitoringRecord[] = [
    { id: "mon-01", homeId: "oak-house", monitoringType: "case_file_audit", date: "2025-02-15", conductedBy: "Darren Laville", area: "care_planning", sampleSize: 3, complianceRate: 87, issuesFound: 2, goodPracticeFound: 4, followUpRequired: true, followUpCompleted: true },
    { id: "mon-02", homeId: "oak-house", monitoringType: "dip_sample", date: "2025-03-01", conductedBy: "Sarah Johnson", area: "medication", sampleSize: 10, complianceRate: 95, issuesFound: 1, goodPracticeFound: 3, followUpRequired: true, followUpCompleted: true },
    { id: "mon-03", homeId: "oak-house", monitoringType: "observation", date: "2025-04-01", conductedBy: "Darren Laville", area: "behaviour_management", sampleSize: 5, complianceRate: 92, issuesFound: 0, goodPracticeFound: 5, followUpRequired: false },
    { id: "mon-04", homeId: "oak-house", monitoringType: "compliance_check", date: "2025-05-01", conductedBy: "Tom Richards", area: "fire_safety", sampleSize: 8, complianceRate: 100, issuesFound: 0, goodPracticeFound: 2, followUpRequired: false },
  ];

  return { audits, actions, initiatives, evaluations, monitoring };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { audits, actions, initiatives, evaluations, monitoring } = getDemoData();
    const referenceDate = new Date().toISOString().split("T")[0];
    const result = generateQualityAssuranceIntelligence(
      audits, actions, initiatives, evaluations, monitoring,
      "oak-house", "2025-01-01", "2025-06-30", referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate quality assurance intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { audits, actions, initiatives, evaluations, monitoring, homeId, periodStart, periodEnd, referenceDate } = body;

    if (!audits || !actions || !initiatives || !evaluations || !monitoring || !homeId || !periodStart || !periodEnd || !referenceDate) {
      return NextResponse.json(
        { error: "Missing required fields: audits, actions, initiatives, evaluations, monitoring, homeId, periodStart, periodEnd, referenceDate" },
        { status: 400 },
      );
    }

    if (!Array.isArray(audits) || !Array.isArray(actions) || !Array.isArray(initiatives) || !Array.isArray(evaluations) || !Array.isArray(monitoring)) {
      return NextResponse.json(
        { error: "audits, actions, initiatives, evaluations, and monitoring must be arrays" },
        { status: 400 },
      );
    }

    const result = generateQualityAssuranceIntelligence(
      audits, actions, initiatives, evaluations, monitoring,
      homeId, periodStart, periodEnd, referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process quality assurance data", details: String(error) },
      { status: 500 },
    );
  }
}
