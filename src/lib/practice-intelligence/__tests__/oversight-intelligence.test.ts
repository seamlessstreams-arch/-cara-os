import { describe, it, expect, vi } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — OVERSIGHT INTELLIGENCE SERVICE TESTS
// ══════════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => null),
}));

vi.mock("@/lib/cara-studio/ai-provider.service", () => ({
  generateStudioContent: vi.fn(() => Promise.resolve({
    content: JSON.stringify({
      summary: "Test oversight summary",
      evidence_reviewed: "Test evidence",
      child_impact: "Test child impact",
      staff_practice_analysis: "Test staff analysis",
      risk_analysis: "Test risk analysis",
      safeguarding_considerations: "No concerns",
      regulatory_relevance: "Reg 12 — Protection of Children",
      actions_required: [{ action: "Review risk assessment", owner: "Key Worker", priority: "high" }],
      human_review_note: "AI-generated oversight draft — RM must review and personalise.",
    }),
  })),
}));

import {
  listOversightDrafts,
  generateOversightDraft,
} from "../oversight-intelligence.service";

describe("listOversightDrafts (demo mode)", () => {
  it("returns an array", async () => {
    const drafts = await listOversightDrafts();
    expect(Array.isArray(drafts)).toBe(true);
    expect(drafts.length).toBeGreaterThan(0);
  });

  it("each draft has required fields", async () => {
    const drafts = await listOversightDrafts();
    for (const d of drafts) {
      expect(d.id).toBeDefined();
      expect(d.oversight_type).toBeDefined();
      expect(d.status).toBeDefined();
      expect(d.content).toBeDefined();
    }
  });

  it("each draft content has human_review_note", async () => {
    const drafts = await listOversightDrafts();
    for (const d of drafts) {
      expect(d.content.human_review_note).toBeDefined();
      expect(d.content.human_review_note.length).toBeGreaterThan(0);
    }
  });

  it("each draft content has core oversight sections", async () => {
    const drafts = await listOversightDrafts();
    for (const d of drafts) {
      expect(d.content.summary).toBeDefined();
      expect(d.content.evidence_reviewed).toBeDefined();
      expect(d.content.child_impact).toBeDefined();
      expect(d.content.staff_practice_analysis).toBeDefined();
      expect(d.content.risk_analysis).toBeDefined();
      expect(d.content.safeguarding_considerations).toBeDefined();
      expect(d.content.regulatory_relevance).toBeDefined();
    }
  });

  it("each draft has actions_required array", async () => {
    const drafts = await listOversightDrafts();
    for (const d of drafts) {
      expect(Array.isArray(d.content.actions_required)).toBe(true);
    }
  });

  it("draft statuses are valid values", async () => {
    const validStatuses = ["draft", "in_review", "changes_requested", "approved", "committed"];
    const drafts = await listOversightDrafts();
    for (const d of drafts) {
      expect(validStatuses).toContain(d.status);
    }
  });
});

describe("generateOversightDraft (demo mode)", () => {
  it("returns a draft with the correct oversight type", async () => {
    const draft = await generateOversightDraft({
      oversightType: "incident_oversight",
      childId: "child_1",
      createdBy: "test-user",
    });
    expect(draft).not.toBeNull();
    expect(draft.oversight_type).toBe("incident_oversight");
  });

  it("generated draft has status 'draft'", async () => {
    const draft = await generateOversightDraft({
      oversightType: "daily_log_oversight",
      createdBy: "test-user",
    });
    expect(draft.status).toBe("draft");
  });

  it("generated draft content includes human_review_note", async () => {
    const draft = await generateOversightDraft({
      oversightType: "safeguarding_oversight",
      createdBy: "test-user",
    });
    expect(draft.content.human_review_note).toBeDefined();
    expect(draft.content.human_review_note.length).toBeGreaterThan(0);
  });
});
