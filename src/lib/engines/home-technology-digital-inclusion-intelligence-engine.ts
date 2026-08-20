// ==============================================================================
// CARA -- HOME TECHNOLOGY & DIGITAL INCLUSION INTELLIGENCE ENGINE
// Tracks digital inclusion quality -- device access equity, digital skills
// development, assistive technology provision, internet safety awareness,
// and technology-supported learning. Critical for Ofsted under Children's
// Homes Regulations 2015 (Reg 5 quality of care, Reg 8 education, SCCIF
// experiences and progress).
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Quality of care), Reg 8 (Education),
// SCCIF "Experiences and progress of children".
// Store keys: deviceAccessRecords, digitalSkillsRecords,
//             assistiveTechnologyRecords, internetSafetyRecords,
//             technologyLearningRecords
// ==============================================================================

import { below, meets } from "@/lib/metrics/rate";

// -- Input Types --------------------------------------------------------------

export interface DeviceAccessRecordInput {
  id: string;
  child_id: string;
  device_type: "laptop" | "tablet" | "desktop" | "smartphone" | "e_reader" | "gaming_console" | "assistive_device" | "other";
  ownership: "personal" | "shared" | "home_provided" | "school_loaned" | "other";
  condition: "excellent" | "good" | "fair" | "poor" | "broken";
  internet_enabled: boolean;
  age_appropriate_filters: boolean;
  accessible_when_needed: boolean;
  private_use_available: boolean;
  date: string;
  child_satisfaction: number; // 1-5
  issues_reported: string[];
  notes: string;
  created_at: string;
}

export interface DigitalSkillsRecordInput {
  id: string;
  child_id: string;
  skill_area: "basic_computing" | "internet_navigation" | "email_communication" | "document_creation" | "online_research" | "coding" | "media_creation" | "social_media_literacy" | "data_management" | "other";
  assessment_date: string;
  baseline_level: "none" | "beginner" | "intermediate" | "advanced";
  current_level: "none" | "beginner" | "intermediate" | "advanced";
  plan_in_place: boolean;
  sessions_planned: number;
  sessions_completed: number;
  progress_evidenced: boolean;
  child_engaged: boolean;
  staff_supported: boolean;
  child_confidence_rating: number; // 1-5
  notes: string;
  created_at: string;
}

export interface AssistiveTechnologyRecordInput {
  id: string;
  child_id: string;
  need_identified: boolean;
  need_type: "visual" | "auditory" | "motor" | "cognitive" | "communication" | "learning" | "none" | "other";
  technology_type: string; // e.g. screen reader, voice-to-text, adapted keyboard
  provided: boolean;
  date_provided: string | null;
  training_given: boolean;
  staff_trained: boolean;
  effectiveness_rating: number; // 1-5
  child_uses_independently: boolean;
  review_date: string | null;
  barriers_encountered: string[];
  created_at: string;
}

export interface InternetSafetyRecordInput {
  id: string;
  child_id: string;
  session_date: string;
  topic: "online_grooming" | "cyberbullying" | "data_privacy" | "social_media_safety" | "sexting_risks" | "scams_phishing" | "screen_time" | "digital_footprint" | "age_restrictions" | "reporting_concerns" | "other";
  session_type: "one_to_one" | "group" | "keywork" | "workshop" | "external_provider" | "self_directed" | "other";
  completed: boolean;
  child_engaged: boolean;
  child_demonstrated_understanding: boolean;
  follow_up_needed: boolean;
  follow_up_completed: boolean;
  child_confidence_rating: number; // 1-5
  staff_delivered: boolean;
  external_provider: string | null;
  notes: string;
  created_at: string;
}

export interface TechnologyLearningRecordInput {
  id: string;
  child_id: string;
  learning_context: "homework" | "coursework" | "revision" | "research" | "creative_project" | "vocational" | "independent_learning" | "tutoring" | "other";
  technology_used: string; // e.g. laptop, tablet, educational software
  date: string;
  effective: boolean;
  child_supported: boolean;
  staff_facilitated: boolean;
  educational_outcome_documented: boolean;
  child_satisfaction: number; // 1-5
  barriers_encountered: string[];
  accessibility_needs_met: boolean;
  notes: string;
  created_at: string;
}

