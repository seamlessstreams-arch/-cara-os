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
import { useWritingAssistantSettings, enabledIssueTypes } from "@/hooks/use-writing-assistant-settings";
import { InlineSuggestions } from "./inline-suggestions";
import { applyAutoFixes } from "@/lib/writing-assistant/rewrite-engine";
import type { WritingIssue, WritingMode, WritingSuggestion } from "@/lib/writing-assistant/types";

export interface WritingAssistantInlineProps {
  value: string;
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
  const { settings, toggleCategory, addToDictionary, logAudit } = useWritingAssistantSettings();

  // Merge caller-supplied knownNames with the user's personal dictionary.
  const allKnownNames = [...(knownNames ?? []), ...settings.dictionary];

  const { issues: rawIssues, result, loading, ignore, recheck } = useWritingAssistant({
    text: value,
    recordType,
    fieldName,
    childId,
    workflowId,
    mode,
    knownNames: allKnownNames.length > 0 ? allKnownNames : undefined,
    enabled: enabled && settings.enabled,
  });

  // Apply category toggles client-side so toggling is instant.
  const allowed = enabledIssueTypes(settings);
  const issues = rawIssues.filter((i) => allowed.includes(i.type));

  const apply = useCallback(
    (issue: WritingIssue, suggestion: WritingSuggestion) => {
      const current = value.slice(issue.start, issue.end);
      if (current.toLowerCase() !== issue.originalText.toLowerCase()) { recheck(); return; }
      onApplyText(value.slice(0, issue.start) + suggestion.replacementText + value.slice(issue.end));
      ignore(issue.id);
    },
    [value, onApplyText, ignore, recheck],
  );

  const handleAudit = useCallback(
    (action: "accepted" | "ignored", issue: WritingIssue) => {
      logAudit({ action, issue_type: issue.type, original_text: issue.originalText, record_type: recordType, field_name: fieldName, child_id: childId });
    },
    [logAudit, recordType, fieldName, childId],
  );

  const applyAll = useCallback(() => {
    const { text: next, applied } = applyAutoFixes(value, issues);
    if (applied.length === 0) return;
    onApplyText(next);
    applied.forEach((issue) => {
      ignore(issue.id);
      logAudit({ action: "accepted", issue_type: issue.type, original_text: issue.originalText, record_type: recordType, field_name: fieldName, child_id: childId });
    });
  }, [value, issues, onApplyText, ignore, logAudit, recordType, fieldName, childId]);

  if (!enabled) return null;
  return (
    <InlineSuggestions
      issues={issues}
      score={result?.score}
      loading={loading}
      settings={settings}
      onApply={apply}
      onIgnore={ignore}
      onApplyAll={applyAll}
      onToggleCategory={toggleCategory}
      onAddToDictionary={addToDictionary}
      onAudit={handleAudit}
    />
  );
}
