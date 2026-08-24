// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME SENSORY & THERAPEUTIC ENVIRONMENT INTELLIGENCE ENGINE
// Tracks sensory room usage, equipment condition, physical activity participation,
// and therapeutic benefit to ensure children's sensory and wellbeing needs are met.
// Pure deterministic engine. CHR 2015 Reg 9/10.
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SensoryRoomUsageInput {
  id: string;
  child_id: string;
  date: string;
  duration_minutes: number;
  was_beneficial: boolean;
  staff_supported: boolean;
}

export interface SensoryEquipmentInput {
  id: string;
  item_name: string;
  condition: string;           // "good" | "fair" | "poor" | "broken"
  last_checked: string;
  in_use: boolean;
}

export interface PhysicalActivityInput {
  id: string;
  child_id: string;
  date: string;
  activity_type: string;       // "sport" | "swimming" | "cycling" | "walking" | "gym" | "dance" | "other"
  duration_minutes: number;
  child_enjoyed: boolean;
}

export interface SensoryTherapeuticInput {
  today: string;
  total_children: number;
  sensory_room_usage: SensoryRoomUsageInput[];
  sensory_equipment: SensoryEquipmentInput[];
  physical_activities: PhysicalActivityInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SensoryTherapeuticRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SensoryTherapeuticResult {
  sensory_rating: SensoryTherapeuticRating;
  sensory_score: number;
  headline: string;
  children_using_sensory_room: number;
  /** null when the population is empty — nothing measured, not 0%. */
  sensory_beneficial_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  equipment_condition_rate: number | null;
  children_physically_active: number;
  /** null when the population is empty — nothing measured, not 0%. */
  activity_enjoyment_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function toRating(score: number): SensoryTherapeuticRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Function ──────────────────────────────────────────────────────────

export function computeHomeSensoryTherapeuticEnvironment(
  input: SensoryTherapeuticInput,
): SensoryTherapeuticResult {
  const { total_children, sensory_room_usage, sensory_equipment, physical_activities } = input;

  // ── Insufficient data guard ────────────────────────────────────
  if (total_children === 0) {
    return {
      sensory_rating: "insufficient_data",
      sensory_score: 0,
      headline: "No children on roll — sensory and therapeutic environment cannot be assessed.",
      children_using_sensory_room: 0,
      sensory_beneficial_rate: null,
      equipment_condition_rate: null,
      children_physically_active: 0,
      activity_enjoyment_rate: null,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Compute metrics ────────────────────────────────────────────

  // Sensory room
  const childrenUsingSensory = new Set(sensory_room_usage.map(s => s.child_id)).size;
  const coverageRate = rate(childrenUsingSensory, total_children);
  const totalSessions = sensory_room_usage.length;
  const beneficialSessions = sensory_room_usage.filter(s => s.was_beneficial).length;
  const beneficialRate = rate(beneficialSessions, totalSessions);
  const staffSupportedSessions = sensory_room_usage.filter(s => s.staff_supported).length;
  const supportRate = rate(staffSupportedSessions, totalSessions);

  // Equipment
  const totalEquipment = sensory_equipment.length;
  const goodCondition = sensory_equipment.filter(e => e.condition === "good" || e.condition === "fair").length;
  const conditionRate = rate(goodCondition, totalEquipment);

  // Physical activity
  const activeChildren = new Set(physical_activities.map(a => a.child_id)).size;
  const activeRate = rate(activeChildren, total_children);
  const totalActivities = physical_activities.length;
  const enjoyedActivities = physical_activities.filter(a => a.child_enjoyed).length;
  const enjoyRate = rate(enjoyedActivities, totalActivities);

  // ── Scoring ────────────────────────────────────────────────────
  let score = 52;

  // Mod 1: Sensory room access (+-5)
  if (totalSessions === 0) {
    score += 0; // no sensory data — neutral
  } else if (meets(coverageRate, 70)) {
    score += 5;
  } else if (meets(coverageRate, 50)) {
    score += 3;
  } else if (meets(coverageRate, 30)) {
    score += 0;
  } else {
    score -= 5;
  }

  // Mod 2: Sensory room benefit (+-5)
  if (totalSessions === 0) {
    score += 0; // neutral
  } else if (meets(beneficialRate, 90)) {
    score += 5;
  } else if (meets(beneficialRate, 75)) {
    score += 3;
  } else if (meets(beneficialRate, 50)) {
    score += 0;
  } else {
    score -= 5;
  }

  // Mod 3: Equipment condition (+-5)
  if (totalEquipment === 0) {
    score -= 2; // no equipment
  } else if (meets(conditionRate, 90)) {
    score += 5;
  } else if (meets(conditionRate, 75)) {
    score += 3;
  } else if (meets(conditionRate, 50)) {
    score += 0;
  } else {
    score -= 5;
  }

  // Mod 4: Physical activity coverage (+-6)
  if (meets(activeRate, 80)) {
    score += 6;
  } else if (meets(activeRate, 60)) {
    score += 3;
  } else if (meets(activeRate, 40)) {
    score += 0;
  } else {
    score -= 6;
  }

  // Mod 5: Activity enjoyment (+-4)
  if (totalActivities === 0) {
    score += 0; // neutral
  } else if (meets(enjoyRate, 90)) {
    score += 4;
  } else if (meets(enjoyRate, 75)) {
    score += 2;
  } else if (meets(enjoyRate, 50)) {
    score += 0;
  } else {
    score -= 4;
  }

  // Mod 6: Staff support in sensory sessions (+-4)
  if (totalSessions === 0) {
    score += 0; // neutral
  } else if (meets(supportRate, 90)) {
    score += 4;
  } else if (meets(supportRate, 75)) {
    score += 2;
  } else if (meets(supportRate, 50)) {
    score += 0;
  } else {
    score -= 4;
  }

  score = Math.max(0, Math.min(score, 100));
  const rating = toRating(score);

  // ── Strengths ──────────────────────────────────────────────────
  const strengths: string[] = [];

  if (meets(coverageRate, 70) && totalSessions > 0) {
    strengths.push("Over 70% of children access sensory room — therapeutic environment well utilised.");
  }
  if (meets(beneficialRate, 90) && totalSessions > 0) {
    strengths.push("Over 90% of sensory sessions rated beneficial — targeted and effective.");
  }
  if (meets(conditionRate, 90) && totalEquipment > 0) {
    strengths.push("Sensory equipment in good condition — environment is well maintained.");
  }
  if (meets(activeRate, 80)) {
    strengths.push("Over 80% of children regularly physically active — wellbeing supported holistically.");
  }
  if (meets(enjoyRate, 90) && totalActivities > 0) {
    strengths.push("Over 90% of activities enjoyed by children — engagement is genuine.");
  }

  // ── Concerns ───────────────────────────────────────────────────
  const concerns: string[] = [];

  if (below(conditionRate, 50) && totalEquipment > 0) {
    concerns.push(`${formatRate(conditionRate)} of sensory equipment in poor condition — therapeutic environment compromised.`);
  }
  if (below(activeRate, 40)) {
    concerns.push("Under 40% of children physically active — health and wellbeing at risk.");
  }
  if (below(beneficialRate, 50) && totalSessions > 0) {
    concerns.push("Under 50% of sensory sessions beneficial — review sensory programmes.");
  }
  if (below(supportRate, 50) && totalSessions > 0) {
    concerns.push("Under 50% of sensory sessions staff-supported — children may not get full benefit.");
  }

  // ── Recommendations ────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 1;

  if (below(activeRate, 60)) {
    recommendations.push({ rank: rank++, recommendation: "Expand physical activity programme to ensure more children participate regularly.", urgency: "soon", regulatory_ref: "Reg 9" });
  }
  if (below(conditionRate, 70)) {
    recommendations.push({ rank: rank++, recommendation: "Audit and replace damaged sensory equipment to restore therapeutic environment quality.", urgency: "soon", regulatory_ref: "Reg 10" });
  }
  if (below(beneficialRate, 70) && totalSessions > 0) {
    recommendations.push({ rank: rank++, recommendation: "Review sensory intervention plans to improve session outcomes for children.", urgency: "soon", regulatory_ref: "Reg 10" });
  }
  if (score < 65) {
    recommendations.push({ rank: rank++, recommendation: "Develop therapeutic environment improvement plan addressing sensory and physical activity gaps.", urgency: "planned", regulatory_ref: "Reg 10" });
  }

  // ── Insights ───────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];

  if (rating === "outstanding") {
    insights.push({ text: "The therapeutic environment is outstanding — sensory provision, equipment quality, and physical activity all meet the highest standards. Children's wellbeing needs are comprehensively supported.", severity: "positive" });
  }
  if (rating === "inadequate") {
    insights.push({ text: "The therapeutic environment is inadequate — children's sensory and physical activity needs are not being met. Urgent review required under Regulation 9 and 10.", severity: "critical" });
  }
  if (meets(beneficialRate, 85) && meets(supportRate, 85) && totalSessions > 0) {
    insights.push({ text: "Staff-supported therapeutic practice is strong — high beneficial rates combined with consistent staff support demonstrate effective sensory interventions.", severity: "positive" });
  }
  if (below(conditionRate, 50) && totalSessions >= 5) {
    insights.push({ text: "Sensory equipment is degraded while sessions continue — children may be using substandard therapeutic resources, reducing intervention effectiveness.", severity: "warning" });
  }

  // ── Headline ───────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = "Outstanding therapeutic environment — sensory and physical activity provision is comprehensive.";
  } else if (rating === "good") {
    headline = concerns.length > 0
      ? `Good therapeutic environment — ${concerns.length} area(s) to address.`
      : "Good therapeutic environment — children well supported.";
  } else if (rating === "adequate") {
    headline = below(activeRate, 60)
      ? "Adequate therapeutic provision — gaps in physical activity need addressing."
      : "Adequate therapeutic provision — gaps in sensory support need addressing.";
  } else {
    headline = "Therapeutic environment inadequate — children's sensory and physical needs are not met.";
  }

  return {
    sensory_rating: rating,
    sensory_score: score,
    headline,
    children_using_sensory_room: childrenUsingSensory,
    sensory_beneficial_rate: beneficialRate,
    equipment_condition_rate: conditionRate,
    children_physically_active: activeChildren,
    activity_enjoyment_rate: enjoyRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
