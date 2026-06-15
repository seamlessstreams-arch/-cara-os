"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA WRITING ASSISTANT — <CaraWritingField />
//
// A drop-in textarea that adds Cara's care-recording writing assistant. The
// assistant appears INLINE beneath the field, only when there's something to
// suggest during data entry — no sidebar, no page. The author stays in control:
// literal fixes can be Accepted; guidance prompts are never auto-applied.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback } from "react";
import { cn } from "@/lib/utils";
import { useWritingAssistant } from "@/hooks/use-writing-assistant";
import { InlineSuggestions } from "./inline-suggestions";
import type { WritingIssue, WritingMode, WritingSuggestion } from "@/lib/writing-assistant/types";

export interface CaraWritingFieldProps {
  value: string;
  onChange: (next: string) => void;
  recordType?: string;
  childId?: string;
  workflowId?: string;
  fieldName?: string;
  disabled?: boolean;
  readOnly?: boolean;
  spellcheckEnabled?: boolean;
  grammarEnabled?: boolean;
  safeguardingEnabled?: boolean;
  writingToChildEnabled?: boolean;
  mode?: WritingMode;
  knownNames?: string[];
  minHeight?: number;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

export function CaraWritingField(props: CaraWritingFieldProps) {
  const {
    value,
    onChange,
    disabled = false,
    readOnly = false,
    minHeight = 120,
    placeholder,
    className,
    mode = "standard",
  } = props;

  const assistEnabled = !disabled && !readOnly;

  const { issues, result, loading, ignore, recheck } = useWritingAssistant({
    text: value,
    recordType: props.recordType,
    fieldName: props.fieldName,
    childId: props.childId,
    workflowId: props.workflowId,
    mode,
    knownNames: props.knownNames,
    enabled: assistEnabled,
  });

  // Respect per-category toggles (default on).
  const visible = issues.filter((i) => {
    if (props.spellcheckEnabled === false && i.type === "spelling") return false;
    if (props.grammarEnabled === false && (i.type === "grammar" || i.type === "punctuation")) return false;
    if (props.safeguardingEnabled === false && (i.type === "safeguarding-quality" || i.type === "chronology")) return false;
    if (props.writingToChildEnabled === false && i.type === "writing-to-child") return false;
    return true;
  });

  const applySuggestion = useCallback(
    (issue: WritingIssue, suggestion: WritingSuggestion) => {
      // Offset safety: only apply if the original text still sits exactly here.
      const current = value.slice(issue.start, issue.end);
      if (current.toLowerCase() !== issue.originalText.toLowerCase()) {
        recheck(); // text moved on — re-check rather than corrupt positions
        return;
      }
      onChange(value.slice(0, issue.start) + suggestion.replacementText + value.slice(issue.end));
      ignore(issue.id);
    },
    [value, onChange, ignore, recheck],
  );

  return (
    <div className={className}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        aria-label={props["aria-label"] ?? props.fieldName ?? "Record text"}
        spellCheck // native browser spellcheck baseline
        style={{ minHeight }}
        className={cn(
          "w-full rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] px-3 py-2 text-sm leading-relaxed text-[var(--cs-text)]",
          "focus:border-[var(--cs-teal,#0d9488)] focus:outline-none",
          (disabled || readOnly) && "opacity-70",
        )}
      />
      {assistEnabled && (
        <InlineSuggestions issues={visible} score={result?.score} loading={loading} onApply={applySuggestion} onIgnore={ignore} />
      )}
    </div>
  );
}
