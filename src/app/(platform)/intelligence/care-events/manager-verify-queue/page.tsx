"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Manager Verify Queue page  (Milestone 29)
//
// Bulk verify or return care events sitting in manager_review_required /
// routing_failed. Selectable rows, prioritised list, sensitive flag visible.
// ══════════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, ShieldAlert, ExternalLink, CheckCircle2, RotateCcw } from "lucide-react";
import {
  useManagerVerifyQueue,
  useManagerBulkVerify,
  useManagerBulkReturn,
} from "@/hooks/use-manager-verify-queue";
import type { ManagerVerifyPriority, ManagerVerifyRow } from "@/lib/care-events/manager-verify-queue";

const HOME_ID = "home_oak";

const PRIORITY_TONE: Record<ManagerVerifyPriority, string> = {
  critical: "bg-rose-100 text-rose-800 border-rose-300",
  high:     "bg-orange-100 text-orange-800 border-orange-300",
  medium:   "bg-amber-100 text-amber-800 border-amber-300",
  low:      "bg-slate-100 text-slate-700 border-slate-300",
};

export default function ManagerVerifyQueuePage() {
  const { data, refetch, isFetching, isLoading } = useManagerVerifyQueue(HOME_ID);
  const verifyMut = useManagerBulkVerify(HOME_ID);
  const returnMut = useManagerBulkReturn(HOME_ID);
  const queue = data?.data;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [returnReason, setReturnReason] = useState("");
  const [managerNotes, setManagerNotes] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const allIds = useMemo(() => queue?.rows.map((r) => r.care_event_id) ?? [], [queue]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  async function doVerify() {
    if (selected.size === 0) return;
    const r = await verifyMut.mutateAsync({
      home_id: HOME_ID,
      care_event_ids: [...selected],
      manager_signature: true,
      manager_notes: managerNotes.trim() || null,
    });
    setFeedback(`Verified ${r.data.success} of ${r.data.total}.${r.data.failed ? ` ${r.data.failed} failed.` : ""}`);
    setSelected(new Set()); setManagerNotes("");
  }

  async function doReturn() {
    if (selected.size === 0 || !returnReason.trim()) return;
    const r = await returnMut.mutateAsync({
      home_id: HOME_ID,
      care_event_ids: [...selected],
      return_reason: returnReason.trim(),
      manager_notes: managerNotes.trim() || null,
    });
    setFeedback(`Returned ${r.data.success} of ${r.data.total}.${r.data.failed ? ` ${r.data.failed} failed.` : ""}`);
    setSelected(new Set()); setReturnReason(""); setManagerNotes("");
  }

  const busy = verifyMut.isPending || returnMut.isPending;

  return (
    <PageShell
      title="Manager Verify Queue"
      subtitle="Bulk verify or return care events awaiting manager review. Critical and safeguarding-sensitive items appear first."
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {isLoading && <p className="text-sm text-slate-500">Loading queue…</p>}

      {queue && (
        <div className="space-y-6">
          {/* Counters */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            <Counter title="Total" value={queue.total} />
            <Counter title="Sensitive" value={queue.sensitive_count} accent="rose" />
            <Counter title="Critical" value={queue.by_priority.critical} accent="rose" />
            <Counter title="High" value={queue.by_priority.high} accent="orange" />
            <Counter title="Medium" value={queue.by_priority.medium} accent="amber" />
            <Counter title="Low" value={queue.by_priority.low} />
          </div>

          {/* Bulk action bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Bulk action {selected.size > 0 && <span className="text-slate-500">— {selected.size} selected</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Manager notes (optional, applied to all selected items)"
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                rows={2}
              />
              <Textarea
                placeholder="Return reason (required to return)"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                rows={2}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={doVerify}
                  disabled={busy || selected.size === 0}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Verify selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={doReturn}
                  disabled={busy || selected.size === 0 || !returnReason.trim()}
                >
                  <RotateCcw className="mr-1 h-4 w-4" />
                  Return selected
                </Button>
                {feedback && <span className="text-xs text-slate-500">{feedback}</span>}
              </div>
            </CardContent>
          </Card>

          {/* Rows */}
          {queue.rows.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-slate-500">
                Queue empty. No care events awaiting manager review.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-4 w-4"
                    />
                    Select all ({queue.rows.length})
                  </label>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {queue.rows.map((r) => (
                  <Row
                    key={r.care_event_id}
                    row={r}
                    checked={selected.has(r.care_event_id)}
                    onToggle={() => toggle(r.care_event_id)}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PageShell>
  );
}

function Counter({
  title, value, accent,
}: { title: string; value: number; accent?: "rose" | "orange" | "amber" }) {
  const tone =
    accent === "rose"   ? "text-rose-700"   :
    accent === "orange" ? "text-orange-700" :
    accent === "amber"  ? "text-amber-700"  : "text-slate-900";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-wide text-slate-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-semibold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Row({
  row, checked, onToggle,
}: { row: ManagerVerifyRow; checked: boolean; onToggle: () => void }) {
  return (
    <div className={`flex items-start gap-3 rounded border p-3 ${checked ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200"}`}>
      <input type="checkbox" checked={checked} onChange={onToggle} className="mt-1 h-4 w-4" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`border ${PRIORITY_TONE[row.priority]}`}>{row.priority}</Badge>
          {row.is_safeguarding_sensitive && (
            <Badge variant="outline" className="border-rose-300 text-rose-700">
              <ShieldAlert className="mr-1 h-3 w-3" />
              sensitive
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">{row.category}</Badge>
          <Badge variant="outline" className="text-xs">{row.status}</Badge>
          {row.requires_reg40_triage && <Badge variant="outline" className="text-xs">Reg 40</Badge>}
          {row.contributes_to_reg45 && <Badge variant="outline" className="text-xs">Reg 45</Badge>}
          {row.contributes_to_annex_a && <Badge variant="outline" className="text-xs">Annex A</Badge>}
        </div>
        <p className="text-sm font-medium text-slate-800">{row.title}</p>
        <p className="text-xs text-slate-500">
          {row.staff_id}
          {row.child_id && <> · {row.child_id}</>}
          {" · "}{row.event_date}
          {" · "}aged {row.age_hours}h
          {row.failed_routes > 0 && <> · <span className="text-rose-600">{row.failed_routes} failed routes</span></>}
          {row.failed_jobs > 0 && <> · <span className="text-rose-600">{row.failed_jobs} failed jobs</span></>}
          {row.pending_reg45_evidence > 0 && <> · {row.pending_reg45_evidence} Reg 45 drafts</>}
          {row.pending_annex_a_evidence > 0 && <> · {row.pending_annex_a_evidence} Annex A drafts</>}
        </p>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link href={`/care-events/${row.care_event_id}`}>
          Open <ExternalLink className="ml-1 h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
}
