"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — ACTION OUTCOME UPDATE MODAL
// Mark an action outcome as done, record what changed, rate effectiveness.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUpdateActionOutcome } from "@/hooks/use-intelligence";
import { cn } from "@/lib/utils";
import type { ActionOutcome } from "@/types/extended";
import { Pencil, X, Loader2, CheckCircle2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = ActionOutcome["status"];
type Effectiveness = ActionOutcome["effectiveness"];

interface ActionOutcomeUpdateModalProps {
  outcome: ActionOutcome;
  trigger?: React.ReactNode;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: "open",        label: "Open",        color: "border-[var(--cs-border)] text-[var(--cs-text-secondary)]"  },
  { value: "in_progress", label: "In Progress",  color: "border-blue-300 text-blue-700"   },
  { value: "completed",   label: "Completed",    color: "border-emerald-300 text-emerald-700" },
  { value: "stalled",     label: "Stalled",      color: "border-amber-300 text-amber-700" },
];

const EFFECTIVENESS_OPTIONS: { value: Effectiveness; label: string; color: string }[] = [
  { value: "very_effective",      label: "Very Effective",  color: "border-emerald-400 text-emerald-700 bg-emerald-50"  },
  { value: "effective",           label: "Effective",       color: "border-teal-400 text-teal-700 bg-teal-50"          },
  { value: "partially_effective", label: "Partially",       color: "border-amber-400 text-amber-700 bg-amber-50"       },
  { value: "ineffective",         label: "Not Effective",   color: "border-red-400 text-red-700 bg-red-50"             },
];

// ── Modal ─────────────────────────────────────────────────────────────────────

export function ActionOutcomeUpdateModal({ outcome, trigger }: ActionOutcomeUpdateModalProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus]               = useState<Status>(outcome.status);
  const [whatWasDone, setWhatWasDone]     = useState(outcome.what_was_done ?? "");
  const [whatChanged, setWhatChanged]     = useState(outcome.what_changed ?? "");
  const [effectiveness, setEffectiveness] = useState<Effectiveness>(outcome.effectiveness);
  const [effNotes, setEffNotes]           = useState(outcome.effectiveness_notes ?? "");
  const [shouldContinue, setShouldContinue] = useState<boolean | null>(outcome.should_continue);
  const [success, setSuccess] = useState(false);

  const update = useUpdateActionOutcome();

  function handleSubmit() {
    update.mutate(
      {
        id: outcome.id,
        status,
        what_was_done:      whatWasDone.trim() || undefined,
        what_changed:       whatChanged.trim() || undefined,
        effectiveness:      effectiveness ?? undefined,
        effectiveness_notes: effNotes.trim() || undefined,
        should_continue:    shouldContinue ?? undefined,
        completed_at:       status === "completed" && !outcome.what_was_done
                              ? new Date().toISOString()
                              : undefined,
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => { setSuccess(false); setOpen(false); }, 1400);
        },
      }
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {trigger ?? (
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]">
            <Pencil className="h-3 w-3" />
            Update
          </Button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-[var(--cs-shadow-elevated)] p-6 animate-in slide-in-from-bottom-4">

          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1 min-w-0">
              <Dialog.Title className="text-base font-bold text-[var(--cs-navy)] truncate">
                Update Action Outcome
              </Dialog.Title>
              <Dialog.Description className="text-xs text-[var(--cs-text-muted)] mt-0.5 line-clamp-2">
                {outcome.title}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 ml-2">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="text-sm font-semibold text-[var(--cs-text-secondary)]">Updated successfully</p>
            </div>
          ) : (
            <div className="space-y-5">

              {/* Status */}
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(opt.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-xs font-semibold transition-all",
                        status === opt.value
                          ? opt.color + " ring-2 ring-offset-1 ring-current"
                          : "border-[var(--cs-border)] text-[var(--cs-text-muted)] hover:border-[var(--cs-border)]"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* What was done */}
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-1.5 block">
                  What was done
                </label>
                <textarea
                  value={whatWasDone}
                  onChange={(e) => setWhatWasDone(e.target.value)}
                  rows={3}
                  placeholder="Describe specifically what was done..."
                  className="w-full rounded-xl border border-[var(--cs-border)] px-3 py-2.5 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)] resize-none"
                />
              </div>

              {/* What changed */}
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-1.5 block">
                  What changed / impact
                </label>
                <textarea
                  value={whatChanged}
                  onChange={(e) => setWhatChanged(e.target.value)}
                  rows={3}
                  placeholder="What difference did this make for the young person or the home?"
                  className="w-full rounded-xl border border-[var(--cs-border)] px-3 py-2.5 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)] resize-none"
                />
              </div>

              {/* Effectiveness */}
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2 block">
                  Did it work?
                </label>
                <div className="flex flex-wrap gap-2">
                  {EFFECTIVENESS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setEffectiveness(effectiveness === opt.value ? null : opt.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-xs font-semibold transition-all",
                        effectiveness === opt.value
                          ? opt.color + " ring-2 ring-offset-1 ring-current"
                          : "border-[var(--cs-border)] bg-white text-[var(--cs-text-muted)] hover:border-[var(--cs-border)]"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Effectiveness notes */}
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-1.5 block">
                  Effectiveness notes
                </label>
                <textarea
                  value={effNotes}
                  onChange={(e) => setEffNotes(e.target.value)}
                  rows={2}
                  placeholder="Any additional notes on how well this worked..."
                  className="w-full rounded-xl border border-[var(--cs-border)] px-3 py-2.5 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)] resize-none"
                />
              </div>

              {/* Should continue */}
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2 block">
                  Should we continue this approach?
                </label>
                <div className="flex gap-2">
                  {[
                    { value: true,  label: "Yes, continue" },
                    { value: false, label: "No, stop"      },
                    { value: null,  label: "Not sure yet"  },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      onClick={() => setShouldContinue(opt.value)}
                      className={cn(
                        "flex-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all",
                        shouldContinue === opt.value
                          ? "border-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)] ring-2 ring-[var(--cs-cara-gold-soft)] ring-offset-1"
                          : "border-[var(--cs-border)] text-[var(--cs-text-muted)] hover:border-[var(--cs-border)]"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-2 pt-1">
                <Dialog.Close asChild>
                  <Button variant="outline" size="sm" className="flex-1">Cancel</Button>
                </Dialog.Close>
                <Button
                  size="sm"
                  className="flex-1 bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white"
                  onClick={handleSubmit}
                  disabled={update.isPending}
                >
                  {update.isPending
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Saving…</>
                    : "Save Update"}
                </Button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
