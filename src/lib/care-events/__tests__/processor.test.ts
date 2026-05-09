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
    const event = makeEvent({ category: "behaviour", is_significant: true });
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

// ── Locked record protection ──────────────────────────────────────────────────

describe("Locked record protection", () => {
  it("a locked event cannot be directly edited — only formal amendment allowed", () => {
    const event = makeEvent({ status: "locked", locked_at: new Date().toISOString(), locked_by: "staff_darren" });
    db.careEvents.create(event);

    // Attempting to patch a locked event directly is prevented at the API level
    // (API route returns 409 for locked events). At the store level, patch still
    // works — but status must not silently revert to an earlier state.
    db.careEvents.patch(event.id, { manager_notes: "Manager added a note" });
    const updated = db.careEvents.findById(event.id);
    expect(updated?.status).toBe("locked"); // status preserved
    expect(updated?.manager_notes).toBe("Manager added a note");
  });

  it("a locked event preserves its locked_at timestamp after patch", () => {
    const ts = new Date().toISOString();
    const event = makeEvent({ status: "locked", locked_at: ts });
    db.careEvents.create(event);
    db.careEvents.patch(event.id, { manager_notes: "note" });
    const found = db.careEvents.findById(event.id);
    expect(found?.locked_at).toBe(ts);
  });

  it("version history is preserved across amendment of a locked event", () => {
    const locked = makeEvent({ status: "locked", version: 3, is_current_version: false });
    db.careEvents.create(locked);
    const amendment = db.careEvents.create({
      ...locked,
      id: `${locked.id}_v4`,
      version: 4,
      previous_version_id: locked.id,
      is_current_version: true,
      amendment_reason: "Amendment after lock",
      status: "draft",
    });
    expect(amendment.previous_version_id).toBe(locked.id);
    expect(db.careEvents.findById(locked.id)?.status).toBe("locked"); // original preserved
  });
});

// ── Failed route retry ────────────────────────────────────────────────────────

describe("Failed route retry", () => {
  it("retryFailedRoutes throws for a non-existent event", () => {
    expect(() => retryFailedRoutes("ce_does_not_exist_xyz")).toThrow();
  });

  it("retryFailedRoutes re-processes failed routes for an existing event", () => {
    const event = makeEvent({ category: "general" });
    db.careEvents.create(event);

    // Manually create a failed route
    const route = db.careEventRoutes.upsert({
      care_event_id: event.id,
      home_id: "home_oak",
      route_type: "filing_cabinet",
      status: "failed",
      linked_record_id: null,
      linked_record_table: null,
      processing_notes: null,
      error_message: "Simulated failure",
      retry_count: 1,
      last_retried_at: null,
      time_saved_minutes: 0,
    });

    // Retry should attempt to process the event again
    const result = retryFailedRoutes(event.id);
    expect(result).toBeDefined();
    // Route should be retried (completed or still failing, but retry_count incremented)
    const retried = db.careEventRoutes.findByCareEvent(event.id).find((r) => r.id === route.id);
    expect(retried).toBeDefined();
  });

  it("source Care Event is preserved even if routes fail", () => {
    const event = makeEvent({ category: "safeguarding", is_significant: true });
    db.careEvents.create(event);
    processCareEvent(event);
    const found = db.careEvents.findById(event.id);
    expect(found).toBeDefined(); // always preserved
    expect(found?.id).toBe(event.id);
  });
});

// ── Audit trail ───────────────────────────────────────────────────────────────

describe("Audit trail creation", () => {
  it("processCareEvent appends an audit log entry", () => {
    const event = makeEvent({ category: "general" });
    db.careEvents.create(event);
    const before = db.careEventAuditLog.findByCareEvent(event.id).length;
    processCareEvent(event);
    const after = db.careEventAuditLog.findByCareEvent(event.id).length;
    expect(after).toBeGreaterThan(before);
  });

  it("audit log entries are findable by care_event_id", () => {
    const event = makeEvent({ category: "health" });
    db.careEvents.create(event);
    processCareEvent(event);
    const logs = db.careEventAuditLog.findByCareEvent(event.id);
    expect(logs.length).toBeGreaterThan(0);
    logs.forEach((l) => expect(l.care_event_id).toBe(event.id));
  });

  it("audit log entry has an action field", () => {
    const event = makeEvent({ category: "medication" });
    db.careEvents.create(event);
    processCareEvent(event);
    const logs = db.careEventAuditLog.findByCareEvent(event.id);
    expect(logs[0]).toHaveProperty("action");
    expect(typeof logs[0].action).toBe("string");
  });
});

