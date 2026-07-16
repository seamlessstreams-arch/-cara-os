"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — OFSTED READINESS REVIEW
// ══════════════════════════════════════════════════════════════════════════════

import { useHomeName } from "@/hooks/use-home-profile";
import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Award, Sparkles, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  MessageSquare, TrendingUp, FileText,
} from "lucide-react";
import { api } from "@/hooks/use-api";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

type ReadinessResult = {
  headline_judgement_prediction: string;
  headline_rationale: string;
  strengths: { area: string; evidence: string; ofsted_language: string }[];
  vulnerabilities: { area: string; risk: string; recommended_action: string; priority: string }[];
  safeguarding_position: string;
  children_experience_evidence: string;
  leaders_and_managers_evidence: string;
  inspection_readiness_score: number;
  immediate_actions_before_inspection: string[];
  mock_interview_questions: string[];
  evidence_to_prepare: string[];
};

const JUDGEMENT_COLOURS: Record<string, string> = {
  outstanding: "bg-emerald-100 text-emerald-700 border-emerald-200",
  good: "bg-blue-100 text-blue-700 border-blue-200",
  requires_improvement: "bg-amber-100 text-amber-700 border-amber-200",
  inadequate: "bg-red-100 text-red-700 border-red-200",
  unknown: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
};

function ScoreDial({ score }: { score: number }) {
  const colour = score >= 80 ? "text-emerald-600" : score >= 65 ? "text-amber-600" : "text-red-600";
  return (
    <div className="flex flex-col items-center">
      <div className={cn("text-5xl font-bold tabular-nums", colour)}>{score}</div>
      <div className="text-xs text-[var(--cs-text-muted)] mt-1">Readiness Score / 100</div>
    </div>
  );
}

function MockQuestion({ question, index }: { question: string; index: number }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  return (
    <div className="border border-[var(--cs-border)] rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
        onClick={() => setOpen((p) => !p)}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
          {index + 1}
        </span>
        <span className="text-sm font-medium text-[var(--cs-navy)] flex-1">{question}</span>
        {open ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0" /> : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-[var(--cs-border-subtle)] pt-3">
          <label className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Your Practice Answer</label>
          <Textarea
            className="mt-1 text-sm"
            rows={4}
            placeholder="Prepare your answer here — what evidence would you cite? What would you say to the inspector?"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <p className="text-[10px] text-[var(--cs-text-muted)] mt-1">This is not saved — use it to rehearse your response</p>
        </div>
      )}
    </div>
  );
}

