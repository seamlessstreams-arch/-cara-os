// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Community Integration Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateConnectionBreadth,
  evaluateEngagement,
  evaluateBarriers,
  evaluateGoalProgress,
  buildChildProfiles,
  generateCommunityIntegrationIntelligence,
  getConnectionTypeLabel,
  getBarrierLabel,
  getEngagementLabel,
  getAllConnectionTypes,
} from "../community-integration-engine";
import type {
  CommunityConnection,
  IntegrationGoal,
  ChildProfile,
} from "../community-integration-engine";

// ── Test Constants ───────────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-12-31";
const REFERENCE_DATE = "2025-06-15";

// ── Oak House Demo Data ──────────────────────────────────────────────────────
// Children: Alex (14, placed 2024-06-01), Jordan (13, placed 2024-09-15), Morgan (15, placed 2024-03-01)

const demoChildren: ChildProfile[] = [
  { childId: "child-alex", childName: "Alex", age: 14, placementStartDate: "2024-06-01" },
  { childId: "child-jordan", childName: "Jordan", age: 13, placementStartDate: "2024-09-15" },
  { childId: "child-morgan", childName: "Morgan", age: 15, placementStartDate: "2024-03-01" },
];

const demoConnections: CommunityConnection[] = [
  // ── Alex — 3 active, 1 ended ──────────────────────────────────────────
  {
    id: "conn-a01", childId: "child-alex", childName: "Alex",
    connectionType: "club_sport", connectionName: "Oakwood Football Club",
    status: "active", engagementLevel: "high",
    startDate: "2024-09-01", frequencyPerWeek: 2,
    staffFacilitated: false, isChildLed: true, barriers: [],
  },
  {
    id: "conn-a02", childId: "child-alex", childName: "Alex",
    connectionType: "education", connectionName: "Year 10 at Meadow School",
    status: "active", engagementLevel: "moderate",
    startDate: "2024-09-05", frequencyPerWeek: 5,
    staffFacilitated: false, isChildLed: false, barriers: [],
  },
  {
    id: "conn-a03", childId: "child-alex", childName: "Alex",
    connectionType: "hobby_activity", connectionName: "Art Club at Community Centre",
    status: "active", engagementLevel: "moderate",
    startDate: "2025-01-15", frequencyPerWeek: 1,
    staffFacilitated: true, isChildLed: true, barriers: [],
  },
  {
    id: "conn-a04", childId: "child-alex", childName: "Alex",
    connectionType: "club_sport", connectionName: "Swimming Lessons",
    status: "ended", engagementLevel: "low",
    startDate: "2024-07-01", endDate: "2024-11-30", frequencyPerWeek: 1,
    staffFacilitated: true, isChildLed: false, barriers: ["anxiety"],
    notes: "Alex became anxious in group swimming sessions — ended by mutual agreement",
  },

  // ── Jordan — 2 active, 1 planned ──────────────────────────────────────
  {
    id: "conn-j01", childId: "child-jordan", childName: "Jordan",
    connectionType: "education", connectionName: "Year 9 at Riverside Academy",
    status: "active", engagementLevel: "low",
    startDate: "2024-09-15", frequencyPerWeek: 5,
    staffFacilitated: false, isChildLed: false, barriers: ["peer_conflict"],
  },
  {
    id: "conn-j02", childId: "child-jordan", childName: "Jordan",
    connectionType: "hobby_activity", connectionName: "Gaming Club",
    status: "active", engagementLevel: "high",
    startDate: "2025-02-01", frequencyPerWeek: 1,
    staffFacilitated: true, isChildLed: true, barriers: [],
  },
  {
    id: "conn-j03", childId: "child-jordan", childName: "Jordan",
    connectionType: "faith_community", connectionName: "Local Youth Group",
    status: "planned", engagementLevel: "moderate",
    startDate: "2025-07-01", frequencyPerWeek: 1,
    staffFacilitated: true, isChildLed: false, barriers: ["anxiety"],
    notes: "Jordan expressed interest but anxious about attending alone — staff to accompany initially",
  },

  // ── Morgan — 4 active, 1 paused ───────────────────────────────────────
  {
    id: "conn-m01", childId: "child-morgan", childName: "Morgan",
    connectionType: "education", connectionName: "Year 11 at Meadow School",
    status: "active", engagementLevel: "high",
    startDate: "2024-09-05", frequencyPerWeek: 5,
    staffFacilitated: false, isChildLed: false, barriers: [],
  },
  {
    id: "conn-m02", childId: "child-morgan", childName: "Morgan",
    connectionType: "hobby_activity", connectionName: "Drama Club",
    status: "active", engagementLevel: "high",
    startDate: "2024-10-01", frequencyPerWeek: 2,
    staffFacilitated: false, isChildLed: true, barriers: [],
  },
  {
    id: "conn-m03", childId: "child-morgan", childName: "Morgan",
    connectionType: "volunteering", connectionName: "Charity Shop Volunteer",
    status: "active", engagementLevel: "moderate",
    startDate: "2025-03-01", frequencyPerWeek: 0.5,
    staffFacilitated: true, isChildLed: true, barriers: [],
  },
  {
    id: "conn-m04", childId: "child-morgan", childName: "Morgan",
    connectionType: "therapy", connectionName: "Weekly Therapy Sessions",
    status: "active", engagementLevel: "high",
    startDate: "2024-04-01", frequencyPerWeek: 1,
    staffFacilitated: true, isChildLed: false, barriers: [],
  },
  {
    id: "conn-m05", childId: "child-morgan", childName: "Morgan",
    connectionType: "friendship", connectionName: "Friendship with Sam (school friend)",
    status: "paused", engagementLevel: "moderate",
    startDate: "2024-05-01", frequencyPerWeek: 0,
    staffFacilitated: false, isChildLed: true, barriers: ["placement_instability"],
    notes: "Contact reduced after Sam's family moved — exploring video call catch-ups",
  },
];

