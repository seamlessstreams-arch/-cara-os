import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";

export async function GET(_req: NextRequest) {
  const today = todayStr();

  const activeTasks = db.tasks.findActive();
  const overdueTasks = db.tasks.findOverdue();
  const incidents = db.incidents.findAll();
  const openIncidents = db.incidents.findOpen();
  const awaitingOversight = db.incidents.findNeedingOversight();
  const todayShifts = db.shifts.findToday();
  const openShifts = db.shifts.findOpen();
  const onLeave = db.leave.findOnLeaveToday();
  const expiredTraining = db.training.findExpired();
  const expiringSoon = db.training.findExpiringSoon();
  const medExceptions = db.medicationAdministrations.findExceptions();
  const scheduledMeds = db.medicationAdministrations.findScheduled();
  const stockAlerts = db.medications.findActive().filter((m) => m.stock_count !== null && m.stock_count < 10);
  const missingEpisodes = db.missingEpisodes.findActive();
  const buildingDue = db.buildingChecks.findDue();
  const buildingOverdue = db.buildingChecks.findOverdue();
  const vehicleDefects = db.vehicleChecks.findDefects();
  const pendingLeave = db.leave.findPending();
  const vehicles = db.vehicles.findAll();

  // Certificate expiry checks
  const buildings = db.buildings.findAll();
  const certWarnings: string[] = [];
  buildings.forEach((b) => {
    if (b.gas_cert_expiry && b.gas_cert_expiry <= todayStr()) certWarnings.push("Gas safety certificate expired");
    if (b.electrical_cert_expiry && b.electrical_cert_expiry <= todayStr()) certWarnings.push("Electrical certificate expired");
  });
  vehicles.forEach((v) => {
    const inMonth = new Date();
    inMonth.setDate(inMonth.getDate() + 30);
    const inMonthStr = inMonth.toISOString().slice(0, 10);
    if (v.mot_expiry && v.mot_expiry <= inMonthStr) certWarnings.push(`MOT expiring — ${v.registration}`);
    if (v.insurance_expiry && v.insurance_expiry <= inMonthStr) certWarnings.push(`Insurance expiring — ${v.registration}`);
  });

  // Supervision overdue
  const supervisionsOverdue = db.staff.findActive().filter(
    (s) => s.next_supervision_due && s.next_supervision_due < today
  );

  // Today's medication schedule status
  const todayMedSchedule = scheduledMeds.filter((a) => a.scheduled_time.startsWith(today));
  const missedMedsToday = medExceptions.filter((a) => a.scheduled_time.startsWith(today));

  return NextResponse.json({
    data: {
      tasks: {
        active: activeTasks.length,
        overdue: overdueTasks.length,
        due_today: activeTasks.filter((t) => t.due_date === today).length,
        urgent: activeTasks.filter((t) => t.priority === "urgent").length,
        my_tasks: activeTasks.filter((t) => t.assigned_to === "staff_darren").length,
        awaiting_sign_off: db.tasks.findAll().filter((t) => t.requires_sign_off && !t.signed_off_by && t.status === "completed").length,
        completed_today: db.tasks.findAll().filter((t) => t.status === "completed" && t.completed_at?.startsWith(today)).length,
        priority_queue: overdueTasks.concat(activeTasks.filter((t) => t.priority === "urgent" && !overdueTasks.includes(t))).slice(0, 10),
      },
      incidents: {
        open: openIncidents.length,
        awaiting_oversight: awaitingOversight.length,
        critical: openIncidents.filter((i) => i.severity === "critical").length,
        this_week: incidents.filter((i) => {
          const d = new Date(i.date);
          const week = new Date();
          week.setDate(week.getDate() - 7);
          return d >= week;
        }).length,
        list: openIncidents.slice(0, 5),
        oversight_queue: awaitingOversight,
      },
      safeguarding: {
        missing_active: missingEpisodes.length,
        missing_episodes: db.missingEpisodes.findAll().slice(-5),
        contextual_risk: db.missingEpisodes.findAll().filter((m) => m.contextual_safeguarding_risk).length,
        high_risk_yp: db.youngPeople.findCurrent().filter((yp) => yp.risk_flags.length > 0),
      },
      staffing: {
        on_shift: todayShifts.filter((s) => !s.is_open_shift).length,
        open_shifts: openShifts.length,
        on_leave: onLeave.length,
        pending_leave_requests: pendingLeave.length,
        supervision_overdue: supervisionsOverdue.length,
        today_shifts: todayShifts,
      },
      medication: {
        exceptions_this_week: medExceptions.length,
        missed_today: missedMedsToday.length,
        scheduled_today: todayMedSchedule.length,
        stock_alerts: stockAlerts.length,
        oversight_needed: medExceptions.filter((a) => a.status === "refused" || a.status === "missed").length,
      },
      compliance: {
        training_expired: expiredTraining.length,
        training_expiring: expiringSoon.length,
        cert_warnings: certWarnings.length,
        cert_warnings_list: certWarnings,
      },
      environment: {
        building_checks_due: buildingDue.length,
        building_checks_overdue: buildingOverdue.length,
        vehicle_defects: vehicleDefects.length,
        vehicles_restricted: vehicles.filter((v) => v.status === "restricted").length,
      },
      young_people: {
        current: db.youngPeople.findCurrent(),
        missing_episodes_total: db.missingEpisodes.findAll().length,
      },
    },
  });
}
