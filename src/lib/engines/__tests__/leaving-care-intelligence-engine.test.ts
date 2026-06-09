// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LEAVING CARE INTELLIGENCE ENGINE — TEST SUITE
// Reg 12/14, Children (Leaving Care) Act 2000, SCCIF —
// pathway plans, independence skills, accommodation, EET, support networks.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeLeavingCareIntelligence,
  calculateAge,
  daysBetween,
  isDateBefore,
  type PathwayPlanInput,
  type IndependenceSkillInput,
  type ChildRef,
  type StaffRef,
  type LeavingCareIntelligenceInput,
} from "../leaving-care-intelligence-engine";

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

// ── Factory Functions ─────────────────────────────────────────────────────────

function makePathwayPlan(overrides: Partial<PathwayPlanInput> = {}): PathwayPlanInput {
  return {
    id: "pp_001",
    child_id: "yp_alex",
    status: "active_16_18",
    plan_date: "2026-01-15",
    next_review_date: "2026-07-15",
    accommodation_plan: "identified",
    eet_plan: "education",
    health_plan_complete: true,
    finance_plan_complete: true,
    support_network_mapped: true,
    independence_skills_score: 72,
    young_person_involved: true,
    ...overrides,
  };
}

function makeSkill(overrides: Partial<IndependenceSkillInput> = {}): IndependenceSkillInput {
  return {
    id: "skill_001",
    child_id: "yp_alex",
    skill_area: "cooking",
    competency_level: "competent",
    last_assessed: "2026-04-10",
    notes: "",
    ...overrides,
  };
}

function makeChild(overrides: Partial<ChildRef> = {}): ChildRef {
  return {
    id: "yp_alex",
    name: "Alex",
    date_of_birth: "2008-09-15",
    ...overrides,
  };
}

function makeStaff(overrides: Partial<StaffRef> = {}): StaffRef {
  return {
    id: "staff_001",
    name: "Staff Member",
    ...overrides,
  };
}

// ── Test Data — Chamberlain House ─────────────────────────────────────────────────────

const CHILDREN: ChildRef[] = [
  { id: "yp_alex", name: "Alex", date_of_birth: "2008-09-15" },    // age 17
  { id: "yp_jordan", name: "Jordan", date_of_birth: "2009-03-22" }, // age 17
  { id: "yp_casey", name: "Casey", date_of_birth: "2010-11-08" },   // age 15
];

const STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren Laville" },
  { id: "staff_anna", name: "Anna Smith" },
];

const ALEX_SKILLS: IndependenceSkillInput[] = [
  { id: "sk_a1", child_id: "yp_alex", skill_area: "cooking", competency_level: "competent", last_assessed: "2026-04-01", notes: "" },
  { id: "sk_a2", child_id: "yp_alex", skill_area: "budgeting", competency_level: "competent", last_assessed: "2026-04-01", notes: "" },
  { id: "sk_a3", child_id: "yp_alex", skill_area: "laundry", competency_level: "independent", last_assessed: "2026-04-01", notes: "" },
  { id: "sk_a4", child_id: "yp_alex", skill_area: "travel", competency_level: "competent", last_assessed: "2026-04-01", notes: "" },
  { id: "sk_a5", child_id: "yp_alex", skill_area: "health_management", competency_level: "competent", last_assessed: "2026-04-01", notes: "" },
  { id: "sk_a6", child_id: "yp_alex", skill_area: "communication", competency_level: "developing", last_assessed: "2026-04-01", notes: "" },
  { id: "sk_a7", child_id: "yp_alex", skill_area: "job_skills", competency_level: "developing", last_assessed: "2026-04-01", notes: "" },
];

const JORDAN_SKILLS: IndependenceSkillInput[] = [
  { id: "sk_j1", child_id: "yp_jordan", skill_area: "cooking", competency_level: "developing", last_assessed: "2026-03-15", notes: "" },
  { id: "sk_j2", child_id: "yp_jordan", skill_area: "budgeting", competency_level: "competent", last_assessed: "2026-03-15", notes: "" },
  { id: "sk_j3", child_id: "yp_jordan", skill_area: "laundry", competency_level: "competent", last_assessed: "2026-03-15", notes: "" },
  { id: "sk_j4", child_id: "yp_jordan", skill_area: "travel", competency_level: "developing", last_assessed: "2026-03-15", notes: "" },
  { id: "sk_j5", child_id: "yp_jordan", skill_area: "health_management", competency_level: "not_started", last_assessed: "2026-03-15", notes: "" },
  { id: "sk_j6", child_id: "yp_jordan", skill_area: "communication", competency_level: "competent", last_assessed: "2026-03-15", notes: "" },
  { id: "sk_j7", child_id: "yp_jordan", skill_area: "job_skills", competency_level: "not_started", last_assessed: "2026-03-15", notes: "" },
];

