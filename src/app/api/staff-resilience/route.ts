// ══════════════════════════════════════════════════════════════════════════════
// API: /api/staff-resilience — Staff Resilience Intelligence
//
// GET  — returns Oak House demo resilience intelligence
// POST — accepts custom data with validation
//
// CHR 2015 Reg 32 — Fitness of workers
// CHR 2015 Reg 33 — Employment of staff
// ACAS Guidance — Managing attendance and wellbeing
// Health & Safety at Work Act 1974 — Employer duty of care
// SCCIF — Leadership and Management
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generateStaffResilienceIntelligence } from "@/lib/staff-resilience";
import type {
  StaffAbsenceRecord,
  SupportAccessRecord,
  SupervisionRecord,
  TeamHealthCheck,
  SecondaryTraumaScreen,
} from "@/lib/staff-resilience";

// ── GET Handler ───────────────────────────────────────────────────────────

export async function GET() {
  const now = new Date().toISOString();
  const periodStart = "2026-01-01T00:00:00Z";
  const periodEnd = now;

  const { absences, supports, supervisions, teamHealthChecks, screens, staffIds, staffNames } = getOakHouseDemoData();

  const result = generateStaffResilienceIntelligence(
    absences, supports, supervisions, teamHealthChecks, screens,
    staffIds, staffNames, "home-oak", periodStart, periodEnd, now,
  );

  return NextResponse.json(result);
}

// ── POST Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    absences,
    supports,
    supervisions,
    teamHealthChecks,
    screens,
    staffIds,
    staffNames,
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
  } = body;

  if (!staffIds || !Array.isArray(staffIds)) {
    return NextResponse.json({ error: "staffIds (array) is required" }, { status: 400 });
  }
  if (!staffNames || typeof staffNames !== "object") {
    return NextResponse.json({ error: "staffNames (object) is required" }, { status: 400 });
  }
  if (!homeId || typeof homeId !== "string") {
    return NextResponse.json({ error: "homeId (string) is required" }, { status: 400 });
  }
  if (!periodStart || typeof periodStart !== "string") {
    return NextResponse.json({ error: "periodStart (ISO string) is required" }, { status: 400 });
  }
  if (!periodEnd || typeof periodEnd !== "string") {
    return NextResponse.json({ error: "periodEnd (ISO string) is required" }, { status: 400 });
  }

  const result = generateStaffResilienceIntelligence(
    (absences as StaffAbsenceRecord[]) ?? [],
    (supports as SupportAccessRecord[]) ?? [],
    (supervisions as SupervisionRecord[]) ?? [],
    (teamHealthChecks as TeamHealthCheck[]) ?? [],
    (screens as SecondaryTraumaScreen[]) ?? [],
    staffIds as string[],
    staffNames as Record<string, string>,
    homeId as string,
    periodStart as string,
    periodEnd as string,
    (referenceDate as string) ?? new Date().toISOString(),
  );

  return NextResponse.json(result);
}

// ── Oak House Demo Data ──────────────────────────────────────────────────

