"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Loader2,
  AlertTriangle,
  Info,
  RefreshCw,
  Save,
  FileCheck,
  UserCheck,
  MessageSquarePlus,
  ChevronDown,
  Lightbulb,
  Minimize2,
  Baby,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CaraRiskBadge } from "./CaraRiskBadge";
import { CaraAgentBadge } from "./CaraAgentBadge";
import { CaraEvidencePanel } from "./CaraEvidencePanel";
import { CaraSuggestedActionsPanel } from "./CaraSuggestedActionsPanel";
import { CaraApprovalWorkflow } from "./CaraApprovalWorkflow";
import type { CaraResponse, EvidenceItem, SuggestedAction } from "@/lib/cara/orchestrator/types";

// ══════════════════════════════════════════════════════════════════════════════
// CaraOrchestrationPanel — main "one calm assistant" intelligence interface
//
// This is the primary Cara Intelligence orchestration chat panel. It provides:
// - Command bar ("What are you trying to do?")
// - Chat message thread (user queries + Cara responses)
// - Agent route badge, risk level banner, evidence drawer
// - Suggested actions, approval workflow, refinement controls
// - Draft/Save/Approve lifecycle
// - Loading and error states
//
// Calls POST /api/cara/orchestrate for all queries.
// ══════════════════════════════════════════════════════════════════════════════

type ChatMessage = {
  id: string;
  role: "user" | "cara";
  content: string;
  timestamp: Date;
  response?: CaraResponse;
};

type CaraOrchestrationPanelProps = {
  homeId: string;
  userId: string;
  role: string;
  childId?: string;
  currentPage?: string;
  className?: string;
};

export function CaraOrchestrationPanel({
  homeId,
  userId,
  role,
  childId,
  currentPage,
  className,
}: CaraOrchestrationPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // ── Send query to orchestrator ───────────────────────────────────────────

  const sendQuery = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: query.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/cara/orchestrate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({
            query: query.trim(),
            homeId,
            userId,
            role,
            childId: childId ?? undefined,
            currentPage,
            sessionId: sessionId ?? undefined,
          }),
        });

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error ?? "Cara was unable to process your request.");
        }

        // Store session for follow-up messages
        if (json.sessionId && !sessionId) {
          setSessionId(json.sessionId);
        }

        const caraResponse: CaraResponse = json.response ?? json;

        const caraMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "cara",
          content: caraResponse.answer,
          timestamp: new Date(),
          response: caraResponse,
        };

        setMessages((prev) => [...prev, caraMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [homeId, userId, role, childId, currentPage, sessionId],
  );

  // ── Refinement queries ───────────────────────────────────────────────────

  const handleRefinement = useCallback(
    (refinement: string) => {
      sendQuery(refinement);
    },
    [sendQuery],
  );

  // ── Save draft ───────────────────────────────────────────────────────────

  const handleSaveDraft = useCallback(
    async (response: CaraResponse) => {
      try {
        await fetch("/api/cara/orchestrate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({
            query: response.answer,
            homeId,
            userId,
            role,
            childId,
            saveIntent: true,
            sessionId: sessionId ?? undefined,
            requestedAction: "save_draft",
          }),
        });
      } catch {
        setError("Failed to save draft.");
      }
    },
    [homeId, userId, role, childId, sessionId],
  );

  // ── Submit handler ───────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendQuery(input);
    },
    [input, sendQuery],
  );

  // ── Keyboard shortcut ────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendQuery(input);
      }
    },
    [input, sendQuery],
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Card className={cn("flex h-[680px] flex-col overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--cs-border)] px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--cs-cara-gold-bg)]">
            <Sparkles className="size-4 text-[var(--cs-cara-gold)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--cs-navy)]">
              Cara Intelligence
            </h3>
            <p className="text-xs text-[var(--cs-text-gentle)]">
              One calm assistant for everything
            </p>
          </div>
        </div>
        {sessionId && (
          <Badge variant="secondary" className="text-[10px]">
            Session active
          </Badge>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4"
      >
        {messages.length === 0 && !loading && (
          <EmptyState onSelect={sendQuery} />
        )}

        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === "user" ? (
                <UserMessage content={message.content} />
              ) : (
                <CaraMessage
                  message={message}
                  homeId={homeId}
                  userId={userId}
                  sessionId={sessionId}
                  onRefinement={handleRefinement}
                  onSaveDraft={handleSaveDraft}
                />
              )}
            </div>
          ))}

          {/* Loading state */}
          {loading && <LoadingIndicator />}

          {/* Error state */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/60 px-4 py-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-700">
                  Something went wrong
                </p>
                <p className="mt-0.5 text-xs text-red-600">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="mt-1.5 h-7 gap-1 text-xs text-red-600 hover:text-red-700"
                >
                  <RefreshCw className="size-3" />
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Command bar */}
      <div className="border-t border-[var(--cs-border)] px-5 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What are you trying to do?"
            disabled={loading}
            className="flex-1"
          />
          <Button
            type="submit"
            variant="cara"
            size="icon"
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════════

// ── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ onSelect }: { onSelect: (query: string) => void }) {
  const suggestions = [
    "What risks or patterns need management review?",
    "Draft a manager oversight summary for this child.",
    "What evidence gaps exist for Ofsted readiness?",
    "Create a key work session plan.",
    "What should I include in today's handover?",
    "Summarise recent incidents and identify trends.",
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-8">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--cs-cara-gold-bg)]">
        <Sparkles className="size-6 text-[var(--cs-cara-gold)]" />
      </div>
      <h4 className="mt-4 text-base font-semibold text-[var(--cs-navy)]">
        What are you trying to do?
      </h4>
      <p className="mt-1.5 max-w-sm text-center text-sm text-[var(--cs-text-secondary)]">
        Cara will route your request to the right specialist, gather evidence,
        and provide a thoughtful response with next steps.
      </p>
      <div className="mt-5 grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-3 py-2.5 text-left text-xs text-[var(--cs-text-secondary)] transition-colors hover:border-[var(--cs-cara-gold-soft)] hover:bg-[var(--cs-cara-gold-bg)] hover:text-[var(--cs-navy)]"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── User Message ───────────────────────────────────────────────────────────

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[var(--cs-navy)] px-4 py-2.5 text-sm text-white">
        {content}
      </div>
    </div>
  );
}

// ── Cara Message ───────────────────────────────────────────────────────────

