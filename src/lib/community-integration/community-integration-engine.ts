// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Community Integration Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// "Children should be helped to develop and maintain positive relationships
//  and be involved in their communities."
// — SCCIF 2023
//
// Regulatory framework:
//   CHR 2015 Reg 9           — Enjoyment and achievement
//   CHR 2015 Reg 7           — Positive relationships
//   UNCRC Article 31         — Right to leisure, play, and cultural life
//   SCCIF                    — "Experiences and progress of children"
//   CHR 2015 Reg 6           — Quality of care (health, education, wellbeing)
//   CHR 2015 Reg 5           — Statement of purpose (community engagement)
//
// Key principles:
//   1. Children in care should be well-connected to their communities
//   2. Connections should be diverse — education, clubs, hobbies, friendships
//   3. Child-led activities are a strong indicator of genuine engagement
//   4. Barriers to community participation must be identified and reduced
//   5. Integration goals should be set, tracked, and achieved
//   6. Isolation is a safeguarding concern — 0 connections is a red flag
//   7. Staff-facilitated activities should transition to independence
//   8. Cultural and identity needs should be reflected in community links
//
// Scoring breakdown (0-100):
//   Connection breadth:      25  — Number and diversity of connections per child
//   Engagement quality:      30  — Active participation, child-led choices
//   Barrier reduction:       20  — Fewer barriers = better integration
//   Goal progress:           25  — Achievement of integration goals
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConnectionType =
  | "education"
  | "club_sport"
  | "hobby_activity"
  | "friendship"
  | "mentoring"
  | "faith_community"
  | "volunteering"
  | "employment"
  | "health_service"
  | "therapy"
  | "cultural_group"
  | "advocacy";

export type ConnectionStatus = "active" | "paused" | "ended" | "planned";

export type EngagementLevel = "high" | "moderate" | "low" | "disengaged";

export type BarrierType =
  | "transport"
  | "funding"
  | "anxiety"
  | "peer_conflict"
  | "placement_instability"
  | "staff_availability"
  | "stigma"
  | "health"
  | "behaviour_restrictions"
  | "timing";

// ── Data Models ───────────────────────────────────────────────────────────────

export interface CommunityConnection {
  id: string;
  childId: string;
  childName: string;
  connectionType: ConnectionType;
  connectionName: string;
  status: ConnectionStatus;
  engagementLevel: EngagementLevel;
  startDate: string;
  endDate?: string;
  frequencyPerWeek: number;
  staffFacilitated: boolean;
  isChildLed: boolean;
  barriers: BarrierType[];
  notes?: string;
}

export interface IntegrationGoal {
  id: string;
  childId: string;
  childName: string;
  goalDescription: string;
  targetConnectionType: ConnectionType;
  targetDate: string;
  status: "not_started" | "in_progress" | "achieved" | "revised" | "discontinued";
  achievedDate?: string;
}

