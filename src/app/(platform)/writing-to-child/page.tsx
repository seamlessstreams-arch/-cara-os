"use client";

// CARA — Writing to the Child: child-readable recording review.
// Paste a draft → Cara reviews it for child-readability. Cara advises; the
// practitioner owns the final record (reminder shown by every suggestion).

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useReviewWritingToChild, useWritingExamples } from "@/hooks/use-writing-to-child";
import type { WritingRecordType, WritingToChildReview } from "@/lib/writing-to-child/types";
import { Sparkles, Copy, AlertTriangle, MessageSquareText, ShieldAlert, HelpCircle, Loader2 } from "lucide-react";

const RECORD_TYPES: { value: WritingRecordType; label: string }[] = [
  { value: "daily_log", label: "Daily log" },
  { value: "incident", label: "Incident" },
  { value: "missing_episode", label: "Missing episode" },
  { value: "key_work", label: "Key work" },
  { value: "room_search", label: "Room search" },
  { value: "family_time", label: "Family time" },
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "medication", label: "Medication" },
  { value: "exploitation", label: "Exploitation concern" },
  { value: "manager_oversight", label: "Manager oversight" },
  { value: "professional_meeting", label: "Professional meeting" },
];

function scoreColor(n: number): string {
  if (n >= 80) return "var(--cs-success, #15803d)";
  if (n >= 55) return "var(--cs-warning-text, #b45309)";
  return "var(--cs-danger, #b91c1c)";
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-xs"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard unavailable */ }
      }}
    >
      <Copy className="h-3.5 w-3.5" /> {done ? "Copied" : "Copy"}
    </Button>
  );
}

function Dimension({ label, score, feedback }: { label: string; score: number; feedback: string[] }) {
  return (
    <div className="rounded-lg border border-[var(--cs-border)] p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--cs-navy)]">{label}</span>
        <span className="text-sm font-bold" style={{ color: scoreColor(score) }}>{score}/100</span>
      </div>
      <ul className="mt-1.5 space-y-1 text-xs text-[var(--cs-text-secondary)]">
        {feedback.map((f, i) => <li key={i}>• {f}</li>)}
      </ul>
    </div>
  );
}

