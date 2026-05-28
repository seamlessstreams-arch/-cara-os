// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME PROFESSIONAL NETWORK INTELLIGENCE ENGINE
// Home-level: measures the strength and health of the professional support
// network around the children's home — contact currency, role diversity,
// meeting completion, child participation, action follow-through, and
// multi-agency engagement quality.
// CHR 2015 Reg 5 (Engagement with parents and others), Reg 22 (Review of
// quality of care).
// SCCIF: "Impact of leaders and managers", "Experiences and progress of children."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ProfessionalContactInput {
  id: string;
  child_id: string;
  role: string; // "social_worker" | "iro" | "camhs" | "education" | "health" | "police" | etc.
  name: string;
  organisation: string;
  last_contact: string; // ISO date
  contact_frequency: string; // "weekly" | "fortnightly" | "monthly" | "quarterly" | ""
  is_active: boolean;
  has_email: boolean;
  has_phone: boolean;
  key_responsibilities_count: number;
}

export interface MultiAgencyMeetingInput {
  id: string;
  child_id: string;
  meeting_type: string; // "lac_review" | "strategy" | "professionals" | "cpc" | etc.
  meeting_status: string; // "completed" | "scheduled" | "cancelled"
  date: string; // ISO date
  attendees_count: number;
  attendees_present: number;
  child_participated: boolean;
  action_items_count: number;
  actions_completed: number;
  has_decisions: boolean;
  has_next_date: boolean;
}

