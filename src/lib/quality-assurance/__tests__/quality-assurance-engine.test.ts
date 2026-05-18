// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Quality Assurance & Continuous Improvement Engine Tests
// 100+ tests covering all 6 functions + scoring + labels + edge cases
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateAuditCycle,
  evaluateActionTracking,
  evaluateImprovement,
  evaluateSelfEvaluation,
  evaluateMonitoring,
  generateQualityAssuranceIntelligence,
  getAuditAreaLabel,
  getActionPriorityLabel,
  getActionStatusLabel,
  getSelfEvaluationDomainLabel,
} from "../quality-assurance-engine";
import type {
  InternalAudit,
  ActionPlanItem,
  QualityImprovementInitiative,
  SelfEvaluationRecord,
  QualityMonitoringRecord,
} from "../quality-assurance-engine";

// ── Demo Data ────────────────────────────────────────────────────────────────

const demoAudits: InternalAudit[] = [
  {
    id: "aud-01", homeId: "oak-house", auditArea: "safeguarding",
    auditDate: "2025-02-15", conductedBy: "Darren Laville",
    rating: "good", findingsCount: 3, criticalFindings: 0,
    strengthsIdentified: ["Strong DBS tracking", "Regular safeguarding supervision"],
    areasForImprovement: ["Update safeguarding policy to reflect latest guidance"],
    previousRating: "requires_improvement", nextScheduledDate: "2025-08-15",
  },
  {
    id: "aud-02", homeId: "oak-house", auditArea: "medication",
    auditDate: "2025-03-01", conductedBy: "Sarah Johnson",
    rating: "outstanding", findingsCount: 1, criticalFindings: 0,
    strengthsIdentified: ["Excellent administration accuracy", "Strong self-admin programme"],
    areasForImprovement: [],
    previousRating: "good", nextScheduledDate: "2025-09-01",
  },
  {
    id: "aud-03", homeId: "oak-house", auditArea: "care_planning",
    auditDate: "2025-03-15", conductedBy: "Lisa Williams",
    rating: "good", findingsCount: 4, criticalFindings: 0,
    strengthsIdentified: ["Child voice evident in plans"],
    areasForImprovement: ["Ensure all plans reviewed within schedule", "Strengthen risk assessment links"],
    nextScheduledDate: "2025-09-15",
  },
  {
    id: "aud-04", homeId: "oak-house", auditArea: "record_keeping",
    auditDate: "2025-04-01", conductedBy: "Darren Laville",
    rating: "requires_improvement", findingsCount: 7, criticalFindings: 1,
    strengthsIdentified: ["Good use of digital systems"],
    areasForImprovement: ["Inconsistent daily log quality", "Missing signatures on some forms", "Critical: medication audit trail gap"],
    previousRating: "good", nextScheduledDate: "2025-07-01",
  },
  {
    id: "aud-05", homeId: "oak-house", auditArea: "fire_safety",
    auditDate: "2025-04-15", conductedBy: "Tom Richards",
    rating: "good", findingsCount: 2, criticalFindings: 0,
    strengthsIdentified: ["Regular drills", "Well-maintained equipment"],
    areasForImprovement: ["Vary drill times more"],
    nextScheduledDate: "2025-10-15",
  },
  {
    id: "aud-06", homeId: "oak-house", auditArea: "behaviour_management",
    auditDate: "2025-05-01", conductedBy: "Sarah Johnson",
    rating: "outstanding", findingsCount: 1, criticalFindings: 0,
    strengthsIdentified: ["Excellent PBS approach", "Strong de-escalation", "Reward:sanction ratio above 3:1"],
    areasForImprovement: [],
    previousRating: "good", nextScheduledDate: "2025-11-01",
  },
  {
    id: "aud-07", homeId: "oak-house", auditArea: "premises",
    auditDate: "2025-05-15", conductedBy: "Tom Richards",
    rating: "good", findingsCount: 3, criticalFindings: 0,
    strengthsIdentified: ["Homely environment", "Good maintenance response"],
    areasForImprovement: ["Garden fence repair outstanding"],
    nextScheduledDate: "2025-11-15",
  },
];

