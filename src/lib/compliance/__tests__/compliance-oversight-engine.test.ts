import { describe, expect, it } from "vitest";
import { analyseComplianceOversight, type OversightDoc, type OversightTask } from "../compliance-oversight-engine";

const TODAY = "2026-06-13";

function doc(over: Partial<OversightDoc> = {}): OversightDoc {
  return {
    id: "d1", title: "Statement of Purpose", category: "statement_of_purpose", category_label: "Statement of Purpose",
    review_due: null, expiry: null, risk_level: "low", status: "review", actions_suggested: 0, uploaded_at: "2026-06-01",
    ...over,
  };
}

describe("analyseComplianceOversight — per-document state", () => {
  it("classifies current / expiring / overdue / no_date", () => {
    const r = analyseComplianceOversight({
      today: TODAY,
      documents: [
        doc({ id: "cur", review_due: "2026-12-01" }),
        doc({ id: "exp", review_due: "2026-06-20" }), // 7 days → expiring
        doc({ id: "od", expiry: "2026-05-01" }),       // past → overdue
        doc({ id: "nd" }),                              // no date
      ],
      tasks: [],
    });
    const byId = Object.fromEntries(r.documents.map((p) => [p.id, p.state]));
    expect(byId.cur).toBe("current");
    expect(byId.exp).toBe("expiring");
    expect(byId.od).toBe("overdue");
    expect(byId.nd).toBe("no_date");
  });

  it("joins tasks by linked_document_id (open / overdue / done)", () => {
    const tasks: OversightTask[] = [
      { id: "t1", linked_document_id: "d1", status: "in_progress", due_date: "2026-05-01" }, // overdue
      { id: "t2", linked_document_id: "d1", status: "not_started", due_date: "2026-12-01" }, // open
      { id: "t3", linked_document_id: "d1", status: "completed", due_date: "2026-05-01" },   // done
      { id: "t4", linked_document_id: "other", status: "not_started", due_date: null },       // not ours
    ];
    const r = analyseComplianceOversight({ today: TODAY, documents: [doc({ id: "d1", review_due: "2026-12-01" })], tasks });
    const p = r.documents[0];
    expect(p.actions_total).toBe(3);
    expect(p.actions_open).toBe(2);
    expect(p.actions_overdue).toBe(1);
    expect(p.actions_done).toBe(1);
  });
});

describe("analyseComplianceOversight — rollup", () => {
  it("scores, rates and orders worst-first; overdue docs drag rating down", () => {
    const r = analyseComplianceOversight({
      today: TODAY,
      documents: [doc({ id: "ok", review_due: "2027-01-01" }), doc({ id: "od1", expiry: "2026-01-01" }), doc({ id: "od2", review_due: "2026-02-01" })],
      tasks: [],
    });
    expect(r.summary.overdue_documents).toBe(2);
    expect(r.score).toBeLessThan(80);
    expect(["needs_attention", "inadequate"]).toContain(r.rating);
    expect(r.documents[0].state).toBe("overdue"); // worst first
    expect(r.recommendations[0].urgency).toBe("immediate");
  });

  it("lists critical dates within 60 days, soonest first", () => {
    const r = analyseComplianceOversight({
      today: TODAY,
      documents: [doc({ id: "a", expiry: "2026-08-01" }), doc({ id: "b", review_due: "2026-06-20" }), doc({ id: "c", review_due: "2027-01-01" })],
      tasks: [],
    });
    expect(r.critical_dates.map((c) => c.document_id)).toEqual(["b", "a"]); // c is >60d out, excluded
    expect(r.critical_dates[0].days_until).toBeLessThan(r.critical_dates[1].days_until);
  });

  it("rates good when everything is current with no open actions", () => {
    const r = analyseComplianceOversight({ today: TODAY, documents: [doc({ id: "x", review_due: "2027-03-01" })], tasks: [] });
    expect(r.rating).toBe("good");
    expect(r.score).toBe(100);
  });

  it("recommends tracking suggested-but-untracked actions", () => {
    const r = analyseComplianceOversight({ today: TODAY, documents: [doc({ id: "d1", review_due: "2027-01-01", actions_suggested: 3 })], tasks: [] });
    expect(r.recommendations.some((rec) => /not yet tracked/i.test(rec.action))).toBe(true);
  });
});
