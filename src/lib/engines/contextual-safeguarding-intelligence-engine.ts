// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTEXTUAL SAFEGUARDING INTELLIGENCE ENGINE
//
// Pure deterministic engine that analyses exploitation screening coverage,
// child risk levels, locality risk mapping, safety plan status, referral
// tracking, and screening currency to produce:
// - Screening coverage overview (per-type analysis)
// - Child risk profiles (individual risk assessment)
// - Locality risk summaries (contextual environmental threats)
// - Auto-generated alerts and Cara contextual insights (deterministic)
//
// Key regulatory requirements:
//   Reg 12 — Protection from harm, extra-familial risks
//   Reg 13 — Leadership and management
//   Reg 34 — Fitness of workers to safeguard
//   SCCIF: "Helped & Protected" — contextual safeguarding evidence
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ExploitationScreeningInput {
  id: string;
  child_id: string;
  screening_type: string; // cse, cce, online, radicalisation, peer_on_peer
  date: string;
  risk_level: string; // high, moderate, emerging, no_concern
  screened_by: string;
  referral_made: boolean;
  referral_to: string;
  safety_plan_in_place: boolean;
  next_screening_due: string;
}

export interface LocalityRiskInput {
  id: string;
  location_name: string;
  location_type: string; // park, transport_hub, venue, residential, online, school
  risk_type: string; // drug_dealing, grooming, gang_activity, exploitation, online_harm
  risk_level: string; // high, medium, low
  last_reviewed: string;
  mitigations: string[];
}

