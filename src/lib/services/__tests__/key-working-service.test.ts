// ══════════════════════════════════════════════════════════════════════════════
// CARA — KEY WORKING SERVICE TESTS
// Pure-function tests for session compliance, quality scoring, child progress
// tracking, topic suggestions, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../key-working-service";

const {
  computeKeyWorkCompliance,
  computeSessionQuality,
  computeChildProgress,
  suggestSessionTopics,
  SESSION_FREQUENCY,
  THERAPEUTIC_FRAMEWORKS,
  KEY_WORK_TOPICS,
} = _testing;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Fixed "now" for deterministic date tests. */
const NOW = new Date("2026-06-01T00:00:00Z");

/** Build a minimal session record for compliance tests. */
function complianceSession(
  child_id: string,
  status: string,
  completed_date: string | null,
) {
  return { child_id, status, completed_date };
}

/** Build a minimal child placement entry. */
function placement(child_id: string, placement_type: string) {
  return { child_id, placement_type, start_date: "2026-01-01" };
}

/** Build a minimal quality session record. */
function qualitySession(
  child_mood: number,
  child_engagement: number,
  topics_covered: string[],
  positive_observations: string[],
  child_voice: string,
) {
  return {
    child_mood,
    child_engagement,
    topics_covered,
    positive_observations,
    child_voice,
  };
}

/** Build a minimal progress session record. */
function progressSession(
  status: string,
  child_mood: number,
  child_engagement: number,
  topics_covered: string[],
  therapeutic_framework: string,
  completed_date: string | null,
) {
  return {
    status,
    child_mood,
    child_engagement,
    topics_covered,
    therapeutic_framework,
    completed_date,
  };
}

// ── computeKeyWorkCompliance ────────────────────────────────────────────────

