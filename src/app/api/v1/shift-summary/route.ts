import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function staffName(id: string): string {
  const names: Record<string, string> = {
    staff_darren: "Olivia Hayes",
    staff_ryan: "Marcus Bell",
    staff_anna: "Priya Sharma",
    staff_edward: "Daniel Frost",
    staff_chervelle: "Naomi Reid",
    staff_diane: "Maria Okafor",
    staff_lackson: "Samuel Boateng",
    staff_mirela: "Elena Novak",
  };
  return names[id] ?? id?.replace("staff_", "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Unknown";
}

function childName(id: string): string {
  const names: Record<string, string> = {
    yp_alex: "Alex",
    yp_casey: "Casey",
    yp_jordan: "Jordan",
  };
  return names[id] ?? id?.replace("yp_", "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Unknown";
}

export async function GET(req: NextRequest) {
  const store = getStore();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? todayStr();
  const shiftType = searchParams.get("shift") ?? "day";

  // ── Staff on Shift ─────────────────────────────────────────────────────────
  const allShifts = store.shifts ?? [];
  const matchingShifts = allShifts.filter(
    (s) => (s.date === date || s.start_time?.startsWith(date)) &&
           (s.shift_type === shiftType || !shiftType)
  );
  const staffOnShift = matchingShifts
    .filter((s) => s.staff_id)
    .map((s) => ({
      id: s.staff_id,
      name: staffName(s.staff_id),
      role: (s as unknown as Record<string, unknown>).role as string ?? "Residential Care Worker",
      start: s.start_time ?? "",
      end: s.end_time ?? "",
    }));

  // ── Young People ───────────────────────────────────────────────────────────
  const yps = store.youngPeople ?? [];
  const dailyLogs = store.dailyLog ?? [];
  const todayLogs = dailyLogs.filter((l) => l.date === date);

  const youngPeople = yps.map((yp) => {
    const logs = todayLogs.filter((l) => l.child_id === yp.id);
    const latestLog = logs[logs.length - 1] as unknown as Record<string, unknown> | undefined;
    return {
      id: yp.id,
      name: childName(yp.id),
      mood_score: latestLog?.mood_score as number ?? undefined,
      entries_count: logs.length,
    };
  });

  // ── Events Timeline ────────────────────────────────────────────────────────
  type SummaryEvent = {
    type: string;
    time: string;
    title: string;
    description: string;
    severity: string;
    child_id?: string;
    child_name?: string;
    staff_name?: string;
  };
  const events: SummaryEvent[] = [];

  // Incidents
  const dayIncidents = (store.incidents ?? []).filter((i) => i.date === date || i.created_at?.startsWith(date));
  for (const inc of dayIncidents) {
    events.push({
      type: "incident",
      time: inc.created_at ?? inc.date,
      title: `${inc.reference} — ${inc.type?.replace(/_/g, " ")}`,
      description: inc.description?.slice(0, 150) ?? "",
      severity: inc.severity,
      child_id: inc.child_id ?? undefined,
      child_name: inc.child_id ? childName(inc.child_id) : undefined,
      staff_name: (inc as unknown as Record<string, unknown>).reported_by ? staffName((inc as unknown as Record<string, unknown>).reported_by as string) : undefined,
    });
  }

  // Medication
  const dayMars = (store.medicationAdministrations ?? []).filter((m) => m.scheduled_time?.startsWith(date));
  const givenMars = dayMars.filter((m) => m.status === "given" || m.status === "late");
  const missedMars = dayMars.filter((m) => m.status === "missed" || m.status === "refused");

  for (const mar of missedMars) {
    events.push({
      type: "medication",
      time: mar.scheduled_time,
      title: `Medication ${mar.status} — ${childName(mar.child_id)}`,
      description: mar.notes ?? `Scheduled at ${mar.scheduled_time?.slice(11, 16)}`,
      severity: "high",
      child_id: mar.child_id,
      child_name: childName(mar.child_id),
      staff_name: mar.administered_by ? staffName(mar.administered_by) : undefined,
    });
  }

  // Daily Logs
  for (const log of todayLogs) {
    events.push({
      type: "daily_log",
      time: log.created_at ?? log.date,
      title: `Daily log — ${childName(log.child_id)}`,
      description: ((log as unknown as Record<string, unknown>).summary as string ?? (log as unknown as Record<string, unknown>).notes as string ?? "").slice(0, 150),
      severity: "info",
      child_id: log.child_id ?? undefined,
      child_name: log.child_id ? childName(log.child_id) : undefined,
      staff_name: log.staff_id ? staffName(log.staff_id) : undefined,
    });
  }

  // Tasks completed today
  const completedTasks = (store.tasks ?? []).filter((t) => t.status === "completed" && t.updated_at?.startsWith(date));
  for (const task of completedTasks) {
    events.push({
      type: "task",
      time: task.updated_at ?? date,
      title: `Task completed — ${task.title}`,
      description: task.description?.slice(0, 150) ?? "",
      severity: "info",
      staff_name: task.assigned_to ? staffName(task.assigned_to) : undefined,
    });
  }

  // Missing from care
  const missingEpisodes = ((store as unknown as Record<string, unknown[]>).missingFromCareEpisodes ?? []) as unknown as Record<string, unknown>[];
  const dayMissing = missingEpisodes.filter((e) =>
    (e.date as string)?.startsWith(date) || (e.created_at as string)?.startsWith(date)
  );
  for (const ep of dayMissing) {
    events.push({
      type: "missing",
      time: (ep.created_at ?? ep.date) as string,
      title: `Missing from care — ${ep.child_id ? childName(ep.child_id as string) : "Unknown"}`,
      description: (ep.summary as string ?? ep.notes as string ?? "").slice(0, 150),
      severity: "critical",
      child_id: ep.child_id as string,
      child_name: ep.child_id ? childName(ep.child_id as string) : undefined,
    });
  }

  events.sort((a, b) => (b.time ?? "").localeCompare(a.time ?? ""));

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total_events: events.length,
    incidents_logged: dayIncidents.length,
    medications_given: givenMars.length,
    medications_missed: missedMars.length,
    daily_log_entries: todayLogs.length,
    tasks_completed: completedTasks.length,
    missing_episodes: dayMissing.length,
  };

  // ── Auto Notes ─────────────────────────────────────────────────────────────
  const parts: string[] = [];
  if (stats.incidents_logged > 0) parts.push(`${stats.incidents_logged} incident(s) logged`);
  if (stats.medications_missed > 0) parts.push(`${stats.medications_missed} medication(s) missed`);
  if (stats.missing_episodes > 0) parts.push(`${stats.missing_episodes} missing episode(s)`);
  if (stats.tasks_completed > 0) parts.push(`${stats.tasks_completed} task(s) completed`);
  if (stats.daily_log_entries > 0) parts.push(`${stats.daily_log_entries} daily log entries`);
  const autoNotes = parts.length > 0 ? parts.join(". ") + "." : "Quiet shift — no notable events recorded.";

  return NextResponse.json({
    data: {
      date,
      shift_type: shiftType,
      staff_on_shift: staffOnShift,
      young_people: youngPeople,
      events,
      stats,
      auto_notes: autoNotes,
    },
  });
}
