"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Bias Reflection Panel (at the point of judgement)
//
// Shows the deterministic bias-checks for a decision context: triggered prompts
// (each citing the record-fact that fired it) + the context's standing
// reflections. Collegial by design — questions to the team, never judgements
// of a person. Progressive disclosure: a compact count, expandable detail.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Scale } from "lucide-react";
import {
  computeBiasReflections,
} from "@/lib/cognitive-bias/bias-engine";
import type { BiasSignalInput } from "@/lib/cognitive-bias/types";

export function BiasReflectionPanel({
  signal,
  compact = false,
}: {
  /** The record's own facts — assembled by the mounting surface. */
  signal: BiasSignalInput;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(!compact);
  // Pure + deterministic — computed client-side from the same engine the API
  // serves, so the panel works offline and never blocks the workflow.
  const result = useMemo(() => computeBiasReflections(signal), [signal]);

  const total = result.prompts.length + result.standing.length;
  if (total === 0) return null;

  return (
    <div className="rounded-lg border border-[var(--cs-border,#e2e8ec)] bg-[var(--cs-surface-subtle,#f5f8f9)] p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#6c7a83)]">
          <Scale className="h-3.5 w-3.5 text-[var(--cs-teal,#0d9488)]" />
          Reflective checks before deciding
          <span className="rounded-full bg-[var(--cs-surface,#fff)] px-1.5 py-0.5 text-[10px] font-medium">
            {result.prompts.length > 0 ? `${result.prompts.length} from this record` : "standing"}
          </span>
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {result.prompts.map((p) => (
            <div key={`${p.bias}-${p.because}`} className="rounded-md bg-[var(--cs-surface,#fff)] p-2">
              <p className="text-xs font-medium text-[var(--cs-text,#14202a)]">{p.prompt}</p>
              <p className="mt-0.5 text-[11px] text-[var(--cs-text-muted,#6c7a83)]">
                {p.label} — {p.because}
              </p>
            </div>
          ))}
          {result.standing.map((s) => (
            <div key={s.prompt} className="rounded-md bg-[var(--cs-surface,#fff)] p-2">
              <p className="text-xs text-[var(--cs-text,#14202a)]">{s.prompt}</p>
            </div>
          ))}
          <p className="text-[11px] leading-relaxed text-[var(--cs-text-muted,#6c7a83)]">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
