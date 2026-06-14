// ══════════════════════════════════════════════════════════════════════════════
// CARA — YOUNG PERSON ADMISSION WORKFLOW SERVICE
// Full referral-to-placement workflow: intake, screening, impact assessment,
// matching panel, pre-admission, admission planning, and profile creation.
// Follows: "Cara suggests. Humans decide. Cara evidences."
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

export type AdmissionPhase =
  | "referral_intake" | "initial_screening" | "impact_assessment"
  | "matching_panel" | "pre_admission" | "admission_planning"
  | "placement_start" | "completed" | "withdrawn";

export type ImpactAssessmentOutcome = "suitable" | "unsuitable" | "conditionally_suitable";
export type PanelDecision = "accept" | "decline" | "defer" | "conditional_accept";
export type ReferralSource = "local_authority" | "agency" | "emergency" | "internal_transfer" | "court_directed";
export type EducationStatus = "attending" | "part_time" | "excluded" | "awaiting_placement" | "elective_home_ed" | "neet" | "unknown";

export type ChecklistCategory =
  | "documentation" | "health" | "education" | "safeguarding"
  | "environment" | "staffing" | "legal" | "family" | "other";

export type MatchingFactorType =
  | "age_compatibility" | "gender_dynamics" | "needs_compatibility"
  | "risk_compatibility" | "relationship_dynamics" | "cultural_needs"
  | "environmental_capacity" | "staff_skills" | "therapeutic_approach"
  | "education_alignment" | "family_contact_logistics" | "peer_group_dynamics";

