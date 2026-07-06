// ══════════════════════════════════════════════════════════════════════════════
// CARA CALM — PROFILE CARD
// The calm card primitive for entity directories (children, staff): hairline
// border, no shadow, a single 3px top accent instead of rings + badge stacks.
// One colour cue per card. Sibling of the FlatListRow list primitive — lists
// carry the bar on the left edge, profile cards carry it on the top edge.
// ══════════════════════════════════════════════════════════════════════════════

import * as React from "react";
import { cn } from "@/lib/utils";
import type { RowSeverity } from "@/components/ui/list-row";

const ACCENT_COLOR: Record<RowSeverity, string> = {
  risk: "bg-[--cs-risk]",
  warning: "bg-[--cs-warning]",
  success: "bg-[--cs-success]",
  info: "bg-[--cs-info]",
  neutral: "bg-transparent",
};

interface ProfileCardProps extends React.ComponentProps<"div"> {
  severity?: RowSeverity;
  /** Set false for a non-clickable card (no expand/navigate). */
  interactive?: boolean;
}

/** Calm profile card. The 3px top accent carries the severity signal — pair
 * with at most one Badge inside; demote other chips to plain text labels. */
function ProfileCard({
  severity = "neutral",
  interactive = true,
  className,
  children,
  ...props
}: ProfileCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-[--cs-border] bg-[var(--cs-surface-elevated)] transition-colors",
        interactive && "cursor-pointer cs-lift hover:bg-[var(--cs-surface)]",
        className,
      )}
      {...props}
    >
      <span aria-hidden className={cn("absolute inset-x-0 top-0 h-[3px]", ACCENT_COLOR[severity])} />
      {children}
    </div>
  );
}

export { ProfileCard };