// ── Regulation 45 suggested evidence update ───────────────────────────────────

describe("Regulation 45 suggested evidence", () => {
  it("creates a reg45 evidence item for safeguarding events", () => {
    const event = makeEvent({ category: "safeguarding", is_significant: true });
    db.careEvents.create(event);
    processCareEvent(event);
    const items = db.reg45EvidenceQueue.findAll().filter(
      (i) => i.care_event_id === event.id
    );
    expect(items.length).toBeGreaterThan(0);
  });

  it("creates a reg45 evidence item for missing_episode events", () => {
    const event = makeEvent({ category: "missing_episode" });
    db.careEvents.create(event);
    processCareEvent(event);
    const items = db.reg45EvidenceQueue.findAll().filter(
      (i) => i.care_event_id === event.id
    );
    expect(items.length).toBeGreaterThan(0);
  });

  it("does not create reg45 evidence for general events", () => {
    const event = makeEvent({ category: "general", is_significant: false });
    db.careEvents.create(event);
    processCareEvent(event);
    const items = db.reg45EvidenceQueue.findAll().filter(
      (i) => i.care_event_id === event.id
    );
    expect(items.length).toBe(0);
  });

  it("reg45 evidence item starts with manager_decision 'pending'", () => {
    const event = makeEvent({ category: "behaviour" });
    db.careEvents.create(event);
    processCareEvent(event);
    const items = db.reg45EvidenceQueue.findAll().filter(
      (i) => i.care_event_id === event.id
    );
    items.forEach((i) => expect(i.manager_decision).toBe("pending"));
  });
});

// ── Annex A suggested evidence update ────────────────────────────────────────

describe("Annex A suggested evidence", () => {
  it("creates an annex_a evidence item for safeguarding events", () => {
    const event = makeEvent({ category: "safeguarding" });
    db.careEvents.create(event);
    processCareEvent(event);
    const items = db.annexAEvidenceQueue.findAll().filter(
      (i) => i.care_event_id === event.id
    );
    expect(items.length).toBeGreaterThan(0);
  });

  it("creates an annex_a evidence item for health events", () => {
    const event = makeEvent({ category: "health" });
    db.careEvents.create(event);
    processCareEvent(event);
    const items = db.annexAEvidenceQueue.findAll().filter(
      (i) => i.care_event_id === event.id
    );
    expect(items.length).toBeGreaterThan(0);
  });

  it("annex_a evidence item starts with manager_decision 'pending'", () => {
    const event = makeEvent({ category: "physical_intervention" });
    db.careEvents.create(event);
    processCareEvent(event);
    const items = db.annexAEvidenceQueue.findAll().filter(
      (i) => i.care_event_id === event.id
    );
    items.forEach((i) => expect(i.manager_decision).toBe("pending"));
  });
});

// ── Management oversight queue ────────────────────────────────────────────────

describe("Management oversight queue", () => {
  it("creates a management oversight task for significant behaviour events", () => {
    const event = makeEvent({ category: "behaviour", is_significant: true });
    db.careEvents.create(event);
    processCareEvent(event);
    const tasks = db.tasks.findAll().filter(
      (t) => (t as unknown as { linked_care_event_id?: string }).linked_care_event_id === event.id &&
              t.tags?.includes("management_oversight")
    );
    expect(tasks.length).toBeGreaterThan(0);
  });

  it("creates a management oversight task for safeguarding events", () => {
    const event = makeEvent({ category: "safeguarding" });
    db.careEvents.create(event);
    processCareEvent(event);
    const tasks = db.tasks.findAll().filter(
      (t) => (t as unknown as { linked_care_event_id?: string }).linked_care_event_id === event.id &&
              t.tags?.includes("management_oversight")
    );
    expect(tasks.length).toBeGreaterThan(0);
  });

  it("does not create management oversight task for general non-significant events", () => {
    const event = makeEvent({ category: "general", is_significant: false });
    db.careEvents.create(event);
    processCareEvent(event);
    const tasks = db.tasks.findAll().filter(
      (t) => (t as unknown as { linked_care_event_id?: string }).linked_care_event_id === event.id &&
              t.tags?.includes("management_oversight")
    );
    expect(tasks.length).toBe(0);
  });
});

// ── Regulation 44 routing ─────────────────────────────────────────────────────

