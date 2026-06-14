"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Lightbulb, Sparkles, ChevronDown, ChevronUp,
  BookOpen, Shield, X,
} from "lucide-react";

interface GuidanceNoteProps {
  title: string;
  description: string;
  evidenceTip?: string;
  caraTip?: string;
  regulationRef?: string;
  dismissible?: boolean;
  variant?: "default" | "cara" | "compliance" | "safeguarding";
  className?: string;
}

const VARIANT_STYLES = {
  default: {
    bg: "bg-[var(--cs-surface)]",
    border: "border-[var(--cs-border)]",
    icon: Lightbulb,
    iconColor: "text-[var(--cs-info)]",
  },
  cara: {
    bg: "bg-[var(--cs-cara-gold-bg)]",
    border: "border-[var(--cs-cara-gold-soft)]",
    icon: Sparkles,
    iconColor: "text-[var(--cs-cara-gold)]",
  },
  compliance: {
    bg: "bg-blue-50/60",
    border: "border-blue-200/60",
    icon: BookOpen,
    iconColor: "text-blue-600",
  },
  safeguarding: {
    bg: "bg-red-50/60",
    border: "border-red-200/60",
    icon: Shield,
    iconColor: "text-[var(--cs-risk)]",
  },
};

export function GuidanceNote({
  title,
  description,
  evidenceTip,
  caraTip,
  regulationRef,
  dismissible = true,
  variant = "default",
  className,
}: GuidanceNoteProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const v = VARIANT_STYLES[variant];
  const Icon = v.icon;
  const hasMore = !!(evidenceTip || caraTip || regulationRef);

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all duration-200",
        v.bg, v.border,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 shrink-0", v.iconColor)}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-[var(--cs-navy)] leading-tight">
                {title}
              </h4>
              <p className="mt-1 text-[13px] text-[var(--cs-text-secondary)] leading-relaxed">
                {description}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {hasMore && (
                <button
                  onClick={() => setExpanded((p) => !p)}
                  className="rounded-lg p-1 text-[var(--cs-text-muted)] hover:bg-white/60 hover:text-[var(--cs-text-secondary)] transition-colors"
                  title={expanded ? "Show less" : "Show more"}
                >
                  {expanded
                    ? <ChevronUp className="h-3.5 w-3.5" />
                    : <ChevronDown className="h-3.5 w-3.5" />
                  }
                </button>
              )}
              {dismissible && (
                <button
                  onClick={() => setDismissed(true)}
                  className="rounded-lg p-1 text-[var(--cs-text-muted)] hover:bg-white/60 hover:text-[var(--cs-text-secondary)] transition-colors"
                  title="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {expanded && hasMore && (
            <div className="mt-3 space-y-2 border-t border-[var(--cs-border-subtle)] pt-3">
              {evidenceTip && (
                <div className="flex items-start gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-[var(--cs-info)] mt-0.5 shrink-0" />
                  <p className="text-xs text-[var(--cs-text-muted)] leading-relaxed">
                    <span className="font-medium text-[var(--cs-text-secondary)]">Evidence tip:</span>{" "}
                    {evidenceTip}
                  </p>
                </div>
              )}
              {caraTip && (
                <div className="flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--cs-cara-gold)] mt-0.5 shrink-0" />
                  <p className="text-xs text-[var(--cs-text-muted)] leading-relaxed">
                    <span className="font-medium text-[var(--cs-cara-gold)]">Cara can help:</span>{" "}
                    {caraTip}
                  </p>
                </div>
              )}
              {regulationRef && (
                <div className="flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 text-[var(--cs-oversight)] mt-0.5 shrink-0" />
                  <p className="text-xs text-[var(--cs-text-muted)] leading-relaxed">
                    <span className="font-medium text-[var(--cs-text-secondary)]">Regulation:</span>{" "}
                    {regulationRef}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
