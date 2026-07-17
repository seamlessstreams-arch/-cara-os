"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SILENT STRUGGLE (doctrine 1.5 / 2.2.2)
//
// The loud children are already seen. This surfaces the quiet ones — the child
// going withdrawn who generates no incidents and therefore no alarm. It never
// labels or diagnoses; it says "worth a gentle check-in" with the evidence and
// PACE- / neurodiversity-aware ways in.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSilentStruggle } from "@/hooks/use-silent-struggle";
import { EarOff, HeartHandshake, Loader2 } from "lucide-react";
import type { WithdrawalStatus } from "@/lib/silent-struggle/silent-struggle-engine";

const STATUS_META: Record<WithdrawalStatus, { label: string; cls: string }> = {
  concern: { label: "Worth a check-in", cls: "border-rose-300 bg-rose-50 text-rose-900" },
  watch: { label: "Keep a warm eye", cls: "border-amber-300 bg-amber-50 text-amber-900" },
  settled: { label: "Settled", cls: "border-emerald-300 bg-emerald-50 text-emerald-800" },
  insufficient: { label: "Not enough recorded", cls: "border-slate-300 bg-slate-50 text-slate-600" },
};

export default function SilentStrugglePage() {
  const q = useSilentStruggle();
  const d = q.data;

  return (
    <PageShell
      title="Silent Struggle"
      subtitle="The children going quiet — noticed by the absence of signal, not the presence of incidents"
    >
      <div className="space-y-6 animate-fade-in">
        {q.isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading the quiet…
          </div>
        )}

        {d && (
          <>
            <Card className="border-[var(--cs-info-soft,#bae6fd)] bg-[var(--cs-info-bg,#f0f9ff)]">
              <CardContent className="flex items-start gap-3 pt-5">
                <EarOff className="mt-0.5 h-5 w-5 shrink-0 text-[var(--cs-info,#0284c7)]" />
                <p className="text-sm leading-relaxed text-[var(--cs-text-secondary,#475569)]">
                  A child who has gone quiet generates less signal, not less need. This looks for the opposite of an
                  incident — falling engagement, a dropping mood, withdrawal described in the logs — especially where
                  there are <span className="font-semibold">no incidents at all</span>. It is a prompt for a gentle
                  conversation, never a label.
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-4">
              {([
                ["Worth a check-in", d.counts.concern, "text-rose-700"],
                ["Keep a warm eye", d.counts.watch, "text-amber-700"],
                ["Settled", d.counts.settled, "text-emerald-700"],
                ["Not enough recorded", d.counts.insufficient, "text-slate-500"],
              ] as const).map(([label, value, cls]) => (
                <Card key={label}><CardContent className="pt-5">
                  <p className={cn("text-2xl font-extrabold tabular-nums", cls)}>{value}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[var(--cs-text-secondary,#475569)]">{label}</p>
                </CardContent></Card>
              ))}
            </div>

            {d.reads.map((r) => {
              const st = STATUS_META[r.status];
              return (
                <Card key={r.childId}>
                  <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                      {r.childName}
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold", st.cls)}>{st.label}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-[var(--cs-text-secondary,#475569)]">{r.statusReason}</p>

                    {r.signals.length > 0 && (
                      <ul className="space-y-1.5">
                        {r.signals.map((s) => (
                          <li key={s.key} className={cn(
                            "rounded-lg border px-3 py-2 text-sm",
                            s.key === "quiet_and_unseen" ? "border-rose-200 bg-rose-50" : "border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-surface,#fff)]",
                          )}>
                            <span className="font-semibold text-[var(--cs-navy,#1e293b)]">{s.label}</span>
                            <span className="ml-1 text-xs text-[var(--cs-text-muted,#64748b)]">{s.evidence}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {r.waysIn.length > 0 && (
                      <div className="rounded-xl border border-[var(--cs-cara-gold-soft,#fde68a)] bg-[var(--cs-cara-gold-bg,#fffbeb)] p-3">
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-cara-gold,#b45309)]">
                          <HeartHandshake className="h-3.5 w-3.5" /> Ways in — gentle, no pressure
                        </p>
                        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-[var(--cs-text,#0f172a)]">
                          {r.waysIn.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              Reads the last six weeks of daily records. Cara notices patterns; it never diagnoses or labels a child.
              &ldquo;Not enough recorded&rdquo; is a recording gap to close, not a finding about the young person.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