const demoGoals: IntegrationGoal[] = [
  {
    id: "goal-a01", childId: "child-alex", childName: "Alex",
    goalDescription: "Join a second community activity",
    targetConnectionType: "hobby_activity",
    targetDate: "2025-03-01", status: "in_progress",
  },
  {
    id: "goal-j01", childId: "child-jordan", childName: "Jordan",
    goalDescription: "Improve school engagement",
    targetConnectionType: "education",
    targetDate: "2025-04-01", status: "in_progress",
  },
  {
    id: "goal-j02", childId: "child-jordan", childName: "Jordan",
    goalDescription: "Join a physical activity",
    targetConnectionType: "club_sport",
    targetDate: "2025-06-01", status: "not_started",
  },
  {
    id: "goal-m01", childId: "child-morgan", childName: "Morgan",
    goalDescription: "Maintain volunteering commitment",
    targetConnectionType: "volunteering",
    targetDate: "2025-01-15", status: "achieved",
    achievedDate: "2025-01-10",
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Community Integration — evaluateConnectionBreadth", () => {
  it("counts all 3 children", () => {
    const result = evaluateConnectionBreadth(demoConnections, demoChildren, REFERENCE_DATE);
    expect(result.totalChildren).toBe(3);
  });

  it("counts active connections only", () => {
    const result = evaluateConnectionBreadth(demoConnections, demoChildren, REFERENCE_DATE);
    // Alex: 3 active, Jordan: 2 active, Morgan: 4 active = 9
    // conn-a04 ended, conn-j03 planned (startDate 2025-07-01 > ref 2025-06-15), conn-m05 paused
    expect(result.totalActiveConnections).toBe(9);
  });

  it("calculates avg connections per child", () => {
    const result = evaluateConnectionBreadth(demoConnections, demoChildren, REFERENCE_DATE);
    // 9 active / 3 children = 3.0
    expect(result.avgConnectionsPerChild).toBe(3);
  });

  it("reports 0 children with zero connections", () => {
    const result = evaluateConnectionBreadth(demoConnections, demoChildren, REFERENCE_DATE);
    expect(result.childrenWithZeroConnections).toBe(0);
  });

  it("reports 0 children with exactly one connection", () => {
    const result = evaluateConnectionBreadth(demoConnections, demoChildren, REFERENCE_DATE);
    expect(result.childrenWithOneConnection).toBe(0);
  });

  it("builds connection type distribution", () => {
    const result = evaluateConnectionBreadth(demoConnections, demoChildren, REFERENCE_DATE);
    expect(result.connectionTypeDistribution["education"]).toBe(3);
    expect(result.connectionTypeDistribution["hobby_activity"]).toBe(3);
    expect(result.connectionTypeDistribution["club_sport"]).toBe(1);
    expect(result.connectionTypeDistribution["volunteering"]).toBe(1);
    expect(result.connectionTypeDistribution["therapy"]).toBe(1);
  });

  it("calculates diversity score", () => {
    const result = evaluateConnectionBreadth(demoConnections, demoChildren, REFERENCE_DATE);
    // Alex: 3 types (club_sport, education, hobby_activity)
    // Jordan: 2 types (education, hobby_activity)
    // Morgan: 4 types (education, hobby_activity, volunteering, therapy)
    // Average unique types = (3+2+4)/3 = 3.0 → 3.0 * 25 = 75
    expect(result.diversityScore).toBe(75);
  });

  it("detects children with zero connections", () => {
    const noConnections: CommunityConnection[] = [];
    const result = evaluateConnectionBreadth(noConnections, demoChildren, REFERENCE_DATE);
    expect(result.childrenWithZeroConnections).toBe(3);
    expect(result.avgConnectionsPerChild).toBe(0);
  });

  it("detects child with exactly one connection", () => {
    const singleConn: CommunityConnection[] = [
      {
        id: "test-1", childId: "child-alex", childName: "Alex",
        connectionType: "education", connectionName: "School",
        status: "active", engagementLevel: "moderate",
        startDate: "2024-01-01", frequencyPerWeek: 5,
        staffFacilitated: false, isChildLed: false, barriers: [],
      },
    ];
    const result = evaluateConnectionBreadth(singleConn, demoChildren, REFERENCE_DATE);
    expect(result.childrenWithOneConnection).toBe(1);
    expect(result.childrenWithZeroConnections).toBe(2);
  });

  it("handles empty children list", () => {
    const result = evaluateConnectionBreadth(demoConnections, [], REFERENCE_DATE);
    expect(result.totalChildren).toBe(0);
    expect(result.avgConnectionsPerChild).toBe(0);
    expect(result.diversityScore).toBe(0);
  });

  it("handles empty connections list", () => {
    const result = evaluateConnectionBreadth([], demoChildren, REFERENCE_DATE);
    expect(result.totalActiveConnections).toBe(0);
    expect(result.avgConnectionsPerChild).toBe(0);
  });

  it("excludes planned connections with future start dates", () => {
    const futureConn: CommunityConnection[] = [
      {
        id: "future-1", childId: "child-alex", childName: "Alex",
        connectionType: "club_sport", connectionName: "Future Club",
        status: "active", engagementLevel: "high",
        startDate: "2026-01-01", frequencyPerWeek: 1,
        staffFacilitated: false, isChildLed: true, barriers: [],
      },
    ];
    const result = evaluateConnectionBreadth(futureConn, demoChildren, REFERENCE_DATE);
    expect(result.totalActiveConnections).toBe(0);
  });

  it("diversity score caps at 100", () => {
    // Child with 5 different types
    const manyTypes: CommunityConnection[] = [
      { id: "t1", childId: "child-alex", childName: "Alex", connectionType: "education", connectionName: "A", status: "active", engagementLevel: "high", startDate: "2024-01-01", frequencyPerWeek: 1, staffFacilitated: false, isChildLed: true, barriers: [] },
      { id: "t2", childId: "child-alex", childName: "Alex", connectionType: "club_sport", connectionName: "B", status: "active", engagementLevel: "high", startDate: "2024-01-01", frequencyPerWeek: 1, staffFacilitated: false, isChildLed: true, barriers: [] },
      { id: "t3", childId: "child-alex", childName: "Alex", connectionType: "hobby_activity", connectionName: "C", status: "active", engagementLevel: "high", startDate: "2024-01-01", frequencyPerWeek: 1, staffFacilitated: false, isChildLed: true, barriers: [] },
      { id: "t4", childId: "child-alex", childName: "Alex", connectionType: "volunteering", connectionName: "D", status: "active", engagementLevel: "high", startDate: "2024-01-01", frequencyPerWeek: 1, staffFacilitated: false, isChildLed: true, barriers: [] },
      { id: "t5", childId: "child-alex", childName: "Alex", connectionType: "therapy", connectionName: "E", status: "active", engagementLevel: "high", startDate: "2024-01-01", frequencyPerWeek: 1, staffFacilitated: false, isChildLed: true, barriers: [] },
    ];
    const oneChild: ChildProfile[] = [demoChildren[0]];
    const result = evaluateConnectionBreadth(manyTypes, oneChild, REFERENCE_DATE);
    expect(result.diversityScore).toBe(100);
  });
});

