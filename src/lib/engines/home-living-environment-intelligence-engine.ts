// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME LIVING ENVIRONMENT INTELLIGENCE ENGINE
// Home-level: aggregates bedroom personalisation, pet care, garden plots,
// outdoor activity safety, environmental risks, and child voice.
// CHR 2015 Reg 15: "Living environment — accommodation and furnishing."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface BedroomProfileInput {
  id: string;
  child_id: string;
  child_choose_colours: boolean;
  furniture_chosen_by_child: boolean;
  child_authored: boolean;
  child_satisfaction_rating: number; // 1-5
  meaningful_items_count: number;
  personal_artwork_count: number;
  photos_displayed_count: number;
  sensory_accommodations_count: number;
  review_date: string;
}

export interface PetRecordInput {
  id: string;
  vaccinations_up_to_date: boolean;
  insurance: boolean;
  children_involved_in_care_count: number;
  therapeutic_value: string;
  risk_assessment_date: string;
}

export interface GardenPlotInput {
  id: string;
  contributing_children_count: number;
  hours_this_month: number;
  sensory_benefits_count: number;
  child_voice: string;
  review_date: string;
}

export interface OutdoorActivityInput {
  id: string;
  signed_off_by_rm: boolean;
  permissions_obtained: boolean;
  emergency_procedures_count: number;
  child_specific_considerations_count: number;
}

export interface EnvironmentalRiskInput {
  id: string;
  risk_level: string;   // "low" | "medium" | "high" | "critical"
  status: string;       // "open" | "mitigated" | "closed" | "monitoring"
  review_date: string;
}

export interface HomeLivingEnvironmentInput {
  today: string;
  bedroom_profiles: BedroomProfileInput[];
  pet_records: PetRecordInput[];
  garden_plots: GardenPlotInput[];
  outdoor_activities: OutdoorActivityInput[];
  environmental_risks: EnvironmentalRiskInput[];
  total_children: number;
}

// ── Output types ────────────────────────────────────────────────────────────

export type LivingEnvironmentRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface BedroomProfile {
  total_profiles: number;
  child_coverage: number;
  avg_satisfaction: number;
  child_choose_colours_rate: number;
  furniture_chosen_rate: number;
  child_authored_rate: number;
  meaningful_items_rate: number;
  artwork_photos_rate: number;
  sensory_accommodations_rate: number;
  overdue_reviews: number;
}

export interface PetCareProfile {
  total_pets: number;
  vaccination_rate: number;
  insurance_rate: number;
  children_involved_avg: number;
  therapeutic_value_rate: number;
  risk_assessment_overdue: number;
}

export interface GardenProfile {
  total_plots: number;
  avg_contributing_children: number;
  avg_hours: number;
  sensory_benefits_rate: number;
  child_voice_rate: number;
  overdue_reviews: number;
}

export interface OutdoorActivityProfile {
  total_activities: number;
  rm_sign_off_rate: number;
  permissions_rate: number;
  emergency_procedures_rate: number;
  child_considerations_rate: number;
}

export interface EnvironmentalRiskProfile {
  total_risks: number;
  open_count: number;
  critical_count: number;
  mitigated_rate: number;
  overdue_reviews: number;
}

