"use client";

import React from "react";
import { useRelationalTimeline } from "@/hooks/use-relational-timeline";
import { cn } from "@/lib/utils";
import { Link2, ShieldCheck, ChevronDown, TrendingUp, TrendingDown, Minus, Lightbulb } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  secure: "bg-emerald-100 text-emerald-800 border-emerald-200",
  developing: "bg-amber-100 text-amber-800 border-amber-200",
  fragile: "bg-red-100 text-red-800 border-red-200",
};
const STATUS_LABEL: Record<string, string> = { secure: "Secure", developing: "Developing", fragile: "Fragile" };
const TREND_COLOR: Record<string, string> = { improving: "text-emerald-600", stable: "text-slate-500", declining: "text-red-600" };

/**
 * Point-of-work panel: when a worker records a daily log for a child, this
 * surfaces — calmly — who the child trusts, how their relationships are
 * trending, and any repair gap to close. Relationships are the intervention;
 * this keeps them in view as the day is recorded. Informs practice; never
 * decides. Renders nothing until there's something useful to show.
 */
export function InlineRelationalPanel({
  childId,
  className,
}: {
  childId: string | undefined;
  className?: string;
}) {
  const { data: t, isLoading } = useRelationalTimeline(childId);
  const [open, setOpen] = React.useState(true);

  if (!childId || isLoading || !t) return null;
  if (t.moments.length === 0) return null;

  const badge = STATUS_BADGE[t.stability.status] ?? STATUS_BADGE.developing;
  const TrendIcon = t.trend.direction === "improving" ? TrendingUp : t.trend.direction === "declining" ? TrendingDown : Minus;
  // Surface the single most useful insight — prefer a gap to close.
  const headlineInsight = t.insights.find((i) => i.tone === "gap") ?? t.insights.find((i) => i.tone === "positive");

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
        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--cs-navy,#1e293b)]">
          <Link2 className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" />
          Relationships — {t.childName}
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", badge)}>
            {STATUS_LABEL[t.stability.status]}
          </span>
          <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-semibold", TREND_COLOR[t.trend.direction])}>
            <TrendIcon className="h-3 w-3" /> {t.trend.direction}
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 text-[var(--cs-text-muted,#64748b)] transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {t.stability.trustedAdults.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[var(--cs-text-muted,#64748b)]">Trusted adults:</span>
              <span className="font-medium text-[var(--cs-navy,#1e293b)]">{t.stability.trustedAdults.join(", ")}</span>
            </div>
          )}
          {t.stability.keyConnectors[0] && t.stability.keyConnectors[0].connections >= 2 && (
            <div className="text-sm text-[var(--cs-text-secondary,#475569)]">
              Strongest connection: <span className="font-medium text-[var(--cs-navy,#1e293b)]">{t.stability.keyConnectors[0].name}</span>
            </div>
          )}
          {headlineInsight && (
            <div
              className={cn(
                "flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-sm",
                headlineInsight.tone === "gap" ? "border-rose-100 bg-rose-50 text-rose-700" : "border-emerald-100 bg-emerald-50 text-emerald-700",
              )}
            >
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{headlineInsight.text}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
