// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTACT SUPERVISION SERVICE
// Tracks supervised contact visits between children and family
// members, ensuring safety, wellbeing, and compliance with
// contact arrangements and court orders.
// CHR 2015 Reg 22 (contact — facilitating family contact),
// Reg 7 (individual child — managing contact sensitively).
//
// Covers: contact type, supervision level, child response,
// risk assessment, and court order compliance.
//
// SCCIF: Experiences — "Contact arrangements support children's wellbeing."
// "Supervision is proportionate and focused on safety."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ContactType =
  | "face_to_face"
  | "phone_call"
  | "video_call"
  | "letter"
  | "supervised_visit"
  | "unsupervised_visit"
  | "community_contact"
  | "overnight_stay"
  | "indirect_contact"
  | "other";

export type SupervisionLevel =
  | "full_supervision"
  | "partial_supervision"
  | "monitored"
  | "unsupervised"
  | "no_contact_order";

export type ChildResponse =
  | "positive"
  | "mixed"
  | "neutral"
  | "distressed"
  | "refused";

export type ContactOutcome =
  | "completed_as_planned"
  | "shortened"
  | "extended"
  | "cancelled_by_family"
  | "cancelled_by_child";

export interface ContactSupervisionRecord {
  id: string;
  home_id: string;
  contact_type: ContactType;
  supervision_level: SupervisionLevel;
  child_response: ChildResponse;
  contact_outcome: ContactOutcome;
  contact_date: string;
  child_name: string;
  child_id: string | null;
  supervised_by: string;
  /** Tri-state judgements/observations: null = not recorded. Absence is never
   *  an answer — rates run over the records where the question was answered. */
  risk_assessment_current: boolean | null;
  child_prepared: boolean | null;
  child_debriefed: boolean | null;
  court_order_complied: boolean | null;
  safeguarding_concerns: boolean | null;
  transport_arranged: boolean | null;
  venue_appropriate: boolean | null;
  social_worker_informed: boolean | null;
  care_plan_linked: boolean | null;
  child_views_sought: boolean | null;
  recorded_within_24h: boolean | null;
  recorded_promptly: boolean | null;
  issues_found: string[];
  actions_taken: string[];
  contact_duration_minutes: number;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CONTACT_TYPES: { type: ContactType; label: string }[] = [
  { type: "face_to_face", label: "Face to Face" },
  { type: "phone_call", label: "Phone Call" },
  { type: "video_call", label: "Video Call" },
  { type: "letter", label: "Letter" },
  { type: "supervised_visit", label: "Supervised Visit" },
  { type: "unsupervised_visit", label: "Unsupervised Visit" },
  { type: "community_contact", label: "Community Contact" },
  { type: "overnight_stay", label: "Overnight Stay" },
  { type: "indirect_contact", label: "Indirect Contact" },
  { type: "other", label: "Other" },
];

export const SUPERVISION_LEVELS: { level: SupervisionLevel; label: string }[] = [
  { level: "full_supervision", label: "Full Supervision" },
  { level: "partial_supervision", label: "Partial Supervision" },
  { level: "monitored", label: "Monitored" },
  { level: "unsupervised", label: "Unsupervised" },
  { level: "no_contact_order", label: "No Contact Order" },
];

export const CHILD_RESPONSES: { response: ChildResponse; label: string }[] = [
  { response: "positive", label: "Positive" },
  { response: "mixed", label: "Mixed" },
  { response: "neutral", label: "Neutral" },
  { response: "distressed", label: "Distressed" },
  { response: "refused", label: "Refused" },
];

export const CONTACT_OUTCOMES: { outcome: ContactOutcome; label: string }[] = [
  { outcome: "completed_as_planned", label: "Completed as Planned" },
  { outcome: "shortened", label: "Shortened" },
  { outcome: "extended", label: "Extended" },
  { outcome: "cancelled_by_family", label: "Cancelled by Family" },
  { outcome: "cancelled_by_child", label: "Cancelled by Child" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeContactSupervisionMetrics(
  records: ContactSupervisionRecord[],
): {
  total_contacts: number;
  distressed_count: number;
  refused_count: number;
  cancelled_count: number;
  safeguarding_concerns_count: number;
  risk_assessment_rate: number | null;
  child_prepared_rate: number | null;
  child_debriefed_rate: number | null;
  court_order_rate: number | null;
  transport_arranged_rate: number | null;
  venue_appropriate_rate: number | null;
  social_worker_informed_rate: number | null;
  care_plan_linked_rate: number | null;
  child_views_rate: number | null;
  recorded_within_24h_rate: number | null;
  recorded_promptly_rate: number | null;
  average_duration: number | null;
  unique_children: number;
  by_contact_type: Record<string, number>;
  by_supervision_level: Record<string, number>;
  by_child_response: Record<string, number>;
  by_contact_outcome: Record<string, number>;
} {
  const distressed = records.filter((r) => r.child_response === "distressed").length;
  const refused = records.filter((r) => r.child_response === "refused").length;
  const cancelled = records.filter((r) => r.contact_outcome === "cancelled_by_family" || r.contact_outcome === "cancelled_by_child").length;
  const safeguardingCount = records.filter((r) => r.safeguarding_concerns).length;

  const boolRate = (field: keyof ContactSupervisionRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const avgDuration =
    records.length > 0
      ? Math.round(
          (records.reduce((sum, r) => sum + r.contact_duration_minutes, 0) / records.length) * 10,
        ) / 10
      : null;

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.contact_type] = (byType[r.contact_type] ?? 0) + 1;

  const byLevel: Record<string, number> = {};
  for (const r of records) byLevel[r.supervision_level] = (byLevel[r.supervision_level] ?? 0) + 1;

  const byResponse: Record<string, number> = {};
  for (const r of records) byResponse[r.child_response] = (byResponse[r.child_response] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.contact_outcome] = (byOutcome[r.contact_outcome] ?? 0) + 1;

  return {
    total_contacts: records.length,
    distressed_count: distressed,
    refused_count: refused,
    cancelled_count: cancelled,
    safeguarding_concerns_count: safeguardingCount,
    risk_assessment_rate: boolRate("risk_assessment_current"),
    child_prepared_rate: boolRate("child_prepared"),
    child_debriefed_rate: boolRate("child_debriefed"),
    court_order_rate: boolRate("court_order_complied"),
    transport_arranged_rate: boolRate("transport_arranged"),
    venue_appropriate_rate: boolRate("venue_appropriate"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    care_plan_linked_rate: boolRate("care_plan_linked"),
    child_views_rate: boolRate("child_views_sought"),
    recorded_within_24h_rate: boolRate("recorded_within_24h"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    average_duration: avgDuration,
    unique_children: uniqueChildren,
    by_contact_type: byType,
    by_supervision_level: byLevel,
    by_child_response: byResponse,
    by_contact_outcome: byOutcome,
  };
}

export function identifyContactSupervisionAlerts(
  records: ContactSupervisionRecord[],
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

  // Safeguarding concerns during contact
  for (const r of records) {
    if (r.safeguarding_concerns) {
      alerts.push({
        type: "safeguarding_during_contact",
        severity: "critical",
        message: `Safeguarding concerns identified during ${r.child_name}'s ${r.contact_type.replace(/_/g, " ")} contact — follow safeguarding procedures`,
        id: r.id,
      });
    }
  }

  // Child not debriefed
  // A recorded "no" is a finding; an unanswered question is not. `!r.x` would
  // count every unrecorded judgement as a breach the moment nulls arrive.
  const noDebrief = records.filter((r) => r.child_debriefed === false).length;
  if (noDebrief >= 1) {
    alerts.push({
      type: "child_not_debriefed",
      severity: "high",
      message: `${noDebrief} ${noDebrief === 1 ? "contact has" : "contacts have"} child not debriefed after visit — ensure post-contact support`,
      id: "child_not_debriefed",
    });
  }

  // Risk assessment not current
  const noRisk = records.filter((r) => r.risk_assessment_current === false).length;
  if (noRisk >= 1) {
    alerts.push({
      type: "risk_assessment_outdated",
      severity: "high",
      message: `${noRisk} ${noRisk === 1 ? "contact has" : "contacts have"} risk assessment not current — update assessments`,
      id: "risk_assessment_outdated",
    });
  }

  // Child not prepared
  const noPrepared = records.filter((r) => r.child_prepared === false).length;
  if (noPrepared >= 2) {
    alerts.push({
      type: "child_not_prepared",
      severity: "medium",
      message: `${noPrepared} contacts without child preparation — strengthen pre-contact support`,
      id: "child_not_prepared",
    });
  }

  // Venue not appropriate
  const noVenue = records.filter((r) => r.venue_appropriate === false).length;
  if (noVenue >= 2) {
    alerts.push({
      type: "venue_not_appropriate",
      severity: "medium",
      message: `${noVenue} contacts with venue not appropriate — review contact arrangements`,
      id: "venue_not_appropriate",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    contactType?: ContactType;
    supervisionLevel?: SupervisionLevel;
    childResponse?: ChildResponse;
    contactOutcome?: ContactOutcome;
    limit?: number;
  },
): Promise<ServiceResult<ContactSupervisionRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_contact_supervision") as SB).select("*").eq("home_id", homeId);
  if (filters?.contactType) q = q.eq("contact_type", filters.contactType);
  if (filters?.supervisionLevel) q = q.eq("supervision_level", filters.supervisionLevel);
  if (filters?.childResponse) q = q.eq("child_response", filters.childResponse);
  if (filters?.contactOutcome) q = q.eq("contact_outcome", filters.contactOutcome);
  q = q.order("contact_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    contactType: ContactType;
    supervisionLevel: SupervisionLevel;
    childResponse: ChildResponse;
    contactOutcome: ContactOutcome;
    contactDate: string;
    childName: string;
    childId?: string | null;
    supervisedBy: string;
    riskAssessmentCurrent?: boolean;
    childPrepared?: boolean;
    childDebriefed?: boolean;
    courtOrderComplied?: boolean;
    safeguardingConcerns?: boolean;
    transportArranged?: boolean;
    venueAppropriate?: boolean;
    socialWorkerInformed?: boolean;
    carePlanLinked?: boolean;
    childViewsSought?: boolean;
    recordedWithin24h?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    contactDurationMinutes: number;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<ContactSupervisionRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_contact_supervision") as SB)
    .insert({
      home_id: payload.homeId,
      contact_type: payload.contactType,
      supervision_level: payload.supervisionLevel,
      child_response: payload.childResponse,
      contact_outcome: payload.contactOutcome,
      contact_date: payload.contactDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      supervised_by: payload.supervisedBy,
      risk_assessment_current: payload.riskAssessmentCurrent ?? null,
      child_prepared: payload.childPrepared ?? null,
      child_debriefed: payload.childDebriefed ?? null,
      court_order_complied: payload.courtOrderComplied ?? null,
      safeguarding_concerns: payload.safeguardingConcerns ?? null,
      transport_arranged: payload.transportArranged ?? null,
      venue_appropriate: payload.venueAppropriate ?? null,
      social_worker_informed: payload.socialWorkerInformed ?? null,
      care_plan_linked: payload.carePlanLinked ?? null,
      child_views_sought: payload.childViewsSought ?? null,
      recorded_within_24h: payload.recordedWithin24h ?? null,
      recorded_promptly: payload.recordedPromptly ?? null,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      contact_duration_minutes: payload.contactDurationMinutes,
      next_review_date: payload.nextReviewDate ?? null,
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
    contactType: ContactType;
    supervisionLevel: SupervisionLevel;
    childResponse: ChildResponse;
    contactOutcome: ContactOutcome;
    contactDate: string;
    childName: string;
    childId: string | null;
    supervisedBy: string;
    riskAssessmentCurrent: boolean;
    childPrepared: boolean;
    childDebriefed: boolean;
    courtOrderComplied: boolean;
    safeguardingConcerns: boolean;
    transportArranged: boolean;
    venueAppropriate: boolean;
    socialWorkerInformed: boolean;
    carePlanLinked: boolean;
    childViewsSought: boolean;
    recordedWithin24h: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    contactDurationMinutes: number;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<ContactSupervisionRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.contactType !== undefined) mapped.contact_type = updates.contactType;
  if (updates.supervisionLevel !== undefined) mapped.supervision_level = updates.supervisionLevel;
  if (updates.childResponse !== undefined) mapped.child_response = updates.childResponse;
  if (updates.contactOutcome !== undefined) mapped.contact_outcome = updates.contactOutcome;
  if (updates.contactDate !== undefined) mapped.contact_date = updates.contactDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.supervisedBy !== undefined) mapped.supervised_by = updates.supervisedBy;
  if (updates.riskAssessmentCurrent !== undefined) mapped.risk_assessment_current = updates.riskAssessmentCurrent;
  if (updates.childPrepared !== undefined) mapped.child_prepared = updates.childPrepared;
  if (updates.childDebriefed !== undefined) mapped.child_debriefed = updates.childDebriefed;
  if (updates.courtOrderComplied !== undefined) mapped.court_order_complied = updates.courtOrderComplied;
  if (updates.safeguardingConcerns !== undefined) mapped.safeguarding_concerns = updates.safeguardingConcerns;
  if (updates.transportArranged !== undefined) mapped.transport_arranged = updates.transportArranged;
  if (updates.venueAppropriate !== undefined) mapped.venue_appropriate = updates.venueAppropriate;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.carePlanLinked !== undefined) mapped.care_plan_linked = updates.carePlanLinked;
  if (updates.childViewsSought !== undefined) mapped.child_views_sought = updates.childViewsSought;
  if (updates.recordedWithin24h !== undefined) mapped.recorded_within_24h = updates.recordedWithin24h;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.contactDurationMinutes !== undefined) mapped.contact_duration_minutes = updates.contactDurationMinutes;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_contact_supervision") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeContactSupervisionMetrics,
  identifyContactSupervisionAlerts,
};