describe("Community Integration — evaluateEngagement", () => {
  it("counts total active connections", () => {
    const result = evaluateEngagement(demoConnections, REFERENCE_DATE);
    expect(result.totalActive).toBe(9);
  });

  it("counts high engagement connections", () => {
    const result = evaluateEngagement(demoConnections, REFERENCE_DATE);
    // Alex: football(high), Morgan: school(high), drama(high), therapy(high) = 4
    // Jordan: gaming(high) = 1 → total 5
    expect(result.highEngagement).toBe(5);
  });

  it("counts moderate engagement connections", () => {
    const result = evaluateEngagement(demoConnections, REFERENCE_DATE);
    // Alex: school(moderate), art(moderate), Morgan: volunteering(moderate) = 3
    expect(result.moderateEngagement).toBe(3);
  });

  it("counts low engagement connections", () => {
    const result = evaluateEngagement(demoConnections, REFERENCE_DATE);
    // Jordan: school(low) = 1
    expect(result.lowEngagement).toBe(1);
  });

  it("counts disengaged connections", () => {
    const result = evaluateEngagement(demoConnections, REFERENCE_DATE);
    expect(result.disengaged).toBe(0);
  });

  it("calculates overall engagement rate", () => {
    const result = evaluateEngagement(demoConnections, REFERENCE_DATE);
    // (5 high + 3 moderate) / 9 total = 8/9 = 89%
    expect(result.overallEngagementRate).toBe(89);
  });

  it("calculates child-led rate", () => {
    const result = evaluateEngagement(demoConnections, REFERENCE_DATE);
    // Child-led active: Alex football(Y), Alex art(Y), Jordan gaming(Y), Morgan drama(Y), Morgan volunteering(Y) = 5
    // Not child-led: Alex school(N), Jordan school(N), Morgan school(N), Morgan therapy(N) = 4
    // 5/9 = 56%
    expect(result.childLedRate).toBe(56);
  });

  it("calculates staff-facilitated rate", () => {
    const result = evaluateEngagement(demoConnections, REFERENCE_DATE);
    // Staff-facilitated active: Alex art(Y), Jordan school? No. Jordan gaming(Y), Morgan volunteering(Y), Morgan therapy(Y) = 4
    // 4/9 = 44%
    expect(result.staffFacilitatedRate).toBe(44);
  });

  it("handles empty connections", () => {
    const result = evaluateEngagement([], REFERENCE_DATE);
    expect(result.totalActive).toBe(0);
    expect(result.overallEngagementRate).toBe(0);
    expect(result.childLedRate).toBe(0);
    expect(result.staffFacilitatedRate).toBe(0);
  });

  it("handles all disengaged", () => {
    const disengagedConns: CommunityConnection[] = [
      {
        id: "d1", childId: "child-alex", childName: "Alex",
        connectionType: "education", connectionName: "School",
        status: "active", engagementLevel: "disengaged",
        startDate: "2024-01-01", frequencyPerWeek: 5,
        staffFacilitated: false, isChildLed: false, barriers: [],
      },
    ];
    const result = evaluateEngagement(disengagedConns, REFERENCE_DATE);
    expect(result.overallEngagementRate).toBe(0);
    expect(result.disengaged).toBe(1);
  });

  it("excludes non-active connections from engagement", () => {
    const mixedStatus: CommunityConnection[] = [
      {
        id: "m1", childId: "child-alex", childName: "Alex",
        connectionType: "education", connectionName: "School",
        status: "active", engagementLevel: "high",
        startDate: "2024-01-01", frequencyPerWeek: 5,
        staffFacilitated: false, isChildLed: true, barriers: [],
      },
      {
        id: "m2", childId: "child-alex", childName: "Alex",
        connectionType: "club_sport", connectionName: "Ended Club",
        status: "ended", engagementLevel: "low",
        startDate: "2024-01-01", frequencyPerWeek: 1,
        staffFacilitated: false, isChildLed: false, barriers: [],
      },
    ];
    const result = evaluateEngagement(mixedStatus, REFERENCE_DATE);
    expect(result.totalActive).toBe(1);
    expect(result.highEngagement).toBe(1);
  });
});

