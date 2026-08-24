// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME SOCIAL WORKER CONTACT INTELLIGENCE ENGINE
// Pure deterministic engine: contact frequency, direction balance, child
// awareness, follow-up compliance, urgency patterns, decision documentation,
// action completion, and statutory visit compliance.
// CHR 2015 Reg 5: "Engagement with parents, carers and placing authorities."
// SCCIF: Impact of leaders and managers.
// ══════════════════════════════════════════════════════════════════════════════

import { below, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SocialWorkerContactRecordInput {
  id: string;
  child_id: string;
  date: string; // ISO date
  contact_type: string; // "phone_call"|"email"|"visit"|"lac_review"|"video_call"|"text"|"unplanned"|"statutory_visit"
  direction: string; // "incoming"|"outgoing"
  initiated_by: string; // "home"|"social_worker"|"other"
  has_key_decisions: boolean;
  key_decision_count: number;
  action_item_count: number;
  action_completed_count: number;
  action_overdue_count: number;
  child_aware: boolean;
  has_child_views: boolean;
  follow_up_required: boolean;
  has_follow_up_date: boolean;
  documents_shared_count: number;
  urgency: string; // "routine"|"urgent"|"emergency"
  has_outcome: boolean;
  has_next_scheduled: boolean;
}

export interface SocialWorkerContactInput {
  today: string;
  total_children: number;
  contacts: SocialWorkerContactRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SocialWorkerContactRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SocialWorkerContactResult {
  contact_rating: SocialWorkerContactRating;
  contact_score: number;
  headline: string;
  total_contacts: number;
  /** null when the population is empty — nothing measured, not 0%. */
  children_with_contact_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  home_initiated_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  child_awareness_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  follow_up_compliance_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  action_completion_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  decision_documentation_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref: string;
  }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): SocialWorkerContactRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeSocialWorkerContact(
  input: SocialWorkerContactInput,
): SocialWorkerContactResult {
  const { contacts, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      contact_rating: "insufficient_data",
      contact_score: 0,
      headline: "No data available for social worker contact intelligence analysis",
      total_contacts: 0,
      children_with_contact_rate: null,
      home_initiated_rate: null,
      child_awareness_rate: null,
      follow_up_compliance_rate: null,
      action_completion_rate: null,
      decision_documentation_rate: null,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = contacts.length;
  const uniqueChildren = new Set(contacts.map(c => c.child_id)).size;
  const childrenWithContactRate = rate(uniqueChildren, total_children);

  const homeInitiated = contacts.filter(c => c.initiated_by === "home").length;
  const homeInitiatedRate = rate(homeInitiated, total);

  const childAware = contacts.filter(c => c.child_aware).length;
  const childAwarenessRate = rate(childAware, total);

  const followUpRequired = contacts.filter(c => c.follow_up_required).length;
  const followUpWithDate = contacts.filter(c => c.follow_up_required && c.has_follow_up_date).length;
  const followUpComplianceRate = rate(followUpWithDate, followUpRequired);

  const totalActions = contacts.reduce((s, c) => s + c.action_item_count, 0);
  const completedActions = contacts.reduce((s, c) => s + c.action_completed_count, 0);
  const overdueActions = contacts.reduce((s, c) => s + c.action_overdue_count, 0);
  const actionCompletionRate = rate(completedActions, totalActions);

  const withDecisions = contacts.filter(c => c.has_key_decisions).length;
  const decisionDocumentationRate = rate(withDecisions, total);

  const urgentContacts = contacts.filter(c => c.urgency === "urgent" || c.urgency === "emergency").length;
  const lacReviews = contacts.filter(c => c.contact_type === "lac_review").length;
  const faceToFace = contacts.filter(c => c.contact_type === "visit" || c.contact_type === "statutory_visit" || c.contact_type === "lac_review").length;

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Children with SW contact (coverage)
  if (total === 0) {
    score -= 3;
  } else {
    if (meets(childrenWithContactRate, 90)) score += 6;
    else if (meets(childrenWithContactRate, 60)) score += 2;
    else if (below(childrenWithContactRate, 30)) score -= 5;
  }

  // Modifier 2: Home-initiated proactive contact
  if (total === 0) {
    score -= 1;
  } else {
    if (meets(homeInitiatedRate, 50)) score += 5;
    else if (meets(homeInitiatedRate, 30)) score += 2;
    else if (below(homeInitiatedRate, 15)) score -= 5;
  }

  // Modifier 3: Child awareness of SW contacts
  if (total === 0) {
    score -= 1;
  } else {
    if (meets(childAwarenessRate, 80)) score += 5;
    else if (meets(childAwarenessRate, 50)) score += 2;
    else if (below(childAwarenessRate, 25)) score -= 4;
  }

  // Modifier 4: Follow-up compliance
  if (total === 0) {
    // no adjustment
  } else {
    if (followUpRequired === 0 && total > 0) score += 2;
    else if (meets(followUpComplianceRate, 90)) score += 5;
    else if (meets(followUpComplianceRate, 60)) score += 2;
    else if (below(followUpComplianceRate, 30)) score -= 4;
  }

  // Modifier 5: Action completion
  if (total === 0) {
    score -= 1;
  } else {
    if (totalActions === 0 && total > 0) score += 2;
    else if (meets(actionCompletionRate, 80)) score += 4;
    else if (meets(actionCompletionRate, 50)) score += 1;
    else if (below(actionCompletionRate, 25)) score -= 4;
  }

  // Modifier 6: Decision documentation
  if (total === 0) {
    score -= 2;
  } else {
    if (meets(decisionDocumentationRate, 60)) score += 5;
    else if (meets(decisionDocumentationRate, 30)) score += 2;
    else if (below(decisionDocumentationRate, 10)) score -= 3;
  }

  score = clamp(score, 0, 100);

  const contact_rating = total === 0 && contacts.length === 0
    ? "insufficient_data"
    : toRating(score);

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(childrenWithContactRate, 90) && total > 0)
    strengths.push("Social worker contact covers virtually all children — the home maintains strong placing authority relationships");
  if (meets(homeInitiatedRate, 50) && total > 0)
    strengths.push("The home proactively initiates contact with social workers — demonstrating engaged partnership working");
  if (meets(childAwarenessRate, 80) && total > 0)
    strengths.push("Children are routinely informed about social worker contact — transparency supports trust and participation");
  if (meets(followUpComplianceRate, 90) && followUpRequired > 0)
    strengths.push("Follow-up actions from SW contacts are consistently completed — the home is reliable and responsive");
  if (meets(actionCompletionRate, 80) && totalActions > 0)
    strengths.push("Action items from social worker contacts are completed at a high rate — commitments are honoured");
  if (meets(decisionDocumentationRate, 60) && total > 0)
    strengths.push("Key decisions from SW contacts are documented — the home maintains a clear audit trail");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0 && total_children > 0)
    concerns.push("No social worker contact records — the home cannot demonstrate Reg 5 engagement with placing authorities");
  if (below(childrenWithContactRate, 50) && total > 0)
    concerns.push("Many children have no recorded social worker contact — placing authority relationships may be fragmented");
  if (below(homeInitiatedRate, 15) && total > 0)
    concerns.push("The home rarely initiates contact with social workers — relying on social workers to drive communication");
  if (below(childAwarenessRate, 25) && total > 0)
    concerns.push("Children are rarely informed about social worker contact — this undermines participation and transparency");
  if (below(followUpComplianceRate, 30) && followUpRequired > 0)
    concerns.push("Follow-ups from SW contacts are not being actioned — critical commitments may be falling through");
  if (overdueActions > 0)
    concerns.push(`${overdueActions} action${overdueActions > 1 ? "s" : ""} from social worker contacts ${overdueActions > 1 ? "are" : "is"} overdue — promises to placing authorities are not being met`);
  if (below(decisionDocumentationRate, 10) && total > 0)
    concerns.push("Decisions from social worker contacts are rarely documented — there is no audit trail of agreed actions");

  // ── Recommendations ────────────────────────────────────────────────────
  const recommendations: SocialWorkerContactResult["recommendations"] = [];
  let rank = 0;

  if (total === 0 && total_children > 0)
    recommendations.push({ rank: ++rank, recommendation: "Establish structured social worker contact recording for every child with scheduled review cycles", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 5" });
  if (below(childrenWithContactRate, 60) && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Ensure every child has recent social worker contact — no child should go without placing authority engagement", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 5" });
  if (below(homeInitiatedRate, 30) && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Increase home-initiated contact with social workers to demonstrate proactive partnership", urgency: "soon", regulatory_ref: "SCCIF Leaders" });
  if (below(childAwarenessRate, 50) && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Inform children when their social worker makes contact and capture their views about discussions", urgency: "soon", regulatory_ref: "CHR 2015 Reg 7" });
  if (overdueActions > 0)
    recommendations.push({ rank: ++rank, recommendation: "Clear all overdue action items from social worker contacts and implement a tracking system", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 5" });
  if (below(decisionDocumentationRate, 30) && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Document key decisions and outcomes from every social worker contact for audit purposes", urgency: "planned", regulatory_ref: "SCCIF Leaders" });

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: SocialWorkerContactResult["insights"] = [];
  if (total === 0 && total_children > 0)
    insights.push({ text: "No social worker contact records means Ofsted cannot verify placing authority engagement — a key leadership indicator", severity: "critical" });
  if (total > 0 && meets(homeInitiatedRate, 50) && meets(childAwarenessRate, 80))
    insights.push({ text: "Proactive contact with strong child transparency demonstrates outstanding placing authority partnership", severity: "positive" });
  if (urgentContacts > 0 && total > 0)
    insights.push({ text: `${urgentContacts} urgent/emergency contact${urgentContacts > 1 ? "s" : ""} recorded — the home is responsive to escalating situations`, severity: "warning" });
  if (faceToFace > 0 && total > 0 && meets(rate(faceToFace, total), 30))
    insights.push({ text: "Strong face-to-face contact ratio shows the home values direct relationship-building with social workers", severity: "positive" });
  if (lacReviews > 0)
    insights.push({ text: `${lacReviews} LAC review${lacReviews > 1 ? "s" : ""} documented — the home actively participates in statutory review processes`, severity: "positive" });
  if (overdueActions > 3)
    insights.push({ text: "Multiple overdue actions suggest systemic issues with follow-through on social worker commitments", severity: "warning" });

  // ── Headline ───────────────────────────────────────────────────────────
  let headline = "";
  if (contact_rating === "insufficient_data") {
    headline = "No data available for social worker contact intelligence analysis";
  } else if (contact_rating === "outstanding") {
    headline = "Outstanding social worker engagement — proactive, transparent and well-documented placing authority partnerships";
  } else if (contact_rating === "good") {
    headline = "Good social worker contact with regular communication and documented decisions";
  } else if (contact_rating === "adequate") {
    headline = "Social worker contact exists but proactivity, child awareness or follow-through needs improvement";
  } else {
    headline = "Inadequate social worker engagement — placing authority relationships lack structure, documentation and follow-through";
  }

  return {
    contact_rating,
    contact_score: score,
    headline,
    total_contacts: total,
    children_with_contact_rate: childrenWithContactRate,
    home_initiated_rate: homeInitiatedRate,
    child_awareness_rate: childAwarenessRate,
    follow_up_compliance_rate: followUpComplianceRate,
    action_completion_rate: actionCompletionRate,
    decision_documentation_rate: decisionDocumentationRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
