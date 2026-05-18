import { describe, it, expect } from "vitest";
import {
  evaluateWorkforceSafety,
  evaluateReferralQuality,
  evaluateAuditCompliance,
  evaluateDSLOversight,
  buildStaffSafeguardingProfiles,
  generateSafeguardingOversightIntelligence,
  getRating,
  getDBSStatusLabel,
  getTrainingLevelLabel,
  getReferralTypeLabel,
  getReferralOutcomeLabel,
  getConcernCategoryLabel,
  getConcernPriorityLabel,
  getRatingLabel,
} from "../safeguarding-oversight-engine";
import type {
  StaffSafeguardingRecord,
  SafeguardingReferral,
  SafeguardingAudit,
  DSLOversight,
} from "../safeguarding-oversight-engine";

// -- Helpers ------------------------------------------------------------------

function makeStaff(overrides: Partial<StaffSafeguardingRecord> = {}): StaffSafeguardingRecord {
  return {
    id: "s-1",
    staffId: "staff-1",
    staffName: "Sarah Johnson",
    role: "Senior RSW",
    dbsStatus: "enhanced_current",
    dbsDate: "2025-06-01",
    trainingLevel: "level_3_current",
    lastTrainingDate: "2025-09-01",
    designatedSafeguardingLead: false,
    deputyDSL: false,
    saferRecruitmentTrained: true,
    preventTrained: true,
    ...overrides,
  };
}

function makeReferral(overrides: Partial<SafeguardingReferral> = {}): SafeguardingReferral {
  return {
    id: "r-1",
    childId: "child-1",
    childName: "Alex",
    referralType: "mash",
    outcome: "action_taken",
    dateReferred: "2026-03-15",
    dateOutcome: "2026-03-20",
    referredBy: "Sarah Johnson",
    concernCategory: "emotional_abuse",
    concernPriority: "high",
    timelyReferral: true,
    managementInformed: true,
    parentNotified: true,
    childInformed: true,
    recordedAppropriately: true,
    ...overrides,
  };
}

function makeAudit(overrides: Partial<SafeguardingAudit> = {}): SafeguardingAudit {
  return {
    id: "a-1",
    homeId: "oak-house",
    auditDate: "2026-04-01",
    auditor: "Darren Laville",
    policiesUpToDate: true,
    riskAssessmentsCurrentForAllChildren: true,
    bodyMapProtocolFollowed: true,
    whistleblowingPolicyAccessible: true,
    childrenKnowHowToComplain: true,
    safeguardingDisplayed: true,
    visitorsSignedIn: true,
    mobilePhonePolicy: true,
    photographyPolicy: true,
    overallCompliant: true,
    ...overrides,
  };
}

function makeDSLReview(overrides: Partial<DSLOversight> = {}): DSLOversight {
  return {
    id: "d-1",
    dslName: "Darren Laville",
    reviewDate: "2026-04-01",
    openCasesReviewed: 3,
    openCasesTotal: 3,
    supervisionOfConcerns: true,
    multiAgencyAttendance: true,
    trainingDelivered: true,
    policyReviewCompleted: true,
    incidentDebriefsConducted: true,
    staffSupportProvided: true,
    ...overrides,
  };
}

// -- Label Functions ----------------------------------------------------------

describe("getDBSStatusLabel", () => {
  it("returns correct labels", () => {
    expect(getDBSStatusLabel("enhanced_current")).toBe("Enhanced (Current)");
    expect(getDBSStatusLabel("enhanced_expiring")).toBe("Enhanced (Expiring)");
    expect(getDBSStatusLabel("enhanced_expired")).toBe("Enhanced (Expired)");
    expect(getDBSStatusLabel("basic_only")).toBe("Basic Only");
    expect(getDBSStatusLabel("not_completed")).toBe("Not Completed");
    expect(getDBSStatusLabel("update_service")).toBe("Update Service");
  });
});

