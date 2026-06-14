import { describe, expect, it } from "vitest";
import {
  computeHqOverview,
  isBreakGlassOpen,
  summariseAiUsage,
  summariseApiCalls,
  summariseBreakGlass,
  summariseCustomers,
  summariseDecisions,
  summariseUsage,
} from "../platform-hq-engine";
import type {
  HqAiUsageRow,
  HqApiCallRow,
  HqBreakGlassGrant,
  HqDecisionRow,
  HqOrganisation,
  HqUsageEvent,
} from "@/lib/hq/hq-types";

const NOW = "2026-06-12T12:00:00.000Z";

function org(over: Partial<HqOrganisation> = {}): HqOrganisation {
  return {
    id: "org_1",
    name: "Test Org",
    plan: "pilot",
    status: "active",
    primary_contact_name: null,
    primary_contact_email: null,
    first_home_name: null,
    created_at: "2026-05-01T00:00:00.000Z",
    updated_at: "2026-05-01T00:00:00.000Z",
    ...over,
  };
}

function event(at: string, kind = "sign_in"): HqUsageEvent {
  return { id: `u_${at}_${kind}`, at, org_id: "org_1", user_label: null, kind, meta: {} };
}

function aiRow(over: Partial<HqAiUsageRow> = {}): HqAiUsageRow {
  return {
    id: "aiu_1",
    at: "2026-06-12T10:00:00.000Z",
    org_id: "org_1",
    feature: "cara_text",
    model: "claude-sonnet-4-6",
    tokens_input: 1000,
    tokens_output: 500,
    cost_gbp: 0.0084,
    estimated: true,
    ...over,
  };
}

function apiCall(at: string, over: Partial<HqApiCallRow> = {}): HqApiCallRow {
  return { id: `api_${at}`, at, org_id: "org_1", feature: "incidents", method: "GET", intelligence: false, ...over };
}

function decision(at: string, mode: "deterministic" | "ai" = "deterministic", over: Partial<HqDecisionRow> = {}): HqDecisionRow {
  return { id: `dec_${at}_${mode}`, at, org_id: "org_1", feature: "incident-draft", mode, ...over };
}

function grant(over: Partial<HqBreakGlassGrant> = {}): HqBreakGlassGrant {
  return {
    id: "bg_1",
    admin_label: "Owner",
    org_id: "org_1",
    reason: "Support investigation of sync failure",
    granted_at: "2026-06-12T09:00:00.000Z",
    expires_at: "2026-06-12T17:00:00.000Z",
    revoked_at: null,
    ...over,
  };
}

