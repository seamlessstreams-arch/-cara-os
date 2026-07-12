// ══════════════════════════════════════════════════════════════════════════════
// CARA — TASK-SERVICE DEMO FALLBACK (Phase 2 · Operational Control · write-path)
//
// task-service.ts is Supabase-only, so in the demo (no Supabase) every write
// returned "Supabase not configured" — the whole operations/tasks surface was
// DEAD, while /v1/tasks worked against the in-memory db.tasks. Two task
// surfaces, two backings, one broken.
//
// This is the dual-mode fallback (the repo's proven pattern for its ~6 dual DAL
// entities): when Supabase is off, task-service delegates here, which reads and
// writes the SAME db.tasks store /v1 uses — so both surfaces converge on one
// collection and the previously-dead write paths come alive. The store is
// runtime-untyped, and its Task shape is a near-superset of CsTask (home_id,
// reference, requires_sign_off, signed_off_by/at, completed_by, evidence_note,
// links all present), so CsTask rows persist and read back faithfully.
//
// Supabase mode is UNTOUCHED — task-service only calls in here when sb() is null.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type {
  CsTask, CsTaskCategory, CsTaskPriority, CsTaskStatus, ServiceResult,
} from "@/types/operations";

// db.tasks rows are Partial<Task> at runtime; treat them as CsTask carriers.
type Row = Record<string, unknown> & { id: string };

function asCsTask(row: Row): CsTask {
  return row as unknown as CsTask;
}

let refCounter = 0;
function reference(category: CsTaskCategory): string {
  const prefix = category.slice(0, 3).toUpperCase();
  refCounter = (refCounter + 1) % 1000;
  return `${prefix}-${String(refCounter).padStart(3, "0")}`;
}

export function listTasksFromStore(
  homeId: string,
  opts?: {
    status?: CsTaskStatus | CsTaskStatus[];
    category?: CsTaskCategory;
    priority?: CsTaskPriority;
    assigned_to?: string;
    linked_child_id?: string;
    overdue_only?: boolean;
    limit?: number;
  },
): ServiceResult<CsTask[]> {
  const today = new Date().toISOString().slice(0, 10);
  let rows = (db.tasks.findAll() as unknown as Row[]).filter(
    (r) => !r.home_id || r.home_id === homeId,
  );
  if (opts?.status) {
    const set = new Set(Array.isArray(opts.status) ? opts.status : [opts.status]);
    rows = rows.filter((r) => set.has(r.status as CsTaskStatus));
  }
  if (opts?.category) rows = rows.filter((r) => r.category === opts.category);
  if (opts?.priority) rows = rows.filter((r) => r.priority === opts.priority);
  if (opts?.assigned_to) rows = rows.filter((r) => r.assigned_to === opts.assigned_to);
  if (opts?.linked_child_id) rows = rows.filter((r) => r.linked_child_id === opts.linked_child_id);
  if (opts?.overdue_only) {
    rows = rows.filter(
      (r) => r.due_date && String(r.due_date) < today && r.status !== "completed" && r.status !== "cancelled",
    );
  }
  rows = rows
    .slice()
    .sort((a, b) => String(a.due_date ?? "9999").localeCompare(String(b.due_date ?? "9999")))
    .slice(0, opts?.limit ?? 100);
  return { ok: true, data: rows.map(asCsTask) };
}

export function getTaskFromStore(taskId: string): ServiceResult<CsTask> {
  const row = db.tasks.findById(taskId) as Row | undefined;
  if (!row) return { ok: false, error: "Task not found" };
  return { ok: true, data: asCsTask(row) };
}

export function createTaskInStore(input: {
  homeId: string;
  title: string;
  description?: string;
  category: CsTaskCategory;
  priority?: CsTaskPriority;
  assigned_to?: string;
  assigned_role?: string;
  due_date?: string;
  requires_sign_off?: boolean;
  linked_child_id?: string;
  linked_incident_id?: string;
  cara_generated?: boolean;
  cara_source?: string;
  created_by: string;
  [k: string]: unknown;
}): ServiceResult<CsTask> {
  const row = db.tasks.create({
    home_id: input.homeId,
    reference: reference(input.category),
    title: input.title,
    description: input.description ?? "",
    category: input.category as never,
    priority: (input.priority ?? "medium") as never,
    status: "not_started" as never,
    assigned_to: input.assigned_to ?? null,
    assigned_role: (input.assigned_role ?? null) as never,
    due_date: input.due_date ?? null,
    requires_sign_off: input.requires_sign_off ?? false,
    signed_off_by: null,
    linked_child_id: input.linked_child_id ?? null,
    linked_incident_id: input.linked_incident_id ?? null,
    cara_generated: input.cara_generated ?? false,
    cara_source: input.cara_source ?? null,
    created_by: input.created_by,
  } as never) as unknown as Row;
  return { ok: true, data: asCsTask(row) };
}

export function updateTaskInStore(taskId: string, updates: Record<string, unknown>): ServiceResult<CsTask> {
  const row = db.tasks.update(taskId, updates as never) as unknown as Row | null;
  if (!row) return { ok: false, error: "Task not found" };
  return { ok: true, data: asCsTask(row) };
}

/** Complete → honours requires_sign_off (awaiting_sign_off vs completed). */
export function completeTaskInStore(taskId: string, userId: string, evidenceNote?: string): ServiceResult<CsTask> {
  const existing = db.tasks.findById(taskId) as Row | undefined;
  if (!existing) return { ok: false, error: "Task not found" };
  const awaits = existing.requires_sign_off === true;
  const row = db.tasks.update(taskId, {
    status: (awaits ? "awaiting_sign_off" : "completed") as never,
    completed_at: awaits ? null : new Date().toISOString(),
    completed_by: awaits ? null : userId,
    evidence_note: evidenceNote ?? (existing.evidence_note as string | null) ?? null,
  } as never) as unknown as Row | null;
  return row ? { ok: true, data: asCsTask(row) } : { ok: false, error: "Task not found" };
}

/** Sign-off → the single confirming write: marks signed_off_by + completed. */
export function signOffTaskInStore(taskId: string, userId: string): ServiceResult<CsTask> {
  const now = new Date().toISOString();
  const row = db.tasks.update(taskId, {
    status: "completed" as never,
    signed_off_by: userId,
    signed_off_at: now,
    completed_at: now,
    completed_by: userId,
  } as never) as unknown as Row | null;
  return row ? { ok: true, data: asCsTask(row) } : { ok: false, error: "Task not found" };
}
