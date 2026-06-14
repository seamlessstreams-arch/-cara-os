// ==============================================================================
// CARA -- CREATIVE ARTS & THERAPEUTIC ACTIVITIES SERVICE
// Tracks creative arts and therapeutic activities for looked-after children
// including art therapy, music therapy, drama therapy, dance/movement, creative
// writing, photography, film making, pottery/ceramics, textiles/sewing, cooking
// as creative, gardening/nature art, digital art, graffiti art (guided), music
// instrument learning, music production, singing/choir, poetry/spoken word, and
// comics/graphic novel creation.
//
// Covers: Therapeutic and recreational creative activity delivery, therapist
// qualification verification, emotional expression facilitation, child choice
// and agency tracking, group and individual session management, engagement level
// monitoring, mood before and after measurement, achievement recognition and
// exhibition, care plan linkage, young person feedback collection, and creative
// arts programme diversity analysis.
//
// UK Regulatory Framework:
// CHR 2015 Reg 9 (quality of care — activities),
// Reg 10 (wellbeing),
// SCCIF: Experiences & progress — "The home offers activities that promote
// creative expression and emotional wellbeing."
// Arts Council England — arts in care settings,
// NICE CG26 (PTSD — creative therapies).
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const ACTIVITY_TYPES = [
  "Art Therapy",
  "Music Therapy",
  "Drama Therapy",
  "Dance/Movement",
  "Creative Writing",
  "Photography",
  "Film Making",
  "Pottery/Ceramics",
  "Textiles/Sewing",
  "Cooking as Creative",
  "Gardening/Nature Art",
  "Digital Art",
  "Graffiti Art — Guided",
  "Music — Instrument Learning",
  "Music — Production",
  "Singing/Choir",
  "Poetry/Spoken Word",
  "Comics/Graphic Novel",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const GROUP_TYPES = [
  "Individual",
  "Small Group",
  "Large Group",
  "Family",
] as const;
export type GroupType = (typeof GROUP_TYPES)[number];

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
  "Good",
  "Very Good",
] as const;
export type MoodLevel = (typeof MOOD_LEVELS)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const THERAPEUTIC_ACTIVITY_TYPES: ActivityType[] = [
  "Art Therapy",
  "Music Therapy",
  "Drama Therapy",
  "Dance/Movement",
];

export const MUSIC_ACTIVITY_TYPES: ActivityType[] = [
  "Music Therapy",
  "Music — Instrument Learning",
  "Music — Production",
  "Singing/Choir",
];

export const VISUAL_ARTS_TYPES: ActivityType[] = [
  "Art Therapy",
  "Photography",
  "Film Making",
  "Pottery/Ceramics",
  "Digital Art",
  "Graffiti Art — Guided",
  "Comics/Graphic Novel",
];

export const PERFORMATIVE_TYPES: ActivityType[] = [
  "Drama Therapy",
  "Dance/Movement",
  "Singing/Choir",
  "Poetry/Spoken Word",
];

// Engagement level numeric mapping for analysis
const ENGAGEMENT_NUMERIC: Record<string, number> = {
  "Refused": 1,
  "Reluctant": 2,
  "Participated": 3,
  "Engaged": 4,
  "Enthusiastic": 5,
};

// Mood level numeric mapping for improvement calculation
const MOOD_NUMERIC: Record<string, number> = {
  "Very Low": 1,
  "Low": 2,
  "Neutral": 3,
  "Good": 4,
  "Very Good": 5,
};

// -- Label maps ---------------------------------------------------------------

