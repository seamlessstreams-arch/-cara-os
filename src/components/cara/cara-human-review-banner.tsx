"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraHumanReviewBanner
//
// A clear, prominent banner that appears on every Cara-generated draft.
// Communicates that the output requires human review before use.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Shield, Sparkles } from "lucide-react";

interface CaraHumanReviewBannerProps {
  /** Confidence level from the Cara output */
  confidence?: "low" | "medium" | "high";
  /** Whether this is a high-risk command (safeguarding, HR, etc.) */
  highRisk?: boolean;
  /** Custom message */
  message?: string;
  className?: string;
}

export function CaraHumanReviewBanner({
  confidence = "medium",
  highRisk = false,
  message,
  className,
}: CaraHumanReviewBannerProps) {
  const defaultMessage = highRisk
    ? "This Cara draft involves sensitive content. It must be reviewed by a qualified professional before any action is taken."
    : "This is an Cara suggested draft. It requires human review and approval before use.";

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 flex items-start gap-3",
        highRisk
          ? "bg-red-50 border-red-200"
          : "bg-amber-50 border-amber-200",
        className,
      )}
    >
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
        highRisk ? "bg-red-100" : "bg-amber-100",
      )}>
        {highRisk ? (
          <Shield className="h-4 w-4 text-red-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-3 w-3 text-[var(--cs-cara-gold)]" />
          <span className={cn(
            "text-xs font-semibold",
            highRisk ? "text-red-800" : "text-amber-800",
          )}>
            Cara suggested draft
          </span>
          <span className={cn(
            "text-[9px] px-1.5 py-0.5 rounded-full font-medium",
            confidence === "low" ? "bg-red-100 text-red-700" :
            confidence === "medium" ? "bg-amber-100 text-amber-700" :
            "bg-green-100 text-green-700",
          )}>
            {confidence} confidence
          </span>
        </div>
        <p className={cn(
          "text-xs leading-relaxed",
          highRisk ? "text-red-700" : "text-amber-700",
        )}>
          {message || defaultMessage}
        </p>
      </div>
    </div>
  );
}
