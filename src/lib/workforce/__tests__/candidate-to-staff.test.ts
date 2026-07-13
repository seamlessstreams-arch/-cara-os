import { describe, it, expect } from "vitest";
import {
  roleFromVacancyCode,
  employmentTypeFrom,
  assessAppointment,
  mapCandidateToStaff,
} from "../candidate-to-staff";
import type { CandidateProfile, Vacancy, ConditionalOffer } from "@/types/recruitment";

const NOW = "2026-07-13T09:00:00.000Z";

const candidate = (over: Partial<CandidateProfile> = {}): CandidateProfile => ({
  id: "cand_1",
  home_id: "home_oak",
  vacancy_id: "vac_1",
  first_name: "Aisha",
  last_name: "Khan",
  preferred_name: null,
  email: "aisha@example.com",
  phone: "0700000000",
  dob: "1995-05-01",
  current_address: null,
  source: "indeed",
  current_stage: "appointed",
  compliance_status: "cleared",
  risk_level: "low",
  shortlisted: true,
  appointed: true,
  assigned_manager_id: "staff_darren",
  cv_url: null,
  application_form_url: null,
  cover_letter_url: null,
  adjustments_requested: false,
  adjustments_notes: null,
  notes: null,
  created_at: NOW,
  updated_at: NOW,
  created_by: "staff_darren",
  ...over,
});

const vacancy = (over: Partial<Vacancy> = {}): Vacancy => ({
  id: "vac_1",
  home_id: "home_oak",
  title: "Residential Care Worker",
  role_code: "RCW",
  employment_type: "permanent",
  contract_type: "full_time",
  salary_min: 24000,
  salary_max: 26000,
  hours: 38,
  shift_pattern: null,
  reports_to: null,
  safeguarding_statement: "",
  status: "open",
  approval_status: "approved",
  created_by: "staff_darren",
  approved_by: "staff_darren",
  approved_at: NOW,
  created_at: NOW,
  updated_at: NOW,
  ...over,
});

const offer = (over: Partial<ConditionalOffer> = {}): ConditionalOffer =>
  ({
    id: "offer_1",
    candidate_id: "cand_1",
    status: "final_accepted",
    conditional_offer_sent_at: NOW,
    proposed_start_date: "2026-08-01",
    salary: 25000,
    hours: 38,
    probation_months: 6,
    conditions: [],
    exceptional_start: false,
    exceptional_start_approved_by: null,
    exceptional_start_rationale: null,
    exceptional_start_risk_mitigation: null,
    final_clearance_completed_at: NOW,
    final_clearance_by: "staff_darren",
    created_at: NOW,
    updated_at: NOW,
    ...over,
  }) as ConditionalOffer;

describe("roleFromVacancyCode / employmentTypeFrom", () => {
  it("maps known role codes; unknown → residential_care_worker (no seniority guess)", () => {
    expect(roleFromVacancyCode("RM")).toBe("registered_manager");
    expect(roleFromVacancyCode("tl")).toBe("team_leader");
    expect(roleFromVacancyCode("RCW")).toBe("residential_care_worker");
    expect(roleFromVacancyCode("XYZ")).toBe("residential_care_worker");
    expect(roleFromVacancyCode(null)).toBe("residential_care_worker");
  });
  it("passes through valid employment types; unknown → permanent", () => {
    expect(employmentTypeFrom("bank")).toBe("bank");
    expect(employmentTypeFrom("weird")).toBe("permanent");
  });
});

describe("assessAppointment — safeguarding gate", () => {
  it("appointed + cleared + not already staff → appointable", () => {
    const r = assessAppointment({ candidate: candidate(), existingStaffId: null });
    expect(r.appointable).toBe(true);
    expect(r.blockers).toEqual([]);
  });

  it("blocks when not yet at the appointed stage", () => {
    const r = assessAppointment({ candidate: candidate({ current_stage: "final_clearance" }), existingStaffId: null });
    expect(r.appointable).toBe(false);
    expect(r.blockers.join(" ")).toMatch(/not "appointed"/);
  });

  it("blocks when safer-recruitment compliance is not cleared (Reg 32 checks incomplete)", () => {
    const r = assessAppointment({ candidate: candidate({ compliance_status: "in_progress" }), existingStaffId: null });
    expect(r.appointable).toBe(false);
    expect(r.blockers.join(" ")).toMatch(/not "cleared"/);
  });

  it("blocks a second appointment (idempotency) and names the existing staff record", () => {
    const r = assessAppointment({ candidate: candidate(), existingStaffId: "staff_ap_cand_1" });
    expect(r.appointable).toBe(false);
    expect(r.blockers.join(" ")).toMatch(/Already appointed to staff \(staff_ap_cand_1\)/);
  });

  it("reports every failing condition at once", () => {
    const r = assessAppointment({
      candidate: candidate({ current_stage: "sift", compliance_status: "blocked" }),
      existingStaffId: "staff_x",
    });
    expect(r.blockers).toHaveLength(3);
  });
});

describe("mapCandidateToStaff — honest field mapping", () => {
  it("maps candidate + vacancy + offer + DBS into a staff record", () => {
    const s = mapCandidateToStaff({
      candidate: candidate(),
      vacancy: vacancy(),
      offer: offer(),
      dbsCheck: { certificate_number: "001234567890", verified_at: "2026-06-20", received_at: "2026-06-10" },
      nowIso: NOW,
    });
    expect(s.full_name).toBe("Aisha Khan");
    expect(s.role).toBe("residential_care_worker");
    expect(s.employment_type).toBe("permanent");
    expect(s.employment_status).toBe("probation"); // 6-month probation on the offer
    expect(s.start_date).toBe("2026-08-01");
    expect(s.probation_end_date).toBe("2027-02-01"); // start + 6 months
    expect(s.contracted_hours).toBe(38);
    expect(s.annual_salary).toBe(25000);
    expect(s.dbs_number).toBe("001234567890");
    expect(s.dbs_issue_date).toBe("2026-06-20"); // verified_at preferred over received_at
    expect(s.home_id).toBe("home_oak");
    expect(s.candidate_id).toBe("cand_1");
    expect(s.is_active).toBe(true);
  });

  it("no offer → active (no probation), start defaults to today, no fabricated salary/DBS", () => {
    const s = mapCandidateToStaff({ candidate: candidate(), vacancy: vacancy(), offer: null, dbsCheck: null, nowIso: NOW });
    expect(s.employment_status).toBe("active");
    expect(s.probation_end_date).toBeNull();
    expect(s.start_date).toBe("2026-07-13");
    expect(s.annual_salary).toBeNull();
    expect(s.dbs_number).toBeNull();
    expect(s.dbs_issue_date).toBeNull();
    expect(s.contracted_hours).toBe(38); // falls back to vacancy hours
  });

  it("no vacancy → safe default role + job title", () => {
    const s = mapCandidateToStaff({ candidate: candidate(), vacancy: null, offer: null, dbsCheck: null, nowIso: NOW });
    expect(s.role).toBe("residential_care_worker");
    expect(s.job_title).toBe("Residential Care Worker");
    expect(s.contracted_hours).toBe(0);
  });
});
