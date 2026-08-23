// ══════════════════════════════════════════════════════════════════════════════
// CARA — HEALTH & WELLBEING SERVICE
// Tracks medical appointments, dental/optician visits, immunisation status,
// emotional wellbeing (SDQ scores), CAMHS referrals, and statutory health
// assessments. CHR 2015 Reg 23 (health and wellbeing).
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import { londonDayDiff } from "@/lib/utils";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface HealthAppointment {
  id: string;
  home_id: string;
  child_id: string;
  appointment_type: string;
  provider_name: string;
  appointment_date: string;
  outcome: string; // attended, cancelled, dna (did not attend), rescheduled
  notes?: string | null;
  follow_up_required: boolean;
  follow_up_date?: string | null;
  consent_obtained: boolean;
  accompanied_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WellbeingAssessment {
  id: string;
  home_id: string;
  child_id: string;
  assessment_date: string;
  assessment_type: string; // sdq, informal, professional
  sdq_scores?: {
    emotional_symptoms: number;
    conduct_problems: number;
    hyperactivity: number;
    peer_problems: number;
    prosocial: number;
    total_difficulties: number;
    impact_score?: number;
  } | null;
  overall_wellbeing: number; // 1-10
  sleep_quality?: number | null; // 1-5
  appetite?: number | null; // 1-5
  self_care?: number | null; // 1-5
  notes?: string | null;
  assessed_by: string;
  created_at: string;
}

export interface HealthProfile {
  id: string;
  home_id: string;
  child_id: string;
  immunisation_status: string;
  allergies: string[];
  dietary_requirements: string[];
  registered_gp: string;
  registered_dentist: string;
  registered_optician: string;
  camhs_status: string; // none, referred, active, discharged
  last_health_assessment?: string | null;
  next_health_assessment?: string | null;
  health_conditions: string[];
  created_at: string;
  updated_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

export const APPOINTMENT_TYPES: {
  type: string;
  label: string;
  recommended_frequency_weeks: number;
}[] = [
  { type: "gp", label: "GP Appointment", recommended_frequency_weeks: 0 },
  { type: "dentist", label: "Dentist", recommended_frequency_weeks: 26 },
  { type: "optician", label: "Optician", recommended_frequency_weeks: 52 },
  { type: "camhs", label: "CAMHS", recommended_frequency_weeks: 0 },
  { type: "hospital", label: "Hospital/A&E", recommended_frequency_weeks: 0 },
  { type: "specialist", label: "Specialist", recommended_frequency_weeks: 0 },
  { type: "sexual_health", label: "Sexual Health", recommended_frequency_weeks: 0 },
  { type: "immunisation", label: "Immunisation", recommended_frequency_weeks: 0 },
  { type: "health_assessment", label: "Health Assessment (IHA/RHA)", recommended_frequency_weeks: 52 },
];

export const WELLBEING_DIMENSIONS: {
  dimension: string;
  label: string;
  sdq_subscale: string;
}[] = [
  { dimension: "emotional", label: "Emotional Wellbeing", sdq_subscale: "emotional_symptoms" },
  { dimension: "behavioural", label: "Behavioural", sdq_subscale: "conduct_problems" },
  { dimension: "social", label: "Social/Peer Relationships", sdq_subscale: "peer_problems" },
  { dimension: "hyperactivity", label: "Hyperactivity/Attention", sdq_subscale: "hyperactivity" },
  { dimension: "prosocial", label: "Prosocial Behaviour", sdq_subscale: "prosocial" },
];

export const SDQ_BANDS: Record<
  string,
  { normal: [number, number]; borderline: [number, number]; abnormal: [number, number] }
> = {
  total_difficulties: { normal: [0, 13], borderline: [14, 16], abnormal: [17, 40] },
  emotional_symptoms: { normal: [0, 3], borderline: [4, 4], abnormal: [5, 10] },
  conduct_problems: { normal: [0, 2], borderline: [3, 3], abnormal: [4, 10] },
  peer_problems: { normal: [0, 2], borderline: [3, 3], abnormal: [4, 10] },
  hyperactivity: { normal: [0, 5], borderline: [6, 6], abnormal: [7, 10] },
  prosocial: { normal: [6, 10], borderline: [5, 5], abnormal: [0, 4] },
};

export const IMMUNISATION_STATUS = [
  "up_to_date",
  "partially_complete",
  "unknown",
  "declined",
  "medical_exemption",
] as const;

// ── Pure functions (no DB) ─────────────────────────────────────────────────

/**
 * Classify a single SDQ subscale score into normal / borderline / abnormal.
 */
function classifySubscale(
  subscale: string,
  score: number,
): "normal" | "borderline" | "abnormal" {
  const bands = SDQ_BANDS[subscale];
  if (!bands) return "normal";

  if (score >= bands.normal[0] && score <= bands.normal[1]) return "normal";
  if (score >= bands.borderline[0] && score <= bands.borderline[1]) return "borderline";
  return "abnormal";
}

/**
 * Classify all SDQ subscale scores into bands.
 */
export function classifySDQScores(scores: {
  emotional_symptoms: number;
  conduct_problems: number;
  hyperactivity: number;
  peer_problems: number;
  prosocial: number;
  total_difficulties: number;
}): {
  total_difficulties: "normal" | "borderline" | "abnormal";
  emotional_symptoms: "normal" | "borderline" | "abnormal";
  conduct_problems: "normal" | "borderline" | "abnormal";
  hyperactivity: "normal" | "borderline" | "abnormal";
  peer_problems: "normal" | "borderline" | "abnormal";
  prosocial: "normal" | "borderline" | "abnormal";
} {
  return {
    total_difficulties: classifySubscale("total_difficulties", scores.total_difficulties),
    emotional_symptoms: classifySubscale("emotional_symptoms", scores.emotional_symptoms),
    conduct_problems: classifySubscale("conduct_problems", scores.conduct_problems),
    hyperactivity: classifySubscale("hyperactivity", scores.hyperactivity),
    peer_problems: classifySubscale("peer_problems", scores.peer_problems),
    prosocial: classifySubscale("prosocial", scores.prosocial),
  };
}

/**
 * Compute health compliance metrics across all children in a home.
 */
export function computeHealthCompliance(
  profiles: HealthProfile[],
  appointments: HealthAppointment[],
): {
  total_children: number;
  immunisation_up_to_date: number;
  dental_up_to_date: number;
  optician_up_to_date: number;
  health_assessment_current: number;
  camhs_active: number;
  overdue_appointments: { child_id: string; type: string; last_date: string | null; days_overdue: number }[];
  dna_rate: number | null;
} {
  const now = new Date();
  const totalChildren = profiles.length;

  // Immunisation up-to-date
  const immunisationUpToDate = profiles.filter(
    (p) => p.immunisation_status === "up_to_date",
  ).length;

  // Build latest appointment date per child per type
  const latestByChildType = new Map<string, Map<string, string>>();
  for (const appt of appointments) {
    if (appt.outcome !== "attended") continue;
    const key = appt.child_id;
    if (!latestByChildType.has(key)) latestByChildType.set(key, new Map());
    const childMap = latestByChildType.get(key)!;
    const existing = childMap.get(appt.appointment_type);
    if (!existing || appt.appointment_date > existing) {
      childMap.set(appt.appointment_type, appt.appointment_date);
    }
  }

  // Dental up-to-date: dentist appointment within last 26 weeks
  const twentySixWeeksAgo = new Date(now.getTime() - 26 * 7 * 86400000);
  let dentalUpToDate = 0;
  for (const p of profiles) {
    const childMap = latestByChildType.get(p.child_id);
    const lastDentist = childMap?.get("dentist");
    if (lastDentist && new Date(lastDentist) >= twentySixWeeksAgo) {
      dentalUpToDate++;
    }
  }

  // Optician up-to-date: optician appointment within last 52 weeks
  const fiftyTwoWeeksAgo = new Date(now.getTime() - 52 * 7 * 86400000);
  let opticianUpToDate = 0;
  for (const p of profiles) {
    const childMap = latestByChildType.get(p.child_id);
    const lastOptician = childMap?.get("optician");
    if (lastOptician && new Date(lastOptician) >= fiftyTwoWeeksAgo) {
      opticianUpToDate++;
    }
  }

  // Health assessment current: next_health_assessment not past and not null
  let healthAssessmentCurrent = 0;
  for (const p of profiles) {
    if (p.next_health_assessment && new Date(p.next_health_assessment) >= now) {
      healthAssessmentCurrent++;
    }
  }

  // CAMHS active
  const camhsActive = profiles.filter(
    (p) => p.camhs_status === "active",
  ).length;

  // Overdue appointments: check dentist (26w) and optician (52w) per child
  const overdueAppointments: { child_id: string; type: string; last_date: string | null; days_overdue: number }[] = [];

  for (const p of profiles) {
    const childMap = latestByChildType.get(p.child_id);

    // Dentist overdue check
    const lastDentist = childMap?.get("dentist") ?? null;
    if (!lastDentist) {
      // No dentist record at all — flag as overdue from now
      overdueAppointments.push({
        child_id: p.child_id,
        type: "dentist",
        last_date: null,
        days_overdue: 0,
      });
    } else if (new Date(lastDentist) < twentySixWeeksAgo) {
      const daysOverdue = Math.floor(
        -londonDayDiff(lastDentist, now) - 26 * 7,
      );
      overdueAppointments.push({
        child_id: p.child_id,
        type: "dentist",
        last_date: lastDentist,
        days_overdue: daysOverdue,
      });
    }

    // Optician overdue check
    const lastOptician = childMap?.get("optician") ?? null;
    if (!lastOptician) {
      overdueAppointments.push({
        child_id: p.child_id,
        type: "optician",
        last_date: null,
        days_overdue: 0,
      });
    } else if (new Date(lastOptician) < fiftyTwoWeeksAgo) {
      const daysOverdue = Math.floor(
        -londonDayDiff(lastOptician, now) - 52 * 7,
      );
      overdueAppointments.push({
        child_id: p.child_id,
        type: "optician",
        last_date: lastOptician,
        days_overdue: daysOverdue,
      });
    }
  }

  // DNA rate: (dna appointments) / total appointments * 100, 1 decimal
  const totalAppointments = appointments.length;
  const dnaCount = appointments.filter((a) => a.outcome === "dna").length;
  const dnaRate = totalAppointments > 0
    ? Math.round((dnaCount / totalAppointments) * 1000) / 10
    : null;

  return {
    total_children: totalChildren,
    immunisation_up_to_date: immunisationUpToDate,
    dental_up_to_date: dentalUpToDate,
    optician_up_to_date: opticianUpToDate,
    health_assessment_current: healthAssessmentCurrent,
    camhs_active: camhsActive,
    overdue_appointments: overdueAppointments,
    dna_rate: dnaRate,
  };
}

/**
 * Compute wellbeing trend for a single child from their assessments (sorted by date).
 */
export function computeWellbeingTrend(assessments: WellbeingAssessment[]): {
  latest_wellbeing: number;
  trend: "improving" | "stable" | "declining";
  sdq_band: "normal" | "borderline" | "abnormal" | null;
  avg_sleep: number | null;
  avg_appetite: number | null;
  assessment_count: number;
} {
  if (assessments.length === 0) {
    return {
      latest_wellbeing: 0,
      trend: "stable",
      sdq_band: null,
      avg_sleep: 0,
      avg_appetite: 0,
      assessment_count: 0,
    };
  }

  // Latest wellbeing score (assessments expected sorted by date, last = most recent)
  const latest = assessments[assessments.length - 1];
  const latestWellbeing = latest.overall_wellbeing;

  // Trend: compare first half avg vs second half avg of overall_wellbeing
  const mid = Math.floor(assessments.length / 2);
  const firstHalf = assessments.slice(0, mid);
  const secondHalf = assessments.slice(mid);

  const firstAvg = firstHalf.length > 0
    ? firstHalf.reduce((sum, a) => sum + a.overall_wellbeing, 0) / firstHalf.length
    : null;
  const secondAvg = secondHalf.length > 0
    ? secondHalf.reduce((sum, a) => sum + a.overall_wellbeing, 0) / secondHalf.length
    : null;

  let trend: "improving" | "stable" | "declining";
  if (assessments.length < 2) {
    trend = "stable";
  } else if ((secondAvg ?? 0) > (firstAvg ?? 0)) {
    trend = "improving";
  } else if ((secondAvg ?? 0) < (firstAvg ?? 0)) {
    trend = "declining";
  } else {
    trend = "stable";
  }

  // SDQ band from latest assessment with SDQ scores
  let sdqBand: "normal" | "borderline" | "abnormal" | null = null;
  for (let i = assessments.length - 1; i >= 0; i--) {
    if (assessments[i].sdq_scores) {
      const totalDiff = assessments[i].sdq_scores!.total_difficulties;
      sdqBand = classifySubscale("total_difficulties", totalDiff);
      break;
    }
  }

  // Average sleep quality (non-null values, 1 decimal)
  const sleepValues = assessments
    .map((a) => a.sleep_quality)
    .filter((v): v is number => v != null);
  const avgSleep = sleepValues.length > 0
    ? Math.round((sleepValues.reduce((s, v) => s + v, 0) / sleepValues.length) * 10) / 10
    : null;

  // Average appetite (non-null values, 1 decimal)
  const appetiteValues = assessments
    .map((a) => a.appetite)
    .filter((v): v is number => v != null);
  const avgAppetite = appetiteValues.length > 0
    ? Math.round((appetiteValues.reduce((s, v) => s + v, 0) / appetiteValues.length) * 10) / 10
    : null;

  return {
    latest_wellbeing: latestWellbeing,
    trend,
    sdq_band: sdqBand,
    avg_sleep: avgSleep,
    avg_appetite: avgAppetite,
    assessment_count: assessments.length,
  };
}

/**
 * Compute a health summary for one child, combining profile, appointments, and assessments.
 */
export function computeChildHealthSummary(
  profile: HealthProfile,
  appointments: HealthAppointment[],
  assessments: WellbeingAssessment[],
): {
  child_id: string;
  immunisation_status: string;
  allergy_count: number;
  condition_count: number;
  camhs_status: string;
  last_gp_visit: string | null;
  last_dentist_visit: string | null;
  last_optician_visit: string | null;
  appointments_30d: number;
  dna_count: number;
  latest_wellbeing_score: number | null;
  health_flags: string[];
} {
  const now = new Date();

  // Find last attended appointment by type
  function lastAttendedDate(type: string): string | null {
    let latest: string | null = null;
    for (const a of appointments) {
      if (a.appointment_type === type && a.outcome === "attended") {
        if (!latest || a.appointment_date > latest) {
          latest = a.appointment_date;
        }
      }
    }
    return latest;
  }

  const lastGp = lastAttendedDate("gp");
  const lastDentist = lastAttendedDate("dentist");
  const lastOptician = lastAttendedDate("optician");

  // Appointments in last 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const appointments30d = appointments.filter(
    (a) => new Date(a.appointment_date) >= thirtyDaysAgo,
  ).length;

  // DNA count
  const dnaCount = appointments.filter((a) => a.outcome === "dna").length;

  // Latest wellbeing score
  let latestWellbeingScore = 0;
  if (assessments.length > 0) {
    // Find most recent by assessment_date
    let mostRecent = assessments[0];
    for (const a of assessments) {
      if (a.assessment_date > mostRecent.assessment_date) {
        mostRecent = a;
      }
    }
    latestWellbeingScore = mostRecent.overall_wellbeing;
  }

  // Health flags
  const healthFlags: string[] = [];

  if (profile.immunisation_status !== "up_to_date") {
    healthFlags.push("immunisation_incomplete");
  }

  // Dental overdue: no dentist visit in 26 weeks
  const twentySixWeeksAgo = new Date(now.getTime() - 26 * 7 * 86400000);
  if (!lastDentist || new Date(lastDentist) < twentySixWeeksAgo) {
    healthFlags.push("dental_overdue");
  }

  if (profile.camhs_status === "referred") {
    healthFlags.push("camhs_referred");
  }

  // Health assessment overdue: next_health_assessment is past or null
  if (
    !profile.next_health_assessment ||
    new Date(profile.next_health_assessment) < now
  ) {
    healthFlags.push("health_assessment_overdue");
  }

  return {
    child_id: profile.child_id,
    immunisation_status: profile.immunisation_status,
    allergy_count: profile.allergies.length,
    condition_count: profile.health_conditions.length,
    camhs_status: profile.camhs_status,
    last_gp_visit: lastGp,
    last_dentist_visit: lastDentist,
    last_optician_visit: lastOptician,
    appointments_30d: appointments30d,
    dna_count: dnaCount,
    latest_wellbeing_score: latestWellbeingScore,
    health_flags: healthFlags,
  };
}

// ── CRUD — Health Profiles ─────────────────────────────────────────────────

export async function listHealthProfiles(
  homeId: string,
  filters?: { childId?: string },
): Promise<ServiceResult<HealthProfile[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_health_profiles") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  q = q.order("created_at", { ascending: false });

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getHealthProfile(
  id: string,
): Promise<ServiceResult<HealthProfile>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_health_profiles") as SB)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createHealthProfile(
  input: Omit<HealthProfile, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<HealthProfile>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_health_profiles") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      immunisation_status: input.immunisation_status,
      allergies: input.allergies,
      dietary_requirements: input.dietary_requirements,
      registered_gp: input.registered_gp,
      registered_dentist: input.registered_dentist,
      registered_optician: input.registered_optician,
      camhs_status: input.camhs_status,
      last_health_assessment: input.last_health_assessment ?? null,
      next_health_assessment: input.next_health_assessment ?? null,
      health_conditions: input.health_conditions,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateHealthProfile(
  id: string,
  updates: Partial<HealthProfile>,
): Promise<ServiceResult<HealthProfile>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const patch: Record<string, unknown> = {};

  if (updates.immunisation_status !== undefined) patch.immunisation_status = updates.immunisation_status;
  if (updates.allergies !== undefined) patch.allergies = updates.allergies;
  if (updates.dietary_requirements !== undefined) patch.dietary_requirements = updates.dietary_requirements;
  if (updates.registered_gp !== undefined) patch.registered_gp = updates.registered_gp;
  if (updates.registered_dentist !== undefined) patch.registered_dentist = updates.registered_dentist;
  if (updates.registered_optician !== undefined) patch.registered_optician = updates.registered_optician;
  if (updates.camhs_status !== undefined) patch.camhs_status = updates.camhs_status;
  if (updates.last_health_assessment !== undefined) patch.last_health_assessment = updates.last_health_assessment;
  if (updates.next_health_assessment !== undefined) patch.next_health_assessment = updates.next_health_assessment;
  if (updates.health_conditions !== undefined) patch.health_conditions = updates.health_conditions;

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "No fields to update" };
  }

  patch.updated_at = new Date().toISOString();

  const { data, error } = await (s.from("cs_health_profiles") as SB)
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Health Appointments ─────────────────────────────────────────────

