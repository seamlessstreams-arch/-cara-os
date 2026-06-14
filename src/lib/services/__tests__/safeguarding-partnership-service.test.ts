// ══════════════════════════════════════════════════════════════════════════════
// CARA — SAFEGUARDING PARTNERSHIP INTELLIGENCE SERVICE TESTS
// Pure-function tests for safeguarding partnership metrics, alert identification,
// Cara insight generation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  REFERRAL_TYPES,
  REFERRAL_OUTCOMES,
  PARTNER_AGENCIES,
  URGENCY_LEVELS,
  _testing,
} from "../safeguarding-partnership-service";

import type {
  SafeguardingPartnershipRow,
} from "../safeguarding-partnership-service";

const {
  computeSafeguardingPartnershipMetrics,
  computeSafeguardingPartnershipAlerts,
  generateSafeguardingPartnershipCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<SafeguardingPartnershipRow>,
): SafeguardingPartnershipRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    child_name: "child_name" in (overrides ?? {}) ? overrides!.child_name! : "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : "child-1",
    referral_date: "referral_date" in (overrides ?? {}) ? overrides!.referral_date! : now.toISOString().split("T")[0],
    referral_type: "referral_type" in (overrides ?? {}) ? overrides!.referral_type! : "mash_referral",
    referral_outcome: "referral_outcome" in (overrides ?? {}) ? overrides!.referral_outcome! : "no_further_action",
    partner_agency: "partner_agency" in (overrides ?? {}) ? overrides!.partner_agency! : "social_services",
    urgency_level: "urgency_level" in (overrides ?? {}) ? overrides!.urgency_level! : "routine",
    lead_professional: "lead_professional" in (overrides ?? {}) ? (overrides!.lead_professional ?? null) : null,
    strategy_discussion_held: "strategy_discussion_held" in (overrides ?? {}) ? overrides!.strategy_discussion_held! : true,
    child_seen_alone: "child_seen_alone" in (overrides ?? {}) ? overrides!.child_seen_alone! : true,
    child_views_recorded: "child_views_recorded" in (overrides ?? {}) ? overrides!.child_views_recorded! : true,
    home_contributed_to_assessment: "home_contributed_to_assessment" in (overrides ?? {}) ? overrides!.home_contributed_to_assessment! : true,
    outcome_shared_with_home: "outcome_shared_with_home" in (overrides ?? {}) ? overrides!.outcome_shared_with_home! : true,
    follow_up_actions_agreed: "follow_up_actions_agreed" in (overrides ?? {}) ? overrides!.follow_up_actions_agreed! : true,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : now.toISOString(),
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : now.toISOString(),
  };
}

// ── computeSafeguardingPartnershipMetrics ──────────────────────────────────

describe("computeSafeguardingPartnershipMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_referrals", () => {
      const m = computeSafeguardingPartnershipMetrics([]);
      expect(m.total_referrals).toBe(0);
    });

    it("returns zero substantiated_count", () => {
      const m = computeSafeguardingPartnershipMetrics([]);
      expect(m.substantiated_count).toBe(0);
    });

    it("returns zero ongoing_count", () => {
      const m = computeSafeguardingPartnershipMetrics([]);
      expect(m.ongoing_count).toBe(0);
    });

    it("returns zero emergency_count", () => {
      const m = computeSafeguardingPartnershipMetrics([]);
      expect(m.emergency_count).toBe(0);
    });

    it("returns zero escalated_count", () => {
      const m = computeSafeguardingPartnershipMetrics([]);
      expect(m.escalated_count).toBe(0);
    });

    it("returns zero child_seen_alone_rate", () => {
      const m = computeSafeguardingPartnershipMetrics([]);
      expect(m.child_seen_alone_rate).toBe(0);
    });

    it("returns zero child_views_rate", () => {
      const m = computeSafeguardingPartnershipMetrics([]);
      expect(m.child_views_rate).toBe(0);
    });

    it("returns zero home_contributed_rate", () => {
      const m = computeSafeguardingPartnershipMetrics([]);
      expect(m.home_contributed_rate).toBe(0);
    });

    it("returns zero outcome_shared_rate", () => {
      const m = computeSafeguardingPartnershipMetrics([]);
      expect(m.outcome_shared_rate).toBe(0);
    });

    it("returns zero follow_up_agreed_rate", () => {
      const m = computeSafeguardingPartnershipMetrics([]);
      expect(m.follow_up_agreed_rate).toBe(0);
    });

    it("returns empty referral_type_breakdown", () => {
      const m = computeSafeguardingPartnershipMetrics([]);
      expect(m.referral_type_breakdown).toEqual({});
    });

    it("returns empty outcome_breakdown", () => {
      const m = computeSafeguardingPartnershipMetrics([]);
      expect(m.outcome_breakdown).toEqual({});
    });

    it("returns zero unique_children", () => {
      const m = computeSafeguardingPartnershipMetrics([]);
      expect(m.unique_children).toBe(0);
    });
  });

  describe("single row defaults", () => {
    it("returns total_referrals = 1", () => {
      const m = computeSafeguardingPartnershipMetrics([makeRow()]);
      expect(m.total_referrals).toBe(1);
    });

    it("returns 100% for all boolean rates with defaults", () => {
      const m = computeSafeguardingPartnershipMetrics([makeRow()]);
      expect(m.child_seen_alone_rate).toBe(100);
      expect(m.child_views_rate).toBe(100);
      expect(m.home_contributed_rate).toBe(100);
      expect(m.outcome_shared_rate).toBe(100);
      expect(m.follow_up_agreed_rate).toBe(100);
    });

    it("returns unique_children = 1", () => {
      const m = computeSafeguardingPartnershipMetrics([makeRow()]);
      expect(m.unique_children).toBe(1);
    });
  });

  describe("outcome counting", () => {
    it("counts substantiated", () => {
      const m = computeSafeguardingPartnershipMetrics([makeRow({ referral_outcome: "substantiated" })]);
      expect(m.substantiated_count).toBe(1);
    });

    it("counts ongoing_investigation", () => {
      const m = computeSafeguardingPartnershipMetrics([makeRow({ referral_outcome: "ongoing_investigation" })]);
      expect(m.ongoing_count).toBe(1);
    });

    it("counts escalated", () => {
      const m = computeSafeguardingPartnershipMetrics([makeRow({ referral_outcome: "escalated" })]);
      expect(m.escalated_count).toBe(1);
    });

    it("does not count no_further_action as substantiated", () => {
      const m = computeSafeguardingPartnershipMetrics([makeRow({ referral_outcome: "no_further_action" })]);
      expect(m.substantiated_count).toBe(0);
    });
  });

  describe("emergency counting", () => {
    it("counts emergency urgency", () => {
      const m = computeSafeguardingPartnershipMetrics([makeRow({ urgency_level: "emergency" })]);
      expect(m.emergency_count).toBe(1);
    });

    it("counts immediate_risk urgency", () => {
      const m = computeSafeguardingPartnershipMetrics([makeRow({ urgency_level: "immediate_risk" })]);
      expect(m.emergency_count).toBe(1);
    });

    it("does not count urgent as emergency", () => {
      const m = computeSafeguardingPartnershipMetrics([makeRow({ urgency_level: "urgent" })]);
      expect(m.emergency_count).toBe(0);
    });

    it("does not count routine as emergency", () => {
      const m = computeSafeguardingPartnershipMetrics([makeRow({ urgency_level: "routine" })]);
      expect(m.emergency_count).toBe(0);
    });

    it("does not count priority as emergency", () => {
      const m = computeSafeguardingPartnershipMetrics([makeRow({ urgency_level: "priority" })]);
      expect(m.emergency_count).toBe(0);
    });
  });

  describe("unique_children", () => {
    it("counts distinct children by name", () => {
      const rows = [makeRow({ child_name: "A" }), makeRow({ child_name: "B" }), makeRow({ child_name: "A" })];
      const m = computeSafeguardingPartnershipMetrics(rows);
      expect(m.unique_children).toBe(2);
    });

    it("returns 1 when all rows have the same child_name", () => {
      const rows = [makeRow({ child_name: "A" }), makeRow({ child_name: "A" }), makeRow({ child_name: "A" })];
      const m = computeSafeguardingPartnershipMetrics(rows);
      expect(m.unique_children).toBe(1);
    });
  });

  describe("boolean rates", () => {
    it("child_seen_alone_rate 0 when false", () => {
      const m = computeSafeguardingPartnershipMetrics([makeRow({ child_seen_alone: false })]);
      expect(m.child_seen_alone_rate).toBe(0);
    });

    it("child_views_rate 0 when false", () => {
      const m = computeSafeguardingPartnershipMetrics([makeRow({ child_views_recorded: false })]);
      expect(m.child_views_rate).toBe(0);
    });

    it("calculates mixed rates (2/3 = 66.7%)", () => {
      const rows = [
        makeRow({ child_seen_alone: true }),
        makeRow({ child_seen_alone: true }),
        makeRow({ child_seen_alone: false }),
      ];
      const m = computeSafeguardingPartnershipMetrics(rows);
      expect(m.child_seen_alone_rate).toBe(66.7);
    });

    it("calculates mixed rates (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ outcome_shared_with_home: true }),
        makeRow({ outcome_shared_with_home: false }),
        makeRow({ outcome_shared_with_home: false }),
      ];
      const m = computeSafeguardingPartnershipMetrics(rows);
      expect(m.outcome_shared_rate).toBe(33.3);
    });
  });

  describe("referral_type_breakdown", () => {
    it("counts all 10 types", () => {
      const rows = REFERRAL_TYPES.map((t) => makeRow({ referral_type: t }));
      const m = computeSafeguardingPartnershipMetrics(rows);
      for (const t of REFERRAL_TYPES) expect(m.referral_type_breakdown[t]).toBe(1);
    });

    it("counts duplicate referral types", () => {
      const rows = [
        makeRow({ referral_type: "mash_referral" }),
        makeRow({ referral_type: "mash_referral" }),
        makeRow({ referral_type: "marac" }),
      ];
      const m = computeSafeguardingPartnershipMetrics(rows);
      expect(m.referral_type_breakdown).toEqual({ mash_referral: 2, marac: 1 });
    });
  });

  describe("outcome_breakdown", () => {
    it("counts all 5 outcomes", () => {
      const rows = REFERRAL_OUTCOMES.map((o) => makeRow({ referral_outcome: o }));
      const m = computeSafeguardingPartnershipMetrics(rows);
      for (const o of REFERRAL_OUTCOMES) expect(m.outcome_breakdown[o]).toBe(1);
    });

    it("counts duplicate outcomes", () => {
      const rows = [
        makeRow({ referral_outcome: "substantiated" }),
        makeRow({ referral_outcome: "substantiated" }),
        makeRow({ referral_outcome: "escalated" }),
      ];
      const m = computeSafeguardingPartnershipMetrics(rows);
      expect(m.outcome_breakdown).toEqual({ substantiated: 2, escalated: 1 });
    });
  });
});

