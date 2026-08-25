import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME COMMUNICATION & CONTACT INTELLIGENCE ENGINE
// Home-level: aggregates communication book entries, correspondence,
// contact plans, and communication profiles.
// CHR 2015 Reg 7: "The children's views, wishes and feelings standard."
// CHR 2015 Reg 14: "Contact arrangements between children and parents."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface CommBookInput {
  id: string;
  date: string;
  priority: string;            // urgent | high | normal | low
  action_required: boolean;
  action_completed: boolean;
  related_yp_present: boolean; // related_yp !== null
}

export interface CorrespondenceInput {
  id: string;
  date: string;
  direction: string;           // incoming | outgoing | internal
  priority: string;            // urgent | high | normal | low
  status: string;              // draft | sent | received | awaiting_response | actioned | filed
  action_required_present: boolean;
  action_due: string | null;
  child_related: boolean;      // child_id !== null
}

export interface ContactPlanInput {
  id: string;
  child_id: string;
  review_date: string;
  status: string;              // active | under_review | suspended | ceased
  arrangements_count: number;
  child_wishes_provided: boolean;
  risk_factors_count: number;
  next_scheduled_contact: string;
}

export interface CommProfileInput {
  id: string;
  child_id: string;
  last_review_date: string;
  interpreter_required: boolean;
  salt_involved: boolean;
  strategies_count: number;
  aac_tools_count: number;
  child_views_provided: boolean;
}

export interface HomeCommunicationContactInput {
  today: string;
  comm_book_entries: CommBookInput[];
  correspondence_entries: CorrespondenceInput[];
  contact_plans: ContactPlanInput[];
  communication_profiles: CommProfileInput[];
  total_children: number;
  total_staff: number;
}

// ── Output types ────────────────────────────────────────────────────────────

export type CommunicationRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface CommBookProfile {
  total_entries_30d: number;
  urgent_count: number;
  action_required_count: number;
  action_completion_rate: number | null;
  child_related_rate: number | null;
}

export interface CorrespondenceProfile {
  total_entries_30d: number;
  incoming_count: number;
  outgoing_count: number;
  overdue_actions: number;
  actioned_rate: number | null;
}

export interface ContactPlanProfile {
  total_plans: number;
  active_count: number;
  /** null when the population is empty — nothing measured, not 0%. */
  child_coverage: number | null;
  overdue_reviews: number;
  child_wishes_rate: number | null;
  upcoming_contacts_count: number;
}

export interface CommProfileSummary {
  total_profiles: number;
  /** null when the population is empty — nothing measured, not 0%. */
  child_coverage: number | null;
  interpreter_needed_count: number;
  salt_involved_count: number;
  child_views_rate: number | null;
  avg_strategies: number | null;
}

