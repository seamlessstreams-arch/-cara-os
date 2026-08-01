import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateSexualHealthEducation,
} from "./sexual-health-education-service";
import type { SexualHealthEducationRow } from "./sexual-health-education-service";

// -- Factory Function ---------------------------------------------------------

function makeRow(overrides: Partial<SexualHealthEducationRow> = {}): SexualHealthEducationRow {
  return {
    id: "she-1",
    home_id: "home-1",
    child_name: "Alex",
    session_date: "2026-05-01",
    facilitator_name: "staff-1",
    session_type: "RSE Lesson",
    age_appropriate: true,
    gillick_competent: null,
    consent_given: true,
    confidentiality_explained: true,
    safeguarding_concerns: false,
    concern_details: null,
    referral_made: false,
    referral_service: null,
    school_aware: true,
    social_worker_informed: true,
    young_person_engaged: true,
    resources_provided: true,
    follow_up_required: false,
    follow_up_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.engagement_rate).toBeNull();;
    expect(m.consent_rate).toBeNull();;
    expect(m.confidentiality_rate).toBeNull();;
    expect(m.clinical_session_count).toBe(0);
    expect(m.education_session_count).toBe(0);
    expect(m.identity_session_count).toBe(0);
  });

  it("counts session type categories correctly", () => {
    const rows = [
      makeRow({ id: "r1", session_type: "Clinic Appointment" }),
      makeRow({ id: "r2", session_type: "RSE Lesson" }),
      makeRow({ id: "r3", session_type: "Gender Identity Support" }),
      makeRow({ id: "r4", session_type: "Consent Education" }),
    ];
    const m = computeMetrics(rows);
    expect(m.clinical_session_count).toBe(1);
    expect(m.education_session_count).toBe(2); // RSE Lesson + Consent Education
    expect(m.identity_session_count).toBe(1);
  });

  it("computes engagement and consent rates correctly", () => {
    const rows = [
      makeRow({ id: "r1", young_person_engaged: true, consent_given: true }),
      makeRow({ id: "r2", young_person_engaged: false, consent_given: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.engagement_rate).toBe(50);
    expect(m.consent_rate).toBe(50);
  });

  it("counts unique children (case-insensitive)", () => {
    const rows = [
      makeRow({ id: "r1", child_name: "Alex" }),
      makeRow({ id: "r2", child_name: "alex" }),
      makeRow({ id: "r3", child_name: "Ben" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_children).toBe(2);
  });

  it("computes all boolean rates for populated data", () => {
    const rows = [makeRow()];
    const m = computeMetrics(rows);
    expect(m.engagement_rate).toBe(100);
    expect(m.consent_rate).toBe(100);
    expect(m.confidentiality_rate).toBe(100);
    expect(m.age_appropriate_rate).toBe(100);
    expect(m.resources_rate).toBe(100);
    expect(m.school_aware_rate).toBe(100);
    expect(m.social_worker_informed_rate).toBe(100);
  });

  it("builds by_session_type breakdown", () => {
    const rows = [
      makeRow({ id: "r1", session_type: "RSE Lesson" }),
      makeRow({ id: "r2", session_type: "RSE Lesson" }),
      makeRow({ id: "r3", session_type: "CSE Awareness" }),
    ];
    const m = computeMetrics(rows);
    expect(m.by_session_type["RSE Lesson"]).toBe(2);
    expect(m.by_session_type["CSE Awareness"]).toBe(1);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts", () => {
  it("returns empty array for empty rows", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("flags safeguarding concern without SW notification as critical", () => {
    const rows = [makeRow({ safeguarding_concerns: true, concern_details: "Concern", social_worker_informed: false })];
    const alerts = computeAlerts(rows);
    const sw = alerts.filter((a) => a.type === "safeguarding_sw_not_informed");
    expect(sw).toHaveLength(1);
    expect(sw[0].severity).toBe("critical");
  });

  it("flags clinical session without consent as critical", () => {
    const rows = [makeRow({ session_type: "Clinic Appointment", consent_given: false })];
    const alerts = computeAlerts(rows);
    const noConsent = alerts.filter((a) => a.type === "clinical_no_consent");
    expect(noConsent).toHaveLength(1);
    expect(noConsent[0].severity).toBe("critical");
  });

  it("flags confidentiality not explained as critical", () => {
    const rows = [makeRow({ confidentiality_explained: false })];
    const alerts = computeAlerts(rows);
    const noConf = alerts.filter((a) => a.type === "confidentiality_not_explained");
    expect(noConf).toHaveLength(1);
    expect(noConf[0].severity).toBe("critical");
  });

  it("flags not age-appropriate session as high", () => {
    const rows = [makeRow({ age_appropriate: false })];
    const alerts = computeAlerts(rows);
    const notAge = alerts.filter((a) => a.type === "not_age_appropriate");
    expect(notAge).toHaveLength(1);
    expect(notAge[0].severity).toBe("high");
  });

  it("flags disengaged safeguarding-sensitive session as high", () => {
    const rows = [makeRow({ session_type: "CSE Awareness", young_person_engaged: false })];
    const alerts = computeAlerts(rows);
    const disengaged = alerts.filter((a) => a.type === "disengaged_safeguarding_session");
    expect(disengaged).toHaveLength(1);
    expect(disengaged[0].severity).toBe("high");
  });

  it("flags safeguarding concern without referral as high", () => {
    const rows = [makeRow({ safeguarding_concerns: true, concern_details: "Concern", referral_made: false })];
    const alerts = computeAlerts(rows);
    const noRef = alerts.filter((a) => a.type === "safeguarding_no_referral");
    expect(noRef).toHaveLength(1);
    expect(noRef[0].severity).toBe("high");
  });

  it("flags 3+ CSE awareness sessions for same child as high", () => {
    const rows = [
      makeRow({ id: "r1", session_type: "CSE Awareness", child_name: "Alex" }),
      makeRow({ id: "r2", session_type: "CSE Awareness", child_name: "Alex" }),
      makeRow({ id: "r3", session_type: "CSE Awareness", child_name: "Alex" }),
    ];
    const alerts = computeAlerts(rows);
    const cse = alerts.filter((a) => a.type === "repeated_cse_sessions");
    expect(cse).toHaveLength(1);
    expect(cse[0].severity).toBe("high");
  });

  it("flags overdue follow-up as high", () => {
    const rows = [makeRow({ follow_up_required: true, follow_up_date: "2020-01-01" })];
    const alerts = computeAlerts(rows);
    const overdue = alerts.filter((a) => a.type === "overdue_follow_up");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].severity).toBe("high");
  });

  it("flags low engagement rate across 5+ sessions as medium", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeRow({ id: `r-${i}`, young_person_engaged: false }),
    );
    const alerts = computeAlerts(rows);
    const lowEng = alerts.filter((a) => a.type === "low_engagement_rate");
    expect(lowEng).toHaveLength(1);
    expect(lowEng[0].severity).toBe("medium");
  });

  it("flags low resource rate across 5+ sessions as medium", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeRow({ id: `r-${i}`, resources_provided: false }),
    );
    const alerts = computeAlerts(rows);
    const lowRes = alerts.filter((a) => a.type === "low_resource_rate");
    expect(lowRes).toHaveLength(1);
    expect(lowRes[0].severity).toBe("medium");
  });
});

