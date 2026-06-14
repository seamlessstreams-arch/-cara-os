"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — DAILY LOG SUMMARY CARD
// Dashboard widget showing today's recording activity across all young people.
// Highlights gaps in daily recording — every child must have entries each day.
// Ofsted inspectors check for consistent, contemporaneous record-keeping.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDailyLog } from "@/hooks/use-daily-log";
import { useYoungPeople } from "@/hooks/use-young-people";
import type { YPEnriched } from "@/hooks/use-young-people";
import { cn, todayStr } from "@/lib/utils";
import {
  BookOpen, Loader2, CheckCircle2, AlertTriangle,
  ChevronRight, Heart, Smile, Frown, Meh,
} from "lucide-react";

// ── Entry type colours ───────────────────────────────────────────────────────

const TYPE_COLOURS: Record<string, string> = {
  general:   "bg-[var(--cs-surface)] text-[var(--cs-text-secondary)]",
  behaviour: "bg-orange-100 text-orange-700",
  health:    "bg-teal-100 text-teal-700",
  education: "bg-blue-100 text-blue-700",
  contact:   "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)]",
  activity:  "bg-emerald-100 text-emerald-700",
  mood:      "bg-amber-100 text-amber-700",
  sleep:     "bg-indigo-100 text-indigo-700",
  food:      "bg-rose-100 text-rose-700",
};

function MoodIcon({ score }: { score: number | null }) {
  if (score === null) return null;
  if (score >= 7) return <Smile className="h-3 w-3 text-emerald-500" />;
  if (score >= 4) return <Meh className="h-3 w-3 text-amber-500" />;
  return <Frown className="h-3 w-3 text-red-500" />;
}

// ── Component ────────────────────────────────────────────────────────────────

export function DailyLogSummaryCard() {
  const today = todayStr();
  const { data: logData, isLoading: logLoading } = useDailyLog({ date: today });
  const { data: ypData, isLoading: ypLoading }   = useYoungPeople();

  const isLoading = logLoading || ypLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <BookOpen className="h-4 w-4 text-emerald-500" />
            Daily Records
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

  const entries = logData?.data ?? [];
  const byType  = logData?.meta?.by_type ?? {};
  const allYP: YPEnriched[] = ypData?.data ?? [];
  const current = allYP.filter((yp) => yp.status === "current");

  // Which children have entries today?
  const childrenWithEntries = new Set(entries.map((e) => e.child_id));
  const childrenMissing = current.filter((yp) => !childrenWithEntries.has(yp.id));
  const allRecorded = childrenMissing.length === 0 && current.length > 0;

  // Per-child entry counts
  const perChild = current.map((yp) => {
    const ypEntries = entries.filter((e) => e.child_id === yp.id);
    const latestMood = ypEntries.find((e) => e.mood_score !== null)?.mood_score ?? null;
    const significant = ypEntries.filter((e) => e.is_significant).length;
    return {
      yp,
      count: ypEntries.length,
      latestMood,
      significant,
      types: [...new Set(ypEntries.map((e) => e.entry_type))],
    };
  }).sort((a, b) => a.count - b.count); // show least-recorded first

  return (
    <Card className={cn(childrenMissing.length > 0 && "border-amber-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <BookOpen className="h-4 w-4 text-emerald-500" />
            Daily Records
          </CardTitle>
          <Link href="/daily-log">
            <Badge className="text-[9px] bg-emerald-100 text-emerald-700 border-0 rounded-full hover:bg-emerald-200 cursor-pointer">
              {entries.length} today
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* Coverage bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-[var(--cs-surface)] rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                allRecorded ? "bg-emerald-500" : childrenMissing.length <= 1 ? "bg-amber-400" : "bg-red-400",
              )}
              style={{ width: current.length > 0 ? `${((current.length - childrenMissing.length) / current.length) * 100}%` : "0%" }}
            />
          </div>
          <span className={cn(
            "text-[10px] font-semibold",
            allRecorded ? "text-emerald-600" : "text-amber-600",
          )}>
            {current.length - childrenMissing.length}/{current.length}
          </span>
        </div>

        {/* All recorded celebration */}
        {allRecorded && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">
              All children recorded today
            </span>
          </div>
        )}

        {/* Missing children alert */}
        {childrenMissing.length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <p className="text-[10px] font-semibold text-amber-700">
                {childrenMissing.length} child{childrenMissing.length !== 1 ? "ren" : ""} with no entries today
              </p>
            </div>
            {childrenMissing.map((yp) => (
              <p key={yp.id} className="text-[10px] text-amber-600 ml-4">
                {yp.preferred_name || yp.first_name} {yp.last_name}
              </p>
            ))}
          </div>
        )}

        {/* Per-child summary */}
        {perChild.map(({ yp, count, latestMood, significant, types }) => (
          <Link key={yp.id} href={`/daily-log?child=${yp.id}`}>
            <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--cs-surface)] transition-colors">
              <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Heart className="h-2.5 w-2.5 text-rose-500" />
              </div>
              <span className="text-[11px] font-medium text-[var(--cs-text-secondary)] flex-1 truncate">
                {yp.preferred_name || yp.first_name}
              </span>

              {/* Mood */}
              <MoodIcon score={latestMood} />

              {/* Entry count */}
              <span className={cn(
                "text-[10px] font-semibold tabular-nums",
                count > 0 ? "text-emerald-600" : "text-[var(--cs-text-gentle)]",
              )}>
                {count}
              </span>

              {/* Significant flag */}
              {significant > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" title={`${significant} significant`} />
              )}

              {/* Entry types */}
              <div className="flex gap-0.5">
                {types.slice(0, 3).map((t) => (
                  <span key={t} className={cn("text-[7px] px-1 py-0.5 rounded-full font-medium", TYPE_COLOURS[t])}>
                    {t.slice(0, 3)}
                  </span>
                ))}
              </div>

              <ChevronRight className="h-3 w-3 text-[var(--cs-text-gentle)] shrink-0" />
            </div>
          </Link>
        ))}

        {/* Entry type breakdown */}
        {Object.keys(byType).length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-[var(--cs-border-subtle)]">
            {Object.entries(byType)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([type, count]) => (
                <span key={type} className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium", TYPE_COLOURS[type] ?? "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]")}>
                  {type} {count as number}
                </span>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
