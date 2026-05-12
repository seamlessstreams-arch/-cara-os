"use client";

// ══════════════════════════════════════════════════════════════════════════════
// AriaChallengeModePanel
//
// "Challenge Mode" is a professional accountability feature. When enabled,
// ARIA asks the manager to justify their decision (approve, reject, dismiss)
// before it is recorded. This creates an audit trail showing that decisions
// were considered rather than reflexive.
//
// The prompt changes based on the action — rejecting an output requires a
// rationale, while approving might ask "What convinced you this was accurate?"
//
// Usage:
//   <AriaChallengeModePanel
//     action="approve"
//     outputId="out_001"
//     onComplete={(justification) => handleApproval(justification)}
//     onCancel={() => setShowChallenge(false)}
//   />
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Brain,
  CheckCircle2,
  XCircle,
  Eye,
  Archive,
  Send,
  Loader2,
  Sparkles,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type ChallengeAction = "approve" | "reject" | "dismiss" | "amend_and_approve" | "no_action_required";

interface AriaChallengeModeProps {
  /** The action the user is trying to take */
  action: ChallengeAction;
  /** The ARIA output being acted upon */
  outputId: string;
  /** Brief description of the output for context */
  outputSummary?: string;
  /** Called when the user completes the challenge with their justification */
  onComplete: (justification: string) => void;
  /** Called when the user cancels */
  onCancel: () => void;
  className?: string;
}

// ── Config ─────────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<ChallengeAction, {
  label: string;
  icon: React.ElementType;
  colour: string;
  bg: string;
  prompt: string;
  placeholder: string;
  quickResponses: string[];
}> = {
  approve: {
    label: "Approve",
    icon: CheckCircle2,
    colour: "text-emerald-700",
    bg: "bg-emerald-50",
    prompt: "What convinced you this ARIA output is accurate and appropriate for the record?",
    placeholder: "e.g. The tone, factual accuracy, and safeguarding language are correct. I have verified the dates and names.",
    quickResponses: [
      "Verified all facts and dates",
      "Tone appropriate for the record type",
      "Safeguarding language is accurate",
      "Content aligns with my professional knowledge of this child",
    ],
  },
  reject: {
    label: "Reject",
    icon: XCircle,
    colour: "text-red-700",
    bg: "bg-red-50",
    prompt: "Why are you rejecting this ARIA output? What specifically needs to change?",
    placeholder: "e.g. The description of the child's response is inaccurate. The child was calm, not distressed.",
    quickResponses: [
      "Factually inaccurate — details do not match the event",
      "Tone is inappropriate for this type of record",
      "Safeguarding language needs correction",
      "Missing critical context about the child's needs",
      "Does not reflect what actually happened",
    ],
  },
  dismiss: {
    label: "Dismiss",
    icon: Archive,
    colour: "text-[var(--cs-text-secondary)]",
    bg: "bg-slate-50",
    prompt: "Why is this ARIA suggestion being dismissed?",
    placeholder: "e.g. Already addressed in an earlier record. No further action needed.",
    quickResponses: [
      "Already addressed in another record",
      "Not applicable to this situation",
      "Duplicate of an existing action",
      "Outside the scope of this record",
    ],
  },
  amend_and_approve: {
    label: "Amend & Approve",
    icon: CheckCircle2,
    colour: "text-blue-700",
    bg: "bg-blue-50",
    prompt: "What amendments did you make and why? This helps ARIA learn from your professional judgement.",
    placeholder: "e.g. Changed the description of the de-escalation approach to match what actually happened.",
    quickResponses: [
      "Corrected factual details",
      "Adjusted the tone to be more child-centred",
      "Added missing context",
      "Strengthened safeguarding language",
      "Simplified language for clarity",
    ],
  },
  no_action_required: {
    label: "No Action Required",
    icon: Eye,
    colour: "text-[var(--cs-text-secondary)]",
    bg: "bg-slate-50",
    prompt: "You have reviewed this and determined no action is needed. Briefly note why.",
    placeholder: "e.g. Reviewed the suggestion. The existing records already address this adequately.",
    quickResponses: [
      "Existing records are adequate",
      "Reviewed and no risk identified",
      "Already covered by current care plan",
      "Professional judgement — no change needed",
    ],
  },
};

