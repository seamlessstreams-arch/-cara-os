"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — POLICY VERSION HISTORY (Doc-Version-Workflow · Module 3)
//
// The first visible consumer of the versioning spine. Renders a policy's
// append-only version chain (newest first) and offers "Record update" — a
// human-initiated versioned change (change summary required). Server-side the
// write is flag-gated; when versioning is off the dialog reports that honestly
// instead of pretending.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePolicyVersionHistory, useRecordPolicyVersion } from "@/hooks/use-policy-versions";
import { History, Loader2, GitCommitVertical, Plus } from "lucide-react";
import { toast } from "sonner";

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function PolicyVersionHistory({ policyId, currentVersion }: { policyId: string; currentVersion: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = usePolicyVersionHistory(policyId, true);
  const record = useRecordPolicyVersion();

  const [summary, setSummary] = useState("");
  const [label, setLabel] = useState("");
  const [nextReview, setNextReview] = useState("");

  const history = data?.data.history ?? [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) {
      toast.error("Say what changed — every version carries a change summary.");
      return;
    }
    record.mutate(
      { policyId, change_summary: summary.trim(), version_label: label.trim() || null, next_review_date: nextReview || null },
      {
        onSuccess: (res) => {
          if (res.data.enabled === false) {
            toast.info("Versioned updates are switched off (doc_versioning_write) — nothing was changed.");
          } else {
            toast.success(`Recorded version ${res.data.version.version_label}.`);
            setOpen(false);
            setSummary(""); setLabel(""); setNextReview("");
          }
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Version refused."),
      },
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--cs-navy)]">
          <History className="h-3.5 w-3.5" /> Version history
        </p>
        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-3 w-3" /> Record update
        </Button>
      </div>

      {isLoading ? (
        <p className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)]">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading history…
        </p>
      ) : history.length === 0 ? (
        <p className="text-xs text-[var(--cs-text-muted)]">
          No recorded versions yet — this policy shows v{currentVersion}, but its history begins with the first
          versioned update. Until then, edits overwrite.
        </p>
      ) : (
        <div className="divide-y divide-[var(--cs-border)] border-t border-[var(--cs-border)]">
          {history.map((v) => (
            <div key={v.id} className="flex items-start justify-between gap-3 py-1.5">
              <div className="min-w-0">
                <p className="text-xs text-[var(--cs-text)]">
                  <GitCommitVertical className="mr-1 inline h-3 w-3 align-[-2px] text-[var(--cs-text-gentle)]" />
                  <span className="font-mono font-semibold">v{v.version_label}</span>
                  <span className="text-[var(--cs-text-secondary)]"> — {v.change_summary}</span>
                </p>
                <p className="text-[10px] text-[var(--cs-text-muted)]">
                  {fmtDateTime(v.changed_at)} · {v.changed_by}
                </p>
              </div>
              {v.is_current ? (
                <Badge variant="success" className="shrink-0 text-[10px]">Current</Badge>
              ) : (
                <Badge variant="outline" className="shrink-0 text-[10px]">Superseded</Badge>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record a policy update</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label htmlFor="pv-summary" className="text-sm font-medium">What changed?</label>
              <Textarea
                id="pv-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="e.g. Annual review — updated escalation contacts and missing-from-care flowchart"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="pv-label" className="text-sm font-medium">New version</label>
                <Input id="pv-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={`auto (from v${currentVersion})`} />
              </div>
              <div>
                <label htmlFor="pv-review" className="text-sm font-medium">Next review</label>
                <Input id="pv-review" type="date" value={nextReview} onChange={(e) => setNextReview(e.target.value)} />
              </div>
            </div>
            <p className="text-[11px] text-[var(--cs-text-gentle)]">
              The current text is preserved as a superseded version before the update applies — history is append-only.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={record.isPending}>
                {record.isPending ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Recording…</> : "Record version"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
