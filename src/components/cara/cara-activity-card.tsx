"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraActivityCard
//
// Dashboard widget showing Cara usage statistics at a glance. Shows key
// metrics (requests, approvals, tasks, transcriptions) and top commands.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { cn } from "@/lib/utils";
import { useCaraActivity } from "@/hooks/use-cara-activity";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  ListTodo,
  Mic,
  TrendingUp,
  Loader2,
} from "lucide-react";

interface CaraActivityCardProps {
  homeId?: string;
  days?: number;
  className?: string;
}

function formatCommandId(id: string): string {
  return id
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Expose pure helpers for unit testing
export const _testing = { formatCommandId };

export function CaraActivityCard({
  homeId,
  days = 30,
  className,
}: CaraActivityCardProps) {
  const { data: stats, isLoading } = useCaraActivity({ homeId, days });

  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-white p-5",
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--cs-cara-gold)]" />
          <span className="text-xs text-[var(--cs-text-muted)]">
            Loading Cara activity...
          </span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const metrics = [
    {
      label: "Requests",
      value: stats.totalRequests,
      icon: Sparkles,
      color: "text-[var(--cs-cara-gold)]",
    },
    {
      label: "Approved",
      value: stats.approvedOutputs,
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      label: "Rejected",
      value: stats.rejectedOutputs,
      icon: XCircle,
      color: "text-red-500",
    },
    {
      label: "Tasks created",
      value: stats.tasksCreated,
      icon: ListTodo,
      color: "text-blue-600",
    },
    {
      label: "Dictations",
      value: stats.transcriptions,
      icon: Mic,
      color: "text-purple-600",
    },
    {
      label: "Approval rate",
      value: `${stats.approvalRate}%`,
      icon: TrendingUp,
      color: "text-emerald-600",
    },
  ];

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-white overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-blue-50 border-b border-[var(--cs-cara-gold-soft)]">
        <div className="h-7 w-7 rounded-lg bg-[var(--cs-navy)] flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-[var(--cs-navy)]">
            Cara Activity
          </div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">
            Last {days} days
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-px bg-[var(--cs-border)]">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="bg-white px-3 py-3 text-center"
            >
              <Icon className={cn("h-4 w-4 mx-auto mb-1", metric.color)} />
              <div className="text-lg font-bold text-[var(--cs-navy)]">
                {metric.value}
              </div>
              <div className="text-[10px] text-[var(--cs-text-muted)]">
                {metric.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Top commands */}
      {stats.topCommands.length > 0 && (
        <div className="px-5 py-3 border-t border-[var(--cs-border)]">
          <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">
            Most used commands
          </div>
          <div className="space-y-1.5">
            {stats.topCommands.slice(0, 5).map((cmd) => (
              <div key={cmd.commandId} className="flex items-center gap-2">
                <div className="flex-1 text-xs text-[var(--cs-text-secondary)]">
                  {formatCommandId(cmd.commandId)}
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-1.5 rounded-full bg-[var(--cs-cara-gold)]"
                    style={{
                      width: `${Math.max(
                        16,
                        (cmd.count / stats.topCommands[0].count) * 80,
                      )}px`,
                    }}
                  />
                  <span className="text-[10px] text-[var(--cs-text-muted)] w-6 text-right">
                    {cmd.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence and pending */}
      <div className="flex items-center justify-between px-5 py-2 border-t border-[var(--cs-border)] bg-gray-50/50">
        <div className="text-[10px] text-[var(--cs-text-muted)]">
          Avg confidence:{" "}
          <span
            className={cn(
              "font-medium",
              stats.avgConfidence === "high" && "text-green-600",
              stats.avgConfidence === "medium" && "text-amber-600",
              stats.avgConfidence === "low" && "text-red-600",
            )}
          >
            {stats.avgConfidence}
          </span>
        </div>
        {stats.pendingOutputs > 0 && (
          <div className="text-[10px] text-amber-600 font-medium">
            {stats.pendingOutputs} pending review
          </div>
        )}
      </div>
    </div>
  );
}
