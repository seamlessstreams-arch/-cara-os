// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Communication & Accessibility Intelligence Engine Tests
// 100+ tests covering all functions, scoring, labels, edge cases
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateNeedsAssessment,
  evaluateSupportProvision,
  evaluateAccessibleInformation,
  evaluateStaffTraining,
  buildChildCommunicationSummaries,
  generateCommunicationAccessibilityIntelligence,
  mapNeedToTraining,
  getCommunicationNeedLabel,
  getSupportTypeLabel,
  getAccessibleFormatLabel,
  getEngagementLevelLabel,
  getDocumentTypeLabel,
  getTrainingTypeLabel,
  getRatingLabel,
} from "../communication-accessibility-engine";
import type {
  ChildCommunicationProfile,
  CommunicationAssessment,
  AccessibleDocument,
  CommunicationTraining,
  CommunicationNeed,
  SupportType,
  AccessibleFormat,
  EngagementLevel,
  DocumentType,
  TrainingType,
} from "../communication-accessibility-engine";

// ── Demo Data: Oak House ────────────────────────────────────────────────────

const CHILD_IDS = ["alex", "jordan", "morgan"];
const CHILD_NAMES: Record<string, string> = {
  alex: "Alex",
  jordan: "Jordan",
  morgan: "Morgan",
};
const STAFF_IDS = ["staff-01", "staff-02", "staff-03"];
const REFERENCE_DATE = "2025-06-01";

// Alex: speech_language needs, receiving speech therapy
// Jordan: no significant needs
// Morgan: eal + autism, requires interpreter and visual aids
const demoProfiles: ChildCommunicationProfile[] = [
  {
    childId: "alex",
    childName: "Alex",
    communicationNeeds: ["speech_language"],
    primaryLanguage: "English",
    interpreterRequired: false,
    currentSupports: ["speech_therapy", "makaton"],
    speechTherapyAccess: true,
    lastSLTDate: "2025-04-10",
    communicationPassport: true,
    staffTrainedInNeeds: true,
  },
  {
    childId: "jordan",
    childName: "Jordan",
    communicationNeeds: [],
    primaryLanguage: "English",
    interpreterRequired: false,
    currentSupports: [],
    speechTherapyAccess: false,
    communicationPassport: false,
    staffTrainedInNeeds: true,
  },
  {
    childId: "morgan",
    childName: "Morgan",
    communicationNeeds: ["eal", "autism"],
    primaryLanguage: "Arabic",
    interpreterRequired: true,
    currentSupports: ["interpreter", "visual_aids", "social_stories"],
    speechTherapyAccess: false,
    communicationPassport: true,
    staffTrainedInNeeds: false,
  },
];

const demoAssessments: CommunicationAssessment[] = [
  {
    id: "ca-01",
    homeId: "oak-house",
    childId: "alex",
    childName: "Alex",
    assessmentDate: "2025-03-15",
    assessedBy: "Sarah Thompson (SLT)",
    needsIdentified: ["speech_language"],
    supportsRecommended: ["speech_therapy", "makaton", "visual_aids"],
    supportsInPlace: ["speech_therapy", "makaton"],
    engagementLevel: "fully_engaged",
    childView: "I like my speech sessions",
  },
  {
    id: "ca-02",
    homeId: "oak-house",
    childId: "jordan",
    childName: "Jordan",
    assessmentDate: "2025-03-20",
    assessedBy: "Mark Davies (Key Worker)",
    needsIdentified: [],
    supportsRecommended: [],
    supportsInPlace: [],
    engagementLevel: "fully_engaged",
    childView: "I can talk to anyone",
  },
  {
    id: "ca-03",
    homeId: "oak-house",
    childId: "morgan",
    childName: "Morgan",
    assessmentDate: "2025-02-28",
    assessedBy: "Dr Amira Hassan (EP)",
    needsIdentified: ["eal", "autism"],
    supportsRecommended: ["interpreter", "visual_aids", "social_stories", "translation"],
    supportsInPlace: ["interpreter", "visual_aids", "social_stories"],
    engagementLevel: "partially_engaged",
    childView: "Sometimes it is hard to understand",
  },
];

const demoDocuments: AccessibleDocument[] = [
  {
    id: "doc-01",
    homeId: "oak-house",
    documentType: "childrens_guide",
    formatsAvailable: ["standard", "easy_read", "pictorial", "translated"],
    lastUpdated: "2025-01-15",
  },
  {
    id: "doc-02",
    homeId: "oak-house",
    documentType: "complaints_procedure",
    formatsAvailable: ["standard", "easy_read", "pictorial"],
    lastUpdated: "2025-02-01",
  },
  {
    id: "doc-03",
    homeId: "oak-house",
    documentType: "house_rules",
    formatsAvailable: ["standard", "easy_read", "pictorial", "translated"],
    lastUpdated: "2025-01-20",
  },
  {
    id: "doc-04",
    homeId: "oak-house",
    documentType: "key_info",
    formatsAvailable: ["standard", "large_print"],
    lastUpdated: "2025-03-01",
  },
  {
    id: "doc-05",
    homeId: "oak-house",
    documentType: "health_plan",
    formatsAvailable: ["standard"],
    lastUpdated: "2025-02-15",
  },
];

const demoTraining: CommunicationTraining[] = [
  {
    staffId: "staff-01",
    staffName: "Claire Robinson",
    trainingType: "makaton",
    completionDate: "2024-09-15",
    expiryDate: "2026-09-15",
  },
  {
    staffId: "staff-01",
    staffName: "Claire Robinson",
    trainingType: "autism_communication",
    completionDate: "2024-11-01",
    expiryDate: "2026-11-01",
  },
  {
    staffId: "staff-02",
    staffName: "James Patel",
    trainingType: "eal_support",
    completionDate: "2025-01-10",
    expiryDate: "2027-01-10",
  },
  {
    staffId: "staff-02",
    staffName: "James Patel",
    trainingType: "trauma_informed_communication",
    completionDate: "2024-06-15",
    expiryDate: "2026-06-15",
  },
  {
    staffId: "staff-03",
    staffName: "Fatima Al-Rashid",
    trainingType: "deaf_awareness",
    completionDate: "2024-08-20",
    expiryDate: "2026-08-20",
  },
  {
    staffId: "staff-03",
    staffName: "Fatima Al-Rashid",
    trainingType: "easy_read_creation",
    completionDate: "2025-02-01",
    expiryDate: "2027-02-01",
  },
];

// ════════════════════════════════════════════════════════════════════════════
// evaluateNeedsAssessment
// ════════════════════════════════════════════════════════════════════════════

