"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraGuardrailBanner
//
// Displays safeguarding guardrail flags on Cara outputs. Shows a clear
// warning banner when the guardrail scanner detects content that needs
// human review — especially safeguarding themes, diagnostic language,
// inappropriate conclusions, or risk indicators.
//
// Cara suggests. Humans decide. Cara evidences.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface GuardrailFlag {
  id: string;
  severity: "critical" | "warning" | "info";
  category: string;
  message: string;
  matchedSnippet?: string;
}

interface CaraGuardrailBannerProps {
  flagged: boolean;
  mandatoryReview: boolean;
  flags: GuardrailFlag[];
  summary: string;
  className?: string;
}

const SEVERITY_CONFIG = {
  critical: {
    icon: ShieldAlert,
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    badge: "bg-red-100 text-red-700",
    label: "Critical",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    badge: "bg-amber-100 text-amber-700",
    label: "Warning",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    badge: "bg-blue-100 text-blue-700",
    label: "Info",
  },
};

export function CaraGuardrailBanner({
  flagged,
  mandatoryReview,
  flags,
  summary,
  className,
}: CaraGuardrailBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!flagged || flags.length === 0) return null;

  // Use the highest severity for the banner
  const highestSeverity = flags[0]?.severity ?? "info";
  const config = SEVERITY_CONFIG[highestSeverity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border",
        config.bg,
        config.border,
        className,
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-2 p-3 text-left"
      >
        <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.text)} />
        <div className="min-w-0 flex-1">
          <div className={cn("text-xs font-semibold", config.text)}>
            {mandatoryReview
              ? "Mandatory human review required"
              : "Safeguarding flags detected"}
          </div>
          <p className={cn("text-[10px] mt-0.5", config.text, "opacity-80")}>
            {summary}
          </p>
        </div>
        <div className="shrink-0 mt-0.5">
          {expanded ? (
            <ChevronUp className={cn("h-3.5 w-3.5", config.text)} />
          ) : (
            <ChevronDown className={cn("h-3.5 w-3.5", config.text)} />
          )}
        </div>
      </button>

      {/* Expanded flag list */}
      {expanded && (
        <div className="border-t border-current/10 px-3 pb-3 space-y-2">
          {flags.map((flag) => {
            const flagConfig = SEVERITY_CONFIG[flag.severity];
            const FlagIcon = flagConfig.icon;

            return (
              <div key={flag.id} className="flex gap-2 pt-2">
                <FlagIcon
                  className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", flagConfig.text)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                        flagConfig.badge,
                      )}
                    >
                      {flagConfig.label}
                    </span>
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-600">
                      {flag.category}
                    </span>
                  </div>
                  <p className={cn("text-[10px] mt-0.5", config.text)}>
                    {flag.message}
                  </p>
                  {flag.matchedSnippet && (
                    <div className="mt-1 rounded bg-white/60 px-2 py-1 text-[10px] text-gray-600 font-mono">
                      {flag.matchedSnippet}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