// ── computeSafeguardingPartnershipAlerts ───────────────────────────────────

describe("computeSafeguardingPartnershipAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeSafeguardingPartnershipAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are clean defaults", () => {
      const rows = [makeRow()];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("emergency_child_not_seen_alone alert", () => {
    it("fires for emergency urgency + child not seen alone", () => {
      const rows = [makeRow({ urgency_level: "emergency", child_seen_alone: false, child_name: "Child X" })];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const alert = alerts.find((a) => a.type === "emergency_child_not_seen_alone");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("critical");
      expect(alert!.message).toContain("Child X");
    });

    it("fires for immediate_risk urgency + child not seen alone", () => {
      const rows = [makeRow({ urgency_level: "immediate_risk", child_seen_alone: false })];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const alert = alerts.find((a) => a.type === "emergency_child_not_seen_alone");
      expect(alert).toBeDefined();
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "ref-1", urgency_level: "emergency", child_seen_alone: false })];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const alert = alerts.find((a) => a.type === "emergency_child_not_seen_alone")!;
      expect(alert.record_id).toBe("ref-1");
    });

    it("does not fire when child was seen alone", () => {
      const rows = [makeRow({ urgency_level: "emergency", child_seen_alone: true })];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const alert = alerts.find((a) => a.type === "emergency_child_not_seen_alone");
      expect(alert).toBeUndefined();
    });

    it("does not fire for routine urgency even if child not seen alone", () => {
      const rows = [makeRow({ urgency_level: "routine", child_seen_alone: false })];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const alert = alerts.find((a) => a.type === "emergency_child_not_seen_alone");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple emergency referrals", () => {
      const rows = [
        makeRow({ urgency_level: "emergency", child_seen_alone: false }),
        makeRow({ urgency_level: "immediate_risk", child_seen_alone: false }),
      ];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const critical = alerts.filter((a) => a.type === "emergency_child_not_seen_alone");
      expect(critical).toHaveLength(2);
    });
  });

  describe("substantiated_outcome_not_shared alert", () => {
    it("fires for substantiated outcome + outcome not shared", () => {
      const rows = [makeRow({ referral_outcome: "substantiated", outcome_shared_with_home: false, child_name: "Child Y" })];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const alert = alerts.find((a) => a.type === "substantiated_outcome_not_shared");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("high");
      expect(alert!.message).toContain("Child Y");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "ref-2", referral_outcome: "substantiated", outcome_shared_with_home: false })];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const alert = alerts.find((a) => a.type === "substantiated_outcome_not_shared")!;
      expect(alert.record_id).toBe("ref-2");
    });

    it("does not fire when outcome is shared", () => {
      const rows = [makeRow({ referral_outcome: "substantiated", outcome_shared_with_home: true })];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const alert = alerts.find((a) => a.type === "substantiated_outcome_not_shared");
      expect(alert).toBeUndefined();
    });

    it("does not fire for unsubstantiated outcome not shared", () => {
      const rows = [makeRow({ referral_outcome: "unsubstantiated", outcome_shared_with_home: false })];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const alert = alerts.find((a) => a.type === "substantiated_outcome_not_shared");
      expect(alert).toBeUndefined();
    });
  });

  describe("child_views_not_recorded alert", () => {
    it("fires when 2 or more referrals have child views not recorded", () => {
      const rows = [
        makeRow({ child_views_recorded: false }),
        makeRow({ child_views_recorded: false }),
      ];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_views_not_recorded");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("high");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ child_views_recorded: false }),
        makeRow({ child_views_recorded: false }),
        makeRow({ child_views_recorded: false }),
      ];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_views_not_recorded")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire for only 1 referral with child views not recorded", () => {
      const rows = [makeRow({ child_views_recorded: false })];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_views_not_recorded");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all have child views recorded", () => {
      const rows = [makeRow({ child_views_recorded: true }), makeRow({ child_views_recorded: true })];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_views_not_recorded");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert", () => {
      const rows = [
        makeRow({ child_views_recorded: false }),
        makeRow({ child_views_recorded: false }),
        makeRow({ child_views_recorded: false }),
      ];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const viewsAlerts = alerts.filter((a) => a.type === "child_views_not_recorded");
      expect(viewsAlerts).toHaveLength(1);
    });
  });

  describe("follow_up_not_agreed alert", () => {
    it("fires when 2 or more referrals have follow-up not agreed", () => {
      const rows = [
        makeRow({ follow_up_actions_agreed: false }),
        makeRow({ follow_up_actions_agreed: false }),
      ];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const alert = alerts.find((a) => a.type === "follow_up_not_agreed");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("medium");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ follow_up_actions_agreed: false }),
        makeRow({ follow_up_actions_agreed: false }),
        makeRow({ follow_up_actions_agreed: false }),
      ];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const alert = alerts.find((a) => a.type === "follow_up_not_agreed")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire for only 1 referral without follow-up", () => {
      const rows = [makeRow({ follow_up_actions_agreed: false })];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const alert = alerts.find((a) => a.type === "follow_up_not_agreed");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all have follow-up agreed", () => {
      const rows = [makeRow({ follow_up_actions_agreed: true }), makeRow({ follow_up_actions_agreed: true })];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const alert = alerts.find((a) => a.type === "follow_up_not_agreed");
      expect(alert).toBeUndefined();
    });
  });

  describe("combined alerts", () => {
    it("can fire all four alert types simultaneously", () => {
      const rows = [
        makeRow({ urgency_level: "emergency", child_seen_alone: false, referral_outcome: "substantiated", outcome_shared_with_home: false, child_views_recorded: false, follow_up_actions_agreed: false }),
        makeRow({ child_views_recorded: false, follow_up_actions_agreed: false }),
      ];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("emergency_child_not_seen_alone");
      expect(types).toContain("substantiated_outcome_not_shared");
      expect(types).toContain("child_views_not_recorded");
      expect(types).toContain("follow_up_not_agreed");
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ urgency_level: "emergency", child_seen_alone: false, referral_outcome: "substantiated", outcome_shared_with_home: false }),
      ];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({ urgency_level: "emergency", child_seen_alone: false, child_views_recorded: false, follow_up_actions_agreed: false }),
        makeRow({ child_views_recorded: false, follow_up_actions_agreed: false }),
      ];
      const alerts = computeSafeguardingPartnershipAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });
  });
});

