// ══════════════════════════════════════════════════════════════════════════════
// Tests — Online Safety & Digital Wellbeing Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  generateOnlineSafetyIntelligence,
  evaluateRiskAssessments,
  analyseOnlineIncidents,
  evaluateEducation,
  evaluateStaffTraining,
  buildChildOnlineProfiles,
  getRiskCategoryLabel,
  getIncidentTypeLabel,
  getEducationTopicLabel,
} from "../online-safety-engine";
import type {
  OnlineSafetyChild,
  OnlineRiskAssessment,
  OnlineIncident,
  OnlineEducationSession,
  StaffOnlineTraining,
  OnlineSafetyPolicy,
} from "../online-safety-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";
const CURRENT_DATE = "2026-05-18";

function makeChildren(): OnlineSafetyChild[] {
  return [
    { id: "child-1", name: "Alex", dateOfBirth: "2012-03-15", currentPlacement: true },
    { id: "child-2", name: "Jordan", dateOfBirth: "2013-07-22", currentPlacement: true },
    { id: "child-3", name: "Morgan", dateOfBirth: "2010-12-01", currentPlacement: true },
  ];
}

function makeAssessments(): OnlineRiskAssessment[] {
  return [
    {
      id: "ora-1",
      childId: "child-1",
      assessmentDate: "2026-01-20",
      reviewDueDate: "2026-07-20",
      assessedBy: "Sarah Johnson",
      overallRiskLevel: "medium",
      risksIdentified: [
        { category: "gaming_addiction", level: "medium", mitigations: ["Screen time limits agreed", "Gaming console in communal area"] },
        { category: "cyberbullying", level: "low", mitigations: ["Social media privacy settings reviewed"] },
      ],
      devicesAccessed: ["personal_phone", "gaming_console", "home_laptop"],
      safetyMeasuresInPlace: ["content_filtering", "time_restrictions", "monitoring_software", "privacy_settings_reviewed"],
      deviceAgreementSigned: true,
      socialMediaAccounts: ["TikTok", "Instagram"],
      screenTimeAgreementHours: 3,
    },
    {
      id: "ora-2",
      childId: "child-2",
      assessmentDate: "2026-02-05",
      reviewDueDate: "2026-08-05",
      assessedBy: "Tom Richards",
      overallRiskLevel: "low",
      risksIdentified: [
        { category: "exposure_harmful_content", level: "low", mitigations: ["Filtering in place", "Regular check-ins about online activity"] },
      ],
      devicesAccessed: ["personal_phone", "home_tablet"],
      safetyMeasuresInPlace: ["content_filtering", "monitoring_software", "app_restrictions", "parental_controls"],
      deviceAgreementSigned: true,
      socialMediaAccounts: ["YouTube"],
      screenTimeAgreementHours: 2,
    },
    {
      id: "ora-3",
      childId: "child-3",
      assessmentDate: "2026-01-25",
      reviewDueDate: "2026-07-25",
      assessedBy: "Lisa Williams",
      overallRiskLevel: "high",
      risksIdentified: [
        { category: "grooming", level: "high", mitigations: ["Enhanced monitoring", "Regular key-work discussions", "CEOP reporting awareness"] },
        { category: "sexting", level: "medium", mitigations: ["1:1 session on image sharing law", "Phone checked weekly with Morgan's consent"] },
        { category: "data_sharing", level: "medium", mitigations: ["Privacy settings reviewed together", "Social media accounts monitored"] },
      ],
      devicesAccessed: ["personal_phone", "home_laptop", "personal_tablet"],
      safetyMeasuresInPlace: ["content_filtering", "monitoring_software", "time_restrictions", "privacy_settings_reviewed", "app_restrictions"],
      deviceAgreementSigned: true,
      socialMediaAccounts: ["TikTok", "Instagram", "Snapchat", "WhatsApp"],
      screenTimeAgreementHours: 2.5,
    },
  ];
}

