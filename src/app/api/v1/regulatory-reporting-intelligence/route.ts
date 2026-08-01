// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATORY REPORTING INTELLIGENCE API ROUTE
// GET /api/v1/regulatory-reporting-intelligence
// Returns Reg 44 visit schedule compliance, Reg 45 quality of care review
// status, Reg 40 statutory notification compliance, recommendation tracking,
// and overall regulatory compliance score.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeRegulatoryReportingIntelligence,
  type Reg44ReportInput,
  type Reg45ReportInput,
  type NotificationInput,
  type StaffRef,
} from "@/lib/engines/regulatory-reporting-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map Reg 44 visit reports ────────────────────────────────────────────────
  const reg44Reports: Reg44ReportInput[] = (store.reg44VisitReports ?? []).map((r: any) => {
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
  const reg45Reports: Reg45ReportInput[] = (store.qualityOfCareReviews ?? []).map((r: any) => {
    // Determine status
    const status = r.status ?? (r.actions?.length > 0 ? "in_progress" : "not_started");

    // Next review date
    const nextDue = r.next_review_date ?? "";

    // Progress — estimate from completed actions if available
    const actions = r.actions ?? [];
    const completedActions = actions.filter((a: any) => a.status === "completed").length;
    const progress = actions.length > 0 ? Math.round((completedActions / actions.length) * 100) : null;

    return {
      id: r.id,
      period_start: r.date ?? "",
      period_end: r.next_review_date ?? "",
      author: r.lead_reviewer ?? "",
      status: status === "completed" ? "completed" : status === "in_progress" ? "in_progress" : "not_started",
      submitted_date: status === "completed" ? r.date : null,
      next_due: nextDue,
      progress_percentage: status === "completed" ? 100 : progress,
    };
  });

  // ── Map Notifiable Events ───────────────────────────────────────────────────
  const notifications: NotificationInput[] = (store.notifiableEvents ?? []).map((r: any) => {
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
  const staff: StaffRef[] = (store.staff ?? []).map((s: any) => ({
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
