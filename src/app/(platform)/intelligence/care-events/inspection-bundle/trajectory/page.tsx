"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Inspection Readiness Trajectory page  (Milestone 45)
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, LineChart, BellRing } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useInspectionTrajectory } from "@/hooks/use-inspection-trajectory";
import { useTrajectoryAlerts, useAckTrajectoryAlert } from "@/hooks/use-trajectory-alerts";
import type { TrajectoryAlert } from "@/lib/care-events/inspection-trajectory";

const HOME_ID = "home_oak";

export default function InspectionTrajectoryPage() {
  const q = useInspectionTrajectory(HOME_ID);
  const t = q.data?.data;
  const alertsQ = useTrajectoryAlerts(HOME_ID);
  const alerts = alertsQ.data?.data.alerts ?? [];
  const acks = alertsQ.data?.data.acks_recent ?? [];

  return (
    <PageShell
      title="Readiness Trajectory"
      subtitle="Inspection readiness scores across all persisted bundles for this home."
    >
      {!t && <p className="text-sm text-slate-500">Loading…</p>}
      {t && (
        <div className="space-y-6">
          <SummaryCard t={t} />
          <AlertsCard alerts={alerts} />
          <Sparkline points={t.points} />
          <PointsTable points={t.points} />
          <AckHistoryCard acks={acks} />
        </div>
      )}
    </PageShell>
  );
}

function directionMeta(dir: string) {
  if (dir === "improving")    return { Icon: TrendingUp,   tone: "border-emerald-300 bg-emerald-100 text-emerald-800", label: "Improving" };
  if (dir === "regressing")   return { Icon: TrendingDown, tone: "border-rose-300 bg-rose-100 text-rose-800",          label: "Regressing" };
  if (dir === "holding")      return { Icon: Minus,        tone: "border-slate-300 bg-slate-100 text-slate-700",       label: "Holding" };
  return                             { Icon: LineChart,    tone: "border-amber-300 bg-amber-100 text-amber-800",       label: "Insufficient data" };
}

function SummaryCard({ t }: { t: import("@/lib/care-events/inspection-trajectory").TrajectorySummary }) {
  const m = directionMeta(t.direction);
  const sign = (t.net_score_delta ?? 0) > 0 ? "+" : "";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <m.Icon className="h-4 w-4 text-slate-500" />
          Trajectory summary
          <Badge className={`ml-2 border ${m.tone}`}>{m.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <Stat label="Bundles"             value={String(t.bundles_total)} />
          <Stat label="Earliest score"      value={t.earliest_score == null ? "—" : String(t.earliest_score)} />
          <Stat label="Latest score"        value={t.latest_score   == null ? "—" : String(t.latest_score)} />
          <Stat label="Net Δ"               value={t.net_score_delta == null ? "—" : `${sign}${t.net_score_delta}`} />
          <Stat label="Earliest at"         value={t.earliest_at ? new Date(t.earliest_at).toLocaleDateString() : "—"} />
          <Stat label="Latest at"           value={t.latest_at   ? new Date(t.latest_at).toLocaleDateString()   : "—"} />
          <Stat label="Severity flips"      value={String(t.severity_changes)} />
          <Stat label="Direction"           value={m.label} />
        </ul>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <li className="rounded border border-slate-200 bg-slate-50 p-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{value}</p>
    </li>
  );
}

function Sparkline({ points }: { points: import("@/lib/care-events/inspection-trajectory").TrajectoryPoint[] }) {
  if (points.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="py-6 text-center text-sm text-slate-500">
            No bundles persisted yet — generate one from the Inspection Bundle page to begin tracking trajectory.
          </p>
        </CardContent>
      </Card>
    );
  }
  const W = 720;
  const H = 160;
  const PAD = 24;
  const scores = points.map((p) => p.readiness_score);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 1);
  const span = Math.max(max - min, 1);
  const xStep = points.length === 1 ? 0 : (W - PAD * 2) / (points.length - 1);
  const xy = points.map((p, i) => {
    const x = PAD + xStep * i;
    const y = H - PAD - ((p.readiness_score - min) / span) * (H - PAD * 2);
    return { x, y, p };
  });
  const path = xy.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Readiness over time</CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" role="img" aria-label="Readiness sparkline">
          <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke="#e2e8f0" />
          <line x1={PAD} x2={PAD}     y1={PAD}     y2={H - PAD} stroke="#e2e8f0" />
          <path d={path} fill="none" stroke="#0f172a" strokeWidth={2} />
          {xy.map((c) => (
            <circle key={c.p.bundle_id} cx={c.x} cy={c.y} r={3.5} fill="#0f172a" />
          ))}
          <text x={PAD}     y={PAD - 6} fontSize={10} fill="#64748b">{max}</text>
          <text x={PAD}     y={H - 6}   fontSize={10} fill="#64748b">{min}</text>
        </svg>
      </CardContent>
    </Card>
  );
}

