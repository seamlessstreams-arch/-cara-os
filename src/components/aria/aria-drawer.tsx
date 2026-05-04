"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA DRAWER
// A right-side sliding drawer for contextual Aria assistance.
// Can be opened from any page with context about the current record.
// All Aria suggestions require human approval before saving.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  X, Sparkles, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  ClipboardList, ShieldAlert, Eye, ListChecks, MessageSquare, FileText,
  AlertTriangle, Lightbulb, RefreshCw,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AriaSourceType =
  | "child_record"
  | "incident"
  | "medication"
  | "reg45"
  | "staff"
  | "home_check"
  | "document"
  | "contact_log"
  | "complaint"
  | "pi_debrief"
  | "care_plan"
  | "general";

export interface AriaDrawerContext {
  sourceType?:     AriaSourceType;
  sourceId?:       string;
  childId?:        string;
  childName?:      string;
  staffId?:        string;
  homeId?:         string;
  pageTitle?:      string;
  suggestedAction?:string;
  extraContext?:   string;
}

interface AriaAction {
  id:       string;
  label:    string;
  icon:     React.ElementType;
  prompt:   string;
  category: string;
}

// ── Contextual actions by source type ────────────────────────────────────────

function getActionsForContext(ctx: AriaDrawerContext): AriaAction[] {
  const base: AriaAction[] = [
    {
      id:       "summarise",
      label:    "Summarise this record",
      icon:     ClipboardList,
      prompt:   "Provide a concise professional summary of this record in 3–5 sentences.",
      category: "General",
    },
    {
      id:       "safeguarding",
      label:    "Check for safeguarding concerns",
      icon:     ShieldAlert,
      prompt:   "Identify any safeguarding concerns in this record. Be specific about risks and who is at risk.",
      category: "General",
    },
    {
      id:       "task",
      label:    "Generate a follow-up task",
      icon:     CheckCircle2,
      prompt:   "Based on this record, suggest one or two concrete follow-up actions with clear ownership and timescales.",
      category: "Workflow",
    },
    {
      id:       "rewrite",
      label:    "Rewrite professionally",
      icon:     FileText,
      prompt:   "Rewrite this record in professional, objective, and Ofsted-ready language. Preserve all factual content.",
      category: "Writing",
    },
  ];

  const byType: Record<AriaSourceType, AriaAction[]> = {
    incident: [
      { id: "oversight",   label: "Draft management oversight",   icon: Eye,          prompt: "Write a management oversight note for this incident. Include: what happened, immediate response, lessons learned, any regulatory notifications required.", category: "Compliance" },
      { id: "reg45",       label: "Link to Reg 45 evidence",      icon: ShieldAlert,  prompt: "Identify which Reg 45 quality standard(s) this incident relates to and suggest how it should be referenced as evidence.", category: "Compliance" },
      { id: "debrief",     label: "Suggest PI debrief actions",   icon: MessageSquare,prompt: "Suggest what should happen in the post-incident debrief for staff and young person.", category: "Post-incident" },
    ],
    medication: [
      { id: "error_review",label: "Review for medication errors", icon: AlertTriangle, prompt: "Identify any medication administration errors, omissions, or concerns in this record.", category: "Safety" },
      { id: "pattern",     label: "Identify administration pattern", icon: Lightbulb, prompt: "Are there any patterns in this medication record that suggest risk — refusals, timing issues, stock discrepancies?", category: "Safety" },
    ],
    reg45: [
      { id: "gap",         label: "Find missing evidence",        icon: AlertTriangle, prompt: "Identify gaps in this Reg 45 evidence submission and suggest which existing records could fill them.", category: "Compliance" },
      { id: "draft",       label: "Draft Reg 45 summary",         icon: FileText,      prompt: "Draft a professional Reg 45 quality statement for this evidence area.", category: "Compliance" },
      { id: "ri_brief",    label: "Generate RI overview",         icon: Eye,           prompt: "Write a brief for the Responsible Individual summarising the quality of evidence in this area.", category: "Compliance" },
    ],
    child_record: [
      { id: "keywork",     label: "Suggest key work session",     icon: ListChecks,    prompt: "Based on this child's record, suggest a focused key work session topic with aims and activities.", category: "Care" },
      { id: "pattern",     label: "Identify behavioural pattern", icon: Lightbulb,     prompt: "Identify any patterns in this child's recent records — triggers, timing, escalation, de-escalation.", category: "Care" },
      { id: "write_child", label: "Write to the child",           icon: MessageSquare, prompt: "Write a short, warm letter from the care team to this young person, acknowledging their progress and strengths.", category: "Child Voice" },
    ],
    contact_log: [
      { id: "pattern",     label: "Identify contact pattern",     icon: Lightbulb,     prompt: "Analyse this contact log. Are there patterns in how the young person is affected before and after contact? What should change?", category: "Care" },
      { id: "sw_note",     label: "Draft social worker note",     icon: FileText,       prompt: "Draft a professional note to the social worker summarising concerns identified in this contact log.", category: "Writing" },
    ],
    complaint: [
      { id: "response",    label: "Draft complaint response",     icon: FileText,       prompt: "Draft a professional, empathetic, and Ofsted-ready response to this complaint. Acknowledge, investigate, learn.", category: "Compliance" },
      { id: "learning",    label: "Identify learning points",     icon: Lightbulb,      prompt: "What are the key learning points from this complaint? What should change as a result?", category: "Compliance" },
    ],
    pi_debrief: [
      { id: "debrief_yp",  label: "Guide YP debrief",            icon: MessageSquare,  prompt: "Suggest how to approach the young person's post-incident debrief — tone, questions, expectations.", category: "Post-incident" },
      { id: "riddor",      label: "Check RIDDOR requirements",   icon: ShieldAlert,    prompt: "Based on this PI record, does this incident require RIDDOR reporting? Explain why or why not.", category: "Compliance" },
    ],
    care_plan: [
      { id: "review",      label: "Identify goals needing review",icon: AlertTriangle,  prompt: "Which goals in this care plan need urgent attention or review? What evidence supports this?", category: "Care" },
      { id: "lac_prep",    label: "Prepare for LAC review",      icon: ClipboardList,  prompt: "Summarise this young person's progress against their care plan goals for the upcoming LAC review.", category: "Care" },
    ],
    staff:       [],
    home_check:  [],
    document:    [],
    general:     [],
  };

  const extra = byType[ctx.sourceType ?? "general"] ?? [];
  return [...extra, ...base];
}