export const ACTIVITY_TYPE_LABELS: { type: ActivityType; label: string }[] = [
  { type: "Art Therapy", label: "Art Therapy" },
  { type: "Music Therapy", label: "Music Therapy" },
  { type: "Drama Therapy", label: "Drama Therapy" },
  { type: "Dance/Movement", label: "Dance / Movement" },
  { type: "Creative Writing", label: "Creative Writing" },
  { type: "Photography", label: "Photography" },
  { type: "Film Making", label: "Film Making" },
  { type: "Pottery/Ceramics", label: "Pottery / Ceramics" },
  { type: "Textiles/Sewing", label: "Textiles / Sewing" },
  { type: "Cooking as Creative", label: "Cooking as Creative" },
  { type: "Gardening/Nature Art", label: "Gardening / Nature Art" },
  { type: "Digital Art", label: "Digital Art" },
  { type: "Graffiti Art — Guided", label: "Graffiti Art — Guided" },
  { type: "Music — Instrument Learning", label: "Music — Instrument Learning" },
  { type: "Music — Production", label: "Music — Production" },
  { type: "Singing/Choir", label: "Singing / Choir" },
  { type: "Poetry/Spoken Word", label: "Poetry / Spoken Word" },
  { type: "Comics/Graphic Novel", label: "Comics / Graphic Novel" },
];

export const GROUP_TYPE_LABELS: { type: GroupType; label: string }[] = [
  { type: "Individual", label: "Individual" },
  { type: "Small Group", label: "Small Group" },
  { type: "Large Group", label: "Large Group" },
  { type: "Family", label: "Family" },
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
  { level: "Good", label: "Good" },
  { level: "Very Good", label: "Very Good" },
];

// -- Row type -----------------------------------------------------------------

