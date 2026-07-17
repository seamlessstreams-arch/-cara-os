"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SHIFT LIFECYCLE (doctrine 2.1.1)
//
// A team leader's shift, walked: arriving prepared, holding the shift, leaving
// it well. Two things this page must always tell the truth about —
//   · what Cara can see, versus what only the person who was there knows;
//   · that sign-off is never refused, only asked to explain itself.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useShiftLifecycle,
  useAttestCheck,
  useSignOffShift,
} from "@/hooks/use-shift-lifecycle";
import {
  stageLabel,
  stageSubtitle,
  type LifecycleStage,
  type ResolvedCheck,
} from "@/lib/shift-lifecycle/shift-lifecycle-engine";
import {
  ClipboardCheck,
  CheckCircle2,
  CircleDashed,
  EyeOff,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";

const STAGES: LifecycleStage[] = ["before", "during", "throughout", "end"];

const STATUS_UI = {
  confirmed: { icon: CheckCircle2, cls: "text-emerald-600", chip: "border-emerald-300 bg-emerald-50 text-emerald-800", word: "Done" },
  outstanding: { icon: AlertCircle, cls: "text-amber-600", chip: "border-amber-300 bg-amber-50 text-amber-900", word: "Still open" },
  not_visible: { icon: EyeOff, cls: "text-slate-400", chip: "border-slate-300 bg-slate-50 text-slate-600", word: "Cara can't see this" },
  awaiting: { icon: CircleDashed, cls: "text-slate-400", chip: "border-slate-300 bg-slate-50 text-slate-600", word: "Yours to answer" },
} as const;

export default function ShiftLifecyclePage() {
  const q = useShiftLifecycle();
  const attest = useAttestCheck();
  const signOff = useSignOffShift();
  const [reason, setReason] = useState("");
  const [signOffError, setSignOffError] = useState<string | null>(null);

  const d = q.data;
  const lc = d?.lifecycle;

  const doSignOff = async () => {
    if (!d?.shift) return;
    setSignOffError(null);
    try {
      await signOff.mutateAsync({ shift_id: d.shift.id, override_reason: reason || undefined });
      setReason("");
    } catch (e: unknown) {
      setSignOffError(e instanceof Error ? e.message : "Could not sign off.");
    }
  };

  return (
    <PageShell
      title="Shift Lifecycle"
      subtitle="Arriving prepared, holding the shift, leaving it well — the discipline, walked with you"
    >
      <div className="space-y-6 animate-fade-in">
        {q.isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading your shift…
          </div>
        )}

        {d && !d.shift && (
          <Card>
            <CardContent className="pt-5 text-sm text-[var(--cs-text-secondary,#475569)]">
              {d.message ?? "No shift on record for you yet."}
            </CardContent>
          </Card>
        )}

        {d && lc && (
          <>
            <Card>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 pt-5">
                <div>
                  <p className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">
                    {d.staffName} — {d.shift?.shift_type?.replace(/_/g, " ")} shift, {lc.date}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--cs-text-secondary,#475569)]">
                    {lc.summary}
                  </p>
                </div>
                <div className="flex gap-2 text-center">
                  {([
                    ["Done", lc.counts.confirmed, "text-emerald-700"],
                    ["Still open", lc.counts.outstanding, lc.counts.outstanding ? "text-amber-700" : "text-slate-400"],
                    ["Yours to answer", lc.counts.awaiting, "text-slate-500"],
                    ["Not visible", lc.counts.notVisible, "text-slate-400"],
                  ] as const).map(([l, v, cls]) => (
                    <div key={l} className="min-w-[74px] rounded-lg border border-[var(--cs-border,#e2e8f0)] px-2 py-1.5">
                      <p className={cn("text-lg font-extrabold tabular-nums", cls)}>{v}</p>
                      <p className="text-[10px] font-semibold text-[var(--cs-text-muted,#64748b)]">{l}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {STAGES.map((stage) => {
              const checks = lc.checks.filter((c) => c.stage === stage);
              if (checks.length === 0) return null;
              return (
                <Card key={stage}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-baseline gap-2 text-base">
                      <ClipboardCheck className="h-4 w-4 shrink-0 self-center text-[var(--cs-cara-gold,#b45309)]" />
                      {stageLabel(stage)}
                      <span className="text-xs font-normal text-[var(--cs-text-muted,#64748b)]">
                        {stageSubtitle(stage)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {checks.map((c) => (
                      <CheckRow
                        key={c.id}
                        check={c}
                        writeEnabled={d.writeEnabled}
                        onAttest={() =>
                          d.shift && attest.mutate({ shift_id: d.shift.id, check_id: c.id })
                        }
                      />
                    ))}
                  </CardContent>
                </Card>
              );
            })}

            <Card className={cn(lc.signedOffAt ? "border-emerald-200 bg-emerald-50" : lc.signOff.clear ? "" : "border-amber-200 bg-amber-50")}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">End of shift</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-[var(--cs-text-secondary,#475569)]">{lc.signOff.message}</p>

                {lc.signedOffAt ? (
                  <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm">
                    <p className="font-semibold text-emerald-800">Signed off.</p>
                    {lc.overrideReason && (
                      <p className="mt-1 text-xs text-[var(--cs-text-secondary,#475569)]">
                        Recorded as outstanding: {lc.overrideReason}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {lc.signOff.requiresReason && (
                      <div className="space-y-1.5">
                        {lc.signOff.blockers.map((b) => (
                          <div key={b.checkId} className="rounded-lg border border-amber-200 bg-white px-3 py-2">
                            <p className="text-xs font-semibold text-amber-900">{b.label}</p>
                            {b.outstanding.map((o) => (
                              <p key={o} className="text-xs text-[var(--cs-text-secondary,#475569)]">
                                · {o}
                              </p>
                            ))}
                          </div>
                        ))}
                        <label className="block pt-1 text-xs font-semibold text-[var(--cs-text-secondary,#475569)]">
                          What&rsquo;s outstanding, and who&rsquo;s picking it up?
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={2}
                          placeholder="e.g. Casey's log outstanding — Priya is writing it up on the night shift."
                          className="w-full rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-surface,#fff)] px-3 py-2 text-sm"
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      <Button onClick={doSignOff} disabled={!d.writeEnabled || signOff.isPending} size="sm">
                        {signOff.isPending ? "Signing off…" : "Sign off this shift"}
                      </Button>
                      {!d.writeEnabled && (
                        <span className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted,#64748b)]">
                          <Lock className="h-3 w-3" /> Sign-off isn&rsquo;t switched on in this environment
                          (shift_lifecycle_write) — the walkthrough above is live and read-only.
                        </span>
                      )}
                    </div>
                    {signOffError && <p className="text-xs text-amber-800">{signOffError}</p>}
                  </>
                )}

                <p className="border-t border-[var(--cs-border,#e2e8f0)] pt-3 text-xs text-[var(--cs-text-muted,#64748b)]">
                  Sign-off is never refused. Where handover or the day&rsquo;s records are still open, Cara asks
                  what&rsquo;s outstanding and records your answer — that note is worth more to the next shift than a
                  button that wouldn&rsquo;t press. Nothing here can hold up raising a safeguarding concern.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageShell>
  );
}

function CheckRow({
  check,
  writeEnabled,
  onAttest,
}: {
  check: ResolvedCheck;
  writeEnabled: boolean;
  onAttest: () => void;
}) {
  const ui = STATUS_UI[check.status];
  const Icon = ui.icon;
  return (
    <div className="rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-surface,#fff)] px-3 py-2">
      <div className="flex items-start gap-2.5">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", ui.cls)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--cs-text,#0f172a)]">{check.label}</span>
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", ui.chip)}>
              {ui.word}
            </span>
            {check.kind === "attested" && (
              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                Only you know
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs italic text-[var(--cs-text-muted,#64748b)]">{check.why}</p>
          <p className="mt-1 text-xs text-[var(--cs-text-secondary,#475569)]">{check.reason}</p>
          {check.outstanding.map((o) => (
            <p key={o} className="mt-0.5 text-xs font-medium text-amber-800">
              · {o}
            </p>
          ))}
          {check.evidence.slice(0, 4).map((e) => (
            <p key={e} className="mt-0.5 text-xs text-[var(--cs-text-muted,#64748b)]">
              · {e}
            </p>
          ))}
        </div>
        {check.kind === "attested" && check.status !== "confirmed" && (
          <Button size="sm" variant="outline" onClick={onAttest} disabled={!writeEnabled} className="shrink-0">
            Confirm
          </Button>
        )}
      </div>
    </div>
  );
}