const demoActions: ActionPlanItem[] = [
  {
    id: "act-01", homeId: "oak-house", source: "internal_audit", sourceId: "aud-01",
    description: "Update safeguarding policy", priority: "high",
    assignedTo: "Darren Laville", createdDate: "2025-02-16",
    targetDate: "2025-03-16", completedDate: "2025-03-10",
    status: "completed", evidenceOfCompletion: "Updated policy on file", impactAssessed: true,
  },
  {
    id: "act-02", homeId: "oak-house", source: "internal_audit", sourceId: "aud-03",
    description: "Review all care plans within schedule", priority: "medium",
    assignedTo: "Lisa Williams", createdDate: "2025-03-16",
    targetDate: "2025-04-30", completedDate: "2025-04-25",
    status: "completed", impactAssessed: true,
  },
  {
    id: "act-03", homeId: "oak-house", source: "internal_audit", sourceId: "aud-04",
    description: "Address medication audit trail gap", priority: "critical",
    assignedTo: "Sarah Johnson", createdDate: "2025-04-02",
    targetDate: "2025-04-09", completedDate: "2025-04-07",
    status: "completed", evidenceOfCompletion: "New process in place", impactAssessed: true,
  },
  {
    id: "act-04", homeId: "oak-house", source: "internal_audit", sourceId: "aud-04",
    description: "Improve daily log quality through staff briefing", priority: "medium",
    assignedTo: "Tom Richards", createdDate: "2025-04-02",
    targetDate: "2025-05-02", status: "in_progress", impactAssessed: false,
  },
  {
    id: "act-05", homeId: "oak-house", source: "reg44_visit",
    description: "Review missing children procedure timing", priority: "high",
    assignedTo: "Darren Laville", createdDate: "2025-03-01",
    targetDate: "2025-04-01", completedDate: "2025-03-28",
    status: "completed", impactAssessed: false,
  },
  {
    id: "act-06", homeId: "oak-house", source: "complaint",
    description: "Improve food variety based on children's feedback", priority: "low",
    assignedTo: "Tom Richards", createdDate: "2025-04-15",
    targetDate: "2025-05-15", completedDate: "2025-05-10",
    status: "completed", impactAssessed: true,
  },
  {
    id: "act-07", homeId: "oak-house", source: "ofsted_inspection",
    description: "Strengthen multi-agency information sharing protocols", priority: "high",
    assignedTo: "Darren Laville", createdDate: "2025-01-15",
    targetDate: "2025-04-15", status: "overdue", impactAssessed: false,
  },
  {
    id: "act-08", homeId: "oak-house", source: "self_evaluation",
    description: "Develop staff trauma-informed practice development programme", priority: "medium",
    assignedTo: "Sarah Johnson", createdDate: "2025-05-01",
    targetDate: "2025-08-01", status: "in_progress", impactAssessed: false,
  },
];

const demoInitiatives: QualityImprovementInitiative[] = [
  {
    id: "qi-01", homeId: "oak-house", title: "You Said, We Did Board",
    description: "Implement visual feedback board showing children's suggestions and actions taken",
    startDate: "2025-02-01", targetEndDate: "2025-04-01", completedDate: "2025-03-20",
    status: "completed", leadBy: "Lisa Williams",
    linkedAuditAreas: ["children_rights", "complaints"],
    measurableOutcome: "80% of children report feeling heard",
    baselineMeasure: "45%", currentMeasure: "85%", targetMeasure: "80%",
    childrenInvolved: true, staffInvolved: true,
  },
  {
    id: "qi-02", homeId: "oak-house", title: "Therapeutic Parenting Training",
    description: "Deliver comprehensive therapeutic parenting training to all staff",
    startDate: "2025-03-01", targetEndDate: "2025-09-01",
    status: "active", leadBy: "Darren Laville",
    linkedAuditAreas: ["behaviour_management", "care_planning"],
    measurableOutcome: "All staff complete Level 2 therapeutic parenting by Sept 2025",
    baselineMeasure: "25%", currentMeasure: "60%", targetMeasure: "100%",
    childrenInvolved: false, staffInvolved: true,
  },
  {
    id: "qi-03", homeId: "oak-house", title: "Record Keeping Improvement",
    description: "Improve daily log quality through templates and coaching",
    startDate: "2025-04-15", targetEndDate: "2025-07-15",
    status: "active", leadBy: "Sarah Johnson",
    linkedAuditAreas: ["record_keeping"],
    measurableOutcome: "90% of daily logs rated as good quality",
    baselineMeasure: "55%", currentMeasure: "72%", targetMeasure: "90%",
    childrenInvolved: false, staffInvolved: true,
  },
];

