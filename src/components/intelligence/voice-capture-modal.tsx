"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — VOICE CAPTURE MODAL
// Quick-log what a young person said, expressed, or communicated.
// Captures children's voice during key work, daily interactions, reviews, etc.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { MessageCircle, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DictationButton } from "@/components/common/dictation-button";
import { useCreateVoiceRecord } from "@/hooks/use-intelligence";
import { cn } from "@/lib/utils";
import type { VoiceTheme } from "@/types/extended";

// ── Types ─────────────────────────────────────────────────────────────────────

interface VoiceCaptureModalProps {
  childId: string;
  childName: string;
  trigger?: React.ReactNode;
}

// ── Capture method options ────────────────────────────────────────────────────

type CaptureMethod = "direct" | "observed" | "interpreted" | "written" | "advocate";

const CAPTURE_METHODS: { label: string; sublabel: string; value: CaptureMethod }[] = [
  { label: "Direct quote",      sublabel: "Their exact words",        value: "direct"      },
  { label: "Observed",          sublabel: "Non-verbal / behaviour",   value: "observed"    },
  { label: "Interpreted",       sublabel: "Staff understanding",      value: "interpreted" },
  { label: "Written",           sublabel: "Letter, note or drawing",  value: "written"     },
  { label: "Via advocate",      sublabel: "IRO, social worker, etc.", value: "advocate"    },
];

// ── Theme options ─────────────────────────────────────────────────────────────

const THEMES: { label: string; value: VoiceTheme }[] = [
  { label: "Wishes",        value: "wishes"        },
  { label: "Feelings",      value: "feelings"      },
  { label: "Concerns",      value: "concerns"      },
  { label: "Compliments",   value: "compliments"   },
  { label: "Complaints",    value: "complaints"    },
  { label: "Needs",         value: "needs"         },
  { label: "Relationships", value: "relationships" },
  { label: "Plans",         value: "plans"         },
  { label: "Activities",    value: "activities"    },
  { label: "Education",     value: "education"     },
  { label: "Health",        value: "health"        },
  { label: "Identity",      value: "identity"      },
  { label: "Culture",       value: "culture"       },
  { label: "Future",        value: "future"        },
];

// ── Field label ───────────────────────────────────────────────────────────────

