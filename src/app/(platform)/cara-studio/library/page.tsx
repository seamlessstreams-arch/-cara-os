"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — /cara-studio/library  (resource library: ingest → approve → use)
//
// The RAG-readiness loop, closed: staff add resources as drafts, a manager
// (never the author) approves them, and from that moment the context builder
// prefers them in every matching generation. Honest badging throughout.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Labelled, TextInput, TextArea } from "@/components/cara-studio/studio-bits";
import { BookOpen, CheckCircle2, CircleDashed, Plus, ShieldCheck, Undo2 } from "lucide-react";
import type { CaraLibraryResource } from "@/lib/cara-studio/cara-types";

export default function CaraLibraryPage() {
  const qc = useQueryClient();
  const { data } = useQuery<{ resources: CaraLibraryResource[] }>({
    queryKey: ["cara-library"],
    queryFn: async () => (await (await fetch("/api/cara/library")).json()).data,
  });
  const [filter, setFilter] = useState<"all" | "approved" | "draft">("all");
  const [showForm, setShowForm] = useState(false);
  const resources = (data?.resources ?? []).filter((r) => (filter === "all" ? true : filter === "approved" ? r.approved : !r.approved));

  const approve = useMutation({
    mutationFn: async (p: { id: string; approved: boolean }) => {
      const res = await fetch(`/api/cara/library/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": "staff_olivia", "x-user-role": "registered_manager" },
        body: JSON.stringify({ approved: p.approved }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Approval failed");
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cara-library"] }),
  });

  return (
    <PageShell title="Cara Resource Library" subtitle="Add your home's own resources, get them approved, and Cara prefers them in every matching generation" quickCreateContext={{ module: "dashboard" }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["all", "approved", "draft"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === f ? "border-[var(--cs-navy)] bg-[var(--cs-navy)] text-white" : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)]"}`}>{f}</button>
          ))}
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cs-navy)] px-3 py-2 text-xs font-bold text-white hover:bg-[var(--cs-navy-soft)]">
          <Plus className="h-3.5 w-3.5" /> {showForm ? "Close" : "Add resource"}
        </button>
      </div>

      {showForm && <AddResourceForm onDone={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ["cara-library"] }); }} />}

      <div className="grid gap-4 md:grid-cols-2">
        {resources.map((r) => (
          <div key={r.id} className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
            <div className="flex items-start justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><BookOpen className="h-4 w-4 shrink-0 text-[var(--cs-teal-strong)]" /> {r.title}</h3>
              {r.approved
                ? <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Approved</span>
                : <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700"><CircleDashed className="h-3 w-3" /> Draft</span>}
            </div>
            <p className="mt-1 text-xs text-[var(--cs-text-muted)]">{r.domain} · ages {r.age_range} · {r.resource_type.replace(/_/g, " ")} · {r.source_type}{r.approved && r.approved_by ? ` · approved by ${r.approved_by}` : ""}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--cs-text-secondary)]">{r.content}</p>
            {(r.send_tags.length > 0 || r.trauma_tags.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...r.send_tags, ...r.trauma_tags].map((t) => <span key={t} className="rounded-full bg-[var(--cs-bg)] px-2 py-0.5 text-[10px] text-[var(--cs-text-muted)]">{t.replace(/_/g, " ")}</span>)}
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              {r.approved ? (
                <button onClick={() => approve.mutate({ id: r.id, approved: false })} className="inline-flex items-center gap-1 rounded-lg border border-[var(--cs-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--cs-navy)] hover:bg-[var(--cs-bg)]"><Undo2 className="h-3 w-3" /> Withdraw approval</button>
              ) : (
                <button onClick={() => approve.mutate({ id: r.id, approved: true })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"><ShieldCheck className="h-3 w-3" /> Approve (manager)</button>
              )}
            </div>
          </div>
        ))}
        {resources.length === 0 && <p className="text-sm text-[var(--cs-text-muted)]">No resources in this view yet.</p>}
      </div>
      {approve.isError && <p className="mt-3 text-xs text-red-600">{approve.error.message}</p>}
      <p className="mt-6 text-[11px] text-[var(--cs-text-muted)]">
        Approval is a human decision — managers and deputies only, and never the resource&rsquo;s own author. Only approved
        resources are preferred by Cara&rsquo;s generators; everything else is clearly an AI/deterministic draft for review.
      </p>
    </PageShell>
  );
}

function AddResourceForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("activity_pack");
  const [domain, setDomain] = useState("");
  const [ages, setAges] = useState("10-17");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/cara/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, resource_type: type, domain, age_range: ages,
          send_tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          trauma_tags: [],
          content, source: source || "Staff-added",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't add the resource");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add the resource");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-5 space-y-3 rounded-2xl border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)]/30 p-5">
      <p className="text-xs text-[var(--cs-text-secondary)]">New resources arrive as <span className="font-semibold">drafts</span> — a manager (not you) approves them before Cara starts preferring them.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Labelled label="Title"><TextInput value={title} onChange={setTitle} placeholder="e.g. Online safety conversation cards" /></Labelled>
        <Labelled label="Type"><TextInput value={type} onChange={setType} placeholder="activity_pack / scenario_cards / guide" /></Labelled>
        <Labelled label="Domain"><TextInput value={domain} onChange={setDomain} placeholder="e.g. Digital safety" /></Labelled>
        <Labelled label="Age range"><TextInput value={ages} onChange={setAges} /></Labelled>
        <Labelled label="SEND tags (comma separated)"><TextInput value={tags} onChange={setTags} placeholder="low_literacy, visual" /></Labelled>
        <Labelled label="Source"><TextInput value={source} onChange={setSource} placeholder="e.g. Therapeutic lead / NSPCC adaptation" /></Labelled>
      </div>
      <Labelled label="What it contains (summary staff will see)"><TextArea value={content} onChange={setContent} rows={3} /></Labelled>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button onClick={submit} disabled={busy} className="rounded-xl bg-[var(--cs-navy)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--cs-navy-soft)] disabled:opacity-60">
        {busy ? "Adding…" : "Add as draft"}
      </button>
    </div>
  );
}