const demoEvaluations: SelfEvaluationRecord[] = [
  {
    id: "se-01", homeId: "oak-house", domain: "overall_experiences",
    evaluationDate: "2025-04-01", evaluatedBy: "Darren Laville",
    currentRating: "good",
    evidenceBase: ["Children's feedback", "Outcome data", "Reg 44 reports"],
    strengths: ["Strong child voice", "Good educational progress"],
    areasForDevelopment: ["Strengthen transition planning for Morgan"],
    improvementPriorities: ["Transition planning", "Community integration"],
    childVoiceIncluded: true, staffVoiceIncluded: true, externalFeedbackIncluded: true,
    nextReviewDate: "2025-10-01",
  },
  {
    id: "se-02", homeId: "oak-house", domain: "help_and_protection",
    evaluationDate: "2025-04-15", evaluatedBy: "Sarah Johnson",
    currentRating: "good",
    evidenceBase: ["Safeguarding audits", "Incident analysis", "Missing data"],
    strengths: ["Robust safeguarding procedures", "Good missing children protocols"],
    areasForDevelopment: ["Multi-agency information sharing"],
    improvementPriorities: ["Multi-agency protocols"],
    childVoiceIncluded: true, staffVoiceIncluded: true, externalFeedbackIncluded: false,
    nextReviewDate: "2025-10-15",
  },
  {
    id: "se-03", homeId: "oak-house", domain: "leadership_and_management",
    evaluationDate: "2025-05-01", evaluatedBy: "Darren Laville",
    currentRating: "outstanding",
    evidenceBase: ["Staff supervision data", "Training records", "Quality monitoring"],
    strengths: ["Strong supervision framework", "Good staff development", "Robust audit cycle"],
    areasForDevelopment: ["Record keeping consistency"],
    improvementPriorities: ["Daily log quality improvement"],
    childVoiceIncluded: false, staffVoiceIncluded: true, externalFeedbackIncluded: true,
    nextReviewDate: "2025-11-01",
  },
];

const demoMonitoring: QualityMonitoringRecord[] = [
  {
    id: "mon-01", homeId: "oak-house", monitoringType: "case_file_audit",
    date: "2025-02-15", conductedBy: "Darren Laville", area: "care_planning",
    sampleSize: 3, complianceRate: 87, issuesFound: 2, goodPracticeFound: 4,
    followUpRequired: true, followUpCompleted: true,
  },
  {
    id: "mon-02", homeId: "oak-house", monitoringType: "dip_sample",
    date: "2025-03-01", conductedBy: "Sarah Johnson", area: "medication",
    sampleSize: 10, complianceRate: 95, issuesFound: 1, goodPracticeFound: 3,
    followUpRequired: true, followUpCompleted: true,
  },
  {
    id: "mon-03", homeId: "oak-house", monitoringType: "observation",
    date: "2025-03-15", conductedBy: "Darren Laville", area: "behaviour_management",
    sampleSize: 5, complianceRate: 92, issuesFound: 0, goodPracticeFound: 5,
    followUpRequired: false,
  },
  {
    id: "mon-04", homeId: "oak-house", monitoringType: "compliance_check",
    date: "2025-04-01", conductedBy: "Tom Richards", area: "fire_safety",
    sampleSize: 8, complianceRate: 100, issuesFound: 0, goodPracticeFound: 2,
    followUpRequired: false,
  },
  {
    id: "mon-05", homeId: "oak-house", monitoringType: "theme_review",
    date: "2025-04-15", conductedBy: "Lisa Williams", area: "record_keeping",
    sampleSize: 15, complianceRate: 65, issuesFound: 5, goodPracticeFound: 1,
    followUpRequired: true, followUpCompleted: false,
  },
  {
    id: "mon-06", homeId: "oak-house", monitoringType: "dip_sample",
    date: "2025-05-01", conductedBy: "Sarah Johnson", area: "safeguarding",
    sampleSize: 5, complianceRate: 90, issuesFound: 1, goodPracticeFound: 3,
    followUpRequired: true, followUpCompleted: true,
  },
];

