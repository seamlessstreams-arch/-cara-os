import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import type { AppraisalRecord, AppraisalRating, CompetencyDomain, ALL_COMPETENCY_DOMAINS } from "@/types/extended";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staff_id");
  const status = searchParams.get("status");

  let results = db.appraisals.findAll();
  if (staffId) results = db.appraisals.findByStaff(staffId);
  if (status) results = results.filter((a) => a.status === status);

  const sorted = results.sort((a, b) => b.appraisal_date.localeCompare(a.appraisal_date));

  const completed = results.filter((a) => a.status === "completed");
  const overdue   = results.filter((a) => a.status === "overdue");
  const scheduled = results.filter((a) => a.status === "scheduled");

  // Rating distribution (completed only)
  const ratingCounts: Record<string, number> = { outstanding: 0, good: 0, requires_improvement: 0, inadequate: 0 };
  completed.forEach((a) => {
    if (a.overall_rating) ratingCounts[a.overall_rating] = (ratingCounts[a.overall_rating] ?? 0) + 1;
  });

  // Team average competency scores
  const domainTotals: Record<string, { sum: number; count: number }> = {};
  completed.forEach((a) => {
    Object.entries(a.competency_scores).forEach(([domain, score]) => {
      if (typeof score === "number" && score > 0) {
        if (!domainTotals[domain]) domainTotals[domain] = { sum: 0, count: 0 };
        domainTotals[domain].sum += score;
        domainTotals[domain].count++;
      }
    });
  });
  const teamAvgScores: Record<string, number> = {};
  Object.entries(domainTotals).forEach(([domain, { sum, count }]) => {
    teamAvgScores[domain] = Math.round((sum / count) * 10) / 10;
  });

  // Per-staff summary
  const staffIds = [...new Set(results.map((a) => a.staff_id))];
  const perStaff = staffIds.map((sid) => {
    const staffAppraisals = results.filter((a) => a.staff_id === sid);
    const lastCompleted = staffAppraisals.find((a) => a.status === "completed");
    const nextScheduled = staffAppraisals.find((a) => a.status === "scheduled");
    const hasOverdue    = staffAppraisals.some((a) => a.status === "overdue");
    return {
      staff_id: sid,
      total: staffAppraisals.length,
      last_completed_date: lastCompleted?.appraisal_date ?? null,
      last_rating: lastCompleted?.overall_rating ?? null,
      next_scheduled: nextScheduled?.appraisal_date ?? null,
      next_review_date: lastCompleted?.next_review_date ?? null,
      has_overdue: hasOverdue,
    };
  });

  return NextResponse.json({
    data: sorted,
    meta: {
      total: results.length,
      overdue: overdue.length,
      completed: completed.length,
      scheduled: scheduled.length,
      in_progress: results.filter((a) => a.status === "in_progress").length,
      rating_counts: ratingCounts,
      team_avg_scores: teamAvgScores,
      per_staff: perStaff,
    },
  });
}

export async function POST(req: NextRequest) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const appraisal = db.appraisals.create({
    ...body,
    home_id: body.home_id ?? "home_oak",
    status: body.status ?? "scheduled",
    competency_scores: body.competency_scores ?? {},
    signed_by_staff: false,
    created_by: body.created_by ?? "staff_darren",
  });
  return NextResponse.json({ data: appraisal }, { status: 201 });
}
