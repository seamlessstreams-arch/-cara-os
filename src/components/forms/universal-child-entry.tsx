"use client";

// ══════════════════════════════════════════════════════════════════════════════
// UNIVERSAL CHILD ENTRY
//
// One form. One text box. Staff just writes about the child.
// Cornerstone figures out what type of record it is and routes it everywhere.
//
// "Just tell us what happened. We'll handle the rest."
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { getStore } from "@/lib/db/store";
import { classifyRecord, type ClassificationResult } from "@/lib/record-classifier/record-classifier";
import { EnterOnceIndicator, EnterOnceSuccess, type RecordType } from "@/components/forms/enter-once-indicator";
import { EntryAssist } from "@/components/forms/entry-assist";
import {
  Sparkles, AlertTriangle, Shield, Clock, Heart, FileText,
  Send, Loader2, ChevronDown, Check, Info,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UniversalChildEntryProps {
  childId: string;
  /** Acting staff member the record is attributed to (defaults to the demo user). */
  staffId?: string;
  onSuccess?: (result: any) => void;
  onCancel?: () => void;
  /** Reports whether there's unsaved text, so a host dialog can guard accidental close. */
  onDirtyChange?: (dirty: boolean) => void;
  className?: string;
}

const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  daily_log: { icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
  incident: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  safeguarding_concern: { icon: Shield, color: "text-red-700", bg: "bg-red-100" },
  missing_from_care: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  restraint: { icon: Shield, color: "text-orange-600", bg: "bg-orange-50" },
  health_update: { icon: Heart, color: "text-emerald-600", bg: "bg-emerald-50" },
  education_update: { icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
  family_contact: { icon: Heart, color: "text-pink-600", bg: "bg-pink-50" },
  key_work_session: { icon: Sparkles, color: "text-violet-600", bg: "bg-violet-50" },
  welfare_check: { icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
};

const TYPE_LABELS: Record<string, string> = {
  daily_log: "Daily Log",
  incident: "Incident",
  safeguarding_concern: "Safeguarding Concern",
  missing_from_care: "Missing from Care",
  restraint: "Physical Intervention",
  health_update: "Health Update",
  education_update: "Education Update",
  family_contact: "Family Contact",
  key_work_session: "Key Work Session",
  welfare_check: "Welfare Check",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function UniversalChildEntry({ childId, staffId = "staff_darren", onSuccess, onCancel, onDirtyChange, className }: UniversalChildEntryProps) {
  const store = getStore();
  const child = (store.youngPeople as any[] || []).find((yp: any) => yp.id === childId);
  const childName = child ? `${child.first_name} ${child.last_name ?? ""}`.trim() : "Child";

  const [text, setText] = useState("");
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [overrideType, setOverrideType] = useState<string | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ reference: string; linked_updates: string[] } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const classifyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-classify as user types (debounced 500ms)
  useEffect(() => {
    if (classifyTimeout.current) clearTimeout(classifyTimeout.current);
    if (text.trim().length < 15) {
      setClassification(null);
      return;
    }
    classifyTimeout.current = setTimeout(() => {
      const result = classifyRecord(text, childName);
      setClassification(result);
    }, 500);
    return () => { if (classifyTimeout.current) clearTimeout(classifyTimeout.current); };
  }, [text, childName]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.max(120, Math.min(el.scrollHeight, 400)) + "px";
    }
  }, [text]);

  // Report unsaved text so a host dialog can guard accidental close.
  useEffect(() => {
    onDirtyChange?.(text.trim().length > 0 && !result);
    return () => onDirtyChange?.(false);
  }, [text, result, onDirtyChange]);

  const effectiveType = overrideType ?? classification?.primary_type ?? "daily_log";
  const typeInfo = TYPE_ICONS[effectiveType] ?? TYPE_ICONS.daily_log;
  const TypeIcon = typeInfo.icon;

  const handleSubmit = useCallback(async () => {
    if (text.trim().length < 10 || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const cls = classification ?? classifyRecord(text, childName);
      const recordType = overrideType ?? cls.primary_type;

      const res = await fetch("/api/v1/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record_type: recordType,
          child_id: childId,
          staff_id: staffId,
          title: cls.suggested_title,
          description: text.trim(),
          severity: cls.severity,
          data: {
            tags: cls.tags,
            flags: cls.flags,
            classified_by: "universal_entry",
            classification_confidence: cls.confidence,
            secondary_types: cls.secondary_types,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResult({
          reference: data.data?.reference ?? "Record saved",
          linked_updates: data.linked_updates ?? [],
        });
        onSuccess?.(data);
      } else {
        setError((data as { error?: string })?.error || `Couldn't save (error ${res.status}). Your note is still here — please try again.`);
      }
    } catch (err) {
      console.error("Submit failed:", err);
      setError("Couldn't save — check your connection. Your note is still here, so nothing's lost.");
    } finally {
      setSubmitting(false);
    }
  }, [text, classification, overrideType, childId, staffId, childName, submitting, onSuccess]);

  // ── Success state ──────────────────────────────────────────────────────
  if (result) {
    return (
      <EnterOnceSuccess
        reference={result.reference}
        recordType={effectiveType as RecordType}
        linkedUpdates={result.linked_updates}
        onDismiss={() => { setResult(null); setText(""); setClassification(null); setOverrideType(null); }}
        onCreateAnother={() => { setResult(null); setText(""); setClassification(null); setOverrideType(null); textareaRef.current?.focus(); }}
      />
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-4", className)}>
      {/* Child context */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[var(--cs-navy)] text-white flex items-center justify-center text-sm font-bold shrink-0">
          {(child?.first_name?.[0] ?? "")}{(child?.last_name?.[0] ?? "")}
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--cs-navy)]">{childName}</p>
          <p className="text-[11px] text-[var(--cs-text-muted)]">Recording for {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
      </div>

      {/* Main text area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Just tell us what happened, what you did, or what you noticed about this child today..."
          className="w-full rounded-2xl border-2 border-[var(--cs-border)] bg-white p-4 pr-12 text-sm text-[var(--cs-text)] placeholder:text-[var(--cs-text-gentle)] resize-none focus:border-[var(--cs-aria-gold)] focus:ring-0 focus:outline-none transition-colors min-h-[120px]"
          autoFocus
        />
        <div className="absolute bottom-3 right-3 text-[10px] text-[var(--cs-text-gentle)] tabular-nums">
          {text.length} chars
        </div>
      </div>

      {/* Dictate + rewrite — available on every entry point */}
      <EntryAssist value={text} onChange={setText} sourceModule="universal_child_entry" sourceField="content" childId={childId} />

      {/* Live classification indicator */}
      {classification && text.length >= 15 && (
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3 space-y-3 animate-in fade-in duration-200">
          {/* Detected type */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", typeInfo.bg)}>
                <TypeIcon className={cn("h-4 w-4", typeInfo.color)} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--cs-text)]">
                  Detected: {TYPE_LABELS[effectiveType] ?? effectiveType}
                </p>
                <p className="text-[10px] text-[var(--cs-text-muted)]">
                  Confidence: {classification.confidence} {overrideType ? "(overridden)" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTypeSelector(!showTypeSelector)}
              className="text-[10px] text-[var(--cs-aria-gold)] hover:underline flex items-center gap-0.5"
            >
              Change <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          {/* Type override selector */}
          {showTypeSelector && (
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(TYPE_LABELS).map(([type, label]) => {
                const info = TYPE_ICONS[type] ?? TYPE_ICONS.daily_log;
                const Icon = info.icon;
                const isSelected = effectiveType === type;
                return (
                  <button
                    key={type}
                    onClick={() => { setOverrideType(type); setShowTypeSelector(false); }}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-all text-left",
                      isSelected
                        ? "border-[var(--cs-aria-gold)] bg-[var(--cs-aria-gold-bg)] font-medium"
                        : "border-[var(--cs-border-subtle)] hover:border-[var(--cs-border)] hover:bg-[var(--cs-bg)]",
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", isSelected ? info.color : "text-[var(--cs-text-gentle)]")} />
                    <span className="truncate">{label}</span>
                    {isSelected && <Check className="h-3 w-3 text-[var(--cs-aria-gold)] ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Flags */}
          {classification.flags.length > 0 && (
            <div className="space-y-1">
              {classification.flags.map((flag, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border p-2 text-xs",
                    flag.urgency === "immediate" ? "border-red-200 bg-red-50 text-red-800" :
                    flag.urgency === "today" ? "border-amber-200 bg-amber-50 text-amber-800" :
                    "border-green-200 bg-green-50 text-green-800",
                  )}
                >
                  {flag.urgency === "immediate" ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> :
                   flag.urgency === "today" ? <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" /> :
                   <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                  <span>{flag.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {classification.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {classification.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-[var(--cs-bg)] border border-[var(--cs-border-subtle)] px-2 py-0.5 text-[10px] text-[var(--cs-text-muted)]">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Where it flows */}
          <EnterOnceIndicator
            recordType={effectiveType as RecordType}
            severity={classification.severity ?? undefined}
            compact
          />
        </div>
      )}

      {/* Save error — note is preserved, so reassure + invite retry */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800" role="alert">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-[var(--cs-text-muted)] hover:text-[var(--cs-text)] transition-colors min-h-[48px] px-4">
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={text.trim().length < 10 || submitting}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-xl text-sm font-medium min-h-[48px] transition-all",
            text.trim().length >= 10
              ? classification?.requires_immediate_action
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-[var(--cs-navy)] hover:bg-[var(--cs-navy-soft)] text-white"
              : "bg-[var(--cs-border)] text-[var(--cs-text-gentle)] cursor-not-allowed",
          )}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4" />
              {classification?.requires_immediate_action ? "Submit — Immediate Action" : "Save Record"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
