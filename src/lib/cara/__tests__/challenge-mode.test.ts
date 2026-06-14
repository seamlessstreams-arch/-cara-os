import { describe, it, expect, vi } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — CHALLENGE MODE TESTS
// ══════════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => null),
}));

vi.mock("@/lib/cara/ai/provider", () => ({
  generateCaraJSON: vi.fn(() => Promise.resolve({ challenges: [] })),
  generateCaraContent: vi.fn(() => Promise.resolve({ content: "[]" })),
}));

import { runChallengeMode } from "../challenge/challenge-mode";

describe("runChallengeMode (demo mode)", () => {
  it("returns an array of challenge items", async () => {
    const challenges = await runChallengeMode("report-1");
    expect(Array.isArray(challenges)).toBe(true);
  });

  it("each challenge has type, severity, and message", async () => {
    const challenges = await runChallengeMode("report-2");
    for (const challenge of challenges) {
      expect(challenge.type).toBeDefined();
      expect(challenge.severity).toBeDefined();
      expect(challenge.message).toBeDefined();
      expect(challenge.message.length).toBeGreaterThan(0);
    }
  });

  it("challenges have valid severity values", async () => {
    const challenges = await runChallengeMode("report-3");
    const validSeverities = ["info", "warning", "critical"];
    for (const challenge of challenges) {
      expect(validSeverities).toContain(challenge.severity);
    }
  });

  it("challenges have valid type values", async () => {
    const validTypes = [
      "missing_evidence",
      "weak_confidence",
      "missing_child_voice",
      "contradictory_evidence",
      "outdated_evidence",
      "unsupported_claim",
      "risk_not_addressed",
      "plan_drift",
      "missing_section",
      "safeguarding_gap",
    ];
    const challenges = await runChallengeMode("report-4");
    for (const challenge of challenges) {
      expect(
        validTypes,
        `Invalid challenge type: ${challenge.type}`,
      ).toContain(challenge.type);
    }
  });

  it("challenges are sorted by severity (critical first)", async () => {
    const challenges = await runChallengeMode("report-5");
    if (challenges.length < 2) return; // skip if not enough to sort
    const severityOrder: Record<string, number> = {
      critical: 0,
      warning: 1,
      info: 2,
    };
    for (let i = 1; i < challenges.length; i++) {
      expect(
        severityOrder[challenges[i].severity],
      ).toBeGreaterThanOrEqual(severityOrder[challenges[i - 1].severity]);
    }
  });
});
