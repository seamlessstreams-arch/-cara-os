// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMMUNITY LINKS INTEGRATION SERVICE
// Tracks children's engagement with community resources, clubs,
// activities, and local services to support social integration,
// identity development, and positive relationships.
// CHR 2015 Reg 9 (positive relationships — community engagement),
// Reg 7 (individual child — hobbies and interests),
// Reg 12 (health and wellbeing — social development).
//
// Covers: activity type, engagement level, safeguarding checks,
// transport, consent, feedback, and sustainability of placements.
//
// SCCIF: Experiences — "Children enjoy positive community links."
// "Activities support identity and social development."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ActivityType =
  | "sports_club"
  | "youth_group"
  | "arts_culture"
  | "music_lessons"
  | "religious_group"
  | "volunteering"
  | "library_reading"
  | "scouts_guides"
  | "drama_dance"
  | "other";

export type EngagementLevel =
  | "fully_engaged"
  | "partially_engaged"
  | "reluctant"
  | "refused"
  | "not_assessed";

export type LinkStatus =
  | "active"
  | "paused"
  | "ended"
  | "waiting_list"
  | "trial_period";

export type FundingSource =
  | "home_budget"
  | "local_authority"
  | "charitable_grant"
  | "free_provision"
  | "self_funded";

export interface CommunityLinksIntegrationRecord {
  id: string;
  home_id: string;
  activity_type: ActivityType;
  engagement_level: EngagementLevel;
  link_status: LinkStatus;
  funding_source: FundingSource;
  start_date: string;
  child_name: string;
  child_id: string | null;
  activity_name: string;
  provider_name: string;
  safeguarding_checked: boolean;
  dbs_verified: boolean;
  risk_assessed: boolean;
  consent_obtained: boolean;
  transport_arranged: boolean;
  child_chose_activity: boolean;
  feedback_obtained: boolean;
  social_worker_informed: boolean;
  care_plan_linked: boolean;
  cultural_needs_met: boolean;
  inclusive_access: boolean;
  review_scheduled: boolean;
  issues_found: string[];
  actions_taken: string[];
  recorded_by: string;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ACTIVITY_TYPES: { type: ActivityType; label: string }[] = [
  { type: "sports_club", label: "Sports Club" },
  { type: "youth_group", label: "Youth Group" },
  { type: "arts_culture", label: "Arts & Culture" },
  { type: "music_lessons", label: "Music Lessons" },
  { type: "religious_group", label: "Religious Group" },
  { type: "volunteering", label: "Volunteering" },
  { type: "library_reading", label: "Library/Reading" },
  { type: "scouts_guides", label: "Scouts/Guides" },
  { type: "drama_dance", label: "Drama/Dance" },
  { type: "other", label: "Other" },
];

export const ENGAGEMENT_LEVELS: { level: EngagementLevel; label: string }[] = [
  { level: "fully_engaged", label: "Fully Engaged" },
  { level: "partially_engaged", label: "Partially Engaged" },
  { level: "reluctant", label: "Reluctant" },
  { level: "refused", label: "Refused" },
  { level: "not_assessed", label: "Not Assessed" },
];

export const LINK_STATUSES: { status: LinkStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "paused", label: "Paused" },
  { status: "ended", label: "Ended" },
  { status: "waiting_list", label: "Waiting List" },
  { status: "trial_period", label: "Trial Period" },
];

