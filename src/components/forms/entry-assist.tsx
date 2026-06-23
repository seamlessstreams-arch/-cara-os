"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ENTRY ASSIST — dictate + the five-mode writing assistant for any free-text field
//
// Drops next to / under a textarea to give EVERY data-entry point:
//   1. a microphone (Web Speech dictation — appends to the field), and
//   2. a "Rewrite" menu of the five Cara writing modes:
//        • Improve writing      • Make professional   • Simplify language
//        • Write to the child   • Check tone
//
// All five run through the rules-first Cara command chain. The four rewrite
// modes are now DETERMINISTIC (no AI key needed) and produce a PREVIEW the user
// reviews before applying — nothing is auto-written. "Check tone" is analysis
// only: it shows a report and never edits the field. The previous text is kept
// for one-tap Undo, so a rewrite can never lose the original.
//
// Controlled via value / onChange so it augments an existing textarea.
// ══════════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import { Sparkles, Loader2, Undo2, ShieldCheck, X, Check } from "lucide-react";
import { DictationButton } from "@/components/common/dictation-button";
import { useCaraCommand } from "@/hooks/use-cara-command";
import type { CaraCommandId } from "@/lib/cara/cara-types";
import { diffWords, changeCount } from "@/lib/writing-assistant/text-diff";
import { cn } from "@/lib/utils";

const REWRITES: Array<{ id: CaraCommandId; label: string }> = [
  { id: "improve_writing", label: "Improve writing" },
  { id: "professionalise_record", label: "Make professional" },
  { id: "simplify_language", label: "Simplify language" },
  { id: "write_to_child", label: "Write to the child" },
  { id: "check_tone", label: "Check tone" },
];

const MIN_LEN = 10;

/** Check tone is analysis, not a rewrite — its output is a report, never applied. */
const ANALYSIS_MODES: CaraCommandId[] = ["check_tone"];

interface Preview {
  mode: CaraCommandId;
  label: string;
  text: string;
  /** The original field text at the moment of preview — for the diff view. */
  before: string;
  isReport: boolean;
  llmUsed: boolean;
}

export interface EntryAssistProps {
  value: string;
  onChange: (next: string) => void;
  /** Audit/context hints passed to the Cara command. */
  sourceModule?: string;
  sourceField?: string;
  /** Record type (e.g. "incident", "daily_log") — used by Write to the child. */
  sourceRecordType?: string;
  childId?: string;
  className?: string;
  disabled?: boolean;
  /** Rewrite-only: hide the mic (for surfaces that already have their own dictation). */
  hideMic?: boolean;
}

