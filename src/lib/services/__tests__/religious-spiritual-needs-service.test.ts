import { describe, expect, it } from "vitest";
import {
  _testing,
  type ReligiousSpiritualNeedsRecord,
} from "../religious-spiritual-needs-service";

const { computeReligiousSpiritualMetrics, identifyReligiousSpiritualAlerts } = _testing;

function makeRecord(
  overrides: Partial<ReligiousSpiritualNeedsRecord> = {},
): ReligiousSpiritualNeedsRecord {
  return {
    id: "r-1",
    home_id: "home_oak",
    faith_background: "christian",
    support_type: "worship_access",
    frequency: "weekly",
    satisfaction_level: "satisfied",
    support_date: "2026-05-04",
    child_name: "Jamie",
    child_id: null,
    staff_name: "Alex Morgan",
    facilitated: true,
    child_views_sought: true,
    parent_carer_consulted: true,
    culturally_appropriate: true,
    dietary_observance_met: true,
    worship_access_provided: true,
    prayer_space_available: true,
    festival_recognised: true,
    faith_leader_contacted: false,
    careplan_updated: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-04T10:00:00Z",
    updated_at: "2026-05-04T10:00:00Z",
    ...overrides,
  };
}

describe("tri-state judgements", () => {
  it("splits the dissatisfied-child critical between recorded not-sought and unrecorded", () => {
    const nullAlert = identifyReligiousSpiritualAlerts([
      makeRecord({ satisfaction_level: "dissatisfied", child_views_sought: null }),
    ]).find((a) => a.type === "dissatisfied_views_not_sought");
    const falseAlert = identifyReligiousSpiritualAlerts([
      makeRecord({ satisfaction_level: "dissatisfied", child_views_sought: false }),
    ]).find((a) => a.type === "dissatisfied_views_not_sought");
    expect(nullAlert).toBeTruthy();
    expect(falseAlert).toBeTruthy();
    expect(nullAlert!.message).not.toBe(falseAlert!.message);
  });

  it("raises no critical when views are recorded as sought", () => {
    const alerts = identifyReligiousSpiritualAlerts([
      makeRecord({ satisfaction_level: "dissatisfied", child_views_sought: true }),
    ]);
    expect(alerts.some((a) => a.type === "dissatisfied_views_not_sought")).toBe(false);
  });

  it("counts only recorded non-facilitation in the metric", () => {
    const rows = [null, null, false].map((v, i) =>
      makeRecord({ id: `r-${i}`, facilitated: v }),
    );
    expect(computeReligiousSpiritualMetrics(rows).not_facilitated_count).toBe(1);
  });

  it("does not dilute the dietary-observance rate with unrecorded rows", () => {
    const rows = [true, null, null, null].map((v, i) =>
      makeRecord({ id: `r-${i}`, dietary_observance_met: v }),
    );
    expect(computeReligiousSpiritualMetrics(rows).dietary_observance_rate).toBe(100);
  });
});