export interface AdmissionWorkflow {
  id: string;
  home_id: string;
  referral_id: string | null;
  current_phase: AdmissionPhase;
  child_first_name: string;
  child_last_name: string;
  child_preferred_name: string | null;
  child_date_of_birth: string;
  child_gender: string;
  child_ethnicity: string | null;
  child_religion: string | null;
  child_nationality: string | null;
  child_first_language: string;
  child_interpreter_needed: boolean;
  referral_date: string;
  referral_source: ReferralSource;
  referring_la: string;
  referring_sw_name: string | null;
  referring_sw_phone: string | null;
  referring_sw_email: string | null;
  iro_name: string | null;
  iro_phone: string | null;
  iro_email: string | null;
  legal_status: string | null;
  care_order_type: string | null;
  court_order_expiry: string | null;
  section_20_consent: boolean | null;
  presenting_needs: string[];
  primary_reason_for_placement: string | null;
  risk_factors: string[];
  protective_factors: string[];
  current_living: string | null;
  reason_for_move: string | null;
  placement_history_summary: string | null;
  previous_placements_count: number;
  health_needs: string | null;
  medication_details: string | null;
  mental_health_diagnosis: string[];
  camhs_involvement: boolean;
  camhs_details: string | null;
  gp_name: string | null;
  gp_surgery: string | null;
  gp_phone: string | null;
  dentist_name: string | null;
  school_name: string | null;
  school_type: string | null;
  ehcp_in_place: boolean;
  sen_needs: string | null;
  exclusion_history: string | null;
  education_status: EducationStatus;
  family_composition: string | null;
  contact_arrangements: string | null;
  contact_restrictions: string | null;
  sibling_placements: string | null;
  significant_relationships: string | null;
  impact_assessment_completed: boolean;
  impact_assessment_date: string | null;
  impact_assessment_by: string | null;
  impact_assessment_outcome: ImpactAssessmentOutcome | null;
  impact_on_current_yp: string | null;
  impact_on_staff_capacity: string | null;
  impact_on_environment: string | null;
  safeguarding_considerations: string | null;
  matching_strengths: string | null;
  matching_risks: string | null;
  matching_mitigations: string | null;
  panel_date: string | null;
  panel_chair: string | null;
  panel_members: string[];
  panel_decision: PanelDecision | null;
  panel_conditions: string | null;
  panel_rationale: string | null;
  pre_admission_visit_date: string | null;
  pre_admission_visit_by: string | null;
  pre_admission_visit_notes: string | null;
  child_views_on_placement: string | null;
  family_views_on_placement: string | null;
  pre_admission_checklist: Record<string, unknown>;
  planned_admission_date: string | null;
  actual_admission_date: string | null;
  key_worker_id: string | null;
  secondary_worker_id: string | null;
  bedroom_allocation: string | null;
  welcome_pack_provided: boolean;
  placement_plan_drafted: boolean;
  risk_assessment_completed: boolean;
  missing_protocol_completed: boolean;
  initial_health_assessment: boolean;
  school_arrangements_made: boolean;
  emergency_contacts: Record<string, unknown>[];
  created_yp_id: string | null;
  aria_risk_summary: string | null;
  aria_recommendations: Record<string, unknown>[];
  notes: string | null;
  created_by: string;
  completed_at: string | null;
  withdrawn_at: string | null;
  withdrawn_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhaseHistoryEntry {
  id: string;
  workflow_id: string;
  from_phase: AdmissionPhase;
  to_phase: AdmissionPhase;
  transitioned_by: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface PreAdmissionItem {
  id: string;
  workflow_id: string;
  category: ChecklistCategory;
  item_text: string;
  is_mandatory: boolean;
  is_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  evidence_ref: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface MatchingFactor {
  id: string;
  workflow_id: string;
  factor_type: MatchingFactorType;
  score: number;
  rationale: string;
  risk_level: "low" | "medium" | "high";
  mitigations: string | null;
  assessed_by: string;
  created_at: string;
}

// ── Phase ordering ─────────────────────────────────────────────────────────

export const ADMISSION_PHASES: AdmissionPhase[] = [
  "referral_intake", "initial_screening", "impact_assessment",
  "matching_panel", "pre_admission", "admission_planning",
  "placement_start", "completed",
];

export const PHASE_LABELS: Record<AdmissionPhase, string> = {
  referral_intake: "Referral Intake",
  initial_screening: "Initial Screening",
  impact_assessment: "Impact Assessment",
  matching_panel: "Matching Panel",
  pre_admission: "Pre-Admission",
  admission_planning: "Admission Planning",
  placement_start: "Placement Start",
  completed: "Completed",
  withdrawn: "Withdrawn",
};

export const PHASE_DESCRIPTIONS: Record<AdmissionPhase, string> = {
  referral_intake: "Capture referral details, child information, and referring authority data",
  initial_screening: "Review presenting needs, risk factors, placement history, and initial suitability",
  impact_assessment: "Assess impact on current young people, staff capacity, and environment",
  matching_panel: "Panel review of matching considerations and admission decision",
  pre_admission: "Pre-admission visit, child's views, family views, and checklist completion",
  admission_planning: "Key worker allocation, bedroom, risk assessment, and welcome arrangements",
  placement_start: "Confirm admission date, create young person profile, and initiate placement",
  completed: "Workflow completed — young person profile created and placement active",
  withdrawn: "Referral withdrawn or declined",
};

// ── Default pre-admission checklist template ───────────────────────────────

export const DEFAULT_CHECKLIST_ITEMS: { category: ChecklistCategory; item_text: string; is_mandatory: boolean }[] = [
  // Documentation
  { category: "documentation", item_text: "Referral pack received and reviewed", is_mandatory: true },
  { category: "documentation", item_text: "Care plan received from placing authority", is_mandatory: true },
  { category: "documentation", item_text: "Placement plan template prepared", is_mandatory: true },
  { category: "documentation", item_text: "Risk assessment template prepared", is_mandatory: true },
  { category: "documentation", item_text: "Missing from care protocol prepared", is_mandatory: true },
  { category: "documentation", item_text: "Delegated authority agreement prepared", is_mandatory: true },
  { category: "documentation", item_text: "Consent forms prepared (medical, photos, education)", is_mandatory: true },

  // Health
  { category: "health", item_text: "Health assessment referral made (IHA within 20 working days)", is_mandatory: true },
  { category: "health", item_text: "GP registration arranged", is_mandatory: true },
  { category: "health", item_text: "Dentist registration arranged", is_mandatory: true },
  { category: "health", item_text: "Medication details confirmed and MAR chart prepared", is_mandatory: false },
  { category: "health", item_text: "CAMHS referral or transfer arranged", is_mandatory: false },
  { category: "health", item_text: "Immunisation records obtained", is_mandatory: true },

  // Education
  { category: "education", item_text: "School place confirmed or application submitted", is_mandatory: true },
  { category: "education", item_text: "PEP (Personal Education Plan) meeting arranged", is_mandatory: true },
  { category: "education", item_text: "EHCP transfer initiated (if applicable)", is_mandatory: false },
  { category: "education", item_text: "Virtual School Head notified", is_mandatory: true },

  // Safeguarding
  { category: "safeguarding", item_text: "Safeguarding risk assessment completed", is_mandatory: true },
  { category: "safeguarding", item_text: "Missing from care risk assessment completed", is_mandatory: true },
  { category: "safeguarding", item_text: "CSE/CCE risk assessment completed", is_mandatory: true },
  { category: "safeguarding", item_text: "Online safety assessment completed", is_mandatory: true },
  { category: "safeguarding", item_text: "Behaviour support plan drafted", is_mandatory: true },
  { category: "safeguarding", item_text: "Notification to Ofsted completed", is_mandatory: true },

  // Environment
  { category: "environment", item_text: "Bedroom prepared and personalised", is_mandatory: true },
  { category: "environment", item_text: "Welcome pack assembled", is_mandatory: true },
  { category: "environment", item_text: "Personal belongings storage arranged", is_mandatory: true },
  { category: "environment", item_text: "Fire safety plan updated", is_mandatory: true },

  // Staffing
  { category: "staffing", item_text: "Key worker allocated and briefed", is_mandatory: true },
  { category: "staffing", item_text: "All staff briefed on child's needs", is_mandatory: true },
  { category: "staffing", item_text: "Rota reviewed for staffing adequacy", is_mandatory: true },
  { category: "staffing", item_text: "Specific training needs identified and planned", is_mandatory: false },

  // Legal
  { category: "legal", item_text: "Legal status verified and documented", is_mandatory: true },
  { category: "legal", item_text: "Court order details recorded", is_mandatory: false },
  { category: "legal", item_text: "Contact order details documented", is_mandatory: false },

  // Family
  { category: "family", item_text: "Contact arrangements agreed with placing authority", is_mandatory: true },
  { category: "family", item_text: "Family members notified of placement", is_mandatory: false },
  { category: "family", item_text: "Transport arrangements for contact agreed", is_mandatory: false },
];

// ── CRUD ───────────────────────────────────────────────────────────────────

export async function listAdmissionWorkflows(
  homeId: string,
  opts?: { phase?: AdmissionPhase; limit?: number },
): Promise<ServiceResult<AdmissionWorkflow[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_yp_admission_workflows") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (opts?.phase) q = q.eq("current_phase", opts.phase);
  q = q.order("created_at", { ascending: false }).limit(opts?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getAdmissionWorkflow(
  id: string,
): Promise<ServiceResult<AdmissionWorkflow & { phase_history: PhaseHistoryEntry[]; checklist_items: PreAdmissionItem[]; matching_factors: MatchingFactor[] }>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_yp_admission_workflows") as SB)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };

  // Fetch related data
  const [histRes, checkRes, matchRes] = await Promise.all([
    (s.from("cs_yp_admission_phase_history") as SB)
      .select("*")
      .eq("workflow_id", id)
      .order("created_at", { ascending: true }),
    (s.from("cs_yp_pre_admission_items") as SB)
      .select("*")
      .eq("workflow_id", id)
      .order("sort_order", { ascending: true }),
    (s.from("cs_yp_matching_factors") as SB)
      .select("*")
      .eq("workflow_id", id)
      .order("created_at", { ascending: true }),
  ]);

  return {
    ok: true,
    data: {
      ...data,
      phase_history: histRes.data ?? [],
      checklist_items: checkRes.data ?? [],
      matching_factors: matchRes.data ?? [],
    },
  };
}

export async function createAdmissionWorkflow(
  input: {
    homeId: string;
    childFirstName: string;
    childLastName: string;
    childDateOfBirth: string;
    childGender: string;
    referralSource: ReferralSource;
    referringLa: string;
    createdBy: string;
    referralDate?: string;
    referringSWName?: string;
    referringSWPhone?: string;
    referringSWEmail?: string;
    notes?: string;
  },
): Promise<ServiceResult<AdmissionWorkflow>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_yp_admission_workflows") as SB)
    .insert({
      home_id: input.homeId,
      child_first_name: input.childFirstName,
      child_last_name: input.childLastName,
      child_date_of_birth: input.childDateOfBirth,
      child_gender: input.childGender,
      referral_source: input.referralSource,
      referring_la: input.referringLa,
      referring_sw_name: input.referringSWName ?? null,
      referring_sw_phone: input.referringSWPhone ?? null,
      referring_sw_email: input.referringSWEmail ?? null,
      referral_date: input.referralDate ?? new Date().toISOString().split("T")[0],
      notes: input.notes ?? null,
      created_by: input.createdBy,
      current_phase: "referral_intake",
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateAdmissionWorkflow(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<AdmissionWorkflow>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_yp_admission_workflows") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Phase transitions ──────────────────────────────────────────────────────

export async function advancePhase(
  workflowId: string,
  toPhase: AdmissionPhase,
  userId: string,
  opts?: { reason?: string; notes?: string },
): Promise<ServiceResult<AdmissionWorkflow>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  // Get current phase
  const { data: current, error: fetchErr } = await (s.from("cs_yp_admission_workflows") as SB)
    .select("current_phase")
    .eq("id", workflowId)
    .single();
  if (fetchErr) return { ok: false, error: fetchErr.message };

  const fromPhase = current.current_phase as AdmissionPhase;

  // Validate transition
  const validation = validatePhaseTransition(fromPhase, toPhase);
  if (!validation.valid) return { ok: false, error: validation.reason! };

  // Record phase history
  await (s.from("cs_yp_admission_phase_history") as SB).insert({
    workflow_id: workflowId,
    from_phase: fromPhase,
    to_phase: toPhase,
    transitioned_by: userId,
    reason: opts?.reason ?? null,
    notes: opts?.notes ?? null,
  });

  // Update workflow
  const updateData: Record<string, unknown> = {
    current_phase: toPhase,
    updated_at: new Date().toISOString(),
  };

  if (toPhase === "completed") {
    updateData.completed_at = new Date().toISOString();
  } else if (toPhase === "withdrawn") {
    updateData.withdrawn_at = new Date().toISOString();
    updateData.withdrawn_reason = opts?.reason ?? null;
  }

  // When moving to pre_admission, create checklist items
  if (toPhase === "pre_admission") {
    await createDefaultChecklistItems(s, workflowId);
  }

  const { data, error } = await (s.from("cs_yp_admission_workflows") as SB)
    .update(updateData)
    .eq("id", workflowId)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function withdrawWorkflow(
  workflowId: string,
  userId: string,
  reason: string,
): Promise<ServiceResult<AdmissionWorkflow>> {
  return advancePhase(workflowId, "withdrawn", userId, { reason });
}

// ── Phase transition validation (pure) ─────────────────────────────────────

const VALID_TRANSITIONS: Record<AdmissionPhase, AdmissionPhase[]> = {
  referral_intake: ["initial_screening", "withdrawn"],
  initial_screening: ["impact_assessment", "withdrawn"],
  impact_assessment: ["matching_panel", "withdrawn"],
  matching_panel: ["pre_admission", "withdrawn"],
  pre_admission: ["admission_planning", "withdrawn"],
  admission_planning: ["placement_start", "withdrawn"],
  placement_start: ["completed", "withdrawn"],
  completed: [],
  withdrawn: [],
};

export function validatePhaseTransition(
  from: AdmissionPhase,
  to: AdmissionPhase,
): { valid: boolean; reason?: string } {
  if (from === to) return { valid: false, reason: "Already in this phase" };
  if (from === "completed") return { valid: false, reason: "Workflow already completed" };
  if (from === "withdrawn") return { valid: false, reason: "Workflow already withdrawn" };

  const allowed = VALID_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    return {
      valid: false,
      reason: `Cannot transition from ${PHASE_LABELS[from]} to ${PHASE_LABELS[to]}. Allowed: ${allowed.map((p) => PHASE_LABELS[p]).join(", ")}`,
    };
  }

  return { valid: true };
}

export function computePhaseProgress(phase: AdmissionPhase): { current: number; total: number; percentage: number } {
  const idx = ADMISSION_PHASES.indexOf(phase);
  if (phase === "withdrawn") return { current: 0, total: ADMISSION_PHASES.length, percentage: 0 };
  if (idx === -1) return { current: 0, total: ADMISSION_PHASES.length, percentage: 0 };
  return {
    current: idx + 1,
    total: ADMISSION_PHASES.length,
    percentage: Math.round(((idx + 1) / ADMISSION_PHASES.length) * 100),
  };
}

// ── Pre-admission checklist ────────────────────────────────────────────────

async function createDefaultChecklistItems(s: SB, workflowId: string): Promise<void> {
  const items = DEFAULT_CHECKLIST_ITEMS.map((item, idx) => ({
    workflow_id: workflowId,
    category: item.category,
    item_text: item.item_text,
    is_mandatory: item.is_mandatory,
    sort_order: idx,
  }));

  await (s.from("cs_yp_pre_admission_items") as SB).insert(items);
}

export async function getChecklistItems(
  workflowId: string,
): Promise<ServiceResult<PreAdmissionItem[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  const { data, error } = await (s.from("cs_yp_pre_admission_items") as SB)
    .select("*")
    .eq("workflow_id", workflowId)
    .order("sort_order", { ascending: true });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function completeChecklistItem(
  itemId: string,
  userId: string,
  opts?: { evidenceRef?: string; notes?: string },
): Promise<ServiceResult<PreAdmissionItem>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_yp_pre_admission_items") as SB)
    .update({
      is_completed: true,
      completed_by: userId,
      completed_at: new Date().toISOString(),
      evidence_ref: opts?.evidenceRef ?? null,
      notes: opts?.notes ?? null,
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function addChecklistItem(
  workflowId: string,
  item: { category: ChecklistCategory; itemText: string; isMandatory?: boolean },
): Promise<ServiceResult<PreAdmissionItem>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_yp_pre_admission_items") as SB)
    .insert({
      workflow_id: workflowId,
      category: item.category,
      item_text: item.itemText,
      is_mandatory: item.isMandatory ?? false,
      sort_order: 999,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export function computeChecklistProgress(
  items: PreAdmissionItem[],
): { total: number; completed: number; mandatory_total: number; mandatory_completed: number; percentage: number; ready: boolean } {
  const total = items.length;
  const completed = items.filter((i) => i.is_completed).length;
  const mandatory = items.filter((i) => i.is_mandatory);
  const mandatoryCompleted = mandatory.filter((i) => i.is_completed).length;

  return {
    total,
    completed,
    mandatory_total: mandatory.length,
    mandatory_completed: mandatoryCompleted,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    ready: mandatoryCompleted === mandatory.length,
  };
}

// ── Matching factors ───────────────────────────────────────────────────────

export async function addMatchingFactor(
  workflowId: string,
  factor: {
    factorType: MatchingFactorType;
    score: number;
    rationale: string;
    riskLevel?: "low" | "medium" | "high";
    mitigations?: string;
    assessedBy?: string;
  },
): Promise<ServiceResult<MatchingFactor>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_yp_matching_factors") as SB)
    .insert({
      workflow_id: workflowId,
      factor_type: factor.factorType,
      score: factor.score,
      rationale: factor.rationale,
      risk_level: factor.riskLevel ?? "low",
      mitigations: factor.mitigations ?? null,
      assessed_by: factor.assessedBy ?? "manual",
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function getMatchingFactors(
  workflowId: string,
): Promise<ServiceResult<MatchingFactor[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  const { data, error } = await (s.from("cs_yp_matching_factors") as SB)
    .select("*")
    .eq("workflow_id", workflowId)
    .order("created_at", { ascending: true });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export function computeMatchingScore(factors: MatchingFactor[]): {
  overall: number;
  highRiskCount: number;
  recommendation: "strongly_suitable" | "suitable" | "conditionally_suitable" | "not_suitable";
} {
  if (factors.length === 0) {
    return { overall: 0, highRiskCount: 0, recommendation: "not_suitable" };
  }

  const avg = factors.reduce((sum, f) => sum + f.score, 0) / factors.length;
  const highRisk = factors.filter((f) => f.risk_level === "high").length;

  let recommendation: "strongly_suitable" | "suitable" | "conditionally_suitable" | "not_suitable";
  if (avg >= 8 && highRisk === 0) recommendation = "strongly_suitable";
  else if (avg >= 6 && highRisk <= 1) recommendation = "suitable";
  else if (avg >= 4) recommendation = "conditionally_suitable";
  else recommendation = "not_suitable";

  return {
    overall: Math.round(avg * 10) / 10,
    highRiskCount: highRisk,
    recommendation,
  };
}

// ── Cara matching intelligence (pure) ──────────────────────────────────────

export interface CaraMatchingInput {
  incomingChild: {
    age: number;
    gender: string;
    presentingNeeds: string[];
    riskFactors: string[];
    mentalHealthDiagnosis: string[];
    previousPlacements: number;
  };
  currentYoungPeople: {
    age: number;
    gender: string;
    riskFlags: string[];
    status: string;
  }[];
  homeCapacity: number;
}

export function generateCaraMatchingFactors(input: CaraMatchingInput): {
  factors: { factorType: MatchingFactorType; score: number; rationale: string; riskLevel: "low" | "medium" | "high" }[];
  overallRisk: "low" | "medium" | "high";
  summary: string;
} {
  const factors: { factorType: MatchingFactorType; score: number; rationale: string; riskLevel: "low" | "medium" | "high" }[] = [];
  const { incomingChild, currentYoungPeople, homeCapacity } = input;
  const currentCount = currentYoungPeople.filter((yp) => yp.status === "current").length;

  // Age compatibility
  const ages = currentYoungPeople.filter((yp) => yp.status === "current").map((yp) => yp.age);
  if (ages.length === 0) {
    factors.push({ factorType: "age_compatibility", score: 8, rationale: "No current residents — no age compatibility issues.", riskLevel: "low" });
  } else {
    const avgAge = ages.reduce((a, b) => a + b, 0) / ages.length;
    const ageDiff = Math.abs(incomingChild.age - avgAge);
    const score = ageDiff <= 2 ? 9 : ageDiff <= 4 ? 7 : ageDiff <= 6 ? 5 : 3;
    const risk = ageDiff <= 3 ? "low" : ageDiff <= 5 ? "medium" : "high";
    factors.push({
      factorType: "age_compatibility",
      score,
      rationale: `Incoming child is ${incomingChild.age}, current residents average ${avgAge.toFixed(1)}. Age gap of ${ageDiff.toFixed(1)} years${ageDiff > 4 ? " may create peer dynamic challenges" : " is within acceptable range"}.`,
      riskLevel: risk,
    });
  }

  // Environmental capacity
  const capacityScore = currentCount < homeCapacity - 1 ? 9 : currentCount < homeCapacity ? 7 : 4;
  const capacityRisk = currentCount >= homeCapacity ? "high" : currentCount >= homeCapacity - 1 ? "medium" : "low";
  factors.push({
    factorType: "environmental_capacity",
    score: capacityScore,
    rationale: `Home capacity is ${homeCapacity}, currently ${currentCount} resident${currentCount !== 1 ? "s" : ""}. ${currentCount >= homeCapacity ? "At full capacity — placement would exceed registered numbers." : `${homeCapacity - currentCount} place${homeCapacity - currentCount !== 1 ? "s" : ""} available.`}`,
    riskLevel: capacityRisk,
  });

  // Risk compatibility
  const highRiskNeeds = ["cse", "cce", "self_harm", "suicidal_ideation", "substance_misuse", "firesetting", "sexually_harmful_behaviour"];
  const incomingHighRisk = incomingChild.riskFactors.filter((r) => highRiskNeeds.some((hr) => r.toLowerCase().includes(hr)));
  const currentHighRisk = currentYoungPeople.flatMap((yp) => yp.riskFlags).filter((r) => highRiskNeeds.some((hr) => r.toLowerCase().includes(hr)));
  const riskOverlap = incomingHighRisk.filter((r) => currentHighRisk.some((cr) => cr.toLowerCase().includes(r.toLowerCase())));

  let riskScore = 8;
  let riskLevel: "low" | "medium" | "high" = "low";
  if (riskOverlap.length > 0) { riskScore = 3; riskLevel = "high"; }
  else if (incomingHighRisk.length > 2) { riskScore = 5; riskLevel = "medium"; }
  else if (incomingHighRisk.length > 0) { riskScore = 6; riskLevel = "medium"; }

  factors.push({
    factorType: "risk_compatibility",
    score: riskScore,
    rationale: riskOverlap.length > 0
      ? `Overlapping high-risk factors identified between incoming child and current residents. Careful risk management planning required.`
      : incomingHighRisk.length > 0
        ? `Incoming child has ${incomingHighRisk.length} high-risk factor${incomingHighRisk.length > 1 ? "s" : ""} that require specific management.`
        : "No significant risk compatibility concerns identified.",
    riskLevel: riskLevel,
  });

  // Needs compatibility
  const complexNeeds = incomingChild.mentalHealthDiagnosis.length + (incomingChild.presentingNeeds.length > 3 ? 1 : 0);
  const needsScore = complexNeeds === 0 ? 8 : complexNeeds <= 2 ? 6 : 4;
  factors.push({
    factorType: "needs_compatibility",
    score: needsScore,
    rationale: `Incoming child has ${incomingChild.presentingNeeds.length} presenting need${incomingChild.presentingNeeds.length !== 1 ? "s" : ""} and ${incomingChild.mentalHealthDiagnosis.length} mental health diagnosis${incomingChild.mentalHealthDiagnosis.length !== 1 ? "es" : ""}. ${complexNeeds > 2 ? "Complex needs may require additional staff training or specialist support." : "Needs are within the home's typical support range."}`,
    riskLevel: complexNeeds > 2 ? "high" : complexNeeds > 0 ? "medium" : "low",
  });

  // Placement stability indicator
  const stabilityScore = incomingChild.previousPlacements <= 1 ? 8 : incomingChild.previousPlacements <= 3 ? 6 : incomingChild.previousPlacements <= 5 ? 4 : 3;
  factors.push({
    factorType: "relationship_dynamics",
    score: stabilityScore,
    rationale: `${incomingChild.previousPlacements} previous placement${incomingChild.previousPlacements !== 1 ? "s" : ""}. ${incomingChild.previousPlacements > 3 ? "Multiple placement breakdowns suggest significant relationship challenges — enhanced support plan needed." : "Placement history does not indicate elevated breakdown risk."}`,
    riskLevel: incomingChild.previousPlacements > 3 ? "high" : incomingChild.previousPlacements > 1 ? "medium" : "low",
  });

  // Overall risk
  const highRiskFactors = factors.filter((f) => f.riskLevel === "high").length;
  const overallRisk = highRiskFactors >= 2 ? "high" : highRiskFactors === 1 || factors.some((f) => f.riskLevel === "medium") ? "medium" : "low";

  const avgScore = factors.reduce((sum, f) => sum + f.score, 0) / factors.length;
  const summary = `Cara matching analysis: ${factors.length} factors assessed, overall score ${avgScore.toFixed(1)}/10. ${highRiskFactors > 0 ? `${highRiskFactors} high-risk factor${highRiskFactors > 1 ? "s" : ""} identified requiring mitigation.` : "No high-risk factors identified."} ${overallRisk === "high" ? "Enhanced risk management and close monitoring recommended." : overallRisk === "medium" ? "Standard risk management with targeted monitoring." : "Standard care arrangements should be appropriate."}`;

  return { factors, overallRisk, summary };
}

// ── Create young person profile from workflow ──────────────────────────────

export async function createYoungPersonFromWorkflow(
  workflowId: string,
  userId: string,
  opts?: { keyWorkerId?: string; secondaryWorkerId?: string; placementStart?: string },
): Promise<ServiceResult<{ youngPersonId: string }>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  // Get workflow
  const { data: wf, error: wfErr } = await (s.from("cs_yp_admission_workflows") as SB)
    .select("*")
    .eq("id", workflowId)
    .single();
  if (wfErr) return { ok: false, error: wfErr.message };

  if (wf.created_yp_id) {
    return { ok: false, error: "Young person profile already created for this workflow" };
  }

  // Insert into young_people table
  const { data: yp, error: ypErr } = await (s.from("young_people") as SB)
    .insert({
      first_name: wf.child_first_name,
      last_name: wf.child_last_name,
      preferred_name: wf.child_preferred_name,
      date_of_birth: wf.child_date_of_birth,
      gender: wf.child_gender,
      ethnicity: wf.child_ethnicity,
      religion: wf.child_religion,
      placement_start: opts?.placementStart ?? wf.actual_admission_date ?? new Date().toISOString().split("T")[0],
      placement_type: "residential",
      local_authority: wf.referring_la,
      social_worker_name: wf.referring_sw_name ?? "",
      social_worker_phone: wf.referring_sw_phone,
      social_worker_email: wf.referring_sw_email,
      iro_name: wf.iro_name,
      iro_phone: wf.iro_phone,
      key_worker_id: opts?.keyWorkerId ?? wf.key_worker_id,
      secondary_worker_id: opts?.secondaryWorkerId ?? wf.secondary_worker_id,
      legal_status: wf.legal_status ?? "Section 31",
      risk_flags: wf.risk_factors ?? [],
      dietary_requirements: null,
      allergies: [],
      gp_name: wf.gp_name,
      gp_phone: wf.gp_phone,
      school_name: wf.school_name,
      school_contact: null,
      status: "current",
      home_id: wf.home_id,
      created_by: userId,
    })
    .select("id")
    .single();

  if (ypErr) return { ok: false, error: ypErr.message };

  // Link back to workflow
  await (s.from("cs_yp_admission_workflows") as SB)
    .update({ created_yp_id: yp.id, updated_at: new Date().toISOString() })
    .eq("id", workflowId);

  return { ok: true, data: { youngPersonId: yp.id } };
}

// ── Workflow stats ─────────────────────────────────────────────────────────

export async function getAdmissionStats(
  homeId: string,
): Promise<ServiceResult<{
  total: number;
  by_phase: Record<string, number>;
  active: number;
  completed: number;
  withdrawn: number;
  avg_days_to_placement: number;
}>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_yp_admission_workflows") as SB)
    .select("current_phase, created_at, completed_at")
    .eq("home_id", homeId);

  if (error) return { ok: false, error: error.message };

  const all = data ?? [];
  const byPhase: Record<string, number> = {};
  let completedDays: number[] = [];

  for (const wf of all) {
    byPhase[wf.current_phase] = (byPhase[wf.current_phase] ?? 0) + 1;
    if (wf.completed_at) {
      const days = Math.floor((new Date(wf.completed_at).getTime() - new Date(wf.created_at).getTime()) / 86400000);
      completedDays.push(days);
    }
  }

  return {
    ok: true,
    data: {
      total: all.length,
      by_phase: byPhase,
      active: all.filter((w: any) => !["completed", "withdrawn"].includes(w.current_phase)).length,
      completed: all.filter((w: any) => w.current_phase === "completed").length,
      withdrawn: all.filter((w: any) => w.current_phase === "withdrawn").length,
      avg_days_to_placement: completedDays.length > 0 ? Math.round(completedDays.reduce((a, b) => a + b, 0) / completedDays.length) : 0,
    },
  };
}

// ── Testing exports ────────────────────────────────────────────────────────

export const _testing = {
  validatePhaseTransition,
  computePhaseProgress,
  computeChecklistProgress,
  computeMatchingScore,
  generateCaraMatchingFactors,
  ADMISSION_PHASES,
  VALID_TRANSITIONS,
  DEFAULT_CHECKLIST_ITEMS,
};
