import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════════════════════
// ACTIVITY FEED API
// Aggregates the most recent events from across the system into a single
// time-ordered feed. Used on the dashboard for real-time awareness.
// ══════════════════════════════════════════════════════════════════════════════

interface FeedItem {
  id: string;
  type: "incident" | "task" | "daily_log" | "medication" | "handover" | "safeguarding" | "training" | "document" | "shift" | "form";
  action: string;
  title: string;
  description: string;
  timestamp: string;
  actor_id?: string;
  child_id?: string;
  severity?: "critical" | "high" | "medium" | "low" | "info";
  href: string;
}

export async function GET(_req: NextRequest) {
  const feed: FeedItem[] = [];
  const today = todayStr();

  // ── Incidents (recent) ─────────────────────────────────────────────────
  db.incidents.findAll()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 8)
    .forEach((inc) => {
      const typeLabel = inc.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      feed.push({
        id: `inc_${inc.id}`,
        type: "incident",
        action: inc.status === "closed" ? "Incident closed" : "Incident logged",
        title: `${inc.reference} — ${typeLabel}`,
        description: inc.description?.slice(0, 120) || typeLabel,
        timestamp: (inc.date || today) + "T" + (inc.time || "00:00"),
        actor_id: inc.reported_by,
        child_id: inc.child_id || undefined,
        severity: inc.severity as FeedItem["severity"],
        href: `/incidents`,
      });
    });

  // ── Tasks (recently completed or created) ──────────────────────────────
  db.tasks.findAll()
    .sort((a, b) => (b.completed_at || b.created_at || "").localeCompare(a.completed_at || a.created_at || ""))
    .slice(0, 8)
    .forEach((task) => {
      const isComplete = task.status === "completed";
      feed.push({
        id: `task_${task.id}`,
        type: "task",
        action: isComplete ? "Task completed" : task.status === "in_progress" ? "Task in progress" : "Task created",
        title: task.title,
        description: task.description?.slice(0, 100) || task.category?.replace(/_/g, " ") || "",
        timestamp: (isComplete ? task.completed_at : task.created_at) || today + "T00:00",
        actor_id: isComplete ? task.completed_by || task.assigned_to || undefined : task.assigned_to || undefined,
        child_id: task.linked_child_id || undefined,
        severity: "info",
        href: `/tasks/${task.id}`,
      });
    });

  // ── Daily log entries ──────────────────────────────────────────────────
  db.dailyLog.findAll()
    .sort((a, b) => ((b.date || "") + (b.time || "")).localeCompare((a.date || "") + (a.time || "")))
    .slice(0, 6)
    .forEach((log) => {
      const typeLabel = log.entry_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      feed.push({
        id: `log_${log.id}`,
        type: "daily_log",
        action: `Daily log — ${typeLabel}`,
        title: `${typeLabel} entry recorded`,
        description: log.content?.slice(0, 100) || "",
        timestamp: (log.date || today) + "T" + (log.time || "00:00"),
        actor_id: log.staff_id,
        child_id: log.child_id,
        severity: log.is_significant ? "medium" : "info",
        href: `/daily-log`,
      });
    });

  // ── Medication administrations ─────────────────────────────────────────
  db.medicationAdministrations.findAll()
    .sort((a, b) => (b.scheduled_time || "").localeCompare(a.scheduled_time || ""))
    .slice(0, 6)
    .forEach((admin) => {
      const med = db.medications.findAll().find((m) => m.id === admin.medication_id);
      feed.push({
        id: `med_${admin.id}`,
        type: "medication",
        action: admin.status === "given" ? "Medication administered" : admin.status === "refused" ? "Medication refused" : "Medication missed",
        title: med?.name || "Medication",
        description: `${admin.status === "given" ? "Administered" : admin.status} at ${admin.scheduled_time.split("T")[1]?.slice(0, 5) || "—"}`,
        timestamp: admin.actual_time || admin.scheduled_time || today + "T00:00",
        actor_id: admin.administered_by || undefined,
        child_id: admin.child_id,
        severity: admin.status === "missed" ? "high" : admin.status === "refused" ? "medium" : "info",
        href: `/medication`,
      });
    });

  // ── Handovers ──────────────────────────────────────────────────────────
  db.handovers.findAll()
    .sort((a, b) => (b.shift_date || "").localeCompare(a.shift_date || ""))
    .slice(0, 3)
    .forEach((h) => {
      const shiftLabel = h.shift_from.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      feed.push({
        id: `handover_${h.id}`,
        type: "handover",
        action: "Handover completed",
        title: `${shiftLabel} handover`,
        description: h.general_notes?.slice(0, 100) || `Shift handover from ${h.shift_from} to ${h.shift_to}`,
        timestamp: (h.shift_date || today) + "T" + (h.handover_time || "00:00"),
        actor_id: h.created_by,
        severity: (h.flags?.length ?? 0) > 0 ? "medium" : "info",
        href: `/handover`,
      });
    });

  // ── Missing from care ──────────────────────────────────────────────────
  db.missingEpisodes.findAll()
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .slice(0, 3)
    .forEach((ep) => {
      feed.push({
        id: `missing_${ep.id}`,
        type: "safeguarding",
        action: ep.status === "active" ? "Missing episode reported" : "Missing episode closed",
        title: `Missing from care — ${ep.status}`,
        description: ep.pattern_notes?.slice(0, 100) || "",
        timestamp: ep.created_at || today + "T00:00",
        child_id: ep.child_id,
        severity: ep.status === "active" ? "critical" : "medium",
        href: `/missing-from-care`,
      });
    });

  // ── Shifts starting today ──────────────────────────────────────────────
  db.shifts.findToday()
    .slice(0, 4)
    .forEach((shift) => {
      const typeLabel = shift.shift_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      feed.push({
        id: `shift_${shift.id}`,
        type: "shift",
        action: shift.status === "in_progress" ? "On shift now" : "Shift scheduled",
        title: `${typeLabel} shift`,
        description: `${shift.start_time} – ${shift.end_time}`,
        timestamp: (shift.date || today) + "T" + (shift.start_time || "00:00"),
        actor_id: shift.staff_id,
        severity: "info",
        href: `/rota`,
      });
    });

  // Sort all by timestamp descending, limit to 25
  feed.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const limited = feed.slice(0, 25);

  return NextResponse.json({ data: limited, meta: { total: limited.length } });
}
