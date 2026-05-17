// ══════════════════════════════════════════════════════════════════════════════
// API: /api/regulatory — Reg 44/45 Compliance & Statutory Notifications
//
// Returns regulatory compliance status, Reg 44 report tracking, Reg 45
// review status, notification timeliness, and action point progress.
//
// CHR 2015 Reg 44 (independent person visits), Reg 45 (review of quality).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  evaluateRegulatoryCompliance,
  summarizeActionPoints,
  validateReg44Report,
  generateReg44Schedule,
  getNotificationTypeLabel,
  getReg44SectionLabel,
} from "@/lib/regulatory";
import type {
  Reg44Report,
  Reg45Review,
  StatutoryNotification,
  ActionPoint,
  Reg44SectionEntry,
} from "@/lib/regulatory";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const homeId = url.searchParams.get("homeId") ?? "home-oak";
    const view = url.searchParams.get("view") ?? "overview";
    const year = parseInt(url.searchParams.get("year") ?? "2026");

    const sb = createServerClient();

    if (sb && isSupabaseEnabled()) {
      return await handleLiveData(sb, homeId, view, year);
    }

    return NextResponse.json(getDemoData(homeId, view, year));
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Live Data ──────────────────────────────────────────────────────────────

async function handleLiveData(sb: any, homeId: string, view: string, year: number) {
  const [reportsRes, reviewsRes, notificationsRes] = await Promise.all([
    (sb.from("reg44_reports") as SB).select("*").eq("home_id", homeId),
    (sb.from("reg45_reviews") as SB).select("*").eq("home_id", homeId),
    (sb.from("statutory_notifications") as SB).select("*").eq("home_id", homeId),
  ]);

  if (reportsRes.error) throw reportsRes.error;
  if (reviewsRes.error) throw reviewsRes.error;
  if (notificationsRes.error) throw notificationsRes.error;

  const reports: Reg44Report[] = reportsRes.data ?? [];
  const reviews: Reg45Review[] = reviewsRes.data ?? [];
  const notifications: StatutoryNotification[] = notificationsRes.data ?? [];

  const now = new Date().toISOString();

  if (view === "compliance") {
    const compliance = evaluateRegulatoryCompliance(reports, reviews, notifications, homeId, now);
    return NextResponse.json({ compliance });
  }

  if (view === "actions") {
    const actionSummary = summarizeActionPoints(reports, now);
    return NextResponse.json({ actionSummary });
  }

  // Overview
  const compliance = evaluateRegulatoryCompliance(reports, reviews, notifications, homeId, now);
  const actionSummary = summarizeActionPoints(reports, now);

  return NextResponse.json({
    compliance,
    actionSummary,
    recentReports: reports.slice(0, 6),
    recentNotifications: notifications.slice(0, 10),
  });
}

// ── Demo Data ──────────────────────────────────────────────────────────────

