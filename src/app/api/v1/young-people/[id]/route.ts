import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { dal } from "@/lib/db/dal";
import { todayStr } from "@/lib/utils";
import { readJsonBody } from "@/lib/http/read-json";
import { withShiftAccess } from "@/lib/permissions/with-shift-access";

export const dynamic = "force-dynamic";

function calcAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Child-record view — guarded by the real permission engine (shift-based access +
// role rules). Managers keep access off shift; off-shift general staff get 403.
async function getYoungPerson(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Dual-mode: the 6 converted core entities (young person, staff, incidents, tasks,
  // medications, daily log, care forms) read from their real Supabase tables when
  // enabled, the in-memory store otherwise. Chronology + missing-episodes stay on the
  // store until their own batches (their writes aren't yet write-through to Supabase).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yp = (await dal.youngPeople.findById(id)) as any;
  if (!yp) return NextResponse.json({ error: "Young person not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allStaff   = (await dal.staff.findAll()) as any[];
  const today      = todayStr();

  const keyWorker       = yp.key_worker_id ? (allStaff.find((s) => s.id === yp.key_worker_id) ?? null) : null;
  const secondaryWorker = yp.secondary_worker_id ? (allStaff.find((s) => s.id === yp.secondary_worker_id) ?? null) : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const incidents        = ((await dal.incidents.findAll()) as any[]).filter((i) => i.child_id === id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasks            = ((await dal.tasks.findAll()) as any[]).filter((t) => t.linked_child_id === id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const medications      = (await dal.medications.findByChild(id)) as any[];
  const missingEpisodes  = db.missingEpisodes.findByChild(id);
  const chronology       = db.chronology.findByChild(id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const careForms        = ((await dal.careForms.findAll()) as any[]).filter((f) => f.linked_child_id === id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dailyLog         = ((await dal.dailyLog.findByChild(id)) as any[]).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  return NextResponse.json({
    data: {
      ...yp,
      age:                   calcAge(yp.date_of_birth),
      key_worker:            keyWorker,
      secondary_worker:      secondaryWorker,
      open_incidents:        incidents.filter((i) => i.status === "open").length,
      active_tasks:          tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length,
      active_medications:    medications.filter((m) => m.is_active).length,
      missing_episodes_total: missingEpisodes.length,
      // Defensive: a freshly-created child or a live Postgres row may carry null
      // rather than an empty array — never 500 the record view over it.
      risk_flags_count:      (yp.risk_flags ?? []).length,
      last_log_date:         dailyLog[0]?.date ?? null,
    },
    related: {
      incidents:       incidents.sort((a, b) => b.date.localeCompare(a.date)),
      tasks:           tasks.filter((t) => t.status !== "completed").sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? "")),
      medications:     medications.filter((m) => m.is_active),
      missing_episodes: missingEpisodes.sort((a, b) => b.date_missing.localeCompare(a.date_missing)),
      chronology:      chronology,
      care_forms:      careForms.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
      recent_log:      dailyLog,
    },
    meta: {
      today,
      total_incidents: incidents.length,
      open_incidents:  incidents.filter((i) => i.status === "open").length,
      total_tasks:     tasks.length,
      active_tasks:    tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length,
    },
  });
}

export const GET = withShiftAccess("child_record", "view", getYoungPerson);

// GET-computed / joined fields the response adds on the way out — a PATCH that
// echoes the record back must never try to write these onto the row.
const DERIVED_FIELDS = new Set([
  "age", "key_worker", "secondary_worker", "open_incidents", "active_tasks",
  "active_medications", "missing_episodes_total", "risk_flags_count", "last_log_date",
]);
// Identity + tenancy are fixed once a child is admitted.
const IMMUTABLE_FIELDS = new Set(["id", "home_id", "created_at", "created_by"]);

// PATCH /api/v1/young-people/:id — edit a child's record.
// Dual-mode + durable on live: dal.youngPeople.update writes the real
// young_people table when Supabase is enabled, the in-memory store otherwise.
// Guarded by the permission engine (child_record / edit): general staff need an
// active shift + assignment; managers keep access off shift.
async function updateYoungPerson(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = await dal.youngPeople.findById(id);
  if (!existing) return NextResponse.json({ error: "Young person not found" }, { status: 404 });

  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;

  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (k === "actor_id" || DERIVED_FIELDS.has(k) || IMMUTABLE_FIELDS.has(k)) continue;
    patch[k] = v;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No editable fields supplied." }, { status: 400 });
  }
  patch.updated_by = req.headers.get("x-user-id") || (body.actor_id as string) || "staff_darren";

  const updated = await dal.youngPeople.update(id, patch);
  if (!updated) return NextResponse.json({ error: "Young person not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}

// DELETE /api/v1/young-people/:id — a SOFT archive, never a hard delete: a
// looked-after child's record is not destroyed. It ends the placement (status
// "ended", placement_end = today) so the child leaves the current roster while
// the full history is preserved. Gated as an "edit" — ending a placement is a
// status change on the record, not a privileged destroy no role is granted.
async function archiveYoungPerson(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = await dal.youngPeople.findById(id);
  if (!existing) return NextResponse.json({ error: "Young person not found" }, { status: 404 });

  const updated = await dal.youngPeople.update(id, {
    status: "ended",
    placement_end: todayStr(),
    updated_by: req.headers.get("x-user-id") || "staff_darren",
  });
  if (!updated) return NextResponse.json({ error: "Young person not found" }, { status: 404 });
  return NextResponse.json({ data: updated, archived: true });
}

export const PATCH = withShiftAccess("child_record", "edit", updateYoungPerson);
export const DELETE = withShiftAccess("child_record", "edit", archiveYoungPerson);
