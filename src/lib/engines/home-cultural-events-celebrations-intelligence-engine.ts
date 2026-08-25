import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME CULTURAL EVENTS & CELEBRATIONS INTELLIGENCE ENGINE
// Home-level engine tracking cultural celebration quality — cultural event
// participation, diversity celebration planning, heritage day acknowledgement,
// multi-faith festival inclusion, and child-led cultural activities.
// Surfaces whether the home celebrates diversity, acknowledges heritage,
// includes multiple faiths, and empowers children to lead cultural expression.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
// ZERO imports.
//
// Regulatory: CHR 2015 Reg 5 (Quality of care), Reg 7 (Children's views).
// SCCIF: Experiences and progress — children's cultural identities are
// respected, celebrated, and nurtured through meaningful engagement.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface CulturalEventRecordInput {
  id: string;
  child_id: string;
  event_date: string;
  event_type: "cultural_celebration" | "heritage_event" | "faith_observance" | "community_festival" | "national_day" | "international_day" | "arts_performance" | "food_culture" | "language_activity" | "other";
  title: string;
  description: string;
  participated: boolean;
  engagement_level: "enthusiastic" | "willing" | "reluctant" | "refused" | "led_by_child";
  child_feedback_positive: boolean;
  staff_facilitated: boolean;
  external_community_involved: boolean;
  linked_to_child_heritage: boolean;
  photos_consented: boolean;
  duration_minutes: number;
  created_at: string;
}

export interface DiversityCelebrationRecordInput {
  id: string;
  celebration_date: string;
  celebration_type: "black_history_month" | "pride" | "diwali" | "eid" | "chinese_new_year" | "hanukkah" | "christmas" | "easter" | "vaisakhi" | "windrush_day" | "refugee_week" | "disability_awareness" | "womens_day" | "interfaith_week" | "other";
  title: string;
  planned_in_advance: boolean;
  children_involved_in_planning: boolean;
  children_participated: string[];  // child_ids
  total_children_invited: number;
  participation_rate_pct: number | null;
  educational_component: boolean;
  external_speaker_or_visitor: boolean;
  food_or_cuisine_included: boolean;
  display_or_decoration: boolean;
  child_feedback_collected: boolean;
  child_feedback_positive_count: number;
  staff_led_by: string;
  quality_rating: number; // 1-5
  created_at: string;
}

export interface HeritageDayRecordInput {
  id: string;
  child_id: string;
  heritage_date: string;
  heritage_type: "birth_culture" | "family_heritage" | "nationality" | "ethnic_identity" | "language" | "religious_heritage" | "regional_identity" | "dual_heritage" | "other";
  title: string;
  acknowledged: boolean;
  child_involved_in_planning: boolean;
  activity_description: string;
  child_feedback_positive: boolean;
  staff_supported: boolean;
  family_connection_facilitated: boolean;
  resources_provided: boolean;
  created_at: string;
}

export interface FestivalInclusionRecordInput {
  id: string;
  festival_date: string;
  festival_name: string;
  faith_or_tradition: "christian" | "muslim" | "hindu" | "sikh" | "jewish" | "buddhist" | "pagan" | "secular" | "multi_faith" | "cultural" | "other";
  children_participated: string[];  // child_ids
  total_children_eligible: number;
  participation_rate_pct: number | null;
  inclusive_planning: boolean;
  dietary_needs_accommodated: boolean;
  religious_sensitivity_observed: boolean;
  educational_element: boolean;
  child_feedback_collected: boolean;
  child_feedback_positive_count: number;
  quality_rating: number; // 1-5
  created_at: string;
}

export interface ChildLedActivityRecordInput {
  id: string;
  child_id: string;
  activity_date: string;
  activity_type: "cultural_presentation" | "cooking_session" | "music_sharing" | "language_teaching" | "storytelling" | "art_expression" | "dance_performance" | "faith_sharing" | "heritage_project" | "other";
  title: string;
  description: string;
  child_initiated: boolean;
  staff_supported: boolean;
  peers_participated: boolean;
  peer_feedback_positive: boolean;
  child_confidence_improved: boolean;
  linked_to_identity: boolean;
  duration_minutes: number;
  child_satisfaction_rating: number; // 1-5
  created_at: string;
}

