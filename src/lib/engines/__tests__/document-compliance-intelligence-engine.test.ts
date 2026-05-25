// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DOCUMENT COMPLIANCE INTELLIGENCE ENGINE · TEST SUITE
//
// 55+ tests covering overview, document profiles, category analysis, alerts,
// ARIA insights, and Oak House integration.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeDocumentComplianceIntelligence,
  daysUntil,
  average,
  type DocumentInput,
  type ReadReceiptInput,
  type StaffRef,
  type DocumentComplianceIntelligenceInput,
  type DocumentCategory,
} from "../document-compliance-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factory Functions ─────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `doc_t_${++_id}`;
}

function makeDoc(overrides: Partial<DocumentInput> = {}): DocumentInput {
  return {
    id: uid(),
    title: "Test Document",
    category: "policy",
    version: 1,
    requires_read_sign: true,
    expiry_date: "2027-01-01",
    tags: [],
    linked_child_id: null,
    linked_staff_id: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  };
}

function makeReceipt(
  document_id: string,
  staff_id: string,
  overrides: Partial<Omit<ReadReceiptInput, "document_id" | "staff_id">> = {},
): ReadReceiptInput {
  return {
    id: uid(),
    document_id,
    staff_id,
    read_at: "2026-05-20",
    signed_at: "2026-05-20",
    ...overrides,
  };
}

function makeStaff(id: string, name: string): StaffRef {
  return { id, name, is_active: true };
}

const STAFF = [
  makeStaff("s1", "Alice Smith"),
  makeStaff("s2", "Bob Jones"),
  makeStaff("s3", "Carol White"),
];

function run(
  overrides: Partial<DocumentComplianceIntelligenceInput> = {},
): ReturnType<typeof computeDocumentComplianceIntelligence> {
  return computeDocumentComplianceIntelligence({
    documents: [],
    read_receipts: [],
    active_staff: STAFF,
    today: TODAY,
    ...overrides,
  });
}

// ── Helper Tests ──────────────────────────────────────────────────────────

describe("helpers", () => {
  it("daysUntil returns correct value", () => {
    expect(daysUntil("2026-05-25", "2026-06-24")).toBe(30);
    expect(daysUntil("2026-05-25", "2026-04-25")).toBe(-30);
  });

  it("average of empty returns 0", () => {
    expect(average([])).toBe(0);
  });

  it("average computes correctly", () => {
    expect(average([50, 100])).toBe(75);
  });
});

// ── Empty State ───────────────────────────────────────────────────────────

describe("empty state", () => {
  it("returns sensible defaults when no data provided", () => {
    const r = run();
    expect(r.overview.total_documents).toBe(0);
    expect(r.overview.avg_sign_off_rate).toBe(0);
    expect(r.overview.documents_expired).toBe(0);
    expect(r.document_profiles).toHaveLength(0);
    expect(r.category_analysis).toHaveLength(0);
    expect(r.alerts).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });
});

// ── Overview ──────────────────────────────────────────────────────────────

