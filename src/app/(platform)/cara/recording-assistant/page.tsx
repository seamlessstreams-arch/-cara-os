"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { EntryAssist } from "@/components/forms/entry-assist";
import { cn } from "@/lib/utils";
import {
  Loader2, Sparkles, FileSignature, AlertTriangle, CheckCircle2, Check, ListChecks, Eye,
} from "lucide-react";
import type { RecordingQualityAnalysis } from "@/lib/cara-incident/recording-assistant-engine";

const inputCls = "w-full rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2 text-sm focus:border-[var(--cs-teal)] focus:outline-none focus:ring-1 focus:ring-[var(--cs-teal)]";

interface AssistantData {
  record_types: { key: string; label: string }[];
  children: { id: string; name: string }[];
  recent: any[];
  disclaimer: string;
}
interface AnalysisResponse {
  analysis: RecordingQualityAnalysis;
  manager_review_required: boolean;
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

export default function CaraRecordingAssistantPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<AssistantData>({
    queryKey: ["cara-recording-assistant"],
    queryFn: () => fetch("/api/v1/cara-recording-assistant").then(json),
  });

  const [childId, setChildId] = useState("");
  const [recordType, setRecordType] = useState("daily_log");
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [finalText, setFinalText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [savedReview, setSavedReview] = useState<{ review_id: string; manager_review_required: boolean } | null>(null);

  const analyse = useMutation<AnalysisResponse>({
    mutationFn: () => fetch("/api/v1/cara-recording-assistant", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw_text: raw, record_type: recordType, child_id: childId }),
    }).then(json),
    onSuccess: (d) => { setResult(d); setFinalText(d.ai_draft ?? raw); setSavedReview(null); },
  });

  const accept = useMutation({
    mutationFn: () => fetch("/api/v1/cara-recording-assistant", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accept: true, confirm: true, raw_text: raw, final_text: finalText, ai_suggested_text: result?.ai_draft ?? null, record_type: recordType, child_id: childId }),
    }).then(json),
    onSuccess: (d: any) => {
      setSavedReview(d); setResult(null); setRaw(""); setFinalText(""); setConfirmed(false);
      qc.invalidateQueries({ queryKey: ["cara-recording-assistant"] });
    },
  });

  return (
    <PageShell
      title="Cara Recording Assistant"
      subtitle="Turn raw notes into professional, therapeutic, factual records — for any record type. Cara checks the quality, suggests a rewrite, and you stay the author: original, suggestion and final version are all preserved."
      caraContext={{ pageTitle: "Cara Recording Assistant", sourceType: "general" }}
    >
      <div className="mx-auto max-w-3xl space-y-4 pb-10">
        {isLoading && <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {data && (
          <>
            {/* 1 · raw note */}
            <Card>
              <CardContent className="space-y-3 py-5">
                <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--cs-navy)]"><FileSignature className="h-4 w-4 text-[var(--cs-teal-strong)]" /> 1 · Your raw note</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block"><span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Child</span>
                    <select className={cn(inputCls, "mt-1")} value={childId} onChange={(e) => setChildId(e.target.value)}>
                      <option value="">Select…</option>
                      {data.children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select></label>
                  <label className="block"><span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Record type</span>
                    <select className={cn(inputCls, "mt-1")} value={recordType} onChange={(e) => setRecordType(e.target.value)}>
                      {data.record_types.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select></label>
                </div>
                <textarea rows={5} className={inputCls} placeholder="Write (or dictate) what happened, in your own words…" value={raw} onChange={(e) => setRaw(e.target.value)} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <EntryAssist value={raw} onChange={setRaw} sourceModule="aria_recording_assistant" sourceField="raw_note" childId={childId || undefined} />
                  <button onClick={() => analyse.mutate()} disabled={!raw.trim() || analyse.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--cs-navy)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--cs-navy-soft)] disabled:opacity-40">
                    {analyse.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Check quality &amp; suggest rewrite
                  </button>
                </div>
                {analyse.isError && <p className="text-sm font-medium text-red-700">{(analyse.error as Error).message}</p>}
              </CardContent>
            </Card>

            {savedReview && (
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="py-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-green-800"><CheckCircle2 className="h-4 w-4" /> Record saved — original, AI suggestion and final version all preserved.{savedReview.manager_review_required ? " Sent for manager review." : ""}</p>
                </CardContent>
              </Card>
            )}

            {/* 2 · quality checks + 3 · final */}
            {result && (
              <>
                <Card className={cn("border-l-4", result.analysis.flags.length ? "border-l-amber-500" : "border-l-green-500")}>
                  <CardContent className="py-4">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--cs-navy)]"><ListChecks className="h-4 w-4 text-[var(--cs-teal-strong)]" /> 2 · Practice quality checks</p>
                    {result.analysis.flags.length === 0 ? (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-green-700"><CheckCircle2 className="h-4 w-4" /> No quality flags — clear context, child&rsquo;s voice, staff response and next steps.</p>
                    ) : (
                      <div className="mt-2 space-y-1.5">
                        {result.analysis.flags.map((f, i) => (
                          <p key={i} className="flex items-start gap-1.5 text-sm text-amber-800"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {f}</p>
                        ))}
                        <div className="rounded-xl bg-[var(--cs-bg)] px-3 py-2">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">How to strengthen it</p>
                          <ul className="mt-1 space-y-0.5">{result.analysis.guidance.map((g, i) => <li key={i} className="text-xs text-[var(--cs-text-secondary)]">• {g}</li>)}</ul>
                        </div>
                      </div>
                    )}
                    {result.manager_review_required && <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800"><Eye className="h-3 w-3" /> Will go to the manager for review</p>}
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-[var(--cs-cara-gold)]">
                  <CardContent className="space-y-3 py-4">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--cs-navy)]"><Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" /> 3 · Your final record</p>
                    {result.llm_message && <p className="rounded-lg bg-[var(--cs-bg)] px-3 py-2 text-xs text-[var(--cs-text-muted)]">{result.llm_message}</p>}
                    {result.ai_draft && (
                      <details className="rounded-xl border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2">
                        <summary className="cursor-pointer text-xs font-bold text-[var(--cs-text-muted)]">Cara&rsquo;s suggested rewrite (AI-assisted — review before using)</summary>
                        <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-[var(--cs-text-secondary)]">{result.ai_draft}</pre>
                      </details>
                    )}
                    <textarea rows={10} className={cn(inputCls, "font-mono text-xs")} value={finalText} onChange={(e) => setFinalText(e.target.value)} />
                    <label className="flex items-start gap-2.5 rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2.5 text-sm">
                      <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--cs-teal-strong)]" />
                      <span>I confirm this record is accurate and my own account. I understand it is AI-assisted{result.manager_review_required ? " and will go to the manager for review" : ""}.</span>
                    </label>
                    <button onClick={() => accept.mutate()} disabled={!confirmed || !finalText.trim() || !childId || accept.isPending}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cs-teal-strong)] px-6 py-3.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40">
                      {accept.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Accept &amp; save
                    </button>
                    {!childId && <p className="text-xs text-amber-700">Select the child this record is about before saving.</p>}
                    {accept.isError && <p className="text-sm font-medium text-red-700">{(accept.error as Error).message}</p>}
                  </CardContent>
                </Card>
              </>
            )}

            {/* recent records */}
            {data.recent.length > 0 && (
              <Card>
                <CardContent className="py-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Recent AI-assisted records</p>
                  <div className="space-y-1.5">
                    {data.recent.map((r: any) => (
                      <div key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-[var(--cs-border)]/60 bg-white px-3 py-2 text-sm">
                        <span className="min-w-0 flex-1 font-semibold text-[var(--cs-navy)]">{r.child_name} <span className="font-normal text-[var(--cs-text-muted)]">· {String(r.record_type).replace(/_/g, " ")} · {String(r.created_at).slice(0, 10)} · {r.staff_name}</span></span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                          r.manager_reviewed_at ? "bg-green-100 text-green-700" : r.manager_review_required ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600")}>
                          {r.manager_reviewed_at ? "Approved" : r.manager_review_required ? "Awaiting manager" : "Recorded"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
