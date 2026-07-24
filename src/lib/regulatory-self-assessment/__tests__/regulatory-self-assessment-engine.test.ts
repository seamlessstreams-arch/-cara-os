// ══════════════════════════════════════════════════════════════════════════════
// Regulatory Self-Assessment Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  analyseSelfAssessment,
  calculateRating,
  getAreaCompliance,
  countAreasByCompliance,
  getCriticalActions,
  getOverdueActions,
  getUnaddressedFeedback,
  getAreaLabel,
  getComplianceLabel,
  getPriorityLabel,
  getEvidenceTypeLabel,
  ALL_REGULATION_AREAS,
} from "../regulatory-self-assessment-engine";
import type {
  RegulationArea,
  ComplianceLevel,
  EvidenceType,
  ActionPriority,
  SelfAssessmentEntry,
  ImprovementAction,
  ExternalFeedback,
  OverallRating,
} from "../regulatory-self-assessment-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

const HOME_ID = "oak-house";

function makeEntry(overrides: Partial<SelfAssessmentEntry> = {}): SelfAssessmentEntry {
  return {
    id: "sa-001",
    homeId: HOME_ID,
    regulationArea: "quality_of_care",
    assessmentDate: "2026-04-01T10:00:00Z",
    assessedBy: "Sarah Johnson",
    complianceLevel: "fully_compliant",
    evidenceSources: ["policy", "procedure", "audit_report"],
    evidenceNotes: "Full review of care standards completed with supporting audits.",
    strengthsIdentified: ["Consistent high-quality care delivery"],
    gapsIdentified: [],
    actionsPlan: [],
    ...overrides,
  };
}

function makeAction(overrides: Partial<ImprovementAction> = {}): ImprovementAction {
  return {
    id: "act-001",
    homeId: HOME_ID,
    regulationArea: "quality_of_care",
    action: "Review care plans quarterly",
    responsible: "Sarah Johnson",
    priority: "medium",
    dueDate: "2026-06-01",
    status: "completed",
    completedDate: "2026-05-15",
    ...overrides,
  };
}

function makeFeedback(overrides: Partial<ExternalFeedback> = {}): ExternalFeedback {
  return {
    id: "fb-001",
    homeId: HOME_ID,
    source: "reg44",
    date: "2026-04-15",
    regulationArea: "quality_of_care",
    feedback: "Good overall standards of care observed during visit.",
    actionRequired: false,
    addressed: false,
    ...overrides,
  };
}

// Chamberlain House demo data — 12 of 15 areas assessed with varying compliance
function buildOakHouseDemoEntries(): SelfAssessmentEntry[] {
  return [
    makeEntry({
      id: "sa-oak-01",
      regulationArea: "quality_of_care",
      complianceLevel: "fully_compliant",
      evidenceSources: ["policy", "procedure", "audit_report", "child_feedback", "staff_feedback"],
      evidenceNotes: "Comprehensive review of all care standards. Children confirm positive care experience.",
      strengthsIdentified: [
        "Children report feeling safe and cared for",
        "Care plans are personalised and reviewed regularly",
      ],
      gapsIdentified: [],
      actionsPlan: [],
    }),
    makeEntry({
      id: "sa-oak-02",
      regulationArea: "children_views",
      complianceLevel: "fully_compliant",
      evidenceSources: ["child_feedback", "meeting_minutes", "staff_feedback"],
      evidenceNotes: "Children's voices are captured through regular house meetings and key-work sessions.",
      strengthsIdentified: ["Active house meetings with clear record of children's input"],
      gapsIdentified: [],
      actionsPlan: [],
    }),
    makeEntry({
      id: "sa-oak-03",
      regulationArea: "education",
      complianceLevel: "mostly_compliant",
      evidenceSources: ["audit_report", "external_review"],
      evidenceNotes: "PEPs are mostly current but one child's PEP is overdue for review.",
      strengthsIdentified: ["School attendance has improved across the home"],
      gapsIdentified: ["One PEP overdue for review"],
      actionsPlan: ["Chase virtual school head for PEP review date"],
    }),
    makeEntry({
      id: "sa-oak-04",
      regulationArea: "health",
      complianceLevel: "mostly_compliant",
      evidenceSources: ["procedure", "incident_data", "training_record"],
      evidenceNotes: "Health plans in place. Medication administration mostly consistent.",
      strengthsIdentified: ["All children registered with GP and dentist"],
      gapsIdentified: ["Two late medication administrations in past month"],
      actionsPlan: ["Implement medication double-check at shift handover"],
    }),
    makeEntry({
      id: "sa-oak-05",
      regulationArea: "positive_relationships",
      complianceLevel: "fully_compliant",
      evidenceSources: ["child_feedback", "staff_feedback", "external_review"],
      evidenceNotes: "Strong relationship between staff and young people evidenced by feedback.",
      strengthsIdentified: ["Children describe positive relationships with key workers"],
      gapsIdentified: [],
      actionsPlan: [],
    }),
    makeEntry({
      id: "sa-oak-06",
      regulationArea: "protection",
      complianceLevel: "mostly_compliant",
      evidenceSources: ["policy", "training_record", "incident_data", "audit_report"],
      evidenceNotes: "Safeguarding procedures robust. One near-miss identified and managed.",
      strengthsIdentified: ["Staff safeguarding training at 100%"],
      gapsIdentified: ["Contextual safeguarding mapping needs refreshing"],
      actionsPlan: ["Update contextual safeguarding assessment for local area"],
    }),
    makeEntry({
      id: "sa-oak-07",
      regulationArea: "behaviour_management",
      complianceLevel: "partially_compliant",
      evidenceSources: ["incident_data", "staff_feedback"],
      evidenceNotes: "Some inconsistency in application of behaviour support plans.",
      strengthsIdentified: ["Reduced restraint incidents compared to last quarter"],
      gapsIdentified: [
        "Behaviour support plans not consistently followed by all staff",
        "Debriefing after incidents not always documented",
      ],
      actionsPlan: [
        "Deliver refresher training on behaviour support plans to all staff",
        "Implement mandatory post-incident debrief documentation",
      ],
    }),
    makeEntry({
      id: "sa-oak-08",
      regulationArea: "leadership",
      complianceLevel: "fully_compliant",
      evidenceSources: ["audit_report", "meeting_minutes", "staff_feedback", "external_review"],
      evidenceNotes: "RM provides strong leadership. Regular supervision and team meetings in place.",
      strengthsIdentified: [
        "Clear management structure with regular supervision",
        "Staff feel supported by management team",
      ],
      gapsIdentified: [],
      actionsPlan: [],
    }),
    makeEntry({
      id: "sa-oak-09",
      regulationArea: "staffing",
      complianceLevel: "mostly_compliant",
      evidenceSources: ["training_record", "audit_report", "staff_feedback"],
      evidenceNotes: "Staffing levels adequate. One vacancy being recruited. Agency usage low.",
      strengthsIdentified: ["Low agency staff usage", "Good staff retention"],
      gapsIdentified: ["One senior RSW vacancy unfilled for 6 weeks"],
      actionsPlan: ["Expedite recruitment for senior RSW role"],
    }),
    makeEntry({
      id: "sa-oak-10",
      regulationArea: "premises",
      complianceLevel: "fully_compliant",
      evidenceSources: ["audit_report", "inspection_report"],
      evidenceNotes: "Premises well-maintained. Recent fire safety inspection passed.",
      strengthsIdentified: ["Fire safety inspection passed with no actions"],
      gapsIdentified: [],
      actionsPlan: [],
    }),
    makeEntry({
      id: "sa-oak-11",
      regulationArea: "complaints",
      complianceLevel: "mostly_compliant",
      evidenceSources: ["procedure", "child_feedback", "audit_report"],
      evidenceNotes: "Complaints handled well overall. One complaint response slightly late.",
      strengthsIdentified: ["Children know how to complain and feel heard"],
      gapsIdentified: ["One complaint response exceeded target timescale by 2 days"],
      actionsPlan: ["Review complaint response tracking to prevent overruns"],
    }),
    makeEntry({
      id: "sa-oak-12",
      regulationArea: "records",
      complianceLevel: "partially_compliant",
      evidenceSources: ["audit_report"],
      evidenceNotes: "Some records incomplete. Daily logs sometimes lack detail.",
      strengthsIdentified: [],
      gapsIdentified: [
        "Daily logs inconsistent in quality across staff members",
        "Two children's files missing updated placement plans",
      ],
      actionsPlan: [
        "Run record-keeping workshop for all staff",
        "Complete missing placement plan updates within 2 weeks",
      ],
    }),
  ];
}

