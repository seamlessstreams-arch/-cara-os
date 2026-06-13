"use client";

// CARA — Compliance Documents: read a compliance document, see the dates and
// actions inside it, track those actions, and keep oversight — so nothing rots
// in a folder and the development plan keeps moving.

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DictationButton } from "@/components/common/dictation-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useComplianceOversight, useComplianceDocuments, useIngestComplianceDoc, useTrackComplianceActions,
} from "@/hooks/use-compliance";
import { COMPLIANCE_CATEGORIES } from "@/lib/compliance/compliance-oversight-engine";
import { DOCUMENT_CATEGORY_LABELS, type DocumentIntelCategory } from "@/types/documents";
import { FileText, Sparkles, CalendarClock, AlertTriangle, CheckCircle2, ListChecks, ShieldCheck, Clock } from "lucide-react";

const CATEGORY_OPTIONS = [...COMPLIANCE_CATEGORIES]
  .map((c) => ({ value: c as DocumentIntelCategory, label: DOCUMENT_CATEGORY_LABELS[c] }))
  .sort((a, b) => a.label.localeCompare(b.label));

const RATING_CHIP: Record<string, string> = {
  good: "bg-[var(--cs-success-bg)] text-[var(--cs-success)]",
  adequate: "bg-[var(--cs-teal-bg)] text-[var(--cs-teal)]",
  needs_attention: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]",
  inadequate: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",
};
const RATING_LABEL: Record<string, string> = { good: "Good", adequate: "Adequate", needs_attention: "Needs attention", inadequate: "Inadequate" };
const STATE_CHIP: Record<string, string> = {
  current: "bg-[var(--cs-success-bg)] text-[var(--cs-success)]",
  expiring: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]",
  overdue: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",
  no_date: "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]",
};
const STATE_LABEL: Record<string, string> = { current: "Current", expiring: "Due soon", overdue: "Overdue", no_date: "No date" };
const RISK_CHIP: Record<string, string> = {
  low: "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]", medium: "bg-[var(--cs-teal-bg)] text-[var(--cs-teal)]",
  high: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]", critical: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",
};