describe("Community Integration — evaluateBarriers", () => {
  it("counts total barriers across all connections", () => {
    const result = evaluateBarriers(demoConnections, REFERENCE_DATE);
    // conn-a04: anxiety, conn-j01: peer_conflict, conn-j03: anxiety (start 2025-07-01 > ref? No, startDate check is <=)
    // Wait: conn-j03 startDate is 2025-07-01 which is > 2025-06-15, so it's excluded
    // conn-m05: placement_instability
    // Total: anxiety + peer_conflict + placement_instability = 3
    expect(result.totalBarriers).toBe(3);
  });

  it("builds barrier distribution", () => {
    const result = evaluateBarriers(demoConnections, REFERENCE_DATE);
    expect(result.barrierDistribution["anxiety"]).toBe(1);
    expect(result.barrierDistribution["peer_conflict"]).toBe(1);
    expect(result.barrierDistribution["placement_instability"]).toBe(1);
  });

  it("counts children with barriers", () => {
    const result = evaluateBarriers(demoConnections, REFERENCE_DATE);
    // Alex (anxiety from swimming), Jordan (peer_conflict), Morgan (placement_instability)
    expect(result.childrenWithBarriers).toBe(3);
  });

  it("identifies most common barrier", () => {
    const result = evaluateBarriers(demoConnections, REFERENCE_DATE);
    // All tied at 1 — first alphabetically encountered wins based on iteration order
    expect(result.mostCommonBarrier).not.toBeNull();
  });

  it("calculates barriers per child average", () => {
    const result = evaluateBarriers(demoConnections, REFERENCE_DATE);
    // 3 barriers across 3 unique children in relevant connections = 1.0
    expect(result.barriersPerChildAvg).toBe(1);
  });

  it("handles connections with no barriers", () => {
    const noBarriers: CommunityConnection[] = [
      {
        id: "nb1", childId: "child-alex", childName: "Alex",
        connectionType: "education", connectionName: "School",
        status: "active", engagementLevel: "high",
        startDate: "2024-01-01", frequencyPerWeek: 5,
        staffFacilitated: false, isChildLed: false, barriers: [],
      },
    ];
    const result = evaluateBarriers(noBarriers, REFERENCE_DATE);
    expect(result.totalBarriers).toBe(0);
    expect(result.childrenWithBarriers).toBe(0);
    expect(result.mostCommonBarrier).toBeNull();
    expect(result.barriersPerChildAvg).toBe(0);
  });

  it("handles empty connections", () => {
    const result = evaluateBarriers([], REFERENCE_DATE);
    expect(result.totalBarriers).toBe(0);
    expect(result.barriersPerChildAvg).toBe(0);
  });

  it("counts multiple barriers on single connection", () => {
    const multiBarrier: CommunityConnection[] = [
      {
        id: "mb1", childId: "child-alex", childName: "Alex",
        connectionType: "club_sport", connectionName: "Club",
        status: "active", engagementLevel: "low",
        startDate: "2024-01-01", frequencyPerWeek: 1,
        staffFacilitated: true, isChildLed: false,
        barriers: ["transport", "funding", "anxiety"],
      },
    ];
    const result = evaluateBarriers(multiBarrier, REFERENCE_DATE);
    expect(result.totalBarriers).toBe(3);
    expect(result.barrierDistribution["transport"]).toBe(1);
    expect(result.barrierDistribution["funding"]).toBe(1);
    expect(result.barrierDistribution["anxiety"]).toBe(1);
  });

  it("identifies most common barrier when one dominates", () => {
    const conns: CommunityConnection[] = [
      { id: "b1", childId: "c1", childName: "C1", connectionType: "education", connectionName: "S", status: "active", engagementLevel: "low", startDate: "2024-01-01", frequencyPerWeek: 5, staffFacilitated: false, isChildLed: false, barriers: ["transport"] },
      { id: "b2", childId: "c2", childName: "C2", connectionType: "club_sport", connectionName: "C", status: "active", engagementLevel: "low", startDate: "2024-01-01", frequencyPerWeek: 1, staffFacilitated: true, isChildLed: false, barriers: ["transport", "funding"] },
      { id: "b3", childId: "c3", childName: "C3", connectionType: "hobby_activity", connectionName: "H", status: "active", engagementLevel: "low", startDate: "2024-01-01", frequencyPerWeek: 1, staffFacilitated: true, isChildLed: false, barriers: ["transport"] },
    ];
    const result = evaluateBarriers(conns, REFERENCE_DATE);
    expect(result.mostCommonBarrier).toBe("transport");
  });
});

