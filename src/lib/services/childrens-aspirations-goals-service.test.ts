import { describe, it, expect } from "vitest";
import {
  computeAspirationsGoalsMetrics,
  identifyAspirationsGoalsAlerts,
} from "./childrens-aspirations-goals-service";
import type { ChildrensAspirationsGoalsRecord } from "./childrens-aspirations-goals-service";

// -- Factory -------------------------------------------------------------------

function makeRecord(overrides: Partial<ChildrensAspirationsGoalsRecord> = {}): ChildrensAspirationsGoalsRecord {
  return {
    id: "ag-1",
    home_id: "home-1",
    aspiration_category: "education",
    goal_status: "on_track",
    motivation_level: "motivated",
    support_quality: "good",
    review_date: "2026-05-20",
    child_name: "Alex",
    child_id: "child-1",
    supported_by: "Staff A",
    child_led_goal: true,
    realistic_timeframe: true,
    resources_identified: true,
    mentor_involved: true,
    progress_celebrated: true,
    barriers_addressed: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    family_aware: true,
    school_linked: true,
    review_scheduled: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeAspirationsGoalsMetrics --------------------------------------------

describe("computeAspirationsGoalsMetrics", () => {
  it("returns zeroed metrics for empty data", () => {
    const m = computeAspirationsGoalsMetrics([]);
    expect(m.total_goals).toBe(0);
    expect(m.stalled_count).toBe(0);
    expect(m.not_started_count).toBe(0);
    expect(m.disengaged_count).toBe(0);
    expect(m.no_support_count).toBe(0);
    expect(m.child_led_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts statuses and motivation/support concerns", () => {
    const rows = [
      makeRecord({ id: "1", goal_status: "stalled" }),
      makeRecord({ id: "2", goal_status: "not_started" }),
      makeRecord({ id: "3", motivation_level: "disengaged" }),
      makeRecord({ id: "4", support_quality: "no_support" }),
    ];
    const m = computeAspirationsGoalsMetrics(rows);
    expect(m.stalled_count).toBe(1);
    expect(m.not_started_count).toBe(1);
    expect(m.disengaged_count).toBe(1);
    expect(m.no_support_count).toBe(1);
  });

  it("calculates boolean rates", () => {
    const rows = [
      makeRecord({ id: "1", child_led_goal: true, mentor_involved: true }),
      makeRecord({ id: "2", child_led_goal: false, mentor_involved: false }),
    ];
    const m = computeAspirationsGoalsMetrics(rows);
    expect(m.child_led_rate).toBe(50);
    expect(m.mentor_rate).toBe(50);
  });

  it("builds breakdowns", () => {
    const rows = [
      makeRecord({ id: "1", aspiration_category: "education", goal_status: "on_track", motivation_level: "motivated", support_quality: "good" }),
      makeRecord({ id: "2", aspiration_category: "career", goal_status: "stalled", motivation_level: "disengaged", support_quality: "poor" }),
    ];
    const m = computeAspirationsGoalsMetrics(rows);
    expect(m.by_aspiration_category).toEqual({ education: 1, career: 1 });
    expect(m.by_goal_status).toEqual({ on_track: 1, stalled: 1 });
    expect(m.by_motivation_level).toEqual({ motivated: 1, disengaged: 1 });
    expect(m.by_support_quality).toEqual({ good: 1, poor: 1 });
  });
});

// -- identifyAspirationsGoalsAlerts --------------------------------------------

describe("identifyAspirationsGoalsAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyAspirationsGoalsAlerts([])).toEqual([]);
  });

  it("critical: disengaged with no support (per-record)", () => {
    const row = makeRecord({
      id: "dns1",
      motivation_level: "disengaged",
      support_quality: "no_support",
    });
    const alerts = identifyAspirationsGoalsAlerts([row]);
    const matched = alerts.filter((a) => a.type === "disengaged_no_support");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("critical");
    expect(matched[0].id).toBe("dns1");
  });

  it("high: goals stalled (threshold >= 1)", () => {
    const row = makeRecord({ id: "gs1", goal_status: "stalled" });
    const alerts = identifyAspirationsGoalsAlerts([row]);
    const matched = alerts.filter((a) => a.type === "goals_stalled");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("high");
  });

  it("high: progress not celebrated (threshold >= 1)", () => {
    const row = makeRecord({ id: "pc1", progress_celebrated: false });
    const alerts = identifyAspirationsGoalsAlerts([row]);
    const matched = alerts.filter((a) => a.type === "progress_not_celebrated");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("high");
  });

  it("medium: no mentor (threshold >= 2)", () => {
    // 1 — should NOT trigger
    const alerts1 = identifyAspirationsGoalsAlerts([
      makeRecord({ id: "nm1", mentor_involved: false }),
    ]);
    expect(alerts1.filter((a) => a.type === "no_mentor")).toHaveLength(0);

    // 2 — should trigger
    const alerts2 = identifyAspirationsGoalsAlerts([
      makeRecord({ id: "nm1", mentor_involved: false }),
      makeRecord({ id: "nm2", mentor_involved: false }),
    ]);
    expect(alerts2.filter((a) => a.type === "no_mentor")).toHaveLength(1);
    expect(alerts2.filter((a) => a.type === "no_mentor")[0].severity).toBe("medium");
  });

  it("medium: review not scheduled (threshold >= 2)", () => {
    const alerts = identifyAspirationsGoalsAlerts([
      makeRecord({ id: "rs1", review_scheduled: false }),
      makeRecord({ id: "rs2", review_scheduled: false }),
    ]);
    expect(alerts.filter((a) => a.type === "review_not_scheduled")).toHaveLength(1);
    expect(alerts.filter((a) => a.type === "review_not_scheduled")[0].severity).toBe("medium");
  });
});
