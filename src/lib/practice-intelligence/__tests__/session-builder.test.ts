import { describe, it, expect, vi } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — SESSION BUILDER SERVICE TESTS
// ══════════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => null),
}));

vi.mock("@/lib/cara-studio/ai-provider.service", () => ({
  generateStudioContent: vi.fn(() => Promise.resolve({
    content: JSON.stringify({
      purpose: "Test purpose",
      therapeutic_rationale: "Test rationale",
      staff_preparation: "Test prep",
      emotional_safety: "Test safety",
      opening: "Test opening",
      main_activity: "Test activity",
      reflective_questions: ["Q1", "Q2"],
      creative_option: "Test creative option",
      scaling_question: "Test scaling question",
      risk_considerations: "Test risk considerations",
      what_to_avoid: "Test what to avoid",
      recording_template: "Test recording template",
      materials_needed: ["Resource 1"],
      estimated_duration: "30 minutes",
      age_appropriateness: "Adapt as needed",
      adaptations: ["Adaptation 1"],
    }),
  })),
}));

import {
  getSessionTypeGroups,
  listGeneratedSessions,
  generateSession,
} from "../session-builder.service";

describe("getSessionTypeGroups", () => {
  it("returns 9 session type groups", () => {
    const groups = getSessionTypeGroups();
    expect(groups).toHaveLength(9);
  });

  it("covers all expected group names", () => {
    const groups = getSessionTypeGroups();
    const groupNames = groups.map((g) => g.group);
    expect(groupNames).toContain("Therapeutic Work");
    expect(groupNames).toContain("Emotional Support");
    expect(groupNames).toContain("Relationships & Social");
    expect(groupNames).toContain("Contact & Family");
    expect(groupNames).toContain("Safety & Wellbeing");
    expect(groupNames).toContain("Transitions & Independence");
    expect(groupNames).toContain("Education & Aspiration");
    expect(groupNames).toContain("Identity");
    expect(groupNames).toContain("Staff & Team");
  });

  it("each group has at least one type", () => {
    const groups = getSessionTypeGroups();
    for (const g of groups) {
      expect(g.types.length, `Group "${g.group}" should have types`).toBeGreaterThan(0);
    }
  });

  it("total session types across all groups equals 35", () => {
    const groups = getSessionTypeGroups();
    const total = groups.reduce((sum, g) => sum + g.types.length, 0);
    expect(total).toBe(35);
  });

  it("every type entry has type and label fields", () => {
    const groups = getSessionTypeGroups();
    for (const g of groups) {
      for (const t of g.types) {
        expect(t.type).toBeDefined();
        expect(t.label).toBeDefined();
        expect(t.label.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("listGeneratedSessions (demo mode)", () => {
  it("returns an array", async () => {
    const sessions = await listGeneratedSessions();
    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions.length).toBeGreaterThan(0);
  });

  it("each session has required fields", async () => {
    const sessions = await listGeneratedSessions();
    for (const s of sessions) {
      expect(s.id).toBeDefined();
      expect(s.session_type).toBeDefined();
      expect(s.framework).toBeDefined();
      expect(s.status).toBeDefined();
      expect(s.content).toBeDefined();
    }
  });

  it("each session content has a purpose field", async () => {
    const sessions = await listGeneratedSessions();
    for (const s of sessions) {
      expect(s.content.purpose).toBeDefined();
      expect(s.content.purpose.length).toBeGreaterThan(0);
    }
  });

  it("each session content has reflective_questions", async () => {
    const sessions = await listGeneratedSessions();
    for (const s of sessions) {
      expect(Array.isArray(s.content.reflective_questions)).toBe(true);
      expect(s.content.reflective_questions.length).toBeGreaterThan(0);
    }
  });
});

describe("generateSession (demo mode)", () => {
  it("returns a session with the requested type and framework", async () => {
    const session = await generateSession({
      sessionType: "keywork_session",
      framework: "pace",
      childId: "child_1",
      createdBy: "test-user",
    });
    expect(session).not.toBeNull();
    expect(session.session_type).toBe("keywork_session");
    expect(session.framework).toBe("pace");
  });

  it("generated session has status 'draft'", async () => {
    const session = await generateSession({
      sessionType: "feelings_exploration",
      framework: "ddp",
      createdBy: "test-user",
    });
    expect(session.status).toBe("draft");
  });

  it("generated session content has purpose and therapeutic_rationale", async () => {
    const session = await generateSession({
      sessionType: "contact_debrief",
      framework: "pace",
      createdBy: "test-user",
    });
    expect(session.content.purpose).toBeDefined();
    expect(session.content.therapeutic_rationale).toBeDefined();
  });
});
