// ==============================================================================
// CORNERSTONE -- SMOKING CESSATION & VAPING PREVENTION SERVICE
// Tracks smoking cessation support, vaping prevention, NRT provision, education
// sessions, GP and stop smoking service referrals, harm reduction discussions,
// peer pressure support, and environmental compliance for looked-after children.
// Covers cigarettes, roll-up tobacco, e-cigarettes/vapes (nicotine and non-
// nicotine), shisha, and nicotine pouches.
//
// Covers: Initial assessment, cessation support sessions, NRT provision, vaping
// assessment, vaping cessation support, education sessions, GP referrals, stop
// smoking service referrals, harm reduction discussions, peer pressure support,
// policy reviews, environmental checks, relapse support, progress reviews,
// usage frequency monitoring, motivation to quit staging, and smoke-free
// premises compliance.
//
// UK Regulatory Framework:
// CHR 2015 Reg 10 (health/wellbeing),
// CHR 2015 Reg 12 (protection),
// NICE PH23 (smoking prevention),
// NICE NG209 (tobacco harm reduction),
// SCCIF: Health — "The home supports children's physical health."
// Health Act 2006 (smoke-free premises),
// Tobacco and Vapes Bill 2024.
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const RECORD_TYPES = [
  "Initial Assessment",
  "Cessation Support Session",
  "NRT Provision",
  "Vaping Assessment",
  "Vaping Cessation Support",
  "Education Session",
  "GP Referral",
  "Stop Smoking Service Referral",
  "Harm Reduction Discussion",
  "Peer Pressure Support",
  "Policy Review",
  "Environmental Check",
  "Relapse Support",
  "Progress Review",
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const SUBSTANCES = [
  "Cigarettes",
  "Roll-Up Tobacco",
  "E-Cigarette/Vape — Nicotine",
  "E-Cigarette/Vape — Non-Nicotine",
  "Shisha",
  "Nicotine Pouches",
  "Unknown/Undisclosed",
] as const;
export type Substance = (typeof SUBSTANCES)[number];

export const USAGE_FREQUENCIES = [
  "Non-User",
  "Experimenter",
  "Occasional",
  "Daily — Light",
  "Daily — Heavy",
  "Former User",
] as const;
export type UsageFrequency = (typeof USAGE_FREQUENCIES)[number];

export const MOTIVATION_STAGES = [
  "Not Ready",
  "Contemplating",
  "Preparing",
  "Actively Quitting",
  "Maintaining",
  "Relapsed",
] as const;
export type MotivationStage = (typeof MOTIVATION_STAGES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const VAPE_SUBSTANCES: Substance[] = [
  "E-Cigarette/Vape — Nicotine",
  "E-Cigarette/Vape — Non-Nicotine",
];

export const TOBACCO_SUBSTANCES: Substance[] = [
  "Cigarettes",
  "Roll-Up Tobacco",
  "Shisha",
];

export const ACTIVE_USER_FREQUENCIES: UsageFrequency[] = [
  "Occasional",
  "Daily — Light",
  "Daily — Heavy",
];

export const DAILY_USER_FREQUENCIES: UsageFrequency[] = [
  "Daily — Light",
  "Daily — Heavy",
];

export const POSITIVE_MOTIVATION_STAGES: MotivationStage[] = [
  "Preparing",
  "Actively Quitting",
  "Maintaining",
];

export const CLINICAL_RECORD_TYPES: RecordType[] = [
  "NRT Provision",
  "GP Referral",
  "Stop Smoking Service Referral",
];

export const SUPPORT_RECORD_TYPES: RecordType[] = [
  "Cessation Support Session",
  "Vaping Cessation Support",
  "Harm Reduction Discussion",
  "Peer Pressure Support",
  "Relapse Support",
];

export const ASSESSMENT_RECORD_TYPES: RecordType[] = [
  "Initial Assessment",
  "Vaping Assessment",
  "Progress Review",
];

// Motivation stage numeric mapping for analysis
const MOTIVATION_NUMERIC: Record<string, number> = {
  "Not Ready": 1,
  "Contemplating": 2,
  "Preparing": 3,
  "Actively Quitting": 4,
  "Maintaining": 5,
  "Relapsed": 0,
};

// Usage frequency severity mapping
const USAGE_SEVERITY: Record<string, number> = {
  "Non-User": 0,
  "Experimenter": 1,
  "Occasional": 2,
  "Daily — Light": 3,
  "Daily — Heavy": 4,
  "Former User": 0,
};

// -- Label maps ---------------------------------------------------------------

export const RECORD_TYPE_LABELS: { type: RecordType; label: string }[] = [
  { type: "Initial Assessment", label: "Initial Assessment" },
  { type: "Cessation Support Session", label: "Cessation Support Session" },
  { type: "NRT Provision", label: "NRT Provision" },
  { type: "Vaping Assessment", label: "Vaping Assessment" },
  { type: "Vaping Cessation Support", label: "Vaping Cessation Support" },
  { type: "Education Session", label: "Education Session" },
  { type: "GP Referral", label: "GP Referral" },
  { type: "Stop Smoking Service Referral", label: "Stop Smoking Service Referral" },
  { type: "Harm Reduction Discussion", label: "Harm Reduction Discussion" },
  { type: "Peer Pressure Support", label: "Peer Pressure Support" },
  { type: "Policy Review", label: "Policy Review" },
  { type: "Environmental Check", label: "Environmental Check" },
  { type: "Relapse Support", label: "Relapse Support" },
  { type: "Progress Review", label: "Progress Review" },
];

export const SUBSTANCE_LABELS: { substance: Substance; label: string }[] = [
  { substance: "Cigarettes", label: "Cigarettes" },
  { substance: "Roll-Up Tobacco", label: "Roll-Up Tobacco" },
  { substance: "E-Cigarette/Vape — Nicotine", label: "E-Cigarette / Vape (Nicotine)" },
  { substance: "E-Cigarette/Vape — Non-Nicotine", label: "E-Cigarette / Vape (Non-Nicotine)" },
  { substance: "Shisha", label: "Shisha" },
  { substance: "Nicotine Pouches", label: "Nicotine Pouches" },
  { substance: "Unknown/Undisclosed", label: "Unknown / Undisclosed" },
];

export const USAGE_FREQUENCY_LABELS: { frequency: UsageFrequency; label: string }[] = [
  { frequency: "Non-User", label: "Non-User" },
  { frequency: "Experimenter", label: "Experimenter" },
  { frequency: "Occasional", label: "Occasional" },
  { frequency: "Daily — Light", label: "Daily (Light)" },
  { frequency: "Daily — Heavy", label: "Daily (Heavy)" },
  { frequency: "Former User", label: "Former User" },
];

export const MOTIVATION_STAGE_LABELS: { stage: MotivationStage; label: string }[] = [
  { stage: "Not Ready", label: "Not Ready" },
  { stage: "Contemplating", label: "Contemplating" },
  { stage: "Preparing", label: "Preparing" },
  { stage: "Actively Quitting", label: "Actively Quitting" },
  { stage: "Maintaining", label: "Maintaining" },
  { stage: "Relapsed", label: "Relapsed" },
];

// -- Row type -----------------------------------------------------------------

export interface SmokingVapingManagementRow {
  id: string;
  home_id: string;
  child_name: string;
  record_date: string;
  recorded_by: string;
  record_type: RecordType;
  substance: Substance;
  usage_frequency: UsageFrequency;
  motivation_to_quit: MotivationStage;
  nrt_provided: boolean;
  gp_consulted: boolean;
  young_person_engaged: boolean;
  harm_reduction_approach: boolean;
  education_provided: boolean;
  peer_influence_addressed: boolean;
  smoke_free_premises_compliant: boolean;
  age_verified: boolean;
  social_worker_informed: boolean;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateSmokingVapingManagement(input: {
  childName?: string;
  recordDate?: string;
  recordedBy?: string;
  recordType?: string;
  substance?: string;
  usageFrequency?: string;
  motivationToQuit?: string;
  nrtProvided?: boolean;
  gpConsulted?: boolean;
  youngPersonEngaged?: boolean;
  smokeFreePremisesCompliant?: boolean;
  ageVerified?: boolean;
  socialWorkerInformed?: boolean;
  nextReviewDate?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.recordDate) {
    errors.push("Record date is required");
  } else {
    const dateObj = new Date(input.recordDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Record date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Record date cannot be in the future");
    }
  }

  if (!input.recordedBy || input.recordedBy.trim().length === 0) {
    errors.push("Recorded by (staff member) is required");
  }

  if (
    !input.recordType ||
    !(RECORD_TYPES as readonly string[]).includes(input.recordType)
  ) {
    errors.push(`Record type must be one of: ${RECORD_TYPES.join(", ")}`);
  }

  if (
    !input.substance ||
    !(SUBSTANCES as readonly string[]).includes(input.substance)
  ) {
    errors.push(`Substance must be one of: ${SUBSTANCES.join(", ")}`);
  }

  if (
    !input.usageFrequency ||
    !(USAGE_FREQUENCIES as readonly string[]).includes(input.usageFrequency)
  ) {
    errors.push(`Usage frequency must be one of: ${USAGE_FREQUENCIES.join(", ")}`);
  }

  if (
    !input.motivationToQuit ||
    !(MOTIVATION_STAGES as readonly string[]).includes(input.motivationToQuit)
  ) {
    errors.push(`Motivation to quit must be one of: ${MOTIVATION_STAGES.join(", ")}`);
  }

  // Business rule: Smoke-free premises compliance is mandatory
  if (input.smokeFreePremisesCompliant === false) {
    errors.push("Smoke-free premises non-compliance detected — Health Act 2006 requires all enclosed and substantially enclosed workplaces, including children's homes, to be smoke-free. This is a legal requirement and must be rectified immediately");
  }

  // Business rule: Age verification is mandatory
  if (input.ageVerified === false) {
    errors.push("Age verification must be confirmed — Tobacco and Vapes Bill 2024 and existing legislation prohibit the sale of tobacco and vaping products to under-18s. The home must confirm the child's age status for legal compliance records");
  }

  // Business rule: NRT should only be provided with GP consultation
  if (input.nrtProvided === true && input.gpConsulted === false) {
    errors.push("NRT (Nicotine Replacement Therapy) should not be provided without GP consultation — NICE NG209 recommends that NRT for young people is prescribed and supervised by a healthcare professional");
  }

  // Business rule: Daily heavy users should have GP referral
  if (
    input.usageFrequency === "Daily — Heavy" &&
    input.gpConsulted === false &&
    input.recordType !== "Initial Assessment"
  ) {
    errors.push("Daily heavy user has not been referred to GP — NICE PH23 and NG209 recommend that heavy users receive professional cessation support. A GP referral should be made as a priority for health protection under CHR 2015 Reg 10");
  }

  // Business rule: Social worker should be informed for daily users
  if (
    input.usageFrequency &&
    (DAILY_USER_FREQUENCIES as string[]).includes(input.usageFrequency) &&
    input.socialWorkerInformed === false
  ) {
    errors.push("Social worker should be informed when a child is a daily smoker/vaper — this is a significant health concern that should be recorded in the care plan and communicated to the allocated social worker under CHR 2015 Reg 10");
  }

  // Business rule: Next review date should be set for active users
  if (
    input.usageFrequency &&
    (ACTIVE_USER_FREQUENCIES as string[]).includes(input.usageFrequency) &&
    !input.nextReviewDate &&
    input.recordType !== "Environmental Check" &&
    input.recordType !== "Policy Review"
  ) {
    errors.push("Next review date should be set for active smokers/vapers — ongoing monitoring is essential to track progress, adjust support, and identify relapse early");
  }

  // Business rule: Vaping assessment should use vape substance
  if (
    input.recordType === "Vaping Assessment" &&
    input.substance &&
    !(VAPE_SUBSTANCES as string[]).includes(input.substance) &&
    input.substance !== "Unknown/Undisclosed"
  ) {
    errors.push("Vaping Assessment record type should typically be used with an e-cigarette/vape substance — consider whether the correct record type has been selected");
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: SmokingVapingManagementRow[],
): {
  total_records: number;
  by_record_type: Record<string, number>;
  by_substance: Record<string, number>;
  by_usage_frequency: Record<string, number>;
  by_motivation_stage: Record<string, number>;
  nrt_rate: number;
  gp_rate: number;
  engagement_rate: number;
  education_rate: number;
  compliance_rate: number;
  active_quitters_count: number;
  former_user_count: number;
  unique_children: number;
  relapse_count: number;
  harm_reduction_rate: number;
  peer_influence_rate: number;
  social_worker_informed_rate: number;
  daily_user_count: number;
  vape_user_count: number;
  tobacco_user_count: number;
  average_motivation_score: number;
  clinical_referral_count: number;
} {
  const total = rows.length;

  // Unique children
  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Record type breakdown
  const byRecordType: Record<string, number> = {};
  for (const rt of RECORD_TYPES) byRecordType[rt] = 0;
  for (const r of rows)
    byRecordType[r.record_type] = (byRecordType[r.record_type] || 0) + 1;

  // Substance breakdown
  const bySubstance: Record<string, number> = {};
  for (const s of SUBSTANCES) bySubstance[s] = 0;
  for (const r of rows)
    bySubstance[r.substance] = (bySubstance[r.substance] || 0) + 1;

  // Usage frequency breakdown
  const byUsageFrequency: Record<string, number> = {};
  for (const uf of USAGE_FREQUENCIES) byUsageFrequency[uf] = 0;
  for (const r of rows)
    byUsageFrequency[r.usage_frequency] = (byUsageFrequency[r.usage_frequency] || 0) + 1;

  // Motivation stage breakdown
  const byMotivationStage: Record<string, number> = {};
  for (const ms of MOTIVATION_STAGES) byMotivationStage[ms] = 0;
  for (const r of rows)
    byMotivationStage[r.motivation_to_quit] = (byMotivationStage[r.motivation_to_quit] || 0) + 1;

  // Boolean rates
  const nrtRate = total > 0
    ? Math.round((rows.filter((r) => r.nrt_provided).length / total) * 1000) / 10
    : 0;

  const gpRate = total > 0
    ? Math.round((rows.filter((r) => r.gp_consulted).length / total) * 1000) / 10
    : 0;

  const engagementRate = total > 0
    ? Math.round((rows.filter((r) => r.young_person_engaged).length / total) * 1000) / 10
    : 0;

  const educationRate = total > 0
    ? Math.round((rows.filter((r) => r.education_provided).length / total) * 1000) / 10
    : 0;

  const complianceRate = total > 0
    ? Math.round((rows.filter((r) => r.smoke_free_premises_compliant).length / total) * 1000) / 10
    : 0;

  const harmReductionRate = total > 0
    ? Math.round((rows.filter((r) => r.harm_reduction_approach).length / total) * 1000) / 10
    : 0;

  const peerInfluenceRate = total > 0
    ? Math.round((rows.filter((r) => r.peer_influence_addressed).length / total) * 1000) / 10
    : 0;

  const socialWorkerInformedRate = total > 0
    ? Math.round((rows.filter((r) => r.social_worker_informed).length / total) * 1000) / 10
    : 0;

  // Active quitters count
  const activeQuittersCount = rows.filter(
    (r) => r.motivation_to_quit === "Actively Quitting",
  ).length;

  // Former user (success) count
  const formerUserCount = rows.filter(
    (r) => r.usage_frequency === "Former User",
  ).length;

  // Relapse count
  const relapseCount = rows.filter(
    (r) => r.motivation_to_quit === "Relapsed" || r.record_type === "Relapse Support",
  ).length;

  // Daily user count
  const dailyUserCount = rows.filter(
    (r) => (DAILY_USER_FREQUENCIES as string[]).includes(r.usage_frequency),
  ).length;

  // Vape user count
  const vapeUserCount = rows.filter(
    (r) => (VAPE_SUBSTANCES as string[]).includes(r.substance),
  ).length;

  // Tobacco user count
  const tobaccoUserCount = rows.filter(
    (r) => (TOBACCO_SUBSTANCES as string[]).includes(r.substance),
  ).length;

  // Average motivation score
  const motivationRows = rows.filter(
    (r) => r.motivation_to_quit !== "Not Ready" || (ACTIVE_USER_FREQUENCIES as string[]).includes(r.usage_frequency),
  );
  const averageMotivationScore = motivationRows.length > 0
    ? Math.round(
        (motivationRows.reduce(
          (sum, r) => sum + (MOTIVATION_NUMERIC[r.motivation_to_quit] ?? 1),
          0,
        ) / motivationRows.length) * 10,
      ) / 10
    : 0;

  // Clinical referral count
  const clinicalReferralCount = rows.filter(
    (r) => (CLINICAL_RECORD_TYPES as string[]).includes(r.record_type),
  ).length;

  return {
    total_records: total,
    by_record_type: byRecordType,
    by_substance: bySubstance,
    by_usage_frequency: byUsageFrequency,
    by_motivation_stage: byMotivationStage,
    nrt_rate: nrtRate,
    gp_rate: gpRate,
    engagement_rate: engagementRate,
    education_rate: educationRate,
    compliance_rate: complianceRate,
    active_quitters_count: activeQuittersCount,
    former_user_count: formerUserCount,
    unique_children: uniqueChildren.size,
    relapse_count: relapseCount,
    harm_reduction_rate: harmReductionRate,
    peer_influence_rate: peerInfluenceRate,
    social_worker_informed_rate: socialWorkerInformedRate,
    daily_user_count: dailyUserCount,
    vape_user_count: vapeUserCount,
    tobacco_user_count: tobaccoUserCount,
    average_motivation_score: averageMotivationScore,
    clinical_referral_count: clinicalReferralCount,
  };
}

export function computeAlerts(
  rows: SmokingVapingManagementRow[],
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

  // Critical: Smoke-free premises non-compliance
  for (const r of rows) {
    if (!r.smoke_free_premises_compliant) {
      alerts.push({
        type: "premises_non_compliant",
        severity: "critical",
        message: `Smoke-free premises non-compliance recorded on ${r.record_date} by ${r.recorded_by} — Health Act 2006 requires children's homes to be completely smoke-free in all enclosed and substantially enclosed areas. This is a legal requirement with potential for prosecution and fines. Immediate action required`,
        record_id: r.id,
      });
    }
  }

  // Critical: Daily heavy user without GP referral
  for (const r of rows) {
    if (
      r.usage_frequency === "Daily — Heavy" &&
      !r.gp_consulted
    ) {
      alerts.push({
        type: "heavy_user_no_gp",
        severity: "critical",
        message: `${r.child_name} is a daily heavy user of ${r.substance} with no GP consultation recorded on ${r.record_date} — NICE PH23 and NG209 require professional cessation support for heavy users. CHR 2015 Reg 10 (health/wellbeing) mandates the home to promote physical health. A GP referral must be made urgently`,
        record_id: r.id,
      });
    }
  }

  // Critical: NRT provided without GP
  for (const r of rows) {
    if (r.nrt_provided && !r.gp_consulted) {
      alerts.push({
        type: "nrt_without_gp",
        severity: "critical",
        message: `NRT was provided to ${r.child_name} on ${r.record_date} without GP consultation — NICE NG209 recommends NRT for young people is prescribed and supervised by a healthcare professional. NRT should not be provided without medical oversight, particularly for under-18s`,
        record_id: r.id,
      });
    }
  }

  // Critical: Age verification not confirmed
  for (const r of rows) {
    if (!r.age_verified) {
      alerts.push({
        type: "age_not_verified",
        severity: "critical",
        message: `Age verification not confirmed for ${r.child_name} on ${r.record_date} — the Tobacco and Vapes Bill 2024 and existing legislation prohibit the sale of tobacco and vaping products to under-18s. Age status must be confirmed and recorded for legal compliance`,
        record_id: r.id,
      });
    }
  }

  // High: Daily user not reported to social worker
  for (const r of rows) {
    if (
      (DAILY_USER_FREQUENCIES as string[]).includes(r.usage_frequency) &&
      !r.social_worker_informed
    ) {
      alerts.push({
        type: "daily_user_sw_not_informed",
        severity: "high",
        message: `${r.child_name} is a daily ${r.substance} user and social worker has not been informed (${r.record_date}) — daily smoking/vaping is a significant health concern that must be recorded in the care plan and communicated to the allocated social worker under CHR 2015 Reg 10`,
        record_id: r.id,
      });
    }
  }

  // High: Relapse without follow-up support
  for (const r of rows) {
    if (r.motivation_to_quit === "Relapsed") {
      const hasRelapseSupport = rows.some(
        (other) =>
          other.child_name.toLowerCase().trim() === r.child_name.toLowerCase().trim() &&
          other.record_type === "Relapse Support" &&
          new Date(other.record_date) >= new Date(r.record_date),
      );
      if (!hasRelapseSupport) {
        alerts.push({
          type: "relapse_no_support",
          severity: "high",
          message: `${r.child_name} has relapsed (${r.record_date}) with no relapse support session recorded — NICE NG209 recommends continued support after relapse. Relapse is a normal part of quitting and should be met with encouragement, not judgement. Schedule a relapse support session`,
          record_id: r.id,
        });
      }
    }
  }

  // High: Young person not engaged
  for (const r of rows) {
    if (
      !r.young_person_engaged &&
      (ACTIVE_USER_FREQUENCIES as string[]).includes(r.usage_frequency)
    ) {
      alerts.push({
        type: "active_user_disengaged",
        severity: "high",
        message: `${r.child_name} is an active ${r.substance} user but is not engaged in cessation support (${r.record_date}) — explore motivational interviewing approaches per NICE PH23. The young person's autonomy must be respected but the home has a duty to promote health under CHR 2015 Reg 10`,
        record_id: r.id,
      });
    }
  }

  // High: Multiple children using — peer influence concern
  const childSubstanceMap = new Map<string, SmokingVapingManagementRow[]>();
  for (const r of rows) {
    if ((ACTIVE_USER_FREQUENCIES as string[]).includes(r.usage_frequency)) {
      const key = r.child_name.toLowerCase().trim();
      if (!childSubstanceMap.has(key)) childSubstanceMap.set(key, []);
      childSubstanceMap.get(key)!.push(r);
    }
  }
  if (childSubstanceMap.size >= 3) {
    const peerAddressedCount = rows.filter((r) => r.peer_influence_addressed).length;
    if (peerAddressedCount / rows.length < 0.3) {
      alerts.push({
        type: "peer_influence_concern",
        severity: "high",
        message: `${childSubstanceMap.size} children are active smokers/vapers but peer influence has only been addressed in ${Math.round((peerAddressedCount / rows.length) * 100)}% of records — when multiple children in a home are using tobacco/vape products, peer influence is a significant factor. CHR 2015 Reg 12 (protection) requires the home to address peer pressure dynamics`,
      });
    }
  }

  // High: Overdue reviews for active users
  const today = new Date();
  for (const r of rows) {
    if (
      r.next_review_date &&
      (ACTIVE_USER_FREQUENCIES as string[]).includes(r.usage_frequency)
    ) {
      const reviewDate = new Date(r.next_review_date);
      if (reviewDate < today) {
        const daysOverdue = Math.floor((today.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: "overdue_review",
          severity: "high",
          message: `Smoking/vaping review for ${r.child_name} is ${daysOverdue} days overdue (due ${r.next_review_date}) — active users require regular monitoring to track progress and adjust support. Delayed reviews may miss opportunities for intervention`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: Low education rate
  const educationCount = rows.filter((r) => r.education_provided).length;
  if (total >= 5 && educationCount / total < 0.3) {
    alerts.push({
      type: "low_education_rate",
      severity: "medium",
      message: `Education provided in only ${Math.round((educationCount / total) * 100)}% of records — NICE PH23 emphasises the importance of education and prevention in smoking/vaping. All children, including non-users, should receive age-appropriate education about the health risks of tobacco and vaping products`,
    });
  }

  // Medium: No harm reduction approach for established users
  const establishedUsers = rows.filter(
    (r) => (DAILY_USER_FREQUENCIES as string[]).includes(r.usage_frequency),
  );
  const harmReductionForEstablished = establishedUsers.filter(
    (r) => r.harm_reduction_approach,
  ).length;
  if (establishedUsers.length >= 3 && harmReductionForEstablished / establishedUsers.length < 0.3) {
    alerts.push({
      type: "low_harm_reduction",
      severity: "medium",
      message: `Harm reduction approach used in only ${Math.round((harmReductionForEstablished / establishedUsers.length) * 100)}% of daily user records — NICE NG209 supports harm reduction as a valid approach when young people are not ready to quit completely. Switching from cigarettes to regulated vaping products may reduce harm, though the goal should remain full cessation`,
    });
  }

  // Medium: High vaping rate without assessment
  const vapeRecords = rows.filter(
    (r) => (VAPE_SUBSTANCES as string[]).includes(r.substance),
  );
  const vapingAssessments = rows.filter(
    (r) => r.record_type === "Vaping Assessment",
  ).length;
  if (vapeRecords.length >= 5 && vapingAssessments === 0) {
    alerts.push({
      type: "vaping_no_assessment",
      severity: "medium",
      message: `${vapeRecords.length} vaping records but no dedicated vaping assessments — the Tobacco and Vapes Bill 2024 signals increasing regulatory concern about youth vaping. A specific vaping assessment should be conducted to understand patterns, motivations, and the products being used`,
    });
  }

  // Medium: No environmental checks recorded
  const envCheckCount = rows.filter(
    (r) => r.record_type === "Environmental Check",
  ).length;
  if (total >= 10 && envCheckCount === 0) {
    alerts.push({
      type: "no_environmental_checks",
      severity: "medium",
      message: "No environmental checks have been recorded — Health Act 2006 requires smoke-free premises and regular checks demonstrate compliance. Environmental checks should verify that smoke-free signage is displayed, designated outdoor areas are appropriate, and no smoking/vaping is occurring in enclosed spaces",
    });
  }

  return alerts;
}

export function generateAriaInsights(
  rows: SmokingVapingManagementRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const substanceBreakdown = Object.entries(metrics.by_substance)
    .filter(([, count]) => count > 0)
    .map(([substance, count]) => `${substance}: ${count}`)
    .join(", ");

  const frequencyBreakdown = Object.entries(metrics.by_usage_frequency)
    .filter(([, count]) => count > 0)
    .map(([freq, count]) => `${freq}: ${count}`)
    .join(", ");

  const motivationBreakdown = Object.entries(metrics.by_motivation_stage)
    .filter(([, count]) => count > 0)
    .map(([stage, count]) => `${stage}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} smoking/vaping ${metrics.total_records === 1 ? "record" : "records"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Daily users: ${metrics.daily_user_count}. ` +
      `Tobacco users: ${metrics.tobacco_user_count}. ` +
      `Vape users: ${metrics.vape_user_count}. ` +
      `Active quitters: ${metrics.active_quitters_count}. ` +
      `Former users: ${metrics.former_user_count}. ` +
      `Relapses: ${metrics.relapse_count}. ` +
      `Clinical referrals: ${metrics.clinical_referral_count}. ` +
      `Substances: ${substanceBreakdown || "none recorded"}. ` +
      `Usage: ${frequencyBreakdown || "none"}. ` +
      `Motivation: ${motivationBreakdown || "none"}.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Engagement rate: ${metrics.engagement_rate}%. ` +
        `NRT rate: ${metrics.nrt_rate}%. ` +
        `GP consultation rate: ${metrics.gp_rate}%. ` +
        `Education rate: ${metrics.education_rate}%. ` +
        `Premises compliance: ${metrics.compliance_rate}%. ` +
        `Harm reduction: ${metrics.harm_reduction_rate}%. ` +
        `Peer influence addressed: ${metrics.peer_influence_rate}%. ` +
        `Social worker informed: ${metrics.social_worker_informed_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority smoking/vaping alerts. ` +
        `Engagement rate: ${metrics.engagement_rate}%. ` +
        `NRT rate: ${metrics.nrt_rate}%. ` +
        `GP consultation rate: ${metrics.gp_rate}%. ` +
        `Education rate: ${metrics.education_rate}%. ` +
        `Premises compliance: ${metrics.compliance_rate}%. ` +
        `Harm reduction: ${metrics.harm_reduction_rate}%. ` +
        `Peer influence addressed: ${metrics.peer_influence_rate}%. ` +
        `Continue preventive education per NICE PH23.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.compliance_rate < 100 && metrics.total_records > 0) {
    insights.push(
      `[reflect] Smoke-free premises compliance is ${metrics.compliance_rate}%, which is below ` +
        `the required 100%. The Health Act 2006 makes it a criminal offence to smoke in ` +
        `enclosed public places, which includes children's homes. Is the home enforcing ` +
        `the smoke-free policy consistently? Are there clear boundaries about where ` +
        `smoking is and is not permitted? Are staff who smoke doing so away from the ` +
        `premises and out of sight of children? Ofsted inspectors will check smoke-free ` +
        `compliance as part of the physical environment assessment.`,
    );
  } else if (metrics.daily_user_count > 0 && metrics.gp_rate < 30) {
    insights.push(
      `[reflect] There are ${metrics.daily_user_count} daily user records but GP consultation ` +
        `rate is only ${metrics.gp_rate}%. NICE PH23 and NG209 recommend professional ` +
        `cessation support for regular users. Are daily smokers/vapers being offered ` +
        `and encouraged to take up GP appointments and stop smoking service referrals? ` +
        `For looked-after children, the home has a duty under CHR 2015 Reg 10 to ` +
        `promote physical health. Is cessation support being incorporated into health ` +
        `assessments and care planning? Is the home exploring NRT options with GP ` +
        `guidance for those ready to quit?`,
    );
  } else if (metrics.relapse_count > 0 && metrics.total_records > 5) {
    insights.push(
      `[reflect] ${metrics.relapse_count} relapse ${metrics.relapse_count === 1 ? "event has" : "events have"} been ` +
        `recorded. Relapse is a normal and expected part of the quitting process — NICE ` +
        `NG209 emphasises that relapse should not be treated as failure. Is the home ` +
        `responding to relapse with renewed support rather than disappointment? Are ` +
        `relapse triggers being identified and addressed? For looked-after children, ` +
        `trauma, stress, and peer influence are common triggers. Is the home providing ` +
        `alternative coping strategies and addressing the underlying emotional needs ` +
        `that smoking/vaping may be meeting?`,
    );
  } else {
    insights.push(
      `[reflect] How does the home balance its duty to protect children's health (CHR ` +
        `2015 Reg 10) with respecting young people's autonomy and avoiding a punitive ` +
        `approach to smoking/vaping? NICE PH23 is clear that punishment and scare ` +
        `tactics are ineffective — motivational approaches work better. Is the home ` +
        `using evidence-based approaches to prevention and cessation? With the Tobacco ` +
        `and Vapes Bill 2024 signalling a generational shift in tobacco policy, is the ` +
        `home ahead of the curve in its approach to vaping prevention? Are all ` +
        `children receiving preventive education, not just those who are already using?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    recordType?: RecordType;
    substance?: Substance;
    usageFrequency?: UsageFrequency;
    motivationStage?: MotivationStage;
    limit?: number;
  },
): Promise<ServiceResult<SmokingVapingManagementRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_smoking_vaping_management") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.recordType) q = q.eq("record_type", filters.recordType);
  if (filters?.substance) q = q.eq("substance", filters.substance);
  if (filters?.usageFrequency) q = q.eq("usage_frequency", filters.usageFrequency);
  if (filters?.motivationStage) q = q.eq("motivation_to_quit", filters.motivationStage);

  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<SmokingVapingManagementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_smoking_vaping_management") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  recordDate: string;
  recordedBy: string;
  recordType: RecordType;
  substance: Substance;
  usageFrequency: UsageFrequency;
  motivationToQuit: MotivationStage;
  nrtProvided?: boolean;
  gpConsulted?: boolean;
  youngPersonEngaged?: boolean;
  harmReductionApproach?: boolean;
  educationProvided?: boolean;
  peerInfluenceAddressed?: boolean;
  smokeFreePremisesCompliant?: boolean;
  ageVerified?: boolean;
  socialWorkerInformed?: boolean;
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<SmokingVapingManagementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateSmokingVapingManagement({
    childName: input.childName,
    recordDate: input.recordDate,
    recordedBy: input.recordedBy,
    recordType: input.recordType,
    substance: input.substance,
    usageFrequency: input.usageFrequency,
    motivationToQuit: input.motivationToQuit,
    nrtProvided: input.nrtProvided,
    gpConsulted: input.gpConsulted,
    youngPersonEngaged: input.youngPersonEngaged,
    smokeFreePremisesCompliant: input.smokeFreePremisesCompliant,
    ageVerified: input.ageVerified,
    socialWorkerInformed: input.socialWorkerInformed,
    nextReviewDate: input.nextReviewDate,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_smoking_vaping_management") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      record_date: input.recordDate,
      recorded_by: input.recordedBy,
      record_type: input.recordType,
      substance: input.substance,
      usage_frequency: input.usageFrequency,
      motivation_to_quit: input.motivationToQuit,
      nrt_provided: input.nrtProvided ?? false,
      gp_consulted: input.gpConsulted ?? false,
      young_person_engaged: input.youngPersonEngaged ?? true,
      harm_reduction_approach: input.harmReductionApproach ?? false,
      education_provided: input.educationProvided ?? false,
      peer_influence_addressed: input.peerInfluenceAddressed ?? false,
      smoke_free_premises_compliant: input.smokeFreePremisesCompliant ?? true,
      age_verified: input.ageVerified ?? true,
      social_worker_informed: input.socialWorkerInformed ?? false,
      next_review_date: input.nextReviewDate ?? null,
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
    recordDate: string;
    recordedBy: string;
    recordType: RecordType;
    substance: Substance;
    usageFrequency: UsageFrequency;
    motivationToQuit: MotivationStage;
    nrtProvided: boolean;
    gpConsulted: boolean;
    youngPersonEngaged: boolean;
    harmReductionApproach: boolean;
    educationProvided: boolean;
    peerInfluenceAddressed: boolean;
    smokeFreePremisesCompliant: boolean;
    ageVerified: boolean;
    socialWorkerInformed: boolean;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<SmokingVapingManagementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.recordDate !== undefined) mapped.record_date = updates.recordDate;
  if (updates.recordedBy !== undefined) mapped.recorded_by = updates.recordedBy;
  if (updates.recordType !== undefined) mapped.record_type = updates.recordType;
  if (updates.substance !== undefined) mapped.substance = updates.substance;
  if (updates.usageFrequency !== undefined) mapped.usage_frequency = updates.usageFrequency;
  if (updates.motivationToQuit !== undefined) mapped.motivation_to_quit = updates.motivationToQuit;
  if (updates.nrtProvided !== undefined) mapped.nrt_provided = updates.nrtProvided;
  if (updates.gpConsulted !== undefined) mapped.gp_consulted = updates.gpConsulted;
  if (updates.youngPersonEngaged !== undefined) mapped.young_person_engaged = updates.youngPersonEngaged;
  if (updates.harmReductionApproach !== undefined) mapped.harm_reduction_approach = updates.harmReductionApproach;
  if (updates.educationProvided !== undefined) mapped.education_provided = updates.educationProvided;
  if (updates.peerInfluenceAddressed !== undefined) mapped.peer_influence_addressed = updates.peerInfluenceAddressed;
  if (updates.smokeFreePremisesCompliant !== undefined) mapped.smoke_free_premises_compliant = updates.smokeFreePremisesCompliant;
  if (updates.ageVerified !== undefined) mapped.age_verified = updates.ageVerified;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (client.from("cs_smoking_vaping_management") as SB)
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

  const { error } = await (client.from("cs_smoking_vaping_management") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
