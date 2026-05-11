"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Reg 44 Visit Evidence Pack page  (Milestones 33 + 35)
//
// Generate a fresh evidence bundle for the independent visitor and download
// it as JSON for the visit file. Each generated pack is persisted as
// immutable evidence and listed in the History panel.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, History, Share2 } from "lucide-react";
import {
  useGenerateAndPersistReg44Pack,
  usePersistedReg44Packs,
  useFetchPersistedReg44Pack,
} from "@/hooks/use-reg44-pack";
import { useExportReg44Pack } from "@/hooks/use-export-history";
import type { Reg44Pack } from "@/lib/care-events/reg44-pack";

const HOME_ID = "home_oak";
const WINDOW_OPTIONS = [7, 30, 90] as const;

export default function Reg44PackPage() {
  const gen = useGenerateAndPersistReg44Pack(HOME_ID);
  const history = usePersistedReg44Packs(HOME_ID);
  const fetchOne = useFetchPersistedReg44Pack();
  const exportPack = useExportReg44Pack();
  const [days, setDays] = useState<number>(30);
  const [pack, setPack] = useState<Reg44Pack | null>(null);

  async function generate() {
    const r = await gen.mutateAsync(days);
    setPack(r.data);
  }

  async function open(id: string) {
    const r = await fetchOne.mutateAsync(id);
    setPack(r.data);
  }

  function download() {
    if (!pack) return;
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pack.id}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  async function exportNow() {
    if (!pack) return;
    const reason = window.prompt(
      "Reason for export (recorded in immutable export history):",
      "",
    );
    if (reason === null) return;
    const r = await exportPack.mutateAsync({ id: pack.id, reason });
    const payload = r.data.payload;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${payload.id}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell
      title="Reg 44 Visit Evidence Pack"
      subtitle="Auto-generated bundle for the independent visitor — every record they typically request, scoped to the chosen window."
      actions={
        <div className="flex items-center gap-2">
          <div className="flex rounded border border-slate-200">
            {WINDOW_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 text-xs ${
                  days === d ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                }`}
              >{d}d</button>
            ))}
          </div>
          <Button size="sm" onClick={generate} disabled={gen.isPending}>
            {gen.isPending
              ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Generating…</>
              : <><FileText className="mr-1 h-4 w-4" />Generate pack</>}
          </Button>
          {pack && (
            <Button size="sm" variant="outline" onClick={download}>
              <Download className="mr-1 h-4 w-4" />Download JSON
            </Button>
          )}
          {pack && (
            <Button size="sm" variant="default" onClick={exportNow} disabled={exportPack.isPending}>
              {exportPack.isPending
                ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Exporting…</>
                : <><Share2 className="mr-1 h-4 w-4" />Export &amp; record</>}
            </Button>
          )}
        </div>
      }
    >
      {!pack && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            No pack generated yet. Choose a window and click <em>Generate pack</em>.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" />
            History
            <Badge variant="outline" className="text-xs">
              {history.data?.data.length ?? 0}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.isLoading && (
            <p className="text-sm text-slate-500">Loading…</p>
          )}
          {history.data && history.data.data.length === 0 && (
            <p className="text-sm text-slate-500">No persisted packs yet.</p>
          )}
          {history.data && history.data.data.length > 0 && (
            <ul className="divide-y divide-slate-100 text-sm">
              {history.data.data.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2 py-2">
                  <div>
                    <p className="font-mono text-xs text-slate-500">{row.id}</p>
                    <p>
                      {row.window_start} → {row.window_end}
                      <span className="mx-2 text-slate-300">·</span>
                      {row.headline_children} children
                      <span className="mx-2 text-slate-300">·</span>
                      {row.headline_safeguarding_events} safeguarding
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(row.generated_at).toLocaleString()} · by {row.generated_by ?? "unknown"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => open(row.id)}
                    disabled={fetchOne.isPending}
                  >
                    Open
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {pack && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Pack</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-mono text-xs text-slate-500">{pack.id}</p>
              <p>Window: {pack.window.start} → {pack.window.end}</p>
              <p>Generated: {new Date(pack.generated_at).toLocaleString()}</p>
              <p>By: {pack.generated_by ?? "unknown"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Headline</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:grid-cols-3">
                <Row k="Children in residence"     v={pack.headline.children_in_residence} />
                <Row k="Incidents"                 v={pack.headline.incidents} />
                <Row k="Incidents (critical)"      v={pack.headline.incidents_critical} />
                <Row k="Missing episodes"          v={pack.headline.missing_episodes} />
                <Row k="Missing (high/critical)"   v={pack.headline.missing_high_risk} />
                <Row k="Restraints"                v={pack.headline.restraints} />
                <Row k="Restraints (with injury)"  v={pack.headline.restraints_with_injuries} />
                <Row k="Complaints"                v={pack.headline.complaints} />
                <Row k="Complaints unresolved"     v={pack.headline.complaints_unresolved} />
                <Row k="Safeguarding events"       v={pack.headline.safeguarding_events} />
                <Row k="Reg 40 notifications"      v={pack.headline.reg40_notifications} />
                <Row k="Key-working sessions"      v={pack.headline.keywork_sessions} />
                <Row k="Open safeguarding patterns" v={pack.headline.safeguarding_patterns_open} />
                <Row k="Verified Reg 45 evidence"  v={pack.headline.verified_reg45_evidence} />
                <Row k="Outstanding recs (last visit)" v={pack.headline.last_visit_recommendations_outstanding} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                Children in residence
                <Badge variant="outline" className="text-xs">{pack.children.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pack.children.length === 0
                ? <p className="text-sm text-slate-500">No current children.</p>
                : <ul className="space-y-1 text-sm">
                    {pack.children.map((c) => (
                      <li key={c.child_id} className="flex justify-between border-b border-dashed border-slate-200 py-1">
                        <span>{c.preferred_name} <span className="text-xs text-slate-400">{c.legal_status}</span></span>
                        <span className="text-xs text-slate-500">since {c.placement_start} · SW {c.social_worker_name}</span>
                      </li>
                    ))}
                  </ul>}
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-2">
            <SectionCard title="Incidents"             count={pack.incidents.length}             />
            <SectionCard title="Missing episodes"      count={pack.missing_episodes.length}      />
            <SectionCard title="Restraints"            count={pack.restraints.length}            />
            <SectionCard title="Complaints"            count={pack.complaints.length}            />
            <SectionCard title="Safeguarding events"   count={pack.safeguarding_events.length}   />
            <SectionCard title="Reg 40 notifications"  count={pack.reg40_notifications.length}   />
            <SectionCard title="Key-working sessions"  count={pack.keywork_sessions.length}      />
            <SectionCard title="Safeguarding patterns" count={pack.safeguarding_patterns.length} />
            <SectionCard title="Verified Reg 45 evidence" count={pack.verified_reg45_evidence.length} />
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Previous Reg 44 visit</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              {pack.previous_visit.visit_date ? (
                <>
                  <p>Date: {pack.previous_visit.visit_date}</p>
                  <p>Judgement: {pack.previous_visit.overall_judgement ?? "—"}</p>
                  <p className="font-medium mt-2">Outstanding recommendations ({pack.previous_visit.outstanding_recommendations.length})</p>
                  {pack.previous_visit.outstanding_recommendations.length === 0
                    ? <p className="text-xs text-slate-500">None — all completed.</p>
                    : <ul className="list-disc pl-5 text-sm">
                        {pack.previous_visit.outstanding_recommendations.map((r) => (
                          <li key={r.id}>
                            <span className="font-medium">[{r.priority}] {r.status}</span> — {r.recommendation}
                          </li>
                        ))}
                      </ul>}
                </>
              ) : (
                <p className="text-sm text-slate-500">No previous visit on record.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
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

function SectionCard({ title, count }: { title: string; count: number }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent><p className="text-xs text-slate-500">{count} record(s)</p></CardContent>
    </Card>
  );
}
