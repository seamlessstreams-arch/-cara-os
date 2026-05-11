"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TASKS SUMMARY CARD
// Dashboard widget showing task volume, overdue items, priority breakdown,
// and upcoming deadlines at a glance.
// Tasks are the backbone of daily operations — every action, follow-up,
// and compliance requirement flows through the task system.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/hooks/use-dashboard";
import { cn, formatRelative } from "@/lib/utils";
import {
  ClipboardList, Loader2, AlertTriangle, CheckCircle2,
  ChevronRight, Clock, Flame, Target,
  CheckCheck, ArrowRight, Circle,
} from "lucide-react";
import type { Task } from "@/types";

// ── Priority config ─────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { label: string; colour: string; dot: string }> = {
  urgent:  { label: "Urgent",  colour: "text-red-700",    dot: "bg-red-500"     },
  high:    { label: "High",    colour: "text-orange-700",  dot: "bg-orange-400"  },
  medium:  { label: "Medium",  colour: "text-amber-700",   dot: "bg-amber-400"   },
  low:     { label: "Low",     colour: "text-[var(--cs-text-secondary)]",   dot: "bg-[var(--cs-text-muted)]"   },
};

// ── Component ───────────────────────────────────────────────────────────────

export function TasksSummaryCard() {
  const { data: dashData, isLoading } = useDashboard();
  const d = dashData?.data;

  const {
    active, overdue, dueToday, urgent, completedToday,
    awaitingSignOff, priorityQueue, hasUrgent,
  } = useMemo(() => {
    if (!d) return {
      active: 0, overdue: 0, dueToday: 0, urgent: 0,
      completedToday: 0, awaitingSignOff: 0,
      priorityQueue: [] as Task[],
      hasUrgent: false,
    };

    return {
      active: d.tasks.active,
      overdue: d.tasks.overdue,
      dueToday: d.tasks.due_today,
      urgent: d.tasks.urgent,
      completedToday: d.tasks.completed_today,
      awaitingSignOff: d.tasks.awaiting_sign_off,
      priorityQueue: d.tasks.priority_queue ?? [],
      hasUrgent: d.tasks.overdue > 0 || d.tasks.urgent > 0,
    };
  }, [d]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <ClipboardList className="h-4 w-4 text-indigo-500" />
            Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(hasUrgent && "border-red-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <ClipboardList className="h-4 w-4 text-indigo-500" />
            Tasks
          </CardTitle>
          <Link href="/tasks">
            <Badge className="text-[9px] bg-indigo-100 text-indigo-700 border-0 rounded-full hover:bg-indigo-200 cursor-pointer">
              View all
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-indigo-50 p-2 text-center">
            <Target className="h-3 w-3 text-indigo-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-indigo-700 tabular-nums">{active}</div>
            <div className="text-[9px] text-indigo-500">Active</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", overdue > 0 ? "bg-red-50" : "bg-emerald-50")}>
            <AlertTriangle className={cn("h-3 w-3 mx-auto mb-0.5", overdue > 0 ? "text-red-500" : "text-emerald-500")} />
            <div className={cn("text-sm font-bold tabular-nums", overdue > 0 ? "text-red-700" : "text-emerald-700")}>{overdue}</div>
            <div className={cn("text-[9px]", overdue > 0 ? "text-red-500" : "text-emerald-500")}>Overdue</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", dueToday > 0 ? "bg-amber-50" : "bg-[var(--cs-surface)]")}>
            <Clock className={cn("h-3 w-3 mx-auto mb-0.5", dueToday > 0 ? "text-amber-500" : "text-[var(--cs-text-muted)]")} />
            <div className={cn("text-sm font-bold tabular-nums", dueToday > 0 ? "text-amber-700" : "text-[var(--cs-text-muted)]")}>{dueToday}</div>
            <div className={cn("text-[9px]", dueToday > 0 ? "text-amber-500" : "text-[var(--cs-text-muted)]")}>Due Today</div>
          </div>
        </div>

        {/* Secondary metrics */}
        <div className="flex items-center justify-between text-[10px] px-1">
          <div className="flex items-center gap-3">
            {urgent > 0 && (
              <span className="flex items-center gap-1 font-semibold text-red-600">
                <Flame className="h-3 w-3" /> {urgent} urgent
              </span>
            )}
            {awaitingSignOff > 0 && (
              <span className="flex items-center gap-1 text-[var(--cs-aria-gold)]">
                <CheckCheck className="h-3 w-3" /> {awaitingSignOff} sign-off
              </span>
            )}
          </div>
          {completedToday > 0 && (
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="h-3 w-3" /> {completedToday} done today
            </span>
          )}
        </div>

        {/* Overdue warning */}
        {overdue > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2 flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-red-700">
                {overdue} overdue task{overdue !== 1 ? "s" : ""}
              </p>
              <p className="text-[10px] text-red-600">
                Review and action overdue tasks to maintain compliance
              </p>
            </div>
          </div>
        )}

        {/* All clear */}
        {overdue === 0 && active === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">
              No outstanding tasks
            </span>
          </div>
        )}

        {/* Priority queue */}
        {priorityQueue.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-medium text-[var(--cs-text-muted)]">Priority Queue</span>
            </div>
            {priorityQueue.slice(0, 5).map((task) => {
              const priConfig = PRIORITY_CONFIG[task.priority] ?? {
                label: task.priority, colour: "text-[var(--cs-text-secondary)]", dot: "bg-[var(--cs-text-muted)]",
              };
              const isTaskOverdue = task.due_date && new Date(task.due_date) < new Date();
              return (
                <Link key={task.id} href={`/tasks/${task.id}`}>
                  <div className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--cs-surface)] transition-colors",
                    isTaskOverdue && "bg-red-50/50",
                  )}>
                    <span className={cn("w-2 h-2 rounded-full shrink-0", priConfig.dot)} />
                    <span className="text-[11px] font-medium text-[var(--cs-text-secondary)] flex-1 truncate">
                      {task.title}
                    </span>
                    {task.due_date && (
                      <span className={cn(
                        "text-[9px] tabular-nums shrink-0",
                        isTaskOverdue ? "text-red-500 font-semibold" : "text-[var(--cs-text-muted)]",
                      )}>
                        {formatRelative(task.due_date)}
                      </span>
                    )}
                    <Badge className={cn(
                      "text-[8px] px-1.5 py-0 rounded-full border-0",
                      isTaskOverdue ? "bg-red-100 text-red-700"
                      : task.status === "in_progress" ? "bg-blue-100 text-blue-700"
                      : task.status === "not_started" ? "bg-[var(--cs-surface)] text-[var(--cs-text-secondary)]"
                      : task.status === "blocked" ? "bg-orange-100 text-orange-700"
                      : "bg-emerald-100 text-emerald-700",
                    )}>
                      {(task.status ?? "pending").replace(/_/g, " ")}
                    </Badge>
                  </div>
                </Link>
              );
            })}
            {priorityQueue.length > 5 && (
              <Link href="/tasks">
                <p className="text-[10px] text-indigo-600 hover:underline px-2">
                  +{priorityQueue.length - 5} more tasks
                </p>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