describe("platform-hq-engine", () => {
  it("summarises customers by status and plan", () => {
    const s = summariseCustomers([
      org(),
      org({ id: "org_2", status: "suspended", plan: "professional" }),
      org({ id: "org_3", status: "churned" }),
      org({ id: "org_4", plan: "pilot" }),
    ]);
    expect(s.total).toBe(4);
    expect(s.active).toBe(2);
    expect(s.suspended).toBe(1);
    expect(s.churned).toBe(1);
    expect(s.by_plan[0]).toEqual({ plan: "pilot", count: 3 });
  });

  it("buckets usage events into 24h/7d/30d windows", () => {
    const s = summariseUsage(
      [
        event("2026-06-12T08:00:00.000Z"), // 4h ago
        event("2026-06-10T08:00:00.000Z"), // 2d ago
        event("2026-05-20T08:00:00.000Z"), // 23d ago
        event("2026-04-01T08:00:00.000Z"), // outside 30d
      ],
      NOW,
    );
    expect(s.events_24h).toBe(1);
    expect(s.events_7d).toBe(2);
    expect(s.events_30d).toBe(3);
  });

  it("ignores future-dated and unparseable events", () => {
    const s = summariseUsage(
      [event("2026-06-13T08:00:00.000Z"), event("not-a-date")],
      NOW,
    );
    expect(s.events_30d).toBe(0);
  });

  it("rolls AI cost up by feature and org, always flagged estimated", () => {
    const s = summariseAiUsage(
      [
        aiRow({ id: "a1", feature: "report_narrative", cost_gbp: 0.02 }),
        aiRow({ id: "a2", feature: "report_narrative", cost_gbp: 0.03 }),
        aiRow({ id: "a3", feature: "cara_text", cost_gbp: 0.01, org_id: "org_2" }),
        aiRow({ id: "a4", at: "2026-04-01T00:00:00.000Z", cost_gbp: 99 }), // outside window
      ],
      NOW,
    );
    expect(s.calls_30d).toBe(3);
    expect(s.cost_30d_gbp).toBeCloseTo(0.06, 4);
    expect(s.by_feature[0]).toMatchObject({ feature: "report_narrative", cost_gbp: 0.05, calls: 2 });
    expect(s.by_org.find((o) => o.org_id === "org_2")?.cost_gbp).toBeCloseTo(0.01, 4);
    expect(s.estimated).toBe(true);
  });

  it("treats unexpired, unrevoked grants as open", () => {
    expect(isBreakGlassOpen(grant(), NOW)).toBe(true);
    expect(isBreakGlassOpen(grant({ revoked_at: "2026-06-12T10:00:00.000Z" }), NOW)).toBe(false);
    expect(isBreakGlassOpen(grant({ expires_at: "2026-06-12T11:00:00.000Z" }), NOW)).toBe(false);
  });

  it("lists open grants newest-first and caps recent at 10", () => {
    const grants = Array.from({ length: 12 }, (_, i) =>
      grant({ id: `bg_${i}`, granted_at: `2026-06-0${(i % 9) + 1}T09:00:00.000Z` }),
    );
    const s = summariseBreakGlass(grants, NOW);
    expect(s.recent).toHaveLength(10);
    expect(s.open_count).toBe(12); // none revoked, all expire 17:00 today
    expect(s.open[0].granted_at >= s.open[1].granted_at).toBe(true);
  });

  it("computeHqOverview flags suspended customers and open break-glass", () => {
    const o = computeHqOverview({
      organisations: [org(), org({ id: "org_2", status: "suspended" })],
      usageEvents: [event("2026-06-12T08:00:00.000Z")],
      aiUsage: [],
      apiCalls: [],
      decisions: [],
      breakGlass: [grant()],
      now: NOW,
    });
    expect(o.attention.some((a) => a.includes("suspended"))).toBe(true);
    expect(o.attention.some((a) => a.includes("break-glass"))).toBe(true);
    expect(o.customers.total).toBe(2);
    expect(o.break_glass.open_count).toBe(1);
  });

  it("flags zero 24h activity when there are active customers", () => {
    const o = computeHqOverview({
      organisations: [org()],
      usageEvents: [event("2026-05-01T08:00:00.000Z")],
      aiUsage: [],
      apiCalls: [],
      decisions: [],
      breakGlass: [],
      now: NOW,
    });
    expect(o.attention.some((a) => a.includes("No recorded activity"))).toBe(true);
  });

  it("stays quiet when everything is healthy", () => {
    const o = computeHqOverview({
      organisations: [org()],
      usageEvents: [event("2026-06-12T08:00:00.000Z")],
      aiUsage: [aiRow()],
      apiCalls: [apiCall("2026-06-12T08:00:00.000Z")],
      decisions: [decision("2026-06-12T08:00:00.000Z")],
      breakGlass: [grant({ revoked_at: "2026-06-12T10:00:00.000Z" })],
      now: NOW,
    });
    expect(o.attention).toHaveLength(0);
    expect(o.ai.cost_30d_gbp).toBeGreaterThan(0);
  });

  it("buckets API calls into windows and counts intelligence endpoints", () => {
    const s = summariseApiCalls(
      [
        apiCall("2026-06-12T08:00:00.000Z"), // 4h
        apiCall("2026-06-10T08:00:00.000Z", { feature: "home-safeguarding-intelligence", intelligence: true }), // 2d
        apiCall("2026-05-20T08:00:00.000Z"), // 23d
        apiCall("2026-04-01T08:00:00.000Z"), // outside 30d
      ],
      NOW,
    );
    expect(s.calls_24h).toBe(1);
    expect(s.calls_7d).toBe(2);
    expect(s.calls_30d).toBe(3);
    expect(s.intelligence_30d).toBe(1);
    expect(s.by_feature_30d.find((f) => f.feature === "incidents")?.count).toBe(2);
  });

  it("splits decisions into deterministic vs AI with a percentage", () => {
    const s = summariseDecisions(
      [
        decision("2026-06-12T08:00:00.000Z"),
        decision("2026-06-11T08:00:00.000Z"),
        decision("2026-06-10T08:00:00.000Z"),
        decision("2026-06-12T09:00:00.000Z", "ai"),
        decision("2026-04-01T08:00:00.000Z"), // outside 30d
      ],
      NOW,
    );
    expect(s.total_30d).toBe(4);
    expect(s.deterministic_30d).toBe(3);
    expect(s.ai_30d).toBe(1);
    expect(s.deterministic_pct).toBe(75);
  });

  it("reports 100% deterministic when there are no decisions (honest default)", () => {
    const s = summariseDecisions([], NOW);
    expect(s.total_30d).toBe(0);
    expect(s.deterministic_pct).toBe(100);
  });
});
