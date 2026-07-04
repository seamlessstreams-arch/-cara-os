"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — TAP Thinking Panel (at the point of decision)
//
// The five-stage scaffold — See Clearly → Think Deeply → Work Relationally →
// Act With Purpose → Sustain Practice — embedded where complex decisions are
// made. Professionals answer; TAP only structures. Honest completion: closing
// with unanswered questions requires a recorded reason.
//
// Progressive disclosure: compact list of sessions; one stage open at a time.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, CircleCheck, Circle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useTapMutation, useTapSessions, type TapSessionWithStatus } from "@/hooks/use-tap-thinking";
import { TAP_CONTEXT_LABELS, TAP_STAGES, type TapContext, type TapStage } from "@/lib/tap-thinking/types";
import { cn } from "@/lib/utils";

function SessionRow({ item, stages }: { item: TapSessionWithStatus; stages: Record<TapStage, { label: string; questions: string[] }> }) {
  const { session, status } = item;
  const [open, setOpen] = useState(false);
  const [openStage, setOpenStage] = useState<TapStage | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [incompleteReason, setIncompleteReason] = useState("");
  const mutate = useTapMutation();

  const inProgress = session.status === "in_progress";

  const saveStage = (stage: TapStage) => {
    const answers = stages[stage].questions
      .map((q) => ({ question: q, answer: drafts[`${stage}:${q}`] ?? "" }))
      .filter((a) => a.answer.trim().length > 0);
    if (answers.length === 0) return;
    mutate.mutate({ kind: "answer", sessionId: session.id, stage, answers });
  };

  return (
    <div className="rounded-lg border border-[var(--cs-border,#e2e8ec)] bg-[var(--cs-surface,#fff)] p-3">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-start justify-between gap-3 text-left" aria-expanded={open}>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--cs-text,#14202a)]">
            {TAP_CONTEXT_LABELS[session.context]}
            {session.childName ? ` — ${session.childName}` : ""}: {session.purpose}
          </p>
          <p className="mt-0.5 text-xs text-[var(--cs-text-muted,#6c7a83)]">
            {status.stagesComplete}/5 stages · {inProgress ? (status.nextQuestion ?? "in progress") : session.incompleteReason ? "completed with a recorded gap" : "complete"}
          </p>
        </div>
        {open ? <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-text-muted,#6c7a83)]" /> : <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-text-muted,#6c7a83)]" />}
      </button>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {status.stages.map((s) => (
          <span
            key={s.stage}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
              s.complete
                ? "border-[var(--cs-success-border,#bbe5c8)] bg-[var(--cs-success-bg,#eaf7ee)] text-[var(--cs-success-text,#1e6b40)]"
                : "border-[var(--cs-border,#e2e8ec)] bg-[var(--cs-surface,#fff)] text-[var(--cs-text-muted,#6c7a83)]",
            )}
          >
            {s.complete ? <CircleCheck className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
            {s.label} {s.answered}/{s.total}
          </span>
        ))}
      </div>

      {open && (
        <div className="mt-3 space-y-2 border-t border-[var(--cs-border,#e2e8ec)] pt-3">
          {TAP_STAGES.map((stage) => {
            const def = stages[stage];
            const stageOpen = openStage === stage;
            const existing = new Map(session.answers[stage].map((a) => [a.question, a.answer]));
            return (
              <div key={stage} className="rounded-md border border-[var(--cs-border,#e2e8ec)]">
                <button
                  type="button"
                  onClick={() => setOpenStage(stageOpen ? null : stage)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-[var(--cs-text,#14202a)]"
                >
                  {def.label}
                  {stageOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {stageOpen && (
                  <div className="space-y-2 border-t border-[var(--cs-border,#e2e8ec)] p-3">
                    {def.questions.map((q) => (
                      <div key={q}>
                        <p className="text-xs font-medium text-[var(--cs-text,#14202a)]">{q}</p>
                        {inProgress ? (
                          <textarea
                            defaultValue={existing.get(q) ?? ""}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [`${stage}:${q}`]: e.target.value }))}
                            rows={2}
                            className="mt-1 w-full rounded-md border border-[var(--cs-border,#e2e8ec)] px-2 py-1.5 text-sm"
                          />
                        ) : (
                          <p className="mt-0.5 text-xs text-[var(--cs-text-muted,#6c7a83)]">{existing.get(q) ?? "— not answered"}</p>
                        )}
                      </div>
                    ))}
                    {inProgress && (
                      <button
                        type="button"
                        disabled={mutate.isPending}
                        onClick={() => saveStage(stage)}
                        className="rounded-md bg-[var(--cs-teal,#0d9488)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                      >
                        Save {def.label} answers
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {inProgress && (
            <div className="space-y-2 pt-1">
              {!status.allStagesComplete && (
                <input
                  value={incompleteReason}
                  onChange={(e) => setIncompleteReason(e.target.value)}
                  placeholder="Completing with gaps? Record the honest reason…"
                  className="w-full rounded-md border border-[var(--cs-border,#e2e8ec)] px-2 py-1.5 text-xs"
                />
              )}
              {mutate.isError && <p className="text-xs text-red-700">{(mutate.error as Error).message}</p>}
              <button
                type="button"
                disabled={mutate.isPending}
                onClick={() => mutate.mutate({ kind: "complete", sessionId: session.id, incompleteReason: incompleteReason || undefined })}
                className="rounded-md border border-[var(--cs-border,#e2e8ec)] px-3 py-1.5 text-xs font-medium text-[var(--cs-text,#14202a)] hover:bg-[var(--cs-surface-subtle,#f5f8f9)]"
              >
                Complete session
              </button>
            </div>
          )}

          <p className="text-[11px] text-[var(--cs-text-muted,#6c7a83)]">{status.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

export function TapThinkingPanel({
  childId,
  childName,
  defaultContext = "management_oversight",
  sourceRecord,
}: {
  childId?: string;
  childName?: string;
  defaultContext?: TapContext;
  /** The record this thinking session grows from (traceability). */
  sourceRecord?: { recordType: string; recordId: string };
}) {
  const { data, isLoading } = useTapSessions({ childId });
  const mutate = useTapMutation();
  const [creating, setCreating] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [context, setContext] = useState<TapContext>(defaultContext);

  const items = data?.data ?? [];
  const stages = data?.stages;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Brain className="h-4 w-4 text-[var(--cs-teal,#0d9488)]" />
          TAP — Thinking &amp; Practising Mode
        </CardTitle>
        <CardDescription>
          See Clearly → Think Deeply → Work Relationally → Act With Purpose → Sustain Practice. TAP structures the
          thinking; the answers belong to the professionals in the room.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-md border border-[var(--cs-border,#e2e8ec)] px-3 py-1.5 text-sm font-medium text-[var(--cs-text,#14202a)] hover:bg-[var(--cs-surface-subtle,#f5f8f9)]"
          >
            Open a thinking session
          </button>
        ) : (
          <div className="space-y-2 rounded-lg border border-[var(--cs-border,#e2e8ec)] p-3">
            <select value={context} onChange={(e) => setContext(e.target.value as TapContext)} className="w-full rounded-md border border-[var(--cs-border,#e2e8ec)] px-2 py-1.5 text-sm">
              {Object.entries(TAP_CONTEXT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="What is this thinking session for?"
              rows={2}
              className="w-full rounded-md border border-[var(--cs-border,#e2e8ec)] px-2 py-1.5 text-sm"
            />
            {mutate.isError && <p className="text-xs text-red-700">{(mutate.error as Error).message}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={mutate.isPending || !sourceRecord}
                title={sourceRecord ? undefined : "Pick a record first — every session is traced to its source"}
                onClick={() =>
                  mutate.mutate(
                    {
                      kind: "create",
                      childId,
                      childName,
                      context,
                      purpose,
                      sourceRecords: sourceRecord ? [sourceRecord] : [],
                    },
                    { onSuccess: () => { setCreating(false); setPurpose(""); } },
                  )
                }
                className="rounded-md bg-[var(--cs-teal,#0d9488)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {mutate.isPending ? "Opening…" : "Start thinking"}
              </button>
              <button type="button" onClick={() => setCreating(false)} className="rounded-md px-3 py-1.5 text-sm text-[var(--cs-text-muted,#6c7a83)]">
                Cancel
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#6c7a83)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions…
          </p>
        ) : items.length === 0 ? (
          <p className="text-sm text-[var(--cs-text-muted,#6c7a83)]">
            No thinking sessions yet{childName ? ` for ${childName}` : ""}. Each one is traced to the record it grew
            from.
          </p>
        ) : stages ? (
          <div className="space-y-2">
            {items.map((item) => (
              <SessionRow key={item.session.id} item={item} stages={stages} />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
