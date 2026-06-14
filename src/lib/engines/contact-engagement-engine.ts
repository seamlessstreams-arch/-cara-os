// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTACT & FAMILY ENGAGEMENT INTELLIGENCE ENGINE
//
// Pure deterministic engine that analyses contact and family engagement:
// - Contact plan compliance (completion rate, plan review currency)
// - Family time session analysis (frequency, quality, mood impact)
// - Per-child contact profiles
// - Mood impact analysis (before/after contact presentation)
// - Sibling contact tracking
// - Auto-generated Cara contact insights (deterministic)
//
// Key regulatory requirements:
//   Reg 6  — Quality and purpose of care (maintaining family relationships)
//   Reg 7  — Children's wishes and feelings (contact preferences)
//   SCCIF: "Relationships" quality standard — family engagement
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ChildInput {
  id: string;
  name: string;
}

export interface ContactPlanInput {
  id: string;
  child_id: string;
  status: string; // active, under_review, suspended
  review_date: string;
  arrangements_count: number;
  last_reviewed_date: string;
}

export interface FamilyTimeSessionInput {
  id: string;
  child_id: string;
  date: string;
  duration_minutes: number;
  family_member: string; // role: birth_parent, sibling, grandparent, etc.
  family_member_name: string;
  supervision_level: string; // supervised, supported, unsupervised
  presentation_before: string; // settled, anxious, excited, withdrawn, resistant
  was_safe: boolean;
  concerns_count: number;
  positive_observations_count: number;
}

