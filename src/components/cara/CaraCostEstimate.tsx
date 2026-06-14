// ══════════════════════════════════════════════════════════════════════════════
// CaraCostEstimate — Displays cost information for AI operations
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import type { CaraProviderName } from "@/lib/cara/core/types";

interface Props {
  estimatedCost: number;
  actualCost?: number;
  provider: CaraProviderName;
  model: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  dailyUsed?: number;
  dailyLimit?: number;
  monthlyUsed?: number;
  monthlyLimit?: number;
  compact?: boolean;
}

export function CaraCostEstimate({
  estimatedCost,
  actualCost,
  provider,
  model,
  tokenUsage,
  dailyUsed,
  dailyLimit,
  monthlyUsed,
  monthlyLimit,
  compact = false,
}: Props) {
  const cost = actualCost ?? estimatedCost;
  const isOverBudget = dailyLimit ? (dailyUsed ?? 0) + cost > dailyLimit : false;

  const formatCost = (value: number) => {
    if (value < 0.01) return `£${(value * 100).toFixed(2)}p`;
    return `£${value.toFixed(4)}`;
  };

  const formatTokens = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {formatCost(cost)}
        {tokenUsage && <span>({formatTokens(tokenUsage.totalTokens)} tokens)</span>}
      </span>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Cost Breakdown</span>
        <span className={`text-sm font-semibold ${isOverBudget ? "text-red-600" : "text-foreground"}`}>
          {formatCost(cost)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div>
          <span className="font-medium">Provider:</span> {provider}
        </div>
        <div>
          <span className="font-medium">Model:</span> {model}
        </div>
        {tokenUsage && (
          <>
            <div>
              <span className="font-medium">Input:</span> {formatTokens(tokenUsage.promptTokens)} tokens
            </div>
            <div>
              <span className="font-medium">Output:</span> {formatTokens(tokenUsage.completionTokens)} tokens
            </div>
          </>
        )}
      </div>

      {(dailyLimit || monthlyLimit) && (
        <div className="space-y-1.5 pt-2 border-t border-border">
          {dailyLimit && dailyUsed !== undefined && (
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-0.5">
                <span>Daily budget</span>
                <span>{formatCost(dailyUsed)} / {formatCost(dailyLimit)}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    dailyUsed / dailyLimit > 0.9 ? "bg-red-500" :
                    dailyUsed / dailyLimit > 0.7 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, (dailyUsed / dailyLimit) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {monthlyLimit && monthlyUsed !== undefined && (
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-0.5">
                <span>Monthly budget</span>
                <span>{formatCost(monthlyUsed)} / {formatCost(monthlyLimit)}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    monthlyUsed / monthlyLimit > 0.9 ? "bg-red-500" :
                    monthlyUsed / monthlyLimit > 0.7 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, (monthlyUsed / monthlyLimit) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {isOverBudget && (
        <p className="text-xs text-red-600 font-medium">
          This request would exceed your daily cost limit. Contact your manager for approval.
        </p>
      )}
    </div>
  );
}
