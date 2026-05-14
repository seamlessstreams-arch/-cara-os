// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SAFEGUARDING REFERRAL SERVICE
// Tracks safeguarding referrals made to external agencies including LADO,
// MASH, police, social services, and other statutory bodies.
// CHR 2015 Reg 12 (protection — safeguarding referral obligations),
// Reg 13 (safeguarding — reporting and information sharing),
// Reg 34 (statutory guidance — notification requirements).
//
// Covers: referral tracking, agency responses, outcome recording,
// information sharing decisions, and multi-agency coordination.
//
// SCCIF: Safety — "Referrals are timely and appropriate."
// "Staff understand when and how to make safeguarding referrals."
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

export type ReferralType =
  | "lado_referral"
  | "mash_referral"
  | "police_referral"
  | "social_services"
  | "nspcc_referral"
  | "health_referral"
  | "education_referral"
  | "self_referral"
  | "anonymous_referral"
  | "other";

export type ReferralOutcome =
  | "investigation_opened"
  | "assessment_completed"
  | "no_further_action"
  | "ongoing_monitoring"
  | "pending";

export type ReferralUrgency =
  | "immediate"
  | "within_24_hours"
  | "within_48_hours"
  | "within_1_week"
  | "routine";

export type ConcernCategory =
  | "physical_abuse"
  | "emotional_abuse"
  | "sexual_abuse"
  | "neglect"
  | "exploitation"
  | "self_harm"
  | "radicalisation"
  | "peer_on_peer"
  | "online_harm"
  | "other";