function FieldLabel({
  children,
  required,
  optional,
}: {
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
      {optional && <span className="ml-1.5 text-[9px] font-normal normal-case text-slate-400">(optional)</span>}
    </label>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VoiceCaptureModal({
  childId,
  childName,
  trigger,
}: VoiceCaptureModalProps) {
  const [open, setOpen] = useState(false);

  // Form state — mapped directly to VoiceRecord (extended.ts)
  const [captureMethod, setCaptureMethod] = useState<CaptureMethod | "">("");
  const [theme, setTheme]               = useState<VoiceTheme | "">("");
  const [directQuote, setDirectQuote]   = useState("");
  const [paraphrase, setParaphrase]     = useState("");
  const [actionTaken, setActionTaken]   = useState("");
  const [voiceHeeded, setVoiceHeeded]   = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess]           = useState(false);

  const { mutate: createVoiceRecord, isPending } = useCreateVoiceRecord();

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function resetForm() {
    setCaptureMethod("");
    setTheme("");
    setDirectQuote("");
    setParaphrase("");
    setActionTaken("");
    setVoiceHeeded(null);
    setValidationError(null);
    setSuccess(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    setOpen(nextOpen);
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!captureMethod) {
      setValidationError("Please select how this voice was captured.");
      return;
    }
    if (!theme) {
      setValidationError("Please select what theme this relates to.");
      return;
    }
    if (!directQuote.trim() && !paraphrase.trim()) {
      setValidationError("Please enter what the young person said or expressed.");
      return;
    }

    createVoiceRecord(
      {
        child_id:       childId,
        home_id:        "home_oak",
        recorded_at:    new Date().toISOString(),
        theme:          theme as VoiceTheme,
        capture_method: captureMethod as CaptureMethod,
        direct_quote:   directQuote.trim() || null,
        paraphrase:     paraphrase.trim() || null,
        action_taken:   actionTaken.trim() || null,
        action_owner:   null,
        action_outcome: null,
        voice_heeded:   voiceHeeded,
        source_ref_type: null,
        source_ref_id:  null,
        recorded_by:    "staff_darren",
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => {
            setOpen(false);
            resetForm();
          }, 1400);
        },
        onError: () => {
          setValidationError("Something went wrong saving the record. Please try again.");
        },
      }
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
            <MessageCircle className="h-3.5 w-3.5" />
            Capture Voice
          </Button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl focus:outline-none animate-in slide-in-from-bottom-4">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 sticky top-0 bg-white z-10">
            <div>
              <Dialog.Title className="text-base font-bold text-slate-900">
                Capture Children's Voice
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-slate-500">
                Recording voice for{" "}
                <span className="font-semibold text-violet-700">{childName}</span>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Success state */}
          {success ? (
            <div className="flex flex-col items-center gap-3 py-14 px-6">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="text-sm font-bold text-slate-800">Voice record saved</p>
              <p className="text-xs text-slate-500">This child's voice has been captured and linked to their record.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-5 px-6 py-5">

                {/* 1. How was this captured? */}
                <div>
                  <FieldLabel required>How was this captured?</FieldLabel>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {CAPTURE_METHODS.map(({ label, sublabel, value }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCaptureMethod(value)}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-left transition-all",
                          captureMethod === value
                            ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200"
                            : "border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/50"
                        )}
                      >
                        <div className={cn("text-[11px] font-semibold", captureMethod === value ? "text-violet-700" : "text-slate-700")}>
                          {label}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{sublabel}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Theme */}
                <div>
                  <FieldLabel required>Theme</FieldLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {THEMES.map(({ label, value }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setTheme(value)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-[11px] font-semibold transition-all",
                          theme === value
                            ? "border-violet-500 bg-violet-50 text-violet-700 ring-1 ring-violet-300"
                            : "border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:text-violet-600"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Direct quote */}
                <div>
                  <FieldLabel optional={!!paraphrase.trim()}>
                    What they said — direct quote
                    {captureMethod === "direct" && <span className="ml-1 text-red-500">*</span>}
                  </FieldLabel>
                  <div className="relative">
                    <textarea
                      value={directQuote}
                      onChange={(e) => setDirectQuote(e.target.value)}
                      rows={4}
                      placeholder='Record their exact words in quotes where possible — e.g. "I want to go home"'
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 transition-colors"
                    />
                    <div className="absolute right-2 top-2">
                      <DictationButton
                        size="sm"
                        mode="append"
                        onTranscript={(text) =>
                          setDirectQuote((prev) => prev ? `${prev} ${text}` : text)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Paraphrase / summary */}
                <div>
                  <FieldLabel optional>Paraphrase / staff interpretation</FieldLabel>
                  <div className="relative">
                    <textarea
                      value={paraphrase}
                      onChange={(e) => setParaphrase(e.target.value)}
                      rows={3}
                      placeholder="If you're summarising or interpreting what they communicated — write it here"
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 transition-colors"
                    />
                    <div className="absolute right-2 top-2">
                      <DictationButton
                        size="sm"
                        mode="append"
                        onTranscript={(text) =>
                          setParaphrase((prev) => prev ? `${prev} ${text}` : text)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Action taken */}
                <div>
                  <FieldLabel optional>Action taken in response</FieldLabel>
                  <div className="relative">
                    <textarea
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      rows={2}
                      placeholder="What did you do or say in response? What action was agreed?"
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 transition-colors"
                    />
                    <div className="absolute right-2 top-2">
                      <DictationButton
                        size="sm"
                        mode="append"
                        onTranscript={(text) =>
                          setActionTaken((prev) => prev ? `${prev} ${text}` : text)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Was their voice heeded? */}
                <div>
                  <FieldLabel>Was their voice heeded?</FieldLabel>
                  <div className="flex gap-2">
                    {(
                      [
                        { label: "Yes — acted on",    val: true  as boolean | null },
                        { label: "No — noted only",   val: false as boolean | null },
                        { label: "Pending / ongoing", val: null  as boolean | null },
                      ] as const
                    ).map(({ label, val }) => (
                      <button
                        key={String(val)}
                        type="button"
                        onClick={() => setVoiceHeeded(val)}
                        className={cn(
                          "flex-1 rounded-xl border px-2 py-2 text-[11px] font-semibold transition-all",
                          voiceHeeded === val
                            ? val === true
                              ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300"
                              : val === false
                              ? "border-red-300 bg-red-50 text-red-700 ring-1 ring-red-200"
                              : "border-amber-300 bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                            : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Validation error */}
                {validationError && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700">
                    {validationError}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
                <Dialog.Close asChild>
                  <Button type="button" variant="ghost" size="sm" disabled={isPending}>
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {isPending ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
                  ) : (
                    <><CheckCircle2 className="h-3.5 w-3.5" />Save Voice Record</>
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
