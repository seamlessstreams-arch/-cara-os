// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF COMPETENCY & TRAINING SERVICE
// Tracks mandatory training, competency assessments, DBS status, and
// generates ARIA compliance intelligence.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type TrainingStatus = "current" | "expiring_soon" | "expired" | "not_started" | "booked";
export type CompetencyLevel = "not_assessed" | "developing" | "competent" | "proficient" | "expert";

export type TrainingCategory =
  | "safeguarding" | "first_aid" | "medication" | "fire_safety"
  | "manual_handling" | "food_hygiene" | "data_protection"
  | "health_safety" | "equality_diversity" | "mental_health"
  | "attachment_theory" | "therapeutic_crisis_intervention"
  | "pace_model" | "restraint_reduction" | "cse_cce"
  | "substance_misuse" | "self_harm_awareness" | "trauma_informed"
  | "recording_standards" | "complaints_handling" | "other";

export interface TrainingRecord {
  id: string;
  staff_id: string;
  home_id: string;
  category: TrainingCategory;
  course_name: string;
  provider: string | null;
  is_mandatory: boolean;
  status: TrainingStatus;
  completed_date: string | null;
  expiry_date: string | null;
  certificate_ref: string | null;
  renewal_period_months: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompetencyAssessment {
  id: string;
  staff_id: string;
  home_id: string;
  competency_area: string;
  level: CompetencyLevel;
  assessed_by: string;
  assessed_date: string;
  evidence: string | null;
  development_notes: string | null;
  next_review_date: string | null;
  created_at: string;
}

// ── Mandatory training matrix ──────────────────────────────────────────────

export const MANDATORY_TRAINING: {
  category: TrainingCategory;
  courseName: string;
  renewalMonths: number;
  regulationRef: string;
}[] = [
  { category: "safeguarding", courseName: "Safeguarding Children Level 3", renewalMonths: 12, regulationRef: "CHR2015 Reg 35" },
  { category: "safeguarding", courseName: "Prevent Duty Awareness", renewalMonths: 24, regulationRef: "Prevent Duty Guidance 2023" },
  { category: "first_aid", courseName: "Paediatric First Aid", renewalMonths: 36, regulationRef: "CHR2015 Reg 12" },
  { category: "medication", courseName: "Medication Administration", renewalMonths: 12, regulationRef: "CHR2015 Reg 12" },
  { category: "fire_safety", courseName: "Fire Safety Awareness", renewalMonths: 12, regulationRef: "Regulatory Reform (Fire Safety) Order 2005" },
  { category: "manual_handling", courseName: "Manual Handling", renewalMonths: 36, regulationRef: "Manual Handling Operations Regs 1992" },
  { category: "food_hygiene", courseName: "Food Hygiene Level 2", renewalMonths: 36, regulationRef: "Food Safety Act 1990" },
  { category: "data_protection", courseName: "GDPR / Data Protection", renewalMonths: 12, regulationRef: "Data Protection Act 2018" },
  { category: "health_safety", courseName: "Health & Safety Induction", renewalMonths: 24, regulationRef: "Health and Safety at Work Act 1974" },
  { category: "equality_diversity", courseName: "Equality, Diversity & Inclusion", renewalMonths: 24, regulationRef: "Equality Act 2010" },
  { category: "therapeutic_crisis_intervention", courseName: "Therapeutic Crisis Intervention (TCI)", renewalMonths: 6, regulationRef: "CHR2015 Reg 35" },
  { category: "cse_cce", courseName: "CSE / CCE Awareness", renewalMonths: 12, regulationRef: "Working Together 2023" },
  { category: "self_harm_awareness", courseName: "Self-Harm & Suicide Awareness", renewalMonths: 12, regulationRef: "CHR2015 Reg 12" },
  { category: "trauma_informed", courseName: "Trauma-Informed Practice", renewalMonths: 24, regulationRef: "CHR2015 Reg 6" },
  { category: "recording_standards", courseName: "Recording Standards", renewalMonths: 12, regulationRef: "CHR2015 Reg 36" },
];

// ── Competency framework ───────────────────────────────────────────────────

export const COMPETENCY_AREAS = [
  { area: "relationship_building", label: "Relationship Building", description: "Ability to form and maintain positive relationships with young people" },
  { area: "de_escalation", label: "De-escalation", description: "Skills in managing challenging behaviour without physical intervention" },
  { area: "safeguarding_practice", label: "Safeguarding Practice", description: "Practical safeguarding knowledge and response" },
  { area: "recording_quality", label: "Recording Quality", description: "Accuracy, detail, and timeliness of written records" },
  { area: "medication_competency", label: "Medication Competency", description: "Safe medication administration and recording" },
  { area: "key_working", label: "Key Working", description: "Quality of key work sessions and care planning" },
  { area: "risk_assessment", label: "Risk Assessment", description: "Ability to identify, assess, and manage risk" },
  { area: "professional_boundaries", label: "Professional Boundaries", description: "Maintaining appropriate professional relationships" },
  { area: "trauma_awareness", label: "Trauma Awareness", description: "Understanding and responding to trauma in practice" },
  { area: "team_communication", label: "Team Communication", description: "Quality of handovers, briefings, and team communication" },
];

// ── Pure analysis functions ────────────────────────────────────────────────

export function computeTrainingStatus(
  completedDate: string | null,
  expiryDate: string | null,
  now: Date,
): TrainingStatus {
  if (!completedDate) return "not_started";
  if (!expiryDate) return "current";

  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / 86400000);

  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry <= 30) return "expiring_soon";
  return "current";
}