function fmt(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ComplianceDocumentsPage() {
  const oversight = useComplianceOversight();
  const docs = useComplianceDocuments();
  const ingest = useIngestComplianceDoc();
  const track = useTrackComplianceActions();
  const o = oversight.data?.data;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("auto");
  const [text, setText] = useState("");

  const analysed = ingest.data?.data;
  const ai = analysed?.ai_result;
  const keyDates = useMemo(() => (ai?.extracted_entities?.dates ?? []).filter((d) => d.label === "Review due" || d.label === "Expiry"), [ai]);

  const onAnalyse = () => { track.reset(); ingest.mutate({ text, title: title.trim() || undefined, category: category === "auto" ? null : (category as DocumentIntelCategory) }); };
  const onTrack = () => { if (analysed) track.mutate({ documentId: analysed.id }); };
  const onClear = () => { setText(""); setTitle(""); setCategory("auto"); ingest.reset(); track.reset(); };

  const untracked = (ai?.suggested_tasks ?? []).filter((s) => !s.created_task_id);

  return (
    <PageShell
      title="Compliance Documents"
      subtitle="Upload a compliance document and Cara reads it — the dates, the actions, and what needs your attention."
      showQuickCreate={false}
    >
      <div className="space-y-6">
        {/* ── Add a document ── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--cs-teal)]" />
            <CardTitle className="text-sm">Add a compliance document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label className="text-xs">Title (optional)</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Statement of Purpose 2026" className="mt-1 h-9" /></div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    {CATEGORY_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between"><Label className="text-xs">Paste the document text</Label><DictationButton mode="append" size="sm" onTranscript={(t) => setText((p) => (p.trim() ? `${p}\n${t}` : t))} /></div>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="Paste the contents of the Statement of Purpose, development plan, fire risk assessment, policy… Cara will pull out the review date, expiry and the actions inside it." className="mt-1 text-sm" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={onAnalyse} disabled={text.trim().length < 20 || ingest.isPending} className="gap-1.5"><Sparkles className="h-4 w-4" />{ingest.isPending ? "Reading…" : "Analyse with Cara"}</Button>
              {(text.trim() || analysed) && <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>}
              {ingest.isError && <span className="text-xs text-[var(--cs-risk)]">{(ingest.error as Error)?.message || "Couldn't read that — try again."}</span>}
            </div>

            {/* Extraction result */}
            {analysed && ai && (
              <div className="mt-1 space-y-3 rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--cs-navy)]">{analysed.category_label ?? ai.document_category_label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${RISK_CHIP[ai.ai_risk_level] ?? RISK_CHIP.low}`}>{ai.ai_risk_level} risk</span>
                </div>
                <p className="text-xs text-[var(--cs-text-secondary)]">{ai.ai_summary}</p>
                {keyDates.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {keyDates.map((d) => <span key={d.label} className="inline-flex items-center gap-1 rounded-md bg-[var(--cs-surface-elevated)] px-2 py-1 text-[11px] text-[var(--cs-text-secondary)]"><CalendarClock className="h-3 w-3 text-[var(--cs-teal)]" />{d.label}: <b>{fmt(d.value)}</b></span>)}
                  </div>
                )}
                {ai.risk_flags.length > 0 && (
                  <ul className="space-y-1">
                    {ai.risk_flags.map((f, i) => <li key={i} className="flex items-start gap-1.5 text-[11px] text-[var(--cs-warning)]"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{f.description}</li>)}
                  </ul>
                )}
                {ai.suggested_tasks.length > 0 ? (
                  <div>
                    <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]"><ListChecks className="h-3.5 w-3.5" /> Actions found ({ai.suggested_tasks.length})</p>
                    <div className="space-y-1">
                      {ai.suggested_tasks.map((s) => (
                        <div key={s.id} className="flex items-start justify-between gap-2 rounded-lg bg-[var(--cs-surface-elevated)] p-2">
                          <div className="min-w-0">
                            <p className="text-xs text-[var(--cs-navy)]">{s.title}</p>
                            <p className="text-[10px] text-[var(--cs-text-gentle)]">{s.responsible_person ? `${s.responsible_person} · ` : ""}{s.due_date ? `due ${fmt(s.due_date)}` : "no due date"}{s.created_task_id ? " · tracked ✓" : ""}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${RISK_CHIP[s.priority === "urgent" ? "critical" : s.priority] ?? RISK_CHIP.low}`}>{s.priority}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button size="sm" onClick={onTrack} disabled={untracked.length === 0 || track.isPending} className="gap-1.5"><ListChecks className="h-3.5 w-3.5" />{track.isPending ? "Tracking…" : track.data ? "Tracked" : `Track ${untracked.length} action${untracked.length === 1 ? "" : "s"}`}</Button>
                      {track.data && <span className="text-xs font-medium text-[var(--cs-success)]">Added {track.data.data.created_count} to your tasks & calendar.</span>}
                    </div>
                  </div>
                ) : <p className="text-xs text-[var(--cs-text-muted)]">No actions found in this document.</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Oversight ── */}
        {oversight.isLoading && <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Building the compliance picture…</CardContent></Card>}
        {o && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[var(--cs-surface)] px-4 py-3">
              <ShieldCheck className="h-5 w-5 text-[var(--cs-teal)]" />
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${RATING_CHIP[o.rating]}`}>{RATING_LABEL[o.rating]}</span>
              <span className="text-2xl font-extrabold tracking-tight text-[var(--cs-navy)]">{o.score}<span className="text-sm font-medium text-[var(--cs-text-muted)]">/100</span></span>
              <span className="text-xs text-[var(--cs-text-secondary)]">{o.headline}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { label: "Documents", value: o.summary.total_documents, bad: false },
                { label: "Overdue", value: o.summary.overdue_documents, bad: o.summary.overdue_documents > 0 },
                { label: "Due soon", value: o.summary.expiring_documents, bad: o.summary.expiring_documents > 0 },
                { label: "Open actions", value: o.summary.open_actions, bad: false },
                { label: "Overdue actions", value: o.summary.overdue_actions, bad: o.summary.overdue_actions > 0 },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-[var(--cs-surface)] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">{s.label}</p>
                  <p className={`mt-0.5 text-2xl font-extrabold tracking-tight ${s.bad ? "text-[var(--cs-warning)]" : "text-[var(--cs-navy)]"}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {o.critical_dates.length > 0 && (
              <CardErrorBoundary>
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2"><Clock className="h-4 w-4 text-[var(--cs-warning)]" /><CardTitle className="text-sm">Critical dates — next 60 days</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-1.5">
                      {o.critical_dates.map((c) => (
                        <div key={`${c.document_id}-${c.kind}`} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-[var(--cs-text-secondary)]">{c.title} · {c.kind}</span>
                          <span className={c.days_until < 0 ? "font-semibold text-[var(--cs-risk)]" : c.days_until <= 14 ? "font-semibold text-[var(--cs-warning)]" : "text-[var(--cs-text-muted)]"}>{fmt(c.date)} {c.days_until < 0 ? `(${Math.abs(c.days_until)}d ago)` : `(in ${c.days_until}d)`}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardErrorBoundary>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center gap-2"><FileText className="h-4 w-4 text-[var(--cs-teal)]" /><CardTitle className="text-sm">Documents</CardTitle></CardHeader>
              <CardContent>
                {o.documents.length === 0 ? (
                  <p className="py-2 text-sm text-[var(--cs-text-muted)]">No compliance documents yet — add one above and Cara will start tracking it.</p>
                ) : (
                  <div className="space-y-1.5">
                    {o.documents.map((p) => (
                      <div key={p.id} className="flex items-start justify-between gap-2 rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] p-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--cs-navy)]">{p.title} <span className="font-normal text-[var(--cs-text-muted)]">· {p.category_label}</span></p>
                          <p className="text-xs text-[var(--cs-text-secondary)]">{p.message}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATE_CHIP[p.state]}`}>{STATE_LABEL[p.state]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {o.recommendations.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--cs-navy)]" /><CardTitle className="text-sm">What to do next</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {o.recommendations.map((r) => (
                      <li key={r.rank} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]">
                        <span className={`mt-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${r.urgency === "immediate" ? "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]" : r.urgency === "soon" ? "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]" : "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]"}`}>{r.urgency}</span>
                        {r.action}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <p className="flex items-start gap-2 text-xs text-[var(--cs-text-gentle)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Cara reads the text you provide and surfaces dates and actions to help you keep on top of compliance. It supports your judgement — review every action, and tracked actions appear in your <Link href="/calendar" className="font-semibold text-[var(--cs-teal)] underline-offset-2 hover:underline">calendar</Link> and tasks.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
