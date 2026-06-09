"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { EntryAssist } from "@/components/forms/entry-assist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  ArrowLeft, CheckCircle2, Circle, Clock, Ban, X,
  Flame, ArrowUp, ArrowRight, ArrowDown, Shield,
  Heart, AlertTriangle, CalendarDays, Timer, RotateCcw,
  User, Edit3, Save, AlertCircle, Loader2, UserCheck,
  TrendingUp, Tag, FileText, ChevronRight,
} from "lucide-react";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useStaff } from "@/hooks/use-staff";
import {
  useTask, useUpdateTask, useCompleteTask,
  useSignOffTask, useEscalateTask, useCancelTask,
} from "@/hooks/use-tasks";
import { useCurrentUser } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";
import { cn, todayStr, formatRelative, isOverdue, isDueToday, formatDate } from "@/lib/utils";
import { TASK_CATEGORY_LABELS, TASK_PRIORITIES, TASK_CATEGORIES, TASK_STATUSES } from "@/lib/constants";
import type { Task } from "@/types";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ProvenanceBadge } from "@/components/forms/enter-once-indicator";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  not_started: { color: "text-[var(--cs-text-muted)]", bgColor: "bg-slate-100", icon: Circle, label: "Not Started" },
  in_progress: { color: "text-blue-600", bgColor: "bg-blue-100", icon: Clock, label: "In Progress" },
  blocked: { color: "text-red-600", bgColor: "bg-red-100", icon: Ban, label: "Blocked" },
  completed: { color: "text-emerald-600", bgColor: "bg-emerald-100", icon: CheckCircle2, label: "Completed" },
  cancelled: { color: "text-[var(--cs-text-muted)]", bgColor: "bg-slate-100", icon: X, label: "Cancelled" },
};

const PRIORITY_CONFIG: Record<string, { color: string; border: string; icon: React.ElementType; label: string }> = {
  urgent: { color: "bg-red-100 text-red-800", border: "border-l-red-600", icon: Flame, label: "Urgent" },
  high: { color: "bg-orange-100 text-orange-800", border: "border-l-orange-500", icon: ArrowUp, label: "High" },
  medium: { color: "bg-blue-100 text-blue-800", border: "border-l-blue-400", icon: ArrowRight, label: "Medium" },
  low: { color: "bg-slate-100 text-[var(--cs-text-secondary)]", border: "border-l-slate-300", icon: ArrowDown, label: "Low" },
};

// ── Inline editable field ─────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-muted)] mb-1">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// ── Complete task panel ───────────────────────────────────────────────────────