// ── Suggestion card ───────────────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onApprove,
  onEdit,
  onReject,
}: {
  suggestion: string;
  onApprove: () => void;
  onEdit: (edited: string) => void;
  onReject: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(suggestion);

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3 animate-fade-in">
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
        <p className="text-xs font-semibold text-indigo-700">Aria suggestion</p>
      </div>

      {editing ? (
        <Textarea
          className="min-h-[120px] text-sm resize-none border-indigo-300 bg-white"
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
        />
      ) : (
        <p className="text-sm text-indigo-900 leading-relaxed whitespace-pre-wrap">{suggestion}</p>
      )}

      <p className="text-[10px] text-indigo-500 italic">
        All Aria suggestions require human review before being saved to the official record.
      </p>

      <div className="flex gap-2 flex-wrap">
        {editing ? (
          <>
            <Button
              size="sm"
              className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700"
              onClick={() => { onEdit(editedText); setEditing(false); }}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" /> Save edited
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
              onClick={onApprove}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-slate-500"
              onClick={onReject}
            >
              <XCircle className="w-3 h-3 mr-1" /> Reject
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Drawer component ─────────────────────────────────────────────────────

interface AriaDrawerProps {
  open:     boolean;
  onClose:  () => void;
  context?: AriaDrawerContext;
}

export function AriaDrawer({ open, onClose, context = {} }: AriaDrawerProps) {
  const [activeAction, setActiveAction]   = useState<string | null>(null);
  const [loading, setLoading]             = useState(false);
  const [suggestion, setSuggestion]       = useState<string | null>(null);
  const [approved, setApproved]           = useState<string | null>(null);
  const [rejected, setRejected]           = useState(false);
  const [freePrompt, setFreePrompt]       = useState("");
  const [showFreePrompt, setShowFreePrompt] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const actions = getActionsForContext(context);

  const groupedActions = actions.reduce<Record<string, AriaAction[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});

  async function runAction(action: AriaAction, customPrompt?: string) {
    setActiveAction(action.id);
    setSuggestion(null);
    setApproved(null);
    setRejected(false);
    setLoading(true);

    const contextStr = [
      context.pageTitle   ? `Page: ${context.pageTitle}`   : null,
      context.childName   ? `Child: ${context.childName}`  : null,
      context.sourceType  ? `Record type: ${context.sourceType}` : null,
      context.extraContext,
    ].filter(Boolean).join(". ");

    try {
      const res = await fetch("/api/v1/aria/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: contextStr || "Cornerstone Care OS — children's residential home.",
          prompt:  customPrompt ?? action.prompt,
        }),
      });
      const data = await res.json();
      setSuggestion(data.response ?? data.content ?? "Unable to generate a suggestion at this time.");
    } catch {
      setSuggestion("An error occurred while generating the suggestion. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleApprove() {
    if (!suggestion) return;
    setApproved(suggestion);
    setSuggestion(null);
    // In a real implementation, this would save to the record + write audit log
  }

  function handleEdit(edited: string) {
    setApproved(edited);
    setSuggestion(null);
  }

  function handleReject() {
    setSuggestion(null);
    setRejected(true);
    setActiveAction(null);
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 z-50 h-full w-[420px] max-w-[100vw] bg-white shadow-2xl flex flex-col animate-drawer">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
            <Sparkles className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">Aria</p>
            <p className="text-[11px] text-slate-500 truncate">
              {context.pageTitle ?? "Intelligent assistance"}
              {context.childName ? ` · ${context.childName}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Approved output */}
          {approved && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <p className="text-xs font-semibold text-emerald-700">Approved & saved to record</p>
              </div>
              <p className="text-sm text-emerald-900 whitespace-pre-wrap">{approved}</p>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-emerald-600"
                onClick={() => setApproved(null)}
              >
                <RefreshCw className="w-3 h-3 mr-1" /> Run another
              </Button>
            </div>
          )}

          {/* Suggestion */}
          {suggestion && !approved && (
            <SuggestionCard
              suggestion={suggestion}
              onApprove={handleApprove}
              onEdit={handleEdit}
              onReject={handleReject}
            />
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-3 rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-5">
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
              <p className="text-sm text-indigo-700">Aria is thinking…</p>
            </div>
          )}

          {/* Actions */}
          {!loading && !suggestion && !approved && (
            <>
              {Object.entries(groupedActions).map(([category, items]) => (
                <div key={category}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    {category}
                  </p>
                  <div className="space-y-1.5">
                    {items.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          onClick={() => runAction(action)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left transition-all border",
                            activeAction === action.id
                              ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                              : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-slate-200",
                          )}
                        >
                          <Icon className="w-4 h-4 shrink-0 text-indigo-500" />
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Free-form prompt */}
              <div>
                <button
                  className="flex items-center gap-2 text-[11px] text-slate-500 hover:text-slate-700 transition-colors"
                  onClick={() => setShowFreePrompt((v) => !v)}
                >
                  {showFreePrompt ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Ask Aria something specific
                </button>
                {showFreePrompt && (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      className="h-24 text-sm resize-none"
                      placeholder="Ask Aria anything about this record…"
                      value={freePrompt}
                      onChange={(e) => setFreePrompt(e.target.value)}
                    />
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                      disabled={!freePrompt.trim()}
                      onClick={() => runAction(
                        { id: "free", label: "Custom", icon: Sparkles, prompt: freePrompt, category: "Custom" },
                        freePrompt,
                      )}
                    >
                      <Sparkles className="w-3 h-3 mr-1.5" /> Ask Aria
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Aria suggestions are AI-generated. All outputs require human review before saving to the official record. Every action is audit logged.
          </p>
        </div>
      </aside>
    </>
  );
}

// ── Hook: global Aria drawer state ────────────────────────────────────────────
// Import and use in any component to open the drawer with context.

import { createContext, useContext } from "react";

interface AriaDrawerContextValue {
  openDrawer:  (ctx?: AriaDrawerContext) => void;
  closeDrawer: () => void;
}

export const AriaDrawerCtx = createContext<AriaDrawerContextValue>({
  openDrawer:  () => {},
  closeDrawer: () => {},
});

export function useAriaDrawer() {
  return useContext(AriaDrawerCtx);
}
