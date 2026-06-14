import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr, daysFromNow } from "@/lib/utils";

export interface StaffHandoverContext {
  staff_id: string;
  staff_name: string;
  last_shift_date: string | null;
  days_since_last_shift: number | null;
  context_depth: "brief" | "standard" | "comprehensive";
  missed_events: {
    incidents: number;
    daily_logs: number;
    missing_episodes: number;
    medication_issues: number;
    tasks_completed: number;
  };
  aria_summary: string;
}

function getStaffName(staffId: string): string {
  const s = db.staff.findAll().find((st) => st.id === staffId);
  return s ? s.full_name : "Unknown";
}

function getYPName(childId: string): string {
  const yp = db.youngPeople.findAll().find((y) => y.id === childId);
  return yp ? (yp.preferred_name || yp.first_name) : "Unknown";
}

function contextDepth(days: number | null): "brief" | "standard" | "comprehensive" {
  if (days === null || days >= 4) return "comprehensive";
  if (days >= 2) return "standard";
  return "brief";
}

function buildCaraSummary(
  staffName: string,
  days: number | null,
  sinceDate: string | null,
  depth: "brief" | "standard" | "comprehensive"
): string {
  const today = todayStr();
  const firstName = staffName.split(" ")[0];

  const incidents = sinceDate
    ? db.incidents.findAll().filter((i) => i.date > sinceDate && i.date <= today)
    : [];
  const logs = sinceDate
    ? db.dailyLog.findAll().filter((l) => l.date > sinceDate && l.date <= today)
    : [];
  const currentYP = db.youngPeople.findAll().filter((yp) => yp.status === "current");

  const lines: string[] = [];

  if (days === null) {
    lines.push(`${firstName} has no recent shift history — providing full context.`);
  } else if (days === 0) {
    lines.push(`${firstName} was on shift earlier today — brief update only.`);
  } else if (days === 1) {
    lines.push(`${firstName} was on shift yesterday — standard update.`);
  } else {
    lines.push(`${firstName} was last on shift ${days} day${days > 1 ? "s" : ""} ago — expanded context below.`);
  }
  lines.push("");

  if (depth === "brief") {
    lines.push("No major changes since your last shift. Check today's daily log for minor updates.");
    return lines.join("\n");
  }

  // Incidents since last shift
  if (incidents.length > 0) {
    lines.push(`⚠ ${incidents.length} incident${incidents.length > 1 ? "s" : ""} since you were last in:`);
    for (const inc of incidents.slice(0, 5)) {
      const sev = inc.severity === "critical" ? "🔴" : inc.severity === "high" ? "🟠" : "🟡";
      lines.push(`  ${sev} ${inc.reference} — ${inc.type.replace(/_/g, " ")} (${getYPName(inc.child_id)}, ${inc.date})`);
      if (depth === "comprehensive" && inc.description) {
        lines.push(`     ${inc.description.slice(0, 100)}${inc.description.length > 100 ? "..." : ""}`);
      }
    }
    lines.push("");
  }

  // Per-YP summary for comprehensive
  if (depth === "comprehensive") {
    lines.push("Young people summary:");
    for (const yp of currentYP) {
      const ypLogs = logs.filter((l) => l.child_id === yp.id);
      const ypIncidents = incidents.filter((i) => i.child_id === yp.id);
      const significantLogs = ypLogs.filter((l) => l.is_significant);
      const name = yp.preferred_name || yp.first_name;

      if (ypLogs.length === 0 && ypIncidents.length === 0) {
        lines.push(`  ${name}: No significant changes.`);
      } else {
        const parts: string[] = [];
        if (ypIncidents.length > 0) parts.push(`${ypIncidents.length} incident(s)`);
        if (significantLogs.length > 0) parts.push(`${significantLogs.length} significant log(s)`);
        if (ypLogs.length > 0) parts.push(`${ypLogs.length} total entries`);
        lines.push(`  ${name}: ${parts.join(", ")}`);

        // Include the most significant note
        const keyLog = significantLogs[significantLogs.length - 1] || ypLogs[ypLogs.length - 1];
        if (keyLog?.content) {
          lines.push(`     Latest: ${keyLog.content.slice(0, 80)}${keyLog.content.length > 80 ? "..." : ""}`);
        }
      }
    }
    lines.push("");
  }

  // Key tasks completed
  const completedTasks = db.tasks.findAll().filter((t) => {
    if (t.status !== "completed" || !t.completed_at) return false;
    const completedDate = t.completed_at.slice(0, 10);
    return sinceDate ? completedDate > sinceDate && completedDate <= today : false;
  });

  if (completedTasks.length > 0) {
    lines.push(`✓ ${completedTasks.length} task${completedTasks.length > 1 ? "s" : ""} completed while you were away:`);
    for (const t of completedTasks.slice(0, 3)) {
      lines.push(`  - ${t.title}`);
    }
    lines.push("");
  }

  // Pending urgent items
  const urgentPending = db.tasks.findAll().filter(
    (t) => t.status !== "completed" && t.status !== "cancelled" && (t.priority === "urgent" || t.priority === "high")
  );
  if (urgentPending.length > 0) {
    lines.push(`📋 ${urgentPending.length} urgent/high priority task${urgentPending.length > 1 ? "s" : ""} still pending.`);
  }

  return lines.join("\n");
}

