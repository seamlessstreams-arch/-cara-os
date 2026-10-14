"use client";

// CARA STUDIO — /cara-studio/notebook (home dashboard: who needs me today)
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import { PageShell } from "@/components/layout/page-shell";
import { NotebookPen } from "lucide-react";
import type { NotebookHomeCard } from "@/lib/cara-studio/notebook/notebook-briefing";

const SEV: Record<NotebookHomeCard["severity"], { dot: string; ring: string }> = {
  crit: { dot: "bg-red-500", ring: "border-red-300" },
  warn: { dot: "bg-amber-500", ring: "border-amber-300" },
  good: { dot: "bg-emerald-500", ring: "border-[var(--cs-border)]" },
};

export default function NotebookIndexPage() {
  const q = useQuery({
    queryKey: ["cara-notebook-home"],
    queryFn: () => api.get<{ data: { cards: NotebookHomeCard[] } }>("/api/cara/notebook"),
  });
  const cards = q.data?.data.cards ?? [];
  const needing = cards.filter((c) => c.attention > 0).length;

  return (
    <PageShell title="Child Notebooks" subtitle="Every child's whole-child picture — who needs you today, deterministic and grounded in the records">
      {q.isLoading && <p className="text-sm text-[var(--cs-text-muted)]">Reading the records…</p>}
      {q.isError && <p className="text-sm text-red-700">Couldn’t load the notebooks.</p>}
      {!q.isLoading && cards.length === 0 && <p className="text-sm text-[var(--cs-text-muted)]">No current children on file.</p>}
      {cards.length > 0 && (
        <p className="mb-3 text-[13px] text-[var(--cs-text-secondary)]">
          {needing > 0
            ? <><b className="text-[var(--cs-navy)]">{needing}</b> of {cards.length} {cards.length === 1 ? "child needs" : "children need"} your attention this fortnight.</>
            : <>All {cards.length} {cards.length === 1 ? "child is" : "children are"} settled this fortnight — nothing flagged.</>}
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.childId} href={`/cara-studio/notebook/${encodeURIComponent(c.childId)}`} className={`group rounded-xl border bg-white p-4 hover:border-[var(--cs-teal)] hover:shadow-sm ${SEV[c.severity].ring}`}>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--cs-bg)] text-[var(--cs-teal)]"><NotebookPen className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--cs-navy)]">{c.name}</span>
                <span className="block text-[11px] text-[var(--cs-text-muted)]">{c.sourceCount} {c.sourceCount === 1 ? "record" : "records"} on file</span>
              </span>
              {c.attention > 0
                ? <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--cs-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--cs-navy)]"><span className={`h-2 w-2 rounded-full ${SEV[c.severity].dot}`} />{c.attention}</span>
                : <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" />settled</span>}
            </div>
            <p className="mt-2 line-clamp-2 text-[12.5px] leading-snug text-[var(--cs-text-secondary)]">{c.headline}</p>
            <span className="mt-2 block text-[11px] font-semibold text-[var(--cs-teal)] opacity-0 transition-opacity group-hover:opacity-100">Open notebook →</span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
