// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DOCUMENT GOVERNANCE INTELLIGENCE ENGINE — TESTS
// ══════════════════════════════════════════════════════════════════════════════

import {
  computeHomeDocumentGovernance,
  type DocumentInput,
  type ReadReceiptInput,
  type HomeDocumentInput,
} from "../home-document-governance-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function makeDoc(overrides: Partial<DocumentInput> = {}): DocumentInput {
  return {
    id: "doc_1",
    category: "policy",
    requires_read_sign: true,
    expiry_date: "2026-12-31",
    version: 2,
    has_linked_child: false,
    has_linked_incident: false,
    tags: ["mandatory"],
    created_date: "2026-01-01",
    updated_date: "2026-05-01",
    ...overrides,
  };
}

function makeReceipt(overrides: Partial<ReadReceiptInput> = {}): ReadReceiptInput {
  return {
    document_id: "doc_1",
    staff_id: "staff_1",
    has_signed: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeDocumentInput> = {}): HomeDocumentInput {
  return {
    today: TODAY,
    documents: [],
    read_receipts: [],
    total_staff: 5,
    ...overrides,
  };
}

// ── Insufficient Data ───────────────────────────────────────────────────────

describe("Home Document Governance Intelligence Engine", () => {
  describe("insufficient data", () => {
    it("returns insufficient_data with no documents", () => {
      const r = computeHomeDocumentGovernance(baseInput());
      expect(r.document_rating).toBe("insufficient_data");
      expect(r.document_score).toBe(0);
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBe(1);
      expect(r.insights.length).toBe(1);
      expect(r.insights[0].severity).toBe("critical");
    });
  });

  // ── Outstanding ───────────────────────────────────────────────────────────

  describe("outstanding rating", () => {
    it("achieves outstanding with perfect document governance", () => {
      // Need 5+ categories, all docs with multiple versions, none expired, none stale
      // All read, all signed, mandatory docs fully read
      const docs = [
        makeDoc({ id: "doc_1", category: "policy", version: 3, tags: ["mandatory"], expiry_date: "2026-12-31", updated_date: "2026-05-01" }),
        makeDoc({ id: "doc_2", category: "procedure", version: 2, tags: ["mandatory"], expiry_date: "2026-11-30", updated_date: "2026-04-15" }),
        makeDoc({ id: "doc_3", category: "behaviour_support", version: 2, tags: ["mandatory"], expiry_date: "2026-10-01", has_linked_child: true, updated_date: "2026-05-10" }),
        makeDoc({ id: "doc_4", category: "risk_assessment", version: 2, tags: ["safeguarding"], has_linked_child: true, has_linked_incident: true, expiry_date: "2026-08-01", updated_date: "2026-05-20" }),
        makeDoc({ id: "doc_5", category: "safeguarding", version: 3, tags: ["mandatory"], expiry_date: "2026-09-15", updated_date: "2026-04-01" }),
        makeDoc({ id: "doc_6", category: "medication", version: 2, tags: ["mandatory"], expiry_date: "2027-01-15", updated_date: "2026-03-20" }),
      ];

      // All 5 staff read and signed all 6 docs (all require sign)
      const receipts: ReadReceiptInput[] = [];
      for (const doc of docs) {
        for (let s = 1; s <= 5; s++) {
          receipts.push(makeReceipt({ document_id: doc.id, staff_id: `staff_${s}` }));
        }
      }

      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      // Base 52
      // +5 no expired, +4 read 100%, +3 sign 100%, +4 mandatory 100%
      // +3 multi-version (100%), +3 no stale, +3 categories (6 >= 5), +3 no expired & no expiring soon
      // = 52 + 28 = 80
      expect(r.document_rating).toBe("outstanding");
      expect(r.document_score).toBe(80);
    });

    it("generates strengths for outstanding", () => {
      const docs = [
        makeDoc({ id: "doc_1", category: "policy", version: 2 }),
        makeDoc({ id: "doc_2", category: "procedure", version: 2 }),
        makeDoc({ id: "doc_3", category: "safeguarding", version: 3 }),
        makeDoc({ id: "doc_4", category: "risk", version: 2 }),
        makeDoc({ id: "doc_5", category: "medication", version: 2 }),
      ];
      const receipts: ReadReceiptInput[] = [];
      for (const doc of docs) {
        for (let s = 1; s <= 5; s++) {
          receipts.push(makeReceipt({ document_id: doc.id, staff_id: `staff_${s}` }));
        }
      }
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      expect(r.strengths.length).toBeGreaterThan(0);
      expect(r.strengths.some(s => s.includes("expired"))).toBe(true);
      expect(r.strengths.some(s => s.includes("read rate"))).toBe(true);
    });
  });

  // ── Good ──────────────────────────────────────────────────────────────────

  describe("good rating", () => {
    it("achieves good with some minor gaps", () => {
      const docs = [
        makeDoc({ id: "doc_1", category: "policy", version: 2 }),
        makeDoc({ id: "doc_2", category: "procedure", version: 2 }),
        makeDoc({ id: "doc_3", category: "safeguarding", version: 1 }),
        makeDoc({ id: "doc_4", category: "risk", version: 1 }),
        makeDoc({ id: "doc_5", category: "medication", version: 2 }),
      ];
      // 3/5 staff read each doc
      const receipts: ReadReceiptInput[] = [];
      for (const doc of docs) {
        for (let s = 1; s <= 3; s++) {
          receipts.push(makeReceipt({ document_id: doc.id, staff_id: `staff_${s}` }));
        }
      }
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      // 52 + 5(no expired) + 1(read 60%) + 1(sign 60%) + 1(mandatory 60%)
      // + 1(multi-version 60%) + 3(no stale) + 3(5 cats) + 3(no expired, no expiring)
      // 52 + 5(no expired) + 1(read 60%) + 1(sign 60%) + 1(mandatory 60%)
      // + 3(multi-ver 60% >=50%) + 3(no stale) + 3(5 cats) + 3(no expired, no expiring, withExpiry>0)
      // = 52+5+1+1+1+3+3+3+3 = 72
      expect(r.document_rating).toBe("good");
      expect(r.document_score).toBe(72);
    });
  });

  // ── Adequate ──────────────────────────────────────────────────────────────

  describe("adequate rating", () => {
    it("achieves adequate with expired docs and low read rate", () => {
      const docs = [
        makeDoc({ id: "doc_1", category: "policy", version: 1, expiry_date: "2026-04-01" }), // expired
        makeDoc({ id: "doc_2", category: "procedure", version: 1, expiry_date: "2026-12-31" }),
        makeDoc({ id: "doc_3", category: "safeguarding", version: 1, expiry_date: "2026-10-01" }),
      ];
      // 2/5 staff read each doc
      const receipts: ReadReceiptInput[] = [];
      for (const doc of docs) {
        for (let s = 1; s <= 2; s++) {
          receipts.push(makeReceipt({ document_id: doc.id, staff_id: `staff_${s}` }));
        }
      }
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      // 52 + 1(1 expired) + (-1)(read 40%) + (-2)(sign 40%) + (-3)(mandatory 40%)
      // + (-1)(multi-version 0%) + 3(no stale) + 1(3 cats) + (-1)(expired exists)
      // = 52 + 1-1-2-3-1+3+1-1 = 49
      expect(r.document_rating).toBe("adequate");
      expect(r.document_score).toBe(49);
    });
  });

  // ── Inadequate ────────────────────────────────────────────────────────────

  describe("inadequate rating", () => {
    it("scores inadequate with multiple expired, no reads, all stale", () => {
      const docs = [
        makeDoc({ id: "doc_1", category: "policy", version: 1, expiry_date: "2025-12-01", updated_date: "2025-06-01" }),
        makeDoc({ id: "doc_2", category: "policy", version: 1, expiry_date: "2025-10-01", updated_date: "2025-04-01" }),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: [] }));
      // 52 + (-4)(2 expired) + (-3)(read 0%) + (-2)(sign 0%) + (-3)(mandatory 0%)
      // + (-1)(multi-ver 0%) + (-2)(stale 100%) + (-1)(1 cat) + (-1)(expired exists)
      // = 52 -4-3-2-3-1-2-1-1 = 35
      expect(r.document_rating).toBe("inadequate");
      expect(r.document_score).toBe(35);
    });

    it("generates critical insights for poor governance", () => {
      const docs = [
        makeDoc({ id: "doc_1", expiry_date: "2025-12-01", updated_date: "2025-01-01" }),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: [] }));
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
      expect(r.concerns.length).toBeGreaterThan(0);
    });
  });

  // ── Inventory Profile ─────────────────────────────────────────────────────

  describe("inventory profile", () => {
    it("counts total documents correctly", () => {
      const docs = [
        makeDoc({ id: "doc_1" }),
        makeDoc({ id: "doc_2" }),
        makeDoc({ id: "doc_3" }),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.inventory_profile.total_documents).toBe(3);
    });

    it("counts documents requiring sign", () => {
      const docs = [
        makeDoc({ id: "doc_1", requires_read_sign: true }),
        makeDoc({ id: "doc_2", requires_read_sign: false }),
        makeDoc({ id: "doc_3", requires_read_sign: true }),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.inventory_profile.requiring_sign).toBe(2);
    });

    it("counts expired documents", () => {
      const docs = [
        makeDoc({ id: "doc_1", expiry_date: "2026-04-01" }), // expired
        makeDoc({ id: "doc_2", expiry_date: "2026-12-31" }), // valid
        makeDoc({ id: "doc_3", expiry_date: null }),           // no expiry
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.inventory_profile.expired_count).toBe(1);
      expect(r.inventory_profile.with_expiry).toBe(2);
    });

    it("counts expiring soon documents", () => {
      // today = 2026-05-26, soon = within 30 days = up to 2026-06-25
      const docs = [
        makeDoc({ id: "doc_1", expiry_date: "2026-06-10" }), // expiring soon
        makeDoc({ id: "doc_2", expiry_date: "2026-06-25" }), // expiring soon (boundary)
        makeDoc({ id: "doc_3", expiry_date: "2026-06-26" }), // not expiring soon
        makeDoc({ id: "doc_4", expiry_date: "2026-05-20" }), // already expired
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.inventory_profile.expiring_soon_count).toBe(2);
    });

    it("calculates average version", () => {
      const docs = [
        makeDoc({ id: "doc_1", version: 3 }),
        makeDoc({ id: "doc_2", version: 1 }),
        makeDoc({ id: "doc_3", version: 2 }),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      // (3+1+2)/3 = 2.0
      expect(r.inventory_profile.avg_version).toBe(2);
    });

    it("counts unique categories", () => {
      const docs = [
        makeDoc({ id: "doc_1", category: "policy" }),
        makeDoc({ id: "doc_2", category: "procedure" }),
        makeDoc({ id: "doc_3", category: "policy" }),       // duplicate
        makeDoc({ id: "doc_4", category: "safeguarding" }),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.inventory_profile.category_count).toBe(3);
    });
  });

  // ── Read Compliance Profile ───────────────────────────────────────────────

  describe("read compliance profile", () => {
    it("calculates average read rate", () => {
      const docs = [
        makeDoc({ id: "doc_1" }),  // requires sign
        makeDoc({ id: "doc_2" }),  // requires sign
      ];
      const receipts = [
        makeReceipt({ document_id: "doc_1", staff_id: "staff_1" }),
        makeReceipt({ document_id: "doc_1", staff_id: "staff_2" }),
        makeReceipt({ document_id: "doc_1", staff_id: "staff_3" }),
        // 3/5 = 60%
        makeReceipt({ document_id: "doc_2", staff_id: "staff_1" }),
        makeReceipt({ document_id: "doc_2", staff_id: "staff_2" }),
        // 2/5 = 40%
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      // avg = (60 + 40) / 2 = 50%
      expect(r.read_compliance_profile.avg_read_rate).toBe(50);
    });

    it("calculates average sign rate", () => {
      const docs = [makeDoc({ id: "doc_1" })];
      const receipts = [
        makeReceipt({ document_id: "doc_1", staff_id: "staff_1", has_signed: true }),
        makeReceipt({ document_id: "doc_1", staff_id: "staff_2", has_signed: false }),
        makeReceipt({ document_id: "doc_1", staff_id: "staff_3", has_signed: true }),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      // 2/5 = 40%
      expect(r.read_compliance_profile.avg_sign_rate).toBe(40);
    });

    it("counts fully read documents", () => {
      const docs = [
        makeDoc({ id: "doc_1" }),
        makeDoc({ id: "doc_2" }),
      ];
      const receipts: ReadReceiptInput[] = [];
      // doc_1: all 5 staff read
      for (let s = 1; s <= 5; s++) {
        receipts.push(makeReceipt({ document_id: "doc_1", staff_id: `staff_${s}` }));
      }
      // doc_2: only 3 staff read
      for (let s = 1; s <= 3; s++) {
        receipts.push(makeReceipt({ document_id: "doc_2", staff_id: `staff_${s}` }));
      }
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      expect(r.read_compliance_profile.fully_read_count).toBe(1);
    });

    it("counts unread documents", () => {
      const docs = [
        makeDoc({ id: "doc_1" }),
        makeDoc({ id: "doc_2" }),
        makeDoc({ id: "doc_3" }),
      ];
      const receipts = [
        makeReceipt({ document_id: "doc_1", staff_id: "staff_1" }),
        // doc_2 and doc_3 have no receipts
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      expect(r.read_compliance_profile.unread_count).toBe(2);
    });

    it("handles zero total staff gracefully", () => {
      const docs = [makeDoc({ id: "doc_1" })];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, total_staff: 0 }));
      expect(r.read_compliance_profile.avg_read_rate).toBe(0);
      expect(r.read_compliance_profile.fully_read_count).toBe(0);
    });

    it("excludes non-sign-required docs from read compliance", () => {
      const docs = [
        makeDoc({ id: "doc_1", requires_read_sign: true }),
        makeDoc({ id: "doc_2", requires_read_sign: false }),
      ];
      const receipts = [
        makeReceipt({ document_id: "doc_1", staff_id: "staff_1" }),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      expect(r.read_compliance_profile.documents_requiring_sign).toBe(1);
      // Only doc_1 counted: 1/5 = 20%
      expect(r.read_compliance_profile.avg_read_rate).toBe(20);
    });
  });

  // ── Governance Profile ────────────────────────────────────────────────────

  describe("governance profile", () => {
    it("calculates child linked rate", () => {
      const docs = [
        makeDoc({ id: "doc_1", has_linked_child: true }),
        makeDoc({ id: "doc_2", has_linked_child: false }),
        makeDoc({ id: "doc_3", has_linked_child: true }),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.governance_profile.child_linked_rate).toBe(67);
    });

    it("calculates incident linked rate", () => {
      const docs = [
        makeDoc({ id: "doc_1", has_linked_incident: true }),
        makeDoc({ id: "doc_2", has_linked_incident: false }),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.governance_profile.incident_linked_rate).toBe(50);
    });

    it("counts mandatory documents", () => {
      const docs = [
        makeDoc({ id: "doc_1", tags: ["mandatory", "safeguarding"] }),
        makeDoc({ id: "doc_2", tags: ["optional"] }),
        makeDoc({ id: "doc_3", tags: ["mandatory"] }),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.governance_profile.mandatory_tag_count).toBe(2);
    });

    it("calculates mandatory read rate", () => {
      const docs = [
        makeDoc({ id: "doc_1", tags: ["mandatory"] }),
        makeDoc({ id: "doc_2", tags: ["mandatory"] }),
        makeDoc({ id: "doc_3", tags: ["optional"] }),
      ];
      const receipts = [
        // doc_1: 4/5 = 80%
        ...Array.from({ length: 4 }, (_, i) => makeReceipt({ document_id: "doc_1", staff_id: `staff_${i + 1}` })),
        // doc_2: 2/5 = 40%
        ...Array.from({ length: 2 }, (_, i) => makeReceipt({ document_id: "doc_2", staff_id: `staff_${i + 1}` })),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      // avg mandatory read = (80+40)/2 = 60%
      expect(r.governance_profile.mandatory_read_rate).toBe(60);
    });

    it("excludes non-sign mandatory docs from mandatory read rate", () => {
      const docs = [
        makeDoc({ id: "doc_1", tags: ["mandatory"], requires_read_sign: true }),
        makeDoc({ id: "doc_2", tags: ["mandatory"], requires_read_sign: false }),
      ];
      const receipts = [
        ...Array.from({ length: 5 }, (_, i) => makeReceipt({ document_id: "doc_1", staff_id: `staff_${i + 1}` })),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      // Only doc_1 contributes: 5/5 = 100%
      expect(r.governance_profile.mandatory_read_rate).toBe(100);
    });
  });

  // ── Version Profile ───────────────────────────────────────────────────────

  describe("version profile", () => {
    it("counts multi-version documents", () => {
      const docs = [
        makeDoc({ id: "doc_1", version: 3 }),
        makeDoc({ id: "doc_2", version: 1 }),
        makeDoc({ id: "doc_3", version: 2 }),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.version_profile.multi_version_count).toBe(2);
      expect(r.version_profile.single_version_count).toBe(1);
    });

    it("counts recently updated documents", () => {
      // recent = within 30 days of today (2026-05-26), so >= 2026-04-26
      const docs = [
        makeDoc({ id: "doc_1", updated_date: "2026-05-20" }),  // recent
        makeDoc({ id: "doc_2", updated_date: "2026-04-26" }),  // boundary — recent
        makeDoc({ id: "doc_3", updated_date: "2026-04-25" }),  // not recent
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.version_profile.recently_updated_count).toBe(2);
    });

    it("counts stale documents", () => {
      // stale = updated before 180 days ago (2026-05-26 - 180 = 2025-11-27)
      const docs = [
        makeDoc({ id: "doc_1", updated_date: "2025-11-26" }),  // stale (before cutoff)
        makeDoc({ id: "doc_2", updated_date: "2025-11-27" }),  // not stale (on cutoff)
        makeDoc({ id: "doc_3", updated_date: "2026-01-01" }),  // not stale
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.version_profile.stale_count).toBe(1);
    });
  });

  // ── Scoring Modifiers ─────────────────────────────────────────────────────

  describe("scoring modifiers", () => {
    it("gives full no-expired bonus (+5)", () => {
      const docs = [
        makeDoc({ id: "doc_1", expiry_date: "2026-12-31" }),
      ];
      const receipts = Array.from({ length: 5 }, (_, i) =>
        makeReceipt({ document_id: "doc_1", staff_id: `staff_${i + 1}` })
      );
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      // 52+5+4+3+4+1(multi-ver 100%→+3 wait, version=2 so single doc → 100%→+3)
      // Actually: 1 doc, version=2, multi-ver rate=100% → +3
      // categories=1 → -1, no stale → +3
      // expiring: no expired, no expiring soon, with_expiry > 0 → +3
      // = 52+5+4+3+4+3+3-1+3 = 76... let me recalculate
      // Base 52
      // 1. no expired → +5
      // 2. read 100% → +4
      // 3. sign 100% → +3
      // 4. mandatory 100% → +4
      // 5. multi-version: 1/1 = 100% → +3
      // 6. stale: 0% → +3
      // 7. categories: 1 → -1
      // 8. no expired, no expiring soon, with_expiry>0 → +3
      // = 52+5+4+3+4+3+3-1+3 = 76
      expect(r.document_score).toBe(76);
    });

    it("penalises multiple expired docs (-4)", () => {
      const docs = [
        makeDoc({ id: "doc_1", expiry_date: "2025-12-01" }),
        makeDoc({ id: "doc_2", expiry_date: "2025-11-01" }),
      ];
      const receipts = [
        ...Array.from({ length: 5 }, (_, i) => makeReceipt({ document_id: "doc_1", staff_id: `staff_${i + 1}` })),
        ...Array.from({ length: 5 }, (_, i) => makeReceipt({ document_id: "doc_2", staff_id: `staff_${i + 1}` })),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      // 52 + (-4)(2 expired) + 4(read 100%) + 3(sign 100%) + 4(mandatory 100%)
      // + 3(multi-ver 100%) + 3(no stale, both updated 2026-05-01) + (-1)(1 cat)
      // + (-1)(expired exists)
      // = 52-4+4+3+4+3+3-1-1 = 63
      expect(r.document_score).toBe(63);
    });

    it("gives bonus for no expiry tracking (+1)", () => {
      const docs = [
        makeDoc({ id: "doc_1", expiry_date: null, requires_read_sign: false, tags: [] }),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: [] }));
      // 52 + 1(no expiry tracking) + 0(no sign-requiring docs for read/sign)
      // + 0(no mandatory) + 3(multi-ver 100%) + 3(no stale) + (-1)(1 cat)
      // + 0(no expiring — withExpiry=0, doesn't match any expiring soon branch)
      // Wait: modifier 8 logic: withExpiry.length=0, none of the branches match. Score += 0
      // Actually checking: expired.length=0 && expiringSoon.length=0 && withExpiry.length > 0 is false
      // expired.length=0 && withExpiry.length > 0... nope. expired > 0... nope.
      // So no points from modifier 8.
      // = 52 + 1 + 3 + 3 - 1 = 58
      expect(r.document_score).toBe(58);
    });

    it("gives bonus for proactive expiry management", () => {
      // Some docs expiring soon but none expired
      const docs = [
        makeDoc({ id: "doc_1", expiry_date: "2026-06-10" }), // expiring soon
        makeDoc({ id: "doc_2", expiry_date: "2026-12-31" }),  // fine
      ];
      const receipts = [
        ...Array.from({ length: 5 }, (_, i) => makeReceipt({ document_id: "doc_1", staff_id: `staff_${i + 1}` })),
        ...Array.from({ length: 5 }, (_, i) => makeReceipt({ document_id: "doc_2", staff_id: `staff_${i + 1}` })),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      // 52 + 5(no expired) + 4(read 100%) + 3(sign 100%) + 4(mandatory 100%)
      // + 3(multi-ver 100%) + 3(no stale) + (-1)(1 cat)
      // + 3(no expired, expiring soon > 0 → proactive)
      // = 52+5+4+3+4+3+3-1+3 = 76
      expect(r.document_score).toBe(76);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes no expired strength", () => {
      const docs = [makeDoc({ id: "doc_1", expiry_date: "2026-12-31" })];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.strengths.some(s => s.includes("No expired documents"))).toBe(true);
    });

    it("includes read rate strength when >= 80%", () => {
      const docs = [makeDoc({ id: "doc_1" })];
      const receipts = Array.from({ length: 5 }, (_, i) =>
        makeReceipt({ document_id: "doc_1", staff_id: `staff_${i + 1}` })
      );
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      expect(r.strengths.some(s => s.includes("read rate"))).toBe(true);
    });

    it("includes sign rate strength when >= 80%", () => {
      const docs = [makeDoc({ id: "doc_1" })];
      const receipts = Array.from({ length: 5 }, (_, i) =>
        makeReceipt({ document_id: "doc_1", staff_id: `staff_${i + 1}` })
      );
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      expect(r.strengths.some(s => s.includes("sign-off rate"))).toBe(true);
    });

    it("includes category diversity strength when >= 5", () => {
      const cats = ["policy", "procedure", "safeguarding", "risk", "medication"];
      const docs = cats.map((c, i) => makeDoc({ id: `doc_${i}`, category: c }));
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.strengths.some(s => s.includes("categories"))).toBe(true);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags expired documents", () => {
      const docs = [makeDoc({ id: "doc_1", expiry_date: "2025-12-01" })];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.concerns.some(c => c.includes("expired"))).toBe(true);
    });

    it("flags low read rate", () => {
      const docs = [makeDoc({ id: "doc_1" })];
      // 1/5 = 20%
      const receipts = [makeReceipt({ document_id: "doc_1", staff_id: "staff_1" })];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      expect(r.concerns.some(c => c.includes("read rate"))).toBe(true);
    });

    it("flags unread documents", () => {
      const docs = [makeDoc({ id: "doc_1" }), makeDoc({ id: "doc_2" })];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: [] }));
      expect(r.concerns.some(c => c.includes("not been read"))).toBe(true);
    });

    it("flags stale documents", () => {
      const docs = [makeDoc({ id: "doc_1", updated_date: "2025-01-01" })];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.concerns.some(c => c.includes("6 months"))).toBe(true);
    });

    it("flags expiring soon documents", () => {
      const docs = [makeDoc({ id: "doc_1", expiry_date: "2026-06-10" })];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.concerns.some(c => c.includes("expiring within 30 days"))).toBe(true);
    });

    it("flags low mandatory read rate", () => {
      const docs = [makeDoc({ id: "doc_1", tags: ["mandatory"] })];
      const receipts = [makeReceipt({ document_id: "doc_1", staff_id: "staff_1" })];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      expect(r.concerns.some(c => c.includes("mandatory"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends renewal for expired docs", () => {
      const docs = [makeDoc({ id: "doc_1", expiry_date: "2025-12-01" })];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Renew"))).toBe(true);
      expect(r.recommendations[0].urgency).toBe("immediate");
    });

    it("recommends read programme for low read rate", () => {
      const docs = [makeDoc({ id: "doc_1" })];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: [] }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("read programme"))).toBe(true);
    });

    it("generates no recommendations for perfect governance", () => {
      const cats = ["policy", "procedure", "safeguarding", "risk", "medication"];
      const docs = cats.map((c, i) => makeDoc({ id: `doc_${i}`, category: c }));
      const receipts: ReadReceiptInput[] = [];
      for (const doc of docs) {
        for (let s = 1; s <= 5; s++) {
          receipts.push(makeReceipt({ document_id: doc.id, staff_id: `staff_${s}` }));
        }
      }
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      expect(r.recommendations.length).toBe(0);
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates positive insight for exemplary governance", () => {
      const docs = [makeDoc({ id: "doc_1" })];
      const receipts = Array.from({ length: 5 }, (_, i) =>
        makeReceipt({ document_id: "doc_1", staff_id: `staff_${i + 1}` })
      );
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("generates critical insight for expired documents", () => {
      const docs = [makeDoc({ id: "doc_1", expiry_date: "2025-12-01" })];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("expired"))).toBe(true);
    });

    it("generates critical insight for very low read rate", () => {
      const docs = [makeDoc({ id: "doc_1" })];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: [] }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("read rate"))).toBe(true);
    });

    it("generates warning insight for mixed staleness", () => {
      const docs = [
        makeDoc({ id: "doc_1", version: 3, updated_date: "2025-01-01" }), // stale, multi-version
        makeDoc({ id: "doc_2", version: 2, updated_date: "2026-05-01" }), // current, multi-version
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("not updated in 6+"))).toBe(true);
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("generates outstanding headline", () => {
      const cats = ["policy", "procedure", "safeguarding", "risk", "medication", "hr"];
      const docs = cats.map((c, i) => makeDoc({ id: `doc_${i}`, category: c }));
      const receipts: ReadReceiptInput[] = [];
      for (const doc of docs) {
        for (let s = 1; s <= 5; s++) {
          receipts.push(makeReceipt({ document_id: doc.id, staff_id: `staff_${s}` }));
        }
      }
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs, read_receipts: receipts }));
      expect(r.headline).toContain("Outstanding");
    });

    it("generates insufficient_data headline", () => {
      const r = computeHomeDocumentGovernance(baseInput());
      expect(r.headline).toContain("No document records");
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles single document correctly", () => {
      const r = computeHomeDocumentGovernance(baseInput({
        documents: [makeDoc({ id: "doc_1" })],
      }));
      expect(r.document_rating).not.toBe("insufficient_data");
    });

    it("handles documents with no expiry date", () => {
      const docs = [
        makeDoc({ id: "doc_1", expiry_date: null }),
        makeDoc({ id: "doc_2", expiry_date: null }),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.inventory_profile.with_expiry).toBe(0);
      expect(r.inventory_profile.expired_count).toBe(0);
    });

    it("handles no mandatory documents", () => {
      const docs = [makeDoc({ id: "doc_1", tags: ["optional"] })];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.governance_profile.mandatory_tag_count).toBe(0);
      expect(r.governance_profile.mandatory_read_rate).toBe(0);
    });

    it("plural forms for single expired document", () => {
      const docs = [makeDoc({ id: "doc_1", expiry_date: "2025-12-01" })];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.concerns.some(c => c.includes("1 document expired"))).toBe(true);
    });

    it("plural forms for multiple expired documents", () => {
      const docs = [
        makeDoc({ id: "doc_1", expiry_date: "2025-12-01" }),
        makeDoc({ id: "doc_2", expiry_date: "2025-11-01" }),
      ];
      const r = computeHomeDocumentGovernance(baseInput({ documents: docs }));
      expect(r.concerns.some(c => c.includes("2 documents expired"))).toBe(true);
    });
  });
});