export interface CulturalEventsInput {
  today: string;
  total_children: number;
  cultural_event_records: CulturalEventRecordInput[];
  diversity_celebration_records: DiversityCelebrationRecordInput[];
  heritage_day_records: HeritageDayRecordInput[];
  festival_inclusion_records: FestivalInclusionRecordInput[];
  child_led_activity_records: ChildLedActivityRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type CulturalEventsRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface CulturalEventsInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface CulturalEventsRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface CulturalEventsResult {
  cultural_rating: CulturalEventsRating;
  cultural_score: number | null;
  headline: string;
  total_cultural_events: number;
  total_diversity_celebrations: number;
  total_heritage_days: number;
  total_festival_inclusions: number;
  total_child_led_activities: number;
  event_participation_rate: number | null;
  diversity_celebration_rate: number | null;
  heritage_acknowledgement_rate: number | null;
  festival_inclusion_rate: number | null;
  child_led_rate: number | null;
  child_satisfaction_rate: number | null;
  unique_event_types: number;
  unique_faiths_represented: number;
  unique_heritage_types: number;
  children_with_heritage_acknowledged: number;
  children_leading_activities: number;
  external_community_events: number;
  educational_component_count: number;
  avg_celebration_quality: number;
  avg_festival_quality: number;
  strengths: string[];
  concerns: string[];
  recommendations: CulturalEventsRecommendation[];
  insights: CulturalEventsInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function avgRating(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

function toRating(score: number): CulturalEventsRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: CulturalEventsRating,
  score: number,
  headline: string,
): CulturalEventsResult {
  return {
    cultural_rating: rating,
    cultural_score: score,
    headline,
    total_cultural_events: 0,
    total_diversity_celebrations: 0,
    total_heritage_days: 0,
    total_festival_inclusions: 0,
    total_child_led_activities: 0,
    event_participation_rate: null,
    diversity_celebration_rate: null,
    heritage_acknowledgement_rate: null,
    festival_inclusion_rate: null,
    child_led_rate: null,
    child_satisfaction_rate: null,
    unique_event_types: 0,
    unique_faiths_represented: 0,
    unique_heritage_types: 0,
    children_with_heritage_acknowledged: 0,
    children_leading_activities: 0,
    external_community_events: 0,
    educational_component_count: 0,
    avg_celebration_quality: 0,
    avg_festival_quality: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeCulturalEventsCelebrations(
  input: CulturalEventsInput,
): CulturalEventsResult {
  const {
    total_children,
    cultural_event_records,
    diversity_celebration_records,
    heritage_day_records,
    festival_inclusion_records,
    child_led_activity_records,
  } = input;

  // ── Special case: all empty + 0 children = insufficient_data/0 ────────
  const allEmpty =
    cultural_event_records.length === 0 &&
    diversity_celebration_records.length === 0 &&
    heritage_day_records.length === 0 &&
    festival_inclusion_records.length === 0 &&
    child_led_activity_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess cultural events and celebrations.",
    );
  }

  // ── Special case: all empty + children > 0 = inadequate/15 ────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No cultural events, diversity celebrations, heritage days, festival inclusion, or child-led cultural activities recorded despite children on placement — cultural provision requires urgent attention.",
      ),
      concerns: [
        "No cultural event records, diversity celebrations, heritage day acknowledgements, festival inclusion records, or child-led cultural activities exist despite children being on placement — the home cannot evidence that children's cultural identities are recognised, respected, or celebrated.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement a cultural events calendar immediately, capturing key cultural celebrations, heritage days, and multi-faith festivals relevant to the children in placement. Each child's cultural background must be identified and reflected in the home's programme.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
        },
        {
          rank: 2,
          recommendation:
            "Consult with each child about their cultural identity, heritage, and faith background, and develop an individualised cultural support plan that ensures their identity is acknowledged and celebrated throughout the year.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 — Children's views",
        },
      ],
      insights: [
        {
          text: "The complete absence of cultural events and celebrations data means the home cannot demonstrate that children's cultural identities are respected, acknowledged, or celebrated. Ofsted expects homes to actively promote cultural awareness and celebrate diversity as part of quality care under Reg 5. The lack of any cultural provision is a significant regulatory concern under SCCIF experiences and progress.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  const totalCulturalEvents = cultural_event_records.length;
  const totalDiversityCelebrations = diversity_celebration_records.length;
  const totalHeritageDays = heritage_day_records.length;
  const totalFestivalInclusions = festival_inclusion_records.length;
  const totalChildLedActivities = child_led_activity_records.length;

  // --- Event participation rate ---
  const eventsParticipated = cultural_event_records.filter(
    (e) => e.participated,
  ).length;
  const eventParticipationRate = rate(eventsParticipated, totalCulturalEvents);

  // --- Event engagement analysis ---
  const enthusiasticEvents = cultural_event_records.filter(
    (e) => e.engagement_level === "enthusiastic" || e.engagement_level === "led_by_child",
  ).length;
  const eventEnthusiasmRate = rate(enthusiasticEvents, totalCulturalEvents);

  const eventPositiveFeedback = cultural_event_records.filter(
    (e) => e.child_feedback_positive,
  ).length;

  const externalCommunityEvents = cultural_event_records.filter(
    (e) => e.external_community_involved,
  ).length;

  // --- Unique event types ---
  const uniqueEventTypes = new Set(
    cultural_event_records.map((e) => e.event_type),
  ).size;

  // --- Diversity celebration metrics ---
  const celebrationsPlannedInAdvance = diversity_celebration_records.filter(
    (c) => c.planned_in_advance,
  ).length;
  const celebrationPlanningRate = rate(celebrationsPlannedInAdvance, totalDiversityCelebrations);

  const celebrationsWithChildPlanning = diversity_celebration_records.filter(
    (c) => c.children_involved_in_planning,
  ).length;
  const childPlanningRate = rate(celebrationsWithChildPlanning, totalDiversityCelebrations);

  const celebrationsWithEducation = diversity_celebration_records.filter(
    (c) => c.educational_component,
  ).length;

  const celebrationsWithFeedback = diversity_celebration_records.filter(
    (c) => c.child_feedback_collected,
  ).length;
  const celebrationFeedbackRate = rate(celebrationsWithFeedback, totalDiversityCelebrations);

  const celebrationQualityRatings = diversity_celebration_records.map((c) => c.quality_rating);
  const avgCelebrationQuality = avgRating(celebrationQualityRatings);

  // Diversity celebration rate: how many children participated in at least one celebration
  const childrenInCelebrations = new Set(
    diversity_celebration_records.flatMap((c) => c.children_participated),
  ).size;
  const diversityCelebrationRate = total_children > 0
    ? rate(childrenInCelebrations, total_children)
    : null;

  // --- Heritage day metrics ---
  const heritageDaysAcknowledged = heritage_day_records.filter(
    (h) => h.acknowledged,
  ).length;
  const heritageAcknowledgementRate = rate(heritageDaysAcknowledged, totalHeritageDays);

  const heritageChildInvolvement = heritage_day_records.filter(
    (h) => h.child_involved_in_planning,
  ).length;
  const heritageChildInvolvementRate = rate(heritageChildInvolvement, totalHeritageDays);

  const heritageFamilyConnections = heritage_day_records.filter(
    (h) => h.family_connection_facilitated,
  ).length;
  const heritageFamilyConnectionRate = rate(heritageFamilyConnections, totalHeritageDays);

  const heritagePositiveFeedback = heritage_day_records.filter(
    (h) => h.child_feedback_positive,
  ).length;
  const heritageFeedbackPositiveRate = rate(heritagePositiveFeedback, totalHeritageDays);

  // Unique heritage types represented
  const uniqueHeritageTypes = new Set(
    heritage_day_records.map((h) => h.heritage_type),
  ).size;

  // Children with at least one heritage day acknowledged
  const childrenWithHeritage = new Set(
    heritage_day_records.filter((h) => h.acknowledged).map((h) => h.child_id),
  ).size;

  // Heritage acknowledgement rate as proportion of children with heritage acknowledged
  // (for the 6-rate grid, we use heritage_acknowledgement_rate as the raw acknowledgement %)

  const festivalsReligiousSensitivity = festival_inclusion_records.filter(
    (f) => f.religious_sensitivity_observed,
  ).length;
  const festivalSensitivityRate = rate(festivalsReligiousSensitivity, totalFestivalInclusions);

  const festivalsWithEducation = festival_inclusion_records.filter(
    (f) => f.educational_element,
  ).length;

  const festivalsFeedbackCollected = festival_inclusion_records.filter(
    (f) => f.child_feedback_collected,
  ).length;
  const festivalFeedbackRate = rate(festivalsFeedbackCollected, totalFestivalInclusions);

  const festivalQualityRatings = festival_inclusion_records.map((f) => f.quality_rating);
  const avgFestivalQuality = avgRating(festivalQualityRatings);

  // Unique faiths represented across festivals
  const uniqueFaithsRepresented = new Set(
    festival_inclusion_records.map((f) => f.faith_or_tradition),
  ).size;

  // Festival inclusion rate: children in at least one festival
  const childrenInFestivals = new Set(
    festival_inclusion_records.flatMap((f) => f.children_participated),
  ).size;
  const festivalInclusionRate = total_children > 0
    ? rate(childrenInFestivals, total_children)
    : null;

  const childLedWithPeerParticipation = child_led_activity_records.filter(
    (a) => a.peers_participated,
  ).length;
  const peerParticipationRate = rate(childLedWithPeerParticipation, totalChildLedActivities);

  const childLedWithPeerPositiveFeedback = child_led_activity_records.filter(
    (a) => a.peer_feedback_positive,
  ).length;
  const peerFeedbackPositiveRate = rate(childLedWithPeerPositiveFeedback, totalChildLedActivities);

  const childLedConfidenceImproved = child_led_activity_records.filter(
    (a) => a.child_confidence_improved,
  ).length;
  const confidenceImprovementRate = rate(childLedConfidenceImproved, totalChildLedActivities);

  const childLedStaffSupported = child_led_activity_records.filter(
    (a) => a.staff_supported,
  ).length;
  const staffSupportRate = rate(childLedStaffSupported, totalChildLedActivities);

  // Children leading at least one activity
  const childrenLeadingActivities = new Set(
    child_led_activity_records.map((a) => a.child_id),
  ).size;

  // Child-led rate: proportion of children who have led at least one cultural activity
  const childLedRate = total_children > 0
    ? rate(childrenLeadingActivities, total_children)
    : null;

  // --- Child satisfaction rate (composite) ---
  // Combines positive feedback from events, heritage days, and child-led satisfaction ratings
  const satisfactionNumerator =
    eventPositiveFeedback +
    heritagePositiveFeedback +
    child_led_activity_records.filter((a) => a.child_satisfaction_rating >= 4).length;
  const satisfactionDenominator =
    totalCulturalEvents + totalHeritageDays + totalChildLedActivities;
  const childSatisfactionRate = rate(satisfactionNumerator, satisfactionDenominator);

  // --- Educational component count (composite) ---
  const educationalComponentCount =
    celebrationsWithEducation + festivalsWithEducation;

  // ── Scoring: base 52, max bonuses +28 ─────────────────────────────────

  let score = 52;

  // --- Bonus 1: eventParticipationRate (>=90: +4, >=70: +2) ---
  if (meets(eventParticipationRate, 90)) score += 4;
  else if (meets(eventParticipationRate, 70)) score += 2;

  // --- Bonus 2: diversityCelebrationRate (>=90: +4, >=70: +2) ---
  if ((diversityCelebrationRate ?? 0) >= 90) score += 4;
  else if ((diversityCelebrationRate ?? 0) >= 70) score += 2;

  // --- Bonus 3: heritageAcknowledgementRate (>=90: +3, >=70: +1) ---
  if (meets(heritageAcknowledgementRate, 90)) score += 3;
  else if (meets(heritageAcknowledgementRate, 70)) score += 1;

  // --- Bonus 4: festivalInclusionRate (>=90: +3, >=70: +1) ---
  if ((festivalInclusionRate ?? 0) >= 90) score += 3;
  else if ((festivalInclusionRate ?? 0) >= 70) score += 1;

  // --- Bonus 5: childLedRate (>=60: +4, >=30: +2) ---
  if ((childLedRate ?? 0) >= 60) score += 4;
  else if ((childLedRate ?? 0) >= 30) score += 2;

  // --- Bonus 6: childSatisfactionRate (>=90: +3, >=70: +1) ---
  if (meets(childSatisfactionRate, 90)) score += 3;
  else if (meets(childSatisfactionRate, 70)) score += 1;

  // --- Bonus 7: avgCelebrationQuality (>=4.0: +3, >=3.0: +1) ---
  if (avgCelebrationQuality >= 4.0) score += 3;
  else if (avgCelebrationQuality >= 3.0) score += 1;

  // --- Bonus 8: uniqueFaithsRepresented (>=4: +2, >=2: +1) ---
  if (uniqueFaithsRepresented >= 4) score += 2;
  else if (uniqueFaithsRepresented >= 2) score += 1;

  // --- Bonus 9: confidenceImprovementRate (>=80: +2, >=50: +1) ---
  if (meets(confidenceImprovementRate, 80)) score += 2;
  else if (meets(confidenceImprovementRate, 50)) score += 1;

  // ── Penalties (guarded by array.length > 0) ───────────────────────────

  // Penalty 1: Low event participation
  if (below(eventParticipationRate, 50) && cultural_event_records.length > 0) score -= 5;

  // Penalty 2: Low heritage acknowledgement
  if (below(heritageAcknowledgementRate, 50) && heritage_day_records.length > 0) score -= 5;

  // Penalty 3: Low festival inclusion
  if ((festivalInclusionRate ?? 0) < 40 && festival_inclusion_records.length > 0) score -= 4;

  // Penalty 4: Low child satisfaction
  if (below(childSatisfactionRate, 40) && satisfactionDenominator > 0) score -= 4;

  score = clamp(score, 0, 100);

  const cultural_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(eventParticipationRate, 90) && totalCulturalEvents > 0) {
    strengths.push(
      `${eventParticipationRate}% participation across ${totalCulturalEvents} cultural events — children are actively engaged in cultural experiences, demonstrating the home provides meaningful cultural opportunities that children want to take part in.`,
    );
  } else if (meets(eventParticipationRate, 70) && totalCulturalEvents > 0) {
    strengths.push(
      `${eventParticipationRate}% cultural event participation — good levels of engagement show children are accessing and enjoying cultural activities.`,
    );
  }

  if ((diversityCelebrationRate ?? 0) >= 90 && totalDiversityCelebrations > 0) {
    strengths.push(
      `${diversityCelebrationRate}% of children have participated in diversity celebrations — the home demonstrates an inclusive approach to celebrating the breadth of cultural diversity.`,
    );
  } else if ((diversityCelebrationRate ?? 0) >= 70 && totalDiversityCelebrations > 0) {
    strengths.push(
      `${diversityCelebrationRate}% of children participating in diversity celebrations — good reach ensures most children experience cultural celebration.`,
    );
  }

  if (meets(heritageAcknowledgementRate, 90) && totalHeritageDays > 0) {
    strengths.push(
      `${heritageAcknowledgementRate}% of heritage days acknowledged — the home actively recognises and celebrates children's individual heritage and cultural background. This is powerful evidence of identity-affirming care under Reg 5.`,
    );
  } else if (meets(heritageAcknowledgementRate, 70) && totalHeritageDays > 0) {
    strengths.push(
      `${heritageAcknowledgementRate}% heritage acknowledgement — the home recognises the majority of children's heritage days, supporting positive cultural identity.`,
    );
  }

  if ((festivalInclusionRate ?? 0) >= 90 && totalFestivalInclusions > 0) {
    strengths.push(
      `${festivalInclusionRate}% of children included in multi-faith and cultural festivals — outstanding inclusive practice ensuring all children experience a diverse range of celebrations.`,
    );
  } else if ((festivalInclusionRate ?? 0) >= 70 && totalFestivalInclusions > 0) {
    strengths.push(
      `${festivalInclusionRate}% festival inclusion — good practice in ensuring children access multi-faith and cultural celebrations.`,
    );
  }

  if ((childLedRate ?? 0) >= 60 && totalChildLedActivities > 0) {
    strengths.push(
      `${childLedRate}% of children have led cultural activities — the home empowers children to share their own cultural knowledge and identity, demonstrating genuine respect for children's cultural voices under Reg 7.`,
    );
  } else if ((childLedRate ?? 0) >= 30 && totalChildLedActivities > 0) {
    strengths.push(
      `${childLedRate}% of children leading cultural activities — the home is developing a culture where children feel confident to share their heritage and cultural knowledge.`,
    );
  }

  if (meets(childSatisfactionRate, 90) && satisfactionDenominator > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction with cultural provision — children report overwhelmingly positive experiences of cultural activities and celebrations. This child-centred evidence is compelling for Ofsted.`,
    );
  } else if (meets(childSatisfactionRate, 70) && satisfactionDenominator > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction — most children report positive experiences of cultural activities and celebrations.`,
    );
  }

