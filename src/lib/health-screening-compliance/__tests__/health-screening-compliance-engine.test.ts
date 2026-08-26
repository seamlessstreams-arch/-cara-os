import { describe, it, expect } from "vitest";
import {
  getRating,
  getScreeningTypeLabel,
  getScreeningStatusLabel,
  getScreeningOutcomeLabel,
  getGPRegistrationStatusLabel,
  getConsentStatusLabel,
  getRatingLabel,
  evaluateScreeningCompliance,
  evaluateGPAccess,
  evaluateHealthPlanning,
  evaluateStaffHealthReadiness,
  buildChildHealthProfiles,
  generateHealthScreeningComplianceIntelligence,
} from "../health-screening-compliance-engine";
import type {
  HealthScreeningRecord,
  GPRegistration,
  HealthActionPlan,
  HealthTraining,
} from "../health-screening-compliance-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });
  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });
  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });
  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ── Label Functions ────────────────────────────────────────────────────────

describe("getScreeningTypeLabel", () => {
  it.each([
    ["dental_check", "Dental Check"],
    ["optical_check", "Optical Check"],
    ["hearing_test", "Hearing Test"],
    ["immunisation", "Immunisation"],
    ["developmental_check", "Developmental Check"],
    ["annual_health_assessment", "Annual Health Assessment"],
    ["initial_health_assessment", "Initial Health Assessment"],
    ["review_health_assessment", "Review Health Assessment"],
    ["mental_health_screening", "Mental Health Screening"],
    ["sexual_health", "Sexual Health"],
  ] as const)("returns correct label for %s", (val, label) => {
    expect(getScreeningTypeLabel(val)).toBe(label);
  });
});

describe("getScreeningStatusLabel", () => {
  it.each([
    ["completed_on_time", "Completed On Time"],
    ["completed_late", "Completed Late"],
    ["overdue", "Overdue"],
    ["scheduled", "Scheduled"],
    ["declined", "Declined"],
    ["not_applicable", "Not Applicable"],
  ] as const)("returns correct label for %s", (val, label) => {
    expect(getScreeningStatusLabel(val)).toBe(label);
  });
});

describe("getScreeningOutcomeLabel", () => {
  it.each([
    ["no_concerns", "No Concerns"],
    ["minor_concerns", "Minor Concerns"],
    ["referral_made", "Referral Made"],
    ["treatment_required", "Treatment Required"],
    ["follow_up_needed", "Follow-Up Needed"],
    ["awaiting_results", "Awaiting Results"],
  ] as const)("returns correct label for %s", (val, label) => {
    expect(getScreeningOutcomeLabel(val)).toBe(label);
  });
});

describe("getGPRegistrationStatusLabel", () => {
  it.each([
    ["registered", "Registered"],
    ["pending_registration", "Pending Registration"],
    ["not_registered", "Not Registered"],
    ["transferring", "Transferring"],
  ] as const)("returns correct label for %s", (val, label) => {
    expect(getGPRegistrationStatusLabel(val)).toBe(label);
  });
});

describe("getConsentStatusLabel", () => {
  it.each([
    ["consent_given", "Consent Given"],
    ["consent_refused", "Consent Refused"],
    ["gillick_competent", "Gillick Competent"],
    ["awaiting_consent", "Awaiting Consent"],
    ["delegated_authority", "Delegated Authority"],
  ] as const)("returns correct label for %s", (val, label) => {
    expect(getConsentStatusLabel(val)).toBe(label);
  });
});

describe("getRatingLabel", () => {
  it.each([
    ["outstanding", "Outstanding"],
    ["good", "Good"],
    ["requires_improvement", "Requires Improvement"],
    ["inadequate", "Inadequate"],
  ] as const)("returns correct label for %s", (val, label) => {
    expect(getRatingLabel(val)).toBe(label);
  });
});

// ── Evaluators ─────────────────────────────────────────────────────────────

