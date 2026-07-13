import { describe, it, expect } from "vitest";
import { computeGovernanceBoard } from "../doc-governance-engine";

// "Today" = 2026-07-13
const NOW = "2026-07-13T12:00:00.000Z";

const EMPTY = { homePolicies: [], policyReviews: [], trackedDocuments: [], fileDocuments: [] };

describe("computeGovernanceBoard — states", () => {
  it("classifies overdue / due_soon / current / no_date with the default 30-day lead", () => {
    const b = computeGovernanceBoard({
      ...EMPTY,
      homePolicies: [
        { id: "p1", title: "Safeguarding", version: "3.1", next_review_date: "2026-07-01" }, // overdue (-12)
        { id: "p2", title: "Medication", version: "2.0", next_review_date: "2026-08-01" }, // due_soon (+19)
        { id: "p3", title: "Fire Safety", version: "1.4", next_review_date: "2026-12-01" }, // current
        { id: "p4", title: "Whistleblowing", version: "1.0", next_review_date: null }, // no_date
      ],
      nowIso: NOW,
    });
    expect(b.rows.map((r) => [r.id, r.state])).toEqual([
      ["p1", "overdue"],
      ["p2", "due_soon"],
      ["p3", "current"],
      ["p4", "no_date"],
    ]);
    expect(b.rows[0].days_until).toBe(-12);
    expect(b.summary).toEqual({ overdue: 1, due_soon: 1, current: 1, no_date: 1, total: 4 });
  });

  it("a tracked document uses its own renewal_lead_time, not the default", () => {
    const b = computeGovernanceBoard({
      ...EMPTY,
      trackedDocuments: [
        // 60 days out; default lead (30) would say current, its own 90-day lead says due_soon
        { id: "t1", title: "Insurance Certificate", expiry_date: "2026-09-11", renewal_lead_time: 90 },
        // 60 days out with a 14-day lead → current
        { id: "t2", title: "Gas Certificate", expiry_date: "2026-09-11", renewal_lead_time: 14 },
      ],
      nowIso: NOW,
    });
    expect(b.rows.find((r) => r.id === "t1")?.state).toBe("due_soon");
    expect(b.rows.find((r) => r.id === "t2")?.state).toBe("current");
    expect(b.rows.find((r) => r.id === "t1")?.date_kind).toBe("expiry");
  });

  it("orders worst-first, then soonest date, then title", () => {
    const b = computeGovernanceBoard({
      ...EMPTY,
      homePolicies: [
        { id: "cur", title: "A Current", next_review_date: "2026-12-01" },
        { id: "od2", title: "B Overdue later", next_review_date: "2026-07-10" },
        { id: "od1", title: "A Overdue sooner", next_review_date: "2026-06-01" },
      ],
      fileDocuments: [{ id: "d1", title: "Z Doc", version: 3, expiry_date: "2026-07-20" }], // due_soon
      nowIso: NOW,
    });
    expect(b.rows.map((r) => r.id)).toEqual(["od1", "od2", "d1", "cur"]);
  });

  it("maps versions and hrefs per type (file docs get v-prefixed numbers)", () => {
    const b = computeGovernanceBoard({
      ...EMPTY,
      fileDocuments: [{ id: "d1", title: "Fire Risk Assessment", version: 3, expiry_date: null }],
      policyReviews: [{ id: "r1", title: "Data Protection", version: "4.2", owner: "RM", next_review_date: "2026-07-30" }],
      nowIso: NOW,
    });
    const file = b.rows.find((r) => r.id === "d1")!;
    expect(file.version).toBe("v3");
    expect(file.href).toBe("/documents");
    expect(file.state).toBe("no_date");
    const rev = b.rows.find((r) => r.id === "r1")!;
    expect(rev.version).toBe("4.2");
    expect(rev.owner).toBe("RM");
    expect(rev.href).toBe("/policy-review-tracker");
  });
});

describe("computeGovernanceBoard — honest coverage", () => {
  it("reports included / empty per source and SoP+Guide as live-database-only", () => {
    const b = computeGovernanceBoard({
      ...EMPTY,
      homePolicies: [{ id: "p1", title: "X", next_review_date: "2026-08-01" }],
      nowIso: NOW,
    });
    const byName = Object.fromEntries(b.coverage.map((c) => [c.source, c]));
    expect(byName["Home policies"].status).toBe("included");
    expect(byName["Policy review tracker"].status).toBe("empty");
    expect(byName["Document expiry tracker"].status).toBe("empty");
    expect(byName["Statement of Purpose & Children's Guide"].status).toBe("live_database_only");
  });

  it("empty world → empty board, honest zeros, versioning note present", () => {
    const b = computeGovernanceBoard({ ...EMPTY, nowIso: NOW });
    expect(b.summary.total).toBe(0);
    expect(b.rows).toEqual([]);
    expect(b.versioning_note).toMatch(/does not exist yet/i);
  });
});
