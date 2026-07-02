// ══════════════════════════════════════════════════════════════════════════════
// CARA CALM — FLAT LIST ROW
// The flat-row primitive: hairline dividers instead of stacked per-row cards,
// a single 3px severity bar instead of stacked badges. One colour cue per row.
// ══════════════════════════════════════════════════════════════════════════════

import * as React from "react";
import { cn } from "@/lib/utils";

export type RowSeverity = "risk" | "warning" | "success" | "info" | "neutral";

const SEVERITY_BAR_COLOR: Record<RowSeverity, string> = {
  risk: "bg-[--cs-risk]",
  warning: "bg-[--cs-warning]",
  success: "bg-[--cs-success]",
  info: "bg-[--cs-info]",
  neutral: "bg-transparent",
};

/** Flat, hairline-divided list container. Replaces a stack of separately
 * bordered/shadowed Cards — edges recede, one divider separates rows. */
function FlatList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[--cs-border] bg-[var(--cs-surface-elevated)] divide-y divide-[--cs-border] overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

interface FlatListRowProps extends React.ComponentProps<"button"> {
  severity?: RowSeverity;
  /** Set false for a non-clickable row (e.g. no expand/collapse). */
  interactive?: boolean;
}

/** One row of a FlatList. The 3px left bar carries the severity signal —
 * pair with at most one Badge; a row shouldn't stack a second colour cue. */
function FlatListRow({
  severity = "neutral",
  interactive = true,
  className,
  children,
  ...props
}: FlatListRowProps) {
  return (
    <button
      type="button"
      className={cn(
        "relative flex w-full items-start gap-3 py-3 pl-4 pr-4 text-left transition-colors",
        interactive ? "hover:bg-[var(--cs-surface)] cursor-pointer" : "cursor-default",
        className,
      )}
      {...props}
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-[3px]", SEVERITY_BAR_COLOR[severity])} />
      {children}
    </button>
  );
}

/** Expanded detail region shown below a FlatListRow — plain, no card chrome. */
function FlatListRowDetail({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("space-y-3 border-t border-[--cs-border-subtle] bg-[var(--cs-surface)] px-4 pb-4 pt-3", className)}
      {...props}
    />
  );
}

export { FlatList, FlatListRow, FlatListRowDetail };
