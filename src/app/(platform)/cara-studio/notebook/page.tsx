"use client";

// CARA STUDIO — /cara-studio/notebook (pick a child's notebook)
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import { PageShell } from "@/components/layout/page-shell";
import { NotebookPen } from "lucide-react";

interface ChildRow { id: string; first_name?: string; preferred_name?: string; full_name?: string; last_name?: string }

function nameOf(c: ChildRow): string {
  return c.full_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.preferred_name || c.first_name || c.id;
}

export default function NotebookIndexPage() {
  const q = useQuery({
    queryKey: ["young-people", "current"],
    queryFn: () => api.get<{ data: ChildRow[] }>("/young-people?status=current"),
  });
  const children = q.data?.data ?? [];

  return (
    <PageShell title="Child Notebooks" subtitle="Open a child's notebook — a deterministic whole-child briefing from their own records, no uploads">
      {q.isLoading && <p className="text-sm text-[var(--cs-text-muted)]">Loading children…</p>}
      {q.isError && <p className="text-sm text-red-700">Couldn’t load the children list.</p>}
      {!q.isLoading && children.length === 0 && <p className="text-sm text-[var(--cs-text-muted)]">No current children on file.</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {children.map((c) => (
          <Link key={c.id} href={`/cara-studio/notebook/${encodeURIComponent(c.id)}`} className="group flex items-center gap-3 rounded-xl border border-[var(--cs-border)] bg-white p-4 hover:border-[var(--cs-teal)] hover:shadow-sm">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--cs-bg)] text-[var(--cs-teal)]"><NotebookPen className="h-5 w-5" /></span>
            <span>
              <span className="block text-sm font-semibold text-[var(--cs-navy)]">{nameOf(c)}</span>
              <span className="block text-[11px] text-[var(--cs-text-muted)] group-hover:text-[var(--cs-teal)]">Open notebook →</span>
            </span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
