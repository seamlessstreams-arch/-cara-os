// ══════════════════════════════════════════════════════════════════════════════
// CARA CALM — SECTION HEADER
// The calm heading for dashboard-section pages: a muted uppercase label over a
// hairline underline, replacing icon-tinted CardTitle rows. The label is the
// only chrome a section needs — icons mute, accents live in the section body.
// ══════════════════════════════════════════════════════════════════════════════

import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps extends React.ComponentProps<"div"> {
  icon?: React.ElementType;
  /** Right-aligned slot for a count, filter, or action. */
  action?: React.ReactNode;
}

/** Calm section header. Use as the first child of a section/card body:
 * `<SectionHeader icon={Users}>On Shift Today</SectionHeader>` */
function SectionHeader({
  icon: Icon,
  action,
  className,
  children,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-3 flex items-center justify-between gap-2 border-b border-[--cs-border-subtle] pb-2",
        className,
      )}
      {...props}
    >
      <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--cs-text-muted)]">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
        {children}
      </h3>
      {action}
    </div>
  );
}

export { SectionHeader };
