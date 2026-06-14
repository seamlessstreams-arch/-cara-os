// ══════════════════════════════════════════════════════════════════════════════
// CARA — TASK EXPLORER SERVICE
// Full task lifecycle: create → assign → track → escalate → sign off.
// Supports Cara risk scoring, dependencies, recurrence, and delegation.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type {
  CsTask, CsTaskComment, CsTaskDependency, CsTaskEscalationRule,
  CsTaskCategory, CsTaskPriority, CsTaskStatus,
  ServiceResult,
} from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Reference generator ─────────────────────────────────────────────────────

let refCounter = 0;

export function generateTaskReference(category: CsTaskCategory): string {
  const prefix = CATEGORY_PREFIX[category] ?? "TSK";
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  refCounter = (refCounter + 1) % 1000;
  return `${prefix}-${timestamp}${String(refCounter).padStart(3, "0")}`;
}

const CATEGORY_PREFIX: Record<CsTaskCategory, string> = {
  compliance: "CMP",
  safeguarding: "SFG",
  medication: "MED",
  maintenance: "MNT",
  staffing: "STF",
  training: "TRN",
  supervision: "SUP",
  young_person_plans: "YPP",
  professional_communication: "COM",
  finance: "FIN",
  inspection: "INS",
  health_and_safety: "HSE",
  admin: "ADM",
  cara_generated: "ARA",
};

// ── Task CRUD ───────────────────────────────────────────────────────────────

