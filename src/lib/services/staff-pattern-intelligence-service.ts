// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF PATTERN INTELLIGENCE SERVICE
// Core Cara engine for identifying patterns across staff practice records.
// Analyses incidents, daily logs, handovers, supervision, training,
// medication, missing episodes, restraints, complaints, rotas, sickness,
// key work, recording timeliness, and child interaction records.
//
// CRITICAL PRINCIPLES:
// — Strengths-based, fair, contextual and evidence-led
// — Cara suggests. Humans decide. Cara evidences.
// — Never makes HR, disciplinary or capability decisions
// — Supports managers to think fairly, evidence clearly, act proportionately
//
// CHR 2015 Reg 13 (leadership and management), Reg 33 (employment of staff),
// Reg 34 (fitness of workers), Reg 35 (supervision and training).
//
// SCCIF: Leadership — "Staff are supported, supervised and appraised."
// "Managers identify and respond to staff development needs."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type InsightType =
  | "performance_dip"
  | "repeated_strength"
  | "repeated_concern"
  | "confidence_gap"
  | "training_gap"
  | "wellbeing_indicator"
  | "burnout_risk"
  | "relationship_pattern"
  | "recording_quality_change"
  | "task_avoidance";

export type InsightSeverity =
  | "informational"
  | "needs_exploration"
  | "pattern_emerging"
  | "support_recommended"
  | "manager_review_required";

export type ConfidenceLevel =
  | "very_high"
  | "high"
  | "medium"
  | "low"
  | "very_low";

export type InsightStatus =
  | "draft"
  | "pending_review"
  | "reviewed"
  | "actioned"
  | "dismissed";

export interface StaffPatternInsightRecord {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  insight_type: InsightType;
  insight_severity: InsightSeverity;
  confidence_level: ConfidenceLevel;
  insight_status: InsightStatus;
  session_date: string;
  identified_by: string;
  title: string;
  description: string;
  evidence_summary: string;
  period_start: string | null;
  period_end: string | null;
  context: string | null;
  alternative_explanations: string | null;
  manager_notes: string | null;
  staff_comment: string | null;
  evidence_verified: boolean;
  context_provided: boolean;
  alternative_explanations_considered: boolean;
  manager_reviewed: boolean;
  staff_notified: boolean;
  staff_commented: boolean;
  action_plan_created: boolean;
  support_offered: boolean;
  training_identified: boolean;
  supervision_discussed: boolean;
  wellbeing_checked: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

export const INSIGHT_TYPES: { type: InsightType; label: string }[] = [
  { type: "performance_dip", label: "Performance Dip" },
  { type: "repeated_strength", label: "Repeated Strength" },
  { type: "repeated_concern", label: "Repeated Concern" },
  { type: "confidence_gap", label: "Confidence Gap" },
  { type: "training_gap", label: "Training Gap" },
  { type: "wellbeing_indicator", label: "Wellbeing Indicator" },
  { type: "burnout_risk", label: "Burnout Risk" },
  { type: "relationship_pattern", label: "Relationship Pattern" },
  { type: "recording_quality_change", label: "Recording Quality Change" },
  { type: "task_avoidance", label: "Task Avoidance" },
];

export const INSIGHT_SEVERITIES: { severity: InsightSeverity; label: string }[] = [
  { severity: "informational", label: "Informational" },
  { severity: "needs_exploration", label: "Needs Exploration" },
  { severity: "pattern_emerging", label: "Pattern Emerging" },
  { severity: "support_recommended", label: "Support Recommended" },
  { severity: "manager_review_required", label: "Manager Review Required" },
];

export const CONFIDENCE_LEVELS: { level: ConfidenceLevel; label: string }[] = [
  { level: "very_high", label: "Very High" },
  { level: "high", label: "High" },
  { level: "medium", label: "Medium" },
  { level: "low", label: "Low" },
  { level: "very_low", label: "Very Low" },
];

export const INSIGHT_STATUSES: { status: InsightStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "pending_review", label: "Pending Review" },
  { status: "reviewed", label: "Reviewed" },
  { status: "actioned", label: "Actioned" },
  { status: "dismissed", label: "Dismissed" },
];

// ── Metrics ─────────────────────────────────────────────────────────────

