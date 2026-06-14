// ══════════════════════════════════════════════════════════════════════════════
// CaraSafetyWarning — Displays safety blocks or route restrictions
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import type { CaraDataSensitivity, CaraRiskLevel } from "@/lib/cara/core/types";

interface Props {
  type: "blocked" | "restricted" | "escalated" | "sensitivity_exceeded";
  reason: string;
  riskLevel?: CaraRiskLevel;
  sensitivityLevel?: CaraDataSensitivity;
  blockedProvider?: string;
  allowedProviders?: string[];
  onDismiss?: () => void;
  onEscalate?: () => void;
}

const TYPE_STYLES = {
  blocked: {
    border: "border-red-300 dark:border-red-800",
    bg: "bg-red-50 dark:bg-red-900/20",
    icon: "text-red-600",
    title: "Request Blocked",
    titleColour: "text-red-800 dark:text-red-300",
  },
  restricted: {
    border: "border-orange-300 dark:border-orange-800",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    icon: "text-orange-600",
    title: "Provider Restricted",
    titleColour: "text-orange-800 dark:text-orange-300",
  },
  escalated: {
    border: "border-amber-300 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    icon: "text-amber-600",
    title: "Escalated to Senior Staff",
    titleColour: "text-amber-800 dark:text-amber-300",
  },
  sensitivity_exceeded: {
    border: "border-violet-300 dark:border-violet-800",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    icon: "text-violet-600",
    title: "Data Sensitivity Limit Exceeded",
    titleColour: "text-violet-800 dark:text-violet-300",
  },
};

export function CaraSafetyWarning({
  type,
  reason,
  riskLevel,
  sensitivityLevel,
  blockedProvider,
  allowedProviders,
  onDismiss,
  onEscalate,
}: Props) {
  const style = TYPE_STYLES[type];

  return (
    <div className={`rounded-lg border ${style.border} ${style.bg} p-4 space-y-3`}>
      <div className="flex items-start gap-3">
        <svg className={`w-5 h-5 ${style.icon} shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${style.titleColour}`}>{style.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{reason}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {(riskLevel || sensitivityLevel || blockedProvider) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {riskLevel && (
            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-muted-foreground">
              Risk: {riskLevel}
            </span>
          )}
          {sensitivityLevel && (
            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-muted-foreground">
              Sensitivity: {sensitivityLevel.replace(/_/g, " ")}
            </span>
          )}
          {blockedProvider && (
            <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
              Blocked: {blockedProvider}
            </span>
          )}
        </div>
      )}

      {allowedProviders && allowedProviders.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Allowed providers: </span>
          {allowedProviders.join(", ")}
        </div>
      )}

      {onEscalate && type !== "blocked" && (
        <button
          onClick={onEscalate}
          className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline"
        >
          Escalate to manager for override
        </button>
      )}
    </div>
  );
}