  if (uniqueFaithsRepresented >= 4 && totalFestivalInclusions > 0) {
    strengths.push(
      `${uniqueFaithsRepresented} different faith traditions represented in festival programme — the home provides a truly multi-faith approach to cultural celebration, broadening children's understanding of diversity.`,
    );
  } else if (uniqueFaithsRepresented >= 2 && totalFestivalInclusions > 0) {
    strengths.push(
      `${uniqueFaithsRepresented} faith traditions included in festivals — the home recognises more than one faith tradition in its cultural programme.`,
    );
  }

  if (avgCelebrationQuality >= 4.0 && totalDiversityCelebrations > 0) {
    strengths.push(
      `Diversity celebrations average ${avgCelebrationQuality}/5 quality rating — high-quality celebrations that are well-planned, educational, and meaningful for children.`,
    );
  } else if (avgCelebrationQuality >= 3.0 && totalDiversityCelebrations > 0) {
    strengths.push(
      `Diversity celebrations average ${avgCelebrationQuality}/5 quality — celebrations are delivered to a competent standard.`,
    );
  }

  if (meets(confidenceImprovementRate, 80) && totalChildLedActivities > 0) {
    strengths.push(
      `${confidenceImprovementRate}% of child-led cultural activities improved the child's confidence — leading cultural activities is building children's self-esteem and sense of cultural pride.`,
    );
  } else if (meets(confidenceImprovementRate, 50) && totalChildLedActivities > 0) {
    strengths.push(
      `${confidenceImprovementRate}% of child-led activities report confidence improvement — cultural expression is contributing to positive self-identity.`,
    );
  }