export interface SafeguardingReferralRecord {
  id: string;
  home_id: string;
  referral_type: ReferralType;
  referral_outcome: ReferralOutcome;
  referral_urgency: ReferralUrgency;
  concern_category: ConcernCategory;
  referral_date: string;
  child_name: string;
  child_id: string | null;
  referred_to_agency: string;
  referral_reference: string | null;
  referral_timely: boolean;
  consent_obtained: boolean;
  consent_not_required_reason: string | null;
  information_shared_appropriately: boolean;
  manager_informed: boolean;
  ofsted_notified: boolean;
  lado_consulted: boolean;
  strategy_meeting_held: boolean;
  child_informed: boolean;
  parents_informed: boolean;
  outcome_communicated: boolean;
  follow_up_required: boolean;
  issues_found: string[];
  actions_taken: string[];
  referred_by: string;
  response_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const REFERRAL_TYPES: { type: ReferralType; label: string }[] = [
  { type: "lado_referral", label: "LADO Referral" },
  { type: "mash_referral", label: "MASH Referral" },
  { type: "police_referral", label: "Police Referral" },
  { type: "social_services", label: "Social Services" },
  { type: "nspcc_referral", label: "NSPCC Referral" },
  { type: "health_referral", label: "Health Referral" },
  { type: "education_referral", label: "Education Referral" },
  { type: "self_referral", label: "Self-Referral" },
  { type: "anonymous_referral", label: "Anonymous Referral" },
  { type: "other", label: "Other" },
];

export const REFERRAL_OUTCOMES: { outcome: ReferralOutcome; label: string }[] = [
  { outcome: "investigation_opened", label: "Investigation Opened" },
  { outcome: "assessment_completed", label: "Assessment Completed" },
  { outcome: "no_further_action", label: "No Further Action" },
  { outcome: "ongoing_monitoring", label: "Ongoing Monitoring" },
  { outcome: "pending", label: "Pending" },
];

export const REFERRAL_URGENCIES: { urgency: ReferralUrgency; label: string }[] = [
  { urgency: "immediate", label: "Immediate" },
  { urgency: "within_24_hours", label: "Within 24 Hours" },
  { urgency: "within_48_hours", label: "Within 48 Hours" },
  { urgency: "within_1_week", label: "Within 1 Week" },
  { urgency: "routine", label: "Routine" },
];

export const CONCERN_CATEGORIES: { category: ConcernCategory; label: string }[] = [
  { category: "physical_abuse", label: "Physical Abuse" },
  { category: "emotional_abuse", label: "Emotional Abuse" },
  { category: "sexual_abuse", label: "Sexual Abuse" },
  { category: "neglect", label: "Neglect" },
  { category: "exploitation", label: "Exploitation" },
  { category: "self_harm", label: "Self-Harm" },
  { category: "radicalisation", label: "Radicalisation" },
  { category: "peer_on_peer", label: "Peer-on-Peer" },
  { category: "online_harm", label: "Online Harm" },
  { category: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeSafeguardingReferralMetrics(
  records: SafeguardingReferralRecord[],
): {
  total_referrals: number;
  investigation_count: number;
  nfa_count: number;
  pending_count: number;
  immediate_urgency_count: number;
  timely_rate: number;
  consent_obtained_rate: number;
  information_shared_rate: number;
  manager_informed_rate: number;
  ofsted_notified_rate: number;
  lado_consulted_rate: number;
  strategy_meeting_rate: number;
  outcome_communicated_rate: number;
  follow_up_required_count: number;
  unique_children: number;
  by_referral_type: Record<string, number>;
  by_referral_outcome: Record<string, number>;
  by_referral_urgency: Record<string, number>;
  by_concern_category: Record<string, number>;
} {
  const investigation = records.filter((r) => r.referral_outcome === "investigation_opened").length;
  const nfa = records.filter((r) => r.referral_outcome === "no_further_action").length;
  const pending = records.filter((r) => r.referral_outcome === "pending").length;
  const immediate = records.filter((r) => r.referral_urgency === "immediate").length;

  const boolRate = (field: keyof SafeguardingReferralRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const followUp = records.filter((r) => r.follow_up_required).length;
  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.referral_type] = (byType[r.referral_type] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.referral_outcome] = (byOutcome[r.referral_outcome] ?? 0) + 1;

  const byUrgency: Record<string, number> = {};
  for (const r of records) byUrgency[r.referral_urgency] = (byUrgency[r.referral_urgency] ?? 0) + 1;

  const byCategory: Record<string, number> = {};
  for (const r of records) byCategory[r.concern_category] = (byCategory[r.concern_category] ?? 0) + 1;

  return {
    total_referrals: records.length,
    investigation_count: investigation,
    nfa_count: nfa,
    pending_count: pending,
    immediate_urgency_count: immediate,
    timely_rate: boolRate("referral_timely"),
    consent_obtained_rate: boolRate("consent_obtained"),
    information_shared_rate: boolRate("information_shared_appropriately"),
    manager_informed_rate: boolRate("manager_informed"),
    ofsted_notified_rate: boolRate("ofsted_notified"),
    lado_consulted_rate: boolRate("lado_consulted"),
    strategy_meeting_rate: boolRate("strategy_meeting_held"),
    outcome_communicated_rate: boolRate("outcome_communicated"),
    follow_up_required_count: followUp,
    unique_children: uniqueChildren,
    by_referral_type: byType,
    by_referral_outcome: byOutcome,
    by_referral_urgency: byUrgency,
    by_concern_category: byCategory,
  };
}

export function identifySafeguardingReferralAlerts(
  records: SafeguardingReferralRecord[],
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

  // Untimely referral for immediate urgency
  for (const r of records) {
    if (r.referral_urgency === "immediate" && !r.referral_timely) {
      alerts.push({
        type: "untimely_immediate_referral",
        severity: "critical",
        message: `Immediate referral for ${r.child_name} on ${r.referral_date} was not timely — review safeguarding response`,
        id: r.id,
      });
    }
  }

  // Ofsted not notified
  const noOfsted = records.filter((r) => !r.ofsted_notified).length;
  if (noOfsted >= 1) {
    alerts.push({
      type: "ofsted_not_notified",
      severity: "high",
      message: `${noOfsted} ${noOfsted === 1 ? "referral has" : "referrals have"} Ofsted not notified — review notification obligations`,
      id: "ofsted_not_notified",
    });
  }

  // LADO not consulted
  const noLado = records.filter((r) => !r.lado_consulted).length;
  if (noLado >= 1) {
    alerts.push({
      type: "lado_not_consulted",
      severity: "high",
      message: `${noLado} ${noLado === 1 ? "referral has" : "referrals have"} LADO not consulted — review consultation requirement`,
      id: "lado_not_consulted",
    });
  }

  // Information not shared appropriately
  const notShared = records.filter((r) => !r.information_shared_appropriately).length;
  if (notShared >= 2) {
    alerts.push({
      type: "information_not_shared",
      severity: "medium",
      message: `${notShared} referrals with information not shared appropriately — review information sharing protocol`,
      id: "information_not_shared",
    });
  }

  // Outcome not communicated
  const noOutcome = records.filter((r) => !r.outcome_communicated).length;
  if (noOutcome >= 3) {
    alerts.push({
      type: "outcome_not_communicated",
      severity: "medium",
      message: `${noOutcome} referrals without outcome communicated — ensure feedback loops are closed`,
      id: "outcome_not_communicated",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    referralType?: ReferralType;
    referralOutcome?: ReferralOutcome;
    referralUrgency?: ReferralUrgency;
    concernCategory?: ConcernCategory;
    limit?: number;
  },
): Promise<ServiceResult<SafeguardingReferralRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_safeguarding_referrals") as SB).select("*").eq("home_id", homeId);
  if (filters?.referralType) q = q.eq("referral_type", filters.referralType);
  if (filters?.referralOutcome) q = q.eq("referral_outcome", filters.referralOutcome);
  if (filters?.referralUrgency) q = q.eq("referral_urgency", filters.referralUrgency);
  if (filters?.concernCategory) q = q.eq("concern_category", filters.concernCategory);
  q = q.order("referral_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    referralType: ReferralType;
    referralOutcome: ReferralOutcome;
    referralUrgency: ReferralUrgency;
    concernCategory: ConcernCategory;
    referralDate: string;
    childName: string;
    childId?: string | null;
    referredToAgency: string;
    referralReference?: string | null;
    referralTimely?: boolean;
    consentObtained?: boolean;
    consentNotRequiredReason?: string | null;
    informationSharedAppropriately?: boolean;
    managerInformed?: boolean;
    ofstedNotified?: boolean;
    ladoConsulted?: boolean;
    strategyMeetingHeld?: boolean;
    childInformed?: boolean;
    parentsInformed?: boolean;
    outcomeCommunicated?: boolean;
    followUpRequired?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    referredBy: string;
    responseDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<SafeguardingReferralRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_safeguarding_referrals") as SB)
    .insert({
      home_id: payload.homeId,
      referral_type: payload.referralType,
      referral_outcome: payload.referralOutcome,
      referral_urgency: payload.referralUrgency,
      concern_category: payload.concernCategory,
      referral_date: payload.referralDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      referred_to_agency: payload.referredToAgency,
      referral_reference: payload.referralReference ?? null,
      referral_timely: payload.referralTimely ?? true,
      consent_obtained: payload.consentObtained ?? false,
      consent_not_required_reason: payload.consentNotRequiredReason ?? null,
      information_shared_appropriately: payload.informationSharedAppropriately ?? true,
      manager_informed: payload.managerInformed ?? true,
      ofsted_notified: payload.ofstedNotified ?? false,
      lado_consulted: payload.ladoConsulted ?? false,
      strategy_meeting_held: payload.strategyMeetingHeld ?? false,
      child_informed: payload.childInformed ?? false,
      parents_informed: payload.parentsInformed ?? false,
      outcome_communicated: payload.outcomeCommunicated ?? false,
      follow_up_required: payload.followUpRequired ?? false,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      referred_by: payload.referredBy,
      response_date: payload.responseDate ?? null,
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
    referralType: ReferralType;
    referralOutcome: ReferralOutcome;
    referralUrgency: ReferralUrgency;
    concernCategory: ConcernCategory;
    referralDate: string;
    childName: string;
    childId: string | null;
    referredToAgency: string;
    referralReference: string | null;
    referralTimely: boolean;
    consentObtained: boolean;
    consentNotRequiredReason: string | null;
    informationSharedAppropriately: boolean;
    managerInformed: boolean;
    ofstedNotified: boolean;
    ladoConsulted: boolean;
    strategyMeetingHeld: boolean;
    childInformed: boolean;
    parentsInformed: boolean;
    outcomeCommunicated: boolean;
    followUpRequired: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    referredBy: string;
    responseDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<SafeguardingReferralRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.referralType !== undefined) mapped.referral_type = updates.referralType;
  if (updates.referralOutcome !== undefined) mapped.referral_outcome = updates.referralOutcome;
  if (updates.referralUrgency !== undefined) mapped.referral_urgency = updates.referralUrgency;
  if (updates.concernCategory !== undefined) mapped.concern_category = updates.concernCategory;
  if (updates.referralDate !== undefined) mapped.referral_date = updates.referralDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.referredToAgency !== undefined) mapped.referred_to_agency = updates.referredToAgency;
  if (updates.referralReference !== undefined) mapped.referral_reference = updates.referralReference;
  if (updates.referralTimely !== undefined) mapped.referral_timely = updates.referralTimely;
  if (updates.consentObtained !== undefined) mapped.consent_obtained = updates.consentObtained;
  if (updates.consentNotRequiredReason !== undefined) mapped.consent_not_required_reason = updates.consentNotRequiredReason;
  if (updates.informationSharedAppropriately !== undefined) mapped.information_shared_appropriately = updates.informationSharedAppropriately;
  if (updates.managerInformed !== undefined) mapped.manager_informed = updates.managerInformed;
  if (updates.ofstedNotified !== undefined) mapped.ofsted_notified = updates.ofstedNotified;
  if (updates.ladoConsulted !== undefined) mapped.lado_consulted = updates.ladoConsulted;
  if (updates.strategyMeetingHeld !== undefined) mapped.strategy_meeting_held = updates.strategyMeetingHeld;
  if (updates.childInformed !== undefined) mapped.child_informed = updates.childInformed;
  if (updates.parentsInformed !== undefined) mapped.parents_informed = updates.parentsInformed;
  if (updates.outcomeCommunicated !== undefined) mapped.outcome_communicated = updates.outcomeCommunicated;
  if (updates.followUpRequired !== undefined) mapped.follow_up_required = updates.followUpRequired;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.referredBy !== undefined) mapped.referred_by = updates.referredBy;
  if (updates.responseDate !== undefined) mapped.response_date = updates.responseDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_safeguarding_referrals") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeSafeguardingReferralMetrics,
  identifySafeguardingReferralAlerts,
};