const CASEY_SKILLS: IndependenceSkillInput[] = [
  { id: "sk_c1", child_id: "yp_casey", skill_area: "cooking", competency_level: "developing", last_assessed: "2026-02-20", notes: "" },
  { id: "sk_c2", child_id: "yp_casey", skill_area: "budgeting", competency_level: "not_started", last_assessed: "2026-02-20", notes: "" },
  { id: "sk_c3", child_id: "yp_casey", skill_area: "laundry", competency_level: "competent", last_assessed: "2026-02-20", notes: "" },
  { id: "sk_c4", child_id: "yp_casey", skill_area: "travel", competency_level: "developing", last_assessed: "2026-02-20", notes: "" },
  { id: "sk_c5", child_id: "yp_casey", skill_area: "health_management", competency_level: "not_started", last_assessed: "2026-02-20", notes: "" },
  { id: "sk_c6", child_id: "yp_casey", skill_area: "communication", competency_level: "competent", last_assessed: "2026-02-20", notes: "" },
  { id: "sk_c7", child_id: "yp_casey", skill_area: "job_skills", competency_level: "not_started", last_assessed: "2026-02-20", notes: "" },
];

const ALL_SKILLS = [...ALEX_SKILLS, ...JORDAN_SKILLS, ...CASEY_SKILLS];

const PATHWAY_PLANS: PathwayPlanInput[] = [
  makePathwayPlan({ id: "pp_alex", child_id: "yp_alex", status: "active_16_18", independence_skills_score: 72, accommodation_plan: "identified", eet_plan: "education", support_network_mapped: true, young_person_involved: true }),
  makePathwayPlan({ id: "pp_jordan", child_id: "yp_jordan", status: "active_16_18", independence_skills_score: 48, accommodation_plan: "searching", eet_plan: "undecided", support_network_mapped: false, young_person_involved: true, next_review_date: "2026-05-20" }),
  makePathwayPlan({ id: "pp_casey", child_id: "yp_casey", status: "active_16_18", independence_skills_score: 35, accommodation_plan: "not_started", eet_plan: "undecided", support_network_mapped: false, young_person_involved: false }),
];