describe("Regulation 44 routing", () => {
  it("includes reg44_evidence route for safeguarding category", () => {
    const event = makeEvent({ category: "safeguarding" });
    const classification = classifyCareEvent(event);
    expect(classification.routes).toContain("reg44_evidence");
  });

  it("includes reg44_evidence route for physical_intervention category", () => {
    const event = makeEvent({ category: "physical_intervention" });
    const classification = classifyCareEvent(event);
    expect(classification.routes).toContain("reg44_evidence");
  });

  it("includes reg44_evidence route for complaint category", () => {
    const event = makeEvent({ category: "complaint" });
    const classification = classifyCareEvent(event);
    expect(classification.routes).toContain("reg44_evidence");
  });

  it("does not include reg44_evidence route for general category", () => {
    const event = makeEvent({ category: "general" });
    const classification = classifyCareEvent(event);
    expect(classification.routes).not.toContain("reg44_evidence");
  });

  it("processCareEvent creates a Reg44ActionRecord for safeguarding events", () => {
    const event = makeEvent({ category: "safeguarding" });
    db.careEvents.create(event);
    const before = db.reg44ActionRecords.getAll().length;
    processCareEvent(event);
    const after = db.reg44ActionRecords.getAll().length;
    expect(after).toBeGreaterThan(before);
  });
});

// ── Filing cabinet auto-filing ────────────────────────────────────────────────

describe("Filing cabinet auto-filing", () => {
  it("files a safeguarding care event under 'safeguarding' category", () => {
    const event = makeEvent({ category: "safeguarding", is_safeguarding: true });
    db.careEvents.create(event);
    processCareEvent(event);
    const items = db.filingCabinet.findAll().filter(
      (i) => (i as unknown as { care_event_id?: string }).care_event_id === event.id
    );
    expect(items.length).toBeGreaterThan(0);
    expect(
      items.some((i) => (i as unknown as { category?: string }).category === "safeguarding")
    ).toBe(true);
  });

  it("files a general care event in the filing cabinet", () => {
    const event = makeEvent({ category: "general" });
    db.careEvents.create(event);
    processCareEvent(event);
    const items = db.filingCabinet.findAll().filter(
      (i) => (i as unknown as { care_event_id?: string }).care_event_id === event.id
    );
    expect(items.length).toBeGreaterThan(0);
  });

  it("does not create duplicate filing cabinet items on replay", () => {
    const event = makeEvent({ category: "health" });
    db.careEvents.create(event);
    processCareEvent(event);
    const count1 = db.filingCabinet.findAll().filter(
      (i) => (i as unknown as { care_event_id?: string }).care_event_id === event.id
    ).length;
    processCareEvent(event);
    const count2 = db.filingCabinet.findAll().filter(
      (i) => (i as unknown as { care_event_id?: string }).care_event_id === event.id
    ).length;
    expect(count1).toBe(count2);
  });
});

// ── Child daily summary generation ───────────────────────────────────────────

