"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOW WE RESPOND (doctrine 2.2.10)
//
// Cara auditing Cara's home. Three questions, each asked from the child's seat:
// when we're worried do we act, after it goes wrong do we put it right, and
// when a child speaks do they get an answer.
//
// Two things this page must never do:
//   · go green because nothing was recorded — an unlit strand is reported as
//     unmonitored, and said so plainly;
//   · name a person. This is about the organisation's pattern, full stop.
//
// And it never lectures theory at anyone — the lens is internal machinery.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useInstitutionalSelfCheck } from "@/hooks/use-institutional-self-check";
import { ScanEye, EyeOff, CheckCircle2, HelpCircle, Loader2, ArrowUpRight } from "lucide-react";

export default function InstitutionalSelfCheckPage() {
  const q = useInstitutionalSelfCheck();
  const d = q.data;

  return (
    <PageShell
      title="How We Respond"
      subtitle="Cara auditing Cara's home — our own response pattern, seen from where a child sits"
    >
      <div className="space-y-6 animate-fade-in">
        {q.isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Looking at ourselves…
          </div>
        )}

        {q.isError && (
          <Card>
            <CardContent className="pt-5 text-sm text-[var(--cs-text-secondary,#475569)]">
              This view is a manager&rsquo;s.
            </CardContent>
          </Card>
        )}

        {d && (
          <>
            <Card className={cn(d.lit === 0 && "border-amber-200 bg-amber-50")}>
              <CardContent className="flex items-start gap-3 pt-5">
                <ScanEye className={cn("mt-0.5 h-5 w-5 shrink-0", d.lit === 0 ? "text-amber-600" : "text-[var(--cs-cara-gold,#b45309)]")} />
                <div>
                  <p className="text-sm leading-relaxed text-[var(--cs-text-secondary,#475569)]">{d.summary}</p>
                  <p className="mt-2 text-xs text-[var(--cs-text-muted,#64748b)]">{d.caveat}</p>
                </div>
              </CardContent>
            </Card>

            {d.strands.map((s) => (
              <Card key={s.strand} className={cn(s.visibility === "unlit" && "border-dashed")}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    {s.visibility === "unlit" ? (
                      <EyeOff className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : s.findings.every((f) => f.tone === "positive") ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <HelpCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    )}
                    {s.label}
                    {s.visibility === "unlit" && (
                      <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                        Unmonitored
                      </span>
                    )}
                    <Link
                      href={d.sources[s.strand]}
                      className="ml-auto flex items-center gap-1 text-xs font-medium text-[var(--cs-cara-gold,#b45309)] hover:underline"
                    >
                      The records <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </CardTitle>
                  <p className="text-xs italic text-[var(--cs-text-muted,#64748b)]">&ldquo;{s.question}&rdquo;</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {s.visibility === "unlit" ? (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      {s.visibilityNote}
                    </p>
                  ) : (
                    s.findings.map((f, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-lg border px-3 py-2",
                          f.tone === "positive"
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-surface,#fff)]",
                        )}
                      >
                        <p className={cn("text-sm font-semibold", f.tone === "positive" ? "text-emerald-900" : "text-[var(--cs-text,#0f172a)]")}>
                          {f.headline}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--cs-text-secondary,#475569)]">{f.whyShown}</p>
                        <p className="mt-1.5 text-xs font-medium text-[var(--cs-cara-gold,#b45309)]">{f.question}</p>
                        {f.evidenceIds.length > 0 && (
                          <p className="mt-1 text-[10px] text-[var(--cs-text-muted,#64748b)]">
                            {f.evidenceIds.length} record{f.evidenceIds.length === 1 ? "" : "s"} behind this
                          </p>
                        )}
                      </div>
                    ))
                  )}
                  {s.visibility === "lit" && s.findings.length === 0 && (
                    <p className="text-xs text-[var(--cs-text-muted,#64748b)]">Nothing here is asking for a look right now.</p>
                  )}
                </CardContent>
              </Card>
            ))}

            <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              Every finding here is composed from records you already have — escalation decisions, incident repairs, and
              what children have raised. Cara doesn&rsquo;t work any of it out twice, and it can&rsquo;t see anything
              your team hasn&rsquo;t written down. That last part is the whole point of the unmonitored label.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
