"use client";

// ══════════════════════════════════════════════════════════════════════════════
// UNIVERSAL HOME ENTRY
//
// The Home-domain entry point. One text box for recording anything about the
// home/premises — fire drills, H&S checks, maintenance, vehicle checks, audits.
// Classified and routed automatically. Completes the three-domain model.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { classifyHomeRecord, type HomeClassificationResult } from "@/lib/record-classifier/home-record-classifier";
import { EnterOnceSuccess, type RecordType } from "@/components/forms/enter-once-indicator";
import { EntryAssist } from "@/components/forms/entry-assist";
import { useUnsavedGuard } from "@/hooks/use-unsaved-guard";
import {
  Flame, ShieldCheck, Wrench, Car, ClipboardCheck, FileText,
  AlertTriangle, Send, Loader2, ChevronDown, Check, Info, Clock,
} from "lucide-react";

interface UniversalHomeEntryProps {
  homeId?: string;
  homeName?: string;
  staffId?: string;
  onSuccess?: (result: unknown) => void;
  onCancel?: () => void;
  /** Reports whether there's unsaved text, so a host dialog can guard accidental close. */
  onDirtyChange?: (dirty: boolean) => void;
  className?: string;
}

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  fire_drill: { icon: Flame, color: "text-red-600", bg: "bg-red-50", label: "Fire Safety" },
  health_safety_check: { icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50", label: "Health & Safety Check" },
  maintenance_request: { icon: Wrench, color: "text-amber-600", bg: "bg-amber-50", label: "Maintenance" },
  vehicle_check: { icon: Car, color: "text-blue-600", bg: "bg-blue-50", label: "Vehicle Check" },
  home_audit: { icon: ClipboardCheck, color: "text-purple-600", bg: "bg-purple-50", label: "Home Audit" },
  observation: { icon: FileText, color: "text-slate-600", bg: "bg-slate-50", label: "Home Note" },
};

