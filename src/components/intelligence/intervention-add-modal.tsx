"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INTERVENTION ADD MODAL
// Quick-log a new intervention for a child.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X, Loader2, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DictationButton } from "@/components/common/dictation-button";
import { EntryAssist } from "@/components/forms/entry-assist";
import { useCreateIntervention } from "@/hooks/use-intelligence";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface InterventionAddModalProps {
  childId: string;
  childName: string;
  trigger?: React.ReactNode;
}

// ── Category config ───────────────────────────────────────────────────────────

type CategoryValue =
  | "behaviour_support"
  | "therapeutic"
  | "educational"
  | "relational"
  | "health"
  | "routine"
  | "environmental"
  | "communication"
  | "other";

const CATEGORIES: { label: string; value: CategoryValue }[] = [
  { label: "Behaviour Support", value: "behaviour_support" },
  { label: "Therapeutic",       value: "therapeutic" },
  { label: "Educational",       value: "educational" },
  { label: "Relational",        value: "relational" },
  { label: "Health",            value: "health" },
  { label: "Routine",           value: "routine" },
  { label: "Environmental",     value: "environmental" },
  { label: "Communication",     value: "communication" },
  { label: "Other",             value: "other" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function defaultReviewDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 21);
  return d.toISOString().split("T")[0];
}

// ── Field label ───────────────────────────────────────────────────────────────

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-[11px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wider mb-1.5">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

// ── Textarea with dictation ───────────────────────────────────────────────────

function DictationTextarea({
  value,
  onChange,
  rows,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows: number;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={cn(
          "w-full resize-none rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2.5 pr-10 text-xs text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)]",
          "focus:border-[var(--cs-aria-gold)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold-bg)]",
          "transition-colors"
        )}
      />
      <div className="absolute right-2 top-2">
        <DictationButton
          size="sm"
          mode="append"
          onTranscript={(text) => onChange(value ? `${value} ${text}` : text)}
        />
      </div>
      <EntryAssist hideMic value={value} onChange={onChange} sourceModule="intervention" className="mt-1.5" />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InterventionAddModal({
  childId,
  childName,
  trigger,
}: InterventionAddModalProps) {
  const [open, setOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryValue | "">("");
  const [description, setDescription] = useState("");
  const [rationale, setRationale] = useState("");
  const [intendedOutcome, setIntendedOutcome] = useState("");
  const [reviewDate, setReviewDate] = useState(defaultReviewDate());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { mutate: createIntervention, isPending } = useCreateIntervention();

  // ── Helpers ────────────────────────────────────────────────────────────────

  function resetForm() {
    setTitle("");
    setCategory("");
    setDescription("");
    setRationale("");
    setIntendedOutcome("");
    setReviewDate(defaultReviewDate());
    setValidationError(null);
    setSuccess(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    setOpen(nextOpen);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim()) {
      setValidationError("Please enter a title for this intervention.");
      return;
    }
    if (!category) {
      setValidationError("Please select a category.");
      return;
    }
    if (!description.trim()) {
      setValidationError("Please describe what this intervention involves.");
      return;
    }
    if (!rationale.trim()) {
      setValidationError("Please provide a rationale for this intervention.");
      return;
    }
    if (!intendedOutcome.trim()) {
      setValidationError("Please describe the intended outcome.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createIntervention(
      {
        child_id: childId,
        home_id: "home_oak",
        title: title.trim(),
        category,
        description: description.trim(),
        rationale: rationale.trim(),
        intended_outcome: intendedOutcome.trim(),
        status: "active",
        started_by: "staff_darren",
        started_at: new Date().toISOString().split("T")[0],
        agreed_by: null,
        review_date: reviewDate || null,
        actual_outcome: null,
        effectiveness_rating: null,
        effectiveness_notes: null,
        what_changed: null,
        continue_recommendation: null,
        evidence_refs: [],
        linked_task_id: null,
        created_by: "staff_darren",
      } as any,
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => {
            setOpen(false);
            resetForm();
          }, 1200);
        },
        onError: () => {
          setValidationError("Something went wrong saving the intervention. Please try again.");
        },
      }
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Log Intervention
          </Button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Content */}
        <Dialog.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
            "max-h-[90vh] overflow-y-auto",
            "rounded-2xl border border-[var(--cs-border)] bg-white shadow-xl",
            "focus:outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-[var(--cs-border-subtle)] px-6 py-4">
            <div>
              <Dialog.Title className="text-base font-semibold text-[var(--cs-navy)] flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                Log Intervention
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-[var(--cs-text-muted)]">
                Recording intervention for{" "}
                <span className="font-semibold text-blue-700">{childName}</span>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                className="rounded-lg p-1.5 text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)] hover:text-[var(--cs-text-secondary)] transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Success state */}
          {success ? (
            <div className="flex flex-col items-center gap-3 py-12 px-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-sm font-semibold text-[var(--cs-navy)]">Intervention saved</p>
              <p className="text-xs text-[var(--cs-text-muted)]">Closing…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-5 px-6 py-5">

                {/* 1. Title */}
                <div>
                  <FieldLabel required>Title</FieldLabel>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Describe this intervention briefly"
                    className={cn(
                      "w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2.5 text-xs text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)]",
                      "focus:border-[var(--cs-aria-gold)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold-bg)]",
                      "transition-colors"
                    )}
                  />
                </div>

                {/* 2. Category */}
                <div>
                  <FieldLabel required>Category</FieldLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(({ label, value }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCategory(value)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors",
                          category === value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text-secondary)] hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Description */}
                <div>
                  <FieldLabel required>Description</FieldLabel>
                  <DictationTextarea
                    value={description}
                    onChange={setDescription}
                    rows={4}
                    placeholder="What are we doing and how?"
                  />
                </div>

                {/* 4. Rationale */}
                <div>
                  <FieldLabel required>Rationale</FieldLabel>
                  <DictationTextarea
                    value={rationale}
                    onChange={setRationale}
                    rows={3}
                    placeholder="Why are we doing this? What need does it address?"
                  />
                </div>

                {/* 5. Intended outcome */}
                <div>
                  <FieldLabel required>Intended outcome</FieldLabel>
                  <DictationTextarea
                    value={intendedOutcome}
                    onChange={setIntendedOutcome}
                    rows={2}
                    placeholder="What does success look like?"
                  />
                </div>

                {/* 6. Review date */}
                <div>
                  <FieldLabel>Review date</FieldLabel>
                  <span className="inline-block mb-1.5 rounded-full border border-[var(--cs-border)] px-2 py-0.5 text-[9px] font-semibold text-[var(--cs-text-muted)]">
                    Optional
                  </span>
                  <input
                    type="date"
                    value={reviewDate}
                    onChange={(e) => setReviewDate(e.target.value)}
                    className={cn(
                      "w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2.5 text-xs text-[var(--cs-navy)]",
                      "focus:border-[var(--cs-aria-gold)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold-bg)]",
                      "transition-colors"
                    )}
                  />
                </div>

                {/* Validation error */}
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
                  className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Save Intervention
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
