import { describe, it, expect } from "vitest";
import {
  computeManagerPriorityBriefing,
  type EngineSignalInput,
} from "../manager-priority-briefing-engine";

const TODAY = "2026-06-08";

function sig(partial: Partial<EngineSignalInput>): EngineSignalInput {
  return {
    engine_key: "home-x-intelligence",
    label: "X",
    domain: "protection",
    rating: null,
    score: null,
    headline: null,
    insights: [],
    concerns: [],
    recommendations: [],
    ...partial,
  };
}

describe("computeManagerPriorityBriefing", () => {
  it("returns stable with no data when there are no signals", () => {
    const r = computeManagerPriorityBriefing({ signals: [], engines_queried: 10, engines_responded: 0, today: TODAY });
    expect(r.overall_status).toBe("stable");
    expect(r.total_signals).toBe(0);
    expect(r.priority_signals).toHaveLength(0);
    expect(r.headline).toMatch(/no intelligence/i);
    expect(r.generated_for).toBe(TODAY);
  });

  it("stable headline differs when engines responded but found nothing", () => {
    const r = computeManagerPriorityBriefing({
      signals: [sig({ rating: "good", headline: "All fine" })],
      engines_queried: 5,
      engines_responded: 5,
      today: TODAY,
    });
    expect(r.overall_status).toBe("stable");
    expect(r.headline).toMatch(/no active concerns/i);
    expect(r.positives).toContain("X: All fine");
  });

  it("maps a critical insight to a critical signal and overall critical", () => {
    const r = computeManagerPriorityBriefing({
      signals: [sig({ insights: [{ text: "Self-harm plan review overdue", severity: "critical" }] })],
      engines_queried: 1,
      engines_responded: 1,
      today: TODAY,
    });
    expect(r.overall_status).toBe("critical");
    expect(r.total_critical).toBe(1);
    expect(r.priority_signals[0]).toMatchObject({
      rank: 1,
      severity: "critical",
      origin: "insight",
      message: "Self-harm plan review overdue",
    });
  });

  it("maps inadequate rating -> critical and requires_improvement -> high", () => {
    const r = computeManagerPriorityBriefing({
      signals: [
        sig({ engine_key: "a", label: "A", rating: "inadequate", headline: "A is inadequate" }),
        sig({ engine_key: "b", label: "B", rating: "requires_improvement", headline: "B needs work" }),
      ],
      engines_queried: 2,
      engines_responded: 2,
      today: TODAY,
    });
    expect(r.total_critical).toBe(1);
    expect(r.total_high).toBe(1);
    expect(r.overall_status).toBe("critical");
    // critical ranks before high
    expect(r.priority_signals[0].severity).toBe("critical");
    expect(r.priority_signals[0].message).toBe("A is inadequate");
    expect(r.priority_signals[1].severity).toBe("high");
  });

  it("does NOT flag good/outstanding/adequate/insufficient_data ratings", () => {
    const r = computeManagerPriorityBriefing({
      signals: [
        sig({ rating: "good" }),
        sig({ rating: "outstanding" }),
        sig({ rating: "adequate" }),
        sig({ rating: "insufficient_data" }),
      ],
      engines_queried: 4,
      engines_responded: 4,
      today: TODAY,
    });
    expect(r.total_signals).toBe(0);
    expect(r.overall_status).toBe("stable");
  });

  it("maps recommendation urgency: immediate->high, soon->warning, planned dropped", () => {
    const r = computeManagerPriorityBriefing({
      signals: [
        sig({
          recommendations: [
            { text: "Do now", urgency: "immediate", regulatory_ref: "Reg 12" },
            { text: "Do soon", urgency: "soon", regulatory_ref: null },
            { text: "Later", urgency: "planned", regulatory_ref: null },
          ],
        }),
      ],
      engines_queried: 1,
      engines_responded: 1,
      today: TODAY,
    });
    expect(r.total_high).toBe(1);
    expect(r.total_warning).toBe(1);
    expect(r.total_signals).toBe(2); // planned dropped
    const high = r.priority_signals.find((s) => s.severity === "high");
    expect(high?.regulatory_ref).toBe("Reg 12");
  });

  it("treats concerns as watch only when the engine is not already rating-flagged", () => {
    const flagged = computeManagerPriorityBriefing({
      signals: [sig({ rating: "inadequate", concerns: ["c1", "c2"] })],
      engines_queried: 1,
      engines_responded: 1,
      today: TODAY,
    });
    // inadequate -> 1 critical; concerns suppressed because already rating-flagged
    expect(flagged.total_critical).toBe(1);
    expect(flagged.total_watch).toBe(0);

    const unflagged = computeManagerPriorityBriefing({
      signals: [sig({ rating: "good", concerns: ["c1", "c2"] })],
      engines_queried: 1,
      engines_responded: 1,
      today: TODAY,
    });
    expect(unflagged.total_watch).toBe(2);
    expect(unflagged.overall_status).toBe("watch");
  });

  it("ranks critical > high > warning > watch and builds domain rollup", () => {
    const r = computeManagerPriorityBriefing({
      signals: [
        sig({ engine_key: "p1", label: "P1", domain: "protection", insights: [{ text: "crit", severity: "critical" }] }),
        sig({ engine_key: "e1", label: "E1", domain: "experiences", insights: [{ text: "warn", severity: "warning" }] }),
        sig({ engine_key: "l1", label: "L1", domain: "leadership", rating: "requires_improvement", headline: "high one" }),
      ],
      engines_queried: 3,
      engines_responded: 3,
      today: TODAY,
    });
    expect(r.priority_signals.map((s) => s.severity)).toEqual(["critical", "high", "warning"]);
    const protection = r.domain_rollup.find((d) => d.domain === "protection");
    expect(protection).toMatchObject({ status: "red", critical_count: 1 });
    const experiences = r.domain_rollup.find((d) => d.domain === "experiences");
    expect(experiences).toMatchObject({ status: "amber", warning_count: 1 });
    // domains_at_risk excludes greens
    expect(r.domains_at_risk).toEqual(expect.arrayContaining(["protection", "experiences", "leadership"]));
    // rollup sorted criticals first
    expect(r.domain_rollup[0].domain).toBe("protection");
  });

  it("caps the rendered feed at 60 but counts the full set", () => {
    const many = Array.from({ length: 80 }, (_, i) =>
      sig({ engine_key: `k${i}`, label: `K${i}`, insights: [{ text: `crit ${i}`, severity: "critical" }] }),
    );
    const r = computeManagerPriorityBriefing({ signals: many, engines_queried: 80, engines_responded: 80, today: TODAY });
    expect(r.total_critical).toBe(80);
    expect(r.total_signals).toBe(80);
    expect(r.priority_signals).toHaveLength(60);
    expect(r.priority_signals[59].rank).toBe(60);
  });

  it("maps rare-but-severe vocab: life_threatening insight -> critical, emergency/urgent recs -> high", () => {
    const r = computeManagerPriorityBriefing({
      signals: [
        sig({ engine_key: "a", label: "A", insights: [{ text: "ligature risk", severity: "life_threatening" }] }),
        sig({ engine_key: "b", label: "B", recommendations: [{ text: "evacuate", urgency: "emergency", regulatory_ref: null }] }),
        sig({ engine_key: "c", label: "C", recommendations: [{ text: "call now", urgency: "urgent", regulatory_ref: null }] }),
      ],
      engines_queried: 3,
      engines_responded: 3,
      today: TODAY,
    });
    expect(r.total_critical).toBe(1);
    expect(r.total_high).toBe(2);
    expect(r.priority_signals[0]).toMatchObject({ severity: "critical", message: "ligature risk" });
  });

  it("ignores positive/low insight severities as attention signals", () => {
    const r = computeManagerPriorityBriefing({
      signals: [sig({ insights: [{ text: "great progress", severity: "positive" }] })],
      engines_queried: 1,
      engines_responded: 1,
      today: TODAY,
    });
    expect(r.total_signals).toBe(0);
    expect(r.overall_status).toBe("stable");
  });

  it("diverts insufficient_data engines to recording_gaps, not the active feed", () => {
    const r = computeManagerPriorityBriefing({
      signals: [
        sig({ engine_key: "act", label: "Activity Enrichment", domain: "experiences", rating: "insufficient_data", headline: "No activities recorded in 30 days", insights: [{ text: "No activities recorded", severity: "critical" }] }),
        sig({ engine_key: "hm", label: "Health Monitoring", domain: "experiences", rating: "inadequate", headline: "Health monitoring inadequate" }),
      ],
      engines_queried: 2,
      engines_responded: 2,
      today: TODAY,
    });
    // the insufficient_data engine becomes a recording gap, NOT a critical signal
    expect(r.total_recording_gaps).toBe(1);
    expect(r.recording_gaps[0]).toMatchObject({ label: "Activity Enrichment", domain: "experiences", message: "No activities recorded in 30 days" });
    // only the inadequate engine is an active critical in the feed
    expect(r.total_critical).toBe(1);
    expect(r.priority_signals).toHaveLength(1);
    expect(r.priority_signals[0].source_engine).toBe("Health Monitoring");
    expect(r.overall_status).toBe("critical");
  });

  it("recording gaps alone keep overall_status stable but are surfaced + noted in headline", () => {
    const r = computeManagerPriorityBriefing({
      signals: [
        sig({ engine_key: "a", rating: "insufficient_data", headline: "No data" }),
        sig({ engine_key: "b", rating: "insufficient_data", headline: "No data either" }),
      ],
      engines_queried: 2,
      engines_responded: 2,
      today: TODAY,
    });
    expect(r.overall_status).toBe("stable");
    expect(r.total_signals).toBe(0);
    expect(r.total_recording_gaps).toBe(2);
    expect(r.headline).toMatch(/2 engines have no data/i);
  });
});
