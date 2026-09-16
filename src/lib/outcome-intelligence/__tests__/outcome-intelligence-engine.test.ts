import { describe, it, expect } from "vitest";
import {
  buildOutcomeIntelligence,
  type OutcomeIntelligenceInput,
} from "../outcome-intelligence-engine";

const NOW = "2026-06-22T12:00:00.000Z";
const CHILD = "yp_test";

// Date helpers relative to NOW (windowDays default 90).
const RECENT = "2026-05-20"; // ~33 days before
const RECENT_2 = "2026-06-10"; // ~12 days before
const PRIOR = "2026-02-15"; // ~127 days before → prior window

function emptyInput(over: Partial<OutcomeIntelligenceInput> = {}): OutcomeIntelligenceInput {
  return {
    childId: CHILD,
    childName: "Test Child",
    now: NOW,
    keyWorkingSessions: [],
    incidents: [],
    missingEpisodes: [],
    educationRecords: [],
    positiveAchievements: [],
    familyTimeSessions: [],
    returnInterviews: [],
    lacReviews: [],
    trustedAdults: [],
    ...over,
  };
}

describe("buildOutcomeIntelligence", () => {
  it("returns five domains and is deterministic for the injected now", () => {
    const a = buildOutcomeIntelligence(emptyInput());
    const b = buildOutcomeIntelligence(emptyInput());
    expect(a).toEqual(b);
    expect(a.generatedAt).toBe(NOW);
    expect(a.domains.map((d) => d.key)).toEqual([
      "safety",
      "education",
      "wellbeing",
      "relationships",
      "voice",
    ]);
  });

  it("never marks a domain needs_focus purely from empty data (no false red)", () => {
    // Genuinely empty — no records AND no trusted adult (the default). No domain,
    // including relationships, may read red from absence alone: only an evidenced
    // concern (a decline, a low mood, a rupture) is needs_focus.
    const out = buildOutcomeIntelligence(emptyInput());
    expect(out.domainsNeedingFocus).toBe(0);
    expect(out.overallStatus).not.toBe("needs_focus");
    expect(out.domains.find((d) => d.key === "safety")!.status).toBe("on_track");
    expect(out.domains.find((d) => d.key === "relationships")!.status).toBe("progressing");
  });

  it("flags safety as needs_focus on a recent high-severity incident", () => {
    const out = buildOutcomeIntelligence(
      emptyInput({
        incidents: [
          { id: "i1", child_id: CHILD, date: RECENT, severity: "high", type: "physical", description: "x" } as never,
        ],
      }),
    );
    const safety = out.domains.find((d) => d.key === "safety")!;
    expect(safety.status).toBe("needs_focus");
    expect(out.domainsNeedingFocus).toBeGreaterThanOrEqual(1);
    expect(out.overallStatus).toBe("needs_focus");
  });

  it("reads safety as improving when recent ruptures are fewer than prior", () => {
    const out = buildOutcomeIntelligence(
      emptyInput({
        incidents: [
          { id: "p1", child_id: CHILD, date: PRIOR, severity: "moderate", type: "verbal", description: "x" } as never,
          { id: "p2", child_id: CHILD, date: PRIOR, severity: "moderate", type: "verbal", description: "x" } as never,
        ],
      }),
    );
    const safety = out.domains.find((d) => d.key === "safety")!;
    // 0 recent vs 2 prior → fewer is better → improving, and no recent rupture → on_track.
    expect(safety.direction).toBe("improving");
    expect(safety.status).toBe("on_track");
  });

  it("flags wellbeing needs_focus on low recent mood", () => {
    const out = buildOutcomeIntelligence(
      emptyInput({
        keyWorkingSessions: [
          { id: "k1", child_id: CHILD, date: RECENT, staff_id: "s1", mood_before: 2, mood_after: 2 } as never,
          { id: "k2", child_id: CHILD, date: RECENT_2, staff_id: "s1", mood_before: 2, mood_after: 2 } as never,
        ],
      }),
    );
    const wb = out.domains.find((d) => d.key === "wellbeing")!;
    expect(wb.status).toBe("needs_focus");
  });

  it("reads relationships on_track with a trusted adult and recent connection", () => {
    const out = buildOutcomeIntelligence(
      emptyInput({
        trustedAdults: ["Emma (RM)"],
        keyWorkingSessions: [
          { id: "k1", child_id: CHILD, date: RECENT, staff_id: "s1", mood_before: 3, mood_after: 4 } as never,
          { id: "k2", child_id: CHILD, date: RECENT_2, staff_id: "s1", mood_before: 3, mood_after: 4 } as never,
        ],
      }),
    );
    const rel = out.domains.find((d) => d.key === "relationships")!;
    expect(rel.status).toBe("on_track");
  });

  it("flags relationships needs_focus only on an evidenced decline (connections dried up, no trusted adult)", () => {
    const out = buildOutcomeIntelligence(
      emptyInput({
        trustedAdults: [],
        // A connection in the PRIOR window, none recent → an evidenced drop, not
        // mere absence. This is the one case that is red; the empty case above is not.
        keyWorkingSessions: [
          { id: "k1", child_id: CHILD, date: PRIOR, staff_id: "s1", mood_before: 3, mood_after: 4 } as never,
        ],
      }),
    );
    expect(out.domains.find((d) => d.key === "relationships")!.status).toBe("needs_focus");
  });

  it("reads voice on_track when captured twice recently across sources", () => {
    const out = buildOutcomeIntelligence(
      emptyInput({
        lacReviews: [{ id: "l1", child_id: CHILD, date: RECENT, child_views: "I feel safe here" } as never],
        keyWorkingSessions: [
          { id: "k1", child_id: CHILD, date: RECENT_2, staff_id: "s1", mood_before: 3, mood_after: 4, child_voice: "I like football" } as never,
        ],
      }),
    );
    const voice = out.domains.find((d) => d.key === "voice")!;
    expect(voice.recentCount).toBe(2);
    expect(voice.status).toBe("on_track");
  });

  it("only includes the requested child's records", () => {
    const out = buildOutcomeIntelligence(
      emptyInput({
        incidents: [
          { id: "other", child_id: "yp_other", date: RECENT, severity: "critical", type: "physical", description: "x" } as never,
        ],
      }),
    );
    const safety = out.domains.find((d) => d.key === "safety")!;
    expect(safety.recentCount).toBe(0);
    expect(safety.status).toBe("on_track");
  });

  it("computes an overall improving trajectory and a headline", () => {
    const out = buildOutcomeIntelligence(
      emptyInput({
        trustedAdults: ["Emma (RM)"],
        keyWorkingSessions: [
          { id: "k1", child_id: CHILD, date: RECENT, staff_id: "s1", mood_before: 3, mood_after: 5, child_voice: "good" } as never,
          { id: "k2", child_id: CHILD, date: RECENT_2, staff_id: "s1", mood_before: 3, mood_after: 5, child_voice: "good" } as never,
        ],
        positiveAchievements: [
          { id: "a1", child_id: CHILD, date: RECENT, title: "Won a medal" } as never,
          { id: "a2", child_id: CHILD, date: RECENT_2, title: "Top of class" } as never,
        ],
        lacReviews: [{ id: "l1", child_id: CHILD, date: RECENT, child_views: "happy" } as never],
      }),
    );
    expect(out.domainsNeedingFocus).toBe(0);
    expect(out.domainsImproving).toBeGreaterThanOrEqual(out.domainsDeclining);
    expect(typeof out.headline).toBe("string");
    expect(out.headline.length).toBeGreaterThan(0);
  });
});