describe("overview", () => {
  it("counts documents and categories", () => {
    const d1 = makeDoc({ category: "policy" });
    const d2 = makeDoc({ category: "procedure" });
    const d3 = makeDoc({ category: "policy", requires_read_sign: false });
    const r = run({ documents: [d1, d2, d3] });
    expect(r.overview.total_documents).toBe(3);
    expect(r.overview.documents_requiring_sign).toBe(2);
    expect(r.overview.categories_count).toBe(2);
  });

  it("counts expired and expiring soon", () => {
    const d1 = makeDoc({ expiry_date: "2026-04-01" }); // expired
    const d2 = makeDoc({ expiry_date: "2026-07-01" }); // within 90 days (37d)
    const d3 = makeDoc({ expiry_date: "2027-06-01" }); // well in future
    const d4 = makeDoc({ expiry_date: null }); // no expiry
    const r = run({ documents: [d1, d2, d3, d4] });
    expect(r.overview.documents_expired).toBe(1);
    expect(r.overview.documents_expiring_soon).toBe(1);
  });

  it("calculates average sign-off rate", () => {
    const d1 = makeDoc();
    const d2 = makeDoc();
    // d1: 3/3 signed = 100%, d2: 1/3 signed = 33%
    const receipts = [
      makeReceipt(d1.id, "s1"), makeReceipt(d1.id, "s2"), makeReceipt(d1.id, "s3"),
      makeReceipt(d2.id, "s1"),
    ];
    const r = run({ documents: [d1, d2], read_receipts: receipts });
    // avg of [100, 33] = 67 (rounded)
    expect(r.overview.avg_sign_off_rate).toBe(67);
  });

  it("counts fully signed documents", () => {
    const d1 = makeDoc();
    const d2 = makeDoc();
    // d1: all 3 signed, d2: only 1
    const receipts = [
      makeReceipt(d1.id, "s1"), makeReceipt(d1.id, "s2"), makeReceipt(d1.id, "s3"),
      makeReceipt(d2.id, "s1"),
    ];
    const r = run({ documents: [d1, d2], read_receipts: receipts });
    expect(r.overview.fully_signed_documents).toBe(1);
  });

  it("counts unsigned documents", () => {
    const d1 = makeDoc(); // no receipts
    const d2 = makeDoc({ requires_read_sign: false }); // doesn't require
    const r = run({ documents: [d1, d2] });
    expect(r.overview.unsigned_documents).toBe(1);
  });

  it("counts mandatory documents and their sign-off rate", () => {
    const d1 = makeDoc({ tags: ["mandatory"] });
    const d2 = makeDoc({ tags: ["mandatory"] });
    const d3 = makeDoc({ tags: [] }); // non-mandatory
    // d1: 3/3, d2: 0/3
    const receipts = [
      makeReceipt(d1.id, "s1"), makeReceipt(d1.id, "s2"), makeReceipt(d1.id, "s3"),
    ];
    const r = run({ documents: [d1, d2, d3], read_receipts: receipts });
    expect(r.overview.mandatory_document_count).toBe(2);
    // avg of [100, 0] = 50
    expect(r.overview.mandatory_sign_off_rate).toBe(50);
  });

  it("counts total read receipts", () => {
    const d = makeDoc();
    const receipts = [makeReceipt(d.id, "s1"), makeReceipt(d.id, "s2")];
    const r = run({ documents: [d], read_receipts: receipts });
    expect(r.overview.total_read_receipts).toBe(2);
  });
});

// ── Document Profiles ─────────────────────────────────────────────────────

describe("document profiles", () => {
  it("calculates sign-off rate correctly", () => {
    const d = makeDoc();
    const receipts = [makeReceipt(d.id, "s1"), makeReceipt(d.id, "s2")];
    const r = run({ documents: [d], read_receipts: receipts });
    const dp = r.document_profiles[0];
    // 2/3 = 67%
    expect(dp.sign_off_rate).toBe(67);
    expect(dp.signed_count).toBe(2);
    expect(dp.read_count).toBe(2);
  });

  it("lists outstanding staff names", () => {
    const d = makeDoc();
    const receipts = [makeReceipt(d.id, "s1")]; // s2, s3 outstanding
    const r = run({ documents: [d], read_receipts: receipts });
    const dp = r.document_profiles[0];
    expect(dp.outstanding_staff).toContain("Bob Jones");
    expect(dp.outstanding_staff).toContain("Carol White");
    expect(dp.outstanding_staff).not.toContain("Alice Smith");
  });

  it("calculates days until expiry", () => {
    const d = makeDoc({ expiry_date: "2026-07-01" }); // 37 days
    const r = run({ documents: [d] });
    expect(r.document_profiles[0].days_until_expiry).toBe(37);
    expect(r.document_profiles[0].is_expired).toBe(false);
  });

  it("marks expired documents", () => {
    const d = makeDoc({ expiry_date: "2026-04-01" });
    const r = run({ documents: [d] });
    expect(r.document_profiles[0].is_expired).toBe(true);
    expect(r.document_profiles[0].days_until_expiry).toBeLessThan(0);
  });

  it("returns null for missing expiry date", () => {
    const d = makeDoc({ expiry_date: null });
    const r = run({ documents: [d] });
    expect(r.document_profiles[0].days_until_expiry).toBeNull();
    expect(r.document_profiles[0].is_expired).toBe(false);
  });

  it("identifies mandatory docs", () => {
    const d = makeDoc({ tags: ["mandatory", "safeguarding"] });
    const r = run({ documents: [d] });
    expect(r.document_profiles[0].is_mandatory).toBe(true);
  });

  it("does not count receipts from inactive staff", () => {
    const d = makeDoc();
    const receipts = [
      makeReceipt(d.id, "s1"),
      makeReceipt(d.id, "inactive_staff"), // not in STAFF
    ];
    const r = run({ documents: [d], read_receipts: receipts });
    expect(r.document_profiles[0].read_count).toBe(1);
    expect(r.document_profiles[0].signed_count).toBe(1);
  });

  it("only counts signed (not just read) for sign-off", () => {
    const d = makeDoc();
    const receipts = [
      makeReceipt(d.id, "s1", { signed_at: "2026-05-20" }),
      makeReceipt(d.id, "s2", { signed_at: null }), // read but not signed
    ];
    const r = run({ documents: [d], read_receipts: receipts });
    expect(r.document_profiles[0].read_count).toBe(2);
    expect(r.document_profiles[0].signed_count).toBe(1);
    // 1/3 = 33%
    expect(r.document_profiles[0].sign_off_rate).toBe(33);
  });
});

