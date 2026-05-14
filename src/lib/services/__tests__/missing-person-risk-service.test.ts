import { describe, it, expect } from "vitest";
import { _testing, type MissingPersonRiskRecord } from "../missing-person-risk-service";

const { computeMissingPersonRiskMetrics, identifyMissingPersonRiskAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<MissingPersonRiskRecord>): MissingPersonRiskRecord {
  return {
    id: overrides?.id ?? "m-1",
    home_id: overrides?.home_id ?? "home-1",
    risk_level: overrides?.risk_level ?? "medium",
    assessment_type: overrides?.assessment_type ?? "initial_assessment",
    trigger_plan_status: overrides?.trigger_plan_status ?? "active",
    protective_factor: overrides?.protective_factor ?? "positive_relationships",
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : "child-1",
    previous_missing_episodes: overrides?.previous_missing_episodes ?? 2,
    trigger_plan_in_place: overrides?.trigger_plan_in_place ?? true,
    return_interview_completed: overrides?.return_interview_completed ?? true,
    police_informed: overrides?.police_informed ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    parents_informed: overrides?.parents_informed ?? true,
    push_factors_identified: overrides?.push_factors_identified ?? true,
    pull_factors_identified: overrides?.pull_factors_identified ?? true,
    peer_mapping_completed: overrides?.peer_mapping_completed ?? true,
    safe_places_identified: overrides?.safe_places_identified ?? true,
    escalation_protocol_followed: overrides?.escalation_protocol_followed ?? true,
    multi_agency_involved: overrides?.multi_agency_involved ?? true,
    exploitation_risk_identified: overrides?.exploitation_risk_identified ?? false,
    issues_found: overrides?.issues_found ?? [],
    actions_taken: overrides?.actions_taken ?? [],
    assessed_by: overrides?.assessed_by ?? "Staff A",
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("missing-person-risk-service", () => {
  describe("computeMissingPersonRiskMetrics", () => {
    describe("empty records", () => {
      it("returns zeros for all fields", () => {
        const m = computeMissingPersonRiskMetrics([]);
        expect(m.total_assessments).toBe(0);
        expect(m.very_high_risk_count).toBe(0);
        expect(m.high_risk_count).toBe(0);
        expect(m.medium_risk_count).toBe(0);
        expect(m.low_risk_count).toBe(0);
        expect(m.minimal_risk_count).toBe(0);
        expect(m.trigger_plan_rate).toBe(0);
        expect(m.return_interview_rate).toBe(0);
        expect(m.police_informed_rate).toBe(0);
        expect(m.social_worker_informed_rate).toBe(0);
        expect(m.push_factors_rate).toBe(0);
        expect(m.pull_factors_rate).toBe(0);
        expect(m.peer_mapping_rate).toBe(0);
        expect(m.safe_places_rate).toBe(0);
        expect(m.escalation_followed_rate).toBe(0);
        expect(m.exploitation_risk_count).toBe(0);
        expect(m.total_previous_episodes).toBe(0);
        expect(m.average_previous_episodes).toBe(0);
        expect(m.unique_children).toBe(0);
      });

      it("returns empty breakdowns", () => {
        const m = computeMissingPersonRiskMetrics([]);
        expect(m.by_risk_level).toEqual({});
        expect(m.by_assessment_type).toEqual({});
        expect(m.by_trigger_plan_status).toEqual({});
        expect(m.by_protective_factor).toEqual({});
      });
    });

    describe("single record defaults", () => {
      it("returns correct counts", () => {
        const m = computeMissingPersonRiskMetrics([makeRecord()]);
        expect(m.total_assessments).toBe(1);
        expect(m.medium_risk_count).toBe(1);
        expect(m.very_high_risk_count).toBe(0);
        expect(m.exploitation_risk_count).toBe(0);
        expect(m.unique_children).toBe(1);
      });

      it("returns 100% for all boolean rates with defaults", () => {
        const m = computeMissingPersonRiskMetrics([makeRecord()]);
        expect(m.trigger_plan_rate).toBe(100);
        expect(m.return_interview_rate).toBe(100);
        expect(m.police_informed_rate).toBe(100);
        expect(m.social_worker_informed_rate).toBe(100);
        expect(m.push_factors_rate).toBe(100);
        expect(m.pull_factors_rate).toBe(100);
        expect(m.peer_mapping_rate).toBe(100);
        expect(m.safe_places_rate).toBe(100);
        expect(m.escalation_followed_rate).toBe(100);
      });

      it("returns correct episode totals", () => {
        const m = computeMissingPersonRiskMetrics([makeRecord()]);
        expect(m.total_previous_episodes).toBe(2);
        expect(m.average_previous_episodes).toBe(2);
      });
    });

    describe("risk level counting", () => {
      it("counts very_high", () => {
        const m = computeMissingPersonRiskMetrics([makeRecord({ risk_level: "very_high" })]);
        expect(m.very_high_risk_count).toBe(1);
      });
      it("counts high", () => {
        const m = computeMissingPersonRiskMetrics([makeRecord({ risk_level: "high" })]);
        expect(m.high_risk_count).toBe(1);
      });
      it("counts medium", () => {
        const m = computeMissingPersonRiskMetrics([makeRecord({ risk_level: "medium" })]);
        expect(m.medium_risk_count).toBe(1);
      });
      it("counts low", () => {
        const m = computeMissingPersonRiskMetrics([makeRecord({ risk_level: "low" })]);
        expect(m.low_risk_count).toBe(1);
      });
      it("counts minimal", () => {
        const m = computeMissingPersonRiskMetrics([makeRecord({ risk_level: "minimal" })]);
        expect(m.minimal_risk_count).toBe(1);
      });
    });

    describe("episode calculations", () => {
      it("sums previous episodes", () => {
        const records = [makeRecord({ previous_missing_episodes: 3 }), makeRecord({ previous_missing_episodes: 5 })];
        const m = computeMissingPersonRiskMetrics(records);
        expect(m.total_previous_episodes).toBe(8);
      });
      it("averages with rounding", () => {
        const records = [makeRecord({ previous_missing_episodes: 1 }), makeRecord({ previous_missing_episodes: 2 }), makeRecord({ previous_missing_episodes: 3 })];
        const m = computeMissingPersonRiskMetrics(records);
        expect(m.average_previous_episodes).toBe(2);
      });
    });

    describe("unique_children", () => {
      it("counts distinct child names", () => {
        const records = [makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })];
        const m = computeMissingPersonRiskMetrics(records);
        expect(m.unique_children).toBe(2);
      });
    });

    describe("boolean rates", () => {
      it("trigger_plan_rate 0 when false", () => {
        const m = computeMissingPersonRiskMetrics([makeRecord({ trigger_plan_in_place: false })]);
        expect(m.trigger_plan_rate).toBe(0);
      });
      it("peer_mapping_rate 0 when false", () => {
        const m = computeMissingPersonRiskMetrics([makeRecord({ peer_mapping_completed: false })]);
        expect(m.peer_mapping_rate).toBe(0);
      });
      it("calculates mixed rates", () => {
        const records = [makeRecord({ trigger_plan_in_place: true }), makeRecord({ trigger_plan_in_place: false }), makeRecord({ trigger_plan_in_place: true })];
        const m = computeMissingPersonRiskMetrics(records);
        expect(m.trigger_plan_rate).toBe(66.7);
      });
    });

    describe("exploitation_risk_count", () => {
      it("counts when true", () => {
        const m = computeMissingPersonRiskMetrics([makeRecord({ exploitation_risk_identified: true })]);
        expect(m.exploitation_risk_count).toBe(1);
      });
      it("does not count when false", () => {
        const m = computeMissingPersonRiskMetrics([makeRecord({ exploitation_risk_identified: false })]);
        expect(m.exploitation_risk_count).toBe(0);
      });
    });

    describe("by_risk_level breakdown", () => {
      it("counts all 5 levels", () => {
        const levels = ["very_high", "high", "medium", "low", "minimal"] as const;
        const records = levels.map((l) => makeRecord({ risk_level: l }));
        const m = computeMissingPersonRiskMetrics(records);
        for (const l of levels) expect(m.by_risk_level[l]).toBe(1);
      });
    });

    describe("by_assessment_type breakdown", () => {
      it("counts all 10 types", () => {
        const types = ["initial_assessment", "periodic_review", "post_incident_review", "trigger_plan_update", "return_interview", "multi_agency_review", "risk_escalation", "risk_reduction", "care_plan_review", "other"] as const;
        const records = types.map((t) => makeRecord({ assessment_type: t }));
        const m = computeMissingPersonRiskMetrics(records);
        for (const t of types) expect(m.by_assessment_type[t]).toBe(1);
      });
    });

    describe("by_trigger_plan_status breakdown", () => {
      it("counts all 5 statuses", () => {
        const statuses = ["active", "under_review", "updated", "not_required", "expired"] as const;
        const records = statuses.map((s) => makeRecord({ trigger_plan_status: s }));
        const m = computeMissingPersonRiskMetrics(records);
        for (const s of statuses) expect(m.by_trigger_plan_status[s]).toBe(1);
      });
    });

    describe("by_protective_factor breakdown", () => {
      it("counts all 10 factors", () => {
        const factors = ["positive_relationships", "school_engagement", "therapeutic_support", "family_contact", "structured_routine", "hobbies_interests", "peer_support", "professional_network", "safe_space_identified", "other"] as const;
        const records = factors.map((f) => makeRecord({ protective_factor: f }));
        const m = computeMissingPersonRiskMetrics(records);
        for (const f of factors) expect(m.by_protective_factor[f]).toBe(1);
      });
    });
  });

  describe("identifyMissingPersonRiskAlerts", () => {
    describe("no alerts", () => {
      it("returns empty for clean records", () => {
        expect(identifyMissingPersonRiskAlerts([makeRecord()])).toEqual([]);
      });
      it("returns empty for empty records", () => {
        expect(identifyMissingPersonRiskAlerts([])).toEqual([]);
      });
    });

    describe("exploitation_risk alert", () => {
      it("fires for exploitation risk", () => {
        const alerts = identifyMissingPersonRiskAlerts([makeRecord({ exploitation_risk_identified: true, child_name: "Child X", assessment_date: "2026-05-14" })]);
        expect(alerts).toHaveLength(1);
        expect(alerts[0].type).toBe("exploitation_risk");
        expect(alerts[0].severity).toBe("critical");
        expect(alerts[0].message).toContain("Child X");
        expect(alerts[0].message).toContain("2026-05-14");
      });
      it("fires per-record", () => {
        const alerts = identifyMissingPersonRiskAlerts([
          makeRecord({ id: "m-1", exploitation_risk_identified: true }),
          makeRecord({ id: "m-2", exploitation_risk_identified: true }),
        ]);
        const e = alerts.filter((a) => a.type === "exploitation_risk");
        expect(e).toHaveLength(2);
      });
    });

    describe("very_high_no_trigger_plan alert", () => {
      it("fires for very high without trigger plan", () => {
        const alerts = identifyMissingPersonRiskAlerts([makeRecord({ risk_level: "very_high", trigger_plan_in_place: false })]);
        const a = alerts.find((x) => x.type === "very_high_no_trigger_plan");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("critical");
        expect(a!.message).toContain("1 very high risk child has");
      });
      it("uses plural for 2+", () => {
        const alerts = identifyMissingPersonRiskAlerts([
          makeRecord({ risk_level: "very_high", trigger_plan_in_place: false }),
          makeRecord({ risk_level: "very_high", trigger_plan_in_place: false }),
        ]);
        const a = alerts.find((x) => x.type === "very_high_no_trigger_plan");
        expect(a!.message).toContain("2 very high risk children have");
      });
      it("does not fire for high risk", () => {
        const alerts = identifyMissingPersonRiskAlerts([makeRecord({ risk_level: "high", trigger_plan_in_place: false })]);
        const a = alerts.find((x) => x.type === "very_high_no_trigger_plan");
        expect(a).toBeUndefined();
      });
    });

    describe("return_interview_missing alert", () => {
      it("fires for post-incident without return interview", () => {
        const alerts = identifyMissingPersonRiskAlerts([makeRecord({ assessment_type: "post_incident_review", return_interview_completed: false })]);
        const a = alerts.find((x) => x.type === "return_interview_missing");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("high");
        expect(a!.message).toContain("1 post-incident review has");
      });
      it("uses plural for 2+", () => {
        const alerts = identifyMissingPersonRiskAlerts([
          makeRecord({ assessment_type: "post_incident_review", return_interview_completed: false }),
          makeRecord({ assessment_type: "post_incident_review", return_interview_completed: false }),
        ]);
        const a = alerts.find((x) => x.type === "return_interview_missing");
        expect(a!.message).toContain("2 post-incident reviews have");
      });
      it("does not fire for non-post-incident", () => {
        const alerts = identifyMissingPersonRiskAlerts([makeRecord({ assessment_type: "periodic_review", return_interview_completed: false })]);
        const a = alerts.find((x) => x.type === "return_interview_missing");
        expect(a).toBeUndefined();
      });
    });

    describe("police_not_informed alert", () => {
      it("fires for high risk without police", () => {
        const alerts = identifyMissingPersonRiskAlerts([makeRecord({ risk_level: "high", police_informed: false })]);
        const a = alerts.find((x) => x.type === "police_not_informed");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("high");
        expect(a!.message).toContain("1 high-risk assessment has");
      });
      it("fires for very_high without police", () => {
        const alerts = identifyMissingPersonRiskAlerts([makeRecord({ risk_level: "very_high", police_informed: false })]);
        const a = alerts.find((x) => x.type === "police_not_informed");
        expect(a).toBeDefined();
      });
      it("does not fire for medium risk", () => {
        const alerts = identifyMissingPersonRiskAlerts([makeRecord({ risk_level: "medium", police_informed: false })]);
        const a = alerts.find((x) => x.type === "police_not_informed");
        expect(a).toBeUndefined();
      });
    });

    describe("peer_mapping_incomplete alert", () => {
      it("does not fire for 2 incomplete", () => {
        const alerts = identifyMissingPersonRiskAlerts([makeRecord({ peer_mapping_completed: false }), makeRecord({ peer_mapping_completed: false })]);
        const a = alerts.find((x) => x.type === "peer_mapping_incomplete");
        expect(a).toBeUndefined();
      });
      it("fires for 3 incomplete", () => {
        const alerts = identifyMissingPersonRiskAlerts([
          makeRecord({ peer_mapping_completed: false }),
          makeRecord({ peer_mapping_completed: false }),
          makeRecord({ peer_mapping_completed: false }),
        ]);
        const a = alerts.find((x) => x.type === "peer_mapping_incomplete");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("medium");
        expect(a!.message).toContain("3 assessments without peer mapping");
      });
    });

    describe("multiple alerts", () => {
      it("fires all applicable", () => {
        const alerts = identifyMissingPersonRiskAlerts([
          makeRecord({ exploitation_risk_identified: true, risk_level: "very_high", trigger_plan_in_place: false, police_informed: false, peer_mapping_completed: false }),
          makeRecord({ assessment_type: "post_incident_review", return_interview_completed: false, police_informed: false, risk_level: "high", peer_mapping_completed: false }),
          makeRecord({ peer_mapping_completed: false }),
        ]);
        const types = alerts.map((a) => a.type);
        expect(types).toContain("exploitation_risk");
        expect(types).toContain("very_high_no_trigger_plan");
        expect(types).toContain("return_interview_missing");
        expect(types).toContain("police_not_informed");
        expect(types).toContain("peer_mapping_incomplete");
      });
    });
  });
});