function PointsTable({ points }: { points: import("@/lib/care-events/inspection-trajectory").TrajectoryPoint[] }) {
  if (points.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Bundles ({points.length})</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-1 pr-3">Generated</th>
              <th className="py-1 pr-3">Score</th>
              <th className="py-1 pr-3">Δ</th>
              <th className="py-1 pr-3">Severity</th>
              <th className="py-1 pr-3">Reg44</th>
              <th className="py-1 pr-3">Reg45</th>
              <th className="py-1 pr-3">Annex A</th>
              <th className="py-1 pr-3">Filing</th>
              <th className="py-1 pr-3">Bundle</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => {
              const sign = p.delta_readiness_score > 0 ? "+" : "";
              const tone = p.delta_readiness_score > 0 ? "text-emerald-700"
                : p.delta_readiness_score < 0 ? "text-rose-700"
                : "text-slate-500";
              return (
                <tr key={p.bundle_id} className="border-b border-slate-100">
                  <td className="py-1 pr-3">{new Date(p.generated_at).toLocaleString()}</td>
                  <td className="py-1 pr-3 font-semibold">{p.readiness_score}</td>
                  <td className={`py-1 pr-3 ${tone}`}>{sign}{p.delta_readiness_score}</td>
                  <td className="py-1 pr-3">
                    {p.readiness_severity}
                    {p.severity_changed && <Badge className="ml-1 border border-amber-300 bg-amber-100 text-amber-800">flip</Badge>}
                  </td>
                  <td className="py-1 pr-3">{p.reg44_packs_included}</td>
                  <td className="py-1 pr-3">{p.reg45_evidence_items}</td>
                  <td className="py-1 pr-3">{p.annex_a_evidence_items}</td>
                  <td className="py-1 pr-3">{p.filing_total}</td>
                  <td className="py-1 pr-3">
                    <Link
                      href={`/intelligence/care-events/inspection-bundle/${encodeURIComponent(p.bundle_id)}`}
                      className="text-blue-700 underline"
                    >
                      open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function AlertsCard({ alerts }: { alerts: TrajectoryAlert[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BellRing className="h-4 w-4 text-slate-500" />
          Active alerts
          <Badge variant="outline" className="ml-2 text-xs">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 && (
          <p className="text-sm text-slate-500">No active trajectory alerts.</p>
        )}
        {alerts.length > 0 && (
          <ul className="space-y-2">
            {alerts.map((a) => <AlertRow key={a.id} alert={a} />)}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function AlertRow({ alert }: { alert: TrajectoryAlert }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const ack = useAckTrajectoryAlert(HOME_ID);
  const tone =
    alert.severity === "critical"
      ? "border-rose-300 bg-rose-50"
      : "border-amber-300 bg-amber-50";
  return (
    <li className={`rounded border p-3 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {alert.kind.replace(/_/g, " ")}{" "}
            <Badge variant="outline" className="ml-1 text-xs">{alert.severity}</Badge>
          </p>
          <p className="mt-0.5 text-sm text-slate-700">{alert.message}</p>
          {alert.bundle_id && (
            <Link
              href={`/intelligence/care-events/inspection-bundle/${encodeURIComponent(alert.bundle_id)}`}
              className="text-xs text-blue-700 underline"
            >
              open bundle
            </Link>
          )}
        </div>
        {!open && (
          <button
            type="button"
            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50"
            onClick={() => setOpen(true)}
          >
            Acknowledge
          </button>
        )}
      </div>
      {open && (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!note.trim()) return;
            ack.mutate({ alert_id: alert.id, note: note.trim() }, {
              onSuccess: () => { setOpen(false); setNote(""); },
            });
          }}
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Action note: what's being done, who's doing it, by when…"
            rows={2}
            required
            className="w-full rounded border border-slate-300 bg-white p-2 text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={ack.isPending || !note.trim()}
              className="rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              {ack.isPending ? "Saving…" : "Submit acknowledgement"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setNote(""); }}
              className="rounded border border-slate-300 bg-white px-3 py-1 text-xs"
            >
              Cancel
            </button>
            {ack.isError && (
              <span className="text-xs text-rose-700">Failed — please try again.</span>
            )}
          </div>
        </form>
      )}
    </li>
  );
}

function AckHistoryCard({ acks }: { acks: import("@/lib/db/store").TrajectoryAlertAck[] }) {
  if (acks.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Recent acknowledgements ({acks.length})</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-1 pr-3">Acked at</th>
              <th className="py-1 pr-3">Kind</th>
              <th className="py-1 pr-3">By</th>
              <th className="py-1 pr-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {acks.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 align-top">
                <td className="py-1 pr-3 whitespace-nowrap">{new Date(a.acked_at).toLocaleString()}</td>
                <td className="py-1 pr-3">{a.alert_kind.replace(/_/g, " ")}</td>
                <td className="py-1 pr-3">{a.acked_by_user} ({a.acked_by_role})</td>
                <td className="py-1 pr-3">{a.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}