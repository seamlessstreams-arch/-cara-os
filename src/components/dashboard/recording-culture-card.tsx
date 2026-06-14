"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — RECORDING CULTURE INTELLIGENCE CARD
// Manager oversight signal: the home's recording & relational-practice health,
// from the Cara practice-intelligence dashboard (open flags, manager-review
// queue, practice-quality, culture radar). Reg 36 (records); SCCIF (quality of
// recording + the child's lived experience). Cara advises; managers decide.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PenLine, ChevronRight, AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCaraPracticeDashboard } from "@/hooks/use-cara-practice";

const LEVEL_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};

export function RecordingCultureCard() {
  const { data, isLoading } = useCaraPracticeDashboard();
  const d = data?.data;
  const s = d?.summary;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <PenLine className="h-4 w-4" /> Recording culture
        </CardTitle>
        <Link href="/cara-practice" className="inline-flex items-center gap-0.5 text-xs font-semibold text-[var(--cs-teal)] hover:underline">
          Open <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-[var(--cs-text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading practice signals…
          </div>
        )}
        {!isLoading && d && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-[var(--cs-border)] p-2">
                <p className="text-xl font-extrabold text-[var(--cs-navy)]">{s?.openFlags ?? 0}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Open flags</p>
                {(s?.criticalFlags ?? 0) > 0 && <p className="mt-0.5 text-[10px] font-bold text-red-700">{s?.criticalFlags} critical</p>}
              </div>
              <div className="rounded-lg border border-[var(--cs-border)] p-2">
                <p className="text-xl font-extrabold text-[var(--cs-navy)]">{s?.managerReviewQueue ?? 0}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Manager review</p>
              </div>
              <div className="rounded-lg border border-[var(--cs-border)] p-2">
                <p className="text-xl font-extrabold text-[var(--cs-navy)]">{s?.avgPracticeQuality != null ? `${s.avgPracticeQuality}` : "—"}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Avg quality</p>
              </div>
            </div>

            {d.cultureRadar && d.cultureRadar.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)] flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Culture radar
                </p>
                {d.cultureRadar.slice(0, 3).map((c) => (
                  <div key={c.key} className={cn("rounded-lg border px-2.5 py-1.5 text-xs", LEVEL_STYLES[c.level] ?? LEVEL_STYLES.low)}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{c.label}</span>
                      <Badge variant="outline" className="text-[10px]">{c.count}</Badge>
                    </div>
                    <p className="mt-0.5 opacity-90">{c.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-[var(--cs-border)] px-2.5 py-2 text-xs text-[var(--cs-text-secondary)] flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" /> No recording-culture warnings — keep child-centred recording strong.
              </p>
            )}

            <p className="text-[11px] text-[var(--cs-text-gentle)]">
              Cara recognises practice patterns and advises; managers decide. Child-readability checks live in each record editor (Writing to the Child).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
