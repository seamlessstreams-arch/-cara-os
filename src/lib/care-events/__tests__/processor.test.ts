// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CARE EVENT PROCESSOR TESTS
// Tests: routing engine classification, dedup/idempotency, amendment versioning,
// role permissions, retry behaviour, and filing cabinet auto-filing.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import { classifyCareEvent, buildRoutingSummary } from "../routing-engine";
import { processCareEvent, retryFailedRoutes } from "../processor";
import { hasPermission, toAppRole, PERMISSIONS } from "@/lib/permissions";
import type { CareEvent } from "@/types/care-events";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<CareEvent>): CareEvent {
  return {
    id: `ce_test_${Math.random().toString(36).slice(2)}`,
    home_id: "home_oak",
    child_id: "yp_alex",
    shift_id: null,
    staff_id: "staff_ryan",
    verified_by: null,
    returned_by: null,
    locked_by: null,
    category: "general",
    title: "Test care event",
    content: "Content",
    mood_score: null,
    is_significant: false,
    status: "draft",
    event_date: "2025-01-15",
    event_time: null,
    requires_manager_review: false,
    requires_reg40_triage: false,
    contributes_to_reg45: false,
    contributes_to_annex_a: false,
    is_safeguarding: false,
    evidence_prompts: [],
    areas_updated: [],
    version: 1,
    previous_version_id: null,
    amendment_reason: null,
    amended_by: null,
    amended_at: null,
    is_current_version: true,
    submitted_at: null,
    submitted_by: null,
    verified_at: null,
    returned_at: null,
    return_reason: null,
    locked_at: null,
    staff_signature: false,
    routing_started_at: null,
    routing_completed_at: null,
    routing_failed_at: null,
    routing_failure_reason: null,
    manager_notes: null,
    evidence_approved: false,
    requires_reg40_triage_reason: null,
    reg45_evidence_ids: [],
    annex_a_evidence_ids: [],
    ...overrides,
  } as CareEvent;
}

// ── classifyCareEvent ─────────────────────────────────────────────────────────

describe("classifyCareEvent", () => {
  it("always includes daily_log and child_daily_summary routes for general category", () => {
    const event = makeEvent({ category: "general" });
    const result = classifyCareEvent(event);
    expect(result.routes).toContain("daily_log");
    expect(result.routes).toContain("child_daily_summary");
  });

  it("includes incident route for safeguarding category", () => {
    const event = makeEvent({ category: "safeguarding" });
    const result = classifyCareEvent(event);
    expect(result.routes).toContain("incident");
  });

  it("includes missing_episode route for missing_episode category", () => {
    const event = makeEvent({ category: "missing_episode" });
    const result = classifyCareEvent(event);
    expect(result.routes).toContain("missing_episode");
  });

  it("includes physical_intervention route for restraint category", () => {
    const event = makeEvent({ category: "restraint" });
    const result = classifyCareEvent(event);
    expect(result.routes).toContain("physical_intervention");
  });

  it("marks is_safeguarding true for safeguarding category", () => {
    const event = makeEvent({ category: "safeguarding" });
    const result = classifyCareEvent(event);
    expect(result.is_safeguarding).toBe(true);
  });

  it("marks requires_reg40_triage true for safeguarding", () => {
    const event = makeEvent({ category: "safeguarding" });
    const result = classifyCareEvent(event);
    expect(result.requires_reg40_triage).toBe(true);
  });

  it("includes reg45_evidence for safeguarding category", () => {
    const event = makeEvent({ category: "safeguarding" });
    const result = classifyCareEvent(event);
    expect(result.routes).toContain("reg45_evidence");
  });

  it("includes annex_a_evidence for safeguarding category", () => {
    const event = makeEvent({ category: "safeguarding" });
    const result = classifyCareEvent(event);
    expect(result.routes).toContain("annex_a_evidence");
  });

  it("includes medication_record route for medication category", () => {
    const event = makeEvent({ category: "medication" });
    const result = classifyCareEvent(event);
    expect(result.routes).toContain("medication_record");
  });

  it("includes health_record route for health category", () => {
    const event = makeEvent({ category: "health" });
    const result = classifyCareEvent(event);
    expect(result.routes).toContain("health_record");
  });

  it("includes education_record route for education category", () => {
    const event = makeEvent({ category: "education" });
    const result = classifyCareEvent(event);
    expect(result.routes).toContain("education_record");
  });

  it("includes family_contact_record route for family_contact category", () => {
    const event = makeEvent({ category: "family_contact" });
    const result = classifyCareEvent(event);
    expect(result.routes).toContain("family_contact_record");
  });

  it("includes management_oversight route for significant events", () => {
    const event = makeEvent({ is_significant: true, category: "general" });
    const result = classifyCareEvent(event);
    expect(result.routes).toContain("management_oversight");
  });

  it("requires_manager_review is true for incident category events", () => {
    const event = makeEvent({ category: "safeguarding" });
    const result = classifyCareEvent(event);
    expect(result.requires_manager_review).toBe(true);
  });

  it("requires_manager_review is false for general category", () => {
    const event = makeEvent({ category: "general", is_significant: false });
    const result = classifyCareEvent(event);
    expect(result.requires_manager_review).toBe(false);
  });
});

