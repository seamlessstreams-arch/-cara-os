import { describe, it, expect, vi } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// TWO COLLECTIONS MODELLING ONE RECORD, ONE OF THEM DEAD ON A LIVE TENANT
//
// dal.training and dal.trainingRecords were not different collections. In demo
// mode they returned the identical rows, because db.training's fallback reads
// getStore().trainingRecords — the very array dal.trainingRecords read
// directly. The duplication was therefore invisible in demo and total on live:
// dal.training queries training_records, dal.trainingRecords returned the array
// live-mode empties at module load.
//
// Seventeen routes read the dead one, all of them evidence-facing: the Ofsted
// workforce evidence export, the inspection evidence pack, inspection
// readiness, staff compliance summaries, retention and org risk. Leave was the
// same shape with ten routes, including rota generation and conflict detection
// — so a rota could be generated over someone's approved leave.
//
// These tests pin the fix from both ends: the live accessor really does read
// the table, and the dead accessors are gone rather than merely unused.
// ══════════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", async () => {
  const { makeFakeSupabaseModule } = await import("@/lib/test-utils/fake-supabase");
  return makeFakeSupabaseModule({
    training_records: [
      {
        id: "tr-1", home_id: "a0000000-0000-0000-0000-000000000001", staff_id: "st-1",
        course_name: "Safeguarding Level 3", category: "safeguarding", status: "valid",
        completed_date: "2026-03-02", expiry_date: "2027-03-02",
      },
      {
        id: "tr-2", home_id: "a0000000-0000-0000-0000-000000000001", staff_id: "st-2",
        course_name: "Medication Administration", category: "medication", status: "expiring_soon",
        completed_date: "2025-10-11", expiry_date: "2026-10-11",
      },
    ],
    leave_requests: [
      {
        id: "lr-1", home_id: "a0000000-0000-0000-0000-000000000001", staff_id: "st-1",
        leave_type: "annual", status: "approved",
        start_date: "2026-10-05", end_date: "2026-10-12", total_days: 6,
      },
    ],
  });
});

import { dal } from "@/lib/db";

describe("dal.training (the surviving accessor) reads the table", () => {
  it("returns training_records rows, which the collapsed twin never could", async () => {
    const rows = await dal.training.findAll();
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.id).sort()).toEqual(["tr-1", "tr-2"]);
  });
});

describe("dal.leave (the surviving accessor) reads the table", () => {
  it("returns leave_requests rows, which the collapsed twin never could", async () => {
    const rows = await dal.leave.findAll();
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("lr-1");
  });
});

describe("the dead twins are removed, not just unreferenced", () => {
  // Left in place they are the path of least resistance: the next route to need
  // training reaches for the name that reads like the table.
  it("dal has no trainingRecords accessor", () => {
    expect("trainingRecords" in dal).toBe(false);
  });

  it("dal has no leaveRequests accessor", () => {
    expect("leaveRequests" in dal).toBe(false);
  });
});
