// ==============================================================================
// CARA -- LANGUAGE SUPPORT & COMMUNICATION NEEDS SERVICE
// Tracks language support and communication needs assessments for children
// including first language support, English as Additional Language, British
// Sign Language, Makaton, PECS, speech and language therapy, augmentative
// communication devices, easy read materials, visual timetables, social
// stories, interpreter services, translation services, communication
// passports, and total communication approaches.
//
// Covers: Initial and ongoing language and communication assessments,
// specialist referral tracking, speech therapist involvement, interpreter
// provision and language matching, communication tool deployment, staff
// training on communication methods, individual communication plan creation,
// child participation and views accessibility, school liaison on communication
// needs, social worker notification of support in place, and review scheduling.
//
// UK Regulatory Framework:
// CHR 2015 Reg 5 (individual child's linguistic needs),
// CHR 2015 Reg 7 (children's plan),
// Equality Act 2010 (disability — communication needs),
// SEND Code of Practice 2015,
// SCCIF: Experiences and progress — "The home communicates effectively with all children.",
// UNCRC Article 12/13 (right to express views),
// UNCRC Article 30 (right to language).
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const SUPPORT_TYPES = [
  "First Language Support",
  "English as Additional Language",
  "British Sign Language",
  "Makaton",
  "PECS",
  "Speech and Language Therapy",
  "Augmentative Communication Device",
  "Easy Read Materials",
  "Visual Timetables",
  "Social Stories",
  "Interpreter Services",
  "Translation Services",
  "Communication Passport",
  "Total Communication Approach",
] as const;
export type SupportType = (typeof SUPPORT_TYPES)[number];

export const ENGLISH_PROFICIENCIES = [
  "No English",
  "Basic",
  "Intermediate",
  "Fluent",
  "Native Speaker",
] as const;
export type EnglishProficiency = (typeof ENGLISH_PROFICIENCIES)[number];

export const COMMUNICATION_NEEDS_LEVELS = [
  "No Additional Needs",
  "Low",
  "Medium",
  "High",
  "Complex",
] as const;
export type CommunicationNeedsLevel = (typeof COMMUNICATION_NEEDS_LEVELS)[number];

