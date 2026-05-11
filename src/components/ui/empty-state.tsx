// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EMPTY STATE
// Helpful, action-oriented empty states. Never a blank white box.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export interface EmptyStateAction {
  label:   string;
  href?:   string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost";
  icon?:   React.ElementType;
}

interface EmptyStateProps {
  icon?:        React.ElementType;
  title:        string;
  description:  string;
  actions?:     EmptyStateAction[];
  ariaPrompt?:  string;   // if set, adds an "Ask ARIA" button
  onAskAria?:   (prompt: string) => void;
  className?:   string;
  compact?:     boolean;  // smaller padding for inline use
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions = [],
  ariaPrompt,
  onAskAria,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-[var(--cs-border)] bg-white",
        compact ? "px-6 py-10" : "px-8 py-16",
        className,
      )}
    >
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--cs-surface)] mb-4">
          <Icon className="h-7 w-7 text-[var(--cs-text-gentle)]" />
        </div>
      )}

      <h3 className="text-[15px] font-semibold text-[var(--cs-navy)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--cs-text-muted)] max-w-sm leading-relaxed mb-6">{description}</p>

      {(actions.length > 0 || ariaPrompt) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {actions.map((action, i) => {
            const ActionIcon = action.icon;
            const inner = (
              <>
                {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
                {action.label}
              </>
            );

            if (action.href) {
              return (
                <Button
                  key={i}
                  variant={action.variant ?? (i === 0 ? "default" : "outline")}
                  size="sm"
                  asChild
                >
                  <Link href={action.href} className="gap-1.5">{inner}</Link>
                </Button>
              );
            }
            return (
              <Button
                key={i}
                variant={action.variant ?? (i === 0 ? "default" : "outline")}
                size="sm"
                className="gap-1.5"
                onClick={action.onClick}
              >
                {inner}
              </Button>
            );
          })}

          {ariaPrompt && onAskAria && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              onClick={() => onAskAria(ariaPrompt)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Ask ARIA
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
