import { describe, it, expect, vi } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — LEARNING STUDIO SERVICE TESTS
// ══════════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => null),
}));

vi.mock("@/lib/cara-studio/ai-provider.service", () => ({
  generateStudioContent: vi.fn(() => Promise.resolve({
    content: JSON.stringify({
      title: "Test Resource",
      sections: [{ heading: "Introduction", body: "Test body" }],
    }),
  })),
}));

import {
  getResourceTypeGroups,
  listLearningResources,
  generateLearningResource,
} from "../learning-studio.service";

describe("getResourceTypeGroups", () => {
  it("returns 5 resource type groups", () => {
    const groups = getResourceTypeGroups();
    expect(groups).toHaveLength(5);
  });

  it("covers all expected group names", () => {
    const groups = getResourceTypeGroups();
    const names = groups.map((g) => g.group);
    expect(names).toContain("Training Sessions");
    expect(names).toContain("Knowledge Checks");
    expect(names).toContain("Therapeutic Tools");
    expect(names).toContain("Quick Reference");
    expect(names).toContain("Briefings & Packs");
  });

  it("total resource types across all groups equals 21", () => {
    const groups = getResourceTypeGroups();
    const total = groups.reduce((sum, g) => sum + g.types.length, 0);
    expect(total).toBe(21);
  });

  it("each group has at least one type", () => {
    const groups = getResourceTypeGroups();
    for (const g of groups) {
      expect(g.types.length, `Group "${g.group}" should have types`).toBeGreaterThan(0);
    }
  });

  it("every type has type and label fields", () => {
    const groups = getResourceTypeGroups();
    for (const g of groups) {
      for (const t of g.types) {
        expect(t.type).toBeDefined();
        expect(t.label).toBeDefined();
        expect(t.label.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("listLearningResources (demo mode)", () => {
  it("returns an array", async () => {
    const resources = await listLearningResources();
    expect(Array.isArray(resources)).toBe(true);
    expect(resources.length).toBeGreaterThan(0);
  });

  it("each resource has required fields", async () => {
    const resources = await listLearningResources();
    for (const r of resources) {
      expect(r.id).toBeDefined();
      expect(r.resource_type).toBeDefined();
      expect(r.title).toBeDefined();
      expect(r.status).toBeDefined();
      expect(r.content).toBeDefined();
    }
  });

  it("each resource has target_audience", async () => {
    const resources = await listLearningResources();
    for (const r of resources) {
      expect(r.target_audience).toBeDefined();
      expect(["staff", "child", "parent", "multi_disciplinary"]).toContain(r.target_audience);
    }
  });
});

describe("generateLearningResource (demo mode)", () => {
  it("returns a resource with the requested type", async () => {
    const resource = await generateLearningResource({
      resourceType: "quiz",
      topic: "Safeguarding Level 3",
      targetAudience: "staff",
      createdBy: "test-user",
    });
    expect(resource).not.toBeNull();
    expect(resource.resource_type).toBe("quiz");
  });

  it("generated resource has status 'draft'", async () => {
    const resource = await generateLearningResource({
      resourceType: "quick_reference_card",
      topic: "PACE Language",
      targetAudience: "staff",
      createdBy: "test-user",
    });
    expect(resource.status).toBe("draft");
  });

  it("generated resource has title", async () => {
    const resource = await generateLearningResource({
      resourceType: "staff_training",
      topic: "De-escalation Techniques",
      createdBy: "test-user",
    });
    expect(resource.title).toBeDefined();
    expect(resource.title.length).toBeGreaterThan(0);
  });
});
