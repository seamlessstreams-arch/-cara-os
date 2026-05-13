// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MISSING FROM CARE SERVICE TESTS
// Pure-function tests for missing-profile computation, child missing history,
// compliance alert generation, and push/pull factor identification.
// CHR 2015 Reg 34, DfE statutory guidance.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  EPISODE_TYPES,
  TRIGGER_CATEGORIES,
  RETURN_INTERVIEW_STATUS,
  RISK_LEVELS,
  type MissingEpisode,
} from "../missing-from-care-service";

const {
  computeMissingProfile,
  computeChildMissingHistory,
  computeMissingAlerts,
  identifyPushPullFactors,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a MissingEpisode with sensible defaults. Override any field. */
function ep(overrides: Partial<MissingEpisode> = {}): MissingEpisode {
  return {
    id: "id" in overrides ? overrides.id! : "ep-1",
    home_id: "home" in overrides ? overrides.home_id! : "home-1",
    child_id: "child_id" in overrides ? overrides.child_id! : "child-1",
    episode_type: "episode_type" in overrides ? overrides.episode_type! : "missing",
    reported_missing_at: "reported_missing_at" in overrides ? overrides.reported_missing_at! : "2026-04-10T08:00:00Z",
    reported_by: "reported_by" in overrides ? overrides.reported_by! : "staff-1",
    police_notified: "police_notified" in overrides ? overrides.police_notified! : true,
    police_notified_at: "police_notified_at" in overrides ? overrides.police_notified_at! : null,
    police_reference: "police_reference" in overrides ? overrides.police_reference! : null,
    placing_authority_notified: "placing_authority_notified" in overrides ? overrides.placing_authority_notified! : false,
    placing_authority_notified_at: "placing_authority_notified_at" in overrides ? overrides.placing_authority_notified_at! : null,
    ofsted_notified: "ofsted_notified" in overrides ? overrides.ofsted_notified! : false,
    risk_level: "risk_level" in overrides ? overrides.risk_level! : "high",
    trigger_category: "trigger_category" in overrides ? overrides.trigger_category! : null,
    trigger_details: "trigger_details" in overrides ? overrides.trigger_details! : null,
    last_known_location: "last_known_location" in overrides ? overrides.last_known_location! : null,
    found_at: "found_at" in overrides ? overrides.found_at! : null,
    found_location: "found_location" in overrides ? overrides.found_location! : null,
    found_by: "found_by" in overrides ? overrides.found_by! : null,
    duration_minutes: "duration_minutes" in overrides ? overrides.duration_minutes! : null,
    return_interview_status: "return_interview_status" in overrides ? overrides.return_interview_status! : "not_required",
    return_interview_date: "return_interview_date" in overrides ? overrides.return_interview_date! : null,
    return_interview_by: "return_interview_by" in overrides ? overrides.return_interview_by! : null,
    return_interview_notes: "return_interview_notes" in overrides ? overrides.return_interview_notes! : null,
    debrief_completed: "debrief_completed" in overrides ? overrides.debrief_completed! : false,
    actions_taken: "actions_taken" in overrides ? overrides.actions_taken! : [],
    status: "status" in overrides ? overrides.status! : "resolved",
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-04-10T08:00:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-04-10T12:00:00Z",
  };
}

// ── EPISODE_TYPES ─────────────────────────────────────────────────────────

describe("EPISODE_TYPES", () => {
  it("has exactly 4 entries", () => {
    expect(EPISODE_TYPES).toHaveLength(4);
  });

  it("each entry has type, label, risk_level, and requires_police", () => {
    for (const et of EPISODE_TYPES) {
      expect(typeof et.type).toBe("string");
      expect(typeof et.label).toBe("string");
      expect(typeof et.risk_level).toBe("string");
      expect(typeof et.requires_police).toBe("boolean");
    }
  });

  it("contains expected types", () => {
    const types = EPISODE_TYPES.map((e) => e.type);
    expect(types).toContain("missing");
    expect(types).toContain("absent");
    expect(types).toContain("awol");
    expect(types).toContain("failed_to_return");
  });

  it("marks missing and awol as requiring police", () => {
    const missing = EPISODE_TYPES.find((e) => e.type === "missing");
    const awol = EPISODE_TYPES.find((e) => e.type === "awol");
    expect(missing!.requires_police).toBe(true);
    expect(awol!.requires_police).toBe(true);
  });

  it("marks absent and failed_to_return as not requiring police", () => {
    const absent = EPISODE_TYPES.find((e) => e.type === "absent");
    const failedToReturn = EPISODE_TYPES.find((e) => e.type === "failed_to_return");
    expect(absent!.requires_police).toBe(false);
    expect(failedToReturn!.requires_police).toBe(false);
  });
});

// ── TRIGGER_CATEGORIES ─────────────────────────────────────────────────────

describe("TRIGGER_CATEGORIES", () => {
  it("has exactly 12 entries", () => {
    expect(TRIGGER_CATEGORIES).toHaveLength(12);
  });

  it("contains expected categories", () => {
    expect(TRIGGER_CATEGORIES).toContain("peer_influence");
    expect(TRIGGER_CATEGORIES).toContain("exploitation_concern");
    expect(TRIGGER_CATEGORIES).toContain("conflict_with_staff");
    expect(TRIGGER_CATEGORIES).toContain("unknown");
  });

  it("every entry is a string", () => {
    for (const cat of TRIGGER_CATEGORIES) {
      expect(typeof cat).toBe("string");
    }
  });
});

// ── RETURN_INTERVIEW_STATUS ───────────────────────────────────────────────

describe("RETURN_INTERVIEW_STATUS", () => {
  it("has exactly 5 entries", () => {
    expect(RETURN_INTERVIEW_STATUS).toHaveLength(5);
  });

  it("contains expected statuses", () => {
    expect(RETURN_INTERVIEW_STATUS).toContain("not_required");
    expect(RETURN_INTERVIEW_STATUS).toContain("pending");
    expect(RETURN_INTERVIEW_STATUS).toContain("scheduled");
    expect(RETURN_INTERVIEW_STATUS).toContain("completed");
    expect(RETURN_INTERVIEW_STATUS).toContain("refused");
  });
});

// ── RISK_LEVELS ──────────────────────────────────────────────────────────

describe("RISK_LEVELS", () => {
  it("has exactly 4 entries", () => {
    expect(RISK_LEVELS).toHaveLength(4);
  });

  it("contains low, medium, high, very_high", () => {
    expect(RISK_LEVELS).toEqual(["low", "medium", "high", "very_high"]);
  });
});

// ── computeMissingProfile ──────────────────────────────────────────────────

describe("computeMissingProfile", () => {
  it("returns zeroed profile for empty episodes", () => {
    const profile = computeMissingProfile([]);
    expect(profile.total_episodes).toBe(0);
    expect(profile.active_episodes).toBe(0);
    expect(profile.resolved_this_month).toBe(0);
    expect(profile.by_type).toEqual({});
    expect(profile.by_trigger).toEqual({});
    expect(profile.avg_duration_minutes).toBe(0);
    expect(profile.police_notification_rate).toBe(0);
    expect(profile.return_interview_completion_rate).toBe(0);
    expect(profile.repeat_children).toEqual([]);
  });

  it("counts total episodes correctly", () => {
    const episodes = [ep({ id: "ep-1" }), ep({ id: "ep-2" }), ep({ id: "ep-3" })];
    const profile = computeMissingProfile(episodes);
    expect(profile.total_episodes).toBe(3);
  });

  it("counts active episodes correctly", () => {
    const episodes = [
      ep({ id: "ep-1", status: "active" }),
      ep({ id: "ep-2", status: "resolved" }),
      ep({ id: "ep-3", status: "active" }),
      ep({ id: "ep-4", status: "closed" }),
    ];
    const profile = computeMissingProfile(episodes);
    expect(profile.active_episodes).toBe(2);
  });

  it("counts resolved_this_month for resolved episodes updated in current month", () => {
    const now = new Date();
    const thisMonth = now.toISOString();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString();

    const episodes = [
      ep({ id: "ep-1", status: "resolved", updated_at: thisMonth }),
      ep({ id: "ep-2", status: "closed", updated_at: thisMonth }),
      ep({ id: "ep-3", status: "resolved", updated_at: lastMonth }),
      ep({ id: "ep-4", status: "active", updated_at: thisMonth }),
    ];
    const profile = computeMissingProfile(episodes);
    expect(profile.resolved_this_month).toBe(2);
  });

  it("computes by_type correctly", () => {
    const episodes = [
      ep({ id: "ep-1", episode_type: "missing" }),
      ep({ id: "ep-2", episode_type: "missing" }),
      ep({ id: "ep-3", episode_type: "awol" }),
      ep({ id: "ep-4", episode_type: "absent" }),
    ];
    const profile = computeMissingProfile(episodes);
    expect(profile.by_type).toEqual({ missing: 2, awol: 1, absent: 1 });
  });

  it("computes by_trigger, skipping null triggers", () => {
    const episodes = [
      ep({ id: "ep-1", trigger_category: "peer_influence" }),
      ep({ id: "ep-2", trigger_category: "peer_influence" }),
      ep({ id: "ep-3", trigger_category: "bullying" }),
      ep({ id: "ep-4", trigger_category: null }),
    ];
    const profile = computeMissingProfile(episodes);
    expect(profile.by_trigger).toEqual({ peer_influence: 2, bullying: 1 });
  });

  it("computes avg_duration_minutes, skipping null durations", () => {
    const episodes = [
      ep({ id: "ep-1", duration_minutes: 120 }),
      ep({ id: "ep-2", duration_minutes: 60 }),
      ep({ id: "ep-3", duration_minutes: null }),
    ];
    const profile = computeMissingProfile(episodes);
    expect(profile.avg_duration_minutes).toBe(90); // (120+60)/2
  });

  it("returns 0 avg_duration when all durations are null", () => {
    const episodes = [
      ep({ id: "ep-1", duration_minutes: null }),
      ep({ id: "ep-2", duration_minutes: null }),
    ];
    const profile = computeMissingProfile(episodes);
    expect(profile.avg_duration_minutes).toBe(0);
  });

  it("rounds avg_duration_minutes to nearest integer", () => {
    const episodes = [
      ep({ id: "ep-1", duration_minutes: 100 }),
      ep({ id: "ep-2", duration_minutes: 50 }),
      ep({ id: "ep-3", duration_minutes: 30 }),
    ];
    const profile = computeMissingProfile(episodes);
    expect(profile.avg_duration_minutes).toBe(60); // Math.round(180/3)
  });

  it("computes police_notification_rate as percentage", () => {
    const episodes = [
      ep({ id: "ep-1", police_notified: true }),
      ep({ id: "ep-2", police_notified: true }),
      ep({ id: "ep-3", police_notified: false }),
      ep({ id: "ep-4", police_notified: false }),
    ];
    const profile = computeMissingProfile(episodes);
    expect(profile.police_notification_rate).toBe(50);
  });

  it("computes return_interview_completion_rate excluding not_required", () => {
    const episodes = [
      ep({ id: "ep-1", return_interview_status: "completed" }),
      ep({ id: "ep-2", return_interview_status: "pending" }),
      ep({ id: "ep-3", return_interview_status: "completed" }),
      ep({ id: "ep-4", return_interview_status: "not_required" }),
    ];
    const profile = computeMissingProfile(episodes);
    // 2 completed out of 3 relevant (completed + pending)
    expect(profile.return_interview_completion_rate).toBe(67); // Math.round(2/3 * 100)
  });

  it("returns 0 return_interview_completion_rate when all are not_required", () => {
    const episodes = [
      ep({ id: "ep-1", return_interview_status: "not_required" }),
      ep({ id: "ep-2", return_interview_status: "not_required" }),
    ];
    const profile = computeMissingProfile(episodes);
    expect(profile.return_interview_completion_rate).toBe(0);
  });

  it("identifies repeat_children with 2+ episodes sorted by count desc", () => {
    const episodes = [
      ep({ id: "ep-1", child_id: "child-a" }),
      ep({ id: "ep-2", child_id: "child-a" }),
      ep({ id: "ep-3", child_id: "child-a" }),
      ep({ id: "ep-4", child_id: "child-b" }),
      ep({ id: "ep-5", child_id: "child-b" }),
      ep({ id: "ep-6", child_id: "child-c" }),
    ];
    const profile = computeMissingProfile(episodes);
    expect(profile.repeat_children).toEqual([
      { child_id: "child-a", count: 3 },
      { child_id: "child-b", count: 2 },
    ]);
  });

  it("returns empty repeat_children when no child has 2+ episodes", () => {
    const episodes = [
      ep({ id: "ep-1", child_id: "child-a" }),
      ep({ id: "ep-2", child_id: "child-b" }),
      ep({ id: "ep-3", child_id: "child-c" }),
    ];
    const profile = computeMissingProfile(episodes);
    expect(profile.repeat_children).toEqual([]);
  });
});

// ── computeChildMissingHistory ────────────────────────────────────────────

describe("computeChildMissingHistory", () => {
  it("returns empty history for child with no episodes", () => {
    const history = computeChildMissingHistory("child-x", []);
    expect(history.child_id).toBe("child-x");
    expect(history.total_episodes).toBe(0);
    expect(history.active).toBe(false);
    expect(history.last_episode_date).toBeNull();
    expect(history.avg_duration_minutes).toBe(0);
    expect(history.common_triggers).toEqual([]);
    expect(history.risk_trend).toBe("stable");
    expect(history.return_interviews_pending).toBe(0);
  });

  it("filters episodes to the specified child only", () => {
    const episodes = [
      ep({ id: "ep-1", child_id: "child-a" }),
      ep({ id: "ep-2", child_id: "child-b" }),
      ep({ id: "ep-3", child_id: "child-a" }),
    ];
    const history = computeChildMissingHistory("child-a", episodes);
    expect(history.total_episodes).toBe(2);
  });

  it("detects active status when any child episode is active", () => {
    const episodes = [
      ep({ id: "ep-1", child_id: "child-a", status: "resolved" }),
      ep({ id: "ep-2", child_id: "child-a", status: "active" }),
    ];
    const history = computeChildMissingHistory("child-a", episodes);
    expect(history.active).toBe(true);
  });

  it("detects inactive status when no child episode is active", () => {
    const episodes = [
      ep({ id: "ep-1", child_id: "child-a", status: "resolved" }),
      ep({ id: "ep-2", child_id: "child-a", status: "closed" }),
    ];
    const history = computeChildMissingHistory("child-a", episodes);
    expect(history.active).toBe(false);
  });

  it("returns most recent reported_missing_at as last_episode_date", () => {
    const episodes = [
      ep({ id: "ep-1", child_id: "child-a", reported_missing_at: "2026-01-10T08:00:00Z" }),
      ep({ id: "ep-2", child_id: "child-a", reported_missing_at: "2026-04-15T10:00:00Z" }),
      ep({ id: "ep-3", child_id: "child-a", reported_missing_at: "2026-02-20T12:00:00Z" }),
    ];
    const history = computeChildMissingHistory("child-a", episodes);
    expect(history.last_episode_date).toBe("2026-04-15T10:00:00Z");
  });

  it("computes avg_duration_minutes for the child, skipping nulls", () => {
    const episodes = [
      ep({ id: "ep-1", child_id: "child-a", duration_minutes: 120 }),
      ep({ id: "ep-2", child_id: "child-a", duration_minutes: 60 }),
      ep({ id: "ep-3", child_id: "child-a", duration_minutes: null }),
    ];
    const history = computeChildMissingHistory("child-a", episodes);
    expect(history.avg_duration_minutes).toBe(90);
  });

  it("returns 0 avg_duration when all child durations are null", () => {
    const episodes = [
      ep({ id: "ep-1", child_id: "child-a", duration_minutes: null }),
    ];
    const history = computeChildMissingHistory("child-a", episodes);
    expect(history.avg_duration_minutes).toBe(0);
  });

  it("returns top 3 common triggers sorted by frequency", () => {
    const episodes = [
      ep({ id: "ep-1", child_id: "child-a", trigger_category: "bullying" }),
      ep({ id: "ep-2", child_id: "child-a", trigger_category: "bullying" }),
      ep({ id: "ep-3", child_id: "child-a", trigger_category: "bullying" }),
      ep({ id: "ep-4", child_id: "child-a", trigger_category: "peer_influence" }),
      ep({ id: "ep-5", child_id: "child-a", trigger_category: "peer_influence" }),
      ep({ id: "ep-6", child_id: "child-a", trigger_category: "boredom" }),
      ep({ id: "ep-7", child_id: "child-a", trigger_category: "substance_use" }),
    ];
    const history = computeChildMissingHistory("child-a", episodes);
    expect(history.common_triggers).toEqual(["bullying", "peer_influence", "boredom"]);
  });

  it("excludes null triggers from common_triggers", () => {
    const episodes = [
      ep({ id: "ep-1", child_id: "child-a", trigger_category: null }),
      ep({ id: "ep-2", child_id: "child-a", trigger_category: "bullying" }),
    ];
    const history = computeChildMissingHistory("child-a", episodes);
    expect(history.common_triggers).toEqual(["bullying"]);
  });

  it("returns stable risk_trend for single episode", () => {
    const episodes = [
      ep({ id: "ep-1", child_id: "child-a", risk_level: "high", reported_missing_at: "2026-01-01T00:00:00Z" }),
    ];
    const history = computeChildMissingHistory("child-a", episodes);
    expect(history.risk_trend).toBe("stable");
  });

  it("returns escalating risk_trend when second half has higher risk", () => {
    const episodes = [
      ep({ id: "ep-1", child_id: "child-a", risk_level: "low", reported_missing_at: "2026-01-01T00:00:00Z" }),
      ep({ id: "ep-2", child_id: "child-a", risk_level: "low", reported_missing_at: "2026-02-01T00:00:00Z" }),
      ep({ id: "ep-3", child_id: "child-a", risk_level: "high", reported_missing_at: "2026-03-01T00:00:00Z" }),
      ep({ id: "ep-4", child_id: "child-a", risk_level: "very_high", reported_missing_at: "2026-04-01T00:00:00Z" }),
    ];
    const history = computeChildMissingHistory("child-a", episodes);
    expect(history.risk_trend).toBe("escalating");
  });

  it("returns de-escalating risk_trend when second half has lower risk", () => {
    const episodes = [
      ep({ id: "ep-1", child_id: "child-a", risk_level: "very_high", reported_missing_at: "2026-01-01T00:00:00Z" }),
      ep({ id: "ep-2", child_id: "child-a", risk_level: "high", reported_missing_at: "2026-02-01T00:00:00Z" }),
      ep({ id: "ep-3", child_id: "child-a", risk_level: "low", reported_missing_at: "2026-03-01T00:00:00Z" }),
      ep({ id: "ep-4", child_id: "child-a", risk_level: "low", reported_missing_at: "2026-04-01T00:00:00Z" }),
    ];
    const history = computeChildMissingHistory("child-a", episodes);
    expect(history.risk_trend).toBe("de-escalating");
  });

  it("returns stable risk_trend when risk difference is < 0.5", () => {
    const episodes = [
      ep({ id: "ep-1", child_id: "child-a", risk_level: "medium", reported_missing_at: "2026-01-01T00:00:00Z" }),
      ep({ id: "ep-2", child_id: "child-a", risk_level: "medium", reported_missing_at: "2026-02-01T00:00:00Z" }),
    ];
    const history = computeChildMissingHistory("child-a", episodes);
    expect(history.risk_trend).toBe("stable");
  });

  it("counts return_interviews_pending for the child", () => {
    const episodes = [
      ep({ id: "ep-1", child_id: "child-a", return_interview_status: "pending" }),
      ep({ id: "ep-2", child_id: "child-a", return_interview_status: "completed" }),
      ep({ id: "ep-3", child_id: "child-a", return_interview_status: "pending" }),
      ep({ id: "ep-4", child_id: "child-b", return_interview_status: "pending" }),
    ];
    const history = computeChildMissingHistory("child-a", episodes);
    expect(history.return_interviews_pending).toBe(2);
  });
});

// ── computeMissingAlerts ──────────────────────────────────────────────────

describe("computeMissingAlerts", () => {
  it("returns empty array for no episodes", () => {
    const alerts = computeMissingAlerts([]);
    expect(alerts).toEqual([]);
  });

  it("generates active_missing alert for active episodes", () => {
    const episodes = [ep({ id: "ep-1", child_id: "child-a", status: "active", episode_type: "missing" })];
    const alerts = computeMissingAlerts(episodes);
    const activeMissing = alerts.filter((a) => a.type === "active_missing");
    expect(activeMissing).toHaveLength(1);
    expect(activeMissing[0].severity).toBe("critical");
    expect(activeMissing[0].child_id).toBe("child-a");
    expect(activeMissing[0].episode_id).toBe("ep-1");
    expect(activeMissing[0].message).toContain("missing");
  });

  it("generates correct message text for awol episode", () => {
    const episodes = [ep({ id: "ep-1", status: "active", episode_type: "awol" })];
    const alerts = computeMissingAlerts(episodes);
    const activeMissing = alerts.find((a) => a.type === "active_missing");
    expect(activeMissing!.message).toContain("AWOL");
  });

  it("generates correct message text for absent episode", () => {
    const episodes = [ep({ id: "ep-1", status: "active", episode_type: "absent" })];
    const alerts = computeMissingAlerts(episodes);
    const activeMissing = alerts.find((a) => a.type === "active_missing");
    expect(activeMissing!.message).toContain("absent");
  });

  it("generates return_interview_overdue when found >72h ago and pending", () => {
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    const episodes = [ep({
      id: "ep-1",
      child_id: "child-a",
      status: "resolved",
      return_interview_status: "pending",
      found_at: fourDaysAgo,
    })];
    const alerts = computeMissingAlerts(episodes);
    const overdue = alerts.filter((a) => a.type === "return_interview_overdue");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].severity).toBe("high");
  });

  it("does not generate return_interview_overdue when found <72h ago", () => {
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const episodes = [ep({
      id: "ep-1",
      status: "resolved",
      return_interview_status: "pending",
      found_at: oneDayAgo,
    })];
    const alerts = computeMissingAlerts(episodes);
    const overdue = alerts.filter((a) => a.type === "return_interview_overdue");
    expect(overdue).toHaveLength(0);
  });

  it("does not generate return_interview_overdue when found_at is null", () => {
    const episodes = [ep({
      id: "ep-1",
      status: "resolved",
      return_interview_status: "pending",
      found_at: null,
    })];
    const alerts = computeMissingAlerts(episodes);
    const overdue = alerts.filter((a) => a.type === "return_interview_overdue");
    expect(overdue).toHaveLength(0);
  });

  it("does not generate return_interview_overdue for non-resolved episodes", () => {
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    const episodes = [ep({
      id: "ep-1",
      status: "active",
      return_interview_status: "pending",
      found_at: fourDaysAgo,
    })];
    const alerts = computeMissingAlerts(episodes);
    const overdue = alerts.filter((a) => a.type === "return_interview_overdue");
    expect(overdue).toHaveLength(0);
  });

  it("generates police_not_notified alert for missing episode without police", () => {
    const episodes = [ep({
      id: "ep-1",
      child_id: "child-a",
      episode_type: "missing",
      police_notified: false,
    })];
    const alerts = computeMissingAlerts(episodes);
    const policeAlerts = alerts.filter((a) => a.type === "police_not_notified");
    expect(policeAlerts).toHaveLength(1);
    expect(policeAlerts[0].severity).toBe("critical");
    expect(policeAlerts[0].message).toContain("missing");
  });

  it("generates police_not_notified alert for awol episode without police", () => {
    const episodes = [ep({
      id: "ep-1",
      episode_type: "awol",
      police_notified: false,
    })];
    const alerts = computeMissingAlerts(episodes);
    const policeAlerts = alerts.filter((a) => a.type === "police_not_notified");
    expect(policeAlerts).toHaveLength(1);
    expect(policeAlerts[0].message).toContain("awol");
  });

  it("does not generate police_not_notified for absent episodes", () => {
    const episodes = [ep({
      id: "ep-1",
      episode_type: "absent",
      police_notified: false,
    })];
    const alerts = computeMissingAlerts(episodes);
    const policeAlerts = alerts.filter((a) => a.type === "police_not_notified");
    expect(policeAlerts).toHaveLength(0);
  });

  it("does not generate police_not_notified when police is notified", () => {
    const episodes = [ep({
      id: "ep-1",
      episode_type: "missing",
      police_notified: true,
    })];
    const alerts = computeMissingAlerts(episodes);
    const policeAlerts = alerts.filter((a) => a.type === "police_not_notified");
    expect(policeAlerts).toHaveLength(0);
  });

  it("generates debrief_pending for resolved episode without debrief", () => {
    const episodes = [ep({
      id: "ep-1",
      child_id: "child-a",
      status: "resolved",
      debrief_completed: false,
    })];
    const alerts = computeMissingAlerts(episodes);
    const debriefAlerts = alerts.filter((a) => a.type === "debrief_pending");
    expect(debriefAlerts).toHaveLength(1);
    expect(debriefAlerts[0].severity).toBe("medium");
  });

  it("does not generate debrief_pending when debrief is completed", () => {
    const episodes = [ep({
      id: "ep-1",
      status: "resolved",
      debrief_completed: true,
    })];
    const alerts = computeMissingAlerts(episodes);
    const debriefAlerts = alerts.filter((a) => a.type === "debrief_pending");
    expect(debriefAlerts).toHaveLength(0);
  });

  it("does not generate debrief_pending for active episodes", () => {
    const episodes = [ep({
      id: "ep-1",
      status: "active",
      debrief_completed: false,
    })];
    const alerts = computeMissingAlerts(episodes);
    const debriefAlerts = alerts.filter((a) => a.type === "debrief_pending");
    expect(debriefAlerts).toHaveLength(0);
  });

  it("generates repeat_missing alert for child with 3+ episodes", () => {
    const episodes = [
      ep({ id: "ep-1", child_id: "child-a", reported_missing_at: "2026-01-01T00:00:00Z" }),
      ep({ id: "ep-2", child_id: "child-a", reported_missing_at: "2026-02-01T00:00:00Z" }),
      ep({ id: "ep-3", child_id: "child-a", reported_missing_at: "2026-03-01T00:00:00Z" }),
    ];
    const alerts = computeMissingAlerts(episodes);
    const repeatAlerts = alerts.filter((a) => a.type === "repeat_missing");
    expect(repeatAlerts).toHaveLength(1);
    expect(repeatAlerts[0].severity).toBe("high");
    expect(repeatAlerts[0].child_id).toBe("child-a");
    expect(repeatAlerts[0].message).toContain("3");
  });

  it("does not generate repeat_missing for child with fewer than 3 episodes", () => {
    const episodes = [
      ep({ id: "ep-1", child_id: "child-a" }),
      ep({ id: "ep-2", child_id: "child-a" }),
    ];
    const alerts = computeMissingAlerts(episodes);
    const repeatAlerts = alerts.filter((a) => a.type === "repeat_missing");
    expect(repeatAlerts).toHaveLength(0);
  });

  it("uses latest episode_id for repeat_missing alert", () => {
    const episodes = [
      ep({ id: "ep-old", child_id: "child-a", reported_missing_at: "2026-01-01T00:00:00Z" }),
      ep({ id: "ep-mid", child_id: "child-a", reported_missing_at: "2026-02-01T00:00:00Z" }),
      ep({ id: "ep-latest", child_id: "child-a", reported_missing_at: "2026-03-01T00:00:00Z" }),
    ];
    const alerts = computeMissingAlerts(episodes);
    const repeatAlert = alerts.find((a) => a.type === "repeat_missing");
    expect(repeatAlert!.episode_id).toBe("ep-latest");
  });

  it("can produce multiple alert types for a single episode", () => {
    const episodes = [ep({
      id: "ep-1",
      child_id: "child-a",
      status: "active",
      episode_type: "missing",
      police_notified: false,
    })];
    const alerts = computeMissingAlerts(episodes);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("active_missing");
    expect(types).toContain("police_not_notified");
  });
});

