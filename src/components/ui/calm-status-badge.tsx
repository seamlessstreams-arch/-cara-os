// ══════════════════════════════════════════════════════════════════════════════
// CARA — CALM STATUS BADGE
// Gentle, rounded-full pills with soft backgrounds.
// Text always present — never colour-only meaning.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Info,
  Star,
  ThumbsUp,
} from "lucide-react";

export type CalmStatus =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "overdue"
  | "due"
  | "complete"
  | "draft"
  | "urgent"
  | "info";

interface CalmStatusBadgeProps {
  status: CalmStatus;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const STATUS_CONFIG: Record<
  CalmStatus,
  {
    defaultLabel: string;
    bg: string;
    text: string;
    icon: React.ElementType;
    pulse?: boolean;
  }
> = {
  outstanding: {
    defaultLabel: "Outstanding",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    icon: Star,
  },
  good: {
    defaultLabel: "Good",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    icon: ThumbsUp,
  },
  adequate: {
    defaultLabel: "Adequate",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    icon: AlertTriangle,
  },
  inadequate: {
    defaultLabel: "Inadequate",
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    icon: XCircle,
  },
  overdue: {
    defaultLabel: "Overdue",
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    icon: XCircle,
  },
  due: {
    defaultLabel: "Due",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    icon: Clock,
  },
  complete: {
    defaultLabel: "Complete",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    icon: CheckCircle2,
  },
  draft: {
    defaultLabel: "Draft",
    bg: "bg-slate-50 border-slate-200",
    text: "text-slate-600",
    icon: FileText,
  },
  urgent: {
    defaultLabel: "Urgent",
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    icon: AlertTriangle,
    pulse: true,
  },
  info: {
    defaultLabel: "Info",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    icon: Info,
  },
};

export function CalmStatusBadge({
  status,
  label,
  size = "md",
  className,
}: CalmStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const displayLabel = label ?? config.defaultLabel;
  const Icon = config.icon;

  return (
    <span
      role="status"
      aria-label={displayLabel}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors",
        config.bg,
        config.text,
        size === "sm" && "px-2 py-0.5 text-[10px]",
        size === "md" && "px-2.5 py-1 text-xs",
        config.pulse && "animate-pulse",
        className,
      )}
    >
      <Icon
        className={cn(
          "shrink-0",
          size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5",
        )}
      />
      {displayLabel}
    </span>
  );
}