// ── buildRoutingSummary ───────────────────────────────────────────────────────

describe("buildRoutingSummary", () => {
  it("returns a summary object with areas_updated for common routes", () => {
    const routes: Parameters<typeof buildRoutingSummary>[0] = [
      "daily_log", "child_daily_summary", "incident", "management_oversight",
    ];
    const summary = buildRoutingSummary(routes);
    expect(summary).toBeTruthy();
    expect(typeof summary).toBe("object");
    expect(Array.isArray(summary.areas_updated)).toBe(true);
  });
});

// ── processCareEvent — idempotency / dedup ────────────────────────────────────

describe("processCareEvent — idempotency", () => {
  it("does not create duplicate incident records when processed twice", () => {
    const event = makeEvent({ category: "incident", is_significant: true });
    db.careEvents.create(event);

    const result1 = processCareEvent(event);
    const incidentsAfterFirst = db.incidents.findAll().filter(
      (i) => (i as unknown as { care_event_id?: string }).care_event_id === event.id
    ).length;

    const result2 = processCareEvent(event);
    const incidentsAfterSecond = db.incidents.findAll().filter(
      (i) => (i as unknown as { care_event_id?: string }).care_event_id === event.id
    ).length;

    expect(result1.routes_completed).toBeGreaterThan(0);
    expect(incidentsAfterFirst).toBe(incidentsAfterSecond); // no duplicates
  });

  it("does not create duplicate filing cabinet items when processed twice", () => {
    const event = makeEvent({ category: "general" });
    db.careEvents.create(event);

    processCareEvent(event);
    const countFirst = db.filingCabinet.findAll().filter(
      (f) => (f as unknown as { care_event_id?: string }).care_event_id === event.id
    ).length;

    processCareEvent(event);
    const countSecond = db.filingCabinet.findAll().filter(
      (f) => (f as unknown as { care_event_id?: string }).care_event_id === event.id
    ).length;

    expect(countFirst).toBe(countSecond);
  });

  it("does not create duplicate child daily summaries when processed twice", () => {
    const event = makeEvent({ category: "general", event_date: "2025-01-15" });
    db.careEvents.create(event);

    processCareEvent(event);
    const countFirst = db.childDailySummaries.findAll().filter(
      (s) => s.child_id === event.child_id && s.summary_date === event.event_date
    ).length;

    processCareEvent(event);
    const countSecond = db.childDailySummaries.findAll().filter(
      (s) => s.child_id === event.child_id && s.summary_date === event.event_date
    ).length;

    expect(countFirst).toBe(countSecond);
  });

  it("does not create duplicate reg45 evidence when processed twice", () => {
    const event = makeEvent({ contributes_to_reg45: true });
    db.careEvents.create(event);

    processCareEvent(event);
    const countFirst = db.reg45EvidenceQueue.findAll().filter(
      (e) => e.care_event_id === event.id
    ).length;

    processCareEvent(event);
    const countSecond = db.reg45EvidenceQueue.findAll().filter(
      (e) => e.care_event_id === event.id
    ).length;

    expect(countFirst).toBe(countSecond);
  });
});

// ── processCareEvent — routing results ───────────────────────────────────────

describe("processCareEvent — routing results", () => {
  it("returns routes_completed > 0 for a basic general event", () => {
    const event = makeEvent({ category: "general" });
    db.careEvents.create(event);
    const result = processCareEvent(event);
    expect(result.routes_completed).toBeGreaterThan(0);
    expect(result.routes_failed).toBe(0);
  });

  it("updates event status to routed on success", () => {
    const event = makeEvent({ category: "general" });
    db.careEvents.create(event);
    processCareEvent(event);
    const updated = db.careEvents.findById(event.id);
    expect(updated?.status).toBe("routed");
  });

  it("creates an audit log entry when routing completes", () => {
    const event = makeEvent({ category: "general" });
    db.careEvents.create(event);
    processCareEvent(event);
    const audit = db.careEventAuditLog.findByCareEvent(event.id);
    expect(audit.length).toBeGreaterThan(0);
  });

  it("sets requires_manager_review for significant events", () => {
    const event = makeEvent({ is_significant: true });
    db.careEvents.create(event);
    processCareEvent(event);
    const updated = db.careEvents.findById(event.id);
    expect(updated?.requires_manager_review).toBe(true);
  });
});

// ── retryFailedRoutes ─────────────────────────────────────────────────────────

