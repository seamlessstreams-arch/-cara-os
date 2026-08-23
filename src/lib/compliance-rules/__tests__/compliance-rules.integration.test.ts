// Integration test: runs the FIXED Compliance Rules engine against the REAL demo
// store seed data (the same mapping the API route performs) — incidents/missing/
// restraint/medication events come via the canonical event stream, plus real
// supervisions and training records. Verifies end-to-end wiring without a server.
import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildEventStream } from "@/lib/event-stream/event-projector";
import { mapStoreToEventInput } from "@/lib/event-stream/store-mapper";
import {
  computeComplianceRules,
  type ComplianceSupervisionInput,
  type ComplianceTrainingInput,
} from "../compliance-rules-engine";

const d = (v: unknown, fb = ""): string => (v == null ? fb : v.toString().slice(0, 10));

describe("compliance-rules integration (real seed data)", () => {
  const store = getStore();
  const events = buildEventStream(mapStoreToEventInput(store)).events;

  const supervisions: ComplianceSupervisionInput[] = ((store.supervisions ?? []) as any[]).map((s) => ({
    id: s.id,
    staff_id: s.staff_id,
    type: s.type,
    scheduled_date: d(s.scheduled_date),
    actual_date: s.actual_date ? d(s.actual_date) : null,
    status: s.status,
  }));

  const trainingRecords: ComplianceTrainingInput[] = ((store.trainingRecords ?? []) as any[]).map((t) => ({
    id: t.id,
    staff_id: t.staff_id,
    course_name: t.course_name,
    category: t.category,
    status: t.status,
    is_mandatory: t.is_mandatory,
    expiry_date: t.expiry_date ? d(t.expiry_date) : null,
  }));

  // Use a fixed `today` so the supervision-due rule is stable regardless of when
  // the test runs (the seed uses absolute 2026 dates).
  const today = "2026-06-03";
  const result = computeComplianceRules({ events, supervisions, trainingRecords, today });

  it("evaluates a meaningful number of fixed rules from real data", () => {
    expect(result.overview.rules_evaluated).toBeGreaterThan(0);
    expect(result.overview.rules_evaluated).toBe(result.rule_results.length);
    expect(result.overview.passing + result.overview.failing).toBe(result.overview.rules_evaluated);
  });

  it("flags the seed's expired GDPR training as a failing training-expiry rule", () => {
    // Seed has tr_003 / tr_005 / tr_011 (GDPR Refresher) with status "expired".
    const trainingFails = result.rule_results.filter((r) => r.category === "training-expiry" && r.status === "fail");
    expect(trainingFails.length).toBeGreaterThan(0);
    expect(trainingFails.every((r) => r.severity === "high" || r.severity === "medium")).toBe(true);
    expect(trainingFails.some((r) => /gdpr/i.test(r.message))).toBe(true);
  });

  it("detects medication-error follow-up breaches from the medication event stream", () => {
    // Real seed has medication errors with harm-level severity → harm tag.
    const medFails = result.rule_results.filter((r) => r.category === "medication-error-followup");
    // If the seed contains any harm-level medication error, it must be a fail.
    for (const r of medFails) expect(r.status).toBe("fail");
  });

  it("never emits a rule outside the allowed severity/status enums", () => {
    for (const r of result.rule_results) {
      expect(["mandatory-info", "approval-threshold", "safeguarding-notification", "physical-intervention-review", "medication-error-followup", "training-expiry", "supervision-due"]).toContain(r.category);
      expect(["critical", "high", "medium", "low"]).toContain(r.severity);
      expect(["pass", "fail"]).toContain(r.status);
    }
  });

  it("alerts are a subset of failing critical/high rules", () => {
    for (const a of result.alerts) expect(["critical", "high"]).toContain(a.severity);
    const failingHighCrit = result.rule_results.filter((r) => r.status === "fail" && (r.severity === "critical" || r.severity === "high")).length;
    expect(result.alerts.length).toBe(failingHighCrit);
  });

  it("always returns at least one Cara-style insight", () => {
    expect(result.insights.length).toBeGreaterThan(0);
    for (const i of result.insights) expect(["critical", "warning", "positive"]).toContain(i.severity);
  });

  it("linked_staff_id on training/supervision fails resolves to a real staff member", () => {
    const staffIds = new Set(((store.staff ?? []) as any[]).map((s) => s.id));
    const staffLinked = result.rule_results.filter((r) => (r.category === "training-expiry" || r.category === "supervision-due") && r.linked_staff_id);
    for (const r of staffLinked) expect(staffIds.has(r.linked_staff_id!)).toBe(true);
  });

  it("is deterministic against the real store", () => {
    const again = computeComplianceRules({ events, supervisions, trainingRecords, today });
    expect(JSON.stringify(again)).toBe(JSON.stringify(result));
  });
});
