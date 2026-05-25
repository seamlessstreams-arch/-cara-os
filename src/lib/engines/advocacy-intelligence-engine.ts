// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ADVOCACY & CHILDREN'S RIGHTS INTELLIGENCE ENGINE
// Pure deterministic engine for advocacy referral analysis.
// Analyses advocacy access, referral timeliness, visit frequency,
// children's participation, and generates ARIA intelligence insights.
// Reg 7: children's wishes and feelings — Reg 14: assessment of needs
// Reg 45: quality of care review — Children Act 1989 s26: advocacy for LAC
// ══════════════════════════════════════════════════════════════════════════════

export interface AdvocacyInput {
  id: string;
  child_id: string;
  advocacy_type: string;
  status: string;
  provider: string;
  advocate_name: string;
  referral_date: string;
  start_date: string | null;
  reason: string;
  issues_raised: string[];
  visit_count: number;
  last_visit_date: string | null;
  child_view: string;
  review_date: string;
}

export interface ChildRef {
  id: string;
  name: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

export interface AdvocacyOverview {
  total_referrals: number;
  active_referrals: number;
  completed_referrals: number;
  pending_referrals: number;
  children_with_active_advocate: number;
  children_without_any_referral: number;
  avg_days_to_start: number;
  total_visits: number;
}

export interface ReferralTypeBreakdown {
  type: string;
  type_label: string;
  count: number;
  active_count: number;
}

export interface ChildAdvocacyProfile {
  child_id: string;
  child_name: string;
  total_referrals: number;
  active_referrals: number;
  has_advocate: boolean;
  issues_raised: string[];
  days_since_last_visit: number | null;
}

export interface AdvocacyAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface AriaAdvocacyInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface AdvocacyIntelligenceResult {
  overview: AdvocacyOverview;
  referral_breakdown: ReferralTypeBreakdown[];
  child_advocacy_profiles: ChildAdvocacyProfile[];
  alerts: AdvocacyAlert[];
  insights: AriaAdvocacyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

const TYPE_LABELS: Record<string, string> = {
  independent: "Independent",
  issue_based: "Issue-Based",
  peer: "Peer",
  legal: "Legal",
  complaints: "Complaints",
};

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeAdvocacyIntelligence(input: {
  referrals: AdvocacyInput[];
  children: ChildRef[];
  staff: StaffRef[];
  today?: string;
}): AdvocacyIntelligenceResult {
  const { referrals, children, staff, today = new Date().toISOString().slice(0, 10) } = input;

  if (referrals.length === 0) {
    return {
      overview: {
        total_referrals: 0,
        active_referrals: 0,
        completed_referrals: 0,
        pending_referrals: 0,
        children_with_active_advocate: 0,
        children_without_any_referral: children.length,
        avg_days_to_start: 0,
        total_visits: 0,
      },
      referral_breakdown: [],
      child_advocacy_profiles: children.map((c) => ({
        child_id: c.id,
        child_name: c.name,
        total_referrals: 0,
        active_referrals: 0,
        has_advocate: false,
        issues_raised: [],
        days_since_last_visit: null,
      })),
      alerts: children.map((c) => ({
        severity: "high" as const,
        message: `Child ${c.name} has never had an advocacy referral — ensure awareness of right to advocacy`,
      })),
      insights: children.map((c) => ({
        severity: "critical" as const,
        text: `${c.name} has never had any advocacy access — Children Act 1989 s26 requires awareness of right to advocacy`,
      })),
    };
  }

  const active = referrals.filter((r) => r.status === "active");
  const completed = referrals.filter((r) => r.status === "completed");
  const pending = referrals.filter((r) => r.status === "pending_referral");

  // ── Overview ────────────────────────────────────────────────────────────

  const childIdsWithActiveReferral = new Set(active.map((r) => r.child_id));
  const childIdsWithAnyReferral = new Set(referrals.map((r) => r.child_id));
  const childrenWithoutReferral = children.filter((c) => !childIdsWithAnyReferral.has(c.id));

  const withStartDate = referrals.filter((r) => r.start_date !== null);
  const avgDaysToStart = withStartDate.length > 0
    ? Math.round(
        withStartDate.reduce((sum, r) => sum + daysBetween(r.referral_date, r.start_date!), 0) /
          withStartDate.length
      )
    : 0;

  const totalVisits = referrals.reduce((sum, r) => sum + r.visit_count, 0);

  const overview: AdvocacyOverview = {
    total_referrals: referrals.length,
    active_referrals: active.length,
    completed_referrals: completed.length,
    pending_referrals: pending.length,
    children_with_active_advocate: childIdsWithActiveReferral.size,
    children_without_any_referral: childrenWithoutReferral.length,
    avg_days_to_start: avgDaysToStart,
    total_visits: totalVisits,
  };

  // ── Referral type breakdown ─────────────────────────────────────────────

  const typeCounts = new Map<string, { count: number; active_count: number }>();
  for (const r of referrals) {
    const existing = typeCounts.get(r.advocacy_type) ?? { count: 0, active_count: 0 };
    existing.count++;
    if (r.status === "active") existing.active_count++;
    typeCounts.set(r.advocacy_type, existing);
  }

  const referral_breakdown: ReferralTypeBreakdown[] = [...typeCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([type, counts]) => ({
      type,
      type_label: typeLabel(type),
      count: counts.count,
      active_count: counts.active_count,
    }));

  // ── Child advocacy profiles ─────────────────────────────────────────────

  const childNameMap = new Map<string, string>();
  for (const c of children) {
    childNameMap.set(c.id, c.name);
  }

  const childProfileMap = new Map<
    string,
    {
      total_referrals: number;
      active_referrals: number;
      has_advocate: boolean;
      issues_raised: Set<string>;
      last_visit_date: string | null;
    }
  >();

  for (const r of referrals) {
    const existing = childProfileMap.get(r.child_id) ?? {
      total_referrals: 0,
      active_referrals: 0,
      has_advocate: false,
      issues_raised: new Set<string>(),
      last_visit_date: null as string | null,
    };

    existing.total_referrals++;
    if (r.status === "active") {
      existing.active_referrals++;
      existing.has_advocate = true;
    }
    for (const issue of r.issues_raised) {
      existing.issues_raised.add(issue);
    }
    if (r.last_visit_date !== null) {
      if (existing.last_visit_date === null || r.last_visit_date > existing.last_visit_date) {
        existing.last_visit_date = r.last_visit_date;
      }
    }

    childProfileMap.set(r.child_id, existing);
  }

  const child_advocacy_profiles: ChildAdvocacyProfile[] = children.map((c) => {
    const profile = childProfileMap.get(c.id);
    if (!profile) {
      return {
        child_id: c.id,
        child_name: c.name,
        total_referrals: 0,
        active_referrals: 0,
        has_advocate: false,
        issues_raised: [],
        days_since_last_visit: null,
      };
    }
    return {
      child_id: c.id,
      child_name: c.name,
      total_referrals: profile.total_referrals,
      active_referrals: profile.active_referrals,
      has_advocate: profile.has_advocate,
      issues_raised: [...profile.issues_raised],
      days_since_last_visit:
        profile.last_visit_date !== null ? daysBetween(profile.last_visit_date, today) : null,
    };
  });

  // ── Alerts ─────────────────────────────────────────────────────────────

  const alerts: AdvocacyAlert[] = [];

  // high: child with no referral history
  for (const c of childrenWithoutReferral) {
    alerts.push({
      severity: "high",
      message: `Child ${c.name} has never had an advocacy referral — ensure awareness of right to advocacy`,
    });
  }

  // high: active referral with no visit in 30+ days
  for (const r of active) {
    if (r.last_visit_date !== null) {
      const daysSince = daysBetween(r.last_visit_date, today);
      if (daysSince >= 30) {
        const name = childNameMap.get(r.child_id) ?? r.child_id;
        alerts.push({
          severity: "high",
          message: `No advocate visit for ${name} in ${daysSince} days — follow up with provider`,
        });
      }
    }
  }

  // medium: pending referral > 10 days
  for (const r of pending) {
    const daysPending = daysBetween(r.referral_date, today);
    if (daysPending > 10) {
      const name = childNameMap.get(r.child_id) ?? r.child_id;
      alerts.push({
        severity: "medium",
        message: `Advocacy referral for ${name} pending for ${daysPending} days — chase provider`,
      });
    }
  }

  // low: review date past today
  for (const r of referrals) {
    if (r.review_date < today) {
      const name = childNameMap.get(r.child_id) ?? r.child_id;
      alerts.push({
        severity: "low",
        message: `Advocacy review overdue for ${name}`,
      });
    }
  }

  alerts.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  // ── Insights ───────────────────────────────────────────────────────────

  const insights: AriaAdvocacyInsight[] = [];

  // critical: child with no advocacy access ever
  for (const c of childrenWithoutReferral) {
    insights.push({
      severity: "critical",
      text: `${c.name} has never had any advocacy access — Children Act 1989 s26 requires awareness of right to advocacy`,
    });
  }

  // warning: stale visits (active referral, no visit 30+ days)
  for (const r of active) {
    if (r.last_visit_date !== null) {
      const daysSince = daysBetween(r.last_visit_date, today);
      if (daysSince >= 30) {
        const name = childNameMap.get(r.child_id) ?? r.child_id;
        insights.push({
          severity: "warning",
          text: `${name} has an active advocate but no visit in ${daysSince} days — engagement may be lapsing`,
        });
      }
    }
  }

  // warning: pending referrals > 10 days
  for (const r of pending) {
    const daysPending = daysBetween(r.referral_date, today);
    if (daysPending > 10) {
      const name = childNameMap.get(r.child_id) ?? r.child_id;
      insights.push({
        severity: "warning",
        text: `Advocacy referral for ${name} has been pending ${daysPending} days — timely access at risk`,
      });
    }
  }

  // warning: review overdue
  for (const r of referrals) {
    if (r.review_date < today) {
      const name = childNameMap.get(r.child_id) ?? r.child_id;
      insights.push({
        severity: "warning",
        text: `Advocacy review for ${name} is overdue — Reg 45 requires regular quality of care review`,
      });
    }
  }

  // positive: all children have referral history
  if (childrenWithoutReferral.length === 0 && children.length > 0) {
    insights.push({
      severity: "positive",
      text: "All children have advocacy referral history — rights awareness is embedded",
    });
  }

  // positive: active advocates in place for all children with active referrals
  const childrenWithActiveAdvocate = children.filter((c) => childIdsWithActiveReferral.has(c.id));
  if (childrenWithActiveAdvocate.length === children.length && children.length > 0) {
    insights.push({
      severity: "positive",
      text: "Every child has an active advocate in place — strong advocacy coverage",
    });
  }

  // positive: regular visits (all active referrals have visit within 30 days)
  const activeWithVisits = active.filter((r) => r.last_visit_date !== null);
  const allActiveVisitsCurrent =
    active.length > 0 &&
    activeWithVisits.length === active.length &&
    activeWithVisits.every((r) => daysBetween(r.last_visit_date!, today) < 30);
  if (allActiveVisitsCurrent) {
    insights.push({
      severity: "positive",
      text: "All active advocacy referrals have recent visits — advocates are actively engaged",
    });
  }

  // positive: completed referrals present
  if (completed.length > 0) {
    insights.push({
      severity: "positive",
      text: `${completed.length} advocacy referral${completed.length === 1 ? "" : "s"} completed — children's issues are being resolved`,
    });
  }

  return {
    overview,
    referral_breakdown,
    child_advocacy_profiles,
    alerts,
    insights,
  };
}
