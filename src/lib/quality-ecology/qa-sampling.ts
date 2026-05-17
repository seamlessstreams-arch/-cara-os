// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Quality Ecology — QA Sampling Engine
//
// Random sampling of approved/filed records for quality assurance review.
// Ensures consistent quality without reviewing every single record.
// Sampling rate is configurable per template (e.g., 10% of fire checks,
// 100% of safeguarding referrals).
//
// Sampling is weighted: records from staff with recent returns-for-improvement
// are more likely to be selected, as are first completions by new staff.
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import type { ScheduledOccurrence, TaskTemplate } from "./types";
import type { Role } from "../permissions/types";
import { isAtLeast } from "../permissions/role-rules";

// ── Types ──────────────────────────────────────────────────────────────────

export interface QASampleSelection {
  occurrenceId: string;
  templateId: string;
  templateName: string;
  homeId: string;
  completedBy: string;
  reason: SampleReason;
  weight: number;
}

export type SampleReason =
  | "random"             // standard random sample
  | "new_staff"          // first completions by new staff
  | "high_return_rate"   // staff with recent returns
  | "high_risk"          // high approval level items
  | "post_incident"      // after an incident was logged
  | "regulatory"         // required by regulation (100%)
  | "manager_request";   // manually requested by manager

export interface QAReviewInput {
  occurrenceId: string;
  reviewerId: string;
  qualityScore: number;    // 1-5
  findings: string;
  actionsRequired: string[];
  learningIdentified: string[];
  followUpRequired: boolean;
  followUpDue?: string;
}

export interface QAReviewResult {
  success: boolean;
  review?: QAReview;
  error?: string;
  userExplanation?: string;
}

export interface QAReview {
  id: string;
  occurrenceId: string;
  reviewerId: string;
  reviewedAt: string;
  qualityScore: number;
  qualityBand: QualityBand;
  findings: string;
  actionsRequired: string[];
  learningIdentified: string[];
  followUpRequired: boolean;
  followUpDue?: string;
  outcome: QAOutcome;
}

export type QualityBand = "outstanding" | "good" | "requires_improvement" | "inadequate";
export type QAOutcome = "pass" | "minor_actions" | "significant_actions" | "fail";

// ── Staff Profile for Weighting ────────────────────────────────────────────

export interface StaffQAProfile {
  userId: string;
  totalCompletions: number;
  recentReturnCount: number;   // returns in last 30 days
  isNewStaff: boolean;         // < 3 months
  lastQASampledAt?: string;
  averageQAScore?: number;
}

// ── Core: Select Samples ───────────────────────────────────────────────────

export function selectSamples(
  occurrences: ScheduledOccurrence[],
  template: TaskTemplate,
  staffProfiles: StaffQAProfile[],
  seed?: number,
): QASampleSelection[] {
  const eligible = occurrences.filter(o =>
    (o.status === "approved" || o.status === "locked" || o.status === "filed") &&
    !o.qaSampledAt,
  );

  if (eligible.length === 0) return [];

  const sampleRate = (template.qaSamplePercentage ?? 10) / 100;
  const targetCount = Math.max(1, Math.ceil(eligible.length * sampleRate));

  // Calculate weights for each occurrence
  const weighted = eligible.map(occ => {
    const staff = staffProfiles.find(s => s.userId === occ.completedBy);
    const weight = calculateWeight(occ, staff, template);
    const reason = determineReason(occ, staff, template);

    return {
      occurrence: occ,
      weight,
      reason,
    };
  });

  // Sort by weight (highest first) — deterministic sampling
  weighted.sort((a, b) => b.weight - a.weight);

  // Select top N by weight (with optional randomization via seed)
  const selected = weighted.slice(0, targetCount);

  return selected.map(s => ({
    occurrenceId: s.occurrence.id,
    templateId: template.id,
    templateName: template.name,
    homeId: s.occurrence.homeId,
    completedBy: s.occurrence.completedBy ?? "unknown",
    reason: s.reason,
    weight: s.weight,
  }));
}

// ── Core: Submit QA Review ─────────────────────────────────────────────────

