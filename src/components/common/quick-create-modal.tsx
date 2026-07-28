"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — QUICK CREATE MODAL
// A single modal that creates either a Task or a Care Form.
// Context-aware: accepts prefill props so calling pages can seed relevant data.
// Used by the QuickCreateActions toolbar present in every page header.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  X, CheckSquare, FileText, Loader2, AlertCircle, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EntryAssist } from "@/components/forms/entry-assist";

// ── useStaff (inlined from use-staff) ───────────────────────────────────────

interface StaffEnriched extends StaffMember {
  is_on_shift_today: boolean;
  today_shift_type: string | null;
  today_shift_status: string | null;
  supervision_overdue: boolean;
  supervision_days_until_due: number | null;
  training_total_count: number;
  training_expired_count: number;
  training_expiring_count: number;
  active_tasks: number;
  overdue_tasks: number;
  is_on_leave_today: boolean;
  notifications_unread: number;
}

function useStaff(params?: { role?: string; status?: string; employment_type?: string }) {
  const query = new URLSearchParams();
  if (params?.role) query.set("role", params.role);
  if (params?.status) query.set("status", params.status);
  if (params?.employment_type) query.set("employment_type", params.employment_type);

  return useQuery({
    queryKey: ["staff", params],
    queryFn: () =>
      api.get<{ data: StaffEnriched[]; meta: Record<string, number> }>(`/staff?${query}`),
  });
}

interface YPEnriched extends YoungPerson {
  age: number;
  key_worker: StaffMember | null;
  secondary_worker: StaffMember | null;
  open_incidents: number;
  active_tasks: number;
  missing_episodes_total: number;
  last_log_date: string | null;
  active_medications: number;
  risk_flags_count: number;
}

function useYoungPeople(status = "current") {
  return useQuery({
    queryKey: ["young-people", status],
    queryFn: () =>
      api.get<{ data: YPEnriched[]; meta: Record<string, number> }>(
        `/young-people?status=${status}`
      ),
  });
}
import { api } from "@/hooks/use-api";
import { careToast } from "@/lib/toast";
import { useAuthContext } from "@/contexts/auth-context";
import { currentUserId } from "@/lib/auth/current-user";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";
import {
  TASK_PRIORITIES, TASK_CATEGORIES, TASK_CATEGORY_LABELS,
  CARE_FORM_TYPES, CARE_FORM_TYPE_LABELS,
} from "@/lib/constants";
import type { Task, CareForm, YoungPerson, StaffMember } from "@/types";

// ── Tasks mutation (inlined from use-tasks) ────────────────────────────────────

function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Task>) => api.post<{ data: Task }>("/tasks", data),
    onSuccess: (_res, data) => {
      careToast.taskCreated(data.title ?? "New task");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => careToast.actionFailed("Create task"),
  });
}

// ── Context prefill interface ─────────────────────────────────────────────────

export interface QuickCreateContext {
  /** Module the user is currently in — used to filter and label selects */
  module?: string;
  /** Pre-select category for new tasks */
  defaultTaskCategory?: Task["category"];
  /** Pre-select linked child */
  defaultChildId?: string;
  /** Pre-select linked incident */
  defaultIncidentId?: string;
  /** Pre-select assigned staff */
  defaultAssignedTo?: string;
  /** Pre-select form type */
  defaultFormType?: string;
  /** Any additional title prefix */
  titlePrefix?: string;
  /**
   * Which tab the modal should open on when the primary "New" button is clicked.
   * Defaults to "task". Use "form" on form-centric pages.
   */
  preferredTab?: "task" | "form";
}

// ── Tab type ─────────────────────────────────────────────────────────────────

type Tab = "task" | "form";

// ── Task form ─────────────────────────────────────────────────────────────────

interface TaskFormValues {
  title: string;
  description: string;
  priority: Task["priority"];
  category: string;
  due_date: string;
  assigned_to: string;
  linked_child_id: string;
  linked_incident_id: string;
  requires_sign_off: boolean;
}

