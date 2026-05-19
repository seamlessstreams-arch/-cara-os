"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Returned Records Queue  (Milestone 23)
//
// Live queue of care events the manager has returned. Most overdue first;
// safeguarding-sensitive records float up. Re-submission happens via the
// individual care-event page.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeftCircle, Shield, CheckCircle2 } from "lucide-react";
import { useReturnedRecords } from "@/hooks/use-returned-records";
import type { ReturnedAgeBand, ReturnedRecordRow } from "@/lib/care-events/returned-records";

const HOME_ID = "home_oak";

const BAND_META: Record<ReturnedAgeBand, { label: string; tone: string }> = {
  today:        { label: "Today",        tone: "bg-slate-100 text-slate-800" },
  "1_3_days":   { label: "1–3 days",     tone: "bg-amber-100 text-amber-800" },
  "4_7_days":   { label: "4–7 days",     tone: "bg-orange-100 text-orange-800" },
  over_7_days:  { label: "Over 7 days",  tone: "bg-rose-100 text-rose-800" },
};

const BAND_ORDER: ReturnedAgeBand[] = ["today", "1_3_days", "4_7_days", "over_7_days"];

export default function ReturnedRecordsPage() {
  const { data, isLoading, refetch, isFetching } = useReturnedRecords(HOME_ID);
  const summary = data?.data;

  return (
    <PageShell
      title="Returned Records"
      subtitle="Care events the manager returned to staff to fix and resubmit. Most overdue first; safeguarding-sensitive records float up."
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      <div className="grid gap-3 md:grid-cols-4">
        {BAND_ORDER.map((band) => (
          <Card key={band} className="bg-slate-50">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{BAND_META[band].label}</p>
                <p className="mt-1 text-2xl font-semibold">{summary?.by_band[band] ?? 0}</p>
              </div>
              <Badge variant="outline" className={BAND_META[band].tone}>
                <ArrowLeftCircle className="h-3 w-3" />
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {summary && summary.safeguarding_sensitive_count > 0 && (
        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
          <Shield className="mr-1 inline h-3 w-3" />
          {summary.safeguarding_sensitive_count} safeguarding-sensitive record{summary.safeguarding_sensitive_count === 1 ? "" : "s"} returned.
        </div>
      )}

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading…</CardContent></Card>
        ) : !summary || summary.rows.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              No returned records to fix.
            </CardContent>
          </Card>
        ) : (
          summary.rows.map((row) => <ReturnedCard key={row.care_event_id} row={row} />)
        )}
      </div>
    </PageShell>
  );
}

function ReturnedCard({ row }: { row: ReturnedRecordRow }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm">{row.title}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {row.category.replace(/_/g, " ")} · event {row.event_date}
              {row.staff_id ? ` · staff ${row.staff_id}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="outline" className={BAND_META[row.age_band].tone}>
              {row.age_days === 0 ? "Today" : `${row.age_days}d ago`}
            </Badge>
            {row.is_safeguarding_sensitive && (
              <Badge variant="outline" className="bg-rose-100 text-rose-800">
                <Shield className="mr-1 h-3 w-3" />
                Sensitive
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 text-xs">
        {row.return_reason && (
          <div className="rounded border bg-amber-50 px-2 py-1">
            <span className="font-medium">Return reason:</span> {row.return_reason}
          </div>
        )}
        {row.manager_notes && (
          <div className="rounded border bg-slate-50 px-2 py-1">
            <span className="font-medium">Manager notes:</span> {row.manager_notes}
          </div>
        )}
        <div className="flex items-center justify-between text-muted-foreground">
          <span>
            Returned by {row.returned_by ?? "unknown"}{row.returned_at ? ` on ${row.returned_at.slice(0, 10)}` : ""}
          </span>
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
