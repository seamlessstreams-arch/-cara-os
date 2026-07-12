// ══════════════════════════════════════════════════════════════════════════════
// CARA — RISK BADGE
// Circular dot + text label. Accessible — never colour-only meaning.
// Large touch target (min 44px when interactive).
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React from "react";
import { cn } from "@/lib/utils";

type RiskLevel = "low" | "medium" | "high" | "critical" | "none";

interface RiskBadgeProps {
  level: RiskLevel;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const RISK_CONFIG: Record<
  RiskLevel,
  {
    label: string;
    dot: string;
    text: string;
    bg: string;
    border: string;
    pulse?: boolean;
  }
> = {
  // Token-driven (never raw Tailwind colour scales): the --cs-* semantic
  // families carry light AND dark values, so the badge stays readable on every
  // surface without leaning on the .cara-dark hardcoded-utility shim.
  low: {
    label: "Low Risk",
    dot: "bg-[var(--cs-success)]",
    text: "text-[var(--cs-success)]",
    bg: "bg-[var(--cs-success-bg)]",
    border: "border-[var(--cs-success-soft)]",
  },
  medium: {
    label: "Medium Risk",
    dot: "bg-[var(--cs-warning)]",
    text: "text-[var(--cs-warning)]",
    bg: "bg-[var(--cs-warning-bg)]",
    border: "border-[var(--cs-warning-soft)]",
  },
  high: {
    label: "High Risk",
    dot: "bg-[var(--cs-risk)]",
    text: "text-[var(--cs-risk)]",
    bg: "bg-[var(--cs-risk-bg)]",
    border: "border-[var(--cs-risk-soft)]",
  },
  critical: {
    label: "Critical Risk",
    dot: "bg-[var(--cs-risk)]",
    text: "text-[var(--cs-risk)]",
    bg: "bg-[var(--cs-risk-bg)]",
    border: "border-[var(--cs-risk-soft)]",
    pulse: true,
  },
  none: {
    label: "No Risk",
    dot: "bg-[var(--cs-text-muted)]",
    text: "text-[var(--cs-text-muted)]",
    bg: "bg-[var(--cs-surface)]",
    border: "border-[var(--cs-border)]",
  },
};

export function RiskBadge({
  level,
  showLabel = true,
  size = "md",
  className,
}: RiskBadgeProps) {
  const config = RISK_CONFIG[level];

  const dotSizes = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  };

  const textSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  const paddingSizes = {
    sm: "px-2 py-0.5",
    md: "px-2.5 py-1",
    lg: "px-3 py-1.5 min-h-[44px]",
  };

  return (
    <span
      role="status"
      aria-label={config.label}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-medium transition-colors",
        config.bg,
        config.border,
        config.text,
        paddingSizes[size],
        textSizes[size],
        className,
      )}
    >
      <span
        className={cn(
          "shrink-0 rounded-full",
          dotSizes[size],
          config.dot,
          config.pulse && "animate-pulse",
        )}
        aria-hidden="true"
      />
      {showLabel && config.label}
    </span>
  );
}
