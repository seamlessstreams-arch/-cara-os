// ══════════════════════════════════════════════════════════════════════════════
// CARA — STATUS BADGE
// Consistent status indicators across the entire platform.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { cn } from "@/lib/utils";

export type StatusType =
  | "complete"
  | "in_progress"
  | "overdue"
  | "needs_review"
  | "oversight"
  | "cara"
  | "escalated"
  | "low"
  | "medium"
  | "high"
  | "critical"
  | "draft"
  | "active"
  | "pending"
  | "closed"
  | "suspended";

// Token-driven (never raw Tailwind colour scales): the --cs-* semantic families
// carry light AND dark values, so badges stay readable on every surface without
// leaning on the .cara-dark hardcoded-utility shim.
const TONE = {
  success:   { classes: "bg-[var(--cs-success-bg)] text-[var(--cs-success)] border-[var(--cs-success-soft)]",       dot: "bg-[var(--cs-success)]"    },
  info:      { classes: "bg-[var(--cs-info-bg)] text-[var(--cs-info)] border-[var(--cs-info-soft)]",                dot: "bg-[var(--cs-info)]"       },
  warning:   { classes: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)] border-[var(--cs-warning-soft)]",       dot: "bg-[var(--cs-warning)]"    },
  risk:      { classes: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)] border-[var(--cs-risk-soft)]",                dot: "bg-[var(--cs-risk)]"       },
  oversight: { classes: "bg-[var(--cs-oversight-bg)] text-[var(--cs-oversight)] border-[var(--cs-oversight-soft)]", dot: "bg-[var(--cs-oversight)]"  },
  cara:      { classes: "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)] border-[var(--cs-cara-gold-soft)]", dot: "bg-[var(--cs-cara-gold)]"  },
  neutral:   { classes: "bg-[var(--cs-surface)] text-[var(--cs-text-secondary)] border-[var(--cs-border)]",         dot: "bg-[var(--cs-text-muted)]" },
  muted:     { classes: "bg-[var(--cs-surface)] text-[var(--cs-text-muted)] border-[var(--cs-border)]",             dot: "bg-[var(--cs-text-muted)]" },
} as const;

const STATUS_CONFIG: Record<StatusType, { label: string; classes: string; dot: string }> = {
  complete:     { label: "Complete",           ...TONE.success   },
  in_progress:  { label: "In Progress",        ...TONE.info      },
  overdue:      { label: "Overdue",            ...TONE.risk      },
  needs_review: { label: "Needs Review",       ...TONE.warning   },
  oversight:    { label: "Requires Oversight", ...TONE.oversight },
  cara:         { label: "Cara Suggestion",    ...TONE.cara      },
  escalated:    { label: "Escalated",          ...TONE.risk      },
  low:          { label: "Low Risk",           ...TONE.success   },
  medium:       { label: "Medium Risk",        ...TONE.warning   },
  high:         { label: "High Risk",          ...TONE.risk      },
  critical:     { label: "Critical",           ...TONE.risk      },
  draft:        { label: "Draft",              ...TONE.neutral   },
  active:       { label: "Active",             ...TONE.success   },
  pending:      { label: "Pending",            ...TONE.warning   },
  closed:       { label: "Closed",             ...TONE.muted     },
  suspended:    { label: "Suspended",          ...TONE.warning   },
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;       // override the default label
  showDot?: boolean;    // show the coloured dot (default: true)
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  status,
  label,
  showDot = true,
  size = "sm",
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const displayLabel = label ?? config.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        config.classes,
        className,
      )}
    >
      {showDot && (
        <span className={cn("rounded-full shrink-0", config.dot, size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2")} />
      )}
      {displayLabel}
    </span>
  );
}
