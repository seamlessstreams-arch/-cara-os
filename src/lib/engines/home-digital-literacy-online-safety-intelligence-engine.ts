// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DIGITAL LITERACY & ONLINE SAFETY INTELLIGENCE ENGINE
// Home-level: assesses digital literacy skills, online safety measures, device
// management, and RSE digital safety coverage across all children.
// CHR 2015 Reg 12 (health): children's physical, emotional and digital wellbeing.
// CHR 2015 Reg 13 (child protection): safeguarding arrangements including online.
// Ofsted: children are kept safe online and educated about digital risks.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface DigitalSkillInput {
  id: string;
  child_id: string;
  domain: string; // "online_safety"|"communication"|"content_creation"|"information_literacy"|"problem_solving"
  competency: string; // "none"|"basic"|"intermediate"|"advanced"
  skills_achieved_count: number;
  skills_total_count: number;
}

export interface DigitalPlanInput {
  id: string;
  child_id: string;
  has_screen_time_limits: boolean;
  parental_controls_active: boolean;
  has_exploitation_risk_assessment: boolean;
  has_cyberbullying_response: boolean;
}

export interface PhoneRecordInput {
  id: string;
  child_id: string;
  parental_controls_active: boolean;
  online_safety_agreement_signed: boolean;
}

export interface RseDigitalInput {
  id: string;
  child_id: string;
  date: string;
  topic_is_digital_safety: boolean;
  child_engaged: boolean;
}

export interface DigitalLiteracyOnlineSafetyInput {
  today: string;
  total_children: number;
  digital_skills: DigitalSkillInput[];
  digital_plans: DigitalPlanInput[];
  phone_records: PhoneRecordInput[];
  rse_digital: RseDigitalInput[];
}

// ── Output types ────────────────────────────────────────────────────────────

