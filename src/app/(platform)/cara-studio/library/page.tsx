"use client";

// CARA STUDIO — /cara-studio/library  (resource library, RAG-ready)
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { BookOpen, CheckCircle2, CircleDashed } from "lucide-react";
import type { CaraLibraryResource } from "@/lib/cara-studio/cara-types";

export default function CaraLibraryPage() {
  const { data } = useQuery<{ resources: CaraLibraryResource[] }>({
    queryKey: ["cara-library"],
    queryFn: async () => (await (await fetch("/api/cara/library")).json()).data,
  });
  const [filter, setFilter] = useState<"all" | "approved" | "draft">("all");
  const resources = (data?.resources ?? []).filter((r) => (filter === "all" ? true : filter === "approved" ? r.approved : !r.approved));

  return (
    <PageShell title="Cara Resource Library" subtitle="Approved resources Cara prefers when generating — anything unmatched is clearly marked as an AI draft for professional review" quickCreateContext={{ module: "dashboard" }}>
      <div className="mb-4 flex gap-2">
        {(["all", "approved", "draft"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === f ? "border-[var(--cs-navy)] bg-[var(--cs-navy)] text-white" : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)]"}`}>{f}</button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {resources.map((r) => (
          <div key={r.id} className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
            <div className="flex items-start justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><BookOpen className="h-4 w-4 text-[var(--cs-teal-strong)]" /> {r.title}</h3>
              {r.approved
                ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Approved</span>
                : <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700"><CircleDashed className="h-3 w-3" /> Draft</span>}
            </div>
            <p className="mt-1 text-xs text-[var(--cs-text-muted)]">{r.domain} · ages {r.age_range} · {r.resource_type.replace(/_/g, " ")} · {r.source_type}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{r.content}</p>
            {(r.send_tags.length > 0 || r.trauma_tags.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...r.send_tags, ...r.trauma_tags].map((t) => <span key={t} className="rounded-full bg-[var(--cs-bg)] px-2 py-0.5 text-[10px] text-[var(--cs-text-muted)]">{t.replace(/_/g, " ")}</span>)}
              </div>
            )}
          </div>
        ))}
        {resources.length === 0 && <p className="text-sm text-[var(--cs-text-muted)]">No resources in this view yet.</p>}
      </div>
      <p className="mt-6 text-[11px] text-[var(--cs-text-muted)]">
        Built for future retrieval: resources are tagged by domain, age range, SEND and trauma tags, type and approval status. When the home ingests
        policies, key-work templates and safeguarding guidance here, Cara will retrieve approved items first.
      </p>
    </PageShell>
  );
}
