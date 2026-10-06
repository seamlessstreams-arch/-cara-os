"use client";

// Shared safeguarding control: the "is the account consistent with the
// mark/injury?" judgement. Used by the body-map and accident forms (and
// available to any other safeguarding record). Inconsistent surfaces a referral
// prompt — it never concludes anything on the user's behalf.

import { cn } from "@/lib/utils";

export type ConsistencyValue = "" | "yes" | "no" | "unsure";

export function ConsistencyToggle({
  value,
  onChange,
  label = "Is the account consistent with the mark?",
  className,
}: {
  value: ConsistencyValue;
  onChange: (v: ConsistencyValue) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs font-medium mb-1 block">{label}</label>
      <div className="flex gap-1.5">
        {([["yes", "Consistent"], ["no", "Inconsistent"], ["unsure", "Not sure"]] as const).map(([val, lbl]) => (
          <button
            key={val}
            type="button"
            aria-pressed={value === val}
            onClick={() => onChange(value === val ? "" : val)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium border transition-colors",
              value === val
                ? (val === "no" ? "bg-rose-600 text-white border-transparent" : "bg-[var(--cs-navy,#1e293b)] text-white border-transparent")
                : "bg-background text-muted-foreground border-border hover:bg-muted",
            )}
          >
            {lbl}
          </button>
        ))}
      </div>
      {value === "no" && (
        <p className="text-[11px] text-rose-600 mt-1">Inconsistent account — consider a safeguarding referral.</p>
      )}
    </div>
  );
}
