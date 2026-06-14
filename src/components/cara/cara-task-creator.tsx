"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraTaskCreator
//
// Parses Cara-generated task suggestions and lets the manager confirm, edit,
// or discard each one before creating real tasks. Tasks are created via the
// existing /api/v1/tasks endpoint with the auto_generated flag.
//
// Cara suggests. Humans decide. Cara evidences.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  ListTodo,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  Edit3,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ParsedTask {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  assignedRole?: string;
  dueDays?: number;
  category?: string;
  isSafeguarding: boolean;
}

interface CaraTaskCreatorProps {
  /** The raw text from Cara that contains task suggestions */
  generatedText: string;
  /** Cara output ID for linking */
  outputId?: string;
  /** Home to create tasks in */
  homeId?: string;
  /** Optional child to link tasks to */
  linkedChildId?: string;
  /** Optional incident to link tasks to */
  linkedIncidentId?: string;
  /** Called when a task is successfully created */
  onTaskCreated?: (task: { id: string; title: string }) => void;
  /** Called when all tasks have been processed */
  onComplete?: () => void;
  className?: string;
}

// ── Task parser ──────────────────────────────────────────────────────────────

function parseTasksFromText(text: string): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  // Match numbered list items: "1. Title — description" or "1. **Title**: description"
  const lines = text.split("\n");
  let currentTask: Partial<ParsedTask> | null = null;
  let taskIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Match numbered items: "1. Title" or "- Title"
    const numberedMatch = trimmed.match(
      /^(?:\d+[\.\)]\s*|\-\s*|\*\s*)(?:\*\*)?(.+?)(?:\*\*)?(?:\s*[—–-]\s*(.+))?$/,
    );

    if (numberedMatch) {
      // Save previous task
      if (currentTask?.title) {
        tasks.push(finaliseTask(currentTask, taskIndex));
        taskIndex++;
      }

      currentTask = {
        title: cleanTitle(numberedMatch[1]),
        description: numberedMatch[2]?.trim() || "",
      };
      continue;
    }

    // Match metadata lines within a task
    if (currentTask) {
      const priorityMatch = trimmed.match(
        /(?:priority|urgency)\s*[:=]\s*(urgent|high|medium|low)/i,
      );
      if (priorityMatch) {
        currentTask.priority = priorityMatch[1].toLowerCase() as ParsedTask["priority"];
        continue;
      }

      const roleMatch = trimmed.match(
        /(?:assign(?:ed)?\s*(?:to|role)?|owner|responsible)\s*[:=]\s*(.+)/i,
      );
      if (roleMatch) {
        currentTask.assignedRole = roleMatch[1].trim();
        continue;
      }

      const dueMatch = trimmed.match(
        /(?:due|deadline|due[\s-]?(?:date|day|in))\s*[:=]\s*(\d+)\s*(?:days?|d)/i,
      );
      if (dueMatch) {
        currentTask.dueDays = parseInt(dueMatch[1], 10);
        continue;
      }

      const categoryMatch = trimmed.match(
        /(?:category|area|quality[\s-]?area)\s*[:=]\s*(.+)/i,
      );
      if (categoryMatch) {
        currentTask.category = categoryMatch[1].trim();
        continue;
      }

      // Continuation line — append to description
      if (trimmed && !trimmed.startsWith("─") && !trimmed.startsWith("==")) {
        currentTask.description =
          (currentTask.description ? currentTask.description + " " : "") +
          trimmed;
      }
    }
  }

  // Don't forget the last task
  if (currentTask?.title) {
    tasks.push(finaliseTask(currentTask, taskIndex));
  }

  return tasks;
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/^\*\*/, "")
    .replace(/\*\*$/, "")
    .replace(/^["']|["']$/g, "")
    .replace(/:\s*$/, "")
    .trim();
}

function finaliseTask(partial: Partial<ParsedTask>, index: number): ParsedTask {
  const title = partial.title ?? `Task ${index + 1}`;
  const desc = (partial.description ?? "").slice(0, 500);
  const isSafeguarding =
    /safeguard|protect|risk|concern|allega|missing|exploit/i.test(
      title + " " + desc,
    );

  return {
    id: `aria_task_${index}_${Date.now()}`,
    title,
    description: desc,
    priority: partial.priority ?? (isSafeguarding ? "urgent" : "medium"),
    assignedRole: partial.assignedRole,
    dueDays: partial.dueDays,
    category: partial.category,
    isSafeguarding,
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export function CaraTaskCreator({
  generatedText,
  outputId,
  homeId,
  linkedChildId,
  linkedIncidentId,
  onTaskCreated,
  onComplete,
  className,
}: CaraTaskCreatorProps) {
  const parsedTasks = useMemo(
    () => parseTasksFromText(generatedText),
    [generatedText],
  );

  const [taskStates, setTaskStates] = useState<
    Record<string, "pending" | "creating" | "created" | "skipped" | "editing">
  >(() => {
    const states: Record<string, string> = {};
    for (const t of parsedTasks) states[t.id] = "pending";
    return states as Record<string, "pending">;
  });

  const [editingTask, setEditingTask] = useState<ParsedTask | null>(null);
  const [expanded, setExpanded] = useState(true);

  const allProcessed = parsedTasks.every(
    (t) => taskStates[t.id] === "created" || taskStates[t.id] === "skipped",
  );
  const createdCount = parsedTasks.filter(
    (t) => taskStates[t.id] === "created",
  ).length;

  async function createTask(task: ParsedTask) {
    setTaskStates((prev) => ({ ...prev, [task.id]: "creating" }));

    try {
      const dueDate = task.dueDays
        ? new Date(Date.now() + task.dueDays * 86400000)
            .toISOString()
            .slice(0, 10)
        : null;

      const res = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          description: `${task.description}\n\n[Created by Cara${outputId ? ` — output ${outputId}` : ""}]`,
          priority: task.priority,
          category: task.category ?? "general",
          status: "not_started",
          assigned_role: task.assignedRole ?? null,
          due_date: dueDate,
          home_id: homeId,
          linked_child_id: linkedChildId ?? null,
          linked_incident_id: linkedIncidentId ?? null,
          auto_generated: true,
          tags: ["cara-suggested"],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTaskStates((prev) => ({ ...prev, [task.id]: "created" }));
        onTaskCreated?.({ id: data?.data?.id ?? task.id, title: task.title });
      } else {
        // Revert to pending on failure
        setTaskStates((prev) => ({ ...prev, [task.id]: "pending" }));
      }
    } catch {
      setTaskStates((prev) => ({ ...prev, [task.id]: "pending" }));
    }
  }

  function skipTask(taskId: string) {
    setTaskStates((prev) => ({ ...prev, [taskId]: "skipped" }));
  }

  function startEditing(task: ParsedTask) {
    setEditingTask({ ...task });
    setTaskStates((prev) => ({ ...prev, [task.id]: "editing" }));
  }

  function saveEdit() {
    if (!editingTask) return;
    // Update the task in parsedTasks by replacing via state — since parsedTasks
    // is memoised we store edited versions separately
    setEditingTask(null);
  }

  // Check if all are done and call onComplete
  React.useEffect(() => {
    if (allProcessed && createdCount > 0) {
      onComplete?.();
    }
  }, [allProcessed, createdCount, onComplete]);

  if (parsedTasks.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4",
          className,
        )}
      >
        <div className="flex items-center gap-2 text-xs text-[var(--cs-text-muted)]">
          <ListTodo className="h-4 w-4" />
          <span>No tasks could be parsed from the Cara output</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)]",
        className,
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-3 text-left hover:bg-[var(--cs-cara-gold-bg)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-[var(--cs-cara-gold)]" />
          <span className="text-sm font-medium text-[var(--cs-navy)]">
            Cara suggested {parsedTasks.length} task
            {parsedTasks.length !== 1 ? "s" : ""}
          </span>
          {createdCount > 0 && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
              {createdCount} created
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />
        )}
      </button>

      {/* Task list */}
      {expanded && (
        <div className="border-t border-[var(--cs-border)] divide-y divide-[var(--cs-border)]">
          {parsedTasks.map((task) => {
            const state = taskStates[task.id];
            const isEditing =
              state === "editing" && editingTask?.id === task.id;

            return (
              <div
                key={task.id}
                className={cn(
                  "p-3 transition-colors",
                  state === "created" && "bg-green-50/50",
                  state === "skipped" && "bg-gray-50/50 opacity-60",
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Status icon */}
                  <div className="mt-0.5 shrink-0">
                    {state === "created" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : state === "skipped" ? (
                      <X className="h-4 w-4 text-gray-400" />
                    ) : state === "creating" ? (
                      <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                    ) : (
                      <div className="h-4 w-4 rounded-sm border border-[var(--cs-border)]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    {isEditing && editingTask ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingTask.title}
                          onChange={(e) =>
                            setEditingTask({
                              ...editingTask,
                              title: e.target.value,
                            })
                          }
                          className="w-full rounded border border-[var(--cs-border)] px-2 py-1 text-sm"
                        />
                        <textarea
                          value={editingTask.description}
                          onChange={(e) =>
                            setEditingTask({
                              ...editingTask,
                              description: e.target.value,
                            })
                          }
                          rows={2}
                          className="w-full rounded border border-[var(--cs-border)] px-2 py-1 text-xs"
                        />
                        <div className="flex gap-2">
                          <select
                            value={editingTask.priority}
                            onChange={(e) =>
                              setEditingTask({
                                ...editingTask,
                                priority:
                                  e.target.value as ParsedTask["priority"],
                              })
                            }
                            className="rounded border border-[var(--cs-border)] px-2 py-1 text-xs"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                          <button
                            onClick={() => {
                              saveEdit();
                              createTask(editingTask);
                            }}
                            className="rounded bg-[var(--cs-navy)] px-3 py-1 text-xs text-white hover:opacity-90"
                          >
                            Save & Create
                          </button>
                          <button
                            onClick={() => {
                              setEditingTask(null);
                              setTaskStates((prev) => ({
                                ...prev,
                                [task.id]: "pending",
                              }));
                            }}
                            className="rounded border border-[var(--cs-border)] px-3 py-1 text-xs hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--cs-navy)]">
                            {task.title}
                          </span>
                          {task.isSafeguarding && (
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                          )}
                        </div>
                        {task.description && (
                          <p className="mt-0.5 text-xs text-[var(--cs-text-muted)] line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-medium",
                              task.priority === "urgent" &&
                                "bg-red-100 text-red-700",
                              task.priority === "high" &&
                                "bg-orange-100 text-orange-700",
                              task.priority === "medium" &&
                                "bg-blue-100 text-blue-700",
                              task.priority === "low" &&
                                "bg-gray-100 text-gray-600",
                            )}
                          >
                            {task.priority}
                          </span>
                          {task.assignedRole && (
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                              {task.assignedRole}
                            </span>
                          )}
                          {task.dueDays && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                              {task.dueDays}d
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {state === "pending" && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => startEditing(task)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Edit before creating"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => createTask(task)}
                        className="rounded p-1 text-green-500 hover:bg-green-50 hover:text-green-700"
                        title="Create task"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => skipTask(task.id)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Skip"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Bulk actions */}
          {!allProcessed && (
            <div className="flex gap-2 p-3 bg-gray-50/50">
              <button
                onClick={() => {
                  for (const t of parsedTasks) {
                    if (taskStates[t.id] === "pending") createTask(t);
                  }
                }}
                className="rounded bg-[var(--cs-navy)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                Create all ({parsedTasks.filter((t) => taskStates[t.id] === "pending").length})
              </button>
              <button
                onClick={() => {
                  for (const t of parsedTasks) {
                    if (taskStates[t.id] === "pending") skipTask(t.id);
                  }
                }}
                className="rounded border border-[var(--cs-border)] px-3 py-1.5 text-xs hover:bg-gray-100"
              >
                Skip all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Export parser for testing ─────────────────────────────────────────────
export { parseTasksFromText };
export type { ParsedTask };
