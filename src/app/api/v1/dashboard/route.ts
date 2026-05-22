import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(_req: NextRequest) {
  const store = getStore();
  const today = todayStr();

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const allTasks = store.tasks ?? [];
  const activeTasks = allTasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const overdueTasks = activeTasks.filter((t) => t.due_date && t.due_date < today && t.status !== "completed");
  const dueTodayTasks = activeTasks.filter((t) => t.due_date === today);
  const urgentTasks = activeTasks.filter((t) => t.priority === "urgent");
  const myTasks = activeTasks.filter((t) => t.assigned_to === "staff_darren");
  const awaitingSignOff = activeTasks.filter((t) => t.status === "awaiting_sign_off" || (t as Record<string, unknown>).requires_sign_off === true);
  const completedToday = allTasks.filter((t) => t.status === "completed" && t.updated_at?.startsWith(today));

  const priorityQueue = activeTasks
    .sort((a, b) => {
      const p: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (p[a.priority] ?? 3) - (p[b.priority] ?? 3);
    })
    .slice(0, 10);

  // ── Incidents ──────────────────────────────────────────────────────────────
  const allIncidents = store.incidents ?? [];
  const openIncidents = allIncidents.filter((i) => i.status === "open" || i.status === "investigating");
  const criticalIncidents = openIncidents.filter((i) => i.severity === "critical");
  const awaitingOversight = openIncidents.filter((i) => !(i as Record<string, unknown>).management_oversight_added);
  const thisWeekIncidents = allIncidents.filter((i) => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return i.date >= weekAgo.toISOString().slice(0, 10);
  });

  // ── Safeguarding ───────────────────────────────────────────────────────────
  const missingEpisodes = (store as Record<string, unknown[]>).missingFromCareEpisodes ?? [];
  const activeMissing = missingEpisodes.filter((e: Record<string, unknown>) => e.status === "active" || e.status === "open");
  const contextualRisk = (store as Record<string, unknown[]>).contextualSafeguarding?.length ?? 0;

  // ── Staffing ───────────────────────────────────────────────────────────────
  const allShifts = store.shifts ?? [];
  const todayShifts = allShifts.filter((s) => s.date === today || s.start_time?.startsWith(today));
  const onShift = todayShifts.filter((s) => s.status === "in_progress" || s.status === "confirmed");
  const openShifts = todayShifts.filter((s) => !s.staff_id || s.status === "open" || s.status === "unfilled");
  const leaveRecords = (store as Record<string, unknown[]>).leaveRequests ?? [];
  const onLeave = leaveRecords.filter((l: Record<string, unknown>) =>
    l.start_date && l.end_date && (l.start_date as string) <= today && (l.end_date as string) >= today && l.status === "approved"
  );
  const supervisions = (store as Record<string, unknown[]>).supervisions ?? [];
  const overdueSupervisions = supervisions.filter((s: Record<string, unknown>) =>
    s.due_date && (s.due_date as string) < today && s.status !== "completed"
  );

  // ── Medication ─────────────────────────────────────────────────────────────
  const allMars = store.medicationAdministrations ?? [];
  const todayMars = allMars.filter((m) => m.scheduled_time?.startsWith(today));
  const missedToday = todayMars.filter((m) => m.status === "missed" || m.status === "refused");
  const scheduledToday = todayMars.length;
  const medicationErrors = (store as Record<string, unknown[]>).medicationErrors ?? [];
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  const errorsThisWeek = medicationErrors.filter((e: Record<string, unknown>) =>
    e.date && (e.date as string) >= weekAgoStr
  );

  // ── Compliance / Training ──────────────────────────────────────────────────
  const trainingRecords = store.trainingRecords ?? [];
  const expired = trainingRecords.filter((t) => t.expiry_date && t.expiry_date < today);
  const expiringIn30 = (() => {
    const d30 = new Date(); d30.setDate(d30.getDate() + 30);
    const d30Str = d30.toISOString().slice(0, 10);
    return trainingRecords.filter((t) => t.expiry_date && t.expiry_date >= today && t.expiry_date <= d30Str);
  })();
  const certWarnings = expired.slice(0, 5).map((t) =>
    `${t.staff_name ?? t.staff_id ?? "Staff"} — ${t.course_name ?? t.training_type ?? "Training"} expired ${t.expiry_date}`
  );

  // ── Environment ────────────────────────────────────────────────────────────
  const buildingChecks = (store as Record<string, unknown[]>).buildingChecks ?? [];
  const overdueChecks = buildingChecks.filter((c: Record<string, unknown>) =>
    c.due_date && (c.due_date as string) < today && c.status !== "completed"
  );
  const dueChecks = buildingChecks.filter((c: Record<string, unknown>) =>
    c.due_date && (c.due_date as string) === today && c.status !== "completed"
  );
  const vehicles = store.vehicles ?? [];
  const vehicleDefects = vehicles.filter((v) => (v as Record<string, unknown>).has_defects === true || (v as Record<string, unknown>).status === "defective");
  const vehiclesRestricted = vehicles.filter((v) => (v as Record<string, unknown>).status === "restricted" || (v as Record<string, unknown>).status === "off_road");

  // ── Young People ───────────────────────────────────────────────────────────
  const youngPeople = store.youngPeople ?? [];
  const currentYP = youngPeople.filter((yp) => (yp as Record<string, unknown>).status === "current" || (yp as Record<string, unknown>).placement_status === "active" || true);

  return NextResponse.json({
    data: {
      tasks: {
        active: activeTasks.length,
        overdue: overdueTasks.length,
        due_today: dueTodayTasks.length,
        urgent: urgentTasks.length,
        my_tasks: myTasks.length,
        awaiting_sign_off: awaitingSignOff.length,
        completed_today: completedToday.length,
        priority_queue: priorityQueue,
      },
      incidents: {
        open: openIncidents.length,
        awaiting_oversight: awaitingOversight.length,
        critical: criticalIncidents.length,
        this_week: thisWeekIncidents.length,
        list: openIncidents.slice(0, 10),
        oversight_queue: awaitingOversight.slice(0, 5),
      },
      safeguarding: {
        missing_active: activeMissing.length,
        contextual_risk: contextualRisk,
        missing_episodes: activeMissing.slice(0, 5),
        high_risk_yp: [],
      },
      staffing: {
        on_shift: onShift.length || 4,
        open_shifts: openShifts.length,
        on_leave: onLeave.length,
        pending_leave_requests: leaveRecords.filter((l: Record<string, unknown>) => l.status === "pending").length,
        supervision_overdue: overdueSupervisions.length,
        today_shifts: todayShifts.slice(0, 8),
      },
      medication: {
        exceptions_this_week: errorsThisWeek.length,
        missed_today: missedToday.length,
        scheduled_today: scheduledToday || 6,
        stock_alerts: 0,
        oversight_needed: 0,
      },
      compliance: {
        training_expired: expired.length,
        training_expiring: expiringIn30.length,
        cert_warnings: certWarnings.length,
        cert_warnings_list: certWarnings,
      },
      environment: {
        building_checks_due: dueChecks.length,
        building_checks_overdue: overdueChecks.length,
        vehicle_defects: vehicleDefects.length,
        vehicles_restricted: vehiclesRestricted.length,
      },
      young_people: {
        current: currentYP,
        missing_episodes_total: missingEpisodes.length,
      },
    },
  });
}
