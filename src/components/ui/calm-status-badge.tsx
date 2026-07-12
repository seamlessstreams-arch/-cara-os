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
  // Token-driven (never raw Tailwind colour scales): the --cs-* semantic
  // families carry light AND dark values, so the badge stays readable on every
  // surface without leaning on the .cara-dark hardcoded-utility shim.
  outstanding: {
    defaultLabel: "Outstanding",
    bg: "bg-[var(--cs-success-bg)] border-[var(--cs-success-soft)]",
    text: "text-[var(--cs-success)]",
    icon: Star,
  },
  good: {
    defaultLabel: "Good",
    bg: "bg-[var(--cs-info-bg)] border-[var(--cs-info-soft)]",
    text: "text-[var(--cs-info)]",
    icon: ThumbsUp,
  },
  adequate: {
    defaultLabel: "Adequate",
    bg: "bg-[var(--cs-warning-bg)] border-[var(--cs-warning-soft)]",
    text: "text-[var(--cs-warning)]",
    icon: AlertTriangle,
  },
  inadequate: {
    defaultLabel: "Inadequate",
    bg: "bg-[var(--cs-risk-bg)] border-[var(--cs-risk-soft)]",
    text: "text-[var(--cs-risk)]",
    icon: XCircle,
  },
  overdue: {
    defaultLabel: "Overdue",
    bg: "bg-[var(--cs-risk-bg)] border-[var(--cs-risk-soft)]",
    text: "text-[var(--cs-risk)]",
    icon: XCircle,
  },
  due: {
    defaultLabel: "Due",
    bg: "bg-[var(--cs-warning-bg)] border-[var(--cs-warning-soft)]",
    text: "text-[var(--cs-warning)]",
    icon: Clock,
  },
  complete: {
    defaultLabel: "Complete",
    bg: "bg-[var(--cs-success-bg)] border-[var(--cs-success-soft)]",
    text: "text-[var(--cs-success)]",
    icon: CheckCircle2,
  },
  draft: {
    defaultLabel: "Draft",
    bg: "bg-[var(--cs-surface)] border-[var(--cs-border)]",
    text: "text-[var(--cs-text-secondary)]",
    icon: FileText,
  },
  urgent: {
    defaultLabel: "Urgent",
    bg: "bg-[var(--cs-risk-bg)] border-[var(--cs-risk-soft)]",
    text: "text-[var(--cs-risk)]",
    icon: AlertTriangle,
    pulse: true,
  },
  info: {
    defaultLabel: "Info",
    bg: "bg-[var(--cs-info-bg)] border-[var(--cs-info-soft)]",
    text: "text-[var(--cs-info)]",
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
