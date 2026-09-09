import { describe, it, expect, beforeEach, vi } from "vitest";
import type { CareEvent } from "@/types/care-events";

// Phase 1 proof: when Supabase is enabled, the sync care-events processor's
// domain-record writes are MIRRORED to the real tables (best-effort
// write-through) instead of evaporating in the per-instance in-memory store.
// A self-contained recording mock captures the inserts the write-throughs fire
// (no dependency on the queue's fake-supabase, so this stands alone on main).
const recorded: Array<{ table: string; op: string; payload: unknown }> = [];

vi.mock("@/lib/supabase/server", () => {
  const builder = (table: string) => {
    const b: Record<string, unknown> = {};
    for (const m of ["select", "eq", "order", "limit", "in", "is"]) b[m] = () => b;
    b.insert = (payload: unknown) => { recorded.push({ table, op: "insert", payload }); return b; };
    b.upsert = (payload: unknown) => { recorded.push({ table, op: "upsert", payload }); return b; };
    b.single = () => Promise.resolve({ data: { id: "generated" }, error: null });
    b.maybeSingle = () => Promise.resolve({ data: { id: "generated" }, error: null });
    b.then = (res: (v: { data: unknown; error: null }) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(res);
    return b;
  };
  return {
    isSupabaseEnabled: () => true,
    createServerClient: () => ({ from: (t: string) => builder(t) }),
  };
});

import { processCareEvent } from "../processor";

function makeEvent(overrides: Partial<CareEvent>): CareEvent {
  return {
    id: `ce_persist_${Math.random().toString(36).slice(2)}`,
    home_id: "home_oak", child_id: "yp_alex", shift_id: null, staff_id: "staff_ryan",
    verified_by: null, returned_by: null, locked_by: null,
    category: "general", title: "Test", content: "Content", mood_score: null,
    is_significant: false, status: "routing", event_date: "2026-02-01", event_time: null,
    requires_manager_review: false, requires_reg40_triage: false, contributes_to_reg45: false,
    contributes_to_annex_a: false, is_safeguarding: false, evidence_prompts: [], areas_updated: [],
    version: 1, previous_version_id: null, amendment_reason: null, amended_by: null, amended_at: null,
    is_current_version: true, submitted_at: null, submitted_by: null, verified_at: null,
    returned_at: null, return_reason: null, locked_at: null, staff_signature: true,
    routing_started_at: null, routing_completed_at: null, routing_failed_at: null,
    routing_failure_reason: null, manager_notes: null, evidence_approved: false,
    ...overrides,
  } as CareEvent;
}

const flush = () => new Promise((r) => setTimeout(r, 20));
const insertsTo = (table: string) => recorded.filter((w) => w.table === table && w.op === "insert");

describe("care-events processor — live persistence write-through (Phase 1)", () => {
  beforeEach(() => { recorded.length = 0; });

  it("mirrors a safeguarding event's chronology entry and manager notification to Supabase", async () => {
    processCareEvent(makeEvent({
      category: "safeguarding", is_safeguarding: true, is_significant: true,
      title: "Disclosure during key-work", content: "Child disclosed a safeguarding concern.",
      requires_manager_review: true,
    }));
    await flush();
    expect(insertsTo("chronology_entries").length).toBeGreaterThan(0);
    expect(insertsTo("notifications").length).toBeGreaterThan(0);
    // the chronology payload carries the real event content, not a fabricated stub
    const chron = insertsTo("chronology_entries")[0].payload as Record<string, unknown>;
    expect(String(chron.title ?? "")).toContain("Disclosure");
  });

  it("mirrors a missing-episode event's episode record to Supabase", async () => {
    processCareEvent(makeEvent({
      category: "missing_episode", title: "Missing from placement",
      content: "Returned after 3 hours.",
    }));
    await flush();
    expect(insertsTo("missing_episodes").length).toBeGreaterThan(0);
  });

  it("mirrors a health event's record to the generic_records catch-all (Phase 2)", async () => {
    processCareEvent(makeEvent({
      category: "health", child_id: "yp_alex", title: "GP appointment",
      content: "Seen by GP for a persistent cough; antibiotics prescribed.",
    }));
    await flush();
    const generic = insertsTo("generic_records");
    const health = generic.find((w) => (w.payload as Record<string, unknown>).record_type === "healthRecordEntries");
    expect(health, "no generic_records insert for healthRecordEntries").toBeDefined();
    // child_id is kept so the record round-trips into the health-intelligence engine
    const p = health!.payload as Record<string, unknown>;
    expect(p.child_id).toBe("yp_alex");
    expect((p.data as Record<string, unknown>).child_id).toBe("yp_alex");
  });

  it("mirrors filing-cabinet items and saved-time metrics to generic_records (Phase 4)", async () => {
    processCareEvent(makeEvent({
      category: "safeguarding", is_safeguarding: true, child_id: "yp_alex",
      title: "Disclosure", content: "A safeguarding disclosure.", requires_manager_review: true,
    }));
    await flush();
    const generic = insertsTo("generic_records");
    const filing = generic.find((w) => (w.payload as Record<string, unknown>).record_type === "filingCabinet");
    const saved = generic.find((w) => (w.payload as Record<string, unknown>).record_type === "savedTimeMetrics");
    expect(filing, "no generic_records insert for filingCabinet").toBeDefined();
    expect(saved, "no generic_records insert for savedTimeMetrics").toBeDefined();
    // the filing item keeps its category/care-event linkage in data (round-trips)
    const fd = (filing!.payload as Record<string, unknown>).data as Record<string, unknown>;
    expect(fd.care_event_id).toBeTruthy();
  });

  it("mirrors an education event to cs_education_events, not the profile or the catch-all (Phase 3)", async () => {
    processCareEvent(makeEvent({
      category: "education", child_id: "yp_alex", title: "Fixed-term suspension",
      content: "2-day fixed-term suspension after a dining-hall incident.",
    }));
    await flush();
    expect(insertsTo("cs_education_events").length).toBeGreaterThan(0);
    const evt = insertsTo("cs_education_events")[0].payload as Record<string, unknown>;
    expect(String(evt.title ?? "")).toContain("suspension");
    expect(evt.child_id).toBe("yp_alex");
    // NOT the #108 profile table, and NOT the generic_records catch-all
    expect(insertsTo("cs_education_records")).toEqual([]);
    const genericEdu = insertsTo("generic_records").find(
      (w) => (w.payload as Record<string, unknown>).record_type === "educationRecords",
    );
    expect(genericEdu).toBeUndefined();
  });
});