function makeIncidents(): OnlineIncident[] {
  return [
    {
      id: "oi-1",
      childId: "child-1",
      date: "2026-03-10",
      incidentType: "excessive_screen_time",
      severity: 1,
      description: "Alex exceeded agreed screen time by 2 hours playing Fortnite",
      reportedTo: ["key_worker"],
      ceopReferral: false,
      policeInvolved: false,
      socialWorkerNotified: false,
      parentNotified: false,
      deviceSeized: false,
      safeguardingActionTaken: ["Discussed in key-work", "Screen time agreement revisited"],
      outcome: "Alex agreed to new timer system",
      resolved: true,
      resolvedDate: "2026-03-12",
    },
    {
      id: "oi-2",
      childId: "child-3",
      date: "2026-02-15",
      incidentType: "contact_from_unknown_adult",
      severity: 4,
      description: "Morgan received DMs from unknown adult male on Instagram — suspicious grooming pattern identified",
      reportedTo: ["registered_manager", "social_worker", "CEOP"],
      ceopReferral: true,
      policeInvolved: true,
      socialWorkerNotified: true,
      parentNotified: false,
      deviceSeized: true,
      safeguardingActionTaken: [
        "Phone seized with Morgan's understanding",
        "CEOP report submitted immediately",
        "Police notified",
        "Social worker informed",
        "1:1 support session with Morgan",
        "Risk assessment updated",
      ],
      outcome: "CEOP investigation opened; account blocked; Morgan supported",
      resolved: true,
      resolvedDate: "2026-03-01",
    },
    {
      id: "oi-3",
      childId: "child-2",
      date: "2026-04-05",
      incidentType: "cyberbullying_victim",
      severity: 2,
      description: "Jordan received unkind messages on YouTube comments about their identity",
      reportedTo: ["key_worker", "registered_manager"],
      ceopReferral: false,
      policeInvolved: false,
      socialWorkerNotified: true,
      parentNotified: false,
      deviceSeized: false,
      safeguardingActionTaken: [
        "Comments reported and removed",
        "Support session with Jordan",
        "Privacy settings strengthened",
        "Discussed blocking and reporting with Jordan",
      ],
      outcome: "Jordan felt supported; comments removed by platform",
      resolved: true,
      resolvedDate: "2026-04-08",
    },
  ];
}

function makeEducation(): OnlineEducationSession[] {
  return [
    { id: "edu-1", date: "2026-01-20", topic: "recognising_grooming", childIds: ["child-1", "child-2", "child-3"], deliveredBy: "Sarah Johnson", method: "group_session", childrenEngaged: true, followUpNeeded: false },
    { id: "edu-2", date: "2026-02-10", topic: "image_sharing_law", childIds: ["child-3"], deliveredBy: "Lisa Williams", method: "one_to_one", childrenEngaged: true, followUpNeeded: true, notes: "Morgan engaged well — revisit in March" },
    { id: "edu-3", date: "2026-02-25", topic: "cyberbullying_awareness", childIds: ["child-1", "child-2", "child-3"], deliveredBy: "Tom Richards", method: "group_session", childrenEngaged: true, followUpNeeded: false },
    { id: "edu-4", date: "2026-03-15", topic: "privacy_settings", childIds: ["child-1", "child-2", "child-3"], deliveredBy: "Sarah Johnson", method: "group_session", childrenEngaged: true, followUpNeeded: false },
    { id: "edu-5", date: "2026-03-25", topic: "screen_time_balance", childIds: ["child-1"], deliveredBy: "Sarah Johnson", method: "one_to_one", childrenEngaged: true, followUpNeeded: false },
    { id: "edu-6", date: "2026-04-10", topic: "social_media_safety", childIds: ["child-2", "child-3"], deliveredBy: "Lisa Williams", method: "group_session", childrenEngaged: true, followUpNeeded: false },
    { id: "edu-7", date: "2026-04-20", topic: "reporting_concerns", childIds: ["child-1", "child-2", "child-3"], deliveredBy: "Darren Laville", method: "group_session", childrenEngaged: true, followUpNeeded: false },
    { id: "edu-8", date: "2026-05-05", topic: "digital_footprint", childIds: ["child-3"], deliveredBy: "Lisa Williams", method: "one_to_one", childrenEngaged: true, followUpNeeded: true },
  ];
}