  if (externalCommunityEvents >= 3 && totalCulturalEvents > 0) {
    strengths.push(
      `${externalCommunityEvents} cultural events involved external community participation — the home connects children with the wider community, enriching their cultural experiences and building social capital.`,
    );
  }

  if (meets(heritageFamilyConnectionRate, 70) && totalHeritageDays > 0) {
    strengths.push(
      `${heritageFamilyConnectionRate}% of heritage days facilitated family connection — linking heritage celebration to family contact supports children's sense of belonging and continuity.`,
    );
  }

  if (meets(celebrationPlanningRate, 90) && totalDiversityCelebrations > 0) {
    strengths.push(
      `${celebrationPlanningRate}% of diversity celebrations planned in advance — proactive cultural planning demonstrates a thoughtful, intentional approach to diversity.`,
    );
  }

  if (meets(childPlanningRate, 60) && totalDiversityCelebrations > 0) {
    strengths.push(
      `${childPlanningRate}% of diversity celebrations involved children in planning — children's agency in shaping cultural events demonstrates genuine respect for their views under Reg 7.`,
    );
  }

  if (meets(eventEnthusiasmRate, 70) && totalCulturalEvents > 0) {
    strengths.push(
      `${eventEnthusiasmRate}% of cultural events saw enthusiastic or child-led engagement — children are genuinely excited about cultural activities, not just passively attending.`,
    );
  }

  if (meets(festivalSensitivityRate, 90) && totalFestivalInclusions > 0) {
    strengths.push(
      `${festivalSensitivityRate}% of festivals observed religious sensitivity — the home demonstrates thoughtful, respectful practice when engaging with faith-based celebrations.`,
    );
  }

  if (uniqueEventTypes >= 5 && totalCulturalEvents > 0) {
    strengths.push(
      `${uniqueEventTypes} different cultural event types recorded — a varied cultural programme covering celebrations, heritage, arts, cuisine, and community activities.`,
    );
  }

  if (educationalComponentCount >= 3) {
    strengths.push(
      `${educationalComponentCount} celebrations and festivals included an educational component — children are learning about cultures, not just observing, which deepens understanding and respect.`,
    );
  }

  if (meets(staffSupportRate, 90) && totalChildLedActivities > 0) {
    strengths.push(
      `${staffSupportRate}% of child-led activities had staff support — staff are enabling children's cultural expression without taking over, providing scaffolding rather than direction.`,
    );
  }

