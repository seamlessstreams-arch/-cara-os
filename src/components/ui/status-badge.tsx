// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STATUS BADGE
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
  | "aria"
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

const STATUS_CONFIG: Record<StatusType, { label: string; classes: string; dot: string }> = {
  complete:     { label: "Complete",                      classes: "bg-emerald-50  text-emerald-700 border-emerald-200",  dot: "bg-emerald-500"  },
  in_progress:  { label: "In Progress",                   classes: "bg-blue-50     text-blue-700    border-blue-200",     dot: "bg-blue-500"     },
  overdue:      { label: "Overdue",                       classes: "bg-red-50      text-red-700     border-red-200",      dot: "bg-red-500"      },
  needs_review: { label: "Needs Review",                  classes: "bg-amber-50    text-amber-700   border-amber-200",    dot: "bg-amber-500"    },
  oversight:    { label: "Requires Oversight",            classes: "bg-violet-50   text-violet-700  border-violet-200",   dot: "bg-violet-500"   },
  aria:         { label: "Aria Suggestion",               classes: "bg-cyan-50     text-cyan-700    border-cyan-200",     dot: "bg-cyan-500"     },
  escalated:    { label: "Escalated",                     classes: "bg-pink-50     text-pink-700    border-pink-200",     dot: "bg-pink-500"     },
  low:          { label: "Low Risk",                      classes: "bg-emerald-50  text-emerald-700 border-emerald-200",  dot: "bg-emerald-400"  },
  medium:       { label: "Medium Risk",                   classes: "bg-amber-50    text-amber-700   border-amber-200",    dot: "bg-amber-500"    },
  high:         { label: "High Risk",                     classes: "bg-red-50      text-red-700     border-red-200",      dot: "bg-red-500"      },
  critical:     { label: "Critical",                      classes: "bg-rose-100    text-rose-800    border-rose-300",     dot: "bg-rose-600"     },
  draft:        { label: "Draft",                         classes: "bg-slate-50    text-slate-600   border-slate-200",    dot: "bg-slate-400"    },
  active:       { label: "Active",                        classes: "bg-emerald-50  text-emerald-700 border-emerald-200",  dot: "bg-emerald-500"  },
  pending:      { label: "Pending",                       classes: "bg-amber-50    text-amber-700   border-amber-200",    dot: "bg-amber-400"    },
  closed:       { label: "Closed",                        classes: "bg-slate-50    text-slate-500   border-slate-200",    dot: "bg-slate-400"    },
  suspended:    { label: "Suspended",                     classes: "bg-orange-50   text-orange-700  border-orange-200",   dot: "bg-orange-500"   },
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