export interface HomeCommunicationContactResult {
  communication_rating: CommunicationRating;
  communication_score: number | null;
  headline: string;
  comm_book: CommBookProfile;
  correspondence: CorrespondenceProfile;
  contact_plans: ContactPlanProfile;
  comm_profiles: CommProfileSummary;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeCommunicationContact(
  input: HomeCommunicationContactInput,
): HomeCommunicationContactResult {
  const {
    today, comm_book_entries, correspondence_entries,
    contact_plans, communication_profiles, total_children, total_staff,
  } = input;

  // ── Insufficient data guard ──────────────────────────────────────────
  if (
    total_children === 0 &&
    total_staff === 0 &&
    comm_book_entries.length === 0 &&
    correspondence_entries.length === 0 &&
    contact_plans.length === 0 &&
    communication_profiles.length === 0
  ) {
    return {
      communication_rating: "insufficient_data",
      communication_score: 0,
      headline: "No communication or contact data available for analysis.",
      comm_book: { total_entries_30d: 0, urgent_count: 0, action_required_count: 0, action_completion_rate: null, child_related_rate: null },
      correspondence: { total_entries_30d: 0, incoming_count: 0, outgoing_count: 0, overdue_actions: 0, actioned_rate: null },
      contact_plans: { total_plans: 0, active_count: 0, child_coverage: null, overdue_reviews: 0, child_wishes_rate: null, upcoming_contacts_count: 0 },
      comm_profiles: { total_profiles: 0, child_coverage: null, interpreter_needed_count: 0, salt_involved_count: 0, child_views_rate: null, avg_strategies: 0 },
      strengths: [],
      concerns: ["No communication or contact data — professional communication and contact governance cannot be assessed."],
      recommendations: [],
      insights: [],
    };
  }

  // ── Communication Book (30d) ─────────────────────────────────────────
  const commBook30d = comm_book_entries.filter(e => {
    const d = daysBetween(e.date, today);
    return d >= 0 && d <= 30;
  });

  const urgentCommBook = commBook30d.filter(e => e.priority === "urgent" || e.priority === "high");
  const commActionRequired = commBook30d.filter(e => e.action_required);
  const commActionCompleted = commActionRequired.filter(e => e.action_completed);
  const commActionRate = rate(commActionCompleted.length, commActionRequired.length);
  const commChildRelatedRate = rate(
    commBook30d.filter(e => e.related_yp_present).length,
    commBook30d.length,
  );

  const commBookProfile: CommBookProfile = {
    total_entries_30d: commBook30d.length,
    urgent_count: urgentCommBook.length,
    action_required_count: commActionRequired.length,
    action_completion_rate: commActionRate,
    child_related_rate: commChildRelatedRate,
  };

  // ── Correspondence (30d) ─────────────────────────────────────────────
  const corr30d = correspondence_entries.filter(e => {
    const d = daysBetween(e.date, today);
    return d >= 0 && d <= 30;
  });

  const incomingCorr = corr30d.filter(e => e.direction === "incoming");
  const outgoingCorr = corr30d.filter(e => e.direction === "outgoing");
  const corrWithAction = corr30d.filter(e => e.action_required_present);
  const overdueActions = corrWithAction.filter(e =>
    e.action_due && daysBetween(e.action_due, today) > 0 && e.status !== "actioned",
  );
  const actionedCorr = corr30d.filter(e => e.status === "actioned" || e.status === "filed");
  const corrActionedRate = rate(actionedCorr.length, corr30d.length);

  const correspondenceProfile: CorrespondenceProfile = {
    total_entries_30d: corr30d.length,
    incoming_count: incomingCorr.length,
    outgoing_count: outgoingCorr.length,
    overdue_actions: overdueActions.length,
    actioned_rate: corrActionedRate,
  };

  // ── Contact Plans ────────────────────────────────────────────────────
  const activePlans = contact_plans.filter(p => p.status === "active" || p.status === "under_review");
  const uniquePlanChildren = new Set(contact_plans.map(p => p.child_id));
  const contactPlanCoverage = rate(uniquePlanChildren.size, total_children);
  const overdueContactReviews = contact_plans.filter(p =>
    daysBetween(p.review_date, today) > 0,
  ).length;
  const childWishesRate = rate(
    contact_plans.filter(p => p.child_wishes_provided).length,
    contact_plans.length,
  );
  const upcomingContacts = contact_plans.filter(p =>
    daysBetween(today, p.next_scheduled_contact) >= 0 &&
    daysBetween(today, p.next_scheduled_contact) <= 30,
  ).length;

  const contactPlanProfile: ContactPlanProfile = {
    total_plans: contact_plans.length,
    active_count: activePlans.length,
    child_coverage: contactPlanCoverage,
    overdue_reviews: overdueContactReviews,
    child_wishes_rate: childWishesRate,
    upcoming_contacts_count: upcomingContacts,
  };

  // ── Communication Profiles ───────────────────────────────────────────
  const uniqueProfileChildren = new Set(communication_profiles.map(p => p.child_id));
  const profileCoverage = rate(uniqueProfileChildren.size, total_children);
  const interpreterNeeded = communication_profiles.filter(p => p.interpreter_required).length;
  const saltInvolved = communication_profiles.filter(p => p.salt_involved).length;
  const profileChildViewsRate = rate(
    communication_profiles.filter(p => p.child_views_provided).length,
    communication_profiles.length,
  );
  const avgStrategies = communication_profiles.length > 0
    ? Math.round((communication_profiles.reduce((s, p) => s + p.strategies_count, 0) / communication_profiles.length) * 10) / 10
    : null;

  const commProfileSummary: CommProfileSummary = {
    total_profiles: communication_profiles.length,
    child_coverage: profileCoverage,
    interpreter_needed_count: interpreterNeeded,
    salt_involved_count: saltInvolved,
    child_views_rate: profileChildViewsRate,
    avg_strategies: avgStrategies,
  };

  // ── Scoring ──────────────────────────────────────────────────────────
  // Base 52 + max bonuses 28 = 80
  let score = 52;

  // mod1: Communication book action completion (±5) — team follows through
  if (commActionRequired.length === 0) {
    score += (commBook30d.length > 0 ? 2 : 0); // active book but no actions = healthy
  } else {
    if (meets(commActionRate, 95)) score += 5;
    else if (meets(commActionRate, 80)) score += 3;
    else if (meets(commActionRate, 60)) score += 0;
    else score -= 5;
  }

  // mod2: Contact plan coverage (±4) — every child has a contact plan
  if (total_children === 0) {
    score += (contact_plans.length > 0 ? 1 : 0);
  } else if (contact_plans.length === 0) {
    score -= 4;
  } else {
    if (meets(contactPlanCoverage, 90)) score += 4;
    else if (meets(contactPlanCoverage, 70)) score += 2;
    else if (meets(contactPlanCoverage, 50)) score += 0;
    else score -= 4;
  }

  // mod3: Contact plan review timeliness (±3)
  if (contact_plans.length === 0) {
    score += 0;
  } else {
    const reviewOnTimeRate = rate(
      contact_plans.length - overdueContactReviews,
      contact_plans.length,
    );
    if (meets(reviewOnTimeRate, 95)) score += 3;
    else if (meets(reviewOnTimeRate, 80)) score += 1;
    else if (meets(reviewOnTimeRate, 60)) score += 0;
    else score -= 3;
  }

  // mod4: Communication profile coverage (±4) — every child has a profile
  if (total_children === 0) {
    score += (communication_profiles.length > 0 ? 1 : 0);
  } else if (communication_profiles.length === 0) {
    score -= 4;
  } else {
    if (meets(profileCoverage, 90)) score += 4;
    else if (meets(profileCoverage, 70)) score += 2;
    else if (meets(profileCoverage, 50)) score += 0;
    else score -= 4;
  }

  // mod5: Child voice in contact & communication (±3) — wishes captured
  const totalVoiceApplicable = contact_plans.length + communication_profiles.length;
  if (totalVoiceApplicable === 0) {
    score += 0;
  } else {
    const voiceProvided = contact_plans.filter(p => p.child_wishes_provided).length +
      communication_profiles.filter(p => p.child_views_provided).length;
    const voiceRate = rate(voiceProvided, totalVoiceApplicable);
    if (meets(voiceRate, 90)) score += 3;
    else if (meets(voiceRate, 70)) score += 1;
    else if (meets(voiceRate, 50)) score += 0;
    else score -= 3;
  }

  // mod6: Correspondence handling (±3) — overdue actions
  if (corr30d.length === 0) {
    score += 0;
  } else {
    if (overdueActions.length === 0) score += 3;
    else if (overdueActions.length <= 2) score += 1;
    else if (overdueActions.length <= 5) score += 0;
    else score -= 3;
  }

  // mod7: Communication book activity (±3) — regular recording
  if (total_staff === 0 && total_children === 0) {
    score += 0;
  } else {
    const expectedEntries = Math.max(total_staff, 1) * 4; // ~4 entries per staff per 30d
    const activityRate = rate(commBook30d.length, expectedEntries);
    if (meets(activityRate, 80)) score += 3;
    else if (meets(activityRate, 50)) score += 1;
    else if (meets(activityRate, 20)) score += 0;
    else score -= 3;
  }

  // mod8: SALT & accessibility provision (±3) — specialist support
  if (communication_profiles.length === 0) {
    score += 0;
  } else {
    const needsSpecialist = communication_profiles.filter(p =>
      p.interpreter_required || p.salt_involved || p.aac_tools_count > 0,
    );
    if (needsSpecialist.length === 0) {
      // No specialist needs — neutral positive
      score += 1;
    } else {
      const hasSupport = needsSpecialist.filter(p =>
        p.strategies_count > 0 || p.aac_tools_count > 0,
      ).length;
      const supportRate = rate(hasSupport, needsSpecialist.length);
      if (meets(supportRate, 100)) score += 3;
      else if (meets(supportRate, 80)) score += 1;
      else if (meets(supportRate, 50)) score += 0;
      else score -= 3;
    }
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // ── Rating ───────────────────────────────────────────────────────────
  let communication_rating: CommunicationRating;
  if (score >= 80) communication_rating = "outstanding";
  else if (score >= 65) communication_rating = "good";
  else if (score >= 45) communication_rating = "adequate";
  else communication_rating = "inadequate";

  // ── Headline ─────────────────────────────────────────────────────────
  const headlines: Record<CommunicationRating, string> = {
    outstanding: "Exceptional communication governance — contact plans, profiles and handover all excelling.",
    good: "Strong communication systems — most children's contact and communication needs well-managed.",
    adequate: "Communication systems meet basic requirements but have room for improvement.",
    inadequate: "Critical communication gaps — contact plans, profiles or handover need urgent attention.",
    insufficient_data: "No communication or contact data available for analysis.",
  };
  const headline = headlines[communication_rating];

  // ── Strengths ────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (meets(commActionRate, 95) && commActionRequired.length > 0)
    strengths.push(`Excellent communication book follow-through — ${commActionRate}% of actions completed.`);
  if (meets(contactPlanCoverage, 90) && total_children > 0)
    strengths.push(`Outstanding contact plan coverage — ${contactPlanCoverage}% of children have current plans.`);
  if (meets(profileCoverage, 90) && total_children > 0)
    strengths.push(`Comprehensive communication profiles — ${profileCoverage}% of children assessed.`);
  if (overdueActions.length === 0 && corr30d.length > 0)
    strengths.push("No overdue correspondence actions — responsive professional communication.");
  if (meets(childWishesRate, 90) && contact_plans.length > 0)
    strengths.push(`Strong child voice — ${childWishesRate}% of contact plans include child's wishes.`);
  if (overdueContactReviews === 0 && contact_plans.length > 0)
    strengths.push("All contact plan reviews up to date — excellent review discipline.");

  // ── Concerns ─────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (overdueContactReviews > 0)
    concerns.push(`${overdueContactReviews} contact plan review${overdueContactReviews > 1 ? "s" : ""} overdue.`);
  if (below(contactPlanCoverage, 50) && total_children > 0 && contact_plans.length > 0)
    concerns.push(`Only ${contactPlanCoverage}% of children have contact plans — significant coverage gap.`);
  if (contact_plans.length === 0 && total_children > 0)
    concerns.push("No contact plans in place — Reg 14 requires documented contact arrangements.");
  if (below(profileCoverage, 50) && total_children > 0 && communication_profiles.length > 0)
    concerns.push(`Only ${profileCoverage}% of children have communication profiles — many needs undocumented.`);
  if (communication_profiles.length === 0 && total_children > 0)
    concerns.push("No communication profiles — children's communication needs not assessed.");
  if (overdueActions.length >= 3)
    concerns.push(`${overdueActions.length} overdue correspondence actions — professional responsiveness at risk.`);
  if (below(commActionRate, 50) && commActionRequired.length > 0)
    concerns.push(`Communication book action completion only ${commActionRate}% — handover effectiveness compromised.`);
  if (below(childWishesRate, 50) && contact_plans.length > 0)
    concerns.push(`Child wishes only captured in ${childWishesRate}% of contact plans — children's voices underrepresented.`);

  // ── Recommendations ──────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let recRank = 0;

  if (contact_plans.length === 0 && total_children > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation: "Establish contact plans for all children — Reg 14 requires documented contact arrangements.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14",
    });
  }

