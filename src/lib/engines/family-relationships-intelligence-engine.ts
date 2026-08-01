// ══════════════════════════════════════════════════════════════════════════════
// CARA — FAMILY & RELATIONSHIPS INTELLIGENCE ENGINE
// Per-child analysis of family contact quality, relationship health,
// network engagement, and contact compliance.
// Pure deterministic. No LLM calls, no DB access.
// CHR 2015 Reg 7 (contact), Reg 8 (communication), Reg 15 (children missing).
// SCCIF: How well children are helped and protected.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface FamilyRelationshipsInput {
  today: string;
  child_id: string;
  child_name: string;
  placement_start_date: string;

  family_time_sessions: FamilyTimeInput[];
  contact_arrangements: ContactArrangementInput[];
  genogram: GenogramInput | null;
  professional_contacts: ProfessionalContactInput[];
  lac_reviews: LACReviewInput[];
  missing_episodes: MissingEpisodeInput[];
  placement_moves: PlacementMoveInput[];
}

export interface FamilyTimeInput {
  id: string;
  date: string;
  family_member: string;
  family_member_name: string;
  duration_minutes: number;
  supervision_level: string;
  child_presentation_before: string;
  child_presentation_after: string;
  was_it_safe: boolean;
  concerns: string[];
  positive_observations: string[];
  child_voice: string;
}

export interface ContactArrangementInput {
  id: string;
  child_id: string;
  contact_type: string;
  frequency: string;
  supervision_level: string;
  court_ordered: boolean;
  status: string;
  review_date: string | null;
}

export interface GenogramInput {
  immediate_family: { relation: string; name: string; status: string }[];
  extended_family: { relation: string; name: string }[];
  important_non_family: { name: string; role: string }[];
  protective_relationships: string[];
  risk_relationships: string[];
  estranged_relationships: string[];
  child_input_provided: boolean;
}

export interface ProfessionalContactInput {
  role: string;
  name: string;
  last_contact_date: string | null;
  frequency: string;
}

export interface LACReviewInput {
  date: string;
  family_attended: boolean;
  child_participated: boolean;
  contact_discussed: boolean;
}

export interface MissingEpisodeInput {
  date: string;
  trigger: string;
  family_related: boolean;
}

export interface PlacementMoveInput {
  date: string;
  reason: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type RelationshipHealth = "thriving" | "stable" | "strained" | "concerning" | "critical";

export interface FamilyRelationshipsResult {
  generated_at: string;
  child_id: string;
  child_name: string;

  relationship_health: RelationshipHealth;
  relationship_score: number | null;
  headline: string;

  contact_analysis: ContactAnalysis;
  family_network: FamilyNetworkSummary;
  professional_engagement: ProfessionalEngagement;
  contact_compliance: ContactComplianceSummary;
  placement_impact: PlacementImpactSummary;