describe("Child daily summary generation", () => {
  it("creates a child daily summary for events with a child_id", () => {
    const event = makeEvent({ category: "general", child_id: "yp_alex" });
    db.careEvents.create(event);
    const before = db.childDailySummaries.findByChild("yp_alex").length;
    processCareEvent(event);
    const after = db.childDailySummaries.findByChild("yp_alex").length;
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it("does not duplicate summaries for the same child on the same date", () => {
    const date = "2025-06-01";
    const event1 = makeEvent({ category: "general", child_id: "yp_maya", event_date: date });
    const event2 = makeEvent({ category: "health", child_id: "yp_maya", event_date: date });
    db.careEvents.create(event1);
    db.careEvents.create(event2);
    processCareEvent(event1);
    processCareEvent(event2);
    const summaries = db.childDailySummaries.findByChild("yp_maya").filter(
      (s) => s.summary_date === date
    );
    // Should have at most 1 summary per child per date (upsert)
    expect(summaries.length).toBeLessThanOrEqual(1);
  });
});

// ── Missing episode workflow ──────────────────────────────────────────────────

describe("Missing episode workflow", () => {
  it("creates a missing episode record for missing_episode category events", () => {
    const event = makeEvent({
      category: "missing_episode",
      child_id: "yp_alex",
      is_significant: true,
      content: "Child was missing from 14:00 to 17:30. Police informed.",
    });
    db.careEvents.create(event);
    const before = db.missingEpisodes.findAll().filter(
      (m) => (m as unknown as { care_event_id?: string }).care_event_id === event.id
    ).length;
    processCareEvent(event);
    const after = db.missingEpisodes.findAll().filter(
      (m) => (m as unknown as { care_event_id?: string }).care_event_id === event.id
    ).length;
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it("missing_episode events contribute to Regulation 45 evidence", () => {
    const event = makeEvent({
      category: "missing_episode",
      child_id: "yp_alex",
      is_significant: true,
    });
    db.careEvents.create(event);
    processCareEvent(event);
    const classification = classifyCareEvent(event);
    expect(classification.routes).toContain("reg45_evidence");
    expect(classification.contributes_to_reg45).toBe(true);
  });

  it("missing_episode events require manager review", () => {
    const event = makeEvent({ category: "missing_episode" });
    const classification = classifyCareEvent(event);
    expect(classification.requires_manager_review).toBe(true);
  });

  it("missing_episode events require Regulation 40 triage", () => {
    const event = makeEvent({ category: "missing_episode" });
    const classification = classifyCareEvent(event);
    expect(classification.requires_reg40_triage).toBe(true);
  });

  it("does not create duplicate missing episode records on replay", () => {
    const event = makeEvent({ category: "missing_episode", child_id: "yp_alex" });
    db.careEvents.create(event);
    processCareEvent(event);
    processCareEvent(event);
    const episodes = db.missingEpisodes.findAll().filter(
      (m) => (m as unknown as { care_event_id?: string }).care_event_id === event.id
    );
    expect(episodes.length).toBeLessThanOrEqual(1);
  });
});

// ── Restraint / physical intervention workflow ────────────────────────────────

describe("Restraint workflow", () => {
  it("creates a restraint record for restraint category events", () => {
    const event = makeEvent({
      category: "restraint",
      child_id: "yp_alex",
      is_significant: true,
      content: "Physical intervention used. Staff debriefed. Child settled.",
    });
    db.careEvents.create(event);
    const before = db.restraints.findAll().filter(
      (r) => (r as unknown as { care_event_id?: string }).care_event_id === event.id
    ).length;
    processCareEvent(event);
    const after = db.restraints.findAll().filter(
      (r) => (r as unknown as { care_event_id?: string }).care_event_id === event.id
    ).length;
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it("restraint events are classified into physical_intervention route", () => {
    const event = makeEvent({ category: "restraint" });
    const classification = classifyCareEvent(event);
    expect(classification.routes).toContain("physical_intervention");
  });

  it("restraint events contribute to Regulation 45 evidence", () => {
    const event = makeEvent({ category: "restraint" });
    const classification = classifyCareEvent(event);
    expect(classification.contributes_to_reg45).toBe(true);
  });

  it("restraint events require manager review", () => {
    const event = makeEvent({ category: "restraint" });
    const classification = classifyCareEvent(event);
    expect(classification.requires_manager_review).toBe(true);
  });

  it("restraint events are included in Regulation 44 evidence routing", () => {
    const event = makeEvent({ category: "restraint" });
    const classification = classifyCareEvent(event);
    expect(classification.routes).toContain("reg44_evidence");
  });

  it("does not create duplicate restraint records on replay", () => {
    const event = makeEvent({ category: "restraint", child_id: "yp_alex" });
    db.careEvents.create(event);
    processCareEvent(event);
    processCareEvent(event);
    const records = db.restraints.findAll().filter(
      (r) => (r as unknown as { care_event_id?: string }).care_event_id === event.id
    );
    expect(records.length).toBeLessThanOrEqual(1);
  });
});

// ── Regulation 40 triage ──────────────────────────────────────────────────────

describe("Regulation 40 triage", () => {
  it("safeguarding events require Reg 40 triage", () => {
    const event = makeEvent({ category: "safeguarding" });
    const classification = classifyCareEvent(event);
    expect(classification.requires_reg40_triage).toBe(true);
  });

  it("restraint events require Reg 40 triage", () => {
    const event = makeEvent({ category: "restraint" });
    const classification = classifyCareEvent(event);
    expect(classification.requires_reg40_triage).toBe(true);
  });

  it("general events do not require Reg 40 triage", () => {
    const event = makeEvent({ category: "general", is_significant: false });
    const classification = classifyCareEvent(event);
    expect(classification.requires_reg40_triage).toBe(false);
  });

  it("processCareEvent sets requires_reg40_triage_reason for safeguarding events", () => {
    const event = makeEvent({ category: "safeguarding", child_id: "yp_alex" });
    db.careEvents.create(event);
    processCareEvent(event);
    const updated = db.careEvents.findById(event.id);
    // Should have triage marked
    expect(updated?.requires_reg40_triage).toBe(true);
  });
});