const REF_DATE = "2025-06-15";

// ══════════════════════════════════════════════════════════════════════════════
// Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateAuditCycle", () => {
  it("returns correct total audits", () => {
    const result = evaluateAuditCycle(demoAudits);
    expect(result.totalAudits).toBe(7);
  });

  it("counts areas audited", () => {
    const result = evaluateAuditCycle(demoAudits);
    expect(result.areasAudited).toBe(7);
  });

  it("returns total audit areas", () => {
    const result = evaluateAuditCycle(demoAudits);
    expect(result.totalAuditAreas).toBe(15);
  });

  it("calculates coverage rate", () => {
    const result = evaluateAuditCycle(demoAudits);
    // 7/15 = 47%
    expect(result.coverageRate).toBe(47);
  });

  it("calculates rating breakdown", () => {
    const result = evaluateAuditCycle(demoAudits);
    expect(result.ratingBreakdown.outstanding).toBe(2);
    expect(result.ratingBreakdown.good).toBe(4);
    expect(result.ratingBreakdown.requires_improvement).toBe(1);
    expect(result.ratingBreakdown.inadequate).toBe(0);
  });

  it("calculates average findings", () => {
    const result = evaluateAuditCycle(demoAudits);
    // (3+1+4+7+2+1+3)/7 = 3.0
    expect(result.averageFindings).toBe(3);
  });

  it("totals critical findings", () => {
    const result = evaluateAuditCycle(demoAudits);
    expect(result.criticalFindingsTotal).toBe(1);
  });

  it("identifies improving areas", () => {
    const result = evaluateAuditCycle(demoAudits);
    // safeguarding: RI → good, medication: good → outstanding, behaviour: good → outstanding
    expect(result.improvingAreas).toContain("safeguarding");
    expect(result.improvingAreas).toContain("medication");
    expect(result.improvingAreas).toContain("behaviour_management");
  });

  it("identifies declining areas", () => {
    const result = evaluateAuditCycle(demoAudits);
    // record_keeping: good → requires_improvement
    expect(result.decliningAreas).toContain("record_keeping");
  });

  it("returns score > 0", () => {
    const result = evaluateAuditCycle(demoAudits);
    expect(result.overallAuditScore).toBeGreaterThan(0);
  });

  it("handles empty audits", () => {
    const result = evaluateAuditCycle([]);
    expect(result.totalAudits).toBe(0);
    expect(result.overallAuditScore).toBe(0);
  });

  it("gives higher score with better ratings", () => {
    const goodAudits: InternalAudit[] = Array.from({ length: 15 }, (_, i) => ({
      id: `a-${i}`, homeId: "test", auditArea: ["safeguarding", "medication", "care_planning", "behaviour_management", "health_wellbeing", "education", "premises", "staffing", "record_keeping", "complaints", "fire_safety", "missing_children", "contact_arrangements", "key_working", "children_rights"][i] as InternalAudit["auditArea"],
      auditDate: "2025-06-01", conductedBy: "Auditor", rating: "outstanding" as const,
      findingsCount: 0, criticalFindings: 0,
      strengthsIdentified: [], areasForImprovement: [],
      nextScheduledDate: "2025-12-01",
    }));
    const result = evaluateAuditCycle(goodAudits);
    expect(result.overallAuditScore).toBeGreaterThanOrEqual(90);
  });
});

