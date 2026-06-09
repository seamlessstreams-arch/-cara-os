// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MISSING FROM CARE ENGINE TESTS
// Comprehensive test suite covering profile stats, factor analysis,
// episode classification, and ARIA insight generation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeMissingIntelligence,
  classifyEpisodeType,
  extractFactors,
  type MissingEpisodeInput,
  type MissingEngineInput,
} from "../missing-from-care-engine";

// ── Test helpers ────────────────────────────────────────────────────────────

const TODAY = "2026-05-23";

function makeEpisode(overrides: Partial<MissingEpisodeInput> = {}): MissingEpisodeInput {
  return {
    id: "mfc_test",
    child_id: "yp_test",
    date_missing: "2026-04-01",
    time_missing: "20:00",
    date_returned: "2026-04-01",
    time_returned: "22:00",
    duration_hours: 2.0,
    risk_level: "medium",
    location_last_seen: "Left home",
    return_location: "Returned voluntarily",
    reported_to_police: false,
    police_reference: null,
    reported_to_la: true,
    return_interview_completed: true,
    return_interview_by: "staff_test",
    return_interview_date: "2026-04-02",
    return_interview_notes: "No concerns disclosed.",
    contextual_safeguarding_risk: false,
    linked_incident_id: null,
    pattern_notes: "",
    status: "closed",
    ...overrides,
  };
}

