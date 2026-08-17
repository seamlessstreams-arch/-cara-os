// ══════════════════════════════════════════════════════════════════════════════
// CARA — EMPTY STATE
// Helpful, action-oriented empty states. Never a blank white box.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertTriangle } from "lucide-react";

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
  /** Optional — a one-line empty state carries its message in the title. */
  description?: string;
  actions?:     EmptyStateAction[];
  caraPrompt?:  string;   // if set, adds an "Ask Cara" button
  onAskCara?:   (prompt: string) => void;
  className?:   string;
  compact?:     boolean;  // smaller padding for inline use

  // ── A failed read is not an empty collection ──────────────────────────────
  //
  // `rows = data?.data ?? []` turns a failed query into an empty array, and an
  // empty array into "No welfare checks recorded yet" — a positive claim that
  // nothing was recorded, made without ever having successfully looked. That
  // is the fabricate-on-empty prohibition applied to ABSENCE, and on a Reg 34
  // page it is the difference between "we checked and found none" and "we do
  // not know".
  //
  // Pass the query's error here and this component says what actually
  // happened instead. The caller's own actions are deliberately suppressed —
  // "Start first check" is the wrong offer when the state is unknown.
  /** Truthy when the read FAILED. Usually a query's `isError` or `error`. */
  error?:       unknown;
  /** Called by "Try again". Usually the query's `refetch`. */
  onRetry?:     () => void;
  /** What could not be loaded, lower case: "welfare checks", "incidents". */
  noun?:        string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions = [],
  caraPrompt,
  onAskCara,
  className,
  compact = false,
  error,
  onRetry,
  noun,
}: EmptyStateProps) {
  // The error case replaces the message wholesale rather than decorating it.
  // Half of "no records yet — and something went wrong" still reads as none.
  const failed = !!error;
  const HeadIcon = failed ? AlertTriangle : Icon;
  const headline = failed
    ? (noun ? `${noun[0].toUpperCase()}${noun.slice(1)} could not be loaded` : "This could not be loaded")
    : title;
  const body = failed
    ? "That is not the same as having none — Cara could not reach the store, so it cannot say what is in " +
      "it. Nothing has been lost. " +
      // Only tell someone to retry when there is a control to do it with.
      (onRetry
        ? "Try again, and if it keeps failing the store needs looking at."
        : "Reload the page, and if it keeps failing the store needs looking at.")
    : description;
  const shownActions: EmptyStateAction[] = failed
    ? (onRetry ? [{ label: "Try again", onClick: onRetry, variant: "outline" }] : [])
    : actions;
  const shownCaraPrompt = failed ? undefined : caraPrompt;

  return (
    <div
      className={cn(
        // Token surface (not bg-white) so the shared empty state renders
        // correctly on the dark skin without the hardcoded-utility shim.
        "flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-[var(--cs-border)] bg-[var(--cs-surface-elevated)]",
        compact ? "px-6 py-10" : "px-8 py-16",
        className,
      )}
    >
      {HeadIcon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--cs-surface)] mb-4">
          <HeadIcon className="h-7 w-7 text-[var(--cs-text-gentle)]" />
        </div>
      )}

      <h3 className="text-[15px] font-semibold text-[var(--cs-navy)] mb-1">{headline}</h3>
      {body && (
        <p className="text-sm text-[var(--cs-text-muted)] max-w-sm leading-relaxed mb-6">{body}</p>
      )}

      {(shownActions.length > 0 || shownCaraPrompt) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {shownActions.map((action, i) => {
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

          {shownCaraPrompt && onAskCara && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              onClick={() => onAskCara(shownCaraPrompt)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Ask Cara
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
