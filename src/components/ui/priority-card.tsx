// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PRIORITY CARD
// Used in "What Needs Attention" zone of the Command Centre.
// Each card is a self-contained call to action.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export type PriorityLevel = "critical" | "high" | "medium" | "low" | "info";

const PRIORITY_STYLES: Record<PriorityLevel, {
  border:   string;
  bg:       string;
  dot:      string;
  countBg:  string;
  countText:string;
  label:    string;
}> = {
  critical: {
    border:    "border-rose-200",
    bg:        "bg-rose-50",
    dot:       "bg-rose-500",
    countBg:   "bg-rose-100",
    countText: "text-rose-800",
    label:     "Critical",
  },
  high: {
    border:    "border-red-200",
    bg:        "bg-red-50",
    dot:       "bg-red-500",
    countBg:   "bg-red-100",
    countText: "text-red-800",
    label:     "High",
  },
  medium: {
    border:    "border-amber-200",
    bg:        "bg-amber-50",
    dot:       "bg-amber-400",
    countBg:   "bg-amber-100",
    countText: "text-amber-800",
    label:     "Medium",
  },
  low: {
    border:    "border-emerald-200",
    bg:        "bg-emerald-50",
    dot:       "bg-emerald-400",
    countBg:   "bg-emerald-100",
    countText: "text-emerald-800",
    label:     "Low",
  },
  info: {
    border:    "border-blue-200",
    bg:        "bg-blue-50",
    dot:       "bg-blue-400",
    countBg:   "bg-blue-100",
    countText: "text-blue-800",
    label:     "Info",
  },
};

interface PriorityCardProps {
  title:        string;
  count:        number;
  description:  string;
  priority:     PriorityLevel;
  actionLabel?: string;
  href:         string;
  icon?:        React.ElementType;
  className?:   string;
}

export function PriorityCard({
  title,
  count,
  description,
  priority,
  actionLabel = "Review now",
  href,
  icon: Icon,
  className,
}: PriorityCardProps) {
  const s = PRIORITY_STYLES[priority];

  if (count === 0) return null;

  return (
    <div className={cn(
      "group relative flex items-start gap-4 rounded-2xl border p-4 transition-all hover:shadow-sm",
      s.border,
      s.bg,
      className,
    )}>
      {/* Left: icon or dot */}
      <div className="shrink-0 mt-0.5">
        {Icon ? (
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", s.countBg)}>
            <Icon className={cn("h-4 w-4", s.countText)} />
          </div>
        ) : (
          <span className={cn("mt-1.5 block h-2.5 w-2.5 rounded-full", s.dot)} />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <span className={cn(
            "inline-flex h-6 min-w-6 items-center justify-center rounded-lg text-sm font-bold px-1.5",
            s.countBg, s.countText,
          )}>
            {count}
          </span>
          <p className="text-[13px] font-semibold text-slate-800 leading-tight">{title}</p>
        </div>
        <p className="text-[12px] text-slate-600 leading-relaxed">{description}</p>
      </div>

      {/* Action */}
      <Link
        href={href}
        className={cn(
          "shrink-0 flex items-center gap-1 text-[12px] font-medium transition-all mt-0.5 whitespace-nowrap",
          s.countText,
          "opacity-70 group-hover:opacity-100",
        )}
      >
        {actionLabel}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