export async function recordAppointment(
  input: Omit<HealthAppointment, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<HealthAppointment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_health_appointments") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      appointment_type: input.appointment_type,
      provider_name: input.provider_name,
      appointment_date: input.appointment_date,
      outcome: input.outcome,
      notes: input.notes ?? null,
      follow_up_required: input.follow_up_required,
      follow_up_date: input.follow_up_date ?? null,
      consent_obtained: input.consent_obtained,
      accompanied_by: input.accompanied_by ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function listAppointments(
  homeId: string,
  filters?: {
    childId?: string;
    appointmentType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<HealthAppointment[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_health_appointments") as SB).select("*").eq("home_id", homeId);

  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.appointmentType) q = q.eq("appointment_type", filters.appointmentType);
  if (filters?.dateFrom) q = q.gte("appointment_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("appointment_date", filters.dateTo);

  q = q.order("appointment_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

// ── CRUD — Wellbeing Assessments ───────────────────────────────────────────

export async function recordWellbeingAssessment(
  input: Omit<WellbeingAssessment, "id" | "created_at">,
): Promise<ServiceResult<WellbeingAssessment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_wellbeing_assessments") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      assessment_date: input.assessment_date,
      assessment_type: input.assessment_type,
      sdq_scores: input.sdq_scores ?? null,
      overall_wellbeing: input.overall_wellbeing,
      sleep_quality: input.sleep_quality ?? null,
      appetite: input.appetite ?? null,
      self_care: input.self_care ?? null,
      notes: input.notes ?? null,
      assessed_by: input.assessed_by,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function listWellbeingAssessments(
  homeId: string,
  filters?: {
    childId?: string;
    assessmentType?: string;
    limit?: number;
  },
): Promise<ServiceResult<WellbeingAssessment[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_wellbeing_assessments") as SB).select("*").eq("home_id", homeId);

  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.assessmentType) q = q.eq("assessment_type", filters.assessmentType);

  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

// ── Testing exports ────────────────────────────────────────────────────────

export const _testing = {
  computeHealthCompliance,
  computeWellbeingTrend,
  computeChildHealthSummary,
  classifySDQScores,
};