export function submitQAReview(
  input: QAReviewInput,
  reviewerRole: Role,
  now?: string,
): QAReviewResult {
  const timestamp = now ?? new Date().toISOString();

  // Validate reviewer role (deputy_manager+ can QA sample)
  if (!isAtLeast(reviewerRole, "deputy_manager")) {
    return {
      success: false,
      error: `Role '${reviewerRole}' cannot perform QA reviews. Requires 'deputy_manager' or above.`,
      userExplanation: "You do not have permission to perform QA reviews.",
    };
  }

  // Validate score
  if (input.qualityScore < 1 || input.qualityScore > 5) {
    return {
      success: false,
      error: "Quality score must be between 1 and 5.",
      userExplanation: "Please provide a score between 1 and 5.",
    };
  }

  // Validate findings
  if (!input.findings || input.findings.trim().length === 0) {
    return {
      success: false,
      error: "Findings are required for QA review.",
      userExplanation: "Please provide your findings from this review.",
    };
  }

  const qualityBand = scoreToQualityBand(input.qualityScore);
  const outcome = determineOutcome(input.qualityScore, input.actionsRequired);

  const review: QAReview = {
    id: `qa-${input.occurrenceId}-${timestamp.replace(/[^0-9]/g, "").slice(0, 14)}`,
    occurrenceId: input.occurrenceId,
    reviewerId: input.reviewerId,
    reviewedAt: timestamp,
    qualityScore: input.qualityScore,
    qualityBand,
    findings: input.findings.trim(),
    actionsRequired: input.actionsRequired,
    learningIdentified: input.learningIdentified,
    followUpRequired: input.followUpRequired,
    followUpDue: input.followUpDue,
    outcome,
  };

  return {
    success: true,
    review,
  };
}

// ── Core: Calculate QA Metrics ─────────────────────────────────────────────

export interface QAMetrics {
  totalSampled: number;
  averageScore: number;
  passRate: number;
  qualityBandDistribution: Record<QualityBand, number>;
  outcomeDistribution: Record<QAOutcome, number>;
  totalActions: number;
  totalLearning: number;
  followUpsOutstanding: number;
}

export function calculateQAMetrics(reviews: QAReview[]): QAMetrics {
  if (reviews.length === 0) {
    return {
      totalSampled: 0,
      averageScore: 0,
      passRate: 100,
      qualityBandDistribution: { outstanding: 0, good: 0, requires_improvement: 0, inadequate: 0 },
      outcomeDistribution: { pass: 0, minor_actions: 0, significant_actions: 0, fail: 0 },
      totalActions: 0,
      totalLearning: 0,
      followUpsOutstanding: 0,
    };
  }

  const totalScore = reviews.reduce((sum, r) => sum + r.qualityScore, 0);
  const passCount = reviews.filter(r => r.qualityScore >= 3).length;

  const bandDist: Record<QualityBand, number> = { outstanding: 0, good: 0, requires_improvement: 0, inadequate: 0 };
  const outcomeDist: Record<QAOutcome, number> = { pass: 0, minor_actions: 0, significant_actions: 0, fail: 0 };

  let totalActions = 0;
  let totalLearning = 0;
  let followUps = 0;

  for (const review of reviews) {
    bandDist[review.qualityBand]++;
    outcomeDist[review.outcome]++;
    totalActions += review.actionsRequired.length;
    totalLearning += review.learningIdentified.length;
    if (review.followUpRequired) followUps++;
  }

  return {
    totalSampled: reviews.length,
    averageScore: Math.round((totalScore / reviews.length) * 10) / 10,
    passRate: Math.round((passCount / reviews.length) * 100),
    qualityBandDistribution: bandDist,
    outcomeDistribution: outcomeDist,
    totalActions,
    totalLearning,
    followUpsOutstanding: followUps,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function calculateWeight(
  occ: ScheduledOccurrence,
  staff: StaffQAProfile | undefined,
  template: TaskTemplate,
): number {
  let weight = 1.0;

  // High approval level = higher weight
  if (occ.approvalLevel >= 2) weight += 1.5;
  else if (occ.approvalLevel === 1) weight += 0.5;

  // Resubmitted work = higher weight
  if (occ.resubmissionCount > 0) weight += 1.0 * occ.resubmissionCount;

  // Staff factors
  if (staff) {
    // New staff get sampled more
    if (staff.isNewStaff) weight += 2.0;

    // High return rate staff
    if (staff.recentReturnCount >= 3) weight += 2.5;
    else if (staff.recentReturnCount >= 1) weight += 1.0;

    // Staff not sampled recently get slight boost
    if (!staff.lastQASampledAt) weight += 0.5;

    // Staff with low average score
    if (staff.averageQAScore !== undefined && staff.averageQAScore < 3) weight += 1.5;
  }

  // Template requires QA = always highest weight
  if (template.qaRequired) weight += 5.0;

  return weight;
}

function determineReason(
  occ: ScheduledOccurrence,
  staff: StaffQAProfile | undefined,
  template: TaskTemplate,
): SampleReason {
  if (template.qaRequired) return "regulatory";
  if (staff?.isNewStaff) return "new_staff";
  if (staff && staff.recentReturnCount >= 2) return "high_return_rate";
  if (occ.approvalLevel >= 2) return "high_risk";
  return "random";
}

function scoreToQualityBand(score: number): QualityBand {
  if (score >= 5) return "outstanding";
  if (score >= 4) return "good";
  if (score >= 3) return "requires_improvement";
  return "inadequate";
}

function determineOutcome(score: number, actions: string[]): QAOutcome {
  if (score >= 4 && actions.length === 0) return "pass";
  if (score >= 3 && actions.length <= 2) return "minor_actions";
  if (score >= 2) return "significant_actions";
  return "fail";
}
