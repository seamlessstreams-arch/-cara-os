import { describe, it, expect } from "vitest";
import { computeRetentionRisk, bandFor, RETENTION_DISCLAIMER, type StaffSignalsInput } from "../retention-risk-engine";

function staff(over: Partial<StaffSignalsInput> & { staff_id: string; staff_name: string }): StaffSignalsInput {
  return { supervision_status: "current", wellbeing_score: 5, confidence_score: 5, overdue_training_count: 0, incidents_recent: 0, overtime_minutes_30d: 0, sickness_days_90d: 0, in_probation: false, ...over };
}

describe("computeRetentionRisk", () => {
  it("bands by score", () => {
    expect(bandFor(0)).toBe("settled");
    expect(bandFor(2)).toBe("watch");
    expect(bandFor(5)).toBe("support");
    expect(bandFor(8)).toBe("priority");
  });

  it("a fully-supported worker shows no indicators and is settled", () => {
    const r = computeRetentionRisk({ staff: [staff({ staff_id: "s", staff_name: "Settled" })] });
    expect(r.by_staff[0].indicators).toHaveLength(0);
    expect(r.by_staff[0].band).toBe("settled");
    expect(r.summary.with_indicators).toBe(0);
  });

  it("stacks indicators and reaches priority support", () => {
    const r = computeRetentionRisk({ staff: [staff({ staff_id: "s", staff_name: "Stretched", supervision_status: "never", wellbeing_score: 2, overdue_training_count: 3 })] });
    const res = r.by_staff[0];
    // never(3) + low wellbeing(3) + training>=3(2) = 8
    expect(res.score).toBe(8);
    expect(res.band).toBe("priority");
    expect(res.indicators.map((i) => i.key)).toEqual(expect.arrayContaining(["supervision", "wellbeing", "training"]));
  });

  it("derives suggested support from triggered indicators (deduped by key)", () => {
    const r = computeRetentionRisk({ staff: [staff({ staff_id: "s", staff_name: "S", supervision_status: "overdue", wellbeing_score: 2 })] });
    const sup = r.by_staff[0].suggested_support.join(" ");
    expect(sup).toMatch(/supervision/i);
    expect(sup).toMatch(/wellbeing/i);
  });

  it("treats probation as a low-weight support window, not a penalty", () => {
    const r = computeRetentionRisk({ staff: [staff({ staff_id: "s", staff_name: "New", in_probation: true })] });
    expect(r.by_staff[0].score).toBe(1);
    expect(r.by_staff[0].band).toBe("settled");
    expect(r.by_staff[0].indicators[0].key).toBe("probation");
  });

  it("counts overtime and sickness only above thresholds", () => {
    const low = computeRetentionRisk({ staff: [staff({ staff_id: "a", staff_name: "A", overtime_minutes_30d: 700, sickness_days_90d: 3 })] });
    expect(low.by_staff[0].score).toBe(2); // overtime low(1) + sickness low(1)
    const high = computeRetentionRisk({ staff: [staff({ staff_id: "b", staff_name: "B", overtime_minutes_30d: 1300, sickness_days_90d: 6 })] });
    expect(high.by_staff[0].score).toBe(4); // overtime med(2) + sickness med(2)
  });

  it("aggregates top drivers and sorts staff worst-first", () => {
    const r = computeRetentionRisk({ staff: [
      staff({ staff_id: "ok", staff_name: "Ok" }),
      staff({ staff_id: "bad", staff_name: "Bad", supervision_status: "never", wellbeing_score: 2 }),
      staff({ staff_id: "mid", staff_name: "Mid", supervision_status: "overdue" }),
    ] });
    expect(r.by_staff[0].staff_id).toBe("bad");
    expect(r.by_staff[r.by_staff.length - 1].staff_id).toBe("ok");
    expect(r.top_drivers[0].key).toBe("supervision"); // 2 staff
    expect(r.summary.priority + r.summary.support + r.summary.watch + r.summary.settled).toBe(3);
  });

  it("carries the non-clinical disclaimer", () => {
    const r = computeRetentionRisk({ staff: [staff({ staff_id: "s", staff_name: "S" })] });
    expect(r.disclaimer).toBe(RETENTION_DISCLAIMER);
    expect(r.disclaimer).toMatch(/not a diagnosis/i);
  });

  it("is deterministic", () => {
    const args = { staff: [staff({ staff_id: "s", staff_name: "S", supervision_status: "overdue" as const })] };
    expect(computeRetentionRisk(args)).toEqual(computeRetentionRisk(args));
  });
});