export default function OfstedReadinessPage() {
  const homeName = useHomeName();
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [tab, setTab] = useState<"overview" | "strengths" | "vulnerabilities" | "interview">("overview");

  const generate = async () => {
    setGenerating(true);
    setResult(null);
    try {
      const res = await api.post<{ data: { parsed?: ReadinessResult } }>(
        "/cara",
        {
          mode: "ri_ofsted_readiness",
          style: "inspection_ready",
          source_content: context || `${homeName} children's home. 3 young people aged 13-17. Registered Manager in post 18 months. Last Ofsted inspection 14 months ago — Good with Outstanding features. Seeking current readiness assessment.`,
          page_context: "Ofsted Readiness Review",
          record_type: "ofsted_readiness",
          user_role: "responsible_individual",
        }
      );
      const parsed = res.data?.parsed;
      if (parsed) setResult(parsed);
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  const tabs = ["overview", "strengths", "vulnerabilities", "interview"] as const;

  return (
    <PageShell
      title="Ofsted Readiness"
      subtitle="ILACS inspection preparation and mock review"
      caraContext={{ pageTitle: "Ofsted Readiness", sourceType: "general" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton
            title="Ofsted Readiness"
            subtitle="Inspection Preparation"
            targetId="ofsted-content"
          />
          <SmartUploadButton variant="inline" label="Upload Evidence" uploadContext="Ofsted readiness — inspection evidence upload" />
          <CaraStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="ofsted-content" className="space-y-5 animate-fade-in">
        {/* Context input */}
        <Card className="border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
              Generate Readiness Review with Cara
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Service Context (optional)</label>
              <Textarea
                className="mt-1 text-sm"
                rows={3}
                placeholder="Describe current position: recent incidents, staffing, last inspection outcome, any concerns or notable strengths…"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
            <Button
              onClick={generate}
              disabled={generating}
              className="gap-1.5 bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white"
              size="sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {generating ? "Cara is reviewing…" : "Run Ofsted Readiness Review"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Headline card */}
            <div className="rounded-2xl bg-slate-900 text-white p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Predicted Judgement</p>
                  <span className={cn("rounded-full border px-4 py-1 text-sm font-bold capitalize", JUDGEMENT_COLOURS[result.headline_judgement_prediction])}>
                    {result.headline_judgement_prediction.replace("_", " ")}
                  </span>
                </div>
                <ScoreDial score={result.inspection_readiness_score} />
              </div>
              <p className="text-sm text-[var(--cs-text-gentle)] leading-relaxed">{result.headline_rationale}</p>
            </div>

            {/* Tab bar */}
            <div className="flex gap-2 border-b border-[var(--cs-border)] pb-0">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-3 py-2 text-xs font-semibold capitalize border-b-2 transition-colors",
                    tab === t ? "border-[var(--cs-navy)] text-[var(--cs-cara-gold)]" : "border-transparent text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]"
                  )}
                >
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {tab === "overview" && (
              <div className="space-y-4">
                {[
                  { label: "Safeguarding Position", content: result.safeguarding_position, colour: "bg-red-50 border-red-100" },
                  { label: "Children's Experience", content: result.children_experience_evidence, colour: "bg-blue-50 border-blue-100" },
                  { label: "Leadership & Management", content: result.leaders_and_managers_evidence, colour: "bg-[var(--cs-cara-gold-bg)] border-[var(--cs-cara-gold-soft)]" },
                ].map(({ label, content, colour }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2">{label}</p>
                    <div className={cn("rounded-xl border p-4", colour)}>
                      <p className="text-sm text-[var(--cs-navy)] leading-relaxed">{content}</p>
                    </div>
                  </div>
                ))}
                {result.immediate_actions_before_inspection.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2">Immediate Actions Before Inspection</p>
                    <div className="space-y-2">
                      {result.immediate_actions_before_inspection.map((action, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-900">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.evidence_to_prepare.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2">Evidence to Prepare</p>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {result.evidence_to_prepare.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg bg-slate-50 border border-[var(--cs-border-subtle)] px-3 py-2">
                          <FileText className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
                          <p className="text-xs text-[var(--cs-text-secondary)]">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Strengths tab */}
            {tab === "strengths" && (
              <div className="space-y-3">
                {result.strengths.map((s, i) => (
                  <div key={i} className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 space-y-1.5">
                    <p className="text-sm font-semibold text-emerald-800">{s.area}</p>
                    <p className="text-sm text-emerald-700 leading-relaxed">{s.evidence}</p>
                    {s.ofsted_language && (
                      <div className="rounded-lg bg-white border border-emerald-100 px-3 py-2">
                        <p className="text-xs text-emerald-600 italic">"{s.ofsted_language}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Vulnerabilities tab */}
            {tab === "vulnerabilities" && (
              <div className="space-y-3">
                {result.vulnerabilities.map((v, i) => (
                  <div key={i} className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-amber-800">{v.area}</p>
                      <Badge className={cn("text-[10px]", v.priority === "urgent" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                        {v.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-amber-700">{v.risk}</p>
                    <div className="rounded-lg bg-white border border-amber-100 px-3 py-2">
                      <p className="text-xs font-semibold text-[var(--cs-text-muted)] mb-0.5">Recommended Action</p>
                      <p className="text-xs text-[var(--cs-text-secondary)]">{v.recommended_action}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mock interview tab */}
            {tab === "interview" && (
              <div className="space-y-3">
                <p className="text-xs text-[var(--cs-text-muted)]">
                  Practice answering these questions as an inspector might ask them. Your answers are not saved.
                </p>
                {result.mock_interview_questions.map((q, i) => (
                  <MockQuestion key={i} question={q} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {!result && !generating && (
          <div className="text-center py-16 text-[var(--cs-text-muted)]">
            <Award className="h-12 w-12 mx-auto mb-3 text-[var(--cs-text-gentle)]" />
            <p className="text-sm font-medium">Run a readiness review to see your inspection position</p>
            <p className="text-xs mt-1">Cara will analyse current evidence and predict your likely ILACS judgement</p>
          </div>
        )}
      </div>
      <CaraPanel
        mode="assist"
        pageContext="Ofsted Readiness — ILACS inspection preparation, mock review, inspection evidence, judgement prediction, practice evidence, compliance evidence, self-evaluation, Annex A readiness"
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>
  );
}
