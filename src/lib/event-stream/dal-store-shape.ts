import { dal } from "@/lib/db";

/**
 * Assembles the store-shaped slice the event-stream mappers read — the 19
 * collections `mapStoreToEventInput` projects, plus `cornerstoneEvents` for
 * `buildLiveEventStream` — from the dual-mode dal (demo → in-memory; live →
 * Postgres / empty until tables land).
 *
 * Lets event-stream routes drop raw `getStore()` without touching the pure
 * mappers, which just read `.X ?? []` off whatever object they're handed.
 */
export async function loadEventStoreShape() {
  const [
    appointments, audits, behaviourSupportPlans, complaints, dailyLog,
    educationRecords, incidents, keyWorkingSessions, lacReviews, leaveRequests,
    maintenance, medicationErrors, missingEpisodes, notifiableEvents,
    reg44VisitReports, restraints, riskAssessments, shifts, supervisions,
    cornerstoneEvents,
  ] = await Promise.all([
    dal.appointments.findAll(), dal.audits.findAll(), dal.behaviourSupportPlans.findAll(),
    dal.complaints.findAll(), dal.dailyLog.findAll(), dal.educationRecords.findAll(),
    dal.incidents.findAll(), dal.keyWorkingSessions.findAll(), dal.lacReviews.findAll(),
    dal.leaveRequests.findAll(), dal.maintenance.findAll(), dal.medicationErrors.findAll(),
    dal.missingEpisodes.findAll(), dal.notifiableEvents.findAll(), dal.reg44VisitReports.findAll(),
    dal.restraints.findAll(), dal.riskAssessments.findAll(), dal.shifts.findAll(),
    dal.supervisions.findAll(), dal.cornerstoneEvents.findAll(),
  ]);
  return {
    appointments, audits, behaviourSupportPlans, complaints, dailyLog,
    educationRecords, incidents, keyWorkingSessions, lacReviews, leaveRequests,
    maintenance, medicationErrors, missingEpisodes, notifiableEvents,
    reg44VisitReports, restraints, riskAssessments, shifts, supervisions,
    cornerstoneEvents,
  };
}
