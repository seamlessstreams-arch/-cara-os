"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO NOTEBOOK — the child workspace view
//
// A notebook for one child: the record spine as "sources" (left), a document
// canvas (centre) that renders real, sectioned, provenance-bearing outputs, and
// a Studio rail (right) of outputs. Self-contained — it does not import the
// shared OutputView, so it is free to be a proper document rather than an object
// dump. Each output is fetched LIVE-SAFELY and only when selected.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/hooks/use-api";
import { PageShell } from "@/components/layout/page-shell";
import { Link2, Network, NotebookPen, ShieldCheck, Sparkles, Waypoints } from "lucide-react";
import type { NotebookBriefing, BriefingSignal } from "@/lib/cara-studio/notebook/notebook-briefing";
import type { RelationalTimeline, RelationalMoment } from "@/lib/relational-timeline/relational-timeline-engine";
import type { NotebookMindMap, MindMapGroupKey } from "@/lib/cara-studio/notebook/notebook-mindmap";
import type { OutcomeIntelligence } from "@/lib/outcome-intelligence/outcome-intelligence-engine";

type View = "briefing" | "timeline" | "mindmap" | "outcomes";

const SEV: Record<BriefingSignal["severity"], string> = { crit: "bg-red-500", warn: "bg-amber-500", good: "bg-emerald-500" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function shortDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return y && m && d ? `${d} ${MONTHS[m - 1]}` : iso;
}

// ── shared bits ──
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

// ── briefing output ──
function BriefingDoc({ b }: { b: NotebookBriefing }) {
  return (
    <>
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[var(--cs-teal)]"><NotebookPen className="h-3.5 w-3.5" /> Whole-child briefing</div>
      <h1 className="mt-2 text-2xl font-bold leading-tight text-[var(--cs-navy)] sm:text-3xl" style={{ textWrap: "balance" }}>{b.headline}</h1>
      <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{b.windowLabel}</p>

      <Section title="What needs you">
        {b.needsYou.length ? (
          <ul className="space-y-2.5">
            {b.needsYou.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5"><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm ${SEV[s.severity]}`} /><span className="text-sm leading-relaxed text-[var(--cs-text)]">{s.text}<Prov items={s.provenance} /></span></li>
            ))}
          </ul>
        ) : <Muted>Nothing flagged for your attention in this window.</Muted>}
      </Section>

      {b.working.length > 0 && (
        <Section title="What's working">
          <ul className="space-y-2.5">
            {b.working.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5"><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm ${SEV[s.severity]}`} /><span className="text-sm leading-relaxed text-[var(--cs-text)]">{s.text}<Prov items={s.provenance} /></span></li>
            ))}
          </ul>
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
  );
}

// ── timeline output ──
const LENS: Record<RelationalMoment["lens"], { dot: string; label: string }> = {
  connection: { dot: "bg-[var(--cs-teal)]", label: "connection" },
  repair: { dot: "bg-emerald-500", label: "repair" },
  breakthrough: { dot: "bg-sky-500", label: "breakthrough" },
  achievement: { dot: "bg-amber-500", label: "achievement" },
  rupture: { dot: "bg-red-500", label: "rupture" },
  reunion: { dot: "bg-indigo-500", label: "reunion" },
  voice: { dot: "bg-violet-500", label: "voice" },
};
const STATUS_PILL: Record<RelationalTimeline["stability"]["status"], string> = {
  secure: "bg-emerald-100 text-emerald-700",
  developing: "bg-amber-100 text-amber-700",
  fragile: "bg-red-100 text-red-700",
};