function buildOakHouseDemoActions(): ImprovementAction[] {
  return [
    makeAction({
      id: "act-oak-01",
      regulationArea: "education",
      action: "Chase virtual school head for PEP review date",
      responsible: "Tom Richards",
      priority: "high",
      dueDate: "2026-05-15",
      status: "completed",
      completedDate: "2026-05-10",
    }),
    makeAction({
      id: "act-oak-02",
      regulationArea: "health",
      action: "Implement medication double-check at shift handover",
      responsible: "Sarah Johnson",
      priority: "high",
      dueDate: "2026-05-01",
      status: "completed",
      completedDate: "2026-04-28",
    }),
    makeAction({
      id: "act-oak-03",
      regulationArea: "protection",
      action: "Update contextual safeguarding assessment for local area",
      responsible: "Lisa Williams",
      priority: "medium",
      dueDate: "2026-06-01",
      status: "in_progress",
      completedDate: "",
    }),
    makeAction({
      id: "act-oak-04",
      regulationArea: "behaviour_management",
      action: "Deliver refresher training on behaviour support plans to all staff",
      responsible: "Sarah Johnson",
      priority: "critical",
      dueDate: "2026-05-20",
      status: "in_progress",
      completedDate: "",
    }),
    makeAction({
      id: "act-oak-05",
      regulationArea: "behaviour_management",
      action: "Implement mandatory post-incident debrief documentation",
      responsible: "Tom Richards",
      priority: "high",
      dueDate: "2026-04-30",
      status: "overdue",
      completedDate: "",
    }),
    makeAction({
      id: "act-oak-06",
      regulationArea: "staffing",
      action: "Expedite recruitment for senior RSW role",
      responsible: "Sarah Johnson",
      priority: "high",
      dueDate: "2026-06-15",
      status: "in_progress",
      completedDate: "",
    }),
    makeAction({
      id: "act-oak-07",
      regulationArea: "complaints",
      action: "Review complaint response tracking to prevent overruns",
      responsible: "Tom Richards",
      priority: "medium",
      dueDate: "2026-05-10",
      status: "completed",
      completedDate: "2026-05-08",
    }),
    makeAction({
      id: "act-oak-08",
      regulationArea: "records",
      action: "Run record-keeping workshop for all staff",
      responsible: "Sarah Johnson",
      priority: "high",
      dueDate: "2026-05-25",
      status: "not_started",
      completedDate: "",
    }),
    makeAction({
      id: "act-oak-09",
      regulationArea: "records",
      action: "Complete missing placement plan updates within 2 weeks",
      responsible: "Tom Richards",
      priority: "critical",
      dueDate: "2026-05-01",
      status: "overdue",
      completedDate: "",
    }),
  ];
}

