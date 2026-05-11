"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useAria } from "@/hooks/use-aria";
import type { AriaMode, AriaStyle } from "@/types/extended";
import {
  Sparkles, ChevronDown, Copy, CheckCircle2, RefreshCw,
  Pen, Eye, Shield, Zap, X, AlertTriangle, ExternalLink,
  FileUp, FileInput,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DictationButton } from "@/components/common/dictation-button";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AriaPanelProps {
  mode?: AriaMode;
  pageContext: string;
  recordType?: string;
  sourceContent?: string;
  linkedRecords?: string;
  userRole?: string;
  defaultStyle?: AriaStyle;
  onInsert?: (text: string) => void;
  className?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MODES: { id: AriaMode; label: string; icon: React.ElementType; description: string }[] = [
  { id: "write",             label: "Write",       icon: Pen,       description: "Draft records, summaries, and correspondence" },
  { id: "review",            label: "Review",      icon: Eye,       description: "Check records before submission" },
  { id: "oversee",           label: "Oversee",     icon: Shield,    description: "Draft management oversight comments" },
  { id: "assist",            label: "Assist",      icon: Zap,       description: "Proactive workflow support and suggestions" },
  { id: "document_classify", label: "Doc Classify",icon: FileUp,    description: "Classify and extract from a document" },
  { id: "document_to_form",  label: "Form from Doc",icon: FileInput, description: "Create a form draft from document text" },
];

const STYLES: { id: AriaStyle; label: string }[] = [
  { id: "professional_formal", label: "Professional (formal)" },
  { id: "warm_professional", label: "Warm professional" },
  { id: "concise_manager", label: "Concise manager summary" },
  { id: "safeguarding_focused", label: "Safeguarding-focused" },
  { id: "reflective_practice", label: "Reflective practice" },
  { id: "child_friendly", label: "Child-friendly (write to YP)" },
  { id: "social_worker_update", label: "Social worker update" },
  { id: "therapeutic", label: "Therapeutic / trauma-aware" },
  { id: "plain_english", label: "Plain English" },
  { id: "parent_carer", label: "Parent / carer" },
  { id: "complaint_response", label: "Complaint response" },
  { id: "restorative", label: "Restorative" },
];

const MODE_COLORS: Partial<Record<AriaMode, string>> & Record<string, string> = {
  write:             "text-blue-600 bg-blue-50",
  review:            "text-[var(--cs-aria-gold)] bg-[var(--cs-aria-gold-bg)]",
  oversee:           "text-emerald-600 bg-emerald-50",
  assist:            "text-amber-600 bg-amber-50",
  document_classify: "text-indigo-600 bg-indigo-50",
  document_to_form:  "text-teal-600 bg-teal-50",
};

// ── Aria Panel ────────────────────────────────────────────────────────────────

export function AriaPanel({
  mode: defaultMode = "assist",
  pageContext,
  recordType,
  sourceContent,
  linkedRecords,
  userRole = "registered_manager",
  defaultStyle = "professional_formal",
  onInsert,
  className,
}: AriaPanelProps) {
  const [mode, setMode] = useState<AriaMode>(defaultMode);
  const [style, setStyle] = useState<AriaStyle>(defaultStyle);
  const [prompt, setPrompt] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isDocumentMode = mode === "document_classify" || mode === "document_to_form";

  const { mutate: askAria, isPending } = useAria();

  const handleAsk = () => {
    askAria(
      {
        mode,
        style,
        page_context: pageContext,
        record_type: recordType,
        source_content: sourceContent || prompt,
        linked_records: linkedRecords,
        user_role: userRole,
        question: prompt || undefined,
        document_text: isDocumentMode && documentText ? documentText : undefined,
      },
      {
        onSuccess: (res) => {
          setResponse(res.data.response);
          setPrompt("");
        },
      }
    );
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn("rounded-2xl border border-[var(--cs-aria-gold-soft)] bg-white overflow-hidden", className)}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[var(--cs-aria-gold-bg)] to-blue-50 border-b border-[var(--cs-aria-gold-soft)] cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-[var(--cs-navy)] flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--cs-navy)]">Aria</div>
            <div className="text-[10px] text-[var(--cs-text-muted)]">AI workflow assistant</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-[9px] rounded-full bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)] border-0">BETA</Badge>
          <ChevronDown className={cn("h-4 w-4 text-[var(--cs-text-muted)] transition-transform", collapsed && "rotate-180")} />
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Mode selector */}
          <div className="grid grid-cols-3 gap-1.5">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl p-2 text-[10px] font-semibold transition-all border",
                  mode === id
                    ? `${MODE_COLORS[id] ?? "text-[var(--cs-text-secondary)] bg-[var(--cs-surface)]"} border-current`
                    : "text-[var(--cs-text-muted)] bg-[var(--cs-surface)] border-transparent hover:bg-[var(--cs-surface)]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Style selector */}
          <div>
            <label className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider block mb-1.5">Writing style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as AriaStyle)}
              className="w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2 text-xs text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)]"
            >
              {STYLES.map(({ id, label }) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>

          {/* Document text area — only for document modes */}
          {isDocumentMode && (
            <div>
              <label className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider block mb-1.5">
                Paste document text
              </label>
              <textarea
                className="w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2 text-xs text-[var(--cs-text-secondary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)] placeholder:text-[var(--cs-text-muted)]"
                rows={4}
                placeholder="Paste text from the document you want to classify..."
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
              />
            </div>
          )}

          {/* Prompt input */}
          <div>
            <label className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider block mb-1.5">
              {mode === "write"             ? "What would you like ARIA to write?" :
               mode === "review"            ? "Any specific concerns to check?" :
               mode === "oversee"           ? "What should ARIA focus on?" :
               mode === "document_classify" ? "Any specific focus for classification?" :
               mode === "document_to_form"  ? "Which form type should ARIA create?" :
               "What do you need help with?"}
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === "write"             ? "e.g. Draft a daily log entry for Alex's afternoon activity..." :
                  mode === "review"            ? "e.g. Check this incident record is complete before I submit..." :
                  mode === "oversee"           ? "e.g. Draft oversight for the missing episode — focus on pattern and action taken..." :
                  mode === "document_classify" ? "e.g. Focus on safeguarding indicators and key dates..." :
                  mode === "document_to_form"  ? "e.g. Extract as an incident report form..." :
                  "e.g. What should I do next after logging this safeguarding concern?"
                }
                rows={3}
                className="w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2 pr-10 text-xs text-[var(--cs-text-secondary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)] placeholder:text-[var(--cs-text-muted)]"
              />
              <div className="absolute bottom-2 right-2">
                <DictationButton
                  size="sm"
                  onTranscript={(text) => setPrompt((prev) => prev ? `${prev} ${text}` : text)}
                  onInterimTranscript={(text) => setPrompt((prev) => {
                    const trimmed = prev.replace(/\s*…$/, "").trimEnd();
                    return trimmed ? `${trimmed} ${text}…` : `${text}…`;
                  })}
                  mode="append"
                />
              </div>
            </div>
          </div>

          {/* Context indicator */}
          {(sourceContent || linkedRecords) && (
            <div className="rounded-xl bg-[var(--cs-surface)] border border-[var(--cs-border)] px-3 py-2">
              <div className="text-[10px] text-[var(--cs-text-muted)] font-medium">ARIA can see</div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {sourceContent && (
                  <Badge className="text-[9px] rounded-full bg-blue-100 text-blue-700 border-0">Source record</Badge>
                )}
                {linkedRecords && (
                  <Badge className="text-[9px] rounded-full bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)] border-0">Linked records</Badge>
                )}
                <Badge className="text-[9px] rounded-full bg-[var(--cs-surface)] text-[var(--cs-text-secondary)] border-0">{pageContext}</Badge>
              </div>
            </div>
          )}

          {/* Ask button */}
          <Button
            onClick={handleAsk}
            disabled={isPending || (!prompt && !sourceContent && (!isDocumentMode || !documentText))}
            className="w-full bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white"
            size="sm"
          >
            {isPending ? (
              <><RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />ARIA is thinking...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5 mr-2" />Ask ARIA</>
            )}
          </Button>

          {/* Response */}
          {response && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Aria&apos;s response</div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)] transition-colors"
                  >
                    {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-500" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
                  </button>
                  {onInsert && (
                    <button
                      onClick={() => onInsert(response)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium bg-[var(--cs-navy)] text-white hover:bg-[var(--cs-navy)]/90 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />Insert
                    </button>
                  )}
                  <button onClick={() => setResponse(null)} className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="rounded-xl bg-[var(--cs-aria-gold-bg)] border border-[var(--cs-aria-gold-soft)] p-3 text-xs text-[var(--cs-text-secondary)] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {response}
              </div>
              <div className="flex items-start gap-1.5 text-[10px] text-[var(--cs-text-muted)]">
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                <span>Always review before use. ARIA uses only the information you provided — never fabricates facts.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Aria Floating Button (for pages that want a minimised trigger) ─────────────

export function AriaFloatingTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-[var(--cs-navy)] px-4 py-3 text-white shadow-xl hover:bg-[var(--cs-navy)]/90 transition-all hover:scale-105"
    >
      <Sparkles className="h-4 w-4" />
      <span className="text-sm font-semibold">Aria</span>
    </button>
  );
}
