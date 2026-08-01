import { describe, it, expect } from "vitest";
import {
  computeMissingProfile,
  computeChildMissingHistory,
  computeMissingAlerts,
  identifyPushPullFactors,
  type MissingEpisode,
} from "./missing-from-care-service";

function makeEpisode(overrides: Partial<MissingEpisode> = {}): MissingEpisode {
  return {
    id: "ep-1",
    home_id: "home-1",
    child_id: "child-1",
    episode_type: "missing",
    reported_missing_at: "2026-05-01T10:00:00Z",
    reported_by: "Staff A",
    police_notified: true,
    police_notified_at: "2026-05-01T10:15:00Z",
    police_reference: "PR-001",
    placing_authority_notified: true,
    placing_authority_notified_at: "2026-05-01T10:30:00Z",
    ofsted_notified: true,
    risk_level: "high",
    trigger_category: "peer_influence",
    trigger_details: "Friend invited them",
    last_known_location: "Town centre",
    found_at: "2026-05-01T14:00:00Z",
    found_location: "Park",
    found_by: "Police",
    duration_minutes: 240,
    return_interview_status: "completed",
    return_interview_date: "2026-05-02",
    return_interview_by: "Social Worker",
    return_interview_notes: "Child discussed triggers",
    debrief_completed: true,
    actions_taken: ["Updated care plan"],
    status: "resolved",
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T15:00:00Z",
    ...overrides,
  };
}

describe("computeMissingProfile", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMissingProfile([]);
    expect(m.total_episodes).toBe(0);
    expect(m.active_episodes).toBe(0);
    expect(m.avg_duration_minutes).toBeNull();; expect(m.police_notification_rate).toBeNull();; expect(m.return_interview_completion_rate).toBeNull();; expect(m.repeat_children).toEqual([]);
  });

  it("computes correct counts for populated data", () => {
    const episodes = [
      makeEpisode({ id: "e1", status: "active", child_id: "c1", duration_minutes: 120, police_notified: true, return_interview_status: "pending" }),
      makeEpisode({ id: "e2", status: "resolved", child_id: "c1", duration_minutes: 180, police_notified: false, return_interview_status: "completed" }),
      makeEpisode({ id: "e3", status: "resolved", child_id: "c2", duration_minutes: null, return_interview_status: "not_required" }),
    ];
    const m = computeMissingProfile(episodes);
    expect(m.total_episodes).toBe(3);
    expect(m.active_episodes).toBe(1);
    expect(m.avg_duration_minutes).toBe(150); // (120+180)/2
    expect(m.police_notification_rate).toBe(67); // 2/3 rounded
    // return_interview: relevant = pending + completed = 2, completed = 1 => 50%
    expect(m.return_interview_completion_rate).toBe(50);
    expect(m.repeat_children).toEqual([{ child_id: "c1", count: 2 }]);
  });
});

describe("computeChildMissingHistory", () => {
  it("returns default values for a child with no episodes", () => {
    const h = computeChildMissingHistory("child-99", []);
    expect(h.total_episodes).toBe(0);
    expect(h.active).toBe(false);
    expect(h.last_episode_date).toBeNull();
    expect(h.avg_duration_minutes).toBeNull();; expect(h.common_triggers).toEqual([]);
    expect(h.risk_trend).toBe("stable");
    expect(h.return_interviews_pending).toBe(0);
  });

  it("computes history for a specific child", () => {
    const episodes = [
      makeEpisode({ id: "e1", child_id: "c1", reported_missing_at: "2026-01-01T10:00:00Z", duration_minutes: 60, trigger_category: "peer_influence", risk_level: "low", return_interview_status: "pending" }),
      makeEpisode({ id: "e2", child_id: "c1", reported_missing_at: "2026-05-01T10:00:00Z", duration_minutes: 120, trigger_category: "peer_influence", risk_level: "high" }),
      makeEpisode({ id: "e3", child_id: "c2", duration_minutes: 300 }), // different child
    ];
    const h = computeChildMissingHistory("c1", episodes);
    expect(h.total_episodes).toBe(2);
    expect(h.last_episode_date).toBe("2026-05-01T10:00:00Z");
    expect(h.avg_duration_minutes).toBe(90);
    expect(h.common_triggers).toEqual(["peer_influence"]);
    expect(h.return_interviews_pending).toBe(1);
  });

  it("detects escalating risk trend", () => {
    const episodes = [
      makeEpisode({ id: "e1", child_id: "c1", reported_missing_at: "2026-01-01T10:00:00Z", risk_level: "low" }),
      makeEpisode({ id: "e2", child_id: "c1", reported_missing_at: "2026-05-01T10:00:00Z", risk_level: "very_high" }),
    ];
    const h = computeChildMissingHistory("c1", episodes);
    expect(h.risk_trend).toBe("escalating");
  });
});