  strengths: string[];
  concerns: string[];
  recommendations: RelationshipRecommendation[];
  insights: RelationshipInsight[];
}

export interface ContactAnalysis {
  total_sessions_90d: number;
  sessions_last_30d: number;
  unique_family_contacts: number;
  average_session_minutes: number | null;
  supervised_pct: number | null;
  safe_pct: number | null;
  positive_presentation_pct: number | null;
  concerns_raised_90d: number;
  child_voice_captured: boolean;
  contact_frequency_trend: "increasing" | "stable" | "decreasing" | "no_data";
}

export interface FamilyNetworkSummary {
  immediate_family_count: number;
  extended_family_count: number;
  important_non_family: number;
  protective_count: number;
  risk_count: number;
  estranged_count: number;
  genogram_available: boolean;
  child_contributed_to_genogram: boolean;
}

export interface ProfessionalEngagement {
  total_professionals: number;
  active_professionals: number;
  social_worker_last_contact: string | null;
  irp_last_contact: string | null;
  lac_reviews_last_12m: number;
  family_attended_lac_pct: number | null;
  child_participated_lac_pct: number | null;
}

export interface ContactComplianceSummary {
  total_arrangements: number;
  active_arrangements: number;
  suspended: number;
  court_ordered: number;
  overdue_reviews: number;
  arrangements_without_session_30d: number;
}

export interface PlacementImpactSummary {
  placement_moves: number;
  family_related_missing: number;
  total_missing_90d: number;
  contact_disruption_risk: boolean;
}

export interface RelationshipRecommendation {
  rank: number;
  recommendation: string;
  domain: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string | null;
}

export interface RelationshipInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function withinDays(date: string, today: string, days: number): boolean {
  const d = daysBetween(date, today);
  return d >= 0 && d <= days;
}

// ── Core Compute ────────────────────────────────────────────────────────────

export function computeFamilyRelationships(input: FamilyRelationshipsInput): FamilyRelationshipsResult {
  const contact = computeContactAnalysis(input);
  const family = computeFamilyNetwork(input);
  const professional = computeProfessionalEngagement(input);
  const compliance = computeContactCompliance(input);
  const placement = computePlacementImpact(input);

  const score = computeScore(contact, family, professional, compliance, placement);
  const health = scoreToHealth(score);

  const strengths = identifyStrengths(contact, family, professional, compliance, placement);
  const concerns = identifyConcerns(contact, family, professional, compliance, placement, input);
  const recommendations = buildRecommendations(contact, family, professional, compliance, placement, health, input);
  const insights = generateInsights(contact, family, professional, compliance, placement, health, input);
  const headline = buildHeadline(input.child_name, health, score, contact);

  return {
    generated_at: input.today,
    child_id: input.child_id,
    child_name: input.child_name,
    relationship_health: health,
    relationship_score: score,
    headline,
    contact_analysis: contact,
    family_network: family,
    professional_engagement: professional,
    contact_compliance: compliance,
    placement_impact: placement,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}

// ── Contact Analysis ────────────────────────────────────────────────────────

function computeContactAnalysis(input: FamilyRelationshipsInput): ContactAnalysis {
  const sessions = input.family_time_sessions;
  const sessions90d = sessions.filter((s) => withinDays(s.date, input.today, 90));
  const sessions30d = sessions.filter((s) => withinDays(s.date, input.today, 30));
  const prev30d = sessions.filter((s) => {
    const d = daysBetween(s.date, input.today);
    return d > 30 && d <= 60;
  });

  const uniqueContacts = new Set(sessions90d.map((s) => s.family_member || s.family_member_name));
  const avgDuration = sessions90d.length > 0
    ? Math.round(sessions90d.reduce((s, f) => s + f.duration_minutes, 0) / sessions90d.length)
    : null;

  const supervised = sessions90d.filter((s) => s.supervision_level !== "none" && s.supervision_level !== "unsupervised");
  const supervisedPct = sessions90d.length > 0 ? Math.round((supervised.length / sessions90d.length) * 100) : null;

  const safe = sessions90d.filter((s) => s.was_it_safe);
  const safePct = sessions90d.length > 0 ? Math.round((safe.length / sessions90d.length) * 100) : null;

  const positive = sessions90d.filter((s) =>
    s.child_presentation_after === "happy" || s.child_presentation_after === "content" ||
    s.child_presentation_after === "settled" || s.child_presentation_after === "positive" ||
    s.positive_observations.length > 0,
  );
  const positivePct = sessions90d.length > 0 ? Math.round((positive.length / sessions90d.length) * 100) : null;

  const allConcerns = sessions90d.reduce((sum, s) => sum + s.concerns.length, 0);
  const hasVoice = sessions90d.some((s) => s.child_voice && s.child_voice.trim().length > 0);

  let trend: "increasing" | "stable" | "decreasing" | "no_data" = "no_data";
  if (sessions30d.length > 0 && prev30d.length > 0) {
    if (sessions30d.length > prev30d.length + 1) trend = "increasing";
    else if (sessions30d.length < prev30d.length - 1) trend = "decreasing";
    else trend = "stable";
  } else if (sessions30d.length > 0) {
    trend = "stable";
  }

  return {
    total_sessions_90d: sessions90d.length,
    sessions_last_30d: sessions30d.length,
    unique_family_contacts: uniqueContacts.size,
    average_session_minutes: avgDuration,
    supervised_pct: supervisedPct,
    safe_pct: safePct,
    positive_presentation_pct: positivePct,
    concerns_raised_90d: allConcerns,
    child_voice_captured: hasVoice,
    contact_frequency_trend: trend,
  };
}

// ── Family Network ──────────────────────────────────────────────────────────

function computeFamilyNetwork(input: FamilyRelationshipsInput): FamilyNetworkSummary {
  const g = input.genogram;
  if (!g) {
    return {
      immediate_family_count: 0,
      extended_family_count: 0,
      important_non_family: 0,
      protective_count: 0,
      risk_count: 0,
      estranged_count: 0,
      genogram_available: false,
      child_contributed_to_genogram: false,
    };
  }

  return {
    immediate_family_count: g.immediate_family.length,
    extended_family_count: g.extended_family.length,
    important_non_family: g.important_non_family.length,
    protective_count: g.protective_relationships.length,
    risk_count: g.risk_relationships.length,
    estranged_count: g.estranged_relationships.length,
    genogram_available: true,
    child_contributed_to_genogram: g.child_input_provided,
  };
}

// ── Professional Engagement ─────────────────────────────────────────────────

function computeProfessionalEngagement(input: FamilyRelationshipsInput): ProfessionalEngagement {
  const profs = input.professional_contacts;
  const active = profs.filter((p) => p.last_contact_date && withinDays(p.last_contact_date, input.today, 90));

  const sw = profs.find((p) => p.role === "social_worker" || p.role === "Social Worker");
  const irp = profs.find((p) => p.role === "irp" || p.role === "IRO" || p.role === "Independent Reviewing Officer");

  const reviews12m = input.lac_reviews.filter((r) => withinDays(r.date, input.today, 365));
  const familyAttended = reviews12m.filter((r) => r.family_attended);
  const childPart = reviews12m.filter((r) => r.child_participated);

  return {
    total_professionals: profs.length,
    active_professionals: active.length,
    social_worker_last_contact: sw?.last_contact_date ?? null,
    irp_last_contact: irp?.last_contact_date ?? null,
    lac_reviews_last_12m: reviews12m.length,
    family_attended_lac_pct: reviews12m.length > 0 ? Math.round((familyAttended.length / reviews12m.length) * 100) : null,
    child_participated_lac_pct: reviews12m.length > 0 ? Math.round((childPart.length / reviews12m.length) * 100) : null,
  };
}

// ── Contact Compliance ──────────────────────────────────────────────────────

function computeContactCompliance(input: FamilyRelationshipsInput): ContactComplianceSummary {
  const arr = input.contact_arrangements;
  const active = arr.filter((a) => a.status === "active");
  const suspended = arr.filter((a) => a.status === "suspended").length;
  const courtOrdered = arr.filter((a) => a.court_ordered).length;

  const overdueReviews = arr.filter((a) => {
    if (!a.review_date) return false;
    return daysBetween(a.review_date, input.today) > 0;
  }).length;

  // Which active arrangements had no session in last 30 days
  const sessions30d = input.family_time_sessions.filter((s) => withinDays(s.date, input.today, 30));
  const contactedMembers30d = new Set(sessions30d.map((s) => s.family_member || s.family_member_name));
  // Simplified: count arrangements with no matching session
  const withoutSession = active.filter(() => {
    // Without contact_person_id matching, we count active arrangements with no sessions as a conservative estimate
    return sessions30d.length === 0;
  }).length;

  return {
    total_arrangements: arr.length,
    active_arrangements: active.length,
    suspended,
    court_ordered: courtOrdered,
    overdue_reviews: overdueReviews,
    arrangements_without_session_30d: withoutSession,
  };
}

// ── Placement Impact ────────────────────────────────────────────────────────

function computePlacementImpact(input: FamilyRelationshipsInput): PlacementImpactSummary {
  const missing90d = input.missing_episodes.filter((m) => withinDays(m.date, input.today, 90));
  const familyRelated = missing90d.filter((m) => m.family_related);

  return {
    placement_moves: input.placement_moves.length,
    family_related_missing: familyRelated.length,
    total_missing_90d: missing90d.length,
    contact_disruption_risk: input.placement_moves.length > 2 || familyRelated.length > 1,
  };
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function computeScore(
  contact: ContactAnalysis,
  family: FamilyNetworkSummary,
  professional: ProfessionalEngagement,
  compliance: ContactComplianceSummary,
  placement: PlacementImpactSummary,
): number {
  let score = 50;

  // Contact quality (+/- 15)
  if (contact.total_sessions_90d >= 6) score += 10;
  else if (contact.total_sessions_90d >= 3) score += 5;
  else if (contact.total_sessions_90d === 0) score -= 5;
  if (contact.safe_pct === 100 && contact.total_sessions_90d > 0) score += 5;
  else if ((contact.safe_pct ?? 0) < 80 && contact.total_sessions_90d > 0) score -= 5;
  if ((contact.positive_presentation_pct ?? 0) > 70) score += 5;
  if (contact.concerns_raised_90d > 3) score -= 10;
  else if (contact.concerns_raised_90d > 0) score -= 3;

  // Family network (+/- 10)
  if (family.genogram_available) score += 5;
  if (family.protective_count >= 2) score += 5;
  if (family.risk_count > 2) score -= 5;
  if (family.child_contributed_to_genogram) score += 3;

  // Professional engagement (+/- 10)
  if (professional.lac_reviews_last_12m >= 2) score += 5;
  if ((professional.child_participated_lac_pct ?? 0) >= 80) score += 5;
  if (professional.active_professionals === 0) score -= 5;

  // Compliance (+/- 5)
  if (compliance.overdue_reviews > 0) score -= 5;
  if (compliance.suspended > 0) score -= 3;

  // Placement impact (-10)
  if (placement.contact_disruption_risk) score -= 10;
  if (placement.family_related_missing > 0) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function scoreToHealth(score: number): RelationshipHealth {
  if (score >= 75) return "thriving";
  if (score >= 60) return "stable";
  if (score >= 45) return "strained";
  if (score >= 30) return "concerning";
  return "critical";
}

// ── Strengths ───────────────────────────────────────────────────────────────

function identifyStrengths(
  contact: ContactAnalysis,
  family: FamilyNetworkSummary,
  professional: ProfessionalEngagement,
  compliance: ContactComplianceSummary,
  placement: PlacementImpactSummary,
): string[] {
  const strengths: string[] = [];

  if (contact.total_sessions_90d >= 6) {
    strengths.push(`Regular family contact — ${contact.total_sessions_90d} sessions in 90 days`);
  }
  if (contact.safe_pct === 100 && contact.total_sessions_90d > 0) {
    strengths.push("All contact sessions assessed as safe");
  }
  if ((contact.positive_presentation_pct ?? 0) > 70) {
    strengths.push(`Child presents positively after ${contact.positive_presentation_pct}% of contact sessions`);
  }
  if (contact.child_voice_captured) {
    strengths.push("Child's voice captured in contact records");
  }
  if (family.protective_count >= 2) {
    strengths.push(`${family.protective_count} identified protective relationships in family network`);
  }
  if (family.child_contributed_to_genogram) {
    strengths.push("Child contributed to their genogram — identity work supported");
  }
  if ((professional.child_participated_lac_pct ?? 0) >= 80) {
    strengths.push(`Child participated in ${professional.child_participated_lac_pct}% of LAC reviews`);
  }
  if (contact.unique_family_contacts >= 3) {
    strengths.push(`Contact maintained with ${contact.unique_family_contacts} different family members`);
  }

  return strengths.slice(0, 8);
}

// ── Concerns ────────────────────────────────────────────────────────────────

function identifyConcerns(
  contact: ContactAnalysis,
  family: FamilyNetworkSummary,
  professional: ProfessionalEngagement,
  compliance: ContactComplianceSummary,
  placement: PlacementImpactSummary,
  input: FamilyRelationshipsInput,
): string[] {
  const concerns: string[] = [];

  if (contact.total_sessions_90d === 0 && input.contact_arrangements.length > 0) {
    concerns.push("No family contact sessions recorded in 90 days despite active arrangements");
  }
  if ((contact.safe_pct ?? 0) < 80 && contact.total_sessions_90d > 0) {
    concerns.push(`${100 - (contact.safe_pct ?? 0)}% of contact sessions flagged safety concerns`);
  }
  if (contact.concerns_raised_90d > 3) {
    concerns.push(`${contact.concerns_raised_90d} concerns raised across contact sessions in 90 days`);
  }
  if (contact.contact_frequency_trend === "decreasing") {
    concerns.push("Contact frequency declining — fewer sessions than previous period");
  }
  if (family.risk_count > 0) {
    concerns.push(`${family.risk_count} identified risk relationship(s) in family network`);
  }
  if (family.estranged_count > 2) {
    concerns.push(`${family.estranged_count} estranged relationships — identity and belonging may be impacted`);
  }
  if (compliance.overdue_reviews > 0) {
    concerns.push(`${compliance.overdue_reviews} contact arrangement review(s) overdue`);
  }
  if (placement.family_related_missing > 0) {
    concerns.push(`${placement.family_related_missing} family-related missing episode(s) in 90 days`);
  }
  if (!family.genogram_available) {
    concerns.push("No genogram available — family identity mapping not yet completed");
  }
  if (professional.lac_reviews_last_12m < 2) {
    concerns.push(`Only ${professional.lac_reviews_last_12m} LAC review(s) in 12 months — may be below statutory minimum`);
  }

  return concerns.slice(0, 8);
}

// ── Recommendations ─────────────────────────────────────────────────────────

function buildRecommendations(
  contact: ContactAnalysis,
  family: FamilyNetworkSummary,
  professional: ProfessionalEngagement,
  compliance: ContactComplianceSummary,
  placement: PlacementImpactSummary,
  health: RelationshipHealth,
  input: FamilyRelationshipsInput,
): RelationshipRecommendation[] {
  const recs: RelationshipRecommendation[] = [];
  let rank = 0;

  if ((contact.safe_pct ?? 0) < 70 && contact.total_sessions_90d > 2) {
    recs.push({
      rank: ++rank,
      recommendation: "Review contact safety — multiple sessions flagged as unsafe requires immediate risk assessment",
      domain: "contact_safety",
      urgency: "immediate",
      regulatory_ref: "Reg 7",
    });
  }

  if (contact.total_sessions_90d === 0 && input.contact_arrangements.some((a) => a.status === "active")) {
    recs.push({
      rank: ++rank,
      recommendation: "Facilitate family contact — active arrangements exist but no sessions recorded",
      domain: "contact",
      urgency: "soon",
      regulatory_ref: "Reg 7",
    });
  }

  if (compliance.overdue_reviews > 0) {
    recs.push({
      rank: ++rank,
      recommendation: `Complete ${compliance.overdue_reviews} overdue contact arrangement review(s)`,
      domain: "compliance",
      urgency: "soon",
      regulatory_ref: "Reg 7",
    });
  }

  if (!family.genogram_available) {
    recs.push({
      rank: ++rank,
      recommendation: "Complete genogram — essential for identity work and family understanding",
      domain: "identity",
      urgency: "planned",
      regulatory_ref: "Reg 8",
    });
  }

  if (placement.family_related_missing > 1) {
    recs.push({
      rank: ++rank,
      recommendation: "Review contact arrangements — recurring family-related missing episodes indicate contact may be triggering",
      domain: "missing",
      urgency: "immediate",
      regulatory_ref: "Reg 15",
    });
  }

  if (professional.lac_reviews_last_12m < 2) {
    recs.push({
      rank: ++rank,
      recommendation: "Ensure statutory LAC review schedule is met — below minimum frequency",
      domain: "statutory",
      urgency: "soon",
      regulatory_ref: null,
    });
  }

  if (!contact.child_voice_captured && contact.total_sessions_90d > 0) {
    recs.push({
      rank: ++rank,
      recommendation: "Capture child's voice in contact records — currently absent from documentation",
      domain: "recording",
      urgency: "planned",
      regulatory_ref: "Reg 7",
    });
  }

  if (family.risk_count > 0 && compliance.suspended === 0) {
    recs.push({
      rank: ++rank,
      recommendation: "Review identified risk relationships — ensure safeguarding measures in place for contact",
      domain: "safeguarding",
      urgency: "soon",
      regulatory_ref: "Reg 7",
    });
  }

  if (contact.contact_frequency_trend === "decreasing") {
    recs.push({
      rank: ++rank,
      recommendation: "Investigate declining contact frequency — explore barriers and support family engagement",
      domain: "contact",
      urgency: "planned",
      regulatory_ref: null,
    });
  }

  return recs.slice(0, 10);
}

// ── Insights ────────────────────────────────────────────────────────────────

function generateInsights(
  contact: ContactAnalysis,
  family: FamilyNetworkSummary,
  professional: ProfessionalEngagement,
  compliance: ContactComplianceSummary,
  placement: PlacementImpactSummary,
  health: RelationshipHealth,
  input: FamilyRelationshipsInput,
): RelationshipInsight[] {
  const insights: RelationshipInsight[] = [];

  if (health === "thriving" || health === "stable") {
    insights.push({
      text: `${input.child_name} has a healthy relationship network with regular, safe family contact and active professional engagement.`,
      severity: "positive",
    });
  }

  if (health === "critical") {
    insights.push({
      text: `Critical relationship concerns for ${input.child_name} — contact, family network, or professional engagement indicators require urgent attention.`,
      severity: "critical",
    });
  }

  if (contact.unique_family_contacts >= 3 && contact.safe_pct === 100) {
    insights.push({
      text: `Maintaining meaningful contact with ${contact.unique_family_contacts} family members — all sessions safe, supporting identity and belonging.`,
      severity: "positive",
    });
  }

  if (contact.concerns_raised_90d > 5) {
    insights.push({
      text: `${contact.concerns_raised_90d} concerns raised across contact sessions — pattern analysis and safeguarding review recommended.`,
      severity: "critical",
    });
  }

  if (family.protective_count >= 3 && family.child_contributed_to_genogram) {
    insights.push({
      text: `Strong protective network with ${family.protective_count} identified supports, child actively engaged in identity work.`,
      severity: "positive",
    });
  }

  if (placement.contact_disruption_risk) {
    insights.push({
      text: "Contact disruption risk identified — placement instability and/or family-related missing episodes indicate relationship strain.",
      severity: "warning",
    });
  }

  if ((professional.family_attended_lac_pct ?? 0) >= 80 && professional.lac_reviews_last_12m >= 2) {
    insights.push({
      text: `Family attending ${professional.family_attended_lac_pct}% of LAC reviews — strong parental engagement in care planning.`,
      severity: "positive",
    });
  }

  if ((contact.positive_presentation_pct ?? 0) > 80 && contact.total_sessions_90d >= 3) {
    insights.push({
      text: "Consistently positive presentation after family contact — evidence of therapeutic value of maintained relationships.",
      severity: "positive",
    });
  }

  return insights.slice(0, 8);
}

// ── Headline ────────────────────────────────────────────────────────────────

function buildHeadline(
  name: string,
  health: RelationshipHealth,
  score: number,
  contact: ContactAnalysis,
): string {
  if (health === "critical") {
    return `${name} — critical relationship concerns, urgent review of contact and network support needed`;
  }
  if (health === "concerning") {
    return `${name} — relationship strain evident, proactive support for family connections recommended`;
  }
  if (health === "strained") {
    return `${name} — some relationship indicators need attention, particularly ${contact.concerns_raised_90d > 0 ? "contact quality" : "frequency of engagement"}`;
  }
  if (health === "thriving") {
    return `${name} — thriving family relationships with ${contact.unique_family_contacts} active contacts and strong network`;
  }
  return `${name} — stable family relationships, maintaining regular contact and professional engagement`;
}