function emptyTaskForm(ctx: QuickCreateContext): TaskFormValues {
  return {
    title: ctx.titlePrefix ? `${ctx.titlePrefix}: ` : "",
    description: "",
    priority: "medium",
    category: ctx.defaultTaskCategory ?? "admin",
    due_date: "",
    assigned_to: ctx.defaultAssignedTo ?? "",
    linked_child_id: ctx.defaultChildId ?? "",
    linked_incident_id: ctx.defaultIncidentId ?? "",
    requires_sign_off: false,
  };
}

// ── Form (care form) values ───────────────────────────────────────────────────

interface CareFormValues {
  title: string;
  form_type: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string;
  linked_child_id: string;
  linked_staff_id: string;
  linked_incident_id: string;
}

function emptyCareFormValues(ctx: QuickCreateContext): CareFormValues {
  return {
    title: ctx.titlePrefix ? `${ctx.titlePrefix}: ` : "",
    form_type: ctx.defaultFormType ?? "daily_check",
    description: "",
    priority: "medium",
    due_date: "",
    linked_child_id: ctx.defaultChildId ?? "",
    linked_staff_id: ctx.defaultAssignedTo ?? "",
    linked_incident_id: ctx.defaultIncidentId ?? "",
  };
}

// ── Modal component ───────────────────────────────────────────────────────────

interface FormResponse {
  data: CareForm;
}

const FORM_KEYS = {
  all:   ["forms"] as const,
  list:  (params?: Record<string, string>) => ["forms", "list", params] as const,
  detail: (id: string) => ["forms", "detail", id] as const,
};

function authHeaders() {
  return { "Content-Type": "application/json", "X-User-Id": currentUserId() };
}

interface QuickCreateModalProps {
  open: boolean;
  onClose: () => void;
  context?: QuickCreateContext;
  /** Which tab to open by default */
  defaultTab?: Tab;
}

