// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Social Media & Digital Footprint Intelligence Engine
//
// Demo: Chamberlain House, 3 children (Alex 14, Jordan 13, Morgan 15),
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateConsentManagement,
  evaluateDigitalIncidentResponse,
  evaluateDigitalPolicy,
  evaluateStaffDigitalReadiness,
  buildChildDigitalProfiles,
  generateSocialMediaDigitalFootprintIntelligence,
  getRating,
  getConsentTypeLabel,
  getConsentStatusLabel,
  getRiskCategoryLabel,
  getSeverityLabel,
  getRatingLabel,
} from "../social-media-digital-footprint-engine";
import type {
  ImageConsentRecord,
  DigitalSafetyIncident,
  DigitalSafetyPolicy,
  StaffDigitalTraining,
} from "../social-media-digital-footprint-engine";

// ── Test Fixtures ────────────────────────────────────────────────────────

const makeConsent = (overrides: Partial<ImageConsentRecord> = {}): ImageConsentRecord => ({
  id: "consent-001",
  childId: "child-alex",
  childName: "Alex",
  consentType: "photo",
  consentStatus: "granted",
  reviewDate: new Date().toISOString().slice(0, 10),
  parentCarerConsulted: true,
  childConsulted: true,
  expiryDate: "2027-01-01",
  ...overrides,
});

const makeIncident = (overrides: Partial<DigitalSafetyIncident> = {}): DigitalSafetyIncident => ({
  id: "inc-001",
  childId: "child-alex",
  childName: "Alex",
  incidentDate: "2026-03-15",
  riskCategory: "cyberbullying",
  severity: "medium",
  reportedTimely: true,
  actionTaken: true,
  lessonLearned: true,
  preventionMeasures: true,
  ...overrides,
});

