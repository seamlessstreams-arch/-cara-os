"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO NOTEBOOK — the child workspace view
//
// A notebook for one child: the record spine as "sources" (left), a document
// canvas (centre) that renders a real, sectioned, provenance-bearing briefing,
// and a Studio rail (right) of outputs. Self-contained — it does not import the
// shared OutputView, so it is free to be a proper document rather than an
// object dump. Fetches the LIVE-SAFE /api/cara/notebook/[childId] briefing.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/hooks/use-api";
import { PageShell } from "@/components/layout/page-shell";
import { Link2, NotebookPen, Sparkles } from "lucide-react";
import type { NotebookBriefing, BriefingSignal } from "@/lib/cara-studio/notebook/notebook-briefing";

const SEV: Record<BriefingSignal["severity"], { dot: string; label: string }> = {
  crit: { dot: "bg-red-500", label: "text-red-700" },
  warn: { dot: "bg-amber-500", label: "text-amber-700" },
  good: { dot: "bg-emerald-500", label: "text-emerald-700" },
};

function Prov({ items }: { items: BriefingSignal["provenance"] }) {
  if (!items.length) return null;
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
      {items.map((p, i) => (
        <span key={i} title="Traces to this record on file" className="inline-flex items-center gap-1 rounded border border-[var(--cs-teal)]/35 bg-[var(--cs-teal)]/8 px-1.5 py-0.5 font-mono text-[10px] text-[var(--cs-teal)]">
          <Link2 className="h-2.5 w-2.5" /> {p.recordType}{p.date ? ` ${shortDate(p.date)}` : ""}
        </span>
      ))}
    </span>
  );
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function shortDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return y && m && d ? `${d} ${MONTHS[m - 1]}` : iso;
}

