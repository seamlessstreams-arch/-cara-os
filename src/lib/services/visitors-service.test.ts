import { describe, it, expect } from "vitest";
import {
  computeVisitorSummary,
  computeVisitorCompliance,
  identifyVisitorAlerts,
  type VisitorEntry,
} from "./visitors-service";

// ── Factory ────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<VisitorEntry> = {}): VisitorEntry {
  return {
    id: overrides.id ?? "entry-1",
    home_id: overrides.home_id ?? "home-1",
    visitor_name: overrides.visitor_name ?? "Visitor A",
    visitor_type: overrides.visitor_type ?? "social_worker",
    organisation: "organisation" in overrides ? overrides.organisation : null,
    purpose: overrides.purpose ?? "statutory_visit",
    child_visited: "child_visited" in overrides ? overrides.child_visited : null,
    child_name: "child_name" in overrides ? overrides.child_name : null,
    arrival_time: overrides.arrival_time ?? "2025-01-15T10:00:00Z",
    departure_time: "departure_time" in overrides ? overrides.departure_time : "2025-01-15T11:00:00Z",
    duration_minutes: "duration_minutes" in overrides ? overrides.duration_minutes : 60,
    dbs_checked: overrides.dbs_checked ?? true,
    id_verified: overrides.id_verified ?? true,
    notes: "notes" in overrides ? overrides.notes : null,
    recorded_by: overrides.recorded_by ?? "Staff A",
    date: overrides.date ?? "2025-01-15",
    created_at: overrides.created_at ?? "2025-01-15T00:00:00Z",
  };
}

// ── computeVisitorSummary ──────────────────────────────────────────────

describe("computeVisitorSummary", () => {
  it("returns zeroes for empty array", () => {
    const s = computeVisitorSummary([], "2025-01-01", "2025-12-31");
    expect(s.total_visits).toBe(0);
    expect(s.unique_visitors).toBe(0);
    expect(s.professional_visits).toBe(0);
    expect(s.family_visits).toBe(0);
    expect(s.avg_duration_minutes).toBe(0);
    expect(s.busiest_day).toBeNull();
  });

  it("filters entries within date range", () => {
    const entries = [
      makeEntry({ date: "2025-01-15" }),
      makeEntry({ date: "2025-02-01" }),
      makeEntry({ date: "2024-12-31" }),
    ];
    const s = computeVisitorSummary(entries, "2025-01-01", "2025-01-31");
    expect(s.total_visits).toBe(1);
  });

  it("counts professional and family visits", () => {
    const entries = [
      makeEntry({ visitor_type: "social_worker" }),
      makeEntry({ visitor_type: "iro" }),
      makeEntry({ visitor_type: "family_member" }),
      makeEntry({ visitor_type: "contractor" }),
    ];
    const s = computeVisitorSummary(entries, "2025-01-01", "2025-12-31");
    expect(s.professional_visits).toBe(2);
    expect(s.family_visits).toBe(1);
  });

  it("computes average duration from non-null values", () => {
    const entries = [
      makeEntry({ duration_minutes: 30 }),
      makeEntry({ duration_minutes: 90 }),
      makeEntry({ duration_minutes: null }),
    ];
    const s = computeVisitorSummary(entries, "2025-01-01", "2025-12-31");
    expect(s.avg_duration_minutes).toBe(60);
  });

  it("finds busiest day", () => {
    const entries = [
      makeEntry({ date: "2025-01-10" }),
      makeEntry({ date: "2025-01-10" }),
      makeEntry({ date: "2025-01-10" }),
      makeEntry({ date: "2025-01-11" }),
    ];
    const s = computeVisitorSummary(entries, "2025-01-01", "2025-12-31");
    expect(s.busiest_day).toBe("2025-01-10");
  });

  it("counts children visited by name", () => {
    const entries = [
      makeEntry({ child_name: "Alice" }),
      makeEntry({ child_name: "Alice" }),
      makeEntry({ child_name: "Bob" }),
    ];
    const s = computeVisitorSummary(entries, "2025-01-01", "2025-12-31");
    expect(s.children_visited["Alice"]).toBe(2);
    expect(s.children_visited["Bob"]).toBe(1);
  });

  it("counts unique visitors case-insensitively", () => {
    const entries = [
      makeEntry({ visitor_name: "Alice Smith" }),
      makeEntry({ visitor_name: "alice smith" }),
      makeEntry({ visitor_name: "Bob Jones" }),
    ];
    const s = computeVisitorSummary(entries, "2025-01-01", "2025-12-31");
    expect(s.unique_visitors).toBe(2);
  });
});

// ── computeVisitorCompliance ───────────────────────────────────────────

describe("computeVisitorCompliance", () => {
  it("returns unmeasured rates for empty array (nothing evidenced)", () => {
    const c = computeVisitorCompliance([]);
    expect(c.total_entries).toBe(0);
    expect(c.dbs_check_rate).toBeNull();
    expect(c.id_verification_rate).toBeNull();
    expect(c.sign_out_rate).toBeNull();
    expect(c.incomplete_entries).toBe(0);
  });

  it("computes DBS check rate for professional visitors only", () => {
    const entries = [
      makeEntry({ visitor_type: "social_worker", dbs_checked: true }),
      makeEntry({ visitor_type: "social_worker", dbs_checked: false }),
      makeEntry({ visitor_type: "family_member", dbs_checked: false }),
    ];
    const c = computeVisitorCompliance(entries);
    expect(c.dbs_check_rate).toBe(50);
  });

  it("computes ID verification rate for all visitors", () => {
    const entries = [
      makeEntry({ id_verified: true }),
      makeEntry({ id_verified: false }),
    ];
    const c = computeVisitorCompliance(entries);
    expect(c.id_verification_rate).toBe(50);
  });

  it("computes sign-out rate and incomplete entries", () => {
    const entries = [
      makeEntry({ departure_time: "2025-01-15T11:00:00Z" }),
      makeEntry({ departure_time: null }),
    ];
    const c = computeVisitorCompliance(entries);
    expect(c.sign_out_rate).toBe(50);
    expect(c.incomplete_entries).toBe(1);
  });
});

// ── identifyVisitorAlerts ──────────────────────────────────────────────

describe("identifyVisitorAlerts", () => {
  it("fires high alert for DBS not checked on professional visitor", () => {
    const entries = [makeEntry({ visitor_type: "social_worker", dbs_checked: false })];
    const alerts = identifyVisitorAlerts(entries);
    const match = alerts.find((a) => a.type === "dbs_not_checked");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for ID not verified", () => {
    const entries = [makeEntry({ id_verified: false })];
    const alerts = identifyVisitorAlerts(entries);
    const match = alerts.find((a) => a.type === "id_not_verified");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("fires low alert for high volume (> 5 visitors in a day)", () => {
    const entries = Array.from({ length: 6 }, (_, i) =>
      makeEntry({ id: `e-${i}`, date: "2025-01-15" }),
    );
    const alerts = identifyVisitorAlerts(entries);
    const match = alerts.find((a) => a.type === "high_volume");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("low");
  });

  it("does NOT fire high_volume for exactly 5 visitors", () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeEntry({ id: `e-${i}`, date: "2025-01-15" }),
    );
    const alerts = identifyVisitorAlerts(entries);
    expect(alerts.find((a) => a.type === "high_volume")).toBeUndefined();
  });

  it("fires high alert for no reg44 visit in last 30 days", () => {
    const entries = [makeEntry({ visitor_type: "social_worker", date: "2025-01-15" })];
    const alerts = identifyVisitorAlerts(entries);
    const match = alerts.find((a) => a.type === "no_reg44_visit");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });
});
