// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME BELONGING & PERSONAL PROPERTY INTELLIGENCE ENGINE
// Tracks children's belongings, clothing provision, haircare, gifts, and property
// respect to ensure children are valued and their personal identity supported.
// Pure deterministic engine. CHR 2015 Reg 7/9/10.
// ══════════════════════════════════════════════════════════════════════════════

export interface BelongingsInput {
  child_id: string;
  inventory_up_to_date: boolean;
  items_lost_or_damaged: number;
  items_replaced: number;
}

export interface ClothingTripInput {
  id: string;
  child_id: string;
  date: string;
  child_chose: boolean;  // child had agency in choices
  budget_adequate: boolean;
}

export interface HairAppointmentInput {
  id: string;
  child_id: string;
  date: string;
  child_preference_met: boolean;
  cultural_needs_met: boolean;
}

export interface GiftRecordInput {
  id: string;
  child_id: string;
  date: string;
  occasion: string;   // "birthday" | "christmas" | "achievement" | "other"
  age_appropriate: boolean;
  child_involved_in_choice: boolean;
}

export interface BelongingPropertyInput {
  today: string;
  total_children: number;
  belongings: BelongingsInput[];
  clothing_trips: ClothingTripInput[];
  hair_appointments: HairAppointmentInput[];
  gifts: GiftRecordInput[];
}