describe("evaluateActionTracking", () => {
  it("returns total actions", () => {
    const result = evaluateActionTracking(demoActions, REF_DATE);
    expect(result.totalActions).toBe(8);
  });

  it("counts completed actions", () => {
    const result = evaluateActionTracking(demoActions, REF_DATE);
    expect(result.completedActions).toBe(5); // act-01, 02, 03, 05, 06
  });

  it("counts overdue actions", () => {
    const result = evaluateActionTracking(demoActions, REF_DATE);
    // act-07 is explicitly overdue
    expect(result.overdueActions).toBeGreaterThanOrEqual(1);
  });

  it("counts in-progress actions", () => {
    const result = evaluateActionTracking(demoActions, REF_DATE);
    expect(result.inProgressActions).toBeGreaterThanOrEqual(1);
  });

  it("calculates completion rate", () => {
    const result = evaluateActionTracking(demoActions, REF_DATE);
    expect(result.completionRate).toBe(63); // 5/8 = 62.5% → 63%
  });

  it("calculates overdue rate", () => {
    const result = evaluateActionTracking(demoActions, REF_DATE);
    expect(result.overdueRate).toBeGreaterThan(0);
  });

  it("calculates average completion days", () => {
    const result = evaluateActionTracking(demoActions, REF_DATE);
    expect(result.averageCompletionDays).toBeGreaterThan(0);
  });

  it("tracks critical overdue actions", () => {
    const result = evaluateActionTracking(demoActions, REF_DATE);
    // No critical actions are overdue in demo data (act-03 critical but completed)
    expect(result.criticalActionsOverdue).toBe(0);
  });

  it("provides source breakdown", () => {
    const result = evaluateActionTracking(demoActions, REF_DATE);
    expect(result.sourceBreakdown.internal_audit).toBe(4);
    expect(result.sourceBreakdown.reg44_visit).toBe(1);
    expect(result.sourceBreakdown.complaint).toBe(1);
  });

  it("calculates impact assessed rate", () => {
    const result = evaluateActionTracking(demoActions, REF_DATE);
    // act-01, act-02, act-03, act-06 have impactAssessed = true → 4/8 = 50%
    expect(result.impactAssessedRate).toBe(50);
  });

  it("returns score > 0", () => {
    const result = evaluateActionTracking(demoActions, REF_DATE);
    expect(result.overallActionScore).toBeGreaterThan(0);
  });

  it("handles empty actions", () => {
    const result = evaluateActionTracking([], REF_DATE);
    expect(result.totalActions).toBe(0);
    expect(result.overallActionScore).toBe(0);
  });

  it("gives high score when all actions completed with impact", () => {
    const perfect: ActionPlanItem[] = Array.from({ length: 5 }, (_, i) => ({
      id: `p-${i}`, homeId: "test", source: "internal_audit" as const,
      description: "Test", priority: "medium" as const,
      assignedTo: "Staff", createdDate: "2025-01-01",
      targetDate: "2025-03-01", completedDate: "2025-02-15",
      status: "completed" as const, impactAssessed: true,
    }));
    const result = evaluateActionTracking(perfect, REF_DATE);
    expect(result.completionRate).toBe(100);
    expect(result.overallActionScore).toBeGreaterThanOrEqual(90);
  });

  it("detects actions past target date as overdue even if not marked", () => {
    const pastDue: ActionPlanItem[] = [{
      id: "pd-1", homeId: "test", source: "internal_audit",
      description: "Overdue task", priority: "high",
      assignedTo: "Staff", createdDate: "2025-01-01",
      targetDate: "2025-05-01", // Past REF_DATE
      status: "in_progress", impactAssessed: false,
    }];
    const result = evaluateActionTracking(pastDue, REF_DATE);
    expect(result.overdueActions).toBe(1);
  });
});