describe("getTrainingLevelLabel", () => {
  it("returns correct labels", () => {
    expect(getTrainingLevelLabel("level_3_current")).toBe("Level 3 (Current)");
    expect(getTrainingLevelLabel("level_2_current")).toBe("Level 2 (Current)");
    expect(getTrainingLevelLabel("level_1_current")).toBe("Level 1 (Current)");
    expect(getTrainingLevelLabel("refresher_due")).toBe("Refresher Due");
    expect(getTrainingLevelLabel("expired")).toBe("Expired");
    expect(getTrainingLevelLabel("not_completed")).toBe("Not Completed");
  });
});

describe("getReferralTypeLabel", () => {
  it("returns correct labels", () => {
    expect(getReferralTypeLabel("lado")).toBe("LADO");
    expect(getReferralTypeLabel("mash")).toBe("MASH");
    expect(getReferralTypeLabel("police")).toBe("Police");
    expect(getReferralTypeLabel("social_care")).toBe("Social Care");
    expect(getReferralTypeLabel("prevent")).toBe("Prevent");
    expect(getReferralTypeLabel("channel")).toBe("Channel");
    expect(getReferralTypeLabel("camhs")).toBe("CAMHS");
    expect(getReferralTypeLabel("nspcc")).toBe("NSPCC");
    expect(getReferralTypeLabel("internal_safeguarding")).toBe("Internal Safeguarding");
  });
});

describe("getReferralOutcomeLabel", () => {
  it("returns correct labels", () => {
    expect(getReferralOutcomeLabel("action_taken")).toBe("Action Taken");
    expect(getReferralOutcomeLabel("no_further_action")).toBe("No Further Action");
    expect(getReferralOutcomeLabel("ongoing_investigation")).toBe("Ongoing Investigation");
    expect(getReferralOutcomeLabel("referred_on")).toBe("Referred On");
    expect(getReferralOutcomeLabel("awaiting_outcome")).toBe("Awaiting Outcome");
    expect(getReferralOutcomeLabel("withdrawn")).toBe("Withdrawn");
  });
});

describe("getConcernCategoryLabel", () => {
  it("returns correct labels", () => {
    expect(getConcernCategoryLabel("physical_abuse")).toBe("Physical Abuse");
    expect(getConcernCategoryLabel("emotional_abuse")).toBe("Emotional Abuse");
    expect(getConcernCategoryLabel("sexual_abuse")).toBe("Sexual Abuse");
    expect(getConcernCategoryLabel("neglect")).toBe("Neglect");
    expect(getConcernCategoryLabel("exploitation")).toBe("Exploitation");
    expect(getConcernCategoryLabel("radicalisation")).toBe("Radicalisation");
    expect(getConcernCategoryLabel("online_harm")).toBe("Online Harm");
    expect(getConcernCategoryLabel("peer_on_peer")).toBe("Peer-on-Peer");
    expect(getConcernCategoryLabel("self_harm")).toBe("Self-Harm");
    expect(getConcernCategoryLabel("domestic_abuse")).toBe("Domestic Abuse");
    expect(getConcernCategoryLabel("honour_based")).toBe("Honour-Based");
    expect(getConcernCategoryLabel("fgm")).toBe("FGM");
    expect(getConcernCategoryLabel("trafficking")).toBe("Trafficking");
  });
});

describe("getConcernPriorityLabel", () => {
  it("returns correct labels", () => {
    expect(getConcernPriorityLabel("immediate")).toBe("Immediate");
    expect(getConcernPriorityLabel("high")).toBe("High");
    expect(getConcernPriorityLabel("medium")).toBe("Medium");
    expect(getConcernPriorityLabel("low")).toBe("Low");
  });
});

