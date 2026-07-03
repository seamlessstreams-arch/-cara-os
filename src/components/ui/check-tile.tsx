// ══════════════════════════════════════════════════════════════════════════════
// CARA CALM — CHECK TILE
// The calm status tile for check grids (closing-down summaries, compliance
// boxes): white surface + hairline border instead of a full success/risk tint;
// the state lives in a small dot + the value text. One colour cue per tile.
// ══════════════════════════════════════════════════════════════════════════════

import * as React from "react";
import { cn } from "@/lib/utils";
import type { RowSeverity } from "@/components/ui/list-row";

const VALUE_TEXT: Record<RowSeverity, string> = {
  risk: "text-[--cs-risk]",
  warning: "text-[--cs-warning]",
  success: "text-[--cs-success]",
  info: "text-[--cs-info]",
  neutral: "text-[var(--cs-text-secondary)]",
};

const STATE_DOT: Record<RowSeverity, string> = {
  risk: "bg-[--cs-risk]",
  warning: "bg-[--cs-warning]",
  success: "bg-[--cs-success]",
  info: "bg-[--cs-info]",
  neutral: "bg-[var(--cs-border)]",
};

interface CheckTileProps extends React.ComponentProps<"div"> {
  /** Boolean shorthand: true→success, false→risk. Overridden by `state`. */
  ok?: boolean;
  state?: RowSeverity;
  icon?: React.ElementType;
  label: React.ReactNode;
  value: React.ReactNode;
}

/** Calm check tile. `<CheckTile ok={r.building_security_checked} icon={Lock}
 * label="Building secured" value={r.building_security_checked ? "Yes" : "No"} />` */
function CheckTile({
  ok,
  state,
  icon: Icon,
  label,
  value,
  className,
  ...props
}: CheckTileProps) {
  const resolved: RowSeverity = state ?? (ok === undefined ? "neutral" : ok ? "success" : "risk");
  return (
    <div
      className={cn(
        "rounded-md border border-[--cs-border] bg-[var(--cs-surface-elevated)] p-3",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-[var(--cs-text-muted)]">
        {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
        {label}
      </div>
      <div className={cn("mt-1 flex items-center gap-1.5 text-sm font-semibold", VALUE_TEXT[resolved])}>
        <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full shrink-0", STATE_DOT[resolved])} />
        {value}
      </div>
    </div>
  );
}

export { CheckTile };
