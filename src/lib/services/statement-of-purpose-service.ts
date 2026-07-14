// ══════════════════════════════════════════════════════════════════════════════
// CARA — STATEMENT OF PURPOSE SERVICE
// Manages the Statement of Purpose document, its reviews, amendments, and
// distribution under CHR 2015 Reg 16 (statement of purpose), Reg 28 (review
// and revision), Reg 31 (notification to HMCI), Schedule 1 (content
// requirements).
//
// CHR 2015 Reg 16 — the registered person must compile a statement of purpose
// which covers the matters listed in Schedule 1, and keep it under review.
//
// CHR 2015 Reg 28 — the registered person must review and where necessary
// revise the statement of purpose, and notify the Chief Inspector of any
// amendments within 28 days.
//
// CHR 2015 Reg 31 — notification to the Chief Inspector (HMCI/Ofsted) of
// events including changes to the statement of purpose.
//
// CHR 2015 Schedule 1 — the required content of the statement of purpose
// including range of needs, ethos, accommodation, staffing, education,
// health, contact, complaints, and other prescribed matters.
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

export type DocumentStatus =
  | "draft"
  | "active"
  | "under_review"
  | "archived"
  | "superseded";

export type ReviewOutcome =
  | "approved_no_changes"
  | "approved_with_amendments"
  | "major_revision_required"
  | "deferred";

export type AmendmentType =
  | "minor_update"
  | "major_revision"
  | "annual_review"
  | "regulatory_change"
  | "ofsted_recommendation"
  | "staff_change"
  | "capacity_change";

export type DistributionMethod =
  | "email"
  | "post"
  | "website"
  | "printed_copy"
  | "portal_access";

export type ScheduleSection =
  | "range_of_needs"
  | "ethos_philosophy"
  | "accommodation"
  | "location"
  | "staffing"
  | "fire_safety"
  | "behaviour_management"
  | "education"
  | "health"
  | "contact"
  | "complaints"
  | "religious_cultural"
  | "emergency_placement";