// ── Component ──────────────────────────────────────────────────────────────

export function AriaChallengeModePanel({
  action,
  outputId,
  outputSummary,
  onComplete,
  onCancel,
  className,
}: AriaChallengeModeProps) {
  const [justification, setJustification] = useState("");
  const [selectedQuick, setSelectedQuick] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const config = ACTION_CONFIG[action];
  const ActionIcon = config.icon;

  function toggleQuickResponse(index: number) {
    setSelectedQuick((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function handleSubmit() {
    // Combine quick responses and free text
    const parts: string[] = [];
    for (const idx of Array.from(selectedQuick).sort()) {
      parts.push(config.quickResponses[idx]);
    }
    if (justification.trim()) {
      parts.push(justification.trim());
    }
    const combined = parts.join(". ") + (parts.length > 0 ? "." : "");

    if (!combined.trim()) return;

    setSubmitting(true);
    try {
      // Record the challenge response
      await fetch("/api/aria/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outputId,
          commandId: `challenge_${action}`,
          rating: action === "reject" ? "negative" : "positive",
          note: combined,
          tags: [`challenge_${action}`],
        }),
      });
      onComplete(combined);
    } catch {
      // Still complete even if recording fails
      onComplete(combined);
    } finally {
      setSubmitting(false);
    }
  }

  const hasContent = selectedQuick.size > 0 || justification.trim().length > 0;

  return (
    <div className={cn("rounded-2xl border overflow-hidden", config.bg, className)}>
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <Brain className="h-4 w-4 text-[var(--cs-aria-gold)]" />
        <span className="text-xs font-bold text-[var(--cs-navy)]">
          ARIA Challenge Mode
        </span>
        <div className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold", config.bg, config.colour)}>
          <ActionIcon className="h-2.5 w-2.5" />
          {config.label}
        </div>
      </div>

      {/* Challenge prompt */}
      <div className="px-5 pb-3">
        <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
          {config.prompt}
        </p>
        {outputSummary && (
          <div className="mt-2 rounded-lg border border-[var(--cs-border-subtle)] bg-white/80 px-3 py-2">
            <div className="flex items-center gap-1 mb-0.5">
              <Sparkles className="h-2.5 w-2.5 text-[var(--cs-aria-gold)]" />
              <span className="text-[9px] font-semibold text-[var(--cs-text-muted)]">ARIA OUTPUT</span>
            </div>
            <p className="text-[10px] text-[var(--cs-text-secondary)] line-clamp-2">{outputSummary}</p>
          </div>
        )}
      </div>

      {/* Quick response chips */}
      <div className="px-5 pb-3">
        <p className="text-[9px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">
          Quick responses
        </p>
        <div className="flex flex-wrap gap-1.5">
          {config.quickResponses.map((response, i) => (
            <button
              key={i}
              onClick={() => toggleQuickResponse(i)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[9px] font-medium border transition-colors",
                selectedQuick.has(i)
                  ? "border-[var(--cs-aria-gold)] bg-[var(--cs-aria-gold-bg)] text-[var(--cs-navy)]"
                  : "border-[var(--cs-border)] bg-white text-[var(--cs-text-muted)] hover:border-[var(--cs-aria-gold-soft)]",
              )}
            >
              {response}
            </button>
          ))}
        </div>
      </div>

      {/* Free-text input */}
      <div className="px-5 pb-3">
        <textarea
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder={config.placeholder}
          rows={2}
          maxLength={1000}
          className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-xs text-[var(--cs-text-secondary)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--cs-aria-gold)] resize-none"
        />
      </div>

      {/* Actions */}
      <div className="px-5 pb-4 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="text-[10px] text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!hasContent || submitting}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-semibold transition-colors",
            hasContent
              ? "bg-[var(--cs-navy)] text-white hover:bg-[var(--cs-aria-gold)]"
              : "bg-slate-200 text-slate-400 cursor-not-allowed",
          )}
        >
          {submitting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          Record & {config.label}
        </button>
      </div>
    </div>
  );
}

// Expose for testing
export const _testing = { ACTION_CONFIG };