export function computeTrainingMatrix(
  records: { staff_id: string; category: string; status: string; is_mandatory: boolean }[],
  staffIds: string[],
): {
  matrix: Record<string, Record<string, string>>;
  stats: {
    total_staff: number;
    fully_compliant: number;
    has_expired: number;
    has_expiring: number;
    compliance_percentage: number;
  };
} {
  const mandatoryCategories = MANDATORY_TRAINING.map((t) => t.category);
  const matrix: Record<string, Record<string, string>> = {};
  let fullyCompliant = 0;
  let hasExpired = 0;
  let hasExpiring = 0;

  for (const staffId of staffIds) {
    matrix[staffId] = {};
    const staffRecords = records.filter((r) => r.staff_id === staffId && r.is_mandatory);
    let isCompliant = true;
    let staffExpired = false;
    let staffExpiring = false;

    for (const cat of mandatoryCategories) {
      const record = staffRecords.find((r) => r.category === cat);
      const status = record?.status ?? "not_started";
      matrix[staffId][cat] = status;
      if (status === "expired" || status === "not_started") {
        isCompliant = false;
        if (status === "expired") staffExpired = true;
      }
      if (status === "expiring_soon") staffExpiring = true;
    }

    if (isCompliant) fullyCompliant++;
    if (staffExpired) hasExpired++;
    if (staffExpiring) hasExpiring++;
  }

  return {
    matrix,
    stats: {
      total_staff: staffIds.length,
      fully_compliant: fullyCompliant,
      has_expired: hasExpired,
      has_expiring: hasExpiring,
      compliance_percentage: staffIds.length > 0 ? Math.round((fullyCompliant / staffIds.length) * 100) : 0,
    },
  };
}