function makeFullInput(overrides: Partial<LeavingCareIntelligenceInput> = {}): LeavingCareIntelligenceInput {
  return {
    pathwayPlans: PATHWAY_PLANS,
    independenceSkills: ALL_SKILLS,
    children: CHILDREN,
    staff: STAFF,
    today: TODAY,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Leaving Care Intelligence Engine — Helpers", () => {
  describe("calculateAge", () => {
    it("returns correct age for a 17-year-old", () => {
      expect(calculateAge("2008-09-15", TODAY)).toBe(17);
    });

    it("returns correct age for a 15-year-old", () => {
      expect(calculateAge("2010-11-08", TODAY)).toBe(15);
    });

    it("returns 18 for a child who has turned 18", () => {
      expect(calculateAge("2008-01-01", TODAY)).toBe(18);
    });

    it("returns 0 for a newborn", () => {
      expect(calculateAge("2026-05-25", TODAY)).toBe(0);
    });

    it("handles birthday on today", () => {
      // Due to floor(diffMs / 365.25 days), exact birthday may round slightly
      // Child born May 25, 2010 → age 16 on 2026-05-25
      expect(calculateAge("2010-05-25", TODAY)).toBe(16);
    });
  });

  describe("daysBetween", () => {
    it("returns 0 for same date", () => {
      expect(daysBetween("2026-05-25", "2026-05-25")).toBe(0);
    });

    it("returns correct days", () => {
      expect(daysBetween("2026-05-01", "2026-05-25")).toBe(24);
    });

    it("is symmetric", () => {
      expect(daysBetween("2026-05-25", "2026-05-01")).toBe(24);
    });
  });

  describe("isDateBefore", () => {
    it("returns true when first date is earlier", () => {
      expect(isDateBefore("2026-05-01", "2026-05-25")).toBe(true);
    });

    it("returns false when first date is later", () => {
      expect(isDateBefore("2026-06-01", "2026-05-25")).toBe(false);
    });

    it("returns false for same date", () => {
      expect(isDateBefore("2026-05-25", "2026-05-25")).toBe(false);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Leaving Care Intelligence Engine — Empty State", () => {
  it("handles no data gracefully", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [],
      independenceSkills: [],
      children: [],
      staff: [],
      today: TODAY,
    });

    expect(result.overview.total_eligible_children).toBe(0);
    expect(result.overview.children_with_pathway_plan).toBe(0);
    expect(result.overview.plans_overdue_review).toBe(0);
    expect(result.overview.avg_independence_score).toBe(0);
    expect(result.overview.accommodation_secured_count).toBe(0);
    expect(result.overview.eet_confirmed_count).toBe(0);
    expect(result.overview.support_network_complete).toBe(0);
    expect(result.overview.avg_skills_competency_rate).toBe(0);
    expect(result.child_readiness).toHaveLength(0);
    expect(result.skills_summary).toHaveLength(7);
    expect(result.alerts).toHaveLength(0);
    expect(result.insights).toHaveLength(0);
  });

  it("returns all 7 skill area summaries even with no data", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [],
      independenceSkills: [],
      children: [],
      staff: [],
      today: TODAY,
    });

    const areas = result.skills_summary.map((s) => s.skill_area);
    expect(areas).toContain("cooking");
    expect(areas).toContain("budgeting");
    expect(areas).toContain("laundry");
    expect(areas).toContain("travel");
    expect(areas).toContain("health_management");
    expect(areas).toContain("communication");
    expect(areas).toContain("job_skills");
  });

  it("all skill summaries have zero counts when empty", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [],
      independenceSkills: [],
      children: [],
      staff: [],
      today: TODAY,
    });

    for (const summary of result.skills_summary) {
      expect(summary.independent_count).toBe(0);
      expect(summary.competent_count).toBe(0);
      expect(summary.developing_count).toBe(0);
      expect(summary.not_started_count).toBe(0);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// OVERVIEW CALCULATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Leaving Care Intelligence Engine — Overview", () => {
  it("calculates total eligible children (16+)", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    // Alex 17, Jordan 17, Casey 15 — 2 eligible
    expect(result.overview.total_eligible_children).toBe(2);
  });

  it("counts children with pathway plans", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    // Alex and Jordan are 16+, both have plans
    expect(result.overview.children_with_pathway_plan).toBe(2);
  });

  it("detects plans overdue for review", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    // Jordan's plan has next_review_date 2026-05-20 which is before today (2026-05-25)
    expect(result.overview.plans_overdue_review).toBe(1);
  });

  it("calculates average independence score for eligible children", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    // Alex 72, Jordan 48 → avg = 60
    expect(result.overview.avg_independence_score).toBe(60);
  });

  it("counts accommodation secured", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    // No one has "secured", Alex has "identified"
    expect(result.overview.accommodation_secured_count).toBe(0);
  });

  it("counts EET confirmed (education/employment/training)", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    // Alex has "education" = confirmed, Jordan has "undecided" = not confirmed
    expect(result.overview.eet_confirmed_count).toBe(1);
  });

  it("counts support network complete", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    // Alex has support_network_mapped true, Jordan false
    expect(result.overview.support_network_complete).toBe(1);
  });

  it("calculates average skills competency rate", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    // Eligible skills: Alex (5 competent+/7) + Jordan (3 competent+/7) = 8/14 = 57.1%
    expect(result.overview.avg_skills_competency_rate).toBe(57.1);
  });

  it("excludes under-16 from eligible children count", () => {
    const result = computeLeavingCareIntelligence(makeFullInput({
      children: [makeChild({ id: "yp_young", name: "Young", date_of_birth: "2012-01-01" })],
      pathwayPlans: [],
      independenceSkills: [],
    }));
    expect(result.overview.total_eligible_children).toBe(0);
  });

  it("includes exactly-16-year-old in eligible", () => {
    const result = computeLeavingCareIntelligence(makeFullInput({
      children: [makeChild({ id: "yp_16", name: "Sixteen", date_of_birth: "2010-05-25" })],
      pathwayPlans: [],
      independenceSkills: [],
    }));
    expect(result.overview.total_eligible_children).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CHILD READINESS PROFILES
// ══════════════════════════════════════════════════════════════════════════════

describe("Leaving Care Intelligence Engine — Child Readiness", () => {
  it("generates a profile for each child", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    expect(result.child_readiness).toHaveLength(3);
  });

  it("correctly identifies Alex as on_track", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    const alex = result.child_readiness.find((c) => c.child_id === "yp_alex")!;
    expect(alex.readiness_rating).toBe("on_track");
    expect(alex.age).toBe(17);
    expect(alex.has_pathway_plan).toBe(true);
    expect(alex.plan_status).toBe("active_16_18");
    expect(alex.independence_score).toBe(72);
    expect(alex.accommodation_status).toBe("identified");
    expect(alex.eet_status).toBe("education");
  });

  it("identifies Jordan as at_risk (pathway-plan review overdue)", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    const jordan = result.child_readiness.find((c) => c.child_id === "yp_jordan")!;
    // Jordan's next_review_date (2026-05-20) has passed → at_risk. Previously the
    // readiness rating keyed off a non-existent status === "overdue", so an
    // overdue plan never raised the rating.
    expect(jordan.readiness_rating).toBe("at_risk");
    expect(jordan.independence_score).toBe(48);
    expect(jordan.accommodation_status).toBe("searching");
  });

  it("correctly identifies Casey as at_risk (accommodation not_started)", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    const casey = result.child_readiness.find((c) => c.child_id === "yp_casey")!;
    expect(casey.readiness_rating).toBe("at_risk");
    expect(casey.age).toBe(15);
    expect(casey.accommodation_status).toBe("not_started");
  });

  it("counts skills competent correctly for Alex (5/7)", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    const alex = result.child_readiness.find((c) => c.child_id === "yp_alex")!;
    expect(alex.skills_competent_count).toBe(5);
    expect(alex.skills_total).toBe(7);
  });

  it("counts skills competent correctly for Jordan (3/7)", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    const jordan = result.child_readiness.find((c) => c.child_id === "yp_jordan")!;
    expect(jordan.skills_competent_count).toBe(3);
    expect(jordan.skills_total).toBe(7);
  });

  it("counts skills competent correctly for Casey (2/7)", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    const casey = result.child_readiness.find((c) => c.child_id === "yp_casey")!;
    expect(casey.skills_competent_count).toBe(2);
    expect(casey.skills_total).toBe(7);
  });

  it("rates on_track when score >= 60, accommodation secured, young person involved", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [makePathwayPlan({ child_id: "yp_a", independence_skills_score: 65, accommodation_plan: "secured", young_person_involved: true })],
      independenceSkills: [],
      children: [makeChild({ id: "yp_a", name: "A", date_of_birth: "2008-01-01" })],
      staff: [],
      today: TODAY,
    });
    expect(result.child_readiness[0].readiness_rating).toBe("on_track");
  });

  it("rates at_risk when score < 40", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [makePathwayPlan({ child_id: "yp_a", independence_skills_score: 35, accommodation_plan: "identified", young_person_involved: true })],
      independenceSkills: [],
      children: [makeChild({ id: "yp_a", name: "A", date_of_birth: "2008-01-01" })],
      staff: [],
      today: TODAY,
    });
    expect(result.child_readiness[0].readiness_rating).toBe("at_risk");
  });

  it("rates at_risk when accommodation is not_started", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [makePathwayPlan({ child_id: "yp_a", independence_skills_score: 70, accommodation_plan: "not_started", young_person_involved: true })],
      independenceSkills: [],
      children: [makeChild({ id: "yp_a", name: "A", date_of_birth: "2008-01-01" })],
      staff: [],
      today: TODAY,
    });
    expect(result.child_readiness[0].readiness_rating).toBe("at_risk");
  });

  it("rates at_risk when plan is overdue", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [makePathwayPlan({ child_id: "yp_a", status: "active_16_18", independence_skills_score: 70, accommodation_plan: "identified", young_person_involved: true, next_review_date: "2026-01-01" })],
      independenceSkills: [],
      children: [makeChild({ id: "yp_a", name: "A", date_of_birth: "2008-01-01" })],
      staff: [],
      today: TODAY,
    });
    expect(result.child_readiness[0].readiness_rating).toBe("at_risk");
  });

  it("rates needs_attention for middle-ground cases", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [makePathwayPlan({ child_id: "yp_a", independence_skills_score: 55, accommodation_plan: "searching", young_person_involved: true })],
      independenceSkills: [],
      children: [makeChild({ id: "yp_a", name: "A", date_of_birth: "2008-01-01" })],
      staff: [],
      today: TODAY,
    });
    expect(result.child_readiness[0].readiness_rating).toBe("needs_attention");
  });

  it("rates needs_attention when score >= 60 but young person not involved", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [makePathwayPlan({ child_id: "yp_a", independence_skills_score: 70, accommodation_plan: "identified", young_person_involved: false })],
      independenceSkills: [],
      children: [makeChild({ id: "yp_a", name: "A", date_of_birth: "2008-01-01" })],
      staff: [],
      today: TODAY,
    });
    expect(result.child_readiness[0].readiness_rating).toBe("needs_attention");
  });

  it("child without a plan has status 'none'", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [],
      independenceSkills: [],
      children: [makeChild({ id: "yp_a", name: "A", date_of_birth: "2008-01-01" })],
      staff: [],
      today: TODAY,
    });
    expect(result.child_readiness[0].plan_status).toBe("none");
    expect(result.child_readiness[0].has_pathway_plan).toBe(false);
  });

  it("child without plan defaults to at_risk (not_started accom)", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [],
      independenceSkills: [],
      children: [makeChild({ id: "yp_a", name: "A", date_of_birth: "2008-01-01" })],
      staff: [],
      today: TODAY,
    });
    expect(result.child_readiness[0].readiness_rating).toBe("at_risk");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SKILLS SUMMARY