export const FUNDING_SOURCES: { source: FundingSource; label: string }[] = [
  { source: "home_budget", label: "Home Budget" },
  { source: "local_authority", label: "Local Authority" },
  { source: "charitable_grant", label: "Charitable Grant" },
  { source: "free_provision", label: "Free Provision" },
  { source: "self_funded", label: "Self-Funded" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeCommunityLinksMetrics(
  records: CommunityLinksIntegrationRecord[],
): {
  total_links: number;
  active_count: number;
  ended_count: number;
  refused_count: number;
  waiting_list_count: number;
  safeguarding_checked_rate: number | null;
  dbs_verified_rate: number | null;
  risk_assessed_rate: number | null;
  consent_obtained_rate: number | null;
  transport_arranged_rate: number | null;
  child_chose_rate: number | null;
  feedback_obtained_rate: number | null;
  social_worker_informed_rate: number | null;
  care_plan_linked_rate: number | null;
  cultural_needs_rate: number | null;
  inclusive_access_rate: number | null;
  review_scheduled_rate: number | null;
  unique_children: number;
  by_activity_type: Record<string, number>;
  by_engagement_level: Record<string, number>;
  by_link_status: Record<string, number>;
  by_funding_source: Record<string, number>;
} {
  const active = records.filter((r) => r.link_status === "active").length;
  const ended = records.filter((r) => r.link_status === "ended").length;
  const refused = records.filter((r) => r.engagement_level === "refused").length;
  const waitingList = records.filter((r) => r.link_status === "waiting_list").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof CommunityLinksIntegrationRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.activity_type] = (byType[r.activity_type] ?? 0) + 1;

  const byEngagement: Record<string, number> = {};
  for (const r of records) byEngagement[r.engagement_level] = (byEngagement[r.engagement_level] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.link_status] = (byStatus[r.link_status] ?? 0) + 1;

  const byFunding: Record<string, number> = {};
  for (const r of records) byFunding[r.funding_source] = (byFunding[r.funding_source] ?? 0) + 1;

  return {
    total_links: records.length,
    active_count: active,
    ended_count: ended,
    refused_count: refused,
    waiting_list_count: waitingList,
    safeguarding_checked_rate: boolRate("safeguarding_checked"),
    dbs_verified_rate: boolRate("dbs_verified"),
    risk_assessed_rate: boolRate("risk_assessed"),
    consent_obtained_rate: boolRate("consent_obtained"),
    transport_arranged_rate: boolRate("transport_arranged"),
    child_chose_rate: boolRate("child_chose_activity"),
    feedback_obtained_rate: boolRate("feedback_obtained"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    care_plan_linked_rate: boolRate("care_plan_linked"),
    cultural_needs_rate: boolRate("cultural_needs_met"),
    inclusive_access_rate: boolRate("inclusive_access"),
    review_scheduled_rate: boolRate("review_scheduled"),
    unique_children: uniqueChildren,
    by_activity_type: byType,
    by_engagement_level: byEngagement,
    by_link_status: byStatus,
    by_funding_source: byFunding,
  };
}

export function identifyCommunityLinksAlerts(
  records: CommunityLinksIntegrationRecord[],
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

  // Active link without safeguarding check
  for (const r of records) {
    if (r.link_status === "active" && !r.safeguarding_checked) {
      alerts.push({
        type: "active_no_safeguarding",
        severity: "critical",
        message: `${r.child_name} attending ${r.activity_name} without safeguarding check — suspend until verified`,
        id: r.id,
      });
    }
  }

  // No consent obtained
  const noConsent = records.filter((r) => !r.consent_obtained).length;
  if (noConsent >= 1) {
    alerts.push({
      type: "no_consent",
      severity: "high",
      message: `${noConsent} community ${noConsent === 1 ? "link has" : "links have"} no consent obtained — obtain before attendance`,
      id: "no_consent",
    });
  }

  // DBS not verified
  const noDbs = records.filter((r) => !r.dbs_verified).length;
  if (noDbs >= 1) {
    alerts.push({
      type: "dbs_not_verified",
      severity: "high",
      message: `${noDbs} community ${noDbs === 1 ? "link has" : "links have"} DBS not verified — check provider safeguarding`,
      id: "dbs_not_verified",
    });
  }

  // Child did not choose activity
  const notChosen = records.filter((r) => !r.child_chose_activity).length;
  if (notChosen >= 2) {
    alerts.push({
      type: "not_child_chosen",
      severity: "medium",
      message: `${notChosen} activities not chosen by child — ensure voice of the child`,
      id: "not_child_chosen",
    });
  }

  // Cultural needs not met
  const noCultural = records.filter((r) => !r.cultural_needs_met).length;
  if (noCultural >= 2) {
    alerts.push({
      type: "cultural_needs_not_met",
      severity: "medium",
      message: `${noCultural} links without cultural needs met — review diversity and inclusion`,
      id: "cultural_needs_not_met",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    activityType?: ActivityType;
    engagementLevel?: EngagementLevel;
    linkStatus?: LinkStatus;
    fundingSource?: FundingSource;
    limit?: number;
  },
): Promise<ServiceResult<CommunityLinksIntegrationRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_community_links_integration") as SB).select("*").eq("home_id", homeId);
  if (filters?.activityType) q = q.eq("activity_type", filters.activityType);
  if (filters?.engagementLevel) q = q.eq("engagement_level", filters.engagementLevel);
  if (filters?.linkStatus) q = q.eq("link_status", filters.linkStatus);
  if (filters?.fundingSource) q = q.eq("funding_source", filters.fundingSource);
  q = q.order("start_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    activityType: ActivityType;
    engagementLevel: EngagementLevel;
    linkStatus: LinkStatus;
    fundingSource: FundingSource;
    startDate: string;
    childName: string;
    childId?: string | null;
    activityName: string;
    providerName: string;
    safeguardingChecked?: boolean;
    dbsVerified?: boolean;
    riskAssessed?: boolean;
    consentObtained?: boolean;
    transportArranged?: boolean;
    childChoseActivity?: boolean;
    feedbackObtained?: boolean;
    socialWorkerInformed?: boolean;
    carePlanLinked?: boolean;
    culturalNeedsMet?: boolean;
    inclusiveAccess?: boolean;
    reviewScheduled?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    recordedBy: string;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<CommunityLinksIntegrationRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_community_links_integration") as SB)
    .insert({
      home_id: payload.homeId,
      activity_type: payload.activityType,
      engagement_level: payload.engagementLevel,
      link_status: payload.linkStatus,
      funding_source: payload.fundingSource,
      start_date: payload.startDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      activity_name: payload.activityName,
      provider_name: payload.providerName,
      safeguarding_checked: payload.safeguardingChecked ?? true,
      dbs_verified: payload.dbsVerified ?? true,
      risk_assessed: payload.riskAssessed ?? true,
      consent_obtained: payload.consentObtained ?? true,
      transport_arranged: payload.transportArranged ?? true,
      child_chose_activity: payload.childChoseActivity ?? true,
      feedback_obtained: payload.feedbackObtained ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      care_plan_linked: payload.carePlanLinked ?? false,
      cultural_needs_met: payload.culturalNeedsMet ?? true,
      inclusive_access: payload.inclusiveAccess ?? true,
      review_scheduled: payload.reviewScheduled ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      recorded_by: payload.recordedBy,
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
    activityType: ActivityType;
    engagementLevel: EngagementLevel;
    linkStatus: LinkStatus;
    fundingSource: FundingSource;
    startDate: string;
    childName: string;
    childId: string | null;
    activityName: string;
    providerName: string;
    safeguardingChecked: boolean;
    dbsVerified: boolean;
    riskAssessed: boolean;
    consentObtained: boolean;
    transportArranged: boolean;
    childChoseActivity: boolean;
    feedbackObtained: boolean;
    socialWorkerInformed: boolean;
    carePlanLinked: boolean;
    culturalNeedsMet: boolean;
    inclusiveAccess: boolean;
    reviewScheduled: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    recordedBy: string;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<CommunityLinksIntegrationRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.activityType !== undefined) mapped.activity_type = updates.activityType;
  if (updates.engagementLevel !== undefined) mapped.engagement_level = updates.engagementLevel;
  if (updates.linkStatus !== undefined) mapped.link_status = updates.linkStatus;
  if (updates.fundingSource !== undefined) mapped.funding_source = updates.fundingSource;
  if (updates.startDate !== undefined) mapped.start_date = updates.startDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.activityName !== undefined) mapped.activity_name = updates.activityName;
  if (updates.providerName !== undefined) mapped.provider_name = updates.providerName;
  if (updates.safeguardingChecked !== undefined) mapped.safeguarding_checked = updates.safeguardingChecked;
  if (updates.dbsVerified !== undefined) mapped.dbs_verified = updates.dbsVerified;
  if (updates.riskAssessed !== undefined) mapped.risk_assessed = updates.riskAssessed;
  if (updates.consentObtained !== undefined) mapped.consent_obtained = updates.consentObtained;
  if (updates.transportArranged !== undefined) mapped.transport_arranged = updates.transportArranged;
  if (updates.childChoseActivity !== undefined) mapped.child_chose_activity = updates.childChoseActivity;
  if (updates.feedbackObtained !== undefined) mapped.feedback_obtained = updates.feedbackObtained;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.carePlanLinked !== undefined) mapped.care_plan_linked = updates.carePlanLinked;
  if (updates.culturalNeedsMet !== undefined) mapped.cultural_needs_met = updates.culturalNeedsMet;
  if (updates.inclusiveAccess !== undefined) mapped.inclusive_access = updates.inclusiveAccess;
  if (updates.reviewScheduled !== undefined) mapped.review_scheduled = updates.reviewScheduled;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.recordedBy !== undefined) mapped.recorded_by = updates.recordedBy;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_community_links_integration") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeCommunityLinksMetrics,
  identifyCommunityLinksAlerts,
};
