// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILDREN'S THERAPY SESSIONS SERVICE
// Tracks individual therapy sessions including CAMHS, play therapy,
// art therapy, CBT, and other therapeutic interventions to support
// children's emotional wellbeing and mental health.
// CHR 2015 Reg 12 (health and wellbeing — therapeutic support),
// Reg 7 (individual child — access to therapeutic services),
// Reg 34 (care planning — health elements).
//
// Covers: therapy type, therapist details, child engagement, session
// outcomes, progress tracking, multi-agency coordination, and
// care plan integration.
//
// SCCIF: Health — "Children access appropriate therapeutic support."
// "Therapy sessions are regular and purposeful."
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

export type TherapyType =
  | "camhs"
  | "play_therapy"
  | "art_therapy"
  | "cbt"
  | "dbt"
  | "emdr"
  | "family_therapy"
  | "music_therapy"
  | "drama_therapy"
  | "other";

export type SessionOutcome =
  | "positive_progress"
  | "some_engagement"
  | "no_engagement"
  | "session_declined"
  | "session_cancelled";

export type ChildEngagement =
  | "fully_engaged"
  | "partially_engaged"
  | "reluctant"
  | "refused"
  | "not_assessed";

export type TherapyFrequency =
  | "twice_weekly"
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "as_needed";