export interface ChildRef {
  id: string;
  name: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface ContextualSafeguardingOverview {
  children_screened: number;
  total_children: number;
  screening_coverage_rate: number;
  high_risk_children: number;
  moderate_risk_children: number;
  emerging_risk_children: number;
  overdue_screenings: number;
  active_safety_plans: number;
  referrals_made: number;
  locality_risks_total: number;
  high_risk_locations: number;
}

export interface ScreeningTypeCoverage {
  screening_type: string;
  type_label: string;
  children_screened: number;
  high_risk_count: number;
  overdue_count: number;
}

export interface ChildRiskProfile {
  child_id: string;
  child_name: string;
  highest_risk_level: string;
  screenings_completed: number;
  screenings_overdue: number;
  has_safety_plan: boolean;
  referrals_count: number;
}

export interface LocalityRiskSummary {
  location_name: string;
  location_type: string;
  risk_type: string;
  risk_level: string;
  mitigations_count: number;
}

export interface ContextualSafeguardingAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraContextualInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ContextualSafeguardingIntelligenceResult {
  overview: ContextualSafeguardingOverview;
  screening_coverage: ScreeningTypeCoverage[];
  child_risk_profiles: ChildRiskProfile[];
  locality_risks: LocalityRiskSummary[];
  alerts: ContextualSafeguardingAlert[];
  insights: CaraContextualInsight[];
}

export interface ContextualSafeguardingIntelligenceInput {
  screenings: ExploitationScreeningInput[];
  localityRisks: LocalityRiskInput[];
  children: ChildRef[];
  staff: StaffRef[];
  today?: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const SCREENING_TYPES = ["cse", "cce", "online", "radicalisation", "peer_on_peer"] as const;

const TYPE_LABELS: Record<string, string> = {
  cse: "CSE",
  cce: "CCE / County Lines",
  online: "Online",
  radicalisation: "Radicalisation",
  peer_on_peer: "Peer-on-Peer",
};

const RISK_LEVEL_PRIORITY: Record<string, number> = {
  high: 4,
  moderate: 3,
  emerging: 2,
  no_concern: 1,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}

function getRiskLevelPriority(level: string): number {
  return RISK_LEVEL_PRIORITY[level] ?? 0;
}

function getHighestRisk(levels: string[]): string {
  if (levels.length === 0) return "no_concern";
  return levels.reduce((highest, current) =>
    getRiskLevelPriority(current) > getRiskLevelPriority(highest) ? current : highest
  , levels[0]);
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function computeContextualSafeguardingIntelligence(
  input: ContextualSafeguardingIntelligenceInput
): ContextualSafeguardingIntelligenceResult {
  const { screenings, localityRisks, children, today: todayParam } = input;
  const today = todayParam ?? todayStr();

  // ── Screening Coverage Analysis ─────────────────────────────────────────
  const screeningCoverage = computeScreeningCoverage(screenings, children, today);

  // ── Child Risk Profiles ─────────────────────────────────────────────────
  const childRiskProfiles = computeChildRiskProfiles(screenings, children, today);

  // ── Locality Risk Summaries ─────────────────────────────────────────────
  const localityRiskSummaries = computeLocalityRiskSummaries(localityRisks);

  // ── Overview ────────────────────────────────────────────────────────────
  const overview = computeOverview(screenings, localityRisks, children, childRiskProfiles, today);

  // ── Alerts ──────────────────────────────────────────────────────────────
  const alerts = computeAlerts(screenings, localityRisks, children, childRiskProfiles, today);

  // ── Insights ────────────────────────────────────────────────────────────
  const insights = computeInsights(overview, screenings, localityRisks, childRiskProfiles);

  return {
    overview,
    screening_coverage: screeningCoverage,
    child_risk_profiles: childRiskProfiles,
    locality_risks: localityRiskSummaries,
    alerts,
    insights,
  };
}

// ── Sub-Computations ────────────────────────────────────────────────────────

function computeScreeningCoverage(
  screenings: ExploitationScreeningInput[],
  children: ChildRef[],
  today: string
): ScreeningTypeCoverage[] {
  return SCREENING_TYPES.map((type) => {
    const typeScreenings = screenings.filter((s) => s.screening_type === type);
    const childrenScreened = new Set(typeScreenings.map((s) => s.child_id)).size;
    const highRiskCount = new Set(
      typeScreenings.filter((s) => s.risk_level === "high").map((s) => s.child_id)
    ).size;
    const overdueCount = typeScreenings.filter(
      (s) => s.next_screening_due < today
    ).length;

    return {
      screening_type: type,
      type_label: TYPE_LABELS[type] ?? type,
      children_screened: childrenScreened,
      high_risk_count: highRiskCount,
      overdue_count: overdueCount,
    };
  });
}

function computeChildRiskProfiles(
  screenings: ExploitationScreeningInput[],
  children: ChildRef[],
  today: string
): ChildRiskProfile[] {
  return children.map((child) => {
    const childScreenings = screenings.filter((s) => s.child_id === child.id);
    const riskLevels = childScreenings.map((s) => s.risk_level);
    const highestRiskLevel = getHighestRisk(riskLevels);
    const screeningsOverdue = childScreenings.filter(
      (s) => s.next_screening_due < today
    ).length;
    const hasSafetyPlan = childScreenings.some((s) => s.safety_plan_in_place);
    const referralsCount = childScreenings.filter((s) => s.referral_made).length;

    return {
      child_id: child.id,
      child_name: child.name,
      highest_risk_level: highestRiskLevel,
      screenings_completed: childScreenings.length,
      screenings_overdue: screeningsOverdue,
      has_safety_plan: hasSafetyPlan,
      referrals_count: referralsCount,
    };
  });
}

function computeLocalityRiskSummaries(localityRisks: LocalityRiskInput[]): LocalityRiskSummary[] {
  return localityRisks.map((lr) => ({
    location_name: lr.location_name,
    location_type: lr.location_type,
    risk_type: lr.risk_type,
    risk_level: lr.risk_level,
    mitigations_count: lr.mitigations.length,
  }));
}

function computeOverview(
  screenings: ExploitationScreeningInput[],
  localityRisks: LocalityRiskInput[],
  children: ChildRef[],
  childRiskProfiles: ChildRiskProfile[],
  today: string
): ContextualSafeguardingOverview {
  const childrenScreenedSet = new Set(screenings.map((s) => s.child_id));
  const childrenScreened = childrenScreenedSet.size;
  const totalChildren = children.length;

  const screeningCoverageRate = totalChildren === 0
    ? 100
    : Math.round((childrenScreened / totalChildren) * 100);

  const highRiskChildren = childRiskProfiles.filter(
    (p) => p.highest_risk_level === "high"
  ).length;
  const moderateRiskChildren = childRiskProfiles.filter(
    (p) => p.highest_risk_level === "moderate"
  ).length;
  const emergingRiskChildren = childRiskProfiles.filter(
    (p) => p.highest_risk_level === "emerging"
  ).length;

  const overdueScreenings = screenings.filter(
    (s) => s.next_screening_due < today
  ).length;

  const activeSafetyPlans = screenings.filter((s) => s.safety_plan_in_place).length;
  const referralsMade = screenings.filter((s) => s.referral_made).length;

  const localityRisksTotal = localityRisks.length;
  const highRiskLocations = localityRisks.filter(
    (lr) => lr.risk_level === "high"
  ).length;

  return {
    children_screened: childrenScreened,
    total_children: totalChildren,
    screening_coverage_rate: screeningCoverageRate,
    high_risk_children: highRiskChildren,
    moderate_risk_children: moderateRiskChildren,
    emerging_risk_children: emergingRiskChildren,
    overdue_screenings: overdueScreenings,
    active_safety_plans: activeSafetyPlans,
    referrals_made: referralsMade,
    locality_risks_total: localityRisksTotal,
    high_risk_locations: highRiskLocations,
  };
}

function computeAlerts(
  screenings: ExploitationScreeningInput[],
  localityRisks: LocalityRiskInput[],
  children: ChildRef[],
  childRiskProfiles: ChildRiskProfile[],
  today: string
): ContextualSafeguardingAlert[] {
  const alerts: ContextualSafeguardingAlert[] = [];

  // CRITICAL: Any child at high risk without a safety plan
  for (const profile of childRiskProfiles) {
    if (profile.highest_risk_level === "high" && !profile.has_safety_plan) {
      alerts.push({
        severity: "critical",
        message: `${profile.child_name} is at high risk of exploitation without an active safety plan`,
      });
    }
  }

  // CRITICAL: Screening overdue > 30 days for high-risk child
  for (const profile of childRiskProfiles) {
    if (profile.highest_risk_level === "high") {
      const childScreenings = screenings.filter((s) => s.child_id === profile.child_id);
      for (const screening of childScreenings) {
        if (screening.next_screening_due < today) {
          const daysOverdue = daysBetween(screening.next_screening_due, today);
          if (daysOverdue > 30) {
            alerts.push({
              severity: "critical",
              message: `${profile.child_name} has a ${TYPE_LABELS[screening.screening_type] ?? screening.screening_type} screening overdue by ${daysOverdue} days — high-risk child requires immediate review`,
            });
          }
        }
      }
    }
  }

  // HIGH: Screening overdue for any child
  for (const screening of screenings) {
    if (screening.next_screening_due < today) {
      const child = children.find((c) => c.id === screening.child_id);
      const childName = child?.name ?? screening.child_id;
      const profile = childRiskProfiles.find((p) => p.child_id === screening.child_id);
      // Only add as high if not already covered by critical (high-risk > 30 days)
      const isHighRiskChild = profile?.highest_risk_level === "high";
      const daysOverdue = daysBetween(screening.next_screening_due, today);
      if (!(isHighRiskChild && daysOverdue > 30)) {
        alerts.push({
          severity: "high",
          message: `${childName} has an overdue ${TYPE_LABELS[screening.screening_type] ?? screening.screening_type} screening (due ${screening.next_screening_due})`,
        });
      }
    }
  }

  // HIGH: High-risk locality with no mitigations documented
  for (const lr of localityRisks) {
    if (lr.risk_level === "high" && lr.mitigations.length === 0) {
      alerts.push({
        severity: "high",
        message: `High-risk location "${lr.location_name}" has no mitigations documented`,
      });
    }
  }

  // MEDIUM: Coverage rate below 80%
  const childrenScreenedSet = new Set(screenings.map((s) => s.child_id));
  const totalChildren = children.length;
  const coverageRate = totalChildren === 0 ? 100 : Math.round((childrenScreenedSet.size / totalChildren) * 100);
  if (coverageRate < 80) {
    alerts.push({
      severity: "medium",
      message: `Screening coverage is at ${coverageRate}% — below the 80% target`,
    });
  }

  // Also check per-type coverage: if not all children screened for all types
  const totalPossibleScreenings = children.length * SCREENING_TYPES.length;
  const actualScreenedCombinations = new Set(
    screenings.map((s) => `${s.child_id}:${s.screening_type}`)
  ).size;
  const fullCoverageRate = totalPossibleScreenings === 0
    ? 100
    : Math.round((actualScreenedCombinations / totalPossibleScreenings) * 100);
  if (fullCoverageRate < 80) {
    alerts.push({
      severity: "medium",
      message: `Full screening coverage across all types is ${fullCoverageRate}% — not all children screened for all exploitation types`,
    });
  }

  // LOW: Locality risk review overdue (last_reviewed > 90 days ago)
  for (const lr of localityRisks) {
    if (lr.last_reviewed) {
      const daysSinceReview = daysBetween(lr.last_reviewed, today);
      if (daysSinceReview > 90) {
        alerts.push({
          severity: "low",
          message: `Locality risk "${lr.location_name}" has not been reviewed for ${daysSinceReview} days`,
        });
      }
    }
  }

  return alerts;
}

function computeInsights(
  overview: ContextualSafeguardingOverview,
  screenings: ExploitationScreeningInput[],
  localityRisks: LocalityRiskInput[],
  childRiskProfiles: ChildRiskProfile[]
): CaraContextualInsight[] {
  const insights: CaraContextualInsight[] = [];

  // CRITICAL: High-risk children without safety plans
  const highRiskWithoutPlan = childRiskProfiles.filter(
    (p) => p.highest_risk_level === "high" && !p.has_safety_plan
  );
  if (highRiskWithoutPlan.length > 0) {
    insights.push({
      severity: "critical",
      text: `${highRiskWithoutPlan.length} child${highRiskWithoutPlan.length > 1 ? "ren" : ""} at high risk of exploitation without safety plans — immediate action needed`,
    });
  }

  // WARNING: Multiple overdue screenings
  if (overview.overdue_screenings > 1) {
    insights.push({
      severity: "warning",
      text: `${overview.overdue_screenings} exploitation screenings are overdue — compliance gap that must be addressed`,
    });
  } else if (overview.overdue_screenings === 1) {
    insights.push({
      severity: "warning",
      text: `1 exploitation screening is overdue — compliance gap that must be addressed`,
    });
  }

  // WARNING: High-risk locations near the home
  if (overview.high_risk_locations > 0) {
    insights.push({
      severity: "warning",
      text: `${overview.high_risk_locations} high-risk location${overview.high_risk_locations > 1 ? "s" : ""} identified in the locality — staff awareness and vigilance needed`,
    });
  }

  // POSITIVE: 100% screening coverage achieved
  if (overview.screening_coverage_rate === 100 && overview.total_children > 0) {
    insights.push({
      severity: "positive",
      text: "100% screening coverage achieved — all children have been screened for exploitation risks",
    });
  }

  // POSITIVE: All high-risk children have safety plans and active referrals
  const highRiskChildren = childRiskProfiles.filter((p) => p.highest_risk_level === "high");
  if (highRiskChildren.length > 0) {
    const allHavePlansAndReferrals = highRiskChildren.every(
      (p) => p.has_safety_plan && p.referrals_count > 0
    );
    if (allHavePlansAndReferrals) {
      insights.push({
        severity: "positive",
        text: "All high-risk children have active safety plans and referrals in place",
      });
    }
  }

  // POSITIVE: No overdue screenings
  if (overview.overdue_screenings === 0 && screenings.length > 0) {
    insights.push({
      severity: "positive",
      text: "No overdue screenings — all exploitation screening reviews are current",
    });
  }

  // Practice grounding — contextual safeguarding (Carlene Firmin) + the
  // guardianship-not-surveillance ethic. Wherever extra-familial risk is held as
  // data, frame it as protection: this is the discipline that stops a risk
  // picture hardening into a watch-list. Surfaces alongside any held risk.
  const hasHeldRisk =
    overview.high_risk_locations > 0 ||
    childRiskProfiles.some((p) => p.highest_risk_level === "high" || p.highest_risk_level === "moderate");
  if (hasHeldRisk) {
    insights.push({
      severity: "positive",
      text: "Apply the contextual-safeguarding lens: assess and disrupt the contexts of harm (peers, places, transport, online), not the child. Treat a young person's survival strategies as constrained choices to understand — and use this risk picture for guardianship (trusted adults, safer spaces), never as surveillance, a watch-list or grounds to criminalise a child. Share contexts, not children's identities, with non-traditional partners.",
    });
  }

  return insights;
}
