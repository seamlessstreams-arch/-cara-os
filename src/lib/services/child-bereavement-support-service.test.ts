import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  computeCaraInsights,
  type ChildBereavementSupportRow,
} from "./child-bereavement-support-service";

function makeRow(overrides: Partial<ChildBereavementSupportRow> = {}): ChildBereavementSupportRow {
  return {
    id: "ber-1",
    home_id: "home-1",
    child_name: "Charlie Green",
    bereavement_date: "2026-03-01",
    deceased_relationship: "Grandparent",
    grief_stage: "Bargaining",
    support_type: "Key Worker",
    specialist_referral_made: false,
    specialist_service: null,
    camhs_involvement: false,
    school_notified: true,
    social_worker_notified: true,
    memorial_activity_planned: true,
    ongoing_support_needed: true,
    review_date: "2026-06-01",
    key_worker_name: "KW Davis",
    notes: null,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.ongoing_support_count).toBe(0);
    expect(m.specialist_referral_count).toBe(0);
    expect(m.camhs_involvement_count).toBe(0);
    expect(m.school_notification_rate).toBe(0);
    expect(m.social_worker_rate).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.unique_key_workers).toBe(0);
  });

  it("counts support metrics correctly", () => {
    const rows = [
      makeRow({ id: "1", ongoing_support_needed: true, specialist_referral_made: true, camhs_involvement: true }),
      makeRow({ id: "2", ongoing_support_needed: false, specialist_referral_made: false, camhs_involvement: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(2);
    expect(m.ongoing_support_count).toBe(1);
    expect(m.specialist_referral_count).toBe(1);
    expect(m.camhs_involvement_count).toBe(1);
  });

  it("calculates boolean rates", () => {
    const rows = [
      makeRow({ id: "1", school_notified: true, social_worker_notified: true }),
      makeRow({ id: "2", school_notified: false, social_worker_notified: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.school_notification_rate).toBe(50);
    expect(m.social_worker_rate).toBe(50);
  });

  it("calculates memorial and review rates", () => {
    const rows = [
      makeRow({ id: "1", memorial_activity_planned: true, review_date: "2026-06-01" }),
      makeRow({ id: "2", memorial_activity_planned: false, review_date: null }),
    ];
    const m = computeMetrics(rows);
    expect(m.memorial_activity_rate).toBe(50);
    expect(m.review_scheduled_rate).toBe(50);
  });

  it("builds breakdowns correctly", () => {
    const rows = [
      makeRow({ id: "1", deceased_relationship: "Parent", grief_stage: "Denial", support_type: "Counselling" }),
      makeRow({ id: "2", deceased_relationship: "Parent", grief_stage: "Anger", support_type: "Counselling" }),
      makeRow({ id: "3", deceased_relationship: "Sibling", grief_stage: "Denial", support_type: "Key Worker" }),
    ];
    const m = computeMetrics(rows);
    expect(m.deceased_relationship_breakdown["Parent"]).toBe(2);
    expect(m.deceased_relationship_breakdown["Sibling"]).toBe(1);
    expect(m.grief_stage_breakdown["Denial"]).toBe(2);
    expect(m.support_type_breakdown["Counselling"]).toBe(2);
  });

  it("counts unique children and key workers", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Charlie", key_worker_name: "KW Davis" }),
      makeRow({ id: "2", child_name: "Charlie", key_worker_name: "KW Smith" }),
      makeRow({ id: "3", child_name: "Sam", key_worker_name: "KW Davis" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_children).toBe(2);
    expect(m.unique_key_workers).toBe(2);
  });
});

describe("computeAlerts", () => {
  it("returns no alerts for empty rows", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires high alert for ongoing support without review date", () => {
    const rows = [makeRow({ ongoing_support_needed: true, review_date: null })];
    const alerts = computeAlerts(rows);
    const osr = alerts.filter((a) => a.type === "ongoing_support_no_review");
    expect(osr.length).toBe(1);
    expect(osr[0].severity).toBe("high");
  });

  it("fires high alert for depression without specialist referral", () => {
    const rows = [makeRow({ grief_stage: "Depression", specialist_referral_made: false })];
    const alerts = computeAlerts(rows);
    const dep = alerts.filter((a) => a.type === "depression_no_referral");
    expect(dep.length).toBe(1);
    expect(dep[0].severity).toBe("high");
  });

  it("does NOT fire depression alert when referral is made", () => {
    const rows = [makeRow({ grief_stage: "Depression", specialist_referral_made: true })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "depression_no_referral").length).toBe(0);
  });

  it("fires medium alert for school not notified", () => {
    const rows = [makeRow({ school_notified: false })];
    const alerts = computeAlerts(rows);
    const sn = alerts.filter((a) => a.type === "school_not_notified");
    expect(sn.length).toBe(1);
    expect(sn[0].severity).toBe("medium");
  });

  it("fires medium alert for social worker not notified", () => {
    const rows = [makeRow({ social_worker_notified: false })];
    const alerts = computeAlerts(rows);
    const sw = alerts.filter((a) => a.type === "social_worker_not_notified");
    expect(sw.length).toBe(1);
    expect(sw[0].severity).toBe("medium");
  });
});

describe("computeCaraInsights", () => {
  it("returns 3 insights for populated metrics", () => {
    const rows = [makeRow()];
    const metrics = computeMetrics(rows);
    const alerts = computeAlerts(rows);
    const insights = computeCaraInsights(metrics, alerts);
    expect(insights.length).toBe(3);
    expect(insights[0]).toContain("[red]");
    expect(insights[1]).toContain("[amber]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("returns 3 insights even for empty metrics", () => {
    const metrics = computeMetrics([]);
    const insights = computeCaraInsights(metrics);
    expect(insights.length).toBe(3);
  });
});