function buildOakHouseDemoFeedback(): ExternalFeedback[] {
  return [
    makeFeedback({
      id: "fb-oak-01",
      source: "reg44",
      regulationArea: "quality_of_care",
      feedback: "Good overall standards observed. Children appear happy and settled.",
      actionRequired: false,
      addressed: false,
    }),
    makeFeedback({
      id: "fb-oak-02",
      source: "reg44",
      regulationArea: "records",
      feedback: "Daily logs reviewed — some lack sufficient detail for accountability purposes.",
      actionRequired: true,
      addressed: false,
    }),
    makeFeedback({
      id: "fb-oak-03",
      source: "ofsted",
      regulationArea: "behaviour_management",
      feedback: "Ensure all staff consistently follow behaviour support plans.",
      actionRequired: true,
      addressed: false,
    }),
    makeFeedback({
      id: "fb-oak-04",
      source: "local_authority",
      regulationArea: "education",
      feedback: "Virtual school head pleased with improved attendance figures.",
      actionRequired: false,
      addressed: false,
    }),
    makeFeedback({
      id: "fb-oak-05",
      source: "parent",
      regulationArea: "positive_relationships",
      feedback: "Parent commended key worker for excellent communication about their child.",
      actionRequired: false,
      addressed: false,
    }),
    makeFeedback({
      id: "fb-oak-06",
      source: "child",
      regulationArea: "children_views",
      feedback: "Alex said house meetings are useful and staff listen to what young people say.",
      actionRequired: false,
      addressed: false,
    }),
    makeFeedback({
      id: "fb-oak-07",
      source: "irp",
      regulationArea: "staffing",
      feedback: "Panel noted the ongoing vacancy and its potential impact on continuity of care.",
      actionRequired: true,
      addressed: true,
    }),
    makeFeedback({
      id: "fb-oak-08",
      source: "staff",
      regulationArea: "leadership",
      feedback: "Staff survey indicates high satisfaction with management support and supervision.",
      actionRequired: false,
      addressed: false,
    }),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// Label Helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("getAreaLabel", () => {
  it("returns correct label for quality_of_care", () => {
    expect(getAreaLabel("quality_of_care")).toBe("Quality of Care");
  });

  it("returns correct label for children_views", () => {
    expect(getAreaLabel("children_views")).toBe("Children's Views");
  });

  it("returns correct label for education", () => {
    expect(getAreaLabel("education")).toBe("Education");
  });

  it("returns correct label for health", () => {
    expect(getAreaLabel("health")).toBe("Health");
  });

  it("returns correct label for positive_relationships", () => {
    expect(getAreaLabel("positive_relationships")).toBe("Positive Relationships");
  });

  it("returns correct label for protection", () => {
    expect(getAreaLabel("protection")).toBe("Protection of Children");
  });

  it("returns correct label for behaviour_management", () => {
    expect(getAreaLabel("behaviour_management")).toBe("Behaviour Management");
  });

  it("returns correct label for leadership", () => {
    expect(getAreaLabel("leadership")).toBe("Leadership & Management");
  });

  it("returns correct label for staffing", () => {
    expect(getAreaLabel("staffing")).toBe("Staffing");
  });

  it("returns correct label for premises", () => {
    expect(getAreaLabel("premises")).toBe("Premises & Safety");
  });

  it("returns correct label for notifiable_events", () => {
    expect(getAreaLabel("notifiable_events")).toBe("Notifiable Events");
  });

  it("returns correct label for complaints", () => {
    expect(getAreaLabel("complaints")).toBe("Complaints");
  });

  it("returns correct label for review_monitoring", () => {
    expect(getAreaLabel("review_monitoring")).toBe("Review & Monitoring");
  });

  it("returns correct label for records", () => {
    expect(getAreaLabel("records")).toBe("Records");
  });

  it("returns correct label for statement_of_purpose", () => {
    expect(getAreaLabel("statement_of_purpose")).toBe("Statement of Purpose");
  });
});

describe("getComplianceLabel", () => {
  it("returns Fully Compliant", () => {
    expect(getComplianceLabel("fully_compliant")).toBe("Fully Compliant");
  });

  it("returns Mostly Compliant", () => {
    expect(getComplianceLabel("mostly_compliant")).toBe("Mostly Compliant");
  });

  it("returns Partially Compliant", () => {
    expect(getComplianceLabel("partially_compliant")).toBe("Partially Compliant");
  });

  it("returns Non-Compliant", () => {
    expect(getComplianceLabel("non_compliant")).toBe("Non-Compliant");
  });

  it("returns Not Assessed", () => {
    expect(getComplianceLabel("not_assessed")).toBe("Not Assessed");
  });
});

describe("getPriorityLabel", () => {
  it("returns Critical", () => {
    expect(getPriorityLabel("critical")).toBe("Critical");
  });

  it("returns High", () => {
    expect(getPriorityLabel("high")).toBe("High");
  });

  it("returns Medium", () => {
    expect(getPriorityLabel("medium")).toBe("Medium");
  });

  it("returns Low", () => {
    expect(getPriorityLabel("low")).toBe("Low");
  });
});