export type BelongingPropertyRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface BelongingPropertyResult {
  belonging_rating: BelongingPropertyRating;
  belonging_score: number;
  headline: string;
  children_with_inventory: number;
  clothing_choice_rate: number;
  hair_cultural_rate: number;
  gift_personalisation_rate: number;
  property_loss_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function pct(n: number, d: number): number { return d === 0 ? 0 : Math.round((n / d) * 100); }

export function computeBelongingPersonalProperty(input: BelongingPropertyInput): BelongingPropertyResult {
  const { today, total_children, belongings, clothing_trips, hair_appointments, gifts } = input;

  if (total_children === 0) {
    return {
      belonging_rating: "insufficient_data", belonging_score: 0,
      headline: "No children in placement — belonging & personal property cannot be assessed.",
      children_with_inventory: 0, clothing_choice_rate: 0, hair_cultural_rate: 0,
      gift_personalisation_rate: 0, property_loss_rate: 0,
      strengths: [], concerns: [], recommendations: [], insights: [],
    };
  }

  // ── Belongings inventory ────────────────────────────────────────────────
  const withInventory = belongings.filter(b => b.inventory_up_to_date).length;
  const inventoryRate = pct(withInventory, total_children);
  const totalLost = belongings.reduce((s, b) => s + b.items_lost_or_damaged, 0);
  const totalReplaced = belongings.reduce((s, b) => s + b.items_replaced, 0);
  const replaceRate = pct(totalReplaced, totalLost);
  const lossRate = total_children > 0 ? totalLost / total_children : 0;

  // ── Clothing ────────────────────────────────────────────────────────────
  const childrenWithTrips = new Set(clothing_trips.map(c => c.child_id)).size;
  const clothingCoverageRate = pct(childrenWithTrips, total_children);
  const choiceTrips = clothing_trips.filter(c => c.child_chose).length;
  const clothingChoiceRate = pct(choiceTrips, clothing_trips.length);

  // ── Hair ────────────────────────────────────────────────────────────────
  const culturalMet = hair_appointments.filter(h => h.cultural_needs_met).length;
  const hairCulturalRate = pct(culturalMet, hair_appointments.length);
  const prefMet = hair_appointments.filter(h => h.child_preference_met).length;
  const hairPrefRate = pct(prefMet, hair_appointments.length);

  // ── Gifts ───────────────────────────────────────────────────────────────
  const personalised = gifts.filter(g => g.child_involved_in_choice && g.age_appropriate).length;
  const giftPersonalisationRate = pct(personalised, gifts.length);

  // ── Scoring ─────────────────────────────────────────────────────────────
  let score = 52; // base

  // Mod 1: Inventory completeness (±5)
  if (inventoryRate >= 95) score += 5;
  else if (inventoryRate >= 80) score += 3;
  else if (inventoryRate >= 60) score += 0;
  else score -= 5;

  // Mod 2: Property replacement (±4)
  if (totalLost === 0) score += 4;
  else if (replaceRate >= 90) score += 3;
  else if (replaceRate >= 70) score += 1;
  else score -= 4;

  // Mod 3: Clothing provision & choice (±5)
  if (clothing_trips.length === 0 && total_children > 0) score -= 3;
  else if (clothingCoverageRate >= 90 && clothingChoiceRate >= 90) score += 5;
  else if (clothingCoverageRate >= 70 && clothingChoiceRate >= 70) score += 3;
  else if (clothingCoverageRate >= 50) score += 0;
  else score -= 5;

  // Mod 4: Hair & cultural identity (±5)
  if (hair_appointments.length === 0) score += 0; // neutral
  else if (hairCulturalRate >= 90 && hairPrefRate >= 90) score += 5;
  else if (hairCulturalRate >= 70 && hairPrefRate >= 70) score += 3;
  else if (hairCulturalRate >= 50) score += 1;
  else score -= 5;

  // Mod 5: Gift personalisation (±4)
  if (gifts.length === 0) score += 0; // neutral
  else if (giftPersonalisationRate >= 90) score += 4;
  else if (giftPersonalisationRate >= 70) score += 2;
  else if (giftPersonalisationRate >= 50) score += 0;
  else score -= 4;

  // Mod 6: Coverage across all domains (±5)
  const domainsActive = [clothing_trips.length > 0, hair_appointments.length > 0, gifts.length > 0, belongings.length > 0].filter(Boolean).length;
  if (domainsActive >= 4) score += 5;
  else if (domainsActive >= 3) score += 3;
  else if (domainsActive >= 2) score += 1;
  else score -= 5;

  score = Math.max(0, Math.min(score, 100));

  const belonging_rating: BelongingPropertyRating =
    score >= 80 ? "outstanding" : score >= 65 ? "good" : score >= 45 ? "adequate" : "inadequate";

  // ── Strengths ───────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (inventoryRate >= 95) strengths.push("Belongings inventories are up to date for all children — property is respected and tracked.");
  if (clothingChoiceRate >= 90 && clothing_trips.length > 0) strengths.push("Over 90% of clothing trips involve child choice — children exercise agency in their appearance.");
  if (hairCulturalRate >= 90 && hair_appointments.length > 0) strengths.push("Cultural hair care needs met for over 90% of appointments — identity-affirming practice.");
  if (giftPersonalisationRate >= 90 && gifts.length > 0) strengths.push("Gifts are personalised and age-appropriate — children feel individually valued.");
  if (totalLost === 0 && belongings.length > 0) strengths.push("Zero belongings lost or damaged — excellent property stewardship.");

  // ── Concerns ────────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (inventoryRate < 60) concerns.push(`Only ${inventoryRate}% of children have up-to-date belongings inventories — property may be lost during placements.`);
  if (clothingCoverageRate < 60 && total_children > 0) concerns.push(`Only ${clothingCoverageRate}% of children have had clothing shopping trips — children may not have adequate clothing.`);
  if (hairCulturalRate < 50 && hair_appointments.length > 0) concerns.push(`Cultural hair care needs unmet in ${100 - hairCulturalRate}% of appointments — identity needs neglected.`);
  if (lossRate >= 3) concerns.push(`Average ${lossRate.toFixed(1)} items lost/damaged per child — property stewardship is poor.`);
  if (totalLost > 0 && replaceRate < 50) concerns.push(`Only ${replaceRate}% of lost/damaged belongings replaced — children's property not being restored.`);

  // ── Recommendations ─────────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 0;
  if (inventoryRate < 70) recommendations.push({ rank: ++rank, recommendation: "Complete belongings inventories for all children — essential for placement moves and care planning.", urgency: "soon", regulatory_ref: "Reg 9" });
  if (clothingCoverageRate < 70 && total_children > 0) recommendations.push({ rank: ++rank, recommendation: "Arrange clothing shopping trips for all children with individual budgets.", urgency: "soon", regulatory_ref: "Reg 7" });
  if (hairCulturalRate < 70 && hair_appointments.length > 0) recommendations.push({ rank: ++rank, recommendation: "Ensure hair care appointments meet cultural needs — consult children and families.", urgency: "soon", regulatory_ref: "Reg 10" });
  if (totalLost > 0 && replaceRate < 70) recommendations.push({ rank: ++rank, recommendation: "Replace lost/damaged belongings promptly — children should not bear the loss.", urgency: "soon", regulatory_ref: "Reg 9" });
  if (score < 65) recommendations.push({ rank: ++rank, recommendation: "Develop a belonging and personal property policy ensuring children's possessions are valued.", urgency: "planned", regulatory_ref: "Reg 7" });

  // ── Insights ────────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];
  if (belonging_rating === "outstanding") insights.push({ text: "Children's belonging and property care is outstanding — children feel valued, their identity is supported through personal choices.", severity: "positive" });
  if (belonging_rating === "inadequate") insights.push({ text: "Belonging and property care is inadequate — children's personal identity and material needs are not being met.", severity: "critical" });
  if (clothingChoiceRate >= 80 && hairPrefRate >= 80) insights.push({ text: "Strong child agency across clothing and hair choices — children's individuality is genuinely respected.", severity: "positive" });
  if (hairCulturalRate < 50 && hair_appointments.length >= 3) insights.push({ text: "Poor cultural sensitivity in hair care suggests staff may need training in culturally competent care.", severity: "warning" });

  // ── Headline ────────────────────────────────────────────────────────────
  let headline = "";
  if (belonging_rating === "outstanding") headline = `Outstanding belonging & property care — children's identity and possessions are respected and valued.`;
  else if (belonging_rating === "good") headline = `Good belonging & property care — ${concerns.length > 0 ? `${concerns.length} area(s) to address` : "children are well-supported"}.`;
  else if (belonging_rating === "adequate") headline = `Adequate belonging & property care — gaps in ${domainsActive < 3 ? "coverage" : "quality"} need addressing.`;
  else headline = `Belonging & property care inadequate — children's material and identity needs are not being met.`;

  return {
    belonging_rating, belonging_score: score, headline,
    children_with_inventory: withInventory,
    clothing_choice_rate: clothingChoiceRate,
    hair_cultural_rate: hairCulturalRate,
    gift_personalisation_rate: giftPersonalisationRate,
    property_loss_rate: Math.round(lossRate * 10) / 10,
    strengths, concerns, recommendations, insights,
  };
}
