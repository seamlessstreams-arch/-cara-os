"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraFeedbackWidget
//
// Lightweight inline widget that lets staff rate an Cara output (thumbs up /
// thumbs down) and optionally leave a short note explaining why. Feedback is
// sent to /api/cara/feedback and stored for continuous quality improvement.
//
// Usage:
//   <CaraFeedbackWidget outputId="out_001" commandId="improve_writing" />
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, MessageSquare, Send, Loader2, Check } from "lucide-react";

type Rating = "positive" | "negative" | null;

interface CaraFeedbackWidgetProps {
  /** The Cara output being rated */
  outputId: string;
  /** The command that generated this output */
  commandId: string;
  /** Optional compact mode — hides the note input until rating is given */
  compact?: boolean;
  className?: string;
}

const NEGATIVE_TAGS = [
  { id: "inaccurate", label: "Inaccurate" },
  { id: "tone", label: "Wrong tone" },
  { id: "too_long", label: "Too long" },
  { id: "too_short", label: "Too short" },
  { id: "missing_context", label: "Missing context" },
  { id: "safeguarding_concern", label: "Safeguarding concern" },
  { id: "not_helpful", label: "Not helpful" },
] as const;

export function CaraFeedbackWidget({
  outputId,
  commandId,
  compact = true,
  className,
}: CaraFeedbackWidgetProps) {
  const [rating, setRating] = useState<Rating>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRating = useCallback(
    async (newRating: Rating) => {
      if (submitted) return;
      setRating(newRating);
      // If positive, auto-submit without note
      if (newRating === "positive") {
        await submitFeedback(newRating, "", []);
      }
      // If negative, show the note + tags UI for more detail
    },
    [submitted],
  );

  async function submitFeedback(
    finalRating: Rating,
    finalNote: string,
    tags: string[],
  ) {
    if (!finalRating || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/cara/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outputId,
          commandId,
          rating: finalRating,
          note: finalNote.trim() || null,
          tags,
        }),
      });
      setSubmitted(true);
    } catch {
      // Silent fail — feedback is non-critical
    } finally {
      setSubmitting(false);
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  async function handleSubmitNegative() {
    await submitFeedback(rating, note, Array.from(selectedTags));
  }

  if (submitted) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 text-[10px] text-emerald-600", className)}>
        <Check className="h-3 w-3" />
        <span className="font-medium">Feedback recorded — thank you</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Rating buttons */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[var(--cs-text-muted)] font-medium">
          Was this helpful?
        </span>
        <button
          onClick={() => handleRating("positive")}
          disabled={submitting}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
            rating === "positive"
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-[var(--cs-border)] bg-white text-[var(--cs-text-muted)] hover:border-emerald-300 hover:text-emerald-600",
          )}
        >
          {submitting && rating === "positive" ? (
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
          ) : (
            <ThumbsUp className="h-2.5 w-2.5" />
          )}
          Yes
        </button>
        <button
          onClick={() => handleRating("negative")}
          disabled={submitting}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
            rating === "negative"
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-[var(--cs-border)] bg-white text-[var(--cs-text-muted)] hover:border-red-300 hover:text-red-600",
          )}
        >
          <ThumbsDown className="h-2.5 w-2.5" />
          No
        </button>
        {!showNote && rating === null && (
          <button
            onClick={() => setShowNote(true)}
            className="inline-flex items-center gap-1 text-[10px] text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] transition-colors"
          >
            <MessageSquare className="h-2.5 w-2.5" />
            Add note
          </button>
        )}
      </div>

      {/* Negative feedback detail panel */}
      {rating === "negative" && !submitted && (
        <div className="rounded-xl border border-red-100 bg-red-50/50 p-3 space-y-2.5">
          <p className="text-[10px] font-medium text-red-800">
            What could be improved?
          </p>
          {/* Quick tags */}
          <div className="flex flex-wrap gap-1.5">
            {NEGATIVE_TAGS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[9px] font-medium border transition-colors",
                  selectedTags.has(tag.id)
                    ? "border-red-300 bg-red-100 text-red-700"
                    : "border-red-200 bg-white text-red-600 hover:bg-red-50",
                )}
              >
                {tag.label}
              </button>
            ))}
          </div>
          {/* Free-text note */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional: tell us more…"
              className="flex-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[10px] text-[var(--cs-text-secondary)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-1 focus:ring-red-300"
              maxLength={500}
            />
            <button
              onClick={handleSubmitNegative}
              disabled={submitting || selectedTags.size === 0}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors",
                selectedTags.size > 0
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-red-100 text-red-400 cursor-not-allowed",
              )}
            >
              {submitting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Standalone note (no rating yet) */}
      {showNote && rating === null && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Share your feedback on this output…"
            className="flex-1 rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1.5 text-[10px] text-[var(--cs-text-secondary)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--cs-cara-gold)]"
            maxLength={500}
          />
        </div>
      )}
    </div>
  );
}

// Expose helpers for testing
export const _testing = { NEGATIVE_TAGS };