// ── identifyPushPullFactors ───────────────────────────────────────────────

describe("identifyPushPullFactors", () => {
  it("returns empty results for no episodes", () => {
    const result = identifyPushPullFactors([]);
    expect(result.push_factors).toEqual([]);
    expect(result.pull_factors).toEqual([]);
    expect(result.risk_factors).toEqual([]);
    expect(result.emotional_factors).toEqual([]);
    expect(result.unknown_count).toBe(0);
  });

  it("skips episodes with null trigger_category", () => {
    const episodes = [
      ep({ id: "ep-1", trigger_category: null }),
      ep({ id: "ep-2", trigger_category: null }),
    ];
    const result = identifyPushPullFactors(episodes);
    expect(result.push_factors).toEqual([]);
    expect(result.pull_factors).toEqual([]);
    expect(result.risk_factors).toEqual([]);
    expect(result.emotional_factors).toEqual([]);
    expect(result.unknown_count).toBe(0);
  });

  it("classifies push triggers correctly", () => {
    const episodes = [
      ep({ id: "ep-1", trigger_category: "conflict_with_staff" }),
      ep({ id: "ep-2", trigger_category: "bullying" }),
      ep({ id: "ep-3", trigger_category: "boredom" }),
      ep({ id: "ep-4", trigger_category: "placement_breakdown" }),
    ];
    const result = identifyPushPullFactors(episodes);
    expect(result.push_factors).toHaveLength(4);
    const factors = result.push_factors.map((f) => f.factor);
    expect(factors).toContain("conflict_with_staff");
    expect(factors).toContain("bullying");
    expect(factors).toContain("boredom");
    expect(factors).toContain("placement_breakdown");
  });

  it("classifies pull triggers correctly", () => {
    const episodes = [
      ep({ id: "ep-1", trigger_category: "peer_influence" }),
      ep({ id: "ep-2", trigger_category: "family_contact" }),
      ep({ id: "ep-3", trigger_category: "romantic_relationship" }),
      ep({ id: "ep-4", trigger_category: "social_media" }),
    ];
    const result = identifyPushPullFactors(episodes);
    expect(result.pull_factors).toHaveLength(4);
    const factors = result.pull_factors.map((f) => f.factor);
    expect(factors).toContain("peer_influence");
    expect(factors).toContain("family_contact");
    expect(factors).toContain("romantic_relationship");
    expect(factors).toContain("social_media");
  });

  it("classifies risk triggers correctly", () => {
    const episodes = [
      ep({ id: "ep-1", trigger_category: "exploitation_concern" }),
      ep({ id: "ep-2", trigger_category: "substance_use" }),
    ];
    const result = identifyPushPullFactors(episodes);
    expect(result.risk_factors).toHaveLength(2);
    const factors = result.risk_factors.map((f) => f.factor);
    expect(factors).toContain("exploitation_concern");
    expect(factors).toContain("substance_use");
  });

  it("classifies emotional triggers correctly", () => {
    const episodes = [
      ep({ id: "ep-1", trigger_category: "emotional_distress" }),
      ep({ id: "ep-2", trigger_category: "emotional_distress" }),
    ];
    const result = identifyPushPullFactors(episodes);
    expect(result.emotional_factors).toHaveLength(1);
    expect(result.emotional_factors[0]).toEqual({ factor: "emotional_distress", count: 2 });
  });

  it("counts unknown triggers separately", () => {
    const episodes = [
      ep({ id: "ep-1", trigger_category: "unknown" }),
      ep({ id: "ep-2", trigger_category: "unknown" }),
      ep({ id: "ep-3", trigger_category: "unknown" }),
    ];
    const result = identifyPushPullFactors(episodes);
    expect(result.unknown_count).toBe(3);
    expect(result.push_factors).toEqual([]);
    expect(result.pull_factors).toEqual([]);
  });

  it("sorts factors by count descending", () => {
    const episodes = [
      ep({ id: "ep-1", trigger_category: "bullying" }),
      ep({ id: "ep-2", trigger_category: "conflict_with_staff" }),
      ep({ id: "ep-3", trigger_category: "conflict_with_staff" }),
      ep({ id: "ep-4", trigger_category: "conflict_with_staff" }),
      ep({ id: "ep-5", trigger_category: "bullying" }),
    ];
    const result = identifyPushPullFactors(episodes);
    expect(result.push_factors[0]).toEqual({ factor: "conflict_with_staff", count: 3 });
    expect(result.push_factors[1]).toEqual({ factor: "bullying", count: 2 });
  });

  it("handles mixed trigger types across all categories", () => {
    const episodes = [
      ep({ id: "ep-1", trigger_category: "bullying" }),         // push
      ep({ id: "ep-2", trigger_category: "peer_influence" }),    // pull
      ep({ id: "ep-3", trigger_category: "exploitation_concern" }), // risk
      ep({ id: "ep-4", trigger_category: "emotional_distress" }), // emotional
      ep({ id: "ep-5", trigger_category: "unknown" }),           // unknown
      ep({ id: "ep-6", trigger_category: null }),                // skipped
    ];
    const result = identifyPushPullFactors(episodes);
    expect(result.push_factors).toHaveLength(1);
    expect(result.pull_factors).toHaveLength(1);
    expect(result.risk_factors).toHaveLength(1);
    expect(result.emotional_factors).toHaveLength(1);
    expect(result.unknown_count).toBe(1);
  });

  it("aggregates counts for repeated triggers within same category", () => {
    const episodes = [
      ep({ id: "ep-1", trigger_category: "peer_influence" }),
      ep({ id: "ep-2", trigger_category: "peer_influence" }),
      ep({ id: "ep-3", trigger_category: "peer_influence" }),
      ep({ id: "ep-4", trigger_category: "family_contact" }),
    ];
    const result = identifyPushPullFactors(episodes);
    expect(result.pull_factors).toEqual([
      { factor: "peer_influence", count: 3 },
      { factor: "family_contact", count: 1 },
    ]);
  });
});
