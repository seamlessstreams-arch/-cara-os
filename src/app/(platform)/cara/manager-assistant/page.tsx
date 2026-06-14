"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Loader2, Wand2, Megaphone, UserCheck, ListChecks, Sparkles, Copy, Check, ArrowRight,
} from "lucide-react";

const inputCls = "w-full rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2 text-sm focus:border-[var(--cs-teal)] focus:outline-none focus:ring-1 focus:ring-[var(--cs-teal)]";

interface AssistantMeta {
  vacancies: { id: string; title: string; status: string }[];
  candidates: { id: string; name: string }[];
  has_values_profile: boolean;
  disclaimer: string;
}
interface DraftResult {
  scaffold: string;
  ai_draft: string | null;
  llmUsed: boolean;
  llm_message: string | null;
  disclaimer: string;
}

const json = async (res: Response) => {
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || "Request failed");
  return j.data ?? j;
};

const TOOLS = [
  { key: "job_advert", label: "Job advert", Icon: Megaphone, blurb: "A values-led advert drafted from the vacancy and your Employer Values Profile." },
  { key: "candidate_summary", label: "Candidate strengths", Icon: UserCheck, blurb: "A balanced strengths summary drafted from the values match — never a hiring recommendation." },
  { key: "action_plan", label: "Action plan", Icon: ListChecks, blurb: "A structured plan drafted from your goal — actions, owners, evidence and review." },
];

const MORE = [
  { label: "Interview questions", href: "/interview-builder" },
  { label: "Supervision prompts", href: "/reflective-supervision" },
  { label: "Recording rewrite", href: "/cara/recording-assistant" },
  { label: "Evidence gaps", href: "/ofsted-workforce-evidence" },
];

