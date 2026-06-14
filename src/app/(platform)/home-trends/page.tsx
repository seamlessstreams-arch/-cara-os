"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw, Users } from "lucide-react";
import { useHomeTrends } from "@/hooks/use-home-trends";
import { TrendView } from "@/components/trends/trend-view";

export default function HomeTrendsPage() {
  const { data, isLoading, isFetching, refetch } = useHomeTrends();

  return (
    <PageShell
      title="Home Trends"
      subtitle="Direction of travel — are the home's key safety & wellbeing signals improving or worsening over the last 8 weeks?"
      caraContext={{ pageTitle: "Home Trends", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/child-trends"
            className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 print:hidden"
          >
            <Users className="h-3.5 w-3.5" /> View by child
          </Link>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 print:hidden"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh
          </button>
          <PrintButton title="Home Trends — Direction of Travel" />
        </div>
      }
    >
      <div className="cs-print-color mx-auto max-w-5xl space-y-5">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && data && (
          <>
            <TrendView data={data} />
            <p className="text-center text-[11px] text-slate-400">
              Trends bucket dated records into weekly windows. Direction compares the most recent 4 weeks with the prior 4
              weeks; a move counts only when it is material in both volume and percentage terms.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
