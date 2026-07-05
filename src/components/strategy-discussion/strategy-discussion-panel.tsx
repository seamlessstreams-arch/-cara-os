"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Strategy Discussion Panel
//
// Assemble a draft from a child's records, then reason it through: the eight
// sections, evidence separated by kind, the Seven Threshold Reasoning
// Questions, and a named manager's judgement (with reasoning, either way).
// Cara drafts and structures; the threshold decision is human.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, FileText, Loader2, ShieldQuestion } from "lucide-react";
import {
  useStrategyMutation,
  useStrategyRequests,
  type StrategyRequestWithStatus,
} from "@/hooks/use-strategy-discussion";
import { EVIDENCE_KIND_LABELS, type EvidenceKind } from "@/lib/strategy-discussion/types";
import { BiasReflectionPanel } from "@/components/cognitive-bias/bias-reflection-panel";

const KIND_ORDER: EvidenceKind[] = ["direct", "reported", "observed", "pattern"];

function RequestRow({ item, questions }: { item: StrategyRequestWithStatus; questions: string[] }) {
  const { request, status } = item;
  const [open, setOpen] = useState(false);
  const mutate = useStrategyMutation();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [decidedBy, setDecidedBy] = useState("");
  const [reasoning, setReasoning] = useState("");

  const draft = request.status === "draft";

  return (
    <div className="rounded-lg border border-[var(--cs-border,#e2e8ec)] bg-[var(--cs-surface,#fff)] p-3">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-start justify-between gap-3 text-left" aria-expanded={open}>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--cs-text,#14202a)]">
            {request.childName ? `${request.childName} — ` : ""}
            {request.sections.headline_concern || "Strategy discussion draft"}
          </p>
          <p className="mt-0.5 text-xs text-[var(--cs-text-muted,#6c7a83)]">
            {request.status === "draft"
              ? `${status.sectionsComplete}/8 sections · ${status.questionsAnswered}/7 questions · ${request.evidence.length} evidenced items`
              : request.status === "manager_approved"
                ? `Manager approved — discussion requested (${request.managerDecision?.decidedBy})`
                : `Not pursued — threshold judged not met (${request.managerDecision?.decidedBy})`}
          </p>
        </div>
        {open ? <ChevronUp className="mt-0.5 h-4 w-4 shrink-0" /> : <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-[var(--cs-border,#e2e8ec)] pt-3">
          {/* Evidence, separated by kind */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#6c7a83)]">Evidence (by kind)</p>
            {KIND_ORDER.map((kind) => {
              const items = request.evidence.filter((e) => e.kind === kind);
              if (items.length === 0) return null;
              return (
                <div key={kind} className="mt-1">
                  <p className="text-[11px] font-medium text-[var(--cs-teal,#0d9488)]">{EVIDENCE_KIND_LABELS[kind]}</p>
                  <ul className="space-y-0.5">
                    {items.map((e, i) => (
                      <li key={i} className="text-xs text-[var(--cs-text,#14202a)]">• {e.text}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {request.unknowns.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#6c7a83)]">Unknowns (recorded honestly)</p>
              <ul className="mt-1 space-y-0.5">
                {request.unknowns.map((u, i) => (
                  <li key={i} className="text-xs text-[var(--cs-text-muted,#6c7a83)]">• {u}</li>
                ))}
              </ul>
            </div>
          )}

          {/* The Seven Threshold Reasoning Questions */}
          {draft && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#6c7a83)]">Seven Threshold Reasoning Questions</p>
              <div className="mt-1 space-y-2">
                {questions.map((q) => {
                  const existing = request.thresholdAnswers.find((a) => a.question === q);
                  return (
                    <div key={q}>
                      <p className="text-xs font-medium text-[var(--cs-text,#14202a)]">{q}</p>
                      <textarea
                        defaultValue={existing?.answer ?? ""}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [q]: e.target.value }))}
                        onBlur={() => answers[q] && mutate.mutate({ kind: "answer", requestId: request.id, question: q, answer: answers[q] })}
                        rows={2}
                        className="mt-0.5 w-full rounded-md border border-[var(--cs-border,#e2e8ec)] px-2 py-1 text-xs"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Manager judgement */}
          {draft ? (
            <div className="space-y-2 rounded-md bg-[var(--cs-surface-subtle,#f5f8f9)] p-3">
              <BiasReflectionPanel compact signal={{ context: "strategy_discussion", childVoiceQuoted: request.evidence.some((e) => e.kind === "direct") }} />
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#6c7a83)]">Manager threshold judgement</p>
              <input value={decidedBy} onChange={(e) => setDecidedBy(e.target.value)} placeholder="Your name (the manager)" className="w-full rounded-md border border-[var(--cs-border,#e2e8ec)] px-2 py-1.5 text-sm" />
              <textarea value={reasoning} onChange={(e) => setReasoning(e.target.value)} placeholder="Your reasoning — required either way" rows={2} className="w-full rounded-md border border-[var(--cs-border,#e2e8ec)] px-2 py-1.5 text-sm" />
              {mutate.isError && <p className="text-xs text-red-700">{(mutate.error as Error).message}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={mutate.isPending} onClick={() => mutate.mutate({ kind: "decide", requestId: request.id, decidedBy, requestDiscussion: true, reasoning })} className="rounded-md bg-[var(--cs-teal,#0d9488)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                  Threshold met — request discussion
                </button>
                <button type="button" disabled={mutate.isPending} onClick={() => mutate.mutate({ kind: "decide", requestId: request.id, decidedBy, requestDiscussion: false, reasoning })} className="rounded-md border border-[var(--cs-border,#e2e8ec)] px-3 py-1.5 text-xs font-medium text-[var(--cs-text,#14202a)] disabled:opacity-50">
                  Threshold not met — do not pursue
                </button>
              </div>
            </div>
          ) : (
            request.managerDecision && (
              <p className="rounded-md bg-[var(--cs-surface-subtle,#f5f8f9)] p-2 text-xs text-[var(--cs-text,#14202a)]">
                <b>{request.managerDecision.decidedBy}:</b> {request.managerDecision.reasoning}
              </p>
            )
          )}

          <p className="text-[11px] text-[var(--cs-text-muted,#6c7a83)]">{status.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

export function StrategyDiscussionPanel({ childId, childName }: { childId?: string; childName?: string }) {
  const { data, isLoading } = useStrategyRequests({ childId });
  const mutate = useStrategyMutation();
  const [creating, setCreating] = useState(false);
  const [concern, setConcern] = useState("");

  const requests = data?.data ?? [];
  const questions = data?.questions ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <ShieldQuestion className="h-4 w-4 text-[var(--cs-teal,#0d9488)]" />
          Strategy discussion — reasoning &amp; threshold
        </CardTitle>
        <CardDescription>
          Cara assembles the draft from this child&apos;s records — evidence separated by kind, unknowns stated
          honestly. Staff answer the Seven Threshold Questions; a named manager judges the threshold, either way.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!creating ? (
          <button type="button" onClick={() => setCreating(true)} disabled={!childId} title={childId ? undefined : "Open from a child record — the draft assembles from their records"} className="rounded-md border border-[var(--cs-border,#e2e8ec)] px-3 py-1.5 text-sm font-medium text-[var(--cs-text,#14202a)] hover:bg-[var(--cs-surface-subtle,#f5f8f9)] disabled:opacity-50">
            Assemble a draft from records
          </button>
        ) : (
          <div className="space-y-2 rounded-lg border border-[var(--cs-border,#e2e8ec)] p-3">
            <FileText className="h-4 w-4 text-[var(--cs-text-muted,#6c7a83)]" />
            <textarea value={concern} onChange={(e) => setConcern(e.target.value)} placeholder="The concern, in plain words (Cara pulls the evidence from the records)…" rows={2} className="w-full rounded-md border border-[var(--cs-border,#e2e8ec)] px-2 py-1.5 text-sm" />
            {mutate.isError && <p className="text-xs text-red-700">{(mutate.error as Error).message}</p>}
            <div className="flex gap-2">
              <button type="button" disabled={mutate.isPending || !concern.trim()} onClick={() => mutate.mutate({ kind: "create", childId, childName, concernSummary: concern }, { onSuccess: () => { setCreating(false); setConcern(""); } })} className="rounded-md bg-[var(--cs-teal,#0d9488)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
                {mutate.isPending ? "Assembling…" : "Assemble draft"}
              </button>
              <button type="button" onClick={() => setCreating(false)} className="rounded-md px-3 py-1.5 text-sm text-[var(--cs-text-muted,#6c7a83)]">Cancel</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#6c7a83)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-[var(--cs-text-muted,#6c7a83)]">No strategy-discussion drafts yet{childName ? ` for ${childName}` : ""}. Each is assembled from records and traced to them.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((item) => (
              <RequestRow key={item.request.id} item={item} questions={questions} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
