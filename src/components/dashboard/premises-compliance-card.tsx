"use client";

import { formatRate } from "@/lib/metrics/rate";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { PremisesComplianceResult } from "@/lib/engines/premises-compliance-engine";

function usePremisesCompliance() {
  return useQuery<PremisesComplianceResult>({
    queryKey: ["premises-compliance"],
    queryFn: async () => {
      const res = await fetch("/api/v1/premises-compliance");
      if (!res.ok) throw new Error("Failed to fetch premises compliance");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 120_000,
  });
}

/**
 * Command Centre entry card for Premises & Safety Compliance.
 * Live — "are all statutory building-safety checks & certificates in date?".
 * Red when anything is overdue or failed, amber when work is due soon.
 */
export function PremisesComplianceCard() {
  const { data } = usePremisesCompliance();
  const s = data?.summary;
  const breaches = (s?.overdue ?? 0) + (s?.action ?? 0);
  const tone = breaches > 0 ? "red" : (s?.due_soon ?? 0) > 0 ? "amber" : "teal";

  const ring = tone === "red" ? "border-red-300" : tone === "amber" ? "border-amber-300" : "border-[var(--cs-teal)]";
  const grad = tone === "red" ? "from-red-50 to-white hover:from-red-100"
    : tone === "amber" ? "from-amber-50 to-white hover:from-amber-100"
    : "from-[var(--cs-teal-bg)] to-white hover:from-[var(--cs-teal-bg)]";
  const iconBg = tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-500" : "bg-[var(--cs-teal-strong)]";

  return (
    <Card className={cn("overflow-hidden border-2", ring)}>
      <CardContent className="p-0">
        <Link href="/premises-compliance" className={cn("group flex items-center gap-4 bg-gradient-to-r p-4 transition-colors", grad)}>
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm", iconBg)}>
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Premises Compliance</span>
              <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                Certs in date?
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              {s
                ? `${breaches > 0 ? `${breaches} overdue/failed safety check${breaches === 1 ? "" : "s"}` : "All recorded checks in date"}${s.compliance_rate != null ? ` — ${formatRate(s.compliance_rate)} current` : ""}.`
                : "Are all statutory building-safety checks and certificates in date?"}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600" />
        </Link>
      </CardContent>
    </Card>
  );
}