// ── Risk Flags ────────────────────────────────────────────────────────────

describe("risk flags", () => {
  it("flags expired document", () => {
    const d = makeDoc({ expiry_date: "2026-01-01" });
    const r = run({ documents: [d] });
    expect(r.document_profiles[0].risk_flags).toContain("Document expired");
  });

  it("flags expiring within 30 days", () => {
    const d = makeDoc({ expiry_date: "2026-06-20" }); // 26 days
    const r = run({ documents: [d] });
    expect(r.document_profiles[0].risk_flags).toContain("Expiring within 30 days");
  });

  it("does NOT flag at 31 days", () => {
    const d = makeDoc({ expiry_date: "2026-06-26" }); // 32 days
    const r = run({ documents: [d] });
    expect(r.document_profiles[0].risk_flags).not.toContain("Expiring within 30 days");
  });

  it("flags no staff signed", () => {
    const d = makeDoc();
    const r = run({ documents: [d] });
    expect(r.document_profiles[0].risk_flags).toContain("No staff have signed");
  });

  it("flags <50% sign-off", () => {
    const d = makeDoc();
    const receipts = [makeReceipt(d.id, "s1")]; // 1/3 = 33%
    const r = run({ documents: [d], read_receipts: receipts });
    expect(r.document_profiles[0].risk_flags).toContain("Less than 50% sign-off");
  });

  it("flags expired regulatory document", () => {
    const d = makeDoc({ category: "policy", expiry_date: "2026-01-01" });
    const r = run({ documents: [d] });
    expect(r.document_profiles[0].risk_flags).toContain("Expired regulatory document");
  });

  it("flags mandatory not all signed", () => {
    const d = makeDoc({ tags: ["mandatory"] });
    const receipts = [makeReceipt(d.id, "s1")]; // only 1/3
    const r = run({ documents: [d], read_receipts: receipts });
    expect(r.document_profiles[0].risk_flags).toContain("Mandatory — not all staff signed");
  });
});

// ── Category Analysis ─────────────────────────────────────────────────────