describe("retryFailedRoutes", () => {
  it("throws for a non-existent event ID", () => {
    expect(() => retryFailedRoutes("ce_nonexistent_999")).toThrow();
  });
});

// ── Role permissions ──────────────────────────────────────────────────────────

describe("Role permissions — care event actions", () => {
  it("registered_manager can approve forms (verify care events)", () => {
    const role = toAppRole("registered_manager");
    expect(hasPermission(role, PERMISSIONS.APPROVE_FORMS)).toBe(true);
  });

  it("residential_care_worker cannot approve forms", () => {
    const role = toAppRole("residential_care_worker");
    expect(hasPermission(role, PERMISSIONS.APPROVE_FORMS)).toBe(false);
  });

  it("team_leader can approve forms (verify care events)", () => {
    const role = toAppRole("team_leader");
    expect(hasPermission(role, PERMISSIONS.APPROVE_FORMS)).toBe(true);
  });

  it("deputy_manager can approve forms", () => {
    const role = toAppRole("deputy_manager");
    expect(hasPermission(role, PERMISSIONS.APPROVE_FORMS)).toBe(true);
  });

  it("responsible_individual can approve forms", () => {
    const role = toAppRole("responsible_individual");
    expect(hasPermission(role, PERMISSIONS.APPROVE_FORMS)).toBe(true);
  });

  it("residential_care_worker can submit forms (create_forms)", () => {
    const role = toAppRole("residential_care_worker");
    expect(hasPermission(role, PERMISSIONS.SUBMIT_FORMS)).toBe(true);
  });

  it("registered_manager can manage incidents", () => {
    const role = toAppRole("registered_manager");
    expect(hasPermission(role, PERMISSIONS.MANAGE_INCIDENTS)).toBe(true);
  });

  it("residential_care_worker cannot manage incidents", () => {
    const role = toAppRole("residential_care_worker");
    expect(hasPermission(role, PERMISSIONS.MANAGE_INCIDENTS)).toBe(false);
  });

  it("registered_manager can view safeguarding", () => {
    const role = toAppRole("registered_manager");
    expect(hasPermission(role, PERMISSIONS.VIEW_SAFEGUARDING)).toBe(true);
  });

  it("residential_care_worker can view safeguarding", () => {
    const role = toAppRole("residential_care_worker");
    expect(hasPermission(role, PERMISSIONS.VIEW_SAFEGUARDING)).toBe(true);
  });

  it("registered_manager can manage safeguarding", () => {
    const role = toAppRole("registered_manager");
    expect(hasPermission(role, PERMISSIONS.MANAGE_SAFEGUARDING)).toBe(true);
  });

  it("residential_care_worker cannot manage safeguarding", () => {
    const role = toAppRole("residential_care_worker");
    expect(hasPermission(role, PERMISSIONS.MANAGE_SAFEGUARDING)).toBe(false);
  });
});

// ── Amendment versioning ──────────────────────────────────────────────────────

describe("Amendment versioning", () => {
  it("new version increments version number", () => {
    const original = makeEvent({ version: 1, is_current_version: true });
    db.careEvents.create(original);

    // Simulate what the amend action does
    db.careEvents.patch(original.id, { is_current_version: false });
    const newVersion = db.careEvents.create({
      ...original,
      id: `ce_v2_${original.id}`,
      version: 2,
      previous_version_id: original.id,
      is_current_version: true,
      amendment_reason: "Test amendment",
      status: "draft",
    });

    expect(newVersion.version).toBe(2);
    expect(newVersion.previous_version_id).toBe(original.id);
    expect(newVersion.is_current_version).toBe(true);

    const superseded = db.careEvents.findById(original.id);
    expect(superseded?.is_current_version).toBe(false);
  });

  it("original event is preserved after amendment", () => {
    const original = makeEvent({ title: "Original title", version: 1 });
    db.careEvents.create(original);
    db.careEvents.patch(original.id, { is_current_version: false });

    const found = db.careEvents.findById(original.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe("Original title");
  });

  it("version chain is navigable via previous_version_id", () => {
    const v1 = makeEvent({ version: 1, is_current_version: false });
    db.careEvents.create(v1);

    const v2 = db.careEvents.create({
      ...v1,
      id: `${v1.id}_v2`,
      version: 2,
      previous_version_id: v1.id,
      is_current_version: false,
      amendment_reason: "First amendment",
    });

    const v3 = db.careEvents.create({
      ...v2,
      id: `${v1.id}_v3`,
      version: 3,
      previous_version_id: v2.id,
      is_current_version: true,
      amendment_reason: "Second amendment",
    });

    // Walk chain v3 → v2 → v1
    const prev2 = db.careEvents.findById(v3.previous_version_id!);
    expect(prev2?.version).toBe(2);
    const prev1 = db.careEvents.findById(prev2!.previous_version_id!);
    expect(prev1?.version).toBe(1);
    expect(prev1?.previous_version_id).toBeNull();
  });
});