describe("computeKeyWorkCompliance", () => {
  it("returns zero stats for empty inputs", () => {
    const result = computeKeyWorkCompliance([], [], NOW);
    expect(result.total_children).toBe(0);
    expect(result.children_on_track).toBe(0);
    expect(result.children_behind).toBe(0);
    expect(result.compliance_percentage).toBeNull();;
    expect(result.by_child).toHaveLength(0);
  });

  it("marks child as behind when no sessions exist", () => {
    const placements = [placement("c1", "standard")];
    const result = computeKeyWorkCompliance([], placements, NOW);
    expect(result.total_children).toBe(1);
    expect(result.children_behind).toBe(1);
    expect(result.children_on_track).toBe(0);
    expect(result.by_child[0].on_track).toBe(false);
    expect(result.by_child[0].actual_this_week).toBe(0);
  });

  it("marks child as on_track when completed sessions meet requirement", () => {
    // 2026-06-01 is a Monday — a session completed today is in the current week
    const sessions = [complianceSession("c1", "completed", "2026-06-01")];
    const placements = [placement("c1", "standard")]; // standard = 1/week
    const result = computeKeyWorkCompliance(sessions, placements, NOW);
    expect(result.children_on_track).toBe(1);
    expect(result.children_behind).toBe(0);
    expect(result.compliance_percentage).toBe(100);
    expect(result.by_child[0].on_track).toBe(true);
    expect(result.by_child[0].required_per_week).toBe(1);
    expect(result.by_child[0].actual_this_week).toBe(1);
  });

  it("marks child as behind when sessions are below requirement", () => {
    // high_needs requires 2/week, only 1 completed
    const sessions = [complianceSession("c1", "completed", "2026-06-01")];
    const placements = [placement("c1", "high_needs")];
    const result = computeKeyWorkCompliance(sessions, placements, NOW);
    expect(result.children_behind).toBe(1);
    expect(result.by_child[0].on_track).toBe(false);
    expect(result.by_child[0].required_per_week).toBe(2);
    expect(result.by_child[0].actual_this_week).toBe(1);
  });

  it("uses placement-type-specific frequency", () => {
    // crisis = 3/week — 3 completed sessions should satisfy
    const sessions = [
      complianceSession("c1", "completed", "2026-06-01"),
      complianceSession("c1", "completed", "2026-06-01"),
      complianceSession("c1", "completed", "2026-06-01"),
    ];
    const placements = [placement("c1", "crisis")];
    const result = computeKeyWorkCompliance(sessions, placements, NOW);
    expect(result.children_on_track).toBe(1);
    expect(result.by_child[0].required_per_week).toBe(3);
    expect(result.by_child[0].actual_this_week).toBe(3);
  });

  it("defaults to 1/week for unknown placement types", () => {
    const sessions = [complianceSession("c1", "completed", "2026-06-01")];
    const placements = [placement("c1", "unknown_type")];
    const result = computeKeyWorkCompliance(sessions, placements, NOW);
    expect(result.children_on_track).toBe(1);
    expect(result.by_child[0].required_per_week).toBe(1);
  });

  it("ignores non-completed sessions", () => {
    const sessions = [
      complianceSession("c1", "planned", "2026-06-01"),
      complianceSession("c1", "cancelled", "2026-06-01"),
      complianceSession("c1", "child_declined", "2026-06-01"),
    ];
    const placements = [placement("c1", "standard")];
    const result = computeKeyWorkCompliance(sessions, placements, NOW);
    expect(result.children_behind).toBe(1);
    expect(result.by_child[0].actual_this_week).toBe(0);
  });

  it("ignores sessions from previous weeks", () => {
    // 2026-05-25 is before the current week (Mon 2026-06-01)
    const sessions = [complianceSession("c1", "completed", "2026-05-25")];
    const placements = [placement("c1", "standard")];
    const result = computeKeyWorkCompliance(sessions, placements, NOW);
    expect(result.children_behind).toBe(1);
    expect(result.by_child[0].actual_this_week).toBe(0);
  });

  it("calculates compliance_percentage across mixed children", () => {
    const sessions = [
      complianceSession("c1", "completed", "2026-06-01"), // on track
      // c2 has no sessions — behind
    ];
    const placements = [
      placement("c1", "standard"),
      placement("c2", "standard"),
    ];
    const result = computeKeyWorkCompliance(sessions, placements, NOW);
    expect(result.total_children).toBe(2);
    expect(result.children_on_track).toBe(1);
    expect(result.children_behind).toBe(1);
    expect(result.compliance_percentage).toBe(50);
  });

  it("counts multiple completed sessions for the same child", () => {
    // solo = 2/week — 2 sessions completed
    const sessions = [
      complianceSession("c1", "completed", "2026-06-01"),
      complianceSession("c1", "completed", "2026-06-01"),
    ];
    const placements = [placement("c1", "solo")];
    const result = computeKeyWorkCompliance(sessions, placements, NOW);
    expect(result.children_on_track).toBe(1);
    expect(result.by_child[0].required_per_week).toBe(2);
    expect(result.by_child[0].actual_this_week).toBe(2);
  });
});

// ── computeSessionQuality ───────────────────────────────────────────────────