describe("category analysis", () => {
  it("groups by category and calculates rates", () => {
    const d1 = makeDoc({ category: "policy" });
    const d2 = makeDoc({ category: "policy" });
    const d3 = makeDoc({ category: "procedure" });
    const receipts = [
      makeReceipt(d1.id, "s1"), makeReceipt(d1.id, "s2"), makeReceipt(d1.id, "s3"),
      makeReceipt(d3.id, "s1"),
    ];
    const r = run({ documents: [d1, d2, d3], read_receipts: receipts });
    const policy = r.category_analysis.find((ca) => ca.category === "policy")!;
    expect(policy.total).toBe(2);
    expect(policy.requiring_sign).toBe(2);
    // d1: 100%, d2: 0% → avg 50%
    expect(policy.avg_sign_off_rate).toBe(50);
  });

  it("counts expired and expiring per category", () => {
    const d1 = makeDoc({ category: "policy", expiry_date: "2026-01-01" }); // expired
    const d2 = makeDoc({ category: "policy", expiry_date: "2026-07-01" }); // expiring
    const r = run({ documents: [d1, d2] });
    const policy = r.category_analysis.find((ca) => ca.category === "policy")!;
    expect(policy.expired_count).toBe(1);
    expect(policy.expiring_soon_count).toBe(1);
  });

  it("sorts by worst sign-off rate first", () => {
    const d1 = makeDoc({ category: "policy" }); // 0% (no receipts)
    const d2 = makeDoc({ category: "procedure" });
    const receipts = [
      makeReceipt(d2.id, "s1"), makeReceipt(d2.id, "s2"), makeReceipt(d2.id, "s3"),
    ];
    const r = run({ documents: [d1, d2], read_receipts: receipts });
    expect(r.category_analysis[0].category).toBe("policy");
  });
});

// ── Alerts ────────────────────────────────────────────────────────────────

describe("alerts", () => {
  it("critical: expired regulatory documents", () => {
    const d = makeDoc({ category: "policy", expiry_date: "2026-01-01", title: "Child Protection Policy" });
    const r = run({ documents: [d] });
    const alert = r.alerts.find((a) => a.severity === "critical" && a.message.includes("regulatory"));
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("Child Protection Policy");
    expect(alert!.message).toContain("Reg 35");
  });

  it("no critical alert for expired non-regulatory docs", () => {
    const d = makeDoc({ category: "contract", expiry_date: "2026-01-01" });
    const r = run({ documents: [d] });
    const alert = r.alerts.find((a) => a.severity === "critical" && a.message.includes("regulatory"));
    expect(alert).toBeUndefined();
  });

  it("critical: mandatory docs with zero sign-off", () => {
    const d = makeDoc({ tags: ["mandatory"], title: "Fire Safety Procedure" });
    const r = run({ documents: [d] });
    const alert = r.alerts.find((a) => a.severity === "critical" && a.message.includes("zero staff sign-off"));
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("Fire Safety Procedure");
  });

  it("high: expired non-regulatory documents", () => {
    const d = makeDoc({ category: "contract", expiry_date: "2026-01-01" });
    const r = run({ documents: [d] });
    const alert = r.alerts.find((a) => a.severity === "high" && a.message.includes("expired"));
    expect(alert).toBeDefined();
  });

  it("high: docs with <50% sign-off", () => {
    const d = makeDoc({ title: "Risk Assessment" });
    const receipts = [makeReceipt(d.id, "s1")]; // 33%
    const r = run({ documents: [d], read_receipts: receipts });
    const alert = r.alerts.find((a) => a.severity === "high" && a.message.includes("less than 50%"));
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("Risk Assessment (33%)");
  });

  it("medium: documents expiring within 30 days", () => {
    const d = makeDoc({ expiry_date: "2026-06-15", title: "Care Plan" }); // 21 days
    const r = run({ documents: [d] });
    const alert = r.alerts.find((a) => a.severity === "medium" && a.message.includes("expiring within 30"));
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("Care Plan");
  });

  it("low: documents expiring within 31-90 days", () => {
    const d = makeDoc({ expiry_date: "2026-07-15" }); // 51 days
    const r = run({ documents: [d] });
    const alert = r.alerts.find((a) => a.severity === "low" && a.message.includes("31–90 days"));
    expect(alert).toBeDefined();
  });
});

// ── ARIA Insights ─────────────────────────────────────────────────────────

