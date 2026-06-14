"use client";

// CARA STUDIO — /cara-studio/children/[childId]  (the child's learning workspace)
import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { OutputView, type CaraApiResult } from "@/components/cara-studio/studio-bits";
import { ProfileEditor } from "@/components/cara-studio/profile-editor";
import { Sparkles, LineChart } from "lucide-react";
import type { CaraSavedOutput, CaraChildLearningProfile } from "@/lib/cara-studio/cara-types";

interface ChildWorkspace {
  child: { id: string; name: string; preferred_name: string | null };
  learning_profile: CaraChildLearningProfile | null;
  curriculum: CaraSavedOutput[];
  sessions: CaraSavedOutput[];
  materials: CaraSavedOutput[];
  conversations: CaraSavedOutput[];
  incident_learning: CaraSavedOutput[];
  adaptations: CaraSavedOutput[];
  review_notes: { id: string; title: string; note: string | null; by: string | null; at: string | null }[];
}

const TABS = ["Learning Profile", "Curriculum", "Sessions", "Materials", "Conversations", "Incident Learning", "Progress", "Review Notes"] as const;

export default function CaraChildPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = use(params);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Learning Profile");
  const { data, isLoading } = useQuery<ChildWorkspace>({
    queryKey: ["cara-child", childId],
    queryFn: async () => (await (await fetch(`/api/cara/child/${childId}`)).json()).data,
  });

  const lists: Record<string, CaraSavedOutput[]> = data
    ? { Curriculum: data.curriculum, Sessions: data.sessions, Materials: data.materials, Conversations: data.conversations, "Incident Learning": data.incident_learning }
    : {};

  return (
    <PageShell title={data ? `${data.child.name} — Cara workspace` : "Cara workspace"} subtitle="Learning profile, pathways, sessions, materials and conversations — the living evidence trail of purposeful work" quickCreateContext={{ module: "dashboard" }}>
      {isLoading && <p className="text-sm text-[var(--cs-text-muted)]">Loading…</p>}
      {data && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${tab === t ? "border-[var(--cs-navy)] bg-[var(--cs-navy)] text-white" : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)] hover:bg-[var(--cs-bg)]"}`}>
                {t}{t in lists ? ` (${lists[t].length})` : ""}
              </button>
            ))}
          </div>

          {tab === "Learning Profile" && (
            <ProfileEditor
              key={data.learning_profile?.updated_at ?? "new"}
              childId={childId}
              profile={data.learning_profile}
              childName={data.child.preferred_name || data.child.name.split(" ")[0]}
            />
          )}

          {tab === "Progress" && <ProgressView data={data} />}

          {tab in lists && (
            lists[tab].length === 0 ? (
              <p className="text-sm text-[var(--cs-text-muted)]">Nothing here yet — generate one from the Cara Studio dashboard.</p>
            ) : (
              <div className="space-y-3">
                {lists[tab].map((o) => <SavedOutputCard key={o.id} o={o} />)}
              </div>
            )
          )}

          {tab === "Review Notes" && (
            data.review_notes.length === 0 ? <p className="text-sm text-[var(--cs-text-muted)]">No manager review notes yet.</p> : (
              <div className="space-y-2">
                {data.review_notes.map((n) => (
                  <div key={n.id} className="rounded-xl border border-[var(--cs-border)] bg-white p-4 text-sm">
                    <p className="font-semibold text-[var(--cs-navy)]">{n.title}</p>
                    <p className="mt-1 text-[var(--cs-text-secondary)]">{n.note}</p>
                    <p className="mt-1 text-xs text-[var(--cs-text-muted)]">{n.by} · {n.at ? new Date(n.at).toLocaleString("en-GB") : ""}</p>
                  </div>
                ))}
              </div>
            )
          )}

          <p className="text-xs text-[var(--cs-text-muted)]">
            Create something new for this child: <Link className="font-semibold text-[var(--cs-teal-strong)] hover:underline" href="/cara-studio/session/new">session</Link> · <Link className="font-semibold text-[var(--cs-teal-strong)] hover:underline" href="/cara-studio/materials/new">material</Link> · <Link className="font-semibold text-[var(--cs-teal-strong)] hover:underline" href="/cara-studio/conversation/new">conversation</Link> · <Link className="font-semibold text-[var(--cs-teal-strong)] hover:underline" href="/cara-studio/curriculum/new">curriculum</Link>
          </p>
        </div>
      )}
    </PageShell>
  );
}

