// ==============================================================================
// CORNERSTONE -- NEURODIVERSITY & SEND SUPPORT SERVICE
// Tracks neurodiversity and SEND (Special Educational Needs and Disabilities)
// support for looked-after children including autism spectrum conditions,
// ADHD, dyslexia, dyspraxia/DCD, dyscalculia, sensory processing disorder,
// Tourette syndrome, foetal alcohol spectrum disorder, learning disabilities,
// speech and language disorders, social communication difficulties,
// attachment disorders, and complex/multiple conditions.
//
// Covers: Condition assessment and diagnosis tracking, EHCP (Education Health
// Care Plan) monitoring, specialist involvement coordination, reasonable
// adjustments documentation, sensory profile completion, communication plan
// development, behaviour support plan implementation, staff training tracking,
// school liaison, CAMHS involvement, occupational therapy coordination,
// speech and language therapy tracking, social worker notification,
// medication management, transition planning for changes/moves, and
// multi-agency review scheduling.
//
// UK Regulatory Framework:
// CHR 2015 Reg 5 (individual needs),
// CHR 2015 Reg 10 (health and wellbeing),
// SEND Code of Practice 2015,
// Equality Act 2010 (disability),
// Autism Act 2009,
// NICE CG170 (autism in under 19s),
// NICE NG87 (ADHD),
// SCCIF: Experiences & progress — "The home meets SEND children's needs."
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const CONDITION_TYPES = [
  "Autism Spectrum",
  "ADHD",
  "Dyslexia",
  "Dyspraxia/DCD",
  "Dyscalculia",
  "Sensory Processing Disorder",
  "Tourette Syndrome",
  "Foetal Alcohol Spectrum",
  "Learning Disability — Mild",
  "Learning Disability — Moderate",
  "Learning Disability — Severe",
  "Speech & Language Disorder",
  "Social Communication Difficulty",
  "Attachment Disorder",
  "Multiple/Complex",
  "Other",
] as const;
export type ConditionType = (typeof CONDITION_TYPES)[number];

export const DIAGNOSIS_STATUSES = [
  "Formal Diagnosis",
  "Assessment in Progress",
  "Awaiting Assessment",
  "Suspected — No Referral",
  "Parent/Carer Report",
  "School Identified",
  "Not Applicable",
] as const;
export type DiagnosisStatus = (typeof DIAGNOSIS_STATUSES)[number];

