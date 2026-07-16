"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — VOICE FOLLOW-THROUGH (§5.2 closed loop)
//
// A concern a child raises is not "done" when an adult acted — it is done when
// the child has been told what happened and asked whether it helped:
//
//   LISTEN → SAFEGUARDING CHECK → CONSIDER → AGREE ACTION → ACT
//         → EXPLAIN BACK → REVIEW WITH CHILD
//
// The board is read-only until the voice_follow_through_write flag is enabled;
// the detections (incl. "voice without response") always run.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useVoiceFollowThrough } from "@/hooks/use-voice-follow-through";
import { VOICE_LOOP_STAGES } from "@/lib/voice-of-child/voice-follow-through-engine";
import { Ear, CheckCircle2, AlertTriangle, MessageCircleHeart, Loader2 } from "lucide-react";

const STAGE_LABEL: Record<string, string> = {
  listened: "Listened",
  safeguarding_checked: "Safeguarding checked",
  considered: "Considered",
  action_agreed: "Action agreed",
  acting: "Acting",
  explained_back: "Explained back",
  reviewed_with_child: "Reviewed with child",
  closed: "Closed",
};

export default function VoiceFollowThroughPage() {
  const q = useVoiceFollowThrough();
  const d = q.data;

  return (
    <PageShell
      title="Voice Follow-Through"
      subtitle="What happened to each concern a child raised — through to telling them, and asking whether it helped"
    >
      <div className="space-y-6 animate-fade-in">
        {q.isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading the loops…
          </div>
        )}

        {d && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {([
                ["Open loops", d.counts.open, "text-[var(--cs-navy,#1e293b)]"],
                ["Awaiting explain-back", d.counts.awaitingExplainBack, "text-amber-700"],
                ["Closed with the child", d.counts.closed, "text-emerald-700"],
              ] as const).map(([label, value, cls]) => (
                <Card key={label}>
                  <CardContent className="pt-5">
                    <p className={cn("text-2xl font-extrabold tabular-nums", cls)}>{value}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[var(--cs-text-secondary,#475569)]">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {d.detections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-amber-600" /> What needs attention
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {d.detections.map((det) => (
                    <div
                      key={`${det.loopId}-${det.key}`}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm",
                        det.tone === "positive" ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50",
                      )}
                    >
                      <p className={cn("font-semibold", det.tone === "positive" ? "text-emerald-900" : "text-amber-900")}>
                        {det.headline}
                      </p>
                      <p className={cn("mt-0.5 text-xs", det.tone === "positive" ? "text-emerald-800" : "text-amber-800")}>
                        <span className="font-semibold">Why Cara is showing this:</span> {det.whyShown}
                      </p>
                      {det.suggestedQuestions.length > 0 && (
                        <ul className="mt-1 list-disc pl-4 text-xs text-amber-800">
                          {det.suggestedQuestions.map((qq) => <li key={qq}>{qq}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Ear className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" /> The loops
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {d.loops.map((l) => {
                  const stageIdx = VOICE_LOOP_STAGES.indexOf(l.stage);
                  return (
                    <div key={l.id} className="rounded-xl border border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-surface,#fff)] p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <MessageCircleHeart className="h-4 w-4 shrink-0 text-[var(--cs-cara-gold,#b45309)]" />
                        <p className="text-sm font-semibold text-[var(--cs-text,#0f172a)]">“{l.concern}”</p>
                        <span className="text-xs text-[var(--cs-text-muted,#64748b)]">
                          {l.raised_via} · raised {l.timesRaised}× · {l.daysAtStage}d at stage
                        </span>
                      </div>
                      {/* Stage rail — labels, not colour alone */}
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        {VOICE_LOOP_STAGES.map((s, i) => (
                          <span
                            key={s}
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                              i < stageIdx && "border-emerald-200 bg-emerald-50 text-emerald-700",
                              i === stageIdx && "border-[var(--cs-cara-gold,#b45309)] bg-amber-50 text-amber-900",
                              i > stageIdx && "border-[var(--cs-border,#e2e8f0)] text-[var(--cs-text-muted,#94a3b8)]",
                            )}
                          >
                            {i < stageIdx ? "✓ " : ""}{STAGE_LABEL[s]}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-[var(--cs-text-secondary,#475569)]">
                        <span className="font-semibold">Next:</span> {l.nextStep}
                      </p>
                      {l.explain_back_note && (
                        <p className="mt-1 text-xs text-[var(--cs-text-secondary,#475569)]">
                          <CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-600" />
                          Told the child: {l.explain_back_note}
                        </p>
                      )}
                      {l.review_with_child_note && (
                        <p className="mt-0.5 text-xs text-[var(--cs-text-secondary,#475569)]">
                          <CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-600" />
                          Child's review: {l.review_with_child_note}
                        </p>
                      )}
                    </div>
                  );
                })}
                {d.loops.length === 0 && (
                  <p className="text-sm text-[var(--cs-text-muted,#64748b)]">
                    No concern loops recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>

            {!d.writeEnabled && (
              <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
                The board is read-only: opening and progressing loops is gated behind the
                voice_follow_through_write flag, which is off. Detections still run.
              </p>
            )}
            <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              Children are never promised complete confidentiality — where something must be shared to
              keep them or someone else safe, staff explain that to the child at the point of listening.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
