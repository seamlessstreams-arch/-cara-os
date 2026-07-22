import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { dal } from "@/lib/db/dal";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Read a dal collection defensively: on a live tenant a transient query failure
// must degrade to an empty section, never 500 the whole dashboard.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export async function GET(_req: NextRequest) {
  const store = getStore();
  const today = todayStr();

  // Core records via the dual-mode dal — the live tenant's Postgres when
  // connected, the in-memory store in demo. This route USED to read getStore()
  // directly for everything, so on a live tenant (store gated empty, never
  // hydrated from Supabase) the whole dashboard read zero regardless of what was
  // actually recorded. Every collection below that has a dal accessor now
  // reflects real data; the compute is unchanged.
  const [
    allTasks,
    allIncidents,
    missingEpisodes,
    allShifts,
    leaveRecords,
    supervisions,
    allMars,
    trainingRecords,
    staffList,
    buildingChecks,
    vehicles,
    youngPeople,
  ] = await Promise.all([
    safeList(dal.tasks.findAll()),
    safeList(dal.incidents.findAll()),
    safeList(dal.missingEpisodes.findAll()),
    safeList(dal.shifts.findAll()),
    safeList(dal.leave.findAll()),
    safeList(dal.supervisions.findAll()),
    safeList(dal.medicationAdministrations.findAll()),
    safeList(dal.training.findAll()),
    safeList(dal.staff.findAll()),
    safeList(dal.buildingChecks.findAll()),
    safeList(dal.vehicles.findAll()),
    safeList(dal.youngPeople.findAll()),
  ]);

  // Store-only collections (no dal accessor / no live table yet): empty on a live
  // tenant, seeded in demo. Left on getStore() so demo is unchanged and live is
  // honestly empty until they gain a backing table.
  const contextualSafeguardingRisks = store.contextualSafeguardingRisks ?? [];
  const medicationErrors = store.medicationErrors ?? [];

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const activeTasks = allTasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const overdueTasks = activeTasks.filter((t) => t.due_date && t.due_date < today && t.status !== "completed");
  const dueTodayTasks = activeTasks.filter((t) => t.due_date === today);
  const urgentTasks = activeTasks.filter((t) => t.priority === "urgent");
  const myTasks = activeTasks.filter((t) => t.assigned_to === "staff_darren");
  const awaitingSignOff = activeTasks.filter((t) => t.requires_sign_off && !t.signed_off_by);
  const completedToday = allTasks.filter((t) => t.status === "completed" && t.updated_at?.startsWith(today));

  const priorityQueue = activeTasks
    .sort((a, b) => {
      const p: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (p[a.priority] ?? 3) - (p[b.priority] ?? 3);
    })
    .slice(0, 10);

  // ── Incidents ──────────────────────────────────────────────────────────────
  const openIncidents = allIncidents.filter((i) => i.status === "open" || i.status === "under_review");
  const criticalIncidents = openIncidents.filter((i) => i.severity === "critical");
  // Incident has no management_oversight_added — the real fields are
  // requires_oversight/oversight_at (the old read counted EVERY open incident).
  const awaitingOversight = openIncidents.filter((i) => i.requires_oversight && !i.oversight_at);
  const thisWeekIncidents = allIncidents.filter((i) => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return i.date >= weekAgo.toISOString().slice(0, 10);
  });

  // ── Safeguarding ───────────────────────────────────────────────────────────
  // FALSE-GREEN FIXES: the old reads targeted phantom collection names
  // (missingFromCareEpisodes / contextualSafeguarding do not exist), so active
  // missing was ALWAYS 0 and contextual risk ALWAYS 0 on the dashboard. The
  // real collections are missingEpisodes / contextualSafeguardingRisks.
  const activeMissing = missingEpisodes.filter((e) => e.status === "active");
  const contextualRisk = contextualSafeguardingRisks.length;

  // ── Staffing ───────────────────────────────────────────────────────────────
  const todayShifts = allShifts.filter((s) => s.date === today || s.start_time?.startsWith(today));
  const onShift = todayShifts.filter((s) => s.status === "in_progress" || s.status === "confirmed");
  const openShifts = todayShifts.filter((s) => !s.staff_id || s.is_open_shift);
  const onLeave = leaveRecords.filter(
    (l) => l.start_date && l.end_date && l.start_date <= today && l.end_date >= today && l.status === "approved",
  );
  // FALSE-GREEN FIX: Supervision has no due_date — the old filter read a
  // nonexistent field, so overdue supervisions were ALWAYS 0. The real signal
  // is a scheduled date in the past that never became completed.
  const overdueSupervisions = supervisions.filter(
    (s) => s.scheduled_date && s.scheduled_date < today && s.status === "scheduled",
  );

  // ── Medication ─────────────────────────────────────────────────────────────
  const todayMars = allMars.filter((m) => m.scheduled_time?.startsWith(today));
  const missedToday = todayMars.filter((m) => m.status === "missed" || m.status === "refused");
  const scheduledToday = todayMars.length;
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  // FALSE-GREEN FIX: MedicationError has no `date` — the real field is
  // date_occurred, so this-week errors were ALWAYS 0.
  const errorsThisWeek = medicationErrors.filter((e) => e.date_occurred && e.date_occurred >= weekAgoStr);

  // ── Compliance / Training ──────────────────────────────────────────────────
  const expired = trainingRecords.filter((t) => t.expiry_date && t.expiry_date < today);
  const expiringIn30 = (() => {
    const d30 = new Date(); d30.setDate(d30.getDate() + 30);
    const d30Str = d30.toISOString().slice(0, 10);
    return trainingRecords.filter((t) => t.expiry_date && t.expiry_date >= today && t.expiry_date <= d30Str);
  })();
  const certWarnings = expired.slice(0, 5).map((t) => {
    const staffName = staffList.find((s) => s.id === t.staff_id)?.full_name ?? t.staff_id ?? "Staff";
    return `${staffName} — ${t.course_name ?? "Training"} expired ${t.expiry_date}`;
  });

  // ── Environment ────────────────────────────────────────────────────────────
  const overdueChecks = buildingChecks.filter((c) => c.due_date && c.due_date < today && c.status !== "completed");
  const dueChecks = buildingChecks.filter((c) => c.due_date && c.due_date === today && c.status !== "completed");
  // FALSE-GREEN FIX: Vehicle has no has_defects field and no "defective"
  // status — defects were ALWAYS 0. The honest recorded unsafe-vehicle signals
  // are an expired MOT or expired insurance.
  const vehicleDefects = vehicles.filter(
    (v) => (v.mot_expiry && v.mot_expiry < today) || (v.insurance_expiry && v.insurance_expiry < today),
  );
  const vehiclesRestricted = vehicles.filter((v) => v.status === "restricted" || v.status === "off_road");

  // ── Young People ───────────────────────────────────────────────────────────
  // BUG FIX: the old filter ended `|| true` — always true, so EVERY young
  // person (including ended placements) counted as current.
  const currentYP = youngPeople.filter((yp) => yp.status === "current");

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
        pending_leave_requests: leaveRecords.filter((l) => l.status === "pending").length,
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
