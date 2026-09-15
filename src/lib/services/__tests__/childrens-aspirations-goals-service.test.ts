import { describe, it, expect } from "vitest";
import { _testing, type ChildrensAspirationsGoalsRecord } from "../childrens-aspirations-goals-service";
import { todayStr } from "@/lib/utils";

const { computeAspirationsGoalsMetrics, identifyAspirationsGoalsAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<ChildrensAspirationsGoalsRecord>): ChildrensAspirationsGoalsRecord {
  return {
    id: "a-1", home_id: "home-1",
    aspiration_category: "education",
    goal_status: "on_track",
    motivation_level: "motivated",
    support_quality: "good",
    review_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
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
    issues_found: [], actions_taken: [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("childrens-aspirations-goals-service", () => {
  describe("computeAspirationsGoalsMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeAspirationsGoalsMetrics([]);
      expect(m.total_goals).toBe(0);;
      expect(m.stalled_count).toBe(0);
      expect(m.not_started_count).toBe(0);
      expect(m.disengaged_count).toBe(0);
      expect(m.no_support_count).toBe(0);
      expect(m.child_led_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeAspirationsGoalsMetrics([]);
      expect(m.by_aspiration_category).toEqual({});
      expect(m.by_goal_status).toEqual({});
      expect(m.by_motivation_level).toEqual({});
      expect(m.by_support_quality).toEqual({});
    });
    it("total_goals counts records", () => { expect(computeAspirationsGoalsMetrics([makeRecord(), makeRecord()]).total_goals).toBe(2); });
    it("counts stalled", () => { expect(computeAspirationsGoalsMetrics([makeRecord({ goal_status: "stalled" })]).stalled_count).toBe(1); });
    it("counts not_started", () => { expect(computeAspirationsGoalsMetrics([makeRecord({ goal_status: "not_started" })]).not_started_count).toBe(1); });
    it("does not count in_progress as stalled", () => { expect(computeAspirationsGoalsMetrics([makeRecord({ goal_status: "in_progress" })]).stalled_count).toBe(0); });
    it("counts disengaged", () => { expect(computeAspirationsGoalsMetrics([makeRecord({ motivation_level: "disengaged" })]).disengaged_count).toBe(1); });
    it("counts no_support", () => { expect(computeAspirationsGoalsMetrics([makeRecord({ support_quality: "no_support" })]).no_support_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeAspirationsGoalsMetrics([makeRecord()]);
      expect(m.child_led_rate).toBe(100);
      expect(m.realistic_timeframe_rate).toBe(100);
      expect(m.resources_rate).toBe(100);
      expect(m.mentor_rate).toBe(100);
      expect(m.progress_celebrated_rate).toBe(100);
      expect(m.barriers_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.family_aware_rate).toBe(100);
      expect(m.school_linked_rate).toBe(100);
      expect(m.review_scheduled_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_led_rate 0 when false", () => { expect(computeAspirationsGoalsMetrics([makeRecord({ child_led_goal: false })]).child_led_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeAspirationsGoalsMetrics([makeRecord({ mentor_involved: true }), makeRecord({ mentor_involved: false }), makeRecord({ mentor_involved: true })]); expect(m.mentor_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeAspirationsGoalsMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 aspiration categories", () => { const categories = ["education","career","creative_arts","sport_fitness","relationships","independent_living","travel_experiences","personal_growth","community_involvement","other"] as const; const records = categories.map(c => makeRecord({ aspiration_category: c })); const m = computeAspirationsGoalsMetrics(records); for (const c of categories) expect(m.by_aspiration_category[c]).toBe(1); });
    it("counts all 5 goal statuses", () => { const statuses = ["achieved","on_track","in_progress","stalled","not_started"] as const; const records = statuses.map(s => makeRecord({ goal_status: s })); const m = computeAspirationsGoalsMetrics(records); for (const s of statuses) expect(m.by_goal_status[s]).toBe(1); });
    it("counts all 5 motivation levels", () => { const levels = ["highly_motivated","motivated","variable","low_motivation","disengaged"] as const; const records = levels.map(l => makeRecord({ motivation_level: l })); const m = computeAspirationsGoalsMetrics(records); for (const l of levels) expect(m.by_motivation_level[l]).toBe(1); });
    it("counts all 5 support qualities", () => { const qualities = ["excellent","good","adequate","poor","no_support"] as const; const records = qualities.map(q => makeRecord({ support_quality: q })); const m = computeAspirationsGoalsMetrics(records); for (const q of qualities) expect(m.by_support_quality[q]).toBe(1); });
  });

  describe("identifyAspirationsGoalsAlerts", () => {
    it("returns empty for clean", () => { expect(identifyAspirationsGoalsAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyAspirationsGoalsAlerts([])).toEqual([]); });
    it("fires disengaged_no_support", () => { 
      const a = identifyAspirationsGoalsAlerts([makeRecord({ motivation_level: "disengaged", support_quality: "no_support", child_name: "Jo" })]);
      expect(a[0].type).toBe("disengaged_no_support");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("disengaged_no_support per-record", () => { const a = identifyAspirationsGoalsAlerts([makeRecord({ id: "a-1", motivation_level: "disengaged", support_quality: "no_support" }), makeRecord({ id: "a-2", motivation_level: "disengaged", support_quality: "no_support" })]); expect(a.filter(x => x.type === "disengaged_no_support")).toHaveLength(2); });
    it("disengaged with good support no critical", () => { expect(identifyAspirationsGoalsAlerts([makeRecord({ motivation_level: "disengaged", support_quality: "good" })]).find(x => x.type === "disengaged_no_support")).toBeUndefined(); });
    it("motivated with no_support no critical", () => { expect(identifyAspirationsGoalsAlerts([makeRecord({ motivation_level: "motivated", support_quality: "no_support" })]).find(x => x.type === "disengaged_no_support")).toBeUndefined(); });
    it("fires goals_stalled singular", () => { 
      const a = identifyAspirationsGoalsAlerts([makeRecord({ goal_status: "stalled" })]);
      const f = a.find(x => x.type === "goals_stalled");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 goal has");
    });
    it("goals_stalled plural", () => { const a = identifyAspirationsGoalsAlerts([makeRecord({ goal_status: "stalled" }), makeRecord({ goal_status: "stalled" })]); const f = a.find(x => x.type === "goals_stalled"); expect(f!.message).toContain("2 goals have"); });
    it("fires progress_not_celebrated singular", () => { 
      const a = identifyAspirationsGoalsAlerts([makeRecord({ progress_celebrated: false })]);
      const f = a.find(x => x.type === "progress_not_celebrated");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 goal has");
    });
    it("no_mentor not for 1", () => { expect(identifyAspirationsGoalsAlerts([makeRecord({ mentor_involved: false })]).find(x => x.type === "no_mentor")).toBeUndefined(); });
    it("no_mentor fires for 2", () => { const a = identifyAspirationsGoalsAlerts([makeRecord({ mentor_involved: false }), makeRecord({ mentor_involved: false })]); expect(a.find(x => x.type === "no_mentor")).toBeDefined(); expect(a.find(x => x.type === "no_mentor")!.severity).toBe("medium"); });
    it("review_not_scheduled not for 1", () => { expect(identifyAspirationsGoalsAlerts([makeRecord({ review_scheduled: false })]).find(x => x.type === "review_not_scheduled")).toBeUndefined(); });
    it("review_not_scheduled fires for 2", () => { const a = identifyAspirationsGoalsAlerts([makeRecord({ review_scheduled: false }), makeRecord({ review_scheduled: false })]); expect(a.find(x => x.type === "review_not_scheduled")).toBeDefined(); expect(a.find(x => x.type === "review_not_scheduled")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyAspirationsGoalsAlerts([makeRecord({ motivation_level: "disengaged", support_quality: "no_support", goal_status: "stalled", progress_celebrated: false, mentor_involved: false, review_scheduled: false }), makeRecord({ goal_status: "stalled", progress_celebrated: false, mentor_involved: false, review_scheduled: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("disengaged_no_support");
      expect(types).toContain("goals_stalled");
      expect(types).toContain("progress_not_celebrated");
      expect(types).toContain("no_mentor");
      expect(types).toContain("review_not_scheduled");
    });
  });
});

describe("tri-state judgements", () => {
  it("counts unrecorded progress celebration in the gap alert, worded as unevidenced", () => {
    const alerts = identifyAspirationsGoalsAlerts([makeRecord({ progress_celebrated: null })]);
    const alert = alerts.find((a) => a.type === "progress_not_celebrated");
    expect(alert).toBeTruthy();
    expect(alert!.message).toContain("evidenced");
  });
  it("raises no celebration gap when it is recorded", () => {
    const alerts = identifyAspirationsGoalsAlerts([makeRecord({ progress_celebrated: true })]);
    expect(alerts.some((a) => a.type === "progress_not_celebrated")).toBe(false);
  });
  it("does not dilute the celebration rate with unrecorded rows", () => {
    const rows = [true, null, null, null].map((v, i) => makeRecord({ id: `r-${i}`, progress_celebrated: v }));
    expect(computeAspirationsGoalsMetrics(rows).progress_celebrated_rate).toBe(100);
  });
});
