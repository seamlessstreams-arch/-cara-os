// CARA — Plan My Day API
//   GET  → deterministic plan from the store + today's calendar
//   POST → same, plus ad-hoc items the manager pasted/dictated ({ notes })
// An optional AI narrative sits on top; the plan stands alone without it.
import { readJsonBody } from "@/lib/http/read-json";
import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { getCalendarFeed } from "@/lib/calendar/calendar-service";
import { computeManagerPlanDay, type PlanMyDayInput, type ManagerPlanDayResult } from "@/lib/engines/manager-plan-my-day-engine";
import { parsePlanNotes } from "@/lib/plan/plan-notes";
import { generateReportNarrative } from "@/lib/cara/report-narrative";

export const dynamic = "force-dynamic";

const FIXED_EXCLUDE = new Set(["task", "training", "shift"]);

/** Assemble the engine input from the live store + today's calendar feed. */
function gatherPlanInput(addedItems: PlanMyDayInput["addedItems"]): PlanMyDayInput {
  const store = getStore();
  const nowDate = new Date();
  const today = nowDate.toISOString().slice(0, 10);
  const now = nowDate.toISOString();

  const ypById = new Map(store.youngPeople.map((y) => [y.id, y.preferred_name || y.first_name || "Unknown"]));
  const staffById = new Map(store.staff.map((s) => [s.id, s.full_name || `${s.first_name} ${s.last_name}`.trim()]));

  // ── Fixed commitments: today's calendar minus task/training/shift noise ──
  const feed = getCalendarFeed({ from: today, to: today });
  const calendar = feed.items
    .filter((i) => !FIXED_EXCLUDE.has(i.source))
    .map((i) => ({
      id: i.id,
      title: i.title,
      start: i.start,
      all_day: i.all_day,
      source: i.source,
      child_name: i.child_name,
      location: i.location,
      href: i.editable ? `/calendar?event=${i.source_id}` : i.href,
    }));

  const tasks = store.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date,
    status: t.status,
    priority: t.priority,
    child_name: t.linked_child_id ? ypById.get(t.linked_child_id) ?? null : null,
  }));

  const incidents = store.incidents.map((i) => ({
    id: i.id,
    child_name: i.child_id ? ypById.get(i.child_id) ?? null : null,
    type: i.type,
    severity: i.severity,
    date: i.date,
    requires_oversight: i.requires_oversight,
    oversight_at: i.oversight_at,
    status: i.status,
  }));

  const supervisions = store.supervisions.map((s) => ({
    staff_name: staffById.get(s.staff_id) ?? null,
    scheduled_date: s.scheduled_date,
    status: s.status,
  }));

  const training = store.trainingRecords.map((t) => ({
    staff_name: staffById.get(t.staff_id) ?? null,
    course_name: t.course_name,
    expiry_date: t.expiry_date,
    status: t.status,
  }));

  // ── Key-working gaps: last session per active child ──
  const lastByChild = new Map<string, string>();
  for (const s of store.keyWorkingSessions) {
    const cur = lastByChild.get(s.child_id);
    if (!cur || s.date > cur) lastByChild.set(s.child_id, s.date);
  }
  const todayMs = Date.parse(`${today}T00:00:00`);
  const keyworkGaps = store.youngPeople
    .filter((y) => y.status === "current")
    .map((y) => {
      const last = lastByChild.get(y.id) ?? null;
      const days = last ? Math.floor((todayMs - Date.parse(`${last}T00:00:00`)) / 864e5) : null;
      return { child_name: ypById.get(y.id) ?? "Unknown", last_session_date: last, days_since: days };
    });

  // Start the timed plan from "now" (rounded) so it reflects the day remaining.
  const scheduleFrom = `${String(nowDate.getHours()).padStart(2, "0")}:${String(nowDate.getMinutes()).padStart(2, "0")}`;

  return { today, now, calendar, tasks, incidents, supervisions, training, keyworkGaps, scheduleFrom, addedItems };
}

/** Attach an optional AI narrative (graceful: stays null when no key is set). */
async function attachNarrative(plan: ManagerPlanDayResult): Promise<void> {
  try {
    const facts = [
      `Fixed today: ${plan.fixed.map((f) => `${f.time ?? "all day"} ${f.title}`).join("; ") || "nothing scheduled"}`,
      ...(plan.added.length ? [`Added by the manager for today: ${plan.added.map((a) => a.title).join("; ")}`] : []),
      ...plan.priorities.slice(0, 10).map((p) => `- ${p.severity.toUpperCase()} (${p.category}): ${p.title}`),
    ].join("\n");
    plan.ai_narrative = await generateReportNarrative({
      kind: "manager's daily plan for a children's home",
      subject: `the home on ${plan.date}`,
      facts,
    });
  } catch {
    plan.ai_narrative = null;
  }
}

export async function GET() {
  const plan = computeManagerPlanDay(gatherPlanInput([]));
  await attachNarrative(plan);
  return NextResponse.json({ data: plan });
}

export async function POST(req: Request) {
  let addedItems: PlanMyDayInput["addedItems"] = [];
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    if (typeof body?.notes === "string" && body.notes.trim()) {
      addedItems = parsePlanNotes(body.notes).map((p) => ({ title: p.title, time: p.time, duration_min: p.duration_min }));
    } else if (Array.isArray(body?.addedItems)) {
      addedItems = body.addedItems
        .filter((i: unknown): i is { title: string } => !!i && typeof (i as { title?: unknown }).title === "string")
        .map((i: { title: string; time?: string | null; duration_min?: number }) => ({ title: i.title, time: i.time ?? null, duration_min: i.duration_min }));
    }
  } catch {
    addedItems = [];
  }
  const plan = computeManagerPlanDay(gatherPlanInput(addedItems));
  await attachNarrative(plan);
  return NextResponse.json({ data: plan });
}
