"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ENTRY ASSIST — dictate + rewrite toolbar for any free-text field
//
// Drops next to / under a textarea to give EVERY data-entry point two things:
//   1. a microphone (Web Speech dictation — appends to the field), and
//   2. a "Rewrite" menu of ARIA writing styles (improve / make professional /
//      simplify / check tone) that rewrites the field via the rules→cache→Claude
//      command chain.
//
// Controlled via value / onChange so it augments an existing textarea without
// replacing it. Keeps the prior text for one-tap Undo, so a rewrite can never lose
// the original. Self-contained — no actor plumbing needed (the command hook supplies
// the signed-in actor).
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { Sparkles, Loader2, Undo2 } from "lucide-react";
import { DictationButton } from "@/components/common/dictation-button";
import { useAriaCommand } from "@/hooks/use-aria-command";
import type { AriaCommandId } from "@/lib/aria/aria-types";
import { cn } from "@/lib/utils";

const REWRITES: Array<{ id: AriaCommandId; label: string }> = [
  { id: "improve_writing", label: "Improve writing" },
  { id: "professionalise_record", label: "Make professional" },
  { id: "simplify_language", label: "Simplify language" },
  { id: "check_tone", label: "Check tone" },
];

const MIN_LEN = 10;

export interface EntryAssistProps {
  value: string;
  onChange: (next: string) => void;
  /** Audit/context hints passed to the ARIA command. */
  sourceModule?: string;
  sourceField?: string;
  childId?: string;
  className?: string;
  disabled?: boolean;
}

export function EntryAssist({ value, onChange, sourceModule, sourceField, childId, className, disabled }: EntryAssistProps) {
  const aria = useAriaCommand();
  const [open, setOpen] = useState(false);
  const [prev, setPrev] = useState<string | null>(null);
  const canRewrite = value.trim().length >= MIN_LEN && !disabled && !aria.loading;

  async function rewrite(commandId: AriaCommandId) {
    setOpen(false);
    if (value.trim().length < MIN_LEN) return;
    const before = value;
    const res = await aria.invoke({ commandId, inputText: value.trim(), sourceModule, sourceField, childId });
    if (res?.generatedText) {
      setPrev(before);
      onChange(res.generatedText);
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DictationButton
        size="sm"
        mode="append"
        disabled={disabled}
        onTranscript={(t) => onChange(value.trim() ? `${value.replace(/\s+$/, "")} ${t}` : t)}
      />

      <div className="relative">
        <button
          type="button"
          disabled={!canRewrite}
          onClick={() => setOpen((o) => !o)}
          title="Rewrite with ARIA"
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--cs-aria-gold)] bg-[var(--cs-aria-gold-bg)] px-2.5 min-h-[34px] text-xs font-medium text-[var(--cs-navy)] transition-colors hover:bg-[var(--cs-aria-gold-bg)]/70 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {aria.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-[var(--cs-aria-gold)]" />}
          Rewrite
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute left-0 z-20 mt-1 w-48 rounded-xl border border-[var(--cs-border)] bg-white p-1 shadow-lg">
              {REWRITES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => rewrite(r.id)}
                  className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-[var(--cs-navy)] hover:bg-[var(--cs-surface)] transition-colors"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {prev !== null && (
        <button
          type="button"
          onClick={() => { onChange(prev); setPrev(null); }}
          className="inline-flex items-center gap-1 text-xs text-[var(--cs-text-muted)] hover:text-[var(--cs-navy)] transition-colors"
        >
          <Undo2 className="h-3.5 w-3.5" /> Undo
        </button>
      )}
    </div>
  );
}