function getOakHouseDemoData() {
  const staffIds = ["staff-sarah", "staff-tom", "staff-lisa", "staff-darren"];
  const staffNames: Record<string, string> = {
    "staff-sarah": "Sarah Johnson",
    "staff-tom": "Tom Richards",
    "staff-lisa": "Lisa Williams",
    "staff-darren": "Darren Laville",
  };

  const absences: StaffAbsenceRecord[] = [
    // Sarah — minimal: annual leave only
    { id: "abs-1", staffId: "staff-sarah", staffName: "Sarah Johnson", startDate: "2026-02-10T00:00:00Z", endDate: "2026-02-14T00:00:00Z", reason: "annual_leave", returnToWorkCompleted: false },
    // Tom — stress-related absence + sickness
    { id: "abs-2", staffId: "staff-tom", staffName: "Tom Richards", startDate: "2026-03-01T00:00:00Z", endDate: "2026-03-05T00:00:00Z", reason: "stress", returnToWorkCompleted: true, adjustmentsMade: "Reduced caseload for 2 weeks" },
    { id: "abs-3", staffId: "staff-tom", staffName: "Tom Richards", startDate: "2026-04-10T00:00:00Z", endDate: "2026-04-12T00:00:00Z", reason: "sickness", returnToWorkCompleted: true },
    // Lisa — good attendance: compassionate leave
    { id: "abs-4", staffId: "staff-lisa", staffName: "Lisa Williams", startDate: "2026-03-20T00:00:00Z", endDate: "2026-03-21T00:00:00Z", reason: "compassionate", returnToWorkCompleted: true },
    // Darren — training
    { id: "abs-5", staffId: "staff-darren", staffName: "Darren Laville", startDate: "2026-04-01T00:00:00Z", endDate: "2026-04-03T00:00:00Z", reason: "training", returnToWorkCompleted: false },
  ];

  const supports: SupportAccessRecord[] = [
    { id: "sup-1", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-02-01T10:00:00Z", supportType: "clinical_supervision", accessedVoluntarily: true, followUpPlanned: true, satisfactionRating: 4 },
    { id: "sup-2", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-03-15T10:00:00Z", supportType: "peer_support", accessedVoluntarily: true, followUpPlanned: false, satisfactionRating: 5 },
    { id: "sup-3", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-03-06T10:00:00Z", supportType: "EAP", accessedVoluntarily: false, followUpPlanned: true, satisfactionRating: 3 },
    { id: "sup-4", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-03-15T10:00:00Z", supportType: "debriefing", accessedVoluntarily: true, followUpPlanned: true, satisfactionRating: 4 },
    { id: "sup-5", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-02-20T10:00:00Z", supportType: "reflective_group", accessedVoluntarily: true, followUpPlanned: false, satisfactionRating: 4 },
    { id: "sup-6", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-04-05T10:00:00Z", supportType: "wellness_check", accessedVoluntarily: true, followUpPlanned: true, satisfactionRating: 5 },
    { id: "sup-7", staffId: "staff-darren", staffName: "Darren Laville", date: "2026-01-20T10:00:00Z", supportType: "one_to_one_supervision", accessedVoluntarily: true, followUpPlanned: true, satisfactionRating: 4 },
    { id: "sup-8", staffId: "staff-darren", staffName: "Darren Laville", date: "2026-04-15T10:00:00Z", supportType: "team_day", accessedVoluntarily: true, followUpPlanned: false, satisfactionRating: 5 },
  ];

  const supervisions: SupervisionRecord[] = [
    // Sarah — 5 monthly supervisions
    { id: "sv-1", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-01-15T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 3, actionPointsCompleted: 3, nextDueDate: "2026-02-15T10:00:00Z" },
    { id: "sv-2", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-02-14T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-03-14T10:00:00Z" },
    { id: "sv-3", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-03-14T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: false, actionPoints: 3, actionPointsCompleted: 2, nextDueDate: "2026-04-14T10:00:00Z" },
    { id: "sv-4", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-04-15T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-05-15T10:00:00Z" },
    { id: "sv-5", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-05-14T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: false, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 1, nextDueDate: "2026-06-14T10:00:00Z" },
    // Tom — 4 supervisions
    { id: "sv-6", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-01-20T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 3, actionPointsCompleted: 2, nextDueDate: "2026-02-20T10:00:00Z" },
    { id: "sv-7", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-02-18T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: false, actionPoints: 2, actionPointsCompleted: 1, nextDueDate: "2026-03-18T10:00:00Z" },
    { id: "sv-8", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-04-05T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: true, workloadDiscussed: false, developmentDiscussed: true, actionPoints: 3, actionPointsCompleted: 2, nextDueDate: "2026-05-05T10:00:00Z" },
    { id: "sv-9", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-05-10T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: false, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-06-10T10:00:00Z" },
    // Lisa — 5 supervisions
    { id: "sv-10", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-01-10T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-02-10T10:00:00Z" },
    { id: "sv-11", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-02-12T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 3, actionPointsCompleted: 3, nextDueDate: "2026-03-12T10:00:00Z" },
    { id: "sv-12", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-03-10T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-04-10T10:00:00Z" },
    { id: "sv-13", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-04-08T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: false, actionPoints: 3, actionPointsCompleted: 2, nextDueDate: "2026-05-08T10:00:00Z" },
    { id: "sv-14", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-05-06T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-06-06T10:00:00Z" },
    // Darren — 5 supervisions
    { id: "sv-15", staffId: "staff-darren", staffName: "Darren Laville", date: "2026-01-12T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 3, actionPointsCompleted: 3, nextDueDate: "2026-02-12T10:00:00Z" },
    { id: "sv-16", staffId: "staff-darren", staffName: "Darren Laville", date: "2026-02-10T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-03-10T10:00:00Z" },
    { id: "sv-17", staffId: "staff-darren", staffName: "Darren Laville", date: "2026-03-12T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-04-12T10:00:00Z" },
    { id: "sv-18", staffId: "staff-darren", staffName: "Darren Laville", date: "2026-04-10T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: false, actionPoints: 3, actionPointsCompleted: 2, nextDueDate: "2026-05-10T10:00:00Z" },
    { id: "sv-19", staffId: "staff-darren", staffName: "Darren Laville", date: "2026-05-08T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: false, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-06-08T10:00:00Z" },
  ];

  const teamHealthChecks: TeamHealthCheck[] = [
    { id: "thc-1", date: "2026-02-15T10:00:00Z", conductedBy: "Sarah Johnson", teamMorale: "good", workloadManageable: true, supportAdequate: true, communicationEffective: true, issuesRaised: ["Night shift cover stretched", "Need more training on de-escalation"], actionsAgreed: ["Recruit bank staff", "Book PRICE refresher"], actionsCompleted: true },
    { id: "thc-2", date: "2026-04-20T10:00:00Z", conductedBy: "Sarah Johnson", teamMorale: "high", workloadManageable: true, supportAdequate: true, communicationEffective: true, issuesRaised: ["Handover notes could be more detailed"], actionsAgreed: ["Update handover template", "Peer observation programme"], actionsCompleted: false },
  ];

  const screens: SecondaryTraumaScreen[] = [
    { id: "sts-1", staffId: "staff-sarah", staffName: "Sarah Johnson", screeningDate: "2026-03-01T10:00:00Z", screenedBy: "External Supervisor", indicatorsPresent: [], supportOffered: false, supportAccepted: false, actionPlan: false, reviewDate: "2026-09-01T10:00:00Z" },
    { id: "sts-2", staffId: "staff-tom", staffName: "Tom Richards", screeningDate: "2026-03-10T10:00:00Z", screenedBy: "Sarah Johnson", indicatorsPresent: ["emotional_exhaustion", "increased_sickness"], supportOffered: true, supportAccepted: true, actionPlan: true, reviewDate: "2026-06-10T10:00:00Z" },
    { id: "sts-3", staffId: "staff-lisa", staffName: "Lisa Williams", screeningDate: "2026-03-05T10:00:00Z", screenedBy: "Sarah Johnson", indicatorsPresent: ["reduced_engagement"], supportOffered: true, supportAccepted: false, actionPlan: false, reviewDate: "2026-06-05T10:00:00Z" },
    { id: "sts-4", staffId: "staff-darren", staffName: "Darren Laville", screeningDate: "2026-03-08T10:00:00Z", screenedBy: "External Supervisor", indicatorsPresent: [], supportOffered: false, supportAccepted: false, actionPlan: false, reviewDate: "2026-09-08T10:00:00Z" },
  ];

  return { absences, supports, supervisions, teamHealthChecks, screens, staffIds, staffNames };
}
