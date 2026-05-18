// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Consent Management Intelligence Engine — Tests
//
// Demo children:
//   Alex (14)   — full consent coverage, Gillick competent for some areas
//   Jordan (13) — good coverage, delegated authority in place
//   Morgan (15) — gaps in consent, expired records, no Gillick assessment
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateConsentRecording,
  evaluateDelegatedAuthority,
  evaluateGillickCompetence,
  evaluateConsentAudit,
  buildChildConsentProfiles,
  generateConsentManagementIntelligence,
  getConsentAreaLabel,
  getConsentStatusLabel,
  getConsentHolderLabel,
  getGillickOutcomeLabel,
} from "../consent-management-engine";
import type {
  ConsentRecord,
  DelegatedAuthority,
  GillickAssessment,
  ConsentAudit,
} from "../consent-management-engine";

// ── Test Constants ──────────────────────────────────────────────────────────

const HOME_ID = "home-oak";
const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";
const REFERENCE_DATE = "2025-06-15";
const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];

// ── Demo Data ───────────────────────────────────────────────────────────────

const demoRecords: ConsentRecord[] = [
  // Alex — comprehensive consents
  { id: "c-a1", homeId: HOME_ID, childId: "child-alex", childName: "Alex", consentArea: "medical_routine", consentHolder: "local_authority", consentHolderName: "LA Wandsworth", status: "granted", dateRecorded: "2025-01-10", evidenceOnFile: true, childInformed: true, childAgreed: true },
  { id: "c-a2", homeId: HOME_ID, childId: "child-alex", childName: "Alex", consentArea: "medical_emergency", consentHolder: "local_authority", consentHolderName: "LA Wandsworth", status: "granted", dateRecorded: "2025-01-10", evidenceOnFile: true, childInformed: true, childAgreed: true },
  { id: "c-a3", homeId: HOME_ID, childId: "child-alex", childName: "Alex", consentArea: "medication", consentHolder: "local_authority", consentHolderName: "LA Wandsworth", status: "granted", dateRecorded: "2025-01-10", evidenceOnFile: true, childInformed: true, childAgreed: true },
  { id: "c-a4", homeId: HOME_ID, childId: "child-alex", childName: "Alex", consentArea: "education", consentHolder: "local_authority", consentHolderName: "LA Wandsworth", status: "granted", dateRecorded: "2025-01-10", evidenceOnFile: true, childInformed: true, childAgreed: true },
  { id: "c-a5", homeId: HOME_ID, childId: "child-alex", childName: "Alex", consentArea: "photography", consentHolder: "child_gillick", consentHolderName: "Alex", status: "granted", dateRecorded: "2025-02-01", evidenceOnFile: true, childInformed: true, childAgreed: true },
  { id: "c-a6", homeId: HOME_ID, childId: "child-alex", childName: "Alex", consentArea: "internet_social_media", consentHolder: "child_gillick", consentHolderName: "Alex", status: "granted", dateRecorded: "2025-02-01", evidenceOnFile: true, childInformed: true, childAgreed: true },
  { id: "c-a7", homeId: HOME_ID, childId: "child-alex", childName: "Alex", consentArea: "haircut", consentHolder: "delegated_carer", consentHolderName: "Sarah Johnson", status: "granted", dateRecorded: "2025-01-15", evidenceOnFile: true, childInformed: true, childAgreed: true },
  { id: "c-a8", homeId: HOME_ID, childId: "child-alex", childName: "Alex", consentArea: "overnight_stay", consentHolder: "local_authority", consentHolderName: "LA Wandsworth", status: "granted", dateRecorded: "2025-01-10", evidenceOnFile: true, childInformed: true, childAgreed: true },
  { id: "c-a9", homeId: HOME_ID, childId: "child-alex", childName: "Alex", consentArea: "immunisation", consentHolder: "local_authority", consentHolderName: "LA Wandsworth", status: "granted", dateRecorded: "2025-01-10", evidenceOnFile: true, childInformed: true, childAgreed: true },
  { id: "c-a10", homeId: HOME_ID, childId: "child-alex", childName: "Alex", consentArea: "contact", consentHolder: "local_authority", consentHolderName: "LA Wandsworth", status: "granted", dateRecorded: "2025-01-10", evidenceOnFile: true, childInformed: true },
  { id: "c-a11", homeId: HOME_ID, childId: "child-alex", childName: "Alex", consentArea: "independent_activity", consentHolder: "delegated_carer", consentHolderName: "Sarah Johnson", status: "granted", dateRecorded: "2025-01-15", evidenceOnFile: true, childInformed: true, childAgreed: true },
  { id: "c-a12", homeId: HOME_ID, childId: "child-alex", childName: "Alex", consentArea: "data_sharing", consentHolder: "local_authority", consentHolderName: "LA Wandsworth", status: "granted", dateRecorded: "2025-01-10", evidenceOnFile: true, childInformed: true },

  // Jordan — good coverage with some delegated authority
  { id: "c-j1", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan", consentArea: "medical_routine", consentHolder: "parent_mother", consentHolderName: "Maria Williams", status: "granted", dateRecorded: "2025-01-05", evidenceOnFile: true, childInformed: true, childAgreed: true },
  { id: "c-j2", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan", consentArea: "medical_emergency", consentHolder: "parent_mother", consentHolderName: "Maria Williams", status: "granted", dateRecorded: "2025-01-05", evidenceOnFile: true, childInformed: true },
  { id: "c-j3", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan", consentArea: "medication", consentHolder: "parent_mother", consentHolderName: "Maria Williams", status: "granted", dateRecorded: "2025-01-05", evidenceOnFile: true, childInformed: true },
  { id: "c-j4", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan", consentArea: "education", consentHolder: "parent_mother", consentHolderName: "Maria Williams", status: "granted", dateRecorded: "2025-01-05", evidenceOnFile: true, childInformed: true },
  { id: "c-j5", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan", consentArea: "photography", consentHolder: "parent_mother", consentHolderName: "Maria Williams", status: "refused", dateRecorded: "2025-01-05", evidenceOnFile: true, childInformed: true, childAgreed: false },
  { id: "c-j6", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan", consentArea: "haircut", consentHolder: "delegated_carer", consentHolderName: "Tom Richards", status: "granted", dateRecorded: "2025-01-15", evidenceOnFile: true, childInformed: true },
  { id: "c-j7", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan", consentArea: "immunisation", consentHolder: "parent_mother", consentHolderName: "Maria Williams", status: "granted", dateRecorded: "2025-01-05", evidenceOnFile: true, childInformed: true },
  { id: "c-j8", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan", consentArea: "contact", consentHolder: "parent_mother", consentHolderName: "Maria Williams", status: "granted", dateRecorded: "2025-01-05", evidenceOnFile: true, childInformed: true },
  { id: "c-j9", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan", consentArea: "internet_social_media", consentHolder: "parent_mother", consentHolderName: "Maria Williams", status: "pending", dateRecorded: "2025-03-01", evidenceOnFile: false, childInformed: true },

  // Morgan — gaps: expired record, not sought, child not informed for some
  { id: "c-m1", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan", consentArea: "medical_routine", consentHolder: "local_authority", consentHolderName: "LA Bromley", status: "granted", dateRecorded: "2025-01-20", evidenceOnFile: true, childInformed: true },
  { id: "c-m2", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan", consentArea: "medical_emergency", consentHolder: "local_authority", consentHolderName: "LA Bromley", status: "granted", dateRecorded: "2025-01-20", evidenceOnFile: true, childInformed: false },
  { id: "c-m3", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan", consentArea: "medication", consentHolder: "local_authority", consentHolderName: "LA Bromley", status: "expired", dateRecorded: "2025-01-20", expiryDate: "2025-04-01", evidenceOnFile: true, childInformed: true },
  { id: "c-m4", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan", consentArea: "education", consentHolder: "local_authority", consentHolderName: "LA Bromley", status: "granted", dateRecorded: "2025-01-20", evidenceOnFile: false, childInformed: false },
  { id: "c-m5", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan", consentArea: "photography", consentHolder: "local_authority", consentHolderName: "LA Bromley", status: "not_sought", dateRecorded: "2025-02-01", evidenceOnFile: false, childInformed: false },
  { id: "c-m6", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan", consentArea: "immunisation", consentHolder: "local_authority", consentHolderName: "LA Bromley", status: "granted", dateRecorded: "2025-01-20", evidenceOnFile: true, childInformed: true },
];

const demoDelegations: DelegatedAuthority[] = [
  // Alex — haircut and independent activity delegated
  { id: "da-a1", homeId: HOME_ID, childId: "child-alex", childName: "Alex", area: "haircut", delegatedTo: "key_worker", delegatedToName: "Sarah Johnson", agreedDate: "2025-01-15", reviewDate: "2025-07-15", documentedInPlacementPlan: true, parentAgreed: false, localAuthorityAgreed: true },
  { id: "da-a2", homeId: HOME_ID, childId: "child-alex", childName: "Alex", area: "independent_activity", delegatedTo: "registered_manager", delegatedToName: "Darren Laville", agreedDate: "2025-01-15", reviewDate: "2025-07-15", documentedInPlacementPlan: true, parentAgreed: false, localAuthorityAgreed: true },

  // Jordan — haircut, education activities, overnight stays delegated
  { id: "da-j1", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan", area: "haircut", delegatedTo: "any_carer", agreedDate: "2025-01-10", reviewDate: "2025-07-10", documentedInPlacementPlan: true, parentAgreed: true, localAuthorityAgreed: true },
  { id: "da-j2", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan", area: "education", delegatedTo: "key_worker", delegatedToName: "Tom Richards", agreedDate: "2025-01-10", reviewDate: "2025-07-10", documentedInPlacementPlan: true, parentAgreed: true, localAuthorityAgreed: true },
  { id: "da-j3", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan", area: "overnight_stay", delegatedTo: "registered_manager", delegatedToName: "Darren Laville", agreedDate: "2025-01-10", reviewDate: "2025-07-10", documentedInPlacementPlan: true, parentAgreed: true, localAuthorityAgreed: true },

  // Morgan — one delegation, overdue review
  { id: "da-m1", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan", area: "haircut", delegatedTo: "any_carer", agreedDate: "2024-09-01", reviewDate: "2025-03-01", documentedInPlacementPlan: false, parentAgreed: false, localAuthorityAgreed: true },
];

const demoGillickAssessments: GillickAssessment[] = [
  // Alex — competent for photography and internet
  { id: "ga-a1", homeId: HOME_ID, childId: "child-alex", childName: "Alex", assessmentDate: "2025-02-01", assessedBy: "Sarah Johnson", area: "photography", outcome: "competent", reasoning: "Alex understands risks and can make informed decisions about photos", childViews: "I know what's safe to share online", reviewDate: "2025-08-01", parentInformed: true },
  { id: "ga-a2", homeId: HOME_ID, childId: "child-alex", childName: "Alex", assessmentDate: "2025-02-01", assessedBy: "Sarah Johnson", area: "internet_social_media", outcome: "competent", reasoning: "Alex demonstrates understanding of online safety", childViews: "I use the internet responsibly", reviewDate: "2025-08-01", parentInformed: true },
  { id: "ga-a3", homeId: HOME_ID, childId: "child-alex", childName: "Alex", assessmentDate: "2025-03-15", assessedBy: "Sarah Johnson", area: "medical_routine", outcome: "partially_competent", reasoning: "Alex understands basic medical decisions but needs support for complex ones", childViews: "I can decide about most things but want help with big stuff", reviewDate: "2025-09-15", parentInformed: true },

  // Jordan — one assessment, not yet competent
  { id: "ga-j1", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan", assessmentDate: "2025-03-01", assessedBy: "Tom Richards", area: "internet_social_media", outcome: "not_competent", reasoning: "Jordan needs more support understanding online risks", childViews: "I want to use TikTok like my friends", reviewDate: "2025-06-01", parentInformed: true },
  // Jordan — review required
  { id: "ga-j2", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan", assessmentDate: "2025-04-01", assessedBy: "Tom Richards", area: "medication", outcome: "review_required", reasoning: "Jordan shows growing understanding but needs further assessment", childViews: "I know what my tablets are for", reviewDate: "2025-05-01", parentInformed: false },
];

const demoAudits: ConsentAudit[] = [
  { id: "audit-1", homeId: HOME_ID, auditDate: "2025-03-15", auditor: "Lisa Williams", totalRecordsChecked: 25, compliantRecords: 22, issuesFound: ["3 records missing written evidence", "1 expired consent not renewed"], actionsRequired: ["Obtain written evidence for 3 records", "Renew expired consent"], actionsCompleted: 2, nextAuditDate: "2025-09-15" },
];

// ══════════════════════════════════════════════════════════════════════════════
// Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateConsentRecording", () => {
  it("counts total relevant records", () => {
    const r = evaluateConsentRecording(demoRecords, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.totalRecords).toBeGreaterThan(0);
  });

  it("counts granted consents", () => {
    const r = evaluateConsentRecording(demoRecords, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.granted).toBeGreaterThan(0);
  });

  it("counts refused consents", () => {
    const r = evaluateConsentRecording(demoRecords, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // Jordan's photography is refused
    expect(r.refused).toBe(1);
  });

  it("counts pending consents", () => {
    const r = evaluateConsentRecording(demoRecords, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // Jordan's internet is pending
    expect(r.pending).toBe(1);
  });

  it("counts not-sought consents", () => {
    const r = evaluateConsentRecording(demoRecords, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // Morgan's photography
    expect(r.notSought).toBe(1);
  });

  it("counts expired consents", () => {
    const r = evaluateConsentRecording(demoRecords, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // Morgan's medication expired before period start
    expect(r.expired).toBeGreaterThanOrEqual(0);
  });

  it("calculates evidence on file rate", () => {
    const r = evaluateConsentRecording(demoRecords, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.evidenceOnFileRate).toBeGreaterThan(0);
    expect(r.evidenceOnFileRate).toBeLessThanOrEqual(100);
  });

  it("calculates child informed rate", () => {
    const r = evaluateConsentRecording(demoRecords, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.childInformedRate).toBeGreaterThan(0);
  });

  it("calculates consent currency rate", () => {
    const r = evaluateConsentRecording(demoRecords, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.consentCurrencyRate).toBeGreaterThan(0);
  });

  it("produces score between 0 and 30", () => {
    const r = evaluateConsentRecording(demoRecords, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThanOrEqual(30);
  });

  it("returns zeros for empty data", () => {
    const r = evaluateConsentRecording([], PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.totalRecords).toBe(0);
    expect(r.overallScore).toBe(0);
  });

  it("gives higher score with all evidence on file", () => {
    const perfect: ConsentRecord[] = [
      { id: "p1", homeId: HOME_ID, childId: "child-alex", childName: "Alex", consentArea: "medical_routine", consentHolder: "local_authority", consentHolderName: "LA", status: "granted", dateRecorded: "2025-02-01", evidenceOnFile: true, childInformed: true, childAgreed: true },
    ];
    const imperfect: ConsentRecord[] = [
      { ...perfect[0], id: "p2", evidenceOnFile: false, childInformed: false },
    ];
    const pScore = evaluateConsentRecording(perfect, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    const iScore = evaluateConsentRecording(imperfect, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(pScore.overallScore).toBeGreaterThan(iScore.overallScore);
  });

  it("penalises not-sought consents", () => {
    const withNotSought: ConsentRecord[] = [
      { id: "ns1", homeId: HOME_ID, childId: "child-alex", childName: "Alex", consentArea: "photography", consentHolder: "local_authority", consentHolderName: "LA", status: "not_sought", dateRecorded: "2025-02-01", evidenceOnFile: false, childInformed: false },
    ];
    const r = evaluateConsentRecording(withNotSought, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.notSought).toBe(1);
  });
});

describe("evaluateDelegatedAuthority", () => {
  it("counts total delegations", () => {
    const r = evaluateDelegatedAuthority(demoDelegations, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.totalDelegations).toBe(6);
  });

  it("calculates documented in plan rate", () => {
    const r = evaluateDelegatedAuthority(demoDelegations, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // 5 of 6 documented
    expect(r.documentedInPlanRate).toBeCloseTo(83.3, 0);
  });

  it("calculates parent agreed rate", () => {
    const r = evaluateDelegatedAuthority(demoDelegations, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // Jordan's 3 have parent agreed, Alex's 2 and Morgan's 1 don't = 3/6 = 50%
    expect(r.parentAgreedRate).toBe(50);
  });

  it("calculates LA agreed rate", () => {
    const r = evaluateDelegatedAuthority(demoDelegations, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // All 6 have LA agreed
    expect(r.laAgreedRate).toBe(100);
  });

  it("counts overdue reviews", () => {
    const r = evaluateDelegatedAuthority(demoDelegations, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // Morgan's delegation has review date 2025-03-01 < reference 2025-06-15
    expect(r.overdueReviews).toBe(1);
  });

  it("counts areas with delegation", () => {
    const r = evaluateDelegatedAuthority(demoDelegations, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // haircut, independent_activity, education, overnight_stay = 4 unique areas
    expect(r.areasWithDelegation).toBe(4);
  });

  it("produces score between 0 and 25", () => {
    const r = evaluateDelegatedAuthority(demoDelegations, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns zeros for empty data", () => {
    const r = evaluateDelegatedAuthority([], PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.totalDelegations).toBe(0);
    expect(r.overallScore).toBe(0);
  });
});

describe("evaluateGillickCompetence", () => {
  it("counts total assessments in period", () => {
    const r = evaluateGillickCompetence(demoGillickAssessments, CHILD_IDS, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.totalAssessments).toBe(5);
  });

  it("counts competent outcomes", () => {
    const r = evaluateGillickCompetence(demoGillickAssessments, CHILD_IDS, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // ga-a1 and ga-a2
    expect(r.competent).toBe(2);
  });

  it("counts not competent outcomes", () => {
    const r = evaluateGillickCompetence(demoGillickAssessments, CHILD_IDS, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // ga-j1
    expect(r.notCompetent).toBe(1);
  });

  it("counts partially competent outcomes", () => {
    const r = evaluateGillickCompetence(demoGillickAssessments, CHILD_IDS, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // ga-a3
    expect(r.partiallyCompetent).toBe(1);
  });

  it("counts review required", () => {
    const r = evaluateGillickCompetence(demoGillickAssessments, CHILD_IDS, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // ga-j2
    expect(r.reviewRequired).toBe(1);
  });

  it("calculates parent informed rate", () => {
    const r = evaluateGillickCompetence(demoGillickAssessments, CHILD_IDS, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // 4 of 5 informed
    expect(r.parentInformedRate).toBe(80);
  });

  it("counts overdue reviews", () => {
    const r = evaluateGillickCompetence(demoGillickAssessments, CHILD_IDS, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // ga-j2 review 2025-05-01 < reference 2025-06-15 AND ga-j1 review 2025-06-01 < reference 2025-06-15
    expect(r.overdueReviews).toBe(2);
  });

  it("calculates child views captured rate", () => {
    const r = evaluateGillickCompetence(demoGillickAssessments, CHILD_IDS, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // All 5 have child views
    expect(r.childViewsCapturedRate).toBe(100);
  });

  it("produces score between 0 and 25", () => {
    const r = evaluateGillickCompetence(demoGillickAssessments, CHILD_IDS, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns zeros for empty data", () => {
    const r = evaluateGillickCompetence([], CHILD_IDS, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.totalAssessments).toBe(0);
    expect(r.overallScore).toBe(0);
  });
});

describe("evaluateConsentAudit", () => {
  it("counts total audits", () => {
    const r = evaluateConsentAudit(demoAudits, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.totalAudits).toBe(1);
  });

  it("calculates average compliance rate", () => {
    const r = evaluateConsentAudit(demoAudits, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // 22/25 = 88%
    expect(r.averageComplianceRate).toBe(88);
  });

  it("counts total issues found", () => {
    const r = evaluateConsentAudit(demoAudits, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.totalIssuesFound).toBe(2);
  });

  it("calculates actions completion rate", () => {
    const r = evaluateConsentAudit(demoAudits, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // 2 of 2 completed = 100%
    expect(r.actionsCompletionRate).toBe(100);
  });

  it("determines audit currency", () => {
    const r = evaluateConsentAudit(demoAudits, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    // Next audit 2025-09-15 >= reference 2025-06-15
    expect(r.auditCurrent).toBe(true);
  });

  it("produces score between 0 and 20", () => {
    const r = evaluateConsentAudit(demoAudits, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThanOrEqual(20);
  });

  it("returns zeros for empty data", () => {
    const r = evaluateConsentAudit([], PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.totalAudits).toBe(0);
    expect(r.overallScore).toBe(0);
  });

  it("marks overdue audit as not current", () => {
    const overdueAudit: ConsentAudit[] = [{
      ...demoAudits[0], nextAuditDate: "2025-01-01",
    }];
    const r = evaluateConsentAudit(overdueAudit, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.auditCurrent).toBe(false);
  });
});

describe("buildChildConsentProfiles", () => {
  const profiles = buildChildConsentProfiles(demoRecords, demoDelegations, demoGillickAssessments, CHILD_IDS);

  it("builds a profile for each child", () => {
    expect(profiles).toHaveLength(3);
  });

  it("identifies Alex's comprehensive profile", () => {
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.childName).toBe("Alex");
    expect(alex.totalConsents).toBe(12);
    expect(alex.grantedConsents).toBe(12);
    expect(alex.pendingConsents).toBe(0);
    expect(alex.expiredConsents).toBe(0);
    expect(alex.delegatedAreas).toBe(2);
    expect(alex.gillickAssessments).toBe(3);
    expect(alex.gillickCompetentAreas).toBe(3); // 2 competent + 1 partially
  });

  it("identifies Jordan's profile", () => {
    const jordan = profiles.find((p) => p.childId === "child-jordan")!;
    expect(jordan.totalConsents).toBe(9);
    expect(jordan.pendingConsents).toBe(1);
    expect(jordan.delegatedAreas).toBe(3);
  });

  it("identifies Morgan's gaps", () => {
    const morgan = profiles.find((p) => p.childId === "child-morgan")!;
    expect(morgan.totalConsents).toBe(6);
    expect(morgan.expiredConsents).toBe(1);
    expect(morgan.gillickAssessments).toBe(0);
    expect(morgan.delegatedAreas).toBe(1);
  });

  it("calculates consent coverage rate", () => {
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    // Alex has all 12 standard areas covered
    expect(alex.consentCoverageRate).toBe(100);
  });

  it("shows lower coverage for Morgan", () => {
    const morgan = profiles.find((p) => p.childId === "child-morgan")!;
    // Morgan has: medical_routine, medical_emergency, medication, education, photography, immunisation = 6/12
    expect(morgan.consentCoverageRate).toBe(50);
  });

  it("produces scores between 0 and 10", () => {
    for (const p of profiles) {
      expect(p.overallScore).toBeGreaterThanOrEqual(0);
      expect(p.overallScore).toBeLessThanOrEqual(10);
    }
  });

  it("gives Alex highest score", () => {
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    const morgan = profiles.find((p) => p.childId === "child-morgan")!;
    expect(alex.overallScore).toBeGreaterThan(morgan.overallScore);
  });
});

describe("generateConsentManagementIntelligence", () => {
  const result = generateConsentManagementIntelligence(
    demoRecords, demoDelegations, demoGillickAssessments, demoAudits,
    CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
  );

  it("returns homeId", () => {
    expect(result.homeId).toBe(HOME_ID);
  });

  it("returns period dates", () => {
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("calculates overall score between 0 and 100", () => {
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("assigns a valid rating", () => {
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes all result sections", () => {
    expect(result.recording).toBeDefined();
    expect(result.delegatedAuthority).toBeDefined();
    expect(result.gillickCompetence).toBeDefined();
    expect(result.audit).toBeDefined();
  });

  it("includes child profiles", () => {
    expect(result.childProfiles).toHaveLength(3);
  });

  it("generates strengths", () => {
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement", () => {
    // Morgan has gaps, expired records — should trigger areas
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions", () => {
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("generates regulatory links", () => {
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 20"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Gillick"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC"))).toBe(true);
  });

  it("flags expired consents in actions", () => {
    expect(result.actions.some((a) => a.toLowerCase().includes("expired"))).toBe(true);
  });

  it("flags not-sought consents in actions", () => {
    expect(result.actions.some((a) => a.toLowerCase().includes("sought") || a.toLowerCase().includes("outstanding"))).toBe(true);
  });
});

describe("generateConsentManagementIntelligence — edge cases", () => {
  it("handles empty data gracefully", () => {
    const r = generateConsentManagementIntelligence([], [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
    expect(r.childProfiles).toHaveLength(0);
  });

  it("handles single child with perfect data", () => {
    const perfectRec: ConsentRecord = {
      id: "p1", homeId: HOME_ID, childId: "c1", childName: "Perfect",
      consentArea: "medical_routine", consentHolder: "local_authority",
      consentHolderName: "LA", status: "granted", dateRecorded: "2025-02-01",
      evidenceOnFile: true, childInformed: true, childAgreed: true,
    };
    const perfectDel: DelegatedAuthority = {
      id: "pd1", homeId: HOME_ID, childId: "c1", childName: "Perfect",
      area: "haircut", delegatedTo: "any_carer", agreedDate: "2025-01-15",
      reviewDate: "2025-07-15", documentedInPlacementPlan: true,
      parentAgreed: true, localAuthorityAgreed: true,
    };
    const perfectGillick: GillickAssessment = {
      id: "pg1", homeId: HOME_ID, childId: "c1", childName: "Perfect",
      assessmentDate: "2025-02-01", assessedBy: "Staff", area: "photography",
      outcome: "competent", reasoning: "Understands fully", childViews: "I know what I'm doing",
      reviewDate: "2025-08-01", parentInformed: true,
    };
    const perfectAudit: ConsentAudit = {
      id: "pa1", homeId: HOME_ID, auditDate: "2025-03-01", auditor: "RM",
      totalRecordsChecked: 10, compliantRecords: 10, issuesFound: [],
      actionsRequired: [], actionsCompleted: 0, nextAuditDate: "2025-09-01",
    };

    const r = generateConsentManagementIntelligence(
      [perfectRec], [perfectDel], [perfectGillick], [perfectAudit],
      ["c1"], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(r.overallScore).toBeGreaterThan(60);
    expect(["outstanding", "good"]).toContain(r.rating);
  });
});

describe("Label functions", () => {
  it("returns correct consent area labels", () => {
    expect(getConsentAreaLabel("medical_routine")).toBe("Routine Medical");
    expect(getConsentAreaLabel("haircut")).toBe("Haircut / Appearance");
    expect(getConsentAreaLabel("internet_social_media")).toBe("Internet & Social Media");
    expect(getConsentAreaLabel("photography")).toBe("Photography");
    expect(getConsentAreaLabel("overnight_stay")).toBe("Overnight Stays");
    expect(getConsentAreaLabel("passport_travel")).toBe("Passport & Travel");
  });

  it("returns correct consent status labels", () => {
    expect(getConsentStatusLabel("granted")).toBe("Granted");
    expect(getConsentStatusLabel("refused")).toBe("Refused");
    expect(getConsentStatusLabel("pending")).toBe("Pending");
    expect(getConsentStatusLabel("expired")).toBe("Expired");
    expect(getConsentStatusLabel("not_sought")).toBe("Not Sought");
    expect(getConsentStatusLabel("withdrawn")).toBe("Withdrawn");
  });

  it("returns correct consent holder labels", () => {
    expect(getConsentHolderLabel("parent_mother")).toBe("Mother");
    expect(getConsentHolderLabel("local_authority")).toBe("Local Authority");
    expect(getConsentHolderLabel("child_gillick")).toBe("Child (Gillick Competent)");
    expect(getConsentHolderLabel("delegated_carer")).toBe("Delegated to Carer");
    expect(getConsentHolderLabel("court_order")).toBe("Court Order");
  });

  it("returns correct Gillick outcome labels", () => {
    expect(getGillickOutcomeLabel("competent")).toBe("Competent");
    expect(getGillickOutcomeLabel("not_competent")).toBe("Not Competent");
    expect(getGillickOutcomeLabel("partially_competent")).toBe("Partially Competent");
    expect(getGillickOutcomeLabel("review_required")).toBe("Review Required");
  });
});
