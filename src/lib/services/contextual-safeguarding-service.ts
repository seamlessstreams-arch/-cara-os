// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CONTEXTUAL SAFEGUARDING & EXPLOITATION SERVICE
// Manages exploitation screening records, locality risk assessments, and
// contextual safeguarding analytics. Reg 12 (protection from harm),
// Reg 13 (leadership & management re safeguarding), Reg 34 (safeguarding),
// SCCIF Helped & Protected.
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

export type ScreeningType =
  | "cse" | "cce" | "county_lines" | "radicalisation" | "online"
  | "trafficking" | "modern_slavery" | "gang_affiliation" | "peer_on_peer";

export type ScreeningRiskLevel =
  | "no_concern" | "emerging" | "moderate" | "significant" | "serious";

export type ScreeningStatus = "completed" | "under_review" | "escalated";

export type LocationType =
  | "area" | "venue" | "route" | "online_platform"
  | "school" | "park" | "shop" | "transport_hub";

export type LocalityRiskType =
  | "drug_dealing" | "gang_activity" | "sexual_exploitation"
  | "trafficking_route" | "antisocial_behaviour" | "online_grooming"
  | "radicalisation_hub" | "county_lines_cuckooing";

export type LocalityRiskLevel = "low" | "medium" | "high" | "very_high";

export type LocalityRiskStatus = "active" | "archived";

export interface LocationRisk {
  location: string;
  risk_type: string;
  risk_level: string;
}

export interface PeerAssociation {
  name: string;
  concern_type: string;
  notes: string;
}

