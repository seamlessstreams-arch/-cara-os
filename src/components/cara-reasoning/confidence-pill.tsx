"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { Confidence } from "@/lib/cara-reasoning/types";

const STYLE: Record<Confidence, { label: string; cls: string }> = {
  high: { label: "High confidence", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  medium: { label: "Medium confidence", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  low: { label: "Low confidence", cls: "bg-slate-50 text-slate-600 border-slate-200" },
};

export function ConfidencePill({ level, short = false }: { level: Confidence; short?: boolean }) {
  const s = STYLE[level];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", s.cls)}>
      {short ? level : s.label}
    </span>
  );
}
