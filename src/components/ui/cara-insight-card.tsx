"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowRight, AlertTriangle, TrendingUp, Lightbulb, Shield } from "lucide-react";

type InsightSeverity = "info" | "suggestion" | "warning" | "critical";

interface CaraInsightCardProps {
  title: string;
  summary: string;
  severity?: InsightSeverity;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const SEVERITY_CONFIG: Record<
  InsightSeverity,
  { icon: React.ElementType; accent: string; border: string; bg: string }
> = {
  info: {
    icon: Lightbulb,
    accent: "text-[var(--cs-info)]",
    border: "border-[var(--cs-info)]/20",
    bg: "bg-blue-50/40",
  },
  suggestion: {
    icon: Sparkles,
    accent: "text-[var(--cs-cara-gold)]",
    border: "border-[var(--cs-cara-gold-soft)]",
    bg: "bg-[var(--cs-cara-gold-bg)]",
  },
  warning: {
    icon: TrendingUp,
    accent: "text-[var(--cs-warning)]",
    border: "border-amber-200/60",
    bg: "bg-amber-50/40",
  },
  critical: {
    icon: AlertTriangle,
    accent: "text-[var(--cs-risk)]",
    border: "border-red-200/60",
    bg: "bg-red-50/40",
  },
};

export function CaraInsightCard({
  title,
  summary,
  severity = "suggestion",
  actionLabel,
  actionHref,
  onAction,
  onDismiss,
  className,
}: CaraInsightCardProps) {
  const config = SEVERITY_CONFIG[severity];
  const SeverityIcon = config.icon;

  return (
    <div
      className={cn(
        "group relative rounded-2xl border p-4 transition-all duration-300",
        config.bg, config.border,
        "hover:shadow-[var(--cs-shadow-card)]",
        className,
      )}
    >
      {/* Cara shimmer accent */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 cara-shimmer" />
      </div>

      <div className="relative flex items-start gap-3">
        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
          config.bg,
        )}>
          <SeverityIcon className={cn("h-4 w-4", config.accent)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-3 w-3 text-[var(--cs-cara-gold)]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-cara-gold)]">
              Cara Insight
            </span>
          </div>

          <h4 className="text-sm font-semibold text-[var(--cs-navy)] leading-tight">
            {title}
          </h4>
          <p className="mt-1 text-[13px] text-[var(--cs-text-secondary)] leading-relaxed">
            {summary}
          </p>

          {(actionLabel || onDismiss) && (
            <div className="mt-3 flex items-center gap-3">
              {actionLabel && actionHref && (
                <Link
                  href={actionHref}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
                    "bg-[var(--cs-cara-gold)] text-[var(--cs-navy)] hover:bg-[var(--cs-cara-gold)]/90",
                  )}
                >
                  {actionLabel}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
              {actionLabel && onAction && !actionHref && (
                <button
                  onClick={onAction}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
                    "bg-[var(--cs-cara-gold)] text-[var(--cs-navy)] hover:bg-[var(--cs-cara-gold)]/90",
                  )}
                >
                  {actionLabel}
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-xs text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