export function computePatternInsightMetrics(records: StaffPatternInsightRecord[]): {
  total_insights: number;
  manager_review_count: number;
  support_recommended_count: number;
  low_confidence_count: number;
  unreviewed_count: number;
  concern_count: number;
  strength_count: number;
  evidence_verified_rate: number | null;
  context_provided_rate: number | null;
  alternatives_considered_rate: number | null;
  manager_reviewed_rate: number | null;
  staff_notified_rate: number | null;
  staff_commented_rate: number | null;
  action_plan_rate: number | null;
  support_offered_rate: number | null;
  training_identified_rate: number | null;
  supervision_discussed_rate: number | null;
  wellbeing_checked_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_staff: number;
  by_insight_type: Record<string, number>;
  by_insight_severity: Record<string, number>;
  by_confidence_level: Record<string, number>;
  by_insight_status: Record<string, number>;
} {
  const managerReview = records.filter((r) => r.insight_severity === "manager_review_required").length;
  const supportRecommended = records.filter((r) => r.insight_severity === "support_recommended").length;
  const lowConfidence = records.filter((r) => r.confidence_level === "low" || r.confidence_level === "very_low").length;
  const unreviewed = records.filter((r) => r.insight_status === "draft" || r.insight_status === "pending_review").length;
  const concerns = records.filter((r) => r.insight_type === "repeated_concern" || r.insight_type === "performance_dip").length;
  const strengths = records.filter((r) => r.insight_type === "repeated_strength").length;

  const boolRate = (field: keyof StaffPatternInsightRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.insight_type] = (byType[r.insight_type] ?? 0) + 1;

  const bySeverity: Record<string, number> = {};
  for (const r of records) bySeverity[r.insight_severity] = (bySeverity[r.insight_severity] ?? 0) + 1;

  const byConfidence: Record<string, number> = {};
  for (const r of records) byConfidence[r.confidence_level] = (byConfidence[r.confidence_level] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.insight_status] = (byStatus[r.insight_status] ?? 0) + 1;

  return {
    total_insights: records.length,
    manager_review_count: managerReview,
    support_recommended_count: supportRecommended,
    low_confidence_count: lowConfidence,
    unreviewed_count: unreviewed,
    concern_count: concerns,
    strength_count: strengths,
    evidence_verified_rate: boolRate("evidence_verified"),
    context_provided_rate: boolRate("context_provided"),
    alternatives_considered_rate: boolRate("alternative_explanations_considered"),
    manager_reviewed_rate: boolRate("manager_reviewed"),
    staff_notified_rate: boolRate("staff_notified"),
    staff_commented_rate: boolRate("staff_commented"),
    action_plan_rate: boolRate("action_plan_created"),
    support_offered_rate: boolRate("support_offered"),
    training_identified_rate: boolRate("training_identified"),
    supervision_discussed_rate: boolRate("supervision_discussed"),
    wellbeing_checked_rate: boolRate("wellbeing_checked"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_staff: new Set(records.map((r) => r.staff_name)).size,
    by_insight_type: byType,
    by_insight_severity: bySeverity,
    by_confidence_level: byConfidence,
    by_insight_status: byStatus,
  };
}

// ── Alerts ──────────────────────────────────────────────────────────────

export interface PatternInsightAlert {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}

export function identifyPatternInsightAlerts(records: StaffPatternInsightRecord[]): PatternInsightAlert[] {
  const alerts: PatternInsightAlert[] = [];

  // Critical: unreviewed high-severity insights (per-record)
  for (const r of records) {
    if (
      (r.insight_severity === "support_recommended" || r.insight_severity === "manager_review_required") &&
      (r.insight_status === "draft" || r.insight_status === "pending_review")
    ) {
      const label = r.insight_severity === "manager_review_required" ? "manager review" : "support";
      alerts.push({
        type: "unreviewed_serious",
        severity: "critical",
        message: `${r.staff_name} has an unreviewed pattern insight requiring ${label} — manager action needed.`,
        record_id: r.id,
      });
    }
  }

  // High: evidence not verified (>= 1)
  const noEvidence = records.filter((r) => r.evidence_verified === false).length;
  if (noEvidence > 0) {
    alerts.push({
      type: "no_evidence_verified",
      severity: "high",
      message: `${noEvidence} insight${noEvidence === 1 ? " has" : "s have"} evidence not yet verified.`,
    });
  }

  // High: staff not notified (>= 1)
  const noNotified = records.filter((r) => r.staff_notified === false).length;
  if (noNotified > 0) {
    alerts.push({
      type: "staff_not_notified",
      severity: "high",
      message: `${noNotified} insight${noNotified === 1 ? " has" : "s have"} staff not yet notified.`,
    });
  }

  // Medium: alternatives not considered (>= 2)
  const noAlternatives = records.filter((r) => r.alternative_explanations_considered === false).length;
  if (noAlternatives >= 2) {
    alerts.push({
      type: "no_alternatives_considered",
      severity: "medium",
      message: `${noAlternatives} insights have alternative explanations not considered.`,
    });
  }

  // Medium: wellbeing not checked (>= 2)
  const noWellbeing = records.filter((r) => r.wellbeing_checked === false).length;
  if (noWellbeing >= 2) {
    alerts.push({
      type: "no_wellbeing_check",
      severity: "medium",
      message: `${noWellbeing} insights have no wellbeing check completed.`,
    });
  }

  return alerts;
}

// ── Manager Critical Friend Questions ───────────────────────────────────

export interface CriticalFriendQuestion {
  category: string;
  question: string;
  guidance: string;
}

export const CRITICAL_FRIEND_QUESTIONS: CriticalFriendQuestion[] = [
  { category: "skill", question: "Is this a skill issue?", guidance: "Does the staff member know how to do this? Have they been trained? Have they demonstrated this skill before?" },
  { category: "confidence", question: "Is this a confidence issue?", guidance: "Does the staff member know what to do but lacks confidence to act? Do they seek reassurance? Do they avoid taking the lead?" },
  { category: "wellbeing", question: "Is this a wellbeing issue?", guidance: "Is the staff member showing signs of stress, fatigue, or emotional impact? Has something changed recently in their personal or professional life?" },
  { category: "training", question: "Is this a training issue?", guidance: "Has the staff member received adequate training? Is the training current? Does it need refreshing or extending?" },
  { category: "supervision", question: "Is this a supervision issue?", guidance: "Is the staff member receiving regular, reflective supervision? Are concerns being explored? Is there a safe space to discuss challenges?" },
  { category: "team_culture", question: "Is this a team culture issue?", guidance: "Is the wider team experiencing similar patterns? Are team dynamics affecting this individual? Is there a systemic issue?" },
  { category: "workload", question: "Is this a workload issue?", guidance: "Is the staff member overloaded? Are shift patterns sustainable? Is there adequate support during high-intensity periods?" },
  { category: "expectations", question: "Is this an unclear expectation issue?", guidance: "Does the staff member know what is expected? Are policies, procedures and standards clear and accessible?" },
  { category: "conduct", question: "Is this a conduct issue?", guidance: "Only consider this after ruling out all support-based explanations. Is there genuine unwillingness rather than inability? What evidence supports this conclusion?" },
  { category: "evidence", question: "What evidence supports this assessment?", guidance: "Document specific observations, dates, and records. Avoid assumptions. Consider the full picture, not isolated incidents." },
  { category: "prior_support", question: "What support has already been offered?", guidance: "Review supervision records, training history, and previous development plans. Has support been adequate and timely?" },
  { category: "fair_action", question: "What would a fair manager do next?", guidance: "Consider proportionality. Start with support, not sanctions. Think: would a reasonable person agree this is fair?" },
];

// ── CRUD ────────────────────────────────────────────────────────────────

export async function listPatternInsights(
  homeId: string,
): Promise<ServiceResult<StaffPatternInsightRecord[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  const { data, error } = await (client.from("cs_staff_pattern_insights") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("session_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffPatternInsightRecord[] };
}

export async function createPatternInsight(input: {
  homeId: string;
  staffName: string;
  staffId?: string | null;
  insightType: InsightType;
  insightSeverity: InsightSeverity;
  confidenceLevel: ConfidenceLevel;
  insightStatus: InsightStatus;
  sessionDate: string;
  identifiedBy: string;
  title: string;
  description: string;
  evidenceSummary: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  context?: string | null;
  alternativeExplanations?: string | null;
  managerNotes?: string | null;
  staffComment?: string | null;
  evidenceVerified: boolean;
  contextProvided: boolean;
  alternativeExplanationsConsidered: boolean;
  managerReviewed: boolean;
  staffNotified: boolean;
  staffCommented: boolean;
  actionPlanCreated: boolean;
  supportOffered: boolean;
  trainingIdentified: boolean;
  supervisionDiscussed: boolean;
  wellbeingChecked: boolean;
  recordedPromptly: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<StaffPatternInsightRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_pattern_insights") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId ?? null,
      insight_type: input.insightType,
      insight_severity: input.insightSeverity,
      confidence_level: input.confidenceLevel,
      insight_status: input.insightStatus,
      session_date: input.sessionDate,
      identified_by: input.identifiedBy,
      title: input.title,
      description: input.description,
      evidence_summary: input.evidenceSummary,
      period_start: input.periodStart ?? null,
      period_end: input.periodEnd ?? null,
      context: input.context ?? null,
      alternative_explanations: input.alternativeExplanations ?? null,
      manager_notes: input.managerNotes ?? null,
      staff_comment: input.staffComment ?? null,
      evidence_verified: input.evidenceVerified,
      context_provided: input.contextProvided,
      alternative_explanations_considered: input.alternativeExplanationsConsidered,
      manager_reviewed: input.managerReviewed,
      staff_notified: input.staffNotified,
      staff_commented: input.staffCommented,
      action_plan_created: input.actionPlanCreated,
      support_offered: input.supportOffered,
      training_identified: input.trainingIdentified,
      supervision_discussed: input.supervisionDiscussed,
      wellbeing_checked: input.wellbeingChecked,
      recorded_promptly: input.recordedPromptly,
      issues_found: input.issuesFound ?? [],
      actions_taken: input.actionsTaken ?? [],
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffPatternInsightRecord };
}

export async function updatePatternInsight(
  id: string,
  updates: Partial<Omit<StaffPatternInsightRecord, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<StaffPatternInsightRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_pattern_insights") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffPatternInsightRecord };
}

// ── Testing export ─────────────────────────────────────────────────────

export const _testing = { computePatternInsightMetrics, identifyPatternInsightAlerts };