export interface StatementOfPurpose {
  id: string;
  home_id: string;
  version: string;
  title: string;
  effective_date: string;
  review_date: string;
  last_reviewed_date: string | null;
  reviewed_by: string | null;
  approved_by: string | null;
  approval_date: string | null;
  status: DocumentStatus;
  range_of_needs: string;
  ethos_and_philosophy: string;
  accommodation_details: string;
  location_details: string;
  staffing_structure: string;
  fire_safety_arrangements: string;
  behaviour_management_approach: string;
  education_provision: string;
  health_arrangements: string;
  contact_arrangements: string;
  complaints_procedure: string;
  religious_cultural_needs: string;
  emergency_placement_procedure: string | null;
  registered_manager: string;
  responsible_individual: string | null;
  ofsted_notification_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StatementReview {
  id: string;
  home_id: string;
  statement_id: string;
  review_date: string;
  reviewer_name: string;
  reviewer_role: string;
  outcome: ReviewOutcome;
  sections_reviewed: ScheduleSection[];
  changes_required: string | null;
  changes_made: string | null;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface StatementAmendment {
  id: string;
  home_id: string;
  statement_id: string;
  amendment_date: string;
  amendment_type: AmendmentType;
  amended_by: string;
  section_amended: ScheduleSection;
  previous_content: string;
  new_content: string;
  reason_for_change: string;
  approved_by: string | null;
  ofsted_notified: boolean;
  notes: string | null;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DOCUMENT_STATUSES: { status: DocumentStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "active", label: "Active" },
  { status: "under_review", label: "Under Review" },
  { status: "archived", label: "Archived" },
  { status: "superseded", label: "Superseded" },
];

export const REVIEW_OUTCOMES: { outcome: ReviewOutcome; label: string }[] = [
  { outcome: "approved_no_changes", label: "Approved — No Changes" },
  { outcome: "approved_with_amendments", label: "Approved with Amendments" },
  { outcome: "major_revision_required", label: "Major Revision Required" },
  { outcome: "deferred", label: "Deferred" },
];

export const AMENDMENT_TYPES: { type: AmendmentType; label: string }[] = [
  { type: "minor_update", label: "Minor Update" },
  { type: "major_revision", label: "Major Revision" },
  { type: "annual_review", label: "Annual Review" },
  { type: "regulatory_change", label: "Regulatory Change" },
  { type: "ofsted_recommendation", label: "Ofsted Recommendation" },
  { type: "staff_change", label: "Staff Change" },
  { type: "capacity_change", label: "Capacity Change" },
];

export const DISTRIBUTION_METHODS: { method: DistributionMethod; label: string }[] = [
  { method: "email", label: "Email" },
  { method: "post", label: "Post" },
  { method: "website", label: "Website" },
  { method: "printed_copy", label: "Printed Copy" },
  { method: "portal_access", label: "Portal Access" },
];

export const SCHEDULE_SECTIONS: { section: ScheduleSection; label: string }[] = [
  { section: "range_of_needs", label: "Range of Needs Provided For" },
  { section: "ethos_philosophy", label: "Ethos & Philosophy" },
  { section: "accommodation", label: "Accommodation Details" },
  { section: "location", label: "Location Details" },
  { section: "staffing", label: "Staffing Structure" },
  { section: "fire_safety", label: "Fire Safety Arrangements" },
  { section: "behaviour_management", label: "Behaviour Management Approach" },
  { section: "education", label: "Education Provision" },
  { section: "health", label: "Health Arrangements" },
  { section: "contact", label: "Contact Arrangements" },
  { section: "complaints", label: "Complaints Procedure" },
  { section: "religious_cultural", label: "Religious & Cultural Needs" },
  { section: "emergency_placement", label: "Emergency Placement Procedure" },
];

// ── Map from ScheduleSection to StatementOfPurpose field ────────────────

const SECTION_FIELD_MAP: Record<ScheduleSection, keyof StatementOfPurpose> = {
  range_of_needs: "range_of_needs",
  ethos_philosophy: "ethos_and_philosophy",
  accommodation: "accommodation_details",
  location: "location_details",
  staffing: "staffing_structure",
  fire_safety: "fire_safety_arrangements",
  behaviour_management: "behaviour_management_approach",
  education: "education_provision",
  health: "health_arrangements",
  contact: "contact_arrangements",
  complaints: "complaints_procedure",
  religious_cultural: "religious_cultural_needs",
  emergency_placement: "emergency_placement_procedure",
};

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute statement of purpose metrics from statements, reviews, and
 * amendments.
 *
 * Regulation references: CHR 2015 Reg 16 (statement of purpose),
 * Reg 28 (review and revision), Schedule 1 (content requirements).
 */
export function computeStatementMetrics(
  statements: StatementOfPurpose[],
  reviews: StatementReview[],
  amendments: StatementAmendment[],
): {
  active_statements: number;
  overdue_reviews: number;
  amendments_this_year: number;
  reviews_this_year: number;
  by_amendment_type: Record<string, number>;
  by_review_outcome: Record<string, number>;
  sections_coverage: Record<ScheduleSection, boolean>;
  avg_days_between_reviews: number;
  latest_version: string;
} {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // ── Statement metrics ────────────────────────────────────────────────

  const activeStatements = statements.filter((s) => s.status === "active");

  // Overdue reviews: active statements where review_date is in the past
  let overdueReviews = 0;
  for (const s of activeStatements) {
    if (s.review_date && new Date(s.review_date) < now) {
      overdueReviews++;
    }
  }

  // Latest version (highest semver-ish string among active, or all)
  let latestVersion = "0.0";
  for (const s of statements) {
    if (s.version > latestVersion) {
      latestVersion = s.version;
    }
  }

  // Sections coverage from the most recent active statement
  const sectionsCoverage: Record<ScheduleSection, boolean> = {
    range_of_needs: false,
    ethos_philosophy: false,
    accommodation: false,
    location: false,
    staffing: false,
    fire_safety: false,
    behaviour_management: false,
    education: false,
    health: false,
    contact: false,
    complaints: false,
    religious_cultural: false,
    emergency_placement: false,
  };

  // Find the most recent active statement
  const latestActive = activeStatements
    .sort((a, b) => b.version.localeCompare(a.version))[0];

  if (latestActive) {
    for (const sec of SCHEDULE_SECTIONS) {
      const field = SECTION_FIELD_MAP[sec.section];
      const value = latestActive[field];
      sectionsCoverage[sec.section] = typeof value === "string" && value.trim().length > 0;
    }
  }

  // ── Review metrics ──────────────────────────────────────────────────

  const reviewsThisYear = reviews.filter(
    (r) => new Date(r.review_date) >= yearStart,
  );

  // By review outcome
  const byReviewOutcome: Record<string, number> = {};
  for (const r of reviews) {
    byReviewOutcome[r.outcome] = (byReviewOutcome[r.outcome] ?? 0) + 1;
  }

  // Average days between reviews
  let avgDaysBetweenReviews = 0;
  if (reviews.length >= 2) {
    const sorted = [...reviews].sort(
      (a, b) => new Date(a.review_date).getTime() - new Date(b.review_date).getTime(),
    );
    let totalGap = 0;
    for (let i = 1; i < sorted.length; i++) {
      const gap =
        new Date(sorted[i].review_date).getTime() -
        new Date(sorted[i - 1].review_date).getTime();
      totalGap += gap;
    }
    avgDaysBetweenReviews = Math.round(
      totalGap / ((sorted.length - 1) * 1000 * 60 * 60 * 24),
    );
  }

  // ── Amendment metrics ───────────────────────────────────────────────

  const amendmentsThisYear = amendments.filter(
    (a) => new Date(a.amendment_date) >= yearStart,
  );

  // By amendment type
  const byAmendmentType: Record<string, number> = {};
  for (const a of amendments) {
    byAmendmentType[a.amendment_type] =
      (byAmendmentType[a.amendment_type] ?? 0) + 1;
  }

  return {
    active_statements: activeStatements.length,
    overdue_reviews: overdueReviews,
    amendments_this_year: amendmentsThisYear.length,
    reviews_this_year: reviewsThisYear.length,
    by_amendment_type: byAmendmentType,
    by_review_outcome: byReviewOutcome,
    sections_coverage: sectionsCoverage,
    avg_days_between_reviews: avgDaysBetweenReviews,
    latest_version: latestVersion,
  };
}

/**
 * Identify statement of purpose alerts requiring management attention.
 *
 * Alert categories:
 *   - Review overdue (critical) — active statement with review_date past,
 *     Reg 28 requires annual review
 *   - No approval (high) — active statement without approved_by
 *   - Ofsted not notified (critical) — amendment made but ofsted_notified
 *     false for major changes, Reg 31
 *   - Sections incomplete (high) — active statement with empty required
 *     Schedule 1 sections
 *   - No review in 12 months (high) — active statement, no review record
 *     in 12 months
 *   - Draft stale (medium) — draft status for over 30 days
 *   - Amendment not approved (medium) — amendment without approved_by
 *   - Version not distributed (medium) — active statement not distributed
 *     after update (optional alert)
 *
 * Regulation references: CHR 2015 Reg 16, Reg 28, Reg 31, Schedule 1.
 */
export function identifyStatementAlerts(
  statements: StatementOfPurpose[],
  reviews: StatementReview[],
  amendments: StatementAmendment[],
  now: Date = new Date(),
): {
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  message: string;
  related_id: string;
  related_type: "statement" | "review" | "amendment";
}[] {
  const alerts: {
    severity: "critical" | "high" | "medium" | "low";
    category: string;
    message: string;
    related_id: string;
    related_type: "statement" | "review" | "amendment";
  }[] = [];

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const twelveMonthsMs = 365 * 24 * 60 * 60 * 1000;

  // Build map: statement_id -> reviews for that statement
  const reviewsByStatement = new Map<string, StatementReview[]>();
  for (const r of reviews) {
    if (!reviewsByStatement.has(r.statement_id)) {
      reviewsByStatement.set(r.statement_id, []);
    }
    reviewsByStatement.get(r.statement_id)!.push(r);
  }

  for (const s of statements) {
    // ── Review overdue (critical) ─────────────────────────────────────
    if (
      s.status === "active" &&
      s.review_date &&
      new Date(s.review_date) < now
    ) {
      const daysOverdue = Math.round(
        (now.getTime() - new Date(s.review_date).getTime()) / (1000 * 60 * 60 * 24),
      );
      alerts.push({
        severity: "critical",
        category: "review_overdue",
        message: `Statement of Purpose v${s.version} review is ${daysOverdue} days overdue — Reg 28 requires annual review`,
        related_id: s.id,
        related_type: "statement",
      });
    }

    // ── No approval (high) ────────────────────────────────────────────
    if (s.status === "active" && !s.approved_by) {
      alerts.push({
        severity: "high",
        category: "no_approval",
        message: `Statement of Purpose v${s.version} is active but has no recorded approval — formal sign-off required`,
        related_id: s.id,
        related_type: "statement",
      });
    }

    // ── Sections incomplete (high) ────────────────────────────────────
    if (s.status === "active") {
      const emptySections: string[] = [];
      for (const sec of SCHEDULE_SECTIONS) {
        const field = SECTION_FIELD_MAP[sec.section];
        const value = s[field];
        // emergency_placement is nullable so skip it for required check
        if (sec.section === "emergency_placement") continue;
        if (typeof value !== "string" || value.trim().length === 0) {
          emptySections.push(sec.label);
        }
      }
      if (emptySections.length > 0) {
        alerts.push({
          severity: "high",
          category: "sections_incomplete",
          message: `Statement of Purpose v${s.version} has ${emptySections.length} incomplete Schedule 1 section(s): ${emptySections.join(", ")}`,
          related_id: s.id,
          related_type: "statement",
        });
      }
    }

    // ── No review in 12 months (high) ─────────────────────────────────
    if (s.status === "active") {
      const stmtReviews = reviewsByStatement.get(s.id) ?? [];
      if (stmtReviews.length === 0) {
        // No reviews at all — check if statement has been active long enough
        const effectiveDate = new Date(s.effective_date).getTime();
        if (now.getTime() - effectiveDate > twelveMonthsMs) {
          alerts.push({
            severity: "high",
            category: "no_review_in_12_months",
            message: `Statement of Purpose v${s.version} has no review records since becoming effective on ${s.effective_date} — Reg 28 requires annual review`,
            related_id: s.id,
            related_type: "statement",
          });
        }
      } else {
        // Find most recent review date
        const latestReview = stmtReviews.reduce((latest, r) =>
          new Date(r.review_date) > new Date(latest.review_date) ? r : latest,
        );
        const lastReviewDate = new Date(latestReview.review_date).getTime();
        if (now.getTime() - lastReviewDate > twelveMonthsMs) {
          const monthsSince = Math.round(
            (now.getTime() - lastReviewDate) / (1000 * 60 * 60 * 24 * 30),
          );
          alerts.push({
            severity: "high",
            category: "no_review_in_12_months",
            message: `Statement of Purpose v${s.version} has not been reviewed in ${monthsSince} months — Reg 28 requires annual review`,
            related_id: s.id,
            related_type: "statement",
          });
        }
      }
    }

    // ── Draft stale (medium) ──────────────────────────────────────────
    if (s.status === "draft") {
      const createdAt = new Date(s.created_at).getTime();
      if (now.getTime() - createdAt > thirtyDaysMs) {
        const daysDraft = Math.round(
          (now.getTime() - createdAt) / (1000 * 60 * 60 * 24),
        );
        alerts.push({
          severity: "medium",
          category: "draft_stale",
          message: `Statement of Purpose v${s.version} has been in draft for ${daysDraft} days — review and approve or discard`,
          related_id: s.id,
          related_type: "statement",
        });
      }
    }
  }

  // ── Amendment-level alerts ────────────────────────────────────────────

  for (const a of amendments) {
    // ── Ofsted not notified (critical) ────────────────────────────────
    const majorTypes: AmendmentType[] = [
      "major_revision",
      "regulatory_change",
      "ofsted_recommendation",
      "capacity_change",
    ];
    if (majorTypes.includes(a.amendment_type) && !a.ofsted_notified) {
      alerts.push({
        severity: "critical",
        category: "ofsted_not_notified",
        message: `${AMENDMENT_TYPES.find((t) => t.type === a.amendment_type)?.label ?? a.amendment_type} amendment on ${a.amendment_date} has not been notified to Ofsted — Reg 31 requires notification within 28 days`,
        related_id: a.id,
        related_type: "amendment",
      });
    }

    // ── Amendment not approved (medium) ───────────────────────────────
    if (!a.approved_by) {
      alerts.push({
        severity: "medium",
        category: "amendment_not_approved",
        message: `Amendment to ${SCHEDULE_SECTIONS.find((s) => s.section === a.section_amended)?.label ?? a.section_amended} on ${a.amendment_date} has no approval recorded`,
        related_id: a.id,
        related_type: "amendment",
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

// ── CRUD — Statements of Purpose ─────────────────────────────────────────

export async function listStatements(
  homeId: string,
  filters?: {
    status?: DocumentStatus;
    limit?: number;
  },
): Promise<ServiceResult<StatementOfPurpose[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_statements_of_purpose") as SB).select("*").eq("home_id", homeId);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createStatement(
  input: {
    homeId: string;
    version: string;
    title: string;
    effectiveDate?: string;
    reviewDate: string;
    rangeOfNeeds?: string;
    ethosAndPhilosophy?: string;
    accommodationDetails?: string;
    locationDetails?: string;
    staffingStructure?: string;
    fireSafetyArrangements?: string;
    behaviourManagementApproach?: string;
    educationProvision?: string;
    healthArrangements?: string;
    contactArrangements?: string;
    complaintsProcedure?: string;
    religiousCulturalNeeds?: string;
    emergencyPlacementProcedure?: string;
    registeredManager: string;
    responsibleIndividual?: string;
    notes?: string;
  },
): Promise<ServiceResult<StatementOfPurpose>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_statements_of_purpose") as SB)
    .insert({
      home_id: input.homeId,
      version: input.version,
      title: input.title,
      effective_date: input.effectiveDate ?? new Date().toISOString().split("T")[0],
      review_date: input.reviewDate,
      last_reviewed_date: null,
      reviewed_by: null,
      approved_by: null,
      approval_date: null,
      status: "draft",
      range_of_needs: input.rangeOfNeeds ?? "",
      ethos_and_philosophy: input.ethosAndPhilosophy ?? "",
      accommodation_details: input.accommodationDetails ?? "",
      location_details: input.locationDetails ?? "",
      staffing_structure: input.staffingStructure ?? "",
      fire_safety_arrangements: input.fireSafetyArrangements ?? "",
      behaviour_management_approach: input.behaviourManagementApproach ?? "",
      education_provision: input.educationProvision ?? "",
      health_arrangements: input.healthArrangements ?? "",
      contact_arrangements: input.contactArrangements ?? "",
      complaints_procedure: input.complaintsProcedure ?? "",
      religious_cultural_needs: input.religiousCulturalNeeds ?? "",
      emergency_placement_procedure: input.emergencyPlacementProcedure ?? null,
      registered_manager: input.registeredManager,
      responsible_individual: input.responsibleIndividual ?? null,
      ofsted_notification_date: null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateStatement(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<StatementOfPurpose>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_statements_of_purpose") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };

  // Auto-supersession (Doc-Version-Workflow M4): activating a statement marks
  // every OTHER active statement for the home superseded — one active statement
  // at a time, no longer left to a manual second update. Best-effort: a failure
  // here never fails the activation itself.
  if (updates.status === "active" && data?.home_id) {
    try {
      await (s.from("cs_statements_of_purpose") as SB)
        .update({ status: "superseded", updated_at: new Date().toISOString() })
        .eq("home_id", data.home_id)
        .eq("status", "active")
        .neq("id", id);
    } catch {
      /* activation stands; supersession is retried on the next activate */
    }
  }

  return { ok: true, data };
}

// ── CRUD — Statement Reviews ─────────────────────────────────────────────

export async function listReviews(
  homeId: string,
  filters?: {
    statementId?: string;
    outcome?: ReviewOutcome;
    limit?: number;
  },
): Promise<ServiceResult<StatementReview[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_statement_reviews") as SB).select("*").eq("home_id", homeId);
  if (filters?.statementId) q = q.eq("statement_id", filters.statementId);
  if (filters?.outcome) q = q.eq("outcome", filters.outcome);
  q = q.order("review_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createReview(
  input: {
    homeId: string;
    statementId: string;
    reviewDate?: string;
    reviewerName: string;
    reviewerRole: string;
    outcome: ReviewOutcome;
    sectionsReviewed?: ScheduleSection[];
    changesRequired?: string;
    changesMade?: string;
    nextReviewDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<StatementReview>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_statement_reviews") as SB)
    .insert({
      home_id: input.homeId,
      statement_id: input.statementId,
      review_date: input.reviewDate ?? new Date().toISOString().split("T")[0],
      reviewer_name: input.reviewerName,
      reviewer_role: input.reviewerRole,
      outcome: input.outcome,
      sections_reviewed: input.sectionsReviewed ?? [],
      changes_required: input.changesRequired ?? null,
      changes_made: input.changesMade ?? null,
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Statement Amendments ──────────────────────────────────────────

export async function listAmendments(
  homeId: string,
  filters?: {
    statementId?: string;
    amendmentType?: AmendmentType;
    sectionAmended?: ScheduleSection;
    limit?: number;
  },
): Promise<ServiceResult<StatementAmendment[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_statement_amendments") as SB).select("*").eq("home_id", homeId);
  if (filters?.statementId) q = q.eq("statement_id", filters.statementId);
  if (filters?.amendmentType) q = q.eq("amendment_type", filters.amendmentType);
  if (filters?.sectionAmended) q = q.eq("section_amended", filters.sectionAmended);
  q = q.order("amendment_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAmendment(
  input: {
    homeId: string;
    statementId: string;
    amendmentDate?: string;
    amendmentType: AmendmentType;
    amendedBy: string;
    sectionAmended: ScheduleSection;
    previousContent: string;
    newContent: string;
    reasonForChange: string;
    approvedBy?: string;
    ofstedNotified?: boolean;
    notes?: string;
  },
): Promise<ServiceResult<StatementAmendment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_statement_amendments") as SB)
    .insert({
      home_id: input.homeId,
      statement_id: input.statementId,
      amendment_date: input.amendmentDate ?? new Date().toISOString().split("T")[0],
      amendment_type: input.amendmentType,
      amended_by: input.amendedBy,
      section_amended: input.sectionAmended,
      previous_content: input.previousContent,
      new_content: input.newContent,
      reason_for_change: input.reasonForChange,
      approved_by: input.approvedBy ?? null,
      ofsted_notified: input.ofstedNotified ?? false,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeStatementMetrics,
  identifyStatementAlerts,
};