export interface MoodEntryInput {
  child_id: string;
  date: string;
  mood_score: number; // 1-10
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface ContactComplianceSummary {
  total_children: number;
  active_plans: number;
  plans_overdue_review: number;
  total_sessions_90d: number;
  completed_sessions_30d: number;
  avg_sessions_per_child_30d: number;
  overall_completion_rate: number; // percentage
}

export interface FamilyTimeAnalysis {
  total_sessions_30d: number;
  total_sessions_90d: number;
  family_contact_sessions: number; // parent/grandparent
  sibling_contact_sessions: number;
  avg_duration_minutes: number;
  supervision_breakdown: { level: string; count: number }[];
  presentation_breakdown: { presentation: string; count: number }[];
  concern_sessions: number; // sessions with concerns raised
  safe_sessions_pct: number;
}

export interface ChildContactProfile {
  child_id: string;
  child_name: string;
  has_active_plan: boolean;
  plan_review_current: boolean;
  sessions_30d: number;
  sessions_90d: number;
  unique_contacts: number; // unique family members seen
  most_frequent_contact: string | null;
  predominant_presentation: string | null;
  concern_sessions_90d: number;
}

export interface MoodImpactAnalysis {
  children_with_data: number;
  avg_mood_contact_days: number; // avg mood on days with contact
  avg_mood_non_contact_days: number; // avg mood on days without contact
  positive_impact_children: number; // children whose mood is better on contact days
  negative_impact_children: number;
  neutral_impact_children: number;
}

export interface ContactAlert {
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  child_name: string;
  message: string;
}

export interface CaraContactInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ContactEngagementResult {
  compliance: ContactComplianceSummary;
  family_time: FamilyTimeAnalysis;
  child_profiles: ChildContactProfile[];
  mood_impact: MoodImpactAnalysis;
  alerts: ContactAlert[];
  insights: CaraContactInsight[];
}

export interface ContactEngagementInput {
  children: ChildInput[];
  contactPlans: ContactPlanInput[];
  familyTimeSessions: FamilyTimeSessionInput[];
  moodEntries: MoodEntryInput[];
  today?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}

/** Classify family member role as family or sibling */
export function isSiblingContact(role: string): boolean {
  return role === "sibling" || role === "half_sibling" || role === "step_sibling";
}

/** Human label for presentation */
export function presentationLabel(pres: string): string {
  const labels: Record<string, string> = {
    settled: "Settled",
    anxious: "Anxious",
    excited: "Excited",
    withdrawn: "Withdrawn",
    resistant: "Resistant",
  };
  return labels[pres] ?? pres.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Find the most frequent value in an array */
export function mostFrequent(values: string[]): string | null {
  if (values.length === 0) return null;
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let maxCount = 0;
  let result: string | null = null;
  for (const [val, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      result = val;
    }
  }
  return result;
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function computeContactEngagement(
  input: ContactEngagementInput,
): ContactEngagementResult {
  const today = input.today ?? todayStr();
  const { children, contactPlans, familyTimeSessions, moodEntries } = input;

  const ninetyDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
  })();

  const thirtyDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  })();

  // ── Child name lookup ────────────────────────────────────────────────────

  const childNameMap = new Map<string, string>();
  for (const c of children) {
    childNameMap.set(c.id, c.name);
  }
  const childName = (id: string) => childNameMap.get(id) ?? "Unknown";

  // ── Contact plans ────────────────────────────────────────────────────────

  const planByChild = new Map<string, ContactPlanInput>();
  for (const plan of contactPlans) {
    // Keep the most recent plan per child
    const existing = planByChild.get(plan.child_id);
    if (!existing || plan.last_reviewed_date > existing.last_reviewed_date) {
      planByChild.set(plan.child_id, plan);
    }
  }

  const activePlans = contactPlans.filter((p) => p.status === "active");
  const plansOverdueReview = activePlans.filter((p) => p.review_date < today).length;

  // ── Family time sessions ─────────────────────────────────────────────────

  const sessions90d = familyTimeSessions.filter((s) => s.date >= ninetyDaysAgo && s.date <= today);
  const sessions30d = familyTimeSessions.filter((s) => s.date >= thirtyDaysAgo && s.date <= today);

  // ── Compliance Summary ───────────────────────────────────────────────────

  const avgPerChild = children.length > 0
    ? Math.round((sessions30d.length / children.length) * 10) / 10
    : 0;

  // Completion rate: sessions happened vs children × expected (at least 1/month)
  const completionRate = children.length > 0
    ? Math.round((Math.min(sessions30d.length, children.length) / children.length) * 100)
    : 100;

  const compliance: ContactComplianceSummary = {
    total_children: children.length,
    active_plans: activePlans.length,
    plans_overdue_review: plansOverdueReview,
    total_sessions_90d: sessions90d.length,
    completed_sessions_30d: sessions30d.length,
    avg_sessions_per_child_30d: avgPerChild,
    overall_completion_rate: completionRate,
  };

  // ── Family Time Analysis ─────────────────────────────────────────────────

  const familyContactSessions = sessions90d.filter((s) => !isSiblingContact(s.family_member));
  const siblingContactSessions = sessions90d.filter((s) => isSiblingContact(s.family_member));

  const avgDuration = sessions90d.length > 0
    ? Math.round(sessions90d.reduce((sum, s) => sum + s.duration_minutes, 0) / sessions90d.length)
    : 0;

  // Supervision breakdown
  const supervisionCounts = new Map<string, number>();
  for (const s of sessions90d) {
    supervisionCounts.set(s.supervision_level, (supervisionCounts.get(s.supervision_level) ?? 0) + 1);
  }
  const supervisionBreakdown = Array.from(supervisionCounts.entries())
    .map(([level, count]) => ({ level, count }))
    .sort((a, b) => b.count - a.count);

  // Presentation breakdown
  const presentationCounts = new Map<string, number>();
  for (const s of sessions90d) {
    presentationCounts.set(s.presentation_before, (presentationCounts.get(s.presentation_before) ?? 0) + 1);
  }
  const presentationBreakdown = Array.from(presentationCounts.entries())
    .map(([presentation, count]) => ({ presentation, count }))
    .sort((a, b) => b.count - a.count);

  const concernSessions = sessions90d.filter((s) => s.concerns_count > 0).length;
  const safeSessions = sessions90d.filter((s) => s.was_safe).length;
  const safePct = sessions90d.length > 0 ? Math.round((safeSessions / sessions90d.length) * 100) : 100;

  const familyTime: FamilyTimeAnalysis = {
    total_sessions_30d: sessions30d.length,
    total_sessions_90d: sessions90d.length,
    family_contact_sessions: familyContactSessions.length,
    sibling_contact_sessions: siblingContactSessions.length,
    avg_duration_minutes: avgDuration,
    supervision_breakdown: supervisionBreakdown,
    presentation_breakdown: presentationBreakdown,
    concern_sessions: concernSessions,
    safe_sessions_pct: safePct,
  };

  // ── Child Contact Profiles ───────────────────────────────────────────────

  const sessionsByChild = new Map<string, FamilyTimeSessionInput[]>();
  for (const s of sessions90d) {
    const arr = sessionsByChild.get(s.child_id) ?? [];
    arr.push(s);
    sessionsByChild.set(s.child_id, arr);
  }

  const childProfiles: ChildContactProfile[] = children.map((child) => {
    const plan = planByChild.get(child.id);
    const childSessions = sessionsByChild.get(child.id) ?? [];
    const childSessions30d = childSessions.filter((s) => s.date >= thirtyDaysAgo);

    // Unique contacts
    const uniqueContacts = new Set(childSessions.map((s) => s.family_member_name));

    // Most frequent contact
    const contactFreq = new Map<string, number>();
    for (const s of childSessions) {
      contactFreq.set(s.family_member_name, (contactFreq.get(s.family_member_name) ?? 0) + 1);
    }
    let mfc: string | null = null;
    let mfcCount = 0;
    for (const [name, count] of contactFreq) {
      if (count > mfcCount) {
        mfcCount = count;
        mfc = name;
      }
    }

    // Predominant presentation
    const presentations = childSessions.map((s) => s.presentation_before);
    const predominant = mostFrequent(presentations);

    // Concern count
    const concernCount = childSessions.filter((s) => s.concerns_count > 0).length;

    return {
      child_id: child.id,
      child_name: child.name,
      has_active_plan: plan?.status === "active",
      plan_review_current: plan ? plan.review_date >= today : false,
      sessions_30d: childSessions30d.length,
      sessions_90d: childSessions.length,
      unique_contacts: uniqueContacts.size,
      most_frequent_contact: mfc,
      predominant_presentation: predominant,
      concern_sessions_90d: concernCount,
    };
  });

  // ── Mood Impact Analysis ─────────────────────────────────────────────────

  const contactDates = new Set<string>();
  const contactDatesByChild = new Map<string, Set<string>>();
  for (const s of familyTimeSessions) {
    contactDates.add(`${s.child_id}_${s.date}`);
    const childDates = contactDatesByChild.get(s.child_id) ?? new Set();
    childDates.add(s.date);
    contactDatesByChild.set(s.child_id, childDates);
  }

  let childrenWithData = 0;
  let totalContactDayMood = 0;
  let totalContactDays = 0;
  let totalNonContactDayMood = 0;
  let totalNonContactDays = 0;
  let positiveImpact = 0;
  let negativeImpact = 0;
  let neutralImpact = 0;

  for (const child of children) {
    const childMoods = moodEntries.filter((m) => m.child_id === child.id && m.date >= ninetyDaysAgo && m.date <= today);
    const childContactDates = contactDatesByChild.get(child.id) ?? new Set();

    if (childMoods.length === 0 || childContactDates.size === 0) continue;
    childrenWithData++;

    const contactDayMoods = childMoods.filter((m) => childContactDates.has(m.date));
    const nonContactDayMoods = childMoods.filter((m) => !childContactDates.has(m.date));

    const contactAvg = contactDayMoods.length > 0
      ? contactDayMoods.reduce((s, m) => s + m.mood_score, 0) / contactDayMoods.length
      : 0;
    const nonContactAvg = nonContactDayMoods.length > 0
      ? nonContactDayMoods.reduce((s, m) => s + m.mood_score, 0) / nonContactDayMoods.length
      : 0;

    totalContactDayMood += contactDayMoods.reduce((s, m) => s + m.mood_score, 0);
    totalContactDays += contactDayMoods.length;
    totalNonContactDayMood += nonContactDayMoods.reduce((s, m) => s + m.mood_score, 0);
    totalNonContactDays += nonContactDayMoods.length;

    if (contactAvg - nonContactAvg >= 0.5) positiveImpact++;
    else if (nonContactAvg - contactAvg >= 0.5) negativeImpact++;
    else neutralImpact++;
  }

  const avgMoodContactDays = totalContactDays > 0
    ? Math.round((totalContactDayMood / totalContactDays) * 10) / 10
    : 0;
  const avgMoodNonContactDays = totalNonContactDays > 0
    ? Math.round((totalNonContactDayMood / totalNonContactDays) * 10) / 10
    : 0;

  const moodImpact: MoodImpactAnalysis = {
    children_with_data: childrenWithData,
    avg_mood_contact_days: avgMoodContactDays,
    avg_mood_non_contact_days: avgMoodNonContactDays,
    positive_impact_children: positiveImpact,
    negative_impact_children: negativeImpact,
    neutral_impact_children: neutralImpact,
  };

  // ── Alerts ───────────────────────────────────────────────────────────────

  const alerts: ContactAlert[] = [];

  // Plan overdue review
  for (const plan of activePlans) {
    if (plan.review_date < today) {
      alerts.push({
        severity: "medium",
        type: "plan_overdue_review",
        child_name: childName(plan.child_id),
        message: `${childName(plan.child_id)} contact plan review is overdue (due ${plan.review_date}). Review contact arrangements to ensure they continue to meet the child's needs.`,
      });
    }
  }

  // Children with no contact in 30 days
  for (const profile of childProfiles) {
    if (profile.has_active_plan && profile.sessions_30d === 0) {
      alerts.push({
        severity: "high",
        type: "no_contact_30d",
        child_name: profile.child_name,
        message: `${profile.child_name} has had no family contact in 30 days despite having an active contact plan. Review barriers and ensure contact is facilitated as planned.`,
      });
    }
  }

  // Unsafe sessions — a contact flagged not safe (e.g. parent intoxicated or
  // aggressive) must surface, not just be averaged into safe_sessions_pct.
  for (const profile of childProfiles) {
    const unsafe = (sessionsByChild.get(profile.child_id) ?? []).filter((s) => !s.was_safe).length;
    if (unsafe > 0) {
      alerts.push({
        severity: "critical",
        type: "unsafe_session",
        child_name: profile.child_name,
        message: `${profile.child_name} had ${unsafe} family time session${unsafe !== 1 ? "s" : ""} flagged as unsafe in 90 days. Review the contact risk assessment and supervision level immediately.`,
      });
    }
  }

  // Safety concerns
  for (const profile of childProfiles) {
    if (profile.concern_sessions_90d >= 2) {
      alerts.push({
        severity: "high",
        type: "repeat_concerns",
        child_name: profile.child_name,
        message: `${profile.child_name} has had concerns raised in ${profile.concern_sessions_90d} contact sessions in 90 days. Review contact risk assessment and consider whether supervision level needs increasing.`,
      });
    }
  }

  // Predominantly anxious/withdrawn/resistant presentation
  for (const profile of childProfiles) {
    if (profile.predominant_presentation === "anxious" || profile.predominant_presentation === "withdrawn" || profile.predominant_presentation === "resistant") {
      if (profile.sessions_90d >= 2) {
        alerts.push({
          severity: "medium",
          type: "negative_presentation",
          child_name: profile.child_name,
          message: `${profile.child_name} predominantly presents as ${profile.predominant_presentation} before contact. Discuss in key-work session and review whether contact arrangements need adjustment.`,
        });
      }
    }
  }

  // Negative mood impact
  if (negativeImpact > 0) {
    const negChildren = children.filter((c) => {
      const childMoods = moodEntries.filter((m) => m.child_id === c.id && m.date >= ninetyDaysAgo && m.date <= today);
      const childContactDates = contactDatesByChild.get(c.id) ?? new Set();
      if (childMoods.length === 0 || childContactDates.size === 0) return false;
      const contactAvg = childMoods.filter((m) => childContactDates.has(m.date)).reduce((s, m) => s + m.mood_score, 0) / childMoods.filter((m) => childContactDates.has(m.date)).length;
      const nonContactAvg = childMoods.filter((m) => !childContactDates.has(m.date)).reduce((s, m) => s + m.mood_score, 0) / childMoods.filter((m) => !childContactDates.has(m.date)).length || 0;
      return nonContactAvg - contactAvg >= 0.5;
    });
    for (const child of negChildren) {
      alerts.push({
        severity: "medium",
        type: "negative_mood_impact",
        child_name: child.name,
        message: `${child.name}'s mood appears lower on contact days. Review contact experience, discuss feelings in key-work, and consider whether the child's wishes about contact are being heard.`,
      });
    }
  }

  // Sort by severity
  const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3));

  // ── Cara Insights ────────────────────────────────────────────────────────

  const insights: CaraContactInsight[] = [];

  // 1. No contact plan for children in placement
  const childrenWithoutPlan = children.filter((c) => {
    const plan = planByChild.get(c.id);
    return !plan || plan.status !== "active";
  });
  if (childrenWithoutPlan.length > 0) {
    insights.push({
      severity: "warning",
      text: `${childrenWithoutPlan.length} child(ren) without an active contact plan. Reg 6/7 requires that the home promotes and facilitates contact in line with each child's care plan and wishes.`,
    });
  }

  // 2. Plan review overdue
  if (plansOverdueReview > 0) {
    insights.push({
      severity: "warning",
      text: `${plansOverdueReview} contact plan(s) overdue for review. Contact arrangements should be regularly reviewed to ensure they remain in the child's best interests and reflect any changes in circumstances.`,
    });
  }

  // 3. Safety concerns pattern
  if (concernSessions > 0 && sessions90d.length > 0) {
    const concernPct = Math.round((concernSessions / sessions90d.length) * 100);
    if (concernPct >= 25) {
      insights.push({
        severity: "warning",
        text: `${concernPct}% of contact sessions in 90 days had concerns raised (${concernSessions} of ${sessions90d.length}). Review supervision arrangements, risk assessments, and whether contact remains safe and beneficial.`,
      });
    }
  }

  // 4. Negative mood impact
  if (negativeImpact > 0 && childrenWithData > 0) {
    insights.push({
      severity: "warning",
      text: `${negativeImpact} child(ren) show lower mood on contact days versus non-contact days. Explore the child's feelings about contact, ensure their voice is heard, and consider whether therapeutic support around contact would help.`,
    });
  }

  // 5. No sibling contact
  if (siblingContactSessions.length === 0 && sessions90d.length > 0 && children.length > 0) {
    insights.push({
      severity: "warning",
      text: "No sibling contact sessions recorded in 90 days. Reg 6 promotes maintaining family relationships including siblings. Review whether sibling contact is possible and desired by the children.",
    });
  }

  // 6. Positive: good engagement
  if (sessions30d.length > 0 && children.length > 0 && avgPerChild >= 2) {
    insights.push({
      severity: "positive",
      text: `Strong family engagement with an average of ${avgPerChild} contact sessions per child this month. Positive evidence of the home promoting and facilitating family relationships.`,
    });
  }

  // 7. Positive: all safe sessions
  if (safePct === 100 && sessions90d.length >= 3) {
    insights.push({
      severity: "positive",
      text: "All contact sessions in 90 days assessed as safe. Supervision arrangements and risk assessments are effectively managing contact safety.",
    });
  }

  // 8. Positive mood impact
  if (positiveImpact > 0 && childrenWithData > 0) {
    const pct = Math.round((positiveImpact / childrenWithData) * 100);
    if (pct >= 50) {
      insights.push({
        severity: "positive",
        text: `${positiveImpact} of ${childrenWithData} children show improved mood on contact days. Contact arrangements appear to be supporting emotional wellbeing — good evidence for Reg 6/7 compliance.`,
      });
    }
  }

  // 9. Positive: predominant settled presentation
  const settledSessions = sessions90d.filter((s) => s.presentation_before === "settled" || s.presentation_before === "excited");
  if (settledSessions.length > 0 && sessions90d.length >= 3) {
    const settledPct = Math.round((settledSessions.length / sessions90d.length) * 100);
    if (settledPct >= 70) {
      insights.push({
        severity: "positive",
        text: `${settledPct}% of children present as settled or excited before contact. This suggests positive anticipation and healthy attachment to family relationships being maintained.`,
      });
    }
  }

  // Ensure at least one insight
  if (insights.length === 0) {
    insights.push({
      severity: "positive",
      text: `Contact monitoring active for ${children.length} child(ren). Continue recording family time sessions, monitoring presentations, and reviewing contact plans regularly for Reg 6/7 compliance.`,
    });
  }

  return {
    compliance,
    family_time: familyTime,
    child_profiles: childProfiles,
    mood_impact: moodImpact,
    alerts,
    insights,
  };
}
