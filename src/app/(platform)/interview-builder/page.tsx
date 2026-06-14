"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Loader2, ListChecks, ShieldAlert, Sparkles, Heart, Target, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { useInterviewPack } from "@/hooks/use-interview-pack";

const SELECT = "rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-text)] focus:border-[var(--cs-teal)] focus:outline-none focus:ring-1 focus:ring-[var(--cs-teal)]";

export default function InterviewBuilderPage() {
  const [role, setRole] = useState("residential_care_worker");
  const [candidateId, setCandidateId] = useState<string>("");
  const { data, isLoading } = useInterviewPack(role, candidateId || null);

  // Cara extra-questions (optional, human-in-the-loop)
  const [aiState, setAiState] = useState<"idle" | "loading" | "done">("idle");
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  async function suggestQuestions() {
    setAiState("loading"); setAiMessage(null); setAiQuestions([]);
    try {
      const res = await fetch("/api/v1/interview-pack/ai-questions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, candidateId: candidateId || null }),
      });
      const json = (await res.json()).data;
      setAiQuestions(json.questions || []);
      setAiMessage(json.message || null);
    } catch {
      setAiMessage("Couldn't reach Cara. The structured pack is complete on its own.");
    }
    setAiState("done");
  }

  const pack = data?.pack;

  return (
    <PageShell
      title="Interview Builder"
      subtitle="Structured, values-aligned interview packs for every children's-home role — values, safeguarding, trauma-informed practice, PACE, scenarios and leadership, with scoring guidance and red-flag prompts."
      caraContext={{ pageTitle: "Interview Builder", sourceType: "general" }}
      actions={<PrintButton title={pack ? `Interview Pack — ${pack.role_label}` : "Interview Builder"} />}
    >
      <div className="cs-print-color mx-auto max-w-4xl space-y-5">
        {/* selectors */}
        <Card className="print:hidden">
          <CardContent className="flex flex-wrap items-end gap-4 py-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Role</span>
              <select className={cn(SELECT, "mt-1.5 block")} value={role} onChange={(e) => { setRole(e.target.value); setAiState("idle"); }}>
                {(data?.roles ?? [{ key: "residential_care_worker", label: "Residential Childcare Worker" }]).map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Candidate (optional)</span>
              <select className={cn(SELECT, "mt-1.5 block")} value={candidateId} onChange={(e) => { setCandidateId(e.target.value); setAiState("idle"); }}>
                <option value="">No specific candidate</option>
                {(data?.candidates ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </CardContent>
        </Card>

        {isLoading && <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {pack && (
          <>
            <Card>
              <CardContent className="py-5">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><ListChecks className="h-4 w-4 text-[var(--cs-teal-strong)]" /> {pack.role_label}{data?.candidate_name ? ` · ${data.candidate_name}` : ""}</div>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{pack.intro}</p>
              </CardContent>
            </Card>

            {/* values & candidate probes */}
            {(pack.values_prompts.length > 0 || pack.candidate_prompts.length > 0) && (
              <Card className="border-l-4 border-l-[var(--cs-teal)]">
                <CardContent className="py-4">
                  {pack.values_prompts.length > 0 && (
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-teal-strong)]"><Heart className="h-3.5 w-3.5" /> Values probes (from your values profile)</p>
                      <ul className="space-y-1">{pack.values_prompts.map((p, i) => <li key={i} className="text-sm text-[var(--cs-text-secondary)]">• {p}</li>)}</ul>
                    </div>
                  )}
                  {pack.candidate_prompts.length > 0 && (
                    <div className={pack.values_prompts.length ? "mt-3" : ""}>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-navy)]"><Target className="h-3.5 w-3.5" /> Candidate-specific probes (from the values match)</p>
                      <ul className="space-y-1">{pack.candidate_prompts.map((p, i) => <li key={i} className="text-sm text-[var(--cs-text-secondary)]">• {p}</li>)}</ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* sections */}
            {pack.sections.map((s) => (
              <Card key={s.key}>
                <CardContent className="py-5">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--cs-navy)]">{s.title}</h3>
                  <div className="mt-3 space-y-4">
                    {s.questions.map((q, i) => (
                      <div key={i} className="rounded-xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4">
                        <p className="text-sm font-semibold text-[var(--cs-navy)]">{q.q}</p>
                        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-[var(--cs-text-secondary)]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--cs-teal)]" /> <span><span className="font-semibold">Strong answer:</span> {q.guidance}</span></p>
                        {q.red_flags.length > 0 && (
                          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span><span className="font-semibold">Red flags:</span> {q.red_flags.join("; ")}.</span></p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Cara extra questions */}
            <Card className="print:hidden">
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--cs-navy)]"><Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" /> Extra questions with Cara</p>
                  <button onClick={suggestQuestions} disabled={aiState === "loading"} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cs-navy)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--cs-navy-soft)] disabled:opacity-50">
                    {aiState === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Suggest questions
                  </button>
                </div>
                {aiState === "done" && aiQuestions.length > 0 && (
                  <>
                    <ul className="mt-3 space-y-1.5">{aiQuestions.map((q, i) => <li key={i} className="rounded-lg border border-[var(--cs-cara-gold)]/30 bg-[var(--cs-cara-gold-bg)]/40 px-3 py-2 text-sm text-[var(--cs-text)]">{q}</li>)}</ul>
                    <p className="mt-2 text-[11px] italic text-[var(--cs-text-muted)]">AI suggestions require professional judgement and manager approval. Review, edit or reject before use.</p>
                  </>
                )}
                {aiState === "done" && aiMessage && <p className="mt-3 text-sm text-[var(--cs-text-secondary)]">{aiMessage}</p>}
              </CardContent>
            </Card>

            {/* scoring + panel decision */}
            <Card>
              <CardContent className="py-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--cs-navy)]">Scoring &amp; panel decision</h3>
                <p className="mt-1 text-xs text-[var(--cs-text-secondary)]">{pack.scoring_guidance}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {pack.scoring_categories.map((c) => (
                    <div key={c.key} className="flex items-center justify-between rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm">
                      <span className="font-medium text-[var(--cs-navy)]">{c.label}</span>
                      <span className="font-mono text-xs text-[var(--cs-text-muted)]">1 — 2 — 3 — 4 — 5</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Panel recommendation</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {pack.panel_decision_options.map((d) => (
                      <span key={d.key} className="rounded-full border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-1 text-xs font-semibold text-[var(--cs-navy)]">{d.label}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-sm font-medium text-amber-900">{pack.disclaimer}</p>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