  if (meets(peerParticipationRate, 70) && totalChildLedActivities > 0) {
    strengths.push(
      `${peerParticipationRate}% of child-led activities had peer participation — children learn from each other's cultures, building mutual respect and understanding within the home.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(eventParticipationRate, 50) && totalCulturalEvents > 0) {
    concerns.push(
      `Only ${eventParticipationRate}% cultural event participation — the majority of children are not participating in cultural events. This suggests cultural activities may not be well-matched to children's interests, or barriers to participation exist. Under Reg 5, the home must ensure all children can access cultural experiences.`,
    );
  } else if (below(eventParticipationRate, 70) && meets(eventParticipationRate, 50) && totalCulturalEvents > 0) {
    concerns.push(
      `Cultural event participation at ${eventParticipationRate}% — some children are not engaging with cultural events. Review whether activities reflect children's own cultural backgrounds and interests.`,
    );
  }

  if ((diversityCelebrationRate ?? 0) < 50 && totalDiversityCelebrations > 0) {
    concerns.push(
      `Only ${diversityCelebrationRate}% of children have participated in diversity celebrations — the majority of children are missing out on cultural celebration experiences. Ofsted expects all children to benefit from celebrating diversity.`,
    );
  } else if ((diversityCelebrationRate ?? 0) < 70 && (diversityCelebrationRate ?? 0) >= 50 && totalDiversityCelebrations > 0) {
    concerns.push(
      `Diversity celebration participation at ${diversityCelebrationRate}% — not all children are accessing diversity celebrations. Ensure inclusion planning reaches every child.`,
    );
  }

  if (below(heritageAcknowledgementRate, 50) && totalHeritageDays > 0) {
    concerns.push(
      `Only ${heritageAcknowledgementRate}% of heritage days acknowledged — the majority of children's heritage occasions are not being recognised. Failing to acknowledge a child's cultural heritage undermines their sense of identity and belonging. This is a significant concern under Reg 5.`,
    );
  } else if (below(heritageAcknowledgementRate, 70) && meets(heritageAcknowledgementRate, 50) && totalHeritageDays > 0) {
    concerns.push(
      `Heritage acknowledgement at ${heritageAcknowledgementRate}% — some children's heritage days are not being recognised. Every child's cultural background should be actively celebrated.`,
    );
  }

  if ((festivalInclusionRate ?? 0) < 40 && totalFestivalInclusions > 0) {
    concerns.push(
      `Only ${festivalInclusionRate}% of children included in festivals — the majority of children are excluded from multi-faith and cultural festival experiences. This limits their exposure to diversity and may leave some children's own faith traditions unrecognised.`,
    );
  } else if ((festivalInclusionRate ?? 0) < 70 && (festivalInclusionRate ?? 0) >= 40 && totalFestivalInclusions > 0) {
    concerns.push(
      `Festival inclusion at ${festivalInclusionRate}% — not all children are accessing festival celebrations. Review whether festival planning actively includes every child.`,
    );
  }

  if (childLedRate === 0 && total_children > 0 && totalChildLedActivities === 0) {
    concerns.push(
      "No child-led cultural activities recorded — children are not being given opportunities to share their own cultural knowledge and heritage. Empowering children to lead cultural expression is essential for positive identity development under Reg 7.",
    );
  } else if ((childLedRate ?? 0) < 20 && (childLedRate ?? 0) > 0 && total_children > 0) {
    concerns.push(
      `Only ${childLedRate}% of children have led cultural activities — the home should create more opportunities for all children to share their cultural heritage and knowledge with peers.`,
    );
  }

  if (below(childSatisfactionRate, 40) && satisfactionDenominator > 0) {
    concerns.push(
      `Only ${childSatisfactionRate}% child satisfaction with cultural provision — most children are not reporting positive experiences. Cultural activities must be genuinely meaningful to children, not tokenistic. Consult with children about what cultural celebrations would be meaningful to them.`,
    );
  } else if (below(childSatisfactionRate, 70) && meets(childSatisfactionRate, 40) && satisfactionDenominator > 0) {
    concerns.push(
      `Child satisfaction at ${childSatisfactionRate}% — a notable proportion of children do not report positive cultural experiences. Review whether cultural activities are well-matched to children's interests and identities.`,
    );
  }

  if (uniqueFaithsRepresented <= 1 && totalFestivalInclusions > 0) {
    concerns.push(
      `Only ${uniqueFaithsRepresented} faith tradition${uniqueFaithsRepresented === 1 ? "" : "s"} represented in the festival programme — a truly inclusive home should celebrate multiple faith traditions to promote understanding and respect for diversity.`,
    );
  }

  if (avgCelebrationQuality > 0 && avgCelebrationQuality < 3.0 && totalDiversityCelebrations > 0) {
    concerns.push(
      `Diversity celebration quality averages ${avgCelebrationQuality}/5 — celebrations are not meeting a good standard. Poor-quality cultural events can feel tokenistic and may undermine rather than promote children's sense of cultural identity.`,
    );
  }

  if (below(heritageChildInvolvementRate, 50) && totalHeritageDays > 0) {
    concerns.push(
      `Only ${heritageChildInvolvementRate}% of heritage days involved the child in planning — heritage celebrations should be shaped by the child whose heritage is being acknowledged, not planned for them without their input.`,
    );
  }

  if (below(celebrationFeedbackRate, 50) && totalDiversityCelebrations > 0) {
    concerns.push(
      `Child feedback collected for only ${celebrationFeedbackRate}% of diversity celebrations — without children's views on cultural events, the home cannot demonstrate that celebrations are meaningful to them.`,
    );
  }

  if (below(festivalFeedbackRate, 50) && totalFestivalInclusions > 0) {
    concerns.push(
      `Child feedback collected for only ${festivalFeedbackRate}% of festivals — children's voices on festival experiences must be sought and recorded to evidence child-centred practice.`,
    );
  }

  if (below(heritageFamilyConnectionRate, 30) && totalHeritageDays > 0) {
    concerns.push(
      `Only ${heritageFamilyConnectionRate}% of heritage days facilitated family connection — where safe and appropriate, heritage celebrations should connect children with their family heritage to support continuity of identity.`,
    );
  }

