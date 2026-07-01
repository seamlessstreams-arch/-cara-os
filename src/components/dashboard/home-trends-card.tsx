"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Minus, ArrowRight } from "lucide-react";
import { useHomeTrends } from "@/hooks/use-home-trends";
import { cn } from "@/lib/utils";
import type { HomeTrendsResult } from "@/lib/engines/home-trends-engine";

type Overall = HomeTrendsResult["overview"]["overall_direction"];

const META: Record<Overall, { label: string; Icon: typeof TrendingUp; border: string; grad: string; chip: string }> = {
  improving: { label: "Improving", Icon: TrendingUp, border: "border-[--cs-success-soft]", grad: "from-[--cs-success-bg] to-white hover:from-[--cs-success-soft]", chip: "bg-[--cs-success]" },
  worsening: { label: "Needs attention", Icon: TrendingDown, border: "border-[--cs-risk-soft]", grad: "from-[--cs-risk-bg] to-white hover:from-[--cs-risk-soft]", chip: "bg-[--cs-risk]" },
  mixed: { label: "Mixed picture", Icon: Activity, border: "border-[--cs-warning-soft]", grad: "from-[--cs-warning-bg] to-white hover:from-[--cs-warning-soft]", chip: "bg-[--cs-warning]" },
  stable: { label: "Steady", Icon: Minus, border: "border-slate-300", grad: "from-slate-50 to-white hover:from-slate-100", chip: "bg-slate-500" },
  insufficient_data: { label: "Building history", Icon: Minus, border: "border-slate-300", grad: "from-slate-50 to-white hover:from-slate-100", chip: "bg-slate-400" },
};

/**
 * Command Centre entry card for Home Trends ("direction of travel").
 * Live (cheap single-engine endpoint) — surfaces whether the home's signals are
 * improving or worsening, a view that exists nowhere else on the dashboard.
 */
export function HomeTrendsCard() {
  const { data } = useHomeTrends();
  const ov = data?.overview;
  const m = META[ov?.overall_direction ?? "stable"];

  return (
    <Card className={cn("overflow-hidden border-2", m.border)}>
      <CardContent className="p-0">
        <Link
          href="/home-trends"
          className={cn("group flex items-center gap-4 bg-gradient-to-r p-4 transition-colors", m.grad)}
        >
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm", m.chip)}>
            <m.Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Home Trends</span>
              <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                Direction of travel
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              {ov
                ? `${m.label} — ${ov.improving} improving, ${ov.worsening} worsening over the last 8 weeks.`
                : "Are the home's safety & wellbeing signals improving or worsening? See the 8-week trajectory."}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600" />
        </Link>
      </CardContent>
    </Card>
  );
}