describe("computeSessionQuality", () => {
  it("returns poor with zeros for empty sessions", () => {
    const result = computeSessionQuality([]);
    expect(result.total_sessions).toBe(0);
    expect(result.avg_mood).toBe(0);
    expect(result.avg_engagement).toBe(0);
    expect(result.avg_topics_per_session).toBe(0);
    expect(result.voice_capture_rate).toBe(0);
    expect(result.positive_observation_rate).toBe(0);
    expect(result.quality_rating).toBe("poor");
  });

  it("returns excellent when combined average >= 4", () => {
    const sessions = [
      qualitySession(5, 4, ["Topic A"], ["Great progress"], "I felt happy"),
      qualitySession(4, 5, ["Topic B", "Topic C"], ["Well done"], "Good session"),
    ];
    const result = computeSessionQuality(sessions);
    expect(result.quality_rating).toBe("excellent");
    expect(result.avg_mood).toBeGreaterThanOrEqual(4);
    expect(result.avg_engagement).toBeGreaterThanOrEqual(4);
  });

  it("returns good when combined average >= 3 but < 4", () => {
    const sessions = [
      qualitySession(3, 4, ["Topic A"], ["OK"], "Fine"),
      qualitySession(3, 3, ["Topic B"], [], "OK"),
    ];
    const result = computeSessionQuality(sessions);
    expect(result.quality_rating).toBe("good");
  });

  it("returns adequate when combined average >= 2 but < 3", () => {
    const sessions = [
      qualitySession(2, 3, ["Topic A"], [], ""),
      qualitySession(2, 2, ["Topic B"], [], ""),
    ];
    const result = computeSessionQuality(sessions);
    expect(result.quality_rating).toBe("adequate");
  });

  it("returns poor when combined average < 2", () => {
    const sessions = [
      qualitySession(1, 1, [], [], ""),
      qualitySession(1, 2, [], [], ""),
    ];
    const result = computeSessionQuality(sessions);
    expect(result.quality_rating).toBe("poor");
  });

  it("calculates voice_capture_rate correctly", () => {
    const sessions = [
      qualitySession(3, 3, [], [], "I spoke up"),
      qualitySession(3, 3, [], [], ""),
      qualitySession(3, 3, [], [], "   "),    // whitespace only = not captured
      qualitySession(3, 3, [], [], "My thoughts"),
    ];
    const result = computeSessionQuality(sessions);
    expect(result.voice_capture_rate).toBe(50); // 2 out of 4
  });

  it("calculates positive_observation_rate correctly", () => {
    const sessions = [
      qualitySession(3, 3, [], ["Good work"], ""),
      qualitySession(3, 3, [], [], ""),
      qualitySession(3, 3, [], ["Progress", "Kind to others"], ""),
    ];
    const result = computeSessionQuality(sessions);
    expect(result.positive_observation_rate).toBe(67); // 2 out of 3
  });

  it("calculates avg_topics_per_session", () => {
    const sessions = [
      qualitySession(3, 3, ["A", "B", "C"], [], ""),
      qualitySession(3, 3, ["D"], [], ""),
      qualitySession(3, 3, ["E", "F"], [], ""),
    ];
    const result = computeSessionQuality(sessions);
    expect(result.avg_topics_per_session).toBe(2); // 6/3 = 2.0
    expect(result.total_sessions).toBe(3);
  });

  it("rounds averages to 1 decimal place", () => {
    const sessions = [
      qualitySession(4, 3, ["A", "B"], [], ""),
      qualitySession(3, 4, ["C"], [], ""),
      qualitySession(5, 5, ["D", "E", "F"], [], ""),
    ];
    const result = computeSessionQuality(sessions);
    expect(result.avg_mood).toBe(4);          // 12/3 = 4.0
    expect(result.avg_engagement).toBe(4);    // 12/3 = 4.0
    expect(result.avg_topics_per_session).toBe(2); // 6/3 = 2.0
  });
});

// ── computeChildProgress ────────────────────────────────────────────────────