export const STATUSES = [
  "Active",
  "Under Review",
  "No Current Needs",
  "Archived",
] as const;
export type Status = (typeof STATUSES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const SPECIALIST_SUPPORT_TYPES: SupportType[] = [
  "Speech and Language Therapy",
  "Augmentative Communication Device",
  "British Sign Language",
  "PECS",
  "Makaton",
];

export const INTERPRETER_TYPES: SupportType[] = [
  "Interpreter Services",
  "Translation Services",
];

export const VISUAL_SUPPORT_TYPES: SupportType[] = [
  "Easy Read Materials",
  "Visual Timetables",
  "Social Stories",
];

// -- Label maps ---------------------------------------------------------------

export const SUPPORT_TYPE_LABELS: { type: SupportType; label: string }[] = [
  { type: "First Language Support", label: "First Language Support" },
  { type: "English as Additional Language", label: "English as Additional Language (EAL)" },
  { type: "British Sign Language", label: "British Sign Language (BSL)" },
  { type: "Makaton", label: "Makaton" },
  { type: "PECS", label: "PECS (Picture Exchange Communication System)" },
  { type: "Speech and Language Therapy", label: "Speech and Language Therapy (SaLT)" },
  { type: "Augmentative Communication Device", label: "Augmentative Communication Device (AAC)" },
  { type: "Easy Read Materials", label: "Easy Read Materials" },
  { type: "Visual Timetables", label: "Visual Timetables" },
  { type: "Social Stories", label: "Social Stories" },
  { type: "Interpreter Services", label: "Interpreter Services" },
  { type: "Translation Services", label: "Translation Services" },
  { type: "Communication Passport", label: "Communication Passport" },
  { type: "Total Communication Approach", label: "Total Communication Approach" },
];

export const ENGLISH_PROFICIENCY_LABELS: { proficiency: EnglishProficiency; label: string }[] = [
  { proficiency: "No English", label: "No English" },
  { proficiency: "Basic", label: "Basic" },
  { proficiency: "Intermediate", label: "Intermediate" },
  { proficiency: "Fluent", label: "Fluent" },
  { proficiency: "Native Speaker", label: "Native Speaker" },
];

export const COMMUNICATION_NEEDS_LEVEL_LABELS: { level: CommunicationNeedsLevel; label: string }[] = [
  { level: "No Additional Needs", label: "No Additional Needs" },
  { level: "Low", label: "Low" },
  { level: "Medium", label: "Medium" },
  { level: "High", label: "High" },
  { level: "Complex", label: "Complex" },
];

export const STATUS_LABELS: { status: Status; label: string }[] = [
  { status: "Active", label: "Active" },
  { status: "Under Review", label: "Under Review" },
  { status: "No Current Needs", label: "No Current Needs" },
  { status: "Archived", label: "Archived" },
];

// -- Row type -----------------------------------------------------------------

export interface LanguageSupportRow {
  id: string;
  home_id: string;
  child_name: string;
  assessment_date: string;
  assessor_name: string;
  support_type: SupportType;
  primary_language: string;
  english_proficiency: EnglishProficiency;
  communication_needs_level: CommunicationNeedsLevel;
  specialist_assessment_completed: boolean;
  speech_therapist_involved: boolean;
  interpreter_regularly_used: boolean;
  interpreter_language: string | null;
  communication_tools_in_place: boolean;
  staff_trained: boolean;
  individual_communication_plan: boolean;
  child_views_accessible: boolean;
  school_aware: boolean;
  social_worker_informed: boolean;
  review_date: string | null;
  status: Status;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateLanguageSupport(input: {
  childName?: string;
  assessmentDate?: string;
  assessorName?: string;
  supportType?: string;
  primaryLanguage?: string;
  englishProficiency?: string;
  communicationNeedsLevel?: string;
  interpreterRegularlyUsed?: boolean;
  interpreterLanguage?: string | null;
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

  if (!input.supportType || !(SUPPORT_TYPES as readonly string[]).includes(input.supportType)) {
    errors.push(`Support type must be one of: ${SUPPORT_TYPES.join(", ")}`);
  }

  if (!input.primaryLanguage || input.primaryLanguage.trim().length === 0) {
    errors.push("Primary language is required");
  }

  if (
    !input.englishProficiency ||
    !(ENGLISH_PROFICIENCIES as readonly string[]).includes(input.englishProficiency)
  ) {
    errors.push(`English proficiency must be one of: ${ENGLISH_PROFICIENCIES.join(", ")}`);
  }

  if (
    !input.communicationNeedsLevel ||
    !(COMMUNICATION_NEEDS_LEVELS as readonly string[]).includes(input.communicationNeedsLevel)
  ) {
    errors.push(`Communication needs level must be one of: ${COMMUNICATION_NEEDS_LEVELS.join(", ")}`);
  }

  if (input.status && !(STATUSES as readonly string[]).includes(input.status)) {
    errors.push(`Status must be one of: ${STATUSES.join(", ")}`);
  }

  // Business rule: interpreter use requires interpreter language
  if (input.interpreterRegularlyUsed === true && (!input.interpreterLanguage || input.interpreterLanguage.trim().length === 0)) {
    errors.push("Interpreter language must be specified when interpreter is regularly used");
  }

  // Business rule: No English / Basic proficiency should have interpreter or specialist support
  if (
    input.englishProficiency &&
    (input.englishProficiency === "No English" || input.englishProficiency === "Basic") &&
    input.supportType &&
    !(INTERPRETER_TYPES as string[]).includes(input.supportType) &&
    !(SPECIALIST_SUPPORT_TYPES as string[]).includes(input.supportType) &&
    input.supportType !== "English as Additional Language" &&
    input.supportType !== "Total Communication Approach"
  ) {
    // This is a warning, not a hard error — push as advisory
    errors.push(
      "Child has No English or Basic proficiency — consider whether interpreter services or specialist support is also needed per CHR 2015 Reg 5",
    );
  }

  // Business rule: High/Complex needs should have specialist assessment
  if (
    input.communicationNeedsLevel &&
    (input.communicationNeedsLevel === "High" || input.communicationNeedsLevel === "Complex") &&
    input.supportType &&
    !(SPECIALIST_SUPPORT_TYPES as string[]).includes(input.supportType)
  ) {
    // Advisory
    errors.push(
      "Child has High or Complex communication needs — specialist assessment and support type should be considered per SEND Code of Practice 2015",
    );
  }

  // Business rule: review date must not be in the past
  if (input.reviewDate) {
    const revDate = new Date(input.reviewDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(revDate.getTime())) {
      errors.push("Review date must be a valid date");
    } else if (revDate < today) {
      errors.push("Review date should not be in the past");
    }
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: LanguageSupportRow[],
): {
  total_records: number;
  by_support_type: Record<string, number>;
  by_english_proficiency: Record<string, number>;
  by_communication_needs_level: Record<string, number>;
  specialist_rate: number;
  speech_therapist_rate: number;
  interpreter_rate: number;
  communication_tools_rate: number;
  staff_training_rate: number;
  individual_plan_rate: number;
  child_views_accessible_rate: number;
  unique_children: number;
  active_needs_count: number;
} {
  const total = rows.length;

  const boolRate = (field: keyof LanguageSupportRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  // Support type breakdown
  const bySupportType: Record<string, number> = {};
  for (const st of SUPPORT_TYPES) bySupportType[st] = 0;
  for (const r of rows) bySupportType[r.support_type] = (bySupportType[r.support_type] || 0) + 1;

  // English proficiency breakdown
  const byProficiency: Record<string, number> = {};
  for (const ep of ENGLISH_PROFICIENCIES) byProficiency[ep] = 0;
  for (const r of rows) byProficiency[r.english_proficiency] = (byProficiency[r.english_proficiency] || 0) + 1;

  // Communication needs level breakdown
  const byNeedsLevel: Record<string, number> = {};
  for (const nl of COMMUNICATION_NEEDS_LEVELS) byNeedsLevel[nl] = 0;
  for (const r of rows) byNeedsLevel[r.communication_needs_level] = (byNeedsLevel[r.communication_needs_level] || 0) + 1;

  // Unique children
  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;

  // Active needs count
  const activeNeedsCount = rows.filter((r) => r.status === "Active").length;

  return {
    total_records: total,
    by_support_type: bySupportType,
    by_english_proficiency: byProficiency,
    by_communication_needs_level: byNeedsLevel,
    specialist_rate: boolRate("specialist_assessment_completed"),
    speech_therapist_rate: boolRate("speech_therapist_involved"),
    interpreter_rate: boolRate("interpreter_regularly_used"),
    communication_tools_rate: boolRate("communication_tools_in_place"),
    staff_training_rate: boolRate("staff_trained"),
    individual_plan_rate: boolRate("individual_communication_plan"),
    child_views_accessible_rate: boolRate("child_views_accessible"),
    unique_children: uniqueChildren,
    active_needs_count: activeNeedsCount,
  };
}

export function computeAlerts(
  rows: LanguageSupportRow[],
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

  // Critical: Complex communication needs with no individual communication plan
  for (const r of rows) {
    if (
      r.communication_needs_level === "Complex" &&
      !r.individual_communication_plan &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "complex_no_plan",
        severity: "critical",
        message: `${r.child_name} has Complex communication needs but no individual communication plan in place — create plan immediately per SEND Code of Practice 2015 and CHR 2015 Reg 7`,
        record_id: r.id,
      });
    }
  }

  // Critical: Child views not accessible for active high/complex needs
  for (const r of rows) {
    if (
      (r.communication_needs_level === "High" || r.communication_needs_level === "Complex") &&
      !r.child_views_accessible &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "views_not_accessible",
        severity: "critical",
        message: `${r.child_name} has ${r.communication_needs_level} communication needs and cannot effectively express views — UNCRC Article 12 requires that the child's right to be heard is supported through appropriate communication methods`,
        record_id: r.id,
      });
    }
  }

  // Critical: No English with no interpreter and no communication tools
  for (const r of rows) {
    if (
      r.english_proficiency === "No English" &&
      !r.interpreter_regularly_used &&
      !r.communication_tools_in_place &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "no_english_no_support",
        severity: "critical",
        message: `${r.child_name} has no English proficiency but neither interpreter services nor communication tools are in place — immediate provision required per CHR 2015 Reg 5 and Equality Act 2010`,
        record_id: r.id,
      });
    }
  }

  // High: High/Complex needs without specialist assessment
  for (const r of rows) {
    if (
      (r.communication_needs_level === "High" || r.communication_needs_level === "Complex") &&
      !r.specialist_assessment_completed &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "high_needs_no_specialist",
        severity: "high",
        message: `${r.child_name} has ${r.communication_needs_level} communication needs but specialist assessment not completed — refer for assessment per SEND Code of Practice 2015`,
        record_id: r.id,
      });
    }
  }

  // High: Staff not trained for active needs
  for (const r of rows) {
    if (
      r.status === "Active" &&
      r.communication_needs_level !== "No Additional Needs" &&
      !r.staff_trained
    ) {
      alerts.push({
        type: "staff_not_trained",
        severity: "high",
        message: `Staff not trained to support ${r.child_name}'s ${r.support_type} needs — training required to meet CHR 2015 Reg 5 individual linguistic needs`,
        record_id: r.id,
      });
    }
  }

  // High: School not aware of active communication needs
  for (const r of rows) {
    if (
      r.status === "Active" &&
      r.communication_needs_level !== "No Additional Needs" &&
      !r.school_aware
    ) {
      alerts.push({
        type: "school_not_aware",
        severity: "high",
        message: `${r.child_name}'s school has not been informed of ${r.communication_needs_level} communication needs — coordinate with education provider per SEND Code of Practice 2015`,
        record_id: r.id,
      });
    }
  }

  // High: Social worker not informed of active needs
  for (const r of rows) {
    if (
      r.status === "Active" &&
      (r.communication_needs_level === "High" || r.communication_needs_level === "Complex") &&
      !r.social_worker_informed
    ) {
      alerts.push({
        type: "sw_not_informed",
        severity: "high",
        message: `${r.child_name}'s social worker has not been informed of ${r.communication_needs_level} communication needs — notification required per CHR 2015 Reg 7`,
        record_id: r.id,
      });
    }
  }

  // Medium: Overdue review dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const r of rows) {
    if (r.review_date && r.status === "Active") {
      const revDate = new Date(r.review_date);
      if (revDate < today) {
        alerts.push({
          type: "overdue_review",
          severity: "medium",
          message: `${r.child_name}'s ${r.support_type} assessment was due for review on ${r.review_date} and is now overdue — schedule review promptly`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: Interpreter used but language not specified
  for (const r of rows) {
    if (r.interpreter_regularly_used && (!r.interpreter_language || r.interpreter_language.trim().length === 0)) {
      alerts.push({
        type: "interpreter_no_language",
        severity: "medium",
        message: `${r.child_name} uses interpreter services but interpreter language has not been recorded — document the specific language for continuity of care`,
        record_id: r.id,
      });
    }
  }

  // Medium: Communication tools not in place for active medium+ needs
  for (const r of rows) {
    if (
      r.status === "Active" &&
      (r.communication_needs_level === "Medium" || r.communication_needs_level === "High" || r.communication_needs_level === "Complex") &&
      !r.communication_tools_in_place
    ) {
      alerts.push({
        type: "no_communication_tools",
        severity: "medium",
        message: `${r.child_name} has ${r.communication_needs_level} communication needs but communication tools are not in place — assess and provide appropriate tools per SCCIF effective communication standards`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: LanguageSupportRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_support_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const profBreakdown = Object.entries(metrics.by_english_proficiency)
    .filter(([, count]) => count > 0)
    .map(([prof, count]) => `${prof}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} language support and communication ${metrics.total_records === 1 ? "assessment" : "assessments"} ` +
      `across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Support types: ${typeBreakdown || "none recorded"}. ` +
      `English proficiency: ${profBreakdown || "none assessed"}. ` +
      `Active needs: ${metrics.active_needs_count}. ` +
      `Specialist assessment rate: ${metrics.specialist_rate}%. ` +
      `Individual communication plan rate: ${metrics.individual_plan_rate}%. ` +
      `Child views accessible rate: ${metrics.child_views_accessible_rate}%.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority communication support alerts active. ` +
        `Speech therapist involvement: ${metrics.speech_therapist_rate}%. ` +
        `Interpreter use rate: ${metrics.interpreter_rate}%. ` +
        `Communication tools in place: ${metrics.communication_tools_rate}%. ` +
        `Staff training rate: ${metrics.staff_training_rate}%. ` +
        `Needs levels: ${Object.entries(metrics.by_communication_needs_level).filter(([, c]) => c > 0).map(([l, c]) => `${l}: ${c}`).join(", ")}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority communication support alerts currently active. ` +
        `Speech therapist involvement: ${metrics.speech_therapist_rate}%. ` +
        `Interpreter use rate: ${metrics.interpreter_rate}%. ` +
        `Staff training rate: ${metrics.staff_training_rate}%. ` +
        `Continue reviewing communication needs regularly per CHR 2015 Reg 5 and SEND Code of Practice 2015.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  if (metrics.child_views_accessible_rate < 100 && metrics.active_needs_count > 0) {
    insights.push(
      `[reflect] ${Math.round(100 - metrics.child_views_accessible_rate)}% of children with active communication needs ` +
        `cannot effectively express their views. Are the right communication methods being used for ` +
        `each child? UNCRC Article 12 guarantees every child the right to express views freely in ` +
        `all matters affecting them. Article 13 supports the right to seek and receive information ` +
        `through any medium of the child's choice. Is the home doing enough to ensure every child's ` +
        `voice is genuinely heard, regardless of their communication needs?`,
    );
  } else if (metrics.staff_training_rate < 80 && metrics.active_needs_count > 0) {
    insights.push(
      `[reflect] Only ${metrics.staff_training_rate}% of communication support records show staff trained ` +
        `in the relevant communication method. Are all team members confident in using the communication ` +
        `tools and approaches needed by each child? CHR 2015 Reg 5 requires that each child's ` +
        `individual linguistic needs are met, and this depends on every member of staff being able ` +
        `to communicate effectively with every child in their care.`,
    );
  } else if (metrics.individual_plan_rate < 100 && metrics.active_needs_count > 0) {
    insights.push(
      `[reflect] Not all children with active communication needs have an individual communication ` +
        `plan. How are communication strategies being documented and shared across the team? ` +
        `CHR 2015 Reg 7 requires that each child's care plan addresses their individual needs, ` +
        `including linguistic and communication needs. A communication passport or plan ensures ` +
        `consistency across all staff and in all settings the child accesses.`,
    );
  } else {
    insights.push(
      `[reflect] Are the communication tools and approaches in place being regularly reviewed with ` +
        `each child to check they are still effective and age-appropriate? Children's communication ` +
        `needs change as they develop, and what works at one stage may not work at another. ` +
        `UNCRC Article 30 protects the right of minority language speakers to use their own language, ` +
        `and the SEND Code of Practice 2015 requires that support is kept under regular review to ` +
        `ensure it continues to meet the child's evolving needs.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    supportType?: SupportType;
    englishProficiency?: EnglishProficiency;
    communicationNeedsLevel?: CommunicationNeedsLevel;
    status?: Status;
    childName?: string;
    limit?: number;
  },
): Promise<ServiceResult<LanguageSupportRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_language_support") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.supportType) q = q.eq("support_type", filters.supportType);
  if (filters?.englishProficiency) q = q.eq("english_proficiency", filters.englishProficiency);
  if (filters?.communicationNeedsLevel) q = q.eq("communication_needs_level", filters.communicationNeedsLevel);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.childName) q = q.eq("child_name", filters.childName);

  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<LanguageSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_language_support") as SB)
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
  supportType: SupportType;
  primaryLanguage: string;
  englishProficiency: EnglishProficiency;
  communicationNeedsLevel: CommunicationNeedsLevel;
  specialistAssessmentCompleted?: boolean;
  speechTherapistInvolved?: boolean;
  interpreterRegularlyUsed?: boolean;
  interpreterLanguage?: string | null;
  communicationToolsInPlace?: boolean;
  staffTrained?: boolean;
  individualCommunicationPlan?: boolean;
  childViewsAccessible?: boolean;
  schoolAware?: boolean;
  socialWorkerInformed?: boolean;
  reviewDate?: string | null;
  status?: Status;
  notes?: string | null;
}): Promise<ServiceResult<LanguageSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateLanguageSupport({
    childName: input.childName,
    assessmentDate: input.assessmentDate,
    assessorName: input.assessorName,
    supportType: input.supportType,
    primaryLanguage: input.primaryLanguage,
    englishProficiency: input.englishProficiency,
    communicationNeedsLevel: input.communicationNeedsLevel,
    interpreterRegularlyUsed: input.interpreterRegularlyUsed,
    interpreterLanguage: input.interpreterLanguage,
    reviewDate: input.reviewDate,
    status: input.status,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_language_support") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      assessment_date: input.assessmentDate,
      assessor_name: input.assessorName,
      support_type: input.supportType,
      primary_language: input.primaryLanguage,
      english_proficiency: input.englishProficiency,
      communication_needs_level: input.communicationNeedsLevel,
      specialist_assessment_completed: input.specialistAssessmentCompleted ?? false,
      speech_therapist_involved: input.speechTherapistInvolved ?? false,
      interpreter_regularly_used: input.interpreterRegularlyUsed ?? false,
      interpreter_language: input.interpreterLanguage ?? null,
      communication_tools_in_place: input.communicationToolsInPlace ?? false,
      staff_trained: input.staffTrained ?? false,
      individual_communication_plan: input.individualCommunicationPlan ?? false,
      child_views_accessible: input.childViewsAccessible ?? false,
      school_aware: input.schoolAware ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
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
    supportType: SupportType;
    primaryLanguage: string;
    englishProficiency: EnglishProficiency;
    communicationNeedsLevel: CommunicationNeedsLevel;
    specialistAssessmentCompleted: boolean;
    speechTherapistInvolved: boolean;
    interpreterRegularlyUsed: boolean;
    interpreterLanguage: string | null;
    communicationToolsInPlace: boolean;
    staffTrained: boolean;
    individualCommunicationPlan: boolean;
    childViewsAccessible: boolean;
    schoolAware: boolean;
    socialWorkerInformed: boolean;
    reviewDate: string | null;
    status: Status;
    notes: string | null;
  }>,
): Promise<ServiceResult<LanguageSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.assessorName !== undefined) mapped.assessor_name = updates.assessorName;
  if (updates.supportType !== undefined) mapped.support_type = updates.supportType;
  if (updates.primaryLanguage !== undefined) mapped.primary_language = updates.primaryLanguage;
  if (updates.englishProficiency !== undefined) mapped.english_proficiency = updates.englishProficiency;
  if (updates.communicationNeedsLevel !== undefined) mapped.communication_needs_level = updates.communicationNeedsLevel;
  if (updates.specialistAssessmentCompleted !== undefined) mapped.specialist_assessment_completed = updates.specialistAssessmentCompleted;
  if (updates.speechTherapistInvolved !== undefined) mapped.speech_therapist_involved = updates.speechTherapistInvolved;
  if (updates.interpreterRegularlyUsed !== undefined) mapped.interpreter_regularly_used = updates.interpreterRegularlyUsed;
  if (updates.interpreterLanguage !== undefined) mapped.interpreter_language = updates.interpreterLanguage;
  if (updates.communicationToolsInPlace !== undefined) mapped.communication_tools_in_place = updates.communicationToolsInPlace;
  if (updates.staffTrained !== undefined) mapped.staff_trained = updates.staffTrained;
  if (updates.individualCommunicationPlan !== undefined) mapped.individual_communication_plan = updates.individualCommunicationPlan;
  if (updates.childViewsAccessible !== undefined) mapped.child_views_accessible = updates.childViewsAccessible;
  if (updates.schoolAware !== undefined) mapped.school_aware = updates.schoolAware;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.reviewDate !== undefined) mapped.review_date = updates.reviewDate;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_language_support") as SB)
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

  const { error } = await (client.from("cs_language_support") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