export interface CreativeArtsActivityRow {
  id: string;
  home_id: string;
  child_name: string;
  activity_date: string;
  facilitator_name: string;
  activity_type: ActivityType;
  therapeutic_intent: boolean;
  therapist_qualified: boolean | null;
  emotional_expression_enabled: boolean;
  child_choice: boolean;
  group_or_individual: GroupType;
  engagement_level: EngagementLevel;
  mood_before: MoodLevel;
  mood_after: MoodLevel;
  achievement_noted: string | null;
  exhibited_displayed: boolean;
  linked_to_care_plan: boolean;
  young_person_feedback: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateCreativeArtsActivity(input: {
  childName?: string;
  activityDate?: string;
  facilitatorName?: string;
  activityType?: string;
  therapeuticIntent?: boolean;
  therapistQualified?: boolean | null;
  groupOrIndividual?: string;
  engagementLevel?: string;
  moodBefore?: string;
  moodAfter?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.activityDate) {
    errors.push("Activity date is required");
  } else {
    const dateObj = new Date(input.activityDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Activity date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Activity date cannot be in the future");
    }
  }

  if (!input.facilitatorName || input.facilitatorName.trim().length === 0) {
    errors.push("Facilitator name is required");
  }

  if (!input.activityType || !(ACTIVITY_TYPES as readonly string[]).includes(input.activityType)) {
    errors.push(`Activity type must be one of: ${ACTIVITY_TYPES.join(", ")}`);
  }

  if (
    input.groupOrIndividual &&
    !(GROUP_TYPES as readonly string[]).includes(input.groupOrIndividual)
  ) {
    errors.push(`Group or individual must be one of: ${GROUP_TYPES.join(", ")}`);
  }

  if (
    input.engagementLevel &&
    !(ENGAGEMENT_LEVELS as readonly string[]).includes(input.engagementLevel)
  ) {
    errors.push(`Engagement level must be one of: ${ENGAGEMENT_LEVELS.join(", ")}`);
  }

  if (input.moodBefore && !(MOOD_LEVELS as readonly string[]).includes(input.moodBefore)) {
    errors.push(`Mood before must be one of: ${MOOD_LEVELS.join(", ")}`);
  }

  if (input.moodAfter && !(MOOD_LEVELS as readonly string[]).includes(input.moodAfter)) {
    errors.push(`Mood after must be one of: ${MOOD_LEVELS.join(", ")}`);
  }

  // Business rule: Therapeutic sessions must have qualified therapist assessment
  if (input.therapeuticIntent === true && input.therapistQualified === null) {
    errors.push("Therapeutic activities must record whether the therapist is qualified — NICE CG26 requires qualified practitioners for creative therapies");
  }

  // Business rule: Therapeutic sessions should not have unqualified therapist
  if (input.therapeuticIntent === true && input.therapistQualified === false) {
    errors.push("Therapeutic activities must be delivered by a qualified therapist — ensure the facilitator holds appropriate HCPC or BAAT/BAMT/BADth registration");
  }

  // Business rule: Core therapy types should be flagged as therapeutic
  if (
    input.activityType &&
    (THERAPEUTIC_ACTIVITY_TYPES as string[]).includes(input.activityType) &&
    input.therapeuticIntent === false
  ) {
    // Advisory — art/music/drama therapy can be recreational too, but flag for awareness
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: CreativeArtsActivityRow[],
): {
  total_activities: number;
  unique_children: number;
  by_activity_type: Record<string, number>;
  by_engagement_level: Record<string, number>;
  therapeutic_rate: number;
  child_choice_rate: number;
  mood_improvement_rate: number;
  exhibition_rate: number;
  care_plan_link_rate: number;
  group_vs_individual_ratio: string;
  achievement_count: number;
  average_engagement: number;
  emotional_expression_rate: number;
  music_activity_count: number;
  visual_arts_count: number;
  performative_count: number;
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

  // Boolean rates
  const therapeuticRate = total > 0
    ? Math.round((rows.filter((r) => r.therapeutic_intent).length / total) * 1000) / 10
    : 0;

  const childChoiceRate = total > 0
    ? Math.round((rows.filter((r) => r.child_choice).length / total) * 1000) / 10
    : 0;

  // Mood improvement rate
  const rowsWithMood = rows.filter(
    (r) => r.mood_before && r.mood_after,
  );
  const moodImproved = rowsWithMood.filter(
    (r) => (MOOD_NUMERIC[r.mood_after] ?? 0) > (MOOD_NUMERIC[r.mood_before] ?? 0),
  );
  const moodImprovementRate = rowsWithMood.length > 0
    ? Math.round((moodImproved.length / rowsWithMood.length) * 1000) / 10
    : 0;

  const exhibitionRate = total > 0
    ? Math.round((rows.filter((r) => r.exhibited_displayed).length / total) * 1000) / 10
    : 0;

  const carePlanLinkRate = total > 0
    ? Math.round((rows.filter((r) => r.linked_to_care_plan).length / total) * 1000) / 10
    : 0;

  // Group vs individual ratio
  const individualCount = rows.filter((r) => r.group_or_individual === "Individual").length;
  const groupCount = rows.filter((r) => r.group_or_individual !== "Individual").length;
  const groupVsIndividualRatio = total > 0
    ? `${groupCount}:${individualCount}`
    : "0:0";

  // Achievement count
  const achievementCount = rows.filter(
    (r) => r.achievement_noted && r.achievement_noted.trim().length > 0,
  ).length;

  // Average engagement (numeric)
  const avgEngagement = total > 0
    ? Math.round(
        (rows.reduce((sum, r) => sum + (ENGAGEMENT_NUMERIC[r.engagement_level] ?? 3), 0) / total) * 10,
      ) / 10
    : 0;

  // Emotional expression rate
  const emotionalExpressionRate = total > 0
    ? Math.round((rows.filter((r) => r.emotional_expression_enabled).length / total) * 1000) / 10
    : 0;

  // Category counts
  const musicActivityCount = rows.filter(
    (r) => (MUSIC_ACTIVITY_TYPES as string[]).includes(r.activity_type),
  ).length;

  const visualArtsCount = rows.filter(
    (r) => (VISUAL_ARTS_TYPES as string[]).includes(r.activity_type),
  ).length;

  const performativeCount = rows.filter(
    (r) => (PERFORMATIVE_TYPES as string[]).includes(r.activity_type),
  ).length;

  return {
    total_activities: total,
    unique_children: uniqueChildren.size,
    by_activity_type: byActivityType,
    by_engagement_level: byEngagement,
    therapeutic_rate: therapeuticRate,
    child_choice_rate: childChoiceRate,
    mood_improvement_rate: moodImprovementRate,
    exhibition_rate: exhibitionRate,
    care_plan_link_rate: carePlanLinkRate,
    group_vs_individual_ratio: groupVsIndividualRatio,
    achievement_count: achievementCount,
    average_engagement: avgEngagement,
    emotional_expression_rate: emotionalExpressionRate,
    music_activity_count: musicActivityCount,
    visual_arts_count: visualArtsCount,
    performative_count: performativeCount,
  };
}

export function computeAlerts(
  rows: CreativeArtsActivityRow[],
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

  // Critical: Therapeutic session with unqualified therapist
  for (const r of rows) {
    if (r.therapeutic_intent && r.therapist_qualified === false) {
      alerts.push({
        type: "unqualified_therapist",
        severity: "critical",
        message: `Therapeutic activity (${r.activity_type}) for ${r.child_name} on ${r.activity_date} was delivered by an unqualified therapist — NICE CG26 and professional body standards (HCPC, BAAT, BAMT, BADth) require qualified practitioners for creative therapies`,
        record_id: r.id,
      });
    }
  }

  // Critical: Child refused activity repeatedly
  const childRefusalMap = new Map<string, CreativeArtsActivityRow[]>();
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
        severity: "critical",
        message: `${childRows[0].child_name} has refused ${childRows.length} creative activities — persistent refusal may indicate distress, trauma response, or a mismatch between activities offered and the young person's interests. Review under CHR 2015 Reg 9 (quality of care)`,
      });
    }
  }

  // High: Mood decreased during activity
  for (const r of rows) {
    if (
      r.mood_before &&
      r.mood_after &&
      (MOOD_NUMERIC[r.mood_after] ?? 0) < (MOOD_NUMERIC[r.mood_before] ?? 0)
    ) {
      alerts.push({
        type: "mood_decreased",
        severity: "high",
        message: `${r.child_name}'s mood decreased from ${r.mood_before} to ${r.mood_after} during ${r.activity_type} on ${r.activity_date} — review whether the activity triggered distressing memories or emotions, and ensure appropriate support is available`,
        record_id: r.id,
      });
    }
  }

  // High: Therapeutic activity not linked to care plan
  for (const r of rows) {
    if (r.therapeutic_intent && !r.linked_to_care_plan) {
      alerts.push({
        type: "therapeutic_not_care_planned",
        severity: "high",
        message: `Therapeutic activity (${r.activity_type}) for ${r.child_name} on ${r.activity_date} is not linked to their care plan — all therapeutic interventions should be documented in and aligned with the child's care plan per CHR 2015 Reg 9`,
        record_id: r.id,
      });
    }
  }

  // High: Low child choice rate
  const childChoiceCount = rows.filter((r) => r.child_choice).length;
  if (rows.length >= 5 && childChoiceCount / rows.length < 0.4) {
    alerts.push({
      type: "low_child_choice",
      severity: "high",
      message: `Only ${Math.round((childChoiceCount / rows.length) * 100)}% of creative activities were chosen by the young person — CHR 2015 Reg 9 requires that children have choice and agency in their activities. The home should ensure young people are actively involved in selecting creative pursuits`,
    });
  }

  // High: No variety in activities for individual children
  const childActivityMap = new Map<string, Set<string>>();
  for (const r of rows) {
    const key = r.child_name.toLowerCase().trim();
    if (!childActivityMap.has(key)) childActivityMap.set(key, new Set());
    childActivityMap.get(key)!.add(r.activity_type);
  }
  const childSessionCounts = new Map<string, number>();
  for (const r of rows) {
    const key = r.child_name.toLowerCase().trim();
    childSessionCounts.set(key, (childSessionCounts.get(key) ?? 0) + 1);
  }
  for (const [childKey, types] of childActivityMap) {
    const sessionCount = childSessionCounts.get(childKey) ?? 0;
    if (sessionCount >= 5 && types.size === 1) {
      const childName = rows.find(
        (r) => r.child_name.toLowerCase().trim() === childKey,
      )?.child_name ?? childKey;
      alerts.push({
        type: "no_activity_variety",
        severity: "high",
        message: `${childName} has participated in ${sessionCount} sessions but only one type of creative activity — consider offering a wider range of creative experiences to support holistic development per CHR 2015 Reg 9`,
      });
    }
  }

  // Medium: Low exhibition/display rate
  const exhibited = rows.filter((r) => r.exhibited_displayed).length;
  if (rows.length >= 5 && exhibited / rows.length < 0.2) {
    alerts.push({
      type: "low_exhibition_rate",
      severity: "medium",
      message: `Only ${Math.round((exhibited / rows.length) * 100)}% of creative outputs are displayed or exhibited — celebrating young people's creative achievements supports self-esteem and belonging. Arts Council England guidance recommends showcasing work where appropriate`,
    });
  }

  // Medium: Low care plan linkage overall
  const carePlanLinked = rows.filter((r) => r.linked_to_care_plan).length;
  if (rows.length >= 5 && carePlanLinked / rows.length < 0.3) {
    alerts.push({
      type: "low_care_plan_linkage",
      severity: "medium",
      message: `Only ${Math.round((carePlanLinked / rows.length) * 100)}% of creative activities are linked to care plans — creative arts can be powerful tools for achieving care plan outcomes, and linkage helps demonstrate impact at SCCIF inspection`,
    });
  }

  // Medium: Low emotional expression enablement
  const emotionalExpression = rows.filter((r) => r.emotional_expression_enabled).length;
  if (rows.length >= 5 && emotionalExpression / rows.length < 0.5) {
    alerts.push({
      type: "low_emotional_expression",
      severity: "medium",
      message: `Emotional expression was enabled in only ${Math.round((emotionalExpression / rows.length) * 100)}% of activities — creative arts are a key medium for emotional expression for looked-after children, many of whom find verbal expression difficult. Review whether facilitators are creating safe spaces for emotional exploration`,
    });
  }

  // Medium: All activities are individual, no group work
  const groupActivities = rows.filter((r) => r.group_or_individual !== "Individual").length;
  if (rows.length >= 8 && groupActivities === 0) {
    alerts.push({
      type: "no_group_activities",
      severity: "medium",
      message: "All creative activities are individual sessions with no group work — group creative activities support social skills development, peer relationships, and a sense of belonging within the home",
    });
  }

  // Medium: No feedback from young people
  const feedbackProvided = rows.filter(
    (r) => r.young_person_feedback && r.young_person_feedback.trim().length > 0,
  ).length;
  if (rows.length >= 5 && feedbackProvided / rows.length < 0.2) {
    alerts.push({
      type: "low_feedback_rate",
      severity: "medium",
      message: `Young person feedback was collected in only ${Math.round((feedbackProvided / rows.length) * 100)}% of activities — capturing the young person's voice is essential for SCCIF evidence and for tailoring the creative programme to their interests`,
    });
  }

  return alerts;
}