function CaraMessage({
  message,
  homeId,
  userId,
  sessionId,
  onRefinement,
  onSaveDraft,
}: {
  message: ChatMessage;
  homeId: string;
  userId: string;
  sessionId: string | null;
  onRefinement: (query: string) => void;
  onSaveDraft: (response: CaraResponse) => void;
}) {
  const [showExplanation, setShowExplanation] = useState(false);
  const response = message.response;

  if (!response) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-4 py-2.5 text-sm text-[var(--cs-navy)]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Risk banner (medium and above) */}
      {response.riskLevel !== "low" && (
        <CaraRiskBadge riskLevel={response.riskLevel} variant="banner" />
      )}

      {/* Blocked state */}
      {response.blocked && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/60 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-700">Request Blocked</p>
            <p className="mt-0.5 text-xs text-red-600">
              {response.blockReason ?? "This request was blocked by safety governance."}
            </p>
          </div>
        </div>
      )}

      {/* Main response card */}
      {!response.blocked && (
        <div className="flex justify-start">
          <div className="max-w-[90%] space-y-3">
            {/* Metadata badges */}
            <div className="flex flex-wrap items-center gap-2">
              <CaraAgentBadge agentUsed={response.agentUsed} />
              <CaraRiskBadge riskLevel={response.riskLevel} />
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Info className="size-3" />
                {response.confidence}% confident
              </Badge>
            </div>

            {/* Response content */}
            <div className="rounded-2xl rounded-bl-md border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-4 py-3">
              <div className="prose prose-sm max-w-none text-[var(--cs-navy)]">
                {response.answer.split("\n").map((line, i) => (
                  <p key={i} className={cn("text-sm leading-relaxed", line.trim() === "" && "h-2")}>
                    {line}
                  </p>
                ))}
              </div>
            </div>

            {/* Safety notes */}
            {response.safetyNotes.length > 0 && (
              <div className="space-y-1">
                {response.safetyNotes.map((note, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-amber-700"
                  >
                    <AlertTriangle className="size-3 shrink-0" />
                    {note}
                  </div>
                ))}
              </div>
            )}

            {/* Evidence panel */}
            <CaraEvidencePanel
              evidence={response.evidenceUsed}
              hasGaps={response.confidence < 60}
            />

            {/* Suggested actions */}
            {response.suggestedActions.length > 0 && (
              <CaraSuggestedActionsPanel
                actions={response.suggestedActions}
                homeId={homeId}
                userId={userId}
              />
            )}

            {/* Approval workflow */}
            {response.requiresApproval && (
              <CaraApprovalWorkflow
                draftContent={response.answer}
                sessionId={sessionId ?? response.auditId}
                draftId={response.auditId}
                userId={userId}
                riskLevel={response.riskLevel}
              />
            )}

            {/* Explanation */}
            {showExplanation && (
              <div className="rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-4 py-3">
                <p className="mb-1 text-xs font-medium text-[var(--cs-text-gentle)]">
                  Why Cara suggested this
                </p>
                <p className="text-xs leading-relaxed text-[var(--cs-text-secondary)]">
                  This response was routed to the <strong>{response.agentUsed}</strong> agent
                  using the <strong>{response.modelProfile}</strong> model profile.
                  {response.evidenceUsed.length > 0 && (
                    <> It drew on {response.evidenceUsed.length} evidence source{response.evidenceUsed.length !== 1 ? "s" : ""}.</>
                  )}
                  {response.escalationRecommended && (
                    <> Escalation has been recommended due to the risk level.</>
                  )}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExplanation(!showExplanation)}
                className="h-7 gap-1 text-xs"
              >
                <Lightbulb className="size-3" />
                {showExplanation ? "Hide explanation" : "Explain why"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRefinement("Make the previous response more child-centred, focusing on the child's voice and lived experience.")}
                className="h-7 gap-1 text-xs"
              >
                <Baby className="size-3" />
                More child-centred
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRefinement("Make the previous response more concise and direct, keeping only the essential information.")}
                className="h-7 gap-1 text-xs"
              >
                <Minimize2 className="size-3" />
                More concise
              </Button>

              {response.canSave && !response.requiresApproval && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSaveDraft(response)}
                  className="h-7 gap-1 text-xs"
                >
                  <Save className="size-3" />
                  Save draft
                </Button>
              )}

              {response.escalationRecommended && (
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => onRefinement("Send this to my manager for review with full context and evidence.")}
                  className="h-7 gap-1 text-xs"
                >
                  <UserCheck className="size-3" />
                  Send to manager
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Loading Indicator ──────────────────────────────────────────────────────

function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-md border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-4 py-3">
        <div className="flex size-6 items-center justify-center rounded-lg bg-[var(--cs-cara-gold-bg)]">
          <Sparkles className="size-3.5 animate-pulse text-[var(--cs-cara-gold)]" />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-[var(--cs-text-secondary)]">
            Cara is thinking...
          </p>
          <p className="text-xs text-[var(--cs-text-gentle)]">
            Routing query, gathering evidence, generating response
          </p>
        </div>
        <Loader2 className="size-4 animate-spin text-[var(--cs-cara-gold)]" />
      </div>
    </div>
  );
}
