// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF DEVELOPMENT INTELLIGENCE API ROUTE
// GET /api/v1/staff-development-intelligence
// Returns appraisal, competency, qualification, induction and development plan
// intelligence. Reg 32/33/29, SCCIF workforce development.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeStaffDevelopmentIntelligence,
  type StaffInput,
  type AppraisalInput,
  type CompetencyProfileInput,
  type QualificationInput,
  type InductionInput,
  type DevelopmentPlanInput,
} from "@/lib/engines/staff-development-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map staff ───────────────────────────────────────────────────────────
  const staff: StaffInput[] = (store.staff ?? []).map((s: any) => ({
    id: s.id,
    name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    role: s.job_title ?? s.role ?? "Staff",
    is_active: Boolean(s.is_active),
    start_date: s.start_date,
  }));

  // ── Map appraisals ────────────────────────────────────────────────────
  const appraisals: AppraisalInput[] = (store.appraisals ?? []).map((a: any) => ({
    id: a.id,
    staff_id: a.staff_id,
    appraisal_type: a.appraisal_type,
    appraisal_date: a.appraisal_date,
    status: a.status,
    overall_rating: a.overall_rating ?? undefined,
    competency_scores: a.competency_scores ?? {},
    signed_by_staff: Boolean(a.signed_by_staff),
    next_review_date: a.next_review_date ?? undefined,
  }));

  // ── Map competency profiles ───────────────────────────────────────────
  const competency_profiles: CompetencyProfileInput[] = (store.competencyProfiles ?? []).map((p: any) => ({
    id: p.id,
    staff_id: p.staff_id,
    current_stage: p.current_stage ?? "",
    target_stage: p.target_stage ?? undefined,
    overall_readiness_score: p.overall_readiness_score ?? 0,
    strengths: p.strengths ?? [],
    development_areas: p.development_areas ?? [],
    next_review_date: p.next_review_date ?? undefined,
  }));

  // ── Map qualifications ────────────────────────────────────────────────
  const qualifications: QualificationInput[] = (store.qualifications ?? []).map((q: any) => ({
    id: q.id,
    staff_id: q.staff_id,
    qualification_name: q.qualification_name,
    level: q.level ?? undefined,
    mandatory: Boolean(q.mandatory),
    status: q.status,
    started_at: q.started_at ?? undefined,
    completed_at: q.completed_at ?? undefined,
    expiry_date: q.expiry_date ?? undefined,
  }));

  // ── Map inductions ────────────────────────────────────────────────────
  const inductions: InductionInput[] = (store.inductionRecords ?? []).map((i: any) => {
    const items: any[] = i.items ?? [];
    const completedItems = items.filter((item: any) => item.status === "completed" || item.status === "signed_off").length;
    const overdueItems = items.filter((item: any) => item.status === "not_started" || item.status === "in_progress").length;
    return {
      id: i.id,
      staff_id: i.staff_id,
      start_date: i.start_date,
      target_completion_date: i.target_completion_date,
      overall_status: i.overall_status as InductionInput["overall_status"],
      total_items: items.length,
      completed_items: completedItems,
      overdue_items: overdueItems,
      probation_passed: Boolean(i.probation_passed),
    };
  });

  // ── Map development plans ─────────────────────────────────────────────
  const development_plans: DevelopmentPlanInput[] = (store.developmentPlans ?? []).map((dp: any) => {
    const actions: any[] = dp.actions ?? [];
    return {
      id: dp.id,
      staff_id: dp.staff_id,
      title: dp.title,
      from_stage: dp.from_stage ?? "",
      to_stage: dp.to_stage ?? "",
      status: dp.status as DevelopmentPlanInput["status"],
      total_actions: actions.length,
      completed_actions: actions.filter((a: any) => a.completed).length,
    };
  });

  // ── Run engine ────────────────────────────────────────────────────────
  const result = computeStaffDevelopmentIntelligence({
    staff,
    appraisals,
    competency_profiles,
    qualifications,
    inductions,
    development_plans,
  });

  return NextResponse.json({ data: result });
}
