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

  it("writes nothing to Supabase for the record types Phase 1 does not cover (no fabricated mirror)", async () => {
    // education events have no cs_ table yet — they must NOT invent a live write.
    processCareEvent(makeEvent({ category: "education", title: "Suspension", content: "2-day fixed-term." }));
    await flush();
    expect(insertsTo("education_records")).toEqual([]);
    expect(insertsTo("cs_education_records")).toEqual([]);
  });
});
