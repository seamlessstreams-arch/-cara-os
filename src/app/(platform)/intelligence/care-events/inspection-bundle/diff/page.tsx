"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Inspection Bundle Diff page  (Milestone 44)
//
// Lets a manager / RI compare two persisted bundles to see readiness
// trajectory and evidence churn.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useEffect } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, GitCompare } from "lucide-react";
import {
  useInspectionBundles,
  useInspectionBundleDiff,
} from "@/hooks/use-inspection-bundles";

const HOME_ID = "home_oak";

export default function InspectionBundleDiffPage() {
  const list = useInspectionBundles(HOME_ID);
  const rows = useMemo(() => list.data?.data ?? [], [list.data]);
  const [currentId, setCurrentId] = useState<string>("");
  const [previousId, setPreviousId] = useState<string>("");

  // Default current = newest, previous = next newest
  useEffect(() => {
    if (!rows.length) return;
    if (!currentId) setCurrentId(rows[0].id);
    if (!previousId && rows.length >= 2) setPreviousId(rows[1].id);
  }, [rows, currentId, previousId]);

  const diff = useInspectionBundleDiff(currentId, previousId || null);
  const d = diff.data?.data;

  return (
    <PageShell
      title="Inspection Bundle Diff"
      subtitle="Compare two persisted bundles to see readiness trajectory and evidence churn."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <GitCompare className="h-4 w-4 text-slate-500" />
              Choose bundles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 && (
              <p className="text-sm text-slate-500">
                No bundles persisted yet. Build one from the Inspection Bundle page.
              </p>
            )}
            {rows.length > 0 && (
              <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <Picker
                  label="Previous bundle"
                  value={previousId}
                  onChange={setPreviousId}
                  rows={rows}
                  allowNone
                />
                <ArrowRight className="hidden h-5 w-5 text-slate-400 md:block" />
                <Picker
                  label="Current bundle"
                  value={currentId}
                  onChange={setCurrentId}
                  rows={rows}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {d && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notable changes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                  {d.notable_changes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Headline deltas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <DeltaRow label="Readiness score"        v={d.headline.readiness_score} />
                  <SeverityRow                              v={d.headline.readiness_severity} />
                  <DeltaRow label="Reg 44 packs"           v={d.headline.reg44_packs_included} />
                  <DeltaRow label="Filing total"           v={d.headline.filing_total} />
                  <DeltaRow label="Reg 45 evidence items"  v={d.headline.reg45_evidence_items} />
                  <DeltaRow label="Annex A evidence items" v={d.headline.annex_a_evidence_items} />
                  <DeltaRow label="Recent exports"         v={d.headline.recent_exports_included} />
                  <DeltaRow label="Trajectory alerts open" v={d.headline.trajectory_alerts_open} />
                  <DeltaRow label="Trajectory acks recent" v={d.headline.trajectory_acks_recent} />
                </ul>
              </CardContent>
            </Card>

            <ChurnCard title="Reg 45 evidence"  c={d.reg45_evidence} />
            <ChurnCard title="Annex A evidence" c={d.annex_a_evidence} />
            <ChurnCard title="Reg 44 packs"     c={d.reg44_packs} />
          </>
        )}
      </div>
    </PageShell>
  );
}

function Picker({
  label, value, onChange, rows, allowNone = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: { id: string; generated_at: string; readiness_score: number }[];
  allowNone?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="block text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <select
        className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {allowNone && <option value="">(empty baseline)</option>}
        {rows.map((r) => (
          <option key={r.id} value={r.id}>
            {new Date(r.generated_at).toLocaleString()} — readiness {r.readiness_score}
          </option>
        ))}
      </select>
    </label>
  );
}

function DeltaRow({
  label, v,
}: { label: string; v: { previous: number; current: number; delta: number } }) {
  const sign = v.delta > 0 ? "+" : "";
  const tone = v.delta > 0 ? "bg-emerald-100 text-emerald-800 border-emerald-300"
    : v.delta < 0 ? "bg-rose-100 text-rose-800 border-rose-300"
    : "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <li className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 p-2 text-sm">
      <span>{label}</span>
      <span className="flex items-center gap-2 text-xs">
        <span className="text-slate-500">{v.previous}</span>
        <ArrowRight className="h-3 w-3 text-slate-400" />
        <span className="font-semibold text-slate-700">{v.current}</span>
        <Badge className={`border ${tone}`}>{sign}{v.delta}</Badge>
      </span>
    </li>
  );
}

function SeverityRow({
  v,
}: { v: { previous: string; current: string; changed: boolean } }) {
  return (
    <li className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 p-2 text-sm">
      <span>Readiness severity</span>
      <span className="flex items-center gap-2 text-xs">
        <span className="text-slate-500">{v.previous}</span>
        <ArrowRight className="h-3 w-3 text-slate-400" />
        <span className="font-semibold text-slate-700">{v.current}</span>
        {v.changed && <Badge className="border border-amber-300 bg-amber-100 text-amber-800">changed</Badge>}
      </span>
    </li>
  );
}

function ChurnCard({
  title,
  c,
}: {
  title: string;
  c: { added: { id: string }[]; removed: { id: string }[]; unchanged_count: number };
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          {title}{" "}
          <span className="ml-2 text-xs text-slate-500">
            +{c.added.length} / -{c.removed.length} ({c.unchanged_count} unchanged)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(c.added.length + c.removed.length) === 0 && (
          <p className="text-xs text-slate-500">No changes.</p>
        )}
        {c.added.length > 0 && (
          <>
            <p className="text-xs uppercase tracking-wide text-emerald-700">Added</p>
            <ul className="mb-2 font-mono text-xs">
              {c.added.map((r) => <li key={r.id}>+ {r.id}</li>)}
            </ul>
          </>
        )}
        {c.removed.length > 0 && (
          <>
            <p className="text-xs uppercase tracking-wide text-rose-700">Removed</p>
            <ul className="font-mono text-xs">
              {c.removed.map((r) => <li key={r.id}>- {r.id}</li>)}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