export interface ChildrensTherapySessionRecord {
  id: string;
  home_id: string;
  therapy_type: TherapyType;
  session_outcome: SessionOutcome;
  child_engagement: ChildEngagement;
  therapy_frequency: TherapyFrequency;
  session_date: string;
  child_name: string;
  child_id: string | null;
  therapist_name: string;
  child_prepared: boolean;
  transport_arranged: boolean;
  consent_current: boolean;
  feedback_obtained: boolean;
  care_plan_updated: boolean;
  social_worker_informed: boolean;
  progress_documented: boolean;
  goals_reviewed: boolean;
  staff_briefed: boolean;
  follow_up_actions: boolean;
  child_debriefed: boolean;
  multi_agency_liaison: boolean;
  issues_found: string[];
  actions_taken: string[];
  session_duration_minutes: number;
  next_session_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const THERAPY_TYPES: { type: TherapyType; label: string }[] = [
  { type: "camhs", label: "CAMHS" },
  { type: "play_therapy", label: "Play Therapy" },
  { type: "art_therapy", label: "Art Therapy" },
  { type: "cbt", label: "CBT" },
  { type: "dbt", label: "DBT" },
  { type: "emdr", label: "EMDR" },
  { type: "family_therapy", label: "Family Therapy" },
  { type: "music_therapy", label: "Music Therapy" },
  { type: "drama_therapy", label: "Drama Therapy" },
  { type: "other", label: "Other" },
];

export const SESSION_OUTCOMES: { outcome: SessionOutcome; label: string }[] = [
  { outcome: "positive_progress", label: "Positive Progress" },
  { outcome: "some_engagement", label: "Some Engagement" },
  { outcome: "no_engagement", label: "No Engagement" },
  { outcome: "session_declined", label: "Session Declined" },
  { outcome: "session_cancelled", label: "Session Cancelled" },
];

export const CHILD_ENGAGEMENTS: { engagement: ChildEngagement; label: string }[] = [
  { engagement: "fully_engaged", label: "Fully Engaged" },
  { engagement: "partially_engaged", label: "Partially Engaged" },
  { engagement: "reluctant", label: "Reluctant" },
  { engagement: "refused", label: "Refused" },
  { engagement: "not_assessed", label: "Not Assessed" },
];

export const THERAPY_FREQUENCIES: { frequency: TherapyFrequency; label: string }[] = [
  { frequency: "twice_weekly", label: "Twice Weekly" },
  { frequency: "weekly", label: "Weekly" },
  { frequency: "fortnightly", label: "Fortnightly" },
  { frequency: "monthly", label: "Monthly" },
  { frequency: "as_needed", label: "As Needed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeChildrensTherapyMetrics(
  records: ChildrensTherapySessionRecord[],
): {
  total_sessions: number;
  positive_progress_count: number;
  declined_count: number;
  cancelled_count: number;
  refused_count: number;
  child_prepared_rate: number;
  transport_arranged_rate: number;
  consent_current_rate: number;
  feedback_obtained_rate: number;
  care_plan_updated_rate: number;
  social_worker_informed_rate: number;
  progress_documented_rate: number;
  goals_reviewed_rate: number;
  staff_briefed_rate: number;
  follow_up_actions_rate: number;
  child_debriefed_rate: number;
  multi_agency_rate: number;
  average_duration: number;
  unique_children: number;
  by_therapy_type: Record<string, number>;
  by_session_outcome: Record<string, number>;
  by_child_engagement: Record<string, number>;
  by_therapy_frequency: Record<string, number>;
} {
  const positiveProgress = records.filter((r) => r.session_outcome === "positive_progress").length;
  const declined = records.filter((r) => r.session_outcome === "session_declined").length;
  const cancelled = records.filter((r) => r.session_outcome === "session_cancelled").length;
  const refused = records.filter((r) => r.child_engagement === "refused").length;

  const boolRate = (field: keyof ChildrensTherapySessionRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const avgDuration = records.length > 0
    ? Math.round((records.reduce((sum, r) => sum + r.session_duration_minutes, 0) / records.length) * 10) / 10
    : 0;

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.therapy_type] = (byType[r.therapy_type] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.session_outcome] = (byOutcome[r.session_outcome] ?? 0) + 1;

  const byEngagement: Record<string, number> = {};
  for (const r of records) byEngagement[r.child_engagement] = (byEngagement[r.child_engagement] ?? 0) + 1;

  const byFreq: Record<string, number> = {};
  for (const r of records) byFreq[r.therapy_frequency] = (byFreq[r.therapy_frequency] ?? 0) + 1;

  return {
    total_sessions: records.length,
    positive_progress_count: positiveProgress,
    declined_count: declined,
    cancelled_count: cancelled,
    refused_count: refused,
    child_prepared_rate: boolRate("child_prepared"),
    transport_arranged_rate: boolRate("transport_arranged"),
    consent_current_rate: boolRate("consent_current"),
    feedback_obtained_rate: boolRate("feedback_obtained"),
    care_plan_updated_rate: boolRate("care_plan_updated"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    progress_documented_rate: boolRate("progress_documented"),
    goals_reviewed_rate: boolRate("goals_reviewed"),
    staff_briefed_rate: boolRate("staff_briefed"),
    follow_up_actions_rate: boolRate("follow_up_actions"),
    child_debriefed_rate: boolRate("child_debriefed"),
    multi_agency_rate: boolRate("multi_agency_liaison"),
    average_duration: avgDuration,
    unique_children: uniqueChildren,
    by_therapy_type: byType,
    by_session_outcome: byOutcome,
    by_child_engagement: byEngagement,
    by_therapy_frequency: byFreq,
  };
}

export function identifyChildrensTherapyAlerts(
  records: ChildrensTherapySessionRecord[],
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

  // Refused session with no consent
  for (const r of records) {
    if (r.child_engagement === "refused" && !r.consent_current) {
      alerts.push({
        type: "refused_no_consent",
        severity: "critical",
        message: `${r.child_name} refused ${r.therapy_type.replace(/_/g, " ")} on ${r.session_date} and consent not current — review therapeutic plan`,
        id: r.id,
      });
    }
  }

  // Progress not documented
  const noProgress = records.filter((r) => !r.progress_documented).length;
  if (noProgress >= 1) {
    alerts.push({
      type: "progress_not_documented",
      severity: "high",
      message: `${noProgress} therapy ${noProgress === 1 ? "session has" : "sessions have"} progress not documented — maintain records`,
      id: "progress_not_documented",
    });
  }

  // Child not debriefed
  const noDebrief = records.filter((r) => !r.child_debriefed).length;
  if (noDebrief >= 1) {
    alerts.push({
      type: "child_not_debriefed",
      severity: "high",
      message: `${noDebrief} ${noDebrief === 1 ? "session has" : "sessions have"} no child debrief — ensure emotional support post-therapy`,
      id: "child_not_debriefed",
    });
  }

  // Care plan not updated
  const noPlanUpdate = records.filter((r) => !r.care_plan_updated).length;
  if (noPlanUpdate >= 2) {
    alerts.push({
      type: "care_plan_not_updated",
      severity: "medium",
      message: `${noPlanUpdate} sessions without care plan update — integrate therapy into care planning`,
      id: "care_plan_not_updated",
    });
  }

  // Goals not reviewed
  const noGoals = records.filter((r) => !r.goals_reviewed).length;
  if (noGoals >= 3) {
    alerts.push({
      type: "goals_not_reviewed",
      severity: "medium",
      message: `${noGoals} sessions without goals reviewed — ensure therapeutic targets are tracked`,
      id: "goals_not_reviewed",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    therapyType?: TherapyType;
    sessionOutcome?: SessionOutcome;
    childEngagement?: ChildEngagement;
    therapyFrequency?: TherapyFrequency;
    limit?: number;
  },
): Promise<ServiceResult<ChildrensTherapySessionRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_childrens_therapy_sessions") as SB).select("*").eq("home_id", homeId);
  if (filters?.therapyType) q = q.eq("therapy_type", filters.therapyType);
  if (filters?.sessionOutcome) q = q.eq("session_outcome", filters.sessionOutcome);
  if (filters?.childEngagement) q = q.eq("child_engagement", filters.childEngagement);
  if (filters?.therapyFrequency) q = q.eq("therapy_frequency", filters.therapyFrequency);
  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    therapyType: TherapyType;
    sessionOutcome: SessionOutcome;
    childEngagement: ChildEngagement;
    therapyFrequency: TherapyFrequency;
    sessionDate: string;
    childName: string;
    childId?: string | null;
    therapistName: string;
    childPrepared?: boolean;
    transportArranged?: boolean;
    consentCurrent?: boolean;
    feedbackObtained?: boolean;
    carePlanUpdated?: boolean;
    socialWorkerInformed?: boolean;
    progressDocumented?: boolean;
    goalsReviewed?: boolean;
    staffBriefed?: boolean;
    followUpActions?: boolean;
    childDebriefed?: boolean;
    multiAgencyLiaison?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    sessionDurationMinutes: number;
    nextSessionDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<ChildrensTherapySessionRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_childrens_therapy_sessions") as SB)
    .insert({
      home_id: payload.homeId,
      therapy_type: payload.therapyType,
      session_outcome: payload.sessionOutcome,
      child_engagement: payload.childEngagement,
      therapy_frequency: payload.therapyFrequency,
      session_date: payload.sessionDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      therapist_name: payload.therapistName,
      child_prepared: payload.childPrepared ?? true,
      transport_arranged: payload.transportArranged ?? true,
      consent_current: payload.consentCurrent ?? true,
      feedback_obtained: payload.feedbackObtained ?? true,
      care_plan_updated: payload.carePlanUpdated ?? false,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      progress_documented: payload.progressDocumented ?? true,
      goals_reviewed: payload.goalsReviewed ?? true,
      staff_briefed: payload.staffBriefed ?? true,
      follow_up_actions: payload.followUpActions ?? true,
      child_debriefed: payload.childDebriefed ?? true,
      multi_agency_liaison: payload.multiAgencyLiaison ?? false,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      session_duration_minutes: payload.sessionDurationMinutes,
      next_session_date: payload.nextSessionDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    therapyType: TherapyType;
    sessionOutcome: SessionOutcome;
    childEngagement: ChildEngagement;
    therapyFrequency: TherapyFrequency;
    sessionDate: string;
    childName: string;
    childId: string | null;
    therapistName: string;
    childPrepared: boolean;
    transportArranged: boolean;
    consentCurrent: boolean;
    feedbackObtained: boolean;
    carePlanUpdated: boolean;
    socialWorkerInformed: boolean;
    progressDocumented: boolean;
    goalsReviewed: boolean;
    staffBriefed: boolean;
    followUpActions: boolean;
    childDebriefed: boolean;
    multiAgencyLiaison: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    sessionDurationMinutes: number;
    nextSessionDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<ChildrensTherapySessionRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.therapyType !== undefined) mapped.therapy_type = updates.therapyType;
  if (updates.sessionOutcome !== undefined) mapped.session_outcome = updates.sessionOutcome;
  if (updates.childEngagement !== undefined) mapped.child_engagement = updates.childEngagement;
  if (updates.therapyFrequency !== undefined) mapped.therapy_frequency = updates.therapyFrequency;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.therapistName !== undefined) mapped.therapist_name = updates.therapistName;
  if (updates.childPrepared !== undefined) mapped.child_prepared = updates.childPrepared;
  if (updates.transportArranged !== undefined) mapped.transport_arranged = updates.transportArranged;
  if (updates.consentCurrent !== undefined) mapped.consent_current = updates.consentCurrent;
  if (updates.feedbackObtained !== undefined) mapped.feedback_obtained = updates.feedbackObtained;
  if (updates.carePlanUpdated !== undefined) mapped.care_plan_updated = updates.carePlanUpdated;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.progressDocumented !== undefined) mapped.progress_documented = updates.progressDocumented;
  if (updates.goalsReviewed !== undefined) mapped.goals_reviewed = updates.goalsReviewed;
  if (updates.staffBriefed !== undefined) mapped.staff_briefed = updates.staffBriefed;
  if (updates.followUpActions !== undefined) mapped.follow_up_actions = updates.followUpActions;
  if (updates.childDebriefed !== undefined) mapped.child_debriefed = updates.childDebriefed;
  if (updates.multiAgencyLiaison !== undefined) mapped.multi_agency_liaison = updates.multiAgencyLiaison;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.sessionDurationMinutes !== undefined) mapped.session_duration_minutes = updates.sessionDurationMinutes;
  if (updates.nextSessionDate !== undefined) mapped.next_session_date = updates.nextSessionDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_childrens_therapy_sessions") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeChildrensTherapyMetrics,
  identifyChildrensTherapyAlerts,
};