// ══════════════════════════════════════════════════════════════════════════════

describe("Leaving Care Intelligence Engine — Skills Summary", () => {
  it("returns 7 skill areas", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    expect(result.skills_summary).toHaveLength(7);
  });

  it("has correct labels for all skill areas", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    const labelMap = Object.fromEntries(result.skills_summary.map((s) => [s.skill_area, s.skill_label]));
    expect(labelMap.cooking).toBe("Cooking");
    expect(labelMap.budgeting).toBe("Budgeting");
    expect(labelMap.laundry).toBe("Laundry");
    expect(labelMap.travel).toBe("Travel");
    expect(labelMap.health_management).toBe("Health Management");
    expect(labelMap.communication).toBe("Communication");
    expect(labelMap.job_skills).toBe("Job Skills");
  });

  it("counts cooking skills correctly across children", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    const cooking = result.skills_summary.find((s) => s.skill_area === "cooking")!;
    // Alex: competent, Jordan: developing, Casey: developing
    expect(cooking.competent_count).toBe(1);
    expect(cooking.developing_count).toBe(2);
    expect(cooking.independent_count).toBe(0);
    expect(cooking.not_started_count).toBe(0);
  });

  it("counts laundry skills correctly", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    const laundry = result.skills_summary.find((s) => s.skill_area === "laundry")!;
    // Alex: independent, Jordan: competent, Casey: competent
    expect(laundry.independent_count).toBe(1);
    expect(laundry.competent_count).toBe(2);
    expect(laundry.developing_count).toBe(0);
    expect(laundry.not_started_count).toBe(0);
  });

  it("counts health_management skills correctly", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    const health = result.skills_summary.find((s) => s.skill_area === "health_management")!;
    // Alex: competent, Jordan: not_started, Casey: not_started
    expect(health.competent_count).toBe(1);
    expect(health.not_started_count).toBe(2);
    expect(health.developing_count).toBe(0);
    expect(health.independent_count).toBe(0);
  });

  it("counts job_skills correctly", () => {
    const result = computeLeavingCareIntelligence(makeFullInput());
    const jobs = result.skills_summary.find((s) => s.skill_area === "job_skills")!;
    // Alex: developing, Jordan: not_started, Casey: not_started
    expect(jobs.developing_count).toBe(1);
    expect(jobs.not_started_count).toBe(2);
    expect(jobs.competent_count).toBe(0);
    expect(jobs.independent_count).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ALERTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Leaving Care Intelligence Engine — Alerts", () => {
  describe("Critical alerts", () => {
    it("fires when 16+ child has no pathway plan", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [],
        independenceSkills: [],
        children: [makeChild({ id: "yp_a", name: "Alex", date_of_birth: "2008-09-15" })],
        staff: [],
        today: TODAY,
      });
      const criticals = result.alerts.filter((a) => a.severity === "critical");
      expect(criticals).toHaveLength(1);
      expect(criticals[0].message).toContain("Alex");
      expect(criticals[0].message).toContain("no pathway plan");
    });

    it("does NOT fire for under-16 without plan", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [],
        independenceSkills: [],
        children: [makeChild({ id: "yp_young", name: "Young", date_of_birth: "2012-01-01" })],
        staff: [],
        today: TODAY,
      });
      const criticals = result.alerts.filter((a) => a.severity === "critical");
      expect(criticals).toHaveLength(0);
    });

    it("does NOT fire when 16+ child has a plan", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a" })],
        independenceSkills: [],
        children: [makeChild({ id: "yp_a", date_of_birth: "2008-01-01" })],
        staff: [],
        today: TODAY,
      });
      const criticals = result.alerts.filter((a) => a.severity === "critical");
      expect(criticals).toHaveLength(0);
    });
  });

  describe("High alerts", () => {
    it("fires when pathway plan review is overdue", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a", next_review_date: "2026-05-01" })],
        independenceSkills: [],
        children: [makeChild({ id: "yp_a", name: "Alex", date_of_birth: "2008-01-01" })],
        staff: [],
        today: TODAY,
      });
      const highs = result.alerts.filter((a) => a.severity === "high");
      expect(highs.some((a) => a.message.includes("overdue for review"))).toBe(true);
    });

    it("fires when plan review date is overdue", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a", status: "active_16_18", next_review_date: "2026-01-01" })],
        independenceSkills: [],
        children: [makeChild({ id: "yp_a", name: "Alex", date_of_birth: "2008-01-01" })],
        staff: [],
        today: TODAY,
      });
      const highs = result.alerts.filter((a) => a.severity === "high");
      expect(highs.some((a) => a.message.includes("overdue for review"))).toBe(true);
    });

    it("fires for 17+ with accommodation not_started", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a", accommodation_plan: "not_started" })],
        independenceSkills: [],
        children: [makeChild({ id: "yp_a", name: "Alex", date_of_birth: "2008-09-15" })],
        staff: [],
        today: TODAY,
      });
      const highs = result.alerts.filter((a) => a.severity === "high");
      expect(highs.some((a) => a.message.includes("no accommodation plan"))).toBe(true);
    });

    it("does NOT fire for 16-year-old with accommodation not_started", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a", accommodation_plan: "not_started" })],
        independenceSkills: [],
        children: [makeChild({ id: "yp_a", name: "A", date_of_birth: "2010-01-01" })],
        staff: [],
        today: TODAY,
      });
      const highs = result.alerts.filter((a) => a.severity === "high");
      expect(highs.some((a) => a.message.includes("no accommodation plan"))).toBe(false);
    });

    it("does NOT fire review overdue when review date is in the future", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a", next_review_date: "2026-07-01" })],
        independenceSkills: [],
        children: [makeChild({ id: "yp_a", date_of_birth: "2008-01-01" })],
        staff: [],
        today: TODAY,
      });
      const highs = result.alerts.filter((a) => a.severity === "high" && a.message.includes("overdue"));
      expect(highs).toHaveLength(0);
    });
  });

  describe("Medium alerts", () => {
    it("fires when independence score < 40 for 16+ child", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a", independence_skills_score: 35 })],
        independenceSkills: [],
        children: [makeChild({ id: "yp_a", name: "Alex", date_of_birth: "2008-01-01" })],
        staff: [],
        today: TODAY,
      });
      const mediums = result.alerts.filter((a) => a.severity === "medium");
      expect(mediums.some((a) => a.message.includes("low independence skills score"))).toBe(true);
    });

    it("does NOT fire when score is exactly 40", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a", independence_skills_score: 40 })],
        independenceSkills: [],
        children: [makeChild({ id: "yp_a", name: "Alex", date_of_birth: "2008-01-01" })],
        staff: [],
        today: TODAY,
      });
      const mediums = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("low independence"));
      expect(mediums).toHaveLength(0);
    });

    it("fires when active plan has no support network mapped", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a", status: "active_16_18", support_network_mapped: false })],
        independenceSkills: [],
        children: [makeChild({ id: "yp_a", name: "Alex", date_of_birth: "2008-01-01" })],
        staff: [],
        today: TODAY,
      });
      const mediums = result.alerts.filter((a) => a.severity === "medium");
      expect(mediums.some((a) => a.message.includes("no support network mapped"))).toBe(true);
    });

    it("does NOT fire support network alert for non-active plans", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a", status: "closed_at_25", support_network_mapped: false })],
        independenceSkills: [],
        children: [makeChild({ id: "yp_a", name: "Alex", date_of_birth: "2008-01-01" })],
        staff: [],
        today: TODAY,
      });
      const mediums = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("support network"));
      expect(mediums).toHaveLength(0);
    });
  });

  // Regression tests for the real PathwayPlanStatus enum + date-driven overdue.
  describe("real-data behaviour (enum + missing dates + NEET)", () => {
    const childA = makeChild({ id: "yp_a", name: "Alex", date_of_birth: "2008-01-01" });

    it("flags a pathway plan with NO review date set as overdue", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a", status: "active_16_18", next_review_date: "" })],
        independenceSkills: [], children: [childA], staff: [], today: TODAY,
      });
      expect(result.overview.plans_overdue_review).toBe(1);
      expect(result.alerts.some((a) => a.message.includes("overdue for review"))).toBe(true);
    });

    it("treats active_18plus_formerly_looked_after as an active plan", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a", status: "active_18plus_formerly_looked_after", support_network_mapped: false })],
        independenceSkills: [], children: [childA], staff: [], today: TODAY,
      });
      // active plan + no support network → the medium alert must fire.
      expect(result.alerts.some((a) => a.message.includes("no support network mapped"))).toBe(true);
    });

    it("raises an alert when an eligible care leaver is NEET", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a", status: "active_16_18", eet_plan: "neet" })],
        independenceSkills: [], children: [childA], staff: [], today: TODAY,
      });
      expect(result.alerts.some((a) => a.message.includes("NEET"))).toBe(true);
    });
  });

  describe("Low alerts", () => {
    it("fires for 16+ child with skill at not_started", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a" })],
        independenceSkills: [makeSkill({ child_id: "yp_a", skill_area: "cooking", competency_level: "not_started" })],
        children: [makeChild({ id: "yp_a", name: "Alex", date_of_birth: "2008-01-01" })],
        staff: [],
        today: TODAY,
      });
      const lows = result.alerts.filter((a) => a.severity === "low");
      expect(lows.some((a) => a.message.includes("Cooking"))).toBe(true);
    });

    it("does NOT fire for under-16 child with skill at not_started", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [],
        independenceSkills: [makeSkill({ child_id: "yp_young", skill_area: "cooking", competency_level: "not_started" })],
        children: [makeChild({ id: "yp_young", name: "Young", date_of_birth: "2012-01-01" })],
        staff: [],
        today: TODAY,
      });
      const lows = result.alerts.filter((a) => a.severity === "low");
      expect(lows).toHaveLength(0);
    });

    it("fires multiple low alerts for multiple not_started skills", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a" })],
        independenceSkills: [
          makeSkill({ id: "s1", child_id: "yp_a", skill_area: "cooking", competency_level: "not_started" }),
          makeSkill({ id: "s2", child_id: "yp_a", skill_area: "budgeting", competency_level: "not_started" }),
        ],
        children: [makeChild({ id: "yp_a", name: "Alex", date_of_birth: "2008-01-01" })],
        staff: [],
        today: TODAY,
      });
      const lows = result.alerts.filter((a) => a.severity === "low");
      expect(lows).toHaveLength(2);
    });
  });

  describe("Full Chamberlain House scenario alerts", () => {
    it("has the expected alert counts for test data", () => {
      const result = computeLeavingCareIntelligence(makeFullInput());
      // Jordan plan review overdue (next_review_date 2026-05-20 < today) → high
      // Jordan has no support network + "review_due" not "active" → no medium support alert
      // Jordan skills: health_management=not_started, job_skills=not_started → 2 low
      // Alex has no critical/high issues
      // Casey is 15, not eligible for critical/medium/low alerts
      const criticals = result.alerts.filter((a) => a.severity === "critical");
      const highs = result.alerts.filter((a) => a.severity === "high");
      const lows = result.alerts.filter((a) => a.severity === "low");
      expect(criticals).toHaveLength(0); // both eligible children have plans
      expect(highs.length).toBeGreaterThanOrEqual(1); // Jordan review overdue
      expect(lows.length).toBeGreaterThanOrEqual(2); // Jordan not_started skills
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Leaving Care Intelligence Engine — Insights", () => {
  describe("Critical insights", () => {
    it("fires when child approaching 18 without secured accommodation", () => {
      // Child turning 18 in 4 months (within 6 months)
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a", accommodation_plan: "searching" })],
        independenceSkills: [],
        children: [makeChild({ id: "yp_a", name: "Alex", date_of_birth: "2008-09-15" })],
        staff: [],
        today: TODAY,
      });
      const criticals = result.insights.filter((i) => i.severity === "critical");
      expect(criticals.some((i) => i.text.includes("approaching 18"))).toBe(true);
    });

    it("does NOT fire when child has secured accommodation", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a", accommodation_plan: "secured" })],
        independenceSkills: [],
        children: [makeChild({ id: "yp_a", name: "Alex", date_of_birth: "2008-09-15" })],
        staff: [],
        today: TODAY,
      });
      const criticals = result.insights.filter((i) => i.severity === "critical");
      expect(criticals).toHaveLength(0);
    });

    it("does NOT fire when child is far from 18 (more than 6 months)", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a", accommodation_plan: "searching" })],
        independenceSkills: [],
        children: [makeChild({ id: "yp_a", name: "Alex", date_of_birth: "2009-03-22" })],
        staff: [],
        today: TODAY,
      });
      const criticals = result.insights.filter((i) => i.severity === "critical");
      expect(criticals).toHaveLength(0);
    });
  });

  describe("Warning insights", () => {
    it("fires when average independence score < 50", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [
          makePathwayPlan({ id: "pp1", child_id: "yp_a", independence_skills_score: 30 }),
          makePathwayPlan({ id: "pp2", child_id: "yp_b", independence_skills_score: 40 }),
        ],
        independenceSkills: [],
        children: [
          makeChild({ id: "yp_a", name: "A", date_of_birth: "2008-01-01" }),
          makeChild({ id: "yp_b", name: "B", date_of_birth: "2008-06-01" }),
        ],
        staff: [],
        today: TODAY,
      });
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("independence score is low"))).toBe(true);
    });

    it("does NOT fire low score warning when avg >= 50", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [makePathwayPlan({ child_id: "yp_a", independence_skills_score: 60 })],
        independenceSkills: [],
        children: [makeChild({ id: "yp_a", date_of_birth: "2008-01-01" })],
        staff: [],
        today: TODAY,
      });
      const warnings = result.insights.filter((i) => i.severity === "warning" && i.text.includes("independence score is low"));
      expect(warnings).toHaveLength(0);
    });

    it("fires when multiple plans are overdue", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [
          makePathwayPlan({ id: "pp1", child_id: "yp_a", next_review_date: "2026-04-01" }),
          makePathwayPlan({ id: "pp2", child_id: "yp_b", next_review_date: "2026-05-01" }),
        ],
        independenceSkills: [],
        children: [
          makeChild({ id: "yp_a", name: "A", date_of_birth: "2008-01-01" }),
          makeChild({ id: "yp_b", name: "B", date_of_birth: "2008-06-01" }),
        ],
        staff: [],
        today: TODAY,
      });
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("overdue for review"))).toBe(true);
    });

    it("does NOT fire multiple overdue warning when only 1 overdue", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [
          makePathwayPlan({ id: "pp1", child_id: "yp_a", next_review_date: "2026-04-01" }),
          makePathwayPlan({ id: "pp2", child_id: "yp_b", next_review_date: "2026-07-01" }),
        ],
        independenceSkills: [],
        children: [
          makeChild({ id: "yp_a", name: "A", date_of_birth: "2008-01-01" }),
          makeChild({ id: "yp_b", name: "B", date_of_birth: "2008-06-01" }),
        ],
        staff: [],
        today: TODAY,
      });
      const warnings = result.insights.filter((i) => i.severity === "warning" && i.text.includes("overdue for review"));
      expect(warnings).toHaveLength(0);
    });
  });

  describe("Positive insights", () => {
    it("fires when all eligible children have active pathway plans", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [
          makePathwayPlan({ id: "pp1", child_id: "yp_a", status: "active_16_18" }),
          makePathwayPlan({ id: "pp2", child_id: "yp_b", status: "active_16_18" }),
        ],
        independenceSkills: [],
        children: [
          makeChild({ id: "yp_a", name: "A", date_of_birth: "2008-01-01" }),
          makeChild({ id: "yp_b", name: "B", date_of_birth: "2008-06-01" }),
        ],
        staff: [],
        today: TODAY,
      });
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("All eligible children have active pathway plans"))).toBe(true);
    });

    it("fires when average independence score >= 70", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [
          makePathwayPlan({ id: "pp1", child_id: "yp_a", independence_skills_score: 75 }),
          makePathwayPlan({ id: "pp2", child_id: "yp_b", independence_skills_score: 70 }),
        ],
        independenceSkills: [],
        children: [
          makeChild({ id: "yp_a", name: "A", date_of_birth: "2008-01-01" }),
          makeChild({ id: "yp_b", name: "B", date_of_birth: "2008-06-01" }),
        ],
        staff: [],
        today: TODAY,
      });
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("Strong average independence score"))).toBe(true);
    });

    it("fires when all eligible children have accommodation secured or identified", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [
          makePathwayPlan({ id: "pp1", child_id: "yp_a", accommodation_plan: "secured" }),
          makePathwayPlan({ id: "pp2", child_id: "yp_b", accommodation_plan: "identified" }),
        ],
        independenceSkills: [],
        children: [
          makeChild({ id: "yp_a", name: "A", date_of_birth: "2008-01-01" }),
          makeChild({ id: "yp_b", name: "B", date_of_birth: "2008-06-01" }),
        ],
        staff: [],
        today: TODAY,
      });
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(positives.some((i) => i.text.includes("accommodation plans secured or identified"))).toBe(true);
    });

    it("does NOT fire accommodation positive when one child is searching", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [
          makePathwayPlan({ id: "pp1", child_id: "yp_a", accommodation_plan: "secured" }),
          makePathwayPlan({ id: "pp2", child_id: "yp_b", accommodation_plan: "searching" }),
        ],
        independenceSkills: [],
        children: [
          makeChild({ id: "yp_a", name: "A", date_of_birth: "2008-01-01" }),
          makeChild({ id: "yp_b", name: "B", date_of_birth: "2008-06-01" }),
        ],
        staff: [],
        today: TODAY,
      });
      const positives = result.insights.filter((i) => i.severity === "positive" && i.text.includes("accommodation"));
      expect(positives).toHaveLength(0);
    });

    it("does NOT fire active plans positive when a plan is overdue", () => {
      const result = computeLeavingCareIntelligence({
        pathwayPlans: [
          makePathwayPlan({ id: "pp1", child_id: "yp_a", status: "active_16_18" }),
          makePathwayPlan({ id: "pp2", child_id: "yp_b", status: "active_16_18", next_review_date: "2026-01-01" }),
        ],
        independenceSkills: [],
        children: [
          makeChild({ id: "yp_a", name: "A", date_of_birth: "2008-01-01" }),
          makeChild({ id: "yp_b", name: "B", date_of_birth: "2008-06-01" }),
        ],
        staff: [],
        today: TODAY,
      });
      const positives = result.insights.filter((i) => i.severity === "positive" && i.text.includes("All eligible children have active"));
      expect(positives).toHaveLength(0);
    });
  });

  describe("Full Chamberlain House scenario insights", () => {
    it("generates critical insight for Alex approaching 18", () => {
      const result = computeLeavingCareIntelligence(makeFullInput());
      // Alex DOB 2008-09-15, turns 18 on 2026-09-15, that's ~4 months from today
      // Alex has accommodation "identified" not "secured" → critical insight
      const criticals = result.insights.filter((i) => i.severity === "critical");
      expect(criticals.some((i) => i.text.includes("approaching 18"))).toBe(true);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Leaving Care Intelligence Engine — Edge Cases", () => {
  it("handles child with multiple pathway plans (uses latest)", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [
        makePathwayPlan({ id: "pp_old", child_id: "yp_a", plan_date: "2025-06-01", independence_skills_score: 30 }),
        makePathwayPlan({ id: "pp_new", child_id: "yp_a", plan_date: "2026-02-01", independence_skills_score: 75 }),
      ],
      independenceSkills: [],
      children: [makeChild({ id: "yp_a", name: "A", date_of_birth: "2008-01-01" })],
      staff: [],
      today: TODAY,
    });
    expect(result.child_readiness[0].independence_score).toBe(75);
  });

  it("defaults today to current date when not provided", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [],
      independenceSkills: [],
      children: [],
      staff: [],
    });
    expect(result.overview.total_eligible_children).toBe(0);
    // No error thrown
  });

  it("handles child with skills but no plan", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [],
      independenceSkills: [makeSkill({ child_id: "yp_a", competency_level: "competent" })],
      children: [makeChild({ id: "yp_a", date_of_birth: "2008-01-01" })],
      staff: [],
      today: TODAY,
    });
    expect(result.child_readiness[0].skills_competent_count).toBe(1);
    expect(result.child_readiness[0].has_pathway_plan).toBe(false);
  });

  it("handles plan for child not in children list", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [makePathwayPlan({ child_id: "yp_ghost" })],
      independenceSkills: [],
      children: [makeChild({ id: "yp_a", date_of_birth: "2008-01-01" })],
      staff: [],
      today: TODAY,
    });
    // Should not crash, ghost plan just doesn't link to anyone
    expect(result.child_readiness).toHaveLength(1);
  });

  it("boundary: score exactly 60, identified accom, involved → on_track", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [makePathwayPlan({ child_id: "yp_a", independence_skills_score: 60, accommodation_plan: "identified", young_person_involved: true })],
      independenceSkills: [],
      children: [makeChild({ id: "yp_a", date_of_birth: "2008-01-01" })],
      staff: [],
      today: TODAY,
    });
    expect(result.child_readiness[0].readiness_rating).toBe("on_track");
  });

  it("boundary: score exactly 39 → at_risk", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [makePathwayPlan({ child_id: "yp_a", independence_skills_score: 39, accommodation_plan: "identified", young_person_involved: true })],
      independenceSkills: [],
      children: [makeChild({ id: "yp_a", date_of_birth: "2008-01-01" })],
      staff: [],
      today: TODAY,
    });
    expect(result.child_readiness[0].readiness_rating).toBe("at_risk");
  });

  it("EET 'employment' counts as confirmed", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [makePathwayPlan({ child_id: "yp_a", eet_plan: "employment" })],
      independenceSkills: [],
      children: [makeChild({ id: "yp_a", date_of_birth: "2008-01-01" })],
      staff: [],
      today: TODAY,
    });
    expect(result.overview.eet_confirmed_count).toBe(1);
  });

  it("EET 'training' counts as confirmed", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [makePathwayPlan({ child_id: "yp_a", eet_plan: "training" })],
      independenceSkills: [],
      children: [makeChild({ id: "yp_a", date_of_birth: "2008-01-01" })],
      staff: [],
      today: TODAY,
    });
    expect(result.overview.eet_confirmed_count).toBe(1);
  });

  it("EET 'neet' does NOT count as confirmed", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [makePathwayPlan({ child_id: "yp_a", eet_plan: "neet" })],
      independenceSkills: [],
      children: [makeChild({ id: "yp_a", date_of_birth: "2008-01-01" })],
      staff: [],
      today: TODAY,
    });
    expect(result.overview.eet_confirmed_count).toBe(0);
  });

  it("review_due status counts as active for positive insight check", () => {
    const result = computeLeavingCareIntelligence({
      pathwayPlans: [
        makePathwayPlan({ id: "pp1", child_id: "yp_a", status: "active_16_18", next_review_date: "2026-07-01" }),
      ],
      independenceSkills: [],
      children: [makeChild({ id: "yp_a", date_of_birth: "2008-01-01" })],
      staff: [],
      today: TODAY,
    });
    const positives = result.insights.filter((i) => i.severity === "positive" && i.text.includes("All eligible children have active"));
    expect(positives).toHaveLength(1);
  });
});