export default function WritingToChildPage() {
  const [recordType, setRecordType] = useState<WritingRecordType>("incident");
  const [rawText, setRawText] = useState("");
  const [childAge, setChildAge] = useState("");
  const [commNeeds, setCommNeeds] = useState("");
  const [quotes, setQuotes] = useState("");
  const [concern, setConcern] = useState("");
  const review = useReviewWritingToChild();
  const examples = useWritingExamples();
  const r: WritingToChildReview | undefined = review.data?.data;

  function run() {
    if (!rawText.trim()) return;
    review.mutate({
      recordType,
      rawText,
      childAge: childAge ? Number(childAge) : undefined,
      childCommunicationNeeds: commNeeds ? commNeeds.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      childDirectQuotes: quotes ? quotes.split(/\n|;/).map((s) => s.trim()).filter(Boolean) : undefined,
      practitionerConcern: concern || undefined,
    });
  }

  function loadExample(key: string) {
    const ex = examples.data?.data.examples.find((e) => e.key === key);
    if (!ex) return;
    setRecordType(ex.input.recordType);
    setRawText(ex.input.rawText);
    setConcern(ex.input.practitionerConcern ?? "");
    setQuotes((ex.input.childDirectQuotes ?? []).join("\n"));
    setCommNeeds((ex.input.childCommunicationNeeds ?? []).join(", "));
    setChildAge(ex.input.childAge ? String(ex.input.childAge) : "");
  }

  return (
    <PageShell
      title="Writing to the Child"
      subtitle="Write the record as evidence for professionals — but as memory for the child. Cara advises; you decide."
      showQuickCreate={false}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Input ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Draft record</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs font-semibold text-[var(--cs-text-muted)]">Record type</label>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value as WritingRecordType)}
                  className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] px-2.5 py-1.5 text-sm"
                >
                  {RECORD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <Textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste or draft the record here…"
                className="min-h-[140px] text-sm"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={childAge} onChange={(e) => setChildAge(e.target.value)} inputMode="numeric" placeholder="Child age (optional)" className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] px-2.5 py-1.5 text-sm" />
                <input value={commNeeds} onChange={(e) => setCommNeeds(e.target.value)} placeholder="Communication needs (comma-separated)" className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] px-2.5 py-1.5 text-sm" />
              </div>
              <Textarea value={quotes} onChange={(e) => setQuotes(e.target.value)} placeholder="The child's exact words (one per line, optional)" className="min-h-[60px] text-sm" />
              <Textarea value={concern} onChange={(e) => setConcern(e.target.value)} placeholder="Your safeguarding concern, if any (optional)" className="min-h-[44px] text-sm" />
              <div className="flex items-center justify-between gap-2">
                <Button onClick={run} disabled={!rawText.trim() || review.isPending} className="gap-1.5">
                  {review.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Review with Cara
                </Button>
                {examples.data && (
                  <select onChange={(e) => { if (e.target.value) loadExample(e.target.value); }} value="" className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] px-2.5 py-1.5 text-xs">
                    <option value="">Load an example…</option>
                    {examples.data.data.examples.map((e) => <option key={e.key} value={e.key}>{e.title}</option>)}
                  </select>
                )}
              </div>
            </CardContent>
          </Card>

          <p className="rounded-lg bg-[var(--cs-warning-bg)] px-3 py-2 text-xs text-[var(--cs-text-secondary)]">
            Cara suggests — you decide. Review carefully: you remain responsible for accuracy, professional judgement and the final recording. Cara never invents facts or minimises risk.
          </p>
        </div>

        {/* ── Review ── */}
        <div className="space-y-4">
          {!r && (
            <Card><CardContent className="py-10 text-center text-sm text-[var(--cs-text-muted)]">
              Paste a record and run the review to see flagged language, what's missing, reflective questions and child-conscious wording.
            </CardContent></Card>
          )}
          {r && (
            <>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--cs-navy)]">Child-conscious score</span>
                    <span className="text-3xl font-extrabold" style={{ color: scoreColor(r.overallScore) }}>{r.overallScore}<span className="text-base font-semibold text-[var(--cs-text-muted)]">/100</span></span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{r.summary}</p>
                  {r.generatedBy === "ai" && <Badge variant="outline" className="mt-2 gap-1 text-[10px]"><Sparkles className="h-3 w-3" /> AI-enriched wording</Badge>}
                </CardContent>
              </Card>

              {r.flaggedLanguage.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Language to reconsider</CardTitle></CardHeader>
                  <CardContent className="space-y-2.5">
                    {r.flaggedLanguage.map((f, i) => (
                      <div key={i} className="rounded-lg border border-[var(--cs-border)] p-2.5 text-sm">
                        <span className="font-semibold text-[var(--cs-danger,#b91c1c)]">“{f.term}”</span>
                        <p className="mt-0.5 text-xs text-[var(--cs-text-secondary)]">{f.reason}</p>
                        <p className="mt-1 text-xs"><span className="font-semibold">Try:</span> {f.suggestedAlternative}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <Dimension label="Child's voice" score={r.childVoiceCheck.score} feedback={r.childVoiceCheck.feedback} />
                <Dimension label="Risk clarity" score={r.riskClarityCheck.score} feedback={r.riskClarityCheck.feedback} />
                <Dimension label="Adult accountability" score={r.adultAccountabilityCheck.score} feedback={r.adultAccountabilityCheck.feedback} />
                <Dimension label="Future reader" score={r.futureReaderCheck.score} feedback={r.futureReaderCheck.feedback} />
              </div>

              {r.missingInformation.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><HelpCircle className="h-4 w-4" /> What's missing</CardTitle></CardHeader>
                  <CardContent><ul className="space-y-1 text-sm text-[var(--cs-text-secondary)]">{r.missingInformation.map((m, i) => <li key={i}>• {m}</li>)}</ul></CardContent>
                </Card>
              )}

              {r.safeguardingClarityNotes.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><ShieldAlert className="h-4 w-4" /> Safeguarding clarity</CardTitle></CardHeader>
                  <CardContent><ul className="space-y-1 text-sm text-[var(--cs-text-secondary)]">{r.safeguardingClarityNotes.map((m, i) => <li key={i}>• {m}</li>)}</ul></CardContent>
                </Card>
              )}

              {r.reflectiveQuestions.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><MessageSquareText className="h-4 w-4" /> Before you record — reflect</CardTitle></CardHeader>
                  <CardContent><ul className="space-y-1 text-sm text-[var(--cs-text-secondary)]">{r.reflectiveQuestions.map((q, i) => <li key={i}>• {q}</li>)}</ul></CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm">Child-conscious wording</CardTitle>
                  <CopyButton text={r.childReadableSuggestion} />
                </CardHeader>
                <CardContent><pre className="whitespace-pre-wrap font-sans text-sm text-[var(--cs-text-secondary)]">{r.childReadableSuggestion}</pre></CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm">Professional recording</CardTitle>
                  <CopyButton text={r.professionalRecordingSuggestion} />
                </CardHeader>
                <CardContent><pre className="whitespace-pre-wrap font-sans text-sm text-[var(--cs-text-secondary)]">{r.professionalRecordingSuggestion}</pre></CardContent>
              </Card>

              <p className="rounded-lg bg-[var(--cs-warning-bg)] px-3 py-2 text-xs text-[var(--cs-text-secondary)]">{r.disclaimer}</p>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