describe("computeChildProgress", () => {
  it("returns stable defaults for empty sessions", () => {
    const result = computeChildProgress([]);
    expect(result.total_sessions).toBe(0);
    expect(result.mood_trend).toBe("stable");
    expect(result.engagement_trend).toBe("stable");
    expect(result.favourite_topics).toEqual([]);
    expect(result.therapeutic_frameworks_used).toEqual([]);
    expect(result.cancellation_rate).toBe(0);
  });

  it("calculates cancellation_rate including child_declined", () => {
    const sessions = [
      progressSession("completed", 3, 3, [], "none", "2026-05-01"),
      progressSession("cancelled", 3, 3, [], "none", null),
      progressSession("child_declined", 3, 3, [], "none", null),
      progressSession("completed", 3, 3, [], "none", "2026-05-15"),
    ];
    const result = computeChildProgress(sessions);
    expect(result.cancellation_rate).toBe(50); // 2/4
    expect(result.total_sessions).toBe(4);
  });

  it("identifies favourite topics by frequency", () => {
    const sessions = [
      progressSession("completed", 3, 3, ["Health", "Education progress"], "none", "2026-05-01"),
      progressSession("completed", 3, 3, ["Health", "Family contact"], "none", "2026-05-08"),
      progressSession("completed", 3, 3, ["Health", "Education progress", "Safety planning"], "none", "2026-05-15"),
    ];
    const result = computeChildProgress(sessions);
    // Health = 3, Education progress = 2, Family contact = 1, Safety planning = 1
    expect(result.favourite_topics[0]).toBe("Health");
    expect(result.favourite_topics[1]).toBe("Education progress");
    expect(result.favourite_topics).toHaveLength(4);
  });

  it("limits favourite topics to top 5", () => {
    const topics = ["A", "B", "C", "D", "E", "F", "G"];
    const sessions = topics.map((t, i) =>
      progressSession("completed", 3, 3, [t], "none", `2026-05-${String(i + 1).padStart(2, "0")}`),
    );
    // Add extras to make first 5 topics appear more frequently
    for (let i = 0; i < 5; i++) {
      sessions.push(
        progressSession("completed", 3, 3, [topics[i]], "none", `2026-05-${String(i + 10).padStart(2, "0")}`),
      );
    }
    const result = computeChildProgress(sessions);
    expect(result.favourite_topics).toHaveLength(5);
  });

  it("collects unique therapeutic frameworks, excluding 'none'", () => {
    const sessions = [
      progressSession("completed", 3, 3, [], "pace", "2026-05-01"),
      progressSession("completed", 3, 3, [], "arc", "2026-05-08"),
      progressSession("completed", 3, 3, [], "pace", "2026-05-15"),
      progressSession("completed", 3, 3, [], "none", "2026-05-22"),
    ];
    const result = computeChildProgress(sessions);
    expect(result.therapeutic_frameworks_used).toContain("pace");
    expect(result.therapeutic_frameworks_used).toContain("arc");
    expect(result.therapeutic_frameworks_used).not.toContain("none");
    expect(result.therapeutic_frameworks_used).toHaveLength(2);
  });

  it("detects improving mood trend when recent sessions are higher", () => {
    // 10 sessions: first 5 low mood, last 5 high mood
    const sessions: ReturnType<typeof progressSession>[] = [];
    for (let i = 0; i < 5; i++) {
      sessions.push(
        progressSession("completed", 2, 3, [], "none", `2026-04-${String(i + 1).padStart(2, "0")}`),
      );
    }
    for (let i = 0; i < 5; i++) {
      sessions.push(
        progressSession("completed", 4, 3, [], "none", `2026-05-${String(i + 1).padStart(2, "0")}`),
      );
    }
    const result = computeChildProgress(sessions);
    expect(result.mood_trend).toBe("improving");
  });

  it("detects declining engagement trend when recent sessions are lower", () => {
    // 10 sessions: first 5 high engagement, last 5 low engagement
    const sessions: ReturnType<typeof progressSession>[] = [];
    for (let i = 0; i < 5; i++) {
      sessions.push(
        progressSession("completed", 3, 5, [], "none", `2026-04-${String(i + 1).padStart(2, "0")}`),
      );
    }
    for (let i = 0; i < 5; i++) {
      sessions.push(
        progressSession("completed", 3, 2, [], "none", `2026-05-${String(i + 1).padStart(2, "0")}`),
      );
    }
    const result = computeChildProgress(sessions);
    expect(result.engagement_trend).toBe("declining");
  });

  it("detects stable trend when values are consistent", () => {
    const sessions: ReturnType<typeof progressSession>[] = [];
    for (let i = 0; i < 10; i++) {
      sessions.push(
        progressSession("completed", 3, 3, [], "none", `2026-05-${String(i + 1).padStart(2, "0")}`),
      );
    }
    const result = computeChildProgress(sessions);
    expect(result.mood_trend).toBe("stable");
    expect(result.engagement_trend).toBe("stable");
  });

  it("returns stable trend for a single completed session", () => {
    const sessions = [
      progressSession("completed", 4, 4, ["Topic A"], "pace", "2026-05-01"),
    ];
    const result = computeChildProgress(sessions);
    expect(result.mood_trend).toBe("stable");
    expect(result.engagement_trend).toBe("stable");
  });

  it("only uses completed sessions for trend calculation", () => {
    const sessions = [
      progressSession("cancelled", 1, 1, [], "none", null),
      progressSession("completed", 4, 4, [], "none", "2026-05-01"),
    ];
    const result = computeChildProgress(sessions);
    expect(result.mood_trend).toBe("stable");
    expect(result.total_sessions).toBe(2); // total includes all
  });

  it("sorts completed sessions by completed_date for trend calculation", () => {
    // Add in reverse order — function should sort by date
    const sessions = [
      progressSession("completed", 5, 5, [], "none", "2026-05-10"),
      progressSession("completed", 5, 5, [], "none", "2026-05-09"),
      progressSession("completed", 5, 5, [], "none", "2026-05-08"),
      progressSession("completed", 5, 5, [], "none", "2026-05-07"),
      progressSession("completed", 5, 5, [], "none", "2026-05-06"),
      progressSession("completed", 1, 1, [], "none", "2026-04-05"),
      progressSession("completed", 1, 1, [], "none", "2026-04-04"),
      progressSession("completed", 1, 1, [], "none", "2026-04-03"),
      progressSession("completed", 1, 1, [], "none", "2026-04-02"),
      progressSession("completed", 1, 1, [], "none", "2026-04-01"),
    ];
    const result = computeChildProgress(sessions);
    // Recent 5 avg = 5, Previous 5 avg = 1 → improving
    expect(result.mood_trend).toBe("improving");
    expect(result.engagement_trend).toBe("improving");
  });
});