export function QuickCreateModal({
  open,
  onClose,
  context = {},
  defaultTab = "task",
}: QuickCreateModalProps) {
  const currentUser = useAuthContext().currentUser;
  const { can } = usePermissions();
  const qc = useQueryClient();
  const createTask = useCreateTask();
  const createForm = useMutation<CareForm, Error, Partial<CareForm>>({
    mutationFn: async (data) => {
      const res = await fetch("/api/v1/forms", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create form");
      const json: FormResponse = await res.json();
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FORM_KEYS.all }),
  });

  const canCreateTask = can(PERMISSIONS.CREATE_TASKS);
  const canCreateForm = can(PERMISSIONS.CREATE_FORMS);

  const resolvedDefaultTab: Tab =
    defaultTab === "form" && canCreateForm
      ? "form"
      : canCreateTask
      ? "task"
      : "form";

  const [tab, setTab] = useState<Tab>(resolvedDefaultTab);
  const [taskForm, setTaskForm] = useState<TaskFormValues>(() => emptyTaskForm(context));
  const [careForm, setCareForm] = useState<CareFormValues>(() => emptyCareFormValues(context));
  const [taskError, setTaskError] = useState("");
  const [careFormError, setCareFormError] = useState("");
  const [taskSuccess, setTaskSuccess] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const staffQuery = useStaff();
  const activeStaff = (staffQuery.data?.data ?? []).filter((s) => s.is_active);
  const ypQuery = useYoungPeople();
  const currentYP = (ypQuery.data?.data ?? []).filter((y) => y.status === "current");

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setTaskForm(emptyTaskForm(context));
      setCareForm(emptyCareFormValues(context));
      setTaskError("");
      setCareFormError("");
      setTaskSuccess(false);
      setFormSuccess(false);
      setTab(resolvedDefaultTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleCreateTask() {
    if (!taskForm.title.trim()) { setTaskError("Title is required"); return; }
    setTaskError("");
    createTask.mutate(
      {
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || undefined,
        priority: taskForm.priority,
        category: taskForm.category as Task["category"],
        due_date: taskForm.due_date || undefined,
        assigned_to: taskForm.assigned_to || undefined,
        linked_child_id: taskForm.linked_child_id || undefined,
        linked_incident_id: taskForm.linked_incident_id || undefined,
        requires_sign_off: taskForm.requires_sign_off,
        status: "not_started",
        home_id: "home_oak",
        created_by: currentUser?.id ?? "staff_darren",
      },
      {
        onSuccess: () => {
          setTaskSuccess(true);
          setTimeout(onClose, 1200);
        },
        onError: (e) => setTaskError((e as Error).message),
      }
    );
  }

  function handleCreateForm() {
    if (!careForm.title.trim()) { setCareFormError("Title is required"); return; }
    setCareFormError("");
    createForm.mutate(
      {
        title: careForm.title.trim(),
        form_type: careForm.form_type as CareForm["form_type"],
        description: careForm.description.trim() || undefined,
        priority: careForm.priority,
        due_date: careForm.due_date || undefined,
        linked_child_id: careForm.linked_child_id || undefined,
        linked_staff_id: careForm.linked_staff_id || undefined,
        linked_incident_id: careForm.linked_incident_id || undefined,
        home_id: "home_oak",
        created_by: currentUser?.id ?? "staff_darren",
        status: "draft",
      },
      {
        onSuccess: () => {
          setFormSuccess(true);
          setTimeout(onClose, 1200);
        },
        onError: (e) => setCareFormError(e.message),
      }
    );
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-[var(--cs-shadow-elevated)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--cs-border-subtle)]">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-[var(--cs-text-muted)]" />
            <span className="text-sm font-bold text-[var(--cs-navy)]">Create New</span>
            {context.module && (
              <Badge className="text-[9px] rounded-full bg-[var(--cs-surface)] text-[var(--cs-text-muted)] capitalize">
                {context.module.replace(/-/g, " ")}
              </Badge>
            )}
          </div>
          <button onClick={onClose} className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex gap-0.5 px-5 pt-3 pb-0">
          {canCreateTask && (
            <button
              onClick={() => setTab("task")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-xs font-semibold border-b-2 transition-all",
                tab === "task"
                  ? "border-[var(--cs-navy)] text-[var(--cs-navy)] bg-[var(--cs-surface)]"
                  : "border-transparent text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]"
              )}
            >
              <CheckSquare className="h-3.5 w-3.5" />Task
            </button>
          )}
          {canCreateForm && (
            <button
              onClick={() => setTab("form")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-xs font-semibold border-b-2 transition-all",
                tab === "form"
                  ? "border-[var(--cs-navy)] text-[var(--cs-navy)] bg-[var(--cs-surface)]"
                  : "border-transparent text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]"
              )}
            >
              <FileText className="h-3.5 w-3.5" />Care Form
            </button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {/* ── Task tab ──────────────────────────────────────────── */}
          {tab === "task" && (
            <div className="space-y-3">
              {taskSuccess ? (
                <div className="py-8 text-center">
                  <CheckSquare className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-emerald-700">Task created!</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Title <span className="text-red-500">*</span></label>
                    <Input
                      value={taskForm.title}
                      onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="What needs to be done?"
                      className="text-sm"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Description</label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
                      rows={2}
                      placeholder="Optional details…"
                      className="w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3.5 py-3 text-sm text-[var(--cs-text-secondary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)] placeholder:text-[var(--cs-text-muted)]"
                    />
                    <div className="mt-1.5">
                      <EntryAssist value={taskForm.description} onChange={(v) => setTaskForm((f) => ({ ...f, description: v }))} sourceModule="task" sourceField="description" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Priority</label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value as Task["priority"] }))}
                        className="w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]"
                      >
                        {TASK_PRIORITIES.map((p) => (
                          <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Category</label>
                      <select
                        value={taskForm.category}
                        onChange={(e) => setTaskForm((f) => ({ ...f, category: e.target.value }))}
                        className="w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]"
                      >
                        {TASK_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{TASK_CATEGORY_LABELS[c]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Due Date</label>
                      <Input
                        type="date"
                        value={taskForm.due_date}
                        onChange={(e) => setTaskForm((f) => ({ ...f, due_date: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Assign To</label>
                      <select
                        value={taskForm.assigned_to}
                        onChange={(e) => setTaskForm((f) => ({ ...f, assigned_to: e.target.value }))}
                        className="w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]"
                      >
                        <option value="">Unassigned</option>
                        {activeStaff.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Linked Child</label>
                      <select
                        value={taskForm.linked_child_id}
                        onChange={(e) => setTaskForm((f) => ({ ...f, linked_child_id: e.target.value }))}
                        className="w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]"
                      >
                        <option value="">None</option>
                        {currentYP.map((y) => (
                          <option key={y.id} value={y.id}>{y.preferred_name ?? y.first_name} {y.last_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taskForm.requires_sign_off}
                          onChange={(e) => setTaskForm((f) => ({ ...f, requires_sign_off: e.target.checked }))}
                          className="h-4 w-4 rounded border-[var(--cs-border)] text-[var(--cs-navy)] focus:ring-[var(--cs-cara-gold)]"
                        />
                        <span className="text-xs font-medium text-[var(--cs-text-secondary)]">Requires sign-off</span>
                      </label>
                    </div>
                  </div>

                  {taskError && (
                    <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />{taskError}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Care form tab ──────────────────────────────────────── */}
          {tab === "form" && (
            <div className="space-y-3">
              {formSuccess ? (
                <div className="py-8 text-center">
                  <FileText className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-emerald-700">Form created!</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Title <span className="text-red-500">*</span></label>
                    <Input
                      value={careForm.title}
                      onChange={(e) => setCareForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Form name or subject…"
                      className="text-sm"
                      autoFocus={tab === "form"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Form Type</label>
                      <select
                        value={careForm.form_type}
                        onChange={(e) => setCareForm((f) => ({ ...f, form_type: e.target.value }))}
                        className="w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]"
                      >
                        {CARE_FORM_TYPES.map((t) => (
                          <option key={t} value={t}>{CARE_FORM_TYPE_LABELS[t]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Priority</label>
                      <select
                        value={careForm.priority}
                        onChange={(e) => setCareForm((f) => ({ ...f, priority: e.target.value as CareFormValues["priority"] }))}
                        className="w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]"
                      >
                        {TASK_PRIORITIES.map((p) => (
                          <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Description / Notes</label>
                    <textarea
                      value={careForm.description}
                      onChange={(e) => setCareForm((f) => ({ ...f, description: e.target.value }))}
                      rows={2}
                      placeholder="Context or instructions for this form…"
                      className="w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3.5 py-3 text-sm text-[var(--cs-text-secondary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)] placeholder:text-[var(--cs-text-muted)]"
                    />
                    <div className="mt-1.5">
                      <EntryAssist value={careForm.description} onChange={(v) => setCareForm((f) => ({ ...f, description: v }))} sourceModule="care_form" sourceField="description" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Linked Child</label>
                      <select
                        value={careForm.linked_child_id}
                        onChange={(e) => setCareForm((f) => ({ ...f, linked_child_id: e.target.value }))}
                        className="w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]"
                      >
                        <option value="">None</option>
                        {currentYP.map((y) => (
                          <option key={y.id} value={y.id}>{y.preferred_name ?? y.first_name} {y.last_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Assigned Staff</label>
                      <select
                        value={careForm.linked_staff_id}
                        onChange={(e) => setCareForm((f) => ({ ...f, linked_staff_id: e.target.value }))}
                        className="w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]"
                      >
                        <option value="">Anyone</option>
                        {activeStaff.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Due Date</label>
                    <Input
                      type="date"
                      value={careForm.due_date}
                      onChange={(e) => setCareForm((f) => ({ ...f, due_date: e.target.value }))}
                      className="text-sm"
                    />
                  </div>

                  {careFormError && (
                    <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />{careFormError}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!taskSuccess && !formSuccess && (
          <div className="flex gap-2 px-5 py-4 border-t border-[var(--cs-border-subtle)]">
            {tab === "task" && canCreateTask && (
              <Button
                className="flex-1"
                onClick={handleCreateTask}
                disabled={createTask.isPending}
              >
                {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckSquare className="h-4 w-4 mr-1.5" />}
                Create Task
              </Button>
            )}
            {tab === "form" && canCreateForm && (
              <Button
                className="flex-1"
                onClick={handleCreateForm}
                disabled={createForm.isPending}
              >
                {createForm.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <FileText className="h-4 w-4 mr-1.5" />}
                Create Form
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        )}
      </div>
    </div>
  );
}
