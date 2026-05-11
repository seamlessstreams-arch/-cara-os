// ══════════════════════════════════════════════════════════════════════════════
// Inspection Readiness Score  (Milestone 22)
//
// Live, deterministic readiness score (0–100) computed from current data.
// Surfaces what is blocking the home from being inspection-ready *right now*,
// not from synthetic seed values.
//
// Score is the average of category scores (each 0–100). Each category penalises
// open risk items and awards points when nothing is outstanding.
//
//   - routing_health        : penalise failed routes (–10 each, floor 0)
//   - amendment_review      : penalise sensitive amendments awaiting verify
//   - manager_review        : penalise care events stuck needing review
//   - returned_records      : penalise returned, unfixed records
//   - reg45_evidence        : penalise pending Reg 45 chips (–2 each, floor 0)
//   - annex_a_evidence      : penalise pending Annex A items (–2 each, floor 0)
//   - daily_summary_coverage: % of (child × day) pairs with summaries built
//   - care_event_currency   : % of last-7-day events that are verified/locked
//
// Severity:
//   ≥ 90 → ready
//   70–89 → minor_gaps
//   50–69 → significant_gaps
//   < 50 → at_risk
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { loadAmendmentReviewQueue } from "@/lib/care-events/amendment-review";
import { loadRoutingHealth } from "@/lib/care-events/routing-health";

export type ReadinessSeverity =
  | "ready"
  | "minor_gaps"
  | "significant_gaps"
  | "at_risk";

export interface ReadinessCategory {
  key: string;
  label: string;
  score: number;            // 0–100
  weight: number;           // currently always 1
  detail: string;
  open_count: number;
  blocking: boolean;        // true when this category is dragging the score
}

export interface InspectionReadinessReport {
  home_id: string;
  generated_at: string;
  overall_score: number;
  severity: ReadinessSeverity;
  categories: ReadinessCategory[];
  blocking_categories: string[];
}

const PENDING_REG45_STATUSES = new Set(["ai_draft"]);
const PENDING_ANNEX_DECISIONS = new Set(["pending"]);

function clamp(n: number): number {
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}

function severityFor(score: number): ReadinessSeverity {
  if (score >= 90) return "ready";
  if (score >= 70) return "minor_gaps";
  if (score >= 50) return "significant_gaps";
  return "at_risk";
}

