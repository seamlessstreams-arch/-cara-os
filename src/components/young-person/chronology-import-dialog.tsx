"use client";

// CARA — Chronology import dialog.
// Paste a prior-placement / LA chronology → Cara parses it to the platform
// format → preview & edit → import. Imported entries merge into the live
// chronology by date automatically. Deterministic parse (works with no AI key);
// nothing is saved until the user confirms the preview.

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import { X, Sparkles, Trash2, CheckCircle2, FileUp } from "lucide-react";
import type { ParsedChronologyEntry, ChronologyParseResult } from "@/lib/chronology/chronology-import";

const CAT_LABEL: Record<string, string> = {
  placement: "Placement", incident: "Incident", missing: "Missing", safeguarding: "Safeguarding",
  health: "Health", education: "Education", contact: "Contact", legal: "Legal", review: "Review",
  behaviour: "Behaviour", other: "Other",
};
const SEV_DOT: Record<string, string> = {
  critical: "bg-[var(--cs-risk)]", significant: "bg-[var(--cs-warning)]", routine: "bg-[var(--cs-border)]",
};

const PLACEHOLDER = `Paste the prior chronology here, one event per line, e.g.

12/03/2022 - Became looked after; moved to first foster placement
2023-01-05: Started at Oakwood Primary School
3 June 2023 — Went missing for 6 hours; police informed; return interview completed
14/09/2023 Supervised contact with mother re-established`;

export function ChronologyImportDialog({
  childId,
  childName,
  open,
  onClose,
}: {
  childId: string;
  childName: string;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sourceLabel, setSourceLabel] = useState("Imported — prior chronology");
  const [preview, setPreview] = useState<ChronologyParseResult | null>(null);
  const [entries, setEntries] = useState<ParsedChronologyEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ saved: number; skipped: number } | null>(null);

  if (!open) return null;

  const reset = () => {
    setText(""); setPreview(null); setEntries([]); setError(null); setDone(null);
  };
  const close = () => { reset(); onClose(); };

  async function doParse() {
    setBusy(true); setError(null);
    try {
      const r = await api.post<{ data: ChronologyParseResult }>(`/young-people/${childId}/chronology/import`, { mode: "preview", text });
      setPreview(r.data);
      setEntries(r.data.entries);
      if (r.data.entries.length === 0) setError("No dated events found. Make sure each event starts with a date.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function doImport() {
    setBusy(true); setError(null);
    try {
      const r = await api.post<{ data: { saved: number; skipped: number } }>(`/young-people/${childId}/chronology/import`, {
        mode: "commit",
        entries,
        source_label: sourceLabel,
      });
      setDone(r.data);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["child-chronology", childId] }),
        qc.invalidateQueries({ queryKey: ["chronology-entries"] }),
      ]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={close} />
      <div className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-[var(--cs-surface-elevated)] shadow-[var(--cs-shadow-card)]">
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]">
            <FileUp className="h-4 w-4 text-[var(--cs-teal)]" /> Import chronology — {childName}
          </h2>
          <button onClick={close} className="rounded-lg p-1 text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)]"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-5 py-4">
          {/* ── Done ── */}
          {done ? (
            <div className="space-y-3 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--cs-success)]" />
              <p className="text-sm font-semibold text-[var(--cs-navy)]">{done.saved} entr{done.saved === 1 ? "y" : "ies"} imported</p>
              <p className="text-xs text-[var(--cs-text-secondary)]">
                {done.skipped > 0 ? `${done.skipped} already present and skipped. ` : ""}
                They have merged into {childName}&apos;s chronology by date — pre-placement history now sits in the timeline.
              </p>
              <div className="flex justify-center gap-2">
                <button onClick={reset} className="rounded-xl border border-[var(--cs-border)] px-4 py-2 text-sm font-semibold text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]">Import more</button>
                <button onClick={close} className="rounded-xl bg-[var(--cs-navy)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Done</button>
              </div>
            </div>
          ) : preview ? (
            /* ── Preview ── */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--cs-navy)]">{entries.length} event{entries.length === 1 ? "" : "s"} parsed</p>
                <button onClick={() => { setPreview(null); setEntries([]); }} className="text-xs font-semibold text-[var(--cs-teal)] hover:underline">← Edit text</button>
              </div>
              {preview.unparsed.length > 0 && (
                <p className="rounded-lg bg-[var(--cs-surface)] px-3 py-2 text-xs text-[var(--cs-text-muted)]">
                  {preview.unparsed.length} line{preview.unparsed.length === 1 ? "" : "s"} had no recognisable date and were skipped (e.g. headings). Add a date to include them.
                </p>
              )}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--cs-text-secondary)]">Source label</label>
                <input value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} className="w-full rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-3 py-2 text-sm text-[var(--cs-navy)] outline-none focus-visible:border-[var(--cs-teal)]" />
              </div>
              <div className="max-h-[46vh] space-y-1.5 overflow-y-auto">
                {entries.map((e, i) => (
                  <div key={`${e.date}_${i}`} className="flex items-start gap-2 rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] px-3 py-2">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEV_DOT[e.significance]}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold tabular-nums text-[var(--cs-text-gentle)]">{e.date}</span>
                        <span className="rounded-full bg-[var(--cs-surface)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">{CAT_LABEL[e.category] ?? e.category}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-[var(--cs-navy)]">{e.title}</p>
                    </div>
                    <button onClick={() => setEntries((prev) => prev.filter((_, j) => j !== i))} className="shrink-0 text-[var(--cs-text-muted)] hover:text-[var(--cs-risk)]" title="Remove">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              {error && <p className="text-sm text-[var(--cs-warning)]">{error}</p>}
              <button onClick={doImport} disabled={busy || entries.length === 0} className="w-full rounded-xl bg-[var(--cs-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {busy ? "Importing…" : `Import ${entries.length} entr${entries.length === 1 ? "y" : "ies"}`}
              </button>
            </div>
          ) : (
            /* ── Input ── */
            <div className="space-y-3">
              <p className="text-sm text-[var(--cs-text-secondary)]">
                Paste the chronology from {childName}&apos;s prior placement or local authority. Cara converts each dated line into a chronology entry, infers the category and significance, and merges it into the timeline by date — so pre-placement history sits alongside everything recorded since.
              </p>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--cs-text-secondary)]">Source label</label>
                <input value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} placeholder="e.g. Imported — Derby City Council chronology" className="w-full rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-3 py-2 text-sm text-[var(--cs-navy)] outline-none focus-visible:border-[var(--cs-teal)]" />
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                placeholder={PLACEHOLDER}
                className="w-full rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-3 py-2 font-mono text-xs leading-relaxed text-[var(--cs-navy)] outline-none focus-visible:border-[var(--cs-teal)]"
              />
              {error && <p className="text-sm text-[var(--cs-warning)]">{error}</p>}
              <button onClick={doParse} disabled={busy || text.trim().length < 8} className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--cs-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                <Sparkles className="h-3.5 w-3.5" /> {busy ? "Parsing…" : "Parse with Cara"}
              </button>
              <p className="text-xs text-[var(--cs-text-gentle)]">Cara parses this on-device rules first; you preview and confirm before anything is saved. Nothing is sent externally.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
