import { describe, it, expect } from "vitest";

import {
  CHECK_TYPES,
  RISK_LEVELS,
  COMPLIANCE_STATUSES,
  _testing,
} from "../child-online-safety-monitoring-service";

import type {
  ChildOnlineSafetyMonitoringRow,
} from "../child-online-safety-monitoring-service";

const {
  computeMetrics,
  computeAlerts,
  generateCaraInsights,
} = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<ChildOnlineSafetyMonitoringRow>,
): ChildOnlineSafetyMonitoringRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: overrides?.home_id ?? "home-1",
    check_date: overrides?.check_date ?? now.toISOString().split("T")[0],
    checker_name: overrides?.checker_name ?? "Checker X",
    child_name: overrides?.child_name ?? "Child A",
    check_type: overrides?.check_type ?? "Device Check",
    risk_level: overrides?.risk_level ?? "Low",
    filtering_active: overrides?.filtering_active ?? true,
    age_appropriate: overrides?.age_appropriate ?? true,
    parental_controls: overrides?.parental_controls ?? true,
    social_media_reviewed: overrides?.social_media_reviewed ?? true,
    harmful_content_found: overrides?.harmful_content_found ?? false,
    online_contact_risk: overrides?.online_contact_risk ?? false,
    cyberbullying_identified: overrides?.cyberbullying_identified ?? false,
    action_taken: overrides?.action_taken ?? true,
    child_educated: overrides?.child_educated ?? true,
    parent_carer_notified: overrides?.parent_carer_notified ?? true,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    compliance_status: overrides?.compliance_status ?? "Compliant",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("child-online-safety-monitoring-service", () => {
  // ── Enum validation ──────────────────────────────────────────────────
  describe("Enum validation", () => {
    it("CHECK_TYPES has 8 values", () => { expect(CHECK_TYPES).toHaveLength(8); });
    it("CHECK_TYPES contains Device Check", () => { expect(CHECK_TYPES).toContain("Device Check"); });
    it("CHECK_TYPES contains Internet Filter Review", () => { expect(CHECK_TYPES).toContain("Internet Filter Review"); });
    it("CHECK_TYPES contains Social Media Audit", () => { expect(CHECK_TYPES).toContain("Social Media Audit"); });
    it("CHECK_TYPES contains App Review", () => { expect(CHECK_TYPES).toContain("App Review"); });
    it("CHECK_TYPES contains Screen Time Review", () => { expect(CHECK_TYPES).toContain("Screen Time Review"); });
    it("CHECK_TYPES contains Online Incident", () => { expect(CHECK_TYPES).toContain("Online Incident"); });
    it("CHECK_TYPES contains Education Session", () => { expect(CHECK_TYPES).toContain("Education Session"); });
    it("CHECK_TYPES contains Policy Review", () => { expect(CHECK_TYPES).toContain("Policy Review"); });

    it("RISK_LEVELS has 5 values", () => { expect(RISK_LEVELS).toHaveLength(5); });
    it("RISK_LEVELS contains No Identified Risk", () => { expect(RISK_LEVELS).toContain("No Identified Risk"); });
    it("RISK_LEVELS contains Low", () => { expect(RISK_LEVELS).toContain("Low"); });
    it("RISK_LEVELS contains Medium", () => { expect(RISK_LEVELS).toContain("Medium"); });
    it("RISK_LEVELS contains High", () => { expect(RISK_LEVELS).toContain("High"); });
    it("RISK_LEVELS contains Critical", () => { expect(RISK_LEVELS).toContain("Critical"); });

    it("COMPLIANCE_STATUSES has 4 values", () => { expect(COMPLIANCE_STATUSES).toHaveLength(4); });
    it("COMPLIANCE_STATUSES contains Compliant", () => { expect(COMPLIANCE_STATUSES).toContain("Compliant"); });
    it("COMPLIANCE_STATUSES contains Non-Compliant", () => { expect(COMPLIANCE_STATUSES).toContain("Non-Compliant"); });
    it("COMPLIANCE_STATUSES contains Action Required", () => { expect(COMPLIANCE_STATUSES).toContain("Action Required"); });
    it("COMPLIANCE_STATUSES contains Under Review", () => { expect(COMPLIANCE_STATUSES).toContain("Under Review"); });
  });

  // ── computeMetrics ──────────────────────────────────────────────────
  describe("computeMetrics", () => {
    it("returns zeros for empty array", () => {
      const m = computeMetrics([]);
      expect(m.total_checks).toBe(0);
      expect(m.high_risk_count).toBe(0);
      expect(m.critical_count).toBe(0);
      expect(m.harmful_content_count).toBe(0);
      expect(m.cyberbullying_count).toBe(0);
      expect(m.online_contact_risk_count).toBe(0);
      expect(m.filtering_rate).toBe(0);
      expect(m.age_appropriate_rate).toBe(0);
      expect(m.parental_controls_rate).toBe(0);
      expect(m.social_media_reviewed_rate).toBe(0);
      expect(m.action_taken_rate).toBe(0);
      expect(m.child_educated_rate).toBe(0);
      expect(m.unique_children).toBe(0);
      expect(m.unique_checkers).toBe(0);
    });
    it("total_checks counts rows", () => { expect(computeMetrics([makeRow(), makeRow(), makeRow()]).total_checks).toBe(3); });
    it("total_checks single row", () => { expect(computeMetrics([makeRow()]).total_checks).toBe(1); });

    // high_risk_count
    it("counts High as high_risk_count", () => { expect(computeMetrics([makeRow({ risk_level: "High" })]).high_risk_count).toBe(1); });
    it("counts Critical as high_risk_count", () => { expect(computeMetrics([makeRow({ risk_level: "Critical" })]).high_risk_count).toBe(1); });
    it("does not count Medium as high_risk_count", () => { expect(computeMetrics([makeRow({ risk_level: "Medium" })]).high_risk_count).toBe(0); });
    it("does not count Low as high_risk_count", () => { expect(computeMetrics([makeRow({ risk_level: "Low" })]).high_risk_count).toBe(0); });
    it("does not count No Identified Risk as high_risk_count", () => { expect(computeMetrics([makeRow({ risk_level: "No Identified Risk" })]).high_risk_count).toBe(0); });
    it("high_risk_count sums High and Critical", () => {
      const m = computeMetrics([
        makeRow({ risk_level: "High" }),
        makeRow({ risk_level: "Critical" }),
        makeRow({ risk_level: "Low" }),
      ]);
      expect(m.high_risk_count).toBe(2);
    });

    // critical_count
    it("counts Critical as critical_count", () => { expect(computeMetrics([makeRow({ risk_level: "Critical" })]).critical_count).toBe(1); });
    it("does not count High as critical_count", () => { expect(computeMetrics([makeRow({ risk_level: "High" })]).critical_count).toBe(0); });
    it("does not count Medium as critical_count", () => { expect(computeMetrics([makeRow({ risk_level: "Medium" })]).critical_count).toBe(0); });
    it("does not count Low as critical_count", () => { expect(computeMetrics([makeRow({ risk_level: "Low" })]).critical_count).toBe(0); });
    it("does not count No Identified Risk as critical_count", () => { expect(computeMetrics([makeRow({ risk_level: "No Identified Risk" })]).critical_count).toBe(0); });
    it("critical_count sums correctly", () => {
      const m = computeMetrics([
        makeRow({ risk_level: "Critical" }),
        makeRow({ risk_level: "Critical" }),
        makeRow({ risk_level: "High" }),
      ]);
      expect(m.critical_count).toBe(2);
    });

    // harmful_content_count
    it("harmful_content_count when true", () => { expect(computeMetrics([makeRow({ harmful_content_found: true })]).harmful_content_count).toBe(1); });
    it("harmful_content_count when false", () => { expect(computeMetrics([makeRow({ harmful_content_found: false })]).harmful_content_count).toBe(0); });
    it("harmful_content_count sums correctly", () => {
      const m = computeMetrics([
        makeRow({ harmful_content_found: true }),
        makeRow({ harmful_content_found: true }),
        makeRow({ harmful_content_found: false }),
      ]);
      expect(m.harmful_content_count).toBe(2);
    });

    // cyberbullying_count
    it("cyberbullying_count when true", () => { expect(computeMetrics([makeRow({ cyberbullying_identified: true })]).cyberbullying_count).toBe(1); });
    it("cyberbullying_count when false", () => { expect(computeMetrics([makeRow({ cyberbullying_identified: false })]).cyberbullying_count).toBe(0); });
    it("cyberbullying_count sums correctly", () => {
      const m = computeMetrics([
        makeRow({ cyberbullying_identified: true }),
        makeRow({ cyberbullying_identified: false }),
        makeRow({ cyberbullying_identified: true }),
      ]);
      expect(m.cyberbullying_count).toBe(2);
    });

    // online_contact_risk_count
    it("online_contact_risk_count when true", () => { expect(computeMetrics([makeRow({ online_contact_risk: true })]).online_contact_risk_count).toBe(1); });
    it("online_contact_risk_count when false", () => { expect(computeMetrics([makeRow({ online_contact_risk: false })]).online_contact_risk_count).toBe(0); });
    it("online_contact_risk_count sums correctly", () => {
      const m = computeMetrics([
        makeRow({ online_contact_risk: true }),
        makeRow({ online_contact_risk: true }),
        makeRow({ online_contact_risk: false }),
      ]);
      expect(m.online_contact_risk_count).toBe(2);
    });

    // filtering_rate
    it("filtering_rate 100 when all true", () => { expect(computeMetrics([makeRow({ filtering_active: true })]).filtering_rate).toBe(100); });
    it("filtering_rate 0 when all false", () => { expect(computeMetrics([makeRow({ filtering_active: false })]).filtering_rate).toBe(0); });
    it("filtering_rate mixed 2 of 3 gives 66.7", () => {
      const m = computeMetrics([
        makeRow({ filtering_active: true }),
        makeRow({ filtering_active: false }),
        makeRow({ filtering_active: true }),
      ]);
      expect(m.filtering_rate).toBe(66.7);
    });
    it("filtering_rate mixed 1 of 3 gives 33.3", () => {
      const m = computeMetrics([
        makeRow({ filtering_active: true }),
        makeRow({ filtering_active: false }),
        makeRow({ filtering_active: false }),
      ]);
      expect(m.filtering_rate).toBe(33.3);
    });

    // age_appropriate_rate
    it("age_appropriate_rate 100 when all true", () => { expect(computeMetrics([makeRow({ age_appropriate: true })]).age_appropriate_rate).toBe(100); });
    it("age_appropriate_rate 0 when all false", () => { expect(computeMetrics([makeRow({ age_appropriate: false })]).age_appropriate_rate).toBe(0); });
    it("age_appropriate_rate mixed 1 of 2 gives 50", () => {
      const m = computeMetrics([
        makeRow({ age_appropriate: true }),
        makeRow({ age_appropriate: false }),
      ]);
      expect(m.age_appropriate_rate).toBe(50);
    });

    // parental_controls_rate
    it("parental_controls_rate 100 when all true", () => { expect(computeMetrics([makeRow({ parental_controls: true })]).parental_controls_rate).toBe(100); });
    it("parental_controls_rate 0 when all false", () => { expect(computeMetrics([makeRow({ parental_controls: false })]).parental_controls_rate).toBe(0); });
    it("parental_controls_rate mixed 1 of 4 gives 25", () => {
      const m = computeMetrics([
        makeRow({ parental_controls: true }),
        makeRow({ parental_controls: false }),
        makeRow({ parental_controls: false }),
        makeRow({ parental_controls: false }),
      ]);
      expect(m.parental_controls_rate).toBe(25);
    });

    // social_media_reviewed_rate
    it("social_media_reviewed_rate 100 when all true", () => { expect(computeMetrics([makeRow({ social_media_reviewed: true })]).social_media_reviewed_rate).toBe(100); });
    it("social_media_reviewed_rate 0 when all false", () => { expect(computeMetrics([makeRow({ social_media_reviewed: false })]).social_media_reviewed_rate).toBe(0); });
    it("social_media_reviewed_rate mixed 3 of 4 gives 75", () => {
      const m = computeMetrics([
        makeRow({ social_media_reviewed: true }),
        makeRow({ social_media_reviewed: true }),
        makeRow({ social_media_reviewed: true }),
        makeRow({ social_media_reviewed: false }),
      ]);
      expect(m.social_media_reviewed_rate).toBe(75);
    });

    // action_taken_rate
    it("action_taken_rate 100 when all true", () => { expect(computeMetrics([makeRow({ action_taken: true })]).action_taken_rate).toBe(100); });
    it("action_taken_rate 0 when all false", () => { expect(computeMetrics([makeRow({ action_taken: false })]).action_taken_rate).toBe(0); });
    it("action_taken_rate mixed 2 of 4 gives 50", () => {
      const m = computeMetrics([
        makeRow({ action_taken: true }),
        makeRow({ action_taken: true }),
        makeRow({ action_taken: false }),
        makeRow({ action_taken: false }),
      ]);
      expect(m.action_taken_rate).toBe(50);
    });

    // child_educated_rate
    it("child_educated_rate 100 when all true", () => { expect(computeMetrics([makeRow({ child_educated: true })]).child_educated_rate).toBe(100); });
    it("child_educated_rate 0 when all false", () => { expect(computeMetrics([makeRow({ child_educated: false })]).child_educated_rate).toBe(0); });
    it("child_educated_rate mixed 3 of 4 gives 75", () => {
      const m = computeMetrics([
        makeRow({ child_educated: true }),
        makeRow({ child_educated: true }),
        makeRow({ child_educated: true }),
        makeRow({ child_educated: false }),
      ]);
      expect(m.child_educated_rate).toBe(75);
    });

    // unique_children
    it("unique_children counts distinct child_name values", () => {
      const m = computeMetrics([
        makeRow({ child_name: "Alice" }),
        makeRow({ child_name: "Bob" }),
        makeRow({ child_name: "Alice" }),
      ]);
      expect(m.unique_children).toBe(2);
    });
    it("unique_children single child", () => { expect(computeMetrics([makeRow()]).unique_children).toBe(1); });
    it("unique_children all distinct", () => {
      const m = computeMetrics([
        makeRow({ child_name: "A" }),
        makeRow({ child_name: "B" }),
        makeRow({ child_name: "C" }),
      ]);
      expect(m.unique_children).toBe(3);
    });
    it("unique_children all same", () => {
      const m = computeMetrics([
        makeRow({ child_name: "Same" }),
        makeRow({ child_name: "Same" }),
      ]);
      expect(m.unique_children).toBe(1);
    });

    // unique_checkers
    it("unique_checkers counts distinct checker_name values", () => {
      const m = computeMetrics([
        makeRow({ checker_name: "Staff A" }),
        makeRow({ checker_name: "Staff B" }),
        makeRow({ checker_name: "Staff A" }),
      ]);
      expect(m.unique_checkers).toBe(2);
    });
    it("unique_checkers single checker", () => { expect(computeMetrics([makeRow()]).unique_checkers).toBe(1); });
    it("unique_checkers all distinct", () => {
      const m = computeMetrics([
        makeRow({ checker_name: "A" }),
        makeRow({ checker_name: "B" }),
        makeRow({ checker_name: "C" }),
      ]);
      expect(m.unique_checkers).toBe(3);
    });

    // Multiple rows aggregate correctly
    it("multiple rows aggregate correctly", () => {
      const m = computeMetrics([
        makeRow({ risk_level: "High", filtering_active: true, harmful_content_found: true, child_name: "A", checker_name: "X" }),
        makeRow({ risk_level: "Critical", filtering_active: false, harmful_content_found: false, child_name: "B", checker_name: "Y" }),
        makeRow({ risk_level: "Low", filtering_active: true, harmful_content_found: true, child_name: "A", checker_name: "X" }),
        makeRow({ risk_level: "Medium", filtering_active: false, harmful_content_found: false, child_name: "C", checker_name: "Z" }),
      ]);
      expect(m.total_checks).toBe(4);
      expect(m.high_risk_count).toBe(2);
      expect(m.critical_count).toBe(1);
      expect(m.harmful_content_count).toBe(2);
      expect(m.filtering_rate).toBe(50);
      expect(m.unique_children).toBe(3);
      expect(m.unique_checkers).toBe(3);
    });

    // Rate rounding precision
    it("rate rounding uses Math.round with 1000/10 pattern", () => {
      // 1 of 6 = 16.666... should round to 16.7
      const rows = Array.from({ length: 6 }, (_, i) =>
        makeRow({ filtering_active: i === 0 }),
      );
      expect(computeMetrics(rows).filtering_rate).toBe(16.7);
    });
    it("rate 5 of 6 gives 83.3", () => {
      const rows = Array.from({ length: 6 }, (_, i) =>
        makeRow({ parental_controls: i < 5 }),
      );
      expect(computeMetrics(rows).parental_controls_rate).toBe(83.3);
    });
    it("rate 2 of 7 gives 28.6", () => {
      const rows = Array.from({ length: 7 }, (_, i) =>
        makeRow({ age_appropriate: i < 2 }),
      );
      expect(computeMetrics(rows).age_appropriate_rate).toBe(28.6);
    });
    it("rate 3 of 7 gives 42.9", () => {
      const rows = Array.from({ length: 7 }, (_, i) =>
        makeRow({ social_media_reviewed: i < 3 }),
      );
      expect(computeMetrics(rows).social_media_reviewed_rate).toBe(42.9);
    });
    it("rate 4 of 7 gives 57.1", () => {
      const rows = Array.from({ length: 7 }, (_, i) =>
        makeRow({ action_taken: i < 4 }),
      );
      expect(computeMetrics(rows).action_taken_rate).toBe(57.1);
    });
  });

  // ── computeAlerts ──────────────────────────────────────────────────
  describe("computeAlerts", () => {
    it("returns empty for empty", () => { expect(computeAlerts([])).toEqual([]); });
    it("returns empty for clean rows", () => { expect(computeAlerts([makeRow()])).toEqual([]); });

    // Critical: harmful_content_found
    it("fires harmful_content_found when harmful content found", () => {
      const a = computeAlerts([makeRow({ harmful_content_found: true, child_name: "Jo" })]);
      const f = a.find((x) => x.type === "harmful_content_found");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Jo");
      expect(f!.record_id).toBeDefined();
    });
    it("does not fire harmful_content_found when false", () => {
      const a = computeAlerts([makeRow({ harmful_content_found: false })]);
      expect(a.find((x) => x.type === "harmful_content_found")).toBeUndefined();
    });
    it("harmful_content_found fires per-record", () => {
      const a = computeAlerts([
        makeRow({ id: "a-1", harmful_content_found: true }),
        makeRow({ id: "a-2", harmful_content_found: true }),
      ]);
      expect(a.filter((x) => x.type === "harmful_content_found")).toHaveLength(2);
    });
    it("harmful_content_found message contains Harmful", () => {
      const a = computeAlerts([makeRow({ harmful_content_found: true })]);
      const f = a.find((x) => x.type === "harmful_content_found");
      expect(f!.message).toContain("Harmful");
    });

    // Critical: online_contact_risk
    it("fires online_contact_risk when online contact risk identified", () => {
      const a = computeAlerts([makeRow({ online_contact_risk: true, child_name: "Sam" })]);
      const f = a.find((x) => x.type === "online_contact_risk");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Sam");
      expect(f!.record_id).toBeDefined();
    });
    it("does not fire online_contact_risk when false", () => {
      const a = computeAlerts([makeRow({ online_contact_risk: false })]);
      expect(a.find((x) => x.type === "online_contact_risk")).toBeUndefined();
    });
    it("online_contact_risk fires per-record", () => {
      const a = computeAlerts([
        makeRow({ id: "a-1", online_contact_risk: true }),
        makeRow({ id: "a-2", online_contact_risk: true }),
      ]);
      expect(a.filter((x) => x.type === "online_contact_risk")).toHaveLength(2);
    });
    it("online_contact_risk message contains contact", () => {
      const a = computeAlerts([makeRow({ online_contact_risk: true })]);
      const f = a.find((x) => x.type === "online_contact_risk");
      expect(f!.message).toContain("contact");
    });

    // High: cyberbullying_identified
    it("fires cyberbullying_identified when cyberbullying identified", () => {
      const a = computeAlerts([makeRow({ cyberbullying_identified: true, child_name: "Amy" })]);
      const f = a.find((x) => x.type === "cyberbullying_identified");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("Amy");
    });
    it("does not fire cyberbullying_identified when false", () => {
      const a = computeAlerts([makeRow({ cyberbullying_identified: false })]);
      expect(a.find((x) => x.type === "cyberbullying_identified")).toBeUndefined();
    });
    it("cyberbullying_identified fires per-record", () => {
      const a = computeAlerts([
        makeRow({ id: "a-1", cyberbullying_identified: true }),
        makeRow({ id: "a-2", cyberbullying_identified: true }),
      ]);
      expect(a.filter((x) => x.type === "cyberbullying_identified")).toHaveLength(2);
    });
    it("cyberbullying_identified message contains Cyberbullying", () => {
      const a = computeAlerts([makeRow({ cyberbullying_identified: true })]);
      const f = a.find((x) => x.type === "cyberbullying_identified");
      expect(f!.message).toContain("Cyberbullying");
    });

    // High: filtering_not_active
    it("fires filtering_not_active when filtering not active", () => {
      const a = computeAlerts([makeRow({ filtering_active: false, child_name: "Zara" })]);
      const f = a.find((x) => x.type === "filtering_not_active");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("Zara");
    });
    it("does not fire filtering_not_active when filtering active", () => {
      const a = computeAlerts([makeRow({ filtering_active: true })]);
      expect(a.find((x) => x.type === "filtering_not_active")).toBeUndefined();
    });
    it("filtering_not_active fires per-record", () => {
      const a = computeAlerts([
        makeRow({ id: "a-1", filtering_active: false }),
        makeRow({ id: "a-2", filtering_active: false }),
      ]);
      expect(a.filter((x) => x.type === "filtering_not_active")).toHaveLength(2);
    });
    it("filtering_not_active message contains filtering", () => {
      const a = computeAlerts([makeRow({ filtering_active: false })]);
      const f = a.find((x) => x.type === "filtering_not_active");
      expect(f!.message).toContain("filtering");
    });

    // Medium: child_not_educated_after_incident
    it("fires child_not_educated_after_incident for Online Incident without education", () => {
      const a = computeAlerts([makeRow({ check_type: "Online Incident", child_educated: false, child_name: "Lee" })]);
      const f = a.find((x) => x.type === "child_not_educated_after_incident");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("medium");
      expect(f!.message).toContain("Lee");
    });
    it("does not fire child_not_educated_after_incident for non-incident check types", () => {
      const a = computeAlerts([makeRow({ check_type: "Device Check", child_educated: false })]);
      expect(a.find((x) => x.type === "child_not_educated_after_incident")).toBeUndefined();
    });
    it("does not fire child_not_educated_after_incident when child educated", () => {
      const a = computeAlerts([makeRow({ check_type: "Online Incident", child_educated: true })]);
      expect(a.find((x) => x.type === "child_not_educated_after_incident")).toBeUndefined();
    });
    it("child_not_educated_after_incident fires per-record", () => {
      const a = computeAlerts([
        makeRow({ id: "a-1", check_type: "Online Incident", child_educated: false }),
        makeRow({ id: "a-2", check_type: "Online Incident", child_educated: false }),
      ]);
      expect(a.filter((x) => x.type === "child_not_educated_after_incident")).toHaveLength(2);
    });
    it("child_not_educated_after_incident message contains educated", () => {
      const a = computeAlerts([makeRow({ check_type: "Online Incident", child_educated: false })]);
      const f = a.find((x) => x.type === "child_not_educated_after_incident");
      expect(f!.message).toContain("educated");
    });
    it("does not fire child_not_educated_after_incident for Education Session", () => {
      const a = computeAlerts([makeRow({ check_type: "Education Session", child_educated: false })]);
      expect(a.find((x) => x.type === "child_not_educated_after_incident")).toBeUndefined();
    });
    it("does not fire child_not_educated_after_incident for App Review", () => {
      const a = computeAlerts([makeRow({ check_type: "App Review", child_educated: false })]);
      expect(a.find((x) => x.type === "child_not_educated_after_incident")).toBeUndefined();
    });

    // Medium: parent_carer_not_notified_high_risk
    it("fires parent_carer_not_notified_high_risk for High risk without notification", () => {
      const a = computeAlerts([makeRow({ risk_level: "High", parent_carer_notified: false, child_name: "Max" })]);
      const f = a.find((x) => x.type === "parent_carer_not_notified_high_risk");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("medium");
      expect(f!.message).toContain("Max");
    });
    it("fires parent_carer_not_notified_high_risk for Critical risk without notification", () => {
      const a = computeAlerts([makeRow({ risk_level: "Critical", parent_carer_notified: false })]);
      expect(a.find((x) => x.type === "parent_carer_not_notified_high_risk")).toBeDefined();
    });
    it("does not fire parent_carer_not_notified_high_risk for Medium risk", () => {
      const a = computeAlerts([makeRow({ risk_level: "Medium", parent_carer_notified: false })]);
      expect(a.find((x) => x.type === "parent_carer_not_notified_high_risk")).toBeUndefined();
    });
    it("does not fire parent_carer_not_notified_high_risk for Low risk", () => {
      const a = computeAlerts([makeRow({ risk_level: "Low", parent_carer_notified: false })]);
      expect(a.find((x) => x.type === "parent_carer_not_notified_high_risk")).toBeUndefined();
    });
    it("does not fire parent_carer_not_notified_high_risk for No Identified Risk", () => {
      const a = computeAlerts([makeRow({ risk_level: "No Identified Risk", parent_carer_notified: false })]);
      expect(a.find((x) => x.type === "parent_carer_not_notified_high_risk")).toBeUndefined();
    });
    it("does not fire parent_carer_not_notified_high_risk when parent notified", () => {
      const a = computeAlerts([makeRow({ risk_level: "High", parent_carer_notified: true })]);
      expect(a.find((x) => x.type === "parent_carer_not_notified_high_risk")).toBeUndefined();
    });
    it("parent_carer_not_notified_high_risk fires per-record", () => {
      const a = computeAlerts([
        makeRow({ id: "a-1", risk_level: "High", parent_carer_notified: false }),
        makeRow({ id: "a-2", risk_level: "Critical", parent_carer_notified: false }),
      ]);
      expect(a.filter((x) => x.type === "parent_carer_not_notified_high_risk")).toHaveLength(2);
    });
    it("parent_carer_not_notified_high_risk message contains parent/carer", () => {
      const a = computeAlerts([makeRow({ risk_level: "High", parent_carer_notified: false })]);
      const f = a.find((x) => x.type === "parent_carer_not_notified_high_risk");
      expect(f!.message).toContain("Parent/carer");
    });

    // Multiple alerts simultaneously
    it("fires multiple alert types simultaneously", () => {
      const a = computeAlerts([
        makeRow({
          risk_level: "Critical",
          harmful_content_found: true,
          online_contact_risk: true,
          cyberbullying_identified: true,
          filtering_active: false,
          check_type: "Online Incident",
          child_educated: false,
          parent_carer_notified: false,
        }),
      ]);
      const types = a.map((x) => x.type);
      expect(types).toContain("harmful_content_found");
      expect(types).toContain("online_contact_risk");
      expect(types).toContain("cyberbullying_identified");
      expect(types).toContain("filtering_not_active");
      expect(types).toContain("child_not_educated_after_incident");
      expect(types).toContain("parent_carer_not_notified_high_risk");
    });
    it("does not fire alerts for well-managed row", () => {
      const a = computeAlerts([makeRow({
        risk_level: "No Identified Risk",
        harmful_content_found: false,
        online_contact_risk: false,
        cyberbullying_identified: false,
        filtering_active: true,
        child_educated: true,
        parent_carer_notified: true,
      })]);
      expect(a).toEqual([]);
    });
    it("all alerts have record_id", () => {
      const a = computeAlerts([
        makeRow({
          id: "test-id",
          risk_level: "Critical",
          harmful_content_found: true,
          online_contact_risk: true,
          cyberbullying_identified: true,
          filtering_active: false,
          check_type: "Online Incident",
          child_educated: false,
          parent_carer_notified: false,
        }),
      ]);
      for (const alert of a) {
        expect(alert.record_id).toBe("test-id");
      }
    });
    it("all alerts have valid severity", () => {
      const a = computeAlerts([
        makeRow({
          risk_level: "Critical",
          harmful_content_found: true,
          online_contact_risk: true,
          cyberbullying_identified: true,
          filtering_active: false,
          check_type: "Online Incident",
          child_educated: false,
          parent_carer_notified: false,
        }),
      ]);
      for (const alert of a) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });
    it("critical alerts come before high alerts for same row", () => {
      const a = computeAlerts([
        makeRow({
          risk_level: "Critical",
          harmful_content_found: true,
          online_contact_risk: true,
          cyberbullying_identified: true,
          filtering_active: false,
          check_type: "Online Incident",
          child_educated: false,
          parent_carer_notified: false,
        }),
      ]);
      const criticalIdx = a.findIndex((x) => x.severity === "critical");
      const highIdx = a.findIndex((x) => x.severity === "high");
      expect(criticalIdx).toBeLessThan(highIdx);
    });
    it("high alerts come before medium alerts for same row", () => {
      const a = computeAlerts([
        makeRow({
          risk_level: "Critical",
          harmful_content_found: true,
          online_contact_risk: true,
          cyberbullying_identified: true,
          filtering_active: false,
          check_type: "Online Incident",
          child_educated: false,
          parent_carer_notified: false,
        }),
      ]);
      const highIdx = a.findIndex((x) => x.severity === "high");
      const mediumIdx = a.findIndex((x) => x.severity === "medium");
      expect(highIdx).toBeLessThan(mediumIdx);
    });

    // Edge: mixed rows produce correct alerts
    it("mixed rows produce correct alert counts", () => {
      const a = computeAlerts([
        makeRow({ harmful_content_found: true, online_contact_risk: true, cyberbullying_identified: true, filtering_active: false, risk_level: "Critical", check_type: "Online Incident", child_educated: false, parent_carer_notified: false }),
        makeRow({ filtering_active: true }),
        makeRow({ risk_level: "No Identified Risk", filtering_active: true }),
      ]);
      expect(a.filter((x) => x.type === "harmful_content_found")).toHaveLength(1);
      expect(a.filter((x) => x.type === "online_contact_risk")).toHaveLength(1);
      expect(a.filter((x) => x.type === "cyberbullying_identified")).toHaveLength(1);
      expect(a.filter((x) => x.type === "filtering_not_active")).toHaveLength(1);
      expect(a.filter((x) => x.type === "child_not_educated_after_incident")).toHaveLength(1);
      expect(a.filter((x) => x.type === "parent_carer_not_notified_high_risk")).toHaveLength(1);
    });
    it("No Identified Risk row with all safe booleans produces no alerts", () => {
      const a = computeAlerts([makeRow({
        risk_level: "No Identified Risk",
        harmful_content_found: false,
        online_contact_risk: false,
        cyberbullying_identified: false,
        filtering_active: true,
        child_educated: true,
        parent_carer_notified: true,
      })]);
      expect(a).toEqual([]);
    });
    it("all alert messages are non-empty strings", () => {
      const a = computeAlerts([
        makeRow({
          risk_level: "Critical",
          harmful_content_found: true,
          online_contact_risk: true,
          cyberbullying_identified: true,
          filtering_active: false,
          check_type: "Online Incident",
          child_educated: false,
          parent_carer_notified: false,
        }),
      ]);
      for (const alert of a) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
    it("all alert types are non-empty strings", () => {
      const a = computeAlerts([
        makeRow({
          risk_level: "Critical",
          harmful_content_found: true,
          online_contact_risk: true,
          cyberbullying_identified: true,
          filtering_active: false,
          check_type: "Online Incident",
          child_educated: false,
          parent_carer_notified: false,
        }),
      ]);
      for (const alert of a) {
        expect(typeof alert.type).toBe("string");
        expect(alert.type.length).toBeGreaterThan(0);
      }
    });
  });

  // ── generateCaraInsights ─────────────────────────────────────────────
  describe("generateCaraInsights", () => {
    it("returns 3 insights for empty data", () => {
      const insights = generateCaraInsights([]);
      expect(insights).toHaveLength(3);
    });
    it("returns 3 insights for populated data", () => {
      const insights = generateCaraInsights([makeRow(), makeRow()]);
      expect(insights).toHaveLength(3);
    });
    it("insight 1 starts with [sky]", () => {
      expect(generateCaraInsights([])[0]).toMatch(/^\[sky\]/);
    });
    it("insight 2 starts with [amber]", () => {
      expect(generateCaraInsights([])[1]).toMatch(/^\[amber\]/);
    });
    it("insight 3 starts with [reflect]", () => {
      expect(generateCaraInsights([])[2]).toMatch(/^\[reflect\]/);
    });
    it("insight 1 contains total checks count", () => {
      const insights = generateCaraInsights([makeRow(), makeRow()]);
      expect(insights[0]).toContain("2 online safety checks");
    });
    it("insight 1 contains unique children count", () => {
      const insights = generateCaraInsights([makeRow({ child_name: "A" }), makeRow({ child_name: "B" })]);
      expect(insights[0]).toContain("2 children");
    });
    it("insight 1 uses singular child for 1", () => {
      const insights = generateCaraInsights([makeRow()]);
      expect(insights[0]).toContain("1 child");
    });
    it("insight 1 contains high risk count", () => {
      const insights = generateCaraInsights([
        makeRow({ risk_level: "High" }),
        makeRow({ risk_level: "Critical" }),
      ]);
      expect(insights[0]).toContain("2 at High or Critical");
    });
    it("insight 1 contains critical count", () => {
      const insights = generateCaraInsights([makeRow({ risk_level: "Critical" })]);
      expect(insights[0]).toContain("1 at Critical risk");
    });
    it("insight 1 contains filtering active rate", () => {
      const insights = generateCaraInsights([makeRow({ filtering_active: true })]);
      expect(insights[0]).toContain("Filtering active rate");
      expect(insights[0]).toContain("100%");
    });
    it("insight 2 mentions critical and high alert counts when present", () => {
      const rows = [
        makeRow({ harmful_content_found: true, filtering_active: false }),
      ];
      const insights = generateCaraInsights(rows);
      expect(insights[1]).toContain("critical");
      expect(insights[1]).toContain("high-priority");
    });
    it("insight 2 shows no concerns when none", () => {
      const insights = generateCaraInsights([makeRow()]);
      expect(insights[1]).toContain("No critical or high-priority concerns");
    });
    it("insight 2 contains harmful content count", () => {
      const insights = generateCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Harmful content found");
    });
    it("insight 2 contains cyberbullying count", () => {
      const insights = generateCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Cyberbullying identified");
    });
    it("insight 2 contains online contact risks count", () => {
      const insights = generateCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Online contact risks");
    });
    it("insight 3 contains reflective question about filters", () => {
      const insights = generateCaraInsights([]);
      expect(insights[2]).toContain("internet filters");
    });
    it("insight 3 mentions harmful content", () => {
      const insights = generateCaraInsights([]);
      expect(insights[2]).toContain("harmful content");
    });
    it("insight 3 mentions cyberbullying", () => {
      const insights = generateCaraInsights([]);
      expect(insights[2]).toContain("cyberbullying");
    });
    it("insight 3 mentions online contact", () => {
      const insights = generateCaraInsights([]);
      expect(insights[2]).toContain("online contact");
    });
    it("all insights are strings", () => {
      const insights = generateCaraInsights([makeRow()]);
      for (const i of insights) expect(typeof i).toBe("string");
    });
    it("empty array still produces meaningful content", () => {
      const insights = generateCaraInsights([]);
      expect(insights[0]).toContain("0 online safety checks");
      expect(insights[0]).toContain("0 children");
    });
    it("single high-risk row produces all 3 insights", () => {
      const insights = generateCaraInsights([makeRow({ risk_level: "High" })]);
      expect(insights).toHaveLength(3);
      expect(insights[0]).toMatch(/^\[sky\]/);
      expect(insights[1]).toMatch(/^\[amber\]/);
      expect(insights[2]).toMatch(/^\[reflect\]/);
    });
    it("insight 2 with alerts shows correct critical count", () => {
      const rows = [
        makeRow({ harmful_content_found: true, online_contact_risk: true }),
      ];
      const insights = generateCaraInsights(rows);
      expect(insights[1]).toContain("2 critical");
    });
    it("insight 2 with alerts shows correct high-priority count", () => {
      const rows = [
        makeRow({ harmful_content_found: true, filtering_active: false }),
      ];
      const insights = generateCaraInsights(rows);
      expect(insights[1]).toContain("1 high-priority");
    });
    it("insight 1 with zero high risk shows 0", () => {
      const insights = generateCaraInsights([makeRow({ risk_level: "Low" })]);
      expect(insights[0]).toContain("0 at High or Critical");
    });
    it("insight 1 with zero critical shows 0", () => {
      const insights = generateCaraInsights([makeRow({ risk_level: "Low" })]);
      expect(insights[0]).toContain("0 at Critical risk");
    });
  });

  // ── makeRow helper ──────────────────────────────────────────────────
  describe("makeRow helper", () => {
    it("produces valid default row", () => {
      const r = makeRow();
      expect(r.id).toBeDefined();
      expect(r.home_id).toBe("home-1");
      expect(r.child_name).toBe("Child A");
      expect(r.risk_level).toBe("Low");
      expect(r.check_type).toBe("Device Check");
      expect(r.filtering_active).toBe(true);
      expect(r.age_appropriate).toBe(true);
      expect(r.parental_controls).toBe(true);
      expect(r.social_media_reviewed).toBe(true);
      expect(r.harmful_content_found).toBe(false);
      expect(r.online_contact_risk).toBe(false);
      expect(r.cyberbullying_identified).toBe(false);
      expect(r.action_taken).toBe(true);
      expect(r.child_educated).toBe(true);
      expect(r.parent_carer_notified).toBe(true);
      expect(r.next_review_date).toBeNull();
      expect(r.compliance_status).toBe("Compliant");
      expect(r.checker_name).toBe("Checker X");
      expect(r.notes).toBeNull();
      expect(r.created_at).toBeDefined();
      expect(r.updated_at).toBeDefined();
    });
    it("overrides id", () => {
      const r = makeRow({ id: "custom-id" });
      expect(r.id).toBe("custom-id");
    });
    it("overrides risk_level", () => {
      const r = makeRow({ risk_level: "Critical" });
      expect(r.risk_level).toBe("Critical");
    });
    it("overrides check_type", () => {
      const r = makeRow({ check_type: "Social Media Audit" });
      expect(r.check_type).toBe("Social Media Audit");
    });
    it("overrides filtering_active", () => {
      const r = makeRow({ filtering_active: false });
      expect(r.filtering_active).toBe(false);
    });
    it("overrides age_appropriate", () => {
      const r = makeRow({ age_appropriate: false });
      expect(r.age_appropriate).toBe(false);
    });
    it("overrides parental_controls", () => {
      const r = makeRow({ parental_controls: false });
      expect(r.parental_controls).toBe(false);
    });
    it("overrides social_media_reviewed", () => {
      const r = makeRow({ social_media_reviewed: false });
      expect(r.social_media_reviewed).toBe(false);
    });
    it("overrides harmful_content_found", () => {
      const r = makeRow({ harmful_content_found: true });
      expect(r.harmful_content_found).toBe(true);
    });
    it("overrides online_contact_risk", () => {
      const r = makeRow({ online_contact_risk: true });
      expect(r.online_contact_risk).toBe(true);
    });
    it("overrides cyberbullying_identified", () => {
      const r = makeRow({ cyberbullying_identified: true });
      expect(r.cyberbullying_identified).toBe(true);
    });
    it("overrides action_taken", () => {
      const r = makeRow({ action_taken: false });
      expect(r.action_taken).toBe(false);
    });
    it("overrides child_educated", () => {
      const r = makeRow({ child_educated: false });
      expect(r.child_educated).toBe(false);
    });
    it("overrides parent_carer_notified", () => {
      const r = makeRow({ parent_carer_notified: false });
      expect(r.parent_carer_notified).toBe(false);
    });
    it("overrides compliance_status", () => {
      const r = makeRow({ compliance_status: "Action Required" });
      expect(r.compliance_status).toBe("Action Required");
    });
    it("overrides notes", () => {
      const r = makeRow({ notes: "Test note" });
      expect(r.notes).toBe("Test note");
    });
    it("overrides checker_name", () => {
      const r = makeRow({ checker_name: "Staff Custom" });
      expect(r.checker_name).toBe("Staff Custom");
    });
    it("overrides next_review_date", () => {
      const r = makeRow({ next_review_date: "2025-12-31" });
      expect(r.next_review_date).toBe("2025-12-31");
    });
    it("generates unique ids", () => {
      const r1 = makeRow();
      const r2 = makeRow();
      expect(r1.id).not.toBe(r2.id);
    });
    it("overrides child_name", () => {
      const r = makeRow({ child_name: "Custom Child" });
      expect(r.child_name).toBe("Custom Child");
    });
    it("overrides home_id", () => {
      const r = makeRow({ home_id: "home-99" });
      expect(r.home_id).toBe("home-99");
    });
  });

  // ── Edge cases and boundary tests ──────────────────────────────────
  describe("Edge cases", () => {
    it("metrics handles single row correctly", () => {
      const m = computeMetrics([makeRow({
        risk_level: "Critical",
        filtering_active: true,
        age_appropriate: true,
        parental_controls: true,
        social_media_reviewed: true,
        harmful_content_found: true,
        online_contact_risk: true,
        cyberbullying_identified: true,
        action_taken: true,
        child_educated: true,
      })]);
      expect(m.total_checks).toBe(1);
      expect(m.high_risk_count).toBe(1);
      expect(m.critical_count).toBe(1);
      expect(m.harmful_content_count).toBe(1);
      expect(m.cyberbullying_count).toBe(1);
      expect(m.online_contact_risk_count).toBe(1);
      expect(m.filtering_rate).toBe(100);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.parental_controls_rate).toBe(100);
      expect(m.social_media_reviewed_rate).toBe(100);
      expect(m.action_taken_rate).toBe(100);
      expect(m.child_educated_rate).toBe(100);
    });

    it("alerts empty when all rows are No Identified Risk with safe booleans", () => {
      const rows = Array.from({ length: 5 }, () =>
        makeRow({
          risk_level: "No Identified Risk",
          harmful_content_found: false,
          online_contact_risk: false,
          cyberbullying_identified: false,
          filtering_active: true,
          child_educated: true,
          parent_carer_notified: true,
        }),
      );
      expect(computeAlerts(rows)).toEqual([]);
    });

    it("metrics all rates 0 when all booleans false", () => {
      const m = computeMetrics([makeRow({
        filtering_active: false,
        age_appropriate: false,
        parental_controls: false,
        social_media_reviewed: false,
        action_taken: false,
        child_educated: false,
      })]);
      expect(m.filtering_rate).toBe(0);
      expect(m.age_appropriate_rate).toBe(0);
      expect(m.parental_controls_rate).toBe(0);
      expect(m.social_media_reviewed_rate).toBe(0);
      expect(m.action_taken_rate).toBe(0);
      expect(m.child_educated_rate).toBe(0);
    });

    it("metrics all rates 100 when all booleans true", () => {
      const m = computeMetrics([makeRow({
        filtering_active: true,
        age_appropriate: true,
        parental_controls: true,
        social_media_reviewed: true,
        action_taken: true,
        child_educated: true,
      })]);
      expect(m.filtering_rate).toBe(100);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.parental_controls_rate).toBe(100);
      expect(m.social_media_reviewed_rate).toBe(100);
      expect(m.action_taken_rate).toBe(100);
      expect(m.child_educated_rate).toBe(100);
    });

    it("handles large number of rows", () => {
      const rows = Array.from({ length: 200 }, (_, i) =>
        makeRow({ child_name: `Child ${i}`, risk_level: i % 2 === 0 ? "High" : "Low" }),
      );
      const m = computeMetrics(rows);
      expect(m.total_checks).toBe(200);
      expect(m.high_risk_count).toBe(100);
      expect(m.unique_children).toBe(200);
    });

    it("handles all check types in metrics", () => {
      const types = ["Device Check", "Internet Filter Review", "Social Media Audit", "App Review", "Screen Time Review", "Online Incident", "Education Session", "Policy Review"] as const;
      const rows = types.map((t) => makeRow({ check_type: t }));
      const m = computeMetrics(rows);
      expect(m.total_checks).toBe(8);
    });

    it("handles all risk levels in metrics", () => {
      const levels = ["No Identified Risk", "Low", "Medium", "High", "Critical"] as const;
      const rows = levels.map((l) => makeRow({ risk_level: l }));
      const m = computeMetrics(rows);
      expect(m.total_checks).toBe(5);
      expect(m.high_risk_count).toBe(2);
      expect(m.critical_count).toBe(1);
    });

    it("handles all compliance statuses", () => {
      const statuses = ["Compliant", "Non-Compliant", "Action Required", "Under Review"] as const;
      const rows = statuses.map((s) => makeRow({ compliance_status: s }));
      const m = computeMetrics(rows);
      expect(m.total_checks).toBe(4);
    });

    it("insights handle all-Critical data set", () => {
      const rows = Array.from({ length: 3 }, () =>
        makeRow({ risk_level: "Critical", filtering_active: true }),
      );
      const insights = generateCaraInsights(rows);
      expect(insights).toHaveLength(3);
      expect(insights[0]).toContain("3 at High or Critical");
    });

    it("insights handle mixed risk levels", () => {
      const rows = [
        makeRow({ risk_level: "No Identified Risk" }),
        makeRow({ risk_level: "Low" }),
        makeRow({ risk_level: "Medium" }),
        makeRow({ risk_level: "High" }),
        makeRow({ risk_level: "Critical" }),
      ];
      const insights = generateCaraInsights(rows);
      expect(insights[0]).toContain("5 online safety checks");
      expect(insights[0]).toContain("2 at High or Critical");
    });

    it("alerts for harmful content only produces single critical alert", () => {
      const a = computeAlerts([makeRow({
        harmful_content_found: true,
        online_contact_risk: false,
        cyberbullying_identified: false,
        filtering_active: true,
        child_educated: true,
        parent_carer_notified: true,
        risk_level: "Low",
      })]);
      expect(a).toHaveLength(1);
      expect(a[0].type).toBe("harmful_content_found");
    });

    it("alerts for online contact risk only produces single critical alert", () => {
      const a = computeAlerts([makeRow({
        harmful_content_found: false,
        online_contact_risk: true,
        cyberbullying_identified: false,
        filtering_active: true,
        child_educated: true,
        parent_carer_notified: true,
        risk_level: "Low",
      })]);
      expect(a).toHaveLength(1);
      expect(a[0].type).toBe("online_contact_risk");
    });

    it("alerts for cyberbullying only produces single high alert", () => {
      const a = computeAlerts([makeRow({
        harmful_content_found: false,
        online_contact_risk: false,
        cyberbullying_identified: true,
        filtering_active: true,
        child_educated: true,
        parent_carer_notified: true,
        risk_level: "Low",
      })]);
      expect(a).toHaveLength(1);
      expect(a[0].type).toBe("cyberbullying_identified");
    });

    it("alerts for filtering not active only produces single high alert", () => {
      const a = computeAlerts([makeRow({
        harmful_content_found: false,
        online_contact_risk: false,
        cyberbullying_identified: false,
        filtering_active: false,
        child_educated: true,
        parent_carer_notified: true,
        risk_level: "Low",
      })]);
      expect(a).toHaveLength(1);
      expect(a[0].type).toBe("filtering_not_active");
    });

    it("Low risk with all safe booleans produces no alerts except filtering", () => {
      const a = computeAlerts([makeRow({
        risk_level: "Low",
        harmful_content_found: false,
        online_contact_risk: false,
        cyberbullying_identified: false,
        filtering_active: true,
        child_educated: true,
        parent_carer_notified: true,
      })]);
      expect(a).toEqual([]);
    });

    it("Medium risk with all safe booleans produces no alerts", () => {
      const a = computeAlerts([makeRow({
        risk_level: "Medium",
        harmful_content_found: false,
        online_contact_risk: false,
        cyberbullying_identified: false,
        filtering_active: true,
        child_educated: true,
        parent_carer_notified: true,
      })]);
      expect(a).toEqual([]);
    });

    it("multiple Critical rows each produce all 6 alert types", () => {
      const a = computeAlerts([
        makeRow({ risk_level: "Critical", harmful_content_found: true, online_contact_risk: true, cyberbullying_identified: true, filtering_active: false, check_type: "Online Incident", child_educated: false, parent_carer_notified: false }),
        makeRow({ risk_level: "Critical", harmful_content_found: true, online_contact_risk: true, cyberbullying_identified: true, filtering_active: false, check_type: "Online Incident", child_educated: false, parent_carer_notified: false }),
      ]);
      expect(a.filter((x) => x.type === "harmful_content_found")).toHaveLength(2);
      expect(a.filter((x) => x.type === "online_contact_risk")).toHaveLength(2);
      expect(a.filter((x) => x.type === "cyberbullying_identified")).toHaveLength(2);
      expect(a.filter((x) => x.type === "filtering_not_active")).toHaveLength(2);
      expect(a.filter((x) => x.type === "child_not_educated_after_incident")).toHaveLength(2);
      expect(a.filter((x) => x.type === "parent_carer_not_notified_high_risk")).toHaveLength(2);
    });

    it("insights with all-Low data set show 0 high risk", () => {
      const rows = Array.from({ length: 4 }, () => makeRow({ risk_level: "Low" }));
      const insights = generateCaraInsights(rows);
      expect(insights[0]).toContain("0 at High or Critical");
      expect(insights[0]).toContain("0 at Critical risk");
    });

    it("insights with mixed booleans show correct rates", () => {
      const rows = [
        makeRow({ filtering_active: true }),
        makeRow({ filtering_active: false }),
      ];
      const insights = generateCaraInsights(rows);
      expect(insights[0]).toContain("50%");
    });

    it("rate 1 of 7 gives 14.3", () => {
      const rows = Array.from({ length: 7 }, (_, i) =>
        makeRow({ age_appropriate: i === 0 }),
      );
      expect(computeMetrics(rows).age_appropriate_rate).toBe(14.3);
    });

    it("rate 6 of 7 gives 85.7", () => {
      const rows = Array.from({ length: 7 }, (_, i) =>
        makeRow({ child_educated: i < 6 }),
      );
      expect(computeMetrics(rows).child_educated_rate).toBe(85.7);
    });

    it("next_review_date null by default", () => {
      const r = makeRow();
      expect(r.next_review_date).toBeNull();
    });

    it("next_review_date can be overridden", () => {
      const r = makeRow({ next_review_date: "2026-06-01" });
      expect(r.next_review_date).toBe("2026-06-01");
    });

    it("notes null by default", () => {
      const r = makeRow();
      expect(r.notes).toBeNull();
    });

    it("notes can be set", () => {
      const r = makeRow({ notes: "Child showed awareness" });
      expect(r.notes).toBe("Child showed awareness");
    });

    it("check_type can be set to each value", () => {
      for (const t of CHECK_TYPES) {
        const r = makeRow({ check_type: t });
        expect(r.check_type).toBe(t);
      }
    });

    it("compliance_status can be set to each value", () => {
      for (const s of COMPLIANCE_STATUSES) {
        const r = makeRow({ compliance_status: s });
        expect(r.compliance_status).toBe(s);
      }
    });

    it("risk_level can be set to each value", () => {
      for (const l of RISK_LEVELS) {
        const r = makeRow({ risk_level: l });
        expect(r.risk_level).toBe(l);
      }
    });
  });
});