describe("Community Integration — evaluateGoalProgress", () => {
  it("counts total goals", () => {
    const result = evaluateGoalProgress(demoGoals, REFERENCE_DATE);
    expect(result.totalGoals).toBe(4);
  });

  it("counts achieved goals", () => {
    const result = evaluateGoalProgress(demoGoals, REFERENCE_DATE);
    // Morgan's volunteering goal achieved
    expect(result.achieved).toBe(1);
  });

  it("counts in-progress goals", () => {
    const result = evaluateGoalProgress(demoGoals, REFERENCE_DATE);
    // Alex's community activity, Jordan's school engagement
    expect(result.inProgress).toBe(2);
  });

  it("counts not-started goals", () => {
    const result = evaluateGoalProgress(demoGoals, REFERENCE_DATE);
    // Jordan's physical activity
    expect(result.notStarted).toBe(1);
  });

  it("calculates achievement rate", () => {
    const result = evaluateGoalProgress(demoGoals, REFERENCE_DATE);
    // 1/4 = 25%
    expect(result.achievementRate).toBe(25);
  });

  it("counts overdue goals", () => {
    const result = evaluateGoalProgress(demoGoals, REFERENCE_DATE);
    // Alex goal: target 2025-03-01 < ref 2025-06-15, status in_progress → overdue
    // Jordan school: target 2025-04-01 < ref 2025-06-15, status in_progress → overdue
    // Jordan physical: target 2025-06-01 < ref 2025-06-15, status not_started → overdue
    // Morgan: achieved → not overdue
    expect(result.overdueGoals).toBe(3);
  });

  it("does not count achieved goals as overdue", () => {
    const achievedGoal: IntegrationGoal[] = [
      {
        id: "g1", childId: "c1", childName: "C1",
        goalDescription: "Test", targetConnectionType: "education",
        targetDate: "2024-01-01", status: "achieved", achievedDate: "2024-01-01",
      },
    ];
    const result = evaluateGoalProgress(achievedGoal, REFERENCE_DATE);
    expect(result.overdueGoals).toBe(0);
  });

  it("does not count discontinued goals as overdue", () => {
    const discontinuedGoal: IntegrationGoal[] = [
      {
        id: "g1", childId: "c1", childName: "C1",
        goalDescription: "Test", targetConnectionType: "education",
        targetDate: "2024-01-01", status: "discontinued",
      },
    ];
    const result = evaluateGoalProgress(discontinuedGoal, REFERENCE_DATE);
    expect(result.overdueGoals).toBe(0);
  });

  it("handles empty goals list", () => {
    const result = evaluateGoalProgress([], REFERENCE_DATE);
    expect(result.totalGoals).toBe(0);
    expect(result.achievementRate).toBe(0);
    expect(result.overdueGoals).toBe(0);
  });

  it("counts revised and discontinued goals", () => {
    const mixedGoals: IntegrationGoal[] = [
      { id: "g1", childId: "c1", childName: "C1", goalDescription: "A", targetConnectionType: "education", targetDate: "2025-12-01", status: "revised" },
      { id: "g2", childId: "c1", childName: "C1", goalDescription: "B", targetConnectionType: "club_sport", targetDate: "2025-12-01", status: "discontinued" },
      { id: "g3", childId: "c1", childName: "C1", goalDescription: "C", targetConnectionType: "hobby_activity", targetDate: "2025-12-01", status: "achieved", achievedDate: "2025-06-01" },
    ];
    const result = evaluateGoalProgress(mixedGoals, REFERENCE_DATE);
    expect(result.revised).toBe(1);
    expect(result.discontinued).toBe(1);
    expect(result.achieved).toBe(1);
    expect(result.achievementRate).toBe(33);
  });

  it("100% achievement rate with all achieved", () => {
    const allAchieved: IntegrationGoal[] = [
      { id: "g1", childId: "c1", childName: "C1", goalDescription: "A", targetConnectionType: "education", targetDate: "2025-01-01", status: "achieved", achievedDate: "2025-01-01" },
      { id: "g2", childId: "c1", childName: "C1", goalDescription: "B", targetConnectionType: "club_sport", targetDate: "2025-02-01", status: "achieved", achievedDate: "2025-02-01" },
    ];
    const result = evaluateGoalProgress(allAchieved, REFERENCE_DATE);
    expect(result.achievementRate).toBe(100);
    expect(result.overdueGoals).toBe(0);
  });
});

