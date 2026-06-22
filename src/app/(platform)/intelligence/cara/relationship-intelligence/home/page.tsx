"use client";

import React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useHomeRelationshipOverview } from "@/hooks/use-home-relationship-overview";
import { cn } from "@/lib/utils";
import {
  Home,
  Loader2,
  Link2,
  HeartPulse,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

const REL_BADGE: Record<string, { label: string; cls: string }> = {
  secure: { label: "Secure", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  developing: { label: "Developing", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  fragile: { label: "Fragile", cls: "bg-red-100 text-red-800 border-red-200" },
};
const ES_BADGE: Record<string, { label: string; cls: string }> = {
  secure: { label: "Settled", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  watch: { label: "Watch", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  concern: { label: "Needs support", cls: "bg-red-100 text-red-800 border-red-200" },
};
const TREND_COLOR: Record<string, string> = { improving: "text-emerald-600", stable: "text-slate-500", declining: "text-red-600" };

function Count({ label, n, cls }: { label: string; n: number; cls: string }) {
  return (
    <div className={cn("rounded-lg border px-3 py-2 text-center", cls)}>
      <div className="text-lg font-bold">{n}</div>
      <div className="text-[11px] uppercase tracking-wide">{label}</div>
    </div>
  );
}

export default function HomeRelationshipsPage() {
  const { data, isLoading } = useHomeRelationshipOverview();

  return (
    <PageShell
      title="Home Relationships"
      subtitle="Every child's relational and emotional-safety status, ranked by who needs us most"
      actions={
        <Link href="/intelligence/cara/relationship-intelligence" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--cs-cara-gold,#b45309)]">
          Per-child view <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      }
    >
      <div className="space-y-6 animate-fade-in">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Building home overview…
          </div>
        )}

        {data && (
          <>
            {/* Home headline + rollup */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-[var(--cs-cara-gold,#b45309)]" />
                  <p className="text-sm font-medium text-[var(--cs-navy,#1e293b)]">{data.headline}</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  <Count label="Secure" n={data.counts.relationships.secure} cls="border-emerald-200 bg-emerald-50 text-emerald-800" />
                  <Count label="Developing" n={data.counts.relationships.developing} cls="border-amber-200 bg-amber-50 text-amber-800" />
                  <Count label="Fragile" n={data.counts.relationships.fragile} cls="border-red-200 bg-red-50 text-red-800" />
                  <Count label="Settled" n={data.counts.emotionalSafety.secure} cls="border-emerald-200 bg-emerald-50 text-emerald-800" />
                  <Count label="ES Watch" n={data.counts.emotionalSafety.watch} cls="border-amber-200 bg-amber-50 text-amber-800" />
                  <Count label="ES Concern" n={data.counts.emotionalSafety.concern} cls="border-red-200 bg-red-50 text-red-800" />
                </div>
              </CardContent>
            </Card>

            {/* Ranked children */}
            <div className="space-y-2">
              {data.children.map((c) => {
                const rel = REL_BADGE[c.relStatus];
                const es = ES_BADGE[c.esStatus];
                const TrendIcon = c.relDirection === "improving" ? TrendingUp : c.relDirection === "declining" ? TrendingDown : Minus;
                const priority = c.priority >= 3;
                return (
                  <Card key={c.childId} className={cn(priority && "border-l-4 border-l-red-400")}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">{c.childName}</span>
                          <span className="inline-flex items-center gap-1 text-xs text-[var(--cs-text-muted,#64748b)]">
                            <Link2 className="h-3 w-3" />
                            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", rel.cls)}>{rel.label}</span>
                          </span>
                          <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-semibold", TREND_COLOR[c.relDirection])}>
                            <TrendIcon className="h-3 w-3" /> {c.relDirection}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-[var(--cs-text-muted,#64748b)]">
                            <HeartPulse className="h-3 w-3" />
                            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", es.cls)}>{es.label}</span>
                          </span>
                          {c.trustedAdultCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                              <ShieldCheck className="h-3 w-3" /> {c.trustedAdultCount} trusted
                            </span>
                          )}
                        </div>
                      </div>
                      {c.topGap && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700">
                          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{c.topGap}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              CARA ranks relational and emotional-safety need across the home to help target support. It informs practice — it
              never replaces professional judgement.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
