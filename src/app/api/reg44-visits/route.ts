// ══════════════════════════════════════════════════════════════════════════════
// Reg 44/45 Independent Visits — API Route
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  evaluateVisitCompliance,
  calculateHomeReg44Metrics,
} from "@/lib/reg44-visits";
import type { HomeReg44Profile, Reg44Visit } from "@/lib/reg44-visits";

// ── Demo Data ──────────────────────────────────────────────────────────────

function makeAreaAssessments(includeRI = false) {
  const base = [
    { area: "welfare_of_children" as const, rating: "good" as const, observations: "Children happy, settled, engaged in activities", evidenceReviewed: ["Daily logs", "Keywork records", "Children spoken to"] },
    { area: "safety" as const, rating: "good" as const, observations: "Home secure, fire equipment in date, risk assessments current", evidenceReviewed: ["Fire log", "Risk assessments", "Health & safety checks"] },
    { area: "staffing" as const, rating: "good" as const, observations: "Adequate levels, staff well-trained and supported", evidenceReviewed: ["Rota", "Supervision records", "Training matrix"] },
    { area: "environment" as const, rating: "good" as const, observations: "Clean, maintained, homely, age-appropriate", evidenceReviewed: ["Maintenance log", "Visual inspection"] },
    { area: "complaints_and_concerns" as const, rating: "good" as const, observations: "No open complaints, children know how to raise concerns", evidenceReviewed: ["Complaints log", "Children's guide"] },
    { area: "education" as const, rating: "good" as const, observations: "All children in education, attendance monitored", evidenceReviewed: ["PEPs", "Attendance data", "School reports"] },
    { area: "health" as const, rating: "good" as const, observations: "Health needs met, appointments attended", evidenceReviewed: ["Health assessments", "Medication records"] },
    { area: "contact_arrangements" as const, rating: "good" as const, observations: "Contact plans being followed appropriately", evidenceReviewed: ["Contact records", "Care plans"] },
    { area: "records_and_documentation" as const, rating: includeRI ? "requires_improvement" as const : "adequate" as const, observations: includeRI ? "Some gaps in daily logs, late entries noted" : "Records mostly up to date", evidenceReviewed: ["Daily logs", "Care plans", "LAC records"] },
    { area: "leadership_and_management" as const, rating: "good" as const, observations: "Strong leadership, reflective practice evident", evidenceReviewed: ["Team meeting minutes", "Development plan"] },
  ];
  return base;
}

