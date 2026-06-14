import { describe, it, expect, vi } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — EVIDENCE RETRIEVAL TESTS
// ══════════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => null),
}));

import {
  retrieveEvidence,
  retrieveChildProfile,
  groupEvidenceByType,
  summariseEvidence,
} from "../evidence/evidence-retrieval";

describe("retrieveEvidence (demo mode)", () => {
  it("returns an array of normalised evidence items", async () => {
    const evidence = await retrieveEvidence({
      homeId: "demo-home",
      childId: "child_1",
      dateRangeStart: "2026-05-05",
      dateRangeEnd: "2026-05-11",
    });
    expect(Array.isArray(evidence)).toBe(true);
    expect(evidence.length).toBeGreaterThan(0);
  });

  it("each evidence item has required fields", async () => {
    const evidence = await retrieveEvidence({
      homeId: "demo-home",
      childId: "child_1",
      dateRangeStart: "2026-05-05",
      dateRangeEnd: "2026-05-11",
    });
    for (const item of evidence) {
      expect(item.id).toBeDefined();
      expect(item.sourceTable).toBeDefined();
      expect(item.sourceRecordId).toBeDefined();
      expect(item.title).toBeDefined();
      expect(item.date).toBeDefined();
      expect(item.type).toBeDefined();
      expect(item.summary).toBeDefined();
      expect(Array.isArray(item.tags)).toBe(true);
    }
  });

  it("demo evidence covers multiple types", async () => {
    const evidence = await retrieveEvidence({
      homeId: "demo-home",
      childId: "child_1",
      dateRangeStart: "2026-05-01",
      dateRangeEnd: "2026-05-31",
    });
    const types = new Set(evidence.map((e) => e.type));
    expect(types.size).toBeGreaterThan(1);
  });
});

describe("retrieveChildProfile (demo mode)", () => {
  it("returns a child profile", async () => {
    const profile = await retrieveChildProfile("child_1", "demo-home");
    expect(profile).not.toBeNull();
    expect(profile!.id).toBeDefined();
    expect(profile!.firstName).toBeDefined();
    expect(profile!.lastName).toBeDefined();
  });
});

describe("groupEvidenceByType", () => {
  it("groups evidence items by their type field", async () => {
    const evidence = await retrieveEvidence({
      homeId: "demo-home",
      childId: "child_1",
      dateRangeStart: "2026-05-05",
      dateRangeEnd: "2026-05-11",
    });
    const grouped = groupEvidenceByType(evidence);
    expect(typeof grouped).toBe("object");
    const totalItems = Object.values(grouped).reduce(
      (sum, arr) => sum + arr.length,
      0,
    );
    expect(totalItems).toBe(evidence.length);
  });
});

describe("summariseEvidence", () => {
  it("returns a human-readable summary string", async () => {
    const evidence = await retrieveEvidence({
      homeId: "demo-home",
      childId: "child_1",
      dateRangeStart: "2026-05-05",
      dateRangeEnd: "2026-05-11",
    });
    const summary = summariseEvidence(evidence);
    expect(typeof summary).toBe("string");
    expect(summary.length).toBeGreaterThan(0);
  });
});