function getDemoData(homeId: string, view: string, year: number) {
  const now = new Date().toISOString();

  const demoReports: Reg44Report[] = [
    makeDemoReg44("2026-05", "2026-05-10T10:00:00Z", "published", false, "good"),
    makeDemoReg44("2026-04", "2026-04-08T10:00:00Z", "published", false, "good"),
    makeDemoReg44("2026-03", "2026-03-12T10:00:00Z", "published", true, "good"),
    makeDemoReg44("2026-02", "2026-02-11T10:00:00Z", "published", false, "requires_improvement"),
    makeDemoReg44("2026-01", "2026-01-14T10:00:00Z", "published", false, "good"),
  ];

  const demoReviews: Reg45Review[] = [
    {
      id: "reg45-2025h2",
      homeId,
      reviewPeriod: "2025-H2",
      reviewedBy: "user-ri-1",
      reviewerRole: "responsible_individual",
      status: "published",
      dueDate: "2026-01-31T00:00:00Z",
      submittedAt: "2026-01-28T14:00:00Z",
      schedule4Findings: [
        { matter: "child_progress", finding: "All children making good progress against care plans.", trend: "improving", dataPoints: 12, concern: false },
        { matter: "staffing_issues", finding: "One vacancy filled in Q4. Agency usage reduced.", trend: "improving", dataPoints: 6, concern: false },
        { matter: "restraint_use", finding: "3 incidents in period, all reviewed and justified.", trend: "stable", dataPoints: 3, concern: false },
        { matter: "missing_episodes", finding: "2 missing episodes. Both return interviews completed within 72h.", trend: "stable", dataPoints: 2, concern: false },
        { matter: "complaints", finding: "1 complaint received and resolved within timescale.", trend: "stable", dataPoints: 1, concern: false },
      ],
      qualityRating: "good",
      improvementActions: [
        { id: "r45-ap-1", description: "Increase therapeutic offer for identified children.", priority: "high" as const, assignedTo: "user-rm-1", dueDate: "2026-03-31T00:00:00Z", status: "completed" as const, completedAt: "2026-03-20T10:00:00Z" },
        { id: "r45-ap-2", description: "Develop independence skills programme.", priority: "medium" as const, assignedTo: "user-tl-1", dueDate: "2026-06-30T00:00:00Z", status: "in_progress" as const },
      ],
      developmentPlan: [
        "Expand therapeutic interventions (EMDR referral)",
        "Develop life skills and independence programme",
        "Strengthen multi-agency working",
        "Progress staff qualifications (2 staff targeting Level 4)",
      ],
      sentToOfsted: true,
      sentToOfstedAt: "2026-02-01T10:00:00Z",
    },
  ];

  const demoNotifications: StatutoryNotification[] = [
    {
      id: "notif-001",
      homeId,
      type: "absconding",
      incidentDate: "2026-05-02T22:00:00Z",
      reportedAt: "2026-05-03T08:30:00Z",
      reportedBy: "user-tl-1",
      sentToOfsted: true,
      sentToOfstedAt: "2026-05-03T09:00:00Z",
      sentToLA: true,
      sentToLAAt: "2026-05-03T09:15:00Z",
      dueBy: "2026-05-03T22:00:00Z",
      isOverdue: false,
      summary: "YP left without permission. Located and returned by police within 2 hours.",
      childId: "child-jordan",
    },
    {
      id: "notif-002",
      homeId,
      type: "allegation_against_staff",
      incidentDate: "2026-04-15T14:00:00Z",
      reportedAt: "2026-04-15T15:30:00Z",
      reportedBy: "user-rm-1",
      sentToOfsted: true,
      sentToOfstedAt: "2026-04-15T16:00:00Z",
      sentToLA: true,
      sentToLAAt: "2026-04-15T16:00:00Z",
      dueBy: "2026-04-15T14:00:00Z",
      isOverdue: true, // "without delay" technically breached
      summary: "Allegation made by YP regarding staff member. LADO referral made immediately.",
      staffId: "staff-xyz",
    },
    {
      id: "notif-003",
      homeId,
      type: "serious_incident",
      incidentDate: "2026-03-20T18:00:00Z",
      reportedAt: "2026-03-21T08:00:00Z",
      reportedBy: "user-tl-1",
      sentToOfsted: true,
      sentToOfstedAt: "2026-03-21T09:00:00Z",
      sentToLA: true,
      sentToLAAt: "2026-03-21T09:00:00Z",
      dueBy: "2026-03-21T18:00:00Z",
      isOverdue: false,
      summary: "Significant damage to property during dysregulated episode. No injuries.",
      childId: "child-jordan",
    },
  ];

  if (view === "compliance") {
    const compliance = evaluateRegulatoryCompliance(demoReports, demoReviews, demoNotifications, homeId, now);
    return { compliance };
  }

  if (view === "actions") {
    const actionSummary = summarizeActionPoints(demoReports, now);
    return { actionSummary };
  }

  if (view === "schedule") {
    const schedule = generateReg44Schedule(homeId, year, "visitor-001", "Margaret Wilson");
    return { schedule };
  }

  // Default overview
  const compliance = evaluateRegulatoryCompliance(demoReports, demoReviews, demoNotifications, homeId, now);
  const actionSummary = summarizeActionPoints(demoReports, now);

  return {
    compliance,
    actionSummary,
    recentReports: demoReports,
    latestReview: demoReviews[0],
    notifications: demoNotifications,
    schedule: generateReg44Schedule(homeId, year, "visitor-001", "Margaret Wilson"),
  };
}