describe("evaluateScreeningCompliance", () => {
  it("returns 0 score for empty data", () => {
    const result = evaluateScreeningCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalScreenings).toBe(0);
    expect(result.onTimeRate).toBeNull();
    expect(result.overdueCount).toBe(0);
  });

  it("scores well for all on-time, documented screenings", () => {
    const screenings: HealthScreeningRecord[] = [
      { id: "s1", childId: "c1", childName: "Alex", screeningType: "dental_check", status: "completed_on_time", scheduledDate: "2026-03-01", completedDate: "2026-03-01", outcome: "no_concerns", provider: "NHS Dental", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
      { id: "s2", childId: "c1", childName: "Alex", screeningType: "optical_check", status: "completed_on_time", scheduledDate: "2026-03-15", completedDate: "2026-03-15", outcome: "no_concerns", provider: "Specsavers", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
      { id: "s3", childId: "c1", childName: "Alex", screeningType: "annual_health_assessment", status: "completed_on_time", scheduledDate: "2026-02-01", completedDate: "2026-02-01", outcome: "no_concerns", provider: "LAC Nurse", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
    ];
    const result = evaluateScreeningCompliance(screenings);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.onTimeRate).toBe(100);
    expect(result.documentedRate).toBe(100);
    expect(result.overdueCount).toBe(0);
  });

  it("penalises overdue screenings", () => {
    const screenings: HealthScreeningRecord[] = [
      { id: "s1", childId: "c1", childName: "Alex", screeningType: "dental_check", status: "overdue", scheduledDate: "2026-01-01", completedDate: null, outcome: null, provider: null, consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: false },
      { id: "s2", childId: "c1", childName: "Alex", screeningType: "optical_check", status: "overdue", scheduledDate: "2026-01-15", completedDate: null, outcome: null, provider: null, consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: false },
      { id: "s3", childId: "c2", childName: "Jordan", screeningType: "immunisation", status: "overdue", scheduledDate: "2026-02-01", completedDate: null, outcome: null, provider: null, consentStatus: "awaiting_consent", referralMade: false, referralFollowedUp: null, documentedInCareFile: false },
    ];
    const result = evaluateScreeningCompliance(screenings);
    expect(result.overdueCount).toBe(3);
    expect(result.overallScore).toBeLessThan(10);
  });

  it("tracks referral follow-up rate", () => {
    const screenings: HealthScreeningRecord[] = [
      { id: "s1", childId: "c1", childName: "Alex", screeningType: "mental_health_screening", status: "completed_on_time", scheduledDate: "2026-03-01", completedDate: "2026-03-01", outcome: "referral_made", provider: "CAMHS", consentStatus: "consent_given", referralMade: true, referralFollowedUp: true, documentedInCareFile: true },
      { id: "s2", childId: "c2", childName: "Jordan", screeningType: "dental_check", status: "completed_on_time", scheduledDate: "2026-03-05", completedDate: "2026-03-05", outcome: "treatment_required", provider: "NHS", consentStatus: "consent_given", referralMade: true, referralFollowedUp: false, documentedInCareFile: true },
    ];
    const result = evaluateScreeningCompliance(screenings);
    expect(result.referralFollowUpRate).toBe(50);
  });

  it("tracks type distribution correctly", () => {
    const screenings: HealthScreeningRecord[] = [
      { id: "s1", childId: "c1", childName: "Alex", screeningType: "dental_check", status: "completed_on_time", scheduledDate: "2026-03-01", completedDate: "2026-03-01", outcome: "no_concerns", provider: "NHS", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
      { id: "s2", childId: "c2", childName: "Jordan", screeningType: "dental_check", status: "completed_on_time", scheduledDate: "2026-03-01", completedDate: "2026-03-01", outcome: "no_concerns", provider: "NHS", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
    ];
    const result = evaluateScreeningCompliance(screenings);
    expect(result.typeDistribution.dental_check).toBe(2);
    expect(result.typeDistribution.optical_check).toBe(0);
  });

  it("counts declined screenings", () => {
    const screenings: HealthScreeningRecord[] = [
      { id: "s1", childId: "c1", childName: "Alex", screeningType: "sexual_health", status: "declined", scheduledDate: "2026-03-01", completedDate: null, outcome: null, provider: null, consentStatus: "consent_refused", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
    ];
    const result = evaluateScreeningCompliance(screenings);
    expect(result.declinedCount).toBe(1);
  });

  it("caps score at 25", () => {
    // Many perfect screenings
    const screenings: HealthScreeningRecord[] = Array.from({ length: 20 }, (_, i): HealthScreeningRecord => ({
      id: `s${i}`, childId: "c1", childName: "Alex", screeningType: "dental_check",
      status: "completed_on_time", scheduledDate: "2026-03-01", completedDate: "2026-03-01",
      outcome: "no_concerns", provider: "NHS", consentStatus: "consent_given",
      referralMade: false, referralFollowedUp: null, documentedInCareFile: true,
    }));
    const result = evaluateScreeningCompliance(screenings);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

describe("evaluateGPAccess", () => {
  it("returns 0 score for empty data", () => {
    const result = evaluateGPAccess([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalChildren).toBe(0);
    expect(result.registeredRate).toBeNull();
  });

  it("scores well for all registered with nurse and passport", () => {
    const registrations: GPRegistration[] = [
      { id: "g1", childId: "c1", childName: "Alex", gpRegistrationStatus: "registered", gpPractice: "Oak Surgery", registeredDate: "2026-01-01", lastAppointment: "2026-03-01", namedNurse: true, healthPassportUpToDate: true },
      { id: "g2", childId: "c2", childName: "Jordan", gpRegistrationStatus: "registered", gpPractice: "Oak Surgery", registeredDate: "2026-01-01", lastAppointment: "2026-02-15", namedNurse: true, healthPassportUpToDate: true },
    ];
    const result = evaluateGPAccess(registrations);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.registeredRate).toBe(100);
    expect(result.namedNurseRate).toBe(100);
    expect(result.healthPassportRate).toBe(100);
  });

  it("penalises not registered children", () => {
    const registrations: GPRegistration[] = [
      { id: "g1", childId: "c1", childName: "Alex", gpRegistrationStatus: "not_registered", gpPractice: null, registeredDate: null, lastAppointment: null, namedNurse: false, healthPassportUpToDate: false },
    ];
    const result = evaluateGPAccess(registrations);
    expect(result.notRegisteredCount).toBe(1);
    expect(result.registeredRate).toBe(0);
    expect(result.overallScore).toBeLessThan(10);
  });

  it("tracks pending registrations", () => {
    const registrations: GPRegistration[] = [
      { id: "g1", childId: "c1", childName: "Alex", gpRegistrationStatus: "registered", gpPractice: "Oak Surgery", registeredDate: "2026-01-01", lastAppointment: "2026-03-01", namedNurse: true, healthPassportUpToDate: true },
      { id: "g2", childId: "c2", childName: "Jordan", gpRegistrationStatus: "pending_registration", gpPractice: null, registeredDate: null, lastAppointment: null, namedNurse: false, healthPassportUpToDate: false },
    ];
    const result = evaluateGPAccess(registrations);
    expect(result.pendingRegistrations).toBe(1);
    expect(result.registeredRate).toBe(50);
  });

  it("caps score at 25", () => {
    const registrations: GPRegistration[] = Array.from({ length: 10 }, (_, i): GPRegistration => ({
      id: `g${i}`, childId: `c${i}`, childName: `Child ${i}`,
      gpRegistrationStatus: "registered", gpPractice: "Surgery", registeredDate: "2026-01-01",
      lastAppointment: "2026-03-01", namedNurse: true, healthPassportUpToDate: true,
    }));
    const result = evaluateGPAccess(registrations);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

describe("evaluateHealthPlanning", () => {
  it("returns 0 score for empty data", () => {
    const result = evaluateHealthPlanning([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalPlans).toBe(0);
    expect(result.averageSDQScore).toBeNull();
  });

  it("scores well for comprehensive plans", () => {
    const plans: HealthActionPlan[] = [
      { id: "p1", childId: "c1", childName: "Alex", planDate: "2026-01-15", reviewDate: "2026-04-15", healthNeedsIdentified: 3, healthNeedsAddressed: 3, childContributed: true, socialWorkerInformed: true, carerInformed: true, SDQCompleted: true, SDQScore: 10 },
      { id: "p2", childId: "c2", childName: "Jordan", planDate: "2026-02-01", reviewDate: "2026-05-01", healthNeedsIdentified: 2, healthNeedsAddressed: 2, childContributed: true, socialWorkerInformed: true, carerInformed: true, SDQCompleted: true, SDQScore: 15 },
    ];
    const result = evaluateHealthPlanning(plans);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.needsAddressedRate).toBe(100);
    expect(result.childContributionRate).toBe(100);
    expect(result.sdqCompletionRate).toBe(100);
  });

  it("handles partial plan data", () => {
    const plans: HealthActionPlan[] = [
      { id: "p1", childId: "c1", childName: "Alex", planDate: "2026-01-15", reviewDate: null, healthNeedsIdentified: 4, healthNeedsAddressed: 2, childContributed: false, socialWorkerInformed: false, carerInformed: true, SDQCompleted: false, SDQScore: null },
    ];
    const result = evaluateHealthPlanning(plans);
    expect(result.needsAddressedRate).toBe(50);
    expect(result.childContributionRate).toBe(0);
    expect(result.reviewRate).toBe(0);
    expect(result.sdqCompletionRate).toBe(0);
  });

  it("calculates average SDQ score", () => {
    const plans: HealthActionPlan[] = [
      { id: "p1", childId: "c1", childName: "Alex", planDate: "2026-01-15", reviewDate: "2026-04-15", healthNeedsIdentified: 2, healthNeedsAddressed: 2, childContributed: true, socialWorkerInformed: true, carerInformed: true, SDQCompleted: true, SDQScore: 10 },
      { id: "p2", childId: "c2", childName: "Jordan", planDate: "2026-02-01", reviewDate: "2026-05-01", healthNeedsIdentified: 2, healthNeedsAddressed: 2, childContributed: true, socialWorkerInformed: true, carerInformed: true, SDQCompleted: true, SDQScore: 20 },
    ];
    const result = evaluateHealthPlanning(plans);
    expect(result.averageSDQScore).toBe(15);
  });

  it("returns null SDQ average when no scores", () => {
    const plans: HealthActionPlan[] = [
      { id: "p1", childId: "c1", childName: "Alex", planDate: "2026-01-15", reviewDate: null, healthNeedsIdentified: 1, healthNeedsAddressed: 1, childContributed: true, socialWorkerInformed: true, carerInformed: true, SDQCompleted: false, SDQScore: null },
    ];
    const result = evaluateHealthPlanning(plans);
    expect(result.averageSDQScore).toBeNull();
  });

  it("caps score at 25", () => {
    const plans: HealthActionPlan[] = Array.from({ length: 10 }, (_, i): HealthActionPlan => ({
      id: `p${i}`, childId: `c${i}`, childName: `Child ${i}`,
      planDate: "2026-01-01", reviewDate: "2026-04-01",
      healthNeedsIdentified: 3, healthNeedsAddressed: 3,
      childContributed: true, socialWorkerInformed: true, carerInformed: true,
      SDQCompleted: true, SDQScore: 8,
    }));
    const result = evaluateHealthPlanning(plans);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

describe("evaluateStaffHealthReadiness", () => {
  it("returns 0 score for empty data", () => {
    const result = evaluateStaffHealthReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.firstAidRate).toBeNull();
  });

  it("scores well for fully trained staff", () => {
    const training: HealthTraining[] = [
      { id: "t1", staffId: "s1", staffName: "Sarah", firstAidCurrent: true, medicationTrained: true, mentalHealthFirstAid: true, epilepsyTrained: true, allergyAwareness: true, healthPromotionTrained: true },
      { id: "t2", staffId: "s2", staffName: "Tom", firstAidCurrent: true, medicationTrained: true, mentalHealthFirstAid: true, epilepsyTrained: true, allergyAwareness: true, healthPromotionTrained: true },
    ];
    const result = evaluateStaffHealthReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.firstAidRate).toBe(100);
    expect(result.medicationTrainedRate).toBe(100);
    expect(result.mentalHealthRate).toBe(100);
  });

  it("handles partially trained staff", () => {
    const training: HealthTraining[] = [
      { id: "t1", staffId: "s1", staffName: "Sarah", firstAidCurrent: true, medicationTrained: true, mentalHealthFirstAid: false, epilepsyTrained: false, allergyAwareness: true, healthPromotionTrained: false },
      { id: "t2", staffId: "s2", staffName: "Tom", firstAidCurrent: false, medicationTrained: false, mentalHealthFirstAid: false, epilepsyTrained: false, allergyAwareness: false, healthPromotionTrained: false },
    ];
    const result = evaluateStaffHealthReadiness(training);
    expect(result.firstAidRate).toBe(50);
    expect(result.medicationTrainedRate).toBe(50);
    expect(result.mentalHealthRate).toBe(0);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(20);
  });

  it("returns zero rates for untrained staff", () => {
    const training: HealthTraining[] = [
      { id: "t1", staffId: "s1", staffName: "Sarah", firstAidCurrent: false, medicationTrained: false, mentalHealthFirstAid: false, epilepsyTrained: false, allergyAwareness: false, healthPromotionTrained: false },
    ];
    const result = evaluateStaffHealthReadiness(training);
    expect(result.firstAidRate).toBe(0);
    expect(result.medicationTrainedRate).toBe(0);
    expect(result.overallScore).toBe(0);
  });
});

// ── Child Profiles ─────────────────────────────────────────────────────────

describe("buildChildHealthProfiles", () => {
  it("returns empty array for no data", () => {
    expect(buildChildHealthProfiles([], [], [])).toEqual([]);
  });

  it("builds profile from mixed data sources", () => {
    const screenings: HealthScreeningRecord[] = [
      { id: "s1", childId: "c1", childName: "Alex", screeningType: "dental_check", status: "completed_on_time", scheduledDate: "2026-03-01", completedDate: "2026-03-01", outcome: "no_concerns", provider: "NHS", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
      { id: "s2", childId: "c1", childName: "Alex", screeningType: "optical_check", status: "overdue", scheduledDate: "2026-02-01", completedDate: null, outcome: null, provider: null, consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: false },
    ];
    const registrations: GPRegistration[] = [
      { id: "g1", childId: "c1", childName: "Alex", gpRegistrationStatus: "registered", gpPractice: "Oak Surgery", registeredDate: "2026-01-01", lastAppointment: "2026-03-01", namedNurse: true, healthPassportUpToDate: true },
    ];
    const plans: HealthActionPlan[] = [
      { id: "p1", childId: "c1", childName: "Alex", planDate: "2026-02-01", reviewDate: "2026-05-01", healthNeedsIdentified: 3, healthNeedsAddressed: 2, childContributed: true, socialWorkerInformed: true, carerInformed: true, SDQCompleted: true, SDQScore: 10 },
    ];

    const profiles = buildChildHealthProfiles(screenings, registrations, plans);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].gpRegistered).toBe(true);
    expect(profiles[0].screeningsCompleted).toBe(1);
    expect(profiles[0].screeningsOverdue).toBe(1);
    expect(profiles[0].hasHealthPassport).toBe(true);
    expect(profiles[0].latestSDQScore).toBe(10);
    expect(profiles[0].overallScore).toBeGreaterThan(0);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("handles child appearing only in registrations", () => {
    const registrations: GPRegistration[] = [
      { id: "g1", childId: "c1", childName: "Alex", gpRegistrationStatus: "registered", gpPractice: "Surgery", registeredDate: "2026-01-01", lastAppointment: null, namedNurse: false, healthPassportUpToDate: false },
    ];
    const profiles = buildChildHealthProfiles([], registrations, []);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].gpRegistered).toBe(true);
    expect(profiles[0].screeningsCompleted).toBe(0);
  });

  it("handles child appearing only in plans", () => {
    const plans: HealthActionPlan[] = [
      { id: "p1", childId: "c1", childName: "Alex", planDate: "2026-02-01", reviewDate: null, healthNeedsIdentified: 2, healthNeedsAddressed: 1, childContributed: true, socialWorkerInformed: true, carerInformed: true, SDQCompleted: false, SDQScore: null },
    ];
    const profiles = buildChildHealthProfiles([], [], plans);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].gpRegistered).toBe(false);
    expect(profiles[0].hasHealthPassport).toBe(false);
    expect(profiles[0].healthNeedsAddressedRate).toBe(50);
  });

  it("produces profiles for multiple children", () => {
    const screenings: HealthScreeningRecord[] = [
      { id: "s1", childId: "c1", childName: "Alex", screeningType: "dental_check", status: "completed_on_time", scheduledDate: "2026-03-01", completedDate: "2026-03-01", outcome: "no_concerns", provider: "NHS", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
      { id: "s2", childId: "c2", childName: "Jordan", screeningType: "dental_check", status: "overdue", scheduledDate: "2026-02-01", completedDate: null, outcome: null, provider: null, consentStatus: "awaiting_consent", referralMade: false, referralFollowedUp: null, documentedInCareFile: false },
    ];
    const profiles = buildChildHealthProfiles(screenings, [], []);
    expect(profiles).toHaveLength(2);
    const names = profiles.map((p) => p.childName).sort();
    expect(names).toEqual(["Alex", "Jordan"]);
  });

  it("uses latest SDQ score for child", () => {
    const plans: HealthActionPlan[] = [
      { id: "p1", childId: "c1", childName: "Alex", planDate: "2026-01-01", reviewDate: null, healthNeedsIdentified: 1, healthNeedsAddressed: 1, childContributed: true, socialWorkerInformed: true, carerInformed: true, SDQCompleted: true, SDQScore: 20 },
      { id: "p2", childId: "c1", childName: "Alex", planDate: "2026-04-01", reviewDate: null, healthNeedsIdentified: 1, healthNeedsAddressed: 1, childContributed: true, socialWorkerInformed: true, carerInformed: true, SDQCompleted: true, SDQScore: 12 },
    ];
    const profiles = buildChildHealthProfiles([], [], plans);
    expect(profiles[0].latestSDQScore).toBe(12);
  });
});

// ── Main Function ──────────────────────────────────────────────────────────

describe("generateHealthScreeningComplianceIntelligence", () => {
  const perfectScreenings: HealthScreeningRecord[] = [
    { id: "s1", childId: "c1", childName: "Alex", screeningType: "dental_check", status: "completed_on_time", scheduledDate: "2026-03-01", completedDate: "2026-03-01", outcome: "no_concerns", provider: "NHS", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
    { id: "s2", childId: "c1", childName: "Alex", screeningType: "optical_check", status: "completed_on_time", scheduledDate: "2026-03-15", completedDate: "2026-03-15", outcome: "no_concerns", provider: "Specsavers", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
    { id: "s3", childId: "c1", childName: "Alex", screeningType: "annual_health_assessment", status: "completed_on_time", scheduledDate: "2026-02-01", completedDate: "2026-02-01", outcome: "no_concerns", provider: "LAC Nurse", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
    { id: "s4", childId: "c2", childName: "Jordan", screeningType: "dental_check", status: "completed_on_time", scheduledDate: "2026-03-01", completedDate: "2026-03-01", outcome: "minor_concerns", provider: "NHS", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
    { id: "s5", childId: "c2", childName: "Jordan", screeningType: "immunisation", status: "completed_on_time", scheduledDate: "2026-02-15", completedDate: "2026-02-15", outcome: "no_concerns", provider: "GP", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
  ];

  const perfectRegistrations: GPRegistration[] = [
    { id: "g1", childId: "c1", childName: "Alex", gpRegistrationStatus: "registered", gpPractice: "Oak Surgery", registeredDate: "2026-01-01", lastAppointment: "2026-03-01", namedNurse: true, healthPassportUpToDate: true },
    { id: "g2", childId: "c2", childName: "Jordan", gpRegistrationStatus: "registered", gpPractice: "Oak Surgery", registeredDate: "2026-01-01", lastAppointment: "2026-02-15", namedNurse: true, healthPassportUpToDate: true },
  ];

  const perfectPlans: HealthActionPlan[] = [
    { id: "p1", childId: "c1", childName: "Alex", planDate: "2026-01-15", reviewDate: "2026-04-15", healthNeedsIdentified: 3, healthNeedsAddressed: 3, childContributed: true, socialWorkerInformed: true, carerInformed: true, SDQCompleted: true, SDQScore: 8 },
    { id: "p2", childId: "c2", childName: "Jordan", planDate: "2026-02-01", reviewDate: "2026-05-01", healthNeedsIdentified: 2, healthNeedsAddressed: 2, childContributed: true, socialWorkerInformed: true, carerInformed: true, SDQCompleted: true, SDQScore: 12 },
  ];

  const perfectTraining: HealthTraining[] = [
    { id: "t1", staffId: "s1", staffName: "Sarah", firstAidCurrent: true, medicationTrained: true, mentalHealthFirstAid: true, epilepsyTrained: true, allergyAwareness: true, healthPromotionTrained: true },
    { id: "t2", staffId: "s2", staffName: "Tom", firstAidCurrent: true, medicationTrained: true, mentalHealthFirstAid: true, epilepsyTrained: true, allergyAwareness: true, healthPromotionTrained: true },
  ];

  it("returns correct structure", () => {
    const result = generateHealthScreeningComplianceIntelligence(
      perfectScreenings, perfectRegistrations, perfectPlans, perfectTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-18");
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("rating");
    expect(result).toHaveProperty("screeningCompliance");
    expect(result).toHaveProperty("gpAccess");
    expect(result).toHaveProperty("healthPlanning");
    expect(result).toHaveProperty("staffHealthReadiness");
    expect(result).toHaveProperty("childProfiles");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("areasForImprovement");
    expect(result).toHaveProperty("actions");
    expect(result).toHaveProperty("regulatoryLinks");
  });

  it("scores outstanding for perfect data", () => {
    const result = generateHealthScreeningComplianceIntelligence(
      perfectScreenings, perfectRegistrations, perfectPlans, perfectTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("scores inadequate for empty data", () => {
    const result = generateHealthScreeningComplianceIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("caps overall score at 100", () => {
    const result = generateHealthScreeningComplianceIntelligence(
      perfectScreenings, perfectRegistrations, perfectPlans, perfectTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("generates strengths for high-scoring data", () => {
    const result = generateHealthScreeningComplianceIntelligence(
      perfectScreenings, perfectRegistrations, perfectPlans, perfectTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates actions for problem data", () => {
    const badScreenings: HealthScreeningRecord[] = [
      { id: "s1", childId: "c1", childName: "Alex", screeningType: "dental_check", status: "overdue", scheduledDate: "2026-01-01", completedDate: null, outcome: null, provider: null, consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: false },
      { id: "s2", childId: "c1", childName: "Alex", screeningType: "optical_check", status: "overdue", scheduledDate: "2026-01-15", completedDate: null, outcome: null, provider: null, consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: false },
      { id: "s3", childId: "c2", childName: "Jordan", screeningType: "immunisation", status: "overdue", scheduledDate: "2026-02-01", completedDate: null, outcome: null, provider: null, consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: false },
    ];
    const badRegistrations: GPRegistration[] = [
      { id: "g1", childId: "c1", childName: "Alex", gpRegistrationStatus: "not_registered", gpPractice: null, registeredDate: null, lastAppointment: null, namedNurse: false, healthPassportUpToDate: false },
    ];
    const result = generateHealthScreeningComplianceIntelligence(
      badScreenings, badRegistrations, [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.actions.some((a) => a.startsWith("URGENT:"))).toBe(true);
  });

  it("includes regulatory links", () => {
    const result = generateHealthScreeningComplianceIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 10"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 4"))).toBe(true);
  });

  it("generates child profiles", () => {
    const result = generateHealthScreeningComplianceIntelligence(
      perfectScreenings, perfectRegistrations, perfectPlans, perfectTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.childProfiles.length).toBe(2);
    expect(result.childProfiles.every((p) => p.overallScore >= 0 && p.overallScore <= 10)).toBe(true);
  });

  it("generates areas for improvement when data is mixed", () => {
    const mixedRegistrations: GPRegistration[] = [
      { id: "g1", childId: "c1", childName: "Alex", gpRegistrationStatus: "registered", gpPractice: "Surgery", registeredDate: "2026-01-01", lastAppointment: "2026-03-01", namedNurse: true, healthPassportUpToDate: true },
      { id: "g2", childId: "c2", childName: "Jordan", gpRegistrationStatus: "registered", gpPractice: "Surgery", registeredDate: "2026-01-01", lastAppointment: null, namedNurse: false, healthPassportUpToDate: false },
    ];
    const result = generateHealthScreeningComplianceIntelligence(
      perfectScreenings, mixedRegistrations, perfectPlans, perfectTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("handles single child with complete data", () => {
    const screenings: HealthScreeningRecord[] = [
      { id: "s1", childId: "c1", childName: "Alex", screeningType: "dental_check", status: "completed_on_time", scheduledDate: "2026-03-01", completedDate: "2026-03-01", outcome: "no_concerns", provider: "NHS", consentStatus: "consent_given", referralMade: false, referralFollowedUp: null, documentedInCareFile: true },
    ];
    const registrations: GPRegistration[] = [
      { id: "g1", childId: "c1", childName: "Alex", gpRegistrationStatus: "registered", gpPractice: "Surgery", registeredDate: "2026-01-01", lastAppointment: "2026-03-01", namedNurse: true, healthPassportUpToDate: true },
    ];
    const result = generateHealthScreeningComplianceIntelligence(
      screenings, registrations, [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.childProfiles.length).toBe(1);
    expect(result.childProfiles[0].childName).toBe("Alex");
  });
});