export async function listTasks(
  homeId: string,
  opts?: {
    status?: CsTaskStatus | CsTaskStatus[];
    category?: CsTaskCategory;
    priority?: CsTaskPriority;
    assigned_to?: string;
    linked_child_id?: string;
    overdue_only?: boolean;
    limit?: number;
    offset?: number;
  },
): Promise<ServiceResult<CsTask[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_tasks") as SB).select("*").eq("home_id", homeId);

  if (opts?.status) {
    if (Array.isArray(opts.status)) {
      q = q.in("status", opts.status);
    } else {
      q = q.eq("status", opts.status);
    }
  }
  if (opts?.category) q = q.eq("category", opts.category);
  if (opts?.priority) q = q.eq("priority", opts.priority);
  if (opts?.assigned_to) q = q.eq("assigned_to", opts.assigned_to);
  if (opts?.linked_child_id) q = q.eq("linked_child_id", opts.linked_child_id);
  if (opts?.overdue_only) q = q.lt("due_date", new Date().toISOString()).not("status", "in", "(completed,cancelled)");

  q = q.order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: false })
    .limit(opts?.limit ?? 100);

  if (opts?.offset) q = q.range(opts.offset, opts.offset + (opts.limit ?? 100) - 1);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getTask(taskId: string): Promise<ServiceResult<CsTask>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_tasks") as SB)
    .select("*")
    .eq("id", taskId)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createTask(input: {
  homeId: string;
  title: string;
  description?: string;
  category: CsTaskCategory;
  priority?: CsTaskPriority;
  assigned_to?: string;
  assigned_role?: string;
  due_date?: string;
  start_date?: string;
  estimated_minutes?: number;
  recurring?: boolean;
  recurring_schedule?: string;
  requires_sign_off?: boolean;
  linked_child_id?: string;
  linked_incident_id?: string;
  linked_form_id?: string;
  linked_workflow_id?: string;
  parent_task_id?: string;
  tags?: string[];
  regulation_refs?: string[];
  cara_generated?: boolean;
  cara_source?: string;
  created_by: string;
}): Promise<ServiceResult<CsTask>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const reference = generateTaskReference(input.category);

  const { data, error } = await (s.from("cs_tasks") as SB)
    .insert({
      home_id: input.homeId,
      reference,
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      priority: input.priority ?? "medium",
      status: "not_started",
      assigned_to: input.assigned_to ?? null,
      assigned_role: input.assigned_role ?? null,
      due_date: input.due_date ?? null,
      start_date: input.start_date ?? null,
      estimated_minutes: input.estimated_minutes ?? null,
      recurring: input.recurring ?? false,
      recurring_schedule: input.recurring_schedule ?? null,
      requires_sign_off: input.requires_sign_off ?? false,
      linked_child_id: input.linked_child_id ?? null,
      linked_incident_id: input.linked_incident_id ?? null,
      linked_form_id: input.linked_form_id ?? null,
      linked_workflow_id: input.linked_workflow_id ?? null,
      parent_task_id: input.parent_task_id ?? null,
      tags: input.tags ?? [],
      regulation_refs: input.regulation_refs ?? [],
      cara_generated: input.cara_generated ?? false,
      cara_source: input.cara_source ?? null,
      created_by: input.created_by,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateTask(
  taskId: string,
  updates: Partial<Pick<CsTask,
    | "title" | "description" | "category" | "priority" | "status"
    | "assigned_to" | "assigned_role" | "due_date" | "start_date"
    | "estimated_minutes" | "actual_minutes" | "evidence_note"
    | "tags" | "regulation_refs"
  >>,
): Promise<ServiceResult<CsTask>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_tasks") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Task lifecycle ──────────────────────────────────────────────────────────

export async function startTask(
  taskId: string,
  userId: string,
): Promise<ServiceResult<CsTask>> {
  return updateTask(taskId, {
    status: "in_progress",
    start_date: new Date().toISOString(),
  } as Partial<CsTask>);
}

export async function completeTask(
  taskId: string,
  userId: string,
  evidenceNote?: string,
): Promise<ServiceResult<CsTask>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  // Check if sign-off is required
  const { data: task } = await (s.from("cs_tasks") as SB)
    .select("requires_sign_off")
    .eq("id", taskId)
    .single();

  const newStatus: CsTaskStatus = task?.requires_sign_off ? "awaiting_sign_off" : "completed";

  const { data, error } = await (s.from("cs_tasks") as SB)
    .update({
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      completed_by: newStatus === "completed" ? userId : null,
      evidence_note: evidenceNote ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };

  // Add system comment
  await addTaskComment(taskId, userId, `Task ${newStatus === "completed" ? "completed" : "submitted for sign-off"}`, true);

  return { ok: true, data };
}

export async function signOffTask(
  taskId: string,
  userId: string,
): Promise<ServiceResult<CsTask>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_tasks") as SB)
    .update({
      status: "completed",
      signed_off_by: userId,
      signed_off_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      completed_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };

  await addTaskComment(taskId, userId, "Task signed off", true);
  return { ok: true, data };
}

export async function escalateTask(
  taskId: string,
  userId: string,
  escalateTo: string,
  reason: string,
): Promise<ServiceResult<CsTask>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data: current } = await (s.from("cs_tasks") as SB)
    .select("escalation_level")
    .eq("id", taskId)
    .single();

  const { data, error } = await (s.from("cs_tasks") as SB)
    .update({
      escalated: true,
      escalated_to: escalateTo,
      escalated_at: new Date().toISOString(),
      escalation_reason: reason,
      escalation_level: (current?.escalation_level ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };

  await addTaskComment(taskId, userId, `Escalated: ${reason}`, true);
  return { ok: true, data };
}

export async function delegateTask(
  taskId: string,
  userId: string,
  delegateTo: string,
): Promise<ServiceResult<CsTask>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_tasks") as SB)
    .update({
      status: "delegated",
      delegated_to: delegateTo,
      delegated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };

  await addTaskComment(taskId, userId, `Delegated to staff member`, true);
  return { ok: true, data };
}

// ── Comments ────────────────────────────────────────────────────────────────

export async function addTaskComment(
  taskId: string,
  authorId: string,
  content: string,
  isSystem: boolean = false,
): Promise<ServiceResult<CsTaskComment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_task_comments") as SB)
    .insert({
      task_id: taskId,
      author_id: authorId,
      content,
      is_system: isSystem,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function getTaskComments(
  taskId: string,
): Promise<ServiceResult<CsTaskComment[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  const { data, error } = await (s.from("cs_task_comments") as SB)
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

// ── Dependencies ────────────────────────────────────────────────────────────

export async function addTaskDependency(
  taskId: string,
  dependsOnId: string,
  type: "blocks" | "required_before" | "related" = "blocks",
): Promise<ServiceResult<CsTaskDependency>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  // Prevent circular dependencies
  if (taskId === dependsOnId) return { ok: false, error: "A task cannot depend on itself" };

  const { data, error } = await (s.from("cs_task_dependencies") as SB)
    .insert({ task_id: taskId, depends_on_id: dependsOnId, dependency_type: type })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function getTaskDependencies(
  taskId: string,
): Promise<ServiceResult<CsTaskDependency[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  const { data, error } = await (s.from("cs_task_dependencies") as SB)
    .select("*")
    .eq("task_id", taskId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

// ── Escalation rules ────────────────────────────────────────────────────────

export async function getEscalationRules(
  homeId: string,
): Promise<ServiceResult<CsTaskEscalationRule[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  const { data, error } = await (s.from("cs_task_escalation_rules") as SB)
    .select("*")
    .eq("home_id", homeId)
    .eq("is_active", true);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

// ── Cara risk scoring ───────────────────────────────────────────────────────

export interface TaskRiskAssessment {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  factors: { factor: string; weight: number; detail: string }[];
}

/**
 * Compute an Cara risk score for a task based on multiple factors.
 * Score is 0-100 where higher = higher risk of overdue/failure.
 */
export function computeTaskRiskScore(task: CsTask): TaskRiskAssessment {
  const factors: { factor: string; weight: number; detail: string }[] = [];
  let score = 0;

  // 1. Priority
  const priorityScores: Record<CsTaskPriority, number> = {
    low: 5, medium: 10, high: 20, urgent: 30, critical: 40,
  };
  const priorityScore = priorityScores[task.priority] ?? 10;
  score += priorityScore;
  factors.push({ factor: "priority", weight: priorityScore, detail: `${task.priority} priority` });

  // 2. Overdue
  if (task.due_date) {
    const daysUntilDue = (new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilDue < 0) {
      const overdueScore = Math.min(30, Math.abs(daysUntilDue) * 3);
      score += overdueScore;
      factors.push({ factor: "overdue", weight: overdueScore, detail: `${Math.abs(Math.round(daysUntilDue))} days overdue` });
    } else if (daysUntilDue < 2) {
      score += 15;
      factors.push({ factor: "imminent", weight: 15, detail: "Due within 48 hours" });
    } else if (daysUntilDue < 7) {
      score += 5;
      factors.push({ factor: "upcoming", weight: 5, detail: "Due within 7 days" });
    }
  }

  // 3. Escalation history
  if (task.escalated) {
    const escScore = Math.min(20, task.escalation_level * 10);
    score += escScore;
    factors.push({ factor: "escalated", weight: escScore, detail: `Escalated ${task.escalation_level} time(s)` });
  }

  // 4. Safeguarding/compliance category
  if (["safeguarding", "compliance", "medication"].includes(task.category)) {
    score += 10;
    factors.push({ factor: "category_risk", weight: 10, detail: `${task.category} is high-risk category` });
  }

  // 5. Unassigned
  if (!task.assigned_to && task.status !== "completed" && task.status !== "cancelled") {
    score += 10;
    factors.push({ factor: "unassigned", weight: 10, detail: "No staff member assigned" });
  }

  // 6. Blocked status
  if (task.status === "blocked") {
    score += 15;
    factors.push({ factor: "blocked", weight: 15, detail: "Task is blocked" });
  }

  // 7. Child-linked
  if (task.linked_child_id) {
    score += 5;
    factors.push({ factor: "child_linked", weight: 5, detail: "Linked to a young person" });
  }

  // Cap at 100
  score = Math.min(100, score);

  const level: TaskRiskAssessment["level"] =
    score >= 70 ? "critical" :
    score >= 50 ? "high" :
    score >= 25 ? "medium" : "low";

  return { score, level, factors };
}

// ── Task statistics ─────────────────────────────────────────────────────────

export interface TaskStats {
  total: number;
  by_status: Record<CsTaskStatus, number>;
  by_priority: Record<CsTaskPriority, number>;
  overdue: number;
  due_today: number;
  unassigned: number;
  avg_completion_days: number | null;
}

export async function getTaskStats(homeId: string): Promise<ServiceResult<TaskStats>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data: tasks, error } = await (s.from("cs_tasks") as SB)
    .select("status, priority, due_date, assigned_to, created_at, completed_at")
    .eq("home_id", homeId);

  if (error) return { ok: false, error: error.message };

  const allTasks = tasks ?? [];
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const stats: TaskStats = {
    total: allTasks.length,
    by_status: {} as Record<CsTaskStatus, number>,
    by_priority: {} as Record<CsTaskPriority, number>,
    overdue: 0,
    due_today: 0,
    unassigned: 0,
    avg_completion_days: null,
  };

  const completionDays: number[] = [];

  for (const t of allTasks) {
    // Status counts
    stats.by_status[t.status as CsTaskStatus] = (stats.by_status[t.status as CsTaskStatus] ?? 0) + 1;
    // Priority counts
    stats.by_priority[t.priority as CsTaskPriority] = (stats.by_priority[t.priority as CsTaskPriority] ?? 0) + 1;
    // Overdue
    if (t.due_date && new Date(t.due_date) < now && !["completed", "cancelled"].includes(t.status)) {
      stats.overdue++;
    }
    // Due today
    if (t.due_date && t.due_date.startsWith(todayStr)) {
      stats.due_today++;
    }
    // Unassigned
    if (!t.assigned_to && !["completed", "cancelled"].includes(t.status)) {
      stats.unassigned++;
    }
    // Completion time
    if (t.completed_at && t.created_at) {
      const days = (new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24);
      completionDays.push(days);
    }
  }

  if (completionDays.length > 0) {
    stats.avg_completion_days = Math.round(
      (completionDays.reduce((a, b) => a + b, 0) / completionDays.length) * 10,
    ) / 10;
  }

  return { ok: true, data: stats };
}

// ── Testing exports ─────────────────────────────────────────────────────────

export const _testing = {
  CATEGORY_PREFIX,
  generateTaskReference,
  computeTaskRiskScore,
};
