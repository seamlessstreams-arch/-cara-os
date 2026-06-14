// ==============================================================================
// CARA -- MUSIC & PERFORMING ARTS SERVICE
// Tracks music lessons, performing arts sessions, music therapy, drama, dance,
// songwriting, music production, choir, band/ensemble participation, spoken word,
// and other creative performing activities for looked-after children.
//
// Covers: Activity type and classification (therapy vs recreational), therapeutic
// intent verification, qualified therapist confirmation, instrument provision,
// child choice, engagement level, emotional expression, confidence building,
// social interaction, performance opportunities, achievement tracking, group/
// individual sessions, mood monitoring (before/after), care plan linkage, and
// progress notes.
//
// UK Regulatory Framework:
// CHR 2015 Reg 9 (quality of care — therapeutic activities must be delivered by
// qualified practitioners where therapeutic intent is claimed),
// CHR 2015 Reg 10 (enjoyment and achievement — "The home must promote the
// child's participation in activities"),
// SCCIF: Experiences & progress — "Children are encouraged to develop their
// talents and interests" and "The home provides therapeutic interventions."
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const ACTIVITY_TYPES = [
  "Singing/Vocal",
  "Piano/Keyboard",
  "Guitar",
  "Drums/Percussion",
  "Violin/Strings",
  "DJ/Electronic Music",
  "Songwriting",
  "Music Production",
  "Dance",
  "Drama/Acting",
  "Musical Theatre",
  "Spoken Word/Poetry",
  "Band/Ensemble",
  "Choir",
  "Music Therapy",
  "Other",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ENGAGEMENT_LEVELS = [
  "Refused",
  "Reluctant",
  "Participated",
  "Engaged",
  "Enthusiastic",
] as const;
export type EngagementLevel = (typeof ENGAGEMENT_LEVELS)[number];

export const MOOD_LEVELS = [
  "Very Low",
  "Low",
  "Neutral",
  "Positive",
  "Very Positive",
] as const;
export type MoodLevel = (typeof MOOD_LEVELS)[number];

export const GROUP_TYPES = [
  "Individual",
  "Pair",
  "Small Group",
  "Large Group",
] as const;
export type GroupType = (typeof GROUP_TYPES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const THERAPEUTIC_ACTIVITY_TYPES: ActivityType[] = [
  "Music Therapy",
];

export const PERFORMANCE_ACTIVITY_TYPES: ActivityType[] = [
  "Singing/Vocal",
  "Drama/Acting",
  "Musical Theatre",
  "Spoken Word/Poetry",
  "Band/Ensemble",
  "Choir",
];

export const INSTRUMENT_ACTIVITY_TYPES: ActivityType[] = [
  "Piano/Keyboard",
  "Guitar",
  "Drums/Percussion",
  "Violin/Strings",
  "DJ/Electronic Music",
];

export const CREATIVE_ACTIVITY_TYPES: ActivityType[] = [
  "Songwriting",
  "Music Production",
  "DJ/Electronic Music",
];

export const POSITIVE_ENGAGEMENT_LEVELS: EngagementLevel[] = [
  "Participated",
  "Engaged",
  "Enthusiastic",
];

export const POSITIVE_MOOD_LEVELS: MoodLevel[] = [
  "Positive",
  "Very Positive",
];

// -- Label maps ---------------------------------------------------------------

export const ACTIVITY_TYPE_LABELS: { type: ActivityType; label: string }[] = [
  { type: "Singing/Vocal", label: "Singing/Vocal" },
  { type: "Piano/Keyboard", label: "Piano/Keyboard" },
  { type: "Guitar", label: "Guitar" },
  { type: "Drums/Percussion", label: "Drums/Percussion" },
  { type: "Violin/Strings", label: "Violin/Strings" },
  { type: "DJ/Electronic Music", label: "DJ/Electronic Music" },
  { type: "Songwriting", label: "Songwriting" },
  { type: "Music Production", label: "Music Production" },
  { type: "Dance", label: "Dance" },
  { type: "Drama/Acting", label: "Drama/Acting" },
  { type: "Musical Theatre", label: "Musical Theatre" },
  { type: "Spoken Word/Poetry", label: "Spoken Word/Poetry" },
  { type: "Band/Ensemble", label: "Band/Ensemble" },
  { type: "Choir", label: "Choir" },
  { type: "Music Therapy", label: "Music Therapy" },
  { type: "Other", label: "Other" },
];

export const ENGAGEMENT_LEVEL_LABELS: { level: EngagementLevel; label: string }[] = [
  { level: "Refused", label: "Refused" },
  { level: "Reluctant", label: "Reluctant" },
  { level: "Participated", label: "Participated" },
  { level: "Engaged", label: "Engaged" },
  { level: "Enthusiastic", label: "Enthusiastic" },
];

export const MOOD_LEVEL_LABELS: { level: MoodLevel; label: string }[] = [
  { level: "Very Low", label: "Very Low" },
  { level: "Low", label: "Low" },
  { level: "Neutral", label: "Neutral" },
  { level: "Positive", label: "Positive" },
  { level: "Very Positive", label: "Very Positive" },
];

export const GROUP_TYPE_LABELS: { type: GroupType; label: string }[] = [
  { type: "Individual", label: "Individual" },
  { type: "Pair", label: "Pair" },
  { type: "Small Group", label: "Small Group" },
  { type: "Large Group", label: "Large Group" },
];

// -- Row type -----------------------------------------------------------------

export interface MusicPerformingArtsRow {
  id: string;
  home_id: string;
  child_name: string;
  session_date: string;
  facilitator_name: string;
  activity_type: ActivityType;
  therapeutic_intent: boolean;
  therapist_qualified: boolean | null;
  instrument_provided: boolean | null;
  child_choice: boolean;
  engagement_level: EngagementLevel;
  emotional_expression: boolean;
  confidence_building: boolean;
  social_interaction: boolean;
  performance_opportunity: boolean;
  achievement_noted: string | null;
  group_or_individual: GroupType;
  mood_before: MoodLevel;
  mood_after: MoodLevel;
  linked_to_care_plan: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateMusicPerformingArts(input: {
  childName?: string;
  sessionDate?: string;
  facilitatorName?: string;
  activityType?: string;
  therapeuticIntent?: boolean;
  therapistQualified?: boolean | null;
  engagementLevel?: string;
  moodBefore?: string;
  moodAfter?: string;
  performanceOpportunity?: boolean;
  childChoice?: boolean;
}): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.sessionDate) {
    errors.push("Session date is required");
  } else {
    const dateObj = new Date(input.sessionDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Session date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Session date cannot be in the future");
    }
  }

  if (!input.facilitatorName || input.facilitatorName.trim().length === 0) {
    errors.push("Facilitator name is required");
  }

  if (!input.activityType || !(ACTIVITY_TYPES as readonly string[]).includes(input.activityType)) {
    errors.push(`Activity type must be one of: ${ACTIVITY_TYPES.join(", ")}`);
  }

  if (
    input.engagementLevel &&
    !(ENGAGEMENT_LEVELS as readonly string[]).includes(input.engagementLevel)
  ) {
    errors.push(`Engagement level must be one of: ${ENGAGEMENT_LEVELS.join(", ")}`);
  }

  if (
    input.moodBefore &&
    !(MOOD_LEVELS as readonly string[]).includes(input.moodBefore)
  ) {
    errors.push(`Mood before must be one of: ${MOOD_LEVELS.join(", ")}`);
  }

  if (
    input.moodAfter &&
    !(MOOD_LEVELS as readonly string[]).includes(input.moodAfter)
  ) {
    errors.push(`Mood after must be one of: ${MOOD_LEVELS.join(", ")}`);
  }

  // Business rule: If therapeutic_intent is true, therapist_qualified must be true
  // CHR 2015 Reg 9 — therapeutic activities must be delivered by qualified practitioners
  if (input.therapeuticIntent === true && input.therapistQualified !== true) {
    errors.push(
      "Therapeutic intent is indicated but the session was not delivered by a qualified therapist — CHR 2015 Reg 9 requires that therapeutic activities are delivered by appropriately qualified practitioners. Music therapy, drama therapy, and dance movement therapy are HCPC-regulated professions in the UK. Sessions with therapeutic intent must be facilitated by a registered therapist (e.g., HCPC-registered music therapist, drama therapist, or dance movement therapist)",
    );
  }

  // Business rule: If performance_opportunity is true and child_choice is false,
  // emit advisory warning about ensuring YP consented to perform
  if (input.performanceOpportunity === true && input.childChoice === false) {
    warnings.push(
      "Performance opportunity recorded but child choice is not indicated — ensure the young person genuinely consented to perform. Looked-after children may feel pressured to participate in performances to please staff or peers. CHR 2015 Reg 10 requires that children are treated with dignity and their views, wishes, and feelings are taken into account. Performance should always be the child's free choice, never compelled or assumed",
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: MusicPerformingArtsRow[],
): {
  total_sessions: number;
  unique_children: number;
  by_activity_type: Record<string, number>;
  by_engagement_level: Record<string, number>;
  by_group_type: Record<string, number>;
  therapeutic_intent_count: number;
  therapist_qualified_rate: number;
  instrument_provided_rate: number;
  child_choice_rate: number;
  engagement_rate: number;
  emotional_expression_rate: number;
  confidence_building_rate: number;
  social_interaction_rate: number;
  performance_opportunity_rate: number;
  care_plan_link_rate: number;
  mood_improvement_rate: number;
  average_sessions_per_child: number;
  performance_activity_count: number;
  instrument_activity_count: number;
  creative_activity_count: number;
} {
  const total = rows.length;

  // Unique children
  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Activity type breakdown
  const byActivityType: Record<string, number> = {};
  for (const at of ACTIVITY_TYPES) byActivityType[at] = 0;
  for (const r of rows) byActivityType[r.activity_type] = (byActivityType[r.activity_type] || 0) + 1;

  // Engagement level breakdown
  const byEngagement: Record<string, number> = {};
  for (const el of ENGAGEMENT_LEVELS) byEngagement[el] = 0;
  for (const r of rows) byEngagement[r.engagement_level] = (byEngagement[r.engagement_level] || 0) + 1;

  // Group type breakdown
  const byGroupType: Record<string, number> = {};
  for (const gt of GROUP_TYPES) byGroupType[gt] = 0;
  for (const r of rows) byGroupType[r.group_or_individual] = (byGroupType[r.group_or_individual] || 0) + 1;

  // Therapeutic intent count
  const therapeuticIntentCount = rows.filter((r) => r.therapeutic_intent).length;

  // Boolean rates
  const therapistQualifiedRate = total > 0
    ? Math.round((rows.filter((r) => r.therapist_qualified === true).length / total) * 1000) / 10
    : 0;

  const instrumentProvidedRate = total > 0
    ? Math.round((rows.filter((r) => r.instrument_provided === true).length / total) * 1000) / 10
    : 0;

  const childChoiceRate = total > 0
    ? Math.round((rows.filter((r) => r.child_choice).length / total) * 1000) / 10
    : 0;

  const engagementRate = total > 0
    ? Math.round(
        (rows.filter((r) => (POSITIVE_ENGAGEMENT_LEVELS as string[]).includes(r.engagement_level)).length /
          total) *
          1000,
      ) / 10
    : 0;

  const emotionalExpressionRate = total > 0
    ? Math.round((rows.filter((r) => r.emotional_expression).length / total) * 1000) / 10
    : 0;

  const confidenceBuildingRate = total > 0
    ? Math.round((rows.filter((r) => r.confidence_building).length / total) * 1000) / 10
    : 0;

  const socialInteractionRate = total > 0
    ? Math.round((rows.filter((r) => r.social_interaction).length / total) * 1000) / 10
    : 0;

  const performanceOpportunityRate = total > 0
    ? Math.round((rows.filter((r) => r.performance_opportunity).length / total) * 1000) / 10
    : 0;

  const carePlanLinkRate = total > 0
    ? Math.round((rows.filter((r) => r.linked_to_care_plan).length / total) * 1000) / 10
    : 0;

  // Mood improvement: mood_after is higher than mood_before
  const moodIndex = (m: MoodLevel) => MOOD_LEVELS.indexOf(m);
  const moodImprovedCount = rows.filter(
    (r) => moodIndex(r.mood_after) > moodIndex(r.mood_before),
  ).length;
  const moodImprovementRate = total > 0
    ? Math.round((moodImprovedCount / total) * 1000) / 10
    : 0;

  // Category counts
  const performanceActivityCount = rows.filter(
    (r) => (PERFORMANCE_ACTIVITY_TYPES as string[]).includes(r.activity_type),
  ).length;

  const instrumentActivityCount = rows.filter(
    (r) => (INSTRUMENT_ACTIVITY_TYPES as string[]).includes(r.activity_type),
  ).length;

  const creativeActivityCount = rows.filter(
    (r) => (CREATIVE_ACTIVITY_TYPES as string[]).includes(r.activity_type),
  ).length;

  // Average sessions per child
  const avgPerChild = uniqueChildren.size > 0
    ? Math.round((total / uniqueChildren.size) * 10) / 10
    : 0;

  return {
    total_sessions: total,
    unique_children: uniqueChildren.size,
    by_activity_type: byActivityType,
    by_engagement_level: byEngagement,
    by_group_type: byGroupType,
    therapeutic_intent_count: therapeuticIntentCount,
    therapist_qualified_rate: therapistQualifiedRate,
    instrument_provided_rate: instrumentProvidedRate,
    child_choice_rate: childChoiceRate,
    engagement_rate: engagementRate,
    emotional_expression_rate: emotionalExpressionRate,
    confidence_building_rate: confidenceBuildingRate,
    social_interaction_rate: socialInteractionRate,
    performance_opportunity_rate: performanceOpportunityRate,
    care_plan_link_rate: carePlanLinkRate,
    mood_improvement_rate: moodImprovementRate,
    average_sessions_per_child: avgPerChild,
    performance_activity_count: performanceActivityCount,
    instrument_activity_count: instrumentActivityCount,
    creative_activity_count: creativeActivityCount,
  };
}

export function computeAlerts(
  rows: MusicPerformingArtsRow[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // Critical: Therapeutic intent without qualified therapist
  for (const r of rows) {
    if (r.therapeutic_intent && r.therapist_qualified !== true) {
      alerts.push({
        type: "therapeutic_no_qualified_therapist",
        severity: "critical",
        message: `${r.activity_type} session for ${r.child_name} on ${r.session_date} has therapeutic intent but was not delivered by a qualified therapist — CHR 2015 Reg 9 requires that therapeutic activities are delivered by appropriately qualified practitioners. Music therapy, drama therapy, and dance movement therapy are HCPC-regulated professions in the UK. A session with therapeutic intent must be facilitated by a registered therapist. Without this, the session cannot legitimately claim therapeutic benefit and should be reclassified as a recreational or educational activity`,
        record_id: r.id,
      });
    }
  }

  // High: Performance opportunity without child choice
  for (const r of rows) {
    if (r.performance_opportunity && !r.child_choice) {
      alerts.push({
        type: "performance_without_consent",
        severity: "high",
        message: `${r.activity_type} session for ${r.child_name} on ${r.session_date} included a performance opportunity but child choice was not recorded — looked-after children may feel pressured to participate in performances to please staff or peers. CHR 2015 Reg 10 requires that children are treated with dignity and their views are taken into account. Performance must always be the child's free and informed choice. Ensure the young person genuinely consented to perform and that their decision was documented`,
        record_id: r.id,
      });
    }
  }

  // High: Repeated refusal by same child
  const childRefusalMap = new Map<string, MusicPerformingArtsRow[]>();
  for (const r of rows) {
    if (r.engagement_level === "Refused") {
      const key = r.child_name.toLowerCase().trim();
      if (!childRefusalMap.has(key)) childRefusalMap.set(key, []);
      childRefusalMap.get(key)!.push(r);
    }
  }
  for (const [, childRows] of childRefusalMap) {
    if (childRows.length >= 3) {
      alerts.push({
        type: "repeated_refusal",
        severity: "high",
        message: `${childRows[0].child_name} has refused ${childRows.length} music/performing arts sessions — while child choice should always be respected (CHR 2015 Reg 9 requires child-centred care), repeated refusal may indicate the child has concerns that need exploring. Are they anxious about performing? Have they had negative experiences with music or performance? Do they feel forced or obligated? The child's views must be sought sensitively and alternative creative outlets offered`,
      });
    }
  }

  // High: Repeated mood decline for same child
  const moodIndex = (m: MoodLevel) => MOOD_LEVELS.indexOf(m);
  const childMoodDeclineMap = new Map<string, MusicPerformingArtsRow[]>();
  for (const r of rows) {
    if (moodIndex(r.mood_after) < moodIndex(r.mood_before)) {
      const key = r.child_name.toLowerCase().trim();
      if (!childMoodDeclineMap.has(key)) childMoodDeclineMap.set(key, []);
      childMoodDeclineMap.get(key)!.push(r);
    }
  }
  for (const [, childRows] of childMoodDeclineMap) {
    if (childRows.length >= 3) {
      alerts.push({
        type: "repeated_mood_decline",
        severity: "high",
        message: `${childRows[0].child_name} has experienced mood decline across ${childRows.length} music/performing arts sessions — activities should enhance wellbeing, not diminish it. If a child's mood is consistently lower after sessions, this requires investigation. Is the activity triggering difficult emotions or memories? Is the child feeling pressured, embarrassed, or compared unfavourably to peers? CHR 2015 Reg 10 requires the home to promote the child's emotional wellbeing. Consider whether this activity type is appropriate or whether modifications are needed`,
      });
    }
  }

  // High: Low care plan linkage for therapeutic sessions
  const therapeuticRows = rows.filter((r) => r.therapeutic_intent);
  const therapeuticLinked = therapeuticRows.filter((r) => r.linked_to_care_plan).length;
  if (therapeuticRows.length >= 3 && therapeuticLinked / therapeuticRows.length < 0.5) {
    alerts.push({
      type: "low_care_plan_linkage_therapeutic",
      severity: "high",
      message: `Only ${Math.round((therapeuticLinked / therapeuticRows.length) * 100)}% of therapeutic music/performing arts sessions are linked to care plans — therapeutic interventions should be a planned part of the child's care, not ad hoc. SCCIF inspectors expect to see that therapeutic provision is purposeful and aligned with assessed needs. The care plan should specify therapeutic goals and the therapy should demonstrably contribute to those goals`,
    });
  }

  // Medium: Low child choice rate
  const childChoiceCount = rows.filter((r) => r.child_choice).length;
  if (rows.length >= 5 && childChoiceCount / rows.length < 0.5) {
    alerts.push({
      type: "low_child_choice_rate",
      severity: "medium",
      message: `Child choice recorded in only ${Math.round((childChoiceCount / rows.length) * 100)}% of sessions — CHR 2015 Reg 9 requires child-centred care, and UNCRC Article 12 enshrines the child's right to have their views taken into account. Music and performing arts activities should be offered as choices, not imposed. Children who choose to participate are more likely to engage meaningfully and experience genuine enjoyment. Is the home offering real choices about which activities to join?`,
    });
  }

  // Medium: No variety in activity types
  const activeTypes = Object.entries(
    rows.reduce((acc, r) => { acc[r.activity_type] = (acc[r.activity_type] || 0) + 1; return acc; }, {} as Record<string, number>),
  ).filter(([, count]) => count > 0);
  if (rows.length >= 8 && activeTypes.length <= 2) {
    alerts.push({
      type: "low_activity_variety",
      severity: "medium",
      message: `Only ${activeTypes.length} different activity type${activeTypes.length === 1 ? " is" : "s are"} being offered — music and performing arts encompass a wide range of creative disciplines. Different children respond to different creative outlets; some thrive with instruments, others with vocal work, dance, drama, or creative composition. CHR 2015 Reg 10 requires the home to promote each child's participation in activities suited to their needs and preferences. Is the home offering a sufficient range?`,
    });
  }

  // Medium: Low emotional expression rate
  const emotionalExpressionCount = rows.filter((r) => r.emotional_expression).length;
  if (rows.length >= 5 && emotionalExpressionCount / rows.length < 0.3) {
    alerts.push({
      type: "low_emotional_expression",
      severity: "medium",
      message: `Emotional expression observed in only ${Math.round((emotionalExpressionCount / rows.length) * 100)}% of sessions — music and performing arts are valued precisely because they provide safe channels for emotional expression, particularly for looked-after children who may struggle to articulate feelings verbally. If emotional expression is rarely being observed, consider whether the facilitation approach is creating a sufficiently safe and encouraging environment, or whether the activity types offered are well-matched to the children's needs`,
    });
  }

  // Medium: Low confidence building rate
  const confidenceCount = rows.filter((r) => r.confidence_building).length;
  if (rows.length >= 5 && confidenceCount / rows.length < 0.3) {
    alerts.push({
      type: "low_confidence_building",
      severity: "medium",
      message: `Confidence building observed in only ${Math.round((confidenceCount / rows.length) * 100)}% of sessions — one of the key benefits of music and performing arts for looked-after children is building self-esteem and confidence. If sessions are not contributing to confidence, review whether facilitators are using strengths-based approaches, celebrating small achievements, and creating a non-judgemental atmosphere where it is safe to try and fail`,
    });
  }

  // Medium: Low mood improvement rate
  const moodImprovedCount = rows.filter(
    (r) => moodIndex(r.mood_after) > moodIndex(r.mood_before),
  ).length;
  if (rows.length >= 5 && moodImprovedCount / rows.length < 0.3) {
    alerts.push({
      type: "low_mood_improvement",
      severity: "medium",
      message: `Mood improvement observed in only ${Math.round((moodImprovedCount / rows.length) * 100)}% of sessions — music and performing arts activities are expected to positively impact emotional wellbeing. If sessions are not improving mood, this may indicate that the activities are not well-matched to children's interests, that the environment is too pressured, or that the facilitation style needs adjusting. CHR 2015 Reg 10 requires the home to promote children's enjoyment and achievement`,
    });
  }

  return alerts;
}

export function generateCaraInsights(
  rows: MusicPerformingArtsRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_activity_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const engagementBreakdown = Object.entries(metrics.by_engagement_level)
    .filter(([, count]) => count > 0)
    .map(([level, count]) => `${level}: ${count}`)
    .join(", ");

  const groupBreakdown = Object.entries(metrics.by_group_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_sessions} music/performing arts ${metrics.total_sessions === 1 ? "session" : "sessions"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Activity types: ${typeBreakdown || "none recorded"}. ` +
      `Engagement: ${engagementBreakdown || "none"}. ` +
      `Group format: ${groupBreakdown || "none"}. ` +
      `Therapeutic sessions: ${metrics.therapeutic_intent_count}. ` +
      `Average sessions per child: ${metrics.average_sessions_per_child}. ` +
      `Engagement rate: ${metrics.engagement_rate}%. ` +
      `Mood improvement rate: ${metrics.mood_improvement_rate}%.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Child choice rate: ${metrics.child_choice_rate}%. ` +
        `Emotional expression rate: ${metrics.emotional_expression_rate}%. ` +
        `Confidence building rate: ${metrics.confidence_building_rate}%. ` +
        `Social interaction rate: ${metrics.social_interaction_rate}%. ` +
        `Performance opportunity rate: ${metrics.performance_opportunity_rate}%. ` +
        `Care plan linked: ${metrics.care_plan_link_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts. ` +
        `Child choice rate: ${metrics.child_choice_rate}%. ` +
        `Emotional expression rate: ${metrics.emotional_expression_rate}%. ` +
        `Confidence building rate: ${metrics.confidence_building_rate}%. ` +
        `Social interaction rate: ${metrics.social_interaction_rate}%. ` +
        `Performance opportunity rate: ${metrics.performance_opportunity_rate}%. ` +
        `Care plan linked: ${metrics.care_plan_link_rate}%. ` +
        `Continue promoting creative participation per CHR 2015 Reg 10.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.mood_improvement_rate < 30 && metrics.total_sessions > 5) {
    insights.push(
      `[reflect] Mood improvement is observed in only ${metrics.mood_improvement_rate}% of sessions. ` +
        `Music and performing arts are powerful tools for emotional regulation ` +
        `and mood enhancement — research consistently shows that active music-making ` +
        `releases endorphins and reduces cortisol. If sessions are not improving ` +
        `mood, consider whether the activities match children's preferences, ` +
        `whether the environment feels safe and non-judgemental, and whether ` +
        `sessions are appropriately structured for each child's developmental ` +
        `stage. CHR 2015 Reg 10 requires the home to promote enjoyment and ` +
        `achievement — are music and performing arts sessions genuinely ` +
        `enjoyable for the children, or do they feel like obligations?`,
    );
  } else if (metrics.child_choice_rate < 40 && metrics.total_sessions > 5) {
    insights.push(
      `[reflect] Child choice is recorded in only ${metrics.child_choice_rate}% of sessions. ` +
        `Creative activities are most meaningful when freely chosen. Many ` +
        `looked-after children have experienced a profound lack of control ` +
        `over their lives, and creative activities should restore a sense ` +
        `of agency. CHR 2015 Reg 9 requires child-centred care, and UNCRC ` +
        `Article 12 requires that children's views are sought. Are children ` +
        `being consulted about which creative activities interest them? Is ` +
        `the home offering genuine choice, or scheduling sessions without ` +
        `asking? For children with performance anxiety or trauma histories, ` +
        `the ability to decline — and be respected — is essential.`,
    );
  } else if (metrics.care_plan_link_rate < 30 && metrics.total_sessions > 5) {
    insights.push(
      `[reflect] Only ${metrics.care_plan_link_rate}% of sessions are linked to care plans. ` +
        `SCCIF: Experiences & progress expects that activities contribute to ` +
        `assessed outcomes. Music and performing arts can address a wide range ` +
        `of therapeutic and developmental goals — emotional regulation, social ` +
        `skills, confidence, identity, cultural connection, communication. ` +
        `Without care plan linkage, these sessions risk being seen as pleasant ` +
        `diversions rather than purposeful interventions. Is each child's care ` +
        `plan reflecting how creative activities support their specific goals?`,
    );
  } else {
    insights.push(
      `[reflect] How does the home evaluate whether its music and performing arts ` +
        `programme is genuinely benefiting each child? Beyond engagement and ` +
        `mood measures, consider whether children are developing new skills, ` +
        `building confidence that transfers to other areas of life, forming ` +
        `positive relationships through creative collaboration, and discovering ` +
        `talents that could support their future aspirations. CHR 2015 Reg 10 ` +
        `requires the home to promote achievement — are facilitators tracking ` +
        `progress, celebrating milestones, and helping children see their own ` +
        `growth? Is the programme connecting to wider opportunities (e.g., ` +
        `Arts Award, graded exams, community performances)?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    activityType?: ActivityType;
    engagementLevel?: EngagementLevel;
    limit?: number;
  },
): Promise<ServiceResult<MusicPerformingArtsRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_music_performing_arts") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.activityType) q = q.eq("activity_type", filters.activityType);
  if (filters?.engagementLevel) q = q.eq("engagement_level", filters.engagementLevel);

  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<MusicPerformingArtsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_music_performing_arts") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  sessionDate: string;
  facilitatorName: string;
  activityType: ActivityType;
  therapeuticIntent?: boolean;
  therapistQualified?: boolean | null;
  instrumentProvided?: boolean | null;
  childChoice?: boolean;
  engagementLevel?: EngagementLevel;
  emotionalExpression?: boolean;
  confidenceBuilding?: boolean;
  socialInteraction?: boolean;
  performanceOpportunity?: boolean;
  achievementNoted?: string | null;
  groupOrIndividual?: GroupType;
  moodBefore?: MoodLevel;
  moodAfter?: MoodLevel;
  linkedToCarePlan?: boolean;
  notes?: string | null;
}): Promise<ServiceResult<MusicPerformingArtsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateMusicPerformingArts({
    childName: input.childName,
    sessionDate: input.sessionDate,
    facilitatorName: input.facilitatorName,
    activityType: input.activityType,
    therapeuticIntent: input.therapeuticIntent,
    therapistQualified: input.therapistQualified,
    engagementLevel: input.engagementLevel,
    moodBefore: input.moodBefore,
    moodAfter: input.moodAfter,
    performanceOpportunity: input.performanceOpportunity,
    childChoice: input.childChoice,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_music_performing_arts") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      session_date: input.sessionDate,
      facilitator_name: input.facilitatorName,
      activity_type: input.activityType,
      therapeutic_intent: input.therapeuticIntent ?? false,
      therapist_qualified: input.therapistQualified ?? null,
      instrument_provided: input.instrumentProvided ?? null,
      child_choice: input.childChoice ?? false,
      engagement_level: input.engagementLevel ?? "Participated",
      emotional_expression: input.emotionalExpression ?? false,
      confidence_building: input.confidenceBuilding ?? false,
      social_interaction: input.socialInteraction ?? false,
      performance_opportunity: input.performanceOpportunity ?? false,
      achievement_noted: input.achievementNoted ?? null,
      group_or_individual: input.groupOrIndividual ?? "Individual",
      mood_before: input.moodBefore ?? "Neutral",
      mood_after: input.moodAfter ?? "Neutral",
      linked_to_care_plan: input.linkedToCarePlan ?? false,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    childName: string;
    sessionDate: string;
    facilitatorName: string;
    activityType: ActivityType;
    therapeuticIntent: boolean;
    therapistQualified: boolean | null;
    instrumentProvided: boolean | null;
    childChoice: boolean;
    engagementLevel: EngagementLevel;
    emotionalExpression: boolean;
    confidenceBuilding: boolean;
    socialInteraction: boolean;
    performanceOpportunity: boolean;
    achievementNoted: string | null;
    groupOrIndividual: GroupType;
    moodBefore: MoodLevel;
    moodAfter: MoodLevel;
    linkedToCarePlan: boolean;
    notes: string | null;
  }>,
): Promise<ServiceResult<MusicPerformingArtsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.facilitatorName !== undefined) mapped.facilitator_name = updates.facilitatorName;
  if (updates.activityType !== undefined) mapped.activity_type = updates.activityType;
  if (updates.therapeuticIntent !== undefined) mapped.therapeutic_intent = updates.therapeuticIntent;
  if (updates.therapistQualified !== undefined) mapped.therapist_qualified = updates.therapistQualified;
  if (updates.instrumentProvided !== undefined) mapped.instrument_provided = updates.instrumentProvided;
  if (updates.childChoice !== undefined) mapped.child_choice = updates.childChoice;
  if (updates.engagementLevel !== undefined) mapped.engagement_level = updates.engagementLevel;
  if (updates.emotionalExpression !== undefined) mapped.emotional_expression = updates.emotionalExpression;
  if (updates.confidenceBuilding !== undefined) mapped.confidence_building = updates.confidenceBuilding;
  if (updates.socialInteraction !== undefined) mapped.social_interaction = updates.socialInteraction;
  if (updates.performanceOpportunity !== undefined) mapped.performance_opportunity = updates.performanceOpportunity;
  if (updates.achievementNoted !== undefined) mapped.achievement_noted = updates.achievementNoted;
  if (updates.groupOrIndividual !== undefined) mapped.group_or_individual = updates.groupOrIndividual;
  if (updates.moodBefore !== undefined) mapped.mood_before = updates.moodBefore;
  if (updates.moodAfter !== undefined) mapped.mood_after = updates.moodAfter;
  if (updates.linkedToCarePlan !== undefined) mapped.linked_to_care_plan = updates.linkedToCarePlan;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_music_performing_arts") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteRecord(
  id: string,
  homeId: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_music_performing_arts") as SB)
    .delete()
    .eq("id", id)
    .eq("home_id", homeId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