export interface HomeLivingEnvironmentResult {
  living_environment_rating: LivingEnvironmentRating;
  living_environment_score: number;
  headline: string;
  bedrooms: BedroomProfile;
  pets: PetCareProfile;
  gardens: GardenProfile;
  outdoor_activities: OutdoorActivityProfile;
  environmental_risks: EnvironmentalRiskProfile;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeLivingEnvironment(
  input: HomeLivingEnvironmentInput,
): HomeLivingEnvironmentResult {
  const {
    today, bedroom_profiles, pet_records, garden_plots,
    outdoor_activities, environmental_risks, total_children,
  } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (
    total_children === 0 &&
    bedroom_profiles.length === 0 &&
    pet_records.length === 0 &&
    garden_plots.length === 0 &&
    outdoor_activities.length === 0 &&
    environmental_risks.length === 0
  ) {
    return {
      living_environment_rating: "insufficient_data",
      living_environment_score: 0,
      headline: "No living environment data available for analysis.",
      bedrooms: { total_profiles: 0, child_coverage: 0, avg_satisfaction: 0, child_choose_colours_rate: 0, furniture_chosen_rate: 0, child_authored_rate: 0, meaningful_items_rate: 0, artwork_photos_rate: 0, sensory_accommodations_rate: 0, overdue_reviews: 0 },
      pets: { total_pets: 0, vaccination_rate: 0, insurance_rate: 0, children_involved_avg: 0, therapeutic_value_rate: 0, risk_assessment_overdue: 0 },
      gardens: { total_plots: 0, avg_contributing_children: 0, avg_hours: 0, sensory_benefits_rate: 0, child_voice_rate: 0, overdue_reviews: 0 },
      outdoor_activities: { total_activities: 0, rm_sign_off_rate: 0, permissions_rate: 0, emergency_procedures_rate: 0, child_considerations_rate: 0 },
      environmental_risks: { total_risks: 0, open_count: 0, critical_count: 0, mitigated_rate: 0, overdue_reviews: 0 },
      strengths: [],
      concerns: ["No living environment data — bedroom personalisation, safety, and outdoor engagement cannot be assessed."],
      recommendations: [],
      insights: [],
    };
  }

  // ── Bedroom Profiles ─────────────────────────────────────────────────
  const uniqueBedroomChildren = new Set(bedroom_profiles.map(b => b.child_id));
  const bedroomCoverage = pct(uniqueBedroomChildren.size, total_children);

  const avgSatisfaction = bedroom_profiles.length > 0
    ? Math.round((bedroom_profiles.reduce((s, b) => s + b.child_satisfaction_rating, 0) / bedroom_profiles.length) * 10) / 10
    : 0;
  const chooseColoursRate = pct(
    bedroom_profiles.filter(b => b.child_choose_colours).length,
    bedroom_profiles.length,
  );
  const furnitureChosenRate = pct(
    bedroom_profiles.filter(b => b.furniture_chosen_by_child).length,
    bedroom_profiles.length,
  );
  const childAuthoredRate = pct(
    bedroom_profiles.filter(b => b.child_authored).length,
    bedroom_profiles.length,
  );
  const meaningfulItemsRate = pct(
    bedroom_profiles.filter(b => b.meaningful_items_count > 0).length,
    bedroom_profiles.length,
  );
  const artworkPhotosRate = pct(
    bedroom_profiles.filter(b => b.personal_artwork_count > 0 || b.photos_displayed_count > 0).length,
    bedroom_profiles.length,
  );
  const sensoryAccommodationsRate = pct(
    bedroom_profiles.filter(b => b.sensory_accommodations_count > 0).length,
    bedroom_profiles.length,
  );
  const overdueBedroomReviews = bedroom_profiles.filter(b =>
    daysBetween(b.review_date, today) > 0,
  ).length;

  const bedroomProfile: BedroomProfile = {
    total_profiles: bedroom_profiles.length,
    child_coverage: bedroomCoverage,
    avg_satisfaction: avgSatisfaction,
    child_choose_colours_rate: chooseColoursRate,
    furniture_chosen_rate: furnitureChosenRate,
    child_authored_rate: childAuthoredRate,
    meaningful_items_rate: meaningfulItemsRate,
    artwork_photos_rate: artworkPhotosRate,
    sensory_accommodations_rate: sensoryAccommodationsRate,
    overdue_reviews: overdueBedroomReviews,
  };

  // ── Pet Records ──────────────────────────────────────────────────────
  const vaccinationRate = pct(
    pet_records.filter(p => p.vaccinations_up_to_date).length,
    pet_records.length,
  );
  const insuranceRate = pct(
    pet_records.filter(p => p.insurance).length,
    pet_records.length,
  );
  const childrenInvolvedAvg = pet_records.length > 0
    ? Math.round((pet_records.reduce((s, p) => s + p.children_involved_in_care_count, 0) / pet_records.length) * 10) / 10
    : 0;
  const therapeuticValueRate = pct(
    pet_records.filter(p => p.therapeutic_value.trim().length > 0).length,
    pet_records.length,
  );
  const riskAssessmentOverdue = pet_records.filter(p =>
    daysBetween(p.risk_assessment_date, today) > 180,
  ).length;

  const petProfile: PetCareProfile = {
    total_pets: pet_records.length,
    vaccination_rate: vaccinationRate,
    insurance_rate: insuranceRate,
    children_involved_avg: childrenInvolvedAvg,
    therapeutic_value_rate: therapeuticValueRate,
    risk_assessment_overdue: riskAssessmentOverdue,
  };

  // ── Garden Plots ─────────────────────────────────────────────────────
  const avgContributingChildren = garden_plots.length > 0
    ? Math.round((garden_plots.reduce((s, g) => s + g.contributing_children_count, 0) / garden_plots.length) * 10) / 10
    : 0;
  const avgGardenHours = garden_plots.length > 0
    ? Math.round((garden_plots.reduce((s, g) => s + g.hours_this_month, 0) / garden_plots.length) * 10) / 10
    : 0;
  const sensoryBenefitsRate = pct(
    garden_plots.filter(g => g.sensory_benefits_count > 0).length,
    garden_plots.length,
  );
  const gardenChildVoiceRate = pct(
    garden_plots.filter(g => g.child_voice.trim().length > 0).length,
    garden_plots.length,
  );
  const overdueGardenReviews = garden_plots.filter(g =>
    daysBetween(g.review_date, today) > 0,
  ).length;

  const gardenProfile: GardenProfile = {
    total_plots: garden_plots.length,
    avg_contributing_children: avgContributingChildren,
    avg_hours: avgGardenHours,
    sensory_benefits_rate: sensoryBenefitsRate,
    child_voice_rate: gardenChildVoiceRate,
    overdue_reviews: overdueGardenReviews,
  };

  // ── Outdoor Activities ───────────────────────────────────────────────
  const rmSignOffRate = pct(
    outdoor_activities.filter(o => o.signed_off_by_rm).length,
    outdoor_activities.length,
  );
  const permissionsRate = pct(
    outdoor_activities.filter(o => o.permissions_obtained).length,
    outdoor_activities.length,
  );
  const emergencyProceduresRate = pct(
    outdoor_activities.filter(o => o.emergency_procedures_count > 0).length,
    outdoor_activities.length,
  );
  const childConsiderationsRate = pct(
    outdoor_activities.filter(o => o.child_specific_considerations_count > 0).length,
    outdoor_activities.length,
  );

  const outdoorProfile: OutdoorActivityProfile = {
    total_activities: outdoor_activities.length,
    rm_sign_off_rate: rmSignOffRate,
    permissions_rate: permissionsRate,
    emergency_procedures_rate: emergencyProceduresRate,
    child_considerations_rate: childConsiderationsRate,
  };

  // ── Environmental Risks ──────────────────────────────────────────────
  const openRisks = environmental_risks.filter(e => e.status === "open");
  const criticalRisks = environmental_risks.filter(e => e.risk_level === "critical");
  const mitigatedOrClosed = environmental_risks.filter(e => e.status === "mitigated" || e.status === "closed");
  const mitigatedRate = pct(mitigatedOrClosed.length, environmental_risks.length);
  const overdueEnvReviews = environmental_risks.filter(e =>
    daysBetween(e.review_date, today) > 0,
  ).length;

  const envRiskProfile: EnvironmentalRiskProfile = {
    total_risks: environmental_risks.length,
    open_count: openRisks.length,
    critical_count: criticalRisks.length,
    mitigated_rate: mitigatedRate,
    overdue_reviews: overdueEnvReviews,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52 + max bonuses 28 = 80
  let score = 52;

  // mod1: Bedroom Personalisation & Satisfaction (±5)
  if (bedroom_profiles.length === 0) {
    score += (total_children === 0 ? 0 : -5);
  } else {
    const satisfactionGood = avgSatisfaction >= 4.0;
    const coloursGood = chooseColoursRate >= 80;
    const furnitureGood = furnitureChosenRate >= 70;
    const authoredGood = childAuthoredRate >= 70;
    const meaningfulGood = meaningfulItemsRate >= 80;
    const positives = [satisfactionGood, coloursGood, furnitureGood, authoredGood, meaningfulGood].filter(Boolean).length;

    if (positives >= 5) score += 5;
    else if (positives >= 3) score += 3;
    else if (positives >= 1) score += 0;
    else score -= 5;
  }

  // mod2: Bedroom Coverage & Quality (±4)
  if (bedroom_profiles.length === 0 && total_children === 0) {
    score += 0;
  } else if (bedroom_profiles.length === 0 && total_children > 0) {
    score -= 4;
  } else {
    const coverageGood = bedroomCoverage >= 90;
    const reviewsOk = overdueBedroomReviews === 0;
    const artworkGood = artworkPhotosRate >= 80;
    const sensoryGood = sensoryAccommodationsRate >= 50;
    const qualityPositives = [coverageGood, reviewsOk, artworkGood, sensoryGood].filter(Boolean).length;

    if (qualityPositives >= 4) score += 4;
    else if (qualityPositives >= 2) score += 2;
    else if (qualityPositives >= 1) score += 0;
    else score -= 4;
  }

  // mod3: Pet Care & Therapeutic Value (±3) — neutral if no pets
  if (pet_records.length === 0) {
    score += 0;
  } else {
    const vacGood = vaccinationRate >= 100;
    const insGood = insuranceRate >= 100;
    const involvedGood = childrenInvolvedAvg >= 2;
    const therapGood = therapeuticValueRate >= 80;
    const raOk = riskAssessmentOverdue === 0;
    const petPositives = [vacGood, insGood, involvedGood, therapGood, raOk].filter(Boolean).length;

    if (petPositives >= 4) score += 3;
    else if (petPositives >= 2) score += 1;
    else if (petPositives >= 1) score += 0;
    else score -= 3;
  }

  // mod4: Garden & Outdoor Engagement (±3) — neutral if no garden plots
  if (garden_plots.length === 0) {
    score += 0;
  } else {
    const participationGood = avgContributingChildren >= 2;
    const hoursGood = avgGardenHours >= 4;
    const sensoryGood = sensoryBenefitsRate >= 80;
    const voiceGood = gardenChildVoiceRate >= 80;
    const gardenPositives = [participationGood, hoursGood, sensoryGood, voiceGood].filter(Boolean).length;

    if (gardenPositives >= 4) score += 3;
    else if (gardenPositives >= 2) score += 1;
    else if (gardenPositives >= 1) score += 0;
    else score -= 3;
  }

  // mod5: Outdoor Activity Safety (±4)
  if (outdoor_activities.length === 0) {
    score += 0;
  } else {
    const rmGood = rmSignOffRate >= 100;
    const permGood = permissionsRate >= 100;
    const emergGood = emergencyProceduresRate >= 90;
    const considGood = childConsiderationsRate >= 90;
    const safetyPositives = [rmGood, permGood, emergGood, considGood].filter(Boolean).length;

    if (safetyPositives >= 4) score += 4;
    else if (safetyPositives >= 2) score += 2;
    else if (safetyPositives >= 1) score += 0;
    else score -= 4;
  }

  // mod6: Environmental Risk Management (±3)
  if (environmental_risks.length === 0) {
    score += 0;
  } else {
    const noCriticalOpen = criticalRisks.filter(r => r.status === "open").length === 0;
    const lowOpenCount = openRisks.length <= 1;
    const goodMitigatedRate = mitigatedRate >= 70;
    const reviewsOk = overdueEnvReviews === 0;
    const riskPositives = [noCriticalOpen, lowOpenCount, goodMitigatedRate, reviewsOk].filter(Boolean).length;

    if (riskPositives >= 4) score += 3;
    else if (riskPositives >= 2) score += 1;
    else if (riskPositives >= 1) score += 0;
    else score -= 3;
  }

  // mod7: Child Voice Across Environment (±3)
  {
    const bedroomVoice = bedroom_profiles.length > 0 ? childAuthoredRate >= 70 : false;
    const gardenVoice = garden_plots.length > 0 ? gardenChildVoiceRate >= 80 : false;
    const satisfactionVoice = bedroom_profiles.length > 0 ? avgSatisfaction >= 4.0 : false;
    const voiceDataSources = [bedroom_profiles.length > 0, garden_plots.length > 0].filter(Boolean).length;

    if (voiceDataSources === 0) {
      score += (total_children === 0 ? 0 : -3);
    } else {
      const voicePositives = [bedroomVoice, gardenVoice, satisfactionVoice].filter(Boolean).length;
      if (voicePositives >= 3) score += 3;
      else if (voicePositives >= 2) score += 2;
      else if (voicePositives >= 1) score += 0;
      else score -= 3;
    }
  }

  // mod8: Review Compliance (±3)
  {
    const totalOverdue = overdueBedroomReviews + overdueGardenReviews + overdueEnvReviews;
    const totalReviewable = bedroom_profiles.length + garden_plots.length + environmental_risks.length;

    if (totalReviewable === 0) {
      score += 0;
    } else {
      const overdueRate = pct(totalOverdue, totalReviewable);
      if (overdueRate === 0) score += 3;
      else if (overdueRate <= 10) score += 1;
      else if (overdueRate <= 30) score += 0;
      else score -= 3;
    }
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // ── Rating ────────────────────────────────────────────────────────────
  let living_environment_rating: LivingEnvironmentRating;
  if (score >= 80) living_environment_rating = "outstanding";
  else if (score >= 65) living_environment_rating = "good";
  else if (score >= 45) living_environment_rating = "adequate";
  else living_environment_rating = "inadequate";

  // ── Strengths / Concerns / Recommendations / Insights ─────────────────
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  const insights: { text: string; severity: string }[] = [];
  let rank = 0;

  // Strengths
  if (avgSatisfaction >= 4.0 && bedroom_profiles.length > 0) strengths.push(`Average bedroom satisfaction ${avgSatisfaction}/5 — children feel ownership of their spaces.`);
  if (chooseColoursRate >= 80 && bedroom_profiles.length > 0) strengths.push(`${chooseColoursRate}% of children chose their bedroom colours — personalisation is prioritised.`);
  if (bedroomCoverage >= 90 && bedroom_profiles.length > 0) strengths.push(`${bedroomCoverage}% bedroom profile coverage — every child's living space is documented.`);
  if (vaccinationRate >= 100 && pet_records.length > 0) strengths.push("All pets fully vaccinated and compliant — animal welfare standards are high.");
  if (rmSignOffRate >= 100 && outdoor_activities.length > 0) strengths.push(`100% RM sign-off on outdoor activities — robust oversight of external engagement.`);
  if (mitigatedRate >= 80 && environmental_risks.length > 0) strengths.push(`${mitigatedRate}% of environmental risks mitigated or closed — proactive risk management.`);
  if (gardenChildVoiceRate >= 80 && garden_plots.length > 0) strengths.push(`${gardenChildVoiceRate}% of garden plots capture child voice — enrichment reflects children's views.`);

  // Concerns
  if (bedroomCoverage < 50 && total_children > 0 && bedroom_profiles.length > 0) concerns.push(`Only ${bedroomCoverage}% of children have bedroom profiles — Reg 15 requires documented living arrangements.`);
  if (bedroom_profiles.length === 0 && total_children > 0) concerns.push("No bedroom profiles — children's living spaces are not documented.");
  if (avgSatisfaction < 3.0 && bedroom_profiles.length > 0) concerns.push(`Average bedroom satisfaction only ${avgSatisfaction}/5 — children may not feel at home.`);
  if (criticalRisks.filter(r => r.status === "open").length > 0) concerns.push(`${criticalRisks.filter(r => r.status === "open").length} critical environmental risk${criticalRisks.filter(r => r.status === "open").length !== 1 ? "s" : ""} remain open — immediate action required.`);
  if (openRisks.length >= 3) concerns.push(`${openRisks.length} open environmental risks — risk management needs attention.`);
  if (rmSignOffRate < 80 && outdoor_activities.length > 0) concerns.push(`Only ${rmSignOffRate}% of outdoor activities signed off by RM — governance gap.`);
  if (overdueBedroomReviews >= 2) concerns.push(`${overdueBedroomReviews} overdue bedroom profile reviews — children's changing preferences may not be reflected.`);
  if (riskAssessmentOverdue > 0 && pet_records.length > 0) concerns.push(`${riskAssessmentOverdue} pet risk assessment${riskAssessmentOverdue !== 1 ? "s" : ""} overdue — animal safety needs review.`);

  // Recommendations
  if (bedroom_profiles.length === 0 && total_children > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Create bedroom profiles for all children — document their personalisation, comfort items, and satisfaction.", urgency: "immediate", regulatory_ref: "Reg 15" });
  }
  if (bedroomCoverage < 70 && bedroom_profiles.length > 0 && total_children > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Extend bedroom profiles to cover all children — each child's living space should be individually documented.", urgency: "soon", regulatory_ref: "Reg 15" });
  }
  if (criticalRisks.filter(r => r.status === "open").length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Address open critical environmental risks immediately — these pose a direct safety threat to children and staff.", urgency: "immediate", regulatory_ref: "Reg 15" });
  }
  if (rmSignOffRate < 100 && outdoor_activities.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Ensure all outdoor activities receive RM sign-off before proceeding — this is essential for child safety governance.", urgency: "soon", regulatory_ref: "Reg 15" });
  }
  if (chooseColoursRate < 50 && bedroom_profiles.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Involve more children in choosing their bedroom colours and furnishings — personalisation supports belonging.", urgency: "planned", regulatory_ref: "Reg 15" });
  }
  if (overdueBedroomReviews + overdueGardenReviews + overdueEnvReviews >= 3) {
    recommendations.push({ rank: ++rank, recommendation: "Clear the backlog of overdue reviews across bedrooms, gardens, and environmental risks.", urgency: "soon", regulatory_ref: "Reg 15" });
  }

  // ARIA Insights
  if (avgSatisfaction >= 4.5 && chooseColoursRate >= 90 && childAuthoredRate >= 80 && bedroomCoverage >= 90) {
    insights.push({ text: "Bedroom personalisation is exemplary. Children are actively shaping their living spaces with high satisfaction — this demonstrates truly child-centred care under Reg 15.", severity: "positive" });
  }
  if (criticalRisks.filter(r => r.status === "open").length >= 2) {
    insights.push({ text: `${criticalRisks.filter(r => r.status === "open").length} critical environmental risks remain open. This represents a serious safety concern that would be flagged during inspection.`, severity: "critical" });
  }
  if (pet_records.length > 0 && vaccinationRate >= 100 && therapeuticValueRate >= 80 && childrenInvolvedAvg >= 2) {
    insights.push({ text: "Pet care is well-managed with strong therapeutic value and child involvement — animals are being used effectively to support children's wellbeing.", severity: "positive" });
  }
  if (garden_plots.length > 0 && gardenChildVoiceRate >= 80 && sensoryBenefitsRate >= 80 && avgGardenHours >= 4) {
    insights.push({ text: "Garden engagement is strong with sensory benefits and child voice well-captured — outdoor enrichment is meaningfully integrated into children's daily lives.", severity: "positive" });
  }
  if (rmSignOffRate < 50 && outdoor_activities.length >= 3) {
    insights.push({ text: `Only ${rmSignOffRate}% RM sign-off across ${outdoor_activities.length} outdoor activities. This governance gap could expose children to unassessed risks and would be a serious concern at inspection.`, severity: "critical" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (living_environment_rating === "outstanding") {
    headline = `Outstanding living environment — ${bedroomCoverage}% bedroom coverage, ${avgSatisfaction}/5 satisfaction.`;
  } else if (living_environment_rating === "good") {
    headline = `Good living environment — ${concerns.length > 0 ? concerns.length + " area" + (concerns.length > 1 ? "s" : "") + " for improvement." : "well-managed spaces and safety."}`;
  } else if (living_environment_rating === "adequate") {
    headline = `Living environment needs improvement — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified.`;
  } else {
    headline = `Living environment is inadequate — significant gaps in personalisation, safety, or risk management.`;
  }

  return {
    living_environment_rating,
    living_environment_score: score,
    headline,
    bedrooms: bedroomProfile,
    pets: petProfile,
    gardens: gardenProfile,
    outdoor_activities: outdoorProfile,
    environmental_risks: envRiskProfile,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
