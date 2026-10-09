import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { todayStr } from "@/lib/utils";
import type { Shift, Task, YoungPerson, DailyLogEntry, MedicationAdministration, Incident } from "@/types";
import type { Building, BuildingCheck, Vehicle, VehicleCheck, Notification, HandoverEntry } from "@/types/extended";

// Staff dashboard — shift-level operational view
// ?staff_id=staff_edward  (defaults to staff_darren in demo)
//
// ★ Every read goes through the dual-mode `dal` so the dashboard works on a
// live tenant — the in-memory store is emptied on live, which made the whole
// screen 404 ("Staff member not found") and under-report meds/checks/incidents.
// The specialised store filters (open shifts, scheduled meds, due/overdue
// checks, vehicle defects, open + oversight-needing incidents) are applied
// in-route over `dal.*.findAll()` using the EXACT predicates the store methods
// used, so operational semantics are unchanged.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const staffId = req.nextUrl.searchParams.get("staff_id") ?? "staff_darren";
  const today = todayStr();

  const activeStaff = await dal.staff.findActive();
  const staff = activeStaff.find((s) => s.id === staffId);
  if (!staff) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  const [
    todayShifts,
    allShifts,
    allTasks,
    allHandovers,
    currentYP,
    todayLogEntries,
    allMeds,
    buildingChecks,
    buildings,
    vehicles,
    allVehicleChecks,
    allIncidents,
    myNotifications,
  ] = await Promise.all([
    dal.shifts.findToday(),
    dal.shifts.findAll(),
    dal.tasks.findAll(),
    dal.handovers.findAll(),
    dal.youngPeople.findCurrent(),
    dal.dailyLog.findAll({ date: today }),
    dal.medicationAdministrations.findAll(),
    dal.buildingChecks.findAll(),
    dal.buildings.findAll(),
    dal.vehicles.findAll(),
    dal.vehicleChecks.findAll(),
    dal.incidents.findAll(),
    dal.notifications.findForUser(staffId),
  ]) as [
    Shift[], Shift[], Task[], HandoverEntry[], YoungPerson[], DailyLogEntry[],
    MedicationAdministration[], BuildingCheck[], Building[], Vehicle[], VehicleCheck[],
    Incident[], Notification[],
  ];

  // store.handovers.findLatest = most recent by created_at
  const latestHandover = allHandovers
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;

  // ── Shift ────────────────────────────────────────────────────────────────────
  const myShift = todayShifts.find((s) => s.staff_id === staffId) ?? null;
  const coWorkers = todayShifts
    .filter((s) => s.staff_id && s.staff_id !== staffId && !s.is_open_shift)
    .map((s) => ({ shift: s, staff: activeStaff.find((m) => m.id === s.staff_id) ?? null }));
  // store.shifts.findOpen = is_open_shift && date >= today
  const openShifts = allShifts.filter((s) => s.is_open_shift && s.date >= today);

  // ── My Tasks ─────────────────────────────────────────────────────────────────
  const myTasks = allTasks.filter(
    (t) => t.assigned_to === staffId && t.status !== "completed" && t.status !== "cancelled"
  );
  const myOverdueTasks = myTasks.filter((t) => t.due_date && t.due_date < today);
  const myTodayTasks = myTasks.filter((t) => t.due_date === today);
  const urgentTasks = myTasks.filter((t) => t.priority === "urgent" || t.priority === "high");

  // ── Handover ─────────────────────────────────────────────────────────────────
  const handoverItems = latestHandover?.child_updates ?? [];
  const handoverFlags = latestHandover
    ? latestHandover.flags.map((f) => ({ type: "flag", text: f }))
    : [];
  const pendingMySignOff = latestHandover
    && latestHandover.incoming_staff.includes(staffId)
    && !(latestHandover.sign_offs ?? []).some((s) => s.staff_id === staffId);

  // ── Due Recordings ───────────────────────────────────────────────────────────
  const myYP = currentYP.filter(
    (yp) => yp.key_worker_id === staffId || yp.secondary_worker_id === staffId
  );
  const loggedYPIds = new Set(todayLogEntries.map((e) => e.child_id));
  const logsNeeded = myYP.filter((yp) => !loggedYPIds.has(yp.id));

  // store.medicationAdministrations.findScheduled = status === "scheduled"
  const todayScheduled = allMeds.filter((a) => a.status === "scheduled" && a.scheduled_time.startsWith(today));
  const medsDueNow = todayScheduled.slice(0, 5);

  // ── Home Checks ──────────────────────────────────────────────────────────────
  // store.buildingChecks.findDue = status in {due, overdue}; findOverdue = overdue
  const dueChecks = buildingChecks.filter((c) => c.status === "due" || c.status === "overdue");
  const overdueChecks = buildingChecks.filter((c) => c.status === "overdue");

  // ── Vehicle Checks ───────────────────────────────────────────────────────────
  const vehiclesNeedingCheck = vehicles.filter((v) => {
    const todayChecks = allVehicleChecks.filter((c) => c.vehicle_id === v.id && c.check_date === today);
    return todayChecks.length === 0 && v.status !== "off_road";
  });
  // store.vehicleChecks.findDefects = overall_result in {fail, advisory}
  const vehicleDefects = allVehicleChecks.filter((c) => c.overall_result === "fail" || c.overall_result === "advisory");

  // ── Incidents Needing Action ──────────────────────────────────────────────────
  // store.incidents.findOpen = status === "open";
  // findNeedingOversight = requires_oversight && !oversight_by
  const openIncidents = allIncidents.filter((i) => i.status === "open");
  const incidentsByMe = openIncidents.filter((i) => i.reported_by === staffId);
  const awaitingOversight = allIncidents.filter((i) => i.requires_oversight && !i.oversight_by);

  // ── Upcoming Appointments / Events ───────────────────────────────────────────
  const upcomingAppointments = allTasks.filter(
    (t) =>
      (t.category === "young_person_plans" || t.category === "professional_communication") &&
      t.due_date != null &&
      t.due_date >= today &&
      t.status !== "completed" &&
      t.status !== "cancelled"
  ).slice(0, 5);

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
        pending_sign_off: !!pendingMySignOff,
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
