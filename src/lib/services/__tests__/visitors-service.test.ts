// ══════════════════════════════════════════════════════════════════════════════
// CARA — VISITORS LOG SERVICE TESTS
// Pure-function tests for visitor summaries, compliance metrics,
// alert identification, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../visitors-service";
import {
  VISITOR_TYPES,
  VISIT_PURPOSES,
} from "../visitors-service";
import type { VisitorEntry } from "../visitors-service";

const {
  computeVisitorSummary,
  computeVisitorCompliance,
  identifyVisitorAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal visitor entry with sensible defaults. */
function makeVisitorEntry(
  overrides: Partial<{
    id: string;
    home_id: string;
    visitor_name: string;
    visitor_type: string;
    organisation: string | null;
    purpose: string;
    child_visited: string | null;
    child_name: string | null;
    arrival_time: string;
    departure_time: string | null;
    duration_minutes: number | null;
    dbs_checked: boolean;
    id_verified: boolean;
    notes: string | null;
    recorded_by: string;
    date: string;
    created_at: string;
  }> = {},
): VisitorEntry {
  return {
    id: "id" in overrides ? overrides.id! : "v-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    visitor_name: "visitor_name" in overrides ? overrides.visitor_name! : "Jane Smith",
    visitor_type: "visitor_type" in overrides ? overrides.visitor_type! : "social_worker",
    organisation: "organisation" in overrides ? overrides.organisation! : null,
    purpose: "purpose" in overrides ? overrides.purpose! : "statutory_visit",
    child_visited: "child_visited" in overrides ? overrides.child_visited! : null,
    child_name: "child_name" in overrides ? overrides.child_name! : null,
    arrival_time: "arrival_time" in overrides ? overrides.arrival_time! : "2026-05-01T10:00:00Z",
    departure_time: "departure_time" in overrides ? overrides.departure_time! : "2026-05-01T11:00:00Z",
    duration_minutes: "duration_minutes" in overrides ? overrides.duration_minutes! : 60,
    dbs_checked: "dbs_checked" in overrides ? overrides.dbs_checked! : true,
    id_verified: "id_verified" in overrides ? overrides.id_verified! : true,
    notes: "notes" in overrides ? overrides.notes! : null,
    recorded_by: "recorded_by" in overrides ? overrides.recorded_by! : "staff-1",
    date: "date" in overrides ? overrides.date! : "2026-05-01",
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-01T10:00:00Z",
  };
}

// ── VISITOR_TYPES ─────────────────────────────────────────────────────────

describe("VISITOR_TYPES", () => {
  it("has exactly 14 entries", () => {
    expect(VISITOR_TYPES).toHaveLength(14);
  });

  it("each entry has type, label, and professional properties", () => {
    for (const vt of VISITOR_TYPES) {
      expect(typeof vt.type).toBe("string");
      expect(typeof vt.label).toBe("string");
      expect(typeof vt.professional).toBe("boolean");
    }
  });

  it("contains expected professional types", () => {
    const types = VISITOR_TYPES.filter((vt) => vt.professional).map((vt) => vt.type);
    expect(types).toContain("social_worker");
    expect(types).toContain("iro");
    expect(types).toContain("ofsted_inspector");
    expect(types).toContain("reg44_visitor");
    expect(types).toContain("camhs");
    expect(types).toContain("police");
  });

  it("contains expected non-professional types", () => {
    const types = VISITOR_TYPES.filter((vt) => !vt.professional).map((vt) => vt.type);
    expect(types).toContain("family_member");
    expect(types).toContain("friend");
    expect(types).toContain("contractor");
    expect(types).toContain("other");
  });

  it("has 10 professional and 4 non-professional types", () => {
    const professional = VISITOR_TYPES.filter((vt) => vt.professional);
    const nonProfessional = VISITOR_TYPES.filter((vt) => !vt.professional);
    expect(professional).toHaveLength(10);
    expect(nonProfessional).toHaveLength(4);
  });

  it("has correct label for social_worker", () => {
    const found = VISITOR_TYPES.find((vt) => vt.type === "social_worker");
    expect(found?.label).toBe("Social Worker");
  });

  it("has correct label for reg44_visitor", () => {
    const found = VISITOR_TYPES.find((vt) => vt.type === "reg44_visitor");
    expect(found?.label).toBe("Reg 44 Independent Visitor");
    expect(found?.professional).toBe(true);
  });

  it("has correct label for family_member", () => {
    const found = VISITOR_TYPES.find((vt) => vt.type === "family_member");
    expect(found?.label).toBe("Family Member");
    expect(found?.professional).toBe(false);
  });
});

// ── VISIT_PURPOSES ────────────────────────────────────────────────────────

describe("VISIT_PURPOSES", () => {
  it("has exactly 13 purposes", () => {
    expect(VISIT_PURPOSES).toHaveLength(13);
  });

  it("all entries are strings", () => {
    for (const purpose of VISIT_PURPOSES) {
      expect(typeof purpose).toBe("string");
    }
  });

  it("contains expected purposes", () => {
    expect(VISIT_PURPOSES).toContain("statutory_visit");
    expect(VISIT_PURPOSES).toContain("lac_review");
    expect(VISIT_PURPOSES).toContain("safeguarding");
    expect(VISIT_PURPOSES).toContain("reg44_visit");
    expect(VISIT_PURPOSES).toContain("inspection");
    expect(VISIT_PURPOSES).toContain("family_contact");
    expect(VISIT_PURPOSES).toContain("other");
  });

  it("contains maintenance and delivery purposes", () => {
    expect(VISIT_PURPOSES).toContain("maintenance");
    expect(VISIT_PURPOSES).toContain("delivery");
  });
});

// ── computeVisitorSummary ───────────────────────────────────────────────

describe("computeVisitorSummary", () => {
  const dateFrom = "2026-05-01";
  const dateTo = "2026-05-31";

  it("returns zeroed metrics for empty array", () => {
    const result = computeVisitorSummary([], dateFrom, dateTo);
    expect(result.total_visits).toBe(0);
    expect(result.unique_visitors).toBe(0);
    expect(result.by_type).toEqual({});
    expect(result.by_purpose).toEqual({});
    expect(result.professional_visits).toBe(0);
    expect(result.family_visits).toBe(0);
    expect(result.avg_duration_minutes).toBe(0);
    expect(result.busiest_day).toBeNull();
    expect(result.children_visited).toEqual({});
  });

  it("counts total visits within date range", () => {
    const result = computeVisitorSummary(
      [
        makeVisitorEntry({ date: "2026-05-05" }),
        makeVisitorEntry({ id: "v-2", date: "2026-05-10" }),
        makeVisitorEntry({ id: "v-3", date: "2026-05-15" }),
      ],
      dateFrom,
      dateTo,
    );
    expect(result.total_visits).toBe(3);
  });

  it("excludes entries outside date range", () => {
    const result = computeVisitorSummary(
      [
        makeVisitorEntry({ date: "2026-04-30" }),
        makeVisitorEntry({ id: "v-2", date: "2026-05-01" }),
        makeVisitorEntry({ id: "v-3", date: "2026-06-01" }),
      ],
      dateFrom,
      dateTo,
    );
    expect(result.total_visits).toBe(1);
  });

  it("includes entries on the boundary dates (from and to inclusive)", () => {
    const result = computeVisitorSummary(
      [
        makeVisitorEntry({ date: "2026-05-01" }),
        makeVisitorEntry({ id: "v-2", date: "2026-05-31" }),
      ],
      dateFrom,
      dateTo,
    );
    expect(result.total_visits).toBe(2);
  });

  it("counts unique visitors case-insensitively", () => {
    const result = computeVisitorSummary(
      [
        makeVisitorEntry({ visitor_name: "Jane Smith", date: "2026-05-01" }),
        makeVisitorEntry({ id: "v-2", visitor_name: "jane smith", date: "2026-05-02" }),
        makeVisitorEntry({ id: "v-3", visitor_name: "Bob Jones", date: "2026-05-03" }),
      ],
      dateFrom,
      dateTo,
    );
    expect(result.unique_visitors).toBe(2);
  });

  it("trims visitor names for uniqueness", () => {
    const result = computeVisitorSummary(
      [
        makeVisitorEntry({ visitor_name: " Jane Smith ", date: "2026-05-01" }),
        makeVisitorEntry({ id: "v-2", visitor_name: "Jane Smith", date: "2026-05-02" }),
      ],
      dateFrom,
      dateTo,
    );
    expect(result.unique_visitors).toBe(1);
  });

  it("groups entries by visitor type", () => {
    const result = computeVisitorSummary(
      [
        makeVisitorEntry({ visitor_type: "social_worker", date: "2026-05-01" }),
        makeVisitorEntry({ id: "v-2", visitor_type: "social_worker", date: "2026-05-02" }),
        makeVisitorEntry({ id: "v-3", visitor_type: "family_member", date: "2026-05-03" }),
      ],
      dateFrom,
      dateTo,
    );
    expect(result.by_type).toEqual({ social_worker: 2, family_member: 1 });
  });

  it("groups entries by purpose", () => {
    const result = computeVisitorSummary(
      [
        makeVisitorEntry({ purpose: "statutory_visit", date: "2026-05-01" }),
        makeVisitorEntry({ id: "v-2", purpose: "statutory_visit", date: "2026-05-02" }),
        makeVisitorEntry({ id: "v-3", purpose: "family_contact", date: "2026-05-03" }),
      ],
      dateFrom,
      dateTo,
    );
    expect(result.by_purpose).toEqual({ statutory_visit: 2, family_contact: 1 });
  });

  it("counts professional visits using VISITOR_TYPES professional flag", () => {
    const result = computeVisitorSummary(
      [
        makeVisitorEntry({ visitor_type: "social_worker", date: "2026-05-01" }),
        makeVisitorEntry({ id: "v-2", visitor_type: "iro", date: "2026-05-02" }),
        makeVisitorEntry({ id: "v-3", visitor_type: "family_member", date: "2026-05-03" }),
        makeVisitorEntry({ id: "v-4", visitor_type: "contractor", date: "2026-05-04" }),
      ],
      dateFrom,
      dateTo,
    );
    expect(result.professional_visits).toBe(2);
  });

  it("counts family visits (only family_member type)", () => {
    const result = computeVisitorSummary(
      [
        makeVisitorEntry({ visitor_type: "family_member", date: "2026-05-01" }),
        makeVisitorEntry({ id: "v-2", visitor_type: "family_member", date: "2026-05-02" }),
        makeVisitorEntry({ id: "v-3", visitor_type: "friend", date: "2026-05-03" }),
      ],
      dateFrom,
      dateTo,
    );
    expect(result.family_visits).toBe(2);
  });

  it("computes average duration from entries with positive duration_minutes", () => {
    const result = computeVisitorSummary(
      [
        makeVisitorEntry({ duration_minutes: 30, date: "2026-05-01" }),
        makeVisitorEntry({ id: "v-2", duration_minutes: 90, date: "2026-05-02" }),
      ],
      dateFrom,
      dateTo,
    );
    // (30 + 90) / 2 = 60
    expect(result.avg_duration_minutes).toBe(60);
  });

  it("excludes null and zero durations from average calculation", () => {
    const result = computeVisitorSummary(
      [
        makeVisitorEntry({ duration_minutes: 60, date: "2026-05-01" }),
        makeVisitorEntry({ id: "v-2", duration_minutes: null, date: "2026-05-02" }),
        makeVisitorEntry({ id: "v-3", duration_minutes: 0, date: "2026-05-03" }),
      ],
      dateFrom,
      dateTo,
    );
    // Only 60 counts, so avg = 60
    expect(result.avg_duration_minutes).toBe(60);
  });

  it("returns 0 avg_duration_minutes when no entries have valid duration", () => {
    const result = computeVisitorSummary(
      [
        makeVisitorEntry({ duration_minutes: null, date: "2026-05-01" }),
        makeVisitorEntry({ id: "v-2", duration_minutes: 0, date: "2026-05-02" }),
      ],
      dateFrom,
      dateTo,
    );
    expect(result.avg_duration_minutes).toBe(0);
  });

  it("rounds avg_duration_minutes to one decimal place", () => {
    const result = computeVisitorSummary(
      [
        makeVisitorEntry({ duration_minutes: 10, date: "2026-05-01" }),
        makeVisitorEntry({ id: "v-2", duration_minutes: 20, date: "2026-05-02" }),
        makeVisitorEntry({ id: "v-3", duration_minutes: 30, date: "2026-05-03" }),
      ],
      dateFrom,
      dateTo,
    );
    // (10 + 20 + 30) / 3 = 20
    expect(result.avg_duration_minutes).toBe(20);
  });

  it("identifies the busiest day", () => {
    const result = computeVisitorSummary(
      [
        makeVisitorEntry({ date: "2026-05-10" }),
        makeVisitorEntry({ id: "v-2", date: "2026-05-10" }),
        makeVisitorEntry({ id: "v-3", date: "2026-05-10" }),
        makeVisitorEntry({ id: "v-4", date: "2026-05-15" }),
      ],
      dateFrom,
      dateTo,
    );
    expect(result.busiest_day).toBe("2026-05-10");
  });

  it("returns null busiest_day when no entries match date range", () => {
    const result = computeVisitorSummary(
      [makeVisitorEntry({ date: "2026-04-01" })],
      dateFrom,
      dateTo,
    );
    expect(result.busiest_day).toBeNull();
  });

  it("tracks children visited by name", () => {
    const result = computeVisitorSummary(
      [
        makeVisitorEntry({ child_name: "Alex Turner", date: "2026-05-01" }),
        makeVisitorEntry({ id: "v-2", child_name: "Alex Turner", date: "2026-05-02" }),
        makeVisitorEntry({ id: "v-3", child_name: "Sam Brown", date: "2026-05-03" }),
      ],
      dateFrom,
      dateTo,
    );
    expect(result.children_visited).toEqual({ "Alex Turner": 2, "Sam Brown": 1 });
  });

  it("ignores null and empty child_name values", () => {
    const result = computeVisitorSummary(
      [
        makeVisitorEntry({ child_name: null, date: "2026-05-01" }),
        makeVisitorEntry({ id: "v-2", child_name: "", date: "2026-05-02" }),
        makeVisitorEntry({ id: "v-3", child_name: "   ", date: "2026-05-03" }),
        makeVisitorEntry({ id: "v-4", child_name: "Alex", date: "2026-05-04" }),
      ],
      dateFrom,
      dateTo,
    );
    expect(result.children_visited).toEqual({ "Alex": 1 });
  });

  it("trims child_name for children_visited tracking", () => {
    const result = computeVisitorSummary(
      [
        makeVisitorEntry({ child_name: " Alex Turner ", date: "2026-05-01" }),
        makeVisitorEntry({ id: "v-2", child_name: "Alex Turner", date: "2026-05-02" }),
      ],
      dateFrom,
      dateTo,
    );
    expect(result.children_visited).toEqual({ "Alex Turner": 2 });
  });
});

// ── computeVisitorCompliance ────────────────────────────────────────────

describe("computeVisitorCompliance", () => {
  it("returns zeroed counts with unmeasured rates for empty array", () => {
    const result = computeVisitorCompliance([]);
    expect(result.total_entries).toBe(0);
    expect(result.dbs_check_rate).toBeNull();
    expect(result.id_verification_rate).toBeNull();
    expect(result.sign_out_rate).toBeNull();
    expect(result.incomplete_entries).toBe(0);
  });

  it("counts total entries", () => {
    const result = computeVisitorCompliance([
      makeVisitorEntry(),
      makeVisitorEntry({ id: "v-2" }),
      makeVisitorEntry({ id: "v-3" }),
    ]);
    expect(result.total_entries).toBe(3);
  });

  it("computes dbs_check_rate for professional visitors only", () => {
    const result = computeVisitorCompliance([
      makeVisitorEntry({ visitor_type: "social_worker", dbs_checked: true }),
      makeVisitorEntry({ id: "v-2", visitor_type: "iro", dbs_checked: false }),
      makeVisitorEntry({ id: "v-3", visitor_type: "family_member", dbs_checked: false }),
    ]);
    // Professional: social_worker (checked) + iro (not checked) = 1/2 = 50%
    // family_member is non-professional, excluded from DBS rate
    expect(result.dbs_check_rate).toBe(50);
  });

  it("leaves dbs_check_rate unmeasured when no professional visitors exist", () => {
    const result = computeVisitorCompliance([
      makeVisitorEntry({ visitor_type: "family_member", dbs_checked: false }),
      makeVisitorEntry({ id: "v-2", visitor_type: "contractor", dbs_checked: false }),
    ]);
    expect(result.dbs_check_rate).toBeNull();
  });

  it("returns 100% dbs_check_rate when all professionals have DBS checked", () => {
    const result = computeVisitorCompliance([
      makeVisitorEntry({ visitor_type: "social_worker", dbs_checked: true }),
      makeVisitorEntry({ id: "v-2", visitor_type: "camhs", dbs_checked: true }),
    ]);
    expect(result.dbs_check_rate).toBe(100);
  });

  it("computes id_verification_rate for all visitors", () => {
    const result = computeVisitorCompliance([
      makeVisitorEntry({ id_verified: true }),
      makeVisitorEntry({ id: "v-2", id_verified: true }),
      makeVisitorEntry({ id: "v-3", id_verified: false }),
      makeVisitorEntry({ id: "v-4", id_verified: false }),
    ]);
    // 2/4 = 50%
    expect(result.id_verification_rate).toBe(50);
  });

  it("returns 100% id_verification_rate when all verified", () => {
    const result = computeVisitorCompliance([
      makeVisitorEntry({ id_verified: true }),
      makeVisitorEntry({ id: "v-2", id_verified: true }),
    ]);
    expect(result.id_verification_rate).toBe(100);
  });

  it("computes sign_out_rate based on departure_time presence", () => {
    const result = computeVisitorCompliance([
      makeVisitorEntry({ departure_time: "2026-05-01T11:00:00Z" }),
      makeVisitorEntry({ id: "v-2", departure_time: null }),
      makeVisitorEntry({ id: "v-3", departure_time: null }),
    ]);
    // 1/3 = 33.3%
    expect(result.sign_out_rate).toBe(33.3);
  });

  it("returns 100% sign_out_rate when all visitors have departed", () => {
    const result = computeVisitorCompliance([
      makeVisitorEntry({ departure_time: "2026-05-01T11:00:00Z" }),
      makeVisitorEntry({ id: "v-2", departure_time: "2026-05-01T12:00:00Z" }),
    ]);
    expect(result.sign_out_rate).toBe(100);
  });

  it("counts incomplete entries (missing departure_time)", () => {
    const result = computeVisitorCompliance([
      makeVisitorEntry({ departure_time: "2026-05-01T11:00:00Z" }),
      makeVisitorEntry({ id: "v-2", departure_time: null }),
      makeVisitorEntry({ id: "v-3", departure_time: null }),
    ]);
    expect(result.incomplete_entries).toBe(2);
  });

  it("returns 0 incomplete_entries when all have departure_time", () => {
    const result = computeVisitorCompliance([
      makeVisitorEntry({ departure_time: "2026-05-01T11:00:00Z" }),
    ]);
    expect(result.incomplete_entries).toBe(0);
  });

  it("rounds rates to one decimal place", () => {
    const result = computeVisitorCompliance([
      makeVisitorEntry({ id_verified: true }),
      makeVisitorEntry({ id: "v-2", id_verified: true }),
      makeVisitorEntry({ id: "v-3", id_verified: false }),
    ]);
    // 2/3 = 66.666... -> 66.7%
    expect(result.id_verification_rate).toBe(66.7);
  });
});

// ── identifyVisitorAlerts ───────────────────────────────────────────────

describe("identifyVisitorAlerts", () => {
  it("returns empty array for empty entries", () => {
    const result = identifyVisitorAlerts([]);
    // Even with empty entries we get no_reg44_visit since there are no reg44 entries
    const nonReg44 = result.filter((a) => a.type !== "no_reg44_visit");
    expect(nonReg44).toHaveLength(0);
  });

  it("generates no_reg44_visit alert when no reg44 visits exist", () => {
    const result = identifyVisitorAlerts([]);
    const reg44Alerts = result.filter((a) => a.type === "no_reg44_visit");
    expect(reg44Alerts).toHaveLength(1);
    expect(reg44Alerts[0].severity).toBe("high");
    expect(reg44Alerts[0].message).toContain("Reg 44");
  });

  it("generates no_reg44_visit alert when all reg44 visits are older than 30 days", () => {
    const result = identifyVisitorAlerts([
      makeVisitorEntry({
        visitor_type: "reg44_visitor",
        date: "2020-01-01",
      }),
    ]);
    const reg44Alerts = result.filter((a) => a.type === "no_reg44_visit");
    expect(reg44Alerts).toHaveLength(1);
  });

  it("does not generate no_reg44_visit alert when a recent reg44 visit exists", () => {
    const now = new Date();
    const recentDate = new Date(now);
    recentDate.setDate(now.getDate() - 5);
    const dateStr = recentDate.toISOString().slice(0, 10);

    const result = identifyVisitorAlerts([
      makeVisitorEntry({
        visitor_type: "reg44_visitor",
        date: dateStr,
      }),
    ]);
    const reg44Alerts = result.filter((a) => a.type === "no_reg44_visit");
    expect(reg44Alerts).toHaveLength(0);
  });

  it("generates dbs_not_checked alert for professional visitor without DBS", () => {
    const result = identifyVisitorAlerts([
      makeVisitorEntry({
        visitor_type: "social_worker",
        dbs_checked: false,
        visitor_name: "Dr Jones",
        // Use a recent reg44_visitor to suppress that alert
      }),
    ]);
    const dbsAlerts = result.filter((a) => a.type === "dbs_not_checked");
    expect(dbsAlerts).toHaveLength(1);
    expect(dbsAlerts[0].severity).toBe("high");
    expect(dbsAlerts[0].message).toContain("Dr Jones");
    expect(dbsAlerts[0].message).toContain("social_worker");
  });

  it("does not generate dbs_not_checked alert for non-professional visitor", () => {
    const result = identifyVisitorAlerts([
      makeVisitorEntry({
        visitor_type: "family_member",
        dbs_checked: false,
      }),
    ]);
    const dbsAlerts = result.filter((a) => a.type === "dbs_not_checked");
    expect(dbsAlerts).toHaveLength(0);
  });

  it("does not generate dbs_not_checked alert when dbs is checked", () => {
    const result = identifyVisitorAlerts([
      makeVisitorEntry({
        visitor_type: "social_worker",
        dbs_checked: true,
      }),
    ]);
    const dbsAlerts = result.filter((a) => a.type === "dbs_not_checked");
    expect(dbsAlerts).toHaveLength(0);
  });

  it("generates id_not_verified alert when id_verified is false", () => {
    const result = identifyVisitorAlerts([
      makeVisitorEntry({
        id_verified: false,
        visitor_name: "Unknown Person",
      }),
    ]);
    const idAlerts = result.filter((a) => a.type === "id_not_verified");
    expect(idAlerts).toHaveLength(1);
    expect(idAlerts[0].severity).toBe("medium");
    expect(idAlerts[0].message).toContain("Unknown Person");
  });

  it("does not generate id_not_verified alert when id_verified is true", () => {
    const result = identifyVisitorAlerts([
      makeVisitorEntry({ id_verified: true }),
    ]);
    const idAlerts = result.filter((a) => a.type === "id_not_verified");
    expect(idAlerts).toHaveLength(0);
  });

  it("generates visitor_not_signed_out alert for today's visitor with arrival > 4h ago and no departure", () => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    const result = identifyVisitorAlerts([
      makeVisitorEntry({
        date: todayStr,
        arrival_time: fiveHoursAgo.toISOString(),
        departure_time: null,
        visitor_name: "Lingering Larry",
      }),
    ]);
    const signOutAlerts = result.filter((a) => a.type === "visitor_not_signed_out");
    expect(signOutAlerts).toHaveLength(1);
    expect(signOutAlerts[0].severity).toBe("medium");
    expect(signOutAlerts[0].message).toContain("Lingering Larry");
  });

  it("does not generate visitor_not_signed_out for today's visitor arrived less than 4h ago", () => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const result = identifyVisitorAlerts([
      makeVisitorEntry({
        date: todayStr,
        arrival_time: twoHoursAgo.toISOString(),
        departure_time: null,
      }),
    ]);
    const signOutAlerts = result.filter((a) => a.type === "visitor_not_signed_out");
    expect(signOutAlerts).toHaveLength(0);
  });

  it("does not generate visitor_not_signed_out for past dates even without departure", () => {
    const result = identifyVisitorAlerts([
      makeVisitorEntry({
        date: "2020-01-01",
        arrival_time: "2020-01-01T08:00:00Z",
        departure_time: null,
      }),
    ]);
    const signOutAlerts = result.filter((a) => a.type === "visitor_not_signed_out");
    expect(signOutAlerts).toHaveLength(0);
  });

  it("does not generate visitor_not_signed_out when departure_time is set", () => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    const result = identifyVisitorAlerts([
      makeVisitorEntry({
        date: todayStr,
        arrival_time: fiveHoursAgo.toISOString(),
        departure_time: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      }),
    ]);
    const signOutAlerts = result.filter((a) => a.type === "visitor_not_signed_out");
    expect(signOutAlerts).toHaveLength(0);
  });

  it("generates high_volume alert when more than 5 visitors on a single day", () => {
    const result = identifyVisitorAlerts([
      makeVisitorEntry({ id: "v-1", date: "2026-05-01" }),
      makeVisitorEntry({ id: "v-2", date: "2026-05-01" }),
      makeVisitorEntry({ id: "v-3", date: "2026-05-01" }),
      makeVisitorEntry({ id: "v-4", date: "2026-05-01" }),
      makeVisitorEntry({ id: "v-5", date: "2026-05-01" }),
      makeVisitorEntry({ id: "v-6", date: "2026-05-01" }),
    ]);
    const volumeAlerts = result.filter((a) => a.type === "high_volume");
    expect(volumeAlerts).toHaveLength(1);
    expect(volumeAlerts[0].severity).toBe("low");
    expect(volumeAlerts[0].message).toContain("6 visitors");
    expect(volumeAlerts[0].message).toContain("2026-05-01");
  });

  it("does not generate high_volume alert for exactly 5 visitors on a day", () => {
    const result = identifyVisitorAlerts([
      makeVisitorEntry({ id: "v-1", date: "2026-05-01" }),
      makeVisitorEntry({ id: "v-2", date: "2026-05-01" }),
      makeVisitorEntry({ id: "v-3", date: "2026-05-01" }),
      makeVisitorEntry({ id: "v-4", date: "2026-05-01" }),
      makeVisitorEntry({ id: "v-5", date: "2026-05-01" }),
    ]);
    const volumeAlerts = result.filter((a) => a.type === "high_volume");
    expect(volumeAlerts).toHaveLength(0);
  });

  it("generates multiple alerts simultaneously from different checks", () => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    const result = identifyVisitorAlerts([
      makeVisitorEntry({
        visitor_type: "social_worker",
        dbs_checked: false,
        id_verified: false,
        date: todayStr,
        arrival_time: fiveHoursAgo.toISOString(),
        departure_time: null,
      }),
    ]);
    const types = result.map((a) => a.type);
    expect(types).toContain("dbs_not_checked");
    expect(types).toContain("id_not_verified");
    expect(types).toContain("visitor_not_signed_out");
    expect(types).toContain("no_reg44_visit");
  });

  it("generates high_volume alerts for multiple days independently", () => {
    const entries: VisitorEntry[] = [];
    for (let i = 0; i < 6; i++) {
      entries.push(makeVisitorEntry({ id: `a-${i}`, date: "2026-05-01" }));
    }
    for (let i = 0; i < 7; i++) {
      entries.push(makeVisitorEntry({ id: `b-${i}`, date: "2026-05-02" }));
    }
    const result = identifyVisitorAlerts(entries);
    const volumeAlerts = result.filter((a) => a.type === "high_volume");
    expect(volumeAlerts).toHaveLength(2);
  });
});