describe("evaluateImprovement", () => {
  it("returns total initiatives", () => {
    const result = evaluateImprovement(demoInitiatives);
    expect(result.totalInitiatives).toBe(3);
  });

  it("counts active initiatives", () => {
    const result = evaluateImprovement(demoInitiatives);
    expect(result.activeInitiatives).toBe(2);
  });

  it("counts completed initiatives", () => {
    const result = evaluateImprovement(demoInitiatives);
    expect(result.completedInitiatives).toBe(1);
  });

  it("calculates completion rate from completable total", () => {
    const result = evaluateImprovement(demoInitiatives);
    // 1 completed out of 3 completable (all are active or completed)
    expect(result.completionRate).toBe(33);
  });

  it("calculates child involvement rate", () => {
    const result = evaluateImprovement(demoInitiatives);
    // qi-01 involves children → 1/3 = 33%
    expect(result.childInvolvementRate).toBe(33);
  });

  it("calculates staff involvement rate", () => {
    const result = evaluateImprovement(demoInitiatives);
    // All 3 involve staff → 100%
    expect(result.staffInvolvementRate).toBe(100);
  });

  it("calculates measurable outcome rate", () => {
    const result = evaluateImprovement(demoInitiatives);
    // All 3 have currentMeasure → 100%
    expect(result.measurableOutcomeRate).toBe(100);
  });

  it("calculates linked to audit rate", () => {
    const result = evaluateImprovement(demoInitiatives);
    // All 3 have linkedAuditAreas → 100%
    expect(result.linkedToAuditRate).toBe(100);
  });

  it("returns score > 0", () => {
    const result = evaluateImprovement(demoInitiatives);
    expect(result.overallImprovementScore).toBeGreaterThan(0);
  });

  it("handles empty initiatives", () => {
    const result = evaluateImprovement([]);
    expect(result.totalInitiatives).toBe(0);
    expect(result.overallImprovementScore).toBe(0);
  });
});

describe("evaluateSelfEvaluation", () => {
  it("returns total evaluations", () => {
    const result = evaluateSelfEvaluation(demoEvaluations);
    expect(result.totalEvaluations).toBe(3);
  });

  it("counts domains covered", () => {
    const result = evaluateSelfEvaluation(demoEvaluations);
    expect(result.domainsCovered).toBe(3); // All 3 SCCIF domains
  });

  it("returns total domains", () => {
    const result = evaluateSelfEvaluation(demoEvaluations);
    expect(result.totalDomains).toBe(3);
  });

  it("calculates average rating", () => {
    const result = evaluateSelfEvaluation(demoEvaluations);
    // good(3) + good(3) + outstanding(4) = 10/3 = 3.3
    expect(result.averageRating).toBe(3.3);
  });

  it("calculates child voice rate", () => {
    const result = evaluateSelfEvaluation(demoEvaluations);
    // se-01 and se-02 include child voice → 2/3 = 67%
    expect(result.childVoiceRate).toBe(67);
  });

  it("calculates staff voice rate", () => {
    const result = evaluateSelfEvaluation(demoEvaluations);
    // All 3 include staff voice → 100%
    expect(result.staffVoiceRate).toBe(100);
  });

  it("calculates external feedback rate", () => {
    const result = evaluateSelfEvaluation(demoEvaluations);
    // se-01 and se-03 include external → 2/3 = 67%
    expect(result.externalFeedbackRate).toBe(67);
  });

  it("provides rating breakdown", () => {
    const result = evaluateSelfEvaluation(demoEvaluations);
    expect(result.ratingBreakdown.good).toBe(2);
    expect(result.ratingBreakdown.outstanding).toBe(1);
  });

  it("returns score > 0", () => {
    const result = evaluateSelfEvaluation(demoEvaluations);
    expect(result.overallSelfEvalScore).toBeGreaterThan(0);
  });

  it("handles empty evaluations", () => {
    const result = evaluateSelfEvaluation([]);
    expect(result.totalEvaluations).toBe(0);
    expect(result.overallSelfEvalScore).toBe(0);
  });

  it("achieves high score with full coverage and strong voices", () => {
    const perfect: SelfEvaluationRecord[] = [
      { id: "p1", homeId: "test", domain: "overall_experiences", evaluationDate: "2025-06-01", evaluatedBy: "RM", currentRating: "outstanding", evidenceBase: ["data"], strengths: ["strong"], areasForDevelopment: [], improvementPriorities: [], childVoiceIncluded: true, staffVoiceIncluded: true, externalFeedbackIncluded: true, nextReviewDate: "2025-12-01" },
      { id: "p2", homeId: "test", domain: "help_and_protection", evaluationDate: "2025-06-01", evaluatedBy: "RM", currentRating: "outstanding", evidenceBase: ["data"], strengths: ["strong"], areasForDevelopment: [], improvementPriorities: [], childVoiceIncluded: true, staffVoiceIncluded: true, externalFeedbackIncluded: true, nextReviewDate: "2025-12-01" },
      { id: "p3", homeId: "test", domain: "leadership_and_management", evaluationDate: "2025-06-01", evaluatedBy: "RM", currentRating: "outstanding", evidenceBase: ["data"], strengths: ["strong"], areasForDevelopment: [], improvementPriorities: [], childVoiceIncluded: true, staffVoiceIncluded: true, externalFeedbackIncluded: true, nextReviewDate: "2025-12-01" },
    ];
    const result = evaluateSelfEvaluation(perfect);
    expect(result.overallSelfEvalScore).toBe(100);
  });
});

