import { describe, it, expect } from "vitest";
import { buildVacancySetupPack, type VacancySetupInput } from "../vacancy-setup-engine";
import type { Vacancy } from "@/types/recruitment";
import type { TrainingRecord } from "@/types";
import type { EmployerValuesProfile } from "@/lib/engines/values-match-engine";

const TODAY = "2026-06-11";

function vacancy(over: Partial<Vacancy> = {}): Vacancy {
  return {
    id: "vac_1",
    home_id: "home_oak",
    title: "Residential Care Worker",
    role_code: "RCW",
    employment_type: "permanent",
    contract_type: "full_time",
    salary_min: 26000,
    salary_max: 29000,
    hours: 37.5,
    shift_pattern: "Rolling rota incl. sleep-ins",
    reports_to: "Team Leader",
    safeguarding_statement:
      "We are committed to safeguarding and promoting the welfare of children. This post is subject to an enhanced DBS check and safer-recruitment procedures.",
    status: "open",
    approval_status: "approved",
    created_by: "staff_olivia",
    approved_by: "staff_olivia",
    approved_at: "2026-06-01T09:00:00Z",
    created_at: "2026-06-01T09:00:00Z",
    updated_at: "2026-06-01T09:00:00Z",
    ...over,
  };
}

function employer(): EmployerValuesProfile {
  return {
    id: "evp_1",
    home_id: "home_oak",
    organisation_name: "Cara Care Group",
    home_name: "Chamberlain House",
    core_values: ["child-centred", "warmth", "resilience"],
    care_approach: "Relational, trauma-informed care",
    leadership_style: "Supportive and reflective",
    therapeutic_model: "PACE",
    pace_commitment: "PACE underpins daily practice",
    trauma_informed_expectations: "All staff trained in trauma-informed practice",
  } as EmployerValuesProfile;
}

function training(staffId: string, status: TrainingRecord["status"], course = "Safer Recruitment in Children's Residential Care"): TrainingRecord {
  return {
    id: `tr_${staffId}_${status}`,
    staff_id: staffId,
    course_name: course,
    category: "safeguarding" as TrainingRecord["category"],
    provider: "NSPCC",
    completed_date: "2025-09-01",
    expiry_date: status === "expired" ? "2026-03-01" : "2027-09-01",
    certificate_url: null,
    status,
    is_mandatory: false,
    notes: null,
    home_id: "home_oak",
    created_at: "2025-09-01T09:00:00Z",
    updated_at: "2025-09-01T09:00:00Z",
    created_by: "staff_olivia",
    updated_by: "staff_olivia",
  };
}

function input(over: Partial<VacancySetupInput> = {}): VacancySetupInput {
  return {
    today: TODAY,
    vacancy: vacancy(),
    employer: employer(),
    staff: [
      { id: "staff_diane", full_name: "Diane Foster" },
      { id: "staff_edward", full_name: "Edward Marsh" },
      { id: "staff_anna", full_name: "Anna Price" },
    ],
    training_records: [training("staff_diane", "compliant"), training("staff_anna", "expired")],
    ...over,
  };
}

describe("buildVacancySetupPack", () => {
  it("is ready to recruit when statement, approval, values profile and a trained panellist exist", () => {
    const pack = buildVacancySetupPack(input());
    expect(pack.ready_to_recruit).toBe(true);
    expect(pack.readiness.every((r) => r.status === "ready")).toBe(true);
  });

  it("splits panel eligibility by training currency and names people", () => {
    const pack = buildVacancySetupPack(input());
    expect(pack.panel.eligible.map((p) => p.name)).toEqual(["Diane Foster"]);
    expect(pack.panel.lapsed.map((p) => p.name)).toEqual(["Anna Price"]);
  });

  it("flags a missing safeguarding statement and missing approval with actions", () => {
    const pack = buildVacancySetupPack(input({ vacancy: vacancy({ safeguarding_statement: "", approval_status: "pending", approved_by: null }) }));
    expect(pack.ready_to_recruit).toBe(false);
    const byKey = Object.fromEntries(pack.readiness.map((r) => [r.key, r]));
    expect(byKey.safeguarding_statement.status).toBe("action_needed");
    expect(byKey.safeguarding_statement.action).toMatch(/safeguarding commitment/i);
    expect(byKey.approval.status).toBe("action_needed");
  });

  it("flags when no current safer-recruitment training exists anywhere", () => {
    const pack = buildVacancySetupPack(input({ training_records: [training("staff_anna", "expired")] }));
    const item = pack.readiness.find((r) => r.key === "panel_safer_recruitment");
    expect(item?.status).toBe("action_needed");
    expect(item?.detail).toMatch(/lapsed/i);
  });

  it("handles the honest empty state — no training recorded at all", () => {
    const pack = buildVacancySetupPack(input({ training_records: [], employer: null }));
    const panelItem = pack.readiness.find((r) => r.key === "panel_safer_recruitment");
    expect(panelItem?.detail).toMatch(/No safer-recruitment training is recorded/i);
    const valuesItem = pack.readiness.find((r) => r.key === "values_profile");
    expect(valuesItem?.status).toBe("action_needed");
    expect(pack.ready_to_recruit).toBe(false);
  });

  it("reuses the advert scaffold (safeguarding statement verbatim) and the interview pack", () => {
    const pack = buildVacancySetupPack(input());
    expect(pack.advert_draft).toContain("Residential Care Worker — Chamberlain House");
    expect(pack.advert_draft).toContain("enhanced DBS check");
    expect(pack.interview_pack.scoring_categories.map((c) => c.key)).toContain("safeguarding_awareness");
    expect(pack.interview_pack.sections.length).toBeGreaterThanOrEqual(5);
    expect(pack.advert_disclaimer).toMatch(/manager approval/i);
  });

  it("maps role codes to interview roles and qualification expectations", () => {
    const rm = buildVacancySetupPack(input({ vacancy: vacancy({ role_code: "RM", title: "Registered Manager" }) }));
    expect(rm.interview_pack.role).toBe("registered_manager");
    expect(rm.qualification_expectation).toMatch(/Level 5/);
    const rcw = buildVacancySetupPack(input());
    expect(rcw.interview_pack.role).toBe("residential_care_worker");
    expect(rcw.qualification_expectation).toMatch(/Level 3/);
  });

  it("the Schedule 2 checklist keeps the human-decision and no-unsupervised-work lines", () => {
    const pack = buildVacancySetupPack(input());
    const text = pack.safer_recruitment_checklist.map((c) => `${c.item} ${c.detail}`).join(" ");
    expect(text).toMatch(/No unsupervised work with children/i);
    expect(text).toMatch(/decision is always human/i);
    expect(pack.safer_recruitment_checklist.length).toBe(10);
  });

  it("is deterministic", () => {
    const i = input();
    expect(buildVacancySetupPack(i)).toEqual(buildVacancySetupPack(i));
  });
});