function TimelineDoc({ t }: { t: RelationalTimeline }) {
  const st = t.stability;
  const top = st.keyConnectors[0];
  return (
    <>
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[var(--cs-teal)]"><Waypoints className="h-3.5 w-3.5" /> Relational timeline</div>
      <h1 className="mt-2 text-2xl font-bold leading-tight text-[var(--cs-navy)] sm:text-3xl" style={{ textWrap: "balance" }}>{t.childName} &amp; the people around them</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-[var(--cs-text-secondary)]">
        <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${STATUS_PILL[st.status]}`}>{st.status}</span>
        <span className="font-mono text-[11px] text-[var(--cs-text-muted)]">{st.connectionCount} connection · {st.repairCount} repair · {st.ruptureCount} rupture</span>
        {top && <span>· most connection with <b className="text-[var(--cs-navy)]">{top.name}</b></span>}
      </div>
      <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{st.statusReason}</p>

      {t.moments.length ? (
        <ol className="mt-5 space-y-0 border-l-2 border-[var(--cs-border)] pl-5">
          {t.moments.map((m) => (
            <li key={m.id} className="relative pb-5">
              <span className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-2 ring-white ${LENS[m.lens].dot}`} />
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-[var(--cs-text-muted)]">{shortDate(m.date)}</span>
                <span className="rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-[var(--cs-text-secondary)] ring-1 ring-[var(--cs-border)]">{LENS[m.lens].label}</span>
              </div>
              <div className="mt-0.5 text-sm font-semibold text-[var(--cs-navy)]">{m.title}</div>
              {m.detail && <p className="mt-0.5 line-clamp-3 max-w-[62ch] text-[13px] leading-relaxed text-[var(--cs-text)]">{m.detail}</p>}
              {m.childVoice && <p className="mt-1 max-w-[60ch] border-l-2 border-[var(--cs-teal)]/40 pl-2 text-[13px] italic text-[var(--cs-text-secondary)]">“{m.childVoice}”</p>}
              <span className="mt-1 inline-flex items-center gap-1 rounded border border-[var(--cs-teal)]/35 bg-[var(--cs-teal)]/8 px-1.5 py-0.5 font-mono text-[10px] text-[var(--cs-teal)]"><Link2 className="h-2.5 w-2.5" /> {m.source}</span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-[var(--cs-border)] p-5 text-center">
          <Muted>No relational moments on file yet — they appear here as key-work, incidents, missing episodes, education and reviews are recorded.</Muted>
        </div>
      )}
      <p className="mt-4 text-[11px] text-[var(--cs-text-muted)]">A pure projection of records this child already has — connection, repair and rupture re-told through a relational lens. Nothing is stored or invented.</p>
    </>
  );
}

const MAP_ACCENT: Record<MindMapGroupKey, { border: string; text: string }> = {
  people: { border: "border-[var(--cs-teal)]", text: "text-[var(--cs-teal)]" },
  risks: { border: "border-red-400", text: "text-red-600" },
  strengths: { border: "border-emerald-400", text: "text-emerald-600" },
  services: { border: "border-amber-400", text: "text-amber-600" },
};

