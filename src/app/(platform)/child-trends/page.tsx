"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw, UserSquare2 } from "lucide-react";
import { useChildTrends } from "@/hooks/use-child-trends";
import { TrendView } from "@/components/trends/trend-view";

export default function ChildTrendsPage() {
  const [childId, setChildId] = useState<string | null>(null);
  const { data, isLoading, isFetching, refetch } = useChildTrends(childId);
  const children = data?.children ?? [];
  const trends = data?.trends ?? null;

  // Auto-select the first child once the list loads, for an immediate view.
  useEffect(() => {
    if (!childId && children.length > 0) setChildId(children[0].id);
  }, [childId, children]);

  return (
    <PageShell
      title="Child Trends"
      subtitle="Per-child direction of travel — is our intervention working? The drill-down from Home Trends."
      ariaContext={{ pageTitle: "Child Trends", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 print:hidden"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh
          </button>
          <PrintButton title={`Child Trends${data?.childName ? ` — ${data.childName}` : ""}`} />
        </div>
      }
    >
      <div className="cs-print-color mx-auto max-w-5xl space-y-5">
        {/* Child selector */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <span className="text-xs font-medium text-slate-500">Child:</span>
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setChildId(c.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                childId === c.id ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              <UserSquare2 className="h-3.5 w-3.5" /> {c.name}
            </button>
          ))}
          {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && !trends && (
          <div className="rounded-lg border bg-white px-4 py-10 text-center text-sm text-slate-500">
            Select a child to see their direction of travel.
          </div>
        )}

        {!isLoading && trends && (
          <>
            <TrendView data={trends} subtitle={data?.childName ?? undefined} />
            <p className="text-center text-[11px] text-slate-400">
              Per-child trends bucket this child&rsquo;s dated records into weekly windows. Quieter children may show
              &ldquo;no trend yet&rdquo; — too few events to read a direction, which is itself reassuring.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