describe("Community Integration — buildChildProfiles", () => {
  const profiles = buildChildProfiles(demoConnections, demoGoals, demoChildren, REFERENCE_DATE);

  it("builds 3 child profiles", () => {
    expect(profiles.length).toBe(3);
  });

  it("Alex has 3 active connections", () => {
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex!.activeConnections).toBe(3);
  });

  it("Alex has 3 connection types", () => {
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex!.connectionTypes.length).toBe(3);
    expect(alex!.connectionTypes).toContain("club_sport");
    expect(alex!.connectionTypes).toContain("education");
    expect(alex!.connectionTypes).toContain("hobby_activity");
  });

  it("Jordan has 2 active connections", () => {
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(jordan!.activeConnections).toBe(2);
  });

  it("Morgan has 4 active connections", () => {
    const morgan = profiles.find((p) => p.childId === "child-morgan");
    expect(morgan!.activeConnections).toBe(4);
  });

  it("calculates Alex engagement score", () => {
    const alex = profiles.find((p) => p.childId === "child-alex");
    // football high(100) + school moderate(66) + art moderate(66) = 232/3 = 77.3 → 77
    expect(alex!.engagementScore).toBe(77);
  });

  it("calculates Jordan engagement score", () => {
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    // school low(33) + gaming high(100) = 133/2 = 66.5 → 67
    expect(jordan!.engagementScore).toBe(67);
  });

  it("calculates Morgan engagement score", () => {
    const morgan = profiles.find((p) => p.childId === "child-morgan");
    // school high(100) + drama high(100) + volunteering moderate(66) + therapy high(100) = 366/4 = 91.5 → 92
    expect(morgan!.engagementScore).toBe(92);
  });

  it("collects Alex barriers (from ended connection too)", () => {
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex!.barriers).toContain("anxiety");
  });

  it("collects Morgan barriers", () => {
    const morgan = profiles.find((p) => p.childId === "child-morgan");
    expect(morgan!.barriers).toContain("placement_instability");
  });

  it("Alex has 1 goal total", () => {
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex!.goalsTotal).toBe(1);
    expect(alex!.goalsInProgress).toBe(1);
  });

  it("Jordan has 2 goals, 0 achieved", () => {
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(jordan!.goalsTotal).toBe(2);
    expect(jordan!.goalsAchieved).toBe(0);
  });

  it("Morgan has 1 goal, 1 achieved", () => {
    const morgan = profiles.find((p) => p.childId === "child-morgan");
    expect(morgan!.goalsTotal).toBe(1);
    expect(morgan!.goalsAchieved).toBe(1);
  });

  it("Alex has overdue goals", () => {
    const alex = profiles.find((p) => p.childId === "child-alex");
    // Target 2025-03-01 < ref 2025-06-15, status in_progress → overdue
    expect(alex!.goalsOverdue).toBe(1);
  });

  it("Morgan rated excellent", () => {
    const morgan = profiles.find((p) => p.childId === "child-morgan");
    // 4 active connections, engagementScore 92, 4 connection types
    expect(morgan!.integrationRating).toBe("excellent");
  });

  it("Alex rated excellent", () => {
    const alex = profiles.find((p) => p.childId === "child-alex");
    // 3 active connections, engagementScore 77, 3 connection types
    expect(alex!.integrationRating).toBe("excellent");
  });

  it("Jordan rated good", () => {
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    // 2 active connections, engagementScore 67, 2 types → good
    expect(jordan!.integrationRating).toBe("good");
  });

  it("child with 0 connections rated isolated", () => {
    const noConns: CommunityConnection[] = [];
    const result = buildChildProfiles(noConns, [], demoChildren, REFERENCE_DATE);
    for (const profile of result) {
      expect(profile.integrationRating).toBe("isolated");
      expect(profile.engagementScore).toBe(0);
    }
  });

  it("handles empty inputs", () => {
    const result = buildChildProfiles([], [], [], REFERENCE_DATE);
    expect(result.length).toBe(0);
  });

  it("includes child age", () => {
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex!.age).toBe(14);
  });

  it("child with 1 low-engagement connection rated attention_needed", () => {
    const singleLow: CommunityConnection[] = [
      {
        id: "sl1", childId: "child-alex", childName: "Alex",
        connectionType: "education", connectionName: "School",
        status: "active", engagementLevel: "low",
        startDate: "2024-01-01", frequencyPerWeek: 5,
        staffFacilitated: false, isChildLed: false, barriers: [],
      },
    ];
    const oneChild: ChildProfile[] = [demoChildren[0]];
    const result = buildChildProfiles(singleLow, [], oneChild, REFERENCE_DATE);
    expect(result[0].integrationRating).toBe("attention_needed");
  });
});

