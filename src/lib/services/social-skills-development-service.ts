// ══════════════════════════════════════════════════════════════════════════════
// CARA — SOCIAL SKILLS DEVELOPMENT SERVICE
// Tracks social skills training, group work sessions,
// communication building, and interpersonal development.
// CHR 2015 Reg 8(2)(a)(vii) (social development),
// Reg 6 (quality of care — social competence).
//
// Covers: skill area, competence level, progress assessment,
// group dynamic, and development tracking.
//
// SCCIF: Experiences — "Children develop positive social skills."
// "Social development is actively supported and celebrated."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type SkillArea =
  | "communication"
  | "conflict_resolution"
  | "empathy_building"
  | "teamwork"
  | "turn_taking"
  | "active_listening"
  | "emotional_literacy"
  | "boundary_setting"
  | "friendship_skills"
  | "other";

export type CompetenceLevel =
  | "advanced"
  | "proficient"
  | "developing"
  | "emerging"
  | "not_demonstrated";

export type ProgressAssessment =
  | "significant_progress"
  | "good_progress"
  | "some_progress"
  | "no_progress"
  | "regression";

export type GroupDynamic =
  | "positive_leader"
  | "active_participant"
  | "passive_participant"
  | "disruptive"
  | "withdrawn";

export interface SocialSkillsDevelopmentRecord {
  id: string;
  home_id: string;
  skill_area: SkillArea;
  competence_level: CompetenceLevel;
  progress_assessment: ProgressAssessment;
  group_dynamic: GroupDynamic;
  session_date: string;
  child_name: string;
  child_id: string | null;
  facilitated_by: string;
  /** Tri-state judgements: null = not recorded. Absence is never an answer —
   *  rates are taken over the records where the question was answered. */
  child_engaged: boolean | null;
  age_appropriate: boolean | null;
  strengths_identified: boolean | null;
  targets_set: boolean | null;
  positive_reinforcement: boolean | null;
  peer_modelling_used: boolean | null;
  care_plan_reflects: boolean | null;
  social_worker_informed: boolean | null;
  family_updated: boolean | null;
  school_linked: boolean | null;
  therapeutic_input: boolean | null;
  recorded_promptly: boolean | null;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SKILL_AREAS: { area: SkillArea; label: string }[] = [
  { area: "communication", label: "Communication" },
  { area: "conflict_resolution", label: "Conflict Resolution" },
  { area: "empathy_building", label: "Empathy Building" },
  { area: "teamwork", label: "Teamwork" },
  { area: "turn_taking", label: "Turn Taking" },
  { area: "active_listening", label: "Active Listening" },
  { area: "emotional_literacy", label: "Emotional Literacy" },
  { area: "boundary_setting", label: "Boundary Setting" },
  { area: "friendship_skills", label: "Friendship Skills" },
  { area: "other", label: "Other" },
];

export const COMPETENCE_LEVELS: { level: CompetenceLevel; label: string }[] = [
  { level: "advanced", label: "Advanced" },
  { level: "proficient", label: "Proficient" },
  { level: "developing", label: "Developing" },
  { level: "emerging", label: "Emerging" },
  { level: "not_demonstrated", label: "Not Demonstrated" },
];

export const PROGRESS_ASSESSMENTS: { assessment: ProgressAssessment; label: string }[] = [
  { assessment: "significant_progress", label: "Significant Progress" },
  { assessment: "good_progress", label: "Good Progress" },
  { assessment: "some_progress", label: "Some Progress" },
  { assessment: "no_progress", label: "No Progress" },
  { assessment: "regression", label: "Regression" },
];

export const GROUP_DYNAMICS: { dynamic: GroupDynamic; label: string }[] = [
  { dynamic: "positive_leader", label: "Positive Leader" },
  { dynamic: "active_participant", label: "Active Participant" },
  { dynamic: "passive_participant", label: "Passive Participant" },
  { dynamic: "disruptive", label: "Disruptive" },
  { dynamic: "withdrawn", label: "Withdrawn" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeSocialSkillsMetrics(
  records: SocialSkillsDevelopmentRecord[],
): {
  total_sessions: number;
  regression_count: number;
  no_progress_count: number;
  disruptive_count: number;
  withdrawn_count: number;
  child_engaged_rate: number | null;
  age_appropriate_rate: number | null;
  strengths_rate: number | null;
  targets_rate: number | null;
  positive_reinforcement_rate: number | null;
  peer_modelling_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  family_updated_rate: number | null;
  school_linked_rate: number | null;
  therapeutic_input_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_skill_area: Record<string, number>;
  by_competence_level: Record<string, number>;
  by_progress_assessment: Record<string, number>;
  by_group_dynamic: Record<string, number>;
} {
  const regression = records.filter((r) => r.progress_assessment === "regression").length;
  const noProgress = records.filter((r) => r.progress_assessment === "no_progress").length;
  const disruptive = records.filter((r) => r.group_dynamic === "disruptive").length;
  const withdrawn = records.filter((r) => r.group_dynamic === "withdrawn").length;

  // Rated over the records where the question was answered either way. An
  // unrecorded judgement in the denominator would score silence as a "no" —
  // the same fabrication the old `?? true` create made in the other direction.
  const boolRate = (field: keyof SocialSkillsDevelopmentRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const byArea: Record<string, number> = {};
  for (const r of records) byArea[r.skill_area] = (byArea[r.skill_area] ?? 0) + 1;

  const byLevel: Record<string, number> = {};
  for (const r of records) byLevel[r.competence_level] = (byLevel[r.competence_level] ?? 0) + 1;

  const byProgress: Record<string, number> = {};
  for (const r of records) byProgress[r.progress_assessment] = (byProgress[r.progress_assessment] ?? 0) + 1;

  const byDynamic: Record<string, number> = {};
  for (const r of records) byDynamic[r.group_dynamic] = (byDynamic[r.group_dynamic] ?? 0) + 1;

  return {
    total_sessions: records.length,
    regression_count: regression,
    no_progress_count: noProgress,
    disruptive_count: disruptive,
    withdrawn_count: withdrawn,
    child_engaged_rate: boolRate("child_engaged"),
    age_appropriate_rate: boolRate("age_appropriate"),
    strengths_rate: boolRate("strengths_identified"),
    targets_rate: boolRate("targets_set"),
    positive_reinforcement_rate: boolRate("positive_reinforcement"),
    peer_modelling_rate: boolRate("peer_modelling_used"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    family_updated_rate: boolRate("family_updated"),
    school_linked_rate: boolRate("school_linked"),
    therapeutic_input_rate: boolRate("therapeutic_input"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_skill_area: byArea,
    by_competence_level: byLevel,
    by_progress_assessment: byProgress,
    by_group_dynamic: byDynamic,
  };
}

export function identifySocialSkillsAlerts(
  records: SocialSkillsDevelopmentRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];

  // Regression while disruptive — per-record
  for (const r of records) {
    if (r.progress_assessment === "regression" && r.group_dynamic === "disruptive") {
      alerts.push({
        type: "regression_disruptive",
        severity: "critical",
        message: `${r.child_name} is regressing in ${r.skill_area.replace(/_/g, " ")} and showing disruptive behaviour — urgent support needed`,
        id: r.id,
      });
    }
  }

  // No targets set
  const noTargets = records.filter((r) => !r.targets_set).length;
  if (noTargets >= 1) {
    alerts.push({
      type: "no_targets_set",
      severity: "high",
      message: `${noTargets} ${noTargets === 1 ? "session has" : "sessions have"} no targets set — ensure structured development goals`,
      id: "no_targets_set",
    });
  }

  // Strengths not identified
  const noStrengths = records.filter((r) => !r.strengths_identified).length;
  if (noStrengths >= 1) {
    alerts.push({
      type: "strengths_not_identified",
      severity: "high",
      message: `${noStrengths} ${noStrengths === 1 ? "session has" : "sessions have"} strengths not identified — build on existing competencies`,
      id: "strengths_not_identified",
    });
  }

  // No positive reinforcement
  const noReinforcement = records.filter((r) => !r.positive_reinforcement).length;
  if (noReinforcement >= 2) {
    alerts.push({
      type: "no_positive_reinforcement",
      severity: "medium",
      message: `${noReinforcement} sessions without positive reinforcement — essential for skill development`,
      id: "no_positive_reinforcement",
    });
  }

  // No therapeutic input
  const noTherapeutic = records.filter((r) => !r.therapeutic_input).length;
  if (noTherapeutic >= 2) {
    alerts.push({
      type: "no_therapeutic_input",
      severity: "medium",
      message: `${noTherapeutic} sessions without therapeutic input — consider specialist involvement`,
      id: "no_therapeutic_input",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    skillArea?: SkillArea;
    competenceLevel?: CompetenceLevel;
    progressAssessment?: ProgressAssessment;
    groupDynamic?: GroupDynamic;
    limit?: number;
  },
): Promise<ServiceResult<SocialSkillsDevelopmentRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_social_skills_development") as SB).select("*").eq("home_id", homeId);
  if (filters?.skillArea) q = q.eq("skill_area", filters.skillArea);
  if (filters?.competenceLevel) q = q.eq("competence_level", filters.competenceLevel);
  if (filters?.progressAssessment) q = q.eq("progress_assessment", filters.progressAssessment);
  if (filters?.groupDynamic) q = q.eq("group_dynamic", filters.groupDynamic);
  q = q.order("session_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as SocialSkillsDevelopmentRecord[] };
}

export async function createRecord(payload: {
  homeId: string;
  skillArea: SkillArea;
  competenceLevel: CompetenceLevel;
  progressAssessment: ProgressAssessment;
  groupDynamic: GroupDynamic;
  sessionDate: string;
  childName: string;
  childId?: string | null;
  facilitatedBy: string;
  childEngaged?: boolean;
  ageAppropriate?: boolean;
  strengthsIdentified?: boolean;
  targetsSet?: boolean;
  positiveReinforcement?: boolean;
  peerModellingUsed?: boolean;
  carePlanReflects?: boolean;
  socialWorkerInformed?: boolean;
  familyUpdated?: boolean;
  schoolLinked?: boolean;
  therapeuticInput?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<SocialSkillsDevelopmentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_social_skills_development") as SB)
    .insert({
      home_id: payload.homeId,
      skill_area: payload.skillArea,
      competence_level: payload.competenceLevel,
      progress_assessment: payload.progressAssessment,
      group_dynamic: payload.groupDynamic,
      session_date: payload.sessionDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      facilitated_by: payload.facilitatedBy,
      child_engaged: payload.childEngaged ?? null,
      age_appropriate: payload.ageAppropriate ?? null,
      strengths_identified: payload.strengthsIdentified ?? null,
      targets_set: payload.targetsSet ?? null,
      positive_reinforcement: payload.positiveReinforcement ?? null,
      peer_modelling_used: payload.peerModellingUsed ?? null,
      care_plan_reflects: payload.carePlanReflects ?? null,
      social_worker_informed: payload.socialWorkerInformed ?? null,
      family_updated: payload.familyUpdated ?? null,
      school_linked: payload.schoolLinked ?? null,
      therapeutic_input: payload.therapeuticInput ?? null,
      recorded_promptly: payload.recordedPromptly ?? null,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as SocialSkillsDevelopmentRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    skillArea: SkillArea;
    competenceLevel: CompetenceLevel;
    progressAssessment: ProgressAssessment;
    groupDynamic: GroupDynamic;
    sessionDate: string;
    childName: string;
    childId: string | null;
    facilitatedBy: string;
    childEngaged: boolean;
    ageAppropriate: boolean;
    strengthsIdentified: boolean;
    targetsSet: boolean;
    positiveReinforcement: boolean;
    peerModellingUsed: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    familyUpdated: boolean;
    schoolLinked: boolean;
    therapeuticInput: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<SocialSkillsDevelopmentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.skillArea !== undefined) mapped.skill_area = updates.skillArea;
  if (updates.competenceLevel !== undefined) mapped.competence_level = updates.competenceLevel;
  if (updates.progressAssessment !== undefined) mapped.progress_assessment = updates.progressAssessment;
  if (updates.groupDynamic !== undefined) mapped.group_dynamic = updates.groupDynamic;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.facilitatedBy !== undefined) mapped.facilitated_by = updates.facilitatedBy;
  if (updates.childEngaged !== undefined) mapped.child_engaged = updates.childEngaged;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.strengthsIdentified !== undefined) mapped.strengths_identified = updates.strengthsIdentified;
  if (updates.targetsSet !== undefined) mapped.targets_set = updates.targetsSet;
  if (updates.positiveReinforcement !== undefined) mapped.positive_reinforcement = updates.positiveReinforcement;
  if (updates.peerModellingUsed !== undefined) mapped.peer_modelling_used = updates.peerModellingUsed;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.familyUpdated !== undefined) mapped.family_updated = updates.familyUpdated;
  if (updates.schoolLinked !== undefined) mapped.school_linked = updates.schoolLinked;
  if (updates.therapeuticInput !== undefined) mapped.therapeutic_input = updates.therapeuticInput;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_social_skills_development") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as SocialSkillsDevelopmentRecord };
}

export const _testing = { computeSocialSkillsMetrics, identifySocialSkillsAlerts };
