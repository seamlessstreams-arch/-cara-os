"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — PROFESSIONAL CHALLENGE (§5.15 / doctrine 1.11)
//
// Advocacy does not stop at the front door. When another agency's decision does
// not appear to protect the child, this tracks the challenge up the escalation
// ladder — with the doctrine's measure of success held in view: the CHILD's
// situation improving, not the challenge being sent.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useProfessionalChallenges } from "@/hooks/use-professional-challenge";
import { RUNG_LABEL, CHALLENGE_LADDER } from "@/lib/professional-challenge/professional-challenge-engine";
import { Scale, AlertTriangle, CheckCircle2, FileText, Loader2 } from "lucide-react";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  open: { label: "Open", cls: "border-amber-300 bg-amber-50 text-amber-900" },
  resolved_child_improved: { label: "Resolved — child better off", cls: "border-emerald-300 bg-emerald-50 text-emerald-900" },
  resolved_no_change: { label: "Closed — no change for child", cls: "border-rose-300 bg-rose-50 text-rose-900" },
  withdrawn: { label: "Withdrawn", cls: "border-slate-300 bg-slate-50 text-slate-700" },
};

export default function ProfessionalChallengePage() {
  const q = useProfessionalChallenges();
  const d = q.data;

  return (
    <PageShell
      title="Professional Challenge"
      subtitle="Challenging another agency's decision when it doesn't protect the child — measured by whether the child's situation improves, not by the challenge being made"
    >
      <div className="space-y-6 animate-fade-in">
        {q.isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading challenges…
          </div>
        )}

        {d && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {([
                ["Open", d.counts.open, "text-amber-700"],
                ["Resolved — child better off", d.counts.resolvedImproved, "text-emerald-700"],
                ["Closed — no change for child", d.counts.resolvedNoChange, "text-rose-700"],
              ] as const).map(([label, value, cls]) => (
                <Card key={label}><CardContent className="pt-5">
                  <p className={cn("text-2xl font-extrabold tabular-nums", cls)}>{value}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[var(--cs-text-secondary,#475569)]">{label}</p>
                </CardContent></Card>
              ))}
            </div>

            {d.detections.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-amber-600" /> What needs attention</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {d.detections.map((det) => (
                    <div key={`${det.challengeId}-${det.key}`} className={cn("rounded-lg border px-3 py-2 text-sm", det.tone === "positive" ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50")}>
                      <p className={cn("font-semibold", det.tone === "positive" ? "text-emerald-900" : "text-amber-900")}>{det.headline}</p>
                      <p className={cn("mt-0.5 text-xs", det.tone === "positive" ? "text-emerald-800" : "text-amber-800")}>
                        <span className="font-semibold">Why Cara is showing this:</span> {det.whyShown}
                      </p>
                      {det.suggestedNextRung && (
                        <p className="mt-1 text-xs font-medium text-amber-900">Suggested next step: {RUNG_LABEL[det.suggestedNextRung]}</p>
                      )}
                      {det.suggestedQuestions.length > 0 && (
                        <ul className="mt-1 list-disc pl-4 text-xs text-amber-800">{det.suggestedQuestions.map((qq) => <li key={qq}>{qq}</li>)}</ul>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Scale className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" /> Challenges</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {d.challenges.map((c) => {
                  const rungIdx = CHALLENGE_LADDER.indexOf(c.current_rung);
                  const st = STATUS_META[c.status] ?? STATUS_META.open;
                  return (
                    <div key={c.id} className="rounded-xl border border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-surface,#fff)] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[var(--cs-text,#0f172a)]">{c.decision_challenged}</p>
                          <p className="text-xs text-[var(--cs-text-muted,#64748b)]">
                            {c.agency} · {c.decision_maker_name}, {c.decision_maker_role} · {c.daysOpen}d open
                          </p>
                        </div>
                        <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold", st.cls)}>{st.label}</span>
                      </div>

                      {/* Ladder rail — labels, not colour alone */}
                      <div className="mt-3 flex flex-wrap items-center gap-1">
                        {CHALLENGE_LADDER.map((r, i) => (
                          <span key={r} className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            i < rungIdx && "border-emerald-200 bg-emerald-50 text-emerald-700",
                            i === rungIdx && c.status === "open" && "border-[var(--cs-cara-gold,#b45309)] bg-amber-50 text-amber-900",
                            i === rungIdx && c.status !== "open" && "border-slate-300 bg-slate-100 text-slate-600",
                            i > rungIdx && "border-[var(--cs-border,#e2e8f0)] text-[var(--cs-text-muted,#94a3b8)]",
                          )}>
                            {i < rungIdx ? "✓ " : ""}{RUNG_LABEL[r]}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-[var(--cs-text-secondary,#475569)] sm:grid-cols-2">
                        <p><span className="font-semibold">Concern:</span> {c.reason}</p>
                        <p><span className="font-semibold">Basis:</span> {c.threshold_basis}</p>
                        <p><span className="font-semibold">Wanted:</span> {c.desired_resolution}</p>
                        {c.child_situation_outcome && <p><span className="font-semibold">Outcome for the child:</span> {c.child_situation_outcome}</p>}
                      </div>

                      {c.communications.length > 0 && (
                        <div className="mt-3 border-t border-[var(--cs-border-subtle,#f1f5f9)] pt-2">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--cs-text-muted,#64748b)]">Communication trail</p>
                          <ul className="mt-1 space-y-1">
                            {c.communications.map((m) => (
                              <li key={m.id} className="text-xs text-[var(--cs-text-secondary,#475569)]">
                                <span className="tabular-nums text-[var(--cs-text-muted,#94a3b8)]">{m.at.slice(0, 10)}</span> · {m.person_name} ({m.person_role}, {m.agency}) · {m.method} — {m.summary}
                                {m.written_followup
                                  ? <FileText className="ml-1 inline h-3 w-3 text-emerald-600" />
                                  : <span className="ml-1 rounded bg-amber-100 px-1 text-[9px] font-semibold text-amber-800">no written trail</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
                {d.challenges.length === 0 && <p className="text-sm text-[var(--cs-text-muted,#64748b)]">No professional challenges recorded.</p>}
              </CardContent>
            </Card>

            {!d.writeEnabled && (
              <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
                Read-only: opening and progressing challenges is gated behind the professional_challenge_write flag, which is off. Detections still run.
              </p>
            )}
            <p className="flex items-start gap-1.5 px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--cs-cara-gold,#b45309)]" />
              A challenge is only a success when the child&rsquo;s situation improves. Professional disagreement is not misconduct — a complete history is preserved.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