export interface ProfessionalNetworkInput {
  today: string;
  total_children: number;
  contacts: ProfessionalContactInput[];
  meetings: MultiAgencyMeetingInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ProfessionalNetworkRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ProfessionalNetworkInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface ProfessionalNetworkRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface ProfessionalNetworkResult {
  network_rating: ProfessionalNetworkRating;
  network_score: number;
  headline: string;
  total_contacts: number;
  contact_currency_rate: number;
  meeting_completion_rate: number;
  child_participation_rate: number;
  action_completion_rate: number;
  role_diversity: number;
  strengths: string[];
  concerns: string[];
  recommendations: ProfessionalNetworkRecommendation[];
  insights: ProfessionalNetworkInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function toRating(score: number): ProfessionalNetworkRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

/**
 * Returns the expected contact window in days based on contact_frequency.
 * Default is 30 days if frequency is empty or unrecognised.
 */
function frequencyWindowDays(freq: string): number {
  switch (freq) {
    case "weekly": return 7;
    case "fortnightly": return 14;
    case "monthly": return 30;
    case "quarterly": return 90;
    default: return 30;
  }
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeProfessionalNetwork(
  input: ProfessionalNetworkInput,
): ProfessionalNetworkResult {
  const { today, total_children, contacts, meetings: allMeetings } = input;

  // Special case: no children → insufficient data
  if (total_children === 0) {
    return {
      network_rating: "insufficient_data",
      network_score: 0,
      headline: "No children placed — professional network data not available.",
      total_contacts: contacts.length,
      contact_currency_rate: 0,
      meeting_completion_rate: 0,
      child_participation_rate: 0,
      action_completion_rate: 0,
      role_diversity: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [{ text: "No children currently placed in this home. Professional network metrics require active placements to assess.", severity: "warning" }],
    };
  }

  // Filter meetings to last 365 days
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 365);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const meetings = allMeetings.filter(m => m.date >= cutoffStr && m.date <= today);

  // Special case: 0 contacts AND 0 meetings with children present
  if (contacts.length === 0 && meetings.length === 0) {
    return {
      network_rating: "inadequate",
      network_score: 20,
      headline: "No professional contacts or meetings recorded — critical network gap.",
      total_contacts: 0,
      contact_currency_rate: 0,
      meeting_completion_rate: 0,
      child_participation_rate: 0,
      action_completion_rate: 0,
      role_diversity: 0,
      strengths: [],
      concerns: ["No professional contacts or multi-agency meetings recorded despite children being placed — Ofsted expects a robust professional network supporting each child's care plan."],
      recommendations: [{ rank: 1, recommendation: "Establish and record the professional network for every child immediately — each child must have an identified social worker, IRO, and relevant health and education professionals.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 5" }],
      insights: [{ text: "No professional contacts or multi-agency meetings recorded with children in placement. This represents a fundamental failure in multi-agency working. Ofsted will view the absence of professional network records as evidence that the home cannot demonstrate effective partnership working or compliance with care plans.", severity: "critical" }],
    };
  }

  // ── Compute Metrics ───────────────────────────────────────────────────

  // Contact currency: a contact is "current" if last_contact is within expected frequency window (default 30 days)
  const activeContacts = contacts.filter(c => c.is_active);
  const currentContacts = activeContacts.filter(c => {
    const window = frequencyWindowDays(c.contact_frequency);
    const days = daysBetween(c.last_contact, today);
    return days <= window;
  });
  const contactCurrencyRate = pct(currentContacts.length, activeContacts.length);

  // Meeting completion rate (completed / (completed + cancelled))
  const completedMeetings = meetings.filter(m => m.meeting_status === "completed");
  const cancelledMeetings = meetings.filter(m => m.meeting_status === "cancelled");
  const meetingDenominator = completedMeetings.length + cancelledMeetings.length;
  const meetingCompletionRate = pct(completedMeetings.length, meetingDenominator);

  // Child participation rate (child_participated among completed meetings)
  const childParticipated = completedMeetings.filter(m => m.child_participated);
  const childParticipationRate = pct(childParticipated.length, completedMeetings.length);

  // Action completion rate (actions_completed / action_items_count across completed meetings)
  const totalActionItems = completedMeetings.reduce((sum, m) => sum + m.action_items_count, 0);
  const totalActionsCompleted = completedMeetings.reduce((sum, m) => sum + m.actions_completed, 0);
  const actionCompletionRate = pct(totalActionsCompleted, totalActionItems);

  // Role diversity: count of unique role values across all contacts
  const uniqueRoles = new Set(contacts.map(c => c.role));
  const roleDiversity = uniqueRoles.size;

  // ── Scoring: Base 52 + 6 modifiers ────────────────────────────────────

  let score = 52;

  // 1. Contact currency (current / active contacts)
  if (contactCurrencyRate >= 95) score += 6;
  else if (contactCurrencyRate >= 80) score += 3;
  else if (contactCurrencyRate < 50) score -= 8;
  else if (contactCurrencyRate < 65) score -= 4;

  // 2. Meeting completion rate
  if (meetingDenominator === 0) {
    score -= 2;
  } else {
    if (meetingCompletionRate >= 95) score += 5;
    else if (meetingCompletionRate >= 80) score += 2;
    else if (meetingCompletionRate < 60) score -= 5;
  }

  // 3. Child participation in completed meetings
  if (completedMeetings.length === 0) {
    score -= 1;
  } else {
    if (childParticipationRate >= 90) score += 5;
    else if (childParticipationRate >= 70) score += 2;
    else if (childParticipationRate < 40) score -= 4;
  }

  // 4. Action follow-through (actions_completed / action_items_count)
  if (totalActionItems === 0) {
    score -= 1;
  } else {
    if (actionCompletionRate >= 90) score += 5;
    else if (actionCompletionRate >= 70) score += 2;
    else if (actionCompletionRate < 50) score -= 4;
  }

  // 5. Role diversity
  if (roleDiversity >= 5) score += 5;
  else if (roleDiversity >= 3) score += 2;
  else if (roleDiversity < 2) score -= 4;

  // 6. Network breadth & engagement quality
  const contactsPerChild = contacts.length / total_children;
  const goodBreadth = contactsPerChild >= 3;
  const okBreadth = contactsPerChild >= 1.5;
  const hasDecisionsMeetings = completedMeetings.filter(m => m.has_decisions);
  const decisionRate = pct(hasDecisionsMeetings.length, completedMeetings.length);
  const highQualityEngagement = goodBreadth && decisionRate >= 80;

  if (highQualityEngagement) score += 5;
  else if (okBreadth) score += 2;
  else score -= 3;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (contactCurrencyRate >= 95 && activeContacts.length > 0) {
    strengths.push(`${contactCurrencyRate}% of professional contacts are current — exemplary network maintenance.`);
  } else if (contactCurrencyRate >= 80 && activeContacts.length > 0) {
    strengths.push(`${contactCurrencyRate}% contact currency rate — strong professional relationship maintenance.`);
  }

  if (meetingDenominator > 0 && meetingCompletionRate >= 95) {
    strengths.push(`${meetingCompletionRate}% meeting completion rate — multi-agency meetings are consistently taking place.`);
  } else if (meetingDenominator > 0 && meetingCompletionRate >= 80) {
    strengths.push(`${meetingCompletionRate}% meeting completion rate — good multi-agency engagement.`);
  }

  if (completedMeetings.length > 0 && childParticipationRate >= 90) {
    strengths.push(`${childParticipationRate}% child participation in meetings — children's voices are central to professional decision-making.`);
  } else if (completedMeetings.length > 0 && childParticipationRate >= 70) {
    strengths.push(`${childParticipationRate}% child participation rate — good involvement of children in their own meetings.`);
  }

  if (totalActionItems > 0 && actionCompletionRate >= 90) {
    strengths.push(`${actionCompletionRate}% action completion rate — decisions from meetings are being followed through effectively.`);
  } else if (totalActionItems > 0 && actionCompletionRate >= 70) {
    strengths.push(`${actionCompletionRate}% action completion rate — good follow-through on meeting decisions.`);
  }

  if (roleDiversity >= 5) {
    strengths.push(`${roleDiversity} distinct professional roles engaged — comprehensive multi-agency coverage across all care domains.`);
  } else if (roleDiversity >= 3) {
    strengths.push(`${roleDiversity} professional roles represented — good multi-agency breadth in the support network.`);
  }

  if (highQualityEngagement) {
    strengths.push(`${Math.round(contactsPerChild * 10) / 10} contacts per child with ${decisionRate}% of meetings producing decisions — network is both broad and effective.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (activeContacts.length > 0 && contactCurrencyRate < 65) {
    const stale = activeContacts.length - currentContacts.length;
    concerns.push(`Only ${contactCurrencyRate}% of professional contacts are current — ${stale} active contacts have lapsed beyond their expected frequency, weakening the support network.`);
  }

  if (meetingDenominator > 0 && meetingCompletionRate < 60) {
    concerns.push(`Only ${meetingCompletionRate}% meeting completion rate — ${cancelledMeetings.length} meetings cancelled in the last 12 months, disrupting multi-agency coordination.`);
  }

  if (meetingDenominator === 0 && meetings.length > 0) {
    concerns.push("All meetings in the last 12 months are scheduled but none completed or cancelled — meeting outcomes are not being tracked.");
  }

  if (completedMeetings.length > 0 && childParticipationRate < 40) {
    concerns.push(`Only ${childParticipationRate}% child participation rate — children are not being included in decisions about their own care.`);
  }

  if (completedMeetings.length === 0 && contacts.length > 0) {
    concerns.push("No completed multi-agency meetings in the last 12 months — professional coordination requires structured meeting forums.");
  }

  if (totalActionItems > 0 && actionCompletionRate < 50) {
    concerns.push(`Only ${actionCompletionRate}% of meeting actions completed — ${totalActionItems - totalActionsCompleted} actions outstanding, undermining the effectiveness of multi-agency planning.`);
  }

  if (roleDiversity < 2 && contacts.length > 0) {
    concerns.push(`Only ${roleDiversity} professional ${roleDiversity === 1 ? "role" : "roles"} represented — the support network lacks the multi-agency breadth needed to address children's holistic needs.`);
  }

  if (!okBreadth && contacts.length > 0) {
    concerns.push(`Only ${Math.round(contactsPerChild * 10) / 10} contacts per child — each child needs a robust network of professionals supporting their care plan.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recs: ProfessionalNetworkRecommendation[] = [];
  let rank = 1;

  if (activeContacts.length > 0 && contactCurrencyRate < 65) {
    recs.push({ rank: rank++, recommendation: "Re-establish contact with lapsed professionals — update contact records and schedule engagement with all active contacts who have exceeded their expected contact frequency.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 5" });
  }

  if (meetingDenominator > 0 && meetingCompletionRate < 60) {
    recs.push({ rank: rank++, recommendation: "Address meeting cancellation rate — investigate causes and implement scheduling practices that protect multi-agency meetings from cancellation.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 22" });
  }

  if (completedMeetings.length > 0 && childParticipationRate < 40) {
    recs.push({ rank: rank++, recommendation: "Increase child participation in professional meetings — develop age-appropriate participation methods so every child can contribute to decisions about their care.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 5" });
  }

  if (completedMeetings.length === 0 && contacts.length > 0) {
    recs.push({ rank: rank++, recommendation: "Schedule and convene multi-agency meetings — professionals meetings, LAC reviews, and strategy meetings must take place as required to coordinate each child's care.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 22" });
  }

  if (totalActionItems > 0 && actionCompletionRate < 50) {
    recs.push({ rank: rank++, recommendation: "Implement action tracking and follow-up — ensure all meeting actions are assigned, tracked, and completed within agreed timescales.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 22" });
  }

  if (roleDiversity < 2 && contacts.length > 0) {
    recs.push({ rank: rank++, recommendation: "Broaden the professional network — ensure each child has contacts spanning social work, health, education, and independent review to meet holistic care needs.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 5" });
  }

  if (!okBreadth && contacts.length > 0) {
    recs.push({ rank: rank++, recommendation: `Increase professional contacts — each child should have at least 3 identified professionals supporting their care plan. Current average is ${Math.round(contactsPerChild * 10) / 10} per child.`, urgency: "planned", regulatory_ref: "CHR 2015 Reg 5" });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: ProfessionalNetworkInsight[] = [];

  if (contactCurrencyRate >= 95 && meetingCompletionRate >= 95 && childParticipationRate >= 90 && actionCompletionRate >= 90 && activeContacts.length > 0 && completedMeetings.length > 0) {
    insights.push({ text: `Professional network is exemplary — ${contactCurrencyRate}% contacts current, ${meetingCompletionRate}% meetings completed, ${childParticipationRate}% child participation, and ${actionCompletionRate}% actions followed through. Ofsted will see a home where multi-agency working is embedded, children's voices are heard, and professional decisions lead to real outcomes.`, severity: "positive" });
  }

  if (meetingCompletionRate >= 95 && childParticipationRate >= 90 && meetingDenominator > 0 && completedMeetings.length > 0) {
    insights.push({ text: `Strong meeting culture with ${meetingCompletionRate}% completion and ${childParticipationRate}% child participation — multi-agency forums are prioritised and children are consistently included in professional decision-making. This evidences the SCCIF expectation that children are listened to and their views influence their care.`, severity: "positive" });
  }

  if (highQualityEngagement && roleDiversity >= 5) {
    insights.push({ text: `Comprehensive professional network with ${roleDiversity} roles, ${Math.round(contactsPerChild * 10) / 10} contacts per child, and ${decisionRate}% of meetings producing decisions. This demonstrates the multi-agency coordination expected under Reg 5 and supports the SCCIF "Impact of leaders and managers" judgement area.`, severity: "positive" });
  }

  if (activeContacts.length > 0 && contactCurrencyRate < 50) {
    insights.push({ text: `Contact currency is critically low at ${contactCurrencyRate}%. More than half of active professional contacts have lapsed beyond their expected frequency. Without current professional relationships, the home cannot demonstrate effective multi-agency working or ensure children's care plans are being implemented. Ofsted will view stale professional contacts as evidence of poor partnership working under Reg 5.`, severity: "critical" });
  }

  if (meetingDenominator > 0 && meetingCompletionRate < 60) {
    insights.push({ text: `Meeting completion rate of ${meetingCompletionRate}% means most scheduled multi-agency meetings are being cancelled. Under Reg 22, the registered person must maintain effective systems for reviewing the quality of care. Cancelled meetings disrupt care planning and professional coordination.`, severity: "critical" });
  }

  if (completedMeetings.length > 0 && childParticipationRate < 40) {
    insights.push({ text: `Only ${childParticipationRate}% child participation in professional meetings. Children must be supported to participate in decisions about their care. Low participation rates indicate that children's voices are not being heard in the professional forums that shape their lives.`, severity: "warning" });
  }

  if (totalActionItems > 0 && actionCompletionRate < 50) {
    insights.push({ text: `Only ${actionCompletionRate}% of meeting actions completed. When professional meetings produce decisions that are not followed through, the entire multi-agency process is undermined. Action completion is essential to demonstrate that meetings lead to tangible improvements in children's care.`, severity: "critical" });
  }

  if (roleDiversity < 2 && contacts.length > 0) {
    insights.push({ text: `Only ${roleDiversity} professional ${roleDiversity === 1 ? "role" : "roles"} represented in the network. Children in care need a multi-agency team spanning social work, health, education, and independent oversight. A narrow professional network cannot address the holistic needs of looked-after children.`, severity: "critical" });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding professional network — ${contactCurrencyRate}% contacts current, ${meetingCompletionRate}% meetings completed, ${roleDiversity} professional roles engaged.`;
  } else if (rating === "good") {
    headline = "Good professional network — solid multi-agency engagement with minor gaps in contact currency or meeting follow-through.";
  } else if (rating === "adequate") {
    headline = "Adequate professional network — multi-agency relationships and meeting practice need improvement to fully support children's care plans.";
  } else {
    headline = "Professional network is inadequate — weak multi-agency engagement, lapsed contacts, or insufficient meeting practice undermine care coordination.";
  }

  return {
    network_rating: rating,
    network_score: score,
    headline,
    total_contacts: contacts.length,
    contact_currency_rate: contactCurrencyRate,
    meeting_completion_rate: meetingCompletionRate,
    child_participation_rate: childParticipationRate,
    action_completion_rate: actionCompletionRate,
    role_diversity: roleDiversity,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