  if (overdueContactReviews > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation: `Review ${overdueContactReviews} overdue contact plan${overdueContactReviews > 1 ? "s" : ""} — contact arrangements must be kept current.`,
      urgency: overdueContactReviews >= 3 ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 14",
    });
  }

  if (communication_profiles.length === 0 && total_children > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation: "Complete communication profiles for all children — understanding communication needs is essential.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7",
    });
  }

  if (below(childWishesRate, 70) && contact_plans.length > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation: "Capture child wishes in all contact plans — Reg 7 requires children's views to inform contact.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7",
    });
  }

  if (below(commActionRate, 70) && commActionRequired.length > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation: "Improve communication book action follow-through — incomplete handovers risk information loss.",
      urgency: "soon",
      regulatory_ref: null,
    });
  }

  // ── Insights ─────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];

  if (urgentCommBook.length >= 5)
    insights.push({ text: `Cara detects ${urgentCommBook.length} urgent/high-priority communication book entries in 30 days — consider whether escalation thresholds need review.`, severity: "warning" });

  if (overdueActions.length >= 5)
    insights.push({ text: `Cara flags ${overdueActions.length} overdue correspondence actions — risk of professional communication breakdown.`, severity: "critical" });

  if (meets(contactPlanCoverage, 90) && meets(profileCoverage, 90) && meets(commActionRate, 90))
    insights.push({ text: "Cara recognises comprehensive communication governance — evidence of proactive information-sharing culture.", severity: "positive" });

  if (interpreterNeeded > 0)
    insights.push({ text: `${interpreterNeeded} child${interpreterNeeded > 1 ? "ren" : ""} require${interpreterNeeded === 1 ? "s" : ""} interpreter support — ensure provision is consistent and documented.`, severity: "warning" });

  if (saltInvolved > 0 && communication_profiles.length > 0)
    insights.push({ text: `SALT involvement for ${saltInvolved} child${saltInvolved > 1 ? "ren" : ""} — multi-disciplinary communication support in place.`, severity: "positive" });

  const suspendedPlans = contact_plans.filter(p => p.status === "suspended" || p.status === "ceased").length;
  if (suspendedPlans > 0)
    insights.push({ text: `${suspendedPlans} contact plan${suspendedPlans > 1 ? "s" : ""} suspended or ceased — ensure all decisions are documented and reviewed.`, severity: "warning" });

  return {
    communication_rating,
    communication_score: score,
    headline,
    comm_book: commBookProfile,
    correspondence: correspondenceProfile,
    contact_plans: contactPlanProfile,
    comm_profiles: commProfileSummary,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
