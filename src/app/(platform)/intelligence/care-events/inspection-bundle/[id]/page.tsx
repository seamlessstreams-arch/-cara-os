"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Inspection Bundle — detail page  (Milestone 43)
// ══════════════════════════════════════════════════════════════════════════════

import { use } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderArchive } from "lucide-react";
import { useInspectionBundle } from "@/hooks/use-inspection-bundles";
import { ArtifactExportHistoryPanel } from "@/components/care-events/artifact-export-history-panel";

export default function InspectionBundleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, error } = useInspectionBundle(id);
  const row = data?.data;

  return (
    <PageShell
      title="Inspection Bundle"
      subtitle="Persisted, immutable inspector bundle. Re-downloads are recorded in the export history."
    >
      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && <p className="text-sm text-rose-700">Could not load bundle.</p>}
      {row && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FolderArchive className="h-4 w-4 text-slate-500" />
                {row.id}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">v{row.schema_version}</Badge>
                <Badge className="border border-rose-300 bg-rose-100 text-rose-800">
                  Safeguarding sensitive
                </Badge>
                <span className="text-xs text-slate-500">
                  Generated {new Date(row.generated_at).toLocaleString()} ·{" "}
                  {row.generated_by ?? "—"}
                </span>
              </div>
              <ul className="grid grid-cols-2 gap-2 md:grid-cols-4 mt-2">
                <Stat label="Reg 44 packs"     value={row.reg44_packs_included} />
                <Stat label="Filing total"     value={row.filing_total} />
                <Stat label="Reg 45 evidence"  value={row.reg45_evidence_items} />
                <Stat label="Annex A evidence" value={row.annex_a_evidence_items} />
                <Stat label="Recent exports"   value={row.recent_exports_included} />
                <Stat label="Readiness"        value={`${row.readiness_score} (${row.readiness_severity})`} />
                <Stat label="Trajectory open"  value={row.trajectory_alerts_open ?? 0} />
                <Stat label="Trajectory acks"  value={row.trajectory_acks_recent ?? 0} />
              </ul>
            </CardContent>
          </Card>

          <TrajectorySection payload={row.payload as { trajectory_alerts_open?: unknown[]; trajectory_acks_recent?: unknown[] }} />

          <ArtifactExportHistoryPanel homeId={row.home_id} artifactId={row.id} />
        </div>
      )}
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

interface TrajectoryAlertSnapshot {
  id: string;
  kind: string;
  severity: string;
  message: string;
  detected_at: string;
}

interface TrajectoryAckSnapshot {
  id: string;
  alert_kind: string;
  acked_by_user: string;
  acked_by_role: string;
  note: string;
  acked_at: string;
}

function TrajectorySection({
  payload,
}: { payload: { trajectory_alerts_open?: unknown[]; trajectory_acks_recent?: unknown[] } }) {
  const alerts = (payload.trajectory_alerts_open ?? []) as TrajectoryAlertSnapshot[];
  const acks = (payload.trajectory_acks_recent ?? []) as TrajectoryAckSnapshot[];
  if (alerts.length === 0 && acks.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          Trajectory at composition time
          <span className="ml-2 text-xs text-slate-500">
            {alerts.length} open · {acks.length} acks
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {alerts.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Open alerts</p>
            <ul className="space-y-1">
              {alerts.map((a) => (
                <li key={a.id} className="rounded border border-amber-200 bg-amber-50 p-2 text-xs">
                  <span className="font-semibold">{a.kind.replace(/_/g, " ")}</span>
                  <Badge variant="outline" className="ml-2 text-[10px]">{a.severity}</Badge>
                  <p>{a.message}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {acks.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Recent acknowledgements</p>
            <ul className="space-y-1">
              {acks.map((a) => (
                <li key={a.id} className="rounded border border-emerald-200 bg-emerald-50 p-2 text-xs">
                  <span className="font-semibold">{a.alert_kind.replace(/_/g, " ")}</span>
                  <span className="ml-2 text-slate-600">
                    by {a.acked_by_user} ({a.acked_by_role}) · {new Date(a.acked_at).toLocaleString()}
                  </span>
                  <p>{a.note}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