describe("getRatingLabel", () => {
  it("returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- getRating ----------------------------------------------------------------

describe("getRating", () => {
  it("returns outstanding for >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });
  it("returns good for >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });
  it("returns requires_improvement for >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });
  it("returns inadequate for < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// -- evaluateWorkforceSafety --------------------------------------------------

describe("evaluateWorkforceSafety", () => {
  it("returns zero for empty data", () => {
    const result = evaluateWorkforceSafety([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.hasDSL).toBe(false);
    expect(result.hasDeputyDSL).toBe(false);
  });

  it("scores high for fully compliant workforce with DSL", () => {
    const staff: StaffSafeguardingRecord[] = [
      makeStaff({ id: "1", staffId: "s1", designatedSafeguardingLead: true }),
      makeStaff({ id: "2", staffId: "s2", staffName: "Tom Richards", deputyDSL: true }),
      makeStaff({ id: "3", staffId: "s3", staffName: "Lisa Williams" }),
    ];
    const result = evaluateWorkforceSafety(staff);
    expect(result.enhancedDBSRate).toBe(100);
    expect(result.currentTrainingRate).toBe(100);
    expect(result.hasDSL).toBe(true);
    expect(result.hasDeputyDSL).toBe(true);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
  });

  it("penalises expired DBS checks", () => {
    const staff = [
      makeStaff({ id: "1", dbsStatus: "enhanced_expired" }),
    ];
    const result = evaluateWorkforceSafety(staff);
    expect(result.expiredDBSCount).toBe(1);
    expect(result.overallScore).toBeLessThan(20);
  });

  it("penalises expired training", () => {
    const staff = [
      makeStaff({ id: "1", trainingLevel: "expired" }),
    ];
    const result = evaluateWorkforceSafety(staff);
    expect(result.expiredTrainingCount).toBe(1);
  });

  it("counts update_service as valid DBS", () => {
    const staff = [makeStaff({ dbsStatus: "update_service" })];
    const result = evaluateWorkforceSafety(staff);
    expect(result.enhancedDBSRate).toBe(100);
  });

  it("awards bonus for DSL at level 3", () => {
    const withDSL = [makeStaff({ designatedSafeguardingLead: true, trainingLevel: "level_3_current" })];
    const withDSLLevel1 = [makeStaff({ designatedSafeguardingLead: true, trainingLevel: "level_1_current" })];
    const r1 = evaluateWorkforceSafety(withDSL);
    const r2 = evaluateWorkforceSafety(withDSLLevel1);
    expect(r1.overallScore).toBeGreaterThan(r2.overallScore);
  });

  it("caps score at 25", () => {
    const staff = Array.from({ length: 10 }, (_, i) =>
      makeStaff({
        id: `s-${i}`,
        staffId: `staff-${i}`,
        staffName: `Staff ${i}`,
        designatedSafeguardingLead: i === 0,
        deputyDSL: i === 1,
      }),
    );
    const result = evaluateWorkforceSafety(staff);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("floor at 0", () => {
    const staff = Array.from({ length: 5 }, (_, i) =>
      makeStaff({
        id: `s-${i}`,
        staffId: `staff-${i}`,
        dbsStatus: "not_completed",
        trainingLevel: "not_completed",
        saferRecruitmentTrained: false,
        preventTrained: false,
      }),
    );
    const result = evaluateWorkforceSafety(staff);
    expect(result.overallScore).toBe(0);
  });
});

// -- evaluateReferralQuality --------------------------------------------------

describe("evaluateReferralQuality", () => {
  it("returns max score for empty data (no referrals = good)", () => {
    const result = evaluateReferralQuality([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalReferrals).toBe(0);
  });

  it("scores high for timely, well-recorded referrals", () => {
    const referrals = [
      makeReferral({ id: "1" }),
      makeReferral({ id: "2", childId: "child-2", childName: "Jordan" }),
    ];
    const result = evaluateReferralQuality(referrals);
    expect(result.timelyReferralRate).toBe(100);
    expect(result.managementInformedRate).toBe(100);
    expect(result.recordedAppropriatelyRate).toBe(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
  });

  it("penalises late urgent referrals", () => {
    const referrals = [
      makeReferral({ id: "1", concernPriority: "immediate", timelyReferral: false }),
    ];
    const result = evaluateReferralQuality(referrals);
    expect(result.overallScore).toBeLessThan(20);
  });

  it("counts immediate and high priority referrals", () => {
    const referrals = [
      makeReferral({ id: "1", concernPriority: "immediate" }),
      makeReferral({ id: "2", concernPriority: "high" }),
      makeReferral({ id: "3", concernPriority: "low" }),
    ];
    const result = evaluateReferralQuality(referrals);
    expect(result.immediateHighCount).toBe(2);
  });

  it("counts awaiting outcome referrals", () => {
    const referrals = [
      makeReferral({ id: "1", outcome: "awaiting_outcome" }),
      makeReferral({ id: "2", outcome: "awaiting_outcome" }),
      makeReferral({ id: "3", outcome: "action_taken" }),
    ];
    const result = evaluateReferralQuality(referrals);
    expect(result.awaitingOutcomeCount).toBe(2);
  });

  it("caps score at 25", () => {
    const referrals = Array.from({ length: 10 }, (_, i) => makeReferral({ id: `r-${i}` }));
    const result = evaluateReferralQuality(referrals);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// -- evaluateAuditCompliance --------------------------------------------------

describe("evaluateAuditCompliance", () => {
  it("returns zero for empty data", () => {
    const result = evaluateAuditCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAudits).toBe(0);
  });

  it("scores high for fully compliant audits", () => {
    const audits = [makeAudit({ id: "1" }), makeAudit({ id: "2" })];
    const result = evaluateAuditCompliance(audits);
    expect(result.overallCompliantRate).toBe(100);
    expect(result.policiesUpToDateRate).toBe(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(22);
  });

  it("handles mixed compliance", () => {
    const audits = [
      makeAudit({ id: "1" }),
      makeAudit({
        id: "2",
        policiesUpToDate: false,
        riskAssessmentsCurrentForAllChildren: false,
        overallCompliant: false,
      }),
    ];
    const result = evaluateAuditCompliance(audits);
    expect(result.overallCompliantRate).toBe(50);
    expect(result.policiesUpToDateRate).toBe(50);
  });

  it("caps score at 25", () => {
    const audits = Array.from({ length: 10 }, (_, i) => makeAudit({ id: `a-${i}` }));
    const result = evaluateAuditCompliance(audits);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// -- evaluateDSLOversight -----------------------------------------------------

describe("evaluateDSLOversight", () => {
  it("returns zero for empty data", () => {
    const result = evaluateDSLOversight([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalReviews).toBe(0);
  });

  it("scores high for comprehensive oversight", () => {
    const reviews = [makeDSLReview({ id: "1" }), makeDSLReview({ id: "2" })];
    const result = evaluateDSLOversight(reviews);
    expect(result.caseReviewRate).toBe(100);
    expect(result.supervisionRate).toBe(100);
    expect(result.multiAgencyRate).toBe(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(22);
  });

  it("calculates case review rate across all reviews", () => {
    const reviews = [
      makeDSLReview({ id: "1", openCasesReviewed: 2, openCasesTotal: 4 }),
      makeDSLReview({ id: "2", openCasesReviewed: 3, openCasesTotal: 6 }),
    ];
    const result = evaluateDSLOversight(reviews);
    expect(result.caseReviewRate).toBe(50);
  });

  it("handles partial oversight", () => {
    const reviews = [
      makeDSLReview({ id: "1", supervisionOfConcerns: false, multiAgencyAttendance: false }),
    ];
    const result = evaluateDSLOversight(reviews);
    expect(result.supervisionRate).toBe(0);
    expect(result.multiAgencyRate).toBe(0);
  });

  it("caps score at 25", () => {
    const reviews = Array.from({ length: 10 }, (_, i) => makeDSLReview({ id: `d-${i}` }));
    const result = evaluateDSLOversight(reviews);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// -- buildStaffSafeguardingProfiles -------------------------------------------

describe("buildStaffSafeguardingProfiles", () => {
  it("returns empty for no staff", () => {
    expect(buildStaffSafeguardingProfiles([])).toEqual([]);
  });

  it("marks compliant staff correctly", () => {
    const staff = [makeStaff()];
    const profiles = buildStaffSafeguardingProfiles(staff);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].compliant).toBe(true);
    expect(profiles[0].staffName).toBe("Sarah Johnson");
  });

  it("marks non-compliant staff correctly", () => {
    const staff = [makeStaff({ dbsStatus: "enhanced_expired" })];
    const profiles = buildStaffSafeguardingProfiles(staff);
    expect(profiles[0].compliant).toBe(false);
  });

  it("identifies DSL and Deputy", () => {
    const staff = [
      makeStaff({ id: "1", staffId: "s1", designatedSafeguardingLead: true }),
      makeStaff({ id: "2", staffId: "s2", staffName: "Tom", deputyDSL: true }),
    ];
    const profiles = buildStaffSafeguardingProfiles(staff);
    expect(profiles[0].isDSL).toBe(true);
    expect(profiles[1].isDeputyDSL).toBe(true);
  });

  it("handles expired training as non-compliant", () => {
    const staff = [makeStaff({ trainingLevel: "expired" })];
    const profiles = buildStaffSafeguardingProfiles(staff);
    expect(profiles[0].compliant).toBe(false);
  });
});

// -- generateSafeguardingOversightIntelligence --------------------------------

describe("generateSafeguardingOversightIntelligence", () => {
  it("returns result with correct structure for empty data", () => {
    const result = generateSafeguardingOversightIntelligence([], [], [], [], "oak-house", "2026-01-01", "2026-05-18");
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-18");
    expect(result.overallScore).toBe(25); // only referral gives 25 for empty
    expect(result.rating).toBe("inadequate");
    expect(result.staffProfiles).toEqual([]);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("scores highly for comprehensive safeguarding", () => {
    const staff = [
      makeStaff({ id: "1", staffId: "s1", designatedSafeguardingLead: true }),
      makeStaff({ id: "2", staffId: "s2", staffName: "Tom", deputyDSL: true }),
      makeStaff({ id: "3", staffId: "s3", staffName: "Lisa" }),
    ];
    const audits = [makeAudit()];
    const dslReviews = [makeDSLReview()];

    const result = generateSafeguardingOversightIntelligence(
      staff, [], audits, dslReviews, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(70);
    expect(result.rating).not.toBe("inadequate");
  });

  it("generates strengths for high-scoring data", () => {
    const staff = [
      makeStaff({ id: "1", staffId: "s1", designatedSafeguardingLead: true }),
      makeStaff({ id: "2", staffId: "s2", staffName: "Tom", deputyDSL: true }),
    ];
    const audits = [makeAudit()];
    const dslReviews = [makeDSLReview()];

    const result = generateSafeguardingOversightIntelligence(
      staff, [], audits, dslReviews, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions for expired DBS", () => {
    const staff = [
      makeStaff({ id: "1", staffId: "s1", dbsStatus: "enhanced_expired" }),
    ];
    const result = generateSafeguardingOversightIntelligence(
      staff, [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    const urgent = result.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgent.length).toBeGreaterThan(0);
    expect(urgent.some((a) => a.includes("DBS"))).toBe(true);
  });

  it("generates URGENT actions for no DSL", () => {
    const staff = [makeStaff()]; // not DSL
    const result = generateSafeguardingOversightIntelligence(
      staff, [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    const urgent = result.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgent.some((a) => a.includes("Designated Safeguarding Lead"))).toBe(true);
  });

  it("includes core regulatory links", () => {
    const result = generateSafeguardingOversightIntelligence([], [], [], [], "oak-house", "2026-01-01", "2026-05-18");
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 32"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("KCSIE 2024"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 3"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together 2023"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 19"))).toBe(true);
  });

  it("includes s47 link when referrals present", () => {
    const referrals = [makeReferral()];
    const result = generateSafeguardingOversightIntelligence([], referrals, [], [], "oak-house", "2026-01-01", "2026-05-18");
    expect(result.regulatoryLinks.some((l) => l.includes("CA 1989 s47"))).toBe(true);
  });

  it("caps overall score at 100", () => {
    const staff = Array.from({ length: 5 }, (_, i) =>
      makeStaff({ id: `s-${i}`, staffId: `staff-${i}`, designatedSafeguardingLead: i === 0, deputyDSL: i === 1 }),
    );
    const audits = Array.from({ length: 5 }, (_, i) => makeAudit({ id: `a-${i}` }));
    const dslReviews = Array.from({ length: 5 }, (_, i) => makeDSLReview({ id: `d-${i}` }));
    const result = generateSafeguardingOversightIntelligence(
      staff, [], audits, dslReviews, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("handles areas for improvement when scores are low", () => {
    const staff = [
      makeStaff({ dbsStatus: "not_completed", trainingLevel: "not_completed", saferRecruitmentTrained: false, preventTrained: false }),
    ];
    const result = generateSafeguardingOversightIntelligence(
      staff, [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });
});

// -- Edge Cases ---------------------------------------------------------------

describe("edge cases", () => {
  it("single staff record returns valid result", () => {
    const result = evaluateWorkforceSafety([makeStaff()]);
    expect(result.totalStaff).toBe(1);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("single referral returns valid result", () => {
    const result = evaluateReferralQuality([makeReferral()]);
    expect(result.totalReferrals).toBe(1);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("single audit returns valid result", () => {
    const result = evaluateAuditCompliance([makeAudit()]);
    expect(result.totalAudits).toBe(1);
  });

  it("single DSL review returns valid result", () => {
    const result = evaluateDSLOversight([makeDSLReview()]);
    expect(result.totalReviews).toBe(1);
  });

  it("all non-compliant staff produces very low score", () => {
    const staff = Array.from({ length: 5 }, (_, i) =>
      makeStaff({
        id: `s-${i}`,
        staffId: `staff-${i}`,
        dbsStatus: "not_completed",
        trainingLevel: "not_completed",
        saferRecruitmentTrained: false,
        preventTrained: false,
      }),
    );
    const result = evaluateWorkforceSafety(staff);
    expect(result.overallScore).toBe(0);
  });

  it("all audits non-compliant produces low audit score", () => {
    const audits = Array.from({ length: 3 }, (_, i) =>
      makeAudit({
        id: `a-${i}`,
        policiesUpToDate: false,
        riskAssessmentsCurrentForAllChildren: false,
        childrenKnowHowToComplain: false,
        visitorsSignedIn: false,
        overallCompliant: false,
      }),
    );
    const result = evaluateAuditCompliance(audits);
    expect(result.overallScore).toBeLessThan(5);
  });

  it("referral with all false flags scores low", () => {
    const referrals = [
      makeReferral({
        timelyReferral: false,
        managementInformed: false,
        recordedAppropriately: false,
        childInformed: false,
        concernPriority: "immediate",
        outcome: "awaiting_outcome",
      }),
    ];
    const result = evaluateReferralQuality(referrals);
    expect(result.overallScore).toBeLessThan(5);
  });

  it("DSL review with no cases reviewed produces low score", () => {
    const reviews = [makeDSLReview({ openCasesReviewed: 0, openCasesTotal: 5, supervisionOfConcerns: false, multiAgencyAttendance: false, trainingDelivered: false, policyReviewCompleted: false })];
    const result = evaluateDSLOversight(reviews);
    expect(result.caseReviewRate).toBe(0);
    expect(result.overallScore).toBeLessThan(5);
  });
});
