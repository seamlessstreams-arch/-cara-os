"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — EDUCATION DISRUPTION (§5.18 / doctrine 1.17)
//
// School instability is a care-planning event, not an education footnote.
// Suspensions prompt interim-PEP consideration; managed moves that read as
// trials get scrutiny; informal send-homes surface as prohibited practice.
// Every trigger carries its statutory basis — and none is a determination.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEducationDisruption } from "@/hooks/use-education-disruption";
import { GraduationCap, AlertTriangle, Scale, Loader2, BookOpen } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  suspension: "Suspension",
  exclusion: "Exclusion",
  managed_move: "Managed move",
  reduced_timetable: "Reduced timetable",
  informal_send_home: "Informal send-home",
};

export default function EducationDisruptionPage() {
  const q = useEducationDisruption();
  const d = q.data;

  return (
    <PageShell
      title="Education Disruption"
      subtitle="School instability is a care-planning event, not an education footnote"
    >
      <div className="space-y-6 animate-fade-in">
        {q.isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading education records…
          </div>
        )}

        {d && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {([
                ["Children with disruption", d.counts.childrenWithDisruption, "text-amber-700"],
                ["Open triggers", d.counts.openTriggers, "text-rose-700"],
                ["Responded well", d.counts.positives, "text-emerald-700"],
              ] as const).map(([label, value, cls]) => (
                <Card key={label}><CardContent className="pt-5">
                  <p className={cn("text-2xl font-extrabold tabular-nums", cls)}>{value}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[var(--cs-text-secondary,#475569)]">{label}</p>
                </CardContent></Card>
              ))}
            </div>

            <Card className="border-[var(--cs-info-soft,#bae6fd)] bg-[var(--cs-info-bg,#f0f9ff)]">
              <CardContent className="flex items-start gap-3 pt-5">
                <Scale className="mt-0.5 h-5 w-5 shrink-0 text-[var(--cs-info,#0284c7)]" />
                <div className="text-sm leading-relaxed text-[var(--cs-text-secondary,#475569)]">
                  <p className="font-semibold text-[var(--cs-navy,#1e293b)]">{d.statutoryBasis.name} — statutory from {d.statutoryBasis.effective_from}</p>
                  <p className="mt-1">{d.statutoryBasis.points.interim_pep} {d.statutoryBasis.points.managed_moves}</p>
                  <p className="mt-1 text-xs text-[var(--cs-text-muted,#64748b)]">{d.statutoryBasis.governance_note}</p>
                </div>
              </CardContent>
            </Card>

            {d.reads.filter((r) => !r.stable).map((r) => (
              <Card key={r.childId}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GraduationCap className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" /> {r.childName}
                    <span className="text-xs font-normal text-[var(--cs-text-muted,#64748b)]">
                      {r.disruptionEvents.length} disruption event(s)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1">
                    {r.disruptionEvents.map((e) => (
                      <li key={e.id} className="flex flex-wrap items-center gap-2 text-sm text-[var(--cs-text,#0f172a)]">
                        <span className="rounded-full border border-[var(--cs-border,#e2e8f0)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--cs-text-secondary,#475569)]">
                          {TYPE_LABEL[e.record_type] ?? e.record_type}
                        </span>
                        <span className="tabular-nums text-xs text-[var(--cs-text-muted,#94a3b8)]">{e.date}</span>
                        {e.title}
                      </li>
                    ))}
                  </ul>

                  {r.triggers.map((t) => (
                    <div
                      key={t.key + t.evidenceRecordIds.join()}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm",
                        t.tone === "positive" ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50",
                      )}
                    >
                      <p className={cn("font-semibold", t.tone === "positive" ? "text-emerald-900" : "text-amber-900")}>{t.headline}</p>
                      <p className={cn("mt-0.5 text-xs", t.tone === "positive" ? "text-emerald-800" : "text-amber-800")}>
                        <span className="font-semibold">Why Cara is showing this:</span> {t.whyShown}
                      </p>
                      {t.statutoryBasis && (
                        <p className="mt-1 flex items-start gap-1 text-xs text-amber-900">
                          <BookOpen className="mt-0.5 h-3 w-3 shrink-0" />
                          <span><span className="font-semibold">Basis:</span> {t.statutoryBasis}</span>
                        </p>
                      )}
                      {t.suggestedActions.length > 0 && (
                        <ul className="mt-1 list-disc pl-4 text-xs text-amber-800">
                          {t.suggestedActions.map((a) => <li key={a}>{a}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {d.reads.every((r) => r.stable) && (
              <Card><CardContent className="p-6 text-sm text-[var(--cs-text-secondary,#475569)]">
                No education disruption recorded for any child currently placed.
              </CardContent></Card>
            )}

            <p className="flex items-start gap-1.5 px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--cs-cara-gold,#b45309)]" />
              Cara prompts consideration and cites the statutory basis — it never determines that a school acted
              unlawfully. That judgement, and any challenge, belongs to the Registered Manager.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
