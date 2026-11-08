"use client";

// Phase 1.4a — "Why am I seeing this?" rule-trace. A small info button that
// reveals the rule that surfaced an alert/insight, the plain-English condition,
// and (when available) the data points that triggered it. Reusable: drop it on
// any alert/insight that can name its rule + condition.

import { useState } from "react";
import { Info } from "lucide-react";

export function WhyShown({
  ruleId,
  condition,
  triggers,
  className,
}: {
  ruleId?: string | null;
  condition?: string | null;
  triggers?: string[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  // Nothing to explain → render nothing (never show an empty "why").
  if (!ruleId && !condition && !(triggers && triggers.length)) return null;

  return (
    <span className={`relative inline-flex ${className ?? ""}`}>
      <button
        type="button"
        aria-label="Why am I seeing this?"
        title="Why am I seeing this?"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded p-0.5 text-[var(--cs-text-muted,#94a3b8)] hover:text-[var(--cs-navy,#1e293b)] focus-visible:ring-2 focus-visible:ring-[var(--cs-teal,#0d9488)]"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute right-0 top-5 z-30 w-64 whitespace-normal rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-white p-3 text-left text-[11px] leading-snug text-[var(--cs-text-secondary,#475569)] shadow-[var(--cs-shadow-card,0_4px_16px_rgba(15,23,42,0.12))]"
        >
          <span className="mb-1 block font-semibold text-[var(--cs-navy,#1e293b)]">Why am I seeing this?</span>
          {condition && <span className="block">{condition}</span>}
          {triggers && triggers.length > 0 && (
            <ul className="mt-1 list-inside list-disc">
              {triggers.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
          {ruleId && (
            <span className="mt-1.5 block text-[10px] text-[var(--cs-text-muted,#94a3b8)]">
              Rule: <code className="font-mono">{ruleId}</code>
            </span>
          )}
        </span>
      )}
    </span>
  );
}
