"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA WRITING ASSISTANT — editor-agnostic inline drop-in
//
// Drops beneath ANY existing editor (a plain textarea, CaraCompose, a rich
// editor…) driven by that field's own value/setter. Surfaces suggestions inline
// only when needed during data entry — no sidebar, no page, no editor swap.
// Use this to add the assistant to fields that already have their own editor;
// use <CaraWritingField /> for greenfield textareas.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback } from "react";
import { useWritingAssistant } from "@/hooks/use-writing-assistant";
import { InlineSuggestions } from "./inline-suggestions";
import type { WritingIssue, WritingMode, WritingSuggestion } from "@/lib/writing-assistant/types";

export interface WritingAssistantInlineProps {
  /** Current field text. */
  value: string;
  /** Apply an accepted literal fix back to the field. */
  onApplyText: (next: string) => void;
  recordType?: string;
  fieldName?: string;
  childId?: string;
  workflowId?: string;
  mode?: WritingMode;
  knownNames?: string[];
  enabled?: boolean;
}

export function WritingAssistantInline({
  value,
  onApplyText,
  recordType,
  fieldName,
  childId,
  workflowId,
  mode = "standard",
  knownNames,
  enabled = true,
}: WritingAssistantInlineProps) {
  const { issues, result, loading, ignore, recheck } = useWritingAssistant({
    text: value,
    recordType,
    fieldName,
    childId,
    workflowId,
    mode,
    knownNames,
    enabled,
  });

  const apply = useCallback(
    (issue: WritingIssue, suggestion: WritingSuggestion) => {
      // Offset safety: only replace if the original text still sits exactly here.
      const current = value.slice(issue.start, issue.end);
      if (current.toLowerCase() !== issue.originalText.toLowerCase()) {
        recheck();
        return;
      }
      onApplyText(value.slice(0, issue.start) + suggestion.replacementText + value.slice(issue.end));
      ignore(issue.id);
    },
    [value, onApplyText, ignore, recheck],
  );

  if (!enabled) return null;
  return <InlineSuggestions issues={issues} score={result?.score} loading={loading} onApply={apply} onIgnore={ignore} />;
}
