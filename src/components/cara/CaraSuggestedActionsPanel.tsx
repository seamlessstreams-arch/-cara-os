"use client";

import { useState, useCallback } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ListTodo,
  Send,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SuggestedAction } from "@/lib/cara/orchestrator/types";

// ══════════════════════════════════════════════════════════════════════════════
// CaraSuggestedActionsPanel — priority-coded next-step suggestions
//
// Shows suggested actions from the orchestrator, each with priority colour,
// owner suggestion, and buttons to create a task or send to manager.
// ══════════════════════════════════════════════════════════════════════════════

const PRIORITY_CONFIG: Record<
  SuggestedAction["priority"],
  { label: string; icon: typeof AlertCircle; className: string }
> = {
  immediate: {
    label: "Immediate",
    icon: AlertCircle,
    className: "border-red-200 bg-red-50 text-red-700",
  },
  today: {
    label: "Today",
    icon: Clock,
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  this_week: {
    label: "This Week",
    icon: Clock,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  this_month: {
    label: "This Month",
    icon: Clock,
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  monitor: {
    label: "Monitor",
    icon: CheckCircle2,
    className: "border-slate-200 bg-slate-50 text-slate-600",
  },
};

type CaraSuggestedActionsPanelProps = {
  actions: SuggestedAction[];
  homeId: string;
  userId: string;
  className?: string;
};

export function CaraSuggestedActionsPanel({
  actions,
  homeId,
  userId,
  className,
}: CaraSuggestedActionsPanelProps) {
  const [creatingTask, setCreatingTask] = useState<number | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [createdTasks, setCreatedTasks] = useState<Set<number>>(new Set());

  const handleCreateTask = useCallback(
    async (action: SuggestedAction, index: number) => {
      setCreatingTask(index);
      try {
        const response = await fetch("/api/cara/create-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            homeId,
            userId,
            tasks: [
              {
                title: action.title,
                description: action.description,
                priority: action.priority,
                ownerRole: action.ownerRole,
                rationale: action.rationale,
                actionType: action.actionType,
              },
            ],
          }),
        });

        if (response.ok) {
          setCreatedTasks((prev) => new Set([...prev, index]));
        }
      } finally {
        setCreatingTask(null);
      }
    },
    [homeId, userId],
  );

  const handleSendAllToManager = useCallback(async () => {
    setSendingAll(true);
    try {
      await fetch("/api/cara/create-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeId,
          userId,
          sendToManager: true,
          tasks: actions.map((action) => ({
            title: action.title,
            description: action.description,
            priority: action.priority,
            ownerRole: action.ownerRole,
            rationale: action.rationale,
            actionType: action.actionType,
          })),
        }),
      });
    } finally {
      setSendingAll(false);
    }
  }, [actions, homeId, userId]);

  if (actions.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-sm font-medium text-[var(--cs-navy)]">
          <ListTodo className="size-4" />
          Suggested Actions ({actions.length})
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendAllToManager}
          disabled={sendingAll}
          className="gap-1.5"
        >
          {sendingAll ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          Send all to manager
        </Button>
      </div>

      <div className="space-y-2">
        {actions.map((action, index) => {
          const priorityCfg = PRIORITY_CONFIG[action.priority];
          const PriorityIcon = priorityCfg.icon;
          const isCreated = createdTasks.has(index);
          const isCreating = creatingTask === index;

          return (
            <Card key={index} className="p-3 hover:shadow-none">
              <div className="space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--cs-navy)]">
                      {action.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--cs-text-secondary)]">
                      {action.description}
                    </p>
                  </div>
                  <Badge className={cn("shrink-0 gap-1 text-[10px]", priorityCfg.className)}>
                    <PriorityIcon className="size-3" />
                    {priorityCfg.label}
                  </Badge>
                </div>

                {/* Footer: owner + action button */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-[var(--cs-text-gentle)]">
                    <User className="size-3" />
                    Suggested owner: {action.ownerRole.replace(/_/g, " ")}
                  </span>

                  {isCreated ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 className="size-3.5" />
                      Task created
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCreateTask(action, index)}
                      disabled={isCreating}
                      className="h-7 gap-1 text-xs"
                    >
                      {isCreating ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <ArrowUpRight className="size-3" />
                      )}
                      Create task
                    </Button>
                  )}
                </div>

                {/* Rationale */}
                {action.rationale && (
                  <p className="text-[11px] italic text-[var(--cs-text-gentle)]">
                    {action.rationale}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