// ── Demo Helpers ──────────────────────────────────────────────────────────

function makeDemoReg44(
  month: string,
  visitDate: string,
  status: "published" | "submitted" | "overdue",
  announced: boolean,
  judgement: "outstanding" | "good" | "requires_improvement" | "inadequate",
): Reg44Report {
  const dueDate = new Date(new Date(visitDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const submittedAt = new Date(new Date(visitDate).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const sections: Reg44SectionEntry[] = [
    { section: "children_views", findings: "Children report feeling safe and well cared for.", rating: "strength", evidenceNotes: "Individual conversations with all 4 children." },
    { section: "practice_standards", findings: "Good standards of practice observed.", rating: "adequate", evidenceNotes: "Reviewed daily records and observed interactions." },
    { section: "staffing", findings: "Adequate staffing. One vacancy being recruited.", rating: "adequate", evidenceNotes: "Rota review and staff interviews." },
    { section: "safeguarding", findings: "Robust safeguarding practice.", rating: "strength", evidenceNotes: "Reviewed referrals and chronologies." },
    { section: "environment", findings: "Home is clean, well-maintained and homely.", rating: "adequate", evidenceNotes: "Full premises check completed." },
    { section: "health", findings: "Health needs being met. All appointments attended.", rating: "adequate", evidenceNotes: "Health tracker and appointment records." },
    { section: "education", findings: "All children in education. Good progress.", rating: "strength", evidenceNotes: "PEP reviews and school reports." },
    { section: "records", findings: "Records are comprehensive and up to date.", rating: "adequate", evidenceNotes: "Sampled daily logs, care plans, risk assessments." },
    { section: "complaints", findings: "No complaints in period.", rating: "adequate", evidenceNotes: "Complaints log reviewed." },
    { section: "previous_actions", findings: "All previous actions progressed or completed.", rating: "adequate", evidenceNotes: "Action tracker reviewed." },
    { section: "overall_judgement", findings: `The home continues to provide ${judgement} care.`, rating: judgement === "good" ? "adequate" : "concern", evidenceNotes: "Overall assessment." },
  ];

  const actionPoints: ActionPoint[] = month === "2026-02" ? [
    { id: `ap-${month}-1`, description: "Update fire evacuation plan to reflect new staff.", priority: "high", assignedTo: "user-rm-1", dueDate: "2026-03-15T00:00:00Z", status: "completed", completedAt: "2026-03-10T10:00:00Z" },
    { id: `ap-${month}-2`, description: "Ensure all staff complete online safety refresher.", priority: "medium", assignedTo: "user-tl-1", dueDate: "2026-04-01T00:00:00Z", status: "completed", completedAt: "2026-03-28T10:00:00Z" },
  ] : [
    { id: `ap-${month}-1`, description: "Continue to monitor new staff member's induction.", priority: "low", assignedTo: "user-tl-1", dueDate: "2026-06-30T00:00:00Z", status: "open" },
  ];

  return {
    id: `reg44-home-oak-${month}`,
    homeId: "home-oak",
    visitDate,
    visitorId: "visitor-001",
    visitorName: "Margaret Wilson",
    status,
    reportMonth: month,
    dueDate,
    submittedAt: status !== "overdue" ? submittedAt : undefined,
    sections,
    actionPoints,
    overallJudgement: judgement,
    childrenSpokenTo: 3,
    staffSpokenTo: 4,
    announced,
  };
}
