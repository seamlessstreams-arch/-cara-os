import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════════════════════
// SHIFT SUMMARY API
// Auto-generates a summary of everything that happened during a shift period.
// Used by the handover system to pre-populate handover notes, saving staff
// 15-20 minutes per shift change.
//
// Query params:
//   date  — shift date (default: today)
//   shift — shift type filter (day | sleep_in | waking_night)
// ══════════════════════════════════════════════════════════════════════════════

interface ShiftSummaryItem {
  type: "incident" | "medication" | "daily_log" | "task" | "missing" | "handover_flag";
  time: string;
  title: string;
  description: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  child_id?: string;
  child_name?: string;
  staff_name?: string;
}

interface ShiftSummary {
  date: string;
  shift_type: string;
  staff_on_shift: { id: string; name: string; role: string; start: string; end: string }[];
  young_people: { id: string; name: string; mood_score?: number; entries_count: number }[];
  events: ShiftSummaryItem[];
  stats: {
    total_events: number;
    incidents_logged: number;
    medications_given: number;
    medications_missed: number;
    daily_log_entries: number;
    tasks_completed: number;
    missing_episodes: number;
  };
  auto_notes: string;
}

// Map shift type to approximate hour ranges
function getShiftHours(shiftType: string): { start: number; end: number } {
  switch (shiftType) {
    case "day": return { start: 7, end: 22 };
    case "sleep_in": return { start: 22, end: 7 };
    case "waking_night": return { start: 22, end: 7 };
    case "early": return { start: 7, end: 14 };
    case "late": return { start: 14, end: 22 };
    default: return { start: 0, end: 24 };
  }
}

function isInShiftWindow(time: string, shiftStart: number, shiftEnd: number): boolean {
  const parts = time.split(":");
  const hour = parseInt(parts[0] || "0", 10);

  if (shiftStart < shiftEnd) {
    // Normal shift (e.g. 7-22)
    return hour >= shiftStart && hour < shiftEnd;
  } else {
    // Overnight shift (e.g. 22-7)
    return hour >= shiftStart || hour < shiftEnd;
  }
}

function getYPName(childId: string): string {
  const yp = db.youngPeople.findAll().find((y) => y.id === childId);
  return yp ? (yp.preferred_name || yp.first_name) : "Unknown";
}

