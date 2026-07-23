"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Inspection Bundle page  (Milestone 42)
//
// One-click composer of the full inspector-facing bundle. Always
// safeguarding-sensitive: the resulting export flows through the immutable
// export history (M36), the export-abuse engine (M40) and the manager
// notifications stream (M39/M41).
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FolderArchive, Download } from "lucide-react";
import Link from "next/link";
import { useExportInspectionBundle } from "@/hooks/use-export-history";
import { useInspectionBundles } from "@/hooks/use-inspection-bundles";
import { ArtifactExportHistoryPanel } from "@/components/care-events/artifact-export-history-panel";
import { formatRate } from "@/lib/metrics/rate";

const HOME_ID = "home_oak";

export default function InspectionBundlePage() {
  const exportBundle = useExportInspectionBundle();
  const [lastBundleId, setLastBundleId] = useState<string | null>(null);
  const list = useInspectionBundles(HOME_ID);

  const handleBuild = async () => {
    const reason = window.prompt(
      "Reason for inspection bundle (e.g. inspector visit, RI quarterly review):",
    );
    if (reason === null) return; // cancelled
    const res = await exportBundle.mutateAsync({ homeId: HOME_ID, reason });
    setLastBundleId(res.data.bundle.bundle_id);
    list.refetch();
    const blob = new Blob([JSON.stringify(res.data.bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${res.data.bundle.bundle_id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const result = exportBundle.data?.data.bundle;
  const exp = exportBundle.data?.data.export;

  return (
    <PageShell
      title="Inspection Bundle"
      subtitle="Compose one inspector-facing artifact: snapshot, Reg 44 packs, filing index, Reg 45 / Annex A evidence and recent export history."
      actions={
        <Button size="sm" onClick={handleBuild} disabled={exportBundle.isPending}>
          {exportBundle.isPending
            ? <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            : <Download className="mr-1 h-4 w-4" />}
          Build & export
        </Button>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FolderArchive className="h-4 w-4 text-slate-500" />
              About inspection bundles
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>
              Inspection bundles are <strong>always safeguarding-sensitive</strong>.
              Every build is recorded in the immutable export history with your
              user id, role, byte size and the reason you provided. Bursts of
              bundle exports trigger Export Risk flags and send a critical
              notification to managers.
            </p>
            <p>
              Bundle reasons should be specific (inspector name, RI visit,
              quarterly review, etc.) — they are visible to managers, the RI
              and during inspection.
            </p>
          </CardContent>
        </Card>

        {result && exp && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Last bundle built</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{result.bundle_id}</Badge>
                <Badge className="border border-rose-300 bg-rose-100 text-rose-800">
                  Safeguarding sensitive
                </Badge>
                <span className="text-xs text-slate-500">
                  {exp.byte_size.toLocaleString()} bytes
                </span>
              </div>
              <ul className="grid grid-cols-2 gap-2 md:grid-cols-4 mt-2">
                <Stat label="Reg 44 packs" value={result.headline.reg44_packs_included} />
                <Stat label="Filing total" value={result.headline.filing_total} />
                <Stat label="Reg 45 evidence" value={result.headline.reg45_evidence_items} />
                <Stat label="Annex A evidence" value={result.headline.annex_a_evidence_items} />
                <Stat label="Recent exports" value={result.headline.recent_exports_included} />
                <Stat label="Readiness" value={formatRate(result.headline.readiness_score)} />
              </ul>
            </CardContent>
          </Card>
        )}

        {lastBundleId && (
          <ArtifactExportHistoryPanel homeId={HOME_ID} artifactId={lastBundleId} />
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Persisted bundles</CardTitle>
          </CardHeader>
          <CardContent>
            {list.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
            {list.data?.data && list.data.data.length === 0 && (
              <p className="text-sm text-slate-500">
                No bundles persisted yet. Build & export above to create the first one.
              </p>
            )}
            {list.data?.data && list.data.data.length > 0 && (
              <ul className="divide-y divide-slate-100 text-sm">
                {list.data.data.map((b) => (
                  <li key={b.id} className="flex items-start gap-3 py-3">
                    <FolderArchive className="mt-0.5 h-5 w-5 text-slate-500" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/intelligence/care-events/inspection-bundle/${encodeURIComponent(b.id)}`}
                          className="text-sm font-medium text-blue-700 hover:underline"
                        >
                          {b.id}
                        </Link>
                        <Badge variant="outline" className="text-xs">v{b.schema_version}</Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(b.generated_at).toLocaleString()} · {b.generated_by ?? "—"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {b.reg44_packs_included} Reg 44 · {b.filing_total} filings ·{" "}
                        {b.reg45_evidence_items} Reg 45 · {b.annex_a_evidence_items} Annex A ·{" "}
                        readiness {b.readiness_score}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <li className="rounded border border-slate-200 bg-slate-50 p-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </li>
  );
}