const DEMO_PROFILE: HomeReg44Profile = {
  homeId: "home-oak",
  visits: [
    {
      id: "v44-001",
      homeId: "home-oak",
      visitDate: "2026-05-06T10:00:00Z",
      visitorName: "Margaret Thompson",
      visitorIndependent: true,
      visitDuration: 180,
      childrenSpokenTo: ["Alex", "Jordan", "Sam", "Casey"],
      childrenSpokenToPrivately: ["Alex", "Jordan", "Sam"],
      totalChildrenInHome: 4,
      areasAssessed: makeAreaAssessments(true),
      reportCompletedDate: "2026-05-08T14:00:00Z",
      reportSentToOfstedDate: "2026-05-09T10:00:00Z",
      reportSentToManagerDate: "2026-05-08T15:00:00Z",
      reportSentToRIDate: "2026-05-09T10:00:00Z",
      overallRating: "good",
      keyFindings: ["Home continues to provide good standard of care", "Strong staff-child relationships"],
      positiveObservations: ["Warm atmosphere", "Child-led menu planning observed", "Positive behaviour management"],
      areasForImprovement: ["Daily log consistency — some late entries noted"],
      actionsRaised: [
        { id: "a-001", visitId: "v44-001", description: "Implement daily log audit by shift lead", priority: "medium", assignedTo: "staff-rm-01", dueDate: "2026-05-20T10:00:00Z", status: "in_progress" },
      ],
      previousActionsReviewed: true,
    },
    {
      id: "v44-002",
      homeId: "home-oak",
      visitDate: "2026-04-10T10:00:00Z",
      visitorName: "Margaret Thompson",
      visitorIndependent: true,
      visitDuration: 150,
      childrenSpokenTo: ["Alex", "Jordan", "Sam", "Casey"],
      childrenSpokenToPrivately: ["Alex", "Sam", "Casey"],
      totalChildrenInHome: 4,
      areasAssessed: makeAreaAssessments(true),
      reportCompletedDate: "2026-04-12T14:00:00Z",
      reportSentToOfstedDate: "2026-04-14T10:00:00Z",
      reportSentToManagerDate: "2026-04-12T15:00:00Z",
      reportSentToRIDate: "2026-04-14T10:00:00Z",
      overallRating: "good",
      keyFindings: ["Positive placement stability", "Children participating in house decisions"],
      positiveObservations: ["Children's artwork displayed", "Regular house meetings evidenced"],
      areasForImprovement: ["Records timeliness", "Medication audit overdue"],
      actionsRaised: [
        { id: "a-002", visitId: "v44-002", description: "Complete medication audit", priority: "high", assignedTo: "staff-rm-01", dueDate: "2026-04-24T10:00:00Z", status: "completed", completedDate: "2026-04-20T10:00:00Z" },
        { id: "a-003", visitId: "v44-002", description: "Review daily log completion process", priority: "medium", assignedTo: "staff-rm-01", dueDate: "2026-04-30T10:00:00Z", status: "completed", completedDate: "2026-04-28T10:00:00Z" },
      ],
      previousActionsReviewed: true,
    },
    {
      id: "v44-003",
      homeId: "home-oak",
      visitDate: "2026-03-14T10:00:00Z",
      visitorName: "Margaret Thompson",
      visitorIndependent: true,
      visitDuration: 165,
      childrenSpokenTo: ["Alex", "Jordan", "Sam"],
      childrenSpokenToPrivately: ["Alex", "Jordan"],
      totalChildrenInHome: 4,
      areasAssessed: makeAreaAssessments(false),
      reportCompletedDate: "2026-03-17T14:00:00Z",
      reportSentToOfstedDate: "2026-03-18T10:00:00Z",
      reportSentToManagerDate: "2026-03-17T15:00:00Z",
      reportSentToRIDate: "2026-03-18T10:00:00Z",
      overallRating: "good",
      keyFindings: ["Home running well", "New child settling in"],
      positiveObservations: ["Transition support for new placement evident"],
      areasForImprovement: [],
      actionsRaised: [],
      previousActionsReviewed: true,
    },
    {
      id: "v44-004",
      homeId: "home-oak",
      visitDate: "2026-02-15T10:00:00Z",
      visitorName: "Margaret Thompson",
      visitorIndependent: true,
      visitDuration: 140,
      childrenSpokenTo: ["Alex", "Jordan", "Sam"],
      childrenSpokenToPrivately: ["Alex", "Jordan", "Sam"],
      totalChildrenInHome: 3,
      areasAssessed: makeAreaAssessments(false),
      reportCompletedDate: "2026-02-18T14:00:00Z",
      reportSentToOfstedDate: "2026-02-19T10:00:00Z",
      reportSentToManagerDate: "2026-02-18T15:00:00Z",
      reportSentToRIDate: "2026-02-19T10:00:00Z",
      overallRating: "good",
      keyFindings: ["Consistent good practice"],
      positiveObservations: ["Strong keyworker relationships", "Education attendance excellent"],
      areasForImprovement: [],
      actionsRaised: [],
      previousActionsReviewed: true,
    },
    {
      id: "v44-005",
      homeId: "home-oak",
      visitDate: "2026-01-20T10:00:00Z",
      visitorName: "Margaret Thompson",
      visitorIndependent: true,
      visitDuration: 160,
      childrenSpokenTo: ["Alex", "Jordan", "Sam"],
      childrenSpokenToPrivately: ["Jordan", "Sam"],
      totalChildrenInHome: 3,
      areasAssessed: makeAreaAssessments(false),
      reportCompletedDate: "2026-01-22T14:00:00Z",
      reportSentToOfstedDate: "2026-01-23T10:00:00Z",
      reportSentToManagerDate: "2026-01-22T15:00:00Z",
      reportSentToRIDate: "2026-01-23T10:00:00Z",
      overallRating: "good",
      keyFindings: ["Home continues to provide stable placements"],
      positiveObservations: ["Christmas celebrations inclusive and joyful"],
      areasForImprovement: [],
      actionsRaised: [],
      previousActionsReviewed: true,
    },
  ],
  currentVisitorName: "Margaret Thompson",
  visitorAppointedDate: "2024-06-01T10:00:00Z",
  visitorDBSDate: "2024-05-15T10:00:00Z",
  visitorTrainingDate: "2025-09-10T10:00:00Z",
};

// ── Handler ───────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") || "home-oak";
  const mode = searchParams.get("mode") || "dashboard";
  const visitId = searchParams.get("visitId");
  const now = new Date().toISOString();

  if (mode === "visit" && visitId) {
    const visit = DEMO_PROFILE.visits.find(v => v.id === visitId);
    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }
    const result = evaluateVisitCompliance(visit, now);
    return NextResponse.json(result);
  }

  if (mode === "metrics") {
    const metrics = calculateHomeReg44Metrics(DEMO_PROFILE, now);
    return NextResponse.json(metrics);
  }

  // Dashboard mode
  const metrics = calculateHomeReg44Metrics(DEMO_PROFILE, now);

  const recentVisits = DEMO_PROFILE.visits
    .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
    .slice(0, 4)
    .map(v => {
      const compliance = evaluateVisitCompliance(v, now);
      return {
        id: v.id,
        date: v.visitDate,
        overallRating: v.overallRating,
        isCompliant: compliance.isCompliant,
        childEngagement: compliance.childrenEngagementRate,
        actionsRaised: v.actionsRaised.length,
        duration: v.visitDuration,
      };
    });

  return NextResponse.json({
    metrics: {
      totalVisitsLast12Months: metrics.totalVisitsLast12Months,
      frequencyCompliant: metrics.frequencyCompliant,
      lastVisitDate: metrics.lastVisitDate,
      daysUntilNextDue: metrics.daysUntilNextDue,
      averageChildEngagement: metrics.averageChildEngagement,
      reportCompletionRate: metrics.reportCompletionRate,
      ofstedSubmissionRate: metrics.ofstedSubmissionRate,
      actionCompletionRate: metrics.actionCompletionRate,
      actionsOverdue: metrics.actionsOverdue,
      averageVisitDuration: metrics.averageVisitDuration,
    },
    recentVisits,
    overallRatingTrend: metrics.overallRatingTrend,
    recurringIssueAreas: metrics.recurringIssueAreas,
    areasNeverAssessed: metrics.areasNeverAssessed,
    complianceIssues: metrics.complianceIssues,
    visitorName: DEMO_PROFILE.currentVisitorName,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, visit, profile, now } = body;

  if (action === "evaluate" && visit) {
    const result = evaluateVisitCompliance(visit, now);
    return NextResponse.json(result);
  }

  if (action === "metrics" && profile) {
    const result = calculateHomeReg44Metrics(profile, now);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
