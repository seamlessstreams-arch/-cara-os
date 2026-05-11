"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MISSING FROM CARE CARD
// Dashboard widget showing active missing episodes, outstanding return home
// interviews, contextual safeguarding risk flags, and pattern alerts.
// Reg 36 — Missing child procedures and return interview requirements.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMissingEpisodes } from "@/hooks/use-missing-episodes";
import { getYPName } from "@/lib/seed-data";
import { cn, formatRelative } from "@/lib/utils";
import {
  MapPin, Loader2, AlertTriangle, CheckCircle2,
  ShieldAlert, FileText, Activity,
} from "lucide-react";

// ── Component ───────────────────────────────────────────────────────────────

export function MissingFromCareCard() {
  const { data, isPending } = useMissingEpisodes({ homeId: "home_oak" });
  const meta = data?.meta;
  const episodes = data?.data ?? [];
  const patterns = data?.pattern_analysis ?? [];

  const {
    active, unresolved, contextualRisk, totalThisMonth,
    activeList, hasAlert,
  } = useMemo(() => {
    const active = meta?.active ?? 0;
    const unresolved = meta?.unresolved ?? 0;
    const contextualRisk = meta?.contextual_risk ?? 0;
    const totalThisMonth = meta?.this_month ?? 0;

    // Active episodes for the list
    const activeList = episodes
      .filter((e) => e.status === "active")
      .slice(0, 4);

    return {
      active,
      unresolved,
      contextualRisk,
      totalThisMonth,
      activeList,
      hasAlert: active > 0,
    };
  }, [meta, episodes]);

  if (isPending) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <MapPin className="h-4 w-4 text-red-500" />
            Missing from Care
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(hasAlert && "border-red-300")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <MapPin className={cn("h-4 w-4", hasAlert ? "text-red-500 animate-pulse" : "text-red-500")} />
            Missing from Care
          </CardTitle>
          <Link href="/missing-from-care">
            <Badge className="text-[9px] bg-red-100 text-red-700 border-0 rounded-full hover:bg-red-200 cursor-pointer">
              View all
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className={cn("rounded-xl p-2 text-center", active > 0 ? "bg-red-50" : "bg-emerald-50")}>
            <Activity className={cn("h-3 w-3 mx-auto mb-0.5", active > 0 ? "text-red-500" : "text-emerald-500")} />
            <div className={cn("text-sm font-bold tabular-nums", active > 0 ? "text-red-700" : "text-emerald-700")}>{active}</div>
            <div className={cn("text-[9px]", active > 0 ? "text-red-500" : "text-emerald-500")}>Active</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", unresolved > 0 ? "bg-[var(--cs-aria-gold-bg)]" : "bg-[var(--cs-surface)]")}>
            <FileText className={cn("h-3 w-3 mx-auto mb-0.5", unresolved > 0 ? "text-[var(--cs-aria-gold)]" : "text-[var(--cs-text-muted)]")} />
            <div className={cn("text-sm font-bold tabular-nums", unresolved > 0 ? "text-[var(--cs-aria-gold)]" : "text-[var(--cs-text-muted)]")}>{unresolved}</div>
            <div className={cn("text-[9px]", unresolved > 0 ? "text-[var(--cs-aria-gold)]" : "text-[var(--cs-text-muted)]")}>RHI Due</div>
          </div>
          <div className="rounded-xl bg-[var(--cs-surface)] p-2 text-center">
            <MapPin className="h-3 w-3 text-[var(--cs-text-muted)] mx-auto mb-0.5" />
            <div className="text-sm font-bold text-[var(--cs-text-secondary)] tabular-nums">{totalThisMonth}</div>
            <div className="text-[9px] text-[var(--cs-text-muted)]">This Month</div>
          </div>
        </div>

        {/* Active missing alert */}
        {active > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-2 flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-red-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-[10px] font-semibold text-red-700">
                {active} young person{active !== 1 ? "s" : ""} currently missing
              </p>
              <p className="text-[10px] text-red-600">
                Police and placing LA must be notified immediately
              </p>
            </div>
          </div>
        )}

        {/* Active episodes list */}
        {activeList.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-red-500 px-1">Currently Missing</span>
            {activeList.map((ep) => (
              <Link key={ep.id} href="/missing-from-care">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-red-50/50 transition-colors bg-red-50/30">
                  <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                  <span className="text-[11px] font-medium text-[var(--cs-text-secondary)] flex-1 truncate">
                    {getYPName(ep.child_id)}
                  </span>
                  <span className="text-[9px] text-red-500 font-semibold shrink-0">
                    {formatRelative(ep.date_missing)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Contextual safeguarding risk */}
        {contextualRisk > 0 && (
          <div className="rounded-lg bg-orange-50 border border-orange-100 p-2 flex items-start gap-2">
            <ShieldAlert className="h-3 w-3 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-orange-700">
                {contextualRisk} episode{contextualRisk !== 1 ? "s" : ""} flagged contextual safeguarding risk
              </p>
              <p className="text-[10px] text-orange-600">
                Strategy discussion may be required
              </p>
            </div>
          </div>
        )}

        {/* RHI outstanding */}
        {unresolved > 0 && !hasAlert && (
          <div className="rounded-lg bg-[var(--cs-aria-gold-bg)] border border-[var(--cs-aria-gold-soft)] p-2 flex items-start gap-2">
            <FileText className="h-3 w-3 text-[var(--cs-aria-gold)] shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-[var(--cs-aria-gold)]">
                {unresolved} return home interview{unresolved !== 1 ? "s" : ""} outstanding
              </p>
              <p className="text-[10px] text-[var(--cs-aria-gold)]">
                RHIs must be completed within 72 hours of return
              </p>
            </div>
          </div>
        )}

        {/* All clear */}
        {active === 0 && unresolved === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">
              No active missing episodes
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
