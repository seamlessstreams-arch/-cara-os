"use client";

// Shared chip multi-select (toggle pills). The safeguarding forms use the same
// pattern for "actions taken / people notified" style lists; this is the one
// implementation. Each caller supplies its own typed option list.

import { cn } from "@/lib/utils";

export interface ChipOption<T extends string> {
  key: T;
  label: string;
}

export function ChipMultiSelect<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  options: readonly ChipOption<T>[];
  value: readonly T[];
  onChange: (next: T[]) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)} role="group" aria-label={ariaLabel}>
      {options.map(({ key, label }) => {
        const on = value.includes(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== key) : [...value, key])}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium border transition-colors",
              on ? "bg-[var(--cs-navy,#1e293b)] text-white border-transparent" : "bg-background text-muted-foreground border-border hover:bg-muted",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
