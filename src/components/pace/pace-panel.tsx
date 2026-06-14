"use client";

// CARA — PACE check panel (embeddable). Paste a record → Cara recognises the
// PACE stance (Playfulness, Acceptance, Curiosity, Empathy) and scores its
// quality. Cara advises; staff decide; managers review. Acceptance is of the
// child's FEELINGS, never of unsafe behaviour; risk always flags judgement.
// Drop <PacePanel context="INCIDENT" /> beneath any record editor.

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAnalyzePACE } from "@/hooks/use-pace";
import type { PACEAnalysisResult, PACEContext } from "@/lib/cara-intelligence/pace";
import { Heart, Sparkles, AlertTriangle, ShieldAlert, MessageSquareText, Loader2, Check, Minus } from "lucide-react";

function bandColor(band: string): string {
  switch (band) {
    case "strong": return "var(--cs-success, #15803d)";
    case "developing": return "var(--cs-teal, #0d9488)";
    case "emerging": return "var(--cs-warning-text, #b45309)";
    default: return "var(--cs-danger, #b91c1c)";
  }
}

function ElementPill({ label, present }: { label: string; present: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ borderColor: present ? "var(--cs-success, #15803d)" : "var(--cs-border)", color: present ? "var(--cs-success, #15803d)" : "var(--cs-text-muted)" }}>
      {present ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />} {label}
    </span>
  );
}

export interface PacePanelProps {
  context: PACEContext;
  title?: string;
}

export function PacePanel({ context, title = "PACE check" }: PacePanelProps) {
  const [text, setText] = useState("");
  const analyse = useAnalyzePACE();
  const r: PACEAnalysisResult | undefined = analyse.data?.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-1.5"><Heart className="h-4 w-4" /> {title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-[var(--cs-text-muted)]">Playfulness · Acceptance · Curiosity · Empathy. Cara recognises the relational stance and advises; you decide. Acceptance is of feelings, never of unsafe behaviour.</p>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the record / your response here…" className="min-h-[110px] text-sm" />
        <Button onClick={() => { if (text.trim()) analyse.mutate({ text, context }); }} disabled={!text.trim() || analyse.isPending} className="gap-1.5">
          {analyse.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Analyse PACE
        </Button>

        {r && (
          <div className="space-y-3 border-t border-[var(--cs-border)] pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--cs-navy)]">PACE quality</span>
              <span className="text-2xl font-extrabold" style={{ color: bandColor(r.score.band) }}>
                {r.score.overall}<span className="text-sm font-semibold text-[var(--cs-text-muted)]">/100</span>
                <span className="ml-2 text-xs font-semibold uppercase">{r.score.band.replace("_", " ")}</span>
              </span>
            </div>
            <p className="text-sm text-[var(--cs-text-secondary)]">{r.summary}</p>

            {(r.managerReviewRequired || r.professionalJudgementRequired) && (
              <div className="rounded-lg bg-[var(--cs-warning-bg)] px-3 py-2 text-xs text-[var(--cs-text-secondary)] flex items-start gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{[r.managerReviewRequired ? "Manager review recommended." : "", r.professionalJudgementRequired ? "Risk present — professional judgement required (Cara never makes the call alone)." : ""].filter(Boolean).join(" ")}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {r.elements.map((e) => <ElementPill key={e.element} label={e.element.charAt(0) + e.element.slice(1).toLowerCase()} present={e.present} />)}
              <ElementPill label="Connect before correct" present={r.connectBeforeCorrect} />
              <ElementPill label="Child's voice" present={r.childVoicePresent} />
            </div>

            {r.flags.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted)] flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> What Cara recognised</p>
                <div className="mt-1.5 space-y-2">
                  {r.flags.map((f, i) => (
                    <div key={i} className="rounded-lg border border-[var(--cs-border)] p-2.5 text-sm">
                      <div className="flex items-center gap-2"><span className="font-semibold text-[var(--cs-navy)]">{f.title}</span><span className="ml-auto text-[10px] font-bold uppercase" style={{ color: bandColor(f.severity === "low" ? "developing" : f.severity === "medium" ? "emerging" : "needs_attention") }}>{f.severity}</span></div>
                      <p className="mt-0.5 text-xs text-[var(--cs-text-secondary)]">{f.description}</p>
                      <p className="mt-1 text-xs"><span className="font-semibold">Try:</span> {f.recommendedAction}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {r.missing.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Not yet in the record</p>
                <ul className="mt-1 space-y-1 text-sm text-[var(--cs-text-secondary)]">{r.missing.map((m, i) => <li key={i}>• {m}</li>)}</ul>
              </div>
            )}

            {r.prompts.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted)] flex items-center gap-1"><MessageSquareText className="h-3.5 w-3.5" /> Reflective prompts</p>
                <ul className="mt-1 space-y-1 text-sm text-[var(--cs-text-secondary)]">{r.prompts.slice(0, 5).map((p, i) => <li key={i}>• {p.prompt}</li>)}</ul>
              </div>
            )}

            <p className="rounded-lg bg-[var(--cs-warning-bg)] px-3 py-2 text-xs text-[var(--cs-text-secondary)]">{r.disclaimer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