function SignalList({ signals }: { signals: BriefingSignal[] }) {
  return (
    <ul className="space-y-2.5">
      {signals.map((s, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm ${SEV[s.severity].dot}`} />
          <span className="text-sm leading-relaxed text-[var(--cs-text)]">{s.text}<Prov items={s.provenance} /></span>
        </li>
      ))}
    </ul>
  );
}

// Outputs still to be wired into the notebook (each already has an engine; the
// work is making it live-safe). Shown honestly as upcoming, never as live
// buttons that do nothing.
const COMING = [
  { icon: "🪢", t: "Relational timeline", d: "connection · rupture · repair" },
  { icon: "🕸", t: "Mind map", d: "the child's world as a graph" },
  { icon: "💬", t: "Ask (grounded)", d: "Q&A labelled fact / account / analysis" },
  { icon: "🛡", t: "Reg 44 evidence", d: "SCCIF evidence & gaps" },
];

export function NotebookView({ childId, childName }: { childId: string; childName?: string }) {
  const q = useQuery({
    queryKey: ["cara-notebook", childId],
    queryFn: () => api.get<{ data: { briefing: NotebookBriefing } }>(`/api/cara/notebook/${encodeURIComponent(childId)}`),
  });
  const b = q.data?.data.briefing;

  return (
    <PageShell title={childName ? `${childName} — Notebook` : b ? `${b.firstName} — Notebook` : "Child Notebook"} subtitle="Deterministic whole-child intelligence · no uploads · every line cites the record">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)_210px]">

        {/* Sources rail */}
        <aside className="rounded-xl border border-[var(--cs-border)] bg-white">
          <div className="border-b border-[var(--cs-border)] px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Sources</div>
          <p className="border-b border-[var(--cs-border)] px-3.5 py-2.5 text-[11px] leading-relaxed text-[var(--cs-text-secondary)]">The notebook <b className="text-[var(--cs-teal)]">is</b> the child — every record is already here, nothing to upload.</p>
          <ul className="p-2">
            {(b?.sources ?? []).map((s) => (
              <li key={s.label} className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] text-[var(--cs-text)] hover:bg-[var(--cs-bg)]">
                <span>{s.label}</span><span className="font-mono text-[11px] text-[var(--cs-text-muted)]">{s.count}</span>
              </li>
            ))}
            {b && b.sources.length === 0 && <li className="px-2.5 py-2 text-[12px] text-[var(--cs-text-muted)]">No records on file yet.</li>}
          </ul>
        </aside>

        {/* Document canvas */}
        <section className="min-w-0">
          <article className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-sm sm:p-8">
            {q.isLoading && <p className="text-sm text-[var(--cs-text-muted)]">Reading the record…</p>}
            {q.isError && <p className="text-sm text-red-700">Couldn’t load this notebook. The child may not be on file.</p>}
            {b && (
              <>
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[var(--cs-teal)]"><NotebookPen className="h-3.5 w-3.5" /> Whole-child briefing</div>
                <h1 className="mt-2 text-2xl font-bold leading-tight text-[var(--cs-navy)] sm:text-3xl" style={{ textWrap: "balance" }}>{b.headline}</h1>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{b.windowLabel}</p>

                <Section title="What needs you">
                  {b.needsYou.length ? <SignalList signals={b.needsYou} /> : <Muted>Nothing flagged for your attention in this window.</Muted>}
                </Section>

                {b.working.length > 0 && (
                  <Section title="What's working">
                    <SignalList signals={b.working} />
                  </Section>
                )}

                <div className="mt-6 rounded-lg border-l-[3px] border-[var(--cs-teal)] bg-[var(--cs-teal)]/6 px-4 py-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold text-[var(--cs-teal)]"><Sparkles className="h-3.5 w-3.5" /> What the record doesn’t say</div>
                  {b.gaps.length ? (
                    <ul className="list-disc pl-5 text-[13px] leading-relaxed text-[var(--cs-text-secondary)]">{b.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
                  ) : <Muted>No obvious gaps — the core records are all present.</Muted>}
                  <p className="mt-2 text-[11px] text-[var(--cs-text-muted)]">Cara reports gaps instead of filling them. Every line above traces to a record on file — nothing is inferred or invented.</p>
                </div>
              </>
            )}
          </article>
          <p className="mt-2 text-center text-[11px] text-[var(--cs-text-muted)]">Generated deterministically from {childName ? childName + "'s" : "this child's"} own records.</p>
        </section>

        {/* Studio rail */}
        <aside className="rounded-xl border border-[var(--cs-border)] bg-white">
          <div className="border-b border-[var(--cs-border)] px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Studio</div>
          <div className="p-2">
            <div className="rounded-lg border border-[var(--cs-teal)] bg-[var(--cs-teal)]/10 px-3 py-2.5">
              <div className="text-[13px] font-semibold text-[var(--cs-navy)]">📰 Whole-child briefing</div>
              <div className="text-[11px] text-[var(--cs-text-secondary)]">This fortnight · showing now</div>
            </div>
            <Link href={`/cara-studio/session/new?childId=${encodeURIComponent(childId)}`} className="mt-2 block rounded-lg border border-[var(--cs-border)] px-3 py-2.5 hover:border-[var(--cs-teal)]">
              <div className="text-[13px] font-semibold text-[var(--cs-navy)]">🗂 Session + material</div>
              <div className="text-[11px] text-[var(--cs-text-secondary)]">plan a key-work session →</div>
            </Link>
            <div className="mt-3 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Coming to the notebook</div>
            <ul className="mt-1 space-y-1">
              {COMING.map((c) => (
                <li key={c.t} className="rounded-lg px-3 py-2 text-[12px] text-[var(--cs-text-muted)]">
                  <span className="mr-1">{c.icon}</span><span className="font-medium text-[var(--cs-text-secondary)]">{c.t}</span>
                  <div className="pl-5 text-[10.5px]">{c.d}</div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 border-t border-[var(--cs-border)] pt-4 first:border-t-0">
      <h2 className="mb-2.5 text-lg font-bold text-[var(--cs-navy)]">{title}</h2>
      {children}
    </div>
  );
}
function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--cs-text-muted)]">{children}</p>;
}
