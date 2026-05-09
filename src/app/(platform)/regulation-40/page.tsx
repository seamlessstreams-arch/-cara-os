"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — REGULATION 40 TRIAGE QUEUE
// Notifiable events requiring manager review + potential Ofsted notification
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
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
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useReg40Triage, useTriageReg40Task, type Reg40Task } from "@/hooks/use-oversight-queues";
import { useAuthContext } from "@/contexts/auth-context";
import { toast } from "sonner";
import Link from "next/link";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Status colours ─────────────────────────────────────────────────────────────

const CATEGORY_CLR: Record<string, string> = {
  behaviour: "bg-amber-100 text-amber-800",
  safeguarding: "bg-red-100 text-red-800",
  health: "bg-blue-100 text-blue-800",
  missing_episode: "bg-purple-100 text-purple-800",
  physical_intervention: "bg-orange-100 text-orange-800",
  restraint: "bg-orange-100 text-orange-800",
  incident: "bg-red-100 text-red-800",
  complaint: "bg-yellow-100 text-yellow-800",
};

// ── Reg 40 task card ──────────────────────────────────────────────────────────

function Reg40TaskCard({
  task,
  onTriage,
}: {
  task: Reg40Task;
  onTriage: (task: Reg40Task) => void;
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
        isOverdue ? "border-red-300 bg-red-50/20 shadow-sm" : "border-orange-200 bg-orange-50/10",
        task.status === "completed" && "opacity-60 border-slate-200 bg-white"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <Badge className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                REG 40 TRIAGE
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
              {task.status === "completed" && (
                <Badge className="text-xs bg-emerald-100 text-emerald-800">TRIAGED</Badge>
              )}
              {isOverdue && <Badge className="text-xs bg-red-100 text-red-800">OVERDUE</Badge>}
            </div>

            <h3 className="font-medium text-slate-900 text-sm">{task.title}</h3>

            {task.care_event && (
              <p className="text-xs text-slate-500 mt-0.5">
                Source:{" "}
                <Link
                  href={`/care-events/${task.care_event.id}`}
                  className="text-indigo-600 hover:underline"
                >
                  {task.care_event.title}
                </Link>{" "}
                — {formatDate(task.care_event.event_date)}
              </p>
            )}

            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
              {task.due_date && (
                <span className={cn("flex items-center gap-1", isOverdue && "text-red-600 font-medium")}>
                  <Calendar className="h-3 w-3" />
                  Due {formatDate(task.due_date)}
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
                className="h-7 text-xs bg-orange-600 hover:bg-orange-700"
                onClick={() => onTriage(task)}
              >
                <ShieldAlert className="h-3 w-3 mr-1" />
                Triage
              </Button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-orange-100 space-y-2">
            <p className="text-sm text-slate-700">{task.description}</p>
            {task.care_event?.content_excerpt && (
              <div className="bg-slate-50 rounded p-2">
                <p className="text-xs font-medium text-slate-500 mb-1">Original record excerpt</p>
                <p className="text-xs text-slate-700">{task.care_event.content_excerpt}</p>
              </div>
            )}
            {task.evidence_note && (
              <div className="bg-emerald-50 rounded p-2">
                <p className="text-xs font-medium text-emerald-700 mb-0.5">Triage decision</p>
                <p className="text-xs text-slate-700">{task.evidence_note}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Triage dialog ─────────────────────────────────────────────────────────────

type TriageAction = "notify_ofsted" | "no_notification_required";

function TriageDialog({
  task,
  onClose,
}: {
  task: Reg40Task;
  onClose: () => void;
}) {
  const { currentUser } = useAuthContext();
  const triageMutation = useTriageReg40Task();
  const [action, setAction] = useState<TriageAction | null>(null);
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!action) return;
    triageMutation.mutate(
      {
        task_id: task.id,
        action,
        completed_by: currentUser?.id ?? "staff_darren",
        evidence_note: note || undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            action === "notify_ofsted"
              ? "Regulation 40 notification recorded"
              : "No notification required — record saved"
          );
          onClose();
        },
        onError: () => {
          toast.error("Failed to save triage decision");
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Regulation 40 Triage Decision</DialogTitle>
          <DialogDescription>
            Review this event and determine whether a Regulation 40 notifiable event
            notification must be made to Ofsted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Source event summary */}
          {task.care_event && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide mb-1">
                Source Care Event
              </p>
              <p className="text-sm font-medium text-slate-900">{task.care_event.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {task.care_event.category.replace(/_/g, " ")} —{" "}
                {formatDate(task.care_event.event_date)}
              </p>
              {task.care_event.content_excerpt && (
                <p className="text-xs text-slate-700 mt-2">{task.care_event.content_excerpt}</p>
              )}
            </div>
          )}

          {/* Decision buttons */}
          <div>
            <Label className="text-sm font-medium">Triage decision</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => setAction("notify_ofsted")}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border-2 text-sm transition-all",
                  action === "notify_ofsted"
                    ? "border-red-500 bg-red-50 text-red-900"
                    : "border-slate-200 hover:border-red-300 hover:bg-red-50/50"
                )}
              >
                <Bell className={cn("h-5 w-5", action === "notify_ofsted" ? "text-red-600" : "text-slate-400")} />
                <span className="font-medium">Notify Ofsted</span>
                <span className="text-xs text-center text-slate-500">
                  This is a Reg 40 notifiable event
                </span>
              </button>
              <button
                onClick={() => setAction("no_notification_required")}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border-2 text-sm transition-all",
                  action === "no_notification_required"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                )}
              >
                <BellOff
                  className={cn(
                    "h-5 w-5",
                    action === "no_notification_required" ? "text-emerald-600" : "text-slate-400"
                  )}
                />
                <span className="font-medium">No Notification</span>
                <span className="text-xs text-center text-slate-500">
                  Not a notifiable event
                </span>
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="triage_note" className="text-sm">
              Decision rationale <span className="text-slate-400">(recommended)</span>
            </Label>
            <Textarea
              id="triage_note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Record your reasoning for this triage decision..."
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
            onClick={handleSubmit}
            disabled={!action || triageMutation.isPending}
            className={cn(
              action === "notify_ofsted" && "bg-red-600 hover:bg-red-700",
              action === "no_notification_required" && "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            {triageMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save Decision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Regulation40Page() {
  const [filter, setFilter] = useState<"active" | "all" | "completed">("active");
  const [triagingTask, setTriagingTask] = useState<Reg40Task | null>(null);

  const statusParam = filter === "active" ? "not_started" : filter === "completed" ? "completed" : undefined;
  const { data, isLoading } = useReg40Triage({ status: statusParam });

  const tasks = data?.data ?? [];
  const meta = data?.meta;

  const FILTERS: Array<{ key: typeof filter; label: string }> = [
    { key: "active", label: "Awaiting triage" },
    { key: "all", label: "All" },
    { key: "completed", label: "Triaged" },
  ];

  return (
    <PageShell
      title="Regulation 40 Triage Queue"
      subtitle="Events requiring triage to determine if an Ofsted notifiable event notification is required"
    >
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          {
            label: "Awaiting Triage",
            value: meta?.active ?? 0,
            icon: <Clock className="h-4 w-4 text-orange-600" />,
            colour: "bg-orange-50 border-orange-100",
          },
          {
            label: "Overdue",
            value: meta?.overdue ?? 0,
            icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
            colour: "bg-red-50 border-red-100",
          },
          {
            label: "Unflagged events",
            value: meta?.care_events_pending_triage ?? 0,
            icon: <FileText className="h-4 w-4 text-slate-500" />,
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

      {/* Context note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-sm text-amber-800">
        <span className="font-semibold">Regulation 40</span> — Children&apos;s homes must notify
        Ofsted of notifiable events without delay. Review each item below and record your triage decision.
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
          Loading triage queue...
        </div>
      ) : tasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <ShieldAlert className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-600">No events requiring triage</p>
            <p className="text-sm text-slate-400 mt-1">
              {filter === "active"
                ? "No active Regulation 40 triage items — submit Care Events flagged for Reg 40 to populate this queue."
                : "No items found for the selected filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Reg40TaskCard key={task.id} task={task} onTriage={setTriagingTask} />
          ))}
        </div>
      )}

      {triagingTask && (
        <TriageDialog task={triagingTask} onClose={() => setTriagingTask(null)} />
      )}
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