// ── generateSafeguardingPartnershipCaraInsights ───────────────────────────

describe("generateSafeguardingPartnershipCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const metrics = computeSafeguardingPartnershipMetrics([]);
    const alerts = computeSafeguardingPartnershipAlerts([]);
    const insights = generateSafeguardingPartnershipCaraInsights(metrics, alerts);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [cyan]", () => {
    const metrics = computeSafeguardingPartnershipMetrics([makeRow()]);
    const alerts = computeSafeguardingPartnershipAlerts([makeRow()]);
    const insights = generateSafeguardingPartnershipCaraInsights(metrics, alerts);
    expect(insights[0]).toMatch(/^\[cyan\]/);
  });

  it("first insight includes total_referrals count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const metrics = computeSafeguardingPartnershipMetrics(rows);
    const alerts = computeSafeguardingPartnershipAlerts(rows);
    const insights = generateSafeguardingPartnershipCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes unique_children count", () => {
    const rows = [makeRow({ child_name: "A" }), makeRow({ child_name: "B" })];
    const metrics = computeSafeguardingPartnershipMetrics(rows);
    const alerts = computeSafeguardingPartnershipAlerts(rows);
    const insights = generateSafeguardingPartnershipCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("2 unique children");
  });

  it("first insight uses singular child wording when 1 unique child", () => {
    const rows = [makeRow({ child_name: "A" })];
    const metrics = computeSafeguardingPartnershipMetrics(rows);
    const alerts = computeSafeguardingPartnershipAlerts(rows);
    const insights = generateSafeguardingPartnershipCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("1 unique child");
  });

  it("second insight starts with [amber]", () => {
    const metrics = computeSafeguardingPartnershipMetrics([makeRow()]);
    const alerts = computeSafeguardingPartnershipAlerts([makeRow()]);
    const insights = generateSafeguardingPartnershipCaraInsights(metrics, alerts);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions critical and high alerts when present", () => {
    const rows = [
      makeRow({ urgency_level: "emergency", child_seen_alone: false, referral_outcome: "substantiated", outcome_shared_with_home: false }),
    ];
    const metrics = computeSafeguardingPartnershipMetrics(rows);
    const alerts = computeSafeguardingPartnershipAlerts(rows);
    const insights = generateSafeguardingPartnershipCaraInsights(metrics, alerts);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high");
  });

  it("second insight mentions no alerts when none present", () => {
    const rows = [makeRow()];
    const metrics = computeSafeguardingPartnershipMetrics(rows);
    const alerts = computeSafeguardingPartnershipAlerts(rows);
    const insights = generateSafeguardingPartnershipCaraInsights(metrics, alerts);
    expect(insights[1]).toContain("No critical or high-priority alerts");
  });

  it("third insight starts with [reflect]", () => {
    const metrics = computeSafeguardingPartnershipMetrics([makeRow()]);
    const alerts = computeSafeguardingPartnershipAlerts([makeRow()]);
    const insights = generateSafeguardingPartnershipCaraInsights(metrics, alerts);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions emergency referrals when emergency_count > 0", () => {
    const rows = [makeRow({ urgency_level: "emergency" })];
    const metrics = computeSafeguardingPartnershipMetrics(rows);
    const alerts = computeSafeguardingPartnershipAlerts(rows);
    const insights = generateSafeguardingPartnershipCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("emergency");
  });

  it("third insight asks about information sharing when no emergencies but outcome_shared_rate < 100", () => {
    const rows = [
      makeRow({ urgency_level: "routine", outcome_shared_with_home: false }),
      makeRow({ urgency_level: "routine", outcome_shared_with_home: true }),
    ];
    const metrics = computeSafeguardingPartnershipMetrics(rows);
    const alerts = computeSafeguardingPartnershipAlerts(rows);
    const insights = generateSafeguardingPartnershipCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("information sharing");
  });

  it("third insight celebrates strong collaboration when all outcomes shared and no emergencies", () => {
    const rows = [
      makeRow({ urgency_level: "routine", outcome_shared_with_home: true }),
      makeRow({ urgency_level: "routine", outcome_shared_with_home: true }),
    ];
    const metrics = computeSafeguardingPartnershipMetrics(rows);
    const alerts = computeSafeguardingPartnershipAlerts(rows);
    const insights = generateSafeguardingPartnershipCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("shared and followed up effectively");
  });

  it("uses singular referral wording when 1 emergency", () => {
    const rows = [makeRow({ urgency_level: "emergency" })];
    const metrics = computeSafeguardingPartnershipMetrics(rows);
    const alerts = computeSafeguardingPartnershipAlerts(rows);
    const insights = generateSafeguardingPartnershipCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("referral has");
  });

  it("uses plural referrals wording when multiple emergencies", () => {
    const rows = [
      makeRow({ urgency_level: "emergency" }),
      makeRow({ urgency_level: "immediate_risk" }),
    ];
    const metrics = computeSafeguardingPartnershipMetrics(rows);
    const alerts = computeSafeguardingPartnershipAlerts(rows);
    const insights = generateSafeguardingPartnershipCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("referrals have");
  });

  it("all insights are non-empty strings", () => {
    const metrics = computeSafeguardingPartnershipMetrics([makeRow()]);
    const alerts = computeSafeguardingPartnershipAlerts([makeRow()]);
    const insights = generateSafeguardingPartnershipCaraInsights(metrics, alerts);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });
});

