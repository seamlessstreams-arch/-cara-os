"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA WRITING ASSISTANT — inline suggestions
//
// A compact strip that appears beneath a field ONLY when there is something to
// suggest during data entry. No sidebar, no page. Each suggestion is shown with
// a plain-English message; the author chooses Accept (literal fixes only) or
// Ignore. Guidance issues that need the author's own words are never
// auto-applied — they prompt, they don't replace.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Check, X, Loader2, ShieldAlert, Settings2, BookPlus, Wand2 } from "lucide-react";
import {
  type WritingIssue,
  type WritingSuggestion,
  type WritingQualityScore,
  type IssueType,
  type WACategory,
  type WritingAssistantSettings,
  WA_CATEGORY_LABELS,
} from "@/lib/writing-assistant/types";
import { countAutoFixes } from "@/lib/writing-assistant/rewrite-engine";

// Colour is never the only signal — every row carries the type label + an icon.
const TYPE_STYLE: Record<IssueType, { label: string; cls: string }> = {
  spelling:               { label: "Spelling",             cls: "bg-red-50 text-red-700 border-red-200" },
  grammar:                { label: "Grammar",              cls: "bg-blue-50 text-blue-700 border-blue-200" },
  punctuation:            { label: "Punctuation",          cls: "bg-blue-50 text-blue-700 border-blue-200" },
  clarity:                { label: "Clarity",              cls: "bg-purple-50 text-purple-700 border-purple-200" },
  tone:                   { label: "Tone",                 cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "professional-language":{ label: "Professional language",cls: "bg-sky-50 text-sky-700 border-sky-200" },
  "safeguarding-quality": { label: "Recording quality",    cls: "bg-amber-50 text-amber-700 border-amber-200" },
  chronology:             { label: "Chronology",           cls: "bg-amber-50 text-amber-700 border-amber-200" },
  "writing-to-child":     { label: "Writing to the child", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "policy-language":      { label: "Policy language",      cls: "bg-sky-50 text-sky-700 border-sky-200" },
};

const BAND_MSG: Record<string, string> = {
  strong:             "Strong record",
  minor_improvements: "A few improvements suggested",
  add_detail:         "Consider adding more detail",
  needs_review:       "May need review before sign-off",
};

const CATEGORIES: WACategory[] = ["spelling", "grammar", "safeguarding", "tone", "clarity"];

export function InlineSuggestions({
  issues,
  score,
  loading,
  settings,
  onApply,
  onIgnore,
  onApplyAll,
  onToggleCategory,
  onAddToDictionary,
  onAudit,
}: {
  issues: WritingIssue[];
  score?: WritingQualityScore;
  loading?: boolean;
  settings?: WritingAssistantSettings;
  onApply: (issue: WritingIssue, suggestion: WritingSuggestion) => void;
  onIgnore: (id: string) => void;
  /** Called to apply all auto-fixable issues in one click. */
  onApplyAll?: () => void;
  onToggleCategory?: (cat: WACategory, enabled: boolean) => void;
  onAddToDictionary?: (word: string) => void;
  onAudit?: (action: "accepted" | "ignored", issue: WritingIssue) => void;
}) {
  const [showSettings, setShowSettings] = useState(false);
  const autoFixCount = countAutoFixes(issues);

  // Only appear if there is something to say (or the settings panel is open).
  if (!loading && issues.length === 0 && !showSettings) return null;

  return (
    <div className="mt-2 rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] p-3" role="region" aria-label="Cara writing suggestions">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--cs-navy)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--cs-teal,#0d9488)]" />
          Cara — {loading ? "checking…" : `${issues.length} suggestion${issues.length === 1 ? "" : "s"}`}
        </span>
        <div className="flex items-center gap-2">
          {score && (
            <span className="text-xs text-[var(--cs-text-muted)]">{BAND_MSG[score.band] ?? score.message}</span>
          )}
          {onToggleCategory && (
            <button
              onClick={() => setShowSettings((v) => !v)}
              aria-label="Writing assistant settings"
              aria-expanded={showSettings}
              className={cn(
                "rounded p-0.5 text-[var(--cs-text-muted)] hover:text-[var(--cs-navy)] transition-colors",
                showSettings && "text-[var(--cs-navy)]",
              )}
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Settings panel — inline, no modal or page */}
      {showSettings && settings && onToggleCategory && (
        <div className="mb-3 rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-secondary)]">
            Check categories
          </p>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => {
              const enabled = settings.categories[cat] !== false;
              return (
                <div key={cat} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-[var(--cs-text)]">{WA_CATEGORY_LABELS[cat]}</span>
                  <button
                    role="switch"
                    aria-checked={enabled}
                    onClick={() => onToggleCategory(cat, !enabled)}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                      enabled ? "bg-[var(--cs-teal,#0d9488)]" : "bg-slate-200",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                        enabled ? "translate-x-[18px]" : "translate-x-[2px]",
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>
          {settings.dictionary.length > 0 && (
            <div className="mt-3 border-t border-[var(--cs-border-subtle)] pt-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-secondary)]">
                My dictionary ({settings.dictionary.length} words)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {settings.dictionary.map((word) => (
                  <span key={word} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Batch-apply strip — only when 2+ fixes can be made safely */}
      {onApplyAll && autoFixCount >= 2 && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] px-2.5 py-1.5">
          <span className="text-xs text-[var(--cs-text-muted)]">
            {autoFixCount} safe fix{autoFixCount === 1 ? "" : "es"} can be applied automatically
          </span>
          <button
            onClick={onApplyAll}
            aria-label={`Apply all ${autoFixCount} safe fixes`}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--cs-teal,#0d9488)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 active:opacity-80"
          >
            <Wand2 className="h-3 w-3" />
            Apply all
          </button>
        </div>
      )}

      {loading && issues.length === 0 ? (
        <div className="flex items-center gap-2 py-1 text-xs text-[var(--cs-text-muted)]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Looking for ways to make this clearer…
        </div>
      ) : (
        <ul className="space-y-2">
          {issues.map((issue) => {
            const s = TYPE_STYLE[issue.type];
            const fix = issue.suggestions.find((x) => x.preservesMeaning && x.replacementText.trim().length > 0);
            const sensitive = issue.type === "writing-to-child" || issue.type === "safeguarding-quality";
            const isSpelling = issue.type === "spelling";
            return (
              <li key={issue.id} className="rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", s.cls)}>
                    {sensitive && <ShieldAlert className="h-3 w-3" aria-hidden />}
                    {s.label}
                  </span>
                  <button
                    onClick={() => { onAudit?.("ignored", issue); onIgnore(issue.id); }}
                    aria-label={`Ignore ${s.label} suggestion`}
                    className="shrink-0 rounded p-0.5 text-[var(--cs-text-muted)] hover:text-[var(--cs-navy)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-[var(--cs-text)]">{issue.message}</p>
                {issue.originalText && (
                  <p className="mt-0.5 text-xs text-[var(--cs-text-muted)]">
                    &ldquo;<span className="font-medium">{issue.originalText}</span>&rdquo;
                  </p>
                )}
                <p className="mt-1 text-xs leading-relaxed text-[var(--cs-text-muted)]">{issue.explanation}</p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {fix ? (
                    <button
                      onClick={() => { onAudit?.("accepted", issue); onApply(issue, fix); }}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Change to &ldquo;{fix.replacementText}&rdquo;
                    </button>
                  ) : (
                    <span className="text-xs italic text-[var(--cs-text-muted)]">
                      {issue.requiresHumanJudgement ? "Your words — Cara won’t change this for you." : "Suggestion"}
                    </span>
                  )}
                  {isSpelling && onAddToDictionary && issue.originalText && (
                    <button
                      onClick={() => { onAddToDictionary(issue.originalText); onIgnore(issue.id); }}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--cs-border-subtle)] px-2.5 py-1 text-xs text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)]"
                      title={`Add "${issue.originalText}" to your personal dictionary`}
                    >
                      <BookPlus className="h-3 w-3" />
                      Add to dictionary
                    </button>
                  )}
                  <button
                    onClick={() => { onAudit?.("ignored", issue); onIgnore(issue.id); }}
                    className="rounded-lg border border-[var(--cs-border-subtle)] px-2.5 py-1 text-xs text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)]"
                  >
                    Ignore
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
