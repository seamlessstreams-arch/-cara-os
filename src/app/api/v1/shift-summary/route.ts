import { NextRequest, NextResponse } from "next/server";
import { safeList } from "@/lib/api/safe-list";
import { dal } from "@/lib/db/dal";
import { todayStr } from "@/lib/utils";


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

// Read a dal collection defensively: on a live tenant a transient query failure
// must degrade to an empty section, never 500 the whole dashboard.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? todayStr();
  const shiftType = searchParams.get("shift") ?? "day";

  const [allShifts, yps, dailyLogs, allIncidents, allMars, allTasks] = await Promise.all([
    safeList(dal.shifts.findAll()),
    safeList(dal.youngPeople.findAll()),
    safeList(dal.dailyLog.findAll()),
    safeList(dal.incidents.findAll()),
    safeList(dal.medicationAdministrations.findAll()),
    safeList(dal.tasks.findAll()),
  ]);

  // ── Staff on Shift ─────────────────────────────────────────────────────────
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
  const dayIncidents = allIncidents.filter((i) => i.date === date || i.created_at?.startsWith(date));
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
  const dayMars = allMars.filter((m) => m.scheduled_time?.startsWith(date));
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
  const completedTasks = allTasks.filter((t) => t.status === "completed" && t.updated_at?.startsWith(date));
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

  // Missing from care — episodes that began on this date, read from the real
  // `missingEpisodes` collection via dal (typed MissingEpisode records). The
  // date field is `date_missing`; there is no `summary`/`notes`/`date` field.
  const missingEpisodes = await dal.missingEpisodes.findAll();
  const dayMissing = missingEpisodes.filter((ep) =>
    (ep.date_missing ?? "").startsWith(date)
  );
  for (const ep of dayMissing) {
    const detail = [
      `${ep.risk_level ?? "high"}-risk`,
      ep.reference || null,
      ep.location_last_seen ? `last seen ${ep.location_last_seen}` : null,
      ep.date_returned || ep.status === "returned" ? "returned" : "still missing",
    ]
      .filter(Boolean)
      .join(" · ");
    events.push({
      type: "missing",
      time: ep.time_missing ? `${ep.date_missing}T${ep.time_missing}` : ep.date_missing,
      title: `Missing from care — ${childName(ep.child_id)}`,
      description: detail.slice(0, 150),
      severity: "critical",
      child_id: ep.child_id,
      child_name: childName(ep.child_id),
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
