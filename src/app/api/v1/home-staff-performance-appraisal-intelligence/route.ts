// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STAFF PERFORMANCE APPRAISAL INTELLIGENCE API ROUTE
// GET /api/v1/home-staff-performance-appraisal-intelligence
// Synthesises appraisal records, performance targets, competency assessments,
// development goals, and feedback records to produce an overall staff
// performance appraisal quality score.
// CHR 2015 Reg 16 (workforce), Reg 33 (employment of staff). SCCIF.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeStaffPerformanceAppraisal,
  type AppraisalRecordInput,
  type PerformanceTargetInput,
  type CompetencyAssessmentInput,
  type DevelopmentGoalInput,
  type FeedbackRecordInput,
} from "@/lib/engines/home-staff-performance-appraisal-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);
  const total_staff = ((store.staff as any[]) || []).length;

  // ── Appraisal Records ────────────────────────────────────────────────
  const rawAppraisals = (store.appraisals ?? []) as any[];
  const appraisal_records: AppraisalRecordInput[] = rawAppraisals.map((a: any) => {
    // Map store overall_rating to engine format
    const ratingMap: Record<string, string> = {
      outstanding: "exceptional",
      good: "effective",
      requires_improvement: "developing",
      inadequate: "underperforming",
    };
    const mappedRating = ratingMap[a.overall_rating] ?? a.overall_rating ?? "not_rated";

    // Compute quality score from competency_scores if available
    let qualityScore: number | null = null;
    if (a.competency_scores && typeof a.competency_scores === "object") {
      const scores = Object.values(a.competency_scores).filter(
        (v): v is number => typeof v === "number",
      );
      if (scores.length > 0) {
        qualityScore =
          Math.round(
            (scores.reduce((s: number, v: number) => s + v, 0) / scores.length) * 2,
          );
        // Scale 1-5 competency scores to 1-10 quality scale
        qualityScore = Math.min(10, Math.max(1, qualityScore));
      }
    }

    return {
      id: a.id ?? "",
      staff_id: a.staff_id ?? "",
      appraisal_date: (a.appraisal_date ?? today).toString().slice(0, 10),
      status: a.status ?? "scheduled",
      appraiser_id: a.appraiser_id ?? "",
      overall_rating: mappedRating,
      review_period_start: (a.review_period_start ?? a.appraisal_date ?? today)
        .toString()
        .slice(0, 10),
      review_period_end: (a.review_period_end ?? a.appraisal_date ?? today)
        .toString()
        .slice(0, 10),
      objectives_set: !!(
        a.objectives_next_period && a.objectives_next_period.length > 0
      ),
      development_plan_agreed: !!a.linked_development_plan_id,
      staff_signed: !!(a.signed_by_staff),
      manager_signed: !!(a.appraiser_id), // If appraiser is assigned, manager has reviewed
      quality_score: qualityScore,
    };
  });

  // ── Performance Target Records ────────────────────────────────────────
  // Derive from development plan actions as performance targets
  const rawDevPlans = (store.developmentPlans ?? []) as any[];
  const performance_target_records: PerformanceTargetInput[] = [];
  for (const plan of rawDevPlans) {
    const actions = (plan.actions ?? []) as any[];
    for (const action of actions) {
      const targetDate = (action.target_date ?? today).toString().slice(0, 10);
      const isCompleted = !!action.completed;
      const isPastDue = targetDate < today && !isCompleted;

      let status: string;
      if (isCompleted) {
        status = "achieved";
      } else if (isPastDue) {
        status = "not_met";
      } else {
        // Check progress
        const progress = typeof action.progress === "number" ? action.progress : 0;
        if (progress >= 50) status = "on_track";
        else if (progress > 0) status = "at_risk";
        else status = "not_started";
      }

      performance_target_records.push({
        id: action.id ?? "",
        staff_id: plan.staff_id ?? "",
        target_description: action.title ?? action.description ?? "",
        category: action.domain ?? "other",
        status,
        target_date: targetDate,
        set_date: (plan.created_at ?? today).toString().slice(0, 10),
        progress_percentage: isCompleted
          ? 100
          : typeof action.progress === "number"
            ? action.progress
            : 0,
        reviewed: isCompleted || !!action.evidence_notes,
        evidence_attached: !!action.evidence_notes,
      });
    }
  }

  // ── Competency Assessment Records ─────────────────────────────────────
  // Derive from appraisal competency_scores
  const competency_assessment_records: CompetencyAssessmentInput[] = [];
  for (const a of rawAppraisals) {
    if (
      !a.competency_scores ||
      typeof a.competency_scores !== "object" ||
      Object.keys(a.competency_scores).length === 0
    ) {
      continue;
    }
    for (const [area, scoreVal] of Object.entries(a.competency_scores)) {
      const score = typeof scoreVal === "number" ? scoreVal : 0;
      // Map 1-5 scale to competency levels
      let currentLevel: string;
      if (score >= 5) currentLevel = "expert";
      else if (score >= 4) currentLevel = "proficient";
      else if (score >= 3) currentLevel = "competent";
      else if (score >= 2) currentLevel = "developing";
      else currentLevel = "not_assessed";

      const gapIdentified = score < 3;

      competency_assessment_records.push({
        id: `${a.id}_${area}`,
        staff_id: a.staff_id ?? "",
        competency_area: area,
        current_level: currentLevel,
        required_level: "competent",
        assessed_date: a.status === "completed"
          ? (a.appraisal_date ?? today).toString().slice(0, 10)
          : null,
        assessor_id: a.appraiser_id ?? "",
        gap_identified: gapIdentified,
        action_plan_in_place: gapIdentified && !!a.linked_development_plan_id,
      });
    }
  }

  // Also include standalone competency records if they exist
  const rawCompetencies = (store.staffCompetencyRecords as any[] ?? []);
  for (const rec of rawCompetencies) {
    const entries = (rec.entries ?? []) as any[];
    for (const e of entries) {
      competency_assessment_records.push({
        id: e.id ?? rec.id ?? "",
        staff_id: rec.staff_id ?? "",
        competency_area: e.area ?? e.competency_area ?? "other",
        current_level: e.level ?? "not_assessed",
        required_level: e.required_level ?? "competent",
        assessed_date: e.assessed_date
          ? e.assessed_date.toString().slice(0, 10)
          : null,
        assessor_id: e.assessor_id ?? rec.assessor_id ?? "",
        gap_identified: !!e.gap_identified,
        action_plan_in_place: !!e.action_plan,
      });
    }
  }

  // ── Development Goal Records ──────────────────────────────────────────
  // Derive from development plans
  const development_goal_records: DevelopmentGoalInput[] = [];
  for (const plan of rawDevPlans) {
    const actions = (plan.actions ?? []) as any[];
    for (const action of actions) {
      const targetDate = (action.target_date ?? today).toString().slice(0, 10);
      const isCompleted = !!action.completed;
      const isPastDue = targetDate < today && !isCompleted;

      let status: string;
      if (isCompleted) {
        status = "completed";
      } else if (isPastDue) {
        status = "overdue";
      } else {
        const progress = typeof action.progress === "number" ? action.progress : 0;
        if (progress > 0) status = "in_progress";
        else status = "not_started";
      }

      // Map domain to goal category
      const categoryMap: Record<string, string> = {
        learning_and_professional_development: "qualification",
        leadership_and_supervision: "skill",
        statutory_compliance: "knowledge",
        safeguarding_and_child_protection: "knowledge",
        risk_management: "skill",
        trauma_informed_practice: "skill",
        therapeutic_relationships: "behaviour",
        communication_and_recording: "skill",
      };

      development_goal_records.push({
        id: action.id ?? "",
        staff_id: plan.staff_id ?? "",
        goal_description: action.title ?? action.description ?? "",
        category: categoryMap[action.domain] ?? "other",
        status,
        target_date: targetDate,
        set_date: (plan.created_at ?? today).toString().slice(0, 10),
        progress_percentage: isCompleted
          ? 100
          : typeof action.progress === "number"
            ? action.progress
            : 0,
        support_provided: !!plan.cara_generated || !!action.evidence_notes,
        resource_allocated: !!plan.cara_generated,
      });
    }
  }

  // ── Feedback Records ──────────────────────────────────────────────────
  // Derive from practice observations and appraisal Cara insights
  const rawObservations = (store.practiceObservations ?? []) as any[];
  const feedback_records: FeedbackRecordInput[] = [];

  for (const obs of rawObservations) {
    const sentimentMap: Record<string, string> = {
      outstanding: "positive",
      exceeds_standard: "positive",
      meets_standard: "constructive",
      below_standard: "negative",
      requires_improvement: "negative",
    };

    feedback_records.push({
      id: obs.id ?? "",
      staff_id: obs.staff_id ?? "",
      feedback_date: (obs.observation_date ?? today).toString().slice(0, 10),
      feedback_type: "formal",
      sentiment: sentimentMap[obs.outcome] ?? "mixed",
      quality_rating: obs.score_adjustments
        ? Math.min(
            10,
            7 +
              (obs.score_adjustments as any[]).reduce(
                (s: number, adj: any) => s + (adj.delta ?? 0),
                0,
              ),
          )
        : null,
      actionable:
        !!(obs.areas_for_development && (obs.areas_for_development as any[]).length > 0),
      follow_up_completed: !!obs.signed_off_by_staff,
      source: "observation",
    });
  }

  // Appraisal-derived feedback (from completed appraisals with Cara insights)
  for (const a of rawAppraisals) {
    if (a.status !== "completed") continue;
    if (a.cara_insights) {
      feedback_records.push({
        id: `fb_${a.id}`,
        staff_id: a.staff_id ?? "",
        feedback_date: (a.appraisal_date ?? today).toString().slice(0, 10),
        feedback_type: "manager",
        sentiment: a.overall_rating === "outstanding" || a.overall_rating === "good"
          ? "positive"
          : a.overall_rating === "inadequate"
            ? "negative"
            : "constructive",
        quality_rating: a.competency_scores
          ? Math.min(
              10,
              Math.round(
                (Object.values(a.competency_scores).filter(
                  (v): v is number => typeof v === "number",
                ) as number[]).reduce((s, v) => s + v, 0) /
                  Math.max(
                    1,
                    (Object.values(a.competency_scores).filter(
                      (v): v is number => typeof v === "number",
                    ) as number[]).length,
                  ) * 2,
              ),
            )
          : null,
        actionable: !!(a.areas_for_improvement && a.areas_for_improvement.length > 0),
        follow_up_completed: !!a.signed_by_staff,
        source: "appraisal",
      });
    }
  }

  // ── Compute ──────────────────────────────────────────────────────────
  const result = computeStaffPerformanceAppraisal({
    today,
    total_staff,
    appraisal_records,
    performance_target_records,
    competency_assessment_records,
    development_goal_records,
    feedback_records,
  });

  return NextResponse.json({ data: result });
}
