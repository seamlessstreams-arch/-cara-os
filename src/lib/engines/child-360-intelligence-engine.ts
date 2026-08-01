// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD 360 INTELLIGENCE ENGINE
// Per-child holistic intelligence profile aggregating all domains.
// Pure deterministic. No LLM calls, no DB access.
// CHR 2015 Reg 5 (RM duties), Reg 9 (care plan), Reg 14 (child participation).
// SCCIF: Helped & Protected, Overall Experiences.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface Child360Input {
  today: string;
  child: {
    id: string;
    first_name: string;
    preferred_name: string | null;
    date_of_birth: string;
    gender: string;
    ethnicity: string | null;
    religion: string | null;
    placement_start: string;
    placement_end: string | null;
    placement_type: string;
    legal_status: string;
    local_authority: string;
    social_worker_name: string;
    key_worker_id: string | null;
    risk_flags: string[];
    allergies: string[];
    school_name: string | null;
    status: string;
  };
  incidents: ChildIncidentInput[];
  daily_logs: ChildDailyLogInput[];
  medications: ChildMedicationInput[];
  medication_administrations: ChildMedAdminInput[];
  missing_episodes: ChildMissingInput[];
  risk_assessments: ChildRiskAssessmentInput[];
  keywork_sessions: ChildKeyworkInput[];
  outcome_targets: ChildOutcomeInput[];
  outcome_reviews: ChildOutcomeReviewInput[];
  contact_logs: ChildContactLogInput[];
  education_records: ChildEducationInput[];
  care_forms: ChildCareFormInput[];
  behaviour_logs: ChildBehaviourLogInput[];
  appointments: ChildAppointmentInput[];
  chronology_entries: ChildChronologyInput[];
  staff_name_map: Record<string, string>;
}

export interface ChildIncidentInput {
  id: string;
  type: string;
  severity: string;
  date: string;
  description: string;
  status: string;
  outcome: string | null;
}

export interface ChildDailyLogInput {
  date: string;
  entry_type: string;
  mood_score: number | null;
  is_significant: boolean;
  content: string;
}

export interface ChildMedicationInput {
  name: string;
  type: string;
  dosage: string;
  frequency: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
}

export interface ChildMedAdminInput {
  scheduled_time: string;
  status: string;
  medication_id: string;
}

export interface ChildMissingInput {
  date_missing: string;
  date_returned: string | null;
  duration_hours: number | null;
  risk_level: string;
  return_interview_completed: boolean;
  status: string;
}

export interface ChildRiskAssessmentInput {
  domain: string;
  current_level: string;
  previous_level: string;
  trend: string;
  status: string;
  assessed_date: string;
  review_date: string;
  triggers: string[];
}

export interface ChildKeyworkInput {
  theme: string;
  status: string;
  child_voice?: string;
  created_at: string;
  completed_at?: string;
}

export interface ChildOutcomeInput {
  domain: string;
  target_description: string;
  baseline_rating: number;
  current_rating: number;
  target_rating: number;
  direction: string;
  status: string;
  review_date: string;
}

export interface ChildOutcomeReviewInput {
  target_id: string;
  review_date: string;
  previous_rating: number;
  new_rating: number;
  direction: string;
  yp_participated: boolean;
}

export interface ChildContactLogInput {
  date: string;
  contact_type: string;
  outcome: string;
  yp_voice: string | null;
}

export interface ChildEducationInput {
  record_type: string;
  date: string;
  school: string;
  attendance_status: string;
  status: string;
}

export interface ChildCareFormInput {
  form_type: string;
  status: string;
  next_review: string | null;
  created_at: string;
}

export interface ChildBehaviourLogInput {
  date: string;
  direction: string;
  intensity: string;
  antecedent: string;
  behaviour: string;
  consequence: string;
}

export interface ChildAppointmentInput {
  date: string;
  type: string;
  provider: string;
  status: string;
  outcome: string | null;
}

export interface ChildChronologyInput {
  date: string;
  category: string;
  severity: string;
  summary: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type OverallWellbeingLevel = "thriving" | "stable" | "needs_attention" | "concerning" | "critical";
export type DomainRAG = "green" | "amber" | "red";

export interface Child360Result {
  child_id: string;
  child_name: string;
  generated_at: string;
  age_years: number;
  days_in_placement: number;
  overall_wellbeing: OverallWellbeingLevel;
  headline: string;

  domain_scores: DomainScore[];
  safety_profile: SafetyProfile;
  emotional_wellbeing: EmotionalWellbeingProfile;
  education_profile: EducationProfile;
  health_profile: HealthProfile;
  relationships_profile: RelationshipsProfile;
  outcomes_profile: OutcomesProfile;
  engagement_profile: EngagementProfile;