describe("ARIA insights", () => {
  it("critical: expired regulatory documents", () => {
    const d = makeDoc({ category: "policy", expiry_date: "2026-01-01" });
    const r = run({ documents: [d] });
    const insight = r.insights.find((i) => i.severity === "critical" && i.text.includes("expired"));
    expect(insight).toBeDefined();
    expect(insight!.text).toContain("SCCIF");
  });

  it("warning: low overall sign-off rate", () => {
    const d1 = makeDoc();
    const d2 = makeDoc();
    // d1: 1/3, d2: 0/3 → avg ~17%
    const receipts = [makeReceipt(d1.id, "s1")];
    const r = run({ documents: [d1, d2], read_receipts: receipts });
    const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("sign-off rate"));
    expect(insight).toBeDefined();
  });

  it("warning: mandatory docs not fully signed", () => {
    const d = makeDoc({ tags: ["mandatory"] });
    const receipts = [makeReceipt(d.id, "s1"), makeReceipt(d.id, "s2")]; // 67%
    const r = run({ documents: [d], read_receipts: receipts });
    const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("Mandatory document sign-off"));
    expect(insight).toBeDefined();
    expect(insight!.text).toContain("67%");
  });

  it("warning: expiring documents", () => {
    const d = makeDoc({ expiry_date: "2026-07-01" }); // within 90d
    const r = run({ documents: [d] });
    const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("expiring"));
    expect(insight).toBeDefined();
  });

  it("positive: all docs fully signed", () => {
    const d1 = makeDoc();
    const d2 = makeDoc();
    const receipts = [
      makeReceipt(d1.id, "s1"), makeReceipt(d1.id, "s2"), makeReceipt(d1.id, "s3"),
      makeReceipt(d2.id, "s1"), makeReceipt(d2.id, "s2"), makeReceipt(d2.id, "s3"),
    ];
    const r = run({ documents: [d1, d2], read_receipts: receipts });
    const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("All 2 documents"));
    expect(insight).toBeDefined();
  });

  it("positive: no expired documents", () => {
    const d = makeDoc({ expiry_date: "2027-01-01" });
    const r = run({ documents: [d] });
    const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("No expired documents"));
    expect(insight).toBeDefined();
  });

  it("positive: 100% mandatory sign-off", () => {
    const d = makeDoc({ tags: ["mandatory"] });
    const receipts = [
      makeReceipt(d.id, "s1"), makeReceipt(d.id, "s2"), makeReceipt(d.id, "s3"),
    ];
    const r = run({ documents: [d], read_receipts: receipts });
    const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("100% sign-off rate on all"));
    expect(insight).toBeDefined();
  });

  it("positive: document versioning", () => {
    const d1 = makeDoc({ version: 3 });
    const d2 = makeDoc({ version: 2 });
    const d3 = makeDoc({ version: 1 });
    const r = run({ documents: [d1, d2, d3] });
    const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("version updates"));
    expect(insight).toBeDefined();
    expect(insight!.text).toContain("2 documents");
  });
});

// ── Oak House Integration ────────────────────────────────────────────────