export interface ExploitationScreening {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  screening_date: string;
  screened_by: string;
  screening_type: ScreeningType;
  risk_level: ScreeningRiskLevel;
  indicators_identified: string[];
  protective_factors: string[];
  location_risks: LocationRisk[];
  peer_associations: PeerAssociation[];
  online_risks_identified: boolean;
  referral_made: boolean;
  referral_to: string | null;
  referral_date: string | null;
  safety_plan_in_place: boolean;
  safety_plan_review_date: string | null;
  next_screening_date: string | null;
  status: ScreeningStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocalityRiskAssessment {
  id: string;
  home_id: string;
  location_name: string;
  location_type: LocationType;
  risk_type: LocalityRiskType;
  risk_level: LocalityRiskLevel;
  description: string;
  mitigation_measures: string[];
  last_reviewed_date: string | null;
  reviewed_by: string | null;
  next_review_date: string | null;
  status: LocalityRiskStatus;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SCREENING_TYPES: { type: ScreeningType; label: string }[] = [
  { type: "cse", label: "Child Sexual Exploitation" },
  { type: "cce", label: "Child Criminal Exploitation" },
  { type: "county_lines", label: "County Lines" },
  { type: "radicalisation", label: "Radicalisation / Extremism" },
  { type: "online", label: "Online Exploitation" },
  { type: "trafficking", label: "Trafficking" },
  { type: "modern_slavery", label: "Modern Slavery" },
  { type: "gang_affiliation", label: "Gang Affiliation" },
  { type: "peer_on_peer", label: "Peer-on-Peer Abuse" },
];

export const RISK_LEVELS: { level: ScreeningRiskLevel; label: string }[] = [
  { level: "no_concern", label: "No Concern" },
  { level: "emerging", label: "Emerging Risk" },
  { level: "moderate", label: "Moderate Risk" },
  { level: "significant", label: "Significant Risk" },
  { level: "serious", label: "Serious Risk" },
];

export const EXPLOITATION_INDICATORS: { indicator: string; label: string }[] = [
  { indicator: "unexplained_gifts", label: "Unexplained gifts or money" },
  { indicator: "going_missing", label: "Going missing or regularly returning late" },
  { indicator: "new_phone_clothes", label: "New phone, clothes, or possessions" },
  { indicator: "change_in_behaviour", label: "Significant change in behaviour" },
  { indicator: "withdrawn_from_family", label: "Withdrawn from family or carers" },
  { indicator: "older_associates", label: "Associating with older individuals" },
  { indicator: "drug_use", label: "Evidence of drug or substance use" },
  { indicator: "self_harm_increase", label: "Increase in self-harm" },
  { indicator: "sexual_health_concerns", label: "Sexual health concerns or STIs" },
  { indicator: "fearfulness", label: "Fearfulness or signs of intimidation" },
  { indicator: "secretive_online_activity", label: "Secretive online activity" },
  { indicator: "county_lines_terminology", label: "Use of county lines terminology" },
  { indicator: "carrying_weapons", label: "Carrying weapons or involved in violence" },
  { indicator: "unexplained_injuries", label: "Unexplained injuries" },
  { indicator: "truanting_from_school", label: "Truanting from school or education" },
  { indicator: "multiple_phones", label: "Multiple mobile phones or SIM cards" },
  { indicator: "travel_to_unfamiliar_areas", label: "Travelling to unfamiliar areas" },
  { indicator: "controlling_relationship", label: "In a controlling or coercive relationship" },
];

export const LOCALITY_RISK_TYPES: { type: LocalityRiskType; label: string }[] = [
  { type: "drug_dealing", label: "Drug Dealing" },
  { type: "gang_activity", label: "Gang Activity" },
  { type: "sexual_exploitation", label: "Sexual Exploitation" },
  { type: "trafficking_route", label: "Trafficking Route" },
  { type: "antisocial_behaviour", label: "Antisocial Behaviour" },
  { type: "online_grooming", label: "Online Grooming" },
  { type: "radicalisation_hub", label: "Radicalisation Hub" },
  { type: "county_lines_cuckooing", label: "County Lines / Cuckooing" },
];

export const LOCATION_TYPES: { type: LocationType; label: string }[] = [
  { type: "area", label: "Area / Neighbourhood" },
  { type: "venue", label: "Venue / Premises" },
  { type: "route", label: "Route / Pathway" },
  { type: "online_platform", label: "Online Platform" },
  { type: "school", label: "School / Education Setting" },
  { type: "park", label: "Park / Open Space" },
  { type: "shop", label: "Shop / Commercial Premises" },
  { type: "transport_hub", label: "Transport Hub" },
];

// ── Risk level ranking (for comparisons) ────────────────────────────────

const SCREENING_RISK_RANK: Record<ScreeningRiskLevel, number> = {
  no_concern: 0,
  emerging: 1,
  moderate: 2,
  significant: 3,
  serious: 4,
};

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute contextual safeguarding metrics from screening records and
 * locality risk assessments.
 *
 * Regulation references: Reg 12 (protection from harm), Reg 34 (safeguarding),
 * SCCIF Helped & Protected.
 */
export function computeContextualSafeguardingMetrics(
  screenings: ExploitationScreening[],
  localityRisks: LocalityRiskAssessment[],
  now: Date = new Date(),
): {
  children_screened: number;
  by_risk_level: Record<ScreeningRiskLevel, number>;
  by_screening_type: Record<string, number>;
  high_risk_locations: number;
  overdue_screenings: number;
  referral_rate_percentage: number;
  total_screenings: number;
  screenings_with_safety_plan: number;
  active_locality_risks: number;
} {
  const byRiskLevel: Record<ScreeningRiskLevel, number> = {
    no_concern: 0,
    emerging: 0,
    moderate: 0,
    significant: 0,
    serious: 0,
  };
  const byScreeningType: Record<string, number> = {};

  const uniqueChildren = new Set<string>();
  let overdueScreenings = 0;
  let referralsMade = 0;
  let screeningsWithSafetyPlan = 0;

  for (const s of screenings) {
    uniqueChildren.add(s.child_id);

    byRiskLevel[s.risk_level]++;

    byScreeningType[s.screening_type] =
      (byScreeningType[s.screening_type] ?? 0) + 1;

    if (s.referral_made) referralsMade++;
    if (s.safety_plan_in_place) screeningsWithSafetyPlan++;

    // Overdue: next_screening_date has passed
    if (s.next_screening_date) {
      const nextDate = new Date(s.next_screening_date);
      if (now.getTime() > nextDate.getTime()) {
        overdueScreenings++;
      }
    }
  }

  // High-risk locations: active locality risks at high or very_high
  const activeLocalityRisks = localityRisks.filter((lr) => lr.status === "active");
  const highRiskLocations = activeLocalityRisks.filter(
    (lr) => lr.risk_level === "high" || lr.risk_level === "very_high",
  ).length;

  const referralRatePercentage =
    screenings.length > 0
      ? Math.round((referralsMade / screenings.length) * 100)
      : 0;

  return {
    children_screened: uniqueChildren.size,
    by_risk_level: byRiskLevel,
    by_screening_type: byScreeningType,
    high_risk_locations: highRiskLocations,
    overdue_screenings: overdueScreenings,
    referral_rate_percentage: referralRatePercentage,
    total_screenings: screenings.length,
    screenings_with_safety_plan: screeningsWithSafetyPlan,
    active_locality_risks: activeLocalityRisks.length,
  };
}

/**
 * Identify contextual safeguarding alerts that require attention.
 *
 * Alert categories:
 *   - Children at significant or serious risk
 *   - Overdue screenings (past next_screening_date)
 *   - Locality risks overdue for review (past next_review_date)
 *   - Children at elevated risk without a safety plan
 *
 * Regulation references: Reg 12 (protection from harm), Reg 13 (leadership
 * & management re safeguarding), SCCIF Helped & Protected.
 */
export function identifyContextualSafeguardingAlerts(
  screenings: ExploitationScreening[],
  localityRisks: LocalityRiskAssessment[],
  now: Date = new Date(),
): {
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  message: string;
  related_id: string;
  related_type: "screening" | "locality_risk";
}[] {
  const alerts: {
    severity: "critical" | "high" | "medium" | "low";
    category: string;
    message: string;
    related_id: string;
    related_type: "screening" | "locality_risk";
  }[] = [];

  for (const s of screenings) {
    // Alert: serious risk level
    if (s.risk_level === "serious") {
      alerts.push({
        severity: "critical",
        category: "serious_risk",
        message: `${s.child_name} screened at SERIOUS risk for ${getLabelForScreeningType(s.screening_type)}. Immediate safeguarding action required.`,
        related_id: s.id,
        related_type: "screening",
      });
    }

    // Alert: significant risk level
    if (s.risk_level === "significant") {
      alerts.push({
        severity: "high",
        category: "significant_risk",
        message: `${s.child_name} screened at SIGNIFICANT risk for ${getLabelForScreeningType(s.screening_type)}. Review safeguarding plan.`,
        related_id: s.id,
        related_type: "screening",
      });
    }

    // Alert: overdue screening
    if (s.next_screening_date) {
      const nextDate = new Date(s.next_screening_date);
      if (now.getTime() > nextDate.getTime()) {
        alerts.push({
          severity: "high",
          category: "overdue_screening",
          message: `Screening for ${s.child_name} (${getLabelForScreeningType(s.screening_type)}) overdue since ${s.next_screening_date}.`,
          related_id: s.id,
          related_type: "screening",
        });
      }
    }

    // Alert: elevated risk without safety plan
    const elevatedRisks: ScreeningRiskLevel[] = ["moderate", "significant", "serious"];
    if (elevatedRisks.includes(s.risk_level) && !s.safety_plan_in_place) {
      alerts.push({
        severity: s.risk_level === "serious" ? "critical" : "high",
        category: "missing_safety_plan",
        message: `${s.child_name} has ${s.risk_level} risk for ${getLabelForScreeningType(s.screening_type)} but no safety plan in place.`,
        related_id: s.id,
        related_type: "screening",
      });
    }
  }

  // Locality risk alerts
  for (const lr of localityRisks) {
    if (lr.status !== "active") continue;

    // Alert: unreviewed locality risk (overdue next_review_date)
    if (lr.next_review_date) {
      const nextReview = new Date(lr.next_review_date);
      if (now.getTime() > nextReview.getTime()) {
        alerts.push({
          severity: lr.risk_level === "very_high" ? "critical" : "medium",
          category: "unreviewed_locality_risk",
          message: `Locality risk assessment for "${lr.location_name}" (${getLabelForLocalityRiskType(lr.risk_type)}) overdue for review since ${lr.next_review_date}.`,
          related_id: lr.id,
          related_type: "locality_risk",
        });
      }
    }

    // Alert: very high locality risk
    if (lr.risk_level === "very_high") {
      alerts.push({
        severity: "critical",
        category: "very_high_locality_risk",
        message: `"${lr.location_name}" assessed at VERY HIGH risk for ${getLabelForLocalityRiskType(lr.risk_type)}. Review mitigation measures.`,
        related_id: lr.id,
        related_type: "locality_risk",
      });
    }
  }

  // Sort alerts: critical first, then high, then medium, then low
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

/**
 * Helper: get human-readable label for a screening type.
 */
function getLabelForScreeningType(type: ScreeningType): string {
  const found = SCREENING_TYPES.find((t) => t.type === type);
  return found?.label ?? type;
}

/**
 * Helper: get human-readable label for a locality risk type.
 */
function getLabelForLocalityRiskType(type: LocalityRiskType): string {
  const found = LOCALITY_RISK_TYPES.find((t) => t.type === type);
  return found?.label ?? type;
}

// ── CRUD — Exploitation Screenings ──────────────────────────────────────

export async function listScreenings(
  homeId: string,
  opts?: {
    childId?: string;
    screeningType?: ScreeningType;
    riskLevel?: ScreeningRiskLevel;
    status?: ScreeningStatus;
    limit?: number;
  },
): Promise<ServiceResult<ExploitationScreening[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_exploitation_screenings") as SB).select("*").eq("home_id", homeId);
  if (opts?.childId) q = q.eq("child_id", opts.childId);
  if (opts?.screeningType) q = q.eq("screening_type", opts.screeningType);
  if (opts?.riskLevel) q = q.eq("risk_level", opts.riskLevel);
  if (opts?.status) q = q.eq("status", opts.status);
  q = q.order("created_at", { ascending: false }).limit(opts?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createScreening(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    screeningDate?: string;
    screenedBy: string;
    screeningType: ScreeningType;
    riskLevel: ScreeningRiskLevel;
    indicatorsIdentified?: string[];
    protectiveFactors?: string[];
    locationRisks?: LocationRisk[];
    peerAssociations?: PeerAssociation[];
    onlineRisksIdentified?: boolean;
    referralMade?: boolean;
    referralTo?: string;
    referralDate?: string;
    safetyPlanInPlace?: boolean;
    safetyPlanReviewDate?: string;
    nextScreeningDate?: string;
    status?: ScreeningStatus;
    notes?: string;
  },
): Promise<ServiceResult<ExploitationScreening>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_exploitation_screenings") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      screening_date: input.screeningDate ?? new Date().toISOString(),
      screened_by: input.screenedBy,
      screening_type: input.screeningType,
      risk_level: input.riskLevel,
      indicators_identified: input.indicatorsIdentified ?? [],
      protective_factors: input.protectiveFactors ?? [],
      location_risks: input.locationRisks ?? [],
      peer_associations: input.peerAssociations ?? [],
      online_risks_identified: input.onlineRisksIdentified ?? false,
      referral_made: input.referralMade ?? false,
      referral_to: input.referralTo ?? null,
      referral_date: input.referralDate ?? null,
      safety_plan_in_place: input.safetyPlanInPlace ?? false,
      safety_plan_review_date: input.safetyPlanReviewDate ?? null,
      next_screening_date: input.nextScreeningDate ?? null,
      status: input.status ?? "completed",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateScreening(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<ExploitationScreening>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_exploitation_screenings") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Locality Risk Assessments ────────────────────────────────────

export async function listLocalityRisks(
  homeId: string,
  opts?: {
    locationType?: LocationType;
    riskType?: LocalityRiskType;
    riskLevel?: LocalityRiskLevel;
    status?: LocalityRiskStatus;
    limit?: number;
  },
): Promise<ServiceResult<LocalityRiskAssessment[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_locality_risk_assessments") as SB).select("*").eq("home_id", homeId);
  if (opts?.locationType) q = q.eq("location_type", opts.locationType);
  if (opts?.riskType) q = q.eq("risk_type", opts.riskType);
  if (opts?.riskLevel) q = q.eq("risk_level", opts.riskLevel);
  if (opts?.status) q = q.eq("status", opts.status);
  q = q.order("created_at", { ascending: false }).limit(opts?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createLocalityRisk(
  input: {
    homeId: string;
    locationName: string;
    locationType: LocationType;
    riskType: LocalityRiskType;
    riskLevel: LocalityRiskLevel;
    description: string;
    mitigationMeasures?: string[];
    lastReviewedDate?: string;
    reviewedBy?: string;
    nextReviewDate?: string;
    status?: LocalityRiskStatus;
  },
): Promise<ServiceResult<LocalityRiskAssessment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_locality_risk_assessments") as SB)
    .insert({
      home_id: input.homeId,
      location_name: input.locationName,
      location_type: input.locationType,
      risk_type: input.riskType,
      risk_level: input.riskLevel,
      description: input.description,
      mitigation_measures: input.mitigationMeasures ?? [],
      last_reviewed_date: input.lastReviewedDate ?? null,
      reviewed_by: input.reviewedBy ?? null,
      next_review_date: input.nextReviewDate ?? null,
      status: input.status ?? "active",
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateLocalityRisk(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<LocalityRiskAssessment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_locality_risk_assessments") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeContextualSafeguardingMetrics,
  identifyContextualSafeguardingAlerts,
  getLabelForScreeningType,
  getLabelForLocalityRiskType,
  SCREENING_TYPES,
  RISK_LEVELS,
  EXPLOITATION_INDICATORS,
  LOCALITY_RISK_TYPES,
  LOCATION_TYPES,
  SCREENING_RISK_RANK,
};
