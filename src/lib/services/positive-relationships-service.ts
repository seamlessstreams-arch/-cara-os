// ==============================================================================
// CORNERSTONE -- POSITIVE RELATIONSHIPS & SOCIAL SKILLS SERVICE
// Tracks social skills groups, friendship skills, conflict resolution, anger
// management, emotional regulation, empathy building, communication skills,
// boundary setting, trust building, team building, peer support, anti-bullying,
// self-esteem building, assertiveness training, healthy relationships, and online
// relationship safety sessions for looked-after children.
//
// Covers: Session type and delivery method tracking, attachment style consideration,
// trauma-informed approach verification, key worker involvement, therapeutic input,
// child engagement monitoring, skill demonstration and generalisation tracking,
// positive peer interaction observation, staff relationship improvement, confidence
// improvement, child feedback capture, care plan linkage, social worker notification,
// and session scheduling.
//
// UK Regulatory Framework:
// CHR 2015 Reg 11 (positive relationships),
// CHR 2015 Reg 19 (relationships between staff and children),
// CHR 2015 Reg 34 (behaviour that is acceptable),
// SCCIF: Behaviour and attitudes — "Children develop positive relationships and
// social skills."
// Attachment theory, trauma-informed care.
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const SESSION_TYPES = [
  "Social Skills Group",
  "Friendship Skills",
  "Conflict Resolution",
  "Anger Management",
  "Emotional Regulation",
  "Empathy Building",
  "Communication Skills",
  "Boundary Setting",
  "Trust Building",
  "Team Building",
  "Peer Support",
  "Anti-Bullying",
  "Self-Esteem Building",
  "Assertiveness Training",
  "Healthy Relationships",
  "Online Relationship Safety",
] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export const DELIVERY_METHODS = [
  "1-to-1 Session",
  "Small Group",
  "Large Group",
  "Activity-Based",
  "Role Play",
  "Discussion",
  "Modelling",
  "Peer-Led",
] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const EMOTIONAL_SESSION_TYPES: SessionType[] = [
  "Emotional Regulation",
  "Anger Management",
  "Empathy Building",
  "Self-Esteem Building",
];

export const INTERPERSONAL_SESSION_TYPES: SessionType[] = [
  "Friendship Skills",
  "Communication Skills",
  "Boundary Setting",
  "Trust Building",
  "Assertiveness Training",
  "Healthy Relationships",
];

export const GROUP_DYNAMIC_SESSION_TYPES: SessionType[] = [
  "Social Skills Group",
  "Team Building",
  "Peer Support",
  "Anti-Bullying",
];

export const SAFETY_SESSION_TYPES: SessionType[] = [
  "Boundary Setting",
  "Healthy Relationships",
  "Online Relationship Safety",
  "Anti-Bullying",
];

export const INDIVIDUAL_DELIVERY_METHODS: DeliveryMethod[] = [
  "1-to-1 Session",
];

export const GROUP_DELIVERY_METHODS: DeliveryMethod[] = [
  "Small Group",
  "Large Group",
  "Peer-Led",
];

export const INTERACTIVE_DELIVERY_METHODS: DeliveryMethod[] = [
  "Activity-Based",
  "Role Play",
  "Modelling",
  "Peer-Led",
];

// -- Label maps ---------------------------------------------------------------

export const SESSION_TYPE_LABELS: { type: SessionType; label: string }[] = [
  { type: "Social Skills Group", label: "Social Skills Group" },
  { type: "Friendship Skills", label: "Friendship Skills" },
  { type: "Conflict Resolution", label: "Conflict Resolution" },
  { type: "Anger Management", label: "Anger Management" },
  { type: "Emotional Regulation", label: "Emotional Regulation" },
  { type: "Empathy Building", label: "Empathy Building" },
  { type: "Communication Skills", label: "Communication Skills" },
  { type: "Boundary Setting", label: "Boundary Setting" },
  { type: "Trust Building", label: "Trust Building" },
  { type: "Team Building", label: "Team Building" },
  { type: "Peer Support", label: "Peer Support" },
  { type: "Anti-Bullying", label: "Anti-Bullying" },
  { type: "Self-Esteem Building", label: "Self-Esteem Building" },
  { type: "Assertiveness Training", label: "Assertiveness Training" },
  { type: "Healthy Relationships", label: "Healthy Relationships" },
  { type: "Online Relationship Safety", label: "Online Relationship Safety" },
];