export function UniversalHomeEntry({ homeId = "home_oak", homeName = "Chamberlain House", staffId = "staff_darren", onSuccess, onCancel, onDirtyChange, className }: UniversalHomeEntryProps) {
  const [text, setText] = useState("");
  const [classification, setClassification] = useState<HomeClassificationResult | null>(null);
  const [overrideType, setOverrideType] = useState<string | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ reference: string; linked_updates: string[] } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const classifyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (classifyTimeout.current) clearTimeout(classifyTimeout.current);
    if (text.trim().length < 15) { setClassification(null); return; }
    classifyTimeout.current = setTimeout(() => setClassification(classifyHomeRecord(text, homeName)), 500);
    return () => { if (classifyTimeout.current) clearTimeout(classifyTimeout.current); };
  }, [text, homeName]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.max(120, Math.min(el.scrollHeight, 400)) + "px"; }
  }, [text]);

  // Report unsaved text so a host dialog can guard accidental close.
  useEffect(() => {
    onDirtyChange?.(text.trim().length > 0 && !result);
    return () => onDirtyChange?.(false);
  }, [text, result, onDirtyChange]);

  // Warn on tab close / refresh while there's unsaved text.
  useUnsavedGuard(text.trim().length > 0 && !result);

  const effectiveType = overrideType ?? classification?.primary_type ?? "observation";
  const meta = TYPE_META[effectiveType] ?? TYPE_META.observation;
  const TypeIcon = meta.icon;

  const handleSubmit = useCallback(async () => {
    if (text.trim().length < 10 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const cls = classification ?? classifyHomeRecord(text, homeName);
      const recordType = overrideType ?? cls.primary_type;
      const res = await fetch("/api/v1/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record_type: recordType,
          staff_id: staffId,
          home_id: homeId,
          title: cls.suggested_title,
          description: text.trim(),
          severity: cls.requires_immediate_action ? "high" : null,
          data: { tags: cls.tags, flags: cls.flags, classified_by: "universal_home_entry" },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResult({ reference: data.data?.reference ?? "Record saved", linked_updates: data.linked_updates ?? [] });
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
  }, [text, classification, overrideType, homeId, homeName, staffId, submitting, onSuccess]);

  if (result) {
    const safeType = ["fire_drill", "vehicle_check", "observation"].includes(effectiveType) ? effectiveType : "general";
    return (
      <EnterOnceSuccess
        reference={result.reference}
        recordType={safeType as RecordType}
        linkedUpdates={result.linked_updates}
        onDismiss={() => { setResult(null); setText(""); setClassification(null); setOverrideType(null); }}
        onCreateAnother={() => { setResult(null); setText(""); setClassification(null); setOverrideType(null); textareaRef.current?.focus(); }}
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[var(--cs-navy)] text-white flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--cs-navy)]">{homeName}</p>
          <p className="text-[11px] text-[var(--cs-text-muted)]">Recording for {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Record anything about the home — a fire drill, a health & safety check, a repair needed, a vehicle check, or an audit..."
          className="w-full rounded-2xl border-2 border-[var(--cs-border)] bg-white p-4 pr-12 text-sm text-[var(--cs-text)] placeholder:text-[var(--cs-text-gentle)] resize-none focus:border-[var(--cs-aria-gold)] focus:outline-none transition-colors min-h-[120px]"
          autoFocus
        />
        <div className="absolute bottom-3 right-3 text-[10px] text-[var(--cs-text-gentle)] tabular-nums">{text.length} chars</div>
      </div>

      {/* Dictate + rewrite */}
      <EntryAssist value={text} onChange={setText} sourceModule="universal_home_entry" sourceField="content" />

      {classification && text.length >= 15 && (
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", meta.bg)}>
                <TypeIcon className={cn("h-4 w-4", meta.color)} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--cs-text)]">Detected: {meta.label}</p>
                <p className="text-[10px] text-[var(--cs-text-muted)]">Confidence: {classification.confidence}{overrideType ? " (overridden)" : ""}</p>
              </div>
            </div>
            <button onClick={() => setShowTypeSelector(!showTypeSelector)} className="text-[10px] text-[var(--cs-aria-gold)] hover:underline flex items-center gap-0.5">
              Change <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          {showTypeSelector && (
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(TYPE_META).map(([type, m]) => {
                const Icon = m.icon;
                const isSelected = effectiveType === type;
                return (
                  <button key={type} onClick={() => { setOverrideType(type); setShowTypeSelector(false); }}
                    className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-all text-left",
                      isSelected ? "border-[var(--cs-aria-gold)] bg-[var(--cs-aria-gold-bg)] font-medium" : "border-[var(--cs-border-subtle)] hover:border-[var(--cs-border)]")}>
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", isSelected ? m.color : "text-[var(--cs-text-gentle)]")} />
                    <span className="truncate">{m.label}</span>
                    {isSelected && <Check className="h-3 w-3 text-[var(--cs-aria-gold)] ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {classification.flags.length > 0 && (
            <div className="space-y-1">
              {classification.flags.map((flag, i) => (
                <div key={i} className={cn("flex items-start gap-2 rounded-lg border p-2 text-xs",
                  flag.urgency === "immediate" ? "border-red-200 bg-red-50 text-red-800" :
                  flag.urgency === "today" ? "border-amber-200 bg-amber-50 text-amber-800" :
                  "border-green-200 bg-green-50 text-green-800")}>
                  {flag.urgency === "immediate" ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> :
                   flag.urgency === "today" ? <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" /> :
                   <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                  <span>{flag.message}</span>
                </div>
              ))}
            </div>
          )}

          {classification.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {classification.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-[var(--cs-bg)] border border-[var(--cs-border-subtle)] px-2 py-0.5 text-[10px] text-[var(--cs-text-muted)]">{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save error — note is preserved, so reassure + invite retry */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800" role="alert">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-[var(--cs-text-muted)] hover:text-[var(--cs-text)] transition-colors min-h-[48px] px-4">Cancel</button>
        )}
        <button onClick={handleSubmit} disabled={text.trim().length < 10 || submitting}
          className={cn("flex-1 flex items-center justify-center gap-2 rounded-xl text-sm font-medium min-h-[48px] transition-all",
            text.trim().length >= 10
              ? classification?.requires_immediate_action ? "bg-red-600 hover:bg-red-700 text-white" : "bg-[var(--cs-navy)] hover:bg-[var(--cs-navy-soft)] text-white"
              : "bg-[var(--cs-border)] text-[var(--cs-text-gentle)] cursor-not-allowed")}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" />{classification?.requires_immediate_action ? "Submit — Needs Attention" : "Save Record"}</>}
        </button>
      </div>
    </div>
  );
}