// ── suggestSessionTopics ────────────────────────────────────────────────────

describe("suggestSessionTopics", () => {
  it("returns all standard topics when no recent sessions", () => {
    const result = suggestSessionTopics([], []);
    expect(result).toEqual(KEY_WORK_TOPICS);
  });

  it("excludes topics already covered in the last 5 sessions", () => {
    const recentSessions = [
      { topics_covered: ["Education progress", "Family contact"] },
      { topics_covered: ["Health and wellbeing"] },
    ];
    const result = suggestSessionTopics(recentSessions, []);
    expect(result).not.toContain("Education progress");
    expect(result).not.toContain("Family contact");
    expect(result).not.toContain("Health and wellbeing");
    expect(result).toContain("Friendships and relationships");
    expect(result).toContain("Emotional regulation");
  });

  it("includes unaddressed child needs", () => {
    const recentSessions = [
      { topics_covered: ["Education progress"] },
    ];
    const childNeeds = ["Anger management", "Sleep issues"];
    const result = suggestSessionTopics(recentSessions, childNeeds);
    expect(result).toContain("Anger management");
    expect(result).toContain("Sleep issues");
    // Standard topics still present (minus covered ones)
    expect(result).not.toContain("Education progress");
  });

  it("does not duplicate needs that match standard topics", () => {
    const recentSessions: { topics_covered: string[] }[] = [];
    const childNeeds = ["Health and wellbeing"]; // already in KEY_WORK_TOPICS
    const result = suggestSessionTopics(recentSessions, childNeeds);
    const count = result.filter((t) => t === "Health and wellbeing").length;
    expect(count).toBe(1);
  });

  it("excludes child needs that were recently covered", () => {
    const recentSessions = [
      { topics_covered: ["Anger management"] },
    ];
    const childNeeds = ["Anger management", "Sleep issues"];
    const result = suggestSessionTopics(recentSessions, childNeeds);
    expect(result).not.toContain("Anger management");
    expect(result).toContain("Sleep issues");
  });

  it("only considers the last 5 sessions", () => {
    // Provide 6 sessions; the first one's topics should not be excluded
    const recentSessions = [
      { topics_covered: ["Cultural identity"] }, // session 1 (oldest, outside last 5)
      { topics_covered: ["Education progress"] },
      { topics_covered: ["Friendships and relationships"] },
      { topics_covered: ["Family contact"] },
      { topics_covered: ["Health and wellbeing"] },
      { topics_covered: ["Emotional regulation"] },
    ];
    const result = suggestSessionTopics(recentSessions, []);
    // Cultural identity was in session 1, which is outside the last 5
    expect(result).toContain("Cultural identity");
    // These were in the last 5, so they should be excluded
    expect(result).not.toContain("Education progress");
    expect(result).not.toContain("Emotional regulation");
  });
});

