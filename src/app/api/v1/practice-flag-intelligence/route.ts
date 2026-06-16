// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE FLAG INTELLIGENCE
// GET /api/v1/practice-flag-intelligence
// Synthesises unresolved Cara practice flags, threshold consultations, and
// staff wellbeing signals into a manager-facing priority briefing.
// CHR 2015 Reg 28, Reg 36, Reg 40; SCCIF — Practice quality.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";

type FlagSeverity = "high" | "medium" | "low";
type OverallSignal = "urgent" | "attention" | "good";

interface PracticeFlagEntry {
  id: string;
  childId: string | null;
  staffId: string | null;
  childName: string | null;
  flagType: string;
  title: string;
  description: string;
  evidence: string;
  recommendedAction: string;
  severity: FlagSeverity;
  requiresManagerReview: boolean;
  requiresRiReview: boolean;
  sourceType: string;
  sourceId: string | null;
  createdAt: string;
}

interface ThresholdConsultationEntry {
  id: string;
  childId: string | null;
  childName: string | null;
  concernType: string;
  summary: string;
  recommendedNextStep: string;
  strategyDiscussionRecommended: boolean;
  ladoConsultationRecommended: boolean;
  emergencyActionRecommended: boolean;
  managerDecision: string | null;
  createdAt: string;
}

interface StaffWellbeingSignalEntry {
  id: string;
  staffId: string;
  staffName: string;
  signalType: string;
  severity: FlagSeverity;
  evidence: string;
  supportRecommendation: string;
  managerAction: string | null;
  resolved: boolean;
}

interface PracticeFlagSummary {
  totalFlags: number;
  unresolvedFlags: number;
  highSeverityCount: number;
  managerReviewRequiredCount: number;
  riReviewRequiredCount: number;
  thresholdConsultationCount: number;
  staffWellbeingSignalCount: number;
  overallSignal: OverallSignal;
  flagTypeBreakdown: { type: string; count: number }[];
  childrenWithFlags: { childId: string; childName: string; flagCount: number; highSeverityCount: number }[];
}

interface PracticeFlagIntelligenceResponse {
  data: {
    priorityFlags: PracticeFlagEntry[];
    allFlags: PracticeFlagEntry[];
    thresholdConsultations: ThresholdConsultationEntry[];
    staffWellbeingSignals: StaffWellbeingSignalEntry[];
    summary: PracticeFlagSummary;
  };
}

const FLAG_TYPE_LABELS: Record<string, string> = {
  safeguarding_threshold: "Safeguarding threshold",
  extra_familial_harm: "Extra-familial harm",
  nrm_consideration: "NRM consideration",
  developmental_gap: "Developmental gap",
  vague_recording: "Vague recording",
  activity_over_impact: "Activity over impact",
  overstated_protective_factor: "Overstated protective factor",
  relationship_depth: "Relationship depth",
  staff_wellbeing: "Staff wellbeing",
};