  if (totalCulturalEvents === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No cultural event records recorded — while other cultural data exists, the absence of individual cultural event participation data means the home cannot evidence children's direct engagement in cultural experiences.",
    );
  }

  if (totalDiversityCelebrations === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No diversity celebrations recorded — the home has no evidence of celebrating cultural diversity through dedicated events. Homes should maintain a calendar of diversity celebrations relevant to their children.",
    );
  }

  if (below(festivalSensitivityRate, 70) && totalFestivalInclusions > 0) {
    concerns.push(
      `Religious sensitivity observed in only ${festivalSensitivityRate}% of festivals — faith-based festivals require careful, respectful handling to avoid causing offence or distress to children of different backgrounds.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: CulturalEventsRecommendation[] = [];
  let rank = 0;

  if (below(eventParticipationRate, 50) && totalCulturalEvents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review cultural event provision to understand why participation is low — consult with each child individually about their cultural interests, remove barriers to participation, and ensure events reflect the cultural backgrounds of children in placement.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (below(heritageAcknowledgementRate, 50) && totalHeritageDays > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child's heritage days are acknowledged and celebrated — create individual cultural calendars for each child that identify key heritage dates and plan how these will be marked. A child's heritage is central to their identity and must be actively recognised.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (totalCulturalEvents === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording individual children's cultural event participation immediately — each child's engagement with cultural experiences must be documented to evidence that the home provides culturally enriching care.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (totalDiversityCelebrations === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a diversity celebration programme — create and maintain an annual calendar of diversity celebrations (such as Black History Month, Pride, Diwali, Eid, Chinese New Year) and record children's participation and feedback.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (below(childSatisfactionRate, 40) && satisfactionDenominator > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct individual consultations with children to understand what cultural activities and celebrations would be meaningful to them — current provision is not resonating. Children's views must drive the cultural programme under Reg 7.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views",
    });
  }

  if ((festivalInclusionRate ?? 0) < 40 && totalFestivalInclusions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review festival inclusion planning to ensure all children are invited and supported to participate — consider barriers such as understanding, interest, and cultural sensitivity that may be preventing children from engaging.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if ((diversityCelebrationRate ?? 0) < 50 && totalDiversityCelebrations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase participation in diversity celebrations — review whether celebrations are scheduled at accessible times, whether children are given choice about their involvement, and whether activities genuinely engage young people.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (uniqueFaithsRepresented <= 1 && totalFestivalInclusions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Broaden the festival programme to include multiple faith traditions — aim for at least 3-4 different faith traditions per year (Christian, Muslim, Hindu, Sikh, Jewish, Buddhist) to give children a richer understanding of the multi-faith society they live in.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (childLedRate === 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create opportunities for children to lead cultural activities — invite children to share their cultural knowledge through cooking sessions, music, storytelling, language teaching, or cultural presentations. Staff should facilitate and support rather than direct.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views",
    });
  } else if ((childLedRate ?? 0) < 30 && (childLedRate ?? 0) > 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Expand child-led cultural activities to reach more children — not every child may feel confident, so provide varied formats (one-to-one, small group, whole home) and offer encouragement and scaffolding.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views",
    });
  }

  if (below(heritageChildInvolvementRate, 50) && totalHeritageDays > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase children's involvement in planning their own heritage celebrations — ask each child how they would like their heritage acknowledged and give them agency to shape the celebration.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views",
    });
  }

  if (meets(eventParticipationRate, 50) && below(eventParticipationRate, 70) && totalCulturalEvents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase cultural event participation by reviewing the programme with children — ensure events are varied, engaging, and reflect the cultural backgrounds present in the home.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (meets(heritageAcknowledgementRate, 50) && below(heritageAcknowledgementRate, 70) && totalHeritageDays > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen heritage acknowledgement to reach at least 90% — ensure every child's cultural background is systematically recognised through individual heritage calendars and planned celebrations.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (avgCelebrationQuality > 0 && avgCelebrationQuality < 3.0 && totalDiversityCelebrations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve the quality of diversity celebrations — include educational components, involve children in planning, seek external community input, and gather children's feedback to continuously improve events.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (below(celebrationFeedbackRate, 50) && totalDiversityCelebrations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Collect children's feedback after every diversity celebration — their views are essential for evaluating whether celebrations are meaningful and for planning future events that genuinely resonate.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views",
    });
  }

  if (below(festivalFeedbackRate, 50) && totalFestivalInclusions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Gather children's feedback after each festival — use age-appropriate methods (visual scales, brief conversations, feedback cards) to understand what children enjoyed and what could be improved.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views",
    });
  }

  if (below(heritageFamilyConnectionRate, 30) && totalHeritageDays > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Where safe and appropriate, facilitate family connections during heritage celebrations — sharing heritage with family members strengthens children's sense of identity and belonging.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (below(festivalSensitivityRate, 70) && totalFestivalInclusions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure religious sensitivity is observed in all festival celebrations — provide staff training on faith awareness and consult with children and faith communities about appropriate ways to mark observances.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (externalCommunityEvents < 2 && totalCulturalEvents >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase external community involvement in cultural events — connecting with local community groups, cultural organisations, and faith communities enriches children's experiences and builds social networks.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (educationalComponentCount === 0 && (totalDiversityCelebrations + totalFestivalInclusions) >= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Include educational components in celebrations and festivals — children benefit from learning the history and significance behind cultural events, not just participating in activities.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: CulturalEventsInsight[] = [];

  // -- Critical insights --

  if (below(eventParticipationRate, 50) && totalCulturalEvents > 0) {
    insights.push({
      text: `Only ${eventParticipationRate}% cultural event participation. When the majority of children are not participating in cultural events, the home cannot demonstrate that it provides culturally enriching care. Ofsted will look for evidence under SCCIF experiences and progress that children enjoy a range of cultural experiences — current participation levels fall short of this expectation.`,
      severity: "critical",
    });
  }

  if (below(heritageAcknowledgementRate, 50) && totalHeritageDays > 0) {
    insights.push({
      text: `Only ${heritageAcknowledgementRate}% of heritage days acknowledged. A child's cultural heritage is fundamental to their identity. When the home fails to acknowledge the majority of heritage occasions, it signals a lack of awareness or prioritisation of children's cultural identities. This directly undermines Reg 5 quality of care.`,
      severity: "critical",
    });
  }

  if (below(childSatisfactionRate, 40) && satisfactionDenominator > 0) {
    insights.push({
      text: `Only ${childSatisfactionRate}% child satisfaction with cultural provision. When most children do not report positive experiences of cultural activities, the provision is likely tokenistic rather than genuinely meaningful. Ofsted will explore whether children feel their cultural identity is respected and celebrated — this evidence suggests otherwise.`,
      severity: "critical",
    });
  }

  if ((festivalInclusionRate ?? 0) < 40 && totalFestivalInclusions > 0) {
    insights.push({
      text: `Only ${festivalInclusionRate}% of children included in festival celebrations. Excluding the majority of children from multi-faith and cultural festivals limits their exposure to diversity and may leave some children's own faith traditions unacknowledged. This is a concern under SCCIF experiences and progress.`,
      severity: "critical",
    });
  }

  if (totalCulturalEvents === 0 && totalDiversityCelebrations === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No cultural events or diversity celebrations recorded. While heritage or festival data exists, the absence of direct cultural engagement records means the home cannot evidence that children participate in cultural experiences. Cultural enrichment must be documented to demonstrate compliance with Reg 5.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (meets(eventParticipationRate, 50) && below(eventParticipationRate, 70) && totalCulturalEvents > 0) {
    insights.push({
      text: `Cultural event participation at ${eventParticipationRate}% — improving but some children remain disengaged. Consider whether the cultural programme reflects the backgrounds and interests of all children in placement, not just the majority.`,
      severity: "warning",
    });
  }

  if ((diversityCelebrationRate ?? 0) >= 50 && (diversityCelebrationRate ?? 0) < 70 && totalDiversityCelebrations > 0) {
    insights.push({
      text: `Diversity celebration reach at ${diversityCelebrationRate}% — not all children are being included in diversity celebrations. Ensure celebration planning actively considers how to engage every child, including those who may be reluctant or unfamiliar with certain cultures.`,
      severity: "warning",
    });
  }

  if (meets(heritageAcknowledgementRate, 50) && below(heritageAcknowledgementRate, 70) && totalHeritageDays > 0) {
    insights.push({
      text: `Heritage acknowledgement at ${heritageAcknowledgementRate}% — some children's heritage is not being consistently recognised. Each missed heritage celebration is a missed opportunity to affirm a child's cultural identity and sense of belonging.`,
      severity: "warning",
    });
  }

  if ((festivalInclusionRate ?? 0) >= 40 && (festivalInclusionRate ?? 0) < 70 && totalFestivalInclusions > 0) {
    insights.push({
      text: `Festival inclusion at ${festivalInclusionRate}% — some children are not accessing festival celebrations. Review whether practical barriers (timing, understanding, interest) or cultural sensitivity concerns are preventing full participation.`,
      severity: "warning",
    });
  }

  if (meets(childSatisfactionRate, 40) && below(childSatisfactionRate, 70) && satisfactionDenominator > 0) {
    insights.push({
      text: `Child satisfaction at ${childSatisfactionRate}% — a notable proportion of children do not report positive cultural experiences. Children's subjective experience is the strongest indicator of whether cultural provision is genuinely meaningful or merely procedural.`,
      severity: "warning",
    });
  }

  if (uniqueFaithsRepresented <= 1 && totalFestivalInclusions > 0) {
    insights.push({
      text: `Only ${uniqueFaithsRepresented} faith tradition${uniqueFaithsRepresented === 1 ? "" : "s"} represented in the festival programme. A narrow faith focus limits children's understanding of the diverse society they will grow up in and may marginalise children from minority faith backgrounds.`,
      severity: "warning",
    });
  }

  if (avgCelebrationQuality > 0 && avgCelebrationQuality < 3.0 && totalDiversityCelebrations > 0) {
    insights.push({
      text: `Diversity celebration quality at ${avgCelebrationQuality}/5. Low-quality celebrations risk being tokenistic — quick, superficial acknowledgements rather than meaningful learning experiences. Quality celebrations include educational content, child involvement, community input, and genuine celebration.`,
      severity: "warning",
    });
  }

  if (childLedRate === 0 && total_children > 0) {
    insights.push({
      text: "No children have led cultural activities. When all cultural provision is adult-directed, children are positioned as passive recipients rather than active agents in their own cultural identity. Creating opportunities for child-led cultural expression is essential for empowerment and positive identity development.",
      severity: "warning",
    });
  }

  if (below(heritageChildInvolvementRate, 50) && totalHeritageDays > 0) {
    insights.push({
      text: `Children involved in planning only ${heritageChildInvolvementRate}% of heritage days. Heritage celebrations planned without the child's input may not reflect how they wish their culture to be acknowledged. This risks well-intentioned but misguided practice.`,
      severity: "warning",
    });
  }

  if (below(celebrationFeedbackRate, 50) && totalDiversityCelebrations > 0) {
    insights.push({
      text: `Feedback collected from only ${celebrationFeedbackRate}% of diversity celebrations. Without consistently gathering children's views, the home cannot evidence that its cultural provision is child-centred or demonstrate responsiveness to children's experiences.`,
      severity: "warning",
    });
  }

  if (below(heritageFamilyConnectionRate, 30) && totalHeritageDays > 0 && meets(heritageFamilyConnectionRate, 0)) {
    insights.push({
      text: `Family connection facilitated in only ${heritageFamilyConnectionRate}% of heritage celebrations. Where safe and appropriate, connecting heritage celebrations to family relationships reinforces children's sense of continuity, identity, and belonging.`,
      severity: "warning",
    });
  }

  // Analysis of celebration types
  const celebrationTypeCounts: Record<string, number> = {};
  for (const c of diversity_celebration_records) {
    celebrationTypeCounts[c.celebration_type] = (celebrationTypeCounts[c.celebration_type] ?? 0) + 1;
  }
  const topCelebrationTypes = Object.entries(celebrationTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  if (topCelebrationTypes.length >= 2 && totalDiversityCelebrations >= 3) {
    const typeStr = topCelebrationTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Diversity celebration profile: ${typeStr}. Consider whether the celebration mix reflects the full range of cultural identities within the home and the wider community.`,
      severity: "warning",
    });
  }

  // Analysis of child-led activity types
  const childLedTypeCounts: Record<string, number> = {};
  for (const a of child_led_activity_records) {
    childLedTypeCounts[a.activity_type] = (childLedTypeCounts[a.activity_type] ?? 0) + 1;
  }
  const topChildLedTypes = Object.entries(childLedTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topChildLedTypes.length >= 2 && totalChildLedActivities >= 3) {
    const typeStr = topChildLedTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Child-led activity types: ${typeStr}. A range of activity formats gives children multiple ways to express and share their cultural identity.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (cultural_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding cultural celebration and diversity practice — children's cultural identities are comprehensively assessed, heritage is actively celebrated, multi-faith festivals are inclusive, and children are empowered to lead cultural expression. This is strong evidence of identity-affirming, child-centred care under Reg 5 and SCCIF experiences and progress.",
      severity: "positive",
    });
  }

  if (
    meets(eventParticipationRate, 90) &&
    meets(childSatisfactionRate, 90) &&
    totalCulturalEvents > 0 &&
    satisfactionDenominator > 0
  ) {
    insights.push({
      text: `${eventParticipationRate}% participation with ${childSatisfactionRate}% satisfaction — children are not only attending cultural events but genuinely enjoying them. This convergence of participation and positive experience demonstrates that cultural provision is authentically meaningful.`,
      severity: "positive",
    });
  }

  if (
    meets(heritageAcknowledgementRate, 90) &&
    meets(heritageChildInvolvementRate, 70) &&
    totalHeritageDays > 0
  ) {
    insights.push({
      text: `${heritageAcknowledgementRate}% heritage acknowledgement with ${heritageChildInvolvementRate}% child involvement in planning — heritage celebrations are both comprehensive and child-led. Children's cultural identities are not just recognised but actively affirmed through participatory practice.`,
      severity: "positive",
    });
  }

  if (
    (festivalInclusionRate ?? 0) >= 90 &&
    uniqueFaithsRepresented >= 4 &&
    totalFestivalInclusions > 0
  ) {
    insights.push({
      text: `${festivalInclusionRate}% festival inclusion across ${uniqueFaithsRepresented} faith traditions — the home provides genuinely multi-faith cultural experiences that include all children. This demonstrates outstanding inclusive practice and prepares children for life in a diverse society.`,
      severity: "positive",
    });
  }

  if (
    (childLedRate ?? 0) >= 60 &&
    meets(confidenceImprovementRate, 70) &&
    totalChildLedActivities > 0
  ) {
    insights.push({
      text: `${childLedRate}% of children leading cultural activities with ${confidenceImprovementRate}% reporting confidence improvement — the home empowers children to be cultural leaders, building self-esteem and pride in their identity. This is exemplary Reg 7 practice.`,
      severity: "positive",
    });
  }

  if (
    (diversityCelebrationRate ?? 0) >= 90 &&
    avgCelebrationQuality >= 4.0 &&
    totalDiversityCelebrations > 0
  ) {
    insights.push({
      text: `${diversityCelebrationRate}% children reached by diversity celebrations averaging ${avgCelebrationQuality}/5 quality — the home delivers high-quality celebrations that are inclusive, well-planned, and genuinely enriching for all children.`,
      severity: "positive",
    });
  }

  if (
    externalCommunityEvents >= 3 &&
    meets(eventEnthusiasmRate, 70) &&
    totalCulturalEvents > 0
  ) {
    insights.push({
      text: `${externalCommunityEvents} events with external community involvement and ${eventEnthusiasmRate}% enthusiastic engagement — the home successfully connects children with the wider community through cultural activities, broadening their social networks and cultural exposure.`,
      severity: "positive",
    });
  }

  if (
    meets(heritageFamilyConnectionRate, 70) &&
    meets(heritageFeedbackPositiveRate, 80) &&
    totalHeritageDays > 0
  ) {
    insights.push({
      text: `${heritageFamilyConnectionRate}% of heritage celebrations facilitated family connections with ${heritageFeedbackPositiveRate}% positive child feedback — heritage celebrations are strengthening children's sense of identity and family continuity, creating deeply meaningful experiences.`,
      severity: "positive",
    });
  }

  if (
    meets(celebrationPlanningRate, 90) &&
    meets(childPlanningRate, 60) &&
    totalDiversityCelebrations > 0
  ) {
    insights.push({
      text: `${celebrationPlanningRate}% celebrations planned in advance with ${childPlanningRate}% child involvement in planning — the home takes a proactive, child-centred approach to cultural celebration, ensuring events are thoughtfully prepared and shaped by children's voices.`,
      severity: "positive",
    });
  }

  if (
    meets(peerParticipationRate, 70) &&
    meets(peerFeedbackPositiveRate, 70) &&
    totalChildLedActivities > 0
  ) {
    insights.push({
      text: `${peerParticipationRate}% peer participation in child-led activities with ${peerFeedbackPositiveRate}% positive peer feedback — children are learning from each other's cultures, building a home environment of mutual respect and cross-cultural understanding.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (cultural_rating === "outstanding") {
    headline =
      "Outstanding cultural events and celebrations — children's cultural identities are comprehensively celebrated, multi-faith festivals are inclusive, heritage is actively acknowledged, and children lead cultural expression.";
  } else if (cultural_rating === "good") {
    headline = `Good cultural events and celebrations — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (cultural_rating === "adequate") {
    headline = `Adequate cultural events and celebrations — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's cultural identities are fully respected and celebrated.`;
  } else {
    headline = `Cultural events and celebrations are inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's cultural identities are recognised, respected, and celebrated.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    cultural_rating,
    cultural_score: score,
    headline,
    total_cultural_events: totalCulturalEvents,
    total_diversity_celebrations: totalDiversityCelebrations,
    total_heritage_days: totalHeritageDays,
    total_festival_inclusions: totalFestivalInclusions,
    total_child_led_activities: totalChildLedActivities,
    event_participation_rate: eventParticipationRate,
    diversity_celebration_rate: diversityCelebrationRate,
    heritage_acknowledgement_rate: heritageAcknowledgementRate,
    festival_inclusion_rate: festivalInclusionRate,
    child_led_rate: childLedRate,
    child_satisfaction_rate: childSatisfactionRate,
    unique_event_types: uniqueEventTypes,
    unique_faiths_represented: uniqueFaithsRepresented,
    unique_heritage_types: uniqueHeritageTypes,
    children_with_heritage_acknowledged: childrenWithHeritage,
    children_leading_activities: childrenLeadingActivities,
    external_community_events: externalCommunityEvents,
    educational_component_count: educationalComponentCount,
    avg_celebration_quality: avgCelebrationQuality,
    avg_festival_quality: avgFestivalQuality,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