export const DELIVERY_METHOD_LABELS: { method: DeliveryMethod; label: string }[] = [
  { method: "1-to-1 Session", label: "1-to-1 Session" },
  { method: "Small Group", label: "Small Group" },
  { method: "Large Group", label: "Large Group" },
  { method: "Activity-Based", label: "Activity-Based" },
  { method: "Role Play", label: "Role Play" },
  { method: "Discussion", label: "Discussion" },
  { method: "Modelling", label: "Modelling" },
  { method: "Peer-Led", label: "Peer-Led" },
];

// -- Row type -----------------------------------------------------------------

export interface PositiveRelationshipsRow {
  id: string;
  home_id: string;
  child_name: string;
  session_date: string;
  facilitator_name: string;
  session_type: SessionType;
  delivery_method: DeliveryMethod;
  attachment_style_considered: boolean;
  trauma_informed_approach: boolean;
  key_worker_involved: boolean;
  therapeutic_input: boolean;
  child_engaged: boolean;
  skill_demonstrated: boolean;
  generalised_to_other_settings: boolean;
  positive_peer_interaction_observed: boolean;
  staff_relationship_improved: boolean;
  confidence_improved: boolean;
  child_feedback: string | null;
  care_plan_linked: boolean;
  social_worker_informed: boolean;
  next_session_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validatePositiveRelationships(input: {
  childName?: string;
  sessionDate?: string;
  facilitatorName?: string;
  sessionType?: string;
  deliveryMethod?: string;
  attachmentStyleConsidered?: boolean;
  traumaInformedApproach?: boolean;
  childEngaged?: boolean;
  childFeedback?: string | null;
  therapeuticInput?: boolean;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

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

  if (!input.sessionType || !(SESSION_TYPES as readonly string[]).includes(input.sessionType)) {
    errors.push(`Session type must be one of: ${SESSION_TYPES.join(", ")}`);
  }

  if (
    input.deliveryMethod &&
    !(DELIVERY_METHODS as readonly string[]).includes(input.deliveryMethod)
  ) {
    errors.push(`Delivery method must be one of: ${DELIVERY_METHODS.join(", ")}`);
  }

  // Business rule: Attachment style should be considered for looked-after children
  if (input.attachmentStyleConsidered === false) {
    // Advisory: attachment theory is fundamental to work with LAC
    // Not a hard error as some record types may not require it
  }

  // Business rule: Trauma-informed approach is expected
  if (input.traumaInformedApproach === false) {
    // Advisory: trauma-informed care is best practice for LAC
    // Not a hard error but will generate alerts
  }

  // Business rule: Emotional regulation sessions should consider attachment
  if (
    input.sessionType &&
    (EMOTIONAL_SESSION_TYPES as string[]).includes(input.sessionType) &&
    input.attachmentStyleConsidered === false &&
    input.traumaInformedApproach === false
  ) {
    errors.push(
      `${input.sessionType} session should consider attachment style or use a trauma-informed approach — emotional regulation in looked-after children is often rooted in early attachment experiences. CHR 2015 Reg 11 requires the home to promote positive relationships with an understanding of each child's background`,
    );
  }

  // Business rule: Therapeutic input sessions should have qualified facilitator
  if (input.therapeuticInput === true) {
    // Advisory: therapeutic sessions should be delivered by qualified practitioners
    // The facilitator name is recorded but qualification check is operational
  }

  // Business rule: Child engagement should be tracked
  if (input.childEngaged === false && (!input.childFeedback || input.childFeedback.trim().length === 0)) {
    // Advisory: if child did not engage, capturing why through feedback is valuable
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: PositiveRelationshipsRow[],
): {
  total_sessions: number;
  unique_children: number;
  by_session_type: Record<string, number>;
  by_delivery_method: Record<string, number>;
  engagement_rate: number;
  skill_demonstration_rate: number;
  generalisation_rate: number;
  peer_interaction_rate: number;
  staff_relationship_rate: number;
  confidence_rate: number;
  attachment_rate: number;
  trauma_informed_rate: number;
  key_worker_rate: number;
  therapeutic_rate: number;
  care_plan_link_rate: number;
  social_worker_informed_rate: number;
  average_sessions_per_child: number;
  emotional_session_count: number;
  interpersonal_session_count: number;
  group_dynamic_session_count: number;
  safety_session_count: number;
} {
  const total = rows.length;

  // Unique children
  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Session type breakdown
  const bySessionType: Record<string, number> = {};
  for (const st of SESSION_TYPES) bySessionType[st] = 0;
  for (const r of rows) bySessionType[r.session_type] = (bySessionType[r.session_type] || 0) + 1;

  // Delivery method breakdown
  const byDeliveryMethod: Record<string, number> = {};
  for (const dm of DELIVERY_METHODS) byDeliveryMethod[dm] = 0;
  for (const r of rows) byDeliveryMethod[r.delivery_method] = (byDeliveryMethod[r.delivery_method] || 0) + 1;

  // Boolean rates
  const engagementRate = total > 0
    ? Math.round((rows.filter((r) => r.child_engaged).length / total) * 1000) / 10
    : 0;

  const skillDemoRate = total > 0
    ? Math.round((rows.filter((r) => r.skill_demonstrated).length / total) * 1000) / 10
    : 0;

  const generalisationRate = total > 0
    ? Math.round((rows.filter((r) => r.generalised_to_other_settings).length / total) * 1000) / 10
    : 0;

  const peerInteractionRate = total > 0
    ? Math.round((rows.filter((r) => r.positive_peer_interaction_observed).length / total) * 1000) / 10
    : 0;

  const staffRelationshipRate = total > 0
    ? Math.round((rows.filter((r) => r.staff_relationship_improved).length / total) * 1000) / 10
    : 0;

  const confidenceRate = total > 0
    ? Math.round((rows.filter((r) => r.confidence_improved).length / total) * 1000) / 10
    : 0;

  const attachmentRate = total > 0
    ? Math.round((rows.filter((r) => r.attachment_style_considered).length / total) * 1000) / 10
    : 0;

  const traumaRate = total > 0
    ? Math.round((rows.filter((r) => r.trauma_informed_approach).length / total) * 1000) / 10
    : 0;

  const keyWorkerRate = total > 0
    ? Math.round((rows.filter((r) => r.key_worker_involved).length / total) * 1000) / 10
    : 0;

  const therapeuticRate = total > 0
    ? Math.round((rows.filter((r) => r.therapeutic_input).length / total) * 1000) / 10
    : 0;

  const carePlanRate = total > 0
    ? Math.round((rows.filter((r) => r.care_plan_linked).length / total) * 1000) / 10
    : 0;

  const socialWorkerRate = total > 0
    ? Math.round((rows.filter((r) => r.social_worker_informed).length / total) * 1000) / 10
    : 0;

  // Average sessions per child
  const avgPerChild = uniqueChildren.size > 0
    ? Math.round((total / uniqueChildren.size) * 10) / 10
    : 0;

  // Category counts
  const emotionalCount = rows.filter(
    (r) => (EMOTIONAL_SESSION_TYPES as string[]).includes(r.session_type),
  ).length;

  const interpersonalCount = rows.filter(
    (r) => (INTERPERSONAL_SESSION_TYPES as string[]).includes(r.session_type),
  ).length;

  const groupDynamicCount = rows.filter(
    (r) => (GROUP_DYNAMIC_SESSION_TYPES as string[]).includes(r.session_type),
  ).length;

  const safetyCount = rows.filter(
    (r) => (SAFETY_SESSION_TYPES as string[]).includes(r.session_type),
  ).length;

  return {
    total_sessions: total,
    unique_children: uniqueChildren.size,
    by_session_type: bySessionType,
    by_delivery_method: byDeliveryMethod,
    engagement_rate: engagementRate,
    skill_demonstration_rate: skillDemoRate,
    generalisation_rate: generalisationRate,
    peer_interaction_rate: peerInteractionRate,
    staff_relationship_rate: staffRelationshipRate,
    confidence_rate: confidenceRate,
    attachment_rate: attachmentRate,
    trauma_informed_rate: traumaRate,
    key_worker_rate: keyWorkerRate,
    therapeutic_rate: therapeuticRate,
    care_plan_link_rate: carePlanRate,
    social_worker_informed_rate: socialWorkerRate,
    average_sessions_per_child: avgPerChild,
    emotional_session_count: emotionalCount,
    interpersonal_session_count: interpersonalCount,
    group_dynamic_session_count: groupDynamicCount,
    safety_session_count: safetyCount,
  };
}

export function computeAlerts(
  rows: PositiveRelationshipsRow[],
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

  // Critical: Emotional session without attachment or trauma consideration
  for (const r of rows) {
    if (
      (EMOTIONAL_SESSION_TYPES as string[]).includes(r.session_type) &&
      !r.attachment_style_considered &&
      !r.trauma_informed_approach
    ) {
      alerts.push({
        type: "emotional_no_attachment_or_trauma",
        severity: "critical",
        message: `${r.session_type} session for ${r.child_name} on ${r.session_date} did not consider attachment style or use a trauma-informed approach — emotional regulation and self-esteem in looked-after children are profoundly influenced by early attachment experiences and trauma. CHR 2015 Reg 11 requires the home to promote positive relationships with understanding of each child's history. Sessions that ignore these factors risk being ineffective or re-traumatising`,
        record_id: r.id,
      });
    }
  }

  // Critical: Repeated non-engagement by same child
  const childNonEngageMap = new Map<string, PositiveRelationshipsRow[]>();
  for (const r of rows) {
    if (!r.child_engaged) {
      const key = r.child_name.toLowerCase().trim();
      if (!childNonEngageMap.has(key)) childNonEngageMap.set(key, []);
      childNonEngageMap.get(key)!.push(r);
    }
  }
  for (const [, childRows] of childNonEngageMap) {
    if (childRows.length >= 4) {
      alerts.push({
        type: "repeated_non_engagement",
        severity: "critical",
        message: `${childRows[0].child_name} has not engaged in ${childRows.length} relationship/social skills sessions — persistent non-engagement may indicate the approach is not meeting the child's needs, the child feels unsafe, or the sessions are not appropriately matched to their developmental stage. CHR 2015 Reg 11 requires the home to promote positive relationships through approaches that work for each individual child. Review the programme with the child and consider alternative approaches`,
      });
    }
  }

  // High: Low trauma-informed rate across sessions
  const traumaCount = rows.filter((r) => r.trauma_informed_approach).length;
  if (rows.length >= 5 && traumaCount / rows.length < 0.3) {
    alerts.push({
      type: "low_trauma_informed_rate",
      severity: "high",
      message: `Only ${Math.round((traumaCount / rows.length) * 100)}% of relationship sessions use a trauma-informed approach — the majority of looked-after children have experienced adverse childhood experiences (ACEs) that affect their ability to form relationships and regulate emotions. Evidence-based practice requires that all relationship work with LAC is grounded in trauma-informed principles`,
    });
  }

  // High: Low attachment consideration rate
  const attachmentCount = rows.filter((r) => r.attachment_style_considered).length;
  if (rows.length >= 5 && attachmentCount / rows.length < 0.3) {
    alerts.push({
      type: "low_attachment_consideration",
      severity: "high",
      message: `Attachment style considered in only ${Math.round((attachmentCount / rows.length) * 100)}% of sessions — attachment theory is foundational to understanding looked-after children's relationship patterns. CHR 2015 Reg 11 explicitly references the importance of positive relationships. Without understanding each child's attachment style, interventions may be poorly targeted or counterproductive`,
    });
  }

  // High: Skill demonstrated but not generalised (pattern)
  const demonstratedNotGeneralised = rows.filter(
    (r) => r.skill_demonstrated && !r.generalised_to_other_settings,
  );
  if (demonstratedNotGeneralised.length >= 5 && rows.length >= 8) {
    const genRate = rows.filter((r) => r.generalised_to_other_settings).length;
    alerts.push({
      type: "skills_not_generalising",
      severity: "high",
      message: `Skills are demonstrated in sessions but generalised to other settings in only ${Math.round((genRate / rows.length) * 100)}% of cases — the goal of social skills work is transfer to real-world interactions. If skills remain within session rooms, the programme may need to incorporate more naturalistic practice, community-based activities, or supported real-world application opportunities`,
    });
  }

  // High: No child engaged in a group session
  for (const r of rows) {
    if (
      (GROUP_DELIVERY_METHODS as string[]).includes(r.delivery_method) &&
      !r.child_engaged
    ) {
      alerts.push({
        type: "non_engagement_group",
        severity: "high",
        message: `${r.child_name} did not engage in a ${r.delivery_method} ${r.session_type} session on ${r.session_date} — group settings can be challenging for children with insecure attachment or social anxiety. Consider whether 1-to-1 preparation before group sessions would help, or whether the group size and dynamics are appropriate for this child's needs`,
        record_id: r.id,
      });
    }
  }

  // High: Low care plan linkage
  const carePlanLinked = rows.filter((r) => r.care_plan_linked).length;
  if (rows.length >= 5 && carePlanLinked / rows.length < 0.3) {
    alerts.push({
      type: "low_care_plan_linkage",
      severity: "high",
      message: `Only ${Math.round((carePlanLinked / rows.length) * 100)}% of relationship sessions are linked to care plans — social skills and relationship development should be a central part of the care plan for looked-after children. SCCIF inspectors expect to see that the home's relationship programme is purposeful and aligned with individual care plan objectives, not delivered generically`,
    });
  }

  // High: No key worker involvement in trust/relationship sessions
  for (const r of rows) {
    if (
      (r.session_type === "Trust Building" || r.session_type === "Boundary Setting") &&
      !r.key_worker_involved
    ) {
      alerts.push({
        type: "no_key_worker_trust_sessions",
        severity: "high",
        message: `${r.child_name}'s ${r.session_type} session on ${r.session_date} did not involve the key worker — CHR 2015 Reg 19 emphasises the importance of the relationship between staff and children. Trust building and boundary setting are most effective when the key worker is involved, as they have the primary relationship with the child`,
        record_id: r.id,
      });
    }
  }

  // Medium: Low engagement rate overall
  const engagedCount = rows.filter((r) => r.child_engaged).length;
  if (rows.length >= 5 && engagedCount / rows.length < 0.5) {
    alerts.push({
      type: "low_engagement_rate",
      severity: "medium",
      message: `Child engagement rate is only ${Math.round((engagedCount / rows.length) * 100)}% across relationship sessions — low engagement may indicate that the programme needs to be reviewed. Are sessions being delivered at appropriate times? Are the topics and methods matched to children's interests and developmental stages? SCCIF inspectors look for evidence that children are actively developing positive relationships and social skills`,
    });
  }

  // Medium: No variety in session types
  const activeTypes = Object.entries(
    rows.reduce((acc, r) => { acc[r.session_type] = (acc[r.session_type] || 0) + 1; return acc; }, {} as Record<string, number>),
  ).filter(([, count]) => count > 0);
  if (rows.length >= 8 && activeTypes.length <= 2) {
    alerts.push({
      type: "low_session_variety",
      severity: "medium",
      message: `Only ${activeTypes.length} different session type${activeTypes.length === 1 ? " is" : "s are"} being delivered — children's relationship and social skills needs are varied. A comprehensive programme should address emotional regulation, interpersonal skills, group dynamics, and safety awareness. Consider whether the current programme covers the range of skills needed per CHR 2015 Reg 11 and Reg 34`,
    });
  }

  // Medium: No delivery method variety
  const activeMethods = Object.entries(
    rows.reduce((acc, r) => { acc[r.delivery_method] = (acc[r.delivery_method] || 0) + 1; return acc; }, {} as Record<string, number>),
  ).filter(([, count]) => count > 0);
  if (rows.length >= 8 && activeMethods.length === 1) {
    alerts.push({
      type: "single_delivery_method",
      severity: "medium",
      message: `All sessions use the same delivery method (${activeMethods[0][0]}) — different children learn social skills in different ways. Activity-based, role play, modelling, and peer-led approaches can be more effective than discussion alone, particularly for children with communication difficulties or who find formal sessions challenging`,
    });
  }

  // Medium: Low positive peer interaction rate
  const peerInteractionCount = rows.filter((r) => r.positive_peer_interaction_observed).length;
  if (rows.length >= 5 && peerInteractionCount / rows.length < 0.3) {
    alerts.push({
      type: "low_peer_interaction",
      severity: "medium",
      message: `Positive peer interaction observed in only ${Math.round((peerInteractionCount / rows.length) * 100)}% of sessions — peer relationships are central to children's social development. SCCIF: Behaviour and attitudes looks for evidence that children develop positive relationships with each other. Consider incorporating more peer-based activities and opportunities for positive social interaction`,
    });
  }

  // Medium: Low confidence improvement rate
  const confidenceCount = rows.filter((r) => r.confidence_improved).length;
  if (rows.length >= 5 && confidenceCount / rows.length < 0.2) {
    alerts.push({
      type: "low_confidence_rate",
      severity: "medium",
      message: `Confidence improvement noted in only ${Math.round((confidenceCount / rows.length) * 100)}% of sessions — for looked-after children, social confidence is often significantly impacted by their care experiences. Are sessions creating safe enough environments for children to take social risks? Are small successes being recognised and celebrated? Self-esteem building should be embedded across all relationship work, not just in dedicated sessions`,
    });
  }

  // Medium: No child feedback collected
  const feedbackCount = rows.filter(
    (r) => r.child_feedback && r.child_feedback.trim().length > 0,
  ).length;
  if (rows.length >= 5 && feedbackCount / rows.length < 0.2) {
    alerts.push({
      type: "low_child_feedback",
      severity: "medium",
      message: `Child feedback collected in only ${Math.round((feedbackCount / rows.length) * 100)}% of sessions — UNCRC Article 12 and CHR 2015 require that children's views are sought. Children's feedback on relationship sessions helps ensure the programme meets their needs and gives them agency in their own development. Consider using age-appropriate feedback tools (visual scales, talking mats, exit cards)`,
    });
  }

  return alerts;
}

export function generateAriaInsights(
  rows: PositiveRelationshipsRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_session_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const methodBreakdown = Object.entries(metrics.by_delivery_method)
    .filter(([, count]) => count > 0)
    .map(([method, count]) => `${method}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_sessions} positive relationship/social skills ${metrics.total_sessions === 1 ? "session" : "sessions"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Session types: ${typeBreakdown || "none recorded"}. ` +
      `Delivery methods: ${methodBreakdown || "none"}. ` +
      `Average sessions per child: ${metrics.average_sessions_per_child}. ` +
      `Emotional sessions: ${metrics.emotional_session_count}. ` +
      `Interpersonal sessions: ${metrics.interpersonal_session_count}. ` +
      `Group dynamic sessions: ${metrics.group_dynamic_session_count}. ` +
      `Safety sessions: ${metrics.safety_session_count}. ` +
      `Engagement rate: ${metrics.engagement_rate}%. ` +
      `Skill demonstration: ${metrics.skill_demonstration_rate}%.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Generalisation rate: ${metrics.generalisation_rate}%. ` +
        `Peer interaction rate: ${metrics.peer_interaction_rate}%. ` +
        `Staff relationship rate: ${metrics.staff_relationship_rate}%. ` +
        `Confidence rate: ${metrics.confidence_rate}%. ` +
        `Attachment considered: ${metrics.attachment_rate}%. ` +
        `Trauma-informed: ${metrics.trauma_informed_rate}%. ` +
        `Key worker involved: ${metrics.key_worker_rate}%. ` +
        `Therapeutic input: ${metrics.therapeutic_rate}%. ` +
        `Care plan linked: ${metrics.care_plan_link_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority relationship alerts. ` +
        `Generalisation rate: ${metrics.generalisation_rate}%. ` +
        `Peer interaction rate: ${metrics.peer_interaction_rate}%. ` +
        `Staff relationship rate: ${metrics.staff_relationship_rate}%. ` +
        `Confidence rate: ${metrics.confidence_rate}%. ` +
        `Attachment considered: ${metrics.attachment_rate}%. ` +
        `Trauma-informed: ${metrics.trauma_informed_rate}%. ` +
        `Key worker involved: ${metrics.key_worker_rate}%. ` +
        `Therapeutic input: ${metrics.therapeutic_rate}%. ` +
        `Care plan linked: ${metrics.care_plan_link_rate}%. ` +
        `Continue supporting positive relationships per CHR 2015 Reg 11.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.generalisation_rate < 25 && metrics.skill_demonstration_rate > 40 && metrics.total_sessions > 5) {
    insights.push(
      `[reflect] Skills are demonstrated in ${metrics.skill_demonstration_rate}% of sessions ` +
        `but generalised to other settings in only ${metrics.generalisation_rate}%. This is ` +
        `the central challenge of social skills work with looked-after children — transfer ` +
        `from structured sessions to real-world interactions. CHR 2015 Reg 11 requires ` +
        `the home to promote positive relationships, which means skills must function ` +
        `beyond the session room. Is the programme building in enough opportunities for ` +
        `supported real-world practice? Are staff reinforcing skills learned in sessions ` +
        `during everyday interactions? Are community-based activities being used to ` +
        `practise social skills in naturalistic settings? For children with insecure ` +
        `attachment, generalisation is particularly difficult because new social ` +
        `situations trigger familiar defensive patterns.`,
    );
  } else if (metrics.trauma_informed_rate < 50 && metrics.total_sessions > 5) {
    insights.push(
      `[reflect] Only ${metrics.trauma_informed_rate}% of sessions use a trauma-informed ` +
        `approach. The evidence is clear: looked-after children's relationship ` +
        `difficulties are overwhelmingly rooted in early adverse experiences. ` +
        `Approaches that do not account for trauma risk misinterpreting defensive ` +
        `behaviours as wilful non-compliance, and interventions that work for ` +
        `typically developing children may be ineffective or harmful for traumatised ` +
        `children. Is the home investing in trauma-informed training for all staff ` +
        `who deliver relationship sessions? Are approaches like DDP (Dyadic ` +
        `Developmental Psychotherapy), PACE, or Theraplay being considered? ` +
        `SCCIF inspectors increasingly expect homes to demonstrate trauma-informed ` +
        `practice across all aspects of care.`,
    );
  } else if (metrics.engagement_rate < 60 && metrics.total_sessions > 5) {
    insights.push(
      `[reflect] Engagement rate is ${metrics.engagement_rate}% across relationship sessions. ` +
        `For looked-after children, engagement in relationship work is itself a ` +
        `significant achievement — many have learned that relationships are unsafe ` +
        `and will resist attempts to build social skills. CHR 2015 Reg 34 requires ` +
        `that behaviour management is underpinned by relationship-based practice. ` +
        `Are sessions creating psychologically safe environments? Are delivery methods ` +
        `being varied to find approaches that work for each child? Activity-based and ` +
        `modelling approaches may engage children who resist formal sessions. Is the ` +
        `programme flexible enough to meet children where they are, rather than ` +
        `requiring them to conform to a fixed curriculum?`,
    );
  } else {
    insights.push(
      `[reflect] How does the home measure the real-world impact of its positive ` +
        `relationships programme? SCCIF: Behaviour and attitudes expects to see ` +
        `that children are developing positive relationships and social skills, ` +
        `not just attending sessions. Are staff observing and recording improvements ` +
        `in day-to-day interactions, conflict resolution in the home, and peer ` +
        `relationships outside of structured sessions? CHR 2015 Reg 11 and Reg 19 ` +
        `together paint a picture of a home where positive relationships permeate ` +
        `every aspect of daily life, modelled by staff and supported through ` +
        `purposeful intervention. Is the relationship programme integrated into ` +
        `the home's culture, or does it feel like a separate activity bolted on ` +
        `to the daily routine?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    sessionType?: SessionType;
    deliveryMethod?: DeliveryMethod;
    limit?: number;
  },
): Promise<ServiceResult<PositiveRelationshipsRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_positive_relationships") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.sessionType) q = q.eq("session_type", filters.sessionType);
  if (filters?.deliveryMethod) q = q.eq("delivery_method", filters.deliveryMethod);

  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<PositiveRelationshipsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_positive_relationships") as SB)
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
  sessionType: SessionType;
  deliveryMethod?: DeliveryMethod;
  attachmentStyleConsidered?: boolean;
  traumaInformedApproach?: boolean;
  keyWorkerInvolved?: boolean;
  therapeuticInput?: boolean;
  childEngaged?: boolean;
  skillDemonstrated?: boolean;
  generalisedToOtherSettings?: boolean;
  positivePeerInteractionObserved?: boolean;
  staffRelationshipImproved?: boolean;
  confidenceImproved?: boolean;
  childFeedback?: string | null;
  carePlanLinked?: boolean;
  socialWorkerInformed?: boolean;
  nextSessionDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<PositiveRelationshipsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validatePositiveRelationships({
    childName: input.childName,
    sessionDate: input.sessionDate,
    facilitatorName: input.facilitatorName,
    sessionType: input.sessionType,
    deliveryMethod: input.deliveryMethod,
    attachmentStyleConsidered: input.attachmentStyleConsidered,
    traumaInformedApproach: input.traumaInformedApproach,
    childEngaged: input.childEngaged,
    childFeedback: input.childFeedback,
    therapeuticInput: input.therapeuticInput,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_positive_relationships") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      session_date: input.sessionDate,
      facilitator_name: input.facilitatorName,
      session_type: input.sessionType,
      delivery_method: input.deliveryMethod ?? "1-to-1 Session",
      attachment_style_considered: input.attachmentStyleConsidered ?? false,
      trauma_informed_approach: input.traumaInformedApproach ?? false,
      key_worker_involved: input.keyWorkerInvolved ?? false,
      therapeutic_input: input.therapeuticInput ?? false,
      child_engaged: input.childEngaged ?? false,
      skill_demonstrated: input.skillDemonstrated ?? false,
      generalised_to_other_settings: input.generalisedToOtherSettings ?? false,
      positive_peer_interaction_observed: input.positivePeerInteractionObserved ?? false,
      staff_relationship_improved: input.staffRelationshipImproved ?? false,
      confidence_improved: input.confidenceImproved ?? false,
      child_feedback: input.childFeedback ?? null,
      care_plan_linked: input.carePlanLinked ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      next_session_date: input.nextSessionDate ?? null,
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
    sessionType: SessionType;
    deliveryMethod: DeliveryMethod;
    attachmentStyleConsidered: boolean;
    traumaInformedApproach: boolean;
    keyWorkerInvolved: boolean;
    therapeuticInput: boolean;
    childEngaged: boolean;
    skillDemonstrated: boolean;
    generalisedToOtherSettings: boolean;
    positivePeerInteractionObserved: boolean;
    staffRelationshipImproved: boolean;
    confidenceImproved: boolean;
    childFeedback: string | null;
    carePlanLinked: boolean;
    socialWorkerInformed: boolean;
    nextSessionDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<PositiveRelationshipsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.facilitatorName !== undefined) mapped.facilitator_name = updates.facilitatorName;
  if (updates.sessionType !== undefined) mapped.session_type = updates.sessionType;
  if (updates.deliveryMethod !== undefined) mapped.delivery_method = updates.deliveryMethod;
  if (updates.attachmentStyleConsidered !== undefined) mapped.attachment_style_considered = updates.attachmentStyleConsidered;
  if (updates.traumaInformedApproach !== undefined) mapped.trauma_informed_approach = updates.traumaInformedApproach;
  if (updates.keyWorkerInvolved !== undefined) mapped.key_worker_involved = updates.keyWorkerInvolved;
  if (updates.therapeuticInput !== undefined) mapped.therapeutic_input = updates.therapeuticInput;
  if (updates.childEngaged !== undefined) mapped.child_engaged = updates.childEngaged;
  if (updates.skillDemonstrated !== undefined) mapped.skill_demonstrated = updates.skillDemonstrated;
  if (updates.generalisedToOtherSettings !== undefined) mapped.generalised_to_other_settings = updates.generalisedToOtherSettings;
  if (updates.positivePeerInteractionObserved !== undefined) mapped.positive_peer_interaction_observed = updates.positivePeerInteractionObserved;
  if (updates.staffRelationshipImproved !== undefined) mapped.staff_relationship_improved = updates.staffRelationshipImproved;
  if (updates.confidenceImproved !== undefined) mapped.confidence_improved = updates.confidenceImproved;
  if (updates.childFeedback !== undefined) mapped.child_feedback = updates.childFeedback;
  if (updates.carePlanLinked !== undefined) mapped.care_plan_linked = updates.carePlanLinked;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.nextSessionDate !== undefined) mapped.next_session_date = updates.nextSessionDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_positive_relationships") as SB)
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

  const { error } = await (client.from("cs_positive_relationships") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
