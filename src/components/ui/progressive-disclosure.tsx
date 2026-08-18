// ══════════════════════════════════════════════════════════════════════════════
// CARA — PROGRESSIVE DISCLOSURE SECTION
// Shows title + summary by default, chevron toggle reveals children.
// Smooth animation, optional badge count.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface ProgressiveDisclosureSectionProps {
  title: string;
  summary: string;
  icon?: string;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}

function resolveIcon(name?: string): React.ElementType | null {
  if (!name) return null;
  const icons = LucideIcons as Record<string, unknown>;
  const Icon = icons[name];
  if (typeof Icon === "function") return Icon as React.ElementType;
  return null;
}

export function ProgressiveDisclosureSection({
  title,
  summary,
  icon,
  defaultOpen = false,
  badge,
  children,
  className,
}: ProgressiveDisclosureSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  // Memoised so the same icon name yields the same component reference across
  // renders — resolveIcon returns an existing lucide component, but without
  // the memo the compiler must assume a fresh component per render.
  const Icon = React.useMemo(() => resolveIcon(icon), [icon]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)]",
        "transition-all duration-200",
        open && "shadow-[var(--cs-shadow-soft)]",
        className,
      )}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "w-full flex items-center gap-3 px-5 py-4 text-left transition-colors",
          "hover:bg-[var(--cs-surface)] rounded-2xl",
        )}
      >
        {/* Chevron */}
        <div className="text-[var(--cs-text-muted)] transition-transform duration-200">
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--cs-surface)]">
            {/* createElement for the same reason as CalmEmptyState: an existing
                lucide component behind a lookup the rule cannot analyse. */}
            {React.createElement(Icon, { className: "h-4 w-4 text-[var(--cs-text-secondary)]" })}
          </div>
        )}

        {/* Title + summary */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--cs-navy)] truncate">
              {title}
            </h3>
            {badge && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--cs-surface)] border border-[var(--cs-border)] px-1.5 text-[10px] font-semibold text-[var(--cs-text-muted)]">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--cs-text-muted)] truncate mt-0.5">
            {summary}
          </p>
        </div>
      </button>

      {/* Collapsible content */}
      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-0">
            <div className="border-t border-[var(--cs-border-subtle)] pt-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