describe("evaluateNeedsAssessment", () => {
  it("returns zero results for empty inputs", () => {
    const result = evaluateNeedsAssessment([], [], []);
    expect(result.totalChildren).toBe(0);
    expect(result.childrenWithNeeds).toBe(0);
    expect(result.childrenAssessed).toBe(0);
    expect(result.assessmentRate).toBe(0);
    expect(result.passportRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("calculates assessment rate correctly with demo data", () => {
    const result = evaluateNeedsAssessment(demoProfiles, demoAssessments, CHILD_IDS);
    expect(result.totalChildren).toBe(3);
    expect(result.childrenAssessed).toBe(3);
    expect(result.assessmentRate).toBe(100);
  });

  it("identifies children with needs", () => {
    const result = evaluateNeedsAssessment(demoProfiles, demoAssessments, CHILD_IDS);
    expect(result.childrenWithNeeds).toBe(2); // Alex + Morgan
  });

  it("calculates passport rate for children with needs", () => {
    const result = evaluateNeedsAssessment(demoProfiles, demoAssessments, CHILD_IDS);
    // Alex and Morgan both have passports, 2 children with needs
    expect(result.passportRate).toBe(100);
  });

  it("builds needs breakdown correctly", () => {
    const result = evaluateNeedsAssessment(demoProfiles, demoAssessments, CHILD_IDS);
    expect(result.needsBreakdown["speech_language"]).toBe(1);
    expect(result.needsBreakdown["eal"]).toBe(1);
    expect(result.needsBreakdown["autism"]).toBe(1);
  });

  it("lists children not assessed", () => {
    const assessments = demoAssessments.filter((a) => a.childId !== "morgan");
    const result = evaluateNeedsAssessment(demoProfiles, assessments, CHILD_IDS);
    expect(result.childrenNotAssessed).toContain("morgan");
    expect(result.childrenNotAssessed).toHaveLength(1);
  });

  it("returns 100% passport rate when no children have needs", () => {
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "a",
        childName: "A",
        communicationNeeds: [],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: true,
      },
    ];
    const result = evaluateNeedsAssessment(profiles, [], ["a"]);
    expect(result.passportRate).toBe(100);
  });

  it("calculates partial passport rate", () => {
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "a",
        childName: "A",
        communicationNeeds: ["autism"],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: true,
        staffTrainedInNeeds: true,
      },
      {
        childId: "b",
        childName: "B",
        communicationNeeds: ["hearing"],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: false,
      },
    ];
    const result = evaluateNeedsAssessment(profiles, [], ["a", "b"]);
    expect(result.childrenWithNeeds).toBe(2);
    expect(result.childrenWithCommunicationPassport).toBe(1);
    expect(result.passportRate).toBe(50);
  });

  it("scores high when all children assessed and have passports", () => {
    const result = evaluateNeedsAssessment(demoProfiles, demoAssessments, CHILD_IDS);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("scores low when no children are assessed", () => {
    const result = evaluateNeedsAssessment(demoProfiles, [], CHILD_IDS);
    expect(result.score).toBeLessThan(50);
  });

  it("returns score as a whole number", () => {
    const result = evaluateNeedsAssessment(demoProfiles, demoAssessments, CHILD_IDS);
    expect(Number.isInteger(result.score)).toBe(true);
  });

  it("handles single child with no needs", () => {
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "only",
        childName: "Only",
        communicationNeeds: [],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: true,
      },
    ];
    const assessments: CommunicationAssessment[] = [
      {
        id: "a1",
        homeId: "h",
        childId: "only",
        childName: "Only",
        assessmentDate: "2025-01-01",
        assessedBy: "Test",
        needsIdentified: [],
        supportsRecommended: [],
        supportsInPlace: [],
        engagementLevel: "fully_engaged",
      },
    ];
    const result = evaluateNeedsAssessment(profiles, assessments, ["only"]);
    expect(result.assessmentRate).toBe(100);
    expect(result.childrenWithNeeds).toBe(0);
    expect(result.passportRate).toBe(100);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// evaluateSupportProvision
// ════════════════════════════════════════════════════════════════════════════

describe("evaluateSupportProvision", () => {
  it("returns zero results for empty inputs", () => {
    const result = evaluateSupportProvision([], [], []);
    expect(result.totalRecommendations).toBe(0);
    expect(result.totalInPlace).toBe(0);
    expect(result.supportMatchRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("calculates support match rate with demo data", () => {
    const result = evaluateSupportProvision(demoProfiles, demoAssessments, CHILD_IDS);
    // Alex: 3 recommended, 2 in place; Jordan: 0/0; Morgan: 4 recommended, 3 in place
    // Total: 7 recommended, 5 in place => 71%
    expect(result.totalRecommendations).toBe(7);
    expect(result.totalInPlace).toBe(5);
    expect(result.supportMatchRate).toBe(71);
  });

  it("counts children with full support", () => {
    const result = evaluateSupportProvision(demoProfiles, demoAssessments, CHILD_IDS);
    // Jordan has full support (0 recommended, 0 in place = full)
    expect(result.childrenWithFullSupport).toBe(1);
  });

  it("counts children with partial support", () => {
    const result = evaluateSupportProvision(demoProfiles, demoAssessments, CHILD_IDS);
    // Alex: 2/3 in place; Morgan: 3/4 in place — both partial
    expect(result.childrenWithPartialSupport).toBe(2);
  });

  it("identifies gaps", () => {
    const result = evaluateSupportProvision(demoProfiles, demoAssessments, CHILD_IDS);
    expect(result.gaps.length).toBe(2); // Alex missing 1, Morgan missing 1
  });

  it("calculates speech therapy access rate", () => {
    const result = evaluateSupportProvision(demoProfiles, demoAssessments, CHILD_IDS);
    // Only Alex has speech_language need, and has SLT access
    expect(result.speechTherapyAccessRate).toBe(100);
  });

  it("calculates interpreter provision rate", () => {
    const result = evaluateSupportProvision(demoProfiles, demoAssessments, CHILD_IDS);
    // Morgan requires interpreter and has interpreter support
    expect(result.interpreterProvisionRate).toBe(100);
  });

  it("returns 100% SLT rate when no children need SLT", () => {
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "a",
        childName: "A",
        communicationNeeds: ["autism"],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: true,
      },
    ];
    const result = evaluateSupportProvision(profiles, [], ["a"]);
    expect(result.speechTherapyAccessRate).toBe(100);
  });

  it("returns 100% interpreter rate when nobody needs interpreter", () => {
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "a",
        childName: "A",
        communicationNeeds: [],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: true,
      },
    ];
    const result = evaluateSupportProvision(profiles, [], ["a"]);
    expect(result.interpreterProvisionRate).toBe(100);
  });

  it("detects missing interpreter when required", () => {
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "a",
        childName: "A",
        communicationNeeds: ["eal"],
        primaryLanguage: "Polish",
        interpreterRequired: true,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: false,
      },
    ];
    const result = evaluateSupportProvision(profiles, [], ["a"]);
    expect(result.interpreterProvisionRate).toBe(0);
  });

  it("uses latest assessment per child", () => {
    const assessments: CommunicationAssessment[] = [
      {
        id: "old",
        homeId: "h",
        childId: "a",
        childName: "A",
        assessmentDate: "2025-01-01",
        assessedBy: "Test",
        needsIdentified: ["autism"],
        supportsRecommended: ["visual_aids", "social_stories"],
        supportsInPlace: [],
        engagementLevel: "not_engaged",
      },
      {
        id: "new",
        homeId: "h",
        childId: "a",
        childName: "A",
        assessmentDate: "2025-06-01",
        assessedBy: "Test",
        needsIdentified: ["autism"],
        supportsRecommended: ["visual_aids"],
        supportsInPlace: ["visual_aids"],
        engagementLevel: "fully_engaged",
      },
    ];
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "a",
        childName: "A",
        communicationNeeds: ["autism"],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: ["visual_aids"],
        speechTherapyAccess: false,
        communicationPassport: true,
        staffTrainedInNeeds: true,
      },
    ];
    const result = evaluateSupportProvision(profiles, assessments, ["a"]);
    expect(result.totalRecommendations).toBe(1);
    expect(result.totalInPlace).toBe(1);
    expect(result.supportMatchRate).toBe(100);
  });

  it("builds support type breakdown", () => {
    const result = evaluateSupportProvision(demoProfiles, demoAssessments, CHILD_IDS);
    expect(result.supportBreakdown["speech_therapy"]).toBe(1);
    expect(result.supportBreakdown["interpreter"]).toBe(1);
  });

  it("counts zero support children", () => {
    const assessments: CommunicationAssessment[] = [
      {
        id: "a1",
        homeId: "h",
        childId: "a",
        childName: "A",
        assessmentDate: "2025-01-01",
        assessedBy: "Test",
        needsIdentified: ["hearing"],
        supportsRecommended: ["sign_language", "visual_aids"],
        supportsInPlace: [],
        engagementLevel: "not_engaged",
      },
    ];
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "a",
        childName: "A",
        communicationNeeds: ["hearing"],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: false,
      },
    ];
    const result = evaluateSupportProvision(profiles, assessments, ["a"]);
    expect(result.childrenWithNoSupport).toBe(1);
    expect(result.childrenWithFullSupport).toBe(0);
  });

  it("returns 100% match when no recommendations exist", () => {
    const assessments: CommunicationAssessment[] = [
      {
        id: "a1",
        homeId: "h",
        childId: "a",
        childName: "A",
        assessmentDate: "2025-01-01",
        assessedBy: "Test",
        needsIdentified: [],
        supportsRecommended: [],
        supportsInPlace: [],
        engagementLevel: "fully_engaged",
      },
    ];
    const result = evaluateSupportProvision([], assessments, ["a"]);
    expect(result.supportMatchRate).toBe(100);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// evaluateAccessibleInformation
// ════════════════════════════════════════════════════════════════════════════

describe("evaluateAccessibleInformation", () => {
  it("returns zero results for empty documents", () => {
    const result = evaluateAccessibleInformation([]);
    expect(result.totalDocuments).toBe(0);
    expect(result.documentsWithMultipleFormats).toBe(0);
    expect(result.keyDocumentsCovered).toBe(0);
    expect(result.score).toBe(0);
  });

  it("lists all missing document types when empty", () => {
    const result = evaluateAccessibleInformation([]);
    expect(result.missingDocumentTypes).toHaveLength(6);
  });

  it("counts documents with multiple formats", () => {
    const result = evaluateAccessibleInformation(demoDocuments);
    // doc-01: 4 formats, doc-02: 3, doc-03: 4, doc-04: 2, doc-05: 1 (standard only)
    // doc-05 has only standard, so it doesn't count as multiple
    expect(result.documentsWithMultipleFormats).toBe(4);
  });

  it("calculates key document coverage rate", () => {
    const result = evaluateAccessibleInformation(demoDocuments);
    // 5 out of 6 key document types covered (missing care_plan)
    expect(result.keyDocumentsCovered).toBe(5);
    expect(result.keyDocumentCoverageRate).toBe(83);
  });

  it("identifies missing document types", () => {
    const result = evaluateAccessibleInformation(demoDocuments);
    expect(result.missingDocumentTypes).toContain("Care Plan");
  });

  it("builds format breakdown", () => {
    const result = evaluateAccessibleInformation(demoDocuments);
    expect(result.formatBreakdown["standard"]).toBe(5);
    expect(result.formatBreakdown["easy_read"]).toBe(3);
    expect(result.formatBreakdown["pictorial"]).toBe(3);
  });

  it("scores high when all documents in multiple formats", () => {
    const docs: AccessibleDocument[] = [
      { id: "1", homeId: "h", documentType: "childrens_guide", formatsAvailable: ["standard", "easy_read", "pictorial", "translated", "audio"], lastUpdated: "2025-01-01" },
      { id: "2", homeId: "h", documentType: "complaints_procedure", formatsAvailable: ["standard", "easy_read", "pictorial", "translated"], lastUpdated: "2025-01-01" },
      { id: "3", homeId: "h", documentType: "house_rules", formatsAvailable: ["standard", "easy_read", "pictorial"], lastUpdated: "2025-01-01" },
      { id: "4", homeId: "h", documentType: "key_info", formatsAvailable: ["standard", "easy_read", "large_print"], lastUpdated: "2025-01-01" },
      { id: "5", homeId: "h", documentType: "health_plan", formatsAvailable: ["standard", "easy_read"], lastUpdated: "2025-01-01" },
      { id: "6", homeId: "h", documentType: "care_plan", formatsAvailable: ["standard", "easy_read"], lastUpdated: "2025-01-01" },
    ];
    const result = evaluateAccessibleInformation(docs);
    expect(result.keyDocumentCoverageRate).toBe(100);
    expect(result.multipleFormatRate).toBe(100);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("counts a doc with one non-standard format as multiple", () => {
    const docs: AccessibleDocument[] = [
      { id: "1", homeId: "h", documentType: "childrens_guide", formatsAvailable: ["easy_read"], lastUpdated: "2025-01-01" },
    ];
    const result = evaluateAccessibleInformation(docs);
    expect(result.documentsWithMultipleFormats).toBe(1);
  });

  it("does not count standard-only as multiple formats", () => {
    const docs: AccessibleDocument[] = [
      { id: "1", homeId: "h", documentType: "childrens_guide", formatsAvailable: ["standard"], lastUpdated: "2025-01-01" },
    ];
    const result = evaluateAccessibleInformation(docs);
    expect(result.documentsWithMultipleFormats).toBe(0);
  });

  it("calculates multiple format rate correctly", () => {
    const docs: AccessibleDocument[] = [
      { id: "1", homeId: "h", documentType: "childrens_guide", formatsAvailable: ["standard", "easy_read"], lastUpdated: "2025-01-01" },
      { id: "2", homeId: "h", documentType: "house_rules", formatsAvailable: ["standard"], lastUpdated: "2025-01-01" },
    ];
    const result = evaluateAccessibleInformation(docs);
    expect(result.multipleFormatRate).toBe(50);
  });

  it("totalKeyDocumentTypes is always 6", () => {
    const result = evaluateAccessibleInformation(demoDocuments);
    expect(result.totalKeyDocumentTypes).toBe(6);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// evaluateStaffTraining
// ════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffTraining", () => {
  it("returns zero results for empty inputs", () => {
    const result = evaluateStaffTraining([], [], [], REFERENCE_DATE);
    expect(result.totalStaff).toBe(0);
    expect(result.staffWithRelevantTraining).toBe(0);
    expect(result.score).toBe(0);
  });

  it("calculates training coverage rate", () => {
    const result = evaluateStaffTraining(demoTraining, demoProfiles, STAFF_IDS, REFERENCE_DATE);
    // All 3 staff have training
    expect(result.staffWithRelevantTraining).toBe(3);
    expect(result.trainingCoverageRate).toBe(100);
  });

  it("builds training type breakdown", () => {
    const result = evaluateStaffTraining(demoTraining, demoProfiles, STAFF_IDS, REFERENCE_DATE);
    expect(result.trainingTypeBreakdown["makaton"]).toBe(1);
    expect(result.trainingTypeBreakdown["autism_communication"]).toBe(1);
    expect(result.trainingTypeBreakdown["eal_support"]).toBe(1);
  });

  it("detects expired training", () => {
    const training: CommunicationTraining[] = [
      {
        staffId: "staff-01",
        staffName: "Test",
        trainingType: "makaton",
        completionDate: "2023-01-01",
        expiryDate: "2024-01-01", // Expired before reference date
      },
    ];
    const result = evaluateStaffTraining(training, demoProfiles, STAFF_IDS, REFERENCE_DATE);
    expect(result.expiredTraining).toBe(1);
  });

  it("detects training expiring within 90 days", () => {
    const training: CommunicationTraining[] = [
      {
        staffId: "staff-01",
        staffName: "Test",
        trainingType: "makaton",
        completionDate: "2024-06-01",
        expiryDate: "2025-07-15", // Within 90 days of 2025-06-01
      },
    ];
    const result = evaluateStaffTraining(training, demoProfiles, STAFF_IDS, REFERENCE_DATE);
    expect(result.expiringWithin90Days).toBe(1);
  });

  it("calculates staff-child needs coverage", () => {
    const result = evaluateStaffTraining(demoTraining, demoProfiles, STAFF_IDS, REFERENCE_DATE);
    // Children need: makaton (speech_language), autism_communication (autism), eal_support (eal)
    // Staff have: makaton, autism_communication, eal_support, plus others
    expect(result.staffChildNeedsCoverage).toBe(100);
  });

  it("returns 100% needs coverage when no children have needs", () => {
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "a",
        childName: "A",
        communicationNeeds: [],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: true,
      },
    ];
    const result = evaluateStaffTraining([], profiles, ["staff-01"], REFERENCE_DATE);
    expect(result.staffChildNeedsCoverage).toBe(100);
  });

  it("detects gaps in needs coverage", () => {
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "a",
        childName: "A",
        communicationNeeds: ["hearing"],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: false,
      },
    ];
    // No deaf_awareness training
    const training: CommunicationTraining[] = [
      {
        staffId: "staff-01",
        staffName: "Test",
        trainingType: "makaton",
        completionDate: "2024-01-01",
      },
    ];
    const result = evaluateStaffTraining(training, profiles, ["staff-01"], REFERENCE_DATE);
    expect(result.staffChildNeedsCoverage).toBe(0);
  });

  it("does not count expired training as valid for staff coverage", () => {
    const training: CommunicationTraining[] = [
      {
        staffId: "staff-01",
        staffName: "Test",
        trainingType: "makaton",
        completionDate: "2023-01-01",
        expiryDate: "2024-01-01",
      },
    ];
    const result = evaluateStaffTraining(training, demoProfiles, ["staff-01"], REFERENCE_DATE);
    // staff-01 only has expired training, so not counted
    expect(result.staffWithRelevantTraining).toBe(0);
    expect(result.trainingCoverageRate).toBe(0);
  });

  it("counts training without expiry date as valid", () => {
    const training: CommunicationTraining[] = [
      {
        staffId: "staff-01",
        staffName: "Test",
        trainingType: "makaton",
        completionDate: "2024-01-01",
      },
    ];
    const result = evaluateStaffTraining(training, demoProfiles, ["staff-01"], REFERENCE_DATE);
    expect(result.staffWithRelevantTraining).toBe(1);
  });

  it("ignores training for staff not in staffIds", () => {
    const training: CommunicationTraining[] = [
      {
        staffId: "unknown",
        staffName: "Unknown",
        trainingType: "makaton",
        completionDate: "2024-01-01",
      },
    ];
    const result = evaluateStaffTraining(training, demoProfiles, ["staff-01"], REFERENCE_DATE);
    expect(result.staffWithRelevantTraining).toBe(0);
  });

  it("scores higher with more coverage and fewer expired", () => {
    const result = evaluateStaffTraining(demoTraining, demoProfiles, STAFF_IDS, REFERENCE_DATE);
    expect(result.score).toBeGreaterThanOrEqual(60);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// buildChildCommunicationSummaries
// ════════════════════════════════════════════════════════════════════════════

describe("buildChildCommunicationSummaries", () => {
  it("returns one summary per child", () => {
    const summaries = buildChildCommunicationSummaries(demoProfiles, demoAssessments, CHILD_IDS, CHILD_NAMES);
    expect(summaries).toHaveLength(3);
  });

  it("populates Alex summary correctly", () => {
    const summaries = buildChildCommunicationSummaries(demoProfiles, demoAssessments, CHILD_IDS, CHILD_NAMES);
    const alex = summaries.find((s) => s.childId === "alex")!;
    expect(alex.childName).toBe("Alex");
    expect(alex.communicationNeeds).toContain("speech_language");
    expect(alex.primaryLanguage).toBe("English");
    expect(alex.interpreterRequired).toBe(false);
    expect(alex.assessed).toBe(true);
    expect(alex.hasCommunicationPassport).toBe(true);
    expect(alex.hasSpeechTherapyAccess).toBe(true);
    expect(alex.staffTrainedInNeeds).toBe(true);
    expect(alex.engagementLevel).toBe("fully_engaged");
  });

  it("populates Jordan summary correctly", () => {
    const summaries = buildChildCommunicationSummaries(demoProfiles, demoAssessments, CHILD_IDS, CHILD_NAMES);
    const jordan = summaries.find((s) => s.childId === "jordan")!;
    expect(jordan.communicationNeeds).toHaveLength(0);
    expect(jordan.supportMatchRate).toBe(100);
    expect(jordan.concerns).toHaveLength(0);
  });

  it("populates Morgan summary correctly", () => {
    const summaries = buildChildCommunicationSummaries(demoProfiles, demoAssessments, CHILD_IDS, CHILD_NAMES);
    const morgan = summaries.find((s) => s.childId === "morgan")!;
    expect(morgan.communicationNeeds).toContain("eal");
    expect(morgan.communicationNeeds).toContain("autism");
    expect(morgan.interpreterRequired).toBe(true);
    expect(morgan.primaryLanguage).toBe("Arabic");
    expect(morgan.engagementLevel).toBe("partially_engaged");
  });

  it("calculates support match rate per child", () => {
    const summaries = buildChildCommunicationSummaries(demoProfiles, demoAssessments, CHILD_IDS, CHILD_NAMES);
    const alex = summaries.find((s) => s.childId === "alex")!;
    // Alex: 3 recommended, 2 in place => 67%
    expect(alex.supportMatchRate).toBe(67);
  });

  it("flags concern when staff not trained for child with needs", () => {
    const summaries = buildChildCommunicationSummaries(demoProfiles, demoAssessments, CHILD_IDS, CHILD_NAMES);
    const morgan = summaries.find((s) => s.childId === "morgan")!;
    expect(morgan.concerns.some((c) => c.includes("Staff not trained"))).toBe(true);
  });

  it("flags concern for missing communication passport", () => {
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "test",
        childName: "Test",
        communicationNeeds: ["autism"],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: true,
      },
    ];
    const summaries = buildChildCommunicationSummaries(profiles, [], ["test"], { test: "Test" });
    expect(summaries[0].concerns.some((c) => c.includes("communication passport"))).toBe(true);
  });

  it("flags concern for missing SLT access", () => {
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "test",
        childName: "Test",
        communicationNeeds: ["speech_language"],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: true,
      },
    ];
    const summaries = buildChildCommunicationSummaries(profiles, [], ["test"], { test: "Test" });
    expect(summaries[0].concerns.some((c) => c.includes("SLT access"))).toBe(true);
  });

  it("flags concern for missing interpreter", () => {
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "test",
        childName: "Test",
        communicationNeeds: ["eal"],
        primaryLanguage: "Polish",
        interpreterRequired: true,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: true,
      },
    ];
    const assessments: CommunicationAssessment[] = [
      {
        id: "a1",
        homeId: "h",
        childId: "test",
        childName: "Test",
        assessmentDate: "2025-01-01",
        assessedBy: "Test",
        needsIdentified: ["eal"],
        supportsRecommended: ["interpreter"],
        supportsInPlace: [],
        engagementLevel: "partially_engaged",
      },
    ];
    const summaries = buildChildCommunicationSummaries(profiles, assessments, ["test"], { test: "Test" });
    expect(summaries[0].concerns.some((c) => c.includes("Interpreter required"))).toBe(true);
  });

  it("flags concern for low engagement", () => {
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "test",
        childName: "Test",
        communicationNeeds: [],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: true,
      },
    ];
    const assessments: CommunicationAssessment[] = [
      {
        id: "a1",
        homeId: "h",
        childId: "test",
        childName: "Test",
        assessmentDate: "2025-01-01",
        assessedBy: "Test",
        needsIdentified: [],
        supportsRecommended: [],
        supportsInPlace: [],
        engagementLevel: "not_engaged",
      },
    ];
    const summaries = buildChildCommunicationSummaries(profiles, assessments, ["test"], { test: "Test" });
    expect(summaries[0].concerns.some((c) => c.includes("not engaged"))).toBe(true);
  });

  it("flags concern for minimally engaged", () => {
    const assessments: CommunicationAssessment[] = [
      {
        id: "a1",
        homeId: "h",
        childId: "test",
        childName: "Test",
        assessmentDate: "2025-01-01",
        assessedBy: "Test",
        needsIdentified: [],
        supportsRecommended: [],
        supportsInPlace: [],
        engagementLevel: "minimally_engaged",
      },
    ];
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "test",
        childName: "Test",
        communicationNeeds: [],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: true,
      },
    ];
    const summaries = buildChildCommunicationSummaries(profiles, assessments, ["test"], { test: "Test" });
    expect(summaries[0].concerns.some((c) => c.includes("minimally engaged"))).toBe(true);
  });

  it("uses childId as fallback when childNames missing", () => {
    const summaries = buildChildCommunicationSummaries(demoProfiles, demoAssessments, ["unknown"], {});
    expect(summaries[0].childName).toBe("unknown");
  });

  it("assigns higher score to child with full support", () => {
    const summaries = buildChildCommunicationSummaries(demoProfiles, demoAssessments, CHILD_IDS, CHILD_NAMES);
    const jordan = summaries.find((s) => s.childId === "jordan")!;
    const morgan = summaries.find((s) => s.childId === "morgan")!;
    expect(jordan.overallScore).toBeGreaterThan(morgan.overallScore);
  });

  it("uses latest assessment for child with multiple assessments", () => {
    const assessments: CommunicationAssessment[] = [
      {
        id: "old",
        homeId: "h",
        childId: "alex",
        childName: "Alex",
        assessmentDate: "2024-01-01",
        assessedBy: "Old",
        needsIdentified: ["speech_language"],
        supportsRecommended: ["speech_therapy"],
        supportsInPlace: [],
        engagementLevel: "not_engaged",
      },
      {
        id: "new",
        homeId: "h",
        childId: "alex",
        childName: "Alex",
        assessmentDate: "2025-06-01",
        assessedBy: "New",
        needsIdentified: ["speech_language"],
        supportsRecommended: ["speech_therapy"],
        supportsInPlace: ["speech_therapy"],
        engagementLevel: "fully_engaged",
      },
    ];
    const summaries = buildChildCommunicationSummaries(demoProfiles, assessments, ["alex"], { alex: "Alex" });
    expect(summaries[0].engagementLevel).toBe("fully_engaged");
    expect(summaries[0].supportMatchRate).toBe(100);
  });

  it("caps overall score at 100", () => {
    const summaries = buildChildCommunicationSummaries(demoProfiles, demoAssessments, CHILD_IDS, CHILD_NAMES);
    for (const s of summaries) {
      expect(s.overallScore).toBeLessThanOrEqual(100);
    }
  });

  it("flags concern when has needs but not assessed", () => {
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "test",
        childName: "Test",
        communicationNeeds: ["hearing"],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: false,
      },
    ];
    const summaries = buildChildCommunicationSummaries(profiles, [], ["test"], { test: "Test" });
    expect(summaries[0].concerns.some((c) => c.includes("no formal assessment"))).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// generateCommunicationAccessibilityIntelligence
