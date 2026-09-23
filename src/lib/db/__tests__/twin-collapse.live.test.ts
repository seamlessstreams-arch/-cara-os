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
// Seventeen routes read the dead one, all evidence-facing: the Ofsted workforce
// evidence export, the inspection evidence pack, inspection readiness, staff
// compliance summaries, retention and org risk. Leave was the same shape with
// ten routes, including rota generation and conflict detection — so a rota
// could be generated over someone's approved leave. Audits was the same again
// with four.
//
// These tests pin the fix from both ends: the surviving accessor really reads
// the table, and the dead ones are gone rather than merely unreferenced.
//
// The second half of the file pins the opposite: three pairs that LOOK like the
// same problem and are not, so that the next pass at this does not merge them.
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
    qa_audits: [
      {
        id: "qa-1", home_id: "a0000000-0000-0000-0000-000000000001",
        title: "Medication storage audit", category: "medication", date: "2026-09-01",
        completed_by: "st-1", score: 18, max_score: 20, status: "completed",
      },
    ],
  });
});

import { dal } from "@/lib/db";

describe("the surviving accessors read their tables", () => {
  it("dal.training returns training_records rows the collapsed twin never could", async () => {
    const rows = await dal.training.findAll();
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.id).sort()).toEqual(["tr-1", "tr-2"]);
  });

  it("dal.leave returns leave_requests rows the collapsed twin never could", async () => {
    const rows = await dal.leave.findAll();
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("lr-1");
  });

  it("dal.qaAudits returns qa_audits rows the collapsed twin never could", async () => {
    const rows = await dal.qaAudits.findAll();
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("qa-1");
  });
});

describe("the dead twins are removed, not just unreferenced", () => {
  // Left in place they are the path of least resistance: the next route to need
  // training reaches for the name that reads like the table.
  it.each([["trainingRecords"], ["leaveRequests"], ["audits"]])(
    "dal has no %s accessor",
    (name) => {
      expect(name in dal).toBe(false);
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// NOT TWINS — do not collapse these
//
// All three were listed alongside the ones above as "the same real-world record
// modelled twice". They are not, and merging them would lose the part an
// inspector actually reads. Pinned here so the claim has to be re-argued rather
// than re-assumed.
// ─────────────────────────────────────────────────────────────────────────────

describe("collections that look like twins and are not", () => {
  it("keeps qaAuditRecords: Audit stores findings/actions as counts, this stores them as content", () => {
    // qa_audits has `findings text` and `actions text`. QAAuditRecord has
    // findings, strengths and areas_for_improvement as string[], actions as
    // structured QAAuditAction[], plus auditor, scope, overall_rating, notes.
    // A merge keeps the score and discards the audit.
    expect("qaAuditRecords" in dal).toBe(true);
  });

  it("keeps reflectiveSupervisions: the supervisions table has one discussion_points column", () => {
    // Supervision models the scheduling and sign-off of a session.
    // ReflectiveSupervisionRecord models its content — emotional_wellbeing,
    // workload, safeguarding_concerns, relationships_with_children,
    // reflective_practice, pace_examples, professional_boundaries,
    // training_needs, confidence_level, manager_feedback. That is the Reg
    // 33(4)(b) evidence, and there is nowhere in supervisions to put it.
    expect("reflectiveSupervisions" in dal).toBe(true);
  });

  it("keeps uploadedDocuments and trackedDocuments: three concepts, not one", () => {
    // documents          — the policy and procedure library (requires_read_sign)
    // uploadedDocuments  — the document-intelligence pipeline: stored file,
    //                      extracted text, AI classification, risk, approval
    // trackedDocuments   — an expiry tracker: expiry_date, renewal_lead_time,
    //                      renewal_owner
    // They share a word, not a record.
    expect("uploadedDocuments" in dal).toBe(true);
    expect("trackedDocuments" in dal).toBe(true);
  });
});
