import { describe, it, expect } from "vitest";
import { buildCandidateProfileFromText, CV_PROFILE_DISCLAIMER } from "../cv-profile-engine";

const GOOD_CV = `Amara Osei
amara.osei@email.com
07712 345678

I have 5 years of experience working in children's residential care. I hold an NVQ Level 3 in Health and Social Care and have completed First Aid and Team Teach training. My work involves safeguarding, key working, and risk assessment. I have worked with looked after children since 2019 and have always prioritised therapeutic care relationships.

Work History
May 2021 – Present — Oak House Care, Residential Care Worker
June 2019 – April 2021 — Maple Lodge Children's Home, Support Worker`;

const SPARSE_CV = `Looking for work. Good with kids.`;

const NO_NAME_CV = `amara.osei@email.com
07712 345678
5 years experience in care. NVQ Level 3.`;

describe("buildCandidateProfileFromText", () => {
  it("extracts name, email, phone from a well-structured CV", () => {
    const result = buildCandidateProfileFromText(GOOD_CV);
    expect(result.first_name).toBe("Amara");
    expect(result.last_name).toBe("Osei");
    expect(result.email).toBe("amara.osei@email.com");
    expect(result.phone).toBeTruthy();
  });

  it("detects years of experience", () => {
    const result = buildCandidateProfileFromText(GOOD_CV);
    expect(result.years_experience).toBe(5);
  });

  it("identifies NVQ Level 3 qualification", () => {
    const result = buildCandidateProfileFromText(GOOD_CV);
    expect(result.qualifications_noted.some(q => q.includes("NVQ"))).toBe(true);
  });

  it("sets residential_care_experience = true for care home CV", () => {
    const result = buildCandidateProfileFromText(GOOD_CV);
    expect(result.residential_care_experience).toBe(true);
  });

  it("sets safeguarding_experience = true when safeguarding mentioned", () => {
    const result = buildCandidateProfileFromText(GOOD_CV);
    expect(result.safeguarding_experience).toBe(true);
  });

  it("extracts work history notes when date ranges present", () => {
    const result = buildCandidateProfileFromText(GOOD_CV);
    expect(result.work_history_notes).toMatch(/date range/i);
  });

  it("returns high quality score for well-structured CV", () => {
    const result = buildCandidateProfileFromText(GOOD_CV);
    expect(result.quality_score).toBeGreaterThanOrEqual(60);
    expect(["complete", "mostly_complete"]).toContain(result.quality_band);
  });

  it("returns sparse band for minimal CV", () => {
    const result = buildCandidateProfileFromText(SPARSE_CV);
    expect(result.quality_band).toBe("sparse");
    expect(result.quality_score).toBeLessThan(40);
  });

  it("lists missing fields when name/email/phone absent", () => {
    const result = buildCandidateProfileFromText(SPARSE_CV);
    expect(result.missing_fields.length).toBeGreaterThan(2);
  });

  it("uses supplied target role", () => {
    const result = buildCandidateProfileFromText(GOOD_CV, "Team Leader");
    expect(result.role_applied).toBe("Team Leader");
  });

  it("attaches disclaimer to all results", () => {
    const result = buildCandidateProfileFromText(GOOD_CV);
    expect(result.disclaimer).toBe(CV_PROFILE_DISCLAIMER);
  });

  it("handles CV with no name gracefully", () => {
    const result = buildCandidateProfileFromText(NO_NAME_CV);
    expect(result.email).toBeTruthy();
    expect(result.missing_fields).toContain("Full name");
  });

  it("detects First Aid and Team Teach qualifications", () => {
    const result = buildCandidateProfileFromText(GOOD_CV);
    const allQuals = result.qualifications_noted.join(" ");
    expect(allQuals).toMatch(/First Aid|Team Teach/);
  });
});
