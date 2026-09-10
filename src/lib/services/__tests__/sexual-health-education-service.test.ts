import { describe, expect, it } from "vitest";
import {
  computeAlerts,
  type SexualHealthEducationRow,
} from "../sexual-health-education-service";

function makeRow(
  overrides: Partial<SexualHealthEducationRow> = {},
): SexualHealthEducationRow {
  return {
    id: "r-1",
    home_id: "home_oak",
    child_name: "Jamie",
    session_date: "2026-05-04",
    facilitator_name: "Alex Morgan",
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
    resources_provided: false,
    follow_up_required: false,
    follow_up_date: null,
    notes: null,
    created_at: "2026-05-04T10:00:00Z",
    updated_at: "2026-05-04T10:00:00Z",
    ...overrides,
  };
}

describe("tri-state judgements", () => {
  it("splits the clinical-consent critical between recorded no-consent and unrecorded", () => {
    const nullAlert = computeAlerts([
      makeRow({ session_type: "Clinic Appointment", consent_given: null }),
    ]).find((a) => a.type === "clinical_no_consent");
    const falseAlert = computeAlerts([
      makeRow({ session_type: "Clinic Appointment", consent_given: false }),
    ]).find((a) => a.type === "clinical_no_consent");
    expect(nullAlert).toBeTruthy();
    expect(falseAlert).toBeTruthy();
    expect(nullAlert!.message).not.toBe(falseAlert!.message);
  });

  it("raises no consent critical when consent is recorded", () => {
    const alerts = computeAlerts([
      makeRow({ session_type: "Clinic Appointment", consent_given: true }),
    ]);
    expect(alerts.some((a) => a.type === "clinical_no_consent")).toBe(false);
  });

  it("splits the confidentiality alert between recorded not-explained and unrecorded", () => {
    const nullAlert = computeAlerts([makeRow({ confidentiality_explained: null })])
      .find((a) => a.type === "confidentiality_not_explained");
    const falseAlert = computeAlerts([makeRow({ confidentiality_explained: false })])
      .find((a) => a.type === "confidentiality_not_explained");
    expect(nullAlert).toBeTruthy();
    expect(falseAlert).toBeTruthy();
    expect(nullAlert!.message).not.toBe(falseAlert!.message);
  });
});