describe("computeMissingAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(computeMissingAlerts([])).toEqual([]);
  });

  it("fires critical alert for active_missing", () => {
    const episodes = [makeEpisode({ status: "active" })];
    const alerts = computeMissingAlerts(episodes);
    const match = alerts.find((a) => a.type === "active_missing");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires critical alert for police_not_notified on missing/awol episodes", () => {
    const episodes = [makeEpisode({ episode_type: "missing", police_notified: false })];
    const alerts = computeMissingAlerts(episodes);
    const match = alerts.find((a) => a.type === "police_not_notified");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for return_interview_overdue when > 72 hours", () => {
    const episodes = [
      makeEpisode({
        status: "resolved",
        return_interview_status: "pending",
        found_at: "2026-01-01T10:00:00Z", // well over 72 hours ago
      }),
    ];
    const alerts = computeMissingAlerts(episodes);
    const match = alerts.find((a) => a.type === "return_interview_overdue");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for repeat_missing when >= 3 episodes for same child", () => {
    const episodes = [
      makeEpisode({ id: "e1", child_id: "c1" }),
      makeEpisode({ id: "e2", child_id: "c1" }),
      makeEpisode({ id: "e3", child_id: "c1" }),
    ];
    const alerts = computeMissingAlerts(episodes);
    const match = alerts.find((a) => a.type === "repeat_missing");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
    expect(match!.message).toContain("3");
  });

  it("fires medium alert for debrief_pending", () => {
    const episodes = [makeEpisode({ status: "resolved", debrief_completed: false })];
    const alerts = computeMissingAlerts(episodes);
    const match = alerts.find((a) => a.type === "debrief_pending");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});

describe("identifyPushPullFactors", () => {
  it("returns empty arrays for empty data", () => {
    const f = identifyPushPullFactors([]);
    expect(f.push_factors).toEqual([]);
    expect(f.pull_factors).toEqual([]);
    expect(f.risk_factors).toEqual([]);
    expect(f.emotional_factors).toEqual([]);
    expect(f.unknown_count).toBe(0);
  });

  it("classifies triggers correctly", () => {
    const episodes = [
      makeEpisode({ id: "e1", trigger_category: "conflict_with_staff" }),  // push
      makeEpisode({ id: "e2", trigger_category: "bullying" }),             // push
      makeEpisode({ id: "e3", trigger_category: "peer_influence" }),       // pull
      makeEpisode({ id: "e4", trigger_category: "exploitation_concern" }), // risk
      makeEpisode({ id: "e5", trigger_category: "emotional_distress" }),   // emotional
      makeEpisode({ id: "e6", trigger_category: "unknown" }),              // unknown
    ];
    const f = identifyPushPullFactors(episodes);
    expect(f.push_factors).toEqual([
      { factor: "conflict_with_staff", count: 1 },
      { factor: "bullying", count: 1 },
    ]);
    expect(f.pull_factors).toEqual([{ factor: "peer_influence", count: 1 }]);
    expect(f.risk_factors).toEqual([{ factor: "exploitation_concern", count: 1 }]);
    expect(f.emotional_factors).toEqual([{ factor: "emotional_distress", count: 1 }]);
    expect(f.unknown_count).toBe(1);
  });
});
