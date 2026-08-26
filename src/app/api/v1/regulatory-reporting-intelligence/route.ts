// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATORY REPORTING INTELLIGENCE API ROUTE
// GET /api/v1/regulatory-reporting-intelligence
// Returns Reg 44 visit schedule compliance, Reg 45 quality of care review
// status, Reg 40 statutory notification compliance, recommendation tracking,
// and overall regulatory compliance score.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import {
  computeRegulatoryReportingIntelligence,
  type Reg44ReportInput,
  type Reg45ReportInput,
  type NotificationInput,
  type StaffRef,
} from "@/lib/engines/regulatory-reporting-intelligence-engine";

export async function GET() {
  const [notifiableEventsList, qualityOfCareReviewsList, reg44VisitReportsList, staffList] = await Promise.all([
      dal.notifiableEvents.findAll(),
      dal.qualityOfCareReviews.findAll(),
      dal.reg44VisitReports.findAll(),
      dal.staff.findAll(),
    ]);

  // ── Map Reg 44 visit reports ────────────────────────────────────────────────
  const reg44Reports: Reg44ReportInput[] = (reg44VisitReportsList ?? []).map((r: any) => {
    const recommendations = r.recommendations ?? [];
    const completedCount = recommendations.filter(
      (rec: any) => rec.status === "completed"
    ).length;

    // Determine status from the report
    const hasSubmittedDate = !!r.report_sent_date;
    const status = hasSubmittedDate ? "completed" : "in_progress";

    // Parse overall judgement to rating
    const judgement = (r.overall_judgement ?? "").toLowerCase();
    let overallRating = "satisfactory";
    if (judgement.includes("good") || judgement.includes("notable")) {
      overallRating = "good";
    } else if (judgement.includes("requires improvement") || judgement.includes("requires_improvement")) {
      overallRating = "requires_improvement";
    }

    // Next visit due — assume 30 days after visit date if not explicitly stored
    const visitDate = new Date(r.visit_date + "T00:00:00Z");
    const nextDue = new Date(visitDate.getTime() + 30 * 86_400_000);
    const nextVisitDue = nextDue.toISOString().slice(0, 10);

    return {
      id: r.id,
      visit_date: r.visit_date,
      visitor_name: r.visitor ?? "Unknown",
      status,
      submitted_date: r.report_sent_date ?? null,
      recommendations_count: recommendations.length,
      recommendations_completed: completedCount,
      overall_rating: overallRating,
      next_visit_due: nextVisitDue,
    };
  });

  // ── Map Reg 45 / Quality of Care Reviews ────────────────────────────────────
  // A QualityOfCareReview record IS a completed Reg 45 review — it only exists
  // once the review happened (date, lead reviewer, rating, domains). The old
  // phantom `r.status` read meant no report ever counted as completed, so every
  // review on file registered as a not-started deficiency. Its `actions` are
  // follow-ups FROM the completed review, not report-writing progress.
  const reg45Reports: Reg45ReportInput[] = (qualityOfCareReviewsList ?? []).map((r: any) => ({
    id: r.id,
    period_start: r.date ?? "",
    period_end: r.next_review_date ?? "",
    author: r.lead_reviewer ?? "",
    status: "completed",
    submitted_date: r.date ?? null,
    next_due: r.next_review_date ?? "",
    progress_percentage: 100,
  }));

  // ── Map Notifiable Events ───────────────────────────────────────────────────
  const notifications: NotificationInput[] = (notifiableEventsList ?? []).map((r: any) => {
    const ofstedStatus = r.ofsted_status ?? "pending";
    const notifiedDate = r.ofsted?.notified_date ?? null;
    const notifiedWithin24h = ofstedStatus === "notified_within_24h";

    // Map store status to engine status
    let status: string;
    if (ofstedStatus === "notified_within_24h" || ofstedStatus === "notified_late") {
      status = "notified";
    } else if (ofstedStatus === "pending") {
      status = "pending";
    } else {
      status = "notified";
    }

    return {
      id: r.id,
      event_type: r.event_type ?? "other",
      event_date: r.date ?? "",
      notified_date: notifiedDate,
      notified_within_24h: notifiedWithin24h,
      ofsted_reference: r.ofsted?.reference ?? "",
      status,
    };
  });

  // ── Map Staff ───────────────────────────────────────────────────────────────
  const staff: StaffRef[] = (staffList ?? []).map((s: any) => ({
    id: s.id,
    name: s.name ?? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
  }));

  // ── Run engine ──────────────────────────────────────────────────────────────
  const result = computeRegulatoryReportingIntelligence({
    reg44Reports,
    reg45Reports,
    notifications,
    staff,
  });

  return NextResponse.json({ data: result });
}
