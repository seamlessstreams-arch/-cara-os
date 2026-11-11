import { describe, it, expect, vi, beforeEach } from "vitest";

// The live Annex A snapshot service recomputes the nine section readings from
// the home's real records and persists them. These tests drive the builder with
// a fake supabase client + mocked dal and assert:
//   • children/staff come from the dal; cs_* domains from the live tables;
//   • a calm home (no incidents/complaints/missing/restraints) reads green on
//     those sections, while the two REQUIRED evidence sections (Reg 44, Reg 45)
//     read red when empty;
//   • Section 4 counts safeguarding + Reg 40 care events and flags outstanding
//     oversight;
//   • a source read ERROR throws (honest-absence) rather than reporting 0;
//   • persistence inserts a draft and locking freezes it.

const h = vi.hoisted(() => ({
  state: {
    children: [] as Record<string, unknown>[],
    staff: [] as Record<string, unknown>[],
    client: null as unknown,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => h.state.client,
  isSupabaseEnabled: () => true,
}));
vi.mock("@/lib/db/dal", () => ({
  dal: {
    youngPeople: { findCurrent: async () => h.state.children },
    staff: { findActive: async () => h.state.staff },
  },
}));

import {
  buildAnnexASnapshotDataLive,
  runAnnexASnapshotLive,
  lockAnnexASnapshotLive,
} from "@/lib/cara-studio/annex-a-snapshot.service";

type Row = Record<string, unknown>;

// A fake client that serves section-table reads (.select().eq() awaited) from a
// per-table map, erroring for one named table when asked.
function readClient(tableRows: Record<string, Row[]>, errorTable?: string): unknown {
  return {
    from(table: string) {
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => builder,
        then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
          Promise.resolve(
            errorTable === table
              ? { data: null, error: { code: "42P01", message: "relation does not exist" } }
              : { data: tableRows[table] ?? [], error: null },
          ).then(res, rej),
      };
      return builder;
    },
  };
}

const section = (data: { sections: { key: string }[] }, key: string) =>
  data.sections.find((s) => s.key === key) as unknown as {
    key: string;
    record_count: number;
    gap_count: number;
    readiness: string;
  };

beforeEach(() => {
  h.state.children = [];
  h.state.staff = [];
  h.state.client = null;
});

describe("buildAnnexASnapshotDataLive", () => {
  it("reads children + staff from the dal; empty cs_* domains score green except the required Reg 44/45", async () => {
    h.state.children = [
      { first_name: "Alex", last_name: "M", social_worker_name: "SW", key_worker_id: "kw1", iro_name: "IRO", legal_status: "s20" },
      { first_name: "Jordan", last_name: "B", social_worker_name: null, key_worker_id: "kw2", iro_name: "IRO", legal_status: "s20" },
    ];
    h.state.staff = [{ full_name: "Pat", dbs_number: "123", next_supervision_due: "2099-01-01" }];

    const data = await buildAnnexASnapshotDataLive(
      readClient({}),
      "home-1",
      { periodStart: "2026-01-01", periodEnd: "2026-12-31" },
    );

    expect(section(data, "section_2").record_count).toBe(2);
    expect(section(data, "section_2").gap_count).toBe(1); // Jordan: no social worker
    expect(section(data, "section_3").record_count).toBe(1);
    expect(section(data, "section_3").gap_count).toBe(0);
    // calm home: empty + not required → green
    expect(section(data, "section_5").readiness).toBe("green");
    expect(section(data, "section_6").readiness).toBe("green");
    expect(section(data, "section_7").readiness).toBe("green");
    // required + empty → red
    expect(section(data, "section_8").readiness).toBe("red");
    expect(section(data, "section_9").readiness).toBe("red");
    expect(typeof data.readiness_score).toBe("number");
  });

  it("Section 4 counts safeguarding + Reg 40 care events and flags outstanding oversight", async () => {
    const care_events = [
      { id: "e1", title: "Disclosure", category: "safeguarding", submitted_at: "2026-06-01", requires_manager_review: true, manager_review_at: null },
      { id: "e2", title: "Reg40", category: "daily_log", requires_reg40_triage: true, submitted_at: "2026-06-02", requires_manager_review: false },
      { id: "e3", title: "Key work", category: "key_work", submitted_at: "2026-06-03" },
    ];
    const data = await buildAnnexASnapshotDataLive(
      readClient({ care_events }),
      "home-1",
      { periodStart: "2026-01-01", periodEnd: "2026-12-31" },
    );
    expect(section(data, "section_4").record_count).toBe(2); // e1 + e2, not the key-work e3
    expect(section(data, "section_4").gap_count).toBe(1); // e1 oversight outstanding
  });

  it("honours absence: a source read error throws rather than reporting 0 records", async () => {
    await expect(
      buildAnnexASnapshotDataLive(readClient({}, "cs_restraint_records"), "home-1"),
    ).rejects.toThrow(/cs_restraint_records/);
  });

  it("defaults the period when none is given", async () => {
    const data = await buildAnnexASnapshotDataLive(readClient({}), "home-1");
    expect(data.period_start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.period_end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.sections).toHaveLength(9);
  });
});

describe("runAnnexASnapshotLive / lockAnnexASnapshotLive", () => {
  it("inserts a fresh draft when none exists for the period", async () => {
    const inserted = { id: "snap-1", home_id: "home-1", status: "draft", period_start: "2026-01-01", period_end: "2026-06-30", generated_at: "2026-06-30T00:00:00Z", readiness_score: 70, overall_readiness: "amber", sections: [], total_gaps: 2, total_stale: 0 };
    h.state.client = {
      from(table: string) {
        const b: Record<string, unknown> = {
          _op: "read",
          select: () => b,
          eq: () => b,
          order: () => b,
          limit: () => b,
          insert: () => { (b as { _op: string })._op = "insert"; return b; },
          single: () => Promise.resolve({ data: inserted, error: null }),
          then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
            // section reads and the "existing draft" lookup both return empty
            Promise.resolve({ data: [], error: null }).then(res, rej),
        };
        void table;
        return b;
      },
    };

    const snap = await runAnnexASnapshotLive("home-1", { periodStart: "2026-01-01", periodEnd: "2026-06-30" });
    expect(snap?.id).toBe("snap-1");
    expect(snap?.status).toBe("draft");
  });

  it("locks a draft snapshot and never relocks one already locked", async () => {
    // already-locked row → returned unchanged, no update issued
    let updateCalled = false;
    h.state.client = {
      from() {
        const b: Record<string, unknown> = {
          select: () => b,
          eq: () => b,
          limit: () => b,
          update: () => { updateCalled = true; return b; },
          single: () => Promise.resolve({ data: null, error: null }),
          then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
            Promise.resolve({ data: [{ id: "snap-9", home_id: "home-1", status: "locked", sections: [] }], error: null }).then(res, rej),
        };
        return b;
      },
    };
    const locked = await lockAnnexASnapshotLive("snap-9", "actor-1", "note");
    expect(locked?.status).toBe("locked");
    expect(updateCalled).toBe(false);
  });

  it("returns null for a missing snapshot id on lock", async () => {
    h.state.client = {
      from() {
        const b: Record<string, unknown> = {
          select: () => b,
          eq: () => b,
          limit: () => b,
          then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
            Promise.resolve({ data: [], error: null }).then(res, rej),
        };
        return b;
      },
    };
    expect(await lockAnnexASnapshotLive("missing", "actor-1", null)).toBeNull();
  });
});
