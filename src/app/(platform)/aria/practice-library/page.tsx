"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Loader2, BookOpen, Plus, Power, Trash2, HeartHandshake, MessageCircle, ListChecks, Lock,
} from "lucide-react";
import type { PromptBankEntry, WorkflowStep } from "@/lib/aria-incident/aria-incident-engine";

const inputCls = "rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2 text-sm focus:border-[var(--cs-teal)] focus:outline-none focus:ring-1 focus:ring-[var(--cs-teal)]";

interface LibraryData {
  bank: PromptBankEntry[];
  categories: string[];
  incident_types: { key: string; label: string }[];
  workflows: { key: string; label: string; steps: WorkflowStep[] }[];
}

const json = async (res: Response) => {
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || "Request failed");
  return j.data ?? j;
};

const CAT_LABEL: Record<string, string> = {
  co_regulation: "Co-regulation", deescalation: "De-escalation", child_voice: "Child's voice",
  restorative: "Restorative", safeguarding: "Safeguarding", recording: "Recording",
};

export default function AriaPracticeLibraryPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<LibraryData>({
    queryKey: ["aria-practice-library"],
    queryFn: () => fetch("/api/v1/aria-prompt-bank").then(json),
  });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["aria-practice-library"] });
    qc.invalidateQueries({ queryKey: ["aria-incident-list"] });
  };

  const [text, setText] = useState("");
  const [category, setCategory] = useState("co_regulation");
  const [forType, setForType] = useState("");

  const add = useMutation({
    mutationFn: () => fetch("/api/v1/aria-prompt-bank", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt_text: text, category, incident_type: forType || null }),
    }).then(json),
    onSuccess: () => { setText(""); invalidate(); },
  });
  const patch = useMutation({
    mutationFn: (payload: { id: string; is_active?: boolean; remove?: boolean }) =>
      fetch("/api/v1/aria-prompt-bank", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(json),
    onSuccess: invalidate,
  });

  const typeLabel = (key: string | null) => (key ? data?.incident_types.find((t) => t.key === key)?.label ?? key : null);
  const core = (data?.bank ?? []).filter((p) => !p.custom);
  const custom = (data?.bank ?? []).filter((p) => p.custom);
  const coreByCategory = new Map<string, PromptBankEntry[]>();
  for (const p of core) {
    const list = coreByCategory.get(p.category) ?? [];
    list.push(p);
    coreByCategory.set(p.category, list);
  }

  return (
    <PageShell
      title="ARIA Practice Library"
      subtitle="The prompts and workflows behind Incident Mode — co-regulation and de-escalation prompts, child-voice questions and per-incident workflow checklists. Add your home's own prompts; they appear live in Incident Mode."
      ariaContext={{ pageTitle: "ARIA Practice Library", sourceType: "general" }}
    >
      <div className="mx-auto max-w-3xl space-y-4 pb-10">
        {isLoading && <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {data && (
          <>
            {/* add custom */}
            <Card className="border-l-4 border-l-[var(--cs-teal)]">
              <CardContent className="space-y-3 py-4">
                <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--cs-navy)]"><Plus className="h-4 w-4 text-[var(--cs-teal-strong)]" /> Add your home&rsquo;s own prompt</p>
                <input className={cn(inputCls, "w-full")} maxLength={140} placeholder='Short and calm — e.g. "Offer the weighted blanket."' value={text} onChange={(e) => setText(e.target.value)} />
                <div className="flex flex-wrap items-end gap-2">
                  <label className="block"><span className="text-[11px] font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Category</span>
                    <select className={cn(inputCls, "mt-1 block")} value={category} onChange={(e) => setCategory(e.target.value)}>
                      {["co_regulation", "deescalation", "child_voice"].map((c) => <option key={c} value={c}>{CAT_LABEL[c] ?? c}</option>)}
                    </select></label>
                  <label className="block"><span className="text-[11px] font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Only for (optional)</span>
                    <select className={cn(inputCls, "mt-1 block")} value={forType} onChange={(e) => setForType(e.target.value)}>
                      <option value="">All incident types</option>
                      {data.incident_types.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select></label>
                  <button onClick={() => add.mutate()} disabled={!text.trim() || add.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--cs-navy)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--cs-navy-soft)] disabled:opacity-40">
                    {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
                  </button>
                </div>
                <p className="text-[11px] text-[var(--cs-text-muted)]">Active co-regulation prompts appear in live Incident Mode for the matching incident type.</p>
                {add.isError && <p className="text-sm font-medium text-red-700">{(add.error as Error).message}</p>}
              </CardContent>
            </Card>

            {/* custom prompts */}
            {custom.length > 0 && (
              <Card>
                <CardContent className="py-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Your home&rsquo;s prompts</p>
                  <div className="space-y-1.5">
                    {custom.map((p) => (
                      <div key={p.id} className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-[var(--cs-border)]/60 bg-white px-3 py-2 text-sm", !p.is_active && "opacity-50")}>
                        <span className="min-w-0 flex-1 text-[var(--cs-text)]">{p.prompt_text}</span>
                        <span className="rounded-full bg-[var(--cs-bg)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--cs-text-muted)]">{CAT_LABEL[p.category] ?? p.category}{typeLabel(p.incident_type) ? ` · ${typeLabel(p.incident_type)}` : ""}</span>
                        <button onClick={() => patch.mutate({ id: p.id, is_active: !p.is_active })} title={p.is_active ? "Deactivate" : "Activate"}
                          className={cn("rounded-lg border px-2 py-1 text-[11px] font-semibold", p.is_active ? "border-green-200 bg-green-50 text-green-700" : "border-[var(--cs-border)] bg-white text-[var(--cs-text-muted)]")}>
                          <Power className="h-3 w-3" />
                        </button>
                        <button onClick={() => patch.mutate({ id: p.id, remove: true })} title="Remove" className="rounded-lg border border-[var(--cs-border)] bg-white px-2 py-1 text-[11px] text-[var(--cs-text-muted)] hover:text-red-600">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* core prompts */}
            {[["co_regulation", HeartHandshake], ["deescalation", HeartHandshake], ["child_voice", MessageCircle]].map(([cat, Icon]: any) => {
              const list = coreByCategory.get(cat) ?? [];
              if (!list.length) return null;
              return (
                <Card key={cat}>
                  <CardContent className="py-4">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]"><Icon className="h-3.5 w-3.5" /> {CAT_LABEL[cat]} prompts <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[var(--cs-bg)] px-2 py-0.5 text-[9px] font-bold uppercase text-[var(--cs-text-gentle)]"><Lock className="h-2.5 w-2.5" /> core · versioned in code</span></p>
                    <div className="flex flex-wrap gap-1.5">
                      {list.map((p) => (
                        <span key={p.id} className="rounded-full border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-1.5 text-xs text-[var(--cs-text)]" title={typeLabel(p.incident_type) ?? "All incident types"}>
                          {p.prompt_text}{typeLabel(p.incident_type) ? <span className="ml-1 text-[var(--cs-text-gentle)]">· {typeLabel(p.incident_type)}</span> : null}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* workflows */}
            <Card>
              <CardContent className="py-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]"><ListChecks className="h-3.5 w-3.5" /> Workflow checklists by incident type <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[var(--cs-bg)] px-2 py-0.5 text-[9px] font-bold uppercase text-[var(--cs-text-gentle)]"><Lock className="h-2.5 w-2.5" /> core · versioned in code</span></p>
                <div className="space-y-1.5">
                  {data.workflows.map((w) => (
                    <details key={w.key} className="rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2">
                      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[var(--cs-navy)] [&::-webkit-details-marker]:hidden">
                        {w.label}<span className="text-[11px] font-normal text-[var(--cs-text-muted)]">{w.steps.length} steps</span>
                      </summary>
                      <ol className="mt-2 space-y-1 border-t border-[var(--cs-border)] pt-2">
                        {w.steps.map((s, i) => (
                          <li key={s.key} className="flex items-center gap-2 text-sm text-[var(--cs-text-secondary)]">
                            <span className="w-5 shrink-0 text-right font-mono text-[11px] text-[var(--cs-text-gentle)]">{i + 1}.</span>
                            <span className="min-w-0 flex-1">{s.title}</span>
                            {s.regulation_related && <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-purple-700">Reg</span>}
                            {s.manager_review_required && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700">Manager</span>}
                          </li>
                        ))}
                      </ol>
                    </details>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-start gap-2.5 rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] px-4 py-3">
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-text-muted)]" />
              <p className="text-xs leading-relaxed text-[var(--cs-text-secondary)]">Core prompts and workflows are versioned in code so every home gets consistent, reviewed practice guidance. Your custom prompts sit on top and can be deactivated or removed at any time — changes are audit-logged.</p>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
