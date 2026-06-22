"use client";

import React from "react";
import { useEmotionalSafety } from "@/hooks/use-emotional-safety";
import { cn } from "@/lib/utils";
import { HeartPulse, Zap, ShieldCheck, ChevronDown } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  secure: "bg-emerald-100 text-emerald-800 border-emerald-200",
  watch: "bg-amber-100 text-amber-800 border-amber-200",
  concern: "bg-red-100 text-red-800 border-red-200",
};
const STATUS_LABEL: Record<string, string> = { secure: "Settled", watch: "Watch", concern: "Needs support" };

/**
 * Point-of-work panel: when a worker opens the incident form for a child, this
 * surfaces — calmly, before they write a word — what we already know triggers
 * this child and what helps them regulate. Intelligence at the moment of
 * recording. It informs practice; it never decides. Renders nothing until a
 * child is selected and there is something useful to show.
 */
export function InlineEmotionalSafetyPanel({
  childId,
  className,
}: {
  childId: string | undefined;
  className?: string;
}) {
  const { data: a, isLoading } = useEmotionalSafety(childId);
  const [open, setOpen] = React.useState(true);

  if (!childId || isLoading || !a) return null;
  // Nothing useful to show yet — stay out of the way.
  if (a.triggers.length === 0 && a.whatHelps.length === 0) return null;

  const badge = STATUS_BADGE[a.status] ?? STATUS_BADGE.watch;

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-cara-gold-soft,#fffbeb)]/60 p-3",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-[var(--cs-navy,#1e293b)]">
          <HeartPulse className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" />
          Emotional safety — what helps {a.childName}
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", badge)}>
            {STATUS_LABEL[a.status]}
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 text-[var(--cs-text-muted,#64748b)] transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
              <Zap className="h-3 w-3" /> Triggers to be mindful of
            </div>
            <div className="flex flex-wrap gap-1">
              {a.triggers.slice(0, 4).map((t) => (
                <span key={t.label} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                  {t.label}
                </span>
              ))}
              {a.triggers.length === 0 && <span className="text-xs text-[var(--cs-text-muted,#64748b)]">None recorded.</span>}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
              <ShieldCheck className="h-3 w-3" /> What helps them regulate
            </div>
            <div className="flex flex-wrap gap-1">
              {a.whatHelps.slice(0, 4).map((h) => (
                <span key={h.label} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
                  {h.label}
                </span>
              ))}
              {a.whatHelps.length === 0 && (
                <span className="text-xs text-[var(--cs-text-muted,#64748b)]">Note what helps after this episode.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