export function computeInspectionReadiness(homeId: string): InspectionReadinessReport {
  // ── Routing health ────────────────────────────────────────────────────────
  const routing = loadRoutingHealth(homeId);
  const failedRoutes = routing.failed_route_count + routing.failed_job_count;
  const routingScore = clamp(100 - failedRoutes * 10);

  // ── Amendment review queue ────────────────────────────────────────────────
  const amend = loadAmendmentReviewQueue(homeId);
  const amendmentScore = clamp(100 - amend.total * 15);

  // ── Manager review backlog ────────────────────────────────────────────────
  const reviewBacklog = db.careEvents
    .findCurrent()
    .filter(
      (e) =>
        e.home_id === homeId && e.status === "manager_review_required",
    ).length;
  const reviewScore = clamp(100 - reviewBacklog * 8);

  // ── Returned, unfixed records ─────────────────────────────────────────────
  const returnedCount = db.careEvents
    .findCurrent()
    .filter((e) => e.home_id === homeId && e.status === "returned").length;
  const returnedScore = clamp(100 - returnedCount * 10);

  // ── Reg 45 pending evidence ───────────────────────────────────────────────
  const reg45Pending = db.ariaReg45EvidenceItems
    .findAll(homeId)
    .filter((c) => PENDING_REG45_STATUSES.has(c.status)).length;
  const reg45Score = clamp(100 - reg45Pending * 2);

  // ── Annex A pending evidence ──────────────────────────────────────────────
  const annexPending = db.annexAEvidenceQueue
    .findAll()
    .filter(
      (q) =>
        q.home_id === homeId && PENDING_ANNEX_DECISIONS.has(q.manager_decision),
    ).length;
  const annexScore = clamp(100 - annexPending * 2);

  // ── Child daily summary coverage (last 7 days) ────────────────────────────
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - 7);
  const cutoffISO = cutoff.toISOString().slice(0, 10);

  const recentEvents = db.careEvents
    .findCurrent()
    .filter(
      (e) =>
        e.home_id === homeId &&
        e.child_id !== null &&
        e.event_date >= cutoffISO &&
        e.status !== "draft" &&
        e.status !== "returned",
    );

  const expectedPairs = new Set(recentEvents.map((e) => `${e.child_id}::${e.event_date}`));
  const summaries = db.childDailySummaries
    .findAll()
    .filter((s) => s.home_id === homeId);
  const havePairs = new Set(summaries.map((s) => `${s.child_id}::${s.summary_date}`));

  let covered = 0;
  for (const p of expectedPairs) if (havePairs.has(p)) covered += 1;
  const coverageScore = expectedPairs.size === 0
    ? 100
    : clamp((covered / expectedPairs.size) * 100);

  // ── Care event currency (last 7 days verified/locked %) ───────────────────
  const finalisedRecent = recentEvents.filter(
    (e) => e.status === "verified" || e.status === "locked",
  ).length;
  const currencyScore = recentEvents.length === 0
    ? 100
    : clamp((finalisedRecent / recentEvents.length) * 100);

  // ── Compose categories ────────────────────────────────────────────────────
  const categories: ReadinessCategory[] = [
    {
      key: "routing_health", label: "Routing health",
      score: routingScore, weight: 1,
      open_count: failedRoutes,
      detail: failedRoutes === 0 ? "All routes processed cleanly." : `${failedRoutes} failed route${failedRoutes === 1 ? "" : "s"}/job${failedRoutes === 1 ? "" : "s"}.`,
      blocking: routingScore < 90,
    },
    {
      key: "amendment_review", label: "Amendment review",
      score: amendmentScore, weight: 1,
      open_count: amend.total,
      detail: amend.total === 0 ? "No sensitive amendments awaiting re-verification." : `${amend.total} sensitive amendment${amend.total === 1 ? "" : "s"} awaiting manager re-verification.`,
      blocking: amendmentScore < 90,
    },
    {
      key: "manager_review", label: "Manager review backlog",
      score: reviewScore, weight: 1,
      open_count: reviewBacklog,
      detail: reviewBacklog === 0 ? "Manager review queue empty." : `${reviewBacklog} care event${reviewBacklog === 1 ? "" : "s"} awaiting manager review.`,
      blocking: reviewScore < 90,
    },
    {
      key: "returned_records", label: "Returned records",
      score: returnedScore, weight: 1,
      open_count: returnedCount,
      detail: returnedCount === 0 ? "No records currently returned." : `${returnedCount} record${returnedCount === 1 ? "" : "s"} returned to staff and not yet resubmitted.`,
      blocking: returnedScore < 90,
    },
    {
      key: "reg45_evidence", label: "Reg 45 evidence",
      score: reg45Score, weight: 1,
      open_count: reg45Pending,
      detail: reg45Pending === 0 ? "All Reg 45 evidence chips have a manager decision." : `${reg45Pending} Reg 45 chip${reg45Pending === 1 ? "" : "s"} awaiting decision.`,
      blocking: reg45Score < 90,
    },
    {
      key: "annex_a_evidence", label: "Annex A evidence",
      score: annexScore, weight: 1,
      open_count: annexPending,
      detail: annexPending === 0 ? "All Annex A evidence has a manager decision." : `${annexPending} Annex A item${annexPending === 1 ? "" : "s"} awaiting decision.`,
      blocking: annexScore < 90,
    },
    {
      key: "daily_summary_coverage", label: "Daily summary coverage (7d)",
      score: coverageScore, weight: 1,
      open_count: expectedPairs.size - covered,
      detail: expectedPairs.size === 0
        ? "No qualifying events in the last 7 days."
        : `${covered}/${expectedPairs.size} (child × day) pairs have a summary.`,
      blocking: coverageScore < 90,
    },
    {
      key: "care_event_currency", label: "Care event currency (7d)",
      score: currencyScore, weight: 1,
      open_count: recentEvents.length - finalisedRecent,
      detail: recentEvents.length === 0
        ? "No care events in the last 7 days."
        : `${finalisedRecent}/${recentEvents.length} recent events verified or locked.`,
      blocking: currencyScore < 90,
    },
  ];

  const totalWeight = categories.reduce((a, c) => a + c.weight, 0);
  const weightedSum = categories.reduce((a, c) => a + c.score * c.weight, 0);
  const overall_score = clamp(weightedSum / totalWeight);

  return {
    home_id: homeId,
    generated_at: new Date().toISOString(),
    overall_score,
    severity: severityFor(overall_score),
    categories,
    blocking_categories: categories.filter((c) => c.blocking).map((c) => c.key),
  };
}