function ProgressView({ data }: { data: ChildWorkspace }) {
  const all: CaraSavedOutput[] = [
    ...data.curriculum, ...data.sessions, ...data.materials,
    ...data.conversations, ...data.incident_learning, ...data.adaptations,
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));

  const counts = [
    { label: "Sessions planned", n: data.sessions.length },
    { label: "Materials created", n: data.materials.length },
    { label: "Conversations prepared", n: data.conversations.length },
    { label: "Incidents → learning", n: data.incident_learning.length },
    { label: "Approved by a manager", n: all.filter((o) => o.manager_review_status === "approved").length },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {counts.map((c) => (
          <div key={c.label} className="rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2.5 text-center shadow-[var(--cs-shadow-card)]">
            <p className="text-xl font-extrabold text-[var(--cs-navy)]">{c.n}</p>
            <p className="mt-0.5 text-[11px] font-medium text-[var(--cs-text-muted)]">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--cs-navy)]"><LineChart className="h-4 w-4" /> The evidence trail — most recent first</h3>
        {all.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--cs-text-muted)]">Nothing yet — every session, material and conversation created for this child will build the trail here.</p>
        ) : (
          <ol className="mt-3 space-y-2 border-l-2 border-[var(--cs-border)] pl-4">
            {all.slice(0, 25).map((o) => (
              <li key={o.id} className="relative">
                <span className="absolute -left-[1.35rem] top-1.5 h-2 w-2 rounded-full bg-[var(--cs-teal)]" />
                <p className="text-sm font-semibold text-[var(--cs-navy)]">{o.title}</p>
                <p className="text-xs text-[var(--cs-text-muted)]">
                  {o.module.replace(/_/g, " ")} · {new Date(o.created_at).toLocaleDateString("en-GB")} · {o.manager_review_status === "approved" ? "approved" : o.manager_review_status === "review_required" ? "awaiting review" : o.status}
                  {o.llm_used ? " · Cara-enriched" : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-[11px] text-[var(--cs-text-muted)]">
          Progress is measured from {data.child.preferred_name || data.child.name.split(" ")[0]}&rsquo;s starting point — purposeful, reviewed work over time, not a score.
        </p>
      </div>
    </div>
  );
}

function SavedOutputCard({ o }: { o: CaraSavedOutput }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4 shadow-[var(--cs-shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><Sparkles className="h-3.5 w-3.5 text-[var(--cs-cara-gold)]" /> {o.title}</p>
          <p className="text-xs text-[var(--cs-text-muted)]">{new Date(o.created_at).toLocaleString("en-GB")} · {o.status}{o.manager_review_status === "review_required" ? " · awaiting manager review" : o.manager_review_status === "approved" ? " · approved" : ""}</p>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="rounded-lg border border-[var(--cs-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--cs-navy)] hover:bg-[var(--cs-bg)]">{open ? "Close" : "Open"}</button>
      </div>
      {open && (
        <div className="mt-3 border-t border-[var(--cs-border)] pt-3">
          <OutputView result={{ id: o.id, title: o.title, manager_review_status: o.manager_review_status, manager_review_reasons: o.manager_review_reasons, guardrails: { severity: o.guardrail_severity, flags: o.guardrail_flags }, blocked: false, review_banner: o.manager_review_status === "review_required" ? "This resource should be reviewed by a manager before use." : null, blocked_message: null, output: o.output as Record<string, unknown> } as CaraApiResult} />
        </div>
      )}
    </div>
  );
}
