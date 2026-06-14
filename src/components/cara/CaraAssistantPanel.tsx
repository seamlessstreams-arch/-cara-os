// ══════════════════════════════════════════════════════════════════════════════
// CaraAssistantPanel — Main AI assistant interface with governance awareness
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState, useRef } from "react";
import type { CaraTaskType, CaraRole, CaraTaskResult, CaraRouteDecision } from "@/lib/cara/core/types";
import { CaraModelDecisionBadge } from "./CaraModelDecisionBadge";
import { CaraHumanApprovalBanner } from "./CaraHumanApprovalBanner";
import { CaraRedactionNotice } from "./CaraRedactionNotice";
import { CaraCostEstimate } from "./CaraCostEstimate";
import { CaraSafetyWarning } from "./CaraSafetyWarning";

interface Props {
  userRole: CaraRole;
  organisationId: string;
  homeId?: string;
  childId?: string;
  defaultTaskType?: CaraTaskType;
  onResult?: (result: CaraTaskResult) => void;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  result?: CaraTaskResult;
  routeDecision?: CaraRouteDecision;
  error?: string;
  timestamp: string;
}

const TASK_TYPE_LABELS: Partial<Record<CaraTaskType, string>> = {
  safeguarding_analysis: "Safeguarding Analysis",
  reg45_report: "Reg 45 Report",
  keywork_session_plan: "Keywork Plan",
  direct_work_session: "Direct Work",
  staff_briefing: "Staff Briefing",
  staff_supervision_reflection: "Supervision Reflection",
  risk_assessment_update: "Risk Assessment",
  behaviour_pattern_analysis: "Behaviour Analysis",
  incident_summary: "Incident Summary",
  management_oversight: "Management Oversight",
  daily_task_generation: "Daily Tasks",
  form_prompt_support: "Form Support",
  policy_search: "Policy Search",
  evidence_search: "Evidence Search",
  quality_assurance_review: "QA Review",
  creative_resource_generation: "Creative Resource",
  email_draft: "Email Draft",
  admin_summary: "Admin Summary",
};

export function CaraAssistantPanel({
  userRole,
  organisationId,
  homeId,
  childId,
  defaultTaskType,
  onResult,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [taskType, setTaskType] = useState<CaraTaskType>(defaultTaskType ?? "form_prompt_support");
  const [isProcessing, setIsProcessing] = useState(false);
  const [safetyBlock, setSafetyBlock] = useState<{ type: string; reason: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);
    setSafetyBlock(null);

    try {
      const response = await fetch("/api/cara/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskType,
          userId: "current-user",
          userRole,
          organisationId,
          homeId,
          childId,
          prompt: userMessage.content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "CARA_ROUTING_BLOCKED" || data.code === "CARA_SAFETY_BLOCK") {
          setSafetyBlock({ type: "blocked", reason: data.error });
        }

        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "system",
          content: data.error || "Request failed",
          error: data.code,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } else {
        const result = data.result as CaraTaskResult;
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.output,
          result,
          routeDecision: data.routeDecision,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        onResult?.(result);
      }
    } catch (err) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "system",
        content: "Network error — could not reach Cara service",
        error: "NETWORK_ERROR",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">A</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Cara Intelligence</h3>
            <p className="text-xs text-muted-foreground">Governed AI • {userRole.replace(/_/g, " ")}</p>
          </div>
        </div>
        <select
          value={taskType}
          onChange={(e) => setTaskType(e.target.value as CaraTaskType)}
          className="text-xs rounded-md border border-border bg-background px-2 py-1"
        >
          {Object.entries(TASK_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-sm">Select a task type and describe what you need.</p>
            <p className="text-xs mt-1">All outputs are governed, audited, and require approval where appropriate.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] space-y-2 ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2"
                : msg.role === "system"
                ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2"
                : "bg-muted rounded-2xl rounded-bl-sm px-4 py-3"
            }`}>
              {msg.role === "system" && (
                <p className="text-xs font-medium text-red-700 dark:text-red-400">{msg.error}</p>
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

              {msg.result && (
                <div className="space-y-2 pt-2">
                  <CaraModelDecisionBadge
                    provider={msg.result.provider}
                    model={msg.result.model}
                    riskLevel={msg.result.riskLevel}
                    approvalStatus={msg.result.approvalStatus}
                    redactionApplied={msg.result.redactionApplied}
                    requiresApproval={msg.result.requiresApproval}
                    generatedAt={msg.result.generatedAt}
                    compact
                  />

                  {msg.result.redactionApplied && msg.result.redactionMap && (
                    <CaraRedactionNotice
                      redactionEntries={msg.result.redactionMap}
                      sensitivityLevel={msg.result.sensitivityLevel}
                      provider={msg.result.provider}
                      compact
                    />
                  )}

                  {msg.result.requiresApproval && (
                    <CaraHumanApprovalBanner
                      approvalId={msg.result.id}
                      taskType={msg.result.taskType}
                      riskLevel={msg.result.riskLevel}
                      status={msg.result.approvalStatus}
                      generatedAt={msg.result.generatedAt}
                    />
                  )}

                  <CaraCostEstimate
                    estimatedCost={msg.result.estimatedCost}
                    provider={msg.result.provider}
                    model={msg.result.model}
                    tokenUsage={msg.result.tokenUsage}
                    compact
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs text-muted-foreground">Processing with governance checks...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Safety block */}
      {safetyBlock && (
        <div className="px-4 pb-2">
          <CaraSafetyWarning
            type="blocked"
            reason={safetyBlock.reason}
            onDismiss={() => setSafetyBlock(null)}
          />
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={`Describe your ${taskType.replace(/_/g, " ")} request...`}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none min-h-[40px] max-h-32"
            rows={1}
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 text-center">
          AI outputs are draft only. Human approval is required before official use.
        </p>
      </form>
    </div>
  );
}
