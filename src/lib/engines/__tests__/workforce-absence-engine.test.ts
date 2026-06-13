import { describe, expect, it } from "vitest";
import { computeWorkforceAbsence, type AbsenceRecordLite, type WorkforceAbsenceInput } from "../workforce-absence-engine";

const TODAY = "2026-06-15";

function rec(staff_id: string, over: Partial<AbsenceRecordLite> = {}): AbsenceRecordLite {
  return {
    staff_id,
    date_started: "2026-06-01",
    date_ended: "2026-06-02",
    total_days: 1,
    category: "short_term",
    reason: "cold_flu",
    rtw_status: "completed",
    occupational_health_referral: false,
    ...over,
  };
}
function input(over: Partial<WorkforceAbsenceInput> = {}): WorkforceAbsenceInput {
  return { today: TODAY, staff: [{ id: "s1", full_name: "Test Staff" }], records: [], ...over };
}

describe("computeWorkforceAbsence — Bradford & spell triggers", () => {
  it("computes Bradford Factor S²×D over the rolling year", () => {
    const r = computeWorkforceAbsence(input({
      records: [
        rec("s1", { date_started: "2026-06-01", total_days: 2 }),
        rec("s1", { date_started: "2026-04-01", total_days: 3 }),
        rec("s1", { date_started: "2026-02-01", total_days: 5 }),
      ],
    }));
    // S=3, D=10 → 9×10 = 90
    expect(r.rows[0].spells_12m).toBe(3);
    expect(r.rows[0].days_12m).toBe(10);
    expect(r.rows[0].bradford).toBe(90);
  });

  it("flags 3+ separate absences within 90 days as a review trigger", () => {
    const r = computeWorkforceAbsence(input({
      records: [
        rec("s1", { date_started: "2026-06-10" }),
        rec("s1", { date_started: "2026-05-10" }),
        rec("s1", { date_started: "2026-04-10" }),
      ],
    }));
    expect(r.rows[0].spells_90d).toBe(3);
    expect(r.rows[0].level).toBe("attention");
    expect(r.rows[0].flags.some((f) => f.text.includes("separate absences"))).toBe(true);
    expect(r.summary.spell_trigger).toBe(1);
  });

  it("a high Bradford Factor escalates to critical (formal review)", () => {
    // 5 spells × 20 days = 25×20 = 500 ≥ 400
    const recs = Array.from({ length: 5 }, (_, i) => rec("s1", { date_started: `2026-0${i + 1}-05`, total_days: 4 }));
    const r = computeWorkforceAbsence(input({ records: recs }));
    expect(r.rows[0].bradford).toBe(500);
    expect(r.rows[0].level).toBe("critical");
    expect(r.rows[0].flags.some((f) => f.text.includes("formal review"))).toBe(true);
  });
});

describe("computeWorkforceAbsence — long-term, RTW, current", () => {
  it("flags an ongoing long-term absence as critical and currently off", () => {
    const r = computeWorkforceAbsence(input({
      records: [rec("s1", { date_started: "2026-05-10", date_ended: null, total_days: 36, category: "long_term", occupational_health_referral: true, rtw_status: "not_required" })],
    }));
    expect(r.rows[0].currently_absent).toBe(true);
    expect(r.rows[0].long_term).toBe(true);
    expect(r.rows[0].level).toBe("critical");
    expect(r.summary.currently_absent).toBe(1);
  });

  it("flags an overdue return-to-work interview as critical", () => {
    const r = computeWorkforceAbsence(input({
      records: [rec("s1", { date_started: "2026-06-05", date_ended: "2026-06-08", total_days: 3, rtw_status: "overdue" })],
    }));
    expect(r.rows[0].rtw_overdue).toBe(true);
    expect(r.rows[0].level).toBe("critical");
    expect(r.summary.rtw_overdue).toBe(1);
  });

  it("flags work-related absence for risk-assessment review", () => {
    const r = computeWorkforceAbsence(input({
      records: [rec("s1", { date_started: "2026-06-05", category: "work_related" })],
    }));
    expect(r.rows[0].work_related).toBe(true);
    expect(r.rows[0].flags.some((f) => f.text.includes("Work-related"))).toBe(true);
  });
});

describe("computeWorkforceAbsence — clean & roll-up", () => {
  it("a single short absence with RTW done is no concern", () => {
    const r = computeWorkforceAbsence(input({ records: [rec("s1")] }));
    expect(r.rows[0].level).toBe("ok");
    expect(r.rows[0].flags).toHaveLength(0);
    expect(r.headline).toBe("No absence concerns");
  });

  it("sorts worst-first and rolls up the summary", () => {
    const r = computeWorkforceAbsence(input({
      staff: [
        { id: "ok", full_name: "Clean Clara" },
        { id: "crit", full_name: "Critical Chris" },
      ],
      records: [rec("ok"), rec("crit", { rtw_status: "overdue" })],
    }));
    expect(r.rows[0].full_name).toBe("Critical Chris");
    expect(r.summary.with_concern).toBe(1);
  });

  it("excludes absences older than a year from the Bradford window", () => {
    const r = computeWorkforceAbsence(input({
      records: [rec("s1", { date_started: "2024-01-01", total_days: 10 })],
    }));
    expect(r.rows[0].spells_12m).toBe(0);
    expect(r.rows[0].bradford).toBe(0);
  });
});