describe("evaluateMonitoring", () => {
  it("returns total monitoring count", () => {
    const result = evaluateMonitoring(demoMonitoring);
    expect(result.totalMonitoring).toBe(6);
  });

  it("calculates average compliance rate", () => {
    const result = evaluateMonitoring(demoMonitoring);
    // (87+95+92+100+65+90)/6 = 88.2 → 88
    expect(result.averageComplianceRate).toBe(88);
  });

  it("calculates follow-up required rate", () => {
    const result = evaluateMonitoring(demoMonitoring);
    // 4/6 require follow-up → 67%
    expect(result.followUpRequiredRate).toBe(67);
  });

  it("calculates follow-up completed rate", () => {
    const result = evaluateMonitoring(demoMonitoring);
    // 3 of 4 requiring follow-up completed → 75%
    expect(result.followUpCompletedRate).toBe(75);
  });

  it("provides area breakdown", () => {
    const result = evaluateMonitoring(demoMonitoring);
    expect(result.areaBreakdown.care_planning).toBe(1);
    expect(result.areaBreakdown.medication).toBe(1);
    expect(result.areaBreakdown.behaviour_management).toBe(1);
  });

  it("returns score > 0", () => {
    const result = evaluateMonitoring(demoMonitoring);
    expect(result.overallMonitoringScore).toBeGreaterThan(0);
  });

  it("handles empty monitoring", () => {
    const result = evaluateMonitoring([]);
    expect(result.totalMonitoring).toBe(0);
    expect(result.overallMonitoringScore).toBe(0);
  });

  it("gives full follow-up score when no follow-up required", () => {
    const noFollowUp: QualityMonitoringRecord[] = [{
      id: "m1", homeId: "test", monitoringType: "observation",
      date: "2025-06-01", conductedBy: "Staff", area: "safeguarding",
      sampleSize: 5, complianceRate: 100, issuesFound: 0,
      goodPracticeFound: 3, followUpRequired: false,
    }];
    const result = evaluateMonitoring(noFollowUp);
    expect(result.followUpCompletedRate).toBe(100);
  });
});