function MindMapDoc({ m }: { m: NotebookMindMap }) {
  return (
    <>
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[var(--cs-teal)]"><Network className="h-3.5 w-3.5" /> Mind map</div>
      <h1 className="mt-2 text-2xl font-bold leading-tight text-[var(--cs-navy)] sm:text-3xl" style={{ textWrap: "balance" }}>{m.childName}&rsquo;s world, mapped from the record</h1>
      <div className="mx-auto my-5 w-fit rounded-full bg-[var(--cs-navy)] px-5 py-2 text-center text-sm font-bold text-white">{m.childName}</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {m.groups.map((g) => (
          <div key={g.key} className={`rounded-xl border-l-4 bg-[var(--cs-bg)]/40 p-3.5 ${MAP_ACCENT[g.key].border}`}>
            <div className={`mb-2 text-[11px] font-bold uppercase tracking-wide ${MAP_ACCENT[g.key].text}`}>{g.label}</div>
            {g.nodes.length ? (
              <ul className="flex flex-wrap gap-1.5">
                {g.nodes.map((n, i) => (
                  <li key={i} className="rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1.5 text-[12.5px] text-[var(--cs-text)]">
                    {n.label}{n.sub ? <span className="ml-1 text-[10.5px] text-[var(--cs-text-muted)]">· {n.sub}</span> : null}
                  </li>
                ))}
              </ul>
            ) : <p className="text-[12px] text-[var(--cs-text-muted)]">None on file.</p>}
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-[var(--cs-text-muted)]">{m.note}</p>
    </>
  );
}

// ── outcomes & evidence output ──
const OC_STATUS: Record<string, string> = {
  on_track: "bg-emerald-100 text-emerald-700",
  progressing: "bg-amber-100 text-amber-700",
  needs_focus: "bg-red-100 text-red-700",
};
const OC_DIR: Record<string, string> = { improving: "↑ improving", stable: "→ stable", declining: "↓ declining" };
const unslug = (v: string) => v.replace(/_/g, " ");

function OutcomesDoc({ oc }: { oc: OutcomeIntelligence }) {
  return (
    <>
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[var(--cs-teal)]"><ShieldCheck className="h-3.5 w-3.5" /> Outcomes &amp; evidence</div>
      <h1 className="mt-2 text-2xl font-bold leading-tight text-[var(--cs-navy)] sm:text-3xl" style={{ textWrap: "balance" }}>Outcomes &amp; evidence for {oc.childName}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-[var(--cs-text-secondary)]">
        <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${OC_STATUS[oc.overallStatus] ?? "bg-[var(--cs-bg)] text-[var(--cs-text-secondary)]"}`}>{unslug(oc.overallStatus)}</span>
        <span className="font-mono text-[11px] text-[var(--cs-text-muted)]">{OC_DIR[oc.overallTrajectory] ?? oc.overallTrajectory}</span>
      </div>
      <p className="mt-1 max-w-[64ch] text-sm text-[var(--cs-text-secondary)]">{oc.headline}</p>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {oc.domains.map((d) => (
          <div key={d.key} className="rounded-xl border border-[var(--cs-border)] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[var(--cs-navy)]">{d.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${OC_STATUS[d.status] ?? "bg-[var(--cs-bg)] text-[var(--cs-text-secondary)]"}`}>{unslug(d.status)}</span>
            </div>
            <div className="mt-0.5 font-mono text-[10.5px] text-[var(--cs-text-muted)]">{OC_DIR[d.direction] ?? d.direction}</div>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--cs-text)]">{d.headline}</p>
            {d.metrics.length > 0 && (
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {d.metrics.map((mt, i) => (
                  <li key={i} className="rounded border border-[var(--cs-border)] bg-[var(--cs-bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--cs-text-secondary)]">{mt.label}: {mt.value}</li>
                ))}
              </ul>
            )}
            {!d.hasEvidence && <p className="mt-1.5 text-[11px] text-[var(--cs-text-muted)]">No evidence on file yet for this area.</p>}
          </div>
        ))}
      </div>
      {oc.insights.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {oc.insights.map((ins) => (
            <li key={ins.key} className="flex items-start gap-2 text-[13px] text-[var(--cs-text-secondary)]">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ins.tone === "positive" ? "bg-emerald-500" : ins.tone === "gap" ? "bg-red-500" : "bg-amber-500"}`} />
              {ins.text}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-[11px] text-[var(--cs-text-muted)]">Outcome areas with direction and evidence — never a grade, no false red. The child-level evidence that underpins Reg 44 and inspection.</p>
    </>
  );
}

const COMING = [
  { icon: "💬", t: "Ask (grounded)", d: "Q&A labelled fact / account / analysis" },
];

export function NotebookView({ childId, childName }: { childId: string; childName?: string }) {
  const [view, setView] = useState<View>("briefing");

  const briefingQ = useQuery({
    queryKey: ["cara-notebook", childId],
    queryFn: () => api.get<{ data: { briefing: NotebookBriefing } }>(`/api/cara/notebook/${encodeURIComponent(childId)}`),
  });
  const timelineQ = useQuery({
    queryKey: ["cara-notebook-timeline", childId],
    queryFn: () => api.get<{ data: { timeline: RelationalTimeline } }>(`/api/cara/notebook/${encodeURIComponent(childId)}/timeline`),
    enabled: view === "timeline",
  });
  const mindmapQ = useQuery({
    queryKey: ["cara-notebook-mindmap", childId],
    queryFn: () => api.get<{ data: { mindmap: NotebookMindMap } }>(`/api/cara/notebook/${encodeURIComponent(childId)}/mindmap`),
    enabled: view === "mindmap",
  });
  const outcomesQ = useQuery({
    queryKey: ["cara-notebook-outcomes", childId],
    queryFn: () => api.get<{ data: { outcomes: OutcomeIntelligence } }>(`/api/cara/notebook/${encodeURIComponent(childId)}/outcomes`),
    enabled: view === "outcomes",
  });
  const b = briefingQ.data?.data.briefing;
  const t = timelineQ.data?.data.timeline;
  const mm = mindmapQ.data?.data.mindmap;
  const oc = outcomesQ.data?.data.outcomes;
  const active = view === "briefing" ? briefingQ : view === "timeline" ? timelineQ : view === "mindmap" ? mindmapQ : outcomesQ;

  return (
    <PageShell title={childName ? `${childName} — Notebook` : b ? `${b.firstName} — Notebook` : "Child Notebook"} subtitle="Deterministic whole-child intelligence · no uploads · every line cites the record">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)_210px]">

        {/* Sources rail */}
        <aside className="rounded-xl border border-[var(--cs-border)] bg-white">
          <div className="border-b border-[var(--cs-border)] px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Sources</div>
          <p className="border-b border-[var(--cs-border)] px-3.5 py-2.5 text-[11px] leading-relaxed text-[var(--cs-text-secondary)]">The notebook <b className="text-[var(--cs-teal)]">is</b> the child — every record is already here, nothing to upload.</p>
          <ul className="p-2">
            {(b?.sources ?? []).map((src) => (
              <li key={src.label} className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] text-[var(--cs-text)] hover:bg-[var(--cs-bg)]">
                <span>{src.label}</span><span className="font-mono text-[11px] text-[var(--cs-text-muted)]">{src.count}</span>
              </li>
            ))}
            {b && b.sources.length === 0 && <li className="px-2.5 py-2 text-[12px] text-[var(--cs-text-muted)]">No records on file yet.</li>}
          </ul>
        </aside>

        {/* Document canvas */}
        <section className="min-w-0">
          <article className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-sm sm:p-8">
            {active.isLoading && <p className="text-sm text-[var(--cs-text-muted)]">Reading the record…</p>}
            {active.isError && <p className="text-sm text-red-700">Couldn’t load this output. The child may not be on file.</p>}
            {view === "briefing" && b && <BriefingDoc b={b} />}
            {view === "timeline" && t && <TimelineDoc t={t} />}
            {view === "mindmap" && mm && <MindMapDoc m={mm} />}
            {view === "outcomes" && oc && <OutcomesDoc oc={oc} />}
          </article>
          <p className="mt-2 text-center text-[11px] text-[var(--cs-text-muted)]">Generated deterministically from {childName ? childName + "’s" : "this child’s"} own records.</p>
        </section>

        {/* Studio rail */}
        <aside className="rounded-xl border border-[var(--cs-border)] bg-white">
          <div className="border-b border-[var(--cs-border)] px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Studio</div>
          <div className="p-2">
            <StudioButton active={view === "briefing"} onClick={() => setView("briefing")} icon="📰" title="Whole-child briefing" sub="this fortnight" />
            <StudioButton active={view === "timeline"} onClick={() => setView("timeline")} icon="🪢" title="Relational timeline" sub="connection · repair · rupture" />
            <StudioButton active={view === "mindmap"} onClick={() => setView("mindmap")} icon="🕸" title="Mind map" sub="people · risks · strengths · services" />
            <StudioButton active={view === "outcomes"} onClick={() => setView("outcomes")} icon="🛡" title="Outcomes & evidence" sub="SCCIF areas · for Reg 44" />
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

function StudioButton({ active, onClick, icon, title, sub }: { active: boolean; onClick: () => void; icon: string; title: string; sub: string }) {
  return (
    <button type="button" onClick={onClick} className={`mb-2 block w-full rounded-lg border px-3 py-2.5 text-left ${active ? "border-[var(--cs-teal)] bg-[var(--cs-teal)]/10" : "border-[var(--cs-border)] hover:border-[var(--cs-teal)]"}`}>
      <div className="text-[13px] font-semibold text-[var(--cs-navy)]">{icon} {title}</div>
      <div className="text-[11px] text-[var(--cs-text-secondary)]">{sub}{active ? " · showing now" : ""}</div>
    </button>
  );
}
