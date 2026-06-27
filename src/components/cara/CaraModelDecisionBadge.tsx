// ══════════════════════════════════════════════════════════════════════════════
// CaraModelDecisionBadge — Shows which model was used and why
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import type { CaraProviderName, CaraRiskLevel, CaraApprovalStatus } from "@/lib/cara/core/types";

interface Props {
  provider: CaraProviderName;
  model: string;
  riskLevel: CaraRiskLevel;
  approvalStatus: CaraApprovalStatus;
  redactionApplied: boolean;
  requiresApproval: boolean;
  generatedAt: string;
  compact?: boolean;
}

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic Claude",
  bedrock: "AWS Bedrock",
  vertex_ai: "Google Vertex",
  mistral: "Mistral",
  voyage: "Voyage AI",
  cohere: "Cohere",
  perplexity: "Perplexity",
};

const RISK_COLOURS: Record<CaraRiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_LABELS: Record<CaraApprovalStatus, { label: string; colour: string }> = {
  draft_ai_generated: { label: "AI Draft", colour: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  pending_review: { label: "Pending Review", colour: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  approved: { label: "Approved", colour: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  rejected: { label: "Rejected", colour: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  amended_by_human: { label: "Human Amended", colour: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  archived: { label: "Archived", colour: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300" },
};

export function CaraModelDecisionBadge({
  provider,
  model,
  riskLevel,
  approvalStatus,
  redactionApplied,
  requiresApproval,
  generatedAt,
  compact = false,
}: Props) {
  const status = STATUS_LABELS[approvalStatus];

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-medium ${status.colour}`}>
          {status.label}
        </span>
        <span className="text-muted-foreground">
          {PROVIDER_LABELS[provider] ?? provider}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-muted-foreground">AI-Generated Draft</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.colour}`}>
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div>
          <span className="font-medium">Provider:</span>{" "}
          {PROVIDER_LABELS[provider] ?? provider}
        </div>
        <div>
          <span className="font-medium">Model:</span> {model}
        </div>
        <div>
          <span className="font-medium">Risk:</span>{" "}
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${RISK_COLOURS[riskLevel]}`}>
            {riskLevel}
          </span>
        </div>
        <div>
          <span className="font-medium">Generated:</span>{" "}
          {new Date(generatedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
        </div>
      </div>

      {(redactionApplied || requiresApproval) && (
        <div className="flex gap-2 pt-1">
          {redactionApplied && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 text-xs font-medium">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Redacted
            </span>
          )}
          {requiresApproval && approvalStatus !== "approved" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs font-medium">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Approval Required
            </span>
          )}
        </div>
      )}
    </div>
  );
}
