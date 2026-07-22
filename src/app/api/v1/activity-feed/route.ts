import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface FeedItem {
  id: string;
  type: string;
  action: string;
  title: string;
  description: string;
  timestamp: string;
  actor_id?: string;
  child_id?: string;
  severity?: string;
  href: string;
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
  const [allIncidents, allTasks, allDailyLog, allMars, allHandovers, allShifts, allTraining, allStaff] = await Promise.all([
    safeList(dal.incidents.findAll()),
    safeList(dal.tasks.findAll()),
    safeList(dal.dailyLog.findAll()),
    safeList(dal.medicationAdministrations.findAll()),
    safeList(dal.handovers.findAll()),
    safeList(dal.shifts.findAll()),
    safeList(dal.training.findAll()),
    safeList(dal.staff.findAll()),
  ]);
  const items: FeedItem[] = [];

  // ── Incidents ──────────────────────────────────────────────────────────────
  for (const inc of (allIncidents).slice(0, 15)) {
    items.push({
      id: `feed_inc_${inc.id}`,
      type: "incident",
      action: inc.status === "open" ? "opened" : "updated",
      title: `${inc.reference} — ${inc.type?.replace(/_/g, " ") ?? "Incident"}`,
      description: inc.description?.slice(0, 120) ?? "",
      timestamp: inc.updated_at ?? inc.created_at ?? inc.date,
      actor_id: inc.reported_by ?? undefined,
      child_id: inc.child_id ?? undefined,
      severity: inc.severity,
      href: "/incidents",
    });
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const recentTasks = (allTasks)
    .filter((t) => t.updated_at)
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
    .slice(0, 10);
  for (const task of recentTasks) {
    items.push({
      id: `feed_task_${task.id}`,
      type: "task",
      action: task.status === "completed" ? "completed" : task.status === "in_progress" ? "started" : "created",
      title: task.title,
      description: task.description?.slice(0, 120) ?? "",
      timestamp: task.updated_at ?? task.created_at,
      actor_id: task.assigned_to ?? undefined,
      child_id: task.linked_child_id ?? undefined,
      severity: task.priority === "urgent" ? "high" : "info",
      href: "/tasks",
    });
  }

  // ── Daily Logs ─────────────────────────────────────────────────────────────
  for (const log of (allDailyLog).slice(0, 10)) {
    items.push({
      id: `feed_dl_${log.id}`,
      type: "daily_log",
      action: "recorded",
      // DailyLogEntry has no child_name/summary/notes — the real content field
      // is `content` (descriptions were ALWAYS empty before).
      title: `Daily log — ${log.child_id ?? "General"}`,
      description: (log.content ?? "").slice(0, 120),
      timestamp: log.created_at ?? log.date,
      actor_id: log.staff_id ?? undefined,
      child_id: log.child_id ?? undefined,
      severity: "info",
      href: "/daily-log",
    });
  }

  // ── Medication Administrations ─────────────────────────────────────────────
  const recentMars = (allMars)
    .filter((m) => m.actual_time)
    .sort((a, b) => (b.actual_time ?? "").localeCompare(a.actual_time ?? ""))
    .slice(0, 8);
  for (const mar of recentMars) {
    items.push({
      id: `feed_med_${mar.id}`,
      type: "medication",
      action: mar.status === "given" ? "administered" : mar.status === "missed" ? "missed" : mar.status,
      title: `Medication ${mar.status} — ${mar.child_id}`,
      description: mar.notes?.slice(0, 120) ?? `${mar.dose_given ?? "Dose"} ${mar.status}`,
      timestamp: mar.actual_time ?? mar.scheduled_time,
      actor_id: mar.administered_by ?? undefined,
      child_id: mar.child_id ?? undefined,
      severity: mar.status === "missed" || mar.status === "refused" ? "high" : "info",
      href: "/medication",
    });
  }

  // ── Handovers ──────────────────────────────────────────────────────────────
  for (const ho of (allHandovers).slice(0, 5)) {
    items.push({
      id: `feed_ho_${ho.id}`,
      type: "handover",
      action: ho.completed_at ? "completed" : "started",
      // HandoverEntry's real fields: shift_from→shift_to (no shift_type),
      // general_notes (no summary — descriptions were ALWAYS empty),
      // shift_date (no date), created_by (no staff_id).
      title: `Shift handover — ${ho.shift_from ?? "shift"} → ${ho.shift_to ?? ""}`.trim(),
      description: (ho.general_notes ?? "").slice(0, 120),
      timestamp: ho.created_at ?? ho.shift_date ?? todayStr(),
      actor_id: ho.created_by ?? undefined,
      severity: "info",
      href: "/handover",
    });
  }

  // ── Shifts ─────────────────────────────────────────────────────────────────
  const todayShifts = (allShifts).filter((s) => s.date === todayStr()).slice(0, 6);
  for (const shift of todayShifts) {
    items.push({
      id: `feed_shift_${shift.id}`,
      type: "shift",
      action: shift.status === "in_progress" ? "on_shift" : shift.status === "completed" ? "ended" : "scheduled",
      title: `${shift.staff_id} — ${shift.shift_type} shift`,
      description: `${shift.start_time} – ${shift.end_time}`,
      timestamp: shift.start_time ?? shift.date,
      actor_id: shift.staff_id ?? undefined,
      severity: "info",
      href: "/rota",
    });
  }

  // ── Training Records ───────────────────────────────────────────────────────
  const expiredTraining = (allTraining)
    .filter((t) => t.expiry_date && t.expiry_date < todayStr())
    .slice(0, 5);
  for (const tr of expiredTraining) {
    items.push({
      id: `feed_train_${tr.id}`,
      type: "training",
      action: "expired",
      title: `Training expired — ${tr.course_name}`,
      description: `${(allStaff).find((s) => s.id === tr.staff_id)?.full_name ?? tr.staff_id} — expired ${tr.expiry_date}`,
      timestamp: tr.expiry_date ?? tr.created_at,
      actor_id: tr.staff_id ?? undefined,
      severity: "medium",
      href: "/training",
    });
  }

  // Sort all items by timestamp descending
  items.sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""));

  return NextResponse.json({
    data: items.slice(0, 50),
    meta: { total: items.length },
  });
}