function makeTraining(): StaffOnlineTraining[] {
  return [
    { staffId: "staff-sarah", staffName: "Sarah Johnson", trainingName: "Online Safety in Children's Homes", completionDate: "2025-09-15", expiryDate: "2026-09-15", provider: "NSPCC", certificateHeld: true },
    { staffId: "staff-tom", staffName: "Tom Richards", trainingName: "Online Safety in Children's Homes", completionDate: "2025-10-01", expiryDate: "2026-10-01", provider: "NSPCC", certificateHeld: true },
    { staffId: "staff-lisa", staffName: "Lisa Williams", trainingName: "Online Safety in Children's Homes", completionDate: "2025-11-15", expiryDate: "2026-11-15", provider: "NSPCC", certificateHeld: true },
    { staffId: "staff-darren", staffName: "Darren Laville", trainingName: "Online Safety for Managers", completionDate: "2025-08-01", expiryDate: "2026-08-01", provider: "Internet Watch Foundation", certificateHeld: true },
  ];
}

const STAFF_IDS = ["staff-sarah", "staff-tom", "staff-lisa", "staff-darren"];

function makePolicy(): OnlineSafetyPolicy {
  return {
    lastReviewDate: "2026-01-15",
    nextReviewDue: "2027-01-15",
    filteringProvider: "NetNanny",
    monitoringProvider: "Bark",
    reportingPathwayDocumented: true,
    childFriendlyVersion: true,
    staffBriefedDate: "2026-01-20",
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// RISK ASSESSMENT COVERAGE
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRiskAssessments", () => {
  it("reports 100% assessment rate when all children assessed", () => {
    const result = evaluateRiskAssessments(makeChildren(), makeAssessments(), CURRENT_DATE);
    expect(result.totalChildren).toBe(3);
    expect(result.childrenWithAssessment).toBe(3);
    expect(result.assessmentRate).toBe(100);
  });

  it("detects missing assessments", () => {
    const assessments = makeAssessments().filter((a) => a.childId !== "child-2");
    const result = evaluateRiskAssessments(makeChildren(), assessments, CURRENT_DATE);
    expect(result.childrenWithAssessment).toBe(2);
    expect(result.assessmentRate).toBe(67);
  });

  it("detects overdue assessments", () => {
    const assessments = makeAssessments();
    assessments[0] = { ...assessments[0], reviewDueDate: "2026-04-01" };
    const result = evaluateRiskAssessments(makeChildren(), assessments, CURRENT_DATE);
    expect(result.overdueAssessments).toBe(1);
  });

  it("provides risk level breakdown", () => {
    const result = evaluateRiskAssessments(makeChildren(), makeAssessments(), CURRENT_DATE);
    expect(result.riskLevelBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ level: "high", count: 1 }),
        expect.objectContaining({ level: "medium", count: 1 }),
        expect.objectContaining({ level: "low", count: 1 }),
      ]),
    );
  });

  it("calculates device agreement rate", () => {
    const result = evaluateRiskAssessments(makeChildren(), makeAssessments(), CURRENT_DATE);
    expect(result.deviceAgreementRate).toBe(100);
  });

  it("identifies children at high risk", () => {
    const result = evaluateRiskAssessments(makeChildren(), makeAssessments(), CURRENT_DATE);
    expect(result.childrenAtHighRisk).toContain("Morgan");
    expect(result.childrenAtHighRisk).not.toContain("Alex");
  });

  it("calculates average safety measures", () => {
    const result = evaluateRiskAssessments(makeChildren(), makeAssessments(), CURRENT_DATE);
    // Alex: 4, Jordan: 4, Morgan: 5 → 13/3 = 4.3
    expect(result.averageSafetyMeasures).toBe(4.3);
  });

  it("handles no assessments", () => {
    const result = evaluateRiskAssessments(makeChildren(), [], CURRENT_DATE);
    expect(result.assessmentRate).toBe(0);
    expect(result.deviceAgreementRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INCIDENT ANALYSIS
// ══════════════════════════════════════════════════════════════════════════════

describe("analyseOnlineIncidents", () => {
  it("counts total incidents in period", () => {
    const result = analyseOnlineIncidents(makeChildren(), makeIncidents(), PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(3);
  });

  it("calculates average severity", () => {
    const result = analyseOnlineIncidents(makeChildren(), makeIncidents(), PERIOD_START, PERIOD_END);
    // (1 + 4 + 2) / 3 = 2.3
    expect(result.averageSeverity).toBe(2.3);
  });

  it("reports resolved rate", () => {
    const result = analyseOnlineIncidents(makeChildren(), makeIncidents(), PERIOD_START, PERIOD_END);
    expect(result.resolvedRate).toBe(100);
  });

  it("counts CEOP referrals and police involvement", () => {
    const result = analyseOnlineIncidents(makeChildren(), makeIncidents(), PERIOD_START, PERIOD_END);
    expect(result.ceopReferrals).toBe(1);
    expect(result.policeInvolvement).toBe(1);
  });

  it("provides type breakdown", () => {
    const result = analyseOnlineIncidents(makeChildren(), makeIncidents(), PERIOD_START, PERIOD_END);
    expect(result.typeBreakdown).toHaveLength(3);
  });

  it("identifies children with multiple incidents", () => {
    const incidents = makeIncidents();
    incidents.push({
      id: "oi-extra",
      childId: "child-3",
      date: "2026-04-15",
      incidentType: "social_media_misuse",
      severity: 2,
      description: "Extra incident",
      reportedTo: ["key_worker"],
      ceopReferral: false,
      policeInvolved: false,
      socialWorkerNotified: false,
      parentNotified: false,
      deviceSeized: false,
      safeguardingActionTaken: ["Discussed"],
      resolved: true,
      resolvedDate: "2026-04-16",
    });
    const result = analyseOnlineIncidents(makeChildren(), incidents, PERIOD_START, PERIOD_END);
    expect(result.childrenWithMultipleIncidents).toContain("Morgan");
  });

  it("handles zero incidents", () => {
    const result = analyseOnlineIncidents(makeChildren(), [], PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(0);
    expect(result.averageSeverity).toBe(0);
    expect(result.resolvedRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EDUCATION DELIVERY
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEducation", () => {
  it("counts total sessions in period", () => {
    const result = evaluateEducation(makeChildren(), makeEducation(), PERIOD_START, PERIOD_END);
    expect(result.totalSessions).toBe(8);
  });

  it("calculates sessions per child", () => {
    const result = evaluateEducation(makeChildren(), makeEducation(), PERIOD_START, PERIOD_END);
    // 8 / 3 = 2.7
    expect(result.sessionsPerChild).toBe(2.7);
  });

  it("tracks topic coverage", () => {
    const result = evaluateEducation(makeChildren(), makeEducation(), PERIOD_START, PERIOD_END);
    // 8 sessions covering: recognising_grooming, image_sharing_law, cyberbullying_awareness,
    // privacy_settings, screen_time_balance, social_media_safety, reporting_concerns, digital_footprint = 8 topics
    expect(result.topicsCovered).toBe(8);
    expect(result.totalTopics).toBe(12);
    expect(result.topicCoverageRate).toBe(67); // 8/12
  });

  it("reports engagement rate", () => {
    const result = evaluateEducation(makeChildren(), makeEducation(), PERIOD_START, PERIOD_END);
    expect(result.engagementRate).toBe(100);
  });

  it("identifies children with no education", () => {
    const sessions = makeEducation().filter(
      (s) => !s.childIds.includes("child-1"),
    );
    const result = evaluateEducation(makeChildren(), sessions, PERIOD_START, PERIOD_END);
    expect(result.childrenWithNoEducation).toContain("Alex");
  });

  it("handles no sessions", () => {
    const result = evaluateEducation(makeChildren(), [], PERIOD_START, PERIOD_END);
    expect(result.totalSessions).toBe(0);
    expect(result.topicCoverageRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// STAFF TRAINING
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffTraining", () => {
  it("reports all staff trained when all have records", () => {
    const result = evaluateStaffTraining(makeTraining(), STAFF_IDS, CURRENT_DATE);
    expect(result.trainingRate).toBe(100);
    expect(result.staffMissingTraining).toHaveLength(0);
  });

  it("detects untrained staff", () => {
    const result = evaluateStaffTraining(makeTraining(), [...STAFF_IDS, "staff-new"], CURRENT_DATE);
    expect(result.trainingRate).toBe(80);
    expect(result.staffMissingTraining).toContain("staff-new");
  });

  it("detects expired training", () => {
    const training = makeTraining();
    training.push({
      staffId: "staff-old",
      staffName: "Old Person",
      trainingName: "Expired Training",
      completionDate: "2024-01-01",
      expiryDate: "2025-06-01",
      provider: "NSPCC",
      certificateHeld: false,
    });
    const result = evaluateStaffTraining(training, [...STAFF_IDS, "staff-old"], CURRENT_DATE);
    expect(result.expiredTraining).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CHILD ONLINE PROFILES
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildOnlineProfiles", () => {
  it("builds profile for each placed child", () => {
    const profiles = buildChildOnlineProfiles(
      makeChildren(), makeAssessments(), makeIncidents(), makeEducation(),
      PERIOD_START, PERIOD_END, CURRENT_DATE,
    );
    expect(profiles).toHaveLength(3);
  });

  it("reports assessment status correctly", () => {
    const profiles = buildChildOnlineProfiles(
      makeChildren(), makeAssessments(), makeIncidents(), makeEducation(),
      PERIOD_START, PERIOD_END, CURRENT_DATE,
    );
    expect(profiles.every((p) => p.hasRiskAssessment)).toBe(true);
  });

  it("tracks incident counts per child", () => {
    const profiles = buildChildOnlineProfiles(
      makeChildren(), makeAssessments(), makeIncidents(), makeEducation(),
      PERIOD_START, PERIOD_END, CURRENT_DATE,
    );
    // Alex: 1 incident (screen time)
    expect(profiles[0].incidentCount).toBe(1);
    // Jordan: 1 incident (cyberbullying)
    expect(profiles[1].incidentCount).toBe(1);
    // Morgan: 1 incident (grooming)
    expect(profiles[2].incidentCount).toBe(1);
  });

  it("identifies high-severity incidents", () => {
    const profiles = buildChildOnlineProfiles(
      makeChildren(), makeAssessments(), makeIncidents(), makeEducation(),
      PERIOD_START, PERIOD_END, CURRENT_DATE,
    );
    // Morgan: severity 4
    expect(profiles[2].highSeverityIncidents).toBe(1);
    expect(profiles[2].primaryConcern).toContain("high-severity");
  });

  it("flags primary concern for missing assessments", () => {
    const profiles = buildChildOnlineProfiles(
      makeChildren(), [], makeIncidents(), makeEducation(),
      PERIOD_START, PERIOD_END, CURRENT_DATE,
    );
    expect(profiles[0].primaryConcern).toBe("No online safety risk assessment on record");
  });

  it("tracks social media account counts", () => {
    const profiles = buildChildOnlineProfiles(
      makeChildren(), makeAssessments(), makeIncidents(), makeEducation(),
      PERIOD_START, PERIOD_END, CURRENT_DATE,
    );
    // Alex: 2 accounts
    expect(profiles[0].socialMediaAccounts).toBe(2);
    // Morgan: 4 accounts
    expect(profiles[2].socialMediaAccounts).toBe(4);
  });

  it("tracks education session counts", () => {
    const profiles = buildChildOnlineProfiles(
      makeChildren(), makeAssessments(), makeIncidents(), makeEducation(),
      PERIOD_START, PERIOD_END, CURRENT_DATE,
    );
    // Alex: edu-1, edu-3, edu-4, edu-5, edu-7 = 5
    expect(profiles[0].educationSessionCount).toBe(5);
    // Jordan: edu-1, edu-3, edu-4, edu-6, edu-7 = 5
    expect(profiles[1].educationSessionCount).toBe(5);
    // Morgan: edu-1, edu-2, edu-3, edu-4, edu-6, edu-7, edu-8 = 7
    expect(profiles[2].educationSessionCount).toBe(7);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION: generateOnlineSafetyIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateOnlineSafetyIntelligence", () => {
  it("returns complete result structure", () => {
    const result = generateOnlineSafetyIntelligence(
      makeChildren(), makeAssessments(), makeIncidents(), makeEducation(),
      makeTraining(), STAFF_IDS, makePolicy(), "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.riskAssessments).toBeDefined();
    expect(result.incidentAnalysis).toBeDefined();
    expect(result.education).toBeDefined();
    expect(result.staffTraining).toBeDefined();
    expect(result.childProfiles).toHaveLength(3);
    expect(result.policyStatus).toBeDefined();
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("scores well for comprehensive setup", () => {
    const result = generateOnlineSafetyIntelligence(
      makeChildren(), makeAssessments(), makeIncidents(), makeEducation(),
      makeTraining(), STAFF_IDS, makePolicy(), "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(["outstanding", "good"]).toContain(result.rating);
  });

  it("scores lower without assessments", () => {
    const good = generateOnlineSafetyIntelligence(
      makeChildren(), makeAssessments(), makeIncidents(), makeEducation(),
      makeTraining(), STAFF_IDS, makePolicy(), "oak-house", PERIOD_START, PERIOD_END,
    );
    const poor = generateOnlineSafetyIntelligence(
      makeChildren(), [], makeIncidents(), makeEducation(),
      makeTraining(), STAFF_IDS, makePolicy(), "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(poor.overallScore).toBeLessThan(good.overallScore);
  });

  it("scores lower without training", () => {
    const good = generateOnlineSafetyIntelligence(
      makeChildren(), makeAssessments(), makeIncidents(), makeEducation(),
      makeTraining(), STAFF_IDS, makePolicy(), "oak-house", PERIOD_START, PERIOD_END,
    );
    const poor = generateOnlineSafetyIntelligence(
      makeChildren(), makeAssessments(), makeIncidents(), makeEducation(),
      [], STAFF_IDS, makePolicy(), "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(poor.overallScore).toBeLessThan(good.overallScore);
  });

  it("scores lower with overdue policy", () => {
    const good = generateOnlineSafetyIntelligence(
      makeChildren(), makeAssessments(), makeIncidents(), makeEducation(),
      makeTraining(), STAFF_IDS, makePolicy(), "oak-house", PERIOD_START, PERIOD_END,
    );
    const poor = generateOnlineSafetyIntelligence(
      makeChildren(), makeAssessments(), makeIncidents(), makeEducation(),
      makeTraining(), STAFF_IDS,
      { ...makePolicy(), nextReviewDue: "2025-12-01", filteringProvider: undefined, monitoringProvider: undefined },
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(poor.overallScore).toBeLessThan(good.overallScore);
  });

  it("includes KCSIE regulatory link", () => {
    const result = generateOnlineSafetyIntelligence(
      makeChildren(), makeAssessments(), makeIncidents(), makeEducation(),
      makeTraining(), STAFF_IDS, makePolicy(), "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("KCSIE"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CEOP"))).toBe(true);
  });

  it("generates urgent action for missing assessments", () => {
    const result = generateOnlineSafetyIntelligence(
      makeChildren(), makeAssessments().filter((a) => a.childId !== "child-2"), makeIncidents(), makeEducation(),
      makeTraining(), STAFF_IDS, makePolicy(), "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.immediateActions.some((a) => a.includes("URGENT") && a.includes("Jordan"))).toBe(true);
  });

  it("generates urgent action for high-severity incidents", () => {
    const result = generateOnlineSafetyIntelligence(
      makeChildren(), makeAssessments(), makeIncidents(), makeEducation(),
      makeTraining(), STAFF_IDS, makePolicy(), "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.immediateActions.some((a) => a.includes("URGENT") && a.includes("Morgan"))).toBe(true);
  });

  it("notes policy status in results", () => {
    const result = generateOnlineSafetyIntelligence(
      makeChildren(), makeAssessments(), makeIncidents(), makeEducation(),
      makeTraining(), STAFF_IDS, makePolicy(), "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.policyStatus.current).toBe(true);
    expect(result.policyStatus.filteringInPlace).toBe(true);
    expect(result.policyStatus.monitoringInPlace).toBe(true);
    expect(result.policyStatus.reportingPathway).toBe(true);
    expect(result.policyStatus.childFriendly).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// LABELS
// ══════════════════════════════════════════════════════════════════════════════

describe("labels", () => {
  it("returns correct risk category labels", () => {
    expect(getRiskCategoryLabel("grooming")).toBe("Online Grooming");
    expect(getRiskCategoryLabel("sextortion")).toBe("Sextortion");
  });

  it("returns correct incident type labels", () => {
    expect(getIncidentTypeLabel("attempted_grooming")).toBe("Attempted Grooming");
    expect(getIncidentTypeLabel("cyberbullying_victim")).toBe("Cyberbullying (Victim)");
  });

  it("returns correct education topic labels", () => {
    expect(getEducationTopicLabel("recognising_grooming")).toBe("Recognising Grooming");
    expect(getEducationTopicLabel("digital_footprint")).toBe("Digital Footprint");
  });
});