export interface TechnologyDigitalInclusionInput {
  today: string;
  total_children: number;
  device_access_records: DeviceAccessRecordInput[];
  digital_skills_records: DigitalSkillsRecordInput[];
  assistive_technology_records: AssistiveTechnologyRecordInput[];
  internet_safety_records: InternetSafetyRecordInput[];
  technology_learning_records: TechnologyLearningRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type DigitalInclusionRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface DigitalInclusionInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface DigitalInclusionRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface TechnologyDigitalInclusionResult {
  digital_inclusion_rating: DigitalInclusionRating;
  digital_inclusion_score: number;
  headline: string;
  // device_access_rate + assistive_technology_rate use pct() directly (deterministic
  // 0 on empty denominator) and are unaffected by fab-0. The composite rates below
  // are null on empty: no records ⇒ no signal. "0% digital skills / 0% safety
  // engagement / 0% learning effectiveness / 0% child confidence" would read as
  // "the home actively fails digital inclusion", not "unmeasured". Fab-0 doctrine.
  device_access_rate: number;
  digital_skills_rate: number | null;
  assistive_technology_rate: number;
  internet_safety_rate: number | null;
  technology_learning_rate: number | null;
  child_confidence_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: DigitalInclusionRecommendation[];
  insights: DigitalInclusionInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): DigitalInclusionRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: DigitalInclusionRating,
  score: number,
  headline: string,
): TechnologyDigitalInclusionResult {
  return {
    digital_inclusion_rating: rating,
    digital_inclusion_score: score,
    headline,
    device_access_rate: 0,
    digital_skills_rate: null,
    assistive_technology_rate: 0,
    internet_safety_rate: null,
    technology_learning_rate: null,
    child_confidence_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeTechnologyDigitalInclusion(
  input: TechnologyDigitalInclusionInput,
): TechnologyDigitalInclusionResult {
  const {
    total_children,
    device_access_records,
    digital_skills_records,
    assistive_technology_records,
    internet_safety_records,
    technology_learning_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    device_access_records.length === 0 &&
    digital_skills_records.length === 0 &&
    assistive_technology_records.length === 0 &&
    internet_safety_records.length === 0 &&
    technology_learning_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess technology and digital inclusion.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No technology or digital inclusion data recorded despite children on placement -- device access, digital skills development, internet safety awareness, and technology-supported learning require urgent attention.",
      ),
      concerns: [
        "No device access, digital skills, assistive technology, internet safety, or technology-supported learning records exist despite children being on placement -- the home cannot evidence equitable digital inclusion or online safety awareness.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of device access, digital skills assessments, assistive technology provision, internet safety sessions, and technology-supported learning to evidence the home's commitment to digital inclusion and online safety.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
        },
        {
          rank: 2,
          recommendation:
            "Assess every child's digital access needs, digital skills baseline, assistive technology requirements, and internet safety awareness. Ensure these are reflected in their care and education plans with documented support arrangements.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 8 -- Education",
        },
      ],
      insights: [
        {
          text: "The complete absence of technology and digital inclusion records means Ofsted cannot verify that children have equitable device access, are developing digital skills, receive internet safety education, or are supported with assistive technology where needed. This represents a significant gap in Reg 5 and Reg 8 compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // --- Device access ---
  const totalDeviceRecords = device_access_records.length;
  const accessibleDevices = device_access_records.filter((r) => r.accessible_when_needed).length;
  const deviceAccessRate = pct(accessibleDevices, totalDeviceRecords);

  const uniqueChildrenWithDevices = new Set(
    device_access_records.map((r) => r.child_id),
  ).size;

  const internetEnabled = device_access_records.filter((r) => r.internet_enabled).length;
  const internetEnabledRate = pct(internetEnabled, totalDeviceRecords);

  const ageFiltered = device_access_records.filter((r) => r.age_appropriate_filters).length;
  const filterRate = pct(ageFiltered, totalDeviceRecords);

  const privateUseAvailable = device_access_records.filter((r) => r.private_use_available).length;
  const privateUseRate = pct(privateUseAvailable, totalDeviceRecords);

  const goodConditionDevices = device_access_records.filter(
    (r) => r.condition === "excellent" || r.condition === "good",
  ).length;
  const deviceConditionRate = pct(goodConditionDevices, totalDeviceRecords);

  const deviceSatisfactionSum = device_access_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const deviceSatisfactionAvg: number | null =
    totalDeviceRecords > 0
      ? Math.round((deviceSatisfactionSum / totalDeviceRecords) * 100) / 100
      : null;

  const devicesWithIssues = device_access_records.filter(
    (r) => r.issues_reported.length > 0,
  ).length;
  const deviceIssueRate = pct(devicesWithIssues, totalDeviceRecords);

  const personalDevices = device_access_records.filter(
    (r) => r.ownership === "personal",
  ).length;
  const personalDeviceRate = pct(personalDevices, totalDeviceRecords);

  // --- Digital skills ---
  const totalSkillsRecords = digital_skills_records.length;
  const withPlan = digital_skills_records.filter((r) => r.plan_in_place).length;
  const skillsPlanRate = pct(withPlan, totalSkillsRecords);

  const totalSessionsPlanned = digital_skills_records.reduce(
    (sum, r) => sum + r.sessions_planned, 0,
  );
  const totalSessionsCompleted = digital_skills_records.reduce(
    (sum, r) => sum + r.sessions_completed, 0,
  );
  const sessionCompletionRate = pct(totalSessionsCompleted, totalSessionsPlanned);

  const progressEvidenced = digital_skills_records.filter((r) => r.progress_evidenced).length;
  const progressRate = pct(progressEvidenced, totalSkillsRecords);

  const childEngagedSkills = digital_skills_records.filter((r) => r.child_engaged).length;
  const skillsEngagementRate = pct(childEngagedSkills, totalSkillsRecords);

  const staffSupportedSkills = digital_skills_records.filter((r) => r.staff_supported).length;
  const staffSupportRate = pct(staffSupportedSkills, totalSkillsRecords);

  // Level progression: count how many improved from baseline
  const levelMap: Record<string, number> = { none: 0, beginner: 1, intermediate: 2, advanced: 3 };
  const improved = digital_skills_records.filter(
    (r) => (levelMap[r.current_level] ?? 0) > (levelMap[r.baseline_level] ?? 0),
  ).length;
  const improvementRate = pct(improved, totalSkillsRecords);

  const digitalSkillsRate: number | null =
    totalSkillsRecords > 0
      ? Math.round((skillsPlanRate + sessionCompletionRate + progressRate) / 3)
      : null;

  // --- Assistive technology ---
  const totalAssistiveRecords = assistive_technology_records.length;
  const needsIdentified = assistive_technology_records.filter(
    (r) => r.need_identified && r.need_type !== "none",
  ).length;
  const needsWithProvision = assistive_technology_records.filter(
    (r) => r.need_identified && r.need_type !== "none" && r.provided,
  ).length;
  const assistiveTechnologyRate = pct(needsWithProvision, needsIdentified);

  const trainingGiven = assistive_technology_records.filter(
    (r) => r.need_identified && r.need_type !== "none" && r.training_given,
  ).length;
  const assistiveTrainingRate = pct(trainingGiven, needsIdentified);

  const staffTrainedAssistive = assistive_technology_records.filter(
    (r) => r.need_identified && r.need_type !== "none" && r.staff_trained,
  ).length;
  const staffAssistiveTrainingRate = pct(staffTrainedAssistive, needsIdentified);

  const usesIndependently = assistive_technology_records.filter(
    (r) => r.need_identified && r.need_type !== "none" && r.child_uses_independently,
  ).length;
  const independentUseRate = pct(usesIndependently, needsIdentified);

  const effectivenessSum = assistive_technology_records
    .filter((r) => r.need_identified && r.need_type !== "none")
    .reduce((sum, r) => sum + r.effectiveness_rating, 0);
  const effectivenessAvg: number | null =
    needsIdentified > 0
      ? Math.round((effectivenessSum / needsIdentified) * 100) / 100
      : null;

  const assistiveBarriersTotal = assistive_technology_records.filter(
    (r) => r.barriers_encountered.length > 0,
  ).length;
  const assistiveBarrierRate = pct(assistiveBarriersTotal, totalAssistiveRecords);

  // --- Internet safety ---
  const totalSafetyRecords = internet_safety_records.length;
  const completedSafety = internet_safety_records.filter((r) => r.completed).length;
  const safetyCompletionRate = pct(completedSafety, totalSafetyRecords);

  const engagedSafety = internet_safety_records.filter((r) => r.child_engaged).length;
  const safetyEngagementRate = pct(engagedSafety, totalSafetyRecords);

  const demonstratedUnderstanding = internet_safety_records.filter(
    (r) => r.child_demonstrated_understanding,
  ).length;
  const understandingRate = pct(demonstratedUnderstanding, totalSafetyRecords);

  const followUpNeeded = internet_safety_records.filter((r) => r.follow_up_needed).length;
  const followUpCompleted = internet_safety_records.filter(
    (r) => r.follow_up_needed && r.follow_up_completed,
  ).length;
  const followUpRate = pct(followUpCompleted, followUpNeeded);

  const staffDelivered = internet_safety_records.filter((r) => r.staff_delivered).length;
  const staffDeliveryRate = pct(staffDelivered, totalSafetyRecords);

  const uniqueChildrenWithSafety = new Set(
    internet_safety_records.map((r) => r.child_id),
  ).size;

  const uniqueTopics = new Set(
    internet_safety_records.map((r) => r.topic),
  ).size;

  const internetSafetyRate: number | null =
    totalSafetyRecords > 0
      ? Math.round((safetyCompletionRate + safetyEngagementRate + understandingRate) / 3)
      : null;

  // --- Technology-supported learning ---
  const totalLearningRecords = technology_learning_records.length;
  const effectiveLearning = technology_learning_records.filter((r) => r.effective).length;
  const learningEffectivenessRate = pct(effectiveLearning, totalLearningRecords);

  const childSupportedLearning = technology_learning_records.filter(
    (r) => r.child_supported,
  ).length;
  const learningSupportRate = pct(childSupportedLearning, totalLearningRecords);

  const staffFacilitatedLearning = technology_learning_records.filter(
    (r) => r.staff_facilitated,
  ).length;
  const learningFacilitationRate = pct(staffFacilitatedLearning, totalLearningRecords);

  const outcomesDocumented = technology_learning_records.filter(
    (r) => r.educational_outcome_documented,
  ).length;
  const outcomeDocumentationRate = pct(outcomesDocumented, totalLearningRecords);

  const accessibilityMet = technology_learning_records.filter(
    (r) => r.accessibility_needs_met,
  ).length;
  const learningAccessibilityRate = pct(accessibilityMet, totalLearningRecords);

  const learningBarriersTotal = technology_learning_records.filter(
    (r) => r.barriers_encountered.length > 0,
  ).length;
  const learningBarrierRate = pct(learningBarriersTotal, totalLearningRecords);

  const learningSatisfactionSum = technology_learning_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const learningSatisfactionAvg: number | null =
    totalLearningRecords > 0
      ? Math.round((learningSatisfactionSum / totalLearningRecords) * 100) / 100
      : null;

  const technologyLearningRate: number | null =
    totalLearningRecords > 0
      ? Math.round((learningEffectivenessRate + learningSupportRate + outcomeDocumentationRate) / 3)
      : null;

  // --- Child confidence composite ---
  const skillsConfidenceSum = digital_skills_records.reduce(
    (sum, r) => sum + r.child_confidence_rating, 0,
  );
  const safetyConfidenceSum = internet_safety_records.reduce(
    (sum, r) => sum + r.child_confidence_rating, 0,
  );
  const confidenceDenominator = totalSkillsRecords + totalSafetyRecords;
  const confidenceNumerator = skillsConfidenceSum + safetyConfidenceSum;
  const childConfidenceAvg: number | null =
    confidenceDenominator > 0
      ? Math.round((confidenceNumerator / confidenceDenominator) * 100) / 100
      : null;
  // Convert 1-5 scale to percentage: (avg/5)*100
  const childConfidenceRate: number | null =
    confidenceDenominator > 0
      ? Math.round((childConfidenceAvg! / 5) * 100)
      : null;

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: deviceAccessRate (>=90: +4, >=70: +2) ---
  if (deviceAccessRate >= 90) score += 4;
  else if (deviceAccessRate >= 70) score += 2;

  // --- Bonus 2: digitalSkillsRate (>=80: +3, >=60: +1) ---
  if (meets(digitalSkillsRate, 80)) score += 3;
  else if (meets(digitalSkillsRate, 60)) score += 1;

  // --- Bonus 3: assistiveTechnologyRate (>=100: +4, >=80: +2) ---
  if (assistiveTechnologyRate >= 100) score += 4;
  else if (assistiveTechnologyRate >= 80) score += 2;

  // --- Bonus 4: internetSafetyRate (>=90: +3, >=70: +1) ---
  if (meets(internetSafetyRate, 90)) score += 3;
  else if (meets(internetSafetyRate, 70)) score += 1;

  // --- Bonus 5: technologyLearningRate (>=90: +3, >=70: +1) ---
  if (meets(technologyLearningRate, 90)) score += 3;
  else if (meets(technologyLearningRate, 70)) score += 1;

  // --- Bonus 6: childConfidenceRate (>=80: +3, >=60: +1) ---
  if (meets(childConfidenceRate, 80)) score += 3;
  else if (meets(childConfidenceRate, 60)) score += 1;

  // --- Bonus 7: filterRate (>=95: +3, >=80: +1) ---
  if (filterRate >= 95) score += 3;
  else if (filterRate >= 80) score += 1;

  // --- Bonus 8: staffSupportRate (>=90: +3, >=70: +1) ---
  if (staffSupportRate >= 90) score += 3;
  else if (staffSupportRate >= 70) score += 1;

  // --- Bonus 9: improvementRate (>=80: +2, >=50: +1) ---
  if (improvementRate >= 80) score += 2;
  else if (improvementRate >= 50) score += 1;

  // -- Penalties (4 with guards) -------------------------------------------

  // deviceAccessRate < 50 -> -5
  if (deviceAccessRate < 50 && totalDeviceRecords > 0) score -= 5;

  // below(internetSafetyRate, 50) -> -5
  if (below(internetSafetyRate, 50) && totalSafetyRecords > 0) score -= 5;

  // assistiveTechnologyRate < 50 -> -4
  if (assistiveTechnologyRate < 50 && needsIdentified > 0) score -= 4;

  // below(technologyLearningRate, 30) -> -4
  if (below(technologyLearningRate, 30) && totalLearningRecords > 0) score -= 4;

  score = clamp(score, 0, 100);

  const digital_inclusion_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (deviceAccessRate >= 90 && totalDeviceRecords > 0) {
    strengths.push(
      `${deviceAccessRate}% of devices accessible when needed -- the home demonstrates equitable device access ensuring all children can engage digitally when required.`,
    );
  } else if (deviceAccessRate >= 70 && totalDeviceRecords > 0) {
    strengths.push(
      `${deviceAccessRate}% device accessibility rate -- most children have reliable access to appropriate technology when they need it.`,
    );
  }

  if (internetEnabledRate >= 90 && totalDeviceRecords > 0) {
    strengths.push(
      `${internetEnabledRate}% of devices are internet-enabled -- children are not digitally excluded from online resources and communication.`,
    );
  }

  if (filterRate >= 95 && totalDeviceRecords > 0) {
    strengths.push(
      `${filterRate}% of devices have age-appropriate filters -- the home maintains robust online safeguarding across all digital devices.`,
    );
  } else if (filterRate >= 80 && totalDeviceRecords > 0) {
    strengths.push(
      `${filterRate}% of devices filtered appropriately -- good safeguarding coverage across most digital devices.`,
    );
  }

  if (deviceConditionRate >= 90 && totalDeviceRecords > 0) {
    strengths.push(
      `${deviceConditionRate}% of devices in good or excellent condition -- the home maintains its technology estate to a high standard.`,
    );
  }

  if (meets(deviceSatisfactionAvg, 4.0) && totalDeviceRecords > 0) {
    strengths.push(
      `Children's satisfaction with device access averages ${deviceSatisfactionAvg}/5 -- children feel their technology needs are well met.`,
    );
  }

  if (privateUseRate >= 80 && totalDeviceRecords > 0) {
    strengths.push(
      `${privateUseRate}% of devices available for private use -- children's right to age-appropriate digital privacy is respected.`,
    );
  }

  if (meets(digitalSkillsRate, 80) && totalSkillsRecords > 0) {
    strengths.push(
      `Digital skills development rate at ${digitalSkillsRate}% -- plans are in place, sessions are completed, and progress is evidenced.`,
    );
  } else if (meets(digitalSkillsRate, 60) && totalSkillsRecords > 0) {
    strengths.push(
      `Digital skills development rate at ${digitalSkillsRate}% -- good progress in building children's digital competence.`,
    );
  }

  if (improvementRate >= 80 && totalSkillsRecords > 0) {
    strengths.push(
      `${improvementRate}% of children have improved their digital skill level from baseline -- meaningful progression in digital competence.`,
    );
  } else if (improvementRate >= 50 && totalSkillsRecords > 0) {
    strengths.push(
      `${improvementRate}% of children showing digital skill improvement -- evidence of developing digital competence.`,
    );
  }

  if (skillsEngagementRate >= 90 && totalSkillsRecords > 0) {
    strengths.push(
      `${skillsEngagementRate}% engagement in digital skills sessions -- children are actively involved in their own digital development.`,
    );
  }

  if (staffSupportRate >= 90 && totalSkillsRecords > 0) {
    strengths.push(
      `Staff support ${staffSupportRate}% of digital skills development -- strong staff engagement with children's digital learning.`,
    );
  }

  if (assistiveTechnologyRate >= 100 && needsIdentified > 0) {
    strengths.push(
      "Every identified assistive technology need has been met -- the home ensures no child is digitally excluded due to additional needs.",
    );
  } else if (assistiveTechnologyRate >= 80 && needsIdentified > 0) {
    strengths.push(
      `${assistiveTechnologyRate}% of assistive technology needs met -- the vast majority of children with additional needs have appropriate technology provision.`,
    );
  }

  if (assistiveTrainingRate >= 80 && needsIdentified > 0) {
    strengths.push(
      `${assistiveTrainingRate}% of children trained on their assistive technology -- children are equipped to use their assistive devices effectively.`,
    );
  }

  if (independentUseRate >= 70 && needsIdentified > 0) {
    strengths.push(
      `${independentUseRate}% of children using assistive technology independently -- children are developing autonomy with their assistive devices.`,
    );
  }

  if (meets(effectivenessAvg, 4.0) && needsIdentified > 0) {
    strengths.push(
      `Assistive technology effectiveness averages ${effectivenessAvg}/5 -- the technology provided is genuinely meeting children's needs.`,
    );
  }

  if (meets(internetSafetyRate, 90) && totalSafetyRecords > 0) {
    strengths.push(
      `${internetSafetyRate}% internet safety rate -- children consistently complete, engage with, and demonstrate understanding of online safety education.`,
    );
  } else if (meets(internetSafetyRate, 70) && totalSafetyRecords > 0) {
    strengths.push(
      `${internetSafetyRate}% internet safety rate -- most children are engaging well with online safety education.`,
    );
  }

  if (understandingRate >= 90 && totalSafetyRecords > 0) {
    strengths.push(
      `${understandingRate}% of children demonstrate understanding of internet safety topics -- online safety education is translating into genuine awareness.`,
    );
  }

  if (uniqueTopics >= 5 && totalSafetyRecords > 0) {
    strengths.push(
      `Internet safety education covers ${uniqueTopics} distinct topics -- children receive comprehensive online safety education across multiple risk areas.`,
    );
  }

  if (followUpRate >= 90 && followUpNeeded > 0) {
    strengths.push(
      `${followUpRate}% of internet safety follow-ups completed -- the home is responsive to identified gaps in online safety understanding.`,
    );
  }

  if (meets(technologyLearningRate, 90) && totalLearningRecords > 0) {
    strengths.push(
      `Technology-supported learning rate at ${technologyLearningRate}% -- technology is effectively enhancing children's educational outcomes.`,
    );
  } else if (meets(technologyLearningRate, 70) && totalLearningRecords > 0) {
    strengths.push(
      `Technology-supported learning rate at ${technologyLearningRate}% -- good use of technology to support children's education.`,
    );
  }

  if (learningEffectivenessRate >= 90 && totalLearningRecords > 0) {
    strengths.push(
      `${learningEffectivenessRate}% of technology-supported learning sessions rated effective -- technology is genuinely enhancing educational engagement and outcomes.`,
    );
  }

  if (learningAccessibilityRate >= 90 && totalLearningRecords > 0) {
    strengths.push(
      `Accessibility needs met in ${learningAccessibilityRate}% of technology-supported learning sessions -- no child is excluded from digital learning due to accessibility barriers.`,
    );
  }

  if (meets(learningSatisfactionAvg, 4.0) && totalLearningRecords > 0) {
    strengths.push(
      `Children's satisfaction with technology-supported learning averages ${learningSatisfactionAvg}/5 -- children value the role technology plays in their education.`,
    );
  }

  if (meets(childConfidenceRate, 80) && confidenceDenominator > 0) {
    strengths.push(
      `Child digital confidence rate at ${childConfidenceRate}% -- children feel confident navigating the digital world safely and skilfully.`,
    );
  } else if (meets(childConfidenceRate, 60) && confidenceDenominator > 0) {
    strengths.push(
      `Child digital confidence rate at ${childConfidenceRate}% -- children are building confidence in their digital skills and online safety knowledge.`,
    );
  }

  if (outcomeDocumentationRate >= 80 && totalLearningRecords > 0) {
    strengths.push(
      `Educational outcomes documented in ${outcomeDocumentationRate}% of technology-supported learning sessions -- strong evidence base for Ofsted demonstrating technology's impact on learning.`,
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (deviceAccessRate < 50 && totalDeviceRecords > 0) {
    concerns.push(
      `Only ${deviceAccessRate}% of devices accessible when needed -- the majority of children cannot reliably access technology, creating significant digital exclusion.`,
    );
  } else if (deviceAccessRate < 70 && deviceAccessRate >= 50 && totalDeviceRecords > 0) {
    concerns.push(
      `Device accessibility at ${deviceAccessRate}% -- some children cannot access technology when they need it for education, communication, or personal development.`,
    );
  }

  if (filterRate < 80 && totalDeviceRecords > 0) {
    concerns.push(
      `Only ${filterRate}% of devices have age-appropriate filters -- children may be exposed to harmful online content through insufficiently filtered devices.`,
    );
  }

  if (deviceConditionRate < 60 && totalDeviceRecords > 0) {
    concerns.push(
      `Only ${deviceConditionRate}% of devices in good or excellent condition -- poorly maintained technology undermines children's ability to engage digitally.`,
    );
  }

  if (below(deviceSatisfactionAvg, 3.0) && totalDeviceRecords > 0) {
    concerns.push(
      `Children's satisfaction with device access averages only ${deviceSatisfactionAvg}/5 -- children feel their technology needs are not being met.`,
    );
  }

  if (deviceIssueRate >= 30 && totalDeviceRecords > 0) {
    concerns.push(
      `Issues reported with ${deviceIssueRate}% of devices -- persistent technology problems are impacting children's digital access and experience.`,
    );
  }

  if (below(digitalSkillsRate, 50) && totalSkillsRecords > 0) {
    concerns.push(
      `Digital skills development rate at only ${digitalSkillsRate}% -- plans, sessions, and progress evidence are not adequately supporting children's digital competence.`,
    );
  } else if (below(digitalSkillsRate, 60) && meets(digitalSkillsRate, 50) && totalSkillsRecords > 0) {
    concerns.push(
      `Digital skills rate at ${digitalSkillsRate}% -- digital skills development planning and delivery need strengthening.`,
    );
  }

  if (skillsPlanRate < 50 && totalSkillsRecords > 0) {
    concerns.push(
      `Only ${skillsPlanRate}% of children have a digital skills development plan -- digital skills needs are not being formally assessed and planned for.`,
    );
  }

  if (progressRate < 50 && totalSkillsRecords > 0) {
    concerns.push(
      `Progress evidenced in only ${progressRate}% of digital skills assessments -- children are not making demonstrable progress in their digital competence.`,
    );
  }

  if (improvementRate < 30 && totalSkillsRecords > 0) {
    concerns.push(
      `Only ${improvementRate}% of children have improved their digital skill level -- current approaches to digital skills development are not delivering meaningful progression.`,
    );
  }

  if (assistiveTechnologyRate < 50 && needsIdentified > 0) {
    concerns.push(
      `Only ${assistiveTechnologyRate}% of identified assistive technology needs met -- the majority of children with additional needs are being digitally excluded due to lack of appropriate technology.`,
    );
  } else if (assistiveTechnologyRate < 80 && assistiveTechnologyRate >= 50 && needsIdentified > 0) {
    concerns.push(
      `Assistive technology provision at ${assistiveTechnologyRate}% -- some children with additional needs do not have the technology they require for equitable digital access.`,
    );
  }

  if (assistiveTrainingRate < 50 && needsIdentified > 0) {
    concerns.push(
      `Only ${assistiveTrainingRate}% of children trained on their assistive technology -- children cannot use technology effectively without proper training.`,
    );
  }

  if (staffAssistiveTrainingRate < 50 && needsIdentified > 0) {
    concerns.push(
      `Staff trained on assistive technology in only ${staffAssistiveTrainingRate}% of cases -- staff cannot support children's assistive technology use without adequate training.`,
    );
  }

  if (assistiveBarrierRate >= 30 && totalAssistiveRecords > 0) {
    concerns.push(
      `Barriers encountered in ${assistiveBarrierRate}% of assistive technology records -- persistent obstacles are preventing children from accessing the technology they need.`,
    );
  }

  if (below(internetSafetyRate, 50) && totalSafetyRecords > 0) {
    concerns.push(
      `Internet safety rate at only ${internetSafetyRate}% -- children are not consistently completing, engaging with, or demonstrating understanding of online safety education. This is a safeguarding concern.`,
    );
  } else if (below(internetSafetyRate, 70) && meets(internetSafetyRate, 50) && totalSafetyRecords > 0) {
    concerns.push(
      `Internet safety rate at ${internetSafetyRate}% -- online safety education needs strengthening to ensure all children develop robust online safety awareness.`,
    );
  }

  if (understandingRate < 50 && totalSafetyRecords > 0) {
    concerns.push(
      `Only ${understandingRate}% of children demonstrate understanding of internet safety topics -- online safety education is not translating into genuine awareness, leaving children vulnerable online.`,
    );
  }

  if (followUpRate < 50 && followUpNeeded > 0) {
    concerns.push(
      `Only ${followUpRate}% of internet safety follow-ups completed -- identified gaps in children's online safety understanding are not being addressed.`,
    );
  }

  if (below(technologyLearningRate, 30) && totalLearningRecords > 0) {
    concerns.push(
      `Technology-supported learning rate at only ${technologyLearningRate}% -- technology is not effectively supporting children's education.`,
    );
  } else if (below(technologyLearningRate, 70) && meets(technologyLearningRate, 30) && totalLearningRecords > 0) {
    concerns.push(
      `Technology-supported learning at ${technologyLearningRate}% -- the use of technology to enhance children's education needs improvement.`,
    );
  }

  if (learningBarrierRate >= 30 && totalLearningRecords > 0) {
    concerns.push(
      `Barriers encountered in ${learningBarrierRate}% of technology-supported learning sessions -- obstacles are preventing children from benefiting fully from digital learning.`,
    );
  }

  if (learningAccessibilityRate < 70 && totalLearningRecords > 0) {
    concerns.push(
      `Accessibility needs met in only ${learningAccessibilityRate}% of technology learning sessions -- some children are excluded from digital learning due to unmet accessibility requirements.`,
    );
  }

  if (below(learningSatisfactionAvg, 3.0) && totalLearningRecords > 0) {
    concerns.push(
      `Children's satisfaction with technology-supported learning averages only ${learningSatisfactionAvg}/5 -- children are not experiencing technology as a positive support for their education.`,
    );
  }

  if (below(childConfidenceRate, 50) && confidenceDenominator > 0) {
    concerns.push(
      `Child digital confidence rate at only ${childConfidenceRate}% -- children lack confidence in their digital skills and online safety knowledge.`,
    );
  } else if (below(childConfidenceRate, 60) && meets(childConfidenceRate, 50) && confidenceDenominator > 0) {
    concerns.push(
      `Child digital confidence rate at ${childConfidenceRate}% -- children's confidence in their digital abilities needs further support.`,
    );
  }

  if (totalDeviceRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No device access records despite children being on placement -- the home may not be assessing or recording children's technology access needs and provision.",
    );
  }

  if (totalSafetyRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No internet safety records -- the home has not documented online safety education for any child. This is a significant safeguarding gap.",
    );
  }

  if (totalSkillsRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No digital skills records -- the home has not assessed or documented any child's digital competence development.",
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: DigitalInclusionRecommendation[] = [];
  let rank = 0;

  if (deviceAccessRate < 50 && totalDeviceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review device access equity -- every child must have reliable access to age-appropriate technology for education, communication, and personal development. Identify and remove barriers to device availability.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (below(internetSafetyRate, 50) && totalSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately strengthen internet safety education -- every child must receive regular, engaging online safety sessions covering key risk areas including grooming, cyberbullying, and data privacy. Document understanding and follow up on gaps.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (assistiveTechnologyRate < 50 && needsIdentified > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child with an identified assistive technology need receives appropriate provision without delay -- failing to provide necessary assistive technology constitutes digital exclusion and may breach equalities duties.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (below(technologyLearningRate, 30) && totalLearningRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review how technology supports children's learning -- ensure staff are equipped to facilitate digital learning, educational outcomes are documented, and barriers to technology-supported education are addressed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (filterRate < 80 && totalDeviceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all devices have age-appropriate content filters -- unfiltered devices pose a safeguarding risk. Conduct an immediate audit of all devices and implement filtering across the home's technology estate.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (below(childConfidenceRate, 50) && confidenceDenominator > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Embed digital confidence-building in all technology interactions -- use encouraging, scaffolded approaches to help children feel capable and safe online. Regularly capture children's confidence self-assessments.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (skillsPlanRate < 50 && totalSkillsRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop digital skills plans for all children that reflect their baseline abilities, learning goals, and progression targets. Review plans at least termly.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (understandingRate < 50 && totalSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Adapt internet safety education delivery to improve children's demonstrated understanding -- consider using interactive, scenario-based approaches and age-appropriate resources to make online safety concepts tangible.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (staffAssistiveTrainingRate < 50 && needsIdentified > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide staff training on all assistive technologies in use within the home -- staff must understand how each device works to provide effective day-to-day support.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (followUpRate < 50 && followUpNeeded > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all outstanding internet safety follow-ups -- gaps in online safety understanding identified during sessions must be addressed to ensure children are protected.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (deviceAccessRate >= 50 && deviceAccessRate < 70 && totalDeviceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve device accessibility to at least 70% -- review device allocation, maintenance schedules, and shared-device policies to ensure all children can access technology when needed.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (outcomeDocumentationRate < 50 && totalLearningRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Document educational outcomes for all technology-supported learning sessions -- evidence of how technology impacts children's learning is essential for demonstrating the value of digital provision to Ofsted.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (learningAccessibilityRate < 70 && totalLearningRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure accessibility needs are met in all technology-supported learning sessions -- no child should be excluded from digital learning due to unmet accessibility requirements.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (meets(internetSafetyRate, 50) && below(internetSafetyRate, 70) && totalSafetyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen internet safety provision to achieve at least 70% completion, engagement, and understanding -- consider diversifying delivery methods and involving external providers.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (meets(digitalSkillsRate, 50) && below(digitalSkillsRate, 60) && totalSkillsRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve digital skills development rates by ensuring plans are in place, sessions are consistently delivered, and progress is evidenced for every child.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (meets(technologyLearningRate, 30) && below(technologyLearningRate, 70) && totalLearningRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop creative approaches to technology-supported learning -- involve children in selecting tools and methods, ensure staff facilitation, and document outcomes to build the evidence base.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  if (totalDeviceRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement device access assessments for every child and begin recording what technology each child has access to, its condition, and whether it meets their needs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (totalSafetyRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a structured internet safety education programme covering all key online risk areas -- document sessions, engagement, and understanding for every child.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (totalSkillsRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Assess every child's digital skills baseline and create individualised development plans with clear progression targets and regular review points.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 -- Education",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: DigitalInclusionInsight[] = [];

  // --- Critical insights ---

  if (deviceAccessRate < 50 && totalDeviceRecords > 0) {
    insights.push({
      text: `Only ${deviceAccessRate}% of devices accessible when needed. Ofsted will view widespread device inaccessibility as evidence of digital exclusion -- children cannot participate fully in education, communication, or personal development without reliable technology access. This is a direct failure under Reg 5.`,
      severity: "critical",
    });
  }

  if (below(internetSafetyRate, 50) && totalSafetyRecords > 0) {
    insights.push({
      text: `Internet safety rate at only ${internetSafetyRate}%. Children are not adequately equipped to navigate the online world safely. Ofsted considers robust online safety education a fundamental safeguarding responsibility -- this represents a significant gap in the home's duty of care under Reg 5.`,
      severity: "critical",
    });
  }

  if (assistiveTechnologyRate < 50 && needsIdentified > 0) {
    insights.push({
      text: `Only ${assistiveTechnologyRate}% of identified assistive technology needs met. Children with additional needs are being digitally excluded -- failing to provide necessary assistive technology undermines their access to education, communication, and independence. Ofsted will view this as a failure of both Reg 5 and equalities duties.`,
      severity: "critical",
    });
  }

  if (below(technologyLearningRate, 30) && totalLearningRecords > 0) {
    insights.push({
      text: `Technology-supported learning rate at only ${technologyLearningRate}%. Technology is failing to enhance children's education -- without effective digital learning support, children miss out on the educational benefits of technology that their peers take for granted. This undermines Reg 8 compliance.`,
      severity: "critical",
    });
  }

  if (filterRate < 60 && totalDeviceRecords > 0) {
    insights.push({
      text: `Only ${filterRate}% of devices have age-appropriate filters. Significant numbers of devices lack basic online safeguarding controls -- children may be exposed to harmful content including pornography, extremist material, or online predators. This is a serious safeguarding concern.`,
      severity: "critical",
    });
  }

  if (totalDeviceRecords === 0 && totalSafetyRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No device access or internet safety records despite children being on placement. Ofsted may interpret the absence of records as evidence that children's digital access has not been assessed and online safety education has not been delivered -- this is a significant omission under Reg 5 and Reg 8.",
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (deviceAccessRate >= 50 && deviceAccessRate < 70 && totalDeviceRecords > 0) {
    insights.push({
      text: `Device accessibility at ${deviceAccessRate}% -- improving but some children cannot reliably access technology when they need it. Each access gap represents a missed opportunity for education, communication, or personal development.`,
      severity: "warning",
    });
  }

  if (meets(digitalSkillsRate, 50) && below(digitalSkillsRate, 80) && totalSkillsRecords > 0) {
    insights.push({
      text: `Digital skills rate at ${digitalSkillsRate}% -- plans and sessions are partially in place but not yet consistently driving digital competence development for all children.`,
      severity: "warning",
    });
  }

  if (assistiveTechnologyRate >= 50 && assistiveTechnologyRate < 80 && needsIdentified > 0) {
    insights.push({
      text: `Assistive technology provision at ${assistiveTechnologyRate}% -- while improving, some children with additional needs still lack the technology they require for equitable digital access.`,
      severity: "warning",
    });
  }

  if (meets(internetSafetyRate, 50) && below(internetSafetyRate, 70) && totalSafetyRecords > 0) {
    insights.push({
      text: `Internet safety rate at ${internetSafetyRate}% -- some children are not consistently engaging with or demonstrating understanding of online safety concepts. The home should review delivery methods to improve impact.`,
      severity: "warning",
    });
  }

  if (meets(technologyLearningRate, 30) && below(technologyLearningRate, 70) && totalLearningRecords > 0) {
    insights.push({
      text: `Technology-supported learning at ${technologyLearningRate}% -- technology is only partially supporting children's education. Consider how digital tools can be better integrated into homework support, revision, and independent learning.`,
      severity: "warning",
    });
  }

  if (meets(childConfidenceRate, 50) && below(childConfidenceRate, 80) && confidenceDenominator > 0) {
    insights.push({
      text: `Child digital confidence at ${childConfidenceRate}% -- while some confidence is developing, children need more support to feel fully capable and safe navigating the digital world.`,
      severity: "warning",
    });
  }

  if (filterRate >= 60 && filterRate < 80 && totalDeviceRecords > 0) {
    insights.push({
      text: `${filterRate}% of devices have age-appropriate filters -- some devices lack safeguarding controls. Even a small proportion of unfiltered devices creates online safety risk.`,
      severity: "warning",
    });
  }

  if (learningBarrierRate >= 30 && totalLearningRecords > 0) {
    insights.push({
      text: `Barriers encountered in ${learningBarrierRate}% of technology-supported learning sessions -- recurring obstacles suggest systemic issues with connectivity, device quality, or staff support that need targeted resolution.`,
      severity: "warning",
    });
  }

  if (deviceIssueRate >= 30 && totalDeviceRecords > 0) {
    insights.push({
      text: `Issues reported with ${deviceIssueRate}% of devices -- persistent technology problems undermine children's trust in the home's commitment to their digital inclusion.`,
      severity: "warning",
    });
  }

  // --- Diversity insight ---
  const skillAreas = new Set(
    digital_skills_records.map((r) => r.skill_area).filter((s) => s),
  );
  if (skillAreas.size >= 5) {
    insights.push({
      text: `Digital skills development covers ${skillAreas.size} distinct skill areas -- this breadth requires ongoing assessment of individual children's needs and tailored progression pathways to ensure no child is left behind.`,
      severity: "warning",
    });
  }

  // --- Positive insights ---

  if (digital_inclusion_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding technology and digital inclusion -- children have equitable device access, are developing digital skills, receive comprehensive internet safety education, benefit from assistive technology where needed, and use technology to enhance their learning. This is strong evidence for Reg 5 and Reg 8 compliance.",
      severity: "positive",
    });
  }

  if (deviceAccessRate >= 90 && filterRate >= 90 && totalDeviceRecords > 0) {
    insights.push({
      text: `Device accessibility at ${deviceAccessRate}% with ${filterRate}% age-appropriate filtering -- the home provides comprehensive, safe technology access. Ofsted will recognise this as evidence of genuine digital inclusion combined with robust online safeguarding.`,
      severity: "positive",
    });
  }

  if (meets(internetSafetyRate, 90) && understandingRate >= 90 && totalSafetyRecords > 0) {
    insights.push({
      text: `${internetSafetyRate}% internet safety rate with ${understandingRate}% demonstrated understanding -- children are not only receiving online safety education but genuinely internalising it. This demonstrates the home's commitment to empowering children to keep themselves safe online.`,
      severity: "positive",
    });
  }

  if (meets(digitalSkillsRate, 80) && improvementRate >= 80 && totalSkillsRecords > 0) {
    insights.push({
      text: `Digital skills development at ${digitalSkillsRate}% with ${improvementRate}% showing skill improvement -- children are making genuine, measurable progress in their digital competence. This evidences the home's investment in preparing children for a digital world.`,
      severity: "positive",
    });
  }

  if (assistiveTechnologyRate >= 90 && meets(effectivenessAvg, 4.0) && needsIdentified > 0) {
    insights.push({
      text: `${assistiveTechnologyRate}% assistive technology provision with effectiveness averaging ${effectivenessAvg}/5 -- children with additional needs have the technology they require and it is working well. This is exemplary inclusive practice.`,
      severity: "positive",
    });
  }

  if (meets(childConfidenceRate, 80) && confidenceDenominator > 0) {
    insights.push({
      text: `Child digital confidence at ${childConfidenceRate}% -- children feel confident, capable, and safe in the digital world. This level of confidence reflects the home's investment in both skills development and online safety education.`,
      severity: "positive",
    });
  }

  if (meets(technologyLearningRate, 90) && meets(learningSatisfactionAvg, 4.0) && totalLearningRecords > 0) {
    insights.push({
      text: `Technology-supported learning at ${technologyLearningRate}% with child satisfaction averaging ${learningSatisfactionAvg}/5 -- technology is genuinely enhancing children's educational experience and outcomes. Ofsted will recognise this as evidence of how the home uses all available resources to support children's education.`,
      severity: "positive",
    });
  }

  if (staffSupportRate >= 90 && learningFacilitationRate >= 90 && totalSkillsRecords > 0 && totalLearningRecords > 0) {
    insights.push({
      text: `Staff support digital skills at ${staffSupportRate}% and facilitate technology learning at ${learningFacilitationRate}% -- the workforce is actively engaged in children's digital development. This demonstrates a whole-home commitment to digital inclusion.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (digital_inclusion_rating === "outstanding") {
    headline =
      "Outstanding technology and digital inclusion -- children have equitable access, strong digital skills, robust online safety awareness, and technology effectively supports their learning.";
  } else if (digital_inclusion_rating === "good") {
    headline = `Good technology and digital inclusion -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (digital_inclusion_rating === "adequate") {
    headline = `Adequate technology and digital inclusion -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure all children benefit from equitable digital access and online safety education.`;
  } else {
    headline = `Technology and digital inclusion is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children are not digitally excluded and are safe online.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    digital_inclusion_rating,
    digital_inclusion_score: score,
    headline,
    device_access_rate: deviceAccessRate,
    digital_skills_rate: digitalSkillsRate,
    assistive_technology_rate: assistiveTechnologyRate,
    internet_safety_rate: internetSafetyRate,
    technology_learning_rate: technologyLearningRate,
    child_confidence_rate: childConfidenceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