// ── Enum constants ───────────────────────────────────────────────────────

describe("Enum constants", () => {
  it("REFERRAL_TYPES has exactly 10 items", () => {
    expect(REFERRAL_TYPES).toHaveLength(10);
  });

  it("REFERRAL_OUTCOMES has exactly 5 items", () => {
    expect(REFERRAL_OUTCOMES).toHaveLength(5);
  });

  it("PARTNER_AGENCIES has exactly 10 items", () => {
    expect(PARTNER_AGENCIES).toHaveLength(10);
  });

  it("URGENCY_LEVELS has exactly 5 items", () => {
    expect(URGENCY_LEVELS).toHaveLength(5);
  });

  it("REFERRAL_TYPES values are unique", () => {
    expect(new Set(REFERRAL_TYPES).size).toBe(REFERRAL_TYPES.length);
  });

  it("REFERRAL_OUTCOMES values are unique", () => {
    expect(new Set(REFERRAL_OUTCOMES).size).toBe(REFERRAL_OUTCOMES.length);
  });

  it("PARTNER_AGENCIES values are unique", () => {
    expect(new Set(PARTNER_AGENCIES).size).toBe(PARTNER_AGENCIES.length);
  });

  it("URGENCY_LEVELS values are unique", () => {
    expect(new Set(URGENCY_LEVELS).size).toBe(URGENCY_LEVELS.length);
  });
});

