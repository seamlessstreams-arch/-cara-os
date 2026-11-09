import { describe, it, expect } from "vitest";
import { checkDocumentControl, type DocumentControl } from "../document-control";

function doc(overrides: Partial<DocumentControl> = {}): DocumentControl {
  return {
    title: "Missing-from-care protocol",
    owner: "Registered Manager",
    adoptionDate: "2026-01-10",
    nextReviewDate: "2027-01-10",
    ...overrides,
  };
}

describe("checkDocumentControl", () => {
  it("passes a fully-controlled, in-date document", () => {
    const r = checkDocumentControl(doc(), "2026-11-09");
    expect(r.ok).toBe(true);
    expect(r.missing).toHaveLength(0);
    expect(r.reviewOverdue).toBe(false);
  });

  it("flags a missing adoption date (eval case — the field that was absent)", () => {
    const r = checkDocumentControl(doc({ adoptionDate: null }), "2026-11-09");
    expect(r.ok).toBe(false);
    expect(r.missing).toContain("adoptionDate");
  });

  it("flags a missing owner", () => {
    const r = checkDocumentControl(doc({ owner: "  " }), "2026-11-09");
    expect(r.missing).toContain("owner");
  });

  it("flags an overdue review", () => {
    const r = checkDocumentControl(doc({ nextReviewDate: "2026-06-01" }), "2026-11-09");
    expect(r.ok).toBe(false);
    expect(r.reviewOverdue).toBe(true);
    expect(r.summary).toMatch(/past its next-review/i);
  });
});
