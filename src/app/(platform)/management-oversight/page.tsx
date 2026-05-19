"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MANAGEMENT OVERSIGHT QUEUE
// Connected to Care Event routing — shows all events requiring manager action
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  User,
  Calendar,
  Zap,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  useManagementOversight,
  useCompleteOversightTask,
  type OversightTask,
} from "@/hooks/use-oversight-queues";
import { useAuthContext } from "@/contexts/auth-context";
import { toast } from "sonner";
import Link from "next/link";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── Status / priority colours ─────────────────────────────────────────────────

const PRIORITY_CLR: Record<string, string> = {
  urgent: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const STATUS_CLR: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-400",
  blocked: "bg-red-100 text-red-700",
};

const CATEGORY_CLR: Record<string, string> = {
  behaviour: "bg-amber-100 text-amber-800",
  safeguarding: "bg-red-100 text-red-800",
  health: "bg-blue-100 text-blue-800",
  missing_episode: "bg-purple-100 text-purple-800",
  physical_intervention: "bg-orange-100 text-orange-800",
  restraint: "bg-orange-100 text-orange-800",
  incident: "bg-red-100 text-red-800",
  general: "bg-slate-100 text-slate-700",
};

// ── Oversight task card ────────────────────────────────────────────────────────

function OversightTaskCard({
  task,
  onComplete,
}: {
  task: OversightTask;
  onComplete: (task: OversightTask) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue =
    task.due_date &&
    task.due_date < today &&
    task.status !== "completed" &&
    task.status !== "cancelled";

  return (
    <Card
      className={cn(
        "border transition-all",
        isOverdue && "border-red-200 bg-red-50/30",
        task.status === "completed" && "opacity-60",
        task.priority === "urgent" && task.status !== "completed" && "border-red-300 shadow-sm"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Priority + status badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <Badge className={cn("text-xs border", PRIORITY_CLR[task.priority] ?? PRIORITY_CLR.medium)}>
                {task.priority.toUpperCase()}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", STATUS_CLR[task.status] ?? "")}>
                {task.status.replace(/_/g, " ")}
              </Badge>
              {task.care_event && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs capitalize",
                    CATEGORY_CLR[task.care_event.category] ?? "bg-slate-100 text-slate-700"
                  )}
                >
                  {task.care_event.category.replace(/_/g, " ")}
                </Badge>
              )}
              {isOverdue && (
                <Badge className="text-xs bg-red-100 text-red-800 border-red-200">
                  OVERDUE
                </Badge>
              )}
            </div>

            <h3 className="font-medium text-slate-900 text-sm">{task.title}</h3>

            {task.care_event && (
              <p className="text-xs text-slate-500 mt-0.5">
                Source: {task.care_event.title} — {formatDate(task.care_event.event_date)}
              </p>
            )}

            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
              {task.due_date && (
                <span className={cn("flex items-center gap-1", isOverdue && "text-red-600 font-medium")}>
                  <Calendar className="h-3 w-3" />
                  Due {formatDate(task.due_date)}
                </span>
              )}
              {task.assigned_to && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {(task as never as { assigned_to_name?: string }).assigned_to_name ?? task.assigned_to}
                </span>
              )}
              {task.created_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Created {formatDate(task.created_at)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {task.care_event && (
              <Link href={`/care-events/${task.care_event.id}`} title="View care event">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
            {task.status !== "completed" && task.status !== "cancelled" && (
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => onComplete(task)}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Complete
              </Button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
            <p className="text-sm text-slate-700">{task.description}</p>
            {task.evidence_note && (
              <div className="bg-slate-50 rounded p-2">
                <p className="text-xs font-medium text-slate-500 mb-0.5">Evidence note</p>
                <p className="text-xs text-slate-700">{task.evidence_note}</p>
              </div>
            )}
            {task.care_event && (
              <div className="bg-blue-50 rounded p-2">
                <p className="text-xs font-medium text-blue-700 mb-0.5">Care Event flags</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {task.care_event.status === "manager_review_required" && (
                    <Badge className="text-xs bg-amber-100 text-amber-800">Manager Review Required</Badge>
                  )}
                  {task.care_event.status === "verified" && (
                    <Badge className="text-xs bg-emerald-100 text-emerald-800">Verified</Badge>
                  )}
                  {task.care_event.status === "returned" && (
                    <Badge className="text-xs bg-red-100 text-red-800">Returned</Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Complete dialog ────────────────────────────────────────────────────────────

function CompleteDialog({
  task,
  onClose,
}: {
  task: OversightTask;
  onClose: () => void;
}) {
  const { currentUser } = useAuthContext();
  const completeMutation = useCompleteOversightTask();
  const [note, setNote] = useState("");

  const handleComplete = () => {
    completeMutation.mutate(
      {
        task_id: task.id,
        completed_by: currentUser?.id ?? "staff_darren",
        evidence_note: note || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Oversight task completed");
          onClose();
        },
        onError: () => {
          toast.error("Failed to complete task");
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Oversight Task</DialogTitle>
          <DialogDescription>
            Mark this management oversight task as complete. Add an evidence note to record your action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-sm font-medium text-slate-900">{task.title}</p>
            {task.care_event && (
              <p className="text-xs text-slate-500 mt-0.5">
                {task.care_event.title} — {formatDate(task.care_event.event_date)}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="evidence_note" className="text-sm">
              Evidence note <span className="text-slate-400">(optional)</span>
            </Label>
            <Textarea
              id="evidence_note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe what management action was taken..."
              rows={3}
              className="mt-1 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Complete Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ManagementOversightPage() {
  const [filter, setFilter] = useState<"active" | "all" | "completed">("active");
  const [completingTask, setCompletingTask] = useState<OversightTask | null>(null);

  const statusParam = filter === "active" ? "not_started" : filter === "completed" ? "completed" : undefined;
  const { data, isLoading } = useManagementOversight({ status: statusParam });

  const tasks = data?.data ?? [];
  const meta = data?.meta;

  const FILTERS: Array<{ key: typeof filter; label: string }> = [
    { key: "active", label: "Active" },
    { key: "all", label: "All" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <PageShell
      title="Management Oversight Queue"
      subtitle="Care events and tasks requiring manager review, verification or sign-off"
      ariaContext={{ pageTitle: "Management Oversight Queue", sourceType: "general" }}
      actions={
        <AriaStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
      }
    >
      <AriaPanel
        mode="oversee"
        pageContext="Management Oversight Queue"
        recordType="management_oversight"
        userRole="registered_manager"
        className="mb-6"
      />
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Active",
            value: meta?.active ?? 0,
            icon: <Clock className="h-4 w-4 text-blue-600" />,
            colour: "bg-blue-50 border-blue-100",
          },
          {
            label: "Urgent",
            value: meta?.urgent ?? 0,
            icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
            colour: "bg-red-50 border-red-100",
          },
          {
            label: "Overdue",
            value: meta?.overdue ?? 0,
            icon: <AlertTriangle className="h-4 w-4 text-orange-600" />,
            colour: "bg-orange-50 border-orange-100",
          },
          {
            label: "Total",
            value: meta?.total ?? 0,
            icon: <Zap className="h-4 w-4 text-slate-500" />,
            colour: "bg-slate-50 border-slate-100",
          },
        ].map((stat) => (
          <Card key={stat.label} className={cn("border", stat.colour)}>
            <CardContent className="p-3 flex items-center gap-2">
              {stat.icon}
              <div>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-100 pb-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading oversight queue...
        </div>
      ) : tasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-600">No items in queue</p>
            <p className="text-sm text-slate-400 mt-1">
              {filter === "active"
                ? "No active oversight tasks — submit Care Events to generate oversight items."
                : "No tasks found for the selected filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <OversightTaskCard
              key={task.id}
              task={task}
              onComplete={setCompletingTask}
            />
          ))}
        </div>
      )}

      {/* Complete dialog */}
      {completingTask && (
        <CompleteDialog task={completingTask} onClose={() => setCompletingTask(null)} />
      )}
      <CareEventsPanel
        title="Care Events Awaiting Review"
        status="manager_review_required"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
