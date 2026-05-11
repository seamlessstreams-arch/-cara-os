"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Export History page  (Milestone 36)
//
// Append-only record of every successful export of a persisted artifact
// (Inspection Snapshots, Reg 44 packs). Implements CLAUDE.md "restricted
// export permissions" — the immutable trail an inspector can ask for.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Share2, AlertTriangle } from "lucide-react";
import { useExportHistory } from "@/hooks/use-export-history";
import type { ExportHistoryEntry, ExportHistoryKind } from "@/lib/db/store";

const HOME_ID = "home_oak";

const KIND_LABEL: Record<ExportHistoryKind, string> = {
  inspection_snapshot: "Inspection Snapshot",
  reg44_pack: "Reg 44 Pack",
  filing_cabinet_index: "Filing Cabinet",
  inspection_bundle: "Inspection Bundle",
};

export default function ExportHistoryPage() {
  const { data, refetch, isFetching, isLoading } = useExportHistory(HOME_ID);
  const summary = data?.data;

  return (
    <PageShell
      title="Export History"
      subtitle="Immutable record of every export of a persisted artifact. Inspector-facing trail."
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Total exports</CardTitle>
              </CardHeader>
              <CardContent><p className="text-3xl font-semibold">{summary.total}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Inspection snapshots</CardTitle>
              </CardHeader>
              <CardContent><p className="text-3xl font-semibold">{summary.by_kind.inspection_snapshot}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Reg 44 packs</CardTitle>
              </CardHeader>
              <CardContent><p className="text-3xl font-semibold">{summary.by_kind.reg44_pack}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Filing cabinet</CardTitle>
              </CardHeader>
              <CardContent><p className="text-3xl font-semibold">{summary.by_kind.filing_cabinet_index}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Inspection bundles</CardTitle>
              </CardHeader>
              <CardContent><p className="text-3xl font-semibold">{summary.by_kind.inspection_bundle}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Safeguarding-sensitive</CardTitle>
              </CardHeader>
              <CardContent><p className="text-3xl font-semibold">{summary.safeguarding_sensitive}</p></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Exports by user</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(summary.by_user).length === 0 ? (
                <p className="text-sm text-slate-500">None yet.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:grid-cols-3">
                  {Object.entries(summary.by_user).map(([u, n]) => (
                    <li key={u} className="flex justify-between border-b border-dashed border-slate-200 py-1">
                      <span className="font-mono text-xs text-slate-600">{u}</span>
                      <span className="font-medium">{n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Share2 className="h-4 w-4 text-slate-500" />
                Recent exports
                <Badge variant="outline" className="text-xs">{summary.entries.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.entries.length === 0 ? (
                <p className="text-sm text-slate-500">No exports recorded yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {summary.entries.map((e) => <Row key={e.id} entry={e} />)}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}

function Row({ entry }: { entry: ExportHistoryEntry }) {
  return (
    <li className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">{KIND_LABEL[entry.kind]}</Badge>
          <Badge variant="outline" className="text-xs">{entry.format}</Badge>
          {entry.is_safeguarding_sensitive && (
            <Badge className="border border-rose-300 bg-rose-100 text-xs text-rose-800">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Safeguarding-sensitive
            </Badge>
          )}
        </div>
        <p className="mt-1 font-mono text-xs text-slate-500">{entry.artifact_id}</p>
        {entry.reason && (
          <p className="mt-1 text-sm text-slate-700">Reason: {entry.reason}</p>
        )}
      </div>
      <div className="text-right text-xs text-slate-500">
        <p>{new Date(entry.exported_at).toLocaleString()}</p>
        <p>by {entry.exported_by} <span className="text-slate-400">({entry.exported_by_role})</span></p>
        <p>{entry.byte_size.toLocaleString()} bytes</p>
      </div>
    </li>
  );
}
