// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF PRACTICE SKILLS TESTS
//
// Pins: the five lenses unify the existing signals with honest "no_data";
// strengths and growing edges are synthesised and de-duped; supervision prompts
// are DEVELOPMENTAL (never punitive); wellbeing is surfaced with care; and the
// output is never a rank or a grade.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { synthesiseStaffPracticeSkills } from "../skills-engine";
import type { StaffPracticeSkillsInput } from "../types";

const ASOF = "2026-07-05";

const base = (o: Partial<StaffPracticeSkillsInput> = {}): StaffPracticeSkillsInput => ({
  staffId: "staff_edward",
  staffName: "Edward",
  asOf: ASOF,
  windowDays: 180,
  competencyScores: [],
  observations: [],
  supervisions: [],
  recordingAudits: [],
  keyWork: [],
  ...o,
});

describe("lenses + honesty", () => {
  it("returns all five lenses and hasData=false with an honest picture when nothing is on record", () => {
    const p = synthesiseStaffPracticeSkills(base());
    expect(p.lenses.map((l) => l.key).sort()).toEqual(
      ["competency", "observed_practice", "recording_quality", "reflective_supervision", "relational_practice"].sort(),
    );
    expect(p.hasData).toBe(false);
    expect(p.overallPicture).toBe("insufficient_data");
    expect(p.lenses.every((l) => l.signal === "no_data")).toBe(true);
  });

  it("reads competency from the average score and names the strongest domain", () => {
    const p = synthesiseStaffPracticeSkills(
      base({
        competencyScores: [
          { id: "c1", staff_id: "staff_edward", domain: "therapeutic_relationships", score: 5, assessed_at: "2026-06-01" },
          { id: "c2", staff_id: "staff_edward", domain: "risk_management", score: 4, assessed_at: "2026-06-01" },
        ],
      }),
    );
    const comp = p.lenses.find((l) => l.key === "competency")!;
    expect(comp.signal).toBe("strong");
    expect(comp.detail).toMatch(/Therapeutic Relationships/);
    expect(comp.sources).toHaveLength(2);
  });

  it("flags a weak competency domain as a development area with a supervision prompt", () => {
    const p = synthesiseStaffPracticeSkills(
      base({
        competencyScores: [
          { id: "c1", staff_id: "staff_edward", domain: "therapeutic_relationships", score: 4, assessed_at: "2026-06-01" },
          { id: "c2", staff_id: "staff_edward", domain: "statutory_compliance", score: 1, assessed_at: "2026-06-01" },
        ],
      }),
    );
    expect(p.developmentAreas.join(" ")).toMatch(/Statutory Compliance/i);
    expect(p.supervisionPrompts.some((s) => s.kind === "development")).toBe(true);
  });
});

describe("signals from the other lenses", () => {
  it("observed practice reads requires_support as needs_support and carries the noted areas", () => {
    const p = synthesiseStaffPracticeSkills(
      base({
        observations: [
          { id: "o1", staff_id: "staff_edward", observation_date: "2026-06-10", outcome: "requires_support", strengths_noted: ["warm with the children"], areas_for_development: ["de-escalation timing"] },
        ],
      }),
    );
    const obs = p.lenses.find((l) => l.key === "observed_practice")!;
    expect(obs.signal).toBe("needs_support");
    expect(p.strengths).toContain("warm with the children");
    expect(p.developmentAreas).toContain("de-escalation timing");
  });

  it("recording quality reads the accept rate", () => {
    const audits = Array.from({ length: 6 }, (_, i) => ({ id: `w${i}`, staff_id: "staff_edward", action: i < 5 ? "accepted" : "dismissed", created_at: "2026-06-20" }));
    const p = synthesiseStaffPracticeSkills(base({ recordingAudits: audits }));
    const rec = p.lenses.find((l) => l.key === "recording_quality")!;
    expect(rec.signal).toBe("strong");
    expect(rec.detail).toMatch(/83%/);
  });

  it("reflective supervision flags an overdue gap and surfaces low wellbeing with care", () => {
    const p = synthesiseStaffPracticeSkills(
      base({
        supervisions: [{ id: "s1", staff_id: "staff_edward", date: "2026-02-01", wellbeing_score: 2, confidence_level: 3, training_needs: ["restraint refresher"] }],
      }),
    );
    const sup = p.lenses.find((l) => l.key === "reflective_supervision")!;
    expect(sup.signal).toBe("needs_support"); // >90 days ago
    expect(p.developmentAreas).toContain("restraint refresher");
    expect(p.supervisionPrompts.some((s) => s.kind === "wellbeing")).toBe(true);
  });

  it("relational practice credits key-work that captures the child's voice", () => {
    const kw = Array.from({ length: 4 }, (_, i) => ({ id: `k${i}`, staff_id: "staff_edward", date: "2026-06-15", child_voice: "Jordan said he felt heard" }));
    const p = synthesiseStaffPracticeSkills(base({ keyWork: kw }));
    const rel = p.lenses.find((l) => l.key === "relational_practice")!;
    expect(rel.signal).toBe("strong");
    expect(p.strengths).toContain("Relational key-work with the child's voice captured");
  });
});

describe("developmental, never punitive", () => {
  const p = synthesiseStaffPracticeSkills(
    base({
      competencyScores: [{ id: "c1", staff_id: "staff_edward", domain: "statutory_compliance", score: 1, assessed_at: "2026-06-01" }],
      observations: [{ id: "o1", staff_id: "staff_edward", observation_date: "2026-06-10", outcome: "requires_support", strengths_noted: [], areas_for_development: ["recording detail"] }],
      supervisions: [{ id: "s1", staff_id: "staff_edward", date: "2026-01-01", wellbeing_score: 2, confidence_level: 2, training_needs: [] }],
    }),
  );

  it("never emits a numeric grade or ranking in the picture", () => {
    expect(["emerging", "developing_well", "well_established", "insufficient_data"]).toContain(p.overallPicture);
    expect(p.disclaimer).toMatch(/not performance management/i);
  });

  it("frames every prompt supportively — no punitive or ranking language", () => {
    const text = p.supervisionPrompts.map((s) => s.prompt).join(" ").toLowerCase();
    expect(text).not.toMatch(/underperform|failing|poor performer|bottom|worst|incompeten|disciplin|rank/);
  });
});

describe("scoping", () => {
  it("only reads records for the requested staff member", () => {
    const p = synthesiseStaffPracticeSkills(
      base({ competencyScores: [{ id: "c1", staff_id: "staff_anna", domain: "risk_management", score: 5, assessed_at: "2026-06-01" }] }),
    );
    expect(p.hasData).toBe(false);
  });
});
