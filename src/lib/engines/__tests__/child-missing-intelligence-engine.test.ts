// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Child Missing & Return Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeChildMissing,
  type ChildMissingInput,
  type MissingEpisodeInput,
} from "../child-missing-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function daysAgo(n: number): string {
  const d = new Date("2026-05-26");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function makeEpisode(overrides: Partial<MissingEpisodeInput> = {}): MissingEpisodeInput {
  return {
    id: `ep_${Math.random().toString(36).slice(2, 8)}`,
    date: daysAgo(30),
    time: "20:00",
    duration_hours: 2.0,
    risk_level: "medium",
    reported_to_police: false,
    reported_to_la: true,
    return_interview_completed: true,
    return_interview_date: daysAgo(29),
    contextual_safeguarding_risk: false,
    status: "closed",
    pattern_notes: null,
    ...overrides,
  };
}

function baseInput(overrides: Partial<ChildMissingInput> = {}): ChildMissingInput {
  return {
    today: TODAY,
    child_id: "yp_alex",
    child_name: "Alex",
    episodes: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Child Missing & Return Intelligence Engine", () => {

  // ── Output Shape ────────────────────────────────────────────────────────

  it("returns correct output shape", () => {
    const r = computeChildMissing(baseInput());
    expect(r).toHaveProperty("generated_at");
    expect(r).toHaveProperty("child_id");
    expect(r).toHaveProperty("child_name");
    expect(r).toHaveProperty("missing_risk");
    expect(r).toHaveProperty("missing_risk_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("frequency");
    expect(r).toHaveProperty("duration");
    expect(r).toHaveProperty("risk");
    expect(r).toHaveProperty("response_quality");
    expect(r).toHaveProperty("patterns");
    expect(r).toHaveProperty("is_currently_missing");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("sets generated_at and child details", () => {
    const r = computeChildMissing(baseInput());
    expect(r.generated_at).toBe(TODAY);
    expect(r.child_id).toBe("yp_alex");
    expect(r.child_name).toBe("Alex");
  });

  // ── Risk Level Rating ──────────────────────────────────────────────────

  it("rates no_episodes when no episodes exist", () => {
    const r = computeChildMissing(baseInput());
    expect(r.missing_risk).toBe("no_episodes");
    expect(r.missing_risk_score).toBe(0);
  });

  it("rates low for single low-risk episode", () => {
    const r = computeChildMissing(baseInput({
      episodes: [makeEpisode({ date: daysAgo(60), risk_level: "low", duration_hours: 1.0 })],
    }));
    expect(r.missing_risk).toBe("low");
  });

  it("rates high_risk for multiple recent high-risk CS episodes", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ date: daysAgo(10), risk_level: "high", contextual_safeguarding_risk: true, duration_hours: 4 }),
        makeEpisode({ date: daysAgo(30), risk_level: "high", contextual_safeguarding_risk: true, duration_hours: 3 }),
        makeEpisode({ date: daysAgo(60), risk_level: "medium", contextual_safeguarding_risk: true, duration_hours: 2 }),
        makeEpisode({ date: daysAgo(80), risk_level: "medium", duration_hours: 1.5 }),
      ],
    }));
    expect(r.missing_risk).toBe("high_risk");
    expect(r.missing_risk_score).toBeGreaterThanOrEqual(60);
  });

  // ── Frequency Profile ──────────────────────────────────────────────────

  it("counts episodes by time period", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ date: daysAgo(10) }),
        makeEpisode({ date: daysAgo(50) }),
        makeEpisode({ date: daysAgo(100) }),
        makeEpisode({ date: daysAgo(200) }),
        makeEpisode({ date: daysAgo(400) }), // beyond 365d
      ],
    }));
    expect(r.frequency.total_episodes).toBe(5);
    expect(r.frequency.episodes_90d).toBe(2);
    expect(r.frequency.episodes_180d).toBe(3);
    expect(r.frequency.episodes_365d).toBe(4);
  });

  it("detects increasing frequency trend", () => {
    // More episodes in recent 90d than in prior 90d
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ date: daysAgo(10) }),
        makeEpisode({ date: daysAgo(30) }),
        makeEpisode({ date: daysAgo(60) }),
        // Only 1 in prior 90d
        makeEpisode({ date: daysAgo(120) }),
      ],
    }));
    expect(r.frequency.trend).toBe("increasing");
  });

  it("detects decreasing frequency trend", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        // Only 1 in recent 90d
        makeEpisode({ date: daysAgo(30) }),
        // 3 in prior 90d
        makeEpisode({ date: daysAgo(100) }),
        makeEpisode({ date: daysAgo(120) }),
        makeEpisode({ date: daysAgo(150) }),
      ],
    }));
    expect(r.frequency.trend).toBe("decreasing");
  });

  // ── Duration Profile ───────────────────────────────────────────────────

  it("computes duration statistics", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ date: daysAgo(10), duration_hours: 4.0 }),
        makeEpisode({ date: daysAgo(30), duration_hours: 2.0 }),
        makeEpisode({ date: daysAgo(60), duration_hours: 1.0 }),
      ],
    }));
    expect(r.duration.avg_duration_hours).toBeCloseTo(2.3, 0);
    expect(r.duration.max_duration_hours).toBe(4.0);
    expect(r.duration.min_duration_hours).toBe(1.0);
  });

  it("detects increasing duration trend", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ date: daysAgo(5), duration_hours: 5.0 }),
        makeEpisode({ date: daysAgo(15), duration_hours: 4.5 }),
        makeEpisode({ date: daysAgo(25), duration_hours: 4.0 }),
        // Older - shorter
        makeEpisode({ date: daysAgo(60), duration_hours: 1.0 }),
        makeEpisode({ date: daysAgo(80), duration_hours: 1.5 }),
        makeEpisode({ date: daysAgo(100), duration_hours: 1.0 }),
      ],
    }));
    expect(r.duration.duration_trend).toBe("increasing");
  });

  // ── Risk Profile ───────────────────────────────────────────────────────

  it("identifies highest ever risk level", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ date: daysAgo(10), risk_level: "medium" }),
        makeEpisode({ date: daysAgo(30), risk_level: "critical" }),
        makeEpisode({ date: daysAgo(60), risk_level: "low" }),
      ],
    }));
    expect(r.risk.highest_ever_risk).toBe("critical");
    expect(r.risk.current_risk_level).toBe("medium"); // Most recent
  });

  it("counts contextual safeguarding episodes", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ contextual_safeguarding_risk: true }),
        makeEpisode({ contextual_safeguarding_risk: true }),
        makeEpisode({ contextual_safeguarding_risk: false }),
      ],
    }));
    expect(r.risk.contextual_safeguarding_episodes).toBe(2);
  });

  it("detects risk escalation", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ date: daysAgo(5), risk_level: "high" }),
        makeEpisode({ date: daysAgo(20), risk_level: "high" }),
        makeEpisode({ date: daysAgo(60), risk_level: "low" }),
        makeEpisode({ date: daysAgo(90), risk_level: "low" }),
      ],
    }));
    expect(r.risk.risk_escalating).toBe(true);
  });

  // ── Response Quality ───────────────────────────────────────────────────

  it("computes return interview rate", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ return_interview_completed: true, status: "closed" }),
        makeEpisode({ return_interview_completed: false, status: "closed" }),
        makeEpisode({ return_interview_completed: true, status: "closed" }),
      ],
    }));
    expect(r.response_quality.return_interview_rate).toBe(67);
  });

  it("computes police reporting rate for high/critical episodes", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ risk_level: "high", reported_to_police: true }),
        makeEpisode({ risk_level: "critical", reported_to_police: true }),
        makeEpisode({ risk_level: "high", reported_to_police: false }),
        makeEpisode({ risk_level: "low", reported_to_police: false }), // Not counted
      ],
    }));
    expect(r.response_quality.police_reporting_rate).toBe(67); // 2 of 3 high/critical
  });

  // ── Currently Missing ──────────────────────────────────────────────────

  it("detects currently missing status", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ status: "active", date: daysAgo(0) }),
        makeEpisode({ status: "closed", date: daysAgo(30) }),
      ],
    }));
    expect(r.is_currently_missing).toBe(true);
  });

  it("detects not currently missing", () => {
    const r = computeChildMissing(baseInput({
      episodes: [makeEpisode({ status: "closed" })],
    }));
    expect(r.is_currently_missing).toBe(false);
  });

  // ── Patterns ───────────────────────────────────────────────────────────

  it("identifies CS pattern for multiple CS episodes", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ contextual_safeguarding_risk: true }),
        makeEpisode({ contextual_safeguarding_risk: true }),
      ],
    }));
    const hasCsPattern = r.patterns.some((p) => p.text.includes("contextual safeguarding"));
    expect(hasCsPattern).toBe(true);
  });

  it("identifies evening pattern", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ time: "20:00" }),
        makeEpisode({ time: "21:30" }),
      ],
    }));
    const hasEveningPattern = r.patterns.some((p) => p.text.includes("evening"));
    expect(hasEveningPattern).toBe(true);
  });

  it("identifies single episode pattern", () => {
    const r = computeChildMissing(baseInput({
      episodes: [makeEpisode()],
    }));
    const hasSinglePattern = r.patterns.some((p) => p.text.includes("Single isolated"));
    expect(hasSinglePattern).toBe(true);
  });

  // ── Strengths ──────────────────────────────────────────────────────────

  it("generates strength for no episodes", () => {
    const r = computeChildMissing(baseInput());
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.strengths.some((s) => s.includes("No missing episodes"))).toBe(true);
  });

  it("generates strength for 100% RI completion", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ return_interview_completed: true, status: "closed" }),
        makeEpisode({ return_interview_completed: true, status: "closed" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("100%"))).toBe(true);
  });

  it("generates strength for decreasing frequency", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ date: daysAgo(30) }),
        makeEpisode({ date: daysAgo(100) }),
        makeEpisode({ date: daysAgo(120) }),
        makeEpisode({ date: daysAgo(150) }),
      ],
    }));
    if (r.frequency.trend === "decreasing") {
      expect(r.strengths.some((s) => s.includes("decreasing"))).toBe(true);
    }
  });

  // ── Concerns ───────────────────────────────────────────────────────────

  it("generates concern for currently missing", () => {
    const r = computeChildMissing(baseInput({
      episodes: [makeEpisode({ status: "active", date: daysAgo(0) })],
    }));
    expect(r.concerns.some((c) => c.includes("CURRENTLY MISSING"))).toBe(true);
  });

  it("generates concern for increasing frequency", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ date: daysAgo(10) }),
        makeEpisode({ date: daysAgo(30) }),
        makeEpisode({ date: daysAgo(60) }),
        makeEpisode({ date: daysAgo(120) }),
      ],
    }));
    if (r.frequency.trend === "increasing") {
      expect(r.concerns.some((c) => c.includes("increasing in frequency"))).toBe(true);
    }
  });

  it("generates concern for incomplete RIs", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ return_interview_completed: false, status: "closed" }),
        makeEpisode({ return_interview_completed: true, status: "closed" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("Return interviews") || c.includes("return interview"))).toBe(true);
  });

  // ── Recommendations ────────────────────────────────────────────────────

  it("recommends immediate action for currently missing", () => {
    const r = computeChildMissing(baseInput({
      episodes: [makeEpisode({ status: "active", date: daysAgo(0) })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate")).toBe(true);
  });

  it("recommends strategy discussion for CS episodes", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ contextual_safeguarding_risk: true }),
        makeEpisode({ contextual_safeguarding_risk: true }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("strategy") || rec.recommendation.includes("NRM"))).toBe(true);
  });

  // ── ARIA Insights ──────────────────────────────────────────────────────

  it("generates positive insight for no episodes", () => {
    const r = computeChildMissing(baseInput());
    expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
  });

  it("generates critical insight for high risk", () => {
    const r = computeChildMissing(baseInput({
      episodes: [
        makeEpisode({ date: daysAgo(5), risk_level: "critical", contextual_safeguarding_risk: true, duration_hours: 6 }),
        makeEpisode({ date: daysAgo(15), risk_level: "high", contextual_safeguarding_risk: true, duration_hours: 4 }),
        makeEpisode({ date: daysAgo(40), risk_level: "high", contextual_safeguarding_risk: true, duration_hours: 3 }),
        makeEpisode({ date: daysAgo(70), risk_level: "medium", duration_hours: 2 }),
      ],
    }));
    if (r.missing_risk === "high_risk") {
      expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
    }
  });

  // ── Headline ───────────────────────────────────────────────────────────

  it("includes risk level in headline", () => {
    const r = computeChildMissing(baseInput());
    expect(r.headline).toContain("no episodes");
  });

  it("includes CURRENTLY MISSING in headline when active", () => {
    const r = computeChildMissing(baseInput({
      episodes: [makeEpisode({ status: "active" })],
    }));
    expect(r.headline).toContain("CURRENTLY MISSING");
  });

  // ── Edge Cases ─────────────────────────────────────────────────────────

  it("handles null duration gracefully", () => {
    const r = computeChildMissing(baseInput({
      episodes: [makeEpisode({ duration_hours: null })],
    }));
    expect(r.duration.avg_duration_hours).toBe(0);
    expect(r.duration.max_duration_hours).toBe(0);
  });

  it("clamps risk score to 0-100", () => {
    const r = computeChildMissing(baseInput({
      episodes: Array.from({ length: 10 }, (_, i) => makeEpisode({
        date: daysAgo(i * 10),
        risk_level: "critical",
        contextual_safeguarding_risk: true,
        duration_hours: 10,
        return_interview_completed: false,
        status: i === 0 ? "active" : "closed",
      })),
    }));
    expect(r.missing_risk_score).toBeGreaterThanOrEqual(0);
    expect(r.missing_risk_score).toBeLessThanOrEqual(100);
  });
});
