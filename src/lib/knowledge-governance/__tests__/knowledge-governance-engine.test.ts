import { describe, it, expect } from "vitest";
import {
  buildKnowledgeGovernance,
  validateGovernance,
  type KnowledgeGovernanceRecord,
} from "../knowledge-governance-engine";
import type { KBEntry } from "@/lib/cara/knowledge-base";

// The engine's contract (§6):
//   - an INFORMAL source (blog / video / infographic) that is KB-approved and
//     lacks a review or stated limitations is flagged — it must never be
//     treated as authority without review;
//   - approved-but-unassessed entries can't be weighed;
//   - reviews expire; overdue is a governance gap;
//   - a well-governed entry reads as a positive, not a prompt.

const NOW = new Date("2026-07-16T12:00:00Z");

let n = 0;
function entry(over: Partial<KBEntry> = {}): KBEntry {
  n += 1;
  return {
    id: `kb_${n}`,
    type: "model",
    title: `Entry ${n}`,
    origin: "Test origin",
    summary: "",
    principles: [],
    why_for_cara: "",
    tags: [],
    links: [],
    status: "approved",
    ingested_at: "2026-01-01",
    reviewed: true,
    ...over,
  };
}
function gov(over: Partial<KnowledgeGovernanceRecord> & { entry_id: string }): KnowledgeGovernanceRecord {
  return {
    evidence_status: "unassessed",
    permitted_use: "",
    limitations: "",
    reviewer: "",
    reviewed_at: null,
    next_review: null,
    version: 1,
    updated_at: "2026-01-01",
    updated_by: "staff_test",
    ...over,
  };
}

describe("§6 core rule — informal source never treated as authority without review", () => {
  it("flags an approved informal source with no reviewer", () => {
    const e = entry({ id: "kb_yt", type: "source", title: "A practitioner's YouTube channel" });
    const s = buildKnowledgeGovernance([e], [gov({ entry_id: "kb_yt", evidence_status: "practitioner_summary" })], NOW);
    const d = s.detections.find((x) => x.key === "informal_source_as_authority");
    expect(d).toBeTruthy();
    expect(d!.whyShown).toMatch(/never be treated as statutory, clinical or scientific authority/i);
  });

  it("flags an approved informal source that has a reviewer but no limitations", () => {
    const s = buildKnowledgeGovernance(
      [entry({ id: "kb_ig", type: "source" })],
      [gov({ entry_id: "kb_ig", evidence_status: "informal_graphic", reviewer: "RM", limitations: "" })],
      NOW,
    );
    expect(s.detections.some((x) => x.key === "informal_source_as_authority")).toBe(true);
  });

  it("does NOT flag an informal source once reviewed WITH limitations recorded", () => {
    const s = buildKnowledgeGovernance(
      [entry({ id: "kb_ok", type: "source" })],
      [gov({ entry_id: "kb_ok", evidence_status: "practitioner_summary", reviewer: "RM", limitations: "Reflective prompt only; not evidence for a safeguarding decision." })],
      NOW,
    );
    expect(s.detections.some((x) => x.key === "informal_source_as_authority")).toBe(false);
  });

  it("does not flag an authoritative source lacking limitations — authority does not need the caveat", () => {
    const s = buildKnowledgeGovernance(
      [entry({ id: "kb_stat", type: "regulation" })],
      [gov({ entry_id: "kb_stat", evidence_status: "statutory", reviewer: "RM", next_review: "2027-01-01" })],
      NOW,
    );
    expect(s.detections.some((x) => x.key === "informal_source_as_authority")).toBe(false);
    expect(s.detections.some((x) => x.key === "governed_well")).toBe(true);
  });
});

describe("other governance gaps", () => {
  it("flags approved-but-unassessed", () => {
    const s = buildKnowledgeGovernance([entry({ id: "kb_u" })], [], NOW);
    expect(s.detections.some((x) => x.key === "approved_but_unassessed")).toBe(true);
  });

  it("flags an overdue review", () => {
    const s = buildKnowledgeGovernance(
      [entry({ id: "kb_old" })],
      [gov({ entry_id: "kb_old", evidence_status: "organisational", reviewer: "RM", next_review: "2026-06-01" })],
      NOW,
    );
    const d = s.detections.find((x) => x.key === "review_overdue");
    expect(d?.headline).toMatch(/overdue by \d+ days/i);
  });

  it("flags a pending source awaiting review — correctly held out of the engines", () => {
    const s = buildKnowledgeGovernance(
      [entry({ id: "kb_p", type: "source", status: "pending_review" })],
      [],
      NOW,
    );
    expect(s.detections.some((x) => x.key === "pending_source_unreviewed")).toBe(true);
  });
});

describe("summary counts + evidence distribution", () => {
  it("counts authoritative vs informal vs unassessed and builds the distribution", () => {
    const s = buildKnowledgeGovernance(
      [entry({ id: "a" }), entry({ id: "b" }), entry({ id: "c" })],
      [
        gov({ entry_id: "a", evidence_status: "statutory", reviewer: "RM", next_review: "2027-01-01" }),
        gov({ entry_id: "b", evidence_status: "practitioner_summary", reviewer: "RM", limitations: "reflective only" }),
      ],
      NOW,
    );
    expect(s.counts.authoritative).toBe(1);
    expect(s.counts.informal).toBe(1);
    expect(s.counts.unassessed).toBe(1);
    expect(s.byEvidence.map((x) => x.status)).toEqual(expect.arrayContaining(["statutory", "practitioner_summary", "unassessed"]));
  });
});

describe("validateGovernance guard", () => {
  it("requires limitations before recording an informal source as reviewed", () => {
    expect(validateGovernance({ evidence_status: "informal_graphic", reviewer: "RM", limitations: "" }))
      .toMatch(/must NOT be cited to support/i);
    expect(validateGovernance({ evidence_status: "informal_graphic", reviewer: "RM", limitations: "poster only" }))
      .toBeNull();
  });

  it("does not constrain authoritative sources", () => {
    expect(validateGovernance({ evidence_status: "statutory", reviewer: "RM", limitations: "" })).toBeNull();
  });
});