export function EntryAssist({
  value,
  onChange,
  sourceModule,
  sourceField,
  sourceRecordType,
  childId,
  className,
  disabled,
  hideMic,
}: EntryAssistProps) {
  const cara = useCaraCommand();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [prev, setPrev] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(true);
  const canRewrite = value.trim().length >= MIN_LEN && !disabled && !cara.loading;

  // Word-level diff for the "what changed" view (rewrite modes only).
  const diff = useMemo(
    () => (preview && !preview.isReport ? diffWords(preview.before, preview.text) : null),
    [preview],
  );
  const changes = diff ? changeCount(diff) : 0;

  async function run(commandId: CaraCommandId, label: string) {
    setOpen(false);
    setPreview(null);
    if (value.trim().length < MIN_LEN) return;
    const res = await cara.invoke({
      commandId,
      inputText: value.trim(),
      sourceModule,
      sourceField,
      sourceRecordType,
      childId,
    });
    if (res?.generatedText) {
      setPreview({
        mode: commandId,
        label,
        text: res.generatedText.replace(/\*\*/g, ""), // strip markdown emphasis for display
        before: value.trim(),
        isReport: ANALYSIS_MODES.includes(commandId),
        llmUsed: res.llmUsed,
      });
    }
  }

  function applyPreview() {
    if (!preview || preview.isReport) return;
    setPrev(value);
    onChange(preview.text);
    setPreview(null);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        {!hideMic && (
          <DictationButton
            size="sm"
            mode="append"
            disabled={disabled}
            onTranscript={(t) => onChange(value.trim() ? `${value.replace(/\s+$/, "")} ${t}` : t)}
          />
        )}

        <div className="relative">
          <button
            type="button"
            disabled={!canRewrite}
            onClick={() => setOpen((o) => !o)}
            title="Rewrite with Cara"
            aria-haspopup="menu"
            aria-expanded={open}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)] px-2.5 min-h-[34px] text-xs font-medium text-[var(--cs-navy)] transition-colors hover:bg-[var(--cs-cara-gold-bg)]/70 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cara.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-[var(--cs-cara-gold)]" />}
            Rewrite
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div
                role="menu"
                aria-label="Cara writing modes"
                onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
                className="absolute left-0 z-20 mt-1 w-48 rounded-xl border border-[var(--cs-border)] bg-white p-1 shadow-lg"
              >
                {REWRITES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    role="menuitem"
                    onClick={() => run(r.id, r.label)}
                    className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-[var(--cs-navy)] hover:bg-[var(--cs-surface)] focus:bg-[var(--cs-surface)] focus:outline-none transition-colors"
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

      {/* Preview — rewrite modes show Apply/Discard; Check tone shows a read-only report. */}
      {preview && (
        <div
          role="dialog"
          aria-label={`${preview.label} preview`}
          onKeyDown={(e) => e.key === "Escape" && setPreview(null)}
          className="rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface,#f8fafc)] p-3"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[var(--cs-navy)]">
                {preview.isReport ? preview.label : `${preview.label} — preview`}
              </span>
              {!preview.llmUsed && (
                <span
                  title="Generated locally by Cara's deterministic rules — no AI, no data sent off device"
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700"
                >
                  <ShieldCheck className="h-3 w-3" /> No AI used
                </span>
              )}
              {!preview.isReport && (
                <span className="text-[10px] text-[var(--cs-text-muted)]">
                  {changes === 0 ? "No changes" : `${changes} change${changes === 1 ? "" : "s"}`}
                </span>
              )}
              {!preview.isReport && changes > 0 && (
                <div role="group" aria-label="View mode" className="inline-flex overflow-hidden rounded-full border border-[var(--cs-border)] text-[10px] font-medium">
                  <button type="button" onClick={() => setShowDiff(true)} aria-pressed={showDiff} className={cn("px-2 py-0.5 transition-colors", showDiff ? "bg-[var(--cs-navy,#1e293b)] text-white" : "text-[var(--cs-text-secondary)] hover:bg-white")}>Changes</button>
                  <button type="button" onClick={() => setShowDiff(false)} aria-pressed={!showDiff} className={cn("px-2 py-0.5 transition-colors", !showDiff ? "bg-[var(--cs-navy,#1e293b)] text-white" : "text-[var(--cs-text-secondary)] hover:bg-white")}>Result</button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPreview(null)}
              aria-label="Close preview"
              className="rounded p-0.5 text-[var(--cs-text-muted)] hover:text-[var(--cs-navy)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-[var(--cs-border)] bg-white p-2.5 text-xs leading-relaxed text-[var(--cs-text-secondary,#475569)]">
            {!preview.isReport && showDiff && diff ? (
              diff.map((seg, idx) =>
                seg.type === "same" ? (
                  <span key={idx}>{seg.text}</span>
                ) : seg.type === "added" ? (
                  <span key={idx} className="rounded bg-emerald-100 text-emerald-800">{seg.text}</span>
                ) : (
                  <span key={idx} className="rounded bg-red-100 text-red-700 line-through">{seg.text}</span>
                ),
              )
            ) : (
              preview.text
            )}
          </div>

          {!preview.isReport && (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={applyPreview}
                className="inline-flex items-center gap-1 rounded-lg bg-[var(--cs-navy,#1e293b)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90"
              >
                <Check className="h-3.5 w-3.5" /> Apply
              </button>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--cs-text-muted)] hover:text-[var(--cs-navy)] transition-colors"
              >
                Discard
              </button>
              <span className="ml-auto text-[10px] text-[var(--cs-text-muted)]">You review every change before it is saved.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