const makePolicy = (overrides: Partial<DigitalSafetyPolicy> = {}): DigitalSafetyPolicy => ({
  id: "policy-001",
  policyReviewDate: "2026-03-01",
  policyCurrent: true,
  imageConsentProcess: true,
  socialMediaGuidance: true,
  digitalFootprintProtection: true,
  cyberbullyingProtocol: true,
  dataProtectionCompliant: true,
  staffSocialMediaPolicy: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffDigitalTraining> = {}): StaffDigitalTraining => ({
  id: "train-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  digitalSafeguarding: true,
  imageConsentProcess: true,
  socialMediaRisks: true,
  cyberbullyingResponse: true,
  dataProtection: true,
  onlineGroomingAwareness: true,
  ...overrides,
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. evaluateConsentManagement
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateConsentManagement", () => {
  it("returns score 0 for empty consents", () => {
    const result = evaluateConsentManagement([]);
    expect(result.score).toBe(0);
    expect(result.totalConsents).toBe(0);
  });

  it("returns zero rates for empty consents", () => {
    const result = evaluateConsentManagement([]);
    expect(result.activeDecisionRate).toBe(0);
    expect(result.childConsultedRate).toBe(0);
    expect(result.parentConsultedRate).toBe(0);
    expect(result.reviewCurrentRate).toBe(0);
  });

  it("adds concern about no consent records when empty", () => {
    const result = evaluateConsentManagement([]);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("No image consent records");
  });

  it("returns empty strengths for empty consents", () => {
    const result = evaluateConsentManagement([]);
    expect(result.strengths).toHaveLength(0);
  });

  it("scores up to 25 for perfect consent management", () => {
    const consents = [
      makeConsent({ id: "c1", childId: "child-alex", consentStatus: "granted" }),
      makeConsent({ id: "c2", childId: "child-jordan", childName: "Jordan", consentStatus: "refused" }),
      makeConsent({ id: "c3", childId: "child-morgan", childName: "Morgan", consentStatus: "granted" }),
    ];
    const result = evaluateConsentManagement(consents);
    expect(result.score).toBe(25);
  });

  it("counts active decisions correctly (granted + refused)", () => {
    const consents = [
      makeConsent({ id: "c1", consentStatus: "granted" }),
      makeConsent({ id: "c2", consentStatus: "refused" }),
      makeConsent({ id: "c3", consentStatus: "pending" }),
    ];
    const result = evaluateConsentManagement(consents);
    expect(result.activeDecisionCount).toBe(2);
    expect(result.activeDecisionRate).toBe(67);
  });

  it("counts child consulted rate", () => {
    const consents = [
      makeConsent({ id: "c1", childConsulted: true }),
      makeConsent({ id: "c2", childConsulted: false }),
      makeConsent({ id: "c3", childConsulted: true }),
    ];
    const result = evaluateConsentManagement(consents);
    expect(result.childConsultedCount).toBe(2);
    expect(result.childConsultedRate).toBe(67);
  });

  it("counts parent consulted rate", () => {
    const consents = [
      makeConsent({ id: "c1", parentCarerConsulted: true }),
      makeConsent({ id: "c2", parentCarerConsulted: false }),
    ];
    const result = evaluateConsentManagement(consents);
    expect(result.parentConsultedCount).toBe(1);
    expect(result.parentConsultedRate).toBe(50);
  });

  it("populates status breakdown correctly", () => {
    const consents = [
      makeConsent({ id: "c1", consentStatus: "granted" }),
      makeConsent({ id: "c2", consentStatus: "granted" }),
      makeConsent({ id: "c3", consentStatus: "refused" }),
      makeConsent({ id: "c4", consentStatus: "pending" }),
    ];
    const result = evaluateConsentManagement(consents);
    expect(result.statusBreakdown.granted).toBe(2);
    expect(result.statusBreakdown.refused).toBe(1);
    expect(result.statusBreakdown.pending).toBe(1);
    expect(result.statusBreakdown.withdrawn).toBe(0);
    expect(result.statusBreakdown.not_requested).toBe(0);
  });

  it("populates type breakdown correctly", () => {
    const consents = [
      makeConsent({ id: "c1", consentType: "photo" }),
      makeConsent({ id: "c2", consentType: "video" }),
      makeConsent({ id: "c3", consentType: "social_media" }),
    ];
    const result = evaluateConsentManagement(consents);
    expect(result.typeBreakdown.photo).toBe(1);
    expect(result.typeBreakdown.video).toBe(1);
    expect(result.typeBreakdown.social_media).toBe(1);
  });

  it("generates strength for high active decision rate", () => {
    const consents = [
      makeConsent({ id: "c1", consentStatus: "granted" }),
      makeConsent({ id: "c2", consentStatus: "refused" }),
    ];
    const result = evaluateConsentManagement(consents);
    expect(result.strengths.some((s) => s.includes("consent decision rate"))).toBe(true);
  });

  it("generates concern for low active decision rate", () => {
    const consents = [
      makeConsent({ id: "c1", consentStatus: "pending" }),
      makeConsent({ id: "c2", consentStatus: "not_requested" }),
      makeConsent({ id: "c3", consentStatus: "granted" }),
    ];
    const result = evaluateConsentManagement(consents);
    expect(result.concerns.some((c) => c.includes("active decision"))).toBe(true);
  });

  it("generates concern when not_requested consents exist", () => {
    const consents = [
      makeConsent({ id: "c1", consentStatus: "not_requested" }),
    ];
    const result = evaluateConsentManagement(consents);
    expect(result.concerns.some((c) => c.includes("not yet requested"))).toBe(true);
  });

  it("caps score at 25", () => {
    const consents = Array.from({ length: 20 }, (_, i) =>
      makeConsent({ id: `c${i}`, consentStatus: "granted" }),
    );
    const result = evaluateConsentManagement(consents);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const consents = [
      makeConsent({ id: "c1", consentStatus: "not_requested", childConsulted: false, parentCarerConsulted: false, reviewDate: "2020-01-01" }),
    ];
    const result = evaluateConsentManagement(consents);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("handles review currency check for old review dates", () => {
    const consents = [
      makeConsent({ id: "c1", reviewDate: "2020-01-01" }),
    ];
    const result = evaluateConsentManagement(consents);
    expect(result.reviewCurrentCount).toBe(0);
    expect(result.reviewCurrentRate).toBe(0);
  });

  it("handles review currency check for recent review dates", () => {
    const today = new Date().toISOString().slice(0, 10);
    const consents = [
      makeConsent({ id: "c1", reviewDate: today }),
    ];
    const result = evaluateConsentManagement(consents);
    expect(result.reviewCurrentCount).toBe(1);
    expect(result.reviewCurrentRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluateDigitalIncidentResponse
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDigitalIncidentResponse", () => {
  it("returns score 25 for empty incidents (no incidents = excellent)", () => {
    const result = evaluateDigitalIncidentResponse([]);
    expect(result.score).toBe(25);
    expect(result.totalIncidents).toBe(0);
  });

  it("returns strength message for no incidents", () => {
    const result = evaluateDigitalIncidentResponse([]);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths[0]).toContain("No digital safety incidents");
  });

  it("returns no concerns for empty incidents", () => {
    const result = evaluateDigitalIncidentResponse([]);
    expect(result.concerns).toHaveLength(0);
  });

  it("scores 25 for perfectly handled incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", reportedTimely: true, actionTaken: true, lessonLearned: true, preventionMeasures: true }),
    ];
    const result = evaluateDigitalIncidentResponse(incidents);
    expect(result.score).toBe(25);
  });

  it("scores 0 for poorly handled incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", reportedTimely: false, actionTaken: false, lessonLearned: false, preventionMeasures: false }),
    ];
    const result = evaluateDigitalIncidentResponse(incidents);
    expect(result.score).toBe(0);
  });

  it("counts timely reporting correctly", () => {
    const incidents = [
      makeIncident({ id: "i1", reportedTimely: true }),
      makeIncident({ id: "i2", reportedTimely: false }),
      makeIncident({ id: "i3", reportedTimely: true }),
    ];
    const result = evaluateDigitalIncidentResponse(incidents);
    expect(result.timelyReportingCount).toBe(2);
    expect(result.timelyReportingRate).toBe(67);
  });

  it("counts action taken correctly", () => {
    const incidents = [
      makeIncident({ id: "i1", actionTaken: true }),
      makeIncident({ id: "i2", actionTaken: false }),
    ];
    const result = evaluateDigitalIncidentResponse(incidents);
    expect(result.actionTakenCount).toBe(1);
    expect(result.actionTakenRate).toBe(50);
  });

  it("counts lessons learned correctly", () => {
    const incidents = [
      makeIncident({ id: "i1", lessonLearned: true }),
      makeIncident({ id: "i2", lessonLearned: true }),
      makeIncident({ id: "i3", lessonLearned: false }),
    ];
    const result = evaluateDigitalIncidentResponse(incidents);
    expect(result.lessonLearnedCount).toBe(2);
    expect(result.lessonLearnedRate).toBe(67);
  });

  it("counts prevention measures correctly", () => {
    const incidents = [
      makeIncident({ id: "i1", preventionMeasures: true }),
      makeIncident({ id: "i2", preventionMeasures: false }),
    ];
    const result = evaluateDigitalIncidentResponse(incidents);
    expect(result.preventionMeasuresCount).toBe(1);
    expect(result.preventionMeasuresRate).toBe(50);
  });

  it("populates severity breakdown", () => {
    const incidents = [
      makeIncident({ id: "i1", severity: "low" }),
      makeIncident({ id: "i2", severity: "high" }),
      makeIncident({ id: "i3", severity: "critical" }),
    ];
    const result = evaluateDigitalIncidentResponse(incidents);
    expect(result.severityBreakdown.low).toBe(1);
    expect(result.severityBreakdown.medium).toBe(0);
    expect(result.severityBreakdown.high).toBe(1);
    expect(result.severityBreakdown.critical).toBe(1);
  });

  it("populates category breakdown", () => {
    const incidents = [
      makeIncident({ id: "i1", riskCategory: "cyberbullying" }),
      makeIncident({ id: "i2", riskCategory: "grooming" }),
      makeIncident({ id: "i3", riskCategory: "identity_exposure" }),
    ];
    const result = evaluateDigitalIncidentResponse(incidents);
    expect(result.categoryBreakdown.cyberbullying).toBe(1);
    expect(result.categoryBreakdown.grooming).toBe(1);
    expect(result.categoryBreakdown.identity_exposure).toBe(1);
  });

  it("generates concern for critical incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", severity: "critical" }),
    ];
    const result = evaluateDigitalIncidentResponse(incidents);
    expect(result.concerns.some((c) => c.includes("critical digital safety incident"))).toBe(true);
  });

  it("generates concern for grooming incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", riskCategory: "grooming" }),
    ];
    const result = evaluateDigitalIncidentResponse(incidents);
    expect(result.concerns.some((c) => c.includes("grooming"))).toBe(true);
  });

  it("generates strength for high timely reporting", () => {
    const incidents = [
      makeIncident({ id: "i1", reportedTimely: true }),
    ];
    const result = evaluateDigitalIncidentResponse(incidents);
    expect(result.strengths.some((s) => s.includes("timely reporting"))).toBe(true);
  });

  it("generates concern for low timely reporting", () => {
    const incidents = [
      makeIncident({ id: "i1", reportedTimely: false }),
      makeIncident({ id: "i2", reportedTimely: false }),
      makeIncident({ id: "i3", reportedTimely: true }),
    ];
    const result = evaluateDigitalIncidentResponse(incidents);
    expect(result.concerns.some((c) => c.includes("reporting"))).toBe(true);
  });

  it("caps score at 25", () => {
    const incidents = [makeIncident()];
    const result = evaluateDigitalIncidentResponse(incidents);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const incidents = [
      makeIncident({ reportedTimely: false, actionTaken: false, lessonLearned: false, preventionMeasures: false }),
    ];
    const result = evaluateDigitalIncidentResponse(incidents);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluateDigitalPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDigitalPolicy", () => {
  it("returns score 0 for empty policies", () => {
    const result = evaluateDigitalPolicy([]);
    expect(result.score).toBe(0);
    expect(result.totalPolicies).toBe(0);
  });

  it("returns concern for no policies", () => {
    const result = evaluateDigitalPolicy([]);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("No digital safety policies");
  });

  it("returns all booleans false for empty policies", () => {
    const result = evaluateDigitalPolicy([]);
    expect(result.policyCurrent).toBe(false);
    expect(result.imageConsentProcess).toBe(false);
    expect(result.socialMediaGuidance).toBe(false);
    expect(result.digitalFootprintProtection).toBe(false);
    expect(result.cyberbullyingProtocol).toBe(false);
    expect(result.dataProtectionCompliant).toBe(false);
    expect(result.staffSocialMediaPolicy).toBe(false);
  });

  it("scores 25 for fully compliant policy", () => {
    const result = evaluateDigitalPolicy([makePolicy()]);
    expect(result.score).toBe(25);
  });

  it("scores policyCurrent as 5 points", () => {
    const result = evaluateDigitalPolicy([makePolicy({
      policyCurrent: true,
      imageConsentProcess: false,
      socialMediaGuidance: false,
      digitalFootprintProtection: false,
      cyberbullyingProtocol: false,
      dataProtectionCompliant: false,
      staffSocialMediaPolicy: false,
    })]);
    expect(result.score).toBe(5);
  });

  it("scores imageConsentProcess as 4 points", () => {
    const result = evaluateDigitalPolicy([makePolicy({
      policyCurrent: false,
      imageConsentProcess: true,
      socialMediaGuidance: false,
      digitalFootprintProtection: false,
      cyberbullyingProtocol: false,
      dataProtectionCompliant: false,
      staffSocialMediaPolicy: false,
    })]);
    expect(result.score).toBe(4);
  });

  it("scores socialMediaGuidance as 4 points", () => {
    const result = evaluateDigitalPolicy([makePolicy({
      policyCurrent: false,
      imageConsentProcess: false,
      socialMediaGuidance: true,
      digitalFootprintProtection: false,
      cyberbullyingProtocol: false,
      dataProtectionCompliant: false,
      staffSocialMediaPolicy: false,
    })]);
    expect(result.score).toBe(4);
  });

  it("scores digitalFootprintProtection as 4 points", () => {
    const result = evaluateDigitalPolicy([makePolicy({
      policyCurrent: false,
      imageConsentProcess: false,
      socialMediaGuidance: false,
      digitalFootprintProtection: true,
      cyberbullyingProtocol: false,
      dataProtectionCompliant: false,
      staffSocialMediaPolicy: false,
    })]);
    expect(result.score).toBe(4);
  });

  it("scores cyberbullyingProtocol as 3 points", () => {
    const result = evaluateDigitalPolicy([makePolicy({
      policyCurrent: false,
      imageConsentProcess: false,
      socialMediaGuidance: false,
      digitalFootprintProtection: false,
      cyberbullyingProtocol: true,
      dataProtectionCompliant: false,
      staffSocialMediaPolicy: false,
    })]);
    expect(result.score).toBe(3);
  });

  it("scores dataProtectionCompliant as 3 points", () => {
    const result = evaluateDigitalPolicy([makePolicy({
      policyCurrent: false,
      imageConsentProcess: false,
      socialMediaGuidance: false,
      digitalFootprintProtection: false,
      cyberbullyingProtocol: false,
      dataProtectionCompliant: true,
      staffSocialMediaPolicy: false,
    })]);
    expect(result.score).toBe(3);
  });

  it("scores staffSocialMediaPolicy as 2 points", () => {
    const result = evaluateDigitalPolicy([makePolicy({
      policyCurrent: false,
      imageConsentProcess: false,
      socialMediaGuidance: false,
      digitalFootprintProtection: false,
      cyberbullyingProtocol: false,
      dataProtectionCompliant: false,
      staffSocialMediaPolicy: true,
    })]);
    expect(result.score).toBe(2);
  });

  it("generates strengths for all true policy fields", () => {
    const result = evaluateDigitalPolicy([makePolicy()]);
    expect(result.strengths.length).toBe(7);
  });

  it("generates concerns for all false policy fields", () => {
    const result = evaluateDigitalPolicy([makePolicy({
      policyCurrent: false,
      imageConsentProcess: false,
      socialMediaGuidance: false,
      digitalFootprintProtection: false,
      cyberbullyingProtocol: false,
      dataProtectionCompliant: false,
      staffSocialMediaPolicy: false,
    })]);
    expect(result.concerns.length).toBe(7);
  });

  it("uses the most recently reviewed policy when multiple provided", () => {
    const policies = [
      makePolicy({ id: "p1", policyReviewDate: "2025-01-01", policyCurrent: false, imageConsentProcess: false, socialMediaGuidance: false, digitalFootprintProtection: false, cyberbullyingProtocol: false, dataProtectionCompliant: false, staffSocialMediaPolicy: false }),
      makePolicy({ id: "p2", policyReviewDate: "2026-06-01", policyCurrent: true, imageConsentProcess: true, socialMediaGuidance: true, digitalFootprintProtection: true, cyberbullyingProtocol: true, dataProtectionCompliant: true, staffSocialMediaPolicy: true }),
    ];
    const result = evaluateDigitalPolicy(policies);
    expect(result.score).toBe(25);
    expect(result.policyCurrent).toBe(true);
  });

  it("caps score at 25", () => {
    const result = evaluateDigitalPolicy([makePolicy()]);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("policy score sums to exactly 5+4+4+4+3+3+2=25", () => {
    const result = evaluateDigitalPolicy([makePolicy()]);
    expect(result.score).toBe(5 + 4 + 4 + 4 + 3 + 3 + 2);
  });

  it("generates concern for non-current policy", () => {
    const result = evaluateDigitalPolicy([makePolicy({ policyCurrent: false })]);
    expect(result.concerns.some((c) => c.includes("not current"))).toBe(true);
  });

  it("generates concern for missing consent process", () => {
    const result = evaluateDigitalPolicy([makePolicy({ imageConsentProcess: false })]);
    expect(result.concerns.some((c) => c.includes("consent process"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateStaffDigitalReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffDigitalReadiness", () => {
  it("returns score 0 for empty training", () => {
    const result = evaluateStaffDigitalReadiness([]);
    expect(result.score).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("returns concern for no training records", () => {
    const result = evaluateStaffDigitalReadiness([]);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("No staff digital training records");
  });

  it("returns empty strengths for empty training", () => {
    const result = evaluateStaffDigitalReadiness([]);
    expect(result.strengths).toHaveLength(0);
  });

  it("scores 25 for fully trained staff", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2", staffName: "Tom Richards" }),
    ];
    const result = evaluateStaffDigitalReadiness(training);
    expect(result.score).toBe(25);
  });

  it("scores 0 for completely untrained staff", () => {
    const training = [
      makeTraining({
        id: "t1",
        digitalSafeguarding: false,
        imageConsentProcess: false,
        socialMediaRisks: false,
        cyberbullyingResponse: false,
        dataProtection: false,
        onlineGroomingAwareness: false,
      }),
    ];
    const result = evaluateStaffDigitalReadiness(training);
    expect(result.score).toBe(0);
  });

  it("counts digital safeguarding training correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", digitalSafeguarding: true }),
      makeTraining({ id: "t2", staffId: "s2", digitalSafeguarding: false }),
    ];
    const result = evaluateStaffDigitalReadiness(training);
    expect(result.digitalSafeguardingCount).toBe(1);
    expect(result.digitalSafeguardingRate).toBe(50);
  });

  it("counts image consent process training correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", imageConsentProcess: true }),
      makeTraining({ id: "t2", staffId: "s2", imageConsentProcess: true }),
      makeTraining({ id: "t3", staffId: "s3", imageConsentProcess: false }),
    ];
    const result = evaluateStaffDigitalReadiness(training);
    expect(result.imageConsentProcessCount).toBe(2);
    expect(result.imageConsentProcessRate).toBe(67);
  });

  it("counts overall trained (all 6 competencies)", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }), // all true
      makeTraining({ id: "t2", staffId: "s2", onlineGroomingAwareness: false }), // 5/6
    ];
    const result = evaluateStaffDigitalReadiness(training);
    expect(result.overallTrainedCount).toBe(1);
    expect(result.overallTrainedRate).toBe(50);
  });

  it("generates strength for high digital safeguarding rate", () => {
    const training = [makeTraining()];
    const result = evaluateStaffDigitalReadiness(training);
    expect(result.strengths.some((s) => s.includes("digital safeguarding training"))).toBe(true);
  });

  it("generates concern for low digital safeguarding rate", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", digitalSafeguarding: false }),
      makeTraining({ id: "t2", staffId: "s2", digitalSafeguarding: false }),
      makeTraining({ id: "t3", staffId: "s3", digitalSafeguarding: true }),
    ];
    const result = evaluateStaffDigitalReadiness(training);
    expect(result.concerns.some((c) => c.includes("Digital safeguarding training"))).toBe(true);
  });

  it("generates strength for 100% overall trained", () => {
    const training = [makeTraining({ id: "t1", staffId: "s1" })];
    const result = evaluateStaffDigitalReadiness(training);
    expect(result.strengths.some((s) => s.includes("100% of staff fully trained"))).toBe(true);
  });

  it("generates concern for low overall trained rate", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", dataProtection: false }),
      makeTraining({ id: "t2", staffId: "s2", dataProtection: false }),
      makeTraining({ id: "t3", staffId: "s3", dataProtection: false }),
    ];
    const result = evaluateStaffDigitalReadiness(training);
    expect(result.concerns.some((c) => c.includes("complete digital training"))).toBe(true);
  });

  it("caps score at 25", () => {
    const training = [makeTraining()];
    const result = evaluateStaffDigitalReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const training = [
      makeTraining({
        digitalSafeguarding: false, imageConsentProcess: false,
        socialMediaRisks: false, cyberbullyingResponse: false,
        dataProtection: false, onlineGroomingAwareness: false,
      }),
    ];
    const result = evaluateStaffDigitalReadiness(training);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("scores partial training proportionally", () => {
    // 1 of 2 staff trained in each area => 50% rates
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({
        id: "t2", staffId: "s2",
        digitalSafeguarding: false, imageConsentProcess: false,
        socialMediaRisks: false, cyberbullyingResponse: false,
        dataProtection: false, onlineGroomingAwareness: false,
      }),
    ];
    const result = evaluateStaffDigitalReadiness(training);
    // 50% of 6+5+4+4+3+3 = 50% of 25 = 12.5
    expect(result.score).toBe(12.5);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. buildChildDigitalProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildDigitalProfiles", () => {
  it("returns empty array for no consents and no incidents", () => {
    const result = buildChildDigitalProfiles([], []);
    expect(result).toHaveLength(0);
  });

  it("creates profiles from consents only", () => {
    const consents = [
      makeConsent({ childId: "child-alex", childName: "Alex" }),
      makeConsent({ id: "c2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = buildChildDigitalProfiles(consents, []);
    expect(result).toHaveLength(2);
  });

  it("creates profiles from incidents only", () => {
    const incidents = [
      makeIncident({ childId: "child-alex", childName: "Alex" }),
    ];
    const result = buildChildDigitalProfiles([], incidents);
    expect(result).toHaveLength(1);
  });

  it("merges children from consents and incidents", () => {
    const consents = [
      makeConsent({ childId: "child-alex", childName: "Alex" }),
    ];
    const incidents = [
      makeIncident({ childId: "child-alex", childName: "Alex" }),
      makeIncident({ id: "i2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = buildChildDigitalProfiles(consents, incidents);
    expect(result).toHaveLength(2);
  });

  it("counts consents correctly per child", () => {
    const consents = [
      makeConsent({ id: "c1", childId: "child-alex", consentStatus: "granted" }),
      makeConsent({ id: "c2", childId: "child-alex", consentType: "video", consentStatus: "refused" }),
      makeConsent({ id: "c3", childId: "child-alex", consentType: "social_media", consentStatus: "pending" }),
    ];
    const result = buildChildDigitalProfiles(consents, []);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex).toBeDefined();
    expect(alex!.totalConsents).toBe(3);
    expect(alex!.activeConsents).toBe(1);
    expect(alex!.refusedConsents).toBe(1);
    expect(alex!.pendingConsents).toBe(1);
  });

  it("counts incidents correctly per child", () => {
    const incidents = [
      makeIncident({ id: "i1", childId: "child-alex", severity: "low" }),
      makeIncident({ id: "i2", childId: "child-alex", severity: "high" }),
      makeIncident({ id: "i3", childId: "child-alex", severity: "critical" }),
    ];
    const result = buildChildDigitalProfiles([], incidents);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.totalIncidents).toBe(3);
    expect(alex!.highCriticalIncidents).toBe(2);
  });

  it("calculates digital safety score correctly for child with no issues", () => {
    const consents = [
      makeConsent({ childId: "child-alex", childConsulted: true, consentStatus: "granted" }),
    ];
    const result = buildChildDigitalProfiles(consents, []);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.digitalSafetyScore).toBe(10);
  });

  it("deducts score for incidents", () => {
    const consents = [makeConsent({ childId: "child-alex", childConsulted: true })];
    const incidents = [
      makeIncident({ id: "i1", childId: "child-alex", severity: "low" }),
      makeIncident({ id: "i2", childId: "child-alex", severity: "low" }),
    ];
    const result = buildChildDigitalProfiles(consents, incidents);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.digitalSafetyScore).toBe(8); // 10 - 2 (incidents)
  });

  it("deducts score for high/critical incidents", () => {
    const consents = [makeConsent({ childId: "child-alex", childConsulted: true })];
    const incidents = [
      makeIncident({ id: "i1", childId: "child-alex", severity: "critical" }),
    ];
    const result = buildChildDigitalProfiles(consents, incidents);
    const alex = result.find((p) => p.childId === "child-alex");
    // 10 - 1 (1 incident) - 2 (1 high/critical * 2) = 7
    expect(alex!.digitalSafetyScore).toBe(7);
  });

  it("deducts score for child not consulted", () => {
    const consents = [
      makeConsent({ childId: "child-alex", childConsulted: false, consentStatus: "granted" }),
    ];
    const result = buildChildDigitalProfiles(consents, []);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.digitalSafetyScore).toBe(9); // 10 - 1 (not consulted)
  });

  it("deducts score for pending consents", () => {
    const consents = [
      makeConsent({ childId: "child-alex", childConsulted: true, consentStatus: "pending" }),
    ];
    const result = buildChildDigitalProfiles(consents, []);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.digitalSafetyScore).toBe(9); // 10 - 1 (pending)
  });

  it("deducts score for no consents at all", () => {
    const incidents = [
      makeIncident({ childId: "child-alex", severity: "low" }),
    ];
    const result = buildChildDigitalProfiles([], incidents);
    const alex = result.find((p) => p.childId === "child-alex");
    // 10 - 1 (1 incident) - 2 (no consents) = 7
    expect(alex!.digitalSafetyScore).toBe(7);
  });

  it("clamps digital safety score to 0 minimum", () => {
    const incidents = [
      makeIncident({ id: "i1", childId: "child-alex", severity: "critical" }),
      makeIncident({ id: "i2", childId: "child-alex", severity: "critical" }),
      makeIncident({ id: "i3", childId: "child-alex", severity: "critical" }),
      makeIncident({ id: "i4", childId: "child-alex", severity: "high" }),
    ];
    const result = buildChildDigitalProfiles([], incidents);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.digitalSafetyScore).toBeGreaterThanOrEqual(0);
  });

  it("clamps digital safety score to 10 maximum", () => {
    const consents = [makeConsent({ childId: "child-alex", childConsulted: true })];
    const result = buildChildDigitalProfiles(consents, []);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.digitalSafetyScore).toBeLessThanOrEqual(10);
  });

  it("sets childConsulted to true if any consent was consulted", () => {
    const consents = [
      makeConsent({ id: "c1", childId: "child-alex", childConsulted: false }),
      makeConsent({ id: "c2", childId: "child-alex", childConsulted: true }),
    ];
    const result = buildChildDigitalProfiles(consents, []);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.childConsulted).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. generateSocialMediaDigitalFootprintIntelligence (orchestrator)
// ══════════════════════════════════════════════════════════════════════════════

describe("generateSocialMediaDigitalFootprintIntelligence", () => {
  const defaultConsents = [
    makeConsent({ id: "c1", childId: "child-alex", childName: "Alex" }),
    makeConsent({ id: "c2", childId: "child-jordan", childName: "Jordan" }),
    makeConsent({ id: "c3", childId: "child-morgan", childName: "Morgan" }),
  ];

  const defaultIncidents: DigitalSafetyIncident[] = [];

  const defaultPolicies = [makePolicy()];

  const defaultTraining = [
    makeTraining({ id: "t1", staffId: "s1", staffName: "Sarah Johnson" }),
    makeTraining({ id: "t2", staffId: "s2", staffName: "Tom Richards" }),
    makeTraining({ id: "t3", staffId: "s3", staffName: "Lisa Williams" }),
    makeTraining({ id: "t4", staffId: "s4", staffName: "Darren Laville" }),
  ];

  it("returns valid intelligence object with all fields", () => {
    const result = generateSocialMediaDigitalFootprintIntelligence(
      defaultConsents, defaultIncidents, defaultPolicies, defaultTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
    expect(result.assessedAt).toBeDefined();
    expect(result.overallScore).toBeDefined();
    expect(result.rating).toBeDefined();
    expect(result.consentManagement).toBeDefined();
    expect(result.digitalIncidentResponse).toBeDefined();
    expect(result.digitalPolicy).toBeDefined();
    expect(result.staffDigitalReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("overall score is sum of 4 evaluators", () => {
    const result = generateSocialMediaDigitalFootprintIntelligence(
      defaultConsents, defaultIncidents, defaultPolicies, defaultTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    const expectedSum = Math.round(
      result.consentManagement.score +
      result.digitalIncidentResponse.score +
      result.digitalPolicy.score +
      result.staffDigitalReadiness.score,
    );
    expect(result.overallScore).toBe(expectedSum);
  });

  it("overall score caps at 100", () => {
    const result = generateSocialMediaDigitalFootprintIntelligence(
      defaultConsents, defaultIncidents, defaultPolicies, defaultTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overall score is at least 0", () => {
    const result = generateSocialMediaDigitalFootprintIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("rating matches score thresholds", () => {
    const result = generateSocialMediaDigitalFootprintIntelligence(
      defaultConsents, defaultIncidents, defaultPolicies, defaultTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBe(getRating(result.overallScore));
  });

  it("filters incidents by period", () => {
    const incidents = [
      makeIncident({ id: "i1", incidentDate: "2026-03-15" }),
      makeIncident({ id: "i2", incidentDate: "2025-12-01" }),  // outside period
    ];
    const result = generateSocialMediaDigitalFootprintIntelligence(
      [], incidents, [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    // Only 1 incident should be counted (within period)
    expect(result.digitalIncidentResponse.totalIncidents).toBe(1);
  });

  it("includes regulatory links", () => {
    const result = generateSocialMediaDigitalFootprintIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.regulatoryLinks.some((l) => l.includes("Data Protection Act 2018"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("KCSIE 2024"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 16"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Online Safety Act 2023"))).toBe(true);
  });

  it("builds child profiles in orchestrator", () => {
    const result = generateSocialMediaDigitalFootprintIntelligence(
      defaultConsents, defaultIncidents, defaultPolicies, defaultTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.childProfiles).toHaveLength(3);
  });

  it("generates actions when there are concerns", () => {
    const result = generateSocialMediaDigitalFootprintIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("generates no-action message when everything is good", () => {
    const result = generateSocialMediaDigitalFootprintIntelligence(
      defaultConsents, defaultIncidents, defaultPolicies, defaultTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    // With perfect data and no incidents, should get no-action message
    expect(result.actions.some((a) => a.includes("No immediate actions required"))).toBe(true);
  });

  it("generates URGENT actions for critical incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", incidentDate: "2026-03-15", severity: "critical" }),
    ];
    const result = generateSocialMediaDigitalFootprintIntelligence(
      defaultConsents, incidents, defaultPolicies, defaultTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates URGENT actions for grooming incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", incidentDate: "2026-03-15", riskCategory: "grooming" }),
    ];
    const result = generateSocialMediaDigitalFootprintIntelligence(
      defaultConsents, incidents, defaultPolicies, defaultTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("grooming"))).toBe(true);
  });

  it("includes overall rating in strengths when score >= 60", () => {
    const result = generateSocialMediaDigitalFootprintIntelligence(
      defaultConsents, defaultIncidents, defaultPolicies, defaultTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    if (result.overallScore >= 60) {
      expect(result.strengths.some((s) => s.includes("digital footprint protection rated"))).toBe(true);
    }
  });

  it("includes overall rating in areas for improvement when score < 40", () => {
    const result = generateSocialMediaDigitalFootprintIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    if (result.overallScore < 40) {
      expect(result.areasForImprovement.some((a) => a.includes("Inadequate"))).toBe(true);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Label functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getConsentTypeLabel", () => {
  it("returns Photo for photo", () => {
    expect(getConsentTypeLabel("photo")).toBe("Photo");
  });
  it("returns Video for video", () => {
    expect(getConsentTypeLabel("video")).toBe("Video");
  });
  it("returns Social Media for social_media", () => {
    expect(getConsentTypeLabel("social_media")).toBe("Social Media");
  });
  it("returns Website for website", () => {
    expect(getConsentTypeLabel("website")).toBe("Website");
  });
  it("returns Newsletter for newsletter", () => {
    expect(getConsentTypeLabel("newsletter")).toBe("Newsletter");
  });
  it("returns Press for press", () => {
    expect(getConsentTypeLabel("press")).toBe("Press");
  });
  it("returns Other for other", () => {
    expect(getConsentTypeLabel("other")).toBe("Other");
  });
});

describe("getConsentStatusLabel", () => {
  it("returns Granted for granted", () => {
    expect(getConsentStatusLabel("granted")).toBe("Granted");
  });
  it("returns Refused for refused", () => {
    expect(getConsentStatusLabel("refused")).toBe("Refused");
  });
  it("returns Withdrawn for withdrawn", () => {
    expect(getConsentStatusLabel("withdrawn")).toBe("Withdrawn");
  });
  it("returns Not Requested for not_requested", () => {
    expect(getConsentStatusLabel("not_requested")).toBe("Not Requested");
  });
  it("returns Pending for pending", () => {
    expect(getConsentStatusLabel("pending")).toBe("Pending");
  });
});

describe("getRiskCategoryLabel", () => {
  it("returns Identity Exposure for identity_exposure", () => {
    expect(getRiskCategoryLabel("identity_exposure")).toBe("Identity Exposure");
  });
  it("returns Location Disclosure for location_disclosure", () => {
    expect(getRiskCategoryLabel("location_disclosure")).toBe("Location Disclosure");
  });
  it("returns Cyberbullying for cyberbullying", () => {
    expect(getRiskCategoryLabel("cyberbullying")).toBe("Cyberbullying");
  });
  it("returns Grooming for grooming", () => {
    expect(getRiskCategoryLabel("grooming")).toBe("Grooming");
  });
  it("returns Inappropriate Content for inappropriate_content", () => {
    expect(getRiskCategoryLabel("inappropriate_content")).toBe("Inappropriate Content");
  });
  it("returns Data Breach for data_breach", () => {
    expect(getRiskCategoryLabel("data_breach")).toBe("Data Breach");
  });
  it("returns Other for other", () => {
    expect(getRiskCategoryLabel("other")).toBe("Other");
  });
});

describe("getSeverityLabel", () => {
  it("returns Low for low", () => {
    expect(getSeverityLabel("low")).toBe("Low");
  });
  it("returns Medium for medium", () => {
    expect(getSeverityLabel("medium")).toBe("Medium");
  });
  it("returns High for high", () => {
    expect(getSeverityLabel("high")).toBe("High");
  });
  it("returns Critical for critical", () => {
    expect(getSeverityLabel("critical")).toBe("Critical");
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