export const RECORD_STATUSES = [
  "Active",
  "Under Review",
  "Needs Met",
  "Discharged",
] as const;
export type RecordStatus = (typeof RECORD_STATUSES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const NEURODEVELOPMENTAL_CONDITIONS: ConditionType[] = [
  "Autism Spectrum",
  "ADHD",
  "Tourette Syndrome",
  "Foetal Alcohol Spectrum",
];

export const LEARNING_CONDITIONS: ConditionType[] = [
  "Dyslexia",
  "Dyspraxia/DCD",
  "Dyscalculia",
  "Learning Disability — Mild",
  "Learning Disability — Moderate",
  "Learning Disability — Severe",
];

export const COMMUNICATION_CONDITIONS: ConditionType[] = [
  "Speech & Language Disorder",
  "Social Communication Difficulty",
  "Autism Spectrum",
];

export const CONDITIONS_REQUIRING_SENSORY_PROFILE: ConditionType[] = [
  "Autism Spectrum",
  "Sensory Processing Disorder",
  "ADHD",
];

export const CONDITIONS_REQUIRING_COMMUNICATION_PLAN: ConditionType[] = [
  "Autism Spectrum",
  "Speech & Language Disorder",
  "Social Communication Difficulty",
  "Learning Disability — Moderate",
  "Learning Disability — Severe",
];

// -- Label maps ---------------------------------------------------------------

export const CONDITION_TYPE_LABELS: { type: ConditionType; label: string }[] = [
  { type: "Autism Spectrum", label: "Autism Spectrum Condition" },
  { type: "ADHD", label: "ADHD (Attention Deficit Hyperactivity Disorder)" },
  { type: "Dyslexia", label: "Dyslexia" },
  { type: "Dyspraxia/DCD", label: "Dyspraxia / Developmental Coordination Disorder" },
  { type: "Dyscalculia", label: "Dyscalculia" },
  { type: "Sensory Processing Disorder", label: "Sensory Processing Disorder" },
  { type: "Tourette Syndrome", label: "Tourette Syndrome" },
  { type: "Foetal Alcohol Spectrum", label: "Foetal Alcohol Spectrum Disorder (FASD)" },
  { type: "Learning Disability — Mild", label: "Learning Disability — Mild" },
  { type: "Learning Disability — Moderate", label: "Learning Disability — Moderate" },
  { type: "Learning Disability — Severe", label: "Learning Disability — Severe" },
  { type: "Speech & Language Disorder", label: "Speech & Language Disorder" },
  { type: "Social Communication Difficulty", label: "Social Communication Difficulty" },
  { type: "Attachment Disorder", label: "Attachment Disorder" },
  { type: "Multiple/Complex", label: "Multiple / Complex Needs" },
  { type: "Other", label: "Other" },
];

export const DIAGNOSIS_STATUS_LABELS: { status: DiagnosisStatus; label: string }[] = [
  { status: "Formal Diagnosis", label: "Formal Diagnosis" },
  { status: "Assessment in Progress", label: "Assessment in Progress" },
  { status: "Awaiting Assessment", label: "Awaiting Assessment" },
  { status: "Suspected — No Referral", label: "Suspected — No Referral Made" },
  { status: "Parent/Carer Report", label: "Parent / Carer Report" },
  { status: "School Identified", label: "School Identified" },
  { status: "Not Applicable", label: "Not Applicable" },
];

export const RECORD_STATUS_LABELS: { status: RecordStatus; label: string }[] = [
  { status: "Active", label: "Active" },
  { status: "Under Review", label: "Under Review" },
  { status: "Needs Met", label: "Needs Met" },
  { status: "Discharged", label: "Discharged" },
];

// -- Row type -----------------------------------------------------------------

export interface NeurodiversitySupportRow {
  id: string;
  home_id: string;
  child_name: string;
  assessment_date: string;
  assessor_name: string;
  condition_type: ConditionType;
  diagnosis_status: DiagnosisStatus;
  ehcp_in_place: boolean;
  specialist_involved: boolean;
  specialist_type: string | null;
  reasonable_adjustments: string;
  sensory_profile_completed: boolean;
  communication_plan: boolean;
  behaviour_support_plan: boolean;
  staff_training_completed: boolean;
  school_liaison: boolean;
  camhs_involved: boolean;
  ot_involved: boolean;
  salt_involved: boolean;
  social_worker_informed: boolean;
  medication_managed: boolean;
  medication_details: string | null;
  transition_plan: boolean;
  review_date: string | null;
  status: RecordStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateNeurodiversitySupport(input: {
  childName?: string;
  assessmentDate?: string;
  assessorName?: string;
  conditionType?: string;
  diagnosisStatus?: string;
  specialistInvolved?: boolean;
  specialistType?: string | null;
  reasonableAdjustments?: string;
  sensoryProfileCompleted?: boolean;
  communicationPlan?: boolean;
  medicationManaged?: boolean;
  medicationDetails?: string | null;
  reviewDate?: string | null;
  status?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.assessmentDate) {
    errors.push("Assessment date is required");
  } else {
    const dateObj = new Date(input.assessmentDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Assessment date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Assessment date cannot be in the future");
    }
  }

  if (!input.assessorName || input.assessorName.trim().length === 0) {
    errors.push("Assessor name is required");
  }

  if (!input.conditionType || !(CONDITION_TYPES as readonly string[]).includes(input.conditionType)) {
    errors.push(`Condition type must be one of: ${CONDITION_TYPES.join(", ")}`);
  }

  if (
    input.diagnosisStatus &&
    !(DIAGNOSIS_STATUSES as readonly string[]).includes(input.diagnosisStatus)
  ) {
    errors.push(`Diagnosis status must be one of: ${DIAGNOSIS_STATUSES.join(", ")}`);
  }

  if (input.status && !(RECORD_STATUSES as readonly string[]).includes(input.status)) {
    errors.push(`Status must be one of: ${RECORD_STATUSES.join(", ")}`);
  }

  // Business rule: Specialist involved must have specialist type
  if (input.specialistInvolved && (!input.specialistType || input.specialistType.trim().length === 0)) {
    errors.push("Specialist type is required when a specialist is involved");
  }

  // Business rule: Medication managed must have medication details
  if (input.medicationManaged && (!input.medicationDetails || input.medicationDetails.trim().length === 0)) {
    errors.push("Medication details are required when medication is being managed");
  }

  // Business rule: Conditions requiring sensory profile should have one completed
  if (
    input.conditionType &&
    (CONDITIONS_REQUIRING_SENSORY_PROFILE as string[]).includes(input.conditionType) &&
    input.sensoryProfileCompleted === false
  ) {
    // Advisory only — not blocking, but would appear in alerts
  }

  // Business rule: Conditions requiring communication plan should have one
  if (
    input.conditionType &&
    (CONDITIONS_REQUIRING_COMMUNICATION_PLAN as string[]).includes(input.conditionType) &&
    input.communicationPlan === false
  ) {
    // Advisory only — not blocking, but would appear in alerts
  }

  // Business rule: Reasonable adjustments should be documented for active records
  if (
    input.status === "Active" &&
    (!input.reasonableAdjustments || input.reasonableAdjustments.trim().length === 0)
  ) {
    errors.push("Reasonable adjustments must be documented for active SEND support records per Equality Act 2010");
  }

  // Business rule: Review date should be in the future
  if (input.reviewDate) {
    const reviewDateObj = new Date(input.reviewDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(reviewDateObj.getTime())) {
      errors.push("Review date must be a valid date");
    } else if (reviewDateObj < today) {
      errors.push("Review date should not be in the past");
    }
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: NeurodiversitySupportRow[],
): {
  total_records: number;
  unique_children: number;
  by_condition_type: Record<string, number>;
  by_diagnosis_status: Record<string, number>;
  by_status: Record<string, number>;
  ehcp_rate: number;
  specialist_rate: number;
  sensory_profile_rate: number;
  communication_plan_rate: number;
  behaviour_support_plan_rate: number;
  staff_training_rate: number;
  school_liaison_rate: number;
  camhs_rate: number;
  ot_rate: number;
  salt_rate: number;
  social_worker_informed_rate: number;
  medication_rate: number;
  transition_plan_rate: number;
  active_records: number;
  overdue_reviews: number;
  multi_agency_involvement_rate: number;
} {
  const total = rows.length;
  const activeRows = rows.filter((r) => r.status === "Active");

  // Unique children
  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Condition type breakdown
  const byConditionType: Record<string, number> = {};
  for (const ct of CONDITION_TYPES) byConditionType[ct] = 0;
  for (const r of rows) byConditionType[r.condition_type] = (byConditionType[r.condition_type] || 0) + 1;

  // Diagnosis status breakdown
  const byDiagnosisStatus: Record<string, number> = {};
  for (const ds of DIAGNOSIS_STATUSES) byDiagnosisStatus[ds] = 0;
  for (const r of rows) byDiagnosisStatus[r.diagnosis_status] = (byDiagnosisStatus[r.diagnosis_status] || 0) + 1;

  // Status breakdown
  const byStatus: Record<string, number> = {};
  for (const s of RECORD_STATUSES) byStatus[s] = 0;
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] || 0) + 1;

  // Boolean rates (calculated against total)
  const pct = (count: number) => total > 0 ? Math.round((count / total) * 1000) / 10 : 0;

  const ehcpRate = pct(rows.filter((r) => r.ehcp_in_place).length);
  const specialistRate = pct(rows.filter((r) => r.specialist_involved).length);
  const sensoryProfileRate = pct(rows.filter((r) => r.sensory_profile_completed).length);
  const communicationPlanRate = pct(rows.filter((r) => r.communication_plan).length);
  const behaviourSupportPlanRate = pct(rows.filter((r) => r.behaviour_support_plan).length);
  const staffTrainingRate = pct(rows.filter((r) => r.staff_training_completed).length);
  const schoolLiaisonRate = pct(rows.filter((r) => r.school_liaison).length);
  const camhsRate = pct(rows.filter((r) => r.camhs_involved).length);
  const otRate = pct(rows.filter((r) => r.ot_involved).length);
  const saltRate = pct(rows.filter((r) => r.salt_involved).length);
  const swInformedRate = pct(rows.filter((r) => r.social_worker_informed).length);
  const medicationRate = pct(rows.filter((r) => r.medication_managed).length);
  const transitionPlanRate = pct(rows.filter((r) => r.transition_plan).length);

  // Active records count
  const activeRecords = activeRows.length;

  // Overdue reviews
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueReviews = rows.filter((r) => {
    if (!r.review_date) return false;
    const reviewDate = new Date(r.review_date);
    return reviewDate < today && r.status === "Active";
  }).length;

  // Multi-agency involvement rate: records where at least 2 of CAMHS/OT/SALT/specialist are involved
  const multiAgency = rows.filter((r) => {
    let count = 0;
    if (r.camhs_involved) count++;
    if (r.ot_involved) count++;
    if (r.salt_involved) count++;
    if (r.specialist_involved) count++;
    return count >= 2;
  });
  const multiAgencyRate = pct(multiAgency.length);

  return {
    total_records: total,
    unique_children: uniqueChildren.size,
    by_condition_type: byConditionType,
    by_diagnosis_status: byDiagnosisStatus,
    by_status: byStatus,
    ehcp_rate: ehcpRate,
    specialist_rate: specialistRate,
    sensory_profile_rate: sensoryProfileRate,
    communication_plan_rate: communicationPlanRate,
    behaviour_support_plan_rate: behaviourSupportPlanRate,
    staff_training_rate: staffTrainingRate,
    school_liaison_rate: schoolLiaisonRate,
    camhs_rate: camhsRate,
    ot_rate: otRate,
    salt_rate: saltRate,
    social_worker_informed_rate: swInformedRate,
    medication_rate: medicationRate,
    transition_plan_rate: transitionPlanRate,
    active_records: activeRecords,
    overdue_reviews: overdueReviews,
    multi_agency_involvement_rate: multiAgencyRate,
  };
}

export function computeAlerts(
  rows: NeurodiversitySupportRow[],
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

  const activeRows = rows.filter((r) => r.status === "Active");

  // Critical: Active record with no reasonable adjustments documented
  for (const r of activeRows) {
    if (!r.reasonable_adjustments || r.reasonable_adjustments.trim().length === 0) {
      alerts.push({
        type: "no_reasonable_adjustments",
        severity: "critical",
        message: `${r.child_name} has an active SEND record for ${r.condition_type} but no reasonable adjustments are documented — the Equality Act 2010 requires the home to make reasonable adjustments to prevent disabled children from being placed at a substantial disadvantage`,
        record_id: r.id,
      });
    }
  }

  // Critical: EHCP not in place where condition warrants it
  for (const r of activeRows) {
    if (
      (LEARNING_CONDITIONS as string[]).includes(r.condition_type) &&
      r.diagnosis_status === "Formal Diagnosis" &&
      !r.ehcp_in_place
    ) {
      alerts.push({
        type: "no_ehcp_formal_diagnosis",
        severity: "critical",
        message: `${r.child_name} has a formal diagnosis of ${r.condition_type} but no EHCP is in place — the SEND Code of Practice 2015 requires local authorities to issue an EHCP where a child has special educational needs that cannot be met through usual school support; the home should be advocating for this`,
        record_id: r.id,
      });
    }
  }

  // Critical: Autism or sensory condition without sensory profile
  for (const r of activeRows) {
    if (
      (CONDITIONS_REQUIRING_SENSORY_PROFILE as string[]).includes(r.condition_type) &&
      !r.sensory_profile_completed
    ) {
      alerts.push({
        type: "no_sensory_profile",
        severity: "critical",
        message: `${r.child_name} has ${r.condition_type} but no sensory profile has been completed — NICE CG170 and best practice guidance recommend a sensory assessment to inform reasonable adjustments and environmental adaptations`,
        record_id: r.id,
      });
    }
  }

  // High: Communication condition without communication plan
  for (const r of activeRows) {
    if (
      (CONDITIONS_REQUIRING_COMMUNICATION_PLAN as string[]).includes(r.condition_type) &&
      !r.communication_plan
    ) {
      alerts.push({
        type: "no_communication_plan",
        severity: "high",
        message: `${r.child_name} has ${r.condition_type} but no communication plan is in place — CHR 2015 Reg 5 requires the home to meet each child's individual needs, including communication needs`,
        record_id: r.id,
      });
    }
  }

  // High: Staff training not completed for active records
  const untrained = activeRows.filter((r) => !r.staff_training_completed);
  if (untrained.length > 0) {
    for (const r of untrained) {
      alerts.push({
        type: "staff_training_incomplete",
        severity: "high",
        message: `Staff training has not been completed for ${r.child_name}'s ${r.condition_type} support — CHR 2015 Reg 33 requires staff to have the skills and knowledge to meet children's needs, and the Autism Act 2009 requires training on autism awareness`,
        record_id: r.id,
      });
    }
  }

  // High: Medication managed without social worker being informed
  for (const r of activeRows) {
    if (r.medication_managed && !r.social_worker_informed) {
      alerts.push({
        type: "medication_sw_not_informed",
        severity: "high",
        message: `${r.child_name} has medication being managed for ${r.condition_type} but the social worker has not been informed — medication decisions for looked-after children require multi-agency oversight per CHR 2015 Reg 10`,
        record_id: r.id,
      });
    }
  }

  // High: Suspected condition with no referral
  for (const r of activeRows) {
    if (r.diagnosis_status === "Suspected — No Referral") {
      alerts.push({
        type: "suspected_no_referral",
        severity: "high",
        message: `${r.child_name} has a suspected ${r.condition_type} but no referral has been made — CHR 2015 Reg 10 requires the home to proactively promote health and access appropriate assessment services`,
        record_id: r.id,
      });
    }
  }

  // High: School liaison not established for active records
  const noSchoolLiaison = activeRows.filter((r) => !r.school_liaison);
  if (noSchoolLiaison.length >= 2) {
    alerts.push({
      type: "school_liaison_gap",
      severity: "high",
      message: `${noSchoolLiaison.length} active SEND records have no school liaison established — the SEND Code of Practice 2015 requires close coordination between the home and educational settings to ensure consistent support`,
    });
  }

  // Medium: Overdue review dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const r of activeRows) {
    if (r.review_date) {
      const reviewDate = new Date(r.review_date);
      if (reviewDate < today) {
        alerts.push({
          type: "overdue_review",
          severity: "medium",
          message: `Review for ${r.child_name}'s ${r.condition_type} support was due on ${r.review_date} and is now overdue — schedule a multi-agency review to assess ongoing needs`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: No CAMHS involvement for neurodevelopmental conditions
  for (const r of activeRows) {
    if (
      (NEURODEVELOPMENTAL_CONDITIONS as string[]).includes(r.condition_type) &&
      !r.camhs_involved &&
      r.diagnosis_status !== "Not Applicable"
    ) {
      alerts.push({
        type: "no_camhs_neurodevelopmental",
        severity: "medium",
        message: `${r.child_name} has ${r.condition_type} but CAMHS is not involved — consider whether CAMHS input would support assessment, diagnosis, or ongoing management per NICE CG170 / NICE NG87`,
        record_id: r.id,
      });
    }
  }

  // Medium: No transition plan for active records
  const noTransition = activeRows.filter((r) => !r.transition_plan);
  if (noTransition.length >= 2) {
    alerts.push({
      type: "no_transition_plans",
      severity: "medium",
      message: `${noTransition.length} active SEND records have no transition plan — the SEND Code of Practice 2015 emphasises the importance of planning for transitions, including placement changes, school moves, and adulthood preparation`,
    });
  }

  return alerts;
}

export function generateAriaInsights(
  rows: NeurodiversitySupportRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const conditionBreakdown = Object.entries(metrics.by_condition_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const diagnosisBreakdown = Object.entries(metrics.by_diagnosis_status)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `${status}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} neurodiversity/SEND ${metrics.total_records === 1 ? "record" : "records"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Active: ${metrics.active_records}. ` +
      `Conditions: ${conditionBreakdown || "none recorded"}. ` +
      `Diagnosis status: ${diagnosisBreakdown || "none recorded"}. ` +
      `EHCP rate: ${metrics.ehcp_rate}%. ` +
      `Specialist involvement: ${metrics.specialist_rate}%. ` +
      `Multi-agency coordination: ${metrics.multi_agency_involvement_rate}%. ` +
      `Overdue reviews: ${metrics.overdue_reviews}.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Sensory profile rate: ${metrics.sensory_profile_rate}%. ` +
        `Communication plan rate: ${metrics.communication_plan_rate}%. ` +
        `Behaviour support plan rate: ${metrics.behaviour_support_plan_rate}%. ` +
        `Staff training rate: ${metrics.staff_training_rate}%. ` +
        `School liaison rate: ${metrics.school_liaison_rate}%. ` +
        `CAMHS involved: ${metrics.camhs_rate}%. ` +
        `OT involved: ${metrics.ot_rate}%. ` +
        `SALT involved: ${metrics.salt_rate}%. ` +
        `Medication managed: ${metrics.medication_rate}%. ` +
        `Transition plans: ${metrics.transition_plan_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority neurodiversity/SEND alerts. ` +
        `Sensory profile rate: ${metrics.sensory_profile_rate}%. ` +
        `Communication plan rate: ${metrics.communication_plan_rate}%. ` +
        `Behaviour support plan rate: ${metrics.behaviour_support_plan_rate}%. ` +
        `Staff training rate: ${metrics.staff_training_rate}%. ` +
        `School liaison rate: ${metrics.school_liaison_rate}%. ` +
        `Social worker informed: ${metrics.social_worker_informed_rate}%. ` +
        `Continue meeting individual needs per CHR 2015 Reg 5 and SEND Code of Practice 2015.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.sensory_profile_rate < 50 && metrics.total_records > 0) {
    insights.push(
      `[reflect] Only ${metrics.sensory_profile_rate}% of SEND records have a completed sensory profile. ` +
        `Has the home considered how each child's sensory needs affect their daily experience? ` +
        `NICE CG170 recommends assessing sensory sensitivities for autistic children, and many ` +
        `neurodevelopmental conditions involve atypical sensory processing. Without understanding ` +
        `a child's sensory profile, the home may inadvertently create environments that cause ` +
        `distress or dysregulation. Are occupational therapy assessments being pursued where needed? ` +
        `Are staff trained to recognise and respond to sensory overload?`,
    );
  } else if (metrics.staff_training_rate < 60 && metrics.total_records > 0) {
    insights.push(
      `[reflect] Staff training has been completed for only ${metrics.staff_training_rate}% of SEND records. ` +
        `Do all staff understand the specific needs of each child they support? The Autism Act 2009 ` +
        `and CHR 2015 Reg 33 require that staff have the skills and knowledge to meet children's ` +
        `needs. Without condition-specific training, staff may misinterpret behaviours as ` +
        `non-compliance rather than recognising them as expressions of unmet need. Does the home ` +
        `have a rolling training programme that covers each child's diagnosis and recommended ` +
        `support strategies?`,
    );
  } else if (metrics.multi_agency_involvement_rate < 40 && metrics.total_records > 3) {
    insights.push(
      `[reflect] Multi-agency involvement is only ${metrics.multi_agency_involvement_rate}% across SEND records. ` +
        `Are children receiving coordinated support from health, education, and social care? ` +
        `The SEND Code of Practice 2015 places significant emphasis on joint working between ` +
        `agencies. For looked-after children with SEND, who may have experienced disrupted ` +
        `services due to placement moves, proactive coordination is essential. Is the home ` +
        `actively chairing or attending multi-agency reviews? Are professionals sharing ` +
        `information effectively to avoid gaps in support?`,
    );
  } else {
    insights.push(
      `[reflect] How does the home ensure that neurodiversity is understood and celebrated, ` +
        `not just managed? The Equality Act 2010 requires reasonable adjustments, but ` +
        `truly inclusive support goes beyond compliance. Does each child feel that their ` +
        `differences are valued and their strengths recognised? Are reasonable adjustments ` +
        `regularly reviewed to ensure they remain effective as the child develops? ` +
        `SCCIF inspectors look for evidence that the home meets SEND children's needs ` +
        `holistically — not just educationally, but socially, emotionally, and in daily life.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    conditionType?: ConditionType;
    diagnosisStatus?: DiagnosisStatus;
    status?: RecordStatus;
    limit?: number;
  },
): Promise<ServiceResult<NeurodiversitySupportRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_neurodiversity_support") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.conditionType) q = q.eq("condition_type", filters.conditionType);
  if (filters?.diagnosisStatus) q = q.eq("diagnosis_status", filters.diagnosisStatus);
  if (filters?.status) q = q.eq("status", filters.status);

  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<NeurodiversitySupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_neurodiversity_support") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  assessmentDate: string;
  assessorName: string;
  conditionType: ConditionType;
  diagnosisStatus?: DiagnosisStatus;
  ehcpInPlace?: boolean;
  specialistInvolved?: boolean;
  specialistType?: string | null;
  reasonableAdjustments?: string;
  sensoryProfileCompleted?: boolean;
  communicationPlan?: boolean;
  behaviourSupportPlan?: boolean;
  staffTrainingCompleted?: boolean;
  schoolLiaison?: boolean;
  camhsInvolved?: boolean;
  otInvolved?: boolean;
  saltInvolved?: boolean;
  socialWorkerInformed?: boolean;
  medicationManaged?: boolean;
  medicationDetails?: string | null;
  transitionPlan?: boolean;
  reviewDate?: string | null;
  status?: RecordStatus;
  notes?: string | null;
}): Promise<ServiceResult<NeurodiversitySupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateNeurodiversitySupport({
    childName: input.childName,
    assessmentDate: input.assessmentDate,
    assessorName: input.assessorName,
    conditionType: input.conditionType,
    diagnosisStatus: input.diagnosisStatus,
    specialistInvolved: input.specialistInvolved,
    specialistType: input.specialistType,
    reasonableAdjustments: input.reasonableAdjustments,
    sensoryProfileCompleted: input.sensoryProfileCompleted,
    communicationPlan: input.communicationPlan,
    medicationManaged: input.medicationManaged,
    medicationDetails: input.medicationDetails,
    reviewDate: input.reviewDate,
    status: input.status,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_neurodiversity_support") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      assessment_date: input.assessmentDate,
      assessor_name: input.assessorName,
      condition_type: input.conditionType,
      diagnosis_status: input.diagnosisStatus ?? "Awaiting Assessment",
      ehcp_in_place: input.ehcpInPlace ?? false,
      specialist_involved: input.specialistInvolved ?? false,
      specialist_type: input.specialistType ?? null,
      reasonable_adjustments: input.reasonableAdjustments ?? "",
      sensory_profile_completed: input.sensoryProfileCompleted ?? false,
      communication_plan: input.communicationPlan ?? false,
      behaviour_support_plan: input.behaviourSupportPlan ?? false,
      staff_training_completed: input.staffTrainingCompleted ?? false,
      school_liaison: input.schoolLiaison ?? false,
      camhs_involved: input.camhsInvolved ?? false,
      ot_involved: input.otInvolved ?? false,
      salt_involved: input.saltInvolved ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      medication_managed: input.medicationManaged ?? false,
      medication_details: input.medicationDetails ?? null,
      transition_plan: input.transitionPlan ?? false,
      review_date: input.reviewDate ?? null,
      status: input.status ?? "Active",
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
    assessmentDate: string;
    assessorName: string;
    conditionType: ConditionType;
    diagnosisStatus: DiagnosisStatus;
    ehcpInPlace: boolean;
    specialistInvolved: boolean;
    specialistType: string | null;
    reasonableAdjustments: string;
    sensoryProfileCompleted: boolean;
    communicationPlan: boolean;
    behaviourSupportPlan: boolean;
    staffTrainingCompleted: boolean;
    schoolLiaison: boolean;
    camhsInvolved: boolean;
    otInvolved: boolean;
    saltInvolved: boolean;
    socialWorkerInformed: boolean;
    medicationManaged: boolean;
    medicationDetails: string | null;
    transitionPlan: boolean;
    reviewDate: string | null;
    status: RecordStatus;
    notes: string | null;
  }>,
): Promise<ServiceResult<NeurodiversitySupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.assessorName !== undefined) mapped.assessor_name = updates.assessorName;
  if (updates.conditionType !== undefined) mapped.condition_type = updates.conditionType;
  if (updates.diagnosisStatus !== undefined) mapped.diagnosis_status = updates.diagnosisStatus;
  if (updates.ehcpInPlace !== undefined) mapped.ehcp_in_place = updates.ehcpInPlace;
  if (updates.specialistInvolved !== undefined) mapped.specialist_involved = updates.specialistInvolved;
  if (updates.specialistType !== undefined) mapped.specialist_type = updates.specialistType;
  if (updates.reasonableAdjustments !== undefined) mapped.reasonable_adjustments = updates.reasonableAdjustments;
  if (updates.sensoryProfileCompleted !== undefined) mapped.sensory_profile_completed = updates.sensoryProfileCompleted;
  if (updates.communicationPlan !== undefined) mapped.communication_plan = updates.communicationPlan;
  if (updates.behaviourSupportPlan !== undefined) mapped.behaviour_support_plan = updates.behaviourSupportPlan;
  if (updates.staffTrainingCompleted !== undefined) mapped.staff_training_completed = updates.staffTrainingCompleted;
  if (updates.schoolLiaison !== undefined) mapped.school_liaison = updates.schoolLiaison;
  if (updates.camhsInvolved !== undefined) mapped.camhs_involved = updates.camhsInvolved;
  if (updates.otInvolved !== undefined) mapped.ot_involved = updates.otInvolved;
  if (updates.saltInvolved !== undefined) mapped.salt_involved = updates.saltInvolved;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.medicationManaged !== undefined) mapped.medication_managed = updates.medicationManaged;
  if (updates.medicationDetails !== undefined) mapped.medication_details = updates.medicationDetails;
  if (updates.transitionPlan !== undefined) mapped.transition_plan = updates.transitionPlan;
  if (updates.reviewDate !== undefined) mapped.review_date = updates.reviewDate;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_neurodiversity_support") as SB)
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

  const { error } = await (client.from("cs_neurodiversity_support") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
