"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Filing Cabinet Live Index  (Milestone 25)
//
// Inspection-grade index of every record auto-filed by the routing engine,
// grouped by FilingCategory with verified vs unverified counts.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, FolderOpen, CheckCircle2, AlertCircle, Share2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useFilingCabinetIndex } from "@/hooks/use-filing-cabinet-index";
import { useExportFilingCabinet } from "@/hooks/use-export-history";

const HOME_ID = "home_oak";

function pretty(category: string): string {
  return category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function FilingCabinetIndexPage() {
  const { data, refetch, isFetching, isLoading } = useFilingCabinetIndex(HOME_ID);
  const exportCabinet = useExportFilingCabinet();
  const idx = data?.data;

  async function exportNow() {
    const reason = window.prompt(
      "Reason for export (recorded in immutable export history):",
      "",
    );
    if (reason === null) return;
    const r = await exportCabinet.mutateAsync({ homeId: HOME_ID, reason });
    const payload = r.data.payload;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `filing_cabinet_${HOME_ID}_${new Date().toISOString().replace(/[:.]/g, "")}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell
      title="Filing Cabinet"
      subtitle="Live index of every record auto-filed by the routing engine. Verified records are inspection-ready."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={exportNow} disabled={exportCabinet.isPending || !idx}>
            {exportCabinet.isPending
              ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Exporting…</>
              : <><Share2 className="mr-1 h-4 w-4" />Export &amp; record</>}
          </Button>
        </div>
      }
    >
      {isLoading && <p className="text-sm text-slate-500">Loading filing cabinet…</p>}

      {idx && (
        <div className="space-y-6">
          {/* Top counters */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Total filings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{idx.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-emerald-700">{idx.verified}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Unverified</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-amber-700">{idx.unverified}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Categories in use</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{idx.categories.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Verification rate bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Inspection readiness — verified vs unverified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>{idx.total - idx.unverified} verified</span>
                <span>{idx.unverified_pct}% unverified</span>
              </div>
              <Progress value={idx.total === 0 ? 0 : 100 - idx.unverified_pct} />
            </CardContent>
          </Card>

          {/* Category groups */}
          {idx.categories.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-slate-500">
                <FolderOpen className="mx-auto mb-2 h-6 w-6" />
                Nothing has been filed yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {idx.categories.map((g) => (
                <Card key={g.category}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{pretty(g.category)}</CardTitle>
                      <div className="flex gap-2">
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {g.verified}
                        </Badge>
                        {g.unverified > 0 && (
                          <Badge className="bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            {g.unverified}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500">
                      {g.total} item{g.total === 1 ? "" : "s"}
                      {g.most_recent_filed_at && (
                        <> · last filed {new Date(g.most_recent_filed_at).toLocaleString()}</>
                      )}
                    </p>
                    <ul className="mt-3 space-y-1 text-sm">
                      {(g.recent_items ?? []).map((it) => (
                        <li key={it.id} className="flex items-center justify-between gap-2">
                          <Link
                            href={`/care-events/${it.care_event_id}`}
                            className="truncate text-slate-700 hover:underline"
                          >
                            {it.title}
                          </Link>
                          {it.is_verified ? (
                            <Badge variant="outline" className="text-xs text-emerald-700">verified</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-amber-700">unverified</Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
