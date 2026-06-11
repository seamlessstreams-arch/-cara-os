"use client";

// CARA STUDIO — /cara-studio/children/[childId]  (the child's learning workspace)
import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { OutputView, type CaraApiResult } from "@/components/cara-studio/studio-bits";
import { Brain, Sparkles } from "lucide-react";
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

const TABS = ["Learning Profile", "Curriculum", "Sessions", "Materials", "Conversations", "Incident Learning", "Review Notes"] as const;

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
            data.learning_profile ? (
              <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><Brain className="h-4 w-4 text-[var(--cs-teal-strong)]" /> How {data.child.preferred_name || data.child.name.split(" ")[0]} learns best</h3>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                  {Object.entries({
                    "Communication": data.learning_profile.communication_needs,
                    "SEND": data.learning_profile.send_needs,
                    "Attention": data.learning_profile.attention_profile,
                    "Sensory": data.learning_profile.sensory_profile,
                    "Literacy": data.learning_profile.literacy_level,
                    "Known triggers": data.learning_profile.emotional_triggers,
                    "What calms": data.learning_profile.calming_strategies,
                    "Strengths": data.learning_profile.known_strengths,
                    "Enjoys": data.learning_profile.preferred_activities,
                    "Trusted adults": data.learning_profile.trusted_adults,
                    "Avoid (for now)": data.learning_profile.avoided_topics,
                    "Current goals": data.learning_profile.current_goals,
                  }).map(([k, v]) => v ? (
                    <div key={k}><p className="text-[11px] font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">{k}</p><p className="text-[var(--cs-text-secondary)]">{v}</p></div>
                  ) : null)}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {Object.entries(data.learning_profile.learning_style).filter(([, v]) => v).map(([k]) => (
                    <span key={k} className="rounded-full bg-[var(--cs-teal-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--cs-navy)]">{k.replace(/_/g, " ")}</span>
                  ))}
                  {data.learning_profile.risk_themes.map((r) => (
                    <span key={r} className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">risk: {r}</span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--cs-text-muted)]">No learning profile yet — sessions will use general low-demand defaults until one is created.</p>
            )
          )}

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

function SavedOutputCard({ o }: { o: CaraSavedOutput }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4 shadow-[var(--cs-shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><Sparkles className="h-3.5 w-3.5 text-[var(--cs-aria-gold)]" /> {o.title}</p>
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
