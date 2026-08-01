// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF EXIT INTERVIEWS SERVICE
// Tracks exit interviews for departing staff, capturing reasons for leaving,
// feedback on the home, and intelligence for workforce retention.
// CHR 2015 Reg 33 (employment and fitness of staff),
// Reg 13 (leadership and management),
// Reg 32 (fitness of workers — ongoing suitability).
//
// Covers: exit interview records, reasons for leaving, satisfaction ratings,
// safeguarding debrief, handover completion, and retention insights.
//
// SCCIF: Leadership — "The home learns from staff departures."
// "Exit interviews inform workforce planning and improvement."
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

export type LeavingReason =
  | "career_progression"
  | "relocation"
  | "personal_reasons"
  | "workload"
  | "management_issues"
  | "pay_conditions"
  | "burnout"
  | "end_of_contract"
  | "retirement"
  | "dismissal"
  | "other";

export type SatisfactionRating =
  | "very_satisfied"
  | "satisfied"
  | "neutral"
  | "dissatisfied"
  | "very_dissatisfied";

export type HandoverStatus =
  | "completed"
  | "partial"
  | "not_started"
  | "not_required";

export type RehireRecommendation =
  | "yes"
  | "yes_with_conditions"
  | "no"
  | "not_assessed";

export interface StaffExitRecord {
  id: string;
  home_id: string;
  staff_name: string;
  role: string;
  leaving_date: string;
  interview_date: string;
  leaving_reason: LeavingReason;
  satisfaction_rating: SatisfactionRating;
  handover_status: HandoverStatus;
  rehire_recommendation: RehireRecommendation;
  length_of_service_months: number;
  would_recommend_employer: boolean;
  felt_supported: boolean;
  adequate_training: boolean;
  safeguarding_debrief_completed: boolean;
  keys_returned: boolean;
  access_revoked: boolean;
  dbs_notification_sent: boolean;
  children_informed: boolean;
  children_supported_through_transition: boolean;
  feedback_themes: string[];
  improvements_suggested: string[];
  interviewed_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const LEAVING_REASONS: { reason: LeavingReason; label: string }[] = [
  { reason: "career_progression", label: "Career Progression" },
  { reason: "relocation", label: "Relocation" },
  { reason: "personal_reasons", label: "Personal Reasons" },
  { reason: "workload", label: "Workload" },
  { reason: "management_issues", label: "Management Issues" },
  { reason: "pay_conditions", label: "Pay & Conditions" },
  { reason: "burnout", label: "Burnout" },
  { reason: "end_of_contract", label: "End of Contract" },
  { reason: "retirement", label: "Retirement" },
  { reason: "dismissal", label: "Dismissal" },
  { reason: "other", label: "Other" },
];

export const SATISFACTION_RATINGS: { rating: SatisfactionRating; label: string }[] = [
  { rating: "very_satisfied", label: "Very Satisfied" },
  { rating: "satisfied", label: "Satisfied" },
  { rating: "neutral", label: "Neutral" },
  { rating: "dissatisfied", label: "Dissatisfied" },
  { rating: "very_dissatisfied", label: "Very Dissatisfied" },
];

export const HANDOVER_STATUSES: { status: HandoverStatus; label: string }[] = [
  { status: "completed", label: "Completed" },
  { status: "partial", label: "Partial" },
  { status: "not_started", label: "Not Started" },
  { status: "not_required", label: "Not Required" },
];

export const REHIRE_RECOMMENDATIONS: { recommendation: RehireRecommendation; label: string }[] = [
  { recommendation: "yes", label: "Yes" },
  { recommendation: "yes_with_conditions", label: "Yes With Conditions" },
  { recommendation: "no", label: "No" },
  { recommendation: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeExitInterviewMetrics(
  records: StaffExitRecord[],
): {
  total_exits: number;
  career_progression_count: number;
  burnout_count: number;
  management_issues_count: number;
  dismissal_count: number;
  very_satisfied_rate: number | null;
  dissatisfied_count: number;
  very_dissatisfied_count: number;
  handover_completed_rate: number | null;
  handover_not_started_count: number;
  would_recommend_rate: number | null;
  felt_supported_rate: number | null;
  adequate_training_rate: number | null;
  safeguarding_debrief_rate: number | null;
  keys_returned_rate: number | null;
  access_revoked_rate: number | null;
  dbs_notification_rate: number | null;
  children_informed_rate: number | null;
  children_supported_rate: number | null;
  average_service_months: number | null;
  rehire_yes_rate: number | null;
  rehire_no_count: number;
  by_leaving_reason: Record<string, number>;
  by_satisfaction_rating: Record<string, number>;
  by_handover_status: Record<string, number>;
  by_rehire_recommendation: Record<string, number>;
} {
  const careerProg = records.filter((r) => r.leaving_reason === "career_progression").length;
  const burnout = records.filter((r) => r.leaving_reason === "burnout").length;
  const mgmtIssues = records.filter((r) => r.leaving_reason === "management_issues").length;
  const dismissal = records.filter((r) => r.leaving_reason === "dismissal").length;

  const verySatisfied = records.filter((r) => r.satisfaction_rating === "very_satisfied").length;
  const verySatisfiedRate =
    records.length > 0
      ? Math.round((verySatisfied / records.length) * 1000) / 10
      : null;

  const dissatisfied = records.filter((r) => r.satisfaction_rating === "dissatisfied").length;
  const veryDissatisfied = records.filter((r) => r.satisfaction_rating === "very_dissatisfied").length;

  const handoverCompleted = records.filter((r) => r.handover_status === "completed").length;
  const handoverRate =
    records.length > 0
      ? Math.round((handoverCompleted / records.length) * 1000) / 10
      : null;

  const handoverNotStarted = records.filter((r) => r.handover_status === "not_started").length;

  const boolRate = (field: keyof StaffExitRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const serviceTimes = records.map((r) => r.length_of_service_months);
  const avgService =
    serviceTimes.length > 0
      ? Math.round((serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length) * 10) / 10
      : null;

  const rehireYes = records.filter((r) => r.rehire_recommendation === "yes").length;
  const rehireYesRate =
    records.length > 0
      ? Math.round((rehireYes / records.length) * 1000) / 10
      : null;

  const rehireNo = records.filter((r) => r.rehire_recommendation === "no").length;

  const byReason: Record<string, number> = {};
  for (const r of records) byReason[r.leaving_reason] = (byReason[r.leaving_reason] ?? 0) + 1;

  const bySatisfaction: Record<string, number> = {};
  for (const r of records) bySatisfaction[r.satisfaction_rating] = (bySatisfaction[r.satisfaction_rating] ?? 0) + 1;

  const byHandover: Record<string, number> = {};
  for (const r of records) byHandover[r.handover_status] = (byHandover[r.handover_status] ?? 0) + 1;

  const byRehire: Record<string, number> = {};
  for (const r of records) byRehire[r.rehire_recommendation] = (byRehire[r.rehire_recommendation] ?? 0) + 1;

  return {
    total_exits: records.length,
    career_progression_count: careerProg,
    burnout_count: burnout,
    management_issues_count: mgmtIssues,
    dismissal_count: dismissal,
    very_satisfied_rate: verySatisfiedRate,
    dissatisfied_count: dissatisfied,
    very_dissatisfied_count: veryDissatisfied,
    handover_completed_rate: handoverRate,
    handover_not_started_count: handoverNotStarted,
    would_recommend_rate: boolRate("would_recommend_employer"),
    felt_supported_rate: boolRate("felt_supported"),
    adequate_training_rate: boolRate("adequate_training"),
    safeguarding_debrief_rate: boolRate("safeguarding_debrief_completed"),
    keys_returned_rate: boolRate("keys_returned"),
    access_revoked_rate: boolRate("access_revoked"),
    dbs_notification_rate: boolRate("dbs_notification_sent"),
    children_informed_rate: boolRate("children_informed"),
    children_supported_rate: boolRate("children_supported_through_transition"),
    average_service_months: avgService,
    rehire_yes_rate: rehireYesRate,
    rehire_no_count: rehireNo,
    by_leaving_reason: byReason,
    by_satisfaction_rating: bySatisfaction,
    by_handover_status: byHandover,
    by_rehire_recommendation: byRehire,
  };
}

export function identifyExitInterviewAlerts(
  records: StaffExitRecord[],
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

  // Safeguarding debrief not completed
  for (const r of records) {
    if (!r.safeguarding_debrief_completed) {
      alerts.push({
        type: "no_safeguarding_debrief",
        severity: "critical",
        message: `Safeguarding debrief not completed for ${r.staff_name} leaving on ${r.leaving_date} — complete before departure`,
        id: r.id,
      });
    }
  }

  // Access not revoked
  const accessNotRevoked = records.filter((r) => !r.access_revoked).length;
  if (accessNotRevoked >= 1) {
    alerts.push({
      type: "access_not_revoked",
      severity: "high",
      message: `${accessNotRevoked} departing ${accessNotRevoked === 1 ? "staff member has" : "staff members have"} access not yet revoked — action immediately`,
      id: "access_not_revoked",
    });
  }

  // Keys not returned
  const keysNotReturned = records.filter((r) => !r.keys_returned).length;
  if (keysNotReturned >= 1) {
    alerts.push({
      type: "keys_not_returned",
      severity: "high",
      message: `${keysNotReturned} departing ${keysNotReturned === 1 ? "staff member has" : "staff members have"} not returned keys — retrieve immediately`,
      id: "keys_not_returned",
    });
  }

  // Handover not started
  const notStarted = records.filter((r) => r.handover_status === "not_started").length;
  if (notStarted >= 1) {
    alerts.push({
      type: "handover_not_started",
      severity: "high",
      message: `${notStarted} ${notStarted === 1 ? "handover has" : "handovers have"} not been started — begin knowledge transfer`,
      id: "handover_not_started",
    });
  }

  // Children not informed
  const childrenNotInformed = records.filter((r) => !r.children_informed).length;
  if (childrenNotInformed >= 1) {
    alerts.push({
      type: "children_not_informed",
      severity: "medium",
      message: `${childrenNotInformed} ${childrenNotInformed === 1 ? "departure — children have" : "departures — children have"} not been informed — communicate sensitively`,
      id: "children_not_informed",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    leavingReason?: LeavingReason;
    satisfactionRating?: SatisfactionRating;
    handoverStatus?: HandoverStatus;
    limit?: number;
  },
): Promise<ServiceResult<StaffExitRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_exit_interviews") as SB).select("*").eq("home_id", homeId);
  if (filters?.leavingReason) q = q.eq("leaving_reason", filters.leavingReason);
  if (filters?.satisfactionRating) q = q.eq("satisfaction_rating", filters.satisfactionRating);
  if (filters?.handoverStatus) q = q.eq("handover_status", filters.handoverStatus);
  q = q.order("leaving_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    staffName: string;
    role: string;
    leavingDate: string;
    interviewDate: string;
    leavingReason: LeavingReason;
    satisfactionRating: SatisfactionRating;
    handoverStatus: HandoverStatus;
    rehireRecommendation: RehireRecommendation;
    lengthOfServiceMonths: number;
    wouldRecommendEmployer: boolean;
    feltSupported: boolean;
    adequateTraining: boolean;
    safeguardingDebriefCompleted: boolean;
    keysReturned: boolean;
    accessRevoked: boolean;
    dbsNotificationSent: boolean;
    childrenInformed: boolean;
    childrenSupportedThroughTransition: boolean;
    feedbackThemes: string[];
    improvementsSuggested: string[];
    interviewedBy: string;
    notes?: string;
  },
): Promise<ServiceResult<StaffExitRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_exit_interviews") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      role: input.role,
      leaving_date: input.leavingDate,
      interview_date: input.interviewDate,
      leaving_reason: input.leavingReason,
      satisfaction_rating: input.satisfactionRating,
      handover_status: input.handoverStatus,
      rehire_recommendation: input.rehireRecommendation,
      length_of_service_months: input.lengthOfServiceMonths,
      would_recommend_employer: input.wouldRecommendEmployer,
      felt_supported: input.feltSupported,
      adequate_training: input.adequateTraining,
      safeguarding_debrief_completed: input.safeguardingDebriefCompleted,
      keys_returned: input.keysReturned,
      access_revoked: input.accessRevoked,
      dbs_notification_sent: input.dbsNotificationSent,
      children_informed: input.childrenInformed,
      children_supported_through_transition: input.childrenSupportedThroughTransition,
      feedback_themes: input.feedbackThemes,
      improvements_suggested: input.improvementsSuggested,
      interviewed_by: input.interviewedBy,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<StaffExitRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_exit_interviews") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeExitInterviewMetrics,
  identifyExitInterviewAlerts,
};