describe("Oak House integration scenario", () => {
  it("processes a realistic Oak House document set correctly", () => {
    const oakStaff = [
      makeStaff("staff_darren", "Darren Laville"),
      makeStaff("staff_ryan", "Ryan Thompson"),
      makeStaff("staff_edward", "Edward Brown"),
      makeStaff("staff_anna", "Anna Kowalska"),
      makeStaff("staff_chervelle", "Chervelle Harris"),
      makeStaff("staff_lackson", "Lackson Banda"),
    ];

    const docs: DocumentInput[] = [
      makeDoc({
        id: "doc_1", title: "Behaviour Support Plan — Tyler",
        category: "behaviour_support", version: 3,
        requires_read_sign: true, expiry_date: "2026-11-22",
        tags: ["behaviour", "mandatory", "mdt"],
        linked_child_id: "yp_tyler",
      }),
      makeDoc({
        id: "doc_2", title: "Missing from Care Protocol",
        category: "missing_protocol", version: 2,
        requires_read_sign: true, expiry_date: "2027-05-25",
        tags: ["safeguarding", "mandatory"],
      }),
      makeDoc({
        id: "doc_3", title: "Oak House — Child Protection Policy",
        category: "policy", version: 4,
        requires_read_sign: true, expiry_date: "2026-08-23", // ~90d
        tags: ["policy", "safeguarding", "mandatory"],
      }),
      makeDoc({
        id: "doc_4", title: "Risk Assessment — Jordan (Contextual Safeguarding)",
        category: "risk_assessment", version: 1,
        requires_read_sign: false, expiry_date: "2026-06-24", // ~30d
        tags: ["risk", "safeguarding"],
      }),
      makeDoc({
        id: "doc_5", title: "Medication Administration Policy",
        category: "procedure", version: 2,
        requires_read_sign: true, expiry_date: "2027-02-19",
        tags: ["medication", "mandatory"],
      }),
      makeDoc({
        id: "doc_6", title: "Ryan Forsythe — Employment Contract",
        category: "contract", version: 1,
        requires_read_sign: false, expiry_date: null,
        tags: ["hr", "contract"],
      }),
      makeDoc({
        id: "doc_7", title: "Reg 44 Report — March 2026",
        category: "reg44_report", version: 1,
        requires_read_sign: false, expiry_date: null,
        tags: ["ofsted", "regulation"],
      }),
    ];

    const receipts: ReadReceiptInput[] = [
      makeReceipt("doc_1", "staff_darren"),
      makeReceipt("doc_1", "staff_ryan"),
      makeReceipt("doc_2", "staff_darren"),
      makeReceipt("doc_2", "staff_ryan"),
      // doc_2 missing 4 staff sign-offs
      makeReceipt("doc_3", "staff_darren"),
      // doc_3 missing 5 staff sign-offs
      makeReceipt("doc_5", "staff_darren"),
      makeReceipt("doc_5", "staff_ryan"),
      // doc_5 missing 4 staff sign-offs
    ];

    const r = run({
      documents: docs,
      read_receipts: receipts,
      active_staff: oakStaff,
    });

    // ── Overview ──────────────────────────────────────────────────────
    expect(r.overview.total_documents).toBe(7);
    expect(r.overview.documents_requiring_sign).toBe(4); // doc_1, doc_2, doc_3, doc_5
    expect(r.overview.documents_expired).toBe(0);
    expect(r.overview.categories_count).toBe(7);
    expect(r.overview.mandatory_document_count).toBe(4); // doc_1, doc_2, doc_3, doc_5

    // Sign-off rates: doc_1=2/6=33%, doc_2=2/6=33%, doc_3=1/6=17%, doc_5=2/6=33%
    // avg = (33+33+17+33)/4 = 29%
    expect(r.overview.avg_sign_off_rate).toBe(29);
    expect(r.overview.fully_signed_documents).toBe(0);

    // ── Document profiles ─────────────────────────────────────────────
    const bsp = r.document_profiles.find((dp) => dp.document_id === "doc_1")!;
    expect(bsp.sign_off_rate).toBe(33);
    expect(bsp.outstanding_staff).toHaveLength(4);
    expect(bsp.outstanding_staff).toContain("Edward Brown");

    const cpPolicy = r.document_profiles.find((dp) => dp.document_id === "doc_3")!;
    expect(cpPolicy.sign_off_rate).toBe(17); // 1/6
    expect(cpPolicy.risk_flags).toContain("Less than 50% sign-off");
    expect(cpPolicy.risk_flags).toContain("Mandatory — not all staff signed");

    // doc_4 has requires_read_sign=false → no sign-off tracking
    const riskAssess = r.document_profiles.find((dp) => dp.document_id === "doc_4")!;
    expect(riskAssess.requires_read_sign).toBe(false);
    expect(riskAssess.sign_off_rate).toBe(0); // not applicable

    // doc_4 expiring within 30d
    expect(riskAssess.risk_flags).toContain("Expiring within 30 days");

    // ── Alerts ────────────────────────────────────────────────────────
    // High: docs with <50% sign-off (doc_1, doc_2, doc_3, doc_5 are all <50%)
    expect(r.alerts.some((a) => a.severity === "high" && a.message.includes("less than 50%"))).toBe(true);

    // Medium: doc_4 expiring in ~30 days
    expect(r.alerts.some((a) => a.severity === "medium" && a.message.includes("expiring within 30"))).toBe(true);

    // ── ARIA Insights ─────────────────────────────────────────────────
    // Warning: low sign-off rate
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("sign-off rate is 29%"))).toBe(true);

    // Warning: mandatory sign-off not 100%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Mandatory document sign-off"))).toBe(true);

    // Positive: no expired docs
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("No expired documents"))).toBe(true);

    // Positive: versioning (doc_1=3, doc_2=2, doc_3=4, doc_5=2 → 4 versioned)
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("version updates"))).toBe(true);
  });
});