export function generateCaraInsights(
  rows: CreativeArtsActivityRow[],
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

  insights.push(
    `[sky] ${metrics.total_activities} creative arts ${metrics.total_activities === 1 ? "activity" : "activities"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Activities: ${typeBreakdown || "none recorded"}. ` +
      `Engagement: ${engagementBreakdown || "none"}. ` +
      `Average engagement score: ${metrics.average_engagement}/5. ` +
      `Mood improvement rate: ${metrics.mood_improvement_rate}%. ` +
      `Group:Individual ratio: ${metrics.group_vs_individual_ratio}. ` +
      `Achievements noted: ${metrics.achievement_count}.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Therapeutic rate: ${metrics.therapeutic_rate}%. ` +
        `Child choice rate: ${metrics.child_choice_rate}%. ` +
        `Exhibition rate: ${metrics.exhibition_rate}%. ` +
        `Care plan linkage: ${metrics.care_plan_link_rate}%. ` +
        `Emotional expression: ${metrics.emotional_expression_rate}%. ` +
        `Visual arts: ${metrics.visual_arts_count}. Music: ${metrics.music_activity_count}. ` +
        `Performance: ${metrics.performative_count}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority creative arts alerts. ` +
        `Therapeutic rate: ${metrics.therapeutic_rate}%. ` +
        `Child choice rate: ${metrics.child_choice_rate}%. ` +
        `Exhibition rate: ${metrics.exhibition_rate}%. ` +
        `Care plan linkage: ${metrics.care_plan_link_rate}%. ` +
        `Emotional expression: ${metrics.emotional_expression_rate}%. ` +
        `Visual arts: ${metrics.visual_arts_count}. Music: ${metrics.music_activity_count}. ` +
        `Performance: ${metrics.performative_count}. ` +
        `Continue promoting creative expression per CHR 2015 Reg 9.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.mood_improvement_rate < 30 && metrics.total_activities > 5) {
    insights.push(
      `[reflect] Mood improvement rate is only ${metrics.mood_improvement_rate}% across ` +
        `${metrics.total_activities} activities. Are creative activities genuinely improving ` +
        `young people's emotional wellbeing? CHR 2015 Reg 10 requires the home to promote ` +
        `emotional wellbeing, and NICE CG26 recognises creative therapies as effective ` +
        `interventions for trauma. If moods are not improving, consider whether activities are ` +
        `appropriately matched to each young person's emotional needs, whether facilitators ` +
        `are creating psychologically safe environments, and whether therapeutic activities ` +
        `are being delivered by qualified practitioners.`,
    );
  } else if (metrics.child_choice_rate < 50 && metrics.total_activities > 3) {
    insights.push(
      `[reflect] Only ${metrics.child_choice_rate}% of creative activities were chosen by the ` +
        `young person. Is the home genuinely offering choice and agency in creative pursuits? ` +
        `CHR 2015 Reg 9 requires that children are offered activities that reflect their ` +
        `interests and preferences. Looked-after children have often experienced a lack of ` +
        `control over their lives — offering genuine choice in creative activities can be ` +
        `powerfully restorative. Are young people being consulted about what they would like ` +
        `to try? Are new and diverse options being introduced regularly?`,
    );
  } else if (metrics.exhibition_rate < 15 && metrics.total_activities > 5) {
    insights.push(
      `[reflect] Only ${metrics.exhibition_rate}% of creative outputs are being displayed or ` +
        `exhibited. Celebrating young people's creative achievements is a powerful way to ` +
        `build self-esteem, pride, and a sense of belonging. Arts Council England guidance ` +
        `emphasises the importance of showcasing work in care settings. Are there dedicated ` +
        `display spaces in the home? Could the home organise exhibitions, performances, or ` +
        `share achievements with social workers and family members? Every piece of creative ` +
        `work represents effort and expression that deserves recognition.`,
    );
  } else {
    insights.push(
      `[reflect] How does the home ensure that its creative arts programme is genuinely ` +
        `diverse and responsive to each young person's interests and therapeutic needs? ` +
        `SCCIF inspectors look for evidence that the home offers activities promoting ` +
        `creative expression and emotional wellbeing. Are both therapeutic and recreational ` +
        `creative options available? Is the programme regularly reviewed based on young ` +
        `people's feedback? Are achievements celebrated and shared? For children who have ` +
        `experienced trauma, creative arts can provide a safe medium for processing ` +
        `difficult emotions — is this potential being fully realised?`,
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
): Promise<ServiceResult<CreativeArtsActivityRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_creative_arts_activities") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.activityType) q = q.eq("activity_type", filters.activityType);
  if (filters?.engagementLevel) q = q.eq("engagement_level", filters.engagementLevel);

  q = q.order("activity_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<CreativeArtsActivityRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_creative_arts_activities") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  activityDate: string;
  facilitatorName: string;
  activityType: ActivityType;
  therapeuticIntent?: boolean;
  therapistQualified?: boolean | null;
  emotionalExpressionEnabled?: boolean;
  childChoice?: boolean;
  groupOrIndividual?: GroupType;
  engagementLevel?: EngagementLevel;
  moodBefore?: MoodLevel;
  moodAfter?: MoodLevel;
  achievementNoted?: string | null;
  exhibitedDisplayed?: boolean;
  linkedToCarePlan?: boolean;
  youngPersonFeedback?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<CreativeArtsActivityRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateCreativeArtsActivity({
    childName: input.childName,
    activityDate: input.activityDate,
    facilitatorName: input.facilitatorName,
    activityType: input.activityType,
    therapeuticIntent: input.therapeuticIntent,
    therapistQualified: input.therapistQualified,
    groupOrIndividual: input.groupOrIndividual,
    engagementLevel: input.engagementLevel,
    moodBefore: input.moodBefore,
    moodAfter: input.moodAfter,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_creative_arts_activities") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      activity_date: input.activityDate,
      facilitator_name: input.facilitatorName,
      activity_type: input.activityType,
      therapeutic_intent: input.therapeuticIntent ?? false,
      therapist_qualified: input.therapistQualified ?? null,
      emotional_expression_enabled: input.emotionalExpressionEnabled ?? true,
      child_choice: input.childChoice ?? true,
      group_or_individual: input.groupOrIndividual ?? "Individual",
      engagement_level: input.engagementLevel ?? "Participated",
      mood_before: input.moodBefore ?? "Neutral",
      mood_after: input.moodAfter ?? "Neutral",
      achievement_noted: input.achievementNoted ?? null,
      exhibited_displayed: input.exhibitedDisplayed ?? false,
      linked_to_care_plan: input.linkedToCarePlan ?? false,
      young_person_feedback: input.youngPersonFeedback ?? null,
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
    activityDate: string;
    facilitatorName: string;
    activityType: ActivityType;
    therapeuticIntent: boolean;
    therapistQualified: boolean | null;
    emotionalExpressionEnabled: boolean;
    childChoice: boolean;
    groupOrIndividual: GroupType;
    engagementLevel: EngagementLevel;
    moodBefore: MoodLevel;
    moodAfter: MoodLevel;
    achievementNoted: string | null;
    exhibitedDisplayed: boolean;
    linkedToCarePlan: boolean;
    youngPersonFeedback: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<CreativeArtsActivityRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.activityDate !== undefined) mapped.activity_date = updates.activityDate;
  if (updates.facilitatorName !== undefined) mapped.facilitator_name = updates.facilitatorName;
  if (updates.activityType !== undefined) mapped.activity_type = updates.activityType;
  if (updates.therapeuticIntent !== undefined) mapped.therapeutic_intent = updates.therapeuticIntent;
  if (updates.therapistQualified !== undefined) mapped.therapist_qualified = updates.therapistQualified;
  if (updates.emotionalExpressionEnabled !== undefined) mapped.emotional_expression_enabled = updates.emotionalExpressionEnabled;
  if (updates.childChoice !== undefined) mapped.child_choice = updates.childChoice;
  if (updates.groupOrIndividual !== undefined) mapped.group_or_individual = updates.groupOrIndividual;
  if (updates.engagementLevel !== undefined) mapped.engagement_level = updates.engagementLevel;
  if (updates.moodBefore !== undefined) mapped.mood_before = updates.moodBefore;
  if (updates.moodAfter !== undefined) mapped.mood_after = updates.moodAfter;
  if (updates.achievementNoted !== undefined) mapped.achievement_noted = updates.achievementNoted;
  if (updates.exhibitedDisplayed !== undefined) mapped.exhibited_displayed = updates.exhibitedDisplayed;
  if (updates.linkedToCarePlan !== undefined) mapped.linked_to_care_plan = updates.linkedToCarePlan;
  if (updates.youngPersonFeedback !== undefined) mapped.young_person_feedback = updates.youngPersonFeedback;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_creative_arts_activities") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteRecord(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_creative_arts_activities") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
