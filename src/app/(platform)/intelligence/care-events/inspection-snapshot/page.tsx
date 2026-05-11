"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Inspection Snapshot page  (Milestones 30 + 31)
//
// Generate AND persist a fresh point-in-time bundle, browse the history of
// previously persisted snapshots, and download any snapshot as JSON.
// Each persisted snapshot is immutable evidence.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Download, Loader2, Eye, History, Share2 } from "lucide-react";
import {
  usePersistedSnapshots,
  useGenerateAndPersistSnapshot,
  useFetchPersistedSnapshot,
} from "@/hooks/use-inspection-snapshot";
import { useExportInspectionSnapshot } from "@/hooks/use-export-history";
import type { InspectionSnapshot } from "@/lib/care-events/inspection-snapshot";

const HOME_ID = "home_oak";

export default function InspectionSnapshotPage() {
  const list = usePersistedSnapshots(HOME_ID);
  const gen  = useGenerateAndPersistSnapshot(HOME_ID);
  const fetchOne = useFetchPersistedSnapshot();
  const exportSnap = useExportInspectionSnapshot();
  const [snap, setSnap] = useState<InspectionSnapshot | null>(null);

  async function generate() {
    const r = await gen.mutateAsync();
    setSnap(r.data);
  }

  async function open(id: string) {
    const r = await fetchOne.mutateAsync(id);
    setSnap(r.data.payload as InspectionSnapshot);
  }

  function download() {
    if (!snap) return;
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${snap.id}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  async function exportNow() {
    if (!snap) return;
    const reason = window.prompt(
      "Reason for export (recorded in immutable export history):",
      "",
    );
    if (reason === null) return;
    const r = await exportSnap.mutateAsync({ id: snap.id, reason });
    const payload = r.data.payload;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${payload.id}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  const rows = list.data?.data ?? [];

  return (
    <PageShell
      title="Inspection Snapshots"
      subtitle="Persist a point-in-time bundle of every live signal as immutable evidence. Snapshots are append-only and never edited."
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={generate} disabled={gen.isPending}>
            {gen.isPending
              ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Capturing…</>
              : <><Camera className="mr-1 h-4 w-4" />Capture &amp; persist</>}
          </Button>
          {snap && (
            <Button size="sm" variant="outline" onClick={download}>
              <Download className="mr-1 h-4 w-4" />Download JSON
            </Button>
          )}
          {snap && (
            <Button size="sm" variant="default" onClick={exportNow} disabled={exportSnap.isPending}>
              {exportSnap.isPending
                ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Exporting…</>
                : <><Share2 className="mr-1 h-4 w-4" />Export &amp; record</>}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-slate-500" />
              History
              <Badge variant="outline" className="ml-1 text-xs">{rows.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {list.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
            {rows.length === 0 && !list.isLoading && (
              <p className="text-sm text-slate-500">
                No snapshots persisted yet. Click <em>Capture &amp; persist</em> to save the first one.
              </p>
            )}
            {rows.length > 0 && (
              <div className="space-y-2">
                {rows.map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between rounded border p-2 text-sm ${
                      snap?.id === r.id ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-slate-500">{r.id}</p>
                      <p className="text-slate-700">
                        {new Date(r.generated_at).toLocaleString()}
                        <span className="ml-2 text-xs text-slate-400">by {r.generated_by ?? "unknown"}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">readiness {r.readiness_score}</Badge>
                      <Badge variant="outline" className="text-xs">{r.readiness_severity}</Badge>
                      <Button size="sm" variant="outline" onClick={() => open(r.id)}>
                        <Eye className="mr-1 h-3 w-3" />Open
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Snapshot detail */}
        {snap && (
          <>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Snapshot</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-mono text-xs text-slate-500">{snap.id}</p>
                <p>Generated: {new Date(snap.generated_at).toLocaleString()}</p>
                <p>By: {snap.generated_by ?? "unknown"}</p>
                <p>Home: {snap.home_id}</p>
                <p>Schema version: {snap.schema_version}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  Headline
                  <Badge variant="outline">readiness {snap.headline.readiness_score}</Badge>
                  <Badge variant="outline">{snap.headline.readiness_severity}</Badge>
                  <Badge variant="outline">jobs: {snap.headline.jobs_health}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:grid-cols-3">
                  <Row k="Filing total"             v={snap.headline.filing_total} />
                  <Row k="Filing unverified %"      v={`${snap.headline.filing_unverified_pct}%`} />
                  <Row k="Manager verify queue"     v={snap.headline.manager_verify_total} />
                  <Row k="Manager verify critical"  v={snap.headline.manager_verify_critical} />
                  <Row k="Manager verify sensitive" v={snap.headline.manager_verify_sensitive} />
                  <Row k="Returned records"         v={snap.headline.returned_total} />
                  <Row k="Returned (sensitive)"     v={snap.headline.returned_safeguarding_sensitive} />
                  <Row k="Oversight inbox"          v={snap.headline.oversight_total} />
                  <Row k="Oversight critical"       v={snap.headline.oversight_critical} />
                  <Row k="Notifications"            v={snap.headline.notifications_total} />
                  <Row k="Notifications critical"   v={snap.headline.notifications_critical} />
                  <Row k="Open Reg 40 triages"      v={snap.headline.open_reg40_triages} />
                  <Row k="AI-draft Reg 45 evidence" v={snap.headline.ai_draft_reg45_evidence} />
                  <Row k="Pending Annex A evidence" v={snap.headline.pending_annex_a_evidence} />
                  <Row k="Failed routes"            v={snap.headline.routing_failed_routes} />
                  <Row k="Failed jobs"              v={snap.headline.routing_failed_jobs} />
                  <Row k="Job failures"             v={snap.headline.jobs_failures} />
                  <Row k="Saved time (30d)"         v={`${snap.headline.saved_time_hours_30d}h`} />
                  <Row k="Saved time (all-time)"    v={`${snap.headline.saved_time_hours_all_time}h`} />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageShell>
  );
}

function Row({ k, v }: { k: string; v: number | string }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-slate-200 py-1">
      <span className="text-slate-600">{k}</span>
      <span className="font-medium text-slate-900">{v}</span>
    </div>
  );
}

