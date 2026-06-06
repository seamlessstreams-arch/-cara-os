"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RELATIONAL RECORD ADD MODAL
// Log trust moments, regulation strategies, preferred adults, sensory needs,
// rupture-repair, and more for a child.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Heart, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DictationButton } from "@/components/common/dictation-button";
import { EntryAssist } from "@/components/forms/entry-assist";
import { useCreateRelationalRecord } from "@/hooks/use-intelligence";
import { cn } from "@/lib/utils";
import type { RelationalRecordType } from "@/types/extended";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RelationalRecordAddModalProps {
  childId: string;
  childName: string;
  trigger?: React.ReactNode;
}

// ── Record type config ────────────────────────────────────────────────────────

const RECORD_TYPES: {
  value: RelationalRecordType;
  label: string;
  sublabel: string;
  positive: boolean;
}[] = [
  { value: "preferred_adult",      label: "Preferred Adult",         sublabel: "Trusted staff member or adult",       positive: true  },
  { value: "trust_moment",         label: "Trust Moment",            sublabel: "A moment that built connection",       positive: true  },
  { value: "rupture_repair",       label: "Rupture & Repair",        sublabel: "Conflict followed by reconciliation",  positive: true  },
  { value: "de_escalation",        label: "De-escalation Strategy",  sublabel: "What helped de-escalate a situation",  positive: true  },
  { value: "regulation_strategy",  label: "Regulation Strategy",     sublabel: "What helps them self-regulate",        positive: true  },
  { value: "what_helps",           label: "What Helps",              sublabel: "Approaches that work well",            positive: true  },
  { value: "what_to_avoid",        label: "What to Avoid",           sublabel: "Things that escalate or upset",        positive: false },
  { value: "attachment_indicator", label: "Attachment Indicator",    sublabel: "Observed attachment pattern/behaviour",positive: true  },
  { value: "sensory_need",         label: "Sensory Need",            sublabel: "Sensory sensitivity or preference",    positive: true  },
  { value: "voice_indicator",      label: "Voice Indicator",         sublabel: "How they communicate or express self", positive: true  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function RelationalRecordAddModal({
  childId,
  childName,
  trigger,
}: RelationalRecordAddModalProps) {
  const [open, setOpen] = useState(false);
  const [recordType, setRecordType] = useState<RelationalRecordType | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [confidence, setConfidence] = useState<"low" | "medium" | "high">("medium");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { mutate: createRecord, isPending } = useCreateRelationalRecord();

  function resetForm() {
    setRecordType("");
    setTitle("");
    setDescription("");
    setConfidence("medium");
    setValidationError(null);
    setSuccess(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    setOpen(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!recordType) {
      setValidationError("Please select a record type.");
      return;
    }
    if (!title.trim()) {
      setValidationError("Please enter a title or name.");
      return;
    }
    if (!description.trim()) {
      setValidationError("Please add a description.");
      return;
    }

    const selectedConfig = RECORD_TYPES.find((t) => t.value === recordType);

    createRecord(
      {
        child_id:    childId,
        home_id:     "home_oak",
        record_type: recordType as RelationalRecordType,
        title:       title.trim(),
        description: description.trim(),
        is_positive: selectedConfig?.positive ?? true,
        confidence,
        staff_id:    null,
        source_ref_type: null,
        source_ref_id:   null,
        created_by:  "staff_darren",
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => { setOpen(false); resetForm(); }, 1400);
        },
        onError: () => {
          setValidationError("Something went wrong. Please try again.");
        },
      }
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
            <Heart className="h-3.5 w-3.5" />
            Add Record
          </Button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[var(--cs-shadow-elevated)] focus:outline-none animate-in slide-in-from-bottom-4">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-[var(--cs-border-subtle)] px-6 py-4">
            <div>
              <Dialog.Title className="text-base font-bold text-[var(--cs-navy)]">
                Add Relational Record
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-[var(--cs-text-muted)]">
                For <span className="font-semibold text-teal-700">{childName}</span> — trust, regulation, attachment
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)] hover:text-[var(--cs-text-secondary)] transition-colors" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-14 px-6">
              <CheckCircle2 className="h-12 w-12 text-teal-500" />
              <p className="text-sm font-bold text-[var(--cs-navy)]">Record saved</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-5 px-6 py-5">

                {/* Record type */}
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wider mb-2">
                    Record type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {RECORD_TYPES.map(({ value, label, sublabel, positive }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRecordType(value)}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-left transition-all",
                          recordType === value
                            ? positive
                              ? "border-teal-400 bg-teal-50 ring-2 ring-teal-200"
                              : "border-amber-400 bg-amber-50 ring-2 ring-amber-200"
                            : "border-[var(--cs-border)] bg-[var(--cs-surface)] hover:border-teal-200 hover:bg-teal-50/40"
                        )}
                      >
                        <div className={cn(
                          "text-[11px] font-semibold",
                          recordType === value
                            ? positive ? "text-teal-700" : "text-amber-700"
                            : "text-[var(--cs-text-secondary)]"
                        )}>
                          {label}
                        </div>
                        <div className="text-[9px] text-[var(--cs-text-muted)] mt-0.5">{sublabel}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wider mb-1.5">
                    Title / name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      recordType === "preferred_adult" ? "e.g. Named support worker, key worker" :
                      recordType === "regulation_strategy" ? "e.g. Going for a walk, listening to music" :
                      recordType === "sensory_need" ? "e.g. Prefers low lighting, dislikes loud noise" :
                      "Short descriptive title"
                    }
                    className="w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2.5 text-xs text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wider mb-1.5">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      placeholder="Describe what happened, what was observed, or what was learned about this young person..."
                      className="w-full resize-none rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2.5 pr-10 text-xs text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 transition-colors"
                    />
                    <div className="absolute right-2 top-2">
                      <DictationButton
                        size="sm"
                        mode="append"
                        onTranscript={(text) =>
                          setDescription((prev) => prev ? `${prev} ${text}` : text)
                        }
                      />
                    </div>
                    <EntryAssist hideMic value={description} onChange={setDescription} sourceModule="relational_record" sourceField="description" className="mt-1.5" />
                  </div>
                </div>

                {/* Confidence */}
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wider mb-2">
                    Confidence level
                  </label>
                  <div className="flex gap-2">
                    {[
                      { val: "low" as const,    label: "Low",    note: "Single observation" },
                      { val: "medium" as const, label: "Medium", note: "Seen a few times"   },
                      { val: "high" as const,   label: "High",   note: "Consistent pattern" },
                    ].map(({ val, label, note }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setConfidence(val)}
                        className={cn(
                          "flex-1 rounded-xl border px-2 py-2 text-center transition-all",
                          confidence === val
                            ? "border-teal-400 bg-teal-50 text-teal-700 ring-1 ring-teal-300"
                            : "border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text-muted)] hover:border-teal-200"
                        )}
                      >
                        <div className="text-[11px] font-semibold">{label}</div>
                        <div className="text-[9px] text-[var(--cs-text-muted)] mt-0.5">{note}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {validationError && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700">
                    {validationError}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-[var(--cs-border-subtle)] px-6 py-4">
                <Dialog.Close asChild>
                  <Button type="button" variant="ghost" size="sm" disabled={isPending}>
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {isPending
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
                    : <><CheckCircle2 className="h-3.5 w-3.5" />Save Record</>
                  }
                </Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