export async function GET(): Promise<NextResponse<PracticeFlagIntelligenceResponse>> {
  const store = getStore();

  const ypMap = new Map(
    ((store.youngPeople as any[]) ?? []).map((yp: any) => [
      yp.id,
      `${yp.first_name} ${yp.last_name}`.trim() || "Unknown",
    ])
  );

  const staffMap = new Map(
    ((store.staff as any[]) ?? []).map((s: any) => [
      s.id,
      s.full_name ?? (`${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.id),
    ])
  );

  // ── Practice flags ────────────────────────────────────────────────────────
  const rawFlags = (store.caraPracticeFlags as any[]) ?? [];
  const unresolvedRaw = rawFlags.filter((f: any) => !f.resolved);

  const allFlags: PracticeFlagEntry[] = unresolvedRaw.map((f: any): PracticeFlagEntry => ({
    id: f.id ?? "",
    childId: f.child_id ?? null,
    staffId: f.staff_id ?? null,
    childName: f.child_id ? (ypMap.get(f.child_id) ?? f.child_id) : null,
    flagType: f.flag_type ?? "unknown",
    title: f.title ?? "",
    description: f.description ?? "",
    evidence: f.evidence ?? "",
    recommendedAction: f.recommended_action ?? "",
    severity: (f.severity ?? "medium") as FlagSeverity,
    requiresManagerReview: !!f.requires_manager_review,
    requiresRiReview: !!f.requires_ri_review,
    sourceType: f.source_type ?? "",
    sourceId: f.source_id ?? null,
    createdAt: f.created_at ?? "",
  }));

  // Sort: high severity first, then manager-review-required, then medium
  const severityOrder: Record<FlagSeverity, number> = { high: 0, medium: 1, low: 2 };
  allFlags.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    if (a.requiresManagerReview && !b.requiresManagerReview) return -1;
    if (!a.requiresManagerReview && b.requiresManagerReview) return 1;
    return 0;
  });

  const priorityFlags = allFlags.filter(
    (f) => f.severity === "high" || f.requiresManagerReview
  );

  // ── Threshold consultations ───────────────────────────────────────────────
  const rawConsultations = (store.caraThresholdConsultations as any[]) ?? [];
  const thresholdConsultations: ThresholdConsultationEntry[] = rawConsultations
    .filter((c: any) => !c.manager_decision)
    .map((c: any): ThresholdConsultationEntry => ({
      id: c.id ?? "",
      childId: c.child_id ?? null,
      childName: c.child_id ? (ypMap.get(c.child_id) ?? c.child_id) : null,
      concernType: c.concern_type ?? "",
      summary: c.cara_summary ?? "",
      recommendedNextStep: c.recommended_next_step ?? "",
      strategyDiscussionRecommended: !!c.strategy_discussion_recommended,
      ladoConsultationRecommended: !!c.lado_consultation_recommended,
      emergencyActionRecommended: !!c.emergency_action_recommended,
      managerDecision: c.manager_decision ?? null,
      createdAt: c.created_at ?? "",
    }));

  // ── Staff wellbeing signals ───────────────────────────────────────────────
  const rawWellbeing = (store.caraStaffWellbeingSignals as any[]) ?? [];
  const staffWellbeingSignals: StaffWellbeingSignalEntry[] = rawWellbeing
    .filter((s: any) => !s.resolved)
    .map((s: any): StaffWellbeingSignalEntry => ({
      id: s.id ?? "",
      staffId: s.staff_id ?? "",
      staffName: staffMap.get(s.staff_id) ?? s.staff_id,
      signalType: s.signal_type ?? "",
      severity: (s.severity ?? "medium") as FlagSeverity,
      evidence: s.evidence ?? "",
      supportRecommendation: s.support_recommendation ?? "",
      managerAction: s.manager_action ?? null,
      resolved: !!s.resolved,
    }));

  // ── Summary ───────────────────────────────────────────────────────────────
  const highSeverityCount = allFlags.filter((f) => f.severity === "high").length;
  const managerReviewRequiredCount = allFlags.filter((f) => f.requiresManagerReview).length;
  const riReviewRequiredCount = allFlags.filter((f) => f.requiresRiReview).length;

  // Flag type breakdown
  const typeCount = new Map<string, number>();
  allFlags.forEach((f) => {
    typeCount.set(f.flagType, (typeCount.get(f.flagType) ?? 0) + 1);
  });
  const flagTypeBreakdown = [...typeCount.entries()]
    .map(([type, count]) => ({ type: FLAG_TYPE_LABELS[type] ?? type, count }))
    .sort((a, b) => b.count - a.count);

  // Per-child flag counts
  const childFlagMap = new Map<string, { childName: string; flagCount: number; highSeverityCount: number }>();
  allFlags.forEach((f) => {
    if (!f.childId) return;
    const entry = childFlagMap.get(f.childId) ?? { childName: f.childName ?? f.childId, flagCount: 0, highSeverityCount: 0 };
    entry.flagCount++;
    if (f.severity === "high") entry.highSeverityCount++;
    childFlagMap.set(f.childId, entry);
  });
  const childrenWithFlags = [...childFlagMap.entries()]
    .map(([childId, data]) => ({ childId, ...data }))
    .sort((a, b) => b.highSeverityCount - a.highSeverityCount || b.flagCount - a.flagCount);

  // Overall signal
  let overallSignal: OverallSignal = "good";
  if (highSeverityCount > 0 || thresholdConsultations.some((c) => c.emergencyActionRecommended)) {
    overallSignal = "urgent";
  } else if (managerReviewRequiredCount > 0 || staffWellbeingSignals.length > 0 || thresholdConsultations.length > 0) {
    overallSignal = "attention";
  }

  const summary: PracticeFlagSummary = {
    totalFlags: rawFlags.length,
    unresolvedFlags: allFlags.length,
    highSeverityCount,
    managerReviewRequiredCount,
    riReviewRequiredCount,
    thresholdConsultationCount: thresholdConsultations.length,
    staffWellbeingSignalCount: staffWellbeingSignals.length,
    overallSignal,
    flagTypeBreakdown,
    childrenWithFlags,
  };

  return NextResponse.json({ data: { priorityFlags, allFlags, thresholdConsultations, staffWellbeingSignals, summary } });
}
