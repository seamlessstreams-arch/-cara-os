import { describe, it, expect } from "vitest";
import {
  readEducationDisruption,
  buildEducationDisruptionOverview,
  STATUTORY_BASIS,
  type EducationDisruptionInput,
  type DisruptionEducationRecord,
  type DisruptionPepRecord,
} from "../education-disruption-engine";

// §5.18 / doctrine 1.17: school instability is a care-planning event. The
// properties under test:
//   - a suspension with no PEP after it prompts an INTERIM PEP, citing the
//     statutory basis (effective 26 July 2026);
//   - a managed move worded as a trial, or following exclusion pressure, is
//     flagged for SCRUTINY — a prompt, never a legal determination;
//   - informal send-homes surface as prohibited-practice signals;
//   - a child with no disruption records is STABLE — zero prompts.

const NOW = "2026-07-17T12:00:00Z";

let n = 0;
function rec(over: Partial<DisruptionEducationRecord>): DisruptionEducationRecord {
  n += 1;
  return {
    id: `edu_${n}`, child_id: "yp_test", record_type: "suspension",
    title: "Fixed-term suspension (2 days)", date: "2026-07-01",
    details: "", status: "open", ...over,
  };
}
function pep(over: Partial<DisruptionPepRecord>): DisruptionPepRecord {
  n += 1;
  return { id: `pep_${n}`, child_id: "yp_test", pep_date: "2026-05-01", next_review_date: "2026-11-01", ...over };
}
function input(over: Partial<EducationDisruptionInput> = {}): EducationDisruptionInput {
  return { childId: "yp_test", childName: "Test", now: NOW, educationRecords: [], pepRecords: [], ...over };
}

describe("interim PEP trigger", () => {
  it("fires for a suspension with no PEP dated after it, citing the statutory basis", () => {
    const r = readEducationDisruption(input({
      educationRecords: [rec({})],
      pepRecords: [pep({ pep_date: "2026-05-01" })], // before the suspension
    }));
    const t = r.triggers.find((x) => x.key === "interim_pep_due");
    expect(t).toBeTruthy();
    expect(t!.statutoryBasis).toContain("2026-07-26");
    expect(t!.statutoryBasis).toContain(STATUTORY_BASIS.name);
    expect(t!.suggestedActions.join(" ")).toMatch(/Virtual School/);
  });

  it("does not fire when a PEP review followed the suspension", () => {
    const r = readEducationDisruption(input({
      educationRecords: [rec({ date: "2026-07-01" })],
      pepRecords: [pep({ pep_date: "2026-07-05" })],
    }));
    expect(r.triggers.some((x) => x.key === "interim_pep_due")).toBe(false);
  });
});

describe("managed-move scrutiny — a prompt, never a determination", () => {
  it("flags trial-period wording and says it is not a legal determination", () => {
    const r = readEducationDisruption(input({
      educationRecords: [rec({ record_type: "managed_move", title: "Managed move to Northgate", details: "Agreed on a trial basis — review after 6 weeks", date: "2026-07-05", follow_up_date: "2026-08-01" })],
    }));
    const t = r.triggers.find((x) => x.key === "managed_move_scrutiny");
    expect(t).toBeTruthy();
    expect(t!.whyShown).toMatch(/not a legal determination/i);
    expect(t!.whyShown).toMatch(/trial/i);
  });

  it("flags a managed move that follows exclusion pressure within 90 days", () => {
    const r = readEducationDisruption(input({
      educationRecords: [
        rec({ record_type: "suspension", date: "2026-06-01" }),
        rec({ record_type: "managed_move", title: "Managed move", details: "Permanent, agreed by all parties", date: "2026-07-01", follow_up_date: "2026-08-01" }),
      ],
      pepRecords: [pep({ pep_date: "2026-07-02" })],
    }));
    expect(r.triggers.some((x) => x.key === "managed_move_scrutiny")).toBe(true);
  });

  it("does NOT flag a clean, permanent, pressure-free managed move", () => {
    const r = readEducationDisruption(input({
      educationRecords: [rec({ record_type: "managed_move", title: "Managed move", details: "Permanent move agreed by all; child visited and chose the school.", date: "2026-07-01", follow_up_date: "2026-09-01" })],
    }));
    expect(r.triggers.some((x) => x.key === "managed_move_scrutiny")).toBe(false);
  });
});

describe("informal send-homes and reduced timetables", () => {
  it("surfaces informal send-homes as a prohibited-practice signal", () => {
    const r = readEducationDisruption(input({
      educationRecords: [
        rec({ record_type: "informal_send_home", title: "Asked to collect at 1pm", date: "2026-07-08" }),
        rec({ record_type: "informal_send_home", title: "Sent home after lunch", date: "2026-07-15" }),
      ],
    }));
    const t = r.triggers.find((x) => x.key === "informal_exclusion_signal");
    expect(t!.evidenceRecordIds).toHaveLength(2);
    expect(t!.whyShown).toMatch(/unlawful/i);
  });

  it("prompts on a reduced timetable with no review date", () => {
    const r = readEducationDisruption(input({
      educationRecords: [rec({ record_type: "reduced_timetable", title: "Mornings only", date: "2026-07-10", follow_up_date: undefined })],
    }));
    expect(r.triggers.some((x) => x.key === "reduced_timetable_unreviewed")).toBe(true);
  });
});

describe("the care-planning line", () => {
  it("flags disruption with no care-planning response", () => {
    const r = readEducationDisruption(input({
      educationRecords: [rec({ linked_pep: false, follow_up_date: undefined, status: "open" })],
    }));
    const t = r.triggers.find((x) => x.key === "care_planning_response_missing");
    expect(t!.whyShown).toMatch(/care-planning event, not an education footnote/i);
  });

  it("names the positive when every disruption has a documented response", () => {
    const r = readEducationDisruption(input({
      educationRecords: [rec({ linked_pep: true, status: "resolved" })],
      pepRecords: [pep({ pep_date: "2026-07-03" })],
    }));
    const t = r.triggers.find((x) => x.key === "stability_protected");
    expect(t?.tone).toBe("positive");
  });
});

describe("stability and the rollup", () => {
  it("a child with no disruption records is stable — zero prompts", () => {
    const r = readEducationDisruption(input({
      educationRecords: [rec({ record_type: "achievement", title: "Star of the week" })],
    }));
    expect(r.stable).toBe(true);
    expect(r.triggers).toHaveLength(0);
  });

  it("the rollup counts open prompts and ranks the most-disrupted first", () => {
    const stable = readEducationDisruption(input({ childId: "a" }));
    const busy = readEducationDisruption(input({
      childId: "b",
      educationRecords: [
        rec({ child_id: "b" }),
        rec({ child_id: "b", record_type: "informal_send_home", date: "2026-07-10" }),
      ],
    }));
    const o = buildEducationDisruptionOverview([stable, busy]);
    expect(o.reads[0].childId).toBe("b");
    expect(o.counts.childrenWithDisruption).toBe(1);
    expect(o.counts.openTriggers).toBeGreaterThanOrEqual(2);
  });
});
