"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUTOMATED EVIDENCE BANK CARD
// Coverage across the 14 Ofsted evidence categories, built automatically from the
// event stream. Powered by the Evidence Bank engine (Reg 44/45).
// ══════════════════════════════════════════════════════════════════════════════

import { formatRate } from "@/lib/metrics/rate";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, ChevronRight, Loader2, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/hooks/use-api";
import type { EvidenceBankResult } from "@/lib/evidence-bank/evidence-bank-engine";

const STATUS_STYLES: Record<string, { dot: string; text: string }> = {
  well_evidenced: { dot: "bg-green-500", text: "text-green-700" },
  thin: { dot: "bg-amber-500", text: "text-amber-700" },
  gap: { dot: "bg-red-500", text: "text-red-700" },
};
const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]", warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]", positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

interface EvidenceBankResponse {
  data: EvidenceBankResult;
}

export function EvidenceBankCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["evidence-bank"],
    queryFn: () => apiFetch<EvidenceBankResponse>("/evidence-bank"),
    refetchInterval: 60_000,
  });
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Archive className="h-4 w-4 text-brand" /> Evidence Bank</CardTitle></CardHeader>
        <CardContent><div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" /></div></CardContent>
      </Card>
    );
  }

  const o = intel.overview;
  const categories = intel.categories ?? [];
  const insights = intel.insights ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Archive className="h-4 w-4 text-brand" /> Evidence Bank</CardTitle>
          <Link href="/evidence-bank" className="text-xs text-brand hover:underline flex items-center gap-1">View All <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", o.coverage_rate >= 80 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", o.coverage_rate >= 80 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(o.coverage_rate)}</p><p className="text-[10px] text-muted-foreground">Coverage</p></div>
          <div className="text-center rounded-lg bg-green-50 p-2.5"><p className="text-lg font-bold tabular-nums text-green-600">{o.well_evidenced}</p><p className="text-[10px] text-muted-foreground">Strong</p></div>
          <div className="text-center rounded-lg bg-amber-50 p-2.5"><p className="text-lg font-bold tabular-nums text-amber-600">{o.thin}</p><p className="text-[10px] text-muted-foreground">Thin</p></div>
          <div className={cn("text-center rounded-lg p-2.5", o.gaps > 0 ? "bg-red-50" : "bg-green-50")}><p className={cn("text-lg font-bold tabular-nums", o.gaps > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{o.gaps}</p><p className="text-[10px] text-muted-foreground">Gaps</p></div>
        </div>

        {/* Category coverage grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {categories.map((c) => {
            const s = STATUS_STYLES[c.status] ?? STATUS_STYLES.gap;
            return (
              <div key={c.category} className="flex items-center gap-1.5 text-[11px]">
                <span className={cn("h-2 w-2 rounded-full shrink-0", s.dot)} />
                <span className="truncate text-[var(--cs-text-secondary)]">{c.category}</span>
                <span className="ml-auto tabular-nums text-muted-foreground">{c.count_90d}</span>
              </div>
            );
          })}
        </div>

        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" /> Cara Evidence Intelligence</p>
            {insights.slice(0, 2).map((i, idx) => (
              <div key={idx} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[i.severity] ?? INSIGHT_STYLES.positive)}>{i.text}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
