"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INTERVENTION UPDATE MODAL
// Update status, outcome, notes and review date for an active intervention.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Pencil, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DictationButton } from "@/components/common/dictation-button";
import { useUpdateIntervention } from "@/hooks/use-intelligence";
import { cn } from "@/lib/utils";
import type { Intervention, InterventionStatus, InterventionOutcome } from "@/types/extended";

// ── Types ─────────────────────────────────────────────────────────────────────

interface InterventionUpdateModalProps {
  intervention: Intervention;
  trigger?: React.ReactNode;
}

// ── Status options ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: {
  value: InterventionStatus;
  label: string;
  color: string;
}[] = [
  { value: "active",       label: "Active",       color: "border-emerald-400 text-emerald-700 bg-emerald-50"  },
  { value: "paused",       label: "Paused",       color: "border-amber-400 text-amber-700 bg-amber-50"        },
  { value: "under_review", label: "Under Review", color: "border-violet-400 text-violet-700 bg-violet-50"     },
  { value: "completed",    label: "Completed",    color: "border-blue-400 text-blue-700 bg-blue-50"           },
  { value: "stopped",      label: "Stopped",      color: "border-slate-400 text-slate-600 bg-slate-50"        },
];

// ── Outcome options ───────────────────────────────────────────────────────────

const OUTCOME_OPTIONS: {
  value: InterventionOutcome;
  label: string;
  color: string;
}[] = [
  { value: "working",           label: "Working",           color: "border-emerald-400 text-emerald-700 bg-emerald-50" },
  { value: "partially_working", label: "Partially Working", color: "border-amber-400 text-amber-700 bg-amber-50"       },
  { value: "not_working",       label: "Not Working",       color: "border-red-400 text-red-700 bg-red-50"             },
  { value: "too_early",         label: "Too Early to Tell", color: "border-slate-300 text-slate-500 bg-slate-50"       },
  { value: "unknown",           label: "Unknown",           color: "border-slate-200 text-slate-400 bg-white"          },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function InterventionUpdateModal({
  intervention,
  trigger,
}: InterventionUpdateModalProps) {
  const [open, setOpen]             = useState(false);
  const [status, setStatus]         = useState<InterventionStatus>(intervention.status);
  const [outcome, setOutcome]       = useState<InterventionOutcome>(intervention.outcome);
  const [outcomeNotes, setOutcomeNotes] = useState(intervention.outcome_notes ?? "");
  const [reviewDate, setReviewDate] = useState(intervention.review_date ?? "");
  const [success, setSuccess]       = useState(false);

  const update = useUpdateIntervention();

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Reset to server state on close
      setStatus(intervention.status);
      setOutcome(intervention.outcome);
      setOutcomeNotes(intervention.outcome_notes ?? "");
      setReviewDate(intervention.review_date ?? "");
      setSuccess(false);
    }
    setOpen(next);
  }

  function handleSubmit() {
    update.mutate(
      {
        id:           intervention.id,
        status,
        outcome,
        outcome_notes: outcomeNotes.trim() || undefined,
        review_date:   reviewDate || undefined,
        ended_at:
          (status === "completed" || status === "stopped") && !intervention.ended_at
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
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        {trigger ?? (
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-slate-500 hover:text-slate-700">
            <Pencil className="h-3 w-3" />
            Update
          </Button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl focus:outline-none animate-in slide-in-from-bottom-4">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-base font-bold text-slate-900">
                Update Intervention
              </Dialog.Title>
              <Dialog.Description className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                {intervention.title}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-12 px-6">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="text-sm font-bold text-slate-800">Intervention updated</p>
            </div>
          ) : (
            <div className="space-y-5 px-6 py-5">

              {/* Status */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-xs font-semibold transition-all",
                        status === opt.value
                          ? opt.color + " ring-2 ring-offset-1 ring-current"
                          : "border-slate-200 text-slate-400 hover:border-slate-300"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outcome */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Is it working?
                </label>
                <div className="flex flex-wrap gap-2">
                  {OUTCOME_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setOutcome(opt.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-xs font-semibold transition-all",
                        outcome === opt.value
                          ? opt.color + " ring-2 ring-offset-1 ring-current"
                          : "border-slate-200 text-slate-400 hover:border-slate-300"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outcome notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Outcome notes
                  <span className="ml-1.5 text-[9px] font-normal normal-case text-slate-400">(optional)</span>
                </label>
                <div className="relative">
                  <textarea
                    value={outcomeNotes}
                    onChange={(e) => setOutcomeNotes(e.target.value)}
                    rows={3}
                    placeholder="What evidence do you have? What has changed for this young person?"
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 transition-colors"
                  />
                  <div className="absolute right-2 top-2">
                    <DictationButton
                      size="sm"
                      mode="append"
                      onTranscript={(text) =>
                        setOutcomeNotes((prev) => prev ? `${prev} ${text}` : text)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Review date */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Next review date
                  <span className="ml-1.5 text-[9px] font-normal normal-case text-slate-400">(optional)</span>
                </label>
                <input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 transition-colors"
                />
              </div>

              {/* Footer */}
              <div className="flex gap-2 pt-1">
                <Dialog.Close asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  size="sm"
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={handleSubmit}
                  disabled={update.isPending}
                >
                  {update.isPending
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Saving…</>
                    : "Save Update"
                  }
                </Button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