export function computeCompetencyProfile(
  assessments: { competency_area: string; level: CompetencyLevel }[],
): {
  overallLevel: CompetencyLevel;
  areaCount: number;
  assessed: number;
  not_assessed: number;
  developing: number;
  competent: number;
  proficient: number;
  expert: number;
} {
  const levels = assessments.map((a) => a.level);
  const counts = {
    not_assessed: levels.filter((l) => l === "not_assessed").length,
    developing: levels.filter((l) => l === "developing").length,
    competent: levels.filter((l) => l === "competent").length,
    proficient: levels.filter((l) => l === "proficient").length,
    expert: levels.filter((l) => l === "expert").length,
  };

  const LEVEL_SCORES: Record<CompetencyLevel, number> = {
    not_assessed: 0, developing: 1, competent: 2, proficient: 3, expert: 4,
  };

  const assessed = assessments.filter((a) => a.level !== "not_assessed");
  const avgScore = assessed.length > 0
    ? assessed.reduce((sum, a) => sum + LEVEL_SCORES[a.level], 0) / assessed.length
    : 0;

  let overallLevel: CompetencyLevel;
  if (avgScore >= 3.5) overallLevel = "expert";
  else if (avgScore >= 2.5) overallLevel = "proficient";
  else if (avgScore >= 1.5) overallLevel = "competent";
  else if (avgScore > 0) overallLevel = "developing";
  else overallLevel = "not_assessed";

  return {
    overallLevel,
    areaCount: COMPETENCY_AREAS.length,
    assessed: assessed.length,
    not_assessed: counts.not_assessed,
    developing: counts.developing,
    competent: counts.competent,
    proficient: counts.proficient,
    expert: counts.expert,
  };
}

// ── CRUD ───────────────────────────────────────────────────────────────────

export async function listTrainingRecords(
  homeId: string,
  opts?: { staffId?: string; category?: TrainingCategory; mandatory?: boolean; limit?: number },
): Promise<ServiceResult<TrainingRecord[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_training_records") as SB).select("*").eq("home_id", homeId);
  if (opts?.staffId) q = q.eq("staff_id", opts.staffId);
  if (opts?.category) q = q.eq("category", opts.category);
  if (opts?.mandatory !== undefined) q = q.eq("is_mandatory", opts.mandatory);
  q = q.order("expiry_date", { ascending: true }).limit(opts?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createTrainingRecord(
  input: {
    staffId: string;
    homeId: string;
    category: TrainingCategory;
    courseName: string;
    isMandatory: boolean;
    provider?: string;
    completedDate?: string;
    expiryDate?: string;
    certificateRef?: string;
    renewalPeriodMonths?: number;
    notes?: string;
  },
): Promise<ServiceResult<TrainingRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const status = computeTrainingStatus(
    input.completedDate ?? null,
    input.expiryDate ?? null,
    new Date(),
  );

  const { data, error } = await (s.from("cs_training_records") as SB)
    .insert({
      staff_id: input.staffId,
      home_id: input.homeId,
      category: input.category,
      course_name: input.courseName,
      is_mandatory: input.isMandatory,
      provider: input.provider ?? null,
      completed_date: input.completedDate ?? null,
      expiry_date: input.expiryDate ?? null,
      certificate_ref: input.certificateRef ?? null,
      renewal_period_months: input.renewalPeriodMonths ?? null,
      status,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateTrainingRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<TrainingRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_training_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createCompetencyAssessment(
  input: {
    staffId: string;
    homeId: string;
    competencyArea: string;
    level: CompetencyLevel;
    assessedBy: string;
    evidence?: string;
    developmentNotes?: string;
    nextReviewDate?: string;
  },
): Promise<ServiceResult<CompetencyAssessment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_competency_assessments") as SB)
    .insert({
      staff_id: input.staffId,
      home_id: input.homeId,
      competency_area: input.competencyArea,
      level: input.level,
      assessed_by: input.assessedBy,
      assessed_date: new Date().toISOString().split("T")[0],
      evidence: input.evidence ?? null,
      development_notes: input.developmentNotes ?? null,
      next_review_date: input.nextReviewDate ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function listCompetencyAssessments(
  homeId: string,
  opts?: { staffId?: string; limit?: number },
): Promise<ServiceResult<CompetencyAssessment[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_competency_assessments") as SB).select("*").eq("home_id", homeId);
  if (opts?.staffId) q = q.eq("staff_id", opts.staffId);
  q = q.order("assessed_date", { ascending: false }).limit(opts?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

// ── Testing exports ────────────────────────────────────────────────────────

export const _testing = {
  computeTrainingStatus,
  computeTrainingMatrix,
  computeCompetencyProfile,
  MANDATORY_TRAINING,
  COMPETENCY_AREAS,
};