describe("generateQualityAssuranceIntelligence", () => {
  const result = generateQualityAssuranceIntelligence(
    demoAudits, demoActions, demoInitiatives, demoEvaluations, demoMonitoring,
    "oak-house", "2025-01-01", "2025-06-30", REF_DATE,
  );

  it("returns correct homeId", () => {
    expect(result.homeId).toBe("oak-house");
  });

  it("returns correct period", () => {
    expect(result.periodStart).toBe("2025-01-01");
    expect(result.periodEnd).toBe("2025-06-30");
  });

  it("returns overall score between 0 and 100", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns valid rating", () => {
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes audit cycle results", () => {
    expect(result.auditCycle.totalAudits).toBe(7);
  });

  it("includes action tracking results", () => {
    expect(result.actionTracking.totalActions).toBe(8);
  });

  it("includes improvement results", () => {
    expect(result.improvement.totalInitiatives).toBe(3);
  });

  it("includes self-evaluation results", () => {
    expect(result.selfEvaluation.totalEvaluations).toBe(3);
  });

  it("includes monitoring results", () => {
    expect(result.monitoring.totalMonitoring).toBe(6);
  });

  it("generates strengths", () => {
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement", () => {
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("flags declining areas", () => {
    expect(result.areasForImprovement.some((a) => a.includes("Declining") || a.includes("declining") || a.includes("record_keeping") || a.includes("Record Keeping"))).toBe(true);
  });

  it("generates actions", () => {
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("includes regulatory links", () => {
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 13"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 45"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("flags overdue actions", () => {
    expect(result.areasForImprovement.some((a) => a.includes("overdue"))).toBe(true);
  });

  it("flags critical findings", () => {
    expect(result.areasForImprovement.some((a) => a.includes("critical"))).toBe(true);
  });
});

describe("scoring thresholds", () => {
  it("returns inadequate for empty data", () => {
    const result = generateQualityAssuranceIntelligence(
      [], [], [], [], [],
      "test", "2025-01-01", "2025-06-30", REF_DATE,
    );
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBeLessThan(40);
  });

  it("demo data produces a valid score", () => {
    const result = generateQualityAssuranceIntelligence(
      demoAudits, demoActions, demoInitiatives, demoEvaluations, demoMonitoring,
      "oak-house", "2025-01-01", "2025-06-30", REF_DATE,
    );
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });
});

describe("label functions", () => {
  it("getAuditAreaLabel returns correct labels", () => {
    expect(getAuditAreaLabel("safeguarding")).toBe("Safeguarding");
    expect(getAuditAreaLabel("medication")).toBe("Medication");
    expect(getAuditAreaLabel("care_planning")).toBe("Care Planning");
    expect(getAuditAreaLabel("behaviour_management")).toBe("Behaviour Management");
    expect(getAuditAreaLabel("health_wellbeing")).toBe("Health & Wellbeing");
    expect(getAuditAreaLabel("education")).toBe("Education");
    expect(getAuditAreaLabel("premises")).toBe("Premises");
    expect(getAuditAreaLabel("staffing")).toBe("Staffing");
    expect(getAuditAreaLabel("record_keeping")).toBe("Record Keeping");
    expect(getAuditAreaLabel("complaints")).toBe("Complaints");
    expect(getAuditAreaLabel("fire_safety")).toBe("Fire Safety");
    expect(getAuditAreaLabel("missing_children")).toBe("Missing Children");
    expect(getAuditAreaLabel("contact_arrangements")).toBe("Contact Arrangements");
    expect(getAuditAreaLabel("key_working")).toBe("Key Working");
    expect(getAuditAreaLabel("children_rights")).toBe("Children's Rights");
  });

  it("getActionPriorityLabel returns correct labels", () => {
    expect(getActionPriorityLabel("critical")).toBe("Critical");
    expect(getActionPriorityLabel("high")).toBe("High");
    expect(getActionPriorityLabel("medium")).toBe("Medium");
    expect(getActionPriorityLabel("low")).toBe("Low");
  });

  it("getActionStatusLabel returns correct labels", () => {
    expect(getActionStatusLabel("open")).toBe("Open");
    expect(getActionStatusLabel("in_progress")).toBe("In Progress");
    expect(getActionStatusLabel("completed")).toBe("Completed");
    expect(getActionStatusLabel("overdue")).toBe("Overdue");
    expect(getActionStatusLabel("deferred")).toBe("Deferred");
  });

  it("getSelfEvaluationDomainLabel returns correct labels", () => {
    expect(getSelfEvaluationDomainLabel("overall_experiences")).toBe("Overall Experiences & Progress");
    expect(getSelfEvaluationDomainLabel("help_and_protection")).toBe("How Well Children Are Helped & Protected");
    expect(getSelfEvaluationDomainLabel("leadership_and_management")).toBe("Effectiveness of Leaders & Managers");
  });
});