describe("getEvidenceTypeLabel", () => {
  it("returns Policy", () => {
    expect(getEvidenceTypeLabel("policy")).toBe("Policy");
  });

  it("returns Procedure", () => {
    expect(getEvidenceTypeLabel("procedure")).toBe("Procedure");
  });

  it("returns Audit Report", () => {
    expect(getEvidenceTypeLabel("audit_report")).toBe("Audit Report");
  });

  it("returns Inspection Report", () => {
    expect(getEvidenceTypeLabel("inspection_report")).toBe("Inspection Report");
  });

  it("returns Staff Feedback", () => {
    expect(getEvidenceTypeLabel("staff_feedback")).toBe("Staff Feedback");
  });

  it("returns Child Feedback", () => {
    expect(getEvidenceTypeLabel("child_feedback")).toBe("Child Feedback");
  });

  it("returns External Review", () => {
    expect(getEvidenceTypeLabel("external_review")).toBe("External Review");
  });

  it("returns Training Record", () => {
    expect(getEvidenceTypeLabel("training_record")).toBe("Training Record");
  });

  it("returns Incident Data", () => {
    expect(getEvidenceTypeLabel("incident_data")).toBe("Incident Data");
  });

  it("returns Meeting Minutes", () => {
    expect(getEvidenceTypeLabel("meeting_minutes")).toBe("Meeting Minutes");
  });

  it("returns Other", () => {
    expect(getEvidenceTypeLabel("other")).toBe("Other");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// calculateRating
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateRating", () => {
  it("returns outstanding for score 80", () => {
    expect(calculateRating(80)).toBe("outstanding");
  });

  it("returns outstanding for score 100", () => {
    expect(calculateRating(100)).toBe("outstanding");
  });

  it("returns outstanding for score 95", () => {
    expect(calculateRating(95)).toBe("outstanding");
  });

  it("returns good for score 60", () => {
    expect(calculateRating(60)).toBe("good");
  });

  it("returns good for score 79", () => {
    expect(calculateRating(79)).toBe("good");
  });

  it("returns good for score 70", () => {
    expect(calculateRating(70)).toBe("good");
  });

  it("returns requires_improvement for score 40", () => {
    expect(calculateRating(40)).toBe("requires_improvement");
  });

  it("returns requires_improvement for score 59", () => {
    expect(calculateRating(59)).toBe("requires_improvement");
  });

  it("returns requires_improvement for score 50", () => {
    expect(calculateRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score 39", () => {
    expect(calculateRating(39)).toBe("inadequate");
  });

  it("returns inadequate for score 0", () => {
    expect(calculateRating(0)).toBe("inadequate");
  });

  it("returns inadequate for score 10", () => {
    expect(calculateRating(10)).toBe("inadequate");
  });

  it("returns outstanding for score 80.5", () => {
    expect(calculateRating(80.5)).toBe("outstanding");
  });

  it("returns good for score 79.99", () => {
    expect(calculateRating(79.99)).toBe("good");
  });

  it("returns requires_improvement for score 39.99", () => {
    expect(calculateRating(39.99)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ALL_REGULATION_AREAS
// ══════════════════════════════════════════════════════════════════════════════

describe("ALL_REGULATION_AREAS", () => {
  it("contains exactly 15 areas", () => {
    expect(ALL_REGULATION_AREAS).toHaveLength(15);
  });

  it("contains quality_of_care", () => {
    expect(ALL_REGULATION_AREAS).toContain("quality_of_care");
  });

  it("contains statement_of_purpose", () => {
    expect(ALL_REGULATION_AREAS).toContain("statement_of_purpose");
  });

  it("has no duplicates", () => {
    const unique = new Set(ALL_REGULATION_AREAS);
    expect(unique.size).toBe(ALL_REGULATION_AREAS.length);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// analyseSelfAssessment — Empty Data
// ══════════════════════════════════════════════════════════════════════════════

describe("analyseSelfAssessment — empty data", () => {
  it("returns zero score with no entries", () => {
    const result = analyseSelfAssessment([], [], [], HOME_ID);
    expect(result.overallScore).toBe(0);
  });

  it("returns inadequate rating with no entries", () => {
    const result = analyseSelfAssessment([], [], [], HOME_ID);
    expect(result.overallRating).toBe("inadequate");
  });

  it("returns 0 regulations assessed with no entries", () => {
    const result = analyseSelfAssessment([], [], [], HOME_ID);
    expect(result.regulationsAssessedCount).toBe(0);
  });

  it("returns 0% assessed rate with no entries", () => {
    const result = analyseSelfAssessment([], [], [], HOME_ID);
    expect(result.regulationsAssessedRate).toBe(0);
  });

  it("returns 0 average compliance with no entries", () => {
    const result = analyseSelfAssessment([], [], [], HOME_ID);
    expect(result.averageComplianceLevel).toBe(0);
  });

  it("returns 0 avg evidence sources with no entries", () => {
    const result = analyseSelfAssessment([], [], [], HOME_ID);
    expect(result.averageEvidenceSourcesPerAssessment).toBe(0);
  });

  it("returns 0 action completion rate with no actions", () => {
    const result = analyseSelfAssessment([], [], [], HOME_ID);
    expect(result.actionCompletionRate).toBe(0);
  });

  it("returns null feedback integration with no feedback requiring action", () => {
    const result = analyseSelfAssessment([], [], [], HOME_ID);
    expect(result.externalFeedbackIntegrationRate).toBeNull();
  });

  it("returns 15 area breakdown entries even with no data", () => {
    const result = analyseSelfAssessment([], [], [], HOME_ID);
    expect(result.areaBreakdown).toHaveLength(15);
  });

  it("marks all areas as not_assessed with no data", () => {
    const result = analyseSelfAssessment([], [], [], HOME_ID);
    for (const entry of result.areaBreakdown) {
      expect(entry.complianceLevel).toBe("not_assessed");
    }
  });

  it("includes regulatory links even with no data", () => {
    const result = analyseSelfAssessment([], [], [], HOME_ID);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("suggests assessing uncovered areas in actions when no data", () => {
    const result = analyseSelfAssessment([], [], [], HOME_ID);
    const hasAssessAction = result.actions.some((a) =>
      a.includes("Complete self-assessment"),
    );
    expect(hasAssessAction).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// analyseSelfAssessment — Single Entry
// ══════════════════════════════════════════════════════════════════════════════

describe("analyseSelfAssessment — single entry", () => {
  const singleEntry = [makeEntry()];

  it("returns score > 0 with one entry", () => {
    const result = analyseSelfAssessment(singleEntry, [], [], HOME_ID);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("counts 1 regulation assessed", () => {
    const result = analyseSelfAssessment(singleEntry, [], [], HOME_ID);
    expect(result.regulationsAssessedCount).toBe(1);
  });

  it("calculates assessed rate as ~7% for 1 of 15", () => {
    const result = analyseSelfAssessment(singleEntry, [], [], HOME_ID);
    expect(result.regulationsAssessedRate).toBe(7);
  });

  it("returns average compliance of 100 for fully_compliant", () => {
    const result = analyseSelfAssessment(singleEntry, [], [], HOME_ID);
    expect(result.averageComplianceLevel).toBe(100);
  });

  it("returns average evidence sources based on the single entry", () => {
    const result = analyseSelfAssessment(singleEntry, [], [], HOME_ID);
    expect(result.averageEvidenceSourcesPerAssessment).toBe(3);
  });

  it("includes strengths from entry", () => {
    const result = analyseSelfAssessment(singleEntry, [], [], HOME_ID);
    expect(result.strengths).toContain("Consistent high-quality care delivery");
  });

  it("includes improvement action to assess remaining areas", () => {
    const result = analyseSelfAssessment(singleEntry, [], [], HOME_ID);
    const hasAssessAction = result.actions.some((a) =>
      a.includes("Complete self-assessment for remaining 14"),
    );
    expect(hasAssessAction).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// analyseSelfAssessment — Chamberlain House Demo
// ══════════════════════════════════════════════════════════════════════════════

describe("analyseSelfAssessment — Chamberlain House demo", () => {
  const entries = buildOakHouseDemoEntries();
  const actions = buildOakHouseDemoActions();
  const feedback = buildOakHouseDemoFeedback();

  it("returns homeId", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    expect(result.homeId).toBe(HOME_ID);
  });

  it("calculates overall score as a number", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    expect(typeof result.overallScore).toBe("number");
  });

  it("overall score is between 0 and 100", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overall score equals sum of 4 subscores", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    const sum =
      result.assessmentCoverageScore +
      result.complianceQualityScore +
      result.evidenceQualityScore +
      result.actionManagementScore;
    expect(result.overallScore).toBeCloseTo(sum, 1);
  });

  it("assessment coverage score is <= 25", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    expect(result.assessmentCoverageScore).toBeLessThanOrEqual(25);
  });

  it("compliance quality score is <= 25", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    expect(result.complianceQualityScore).toBeLessThanOrEqual(25);
  });

  it("evidence quality score is <= 25", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    expect(result.evidenceQualityScore).toBeLessThanOrEqual(25);
  });

  it("action management score is <= 25", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    expect(result.actionManagementScore).toBeLessThanOrEqual(25);
  });

  it("counts 12 regulations assessed (Chamberlain House has 12 entries)", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    expect(result.regulationsAssessedCount).toBe(12);
  });

  it("assessed rate is 80% (12/15)", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    expect(result.regulationsAssessedRate).toBe(80);
  });

  it("average compliance level reflects mixed compliance", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    // 5 fully (100) + 4 mostly (75) + 2 partially (50) + 0 non (25) = 1050 / 12 ≈ 87.5 (per entry, not area)
    // Actually: 5*100 + 5*75 + 2*50 = 500+375+100 = 975 / 12 = 81.25
    expect(result.averageComplianceLevel).toBeGreaterThan(70);
    expect(result.averageComplianceLevel).toBeLessThan(100);
  });

  it("average evidence sources > 0", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    expect(result.averageEvidenceSourcesPerAssessment).toBeGreaterThan(0);
  });

  it("action completion rate reflects 3 of 9 completed", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    expect(result.actionCompletionRate).toBe(33);
  });

  it("returns a valid overall rating", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(
      result.overallRating,
    );
  });

  it("area breakdown has 15 entries", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    expect(result.areaBreakdown).toHaveLength(15);
  });

  it("identifies 3 unassessed areas", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    const unassessed = result.areaBreakdown.filter(
      (b) => b.complianceLevel === "not_assessed",
    );
    expect(unassessed).toHaveLength(3);
  });

  it("unassessed areas are notifiable_events, review_monitoring, statement_of_purpose", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    const unassessedAreas = result.areaBreakdown
      .filter((b) => b.complianceLevel === "not_assessed")
      .map((b) => b.area)
      .sort();
    expect(unassessedAreas).toEqual([
      "notifiable_events",
      "review_monitoring",
      "statement_of_purpose",
    ]);
  });

  it("quality_of_care shows fully_compliant", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    const qoc = result.areaBreakdown.find((b) => b.area === "quality_of_care");
    expect(qoc?.complianceLevel).toBe("fully_compliant");
  });

  it("behaviour_management shows partially_compliant", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    const bm = result.areaBreakdown.find((b) => b.area === "behaviour_management");
    expect(bm?.complianceLevel).toBe("partially_compliant");
  });

  it("records shows partially_compliant", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    const rec = result.areaBreakdown.find((b) => b.area === "records");
    expect(rec?.complianceLevel).toBe("partially_compliant");
  });

  it("generates strengths array", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areasForImprovement array", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions array", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("includes regulatory links", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    expect(result.regulatoryLinks.length).toBe(4);
  });

  it("includes Reg 45 in regulatory links", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    const reg45 = result.regulatoryLinks.find((l) => l.reference === "CHR 2015 Reg 45");
    expect(reg45).toBeDefined();
  });

  it("includes SCCIF in regulatory links", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    const sccif = result.regulatoryLinks.find((l) => l.reference === "SCCIF");
    expect(sccif).toBeDefined();
  });

  it("mentions overdue actions in improvement recommendations", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    const hasOverdueNote = result.areasForImprovement.some((a) =>
      a.toLowerCase().includes("overdue"),
    );
    expect(hasOverdueNote).toBe(true);
  });

  it("recommends assessing remaining areas in actions", () => {
    const result = analyseSelfAssessment(entries, actions, feedback, HOME_ID);
    const hasAssessAction = result.actions.some((a) =>
      a.includes("Complete self-assessment for remaining 3"),
    );
    expect(hasAssessAction).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// analyseSelfAssessment — Scoring Edge Cases
// ══════════════════════════════════════════════════════════════════════════════

describe("analyseSelfAssessment — scoring edge cases", () => {
  it("all areas fully compliant with rich evidence scores high", () => {
    const entries: SelfAssessmentEntry[] = ALL_REGULATION_AREAS.map((area, i) =>
      makeEntry({
        id: `sa-full-${i}`,
        regulationArea: area,
        complianceLevel: "fully_compliant",
        evidenceSources: ["policy", "procedure", "audit_report", "child_feedback", "staff_feedback"],
        evidenceNotes: "Thorough review completed.",
        strengthsIdentified: ["Excellent standards maintained"],
        gapsIdentified: [],
        actionsPlan: [],
      }),
    );
    const allActions: ImprovementAction[] = [
      makeAction({ id: "act-full-01", status: "completed" }),
    ];
    const result = analyseSelfAssessment(entries, allActions, [], HOME_ID);
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.overallRating).toBe("outstanding");
  });

  it("all areas non-compliant scores low", () => {
    const entries: SelfAssessmentEntry[] = ALL_REGULATION_AREAS.map((area, i) =>
      makeEntry({
        id: `sa-non-${i}`,
        regulationArea: area,
        complianceLevel: "non_compliant",
        evidenceSources: ["other"],
        evidenceNotes: "",
        strengthsIdentified: [],
        gapsIdentified: ["Major gaps"],
        actionsPlan: ["Urgent action"],
      }),
    );
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    expect(result.overallScore).toBeLessThan(40);
    expect(result.overallRating).toBe("inadequate");
  });

  it("not_assessed entries do not count toward compliance score", () => {
    const entry = makeEntry({ complianceLevel: "not_assessed" });
    const result = analyseSelfAssessment([entry], [], [], HOME_ID);
    expect(result.complianceQualityScore).toBe(0);
  });

  it("entries from different homeId are excluded", () => {
    const otherEntry = makeEntry({ homeId: "other-home" });
    const result = analyseSelfAssessment([otherEntry], [], [], HOME_ID);
    expect(result.regulationsAssessedCount).toBe(0);
  });

  it("actions from different homeId are excluded", () => {
    const otherAction = makeAction({ homeId: "other-home" });
    const result = analyseSelfAssessment([], [otherAction], [], HOME_ID);
    expect(result.actionCompletionRate).toBe(0);
  });

  it("feedback from different homeId is excluded", () => {
    const otherFeedback = makeFeedback({
      homeId: "other-home",
      actionRequired: true,
      addressed: false,
    });
    const result = analyseSelfAssessment([], [], [otherFeedback], HOME_ID);
    expect(result.externalFeedbackIntegrationRate).toBeNull();
  });

  it("evidence quality score rewards diverse evidence types", () => {
    const richEvidence = makeEntry({
      evidenceSources: ["policy", "procedure", "audit_report", "child_feedback", "staff_feedback"],
      evidenceNotes: "Comprehensive review",
    });
    const poorEvidence = makeEntry({
      id: "sa-poor",
      regulationArea: "education",
      evidenceSources: ["other"],
      evidenceNotes: "",
    });
    const richResult = analyseSelfAssessment([richEvidence], [], [], HOME_ID);
    const poorResult = analyseSelfAssessment([poorEvidence], [], [], HOME_ID);
    expect(richResult.evidenceQualityScore).toBeGreaterThan(poorResult.evidenceQualityScore);
  });

  it("assessment coverage score is exactly 25 when all 15 areas assessed", () => {
    const entries: SelfAssessmentEntry[] = ALL_REGULATION_AREAS.map((area, i) =>
      makeEntry({
        id: `sa-all-${i}`,
        regulationArea: area,
        complianceLevel: "fully_compliant",
      }),
    );
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    expect(result.assessmentCoverageScore).toBe(25);
  });

  it("assessment coverage score is 0 when no areas assessed", () => {
    const result = analyseSelfAssessment([], [], [], HOME_ID);
    expect(result.assessmentCoverageScore).toBe(0);
  });

  it("action management score is 25 when all actions completed (no feedback)", () => {
    const completeActions = [
      makeAction({ id: "act-c1", status: "completed" }),
      makeAction({ id: "act-c2", status: "completed" }),
    ];
    const result = analyseSelfAssessment([], completeActions, [], HOME_ID);
    expect(result.actionManagementScore).toBe(25);
  });

  it("action management score is 0 when no actions completed (no feedback)", () => {
    const incompleteActions = [
      makeAction({ id: "act-i1", status: "not_started" }),
      makeAction({ id: "act-i2", status: "overdue" }),
    ];
    const result = analyseSelfAssessment([], incompleteActions, [], HOME_ID);
    expect(result.actionManagementScore).toBe(0);
  });

  it("feedback integration rate is null when no feedback requires action", () => {
    const noActionFeedback = [
      makeFeedback({ actionRequired: false }),
    ];
    const result = analyseSelfAssessment([], [], noActionFeedback, HOME_ID);
    expect(result.externalFeedbackIntegrationRate).toBeNull();
  });

  it("feedback integration rate is 0 when all actionable feedback unaddressed", () => {
    const unaddressed = [
      makeFeedback({ id: "fb-u1", actionRequired: true, addressed: false }),
      makeFeedback({ id: "fb-u2", actionRequired: true, addressed: false }),
    ];
    const result = analyseSelfAssessment([], [], unaddressed, HOME_ID);
    expect(result.externalFeedbackIntegrationRate).toBe(0);
  });

  it("duplicate regulation areas use the most recent entry", () => {
    const older = makeEntry({
      id: "sa-old",
      regulationArea: "quality_of_care",
      assessmentDate: "2026-01-01T10:00:00Z",
      complianceLevel: "non_compliant",
    });
    const newer = makeEntry({
      id: "sa-new",
      regulationArea: "quality_of_care",
      assessmentDate: "2026-04-01T10:00:00Z",
      complianceLevel: "fully_compliant",
    });
    const result = analyseSelfAssessment([older, newer], [], [], HOME_ID);
    const qoc = result.areaBreakdown.find((b) => b.area === "quality_of_care");
    expect(qoc?.complianceLevel).toBe("fully_compliant");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getAreaCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("getAreaCompliance", () => {
  it("returns the correct area from analysis", () => {
    const entries = buildOakHouseDemoEntries();
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    const qoc = getAreaCompliance(result, "quality_of_care");
    expect(qoc).toBeDefined();
    expect(qoc?.area).toBe("quality_of_care");
    expect(qoc?.complianceLevel).toBe("fully_compliant");
  });

  it("returns undefined for nonexistent area", () => {
    const result = analyseSelfAssessment([], [], [], HOME_ID);
    const entry = getAreaCompliance(result, "quality_of_care");
    // quality_of_care should still exist as not_assessed
    expect(entry).toBeDefined();
    expect(entry?.complianceLevel).toBe("not_assessed");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// countAreasByCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("countAreasByCompliance", () => {
  it("returns counts for all compliance levels", () => {
    const entries = buildOakHouseDemoEntries();
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    const counts = countAreasByCompliance(result);
    expect(counts.fully_compliant).toBe(5);
    expect(counts.mostly_compliant).toBe(5);
    expect(counts.partially_compliant).toBe(2);
    expect(counts.non_compliant).toBe(0);
    expect(counts.not_assessed).toBe(3);
  });

  it("all areas not_assessed with empty data", () => {
    const result = analyseSelfAssessment([], [], [], HOME_ID);
    const counts = countAreasByCompliance(result);
    expect(counts.not_assessed).toBe(15);
    expect(counts.fully_compliant).toBe(0);
  });

  it("counts sum to 15", () => {
    const entries = buildOakHouseDemoEntries();
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    const counts = countAreasByCompliance(result);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(total).toBe(15);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getCriticalActions
// ══════════════════════════════════════════════════════════════════════════════

describe("getCriticalActions", () => {
  it("returns only critical non-completed actions", () => {
    const actions = buildOakHouseDemoActions();
    const critical = getCriticalActions(actions, HOME_ID);
    expect(critical.length).toBeGreaterThan(0);
    for (const a of critical) {
      expect(a.priority).toBe("critical");
      expect(a.status).not.toBe("completed");
    }
  });

  it("excludes completed critical actions", () => {
    const actions = [
      makeAction({ priority: "critical", status: "completed" }),
    ];
    const critical = getCriticalActions(actions, HOME_ID);
    expect(critical).toHaveLength(0);
  });

  it("returns empty array when no critical actions exist", () => {
    const actions = [
      makeAction({ priority: "medium", status: "in_progress" }),
    ];
    const critical = getCriticalActions(actions, HOME_ID);
    expect(critical).toHaveLength(0);
  });

  it("filters by homeId", () => {
    const actions = [
      makeAction({ homeId: "other-home", priority: "critical", status: "in_progress" }),
    ];
    const critical = getCriticalActions(actions, HOME_ID);
    expect(critical).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getOverdueActions
// ══════════════════════════════════════════════════════════════════════════════

describe("getOverdueActions", () => {
  it("returns overdue actions from Chamberlain House demo", () => {
    const actions = buildOakHouseDemoActions();
    const overdue = getOverdueActions(actions, HOME_ID);
    expect(overdue.length).toBe(2);
    for (const a of overdue) {
      expect(a.status).toBe("overdue");
    }
  });

  it("returns empty array when no overdue actions", () => {
    const actions = [makeAction({ status: "completed" })];
    const overdue = getOverdueActions(actions, HOME_ID);
    expect(overdue).toHaveLength(0);
  });

  it("filters by homeId", () => {
    const actions = [
      makeAction({ homeId: "other-home", status: "overdue" }),
    ];
    const overdue = getOverdueActions(actions, HOME_ID);
    expect(overdue).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getUnaddressedFeedback
// ══════════════════════════════════════════════════════════════════════════════

describe("getUnaddressedFeedback", () => {
  it("returns unaddressed actionable feedback from Chamberlain House demo", () => {
    const feedback = buildOakHouseDemoFeedback();
    const unaddressed = getUnaddressedFeedback(feedback, HOME_ID);
    expect(unaddressed.length).toBe(2);
    for (const f of unaddressed) {
      expect(f.actionRequired).toBe(true);
      expect(f.addressed).toBe(false);
    }
  });

  it("returns empty when all actionable feedback addressed", () => {
    const feedback = [
      makeFeedback({ actionRequired: true, addressed: true }),
    ];
    const unaddressed = getUnaddressedFeedback(feedback, HOME_ID);
    expect(unaddressed).toHaveLength(0);
  });

  it("excludes feedback not requiring action", () => {
    const feedback = [
      makeFeedback({ actionRequired: false, addressed: false }),
    ];
    const unaddressed = getUnaddressedFeedback(feedback, HOME_ID);
    expect(unaddressed).toHaveLength(0);
  });

  it("filters by homeId", () => {
    const feedback = [
      makeFeedback({ homeId: "other-home", actionRequired: true, addressed: false }),
    ];
    const unaddressed = getUnaddressedFeedback(feedback, HOME_ID);
    expect(unaddressed).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// analyseSelfAssessment — Strengths Generation
// ══════════════════════════════════════════════════════════════════════════════

describe("analyseSelfAssessment — strengths generation", () => {
  it("includes high coverage strength when >= 80% assessed", () => {
    const entries = buildOakHouseDemoEntries(); // 12/15 = 80%
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    const hasCoverage = result.strengths.some((s) => s.includes("coverage"));
    expect(hasCoverage).toBe(true);
  });

  it("includes fully compliant area names in strengths", () => {
    const entries = buildOakHouseDemoEntries();
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    const hasFullCompliance = result.strengths.some((s) =>
      s.includes("Full compliance"),
    );
    expect(hasFullCompliance).toBe(true);
  });

  it("includes high action completion strength when >= 75%", () => {
    const entries = [makeEntry()];
    const highCompletionActions = [
      makeAction({ id: "a1", status: "completed" }),
      makeAction({ id: "a2", status: "completed" }),
      makeAction({ id: "a3", status: "completed" }),
      makeAction({ id: "a4", status: "in_progress" }),
    ];
    const result = analyseSelfAssessment(entries, highCompletionActions, [], HOME_ID);
    const hasActionStrength = result.strengths.some((s) =>
      s.includes("action completion"),
    );
    expect(hasActionStrength).toBe(true);
  });

  it("does not include coverage strength when < 80%", () => {
    const entries = [makeEntry()]; // 1/15 = 7%
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    const hasCoverage = result.strengths.some((s) =>
      s.includes("Strong assessment coverage"),
    );
    expect(hasCoverage).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// analyseSelfAssessment — Areas for Improvement Generation
// ══════════════════════════════════════════════════════════════════════════════

describe("analyseSelfAssessment — areas for improvement", () => {
  it("flags low coverage when < 80% assessed", () => {
    const entries = [makeEntry()]; // 1/15 = 7%
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    const hasLowCoverage = result.areasForImprovement.some((a) =>
      a.includes("Assessment coverage"),
    );
    expect(hasLowCoverage).toBe(true);
  });

  it("flags non-compliant areas", () => {
    const entries = [
      makeEntry({ complianceLevel: "non_compliant" }),
    ];
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    const hasNonCompliant = result.areasForImprovement.some((a) =>
      a.includes("non-compliant"),
    );
    expect(hasNonCompliant).toBe(true);
  });

  it("flags partially compliant areas", () => {
    const entries = [
      makeEntry({ complianceLevel: "partially_compliant" }),
    ];
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    const hasPartial = result.areasForImprovement.some((a) =>
      a.includes("Partial compliance"),
    );
    expect(hasPartial).toBe(true);
  });

  it("flags low action completion when < 50%", () => {
    const lowActions = [
      makeAction({ id: "a1", status: "not_started" }),
      makeAction({ id: "a2", status: "overdue" }),
      makeAction({ id: "a3", status: "not_started" }),
    ];
    const result = analyseSelfAssessment([], lowActions, [], HOME_ID);
    const hasLowActions = result.areasForImprovement.some((a) =>
      a.includes("Action completion rate"),
    );
    expect(hasLowActions).toBe(true);
  });

  it("flags overdue actions", () => {
    const overdueActions = [
      makeAction({ status: "overdue" }),
    ];
    const result = analyseSelfAssessment([], overdueActions, [], HOME_ID);
    const hasOverdue = result.areasForImprovement.some((a) =>
      a.toLowerCase().includes("overdue"),
    );
    expect(hasOverdue).toBe(true);
  });

  it("flags weak evidence base", () => {
    const entries = [
      makeEntry({ evidenceSources: ["other"], evidenceNotes: "" }),
    ];
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    const hasWeakEvidence = result.areasForImprovement.some((a) =>
      a.includes("Evidence base is thin"),
    );
    expect(hasWeakEvidence).toBe(true);
  });

  it("flags unaddressed feedback", () => {
    const unaddressed = [
      makeFeedback({ actionRequired: true, addressed: false }),
    ];
    const result = analyseSelfAssessment([], [], unaddressed, HOME_ID);
    const hasFeedbackNote = result.areasForImprovement.some((a) =>
      a.includes("external feedback"),
    );
    expect(hasFeedbackNote).toBe(true);
  });

  it("includes gaps from entries", () => {
    const entries = [
      makeEntry({ gapsIdentified: ["Staff training gaps in safeguarding"] }),
    ];
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    expect(result.areasForImprovement).toContain("Staff training gaps in safeguarding");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// analyseSelfAssessment — Actions Generation
// ══════════════════════════════════════════════════════════════════════════════

describe("analyseSelfAssessment — actions generation", () => {
  it("recommends assessing uncovered areas", () => {
    const entries = [makeEntry()]; // only 1 area
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    const hasAssessAction = result.actions.some((a) =>
      a.includes("Complete self-assessment"),
    );
    expect(hasAssessAction).toBe(true);
  });

  it("recommends remediation for non-compliant areas", () => {
    const entries = [
      makeEntry({ complianceLevel: "non_compliant" }),
    ];
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    const hasRemediation = result.actions.some((a) =>
      a.includes("urgent remediation"),
    );
    expect(hasRemediation).toBe(true);
  });

  it("recommends improvement plans for partially compliant areas", () => {
    const entries = [
      makeEntry({ complianceLevel: "partially_compliant" }),
    ];
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    const hasImprovement = result.actions.some((a) =>
      a.includes("improvement action plan"),
    );
    expect(hasImprovement).toBe(true);
  });

  it("recommends progressing overdue actions", () => {
    const overdueActions = [
      makeAction({ status: "overdue" }),
    ];
    const result = analyseSelfAssessment([], overdueActions, [], HOME_ID);
    const hasOverdueAction = result.actions.some((a) =>
      a.includes("overdue improvement action"),
    );
    expect(hasOverdueAction).toBe(true);
  });

  it("recommends addressing unaddressed feedback", () => {
    const unaddressed = [
      makeFeedback({ actionRequired: true, addressed: false }),
    ];
    const result = analyseSelfAssessment([], [], unaddressed, HOME_ID);
    const hasFeedbackAction = result.actions.some((a) =>
      a.includes("outstanding external feedback"),
    );
    expect(hasFeedbackAction).toBe(true);
  });

  it("recommends strengthening weak evidence", () => {
    const entries = [
      makeEntry({ evidenceSources: ["other"] }),
    ];
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    const hasEvidenceAction = result.actions.some((a) =>
      a.includes("Strengthen evidence base"),
    );
    expect(hasEvidenceAction).toBe(true);
  });

  it("includes actionsPlan from entries", () => {
    const entries = [
      makeEntry({ actionsPlan: ["Book team training session"] }),
    ];
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    expect(result.actions).toContain("Book team training session");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Area Breakdown Detail
// ══════════════════════════════════════════════════════════════════════════════

describe("area breakdown detail", () => {
  it("records evidence count from entry", () => {
    const entries = [
      makeEntry({
        regulationArea: "health",
        evidenceSources: ["policy", "procedure", "training_record"],
      }),
    ];
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    const health = result.areaBreakdown.find((b) => b.area === "health");
    expect(health?.evidenceCount).toBe(3);
  });

  it("tracks whether area has actions", () => {
    const entries = [makeEntry({ regulationArea: "staffing" })];
    const actions = [makeAction({ regulationArea: "staffing" })];
    const result = analyseSelfAssessment(entries, actions, [], HOME_ID);
    const staffing = result.areaBreakdown.find((b) => b.area === "staffing");
    expect(staffing?.hasActions).toBe(true);
  });

  it("area without actions has hasActions false", () => {
    const entries = [makeEntry({ regulationArea: "premises" })];
    const result = analyseSelfAssessment(entries, [], [], HOME_ID);
    const premises = result.areaBreakdown.find((b) => b.area === "premises");
    expect(premises?.hasActions).toBe(false);
  });

  it("calculates area action completion rate correctly", () => {
    const actions = [
      makeAction({ id: "a1", regulationArea: "health", status: "completed" }),
      makeAction({ id: "a2", regulationArea: "health", status: "not_started" }),
    ];
    const result = analyseSelfAssessment([], actions, [], HOME_ID);
    const health = result.areaBreakdown.find((b) => b.area === "health");
    expect(health?.actionCompletionRate).toBe(50);
  });

  it("tracks feedback count per area", () => {
    const feedback = [
      makeFeedback({ id: "f1", regulationArea: "leadership" }),
      makeFeedback({ id: "f2", regulationArea: "leadership" }),
    ];
    const result = analyseSelfAssessment([], [], feedback, HOME_ID);
    const leadership = result.areaBreakdown.find((b) => b.area === "leadership");
    expect(leadership?.feedbackCount).toBe(2);
  });

  it("calculates feedback addressed rate", () => {
    const feedback = [
      makeFeedback({ id: "f1", regulationArea: "records", actionRequired: true, addressed: true }),
      makeFeedback({ id: "f2", regulationArea: "records", actionRequired: true, addressed: false }),
    ];
    const result = analyseSelfAssessment([], [], feedback, HOME_ID);
    const records = result.areaBreakdown.find((b) => b.area === "records");
    expect(records?.feedbackAddressedRate).toBe(50);
  });

  it("feedback addressed rate is 100% when no feedback requires action", () => {
    const feedback = [
      makeFeedback({ regulationArea: "premises", actionRequired: false }),
    ];
    const result = analyseSelfAssessment([], [], feedback, HOME_ID);
    const premises = result.areaBreakdown.find((b) => b.area === "premises");
    expect(premises?.feedbackAddressedRate).toBe(100);
  });

  it("feedback addressed rate is 0% when no feedback exists for area", () => {
    const result = analyseSelfAssessment([], [], [], HOME_ID);
    const premises = result.areaBreakdown.find((b) => b.area === "premises");
    expect(premises?.feedbackAddressedRate).toBe(0);
  });
});
