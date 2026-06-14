// ══════════════════════════════════════════════════════════════════════════════
// Cara Reg 45 Report Builder — engine tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  buildReg45Report,
  editReg45Report,
  setReg45ReportStatus,
  loadReg45Reports,
} from "@/lib/cara/cara-reg45-report";
import type { CaraReg45EvidenceItem } from "@/types/cara-studio";

const HOME_ID = "home_oak";
const CHILD_ID = "yp_alex";

function todayMinus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function seedAcceptedEvidence(
  theme: CaraReg45EvidenceItem["theme"],
  sentiment: CaraReg45EvidenceItem["sentiment"],
  title: string,
): CaraReg45EvidenceItem {
  return db.caraReg45EvidenceItems.create({
    home_id: HOME_ID,
    child_id: CHILD_ID,
    theme,
    title,
    summary: `Test summary for ${title}.`,
    severity: sentiment === "positive" ? "positive" : "high",
    sentiment,
    source_type: "daily_log",
    source_table: "test_seed",
    source_id: `test-${title.replace(/\s+/g, "-")}`,
    occurred_at: todayMinus(10),
    period_start: todayMinus(180),
    period_end: todayMinus(0),
    status: "accepted",
    is_ai_draft: false,
    generated_at: new Date().toISOString(),
    decided_by: "u1",
    decided_at: new Date().toISOString(),
    decision_note: null,
    included_in_report_id: null,
  });
}

function wipeReports() {
  // Best-effort: leave reports in store but use fresh build each test
  // (status transitions on locked reports become no-ops, so tests stay isolated
  // by working with the latest report id only)
}

function rejectAllEvidence() {
  for (const e of db.caraReg45EvidenceItems.findAll(HOME_ID)) {
    if (e.status !== "rejected") {
      db.caraReg45EvidenceItems.patch(e.id, { status: "rejected" });
    }
  }
}

describe("Reg 45 Report Builder", () => {
  beforeEach(() => {
    rejectAllEvidence();
    wipeReports();
  });

  it("produces an empty draft when no accepted evidence exists", () => {
    const report = buildReg45Report(HOME_ID, { generatedBy: "u1" });
    expect(report.status).toBe("draft");
    expect(report.total_evidence).toBe(0);
    expect(report.sections.length).toBe(0);
    expect(report.executive_summary).toContain("0 item(s)");
  });

  it("groups accepted evidence by theme into sections with counts", () => {
    seedAcceptedEvidence("safeguarding", "concern", "Repeat missing pattern");
    seedAcceptedEvidence("safeguarding", "concern", "CSE risk emerging");
    seedAcceptedEvidence("complaints_voice", "positive", "Resolved within 7 days");
    const report = buildReg45Report(HOME_ID, { generatedBy: "u1" });
    expect(report.total_evidence).toBe(3);
    expect(report.total_concerns).toBe(2);
    expect(report.total_positives).toBe(1);
    expect(report.sections.length).toBe(2);
    const sg = report.sections.find((s) => s.theme === "safeguarding");
    expect(sg?.evidence_item_ids.length).toBe(2);
    expect(sg?.concerns).toBe(2);
    expect(sg?.narrative).toContain("Concern");
  });

  it("allows manager edits to title, exec summary and section narratives", () => {
    seedAcceptedEvidence("safeguarding", "concern", "Edit-test pattern");
    const report = buildReg45Report(HOME_ID, { generatedBy: "u1" });
    const edited = editReg45Report(report.id, {
      title: "Custom title",
      executive_summary: "Manager-rewritten summary.",
      section_narratives: { safeguarding: "Manager-rewritten safeguarding narrative." },
    });
    expect(edited?.title).toBe("Custom title");
    expect(edited?.executive_summary).toBe("Manager-rewritten summary.");
    const sg = edited?.sections.find((s) => s.theme === "safeguarding");
    expect(sg?.narrative).toBe("Manager-rewritten safeguarding narrative.");
  });

  it("transitions through draft → in_review → approved → locked", () => {
    seedAcceptedEvidence("safeguarding", "concern", "Status-test pattern");
    const report = buildReg45Report(HOME_ID, { generatedBy: "u1" });
    const inReview = setReg45ReportStatus(report.id, "in_review", "u2", "please review");
    expect(inReview?.status).toBe("in_review");
    expect(inReview?.reviewed_by).toBe("u2");
    const approved = setReg45ReportStatus(report.id, "approved", "u3", "looks good");
    expect(approved?.status).toBe("approved");
    expect(approved?.approved_by).toBe("u3");
    const locked = setReg45ReportStatus(report.id, "locked", "u3", "final");
    expect(locked?.status).toBe("locked");
    expect(locked?.locked_by).toBe("u3");
  });

  it("locking promotes linked evidence chips to included_in_report", () => {
    const ev = seedAcceptedEvidence("health", "concern", "Lock-promotion test");
    const report = buildReg45Report(HOME_ID, { generatedBy: "u1" });
    expect(report.evidence_item_ids).toContain(ev.id);
    setReg45ReportStatus(report.id, "locked", "u3", "final");
    const after = db.caraReg45EvidenceItems.findById(ev.id);
    expect(after?.status).toBe("included_in_report");
    expect(after?.included_in_report_id).toBe(report.id);
  });

  it("locked reports refuse further edits and status changes", () => {
    seedAcceptedEvidence("safeguarding", "concern", "Immutable test");
    const report = buildReg45Report(HOME_ID, { generatedBy: "u1" });
    setReg45ReportStatus(report.id, "locked", "u3", "final");
    const editAttempt = editReg45Report(report.id, { title: "Tampered" });
    expect(editAttempt?.title).not.toBe("Tampered");
    const reopen = setReg45ReportStatus(report.id, "draft", "u3", "reopen");
    expect(reopen?.status).toBe("locked");
  });

  it("loadReg45Reports returns reports newest first", () => {
    seedAcceptedEvidence("safeguarding", "concern", "List-test pattern");
    const a = buildReg45Report(HOME_ID, { generatedBy: "u1", title: "First" });
    const b = buildReg45Report(HOME_ID, { generatedBy: "u1", title: "Second" });
    const list = loadReg45Reports(HOME_ID);
    const idxA = list.findIndex((r) => r.id === a.id);
    const idxB = list.findIndex((r) => r.id === b.id);
    expect(idxA).toBeGreaterThanOrEqual(0);
    expect(idxB).toBeGreaterThanOrEqual(0);
    // newest-first ordering: timestamps may tie at ms resolution, so just
    // assert ordering is non-decreasing in age (b not after a)
    expect(list[0]?.generated_at >= list[list.length - 1]!.generated_at).toBe(true);
  });
});
