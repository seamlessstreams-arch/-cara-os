"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useAriaStream } from "@/hooks/use-aria";
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
  review:            "text-violet-600 bg-violet-50",
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

  const { stream, isStreaming, abort } = useAriaStream();

  const handleAsk = () => {
    setResponse("");
    const currentPrompt = prompt;
    setPrompt("");
    stream(
      {
        mode,
        style,
        page_context: pageContext,
        record_type: recordType,
        source_content: sourceContent || currentPrompt,
        linked_records: linkedRecords,
        user_role: userRole,
        question: currentPrompt || undefined,
        document_text: isDocumentMode && documentText ? documentText : undefined,
      },
      (text) => { setResponse(text); },
      (error) => { setResponse(`Error: ${error.message}. Please try again.`); },
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
    <div className={cn("rounded-2xl border border-violet-200 bg-white overflow-hidden", className)}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-50 to-blue-50 border-b border-violet-100 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">Aria</div>
            <div className="text-[10px] text-slate-500">AI workflow assistant</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-[9px] rounded-full bg-violet-100 text-violet-700 border-0">BETA</Badge>
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", collapsed && "rotate-180")} />
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
                    ? `${MODE_COLORS[id] ?? "text-slate-600 bg-slate-100"} border-current`
                    : "text-slate-500 bg-slate-50 border-transparent hover:bg-slate-100"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Style selector */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Writing style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as AriaStyle)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              {STYLES.map(({ id, label }) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>

          {/* Document text area — only for document modes */}
          {isDocumentMode && (
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Paste document text
              </label>
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400"
                rows={4}
                placeholder="Paste text from the document you want to classify..."
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
              />
            </div>
          )}

          {/* Prompt input */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              {mode === "write"             ? "What would you like Aria to write?" :
               mode === "review"            ? "Any specific concerns to check?" :
               mode === "oversee"           ? "What should Aria focus on?" :
               mode === "document_classify" ? "Any specific focus for classification?" :
               mode === "document_to_form"  ? "Which form type should Aria create?" :
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-10 text-xs text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400"
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
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
              <div className="text-[10px] text-slate-500 font-medium">Aria can see</div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {sourceContent && (
                  <Badge className="text-[9px] rounded-full bg-blue-100 text-blue-700 border-0">Source record</Badge>
                )}
                {linkedRecords && (
                  <Badge className="text-[9px] rounded-full bg-violet-100 text-violet-700 border-0">Linked records</Badge>
                )}
                <Badge className="text-[9px] rounded-full bg-slate-100 text-slate-600 border-0">{pageContext}</Badge>
              </div>
            </div>
          )}

          {/* Ask button */}
          <Button
            onClick={handleAsk}
            disabled={isStreaming || (!prompt && !sourceContent && (!isDocumentMode || !documentText))}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            size="sm"
          >
            {isStreaming ? (
              <><RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />Aria is writing...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5 mr-2" />Ask Aria</>
            )}
          </Button>

          {/* Response */}
          {(response !== null && response !== "") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Aria&apos;s response</div>
                <div className="flex items-center gap-1.5">
                  {isStreaming && (
                    <button
                      onClick={abort}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="h-3 w-3" />Stop
                    </button>
                  )}
                  <button
                    onClick={handleCopy}
                    disabled={isStreaming}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-40"
                  >
                    {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-500" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
                  </button>
                  {onInsert && (
                    <button
                      onClick={() => response && onInsert(response)}
                      disabled={isStreaming || !response}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-40"
                    >
                      <ExternalLink className="h-3 w-3" />Insert
                    </button>
                  )}
                  <button onClick={() => { abort(); setResponse(null); }} className="text-slate-400 hover:text-slate-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {response}
                {isStreaming && <span className="inline-block w-1.5 h-3.5 bg-violet-500 ml-0.5 animate-pulse rounded-sm" />}
              </div>
              <div className="flex items-start gap-1.5 text-[10px] text-slate-400">
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                <span>Always review before use. Aria uses only the information you provided — never fabricates facts.</span>
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
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-white shadow-xl hover:bg-violet-700 transition-all hover:scale-105"
    >
      <Sparkles className="h-4 w-4" />
      <span className="text-sm font-semibold">Aria</span>
    </button>
  );
}
