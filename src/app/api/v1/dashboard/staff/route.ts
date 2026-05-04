import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";

// Staff dashboard — shift-level operational view
// ?staff_id=staff_edward  (defaults to staff_darren)

export async function GET(req: NextRequest) {
  const staffId = req.nextUrl.searchParams.get("staff_id") ?? "staff_darren";
  const today = todayStr();

  const staff = db.staff.findActive().find((s) => s.id === staffId);
  if (!staff) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  // ── Shift ────────────────────────────────────────────────────────────────────
  const todayShifts = db.shifts.findToday();
  const myShift = todayShifts.find((s) => s.staff_id === staffId) ?? null;
  const coWorkers = todayShifts
    .filter((s) => s.staff_id && s.staff_id !== staffId && !s.is_open_shift)
    .map((s) => {
      const colleague = db.staff.findActive().find((m) => m.id === s.staff_id);
      return { shift: s, staff: colleague ?? null };
    });
  const openShifts = db.shifts.findOpen();

  // ── My Tasks ─────────────────────────────────────────────────────────────────
  const allTasks = db.tasks.findAll();
  const myTasks = allTasks.filter(
    (t) =>
      t.assigned_to === staffId &&
      t.status !== "completed" &&
      t.status !== "cancelled"
  );
  const myOverdueTasks = myTasks.filter((t) => t.due_date && t.due_date < today);
  const myTodayTasks = myTasks.filter((t) => t.due_date === today);
  const urgentTasks = myTasks.filter((t) => t.priority === "urgent" || t.priority === "high");

  // ── Handover ─────────────────────────────────────────────────────────────────
  const latestHandover = db.handovers.findLatest();
  const handoverItems = latestHandover?.child_updates ?? [];
  const handoverFlags = latestHandover
    ? latestHandover.flags.map((f) => ({ type: "flag", text: f }))
    : [];

  // ── Due Recordings ───────────────────────────────────────────────────────────
  // Young people I'm key worker / secondary worker for
  const currentYP = db.youngPeople.findCurrent();
  const myYP = currentYP.filter(
    (yp) => yp.key_worker_id === staffId || yp.secondary_worker_id === staffId
  );
  const todayLogEntries = db.dailyLog.findToday();
  const loggedYPIds = new Set(todayLogEntries.map((e) => e.child_id));
  const logsNeeded = myYP.filter((yp) => !loggedYPIds.has(yp.id));

  // Medication rounds due now
  const scheduledMeds = db.medicationAdministrations.findScheduled();
  const todayScheduled = scheduledMeds.filter((a) => a.scheduled_time.startsWith(today));
  const medsDueNow = todayScheduled.slice(0, 5);

  // ── Home Checks ──────────────────────────────────────────────────────────────
  const dueChecks = db.buildingChecks.findDue();
  const overdueChecks = db.buildingChecks.findOverdue();
  const buildings = db.buildings.findAll();

  // ── Vehicle Checks ───────────────────────────────────────────────────────────
  const vehicles = db.vehicles.findAll();
  // Check if a daily safety check has been done today for each vehicle
  const vehiclesNeedingCheck = vehicles.filter((v) => {
    const todayChecks = db.vehicleChecks.findByVehicle(v.id).filter(
      (c) => c.check_date === today
    );
    return todayChecks.length === 0 && v.status !== "off_road";
  });
  const vehicleDefects = db.vehicleChecks.findDefects();

  // ── Incidents Needing Action ──────────────────────────────────────────────────
  const openIncidents = db.incidents.findOpen();
  const incidentsByMe = openIncidents.filter((i) => i.reported_by === staffId);
  const awaitingOversight = db.incidents.findNeedingOversight();

  // ── Upcoming Appointments / Events ───────────────────────────────────────────
  // Tasks with categories that represent care plan or professional activities
  const upcomingAppointments = allTasks.filter(
    (t) =>
      (t.category === "young_person_plans" || t.category === "professional_communication") &&
      t.due_date != null &&
      t.due_date >= today &&
      t.status !== "completed" &&
      t.status !== "cancelled"
  ).slice(0, 5);

  // ── Notifications ─────────────────────────────────────────────────────────────
  const myNotifications = db.notifications.findForUser(staffId);

  // ── Quick summary numbers ────────────────────────────────────────────────────
  const actionCount =
    myOverdueTasks.length +
    logsNeeded.length +
    vehiclesNeedingCheck.length +
    (dueChecks.length > 0 ? 1 : 0);

  return NextResponse.json({
    data: {
      staff,
      shift: {
        today: myShift,
        co_workers: coWorkers,
        open_shifts: openShifts,
        on_shift_count: todayShifts.filter((s) => !s.is_open_shift && s.status === "in_progress").length,
      },
      tasks: {
        my_tasks: myTasks,
        overdue: myOverdueTasks,
        due_today: myTodayTasks,
        urgent: urgentTasks,
        total_active: myTasks.length,
      },
      handover: {
        latest: latestHandover
          ? {
              id: latestHandover.id,
              date: latestHandover.shift_date,
              shift_type: latestHandover.shift_from,
              written_by: latestHandover.created_by,
              general_notes: latestHandover.general_notes,
              linked_incidents: latestHandover.linked_incident_ids,
            }
          : null,
        child_updates: handoverItems,
        flags: handoverFlags,
      },
      recordings_due: {
        daily_logs_needed: logsNeeded,
        medication_schedule: medsDueNow,
        total_outstanding: logsNeeded.length + medsDueNow.length,
      },
      home_checks: {
        due: dueChecks,
        overdue: overdueChecks,
        buildings,
        total_due: dueChecks.length,
      },
      vehicles: {
        all: vehicles,
        needing_daily_check: vehiclesNeedingCheck,
        defects: vehicleDefects,
      },
      incidents: {
        open: openIncidents,
        my_incidents: incidentsByMe,
        awaiting_oversight: awaitingOversight,
      },
      appointments: upcomingAppointments,
      notifications: myNotifications,
      young_people: {
        current: currentYP,
        my_yp: myYP,
      },
      summary: {
        action_count: actionCount,
        urgent_count: urgentTasks.length,
        notifications_unread: myNotifications.length,
      },
    },
  });
}