export interface ChildProfile {
  childId: string;
  childName: string;
  age: number;
  placementStartDate: string;
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface BreadthResult {
  totalChildren: number;
  totalActiveConnections: number;
  avgConnectionsPerChild: number;
  childrenWithZeroConnections: number;
  childrenWithOneConnection: number;
  connectionTypeDistribution: Record<string, number>;
  diversityScore: number; // 0-100
}

export interface EngagementResult {
  totalActive: number;
  highEngagement: number;
  moderateEngagement: number;
  lowEngagement: number;
  disengaged: number;
  overallEngagementRate: number;
  childLedRate: number;
  staffFacilitatedRate: number;
}

export interface BarrierResult {
  totalBarriers: number;
  barrierDistribution: Record<string, number>;
  childrenWithBarriers: number;
  mostCommonBarrier: string | null;
  barriersPerChildAvg: number;
}

export interface GoalProgressResult {
  totalGoals: number;
  achieved: number;
  inProgress: number;
  notStarted: number;
  revised: number;
  discontinued: number;
  achievementRate: number;
  overdueGoals: number;
}

export interface ChildIntegrationProfile {
  childId: string;
  childName: string;
  age: number;
  activeConnections: number;
  connectionTypes: ConnectionType[];
  engagementScore: number;
  barriers: BarrierType[];
  goalsTotal: number;
  goalsAchieved: number;
  goalsInProgress: number;
  goalsOverdue: number;
  integrationRating: "excellent" | "good" | "attention_needed" | "isolated";
}

export interface CommunityIntegrationResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  breadth: BreadthResult;
  engagement: EngagementResult;
  barriers: BarrierResult;
  goalProgress: GoalProgressResult;
  childProfiles: ChildIntegrationProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const ALL_CONNECTION_TYPES: ConnectionType[] = [
  "education",
  "club_sport",
  "hobby_activity",
  "friendship",
  "mentoring",
  "faith_community",
  "volunteering",
  "employment",
  "health_service",
  "therapy",
  "cultural_group",
  "advocacy",
];

const CONNECTION_TYPE_LABELS: Record<ConnectionType, string> = {
  education: "Education",
  club_sport: "Club / Sport",
  hobby_activity: "Hobby / Activity",
  friendship: "Friendship",
  mentoring: "Mentoring",
  faith_community: "Faith Community",
  volunteering: "Volunteering",
  employment: "Employment",
  health_service: "Health Service",
  therapy: "Therapy",
  cultural_group: "Cultural Group",
  advocacy: "Advocacy",
};

const BARRIER_LABELS: Record<BarrierType, string> = {
  transport: "Transport",
  funding: "Funding",
  anxiety: "Anxiety",
  peer_conflict: "Peer Conflict",
  placement_instability: "Placement Instability",
  staff_availability: "Staff Availability",
  stigma: "Stigma",
  health: "Health",
  behaviour_restrictions: "Behaviour Restrictions",
  timing: "Timing",
};

const ENGAGEMENT_LEVEL_LABELS: Record<EngagementLevel, string> = {
  high: "High",
  moderate: "Moderate",
  low: "Low",
  disengaged: "Disengaged",
};

// ── Label Functions ──────────────────────────────────────────────────────────

export function getConnectionTypeLabel(t: ConnectionType): string {
  return CONNECTION_TYPE_LABELS[t] ?? t.replace(/_/g, " ");
}

export function getBarrierLabel(b: BarrierType): string {
  return BARRIER_LABELS[b] ?? b.replace(/_/g, " ");
}

export function getEngagementLabel(e: EngagementLevel): string {
  return ENGAGEMENT_LEVEL_LABELS[e] ?? e.replace(/_/g, " ");
}

export function getAllConnectionTypes(): ConnectionType[] {
  return [...ALL_CONNECTION_TYPES];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ── Core Functions ───────────────────────────────────────────────────────────

export function evaluateConnectionBreadth(
  connections: CommunityConnection[],
  children: ChildProfile[],
  referenceDate: string,
): BreadthResult {
  const totalChildren = children.length;

  // Active connections as of reference date
  const activeConnections = connections.filter(
    (c) => c.status === "active" && c.startDate <= referenceDate,
  );
  const totalActiveConnections = activeConnections.length;

  // Per-child connection counts
  const childConnectionCounts = new Map<string, number>();
  const childConnectionTypes = new Map<string, Set<string>>();

  for (const child of children) {
    childConnectionCounts.set(child.childId, 0);
    childConnectionTypes.set(child.childId, new Set());
  }

  for (const conn of activeConnections) {
    const current = childConnectionCounts.get(conn.childId) ?? 0;
    childConnectionCounts.set(conn.childId, current + 1);
    const types = childConnectionTypes.get(conn.childId) ?? new Set();
    types.add(conn.connectionType);
    childConnectionTypes.set(conn.childId, types);
  }

  const avgConnectionsPerChild =
    totalChildren === 0 ? 0 : round1(totalActiveConnections / totalChildren);

  const childrenWithZeroConnections = [...childConnectionCounts.values()].filter(
    (count) => count === 0,
  ).length;

  const childrenWithOneConnection = [...childConnectionCounts.values()].filter(
    (count) => count === 1,
  ).length;

  // Connection type distribution
  const connectionTypeDistribution: Record<string, number> = {};
  for (const conn of activeConnections) {
    connectionTypeDistribution[conn.connectionType] =
      (connectionTypeDistribution[conn.connectionType] ?? 0) + 1;
  }

  // Diversity score: based on average unique connection types per child
  // Max possible types = 12, but realistically 4+ types is excellent for a child
  let diversityScore = 0;
  if (totalChildren > 0) {
    const totalUniqueTypes = [...childConnectionTypes.values()].reduce(
      (sum, types) => sum + types.size,
      0,
    );
    const avgUniqueTypes = totalUniqueTypes / totalChildren;
    // Scale: 0 types = 0, 1 type = 25, 2 types = 50, 3 types = 75, 4+ types = 100
    diversityScore = Math.min(100, Math.round(avgUniqueTypes * 25));
  }

  return {
    totalChildren,
    totalActiveConnections,
    avgConnectionsPerChild,
    childrenWithZeroConnections,
    childrenWithOneConnection,
    connectionTypeDistribution,
    diversityScore,
  };
}

export function evaluateEngagement(
  connections: CommunityConnection[],
  referenceDate: string,
): EngagementResult {
  const activeConnections = connections.filter(
    (c) => c.status === "active" && c.startDate <= referenceDate,
  );
  const totalActive = activeConnections.length;

  const highEngagement = activeConnections.filter(
    (c) => c.engagementLevel === "high",
  ).length;
  const moderateEngagement = activeConnections.filter(
    (c) => c.engagementLevel === "moderate",
  ).length;
  const lowEngagement = activeConnections.filter(
    (c) => c.engagementLevel === "low",
  ).length;
  const disengaged = activeConnections.filter(
    (c) => c.engagementLevel === "disengaged",
  ).length;

  const engaged = highEngagement + moderateEngagement;
  const overallEngagementRate = pct(engaged, totalActive);

  const childLedCount = activeConnections.filter((c) => c.isChildLed).length;
  const childLedRate = pct(childLedCount, totalActive);

  const staffFacilitatedCount = activeConnections.filter(
    (c) => c.staffFacilitated,
  ).length;
  const staffFacilitatedRate = pct(staffFacilitatedCount, totalActive);

  return {
    totalActive,
    highEngagement,
    moderateEngagement,
    lowEngagement,
    disengaged,
    overallEngagementRate,
    childLedRate,
    staffFacilitatedRate,
  };
}

export function evaluateBarriers(
  connections: CommunityConnection[],
  referenceDate: string,
): BarrierResult {
  // Consider all connections (active, paused, ended) — barriers are relevant across all
  const relevantConnections = connections.filter(
    (c) => c.startDate <= referenceDate,
  );

  // Collect all barriers
  const allBarriers: BarrierType[] = [];
  const childrenWithBarriersSet = new Set<string>();
  const barrierDistribution: Record<string, number> = {};

  for (const conn of relevantConnections) {
    for (const barrier of conn.barriers) {
      allBarriers.push(barrier);
      childrenWithBarriersSet.add(conn.childId);
      barrierDistribution[barrier] = (barrierDistribution[barrier] ?? 0) + 1;
    }
  }

  const totalBarriers = allBarriers.length;
  const childrenWithBarriers = childrenWithBarriersSet.size;

  // Find most common barrier
  let mostCommonBarrier: string | null = null;
  let maxCount = 0;
  for (const [barrier, count] of Object.entries(barrierDistribution)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonBarrier = barrier;
    }
  }

  // Unique children in relevant connections
  const uniqueChildren = new Set(relevantConnections.map((c) => c.childId));
  const barriersPerChildAvg =
    uniqueChildren.size === 0 ? 0 : round1(totalBarriers / uniqueChildren.size);

  return {
    totalBarriers,
    barrierDistribution,
    childrenWithBarriers,
    mostCommonBarrier,
    barriersPerChildAvg,
  };
}

export function evaluateGoalProgress(
  goals: IntegrationGoal[],
  referenceDate: string,
): GoalProgressResult {
  const totalGoals = goals.length;

  const achieved = goals.filter((g) => g.status === "achieved").length;
  const inProgress = goals.filter((g) => g.status === "in_progress").length;
  const notStarted = goals.filter((g) => g.status === "not_started").length;
  const revised = goals.filter((g) => g.status === "revised").length;
  const discontinued = goals.filter((g) => g.status === "discontinued").length;

  const achievementRate = pct(achieved, totalGoals);

  // Overdue: target date has passed and not achieved/discontinued
  const overdueGoals = goals.filter(
    (g) =>
      g.targetDate < referenceDate &&
      g.status !== "achieved" &&
      g.status !== "discontinued",
  ).length;

  return {
    totalGoals,
    achieved,
    inProgress,
    notStarted,
    revised,
    discontinued,
    achievementRate,
    overdueGoals,
  };
}

export function buildChildProfiles(
  connections: CommunityConnection[],
  goals: IntegrationGoal[],
  children: ChildProfile[],
  referenceDate: string,
): ChildIntegrationProfile[] {
  return children.map((child) => {
    // Active connections for this child
    const childConnections = connections.filter(
      (c) =>
        c.childId === child.childId &&
        c.status === "active" &&
        c.startDate <= referenceDate,
    );
    const activeConnections = childConnections.length;

    // Unique connection types
    const connectionTypes = [
      ...new Set(childConnections.map((c) => c.connectionType)),
    ] as ConnectionType[];

    // Engagement score: high=100, moderate=66, low=33, disengaged=0
    const engagementMap: Record<string, number> = {
      high: 100,
      moderate: 66,
      low: 33,
      disengaged: 0,
    };
    const engagementScore =
      activeConnections === 0
        ? 0
        : Math.round(
            childConnections.reduce(
              (sum, c) => sum + (engagementMap[c.engagementLevel] ?? 0),
              0,
            ) / activeConnections,
          );

    // All barriers for this child (across all connections, not just active)
    const allChildConnections = connections.filter(
      (c) => c.childId === child.childId && c.startDate <= referenceDate,
    );
    const barriers = [
      ...new Set(allChildConnections.flatMap((c) => c.barriers)),
    ] as BarrierType[];

    // Goals for this child
    const childGoals = goals.filter((g) => g.childId === child.childId);
    const goalsTotal = childGoals.length;
    const goalsAchieved = childGoals.filter(
      (g) => g.status === "achieved",
    ).length;
    const goalsInProgress = childGoals.filter(
      (g) => g.status === "in_progress",
    ).length;
    const goalsOverdue = childGoals.filter(
      (g) =>
        g.targetDate < referenceDate &&
        g.status !== "achieved" &&
        g.status !== "discontinued",
    ).length;

    // Integration rating
    let integrationRating: ChildIntegrationProfile["integrationRating"];
    if (activeConnections === 0) {
      integrationRating = "isolated";
    } else if (
      activeConnections >= 3 &&
      engagementScore >= 60 &&
      connectionTypes.length >= 2
    ) {
      integrationRating = "excellent";
    } else if (activeConnections >= 2 && engagementScore >= 40) {
      integrationRating = "good";
    } else {
      integrationRating = "attention_needed";
    }

    return {
      childId: child.childId,
      childName: child.childName,
      age: child.age,
      activeConnections,
      connectionTypes,
      engagementScore,
      barriers,
      goalsTotal,
      goalsAchieved,
      goalsInProgress,
      goalsOverdue,
      integrationRating,
    };
  });
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generateCommunityIntegrationIntelligence(
  connections: CommunityConnection[],
  goals: IntegrationGoal[],
  children: ChildProfile[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): CommunityIntegrationResult {
  const breadth = evaluateConnectionBreadth(connections, children, referenceDate);
  const engagement = evaluateEngagement(connections, referenceDate);
  const barriers = evaluateBarriers(connections, referenceDate);
  const goalProgress = evaluateGoalProgress(goals, referenceDate);
  const childProfiles = buildChildProfiles(connections, goals, children, referenceDate);

  // ── Scoring ──────────────────────────────────────────────────────────

  // 1. Breadth (25 pts): based on avgConnections per child and diversity
  let breadthScore = 0;
  if (breadth.avgConnectionsPerChild >= 3 && breadth.diversityScore >= 50) {
    breadthScore = 25;
  } else if (breadth.avgConnectionsPerChild >= 2) {
    breadthScore = 18;
  } else if (breadth.avgConnectionsPerChild >= 1) {
    breadthScore = 10;
  } else if (children.length > 0) {
    breadthScore = 2;
  }

  // 2. Engagement (30 pts): based on engagement rates
  let engagementScore = 0;
  if (engagement.overallEngagementRate > 80) {
    engagementScore = 30;
  } else if (engagement.overallEngagementRate > 60) {
    engagementScore = 22;
  } else if (engagement.overallEngagementRate > 40) {
    engagementScore = 14;
  } else if (engagement.totalActive > 0) {
    engagementScore = 5;
  }

  // 3. Barriers (20 pts): lower barriers = higher score
  let barrierScore = 0;
  if (children.length === 0) {
    barrierScore = 0;
  } else if (barriers.barriersPerChildAvg === 0) {
    barrierScore = 20;
  } else if (barriers.barriersPerChildAvg < 1) {
    barrierScore = 15;
  } else if (barriers.barriersPerChildAvg < 2) {
    barrierScore = 10;
  } else {
    barrierScore = 5;
  }

  // 4. Goal Progress (25 pts): based on achievement rate and overdue goals
  let goalScore = 0;
  if (goalProgress.totalGoals > 0) {
    if (goalProgress.achievementRate > 70) {
      goalScore = 25;
    } else if (goalProgress.achievementRate > 50) {
      goalScore = 18;
    } else if (goalProgress.achievementRate > 30) {
      goalScore = 12;
    } else {
      goalScore = 5;
    }
    // Deduct for overdue goals: 2 points per overdue goal, max 10 deduction
    const overdueDeduction = Math.min(10, goalProgress.overdueGoals * 2);
    goalScore = Math.max(0, goalScore - overdueDeduction);
  }

  const overallScore = Math.min(
    100,
    Math.max(0, breadthScore + engagementScore + barrierScore + goalScore),
  );

  const rating: CommunityIntegrationResult["rating"] =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths / Areas / Actions ──────────────────────────────────────

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  // Strengths
  if (breadth.avgConnectionsPerChild >= 3) {
    strengths.push(
      `Children have an average of ${breadth.avgConnectionsPerChild} community connections each — strong breadth`,
    );
  }
  if (breadth.childrenWithZeroConnections === 0 && children.length > 0) {
    strengths.push("All children have at least one community connection — no child is isolated");
  }
  if (engagement.childLedRate >= 50 && engagement.totalActive > 0) {
    strengths.push(
      `${engagement.childLedRate}% of connections are child-led — children are choosing their own activities`,
    );
  }
  if (engagement.overallEngagementRate >= 80 && engagement.totalActive > 0) {
    strengths.push("High overall engagement rate — children are actively participating");
  }
  if (goalProgress.achievementRate >= 70 && goalProgress.totalGoals > 0) {
    strengths.push(
      `${goalProgress.achievementRate}% of integration goals achieved — strong goal delivery`,
    );
  }
  if (barriers.totalBarriers === 0 && children.length > 0) {
    strengths.push("No barriers to community participation identified");
  }
  if (breadth.diversityScore >= 75) {
    strengths.push("Good diversity of connection types across children");
  }
  if (strengths.length === 0) {
    strengths.push(
      "No significant strengths identified — community integration requires attention",
    );
  }

  // Areas for improvement
  if (breadth.childrenWithZeroConnections > 0) {
    areasForImprovement.push(
      `${breadth.childrenWithZeroConnections} child${breadth.childrenWithZeroConnections !== 1 ? "ren have" : " has"} zero community connections — isolation risk`,
    );
  }
  if (breadth.childrenWithOneConnection > 0) {
    areasForImprovement.push(
      `${breadth.childrenWithOneConnection} child${breadth.childrenWithOneConnection !== 1 ? "ren have" : " has"} only one community connection — limited integration`,
    );
  }
  if (engagement.overallEngagementRate < 60 && engagement.totalActive > 0) {
    areasForImprovement.push(
      `Overall engagement rate is ${engagement.overallEngagementRate}% — children need more support to participate meaningfully`,
    );
  }
  if (engagement.childLedRate < 40 && engagement.totalActive > 0) {
    areasForImprovement.push(
      `Only ${engagement.childLedRate}% of activities are child-led — explore children's interests more`,
    );
  }
  if (goalProgress.overdueGoals > 0) {
    areasForImprovement.push(
      `${goalProgress.overdueGoals} integration goal${goalProgress.overdueGoals !== 1 ? "s are" : " is"} overdue — review and update targets`,
    );
  }
  if (barriers.barriersPerChildAvg >= 2) {
    areasForImprovement.push(
      `Average of ${barriers.barriersPerChildAvg} barriers per child — systemic barrier reduction needed`,
    );
  }
  if (breadth.diversityScore < 50 && children.length > 0) {
    areasForImprovement.push(
      "Low diversity of connection types — explore broader range of activities",
    );
  }
  if (areasForImprovement.length === 0) {
    areasForImprovement.push("No significant areas for improvement identified");
  }

  // Actions
  if (breadth.childrenWithZeroConnections > 0) {
    const isolatedChildren = childProfiles
      .filter((p) => p.integrationRating === "isolated")
      .map((p) => p.childName);
    actions.push(
      `URGENT: ${isolatedChildren.join(", ")} ha${isolatedChildren.length !== 1 ? "ve" : "s"} no community connections — arrange activity taster sessions immediately`,
    );
  }
  if (engagement.disengaged > 0) {
    actions.push(
      `HIGH: ${engagement.disengaged} connection${engagement.disengaged !== 1 ? "s show" : " shows"} disengagement — review with child and consider alternatives`,
    );
  }
  if (goalProgress.overdueGoals > 0) {
    actions.push(
      `MEDIUM: ${goalProgress.overdueGoals} overdue goal${goalProgress.overdueGoals !== 1 ? "s" : ""} — hold review meeting to revise or support completion`,
    );
  }
  if (barriers.mostCommonBarrier) {
    actions.push(
      `MEDIUM: "${getBarrierLabel(barriers.mostCommonBarrier as BarrierType)}" is the most common barrier — develop a targeted plan to address this`,
    );
  }
  if (engagement.childLedRate < 40 && engagement.totalActive > 0) {
    actions.push(
      "LOW: Improve child-led activity rate — hold 1:1 conversations about interests and preferences",
    );
  }
  if (actions.length === 0) {
    actions.push(
      "No immediate actions required — community integration is well maintained",
    );
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 9 — Enjoyment and achievement",
    "CHR 2015 Reg 7 — Positive relationships",
    "UNCRC Article 31 — Right to leisure, play, and cultural life",
    "SCCIF — Experiences and progress of children",
    "CHR 2015 Reg 6 — Quality of care",
    "CHR 2015 Reg 5 — Statement of purpose (community engagement)",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    breadth,
    engagement,
    barriers,
    goalProgress,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