function CompletePanel({
  taskId,
  onDone,
  currentUserId,
}: {
  taskId: string;
  onDone: () => void;
  currentUserId: string;
}) {
  const [note, setNote] = useState("");
  const completeTask = useCompleteTask();

  function handleSubmit() {
    completeTask.mutate(
      { id: taskId, by: currentUserId, note: note.trim() || undefined },
      { onSuccess: onDone }
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
      <p className="text-sm font-semibold text-emerald-800">Mark as Complete</p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Evidence note (optional) — describe what was done…"
        className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-[var(--cs-text-muted)]"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 flex-1"
          onClick={handleSubmit}
          disabled={completeTask.isPending}
        >
          {completeTask.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
          Confirm Complete
        </Button>
        <Button size="sm" variant="outline" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Escalation panel ──────────────────────────────────────────────────────────

function EscalatePanel({
  taskId,
  onDone,
}: {
  taskId: string;
  onDone: () => void;
}) {
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const escalate = useEscalateTask();
  const escalateStaffQuery = useStaff();
  const seniors = (escalateStaffQuery.data?.data ?? []).filter((s) =>
    ["registered_manager", "deputy_manager", "responsible_individual", "team_leader"].includes(s.role)
  );

  function handleSubmit() {
    if (!to) { setError("Please select a person to escalate to"); return; }
    if (!reason.trim()) { setError("Please provide a reason"); return; }
    setError("");
    escalate.mutate(
      { id: taskId, escalated_to: to, reason: reason.trim() },
      { onSuccess: onDone }
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <p className="text-sm font-semibold text-amber-800">Escalate Task</p>
      <div>
        <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1">Escalate to</label>
        <select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="">Select person…</option>
          {seniors.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name} — {s.job_title}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1">Reason</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Why is this being escalated?"
          className="w-full rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-[var(--cs-text-muted)]"
        />
      </div>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 flex-1"
          onClick={handleSubmit}
          disabled={escalate.isPending}
        >
          {escalate.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <TrendingUp className="h-4 w-4 mr-1" />}
          Escalate
        </Button>
        <Button size="sm" variant="outline" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TaskDetailPage() {
  const params = useParams<{ taskId: string }>();
  const router = useRouter();
  const taskId = params.taskId;

  const { data: task, isLoading, isError } = useTask(taskId);
  const currentUser = useCurrentUser();
  const { can } = usePermissions();
  const updateTask = useUpdateTask();
  const signOff = useSignOffTask();
  const cancelTask = useCancelTask();

  const [editing, setEditing] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Task>>({});
  const [saveError, setSaveError] = useState("");

  const detailStaffQuery = useStaff();
  const activeStaff = (detailStaffQuery.data?.data ?? []).filter((s) => s.is_active);

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageShell title="Task" subtitle="Loading…" showQuickCreate={false}>
        <div className="flex items-center justify-center py-24 text-[var(--cs-text-muted)]">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <span className="text-sm">Loading task…</span>
        </div>
      </PageShell>
    );
  }

  if (isError || !task) {
    return (
      <PageShell title="Task not found" subtitle="" showQuickCreate={false}>
        <div className="max-w-md mx-auto mt-12 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-sm text-[var(--cs-text-secondary)]">This task could not be found. It may have been deleted.</p>
          <Link href="/tasks">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-1" />Back to Tasks</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  const overdue = isOverdue(task.due_date, task.status);
  const dueToday = isDueToday(task.due_date);
  const prio = PRIORITY_CONFIG[task.priority];
  const stat = STATUS_CONFIG[task.status];
  const StatusIcon = stat.icon;
  const PrioIcon = prio.icon;
  const isComplete = task.status === "completed";
  const isCancelled = task.status === "cancelled";
  const isSignedOff = !!task.signed_off_by;
  const canEdit = can(PERMISSIONS.EDIT_OWN_TASKS) || can(PERMISSIONS.EDIT_TEAM_TASKS);
  const canComplete = can(PERMISSIONS.COMPLETE_TASKS) && !isComplete && !isCancelled;
  const canSignOff = can(PERMISSIONS.SIGN_OFF_TASKS) && isComplete && !isSignedOff;
  const canEscalate = can(PERMISSIONS.ESCALATE_TASKS) && !isComplete && !isCancelled && !task.escalated;
  const canCancel = can(PERMISSIONS.DELETE_TASKS) && !isComplete;

  function startEdit() {
    setEditForm({
      title: task!.title,
      description: task!.description,
      priority: task!.priority,
      status: task!.status,
      category: task!.category,
      due_date: task!.due_date ?? "",
      assigned_to: task!.assigned_to ?? "",
      estimated_minutes: task!.estimated_minutes ?? undefined,
    });
    setEditing(true);
    setSaveError("");
  }

  function handleSave() {
    if (!editForm.title?.trim()) { setSaveError("Title is required"); return; }
    setSaveError("");
    const patch: Partial<Task> = {
      ...editForm,
      due_date: editForm.due_date || null,
      assigned_to: editForm.assigned_to || null,
    };
    updateTask.mutate(
      { id: task!.id, data: patch },
      {
        onSuccess: () => setEditing(false),
        onError: (e) => setSaveError((e as Error).message),
      }
    );
  }

  function handleSignOff() {
    if (!currentUser) return;
    signOff.mutate({ id: task!.id, by: currentUser.id });
  }

  function handleCancel() {
    if (!confirm("Cancel this task? This cannot be undone.")) return;
    cancelTask.mutate({ id: task!.id }, { onSuccess: () => router.push("/tasks") });
  }

  return (
    <PageShell
      title={editing ? "Editing Task" : task.title}
      subtitle={
        editing
          ? "Make changes and save below"
          : `${TASK_CATEGORY_LABELS[task.category] ?? task.category} · Created ${formatDate(task.created_at)}`
      }
      showQuickCreate={false}
      recordAnything
      recordChildId={task.linked_child_id ?? undefined}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Task Detail" subtitle={`Chamberlain House — ${task.title}`} targetId="task-detail-content" />
          <SmartUploadButton variant="icon" uploadContext="Task — supporting document upload" />
          <Link href="/tasks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />All Tasks
            </Button>
          </Link>
        </div>
      }
    >
      <div id="task-detail-content" className="max-w-3xl space-y-5">

        {/* Priority + status banner */}
        <div className={cn("rounded-2xl border border-l-4 bg-white p-4 flex items-center gap-3", prio.border)}>
          <div className={cn("rounded-full p-2 shrink-0", stat.bgColor)}>
            <StatusIcon className={cn("h-5 w-5", stat.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn("text-[10px] rounded-full border-0", prio.color)}>
                <PrioIcon className="h-3 w-3 mr-0.5" />{prio.label}
              </Badge>
              <Badge variant="outline" className="text-[10px] rounded-full capitalize">{stat.label}</Badge>
              {overdue && <Badge variant="destructive" className="text-[9px] rounded-full">OVERDUE</Badge>}
              {dueToday && !overdue && <Badge className="text-[9px] rounded-full bg-orange-100 text-orange-700">Due Today</Badge>}
              {task.escalated && <Badge variant="destructive" className="text-[9px] rounded-full gap-0.5"><TrendingUp className="h-3 w-3" />Escalated</Badge>}
              {task.requires_sign_off && !isSignedOff && <Badge className="text-[9px] rounded-full bg-amber-100 text-amber-700 gap-0.5"><Shield className="h-3 w-3" />Needs Sign-off</Badge>}
              {isSignedOff && <Badge className="text-[9px] rounded-full bg-emerald-100 text-emerald-700 gap-0.5"><UserCheck className="h-3 w-3" />Signed Off</Badge>}
            </div>
            {task.due_date && (
              <p className={cn("text-xs mt-1", overdue ? "text-red-600 font-semibold" : dueToday ? "text-orange-600" : "text-[var(--cs-text-muted)]")}>
                <CalendarDays className="h-3 w-3 inline mr-1" />
                Due {formatRelative(task.due_date)}
              </p>
            )}
          </div>
          {/* Action buttons */}
          <div className="flex gap-2 shrink-0 flex-wrap justify-end">
            {canEdit && !editing && (
              <Button size="sm" variant="outline" onClick={startEdit}>
                <Edit3 className="h-3.5 w-3.5 mr-1" />Edit
              </Button>
            )}
            {canComplete && !showComplete && (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setShowComplete(true); setShowEscalate(false); }}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Complete
              </Button>
            )}
            {canSignOff && (
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleSignOff} disabled={signOff.isPending}>
                {signOff.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <UserCheck className="h-3.5 w-3.5 mr-1" />}
                Sign Off
              </Button>
            )}
            {canEscalate && !showEscalate && (
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => { setShowEscalate(true); setShowComplete(false); }}>
                <TrendingUp className="h-3.5 w-3.5 mr-1" />Escalate
              </Button>
            )}
            {canCancel && (
              <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={handleCancel} disabled={cancelTask.isPending}>
                <X className="h-3.5 w-3.5 mr-1" />Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Complete / Escalate panels */}
        {showComplete && (
          <CompletePanel
            taskId={task.id}
            currentUserId={currentUser?.id ?? "staff_darren"}
            onDone={() => setShowComplete(false)}
          />
        )}
        {showEscalate && (
          <EscalatePanel taskId={task.id} onDone={() => setShowEscalate(false)} />
        )}

        {/* Edit form */}
        {editing && (
          <Card className="rounded-2xl border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Edit3 className="h-4 w-4 text-blue-500" />Edit Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Title <span className="text-red-500">*</span></label>
                <Input
                  value={editForm.title ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Description</label>
                <textarea
                  value={editForm.description ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-[var(--cs-border)] bg-slate-50 px-3.5 py-3 text-sm text-[var(--cs-text-secondary)] resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-[var(--cs-text-muted)]"
                />
                <div className="mt-1.5">
                  <EntryAssist value={editForm.description ?? ""} onChange={(v) => setEditForm((f) => ({ ...f, description: v }))} sourceModule="task" sourceField="description" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Priority</label>
                  <select
                    value={editForm.priority ?? "medium"}
                    onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value as Task["priority"] }))}
                    className="w-full rounded-xl border border-[var(--cs-border)] bg-slate-50 px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {TASK_PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Status</label>
                  <select
                    value={editForm.status ?? "not_started"}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as Task["status"] }))}
                    className="w-full rounded-xl border border-[var(--cs-border)] bg-slate-50 px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {TASK_STATUSES.filter((s) => s !== "completed").map((s) => (
                      <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Category</label>
                  <select
                    value={editForm.category ?? "admin"}
                    onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value as Task["category"] }))}
                    className="w-full rounded-xl border border-[var(--cs-border)] bg-slate-50 px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{TASK_CATEGORY_LABELS[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Due Date</label>
                  <Input
                    type="date"
                    value={editForm.due_date ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, due_date: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Assigned To</label>
                <select
                  value={editForm.assigned_to ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, assigned_to: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--cs-border)] bg-slate-50 px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">Unassigned</option>
                  {activeStaff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              {saveError && <p className="text-xs text-red-600 font-medium">{saveError}</p>}
              <div className="flex gap-2 pt-1">
                <Button className="flex-1" onClick={handleSave} disabled={updateTask.isPending}>
                  {updateTask.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detail grid */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Left column */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-[var(--cs-text-muted)]" />Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <Field label="Title">
                  <p className="text-sm font-medium text-[var(--cs-navy)]">{task.title}</p>
                </Field>
                {task.description && (
                  <Field label="Description">
                    <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-wrap">{task.description}</p>
                  </Field>
                )}
                <Field label="Category">
                  <Badge variant="outline" className="text-xs rounded-full">
                    {TASK_CATEGORY_LABELS[task.category] ?? task.category}
                  </Badge>
                </Field>
                {task.estimated_minutes && (
                  <Field label="Estimated Time">
                    <p className="text-sm text-[var(--cs-text-secondary)] flex items-center gap-1.5">
                      <Timer className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                      {task.estimated_minutes} minutes
                    </p>
                  </Field>
                )}
                {task.recurring && (
                  <Field label="Recurrence">
                    <p className="text-sm text-[var(--cs-text-secondary)] flex items-center gap-1.5">
                      <RotateCcw className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                      {task.recurring_schedule
                        ? task.recurring_schedule.charAt(0).toUpperCase() + task.recurring_schedule.slice(1)
                        : "Recurring"}
                    </p>
                  </Field>
                )}
                {task.tags.length > 0 && (
                  <Field label="Tags">
                    <div className="flex flex-wrap gap-1.5">
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] rounded-full gap-0.5">
                          <Tag className="h-2.5 w-2.5" />{tag}
                        </Badge>
                      ))}
                    </div>
                  </Field>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="space-y-4">
            {/* Assignment */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4 text-[var(--cs-text-muted)]" />Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <Field label="Assigned To">
                    {task.assigned_to ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={getStaffName(task.assigned_to)} size="sm" />
                        <span className="text-sm text-[var(--cs-text-secondary)]">{getStaffName(task.assigned_to)}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-[var(--cs-text-muted)]">Unassigned</span>
                    )}
                  </Field>
                  {task.assigned_role && (
                    <Field label="Role">
                      <span className="text-sm text-[var(--cs-text-secondary)] capitalize">{task.assigned_role.replace(/_/g, " ")}</span>
                    </Field>
                  )}
                  <Field label="Created By">
                    <div className="flex items-center gap-2">
                      <Avatar name={getStaffName(task.created_by)} size="sm" />
                      <span className="text-sm text-[var(--cs-text-secondary)]">{getStaffName(task.created_by)}</span>
                    </div>
                  </Field>
                </dl>
              </CardContent>
            </Card>

            {/* Provenance — where this task came from (Enter Once, Use Everywhere) */}
            {(() => {
              const t = task as Task & { linked_record_type?: string; linked_record_id?: string };
              if (!t.linked_record_type || !t.linked_record_id) return null;
              if (t.linked_record_type === "incident" && task.linked_incident_id) return null; // shown below
              return (
                <Card className="rounded-2xl border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)]">
                  <CardContent className="py-3">
                    <p className="text-[11px] font-semibold text-[var(--cs-text-secondary)] mb-1.5">This task was created automatically from:</p>
                    <ProvenanceBadge
                      sourceType={t.linked_record_type}
                      sourceId={t.linked_record_id}
                    />
                  </CardContent>
                </Card>
              );
            })()}

            {/* Linked records */}
            {(task.linked_child_id || task.linked_incident_id || task.linked_document_id) && (
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><Tag className="h-4 w-4 text-[var(--cs-text-muted)]" />Linked Records</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {task.linked_child_id && (
                    <Link href={`/young-people`} className="flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 hover:bg-purple-100 transition-colors">
                      <Heart className="h-4 w-4 text-purple-500 shrink-0" />
                      <span className="text-xs font-medium text-purple-700 flex-1">{getYPName(task.linked_child_id)}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-purple-400" />
                    </Link>
                  )}
                  {task.linked_incident_id && (
                    <Link href={`/incidents`} className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 hover:bg-red-100 transition-colors">
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                      <span className="text-xs font-medium text-red-700 flex-1">{task.linked_incident_id.replace("inc_", "INC-")}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-red-400" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Completion / sign-off evidence */}
        {isComplete && (
          <Card className="rounded-2xl border-emerald-200 bg-emerald-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />Completion Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <Field label="Completed By">
                  <div className="flex items-center gap-2">
                    <Avatar name={getStaffName(task.completed_by ?? "")} size="sm" />
                    <span className="text-sm text-[var(--cs-text-secondary)]">{getStaffName(task.completed_by ?? "")}</span>
                  </div>
                </Field>
                {task.completed_at && (
                  <Field label="Completed At">
                    <span className="text-sm text-[var(--cs-text-secondary)]">{formatDate(task.completed_at)}</span>
                  </Field>
                )}
                {task.evidence_note && (
                  <Field label="Evidence Note">
                    <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed">{task.evidence_note}</p>
                  </Field>
                )}
                {isSignedOff && (
                  <>
                    <Field label="Signed Off By">
                      <div className="flex items-center gap-2">
                        <Avatar name={getStaffName(task.signed_off_by ?? "")} size="sm" />
                        <span className="text-sm text-[var(--cs-text-secondary)]">{getStaffName(task.signed_off_by ?? "")}</span>
                      </div>
                    </Field>
                    {task.signed_off_at && (
                      <Field label="Sign-off Date">
                        <span className="text-sm text-[var(--cs-text-secondary)]">{formatDate(task.signed_off_at)}</span>
                      </Field>
                    )}
                  </>
                )}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Escalation record */}
        {task.escalated && (
          <Card className="rounded-2xl border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                <TrendingUp className="h-4 w-4" />Escalation Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {task.escalated_to && (
                  <Field label="Escalated To">
                    <div className="flex items-center gap-2">
                      <Avatar name={getStaffName(task.escalated_to)} size="sm" />
                      <span className="text-sm text-[var(--cs-text-secondary)]">{getStaffName(task.escalated_to)}</span>
                    </div>
                  </Field>
                )}
                {task.escalation_reason && (
                  <Field label="Reason">
                    <p className="text-sm text-[var(--cs-text-secondary)]">{task.escalation_reason}</p>
                  </Field>
                )}
                {task.escalated_at && (
                  <Field label="Escalated At">
                    <span className="text-sm text-[var(--cs-text-secondary)]">{formatDate(task.escalated_at)}</span>
                  </Field>
                )}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Audit metadata */}
        <Card className="rounded-2xl bg-slate-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-4 text-[10px] text-[var(--cs-text-muted)]">
              <span>ID: <code className="font-mono text-[var(--cs-text-muted)]">{task.id}</code></span>
              <span>Created: {formatDate(task.created_at)}</span>
              <span>Updated: {formatDate(task.updated_at)}</span>
              <span>Home: {task.home_id}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