// GET /api/v1/handover/staff-context?staff_ids=staff_anna,staff_mirela
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const staffIdsParam = searchParams.get("staff_ids") || "";
  const staffIds = staffIdsParam.split(",").filter(Boolean);

  if (staffIds.length === 0) {
    return NextResponse.json({ error: "staff_ids query param required" }, { status: 400 });
  }

  const today = todayStr();
  const results: StaffHandoverContext[] = [];

  for (const staffId of staffIds) {
    const shifts = db.shifts.findByStaff(staffId)
      .filter((s) => s.date < today && s.status === "completed")
      .sort((a, b) => b.date.localeCompare(a.date));

    const lastShiftDate = shifts.length > 0 ? shifts[0].date : null;

    let daysSince: number | null = null;
    if (lastShiftDate) {
      const last = new Date(lastShiftDate);
      const now = new Date(today);
      daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Also check if they're on shift today
    const onShiftToday = db.shifts.findToday().some((s) => s.staff_id === staffId);
    if (onShiftToday) {
      daysSince = 0;
    }

    const depth = contextDepth(daysSince);

    // Count events since last shift
    const sinceDate = lastShiftDate;
    const incidentsSince = sinceDate
      ? db.incidents.findAll().filter((i) => i.date > sinceDate && i.date <= today).length
      : db.incidents.findAll().length;
    const logsSince = sinceDate
      ? db.dailyLog.findAll().filter((l) => l.date > sinceDate && l.date <= today).length
      : db.dailyLog.findAll().length;
    const missingSince = sinceDate
      ? db.missingEpisodes.findAll().filter((m) => m.created_at?.slice(0, 10) > sinceDate).length
      : 0;
    const tasksDone = sinceDate
      ? db.tasks.findAll().filter((t) => t.status === "completed" && t.completed_at && t.completed_at.slice(0, 10) > sinceDate).length
      : 0;

    results.push({
      staff_id: staffId,
      staff_name: getStaffName(staffId),
      last_shift_date: lastShiftDate,
      days_since_last_shift: daysSince,
      context_depth: depth,
      missed_events: {
        incidents: incidentsSince,
        daily_logs: logsSince,
        missing_episodes: missingSince,
        medication_issues: 0,
        tasks_completed: tasksDone,
      },
      aria_summary: buildCaraSummary(getStaffName(staffId), daysSince, sinceDate, depth),
    });
  }

  return NextResponse.json({ data: results });
}
