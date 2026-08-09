// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONFLICT DETECTION API ROUTE
// GET /api/v1/conflict-detection
//
// The complement to duplicate detection and the last automation safeguard:
// projects the store into the canonical event stream (plus the missing/leave
// intervals the projection summarises away) and surfaces records that DISAGREE —
// a care log written during a missing episode, an injury recorded then denied,
// the same event graded differently, a staff member working while on leave.
// Conflicts are flagged for human reconciliation and NEVER auto-resolved.
// Pure read-only; no external calls, no mutations.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { mapStoreToConflictInput } from "@/lib/conflict-detection/conflict-input-mapper";
import { computeConflictDetection } from "@/lib/conflict-detection/conflict-detection-engine";
import { todayStr } from "@/lib/utils";

export async function GET() {
  // Compose the exact 21 collections the conflict + event-stream mappers read
  // from the dual-mode dal (demo → in-memory; live → Postgres/empty), and hand
  // them to the pure mapper. The mapper is unchanged — it still reads `.X ?? []`
  // off the object — so no engine-signature refactor, and its tests are untouched.
  const [
    appointments, audits, behaviourSupportPlans, complaints, dailyLog,
    educationRecords, incidents, keyWorkingSessions, lacReviews, leaveRequests,
    maintenance, medicationErrors, missingEpisodes, notifiableEvents,
    reg44VisitReports, restraints, riskAssessments, shifts, supervisions,
    youngPeople, staff,
  ] = await Promise.all([
    dal.appointments.findAll(), dal.audits.findAll(), dal.behaviourSupportPlans.findAll(),
    dal.complaints.findAll(), dal.dailyLog.findAll(), dal.educationRecords.findAll(),
    dal.incidents.findAll(), dal.keyWorkingSessions.findAll(), dal.lacReviews.findAll(),
    dal.leaveRequests.findAll(), dal.maintenance.findAll(), dal.medicationErrors.findAll(),
    dal.missingEpisodes.findAll(), dal.notifiableEvents.findAll(), dal.reg44VisitReports.findAll(),
    dal.restraints.findAll(), dal.riskAssessments.findAll(), dal.shifts.findAll(),
    dal.supervisions.findAll(), dal.youngPeople.findAll(), dal.staff.findAll(),
  ]);
  const input = mapStoreToConflictInput({
    appointments, audits, behaviourSupportPlans, complaints, dailyLog,
    educationRecords, incidents, keyWorkingSessions, lacReviews, leaveRequests,
    maintenance, medicationErrors, missingEpisodes, notifiableEvents,
    reg44VisitReports, restraints, riskAssessments, shifts, supervisions,
    youngPeople, staff,
  });
  const result = computeConflictDetection({
    ...input,
    today: todayStr(),
  });
  return NextResponse.json({ data: result });
}