  strengths: string[];
  concerns: string[];
  priority_actions: PriorityAction[];
  insights: Child360Insight[];
  key_dates: UpcomingDate[];
}

export interface DomainScore {
  domain: string;
  domain_label: string;
  rag: DomainRAG;
  score: number | null;
  trend: "improving" | "stable" | "declining";
  summary: string;
}

export interface SafetyProfile {
  risk_level: string;
  active_risk_flags: string[];
  open_incidents_count: number;
  recent_incidents_30d: number;
  missing_episodes_90d: number;
  active_risk_assessments: { domain: string; level: string; trend: string }[];
  restraint_count_90d: number;
}

export interface EmotionalWellbeingProfile {
  average_mood_7d: number | null;
  average_mood_30d: number | null;
  mood_trend: "improving" | "stable" | "declining";
  significant_events_30d: number;
  keywork_sessions_30d: number;
  last_keywork_date: string | null;
  voice_captured: boolean;
  recent_themes: string[];
}

export interface EducationProfile {
  school_name: string | null;
  attendance_rate_30d: number | null;
  exclusion_days_term: number;
  positive_records_30d: number;
  concern_records_30d: number;
  rag: DomainRAG;
}

export interface HealthProfile {
  active_medications: number;
  medication_compliance_7d: number | null;
  missed_doses_7d: number;
  upcoming_appointments: number;
  overdue_appointments: number;
  health_appointments_30d: number;
  allergies: string[];
}

export interface RelationshipsProfile {
  contact_sessions_30d: number;
  positive_contacts_pct: number | null;
  contact_consistency: "consistent" | "inconsistent" | "no_data";
  family_voice_captured: boolean;
  yp_voice_on_contact: boolean;
}

export interface OutcomesProfile {
  total_active_targets: number;
  targets_on_track: number;
  targets_off_track: number;
  targets_achieved: number;
  average_progress_pct: number | null;
  domains_covered: string[];
  yp_participation_rate: number | null;
}

export interface EngagementProfile {
  daily_log_entries_7d: number;
  keywork_regularity: "regular" | "irregular" | "none";
  care_plans_current: number;
  care_plans_due_review: number;
  voice_entries_30d: number;
}

export interface PriorityAction {
  rank: number;
  action: string;
  domain: string;
  severity: "critical" | "high" | "medium" | "low";
  regulatory_ref: string | null;
}

export interface Child360Insight {
  text: string;
  severity: "critical" | "warning" | "positive";
  domain: string;
}

export interface UpcomingDate {
  date: string;
  label: string;
  type: string;
  overdue: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function daysAgo(date: string, today: string): number {
  return daysBetween(date, today);
}

function withinDays(date: string, today: string, days: number): boolean {
  const d = daysAgo(date, today);
  return d >= 0 && d <= days;
}

function ageInYears(dob: string, today: string): number {
  const birth = new Date(dob);
  const now = new Date(today);
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

// ── Core Compute ────────────────────────────────────────────────────────────

export function computeChild360(input: Child360Input): Child360Result {
  const { today, child } = input;
  const childName = child.preferred_name || child.first_name;
  const age = ageInYears(child.date_of_birth, today);
  const daysInPlacement = daysBetween(child.placement_start, today);

  const safety = computeSafety(input);
  const emotional = computeEmotional(input);
  const education = computeEducation(input);
  const health = computeHealth(input);
  const relationships = computeRelationships(input);
  const outcomes = computeOutcomes(input);
  const engagement = computeEngagement(input);

  const domainScores = buildDomainScores(safety, emotional, education, health, relationships, outcomes, engagement);
  const overall = computeOverallWellbeing(domainScores, safety);
  const headline = generateHeadline(childName, overall, domainScores);

  const strengths = identifyStrengths(domainScores, emotional, outcomes, relationships, engagement);
  const concerns = identifyConcerns(domainScores, safety, emotional, health, education);
  const priorityActions = buildPriorityActions(input, safety, health, education, engagement, outcomes);
  const insights = generateInsights(input, domainScores, safety, emotional, health, education, outcomes, relationships);
  const keyDates = buildKeyDates(input);

  return {
    child_id: child.id,
    child_name: childName,
    generated_at: today,
    age_years: age,
    days_in_placement: daysInPlacement,
    overall_wellbeing: overall,
    headline,
    domain_scores: domainScores,
    safety_profile: safety,
    emotional_wellbeing: emotional,
    education_profile: education,
    health_profile: health,
    relationships_profile: relationships,
    outcomes_profile: outcomes,
    engagement_profile: engagement,
    strengths,
    concerns,
    priority_actions: priorityActions,
    insights,
    key_dates: keyDates,
  };
}

// ── Safety ──────────────────────────────────────────────────────────────────

function computeSafety(input: Child360Input): SafetyProfile {
  const { today, child, incidents, missing_episodes, risk_assessments, behaviour_logs } = input;

  const openIncidents = incidents.filter((i) => i.status !== "closed").length;
  const recent30 = incidents.filter((i) => withinDays(i.date, today, 30)).length;
  const missing90 = missing_episodes.filter((m) => withinDays(m.date_missing, today, 90)).length;
  const restraints90 = behaviour_logs.filter(
    (b) => b.direction === "restraint" && withinDays(b.date, today, 90),
  ).length;

  const activeRAs = risk_assessments
    .filter((r) => r.status === "current")
    .map((r) => ({ domain: r.domain, level: r.current_level, trend: r.trend }));

  const highestRisk = activeRAs.reduce((worst, ra) => {
    const lvl = riskWeight(ra.level);
    return lvl > riskWeight(worst) ? ra.level : worst;
  }, "low");

  return {
    risk_level: highestRisk,
    active_risk_flags: child.risk_flags,
    open_incidents_count: openIncidents,
    recent_incidents_30d: recent30,
    missing_episodes_90d: missing90,
    active_risk_assessments: activeRAs,
    restraint_count_90d: restraints90,
  };
}

function riskWeight(level: string): number {
  if (level === "critical") return 4;
  if (level === "high") return 3;
  if (level === "medium") return 2;
  return 1;
}

// ── Emotional Wellbeing ─────────────────────────────────────────────────────

function computeEmotional(input: Child360Input): EmotionalWellbeingProfile {
  const { today, daily_logs, keywork_sessions } = input;

  const logs7d = daily_logs.filter((l) => withinDays(l.date, today, 7));
  const logs30d = daily_logs.filter((l) => withinDays(l.date, today, 30));

  const moods7d = logs7d.filter((l) => l.mood_score !== null).map((l) => l.mood_score!);
  const moods30d = logs30d.filter((l) => l.mood_score !== null).map((l) => l.mood_score!);
  const avg7d = moods7d.length > 0 ? Math.round((moods7d.reduce((s, m) => s + m, 0) / moods7d.length) * 10) / 10 : null;
  const avg30d = moods30d.length > 0 ? Math.round((moods30d.reduce((s, m) => s + m, 0) / moods30d.length) * 10) / 10 : null;

  let moodTrend: "improving" | "stable" | "declining" = "stable";
  if (avg7d !== null && avg30d !== null) {
    if (avg7d > avg30d + 0.5) moodTrend = "improving";
    else if (avg7d < avg30d - 0.5) moodTrend = "declining";
  }

  const significantEvents = logs30d.filter((l) => l.is_significant).length;
  const kw30 = keywork_sessions.filter((k) => k.created_at && withinDays(k.created_at, today, 30));
  const completedKw = kw30.filter((k) => k.status === "completed" || k.status === "reviewed");

  const allKwSorted = [...keywork_sessions]
    .filter((k) => k.completed_at)
    .sort((a, b) => b.completed_at!.localeCompare(a.completed_at!));
  const lastKwDate = allKwSorted.length > 0 ? allKwSorted[0].completed_at!.slice(0, 10) : null;

  const hasVoice = keywork_sessions.some((k) => k.child_voice && k.child_voice.trim().length > 0);
  const themes = [...new Set(keywork_sessions.slice(-10).map((k) => k.theme))];

  return {
    average_mood_7d: avg7d,
    average_mood_30d: avg30d,
    mood_trend: moodTrend,
    significant_events_30d: significantEvents,
    keywork_sessions_30d: completedKw.length,
    last_keywork_date: lastKwDate,
    voice_captured: hasVoice,
    recent_themes: themes,
  };
}

// ── Education ───────────────────────────────────────────────────────────────

function computeEducation(input: Child360Input): EducationProfile {
  const { today, child, education_records } = input;
  const recs30d = education_records.filter((r) => withinDays(r.date, today, 30));

  const attendanceRecs = recs30d.filter((r) => r.record_type === "attendance");
  const present = attendanceRecs.filter((r) => r.attendance_status === "present" || r.attendance_status === "late").length;
  const attendanceRate = attendanceRecs.length > 0 ? Math.round((present / attendanceRecs.length) * 100) : null;

  const exclusions = education_records.filter(
    (r) => r.record_type === "exclusion" && withinDays(r.date, today, 90),
  ).length;

  const positive = recs30d.filter((r) => r.status === "positive" || r.record_type === "achievement").length;
  const concerns = recs30d.filter((r) => r.status === "concern" || r.record_type === "concern").length;

  let rag: DomainRAG = "green";
  if (attendanceRate !== null && attendanceRate < 85) rag = "red";
  else if (attendanceRate !== null && attendanceRate < 92) rag = "amber";
  if (exclusions > 0) rag = "red";
  if (concerns > 2 && rag !== "red") rag = "amber";

  return {
    school_name: child.school_name,
    attendance_rate_30d: attendanceRate,
    exclusion_days_term: exclusions,
    positive_records_30d: positive,
    concern_records_30d: concerns,
    rag,
  };
}

// ── Health ───────────────────────────────────────────────────────────────────

function computeHealth(input: Child360Input): HealthProfile {
  const { today, medications, medication_administrations, appointments, child } = input;

  const activeMeds = medications.filter((m) => m.is_active);
  const admin7d = medication_administrations.filter((a) => withinDays(a.scheduled_time.slice(0, 10), today, 7));
  const given7d = admin7d.filter((a) => a.status === "given" || a.status === "administered").length;
  const compliance7d = admin7d.length > 0 ? Math.round((given7d / admin7d.length) * 100) : null;
  const missed7d = admin7d.filter((a) => a.status === "missed" || a.status === "refused" || a.status === "not_given").length;

  const upcoming = appointments.filter(
    (a) => a.date >= today && a.status !== "cancelled" && daysAgo(today, a.date) <= 30,
  ).length;
  const overdue = appointments.filter(
    (a) => a.date < today && (a.status === "scheduled" || a.status === "pending"),
  ).length;
  const healthAppts30d = appointments.filter((a) => withinDays(a.date, today, 30)).length;

  return {
    active_medications: activeMeds.length,
    medication_compliance_7d: compliance7d,
    missed_doses_7d: missed7d,
    upcoming_appointments: upcoming,
    overdue_appointments: overdue,
    health_appointments_30d: healthAppts30d,
    allergies: child.allergies,
  };
}

// ── Relationships ───────────────────────────────────────────────────────────

function computeRelationships(input: Child360Input): RelationshipsProfile {
  const { today, contact_logs } = input;
  const contacts30d = contact_logs.filter((c) => withinDays(c.date, today, 30));
  const positive = contacts30d.filter((c) => c.outcome === "positive").length;
  const positivePct = contacts30d.length > 0 ? Math.round((positive / contacts30d.length) * 100) : null;

  let consistency: "consistent" | "inconsistent" | "no_data" = "no_data";
  if (contacts30d.length >= 3) consistency = "consistent";
  else if (contacts30d.length > 0) consistency = "inconsistent";

  const familyVoice = contact_logs.some((c) => c.yp_voice !== null && c.yp_voice.trim().length > 0);
  const ypVoice = contact_logs.some((c) => c.yp_voice !== null && c.yp_voice.trim().length > 0);

  return {
    contact_sessions_30d: contacts30d.length,
    positive_contacts_pct: positivePct,
    contact_consistency: consistency,
    family_voice_captured: familyVoice,
    yp_voice_on_contact: ypVoice,
  };
}

// ── Outcomes ────────────────────────────────────────────────────────────────

function computeOutcomes(input: Child360Input): OutcomesProfile {
  const { outcome_targets, outcome_reviews } = input;

  const active = outcome_targets.filter((t) => t.status === "active");
  const achieved = outcome_targets.filter((t) => t.status === "achieved").length;
  const onTrack = active.filter((t) => t.direction === "improving" || t.current_rating >= t.target_rating).length;
  const offTrack = active.filter((t) => t.direction === "declining" || (t.direction === "stable" && t.current_rating < t.baseline_rating)).length;

  const progressPcts = active.map((t) => {
    const range = t.target_rating - t.baseline_rating;
    if (range <= 0) return 100;
    const progress = t.current_rating - t.baseline_rating;
    return Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
  });
  const avgProgress = progressPcts.length > 0
    ? Math.round(progressPcts.reduce((s, p) => s + p, 0) / progressPcts.length)
    : null;

  const domains = [...new Set(outcome_targets.map((t) => t.domain))];

  const recentReviews = outcome_reviews.slice(-10);
  const participated = recentReviews.filter((r) => r.yp_participated).length;
  const participationRate = recentReviews.length > 0
    ? Math.round((participated / recentReviews.length) * 100)
    : null;

  return {
    total_active_targets: active.length,
    targets_on_track: onTrack,
    targets_off_track: offTrack,
    targets_achieved: achieved,
    average_progress_pct: avgProgress,
    domains_covered: domains,
    yp_participation_rate: participationRate,
  };
}

// ── Engagement ──────────────────────────────────────────────────────────────

function computeEngagement(input: Child360Input): EngagementProfile {
  const { today, daily_logs, keywork_sessions, care_forms } = input;

  const logs7d = daily_logs.filter((l) => withinDays(l.date, today, 7)).length;

  const kw90 = keywork_sessions.filter(
    (k) => k.created_at && withinDays(k.created_at, today, 90) && (k.status === "completed" || k.status === "reviewed"),
  );
  let regularity: "regular" | "irregular" | "none" = "none";
  if (kw90.length >= 6) regularity = "regular";
  else if (kw90.length >= 2) regularity = "irregular";

  const currentPlans = care_forms.filter((f) => f.status === "active" || f.status === "current" || f.status === "approved").length;
  const dueReview = care_forms.filter((f) => f.next_review && f.next_review <= today).length;

  const voice30d = keywork_sessions.filter(
    (k) => k.child_voice && k.child_voice.trim().length > 0 && k.created_at && withinDays(k.created_at, today, 30),
  ).length;

  return {
    daily_log_entries_7d: logs7d,
    keywork_regularity: regularity,
    care_plans_current: currentPlans,
    care_plans_due_review: dueReview,
    voice_entries_30d: voice30d,
  };
}

// ── Domain Scores ───────────────────────────────────────────────────────────

function buildDomainScores(
  safety: SafetyProfile,
  emotional: EmotionalWellbeingProfile,
  education: EducationProfile,
  health: HealthProfile,
  relationships: RelationshipsProfile,
  outcomes: OutcomesProfile,
  engagement: EngagementProfile,
): DomainScore[] {
  const scores: DomainScore[] = [];

  // Safety
  const safetyScore = computeSafetyScore(safety);
  scores.push({
    domain: "safety",
    domain_label: "Safety & Safeguarding",
    rag: safetyScore >= 70 ? "green" : safetyScore > 50 ? "amber" : "red",
    score: safetyScore,
    trend: safety.active_risk_assessments.some((r) => r.trend === "escalating" || r.trend === "increasing") ? "declining" :
           safety.active_risk_assessments.some((r) => r.trend === "decreasing" || r.trend === "de_escalating") ? "improving" : "stable",
    summary: safetyScore >= 70 ? "Risks well-managed" : safetyScore >= 40 ? "Some concerns requiring monitoring" : "Elevated risk — action needed",
  });

  // Emotional
  const emoScore = computeEmotionalScore(emotional);
  scores.push({
    domain: "emotional",
    domain_label: "Emotional Wellbeing",
    rag: emoScore >= 70 ? "green" : emoScore >= 40 ? "amber" : "red",
    score: emoScore,
    trend: emotional.mood_trend,
    summary: emotional.mood_trend === "improving" ? "Mood improving" :
             emotional.mood_trend === "declining" ? "Mood declining — monitor closely" :
             "Emotional wellbeing stable",
  });

  // Education — factor exclusions into score
  let eduScore = education.attendance_rate_30d ?? 50;
  if (education.exclusion_days_term > 0) eduScore = Math.max(0, eduScore - education.exclusion_days_term * 15);
  if (education.concern_records_30d > 2) eduScore = Math.max(0, eduScore - 10);
  scores.push({
    domain: "education",
    domain_label: "Education & Learning",
    rag: education.rag,
    score: eduScore,
    trend: education.concern_records_30d > education.positive_records_30d ? "declining" :
           education.positive_records_30d > education.concern_records_30d ? "improving" : "stable",
    summary: education.attendance_rate_30d !== null ? `${education.attendance_rate_30d}% attendance` : "No attendance data",
  });

  // Health
  const healthScore = computeHealthScore(health);
  scores.push({
    domain: "health",
    domain_label: "Health & Medication",
    rag: healthScore >= 70 ? "green" : healthScore >= 40 ? "amber" : "red",
    score: healthScore,
    trend: health.missed_doses_7d > 2 ? "declining" : health.overdue_appointments > 0 ? "declining" : "stable",
    summary: health.medication_compliance_7d !== null ? `${health.medication_compliance_7d}% med compliance` : "No medication data",
  });

  // Relationships
  const relScore = computeRelationshipsScore(relationships);
  scores.push({
    domain: "relationships",
    domain_label: "Relationships & Contact",
    rag: relScore >= 70 ? "green" : relScore >= 40 ? "amber" : "red",
    score: relScore,
    trend: relationships.contact_consistency === "consistent" ? "stable" :
           relationships.contact_sessions_30d === 0 ? "declining" : "stable",
    summary: `${relationships.contact_sessions_30d} contacts in 30 days`,
  });

  // Outcomes — no active targets means no data, not red
  const outScore = outcomes.total_active_targets === 0 ? 50 : outcomes.average_progress_pct;
  scores.push({
    domain: "outcomes",
    domain_label: "Outcomes & Progress",
    rag: outcomes.total_active_targets === 0 ? "amber" : (outScore ?? 0) >= 60 ? "green" : (outScore ?? 0) >= 30 ? "amber" : "red",
    score: outScore,
    trend: outcomes.targets_on_track > outcomes.targets_off_track ? "improving" :
           outcomes.targets_off_track > outcomes.targets_on_track ? "declining" : "stable",
    summary: outcomes.total_active_targets > 0
      ? `${outcomes.targets_on_track}/${outcomes.total_active_targets} targets on track`
      : "No active targets",
  });

  // Engagement
  const engScore = computeEngagementScore(engagement);
  scores.push({
    domain: "engagement",
    domain_label: "Engagement & Voice",
    rag: engScore >= 70 ? "green" : engScore >= 40 ? "amber" : "red",
    score: engScore,
    trend: engagement.keywork_regularity === "regular" ? "improving" :
           engagement.keywork_regularity === "none" ? "declining" : "stable",
    summary: engagement.keywork_regularity === "regular" ? "Strong engagement" :
             engagement.keywork_regularity === "irregular" ? "Inconsistent engagement" : "Limited engagement",
  });

  return scores;
}

function computeSafetyScore(s: SafetyProfile): number {
  let score = 100;
  if (s.risk_level === "critical") score -= 50;
  else if (s.risk_level === "high") score -= 30;
  else if (s.risk_level === "medium") score -= 10;
  score -= s.open_incidents_count * 10;
  score -= s.missing_episodes_90d * 15;
  score -= s.restraint_count_90d * 10;
  score -= s.active_risk_flags.length * 5;
  return Math.max(0, Math.min(100, score));
}

function computeEmotionalScore(e: EmotionalWellbeingProfile): number {
  let score = 60;
  if (e.average_mood_7d !== null) {
    score = Math.round(e.average_mood_7d * 10);
  }
  if (e.keywork_sessions_30d >= 2) score += 10;
  if (e.voice_captured) score += 5;
  if (e.mood_trend === "declining") score -= 10;
  if (e.mood_trend === "improving") score += 5;
  return Math.max(0, Math.min(100, score));
}

function computeHealthScore(h: HealthProfile): number {
  let score = 80;
  if (h.medication_compliance_7d !== null) {
    score = h.medication_compliance_7d;
  }
  score -= h.missed_doses_7d * 5;
  score -= h.overdue_appointments * 10;
  return Math.max(0, Math.min(100, score));
}

function computeRelationshipsScore(r: RelationshipsProfile): number {
  let score = 50;
  if (r.contact_consistency === "consistent") score += 30;
  else if (r.contact_consistency === "inconsistent") score += 10;
  if (r.positive_contacts_pct !== null && r.positive_contacts_pct >= 70) score += 15;
  if (r.yp_voice_on_contact) score += 5;
  return Math.max(0, Math.min(100, score));
}

function computeEngagementScore(e: EngagementProfile): number {
  let score = 40;
  if (e.daily_log_entries_7d >= 5) score += 20;
  else if (e.daily_log_entries_7d >= 2) score += 10;
  if (e.keywork_regularity === "regular") score += 25;
  else if (e.keywork_regularity === "irregular") score += 10;
  if (e.voice_entries_30d >= 2) score += 15;
  if (e.care_plans_due_review > 0) score -= 10;
  return Math.max(0, Math.min(100, score));
}

// ── Overall Wellbeing ───────────────────────────────────────────────────────

function computeOverallWellbeing(domains: DomainScore[], safety: SafetyProfile): OverallWellbeingLevel {
  const redCount = domains.filter((d) => d.rag === "red").length;
  const amberCount = domains.filter((d) => d.rag === "amber").length;
  const avgScore = Math.round(domains.reduce((s, d) => s + (d.score ?? 0), 0) / domains.length);

  if (safety.risk_level === "critical" || redCount >= 3) return "critical";
  if (safety.risk_level === "high" || redCount >= 2) return "concerning";
  if (redCount >= 1 || (amberCount >= 3 && avgScore < 45)) return "needs_attention";
  if (avgScore >= 75) return "thriving";
  return "stable";
}

// ── Headline ────────────────────────────────────────────────────────────────

function generateHeadline(name: string, overall: OverallWellbeingLevel, domains: DomainScore[]): string {
  const improving = domains.filter((d) => d.trend === "improving").length;
  const declining = domains.filter((d) => d.trend === "declining").length;

  if (overall === "critical") return `${name} requires immediate multi-domain attention — ${domains.filter((d) => d.rag === "red").length} domains red-flagged`;
  if (overall === "concerning") return `${name} has emerging concerns across ${declining} domain${declining !== 1 ? "s" : ""} — proactive intervention recommended`;
  if (overall === "needs_attention") return `${name} needs focused support — ${domains.filter((d) => d.rag === "amber").length} domains require monitoring`;
  if (overall === "thriving") return `${name} is making strong progress — ${improving} domain${improving !== 1 ? "s" : ""} improving`;
  return `${name} is generally stable — continue current care approach`;
}

// ── Strengths & Concerns ────────────────────────────────────────────────────

function identifyStrengths(
  domains: DomainScore[],
  emotional: EmotionalWellbeingProfile,
  outcomes: OutcomesProfile,
  relationships: RelationshipsProfile,
  engagement: EngagementProfile,
): string[] {
  const strengths: string[] = [];
  const green = domains.filter((d) => d.rag === "green");
  for (const d of green) {
    strengths.push(`${d.domain_label}: ${d.summary}`);
  }
  if (emotional.voice_captured) strengths.push("Child's voice is being captured in keywork sessions");
  if (outcomes.targets_on_track > 0) strengths.push(`${outcomes.targets_on_track} outcome targets on track`);
  if (relationships.positive_contacts_pct !== null && relationships.positive_contacts_pct >= 80) {
    strengths.push("High proportion of positive family contacts");
  }
  if (engagement.keywork_regularity === "regular") strengths.push("Regular keywork engagement maintained");
  return strengths.slice(0, 8);
}

function identifyConcerns(
  domains: DomainScore[],
  safety: SafetyProfile,
  emotional: EmotionalWellbeingProfile,
  health: HealthProfile,
  education: EducationProfile,
): string[] {
  const concerns: string[] = [];
  const red = domains.filter((d) => d.rag === "red");
  for (const d of red) {
    concerns.push(`${d.domain_label}: ${d.summary}`);
  }
  if (safety.missing_episodes_90d > 0) concerns.push(`${safety.missing_episodes_90d} missing episodes in 90 days`);
  if (safety.restraint_count_90d > 0) concerns.push(`${safety.restraint_count_90d} restraint incidents in 90 days`);
  if (emotional.mood_trend === "declining") concerns.push("Mood trend declining — emotional wellbeing needs attention");
  if (health.missed_doses_7d > 2) concerns.push(`${health.missed_doses_7d} missed medication doses in 7 days`);
  if (health.overdue_appointments > 0) concerns.push(`${health.overdue_appointments} overdue health appointment(s)`);
  if (education.exclusion_days_term > 0) concerns.push(`${education.exclusion_days_term} exclusion(s) this term`);
  const declining = domains.filter((d) => d.trend === "declining");
  if (declining.length >= 2) concerns.push(`Multiple domains declining: ${declining.map((d) => d.domain_label).join(", ")}`);
  return concerns.slice(0, 8);
}

// ── Priority Actions ────────────────────────────────────────────────────────

function buildPriorityActions(
  input: Child360Input,
  safety: SafetyProfile,
  health: HealthProfile,
  education: EducationProfile,
  engagement: EngagementProfile,
  outcomes: OutcomesProfile,
): PriorityAction[] {
  const actions: PriorityAction[] = [];
  let rank = 0;

  if (safety.open_incidents_count > 0) {
    actions.push({ rank: ++rank, action: `Resolve ${safety.open_incidents_count} open incident(s)`, domain: "safety", severity: "critical", regulatory_ref: "Reg 40" });
  }

  const overdueRAs = input.risk_assessments.filter((r) => r.status === "current" && r.review_date < input.today);
  if (overdueRAs.length > 0) {
    actions.push({ rank: ++rank, action: `${overdueRAs.length} risk assessment(s) overdue for review`, domain: "safety", severity: "high", regulatory_ref: "Reg 12" });
  }

  if (safety.missing_episodes_90d > 0) {
    const noRI = input.missing_episodes.filter((m) => withinDays(m.date_missing, input.today, 90) && !m.return_interview_completed);
    if (noRI.length > 0) {
      actions.push({ rank: ++rank, action: `Complete ${noRI.length} outstanding return interview(s)`, domain: "safety", severity: "high", regulatory_ref: "Reg 34" });
    }
  }

  if (health.missed_doses_7d > 2) {
    actions.push({ rank: ++rank, action: `Address medication adherence — ${health.missed_doses_7d} missed doses this week`, domain: "health", severity: "high", regulatory_ref: "Reg 15" });
  }

  if (health.overdue_appointments > 0) {
    actions.push({ rank: ++rank, action: `Rebook ${health.overdue_appointments} overdue health appointment(s)`, domain: "health", severity: "medium", regulatory_ref: "Reg 15" });
  }

  if (education.attendance_rate_30d !== null && education.attendance_rate_30d < 90) {
    actions.push({ rank: ++rank, action: `Investigate low school attendance (${education.attendance_rate_30d}%)`, domain: "education", severity: "high", regulatory_ref: "Reg 8" });
  }

  if (engagement.care_plans_due_review > 0) {
    actions.push({ rank: ++rank, action: `Review ${engagement.care_plans_due_review} care plan(s) due for review`, domain: "engagement", severity: "medium", regulatory_ref: "Reg 9" });
  }

  if (engagement.keywork_regularity === "none") {
    actions.push({ rank: ++rank, action: "Schedule keywork session — none recorded in 90 days", domain: "engagement", severity: "medium", regulatory_ref: "Reg 9" });
  }

  if (outcomes.targets_off_track > 0) {
    actions.push({ rank: ++rank, action: `Review ${outcomes.targets_off_track} off-track outcome target(s)`, domain: "outcomes", severity: "medium", regulatory_ref: "Reg 9" });
  }

  return actions.slice(0, 10);
}

// ── Insights ────────────────────────────────────────────────────────────────

function generateInsights(
  input: Child360Input,
  domains: DomainScore[],
  safety: SafetyProfile,
  emotional: EmotionalWellbeingProfile,
  health: HealthProfile,
  education: EducationProfile,
  outcomes: OutcomesProfile,
  relationships: RelationshipsProfile,
): Child360Insight[] {
  const insights: Child360Insight[] = [];

  const greenCount = domains.filter((d) => d.rag === "green").length;
  if (greenCount >= 5) {
    insights.push({ text: `Strong holistic profile — ${greenCount}/7 domains green. Continue reinforcing positive trajectory.`, severity: "positive", domain: "overall" });
  }

  if (emotional.mood_trend === "declining" && safety.recent_incidents_30d > 0) {
    insights.push({ text: "Declining mood correlates with recent incidents — consider therapeutic support referral.", severity: "warning", domain: "emotional" });
  }

  if (emotional.mood_trend === "improving" && outcomes.targets_on_track > outcomes.targets_off_track) {
    insights.push({ text: "Improving mood aligns with positive outcome progress — evidence of effective care planning.", severity: "positive", domain: "emotional" });
  }

  if (relationships.contact_consistency === "inconsistent" && emotional.mood_trend === "declining") {
    insights.push({ text: "Inconsistent family contact may be contributing to declining mood — review contact plan.", severity: "warning", domain: "relationships" });
  }

  if (education.rag === "red" && emotional.mood_trend === "declining") {
    insights.push({ text: "Education and emotional wellbeing both declining — likely interconnected, needs holistic intervention.", severity: "critical", domain: "education" });
  }

  if (safety.missing_episodes_90d >= 2) {
    insights.push({ text: `Pattern of ${safety.missing_episodes_90d} missing episodes — review contextual safeguarding assessment.`, severity: "warning", domain: "safety" });
  }

  if (health.medication_compliance_7d !== null && health.medication_compliance_7d < 80) {
    insights.push({ text: `Medication compliance at ${health.medication_compliance_7d}% — explore barriers with young person and prescriber.`, severity: "warning", domain: "health" });
  }

  if (outcomes.yp_participation_rate !== null && outcomes.yp_participation_rate < 50) {
    insights.push({ text: `Young person participation in outcome reviews is ${outcomes.yp_participation_rate}% — strengthen child's voice (Reg 14).`, severity: "warning", domain: "outcomes" });
  }

  if (input.child.status === "current" && input.child.placement_end) {
    const daysToEnd = daysBetween(input.today, input.child.placement_end);
    if (daysToEnd > 0 && daysToEnd <= 90) {
      insights.push({ text: `Placement ending in ${daysToEnd} days — ensure pathway plan and leaving care preparation is on track.`, severity: "warning", domain: "placement" });
    }
  }

  const age = ageInYears(input.child.date_of_birth, input.today);
  if (age >= 16 && outcomes.domains_covered.length < 3) {
    insights.push({ text: "Young person aged 16+ has limited outcome domains — ensure independence and life skills targets are set.", severity: "warning", domain: "outcomes" });
  }

  return insights.slice(0, 8);
}

// ── Key Dates ───────────────────────────────────────────────────────────────

function buildKeyDates(input: Child360Input): UpcomingDate[] {
  const { today, risk_assessments, care_forms, appointments, child } = input;
  const dates: UpcomingDate[] = [];

  for (const ra of risk_assessments.filter((r) => r.status === "current")) {
    const overdue = ra.review_date < today;
    dates.push({ date: ra.review_date, label: `${ra.domain} risk assessment review`, type: "risk_review", overdue });
  }

  for (const cf of care_forms.filter((f) => f.next_review)) {
    const overdue = cf.next_review! < today;
    dates.push({ date: cf.next_review!, label: `${cf.form_type} plan review`, type: "care_plan_review", overdue });
  }

  for (const apt of appointments.filter((a) => a.date >= today && a.status !== "cancelled")) {
    dates.push({ date: apt.date, label: `${apt.type} — ${apt.provider}`, type: "appointment", overdue: false });
  }

  if (child.placement_end) {
    const overdue = child.placement_end < today;
    dates.push({ date: child.placement_end, label: "Placement end date", type: "placement", overdue });
  }

  dates.sort((a, b) => {
    if (a.overdue && !b.overdue) return -1;
    if (!a.overdue && b.overdue) return 1;
    return a.date.localeCompare(b.date);
  });

  return dates.slice(0, 10);
}