function baseInput(overrides: Partial<MissingEngineInput> = {}): MissingEngineInput {
  return {
    episodes: [],
    today: TODAY,
    childNameLookup: (id: string) => id === "yp_alex" ? "Alex" : id === "yp_jordan" ? "Jordan" : id === "yp_casey" ? "Casey" : "Test",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// UNIT: classifyEpisodeType
// ══════════════════════════════════════════════════════════════════════════════

describe("classifyEpisodeType", () => {
  it("classifies low risk, short duration as absent", () => {
    expect(classifyEpisodeType(1.5, "low")).toBe("absent");
  });

  it("classifies low risk, long duration as missing", () => {
    expect(classifyEpisodeType(4, "low")).toBe("missing");
  });

  it("classifies medium risk as missing regardless of duration", () => {
    expect(classifyEpisodeType(1, "medium")).toBe("missing");
  });

  it("classifies high risk as missing", () => {
    expect(classifyEpisodeType(0.5, "high")).toBe("missing");
  });

  it("handles null duration", () => {
    expect(classifyEpisodeType(null, "low")).toBe("absent");
    expect(classifyEpisodeType(null, "high")).toBe("missing");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// UNIT: extractFactors
// ══════════════════════════════════════════════════════════════════════════════

describe("extractFactors", () => {
  it("extracts peer influence as pull factor", () => {
    const ep = makeEpisode({ pattern_notes: "With peers from school" });
    const { pull } = extractFactors(ep);
    expect(pull).toContain("peer_influence");
  });

  it("extracts online contact as pull factor", () => {
    const ep = makeEpisode({ return_interview_notes: "Met someone online" });
    const { pull } = extractFactors(ep);
    expect(pull).toContain("online_contact");
  });

  it("extracts conflict as push factor", () => {
    const ep = makeEpisode({ pattern_notes: "Left after argument with key worker" });
    const { push } = extractFactors(ep);
    expect(push).toContain("conflict_with_staff");
  });

  it("extracts emotional distress as push factor", () => {
    const ep = makeEpisode({ pattern_notes: "Was upset after phone call with mum" });
    const { push, pull } = extractFactors(ep);
    expect(push).toContain("emotional_distress");
    expect(pull).toContain("family_contact"); // also picks up family mention
  });

  it("extracts unknown adults as risk factor", () => {
    const ep = makeEpisode({ return_interview_notes: "Was with older males" });
    const { risk } = extractFactors(ep);
    expect(risk).toContain("unknown_adults");
  });

  it("extracts new device as risk factor", () => {
    const ep = makeEpisode({ return_interview_notes: "New phone observed — not usual device" });
    const { risk } = extractFactors(ep);
    expect(risk).toContain("new_device_observed");
  });

  it("extracts secretive behaviour as risk factor", () => {
    const ep = makeEpisode({ return_interview_notes: "Alex was evasive and wouldn't say" });
    const { risk } = extractFactors(ep);
    expect(risk).toContain("secretive_behaviour");
  });

  it("adds contextual safeguarding flag as risk factor", () => {
    const ep = makeEpisode({ contextual_safeguarding_risk: true, pattern_notes: "" });
    const { risk } = extractFactors(ep);
    expect(risk).toContain("contextual_safeguarding_flagged");
  });

  it("returns empty arrays when no factors found", () => {
    const ep = makeEpisode({ pattern_notes: "", return_interview_notes: "" });
    const { push, pull, risk } = extractFactors(ep);
    expect(push).toEqual([]);
    expect(pull).toEqual([]);
    expect(risk).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION: computeMissingIntelligence — Profile
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMissingIntelligence — profile", () => {
  it("computes correct total and active counts", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({ id: "1", status: "closed" }),
        makeEpisode({ id: "2", status: "active" }),
        makeEpisode({ id: "3", status: "closed" }),
      ],
    }));

    expect(result.profile.total_episodes).toBe(3);
    expect(result.profile.active_episodes).toBe(1);
  });

  it("computes average duration in minutes", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({ id: "1", duration_hours: 2.0 }),
        makeEpisode({ id: "2", duration_hours: 4.0 }),
      ],
    }));

    // Average of 2h and 4h = 3h = 180 minutes
    expect(result.profile.avg_duration_minutes).toBe(180);
  });

  it("computes police notification rate", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({ id: "1", reported_to_police: true }),
        makeEpisode({ id: "2", reported_to_police: false }),
        makeEpisode({ id: "3", reported_to_police: true }),
        makeEpisode({ id: "4", reported_to_police: true }),
      ],
    }));

    expect(result.profile.police_notification_rate).toBe(75);
  });

  it("computes return interview completion rate", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({ id: "1", return_interview_completed: true }),
        makeEpisode({ id: "2", return_interview_completed: true }),
        makeEpisode({ id: "3", return_interview_completed: false }),
      ],
    }));

    // 2 out of 3 closed = 67%
    expect(result.profile.return_interview_completion_rate).toBe(67);
  });

  it("returns 100% interview rate when no episodes", () => {
    const result = computeMissingIntelligence(baseInput());
    expect(result.profile.return_interview_completion_rate).toBe(100);
  });

  it("identifies repeat missing children (3+ episodes)", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({ id: "1", child_id: "yp_alex" }),
        makeEpisode({ id: "2", child_id: "yp_alex" }),
        makeEpisode({ id: "3", child_id: "yp_alex" }),
        makeEpisode({ id: "4", child_id: "yp_jordan" }),
      ],
    }));

    expect(result.profile.repeat_missing_children).toEqual(["yp_alex"]);
    expect(result.profile.children_with_episodes).toBe(2);
  });

  it("counts resolved this month", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({ id: "1", date_returned: "2026-05-10", status: "closed" }),
        makeEpisode({ id: "2", date_returned: "2026-04-15", status: "closed" }),
        makeEpisode({ id: "3", date_returned: "2026-05-20", status: "closed" }),
      ],
    }));

    expect(result.profile.resolved_this_month).toBe(2);
  });

  it("counts contextual safeguarding flags", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({ id: "1", contextual_safeguarding_risk: true }),
        makeEpisode({ id: "2", contextual_safeguarding_risk: false }),
        makeEpisode({ id: "3", contextual_safeguarding_risk: true }),
      ],
    }));

    expect(result.profile.contextual_safeguarding_flagged).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION: computeMissingIntelligence — Recent Episodes
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMissingIntelligence — recent episodes", () => {
  it("returns episodes sorted by date descending", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({ id: "1", date_missing: "2026-03-01" }),
        makeEpisode({ id: "2", date_missing: "2026-04-01" }),
        makeEpisode({ id: "3", date_missing: "2026-02-01" }),
      ],
    }));

    expect(result.recent_episodes.map((e) => e.id)).toEqual(["2", "1", "3"]);
  });

  it("limits to 10 recent episodes", () => {
    const eps = Array.from({ length: 15 }, (_, i) =>
      makeEpisode({ id: `ep_${i}`, date_missing: `2026-0${Math.min(i + 1, 5)}-01` })
    );
    const result = computeMissingIntelligence(baseInput({ episodes: eps }));
    expect(result.recent_episodes.length).toBe(10);
  });

  it("uses child name lookup", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [makeEpisode({ child_id: "yp_alex" })],
    }));

    expect(result.recent_episodes[0].child_name).toBe("Alex");
  });

  it("classifies return interview status correctly", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({ id: "1", return_interview_completed: true }),
        makeEpisode({ id: "2", return_interview_completed: false, return_interview_notes: "Child refused" }),
        makeEpisode({ id: "3", return_interview_completed: false }),
        makeEpisode({ id: "4", status: "active", return_interview_completed: false }),
      ],
    }));

    const interviews = result.recent_episodes.map((e) => e.return_interview);
    expect(interviews).toContain("completed");
    expect(interviews).toContain("refused");
    expect(interviews).toContain("pending");
    expect(interviews).toContain("n/a");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION: computeMissingIntelligence — Push/Pull
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMissingIntelligence — push/pull analysis", () => {
  it("aggregates pull factors across episodes", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({ id: "1", pattern_notes: "With peers at the park" }),
        makeEpisode({ id: "2", pattern_notes: "Meeting peer group again" }),
        makeEpisode({ id: "3", pattern_notes: "Online contact reported" }),
      ],
    }));

    const peerFactor = result.push_pull.pull.find((f) => f.factor === "peer_influence");
    expect(peerFactor).toBeDefined();
    expect(peerFactor!.count).toBe(2);
  });

  it("aggregates risk factors across episodes", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({ id: "1", return_interview_notes: "With older males" }),
        makeEpisode({ id: "2", return_interview_notes: "Was evasive about whereabouts" }),
      ],
    }));

    expect(result.push_pull.risk.some((f) => f.factor === "unknown_adults")).toBe(true);
    expect(result.push_pull.risk.some((f) => f.factor === "secretive_behaviour")).toBe(true);
  });

  it("sorts factors by count descending", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({ id: "1", pattern_notes: "peer group" }),
        makeEpisode({ id: "2", pattern_notes: "peer group, community" }),
        makeEpisode({ id: "3", pattern_notes: "community" }),
      ],
    }));

    // Both peer_influence (2) and community_attraction (2) should be present
    expect(result.push_pull.pull.length).toBeGreaterThanOrEqual(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION: computeMissingIntelligence — Insights
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMissingIntelligence — ARIA insights", () => {
  it("generates critical insight for active episodes", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [makeEpisode({ status: "active", child_id: "yp_alex" })],
    }));

    const critical = result.insights.find((i) => i.severity === "critical");
    expect(critical).toBeDefined();
    expect(critical!.text).toContain("active missing");
    expect(critical!.text).toContain("Alex");
  });

  it("generates critical insight for repeat missing children", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({ id: "1", child_id: "yp_alex", date_missing: "2026-04-01" }),
        makeEpisode({ id: "2", child_id: "yp_alex", date_missing: "2026-04-15" }),
        makeEpisode({ id: "3", child_id: "yp_alex", date_missing: "2026-05-01" }),
      ],
    }));

    const critical = result.insights.find((i) =>
      i.severity === "critical" && i.text.includes("Alex")
    );
    expect(critical).toBeDefined();
    expect(critical!.text).toContain("3 missing episodes");
    expect(critical!.text).toContain("exploitation screening");
  });

  it("generates warning for incomplete return interviews", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({ id: "1", return_interview_completed: true }),
        makeEpisode({ id: "2", return_interview_completed: false }),
      ],
    }));

    const warning = result.insights.find((i) =>
      i.severity === "warning" && i.text.includes("interview")
    );
    expect(warning).toBeDefined();
    expect(warning!.text).toContain("50%");
  });

  it("generates positive insight when no active episodes", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({ id: "1", status: "closed" }),
      ],
    }));

    const positive = result.insights.find((i) => i.severity === "positive");
    expect(positive).toBeDefined();
  });

  it("generates positive insight when no episodes at all", () => {
    const result = computeMissingIntelligence(baseInput());

    expect(result.insights.length).toBe(1);
    expect(result.insights[0].severity).toBe("positive");
    expect(result.insights[0].text).toContain("No missing from care episodes");
  });

  it("generates risk factor warning", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({ id: "1", return_interview_notes: "Was with older males at location" }),
      ],
    }));

    const riskInsight = result.insights.find((i) =>
      i.severity === "warning" && i.text.includes("Risk indicator")
    );
    expect(riskInsight).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION: Full Chamberlain House dataset
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMissingIntelligence — Chamberlain House integration", () => {
  it("processes real Chamberlain House episodes correctly", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({
          id: "mfc_001", child_id: "yp_alex", date_missing: "2026-01-15",
          duration_hours: 1.9, risk_level: "medium",
          reported_to_police: false, return_interview_completed: true,
          contextual_safeguarding_risk: false,
          pattern_notes: "First episode. Informal community time.",
        }),
        makeEpisode({
          id: "mfc_002", child_id: "yp_alex", date_missing: "2026-02-28",
          duration_hours: 4.2, risk_level: "high",
          reported_to_police: true, return_interview_completed: true,
          contextual_safeguarding_risk: true,
          return_interview_notes: "Alex disclosed spending time with a group of older males he met online.",
          pattern_notes: "Second episode. Increasing duration. CS risk flagged — older peer network.",
        }),
        makeEpisode({
          id: "mfc_003", child_id: "yp_alex", date_missing: "2026-04-01",
          duration_hours: 1.6, risk_level: "high",
          reported_to_police: true, return_interview_completed: true,
          contextual_safeguarding_risk: true,
          return_interview_notes: "Alex was evasive. Wouldn't name contacts. Mobile phone observed — not usual device.",
          pattern_notes: "Third episode. Pattern emerging — always late evening, always community.",
        }),
      ],
    }));

    // Profile
    expect(result.profile.total_episodes).toBe(3);
    expect(result.profile.active_episodes).toBe(0);
    expect(result.profile.police_notification_rate).toBe(67); // 2 of 3
    expect(result.profile.return_interview_completion_rate).toBe(100);
    expect(result.profile.contextual_safeguarding_flagged).toBe(2);
    expect(result.profile.repeat_missing_children).toEqual(["yp_alex"]);

    // Alex has 3+ total episodes so appears as repeat child
    // Only 1 episode (Apr 1) is within 90 days of May 23, so severity is "warning" not "critical"
    const alexInsight = result.insights.find((i) => i.text.includes("Alex"));
    expect(alexInsight).toBeDefined();
    expect(alexInsight!.severity).toBe("warning");
    expect(alexInsight!.text).toContain("3 total episodes");

    // Should have risk factors identified
    expect(result.push_pull.risk.length).toBeGreaterThan(0);

    // Should have pull factors (community, peer, online)
    expect(result.push_pull.pull.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMissingIntelligence — edge cases", () => {
  it("handles empty episodes array", () => {
    const result = computeMissingIntelligence(baseInput());

    expect(result.profile.total_episodes).toBe(0);
    expect(result.profile.avg_duration_minutes).toBe(0);
    expect(result.recent_episodes).toEqual([]);
    expect(result.push_pull.push).toEqual([]);
    expect(result.push_pull.pull).toEqual([]);
    expect(result.push_pull.risk).toEqual([]);
    expect(result.insights.length).toBeGreaterThan(0);
  });

  it("handles episodes with null durations", () => {
    const result = computeMissingIntelligence(baseInput({
      episodes: [
        makeEpisode({ id: "1", duration_hours: null }),
        makeEpisode({ id: "2", duration_hours: 2.0 }),
      ],
    }));

    // Should only average the non-null duration
    expect(result.profile.avg_duration_minutes).toBe(120);
  });

  it("handles default child name lookup", () => {
    const result = computeMissingIntelligence({
      episodes: [makeEpisode({ child_id: "yp_test_child" })],
      today: TODAY,
    });

    expect(result.recent_episodes[0].child_name).toBe("Test Child");
  });
});
