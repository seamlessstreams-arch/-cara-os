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
import { useWritingAssistantSettings, enabledIssueTypes } from "@/hooks/use-writing-assistant-settings";
import { InlineSuggestions } from "./inline-suggestions";
import { applyAutoFixes } from "@/lib/writing-assistant/rewrite-engine";
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
  const { settings, toggleCategory, addToDictionary, logAudit } = useWritingAssistantSettings();

  const allKnownNames = [...(props.knownNames ?? []), ...settings.dictionary];

  const { issues: rawIssues, result, loading, ignore, recheck } = useWritingAssistant({
    text: value,
    recordType: props.recordType,
    fieldName: props.fieldName,
    childId: props.childId,
    workflowId: props.workflowId,
    mode,
    knownNames: allKnownNames.length > 0 ? allKnownNames : undefined,
    enabled: assistEnabled && settings.enabled,
  });

  const allowed = enabledIssueTypes(settings);
  const issues = rawIssues.filter((i) => allowed.includes(i.type));

  const applySuggestion = useCallback(
    (issue: WritingIssue, suggestion: WritingSuggestion) => {
      const current = value.slice(issue.start, issue.end);
      if (current.toLowerCase() !== issue.originalText.toLowerCase()) { recheck(); return; }
      onChange(value.slice(0, issue.start) + suggestion.replacementText + value.slice(issue.end));
      ignore(issue.id);
    },
    [value, onChange, ignore, recheck],
  );

  const handleAudit = useCallback(
    (action: "accepted" | "ignored", issue: WritingIssue) => {
      logAudit({ action, issue_type: issue.type, original_text: issue.originalText, record_type: props.recordType, field_name: props.fieldName, child_id: props.childId });
    },
    [logAudit, props.recordType, props.fieldName, props.childId],
  );

  const applyAll = useCallback(() => {
    const { text: next, applied } = applyAutoFixes(value, issues);
    if (applied.length === 0) return;
    onChange(next);
    applied.forEach((issue) => {
      ignore(issue.id);
      logAudit({ action: "accepted", issue_type: issue.type, original_text: issue.originalText, record_type: props.recordType, field_name: props.fieldName, child_id: props.childId });
    });
  }, [value, issues, onChange, ignore, logAudit, props.recordType, props.fieldName, props.childId]);

  return (
    <div className={className}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        aria-label={props["aria-label"] ?? props.fieldName ?? "Record text"}
        spellCheck
        style={{ minHeight }}
        className={cn(
          "w-full rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] px-3 py-2 text-sm leading-relaxed text-[var(--cs-text)]",
          "focus:border-[var(--cs-teal,#0d9488)] focus:outline-none",
          (disabled || readOnly) && "opacity-70",
        )}
      />
      {assistEnabled && (
        <InlineSuggestions
          issues={issues}
          score={result?.score}
          loading={loading}
          settings={settings}
          onApply={applySuggestion}
          onIgnore={ignore}
          onApplyAll={applyAll}
          onToggleCategory={toggleCategory}
          onAddToDictionary={addToDictionary}
          onAudit={handleAudit}
        />
      )}
    </div>
  );
}
