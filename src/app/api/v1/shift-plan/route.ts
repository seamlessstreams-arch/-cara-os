// CARA — GET /api/v1/shift-plan?date=YYYY-MM-DD&period=day|night
// Deterministic Cara-generated plan for an upcoming shift, with an optional
// Cara narrative on top. Reads the live store like every other engine route.
import { NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { getStaffName } from "@/lib/seed-data";
import { getCalendarFeed } from "@/lib/calendar/calendar-service";
import { computeShiftPlan, type ShiftPeriod, type ShiftPlanChildWatchInput } from "@/lib/engines/shift-plan-engine";
import { generateReportNarrative } from "@/lib/cara/report-narrative";

export const dynamic = "force-dynamic";

const EVENT_EXCLUDE = new Set(["task", "training", "shift"]);

function nextDay(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + 864e5).toISOString().slice(0, 10);
}
function currentPeriod(now: Date): ShiftPeriod {
  const h = now.getHours();
  return h >= 20 || h < 8 ? "night" : "day";
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const now = new Date();
  const date = url.searchParams.get("date") || now.toISOString().slice(0, 10);
  const period = (url.searchParams.get("period") as ShiftPeriod) || currentPeriod(now);

  const [allYoungPeople, allShifts, allTasks, allMedications, allIncidents, allMissingEpisodes] = await Promise.all([
    safeList(dal.youngPeople.findAll()),
    safeList(dal.shifts.findAll()),
    safeList(dal.tasks.findAll()),
    safeList(dal.medications.findAll()),
    safeList(dal.incidents.findAll()),
    safeList(dal.missingEpisodes.findAll()),
  ]);

  const yp = (allYoungPeople).filter((c: any) => c.status === "current");
  const ypName = (id: any) => {
    const c = yp.find((x: any) => String(x.id) === String(id));
    return c ? c.preferred_name || c.first_name || "Unknown" : null;
  };

  // ── On shift (date + period) ──
  const isNightType = (t: string) => /night|waking|sleep/i.test(t || "");
  const onShift = (allShifts)
    .filter((s: any) => String(s.date).slice(0, 10) === date && s.status !== "cancelled" && s.status !== "no_show")
    .filter((s: any) => (period === "night" ? isNightType(s.shift_type) : !isNightType(s.shift_type)))
    .map((s: any) => ({ staff_name: getStaffName(s.staff_id) || String(s.staff_id), role: s.shift_type ?? null, shift_type: s.shift_type ?? null }));

  // ── Staffing (deterministic read) ──
  const onCount = onShift.length;
  const minimum = period === "night" ? 1 : 2;
  const shortfall = Math.max(0, minimum - onCount);
  const isUnderstaffed = shortfall > 0;
  const hasWaking = (allShifts).some(
    (s: any) => String(s.date).slice(0, 10) === date && /waking/i.test(s.shift_type || "") && s.status !== "cancelled",
  );
  const severity: "ok" | "high" | "critical" = onCount === 0 || shortfall >= 2 ? "critical" : shortfall > 0 ? "high" : "ok";
  const alerts: { type: string; severity: string; message: string }[] = [];
  if (onCount === 0) alerts.push({ type: "no_cover", severity: "critical", message: "No staff scheduled for this shift" });
  else if (isUnderstaffed) alerts.push({ type: "understaffed", severity: "high", message: `${shortfall} short of the minimum (${minimum})` });
  if (period === "night" && !hasWaking) alerts.push({ type: "no_waking_night", severity: "high", message: "No waking-night cover scheduled — confirm arrangements" });

  // ── Window events (calendar, excluding task/training/shift) ──
  const feed = getCalendarFeed({ from: date, to: nextDay(date) });
  const events = feed.items
    .filter((i) => !EVENT_EXCLUDE.has(i.source))
    .map((i) => ({ id: i.id, start: i.start, title: i.title, child_name: i.child_name, kind: i.source }));

  // ── Tasks ──
  const tasks = (allTasks).map((t: any) => ({
    id: String(t.id),
    title: t.title ?? "Task",
    priority: t.priority ?? "medium",
    due_date: t.due_date ?? null,
    status: t.status ?? "not_started",
    child_name: ypName(t.linked_child_id ?? t.child_id),
  }));

  // ── Medications (active today) ──
  const medications = (allMedications)
    .filter((m: any) => {
      if (m.is_active === false) return false;
      const start = m.start_date ? String(m.start_date).slice(0, 10) : null;
      const end = m.end_date ? String(m.end_date).slice(0, 10) : null;
      if (start && start > date) return false;
      if (end && end < date) return false;
      return true;
    })
    .map((m: any) => ({ child_name: ypName(m.child_id), name: m.name ?? "Medication", frequency: m.frequency ?? null, prn: String(m.type ?? "").toLowerCase() === "prn" }));

  // ── Per-child watch-points (recent incidents + active missing) ──
  const threeDaysAgo = new Date(Date.parse(`${date}T00:00:00Z`) - 3 * 864e5).toISOString().slice(0, 10);
  const watch: ShiftPlanChildWatchInput[] = yp.map((c: any) => {
    const flags: string[] = [];
    const recentIncidents = (allIncidents).filter(
      (i: any) => String(i.child_id) === String(c.id) && String(i.date).slice(0, 10) >= threeDaysAgo && String(i.date).slice(0, 10) <= date,
    );
    for (const inc of recentIncidents.slice(0, 2)) flags.push(`Recent incident: ${String(inc.type).replace(/_/g, " ")}`);
    const activeMissing = (allMissingEpisodes).some(
      (e: any) => String(e.child_id) === String(c.id) && !e.date_returned,
    );
    if (activeMissing) flags.push("Currently missing — follow protocol");
    return { child_name: c.preferred_name || c.first_name || "Unknown", flags };
  });

  const plan = computeShiftPlan({
    date,
    period,
    now: now.toISOString(),
    onShift,
    staffing: { on_shift_count: onCount, minimum_required: minimum, shortfall, is_understaffed: isUnderstaffed, has_waking_night: hasWaking, no_night_cover: period === "night" && onCount === 0, severity, alerts },
    events,
    tasks,
    medications,
    watch,
  });

  // ── Optional Cara narrative ──
  let ai_narrative: string | null = null;
  try {
    const facts = [
      `${plan.period_label} (${plan.window_label}) on ${date}.`,
      `On shift: ${plan.on_shift.map((s) => s.staff_name).join(", ") || "no one scheduled"}.`,
      `Staffing: ${plan.staffing.line}`,
      `Scheduled: ${plan.running_order.map((r) => `${r.time} ${r.title}`).join("; ") || "nothing booked"}.`,
      `Must do: ${plan.must_do.map((m) => m.title).join("; ") || "nothing outstanding"}.`,
      `Watch: ${plan.young_people.map((w) => `${w.child_name} (${w.flags.join(", ")})`).join("; ") || "no active concerns"}.`,
      plan.medications.summary,
    ].join("\n");
    ai_narrative = await generateReportNarrative({ kind: "children's home shift plan", subject: `the ${plan.period} shift on ${date}`, facts });
  } catch {
    ai_narrative = null;
  }
  plan.ai_narrative = ai_narrative;

  return NextResponse.json({ data: plan });
}