// -- validateSexualHealthEducation --------------------------------------------

describe("validateSexualHealthEducation", () => {
  it("passes with valid complete input", () => {
    const r = validateSexualHealthEducation({
      childName: "Alex",
      sessionDate: "2026-05-01",
      facilitatorName: "staff-1",
      sessionType: "RSE Lesson",
      consentGiven: true,
      confidentialityExplained: true,
    });
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("fails when required fields are missing", () => {
    const r = validateSexualHealthEducation({});
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("Child name"))).toBe(true);
    expect(r.errors.some((e) => e.includes("Session date"))).toBe(true);
    expect(r.errors.some((e) => e.includes("Facilitator name"))).toBe(true);
  });

  it("requires concern details when safeguarding concerns are flagged", () => {
    const r = validateSexualHealthEducation({
      childName: "Alex",
      sessionDate: "2026-05-01",
      facilitatorName: "staff-1",
      sessionType: "RSE Lesson",
      safeguardingConcerns: true,
      concernDetails: "",
      consentGiven: true,
      confidentialityExplained: true,
    });
    expect(r.errors.some((e) => e.includes("Concern details"))).toBe(true);
  });

  it("requires referral service when referral is made", () => {
    const r = validateSexualHealthEducation({
      childName: "Alex",
      sessionDate: "2026-05-01",
      facilitatorName: "staff-1",
      sessionType: "RSE Lesson",
      referralMade: true,
      referralService: "",
      consentGiven: true,
      confidentialityExplained: true,
    });
    expect(r.errors.some((e) => e.includes("Referral service"))).toBe(true);
  });

  it("flags clinical session without consent", () => {
    const r = validateSexualHealthEducation({
      childName: "Alex",
      sessionDate: "2026-05-01",
      facilitatorName: "staff-1",
      sessionType: "Clinic Appointment",
      consentGiven: false,
      confidentialityExplained: true,
    });
    expect(r.errors.some((e) => e.includes("consent"))).toBe(true);
  });

  it("flags confidentiality not explained", () => {
    const r = validateSexualHealthEducation({
      childName: "Alex",
      sessionDate: "2026-05-01",
      facilitatorName: "staff-1",
      sessionType: "RSE Lesson",
      consentGiven: true,
      confidentialityExplained: false,
    });
    expect(r.errors.some((e) => e.includes("Confidentiality"))).toBe(true);
  });

  it("requires follow-up date when follow-up required", () => {
    const r = validateSexualHealthEducation({
      childName: "Alex",
      sessionDate: "2026-05-01",
      facilitatorName: "staff-1",
      sessionType: "RSE Lesson",
      consentGiven: true,
      confidentialityExplained: true,
      followUpRequired: true,
      followUpDate: undefined,
    });
    expect(r.errors.some((e) => e.includes("Follow-up date"))).toBe(true);
  });

  it("rejects future session date", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const r = validateSexualHealthEducation({
      childName: "Alex",
      sessionDate: future.toISOString().slice(0, 10),
      facilitatorName: "staff-1",
      sessionType: "RSE Lesson",
      consentGiven: true,
      confidentialityExplained: true,
    });
    expect(r.errors.some((e) => e.includes("future"))).toBe(true);
  });
});