export default function ManagerAssistantPage() {
  const { data, isLoading } = useQuery<AssistantMeta>({
    queryKey: ["manager-assistant"],
    queryFn: () => fetch("/api/v1/manager-assistant").then(json),
  });

  const [tool, setTool] = useState("job_advert");
  const [vacancyId, setVacancyId] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState<DraftResult | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = useMutation<DraftResult>({
    mutationFn: () => fetch("/api/v1/manager-assistant", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool, vacancy_id: vacancyId, candidate_id: candidateId, goal, context }),
    }).then(json),
    onSuccess: (d) => { setResult(d); setCopied(false); },
  });

  const canGenerate =
    (tool === "job_advert" && !!vacancyId) ||
    (tool === "candidate_summary" && !!candidateId) ||
    (tool === "action_plan" && !!goal.trim());

  const output = result ? (result.ai_draft ?? result.scaffold) : "";
  const copy = async () => {
    try { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard unavailable */ }
  };

  return (
    <PageShell
      title="Cara Manager Assistant"
      subtitle="Drafting tools for the jobs managers do every week — job adverts, candidate summaries and action plans. Every output is a draft built from your recorded data: accept it, edit it, or bin it."
      caraContext={{ pageTitle: "Cara Manager Assistant", sourceType: "general" }}
    >
      <div className="mx-auto max-w-3xl space-y-4 pb-10">
        {isLoading && <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {data && (
          <>
            {/* tool picker */}
            <div className="grid gap-2 sm:grid-cols-3">
              {TOOLS.map((t) => (
                <button key={t.key} onClick={() => { setTool(t.key); setResult(null); }}
                  className={cn("rounded-2xl border-2 p-4 text-left transition-colors", tool === t.key ? "border-[var(--cs-navy)] bg-white" : "border-[var(--cs-border)] bg-white/60 hover:bg-white")}>
                  <t.Icon className={cn("h-5 w-5", tool === t.key ? "text-[var(--cs-navy)]" : "text-[var(--cs-text-muted)]")} />
                  <p className="mt-2 text-sm font-bold text-[var(--cs-navy)]">{t.label}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-[var(--cs-text-muted)]">{t.blurb}</p>
                </button>
              ))}
            </div>

            {/* inputs */}
            <Card>
              <CardContent className="space-y-3 py-4">
                {tool === "job_advert" && (
                  <>
                    <label className="block"><span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Vacancy</span>
                      <select className={cn(inputCls, "mt-1")} value={vacancyId} onChange={(e) => setVacancyId(e.target.value)}>
                        <option value="">Select…</option>
                        {data.vacancies.map((v) => <option key={v.id} value={v.id}>{v.title} ({v.status})</option>)}
                      </select></label>
                    {!data.has_values_profile && <p className="text-xs text-amber-700">Tip: create your <Link href="/employer-values" className="font-semibold underline">Employer Values Profile</Link> first — the advert draws its warmth from it.</p>}
                  </>
                )}
                {tool === "candidate_summary" && (
                  <label className="block"><span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Candidate</span>
                    <select className={cn(inputCls, "mt-1")} value={candidateId} onChange={(e) => setCandidateId(e.target.value)}>
                      <option value="">Select…</option>
                      {data.candidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select></label>
                )}
                {tool === "action_plan" && (
                  <>
                    <label className="block"><span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Goal</span>
                      <input className={cn(inputCls, "mt-1")} placeholder="e.g. Improve bedtime routines across the home" value={goal} onChange={(e) => setGoal(e.target.value)} /></label>
                    <label className="block"><span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Context (optional)</span>
                      <textarea rows={2} className={cn(inputCls, "mt-1")} placeholder="What prompted this — pattern, audit finding, inspection action…" value={context} onChange={(e) => setContext(e.target.value)} /></label>
                  </>
                )}
                <button onClick={() => generate.mutate()} disabled={!canGenerate || generate.isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--cs-navy)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--cs-navy-soft)] disabled:opacity-40">
                  {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generate draft
                </button>
                {generate.isError && <p className="text-sm font-medium text-red-700">{(generate.error as Error).message}</p>}
              </CardContent>
            </Card>

            {/* output */}
            {result && (
              <Card className="border-l-4 border-l-[var(--cs-cara-gold)]">
                <CardContent className="space-y-3 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--cs-navy)]"><Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" /> Draft {result.llmUsed ? "(Cara-polished)" : "(structured from your data)"}</p>
                    <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cs-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--cs-navy)] hover:bg-[var(--cs-bg)]">
                      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  {result.llm_message && <p className="rounded-lg bg-[var(--cs-bg)] px-3 py-2 text-xs text-[var(--cs-text-muted)]">{result.llm_message}</p>}
                  <pre className="whitespace-pre-wrap rounded-xl border border-[var(--cs-border)] bg-white px-4 py-3 font-sans text-sm leading-relaxed text-[var(--cs-text)]">{output}</pre>
                  {result.ai_draft && (
                    <details className="rounded-xl border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2">
                      <summary className="cursor-pointer text-xs font-bold text-[var(--cs-text-muted)]">View the structured draft (no AI)</summary>
                      <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-[var(--cs-text-secondary)]">{result.scaffold}</pre>
                    </details>
                  )}
                  <p className="text-[11px] italic text-[var(--cs-text-muted)]">{result.disclaimer}</p>
                </CardContent>
              </Card>
            )}

            {/* more tools */}
            <Card>
              <CardContent className="py-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">More Cara tools</p>
                <div className="flex flex-wrap gap-2">
                  {MORE.map((m) => (
                    <Link key={m.href} href={m.href} className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--cs-border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--cs-navy)] hover:bg-[var(--cs-bg)]">
                      {m.label} <ArrowRight className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-start gap-2.5 rounded-2xl border border-[var(--cs-cara-gold)]/40 bg-[var(--cs-cara-gold-bg)]/50 px-4 py-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-cara-gold)]" />
              <p className="text-xs font-medium leading-relaxed text-[var(--cs-navy)]">{data.disclaimer}</p>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