// ── Factory helper validation ────────────────────────────────────────────

describe("makeRow factory helper", () => {
  it("creates a row with sensible defaults", () => {
    const r = makeRow();
    expect(r.home_id).toBe("home-1");
    expect(r.child_name).toBe("Child A");
    expect(r.child_id).toBe("child-1");
    expect(r.referral_type).toBe("mash_referral");
    expect(r.referral_outcome).toBe("no_further_action");
    expect(r.partner_agency).toBe("social_services");
    expect(r.urgency_level).toBe("routine");
    expect(r.lead_professional).toBeNull();
    expect(r.strategy_discussion_held).toBe(true);
    expect(r.child_seen_alone).toBe(true);
    expect(r.child_views_recorded).toBe(true);
    expect(r.home_contributed_to_assessment).toBe(true);
    expect(r.outcome_shared_with_home).toBe(true);
    expect(r.follow_up_actions_agreed).toBe(true);
    expect(r.next_review_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRow({ referral_type: "marac", urgency_level: "emergency" });
    expect(r.referral_type).toBe("marac");
    expect(r.urgency_level).toBe("emergency");
    // defaults still apply
    expect(r.partner_agency).toBe("social_services");
  });

  it("generates unique ids by default", () => {
    const r1 = makeRow();
    const r2 = makeRow();
    expect(r1.id).not.toBe(r2.id);
  });

  it("allows overriding id", () => {
    const r = makeRow({ id: "custom-id" });
    expect(r.id).toBe("custom-id");
  });

  it("allows setting nullable fields to null", () => {
    const r = makeRow({ lead_professional: null, next_review_date: null, notes: null });
    expect(r.lead_professional).toBeNull();
    expect(r.next_review_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting nullable fields to values", () => {
    const r = makeRow({ lead_professional: "Dr Smith", next_review_date: "2026-06-01", notes: "Important case" });
    expect(r.lead_professional).toBe("Dr Smith");
    expect(r.next_review_date).toBe("2026-06-01");
    expect(r.notes).toBe("Important case");
  });
});
