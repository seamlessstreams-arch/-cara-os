"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraAuditTimeline
//
// Shows a timeline of Cara audit events for a specific output or request.
// Displays who did what and when across the generation/approval lifecycle.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Mic,
  Copy,
  ListTodo,
  Eye,
  XCircle,
  ShieldAlert,
  Archive,
} from "lucide-react";

interface AuditEvent {
  id: string;
  event_type: string;
  actor_user_id: string;
  actor_role?: string;
  event_detail?: Record<string, unknown>;
  created_at: string;
}

interface CaraAuditTimelineProps {
  events: AuditEvent[];
  className?: string;
}

const EVENT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  generated: { label: "Generated", icon: Sparkles, color: "text-[var(--cs-cara-gold)]" },
  edited: { label: "Edited", icon: Edit3, color: "text-blue-600" },
  submitted_for_approval: { label: "Submitted for approval", icon: Eye, color: "text-indigo-600" },
  approved: { label: "Approved", icon: ThumbsUp, color: "text-green-600" },
  rejected: { label: "Rejected", icon: ThumbsDown, color: "text-red-600" },
  committed: { label: "Committed to record", icon: CheckCircle2, color: "text-emerald-600" },
  transcribed: { label: "Transcribed", icon: Mic, color: "text-purple-600" },
  copied_to_field: { label: "Copied to field", icon: Copy, color: "text-gray-600" },
  task_created: { label: "Task created", icon: ListTodo, color: "text-blue-600" },
  context_viewed: { label: "Context viewed", icon: Eye, color: "text-gray-500" },
  failed: { label: "Failed", icon: XCircle, color: "text-red-600" },
  permission_denied: { label: "Permission denied", icon: ShieldAlert, color: "text-red-700" },
  withdrawn: { label: "Withdrawn", icon: Archive, color: "text-gray-500" },
};

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export function CaraAuditTimeline({ events, className }: CaraAuditTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={cn("text-xs text-[var(--cs-text-muted)] py-4 text-center", className)}>
        No audit events recorded
      </div>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {events.map((event, idx) => {
        const config = EVENT_CONFIG[event.event_type] ?? {
          label: event.event_type,
          icon: AlertTriangle,
          color: "text-gray-500",
        };
        const Icon = config.icon;
        const isLast = idx === events.length - 1;

        return (
          <div key={event.id} className="flex gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white border-2", config.color, "border-current")}>
                <Icon className="h-3 w-3" />
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-[var(--cs-border)] min-h-[16px]" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-medium", config.color)}>
                  {config.label}
                </span>
              </div>
              <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">
                {event.actor_user_id}
                {event.actor_role ? ` (${event.actor_role.replace(/_/g, " ")})` : ""}
                {" · "}
                {formatTime(event.created_at)}
              </div>
              {event.event_detail && Object.keys(event.event_detail).length > 0 && (
                <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">
                  {event.event_detail.commandId ? `Command: ${String(event.event_detail.commandId).replace(/_/g, " ")}` : null}
                  {event.event_detail.reason ? ` — ${String(event.event_detail.reason)}` : null}
                  {event.event_detail.decisionText ? ` — ${String(event.event_detail.decisionText)}` : null}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
