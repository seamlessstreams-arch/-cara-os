"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — ACTION OUTCOME ADD MODAL
// Log a new action outcome from any context in the app.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X, Loader2, CheckCircle2, Target, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntryAssist } from "@/components/forms/entry-assist";
import { useCreateActionOutcome } from "@/hooks/use-intelligence";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActionOutcomeAddModalProps {
  childId?: string;
  childName?: string;
  trigger?: React.ReactNode;
}

// ── Static options ────────────────────────────────────────────────────────────

const CHILD_OPTIONS = [
  { id: "yp_casey", name: "Casey" },
  { id: "yp_alex",  name: "Alex" },
  { id: "yp_jordan",    name: "Jordan" },
] as const;

const OWNER_OPTIONS = [
  { id: "staff_darren",    name: "Darren (RM)" },
  { id: "staff_ryan",      name: "Ryan" },
  { id: "staff_chervelle", name: "Naomi" },
  { id: "staff_lackson",   name: "Samuel" },
] as const;

// ── Field label helper ────────────────────────────────────────────────────────

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1"
    >
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ActionOutcomeAddModal({
  childId,
  childName,
  trigger,
}: ActionOutcomeAddModalProps) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [whatWasAgreed, setWhatWasAgreed] = useState("");
  const [whyItMatters, setWhyItMatters] = useState("");
  const [selectedChild, setSelectedChild] = useState(childId ?? "");
  const [dueDate, setDueDate] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("staff_darren");

  // Validation
  const [errors, setErrors] = useState<{
    title?: string;
    whatWasAgreed?: string;
    whyItMatters?: string;
  }>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const createActionOutcome = useCreateActionOutcome();

  // ── Reset ──────────────────────────────────────────────────────────────────
  function resetForm() {
    setTitle("");
    setWhatWasAgreed("");
    setWhyItMatters("");
    setSelectedChild(childId ?? "");
    setDueDate("");
    setSelectedOwner("staff_darren");
    setErrors({});
    setSaveError(null);
    setSubmitted(false);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate(): boolean {
    const next: typeof errors = {};
    if (!title.trim()) next.title = "Title is required";
    if (!whatWasAgreed.trim()) next.whatWasAgreed = "This field is required";
    if (!whyItMatters.trim()) next.whyItMatters = "This field is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaveError(null);

    createActionOutcome.mutate(
      {
        home_id: "home_oak",
        title: title.trim(),
        what_was_agreed: whatWasAgreed.trim(),
        why_it_matters: whyItMatters.trim(),
        child_id: selectedChild || null,
        owner_id: selectedOwner,
        due_date: dueDate || null,
        status: "open",
        completed_at: null,
        what_was_done: null,
        what_changed: null,
        effectiveness: null,
        effectiveness_notes: null,
        linked_evidence: [],
        should_continue: null,
        task_id: null,
        created_by: "staff_darren",
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          setTimeout(() => {
            handleOpenChange(false);
          }, 1200);
        },
        onError: () => {
          setSaveError("Something went wrong saving this action. Your entry is still here — please try again.");
        },
      }
    );
  }

  // ── Trigger ────────────────────────────────────────────────────────────────
  const defaultTrigger = (
    <Button size="sm" className="gap-1.5">
      <Plus className="h-3.5 w-3.5" />
      Log Action
    </Button>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        {trigger ?? defaultTrigger}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl bg-white shadow-[var(--cs-shadow-elevated)] border border-[var(--cs-border)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "max-h-[90vh] overflow-y-auto"
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-[var(--cs-border-subtle)] px-5 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-cara-gold-bg)]">
              <Target className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1 min-w-0">
              <Dialog.Title className="text-sm font-semibold text-[var(--cs-navy)]">
                Log Action Outcome
              </Dialog.Title>
              {childName && (
                <Dialog.Description className="text-xs text-[var(--cs-text-muted)]">
                  For {childName}
                </Dialog.Description>
              )}
              {!childName && (
                <Dialog.Description className="text-xs text-[var(--cs-text-muted)]">
                  Record what was agreed and why it matters
                </Dialog.Description>
              )}
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
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-12 px-5 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-sm font-semibold text-[var(--cs-navy)]">Action outcome logged</p>
              <p className="text-xs text-[var(--cs-text-muted)]">The record has been saved successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4 px-5 py-5">

                {/* Title */}
                <div>
                  <FieldLabel htmlFor="ao-title" required>Title</FieldLabel>
                  <input
                    id="ao-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What action was agreed?"
                    className={cn(
                      "w-full rounded-xl border px-3 py-2 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)]",
                      "focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)] focus:border-transparent transition-shadow",
                      errors.title ? "border-red-300 bg-red-50" : "border-[var(--cs-border)] bg-white"
                    )}
                  />
                  {errors.title && (
                    <p className="mt-1 text-[11px] text-red-500">{errors.title}</p>
                  )}
                </div>

                {/* What was agreed */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <FieldLabel htmlFor="ao-agreed" required>What was agreed</FieldLabel>
                    <EntryAssist
                      value={whatWasAgreed}
                      onChange={setWhatWasAgreed}
                      sourceModule="action_outcome"
                      sourceField="what_agreed"
                    />
                  </div>
                  <textarea
                    id="ao-agreed"
                    rows={3}
                    value={whatWasAgreed}
                    onChange={(e) => setWhatWasAgreed(e.target.value)}
                    placeholder="Describe exactly what was agreed and by whom"
                    className={cn(
                      "w-full rounded-xl border px-3 py-2 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] resize-none",
                      "focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)] focus:border-transparent transition-shadow",
                      errors.whatWasAgreed ? "border-red-300 bg-red-50" : "border-[var(--cs-border)] bg-white"
                    )}
                  />
                  {errors.whatWasAgreed && (
                    <p className="mt-1 text-[11px] text-red-500">{errors.whatWasAgreed}</p>
                  )}
                </div>

                {/* Why it matters */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <FieldLabel htmlFor="ao-why" required>Why it matters</FieldLabel>
                    <EntryAssist
                      value={whyItMatters}
                      onChange={setWhyItMatters}
                      sourceModule="action_outcome"
                      sourceField="why_matters"
                    />
                  </div>
                  <textarea
                    id="ao-why"
                    rows={3}
                    value={whyItMatters}
                    onChange={(e) => setWhyItMatters(e.target.value)}
                    placeholder="Why does this action matter for the young person or the home?"
                    className={cn(
                      "w-full rounded-xl border px-3 py-2 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] resize-none",
                      "focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)] focus:border-transparent transition-shadow",
                      errors.whyItMatters ? "border-red-300 bg-red-50" : "border-[var(--cs-border)] bg-white"
                    )}
                  />
                  {errors.whyItMatters && (
                    <p className="mt-1 text-[11px] text-red-500">{errors.whyItMatters}</p>
                  )}
                </div>

                {/* Child + Due date row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Child */}
                  <div>
                    <FieldLabel htmlFor="ao-child">Child</FieldLabel>
                    <select
                      id="ao-child"
                      value={selectedChild}
                      onChange={(e) => setSelectedChild(e.target.value)}
                      className="w-full rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)] focus:border-transparent transition-shadow"
                    >
                      <option value="">— None —</option>
                      {CHILD_OPTIONS.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Due date */}
                  <div>
                    <FieldLabel htmlFor="ao-due">Due date</FieldLabel>
                    <input
                      id="ao-due"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)] focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>

                {/* Owner */}
                <div>
                  <FieldLabel htmlFor="ao-owner">Owner</FieldLabel>
                  <select
                    id="ao-owner"
                    value={selectedOwner}
                    onChange={(e) => setSelectedOwner(e.target.value)}
                    className="w-full rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)] focus:border-transparent transition-shadow"
                  >
                    {OWNER_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {saveError && (
                <div className="mx-5 mb-1 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700" role="alert">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-[var(--cs-border-subtle)] px-5 py-4">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline" size="sm">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createActionOutcome.isPending}
                  className="gap-1.5"
                >
                  {createActionOutcome.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Log Action
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