// ── Constants ───────────────────────────────────────────────────────────────

describe("SESSION_FREQUENCY", () => {
  it("has 4 placement type entries", () => {
    expect(Object.keys(SESSION_FREQUENCY)).toHaveLength(4);
  });

  it("all values are positive integers", () => {
    for (const freq of Object.values(SESSION_FREQUENCY)) {
      expect(typeof freq).toBe("number");
      expect(freq).toBeGreaterThan(0);
      expect(Number.isInteger(freq)).toBe(true);
    }
  });

  it("standard placement requires 1 session per week", () => {
    expect(SESSION_FREQUENCY["standard"]).toBe(1);
  });

  it("crisis placement requires 3 sessions per week", () => {
    expect(SESSION_FREQUENCY["crisis"]).toBe(3);
  });

  it("high_needs placement requires 2 sessions per week", () => {
    expect(SESSION_FREQUENCY["high_needs"]).toBe(2);
  });

  it("solo placement requires 2 sessions per week", () => {
    expect(SESSION_FREQUENCY["solo"]).toBe(2);
  });
});

describe("THERAPEUTIC_FRAMEWORKS", () => {
  it("has exactly 9 framework entries", () => {
    expect(THERAPEUTIC_FRAMEWORKS).toHaveLength(9);
  });

  it("each entry has framework, label, description, and suitableFor", () => {
    for (const fw of THERAPEUTIC_FRAMEWORKS) {
      expect(typeof fw.framework).toBe("string");
      expect(fw.framework.length).toBeGreaterThan(0);
      expect(typeof fw.label).toBe("string");
      expect(fw.label.length).toBeGreaterThan(0);
      expect(typeof fw.description).toBe("string");
      expect(fw.description.length).toBeGreaterThan(0);
      expect(Array.isArray(fw.suitableFor)).toBe(true);
      expect(fw.suitableFor.length).toBeGreaterThan(0);
    }
  });

  it("includes PACE as the first framework", () => {
    expect(THERAPEUTIC_FRAMEWORKS[0].framework).toBe("pace");
    expect(THERAPEUTIC_FRAMEWORKS[0].label).toBe("PACE Model");
  });

  it("includes 'none' as the last framework (unstructured)", () => {
    const last = THERAPEUTIC_FRAMEWORKS[THERAPEUTIC_FRAMEWORKS.length - 1];
    expect(last.framework).toBe("none");
    expect(last.label).toBe("Unstructured");
  });

  it("has unique framework identifiers", () => {
    const ids = THERAPEUTIC_FRAMEWORKS.map((fw) => fw.framework);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("KEY_WORK_TOPICS", () => {
  it("has exactly 15 topics", () => {
    expect(KEY_WORK_TOPICS).toHaveLength(15);
  });

  it("all items are non-empty strings", () => {
    for (const topic of KEY_WORK_TOPICS) {
      expect(typeof topic).toBe("string");
      expect(topic.length).toBeGreaterThan(0);
    }
  });

  it("has unique topics with no duplicates", () => {
    expect(new Set(KEY_WORK_TOPICS).size).toBe(KEY_WORK_TOPICS.length);
  });

  it("includes Education progress as first topic", () => {
    expect(KEY_WORK_TOPICS[0]).toBe("Education progress");
  });

  it("includes Worries and concerns as last topic", () => {
    expect(KEY_WORK_TOPICS[KEY_WORK_TOPICS.length - 1]).toBe("Worries and concerns");
  });
});