function getStaffName(staffId: string): string {
  const s = db.staff.findAll().find((st) => st.id === staffId);
  return s ? s.full_name : "Unknown";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || todayStr();
  const shiftType = searchParams.get("shift") || "day";

  const hours = getShiftHours(shiftType);
  const events: ShiftSummaryItem[] = [];

  // ── Staff on shift ────────────────────────────────────────────────────
  const allShifts = db.shifts.findAll().filter((s) => s.date === date);
  const relevantShifts = shiftType === "all"
    ? allShifts
    : allShifts.filter((s) => s.shift_type === shiftType);

  const staffOnShift = relevantShifts.map((s) => ({
    id: s.staff_id,
    name: getStaffName(s.staff_id),
    role: db.staff.findAll().find((st) => st.id === s.staff_id)?.job_title || "",
    start: s.start_time,
    end: s.end_time,
  }));

  // ── Incidents during shift ────────────────────────────────────────────
  const incidents = db.incidents.findAll().filter((i) => {
    if (i.date !== date) return false;
    return isInShiftWindow(i.time || "00:00", hours.start, hours.end);
  });

  for (const inc of incidents) {
    events.push({
      type: "incident",
      time: inc.time || "00:00",
      title: `${inc.reference} — ${inc.type.replace(/_/g, " ")}`,
      description: inc.description?.slice(0, 150) || "",
      severity: inc.severity as ShiftSummaryItem["severity"],
      child_id: inc.child_id,
      child_name: getYPName(inc.child_id),
      staff_name: getStaffName(inc.reported_by),
    });
  }

  // ── Medication administrations ────────────────────────────────────────
  const meds = db.medicationAdministrations.findAll().filter((a) => {
    const schedDate = a.scheduled_time?.slice(0, 10);
    if (schedDate !== date) return false;
    const schedTime = a.scheduled_time?.slice(11, 16) || "00:00";
    return isInShiftWindow(schedTime, hours.start, hours.end);
  });

  const medsGiven = meds.filter((a) => a.status === "given").length;
  const medsMissed = meds.filter((a) => a.status === "missed").length;
  const medsRefused = meds.filter((a) => a.status === "refused").length;

  for (const med of meds.filter((a) => a.status !== "given")) {
    const medication = db.medications.findAll().find((m) => m.id === med.medication_id);
    events.push({
      type: "medication",
      time: med.scheduled_time?.slice(11, 16) || "00:00",
      title: `Medication ${med.status}: ${medication?.name || "Unknown"}`,
      description: med.notes || `${med.status} at scheduled time`,
      severity: med.status === "missed" ? "high" : "medium",
      child_id: med.child_id,
      child_name: getYPName(med.child_id),
      staff_name: med.administered_by ? getStaffName(med.administered_by) : undefined,
    });
  }

  // ── Daily log entries ─────────────────────────────────────────────────
  const logs = db.dailyLog.findAll().filter((l) => {
    if (l.date !== date) return false;
    return isInShiftWindow(l.time || "00:00", hours.start, hours.end);
  });

  for (const log of logs) {
    events.push({
      type: "daily_log",
      time: log.time || "00:00",
      title: `${log.entry_type.replace(/_/g, " ")} entry`,
      description: log.content?.slice(0, 120) || "",
      severity: log.is_significant ? "medium" : "info",
      child_id: log.child_id,
      child_name: getYPName(log.child_id),
      staff_name: getStaffName(log.staff_id),
    });
  }

  // ── Tasks completed ───────────────────────────────────────────────────
  const tasks = db.tasks.findAll().filter((t) => {
    if (t.status !== "completed" || !t.completed_at) return false;
    const completedDate = t.completed_at.slice(0, 10);
    return completedDate === date;
  });

  for (const task of tasks) {
    events.push({
      type: "task",
      time: task.completed_at?.slice(11, 16) || "00:00",
      title: `Task completed: ${task.title}`,
      description: task.evidence_note || "",
      severity: "info",
      staff_name: task.completed_by ? getStaffName(task.completed_by) : undefined,
    });
  }

  // ── Missing episodes ──────────────────────────────────────────────────
  const missing = db.missingEpisodes.findAll().filter((m) => {
    const reportedDate = m.created_at?.slice(0, 10);
    return reportedDate === date;
  });

  for (const ep of missing) {
    events.push({
      type: "missing",
      time: ep.created_at?.slice(11, 16) || "00:00",
      title: `Missing from care — ${ep.status}`,
      description: ep.pattern_notes?.slice(0, 120) || "",
      severity: "critical",
      child_id: ep.child_id,
      child_name: getYPName(ep.child_id),
    });
  }

  // Sort events by time
  events.sort((a, b) => a.time.localeCompare(b.time));

  // ── Young people summary ──────────────────────────────────────────────
  const currentYP = db.youngPeople.findAll().filter((yp) => yp.status === "current");
  const ypSummary = currentYP.map((yp) => {
    const childLogs = logs.filter((l) => l.child_id === yp.id);
    const moodEntry = childLogs.find((l) => l.entry_type === "mood");
    return {
      id: yp.id,
      name: yp.preferred_name || yp.first_name,
      mood_score: moodEntry?.mood_score ?? undefined,
      entries_count: childLogs.length,
    };
  });

  // ── Auto-generate handover notes ──────────────────────────────────────
  const lines: string[] = [];
  const shiftLabel = shiftType.replace(/_/g, " ");

  lines.push(`${shiftLabel.charAt(0).toUpperCase() + shiftLabel.slice(1)} shift summary for ${date}.`);
  lines.push(`Staff on shift: ${staffOnShift.map((s) => s.name.split(" ")[0]).join(", ") || "None recorded"}.`);
  lines.push("");

  if (incidents.length > 0) {
    lines.push(`${incidents.length} incident(s) logged during this shift.`);
    for (const inc of incidents) {
      lines.push(`  - ${inc.reference}: ${inc.type.replace(/_/g, " ")} (${inc.severity}) — ${getYPName(inc.child_id)}`);
    }
    lines.push("");
  }

  if (medsMissed > 0 || medsRefused > 0) {
    const parts: string[] = [];
    if (medsMissed > 0) parts.push(`${medsMissed} missed`);
    if (medsRefused > 0) parts.push(`${medsRefused} refused`);
    lines.push(`Medication: ${medsGiven} administered, ${parts.join(", ")}.`);
    lines.push("");
  } else if (medsGiven > 0) {
    lines.push(`Medication: All ${medsGiven} administered successfully.`);
    lines.push("");
  }

  if (missing.length > 0) {
    lines.push(`MISSING FROM CARE: ${missing.length} episode(s) reported during this shift.`);
    lines.push("");
  }

  for (const yp of ypSummary) {
    if (yp.entries_count > 0) {
      const moodStr = yp.mood_score !== undefined ? ` Mood: ${yp.mood_score}/10.` : "";
      lines.push(`${yp.name}: ${yp.entries_count} log entries.${moodStr}`);
    }
  }

  if (tasks.length > 0) {
    lines.push("");
    lines.push(`${tasks.length} task(s) completed.`);
  }

  const summary: ShiftSummary = {
    date,
    shift_type: shiftType,
    staff_on_shift: staffOnShift,
    young_people: ypSummary,
    events,
    stats: {
      total_events: events.length,
      incidents_logged: incidents.length,
      medications_given: medsGiven,
      medications_missed: medsMissed + medsRefused,
      daily_log_entries: logs.length,
      tasks_completed: tasks.length,
      missing_episodes: missing.length,
    },
    auto_notes: lines.join("\n"),
  };

  return NextResponse.json({ data: summary });
}