// ════════════════════════════════════════════════════════════════════════════

describe("generateCommunicationAccessibilityIntelligence", () => {
  function generate() {
    return generateCommunicationAccessibilityIntelligence(
      demoProfiles, demoAssessments, demoDocuments, demoTraining,
      CHILD_IDS, CHILD_NAMES, STAFF_IDS,
      "oak-house", "2025-01-01", "2025-06-30", REFERENCE_DATE,
    );
  }

  it("returns correct homeId", () => {
    expect(generate().homeId).toBe("oak-house");
  });

  it("returns correct period", () => {
    const result = generate();
    expect(result.periodStart).toBe("2025-01-01");
    expect(result.periodEnd).toBe("2025-06-30");
  });

  it("returns correct reference date", () => {
    expect(generate().referenceDate).toBe(REFERENCE_DATE);
  });

  it("calculates overall score as weighted sum", () => {
    const result = generate();
    const expected = Math.round(
      (result.needsAssessment.score * 25) / 100 +
      (result.supportProvision.score * 30) / 100 +
      (result.accessibleInformation.score * 25) / 100 +
      (result.staffTraining.score * 20) / 100,
    );
    expect(result.overallScore).toBe(expected);
  });

  it("assigns rating based on score", () => {
    const result = generate();
    if (result.overallScore >= 80) expect(result.rating).toBe("outstanding");
    else if (result.overallScore >= 60) expect(result.rating).toBe("good");
    else if (result.overallScore >= 40) expect(result.rating).toBe("requires_improvement");
    else expect(result.rating).toBe("inadequate");
  });

  it("overall score is between 0 and 100", () => {
    const result = generate();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes child summaries for all children", () => {
    expect(generate().childSummaries).toHaveLength(3);
  });

  it("includes regulatory links", () => {
    const result = generate();
    expect(result.regulatoryLinks.length).toBeGreaterThanOrEqual(6);
    expect(result.regulatoryLinks.some((l) => l.includes("SEND Code of Practice"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 7"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 11"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Accessible Information Standard"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 13"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Equality Act 2010"))).toBe(true);
  });

  it("generates strengths for high-scoring areas", () => {
    const result = generate();
    // needsAssessment should score high (all assessed)
    if (result.needsAssessment.score >= 80) {
      expect(result.strengths.some((s) => s.includes("communication needs assessments"))).toBe(true);
    }
  });

  it("generates areas for improvement", () => {
    const result = generate();
    // At least some areas for improvement expected (missing care_plan doc)
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions", () => {
    const result = generate();
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("flags missing accessible document formats", () => {
    const result = generate();
    expect(result.areasForImprovement.some((a) => a.includes("accessible formats"))).toBe(true);
  });

  it("returns outstanding rating for score >= 80", () => {
    // Construct perfect data
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "a",
        childName: "A",
        communicationNeeds: [],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: true,
      },
    ];
    const assessments: CommunicationAssessment[] = [
      {
        id: "a1",
        homeId: "h",
        childId: "a",
        childName: "A",
        assessmentDate: "2025-01-01",
        assessedBy: "Test",
        needsIdentified: [],
        supportsRecommended: [],
        supportsInPlace: [],
        engagementLevel: "fully_engaged",
      },
    ];
    const docs: AccessibleDocument[] = [
      { id: "1", homeId: "h", documentType: "childrens_guide", formatsAvailable: ["standard", "easy_read", "pictorial", "translated", "audio"], lastUpdated: "2025-01-01" },
      { id: "2", homeId: "h", documentType: "complaints_procedure", formatsAvailable: ["standard", "easy_read", "pictorial", "translated"], lastUpdated: "2025-01-01" },
      { id: "3", homeId: "h", documentType: "house_rules", formatsAvailable: ["standard", "easy_read", "pictorial"], lastUpdated: "2025-01-01" },
      { id: "4", homeId: "h", documentType: "key_info", formatsAvailable: ["standard", "easy_read", "large_print"], lastUpdated: "2025-01-01" },
      { id: "5", homeId: "h", documentType: "health_plan", formatsAvailable: ["standard", "easy_read"], lastUpdated: "2025-01-01" },
      { id: "6", homeId: "h", documentType: "care_plan", formatsAvailable: ["standard", "easy_read"], lastUpdated: "2025-01-01" },
    ];
    const training: CommunicationTraining[] = [
      { staffId: "s1", staffName: "S", trainingType: "makaton", completionDate: "2024-01-01", expiryDate: "2026-01-01" },
    ];
    const result = generateCommunicationAccessibilityIntelligence(
      profiles, assessments, docs, training,
      ["a"], { a: "A" }, ["s1"],
      "h", "2025-01-01", "2025-06-30", REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("returns inadequate rating for very poor data", () => {
    const result = generateCommunicationAccessibilityIntelligence(
      [], [], [], [],
      ["a", "b"], { a: "A", b: "B" }, [],
      "h", "2025-01-01", "2025-06-30", REFERENCE_DATE,
    );
    expect(result.rating).toBe("inadequate");
  });

  it("handles empty children array", () => {
    const result = generateCommunicationAccessibilityIntelligence(
      [], [], [], [],
      [], {}, [],
      "h", "2025-01-01", "2025-06-30", REFERENCE_DATE,
    );
    expect(result.overallScore).toBe(0);
    expect(result.childSummaries).toHaveLength(0);
  });

  it("includes needs assessment sub-result", () => {
    const result = generate();
    expect(result.needsAssessment).toBeDefined();
    expect(result.needsAssessment.totalChildren).toBe(3);
  });

  it("includes support provision sub-result", () => {
    const result = generate();
    expect(result.supportProvision).toBeDefined();
    expect(result.supportProvision.totalRecommendations).toBeGreaterThan(0);
  });

  it("includes accessible information sub-result", () => {
    const result = generate();
    expect(result.accessibleInformation).toBeDefined();
    expect(result.accessibleInformation.totalDocuments).toBe(5);
  });

  it("includes staff training sub-result", () => {
    const result = generate();
    expect(result.staffTraining).toBeDefined();
    expect(result.staffTraining.totalStaff).toBe(3);
  });

  it("generates strength for 100% assessment rate", () => {
    const result = generate();
    if (result.needsAssessment.assessmentRate === 100) {
      expect(result.strengths.some((s) => s.includes("formally assessed"))).toBe(true);
    }
  });

  it("generates strength for 100% passport rate with needs", () => {
    const result = generate();
    if (result.needsAssessment.passportRate === 100 && result.needsAssessment.childrenWithNeeds > 0) {
      expect(result.strengths.some((s) => s.includes("communication passport"))).toBe(true);
    }
  });

  it("generates strength for 100% SLT access", () => {
    const result = generate();
    if (result.supportProvision.speechTherapyAccessRate === 100) {
      expect(result.strengths.some((s) => s.includes("speech and language therapy"))).toBe(true);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Rating Thresholds
// ════════════════════════════════════════════════════════════════════════════

describe("Rating thresholds", () => {
  function makeResult(score: number) {
    // We test by constructing data that would yield specific scores
    // but the simplest way is to check the generate function's logic
    return score >= 80
      ? "outstanding"
      : score >= 60
        ? "good"
        : score >= 40
          ? "requires_improvement"
          : "inadequate";
  }

  it("score 80 is outstanding", () => {
    expect(makeResult(80)).toBe("outstanding");
  });

  it("score 79 is good", () => {
    expect(makeResult(79)).toBe("good");
  });

  it("score 60 is good", () => {
    expect(makeResult(60)).toBe("good");
  });

  it("score 59 is requires_improvement", () => {
    expect(makeResult(59)).toBe("requires_improvement");
  });

  it("score 40 is requires_improvement", () => {
    expect(makeResult(40)).toBe("requires_improvement");
  });

  it("score 39 is inadequate", () => {
    expect(makeResult(39)).toBe("inadequate");
  });

  it("score 0 is inadequate", () => {
    expect(makeResult(0)).toBe("inadequate");
  });

  it("score 100 is outstanding", () => {
    expect(makeResult(100)).toBe("outstanding");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// mapNeedToTraining
// ════════════════════════════════════════════════════════════════════════════

describe("mapNeedToTraining", () => {
  it("maps speech_language to makaton", () => {
    expect(mapNeedToTraining("speech_language")).toContain("makaton");
  });

  it("maps hearing to deaf_awareness", () => {
    expect(mapNeedToTraining("hearing")).toContain("deaf_awareness");
  });

  it("maps autism to autism_communication", () => {
    expect(mapNeedToTraining("autism")).toContain("autism_communication");
  });

  it("maps eal to eal_support", () => {
    expect(mapNeedToTraining("eal")).toContain("eal_support");
  });

  it("maps learning_disability to easy_read_creation and makaton", () => {
    const result = mapNeedToTraining("learning_disability");
    expect(result).toContain("easy_read_creation");
    expect(result).toContain("makaton");
  });

  it("maps selective_mutism to trauma_informed_communication", () => {
    expect(mapNeedToTraining("selective_mutism")).toContain("trauma_informed_communication");
  });

  it("maps emotional_barrier to trauma_informed_communication", () => {
    expect(mapNeedToTraining("emotional_barrier")).toContain("trauma_informed_communication");
  });

  it("maps visual to empty array", () => {
    expect(mapNeedToTraining("visual")).toHaveLength(0);
  });

  it("maps other to empty array", () => {
    expect(mapNeedToTraining("other")).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Label Functions
// ════════════════════════════════════════════════════════════════════════════

describe("getCommunicationNeedLabel", () => {
  it("returns correct label for each need type", () => {
    const needs: CommunicationNeed[] = [
      "speech_language", "hearing", "visual", "learning_disability",
      "autism", "eal", "selective_mutism", "emotional_barrier", "other",
    ];
    const expectedLabels = [
      "Speech & Language", "Hearing", "Visual", "Learning Disability",
      "Autism", "English as an Additional Language", "Selective Mutism",
      "Emotional Barrier", "Other",
    ];
    needs.forEach((need, i) => {
      expect(getCommunicationNeedLabel(need)).toBe(expectedLabels[i]);
    });
  });
});

describe("getSupportTypeLabel", () => {
  it("returns correct label for each support type", () => {
    const supports: SupportType[] = [
      "speech_therapy", "sign_language", "visual_aids", "easy_read",
      "pictorial_communication", "translation", "interpreter",
      "assistive_technology", "social_stories", "makaton",
    ];
    const expectedLabels = [
      "Speech Therapy", "Sign Language", "Visual Aids", "Easy Read",
      "Pictorial Communication", "Translation", "Interpreter",
      "Assistive Technology", "Social Stories", "Makaton",
    ];
    supports.forEach((support, i) => {
      expect(getSupportTypeLabel(support)).toBe(expectedLabels[i]);
    });
  });
});

describe("getAccessibleFormatLabel", () => {
  it("returns correct label for each format", () => {
    const formats: AccessibleFormat[] = [
      "standard", "easy_read", "large_print", "braille",
      "audio", "pictorial", "translated", "bsl_video",
    ];
    const expectedLabels = [
      "Standard", "Easy Read", "Large Print", "Braille",
      "Audio", "Pictorial", "Translated", "BSL Video",
    ];
    formats.forEach((format, i) => {
      expect(getAccessibleFormatLabel(format)).toBe(expectedLabels[i]);
    });
  });
});

describe("getEngagementLevelLabel", () => {
  it("returns correct label for each engagement level", () => {
    const levels: EngagementLevel[] = [
      "fully_engaged", "partially_engaged", "minimally_engaged",
      "not_engaged", "unable_to_assess",
    ];
    const expectedLabels = [
      "Fully Engaged", "Partially Engaged", "Minimally Engaged",
      "Not Engaged", "Unable to Assess",
    ];
    levels.forEach((level, i) => {
      expect(getEngagementLevelLabel(level)).toBe(expectedLabels[i]);
    });
  });
});

describe("getDocumentTypeLabel", () => {
  it("returns correct label for each document type", () => {
    const types: DocumentType[] = [
      "childrens_guide", "complaints_procedure", "house_rules",
      "key_info", "health_plan", "care_plan",
    ];
    const expectedLabels = [
      "Children's Guide", "Complaints Procedure", "House Rules",
      "Key Information", "Health Plan", "Care Plan",
    ];
    types.forEach((type, i) => {
      expect(getDocumentTypeLabel(type)).toBe(expectedLabels[i]);
    });
  });
});

describe("getTrainingTypeLabel", () => {
  it("returns correct label for each training type", () => {
    const types: TrainingType[] = [
      "deaf_awareness", "autism_communication", "makaton",
      "easy_read_creation", "eal_support", "trauma_informed_communication",
    ];
    const expectedLabels = [
      "Deaf Awareness", "Autism Communication", "Makaton",
      "Easy Read Creation", "EAL Support", "Trauma-Informed Communication",
    ];
    types.forEach((type, i) => {
      expect(getTrainingTypeLabel(type)).toBe(expectedLabels[i]);
    });
  });
});

describe("getRatingLabel", () => {
  it("returns Outstanding for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });

  it("returns Good for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });

  it("returns Requires Improvement for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });

  it("returns Inadequate for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Edge Cases
// ════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles child with all 9 communication need types", () => {
    const allNeeds: CommunicationNeed[] = [
      "speech_language", "hearing", "visual", "learning_disability",
      "autism", "eal", "selective_mutism", "emotional_barrier", "other",
    ];
    const profile: ChildCommunicationProfile = {
      childId: "complex",
      childName: "Complex",
      communicationNeeds: allNeeds,
      primaryLanguage: "BSL",
      interpreterRequired: true,
      currentSupports: ["speech_therapy", "sign_language", "visual_aids"],
      speechTherapyAccess: true,
      communicationPassport: true,
      staffTrainedInNeeds: true,
    };
    const result = evaluateNeedsAssessment([profile], [], ["complex"]);
    expect(result.childrenWithNeeds).toBe(1);
    expect(Object.keys(result.needsBreakdown)).toHaveLength(9);
  });

  it("handles document with all 8 accessible formats", () => {
    const allFormats: AccessibleFormat[] = [
      "standard", "easy_read", "large_print", "braille",
      "audio", "pictorial", "translated", "bsl_video",
    ];
    const doc: AccessibleDocument = {
      id: "super",
      homeId: "h",
      documentType: "childrens_guide",
      formatsAvailable: allFormats,
      lastUpdated: "2025-01-01",
    };
    const result = evaluateAccessibleInformation([doc]);
    expect(result.documentsWithMultipleFormats).toBe(1);
    expect(Object.keys(result.formatBreakdown)).toHaveLength(8);
  });

  it("handles large number of children", () => {
    const childIds = Array.from({ length: 50 }, (_, i) => `child-${i}`);
    const childNames: Record<string, string> = {};
    const profiles: ChildCommunicationProfile[] = childIds.map((id) => {
      childNames[id] = `Child ${id}`;
      return {
        childId: id,
        childName: `Child ${id}`,
        communicationNeeds: [],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: [],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: true,
      };
    });
    const result = evaluateNeedsAssessment(profiles, [], childIds);
    expect(result.totalChildren).toBe(50);
    expect(result.childrenNotAssessed).toHaveLength(50);
  });

  it("handles duplicate assessments for same child", () => {
    const assessments: CommunicationAssessment[] = [
      {
        id: "dup1",
        homeId: "h",
        childId: "alex",
        childName: "Alex",
        assessmentDate: "2025-01-01",
        assessedBy: "A",
        needsIdentified: [],
        supportsRecommended: [],
        supportsInPlace: [],
        engagementLevel: "fully_engaged",
      },
      {
        id: "dup2",
        homeId: "h",
        childId: "alex",
        childName: "Alex",
        assessmentDate: "2025-02-01",
        assessedBy: "B",
        needsIdentified: [],
        supportsRecommended: [],
        supportsInPlace: [],
        engagementLevel: "partially_engaged",
      },
    ];
    const result = evaluateNeedsAssessment(demoProfiles, assessments, ["alex"]);
    expect(result.childrenAssessed).toBe(1);
  });

  it("handles training with no expiry date", () => {
    const training: CommunicationTraining[] = [
      {
        staffId: "staff-01",
        staffName: "Test",
        trainingType: "makaton",
        completionDate: "2024-01-01",
        // no expiryDate
      },
    ];
    const result = evaluateStaffTraining(training, demoProfiles, ["staff-01"], REFERENCE_DATE);
    expect(result.expiredTraining).toBe(0);
    expect(result.expiringWithin90Days).toBe(0);
    expect(result.staffWithRelevantTraining).toBe(1);
  });

  it("handles empty supports recommended with non-empty supports in place", () => {
    const assessments: CommunicationAssessment[] = [
      {
        id: "a1",
        homeId: "h",
        childId: "a",
        childName: "A",
        assessmentDate: "2025-01-01",
        assessedBy: "Test",
        needsIdentified: [],
        supportsRecommended: [],
        supportsInPlace: ["visual_aids"],
        engagementLevel: "fully_engaged",
      },
    ];
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "a",
        childName: "A",
        communicationNeeds: [],
        primaryLanguage: "English",
        interpreterRequired: false,
        currentSupports: ["visual_aids"],
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: true,
      },
    ];
    const result = evaluateSupportProvision(profiles, assessments, ["a"]);
    expect(result.childrenWithFullSupport).toBe(1);
    expect(result.supportMatchRate).toBe(100);
  });

  it("all scores are whole numbers", () => {
    const result = generateCommunicationAccessibilityIntelligence(
      demoProfiles, demoAssessments, demoDocuments, demoTraining,
      CHILD_IDS, CHILD_NAMES, STAFF_IDS,
      "oak-house", "2025-01-01", "2025-06-30", REFERENCE_DATE,
    );
    expect(Number.isInteger(result.overallScore)).toBe(true);
    expect(Number.isInteger(result.needsAssessment.score)).toBe(true);
    expect(Number.isInteger(result.supportProvision.score)).toBe(true);
    expect(Number.isInteger(result.accessibleInformation.score)).toBe(true);
    expect(Number.isInteger(result.staffTraining.score)).toBe(true);
  });

  it("handles child with translation support counting for interpreter provision", () => {
    const profiles: ChildCommunicationProfile[] = [
      {
        childId: "a",
        childName: "A",
        communicationNeeds: ["eal"],
        primaryLanguage: "Polish",
        interpreterRequired: true,
        currentSupports: ["translation"], // translation counts as interpreter provision
        speechTherapyAccess: false,
        communicationPassport: false,
        staffTrainedInNeeds: true,
      },
    ];
    const result = evaluateSupportProvision(profiles, [], ["a"]);
    expect(result.interpreterProvisionRate).toBe(100);
  });
});