export type DigitalSafetyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface DigitalSafetyResult {
  digital_rating: DigitalSafetyRating;
  digital_score: number;
  headline: string;
  children_with_digital_plans: number;
  digital_skill_coverage_rate: number;
  parental_controls_rate: number;
  rse_digital_coverage_rate: number;
  exploitation_risk_assessed_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeDigitalLiteracyOnlineSafety(
  input: DigitalLiteracyOnlineSafetyInput,
): DigitalSafetyResult {
  const { total_children, digital_skills, digital_plans, phone_records, rse_digital } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_children === 0) {
    return {
      digital_rating: "insufficient_data",
      digital_score: 0,
      headline: "No children in placement — digital literacy and online safety cannot be assessed.",
      children_with_digital_plans: 0,
      digital_skill_coverage_rate: 0,
      parental_controls_rate: 0,
      rse_digital_coverage_rate: 0,
      exploitation_risk_assessed_rate: 0,
      strengths: [],
      concerns: ["No children in placement — digital literacy analysis unavailable."],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ───────────────────────────────────────────────────────────

  // Digital plan coverage: unique children with digital plans / total_children
  const uniqueChildrenWithPlans = new Set(digital_plans.map(p => p.child_id)).size;
  const digitalPlanCoverageRate = pct(uniqueChildrenWithPlans, total_children);

  // Skill competency: skills at intermediate or advanced / total skills
  const skillsAtIntermediateOrAdvanced = digital_skills.filter(
    s => s.competency === "intermediate" || s.competency === "advanced",
  ).length;
  const skillCompetencyRate = pct(skillsAtIntermediateOrAdvanced, digital_skills.length);

  // Parental controls: phones with parental_controls_active / total phones
  const phonesWithControls = phone_records.filter(p => p.parental_controls_active).length;
  const parentalControlsRate = pct(phonesWithControls, phone_records.length);

  // Exploitation risk assessed: plans with has_exploitation_risk_assessment / total plans
  const plansWithExploitationRisk = digital_plans.filter(p => p.has_exploitation_risk_assessment).length;
  const exploitationRiskAssessedRate = pct(plansWithExploitationRisk, digital_plans.length);

  // RSE digital coverage: unique children with rse_digital entries where child_engaged / total_children
  const uniqueChildrenWithEngagedRse = new Set(
    rse_digital.filter(r => r.topic_is_digital_safety && r.child_engaged).map(r => r.child_id),
  ).size;
  const rseDigitalCoverageRate = pct(uniqueChildrenWithEngagedRse, total_children);

  // Cyberbullying preparedness: plans with has_cyberbullying_response / total plans
  const plansWithCyberbullyingResponse = digital_plans.filter(p => p.has_cyberbullying_response).length;
  const cyberbullyingPreparednessRate = pct(plansWithCyberbullyingResponse, digital_plans.length);

  // Digital skill coverage rate: unique children with any digital_skills / total_children
  const uniqueChildrenWithSkills = new Set(digital_skills.map(s => s.child_id)).size;
  const digitalSkillCoverageRate = pct(uniqueChildrenWithSkills, total_children);

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52, 6 mods, max ~82
  let score = 52;

  // Mod 1: Digital plan coverage
  if (digitalPlanCoverageRate >= 80) score += 5;
  else if (digitalPlanCoverageRate >= 50) score += 2;
  else if (digitalPlanCoverageRate >= 30) score += 0;
  else score -= 5;

  // Mod 2: Skill competency (intermediate or advanced)
  if (skillCompetencyRate >= 70) score += 6;
  else if (skillCompetencyRate >= 45) score += 3;
  else if (skillCompetencyRate >= 25) score += 0;
  else score -= 5;

  // Mod 3: Parental controls on phones
  if (parentalControlsRate >= 90) score += 5;
  else if (parentalControlsRate >= 70) score += 2;
  else if (parentalControlsRate >= 50) score += 0;
  else score -= 5;

  // Mod 4: Exploitation risk assessed
  if (exploitationRiskAssessedRate >= 80) score += 5;
  else if (exploitationRiskAssessedRate >= 50) score += 2;
  else if (exploitationRiskAssessedRate >= 30) score += 0;
  else score -= 4;

  // Mod 5: RSE digital coverage
  if (rseDigitalCoverageRate >= 70) score += 4;
  else if (rseDigitalCoverageRate >= 40) score += 1;
  else if (rseDigitalCoverageRate >= 20) score += 0;
  else score -= 4;

  // Mod 6: Cyberbullying preparedness
  if (cyberbullyingPreparednessRate >= 80) score += 5;
  else if (cyberbullyingPreparednessRate >= 50) score += 2;
  else if (cyberbullyingPreparednessRate >= 30) score += 0;
  else score -= 5;

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score));

  // ── Rating ────────────────────────────────────────────────────────────
  let digital_rating: DigitalSafetyRating;
  if (score >= 80) digital_rating = "outstanding";
  else if (score >= 65) digital_rating = "good";
  else if (score >= 45) digital_rating = "adequate";
  else digital_rating = "inadequate";

  // ── Strengths / Concerns / Recommendations / Insights ─────────────────
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  const insights: { text: string; severity: string }[] = [];
  let rank = 0;

  // Strengths
  if (digitalPlanCoverageRate >= 80) {
    strengths.push(`${digitalPlanCoverageRate}% of children have digital safety plans — proactive online protection embedded in care planning.`);
  }
  if (skillCompetencyRate >= 70) {
    strengths.push(`${skillCompetencyRate}% of digital skills at intermediate or advanced level — children are developing strong digital literacy.`);
  }
  if (parentalControlsRate >= 90 && phone_records.length > 0) {
    strengths.push("Parental controls active on the vast majority of devices — robust technical safeguards in place.");
  }
  if (exploitationRiskAssessedRate >= 80 && digital_plans.length > 0) {
    strengths.push("Exploitation risk assessments completed across digital plans — proactive safeguarding against online exploitation.");
  }
  if (rseDigitalCoverageRate >= 70) {
    strengths.push(`${rseDigitalCoverageRate}% RSE digital safety coverage with engaged children — education programme is effective.`);
  }
  if (cyberbullyingPreparednessRate >= 80 && digital_plans.length > 0) {
    strengths.push("Cyberbullying response plans in place for most children — staff are prepared to respond to online harassment.");
  }

  // Concerns
  if (digitalPlanCoverageRate < 80 && total_children > uniqueChildrenWithPlans) {
    const missing = total_children - uniqueChildrenWithPlans;
    concerns.push(`${missing} child${missing > 1 ? "ren" : ""} without digital safety plans — online risks may not be formally managed.`);
  }
  if (skillCompetencyRate < 45 && digital_skills.length > 0) {
    concerns.push(`Only ${skillCompetencyRate}% of digital skills at intermediate level or above — children may lack the competency to stay safe online.`);
  }
  if (parentalControlsRate < 70 && phone_records.length > 0) {
    concerns.push(`Parental controls active on only ${parentalControlsRate}% of devices — children may be exposed to unfiltered online content.`);
  }
  if (exploitationRiskAssessedRate < 50 && digital_plans.length > 0) {
    concerns.push(`Only ${exploitationRiskAssessedRate}% of digital plans include exploitation risk assessments — online exploitation risks may be unidentified.`);
  }
  if (rseDigitalCoverageRate < 40) {
    concerns.push(`RSE digital safety coverage at ${rseDigitalCoverageRate}% — too few children receiving engaged digital safety education.`);
  }
  if (cyberbullyingPreparednessRate < 50 && digital_plans.length > 0) {
    concerns.push(`Only ${cyberbullyingPreparednessRate}% of plans include cyberbullying response — the home may be unprepared for online harassment incidents.`);
  }

  // Recommendations
  if (digitalPlanCoverageRate < 80) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Create digital safety plans for all children — each child needs an individualised online safety strategy.",
      urgency: digitalPlanCoverageRate < 30 ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }
  if (skillCompetencyRate < 45 && digital_skills.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Invest in digital literacy development — structured programmes to build children's online competency and resilience.",
      urgency: skillCompetencyRate < 25 ? "immediate" : "planned",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }
  if (parentalControlsRate < 70 && phone_records.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Activate parental controls on all devices — technical safeguards are essential for online protection.",
      urgency: parentalControlsRate < 50 ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 13",
    });
  }
  if (exploitationRiskAssessedRate < 80 && digital_plans.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Complete exploitation risk assessments within all digital safety plans — online exploitation is a key safeguarding risk.",
      urgency: exploitationRiskAssessedRate < 30 ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 13",
    });
  }
  if (rseDigitalCoverageRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Expand RSE digital safety education — ensure all children receive and engage with age-appropriate online safety content.",
      urgency: rseDigitalCoverageRate < 20 ? "immediate" : "planned",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }
  if (cyberbullyingPreparednessRate < 80 && digital_plans.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Develop cyberbullying response protocols within digital plans — staff need clear procedures for online harassment.",
      urgency: cyberbullyingPreparednessRate < 30 ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 13",
    });
  }

  // Insights
  if (
    digitalPlanCoverageRate >= 80 &&
    skillCompetencyRate >= 70 &&
    parentalControlsRate >= 90 &&
    rseDigitalCoverageRate >= 70 &&
    exploitationRiskAssessedRate >= 80 &&
    cyberbullyingPreparednessRate >= 80
  ) {
    insights.push({
      text: "Digital literacy and online safety governance is exemplary. Plans, skills, controls, education, and risk assessments all exceed thresholds. Ofsted will recognise this as outstanding practice under Reg 12 and Reg 13.",
      severity: "positive",
    });
  }
  if (parentalControlsRate < 50 && phone_records.length > 0) {
    insights.push({
      text: `Parental controls active on only ${parentalControlsRate}% of devices. Without technical safeguards, children are reliant solely on their own digital literacy to avoid harmful content — this is a significant safeguarding gap.`,
      severity: "critical",
    });
  }
  if (exploitationRiskAssessedRate < 30 && digital_plans.length > 0) {
    insights.push({
      text: `Only ${exploitationRiskAssessedRate}% of digital plans include exploitation risk assessments. Online exploitation (grooming, CSE, radicalisation) is a primary Ofsted concern — this gap could trigger a regulatory finding.`,
      severity: "critical",
    });
  }
  if (rseDigitalCoverageRate < 20) {
    insights.push({
      text: `RSE digital safety coverage is critically low at ${rseDigitalCoverageRate}%. Children are not receiving education about online risks — this leaves them vulnerable and may breach Reg 12 expectations for health and wellbeing.`,
      severity: "critical",
    });
  }
  if (skillCompetencyRate < 25 && digital_skills.length > 0) {
    insights.push({
      text: `Only ${skillCompetencyRate}% of digital skills are at intermediate or above. Most children lack the competency to navigate online risks independently — direct work and structured digital literacy programmes are urgently needed.`,
      severity: "warning",
    });
  }
  if (cyberbullyingPreparednessRate < 30 && digital_plans.length > 0) {
    insights.push({
      text: `Cyberbullying preparedness is critically low at ${cyberbullyingPreparednessRate}%. Without response plans, staff lack clear guidance when online harassment occurs — response times and outcomes will suffer.`,
      severity: "warning",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (digital_rating === "outstanding") {
    headline = `Outstanding digital literacy and online safety — ${uniqueChildrenWithPlans} children with plans, ${skillCompetencyRate}% skills at intermediate+, robust safeguards in place.`;
  } else if (digital_rating === "good") {
    headline = `Good digital safety posture — ${digitalPlanCoverageRate}% plan coverage, ${skillCompetencyRate}% skill competency.${concerns.length > 0 ? ` ${concerns.length} area${concerns.length > 1 ? "s" : ""} for improvement.` : ""}`;
  } else if (digital_rating === "adequate") {
    headline = `Digital literacy and online safety requires improvement — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified across plans, skills, or safeguards.`;
  } else {
    headline = "Digital literacy and online safety is inadequate — significant gaps in plans, skills, device controls, or risk assessments.";
  }

  return {
    digital_rating,
    digital_score: score,
    headline,
    children_with_digital_plans: uniqueChildrenWithPlans,
    digital_skill_coverage_rate: digitalSkillCoverageRate,
    parental_controls_rate: parentalControlsRate,
    rse_digital_coverage_rate: rseDigitalCoverageRate,
    exploitation_risk_assessed_rate: exploitationRiskAssessedRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
