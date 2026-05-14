import { describe, it, expect } from "vitest";
import { _testing, type SafeguardingReferralRecord } from "../safeguarding-referral-service";

const { computeSafeguardingReferralMetrics, identifySafeguardingReferralAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<SafeguardingReferralRecord>): SafeguardingReferralRecord {
  return {
    id: overrides?.id ?? "r-1",
    home_id: overrides?.home_id ?? "home-1",
    referral_type: overrides?.referral_type ?? "mash_referral",
    referral_outcome: overrides?.referral_outcome ?? "pending",
    referral_urgency: overrides?.referral_urgency ?? "routine",
    concern_category: overrides?.concern_category ?? "other",
    referral_date: overrides?.referral_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : "child-1",
    referred_to_agency: overrides?.referred_to_agency ?? "MASH Team",
    referral_reference: "referral_reference" in (overrides ?? {}) ? (overrides!.referral_reference ?? null) : null,
    referral_timely: overrides?.referral_timely ?? true,
    consent_obtained: overrides?.consent_obtained ?? true,
    consent_not_required_reason: "consent_not_required_reason" in (overrides ?? {}) ? (overrides!.consent_not_required_reason ?? null) : null,
    information_shared_appropriately: overrides?.information_shared_appropriately ?? true,
    manager_informed: overrides?.manager_informed ?? true,
    ofsted_notified: overrides?.ofsted_notified ?? true,
    lado_consulted: overrides?.lado_consulted ?? true,
    strategy_meeting_held: overrides?.strategy_meeting_held ?? true,
    child_informed: overrides?.child_informed ?? true,
    parents_informed: overrides?.parents_informed ?? true,
    outcome_communicated: overrides?.outcome_communicated ?? true,
    follow_up_required: overrides?.follow_up_required ?? false,
    issues_found: overrides?.issues_found ?? [],
    actions_taken: overrides?.actions_taken ?? [],
    referred_by: overrides?.referred_by ?? "Staff A",
    response_date: "response_date" in (overrides ?? {}) ? (overrides!.response_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("safeguarding-referral-service", () => {
  describe("computeSafeguardingReferralMetrics", () => {
    describe("empty records", () => {
      it("returns zeros for all fields", () => {
        const m = computeSafeguardingReferralMetrics([]);
        expect(m.total_referrals).toBe(0);
        expect(m.investigation_count).toBe(0);
        expect(m.nfa_count).toBe(0);
        expect(m.pending_count).toBe(0);
        expect(m.immediate_urgency_count).toBe(0);
        expect(m.timely_rate).toBe(0);
        expect(m.consent_obtained_rate).toBe(0);
        expect(m.information_shared_rate).toBe(0);
        expect(m.manager_informed_rate).toBe(0);
        expect(m.ofsted_notified_rate).toBe(0);
        expect(m.lado_consulted_rate).toBe(0);
        expect(m.strategy_meeting_rate).toBe(0);
        expect(m.outcome_communicated_rate).toBe(0);
        expect(m.follow_up_required_count).toBe(0);
        expect(m.unique_children).toBe(0);
      });

      it("returns empty breakdowns", () => {
        const m = computeSafeguardingReferralMetrics([]);
        expect(m.by_referral_type).toEqual({});
        expect(m.by_referral_outcome).toEqual({});
        expect(m.by_referral_urgency).toEqual({});
        expect(m.by_concern_category).toEqual({});
      });
    });

    describe("single record defaults", () => {
      it("returns correct counts", () => {
        const m = computeSafeguardingReferralMetrics([makeRecord()]);
        expect(m.total_referrals).toBe(1);
        expect(m.pending_count).toBe(1);
        expect(m.investigation_count).toBe(0);
        expect(m.nfa_count).toBe(0);
        expect(m.immediate_urgency_count).toBe(0);
        expect(m.follow_up_required_count).toBe(0);
        expect(m.unique_children).toBe(1);
      });

      it("returns 100% for all boolean rates with defaults", () => {
        const m = computeSafeguardingReferralMetrics([makeRecord()]);
        expect(m.timely_rate).toBe(100);
        expect(m.consent_obtained_rate).toBe(100);
        expect(m.information_shared_rate).toBe(100);
        expect(m.manager_informed_rate).toBe(100);
        expect(m.ofsted_notified_rate).toBe(100);
        expect(m.lado_consulted_rate).toBe(100);
        expect(m.strategy_meeting_rate).toBe(100);
        expect(m.outcome_communicated_rate).toBe(100);
      });
    });

    describe("outcome counting", () => {
      it("counts investigation_opened", () => {
        const m = computeSafeguardingReferralMetrics([makeRecord({ referral_outcome: "investigation_opened" })]);
        expect(m.investigation_count).toBe(1);
      });
      it("counts no_further_action", () => {
        const m = computeSafeguardingReferralMetrics([makeRecord({ referral_outcome: "no_further_action" })]);
        expect(m.nfa_count).toBe(1);
      });
      it("counts pending", () => {
        const m = computeSafeguardingReferralMetrics([makeRecord({ referral_outcome: "pending" })]);
        expect(m.pending_count).toBe(1);
      });
    });

    describe("urgency counting", () => {
      it("counts immediate", () => {
        const m = computeSafeguardingReferralMetrics([makeRecord({ referral_urgency: "immediate" })]);
        expect(m.immediate_urgency_count).toBe(1);
      });
      it("does not count within_24_hours as immediate", () => {
        const m = computeSafeguardingReferralMetrics([makeRecord({ referral_urgency: "within_24_hours" })]);
        expect(m.immediate_urgency_count).toBe(0);
      });
    });

    describe("unique_children", () => {
      it("counts distinct children", () => {
        const records = [makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })];
        const m = computeSafeguardingReferralMetrics(records);
        expect(m.unique_children).toBe(2);
      });
    });

    describe("follow_up_required_count", () => {
      it("counts when true", () => {
        const m = computeSafeguardingReferralMetrics([makeRecord({ follow_up_required: true })]);
        expect(m.follow_up_required_count).toBe(1);
      });
    });

    describe("boolean rates", () => {
      it("timely_rate 0 when false", () => {
        const m = computeSafeguardingReferralMetrics([makeRecord({ referral_timely: false })]);
        expect(m.timely_rate).toBe(0);
      });
      it("ofsted_notified_rate 0 when false", () => {
        const m = computeSafeguardingReferralMetrics([makeRecord({ ofsted_notified: false })]);
        expect(m.ofsted_notified_rate).toBe(0);
      });
      it("lado_consulted_rate 0 when false", () => {
        const m = computeSafeguardingReferralMetrics([makeRecord({ lado_consulted: false })]);
        expect(m.lado_consulted_rate).toBe(0);
      });
      it("calculates mixed rates", () => {
        const records = [makeRecord({ ofsted_notified: true }), makeRecord({ ofsted_notified: false }), makeRecord({ ofsted_notified: true })];
        const m = computeSafeguardingReferralMetrics(records);
        expect(m.ofsted_notified_rate).toBe(66.7);
      });
    });

    describe("by_referral_type breakdown", () => {
      it("counts all 10 types", () => {
        const types = ["lado_referral", "mash_referral", "police_referral", "social_services", "nspcc_referral", "health_referral", "education_referral", "self_referral", "anonymous_referral", "other"] as const;
        const records = types.map((t) => makeRecord({ referral_type: t }));
        const m = computeSafeguardingReferralMetrics(records);
        for (const t of types) expect(m.by_referral_type[t]).toBe(1);
      });
    });

    describe("by_referral_outcome breakdown", () => {
      it("counts all 5 outcomes", () => {
        const outcomes = ["investigation_opened", "assessment_completed", "no_further_action", "ongoing_monitoring", "pending"] as const;
        const records = outcomes.map((o) => makeRecord({ referral_outcome: o }));
        const m = computeSafeguardingReferralMetrics(records);
        for (const o of outcomes) expect(m.by_referral_outcome[o]).toBe(1);
      });
    });

    describe("by_referral_urgency breakdown", () => {
      it("counts all 5 urgencies", () => {
        const urgencies = ["immediate", "within_24_hours", "within_48_hours", "within_1_week", "routine"] as const;
        const records = urgencies.map((u) => makeRecord({ referral_urgency: u }));
        const m = computeSafeguardingReferralMetrics(records);
        for (const u of urgencies) expect(m.by_referral_urgency[u]).toBe(1);
      });
    });

    describe("by_concern_category breakdown", () => {
      it("counts all 10 categories", () => {
        const categories = ["physical_abuse", "emotional_abuse", "sexual_abuse", "neglect", "exploitation", "self_harm", "radicalisation", "peer_on_peer", "online_harm", "other"] as const;
        const records = categories.map((c) => makeRecord({ concern_category: c }));
        const m = computeSafeguardingReferralMetrics(records);
        for (const c of categories) expect(m.by_concern_category[c]).toBe(1);
      });
    });
  });

  describe("identifySafeguardingReferralAlerts", () => {
    describe("no alerts", () => {
      it("returns empty for clean records", () => {
        expect(identifySafeguardingReferralAlerts([makeRecord()])).toEqual([]);
      });
      it("returns empty for empty records", () => {
        expect(identifySafeguardingReferralAlerts([])).toEqual([]);
      });
    });

    describe("untimely_immediate_referral alert", () => {
      it("fires for untimely immediate referral", () => {
        const alerts = identifySafeguardingReferralAlerts([makeRecord({ referral_urgency: "immediate", referral_timely: false, child_name: "Child X", referral_date: "2026-05-14" })]);
        expect(alerts).toHaveLength(1);
        expect(alerts[0].type).toBe("untimely_immediate_referral");
        expect(alerts[0].severity).toBe("critical");
        expect(alerts[0].message).toContain("Child X");
        expect(alerts[0].message).toContain("2026-05-14");
      });
      it("fires per-record", () => {
        const alerts = identifySafeguardingReferralAlerts([
          makeRecord({ id: "r-1", referral_urgency: "immediate", referral_timely: false }),
          makeRecord({ id: "r-2", referral_urgency: "immediate", referral_timely: false }),
        ]);
        const u = alerts.filter((a) => a.type === "untimely_immediate_referral");
        expect(u).toHaveLength(2);
      });
      it("does not fire for timely immediate", () => {
        const alerts = identifySafeguardingReferralAlerts([makeRecord({ referral_urgency: "immediate", referral_timely: true })]);
        const u = alerts.filter((a) => a.type === "untimely_immediate_referral");
        expect(u).toHaveLength(0);
      });
      it("does not fire for untimely non-immediate", () => {
        const alerts = identifySafeguardingReferralAlerts([makeRecord({ referral_urgency: "routine", referral_timely: false })]);
        const u = alerts.filter((a) => a.type === "untimely_immediate_referral");
        expect(u).toHaveLength(0);
      });
    });

    describe("ofsted_not_notified alert", () => {
      it("fires for 1 not notified", () => {
        const alerts = identifySafeguardingReferralAlerts([makeRecord({ ofsted_notified: false })]);
        const a = alerts.find((x) => x.type === "ofsted_not_notified");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("high");
        expect(a!.message).toContain("1 referral has");
      });
      it("uses plural for 2+", () => {
        const alerts = identifySafeguardingReferralAlerts([makeRecord({ ofsted_notified: false }), makeRecord({ ofsted_notified: false })]);
        const a = alerts.find((x) => x.type === "ofsted_not_notified");
        expect(a!.message).toContain("2 referrals have");
      });
    });

    describe("lado_not_consulted alert", () => {
      it("fires for 1 not consulted", () => {
        const alerts = identifySafeguardingReferralAlerts([makeRecord({ lado_consulted: false })]);
        const a = alerts.find((x) => x.type === "lado_not_consulted");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("high");
        expect(a!.message).toContain("1 referral has");
      });
      it("uses plural for 2+", () => {
        const alerts = identifySafeguardingReferralAlerts([makeRecord({ lado_consulted: false }), makeRecord({ lado_consulted: false })]);
        const a = alerts.find((x) => x.type === "lado_not_consulted");
        expect(a!.message).toContain("2 referrals have");
      });
    });

    describe("information_not_shared alert", () => {
      it("does not fire for 1", () => {
        const alerts = identifySafeguardingReferralAlerts([makeRecord({ information_shared_appropriately: false })]);
        const a = alerts.find((x) => x.type === "information_not_shared");
        expect(a).toBeUndefined();
      });
      it("fires for 2", () => {
        const alerts = identifySafeguardingReferralAlerts([
          makeRecord({ information_shared_appropriately: false }),
          makeRecord({ information_shared_appropriately: false }),
        ]);
        const a = alerts.find((x) => x.type === "information_not_shared");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("medium");
      });
    });

    describe("outcome_not_communicated alert", () => {
      it("does not fire for 2", () => {
        const alerts = identifySafeguardingReferralAlerts([makeRecord({ outcome_communicated: false }), makeRecord({ outcome_communicated: false })]);
        const a = alerts.find((x) => x.type === "outcome_not_communicated");
        expect(a).toBeUndefined();
      });
      it("fires for 3", () => {
        const alerts = identifySafeguardingReferralAlerts([
          makeRecord({ outcome_communicated: false }),
          makeRecord({ outcome_communicated: false }),
          makeRecord({ outcome_communicated: false }),
        ]);
        const a = alerts.find((x) => x.type === "outcome_not_communicated");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("medium");
        expect(a!.message).toContain("3 referrals without outcome communicated");
      });
    });

    describe("multiple alerts", () => {
      it("fires all applicable", () => {
        const alerts = identifySafeguardingReferralAlerts([
          makeRecord({ referral_urgency: "immediate", referral_timely: false, ofsted_notified: false, lado_consulted: false, information_shared_appropriately: false, outcome_communicated: false }),
          makeRecord({ ofsted_notified: false, lado_consulted: false, information_shared_appropriately: false, outcome_communicated: false }),
          makeRecord({ outcome_communicated: false }),
        ]);
        const types = alerts.map((a) => a.type);
        expect(types).toContain("untimely_immediate_referral");
        expect(types).toContain("ofsted_not_notified");
        expect(types).toContain("lado_not_consulted");
        expect(types).toContain("information_not_shared");
        expect(types).toContain("outcome_not_communicated");
      });
    });
  });
});
