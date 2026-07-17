"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — TIMES & PLACES (routine-activity lens, doctrine 2.2.10)
//
// When is this home thinnest, and does anything cluster there? Feeds the risk
// assessment.
//
// What this page must never become: a map of dangerous children. It shows times
// and places and who was around — the only leg of the lens that points at us,
// and the only one anybody can change.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRoutineActivity } from "@/hooks/use-routine-activity";
import { bandLabel, type Band } from "@/lib/theory-lens/routine-activity-engine";
import { MapPin, Users, Clock, HelpCircle, Loader2, Split } from "lucide-react";

const BAND_TINT: Record<Band, string> = {
  morning: "border-sky-200 bg-sky-50 text-sky-900",
  afternoon: "border-amber-200 bg-amber-50 text-amber-900",
  evening: "border-violet-200 bg-violet-50 text-violet-900",
  night: "border-slate-300 bg-slate-100 text-slate-800",
  unknown: "border-slate-200 bg-slate-50 text-slate-500",
};

export default function RoutineActivityPage() {
  const q = useRoutineActivity();
  const d = q.data;

  return (
    <PageShell
      title="Times & Places"
      subtitle="When is the home thinnest, and does anything cluster there — a question for the risk assessment"
    >
      <div className="space-y-6 animate-fade-in">
        {q.isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Looking at the week…
          </div>
        )}

        {q.isError && (
          <Card>
            <CardContent className="pt-5 text-sm text-[var(--cs-text-secondary,#475569)]">
              This view is a manager&rsquo;s — it feeds the risk assessment.
            </CardContent>
          </Card>
        )}

        {d && (
          <>
            <Card>
              <CardContent className="flex items-start gap-3 pt-5">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[var(--cs-cara-gold,#b45309)]" />
                <div>
                  <p className="text-sm leading-relaxed text-[var(--cs-text-secondary,#475569)]">{d.summary}</p>
                  <p className="mt-2 text-xs text-[var(--cs-text-muted,#64748b)]">{d.caveat}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" /> Who is typically around
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-4">
                {d.supervision.map((s) => (
                  <div key={s.band} className={cn("rounded-lg border p-3", BAND_TINT[s.band])}>
                    <p className="text-2xl font-extrabold tabular-nums">
                      {s.typicalOnShift ?? "—"}
                    </p>
                    <p className="text-[11px] font-semibold">{bandLabel(s.band)}</p>
                    <p className="mt-0.5 text-[10px] opacity-80">
                      {s.typicalOnShift === null
                        ? "Cara can't tell from the rota"
                        : `across ${s.daysSeen} day${s.daysSeen === 1 ? "" : "s"}`}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {d.findings.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" /> Worth a look
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {d.findings.map((f, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-lg border px-3 py-2.5",
                        f.key === "convergence"
                          ? "border-amber-200 bg-amber-50"
                          : "border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-surface,#fff)]",
                      )}
                    >
                      <p className="text-sm font-semibold text-[var(--cs-text,#0f172a)]">{f.headline}</p>
                      <p className="mt-0.5 text-xs text-[var(--cs-text-secondary,#475569)]">{f.whyShown}</p>
                      <div className="mt-2 space-y-1 border-l-2 border-[var(--cs-border,#e2e8f0)] pl-2.5">
                        {f.readings.map((r, j) => (
                          <p key={j} className="text-xs italic text-[var(--cs-text-muted,#64748b)]">
                            {r}
                          </p>
                        ))}
                      </div>
                      <p className="mt-2 text-xs font-medium text-[var(--cs-cara-gold,#b45309)]">{f.question}</p>
                      {f.incidentIds.length > 0 && (
                        <p className="mt-1 text-[10px] text-[var(--cs-text-muted,#64748b)]">
                          {f.incidentIds.length} record{f.incidentIds.length === 1 ? "" : "s"} behind this
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {d.concentrations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Where things gather</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {d.concentrations.map((c) => (
                    <div
                      key={`${c.band}-${c.location}`}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--cs-border,#e2e8f0)] px-3 py-2"
                    >
                      <span className="text-sm font-semibold text-[var(--cs-text,#0f172a)]">{c.location}</span>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", BAND_TINT[c.band])}>
                        {c.band}
                      </span>
                      <span className="text-xs tabular-nums text-[var(--cs-text-secondary,#475569)]">
                        {c.incidents} incidents
                      </span>
                      <span className="ml-auto text-xs text-[var(--cs-text-muted,#64748b)]">
                        {c.typicalOnShift === null ? "staffing unknown" : `~${c.typicalOnShift} on`}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {d.possibleSamePlace.length > 0 && (
              <Card className="border-sky-200 bg-sky-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-sky-900">
                    <Split className="h-4 w-4" /> These might be the same place
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {d.possibleSamePlace.map((p, i) => (
                    <div key={i} className="rounded-lg border border-sky-200 bg-white px-3 py-2">
                      <p className="text-sm font-medium text-[var(--cs-text,#0f172a)]">
                        &ldquo;{p.places[0]}&rdquo; and &ldquo;{p.places[1]}&rdquo;
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--cs-text-secondary,#475569)]">{p.why}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <p className="flex items-start gap-1.5 px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              <HelpCircle className="mt-0.5 h-3 w-3 shrink-0" />
              Cara looks at when and where, and who was around — never at who was involved. Nothing on this page marks
              anyone as a risk, and there is no number here that could.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