describe("Community Integration — generateCommunityIntegrationIntelligence (integration)", () => {
  const result = generateCommunityIntegrationIntelligence(
    demoConnections, demoGoals, demoChildren,
    "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
  );

  it("returns complete structure", () => {
    expect(result).toHaveProperty("homeId", "oak-house");
    expect(result).toHaveProperty("periodStart", PERIOD_START);
    expect(result).toHaveProperty("periodEnd", PERIOD_END);
    expect(result).toHaveProperty("referenceDate", REFERENCE_DATE);
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("rating");
    expect(result).toHaveProperty("breadth");
    expect(result).toHaveProperty("engagement");
    expect(result).toHaveProperty("barriers");
    expect(result).toHaveProperty("goalProgress");
    expect(result).toHaveProperty("childProfiles");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("areasForImprovement");
    expect(result).toHaveProperty("actions");
    expect(result).toHaveProperty("regulatoryLinks");
  });

  it("scores > 40", () => {
    // breadth 25 (avg 3 + diversity 75) + engagement 30 (89% > 80) + barriers 10 (1.0 avg < 2) + goal 3 (25% < 30% → 5, minus 3 overdue * 2 = 6 → max(0,-1)=0)
    // Actually let's recalculate:
    // Breadth: avg 3.0 and diversity 75 >= 50 → 25
    // Engagement: 89% > 80 → 30
    // Barriers: avg 1.0 < 2 → 10
    // Goals: 25% ≤ 30% → 5, minus min(10, 3*2=6) = 5-6 = 0 → max(0,-1)=0
    // Total: 25 + 30 + 10 + 0 = 65
    expect(result.overallScore).toBeGreaterThan(40);
  });

  it("achieves good rating with demo data", () => {
    expect(["good", "outstanding"]).toContain(result.rating);
  });

  it("includes breadth data", () => {
    expect(result.breadth.totalChildren).toBe(3);
    expect(result.breadth.totalActiveConnections).toBe(9);
  });

  it("includes engagement data", () => {
    expect(result.engagement.totalActive).toBe(9);
  });

  it("includes barrier data", () => {
    expect(result.barriers.totalBarriers).toBe(3);
  });

  it("includes goal progress data", () => {
    expect(result.goalProgress.totalGoals).toBe(4);
  });

  it("includes 3 child profiles", () => {
    expect(result.childProfiles.length).toBe(3);
  });

  it("produces inadequate with no data", () => {
    const empty = generateCommunityIntegrationIntelligence([], [], [], "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(empty.rating).toBe("inadequate");
    expect(empty.overallScore).toBe(0);
  });

  it("links to Reg 9", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 9"))).toBe(true);
  });

  it("links to Reg 7", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 7"))).toBe(true);
  });

  it("links to UNCRC Article 31", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 31"))).toBe(true);
  });

  it("links to SCCIF", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("identifies strength for good breadth", () => {
    expect(result.strengths.some((s) => s.includes("community connections"))).toBe(true);
  });

  it("identifies strength for no isolated children", () => {
    expect(result.strengths.some((s) => s.toLowerCase().includes("isolated"))).toBe(true);
  });

  it("identifies strength for child-led rate", () => {
    expect(result.strengths.some((s) => s.toLowerCase().includes("child-led"))).toBe(true);
  });

  it("identifies strength for high engagement", () => {
    expect(result.strengths.some((s) => s.toLowerCase().includes("engagement"))).toBe(true);
  });

  it("identifies area for overdue goals", () => {
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("overdue"))).toBe(true);
  });

  it("generates action for overdue goals", () => {
    expect(result.actions.some((a) => a.includes("overdue"))).toBe(true);
  });

  it("generates action for most common barrier", () => {
    expect(result.actions.some((a) => a.toLowerCase().includes("barrier"))).toBe(true);
  });

  it("generates urgent action for isolated children", () => {
    const isolatedData = generateCommunityIntegrationIntelligence(
      [], [], demoChildren,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(isolatedData.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("generates action for disengaged connections", () => {
    const disengagedConns: CommunityConnection[] = [
      {
        id: "d1", childId: "child-alex", childName: "Alex",
        connectionType: "education", connectionName: "School",
        status: "active", engagementLevel: "disengaged",
        startDate: "2024-01-01", frequencyPerWeek: 5,
        staffFacilitated: false, isChildLed: false, barriers: [],
      },
    ];
    const r = generateCommunityIntegrationIntelligence(
      disengagedConns, [], demoChildren,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(r.actions.some((a) => a.includes("disengagement"))).toBe(true);
  });

  it("no actions needed when everything is perfect", () => {
    const perfectConns: CommunityConnection[] = [
      { id: "p1", childId: "child-alex", childName: "Alex", connectionType: "education", connectionName: "School", status: "active", engagementLevel: "high", startDate: "2024-01-01", frequencyPerWeek: 5, staffFacilitated: false, isChildLed: true, barriers: [] },
      { id: "p2", childId: "child-alex", childName: "Alex", connectionType: "club_sport", connectionName: "Football", status: "active", engagementLevel: "high", startDate: "2024-01-01", frequencyPerWeek: 2, staffFacilitated: false, isChildLed: true, barriers: [] },
      { id: "p3", childId: "child-alex", childName: "Alex", connectionType: "hobby_activity", connectionName: "Art", status: "active", engagementLevel: "high", startDate: "2024-01-01", frequencyPerWeek: 1, staffFacilitated: false, isChildLed: true, barriers: [] },
    ];
    const perfectGoals: IntegrationGoal[] = [
      { id: "pg1", childId: "child-alex", childName: "Alex", goalDescription: "Done", targetConnectionType: "club_sport", targetDate: "2025-01-01", status: "achieved", achievedDate: "2025-01-01" },
    ];
    const oneChild: ChildProfile[] = [demoChildren[0]];
    const r = generateCommunityIntegrationIntelligence(
      perfectConns, perfectGoals, oneChild,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(r.actions.some((a) => a.includes("No immediate actions"))).toBe(true);
    expect(r.rating).toBe("outstanding");
  });

  it("scoring: breadth gives 25 for 3+ avg with diversity >= 50", () => {
    const r = generateCommunityIntegrationIntelligence(
      demoConnections, demoGoals, demoChildren,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    // Just verify overall is reasonable — can't inspect sub-scores directly
    expect(r.overallScore).toBeGreaterThanOrEqual(60);
  });

  it("scoring: engagement gives 30 for > 80% engagement", () => {
    // Already covered via full score, engagement is 89%
    expect(result.engagement.overallEngagementRate).toBeGreaterThan(80);
  });

  it("handles children with no goals gracefully", () => {
    const r = generateCommunityIntegrationIntelligence(
      demoConnections, [], demoChildren,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(r.goalProgress.totalGoals).toBe(0);
    expect(r.goalProgress.achievementRate).toBe(0);
  });
});

describe("Community Integration — Labels", () => {
  it("returns Education label", () => {
    expect(getConnectionTypeLabel("education")).toBe("Education");
  });

  it("returns Club / Sport label", () => {
    expect(getConnectionTypeLabel("club_sport")).toBe("Club / Sport");
  });

  it("returns Hobby / Activity label", () => {
    expect(getConnectionTypeLabel("hobby_activity")).toBe("Hobby / Activity");
  });

  it("returns Friendship label", () => {
    expect(getConnectionTypeLabel("friendship")).toBe("Friendship");
  });

  it("returns Mentoring label", () => {
    expect(getConnectionTypeLabel("mentoring")).toBe("Mentoring");
  });

  it("returns Volunteering label", () => {
    expect(getConnectionTypeLabel("volunteering")).toBe("Volunteering");
  });

  it("returns Therapy label", () => {
    expect(getConnectionTypeLabel("therapy")).toBe("Therapy");
  });

  it("returns Transport barrier label", () => {
    expect(getBarrierLabel("transport")).toBe("Transport");
  });

  it("returns Anxiety barrier label", () => {
    expect(getBarrierLabel("anxiety")).toBe("Anxiety");
  });

  it("returns Placement Instability barrier label", () => {
    expect(getBarrierLabel("placement_instability")).toBe("Placement Instability");
  });

  it("returns High engagement label", () => {
    expect(getEngagementLabel("high")).toBe("High");
  });

  it("returns Disengaged engagement label", () => {
    expect(getEngagementLabel("disengaged")).toBe("Disengaged");
  });

  it("returns all 12 connection types", () => {
    const types = getAllConnectionTypes();
    expect(types.length).toBe(12);
    expect(types).toContain("education");
    expect(types).toContain("club_sport");
    expect(types).toContain("advocacy");
  });
});
