"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Amendment Review Queue  (Milestone 19)
//
// Surfaces sensitive amendments awaiting manager re-verification, with a
// per-row diff against the previous version. The amended record is never
// silently overwritten — the original is preserved (M13).
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw, Shield, FileWarning, BookOpen, Award, CheckCircle2, History,
} from "lucide-react";
import { useAmendmentReview } from "@/hooks/use-amendment-review";
import type {
  AmendmentReviewRow,
  AmendmentSensitiveFlag,
} from "@/lib/care-events/amendment-review";

const HOME_ID = "home_oak";

const FLAG_META: Record<AmendmentSensitiveFlag, { label: string; icon: React.ReactNode; tone: string }> = {
  safeguarding: { label: "Safeguarding", icon: <Shield className="h-3 w-3" />, tone: "bg-rose-100 text-rose-800" },
  reg40:        { label: "Reg 40",       icon: <FileWarning className="h-3 w-3" />, tone: "bg-amber-100 text-amber-800" },
  reg45:        { label: "Reg 45",       icon: <BookOpen className="h-3 w-3" />, tone: "bg-violet-100 text-violet-800" },
  annex_a:      { label: "Annex A",      icon: <Award className="h-3 w-3" />, tone: "bg-blue-100 text-blue-800" },
};

export default function AmendmentReviewPage() {
  const { data, isLoading, refetch, isFetching } = useAmendmentReview(HOME_ID);
  const summary = data?.data;

  return (
    <PageShell
      title="Amendment Review"
      subtitle="Sensitive amendments awaiting manager re-verification. The original verified version is preserved on every amendment."
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      <div className="grid gap-3 md:grid-cols-4">
        {(["safeguarding", "reg40", "reg45", "annex_a"] as AmendmentSensitiveFlag[]).map((f) => (
          <Card key={f} className="bg-slate-50">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{FLAG_META[f].label}</p>
                <p className="mt-1 text-2xl font-semibold">{summary?.by_flag[f] ?? 0}</p>
              </div>
              <div className="text-slate-700">{FLAG_META[f].icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading…</CardContent></Card>
        ) : !summary || summary.rows.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              No sensitive amendments awaiting review.
            </CardContent>
          </Card>
        ) : (
          summary.rows.map((row) => <AmendmentCard key={row.care_event_id} row={row} />)
        )}
      </div>
    </PageShell>
  );
}

function AmendmentCard({ row }: { row: AmendmentReviewRow }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm">{row.title}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {row.category.replace(/_/g, " ")} · event {row.event_date} · v{row.version}
              {row.amended_at ? ` · amended ${row.amended_at.slice(0, 10)}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {row.sensitive_flags.map((f) => (
              <Badge key={f} variant="outline" className={FLAG_META[f].tone}>
                <span className="mr-1">{FLAG_META[f].icon}</span>
                {FLAG_META[f].label}
              </Badge>
            ))}
            <Badge variant="outline">{row.status.replace(/_/g, " ")}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 text-xs">
        {row.amendment_reason && (
          <div className="rounded border bg-slate-50 px-2 py-1">
            <span className="font-medium">Reason:</span> {row.amendment_reason}
          </div>
        )}
        {row.diff.length === 0 ? (
          <p className="text-muted-foreground">No structured field changes detected.</p>
        ) : (
          <details open>
            <summary className="flex cursor-pointer items-center gap-1 text-muted-foreground hover:text-foreground">
              <History className="h-3 w-3" />
              {row.diff.length} field change{row.diff.length === 1 ? "" : "s"} vs previous version
            </summary>
            <ul className="mt-1 space-y-1">
              {row.diff.map((d) => (
                <li key={d.field} className="rounded border bg-amber-50 px-2 py-1">
                  <p className="font-medium">{d.field}</p>
                  <p className="line-through text-rose-700">{format(d.before)}</p>
                  <p className="text-emerald-700">{format(d.after)}</p>
                </li>
              ))}
            </ul>
          </details>
        )}
        <div className="flex justify-end">
          <a
            href={`/care-events/${row.care_event_id}`}
            className="text-xs text-blue-700 hover:underline"
          >
            Open record →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function format(v: unknown): string {
  if (v === null || v === undefined) return "(empty)";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
