"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — LEAVES & ROOTS (trauma tree logic, doctrine 2.2.8)
//
// Per child: is the thinking about them written down, when did anyone last look
// at it, and what is feeding the tree.
//
// The hypotheses on this page were written by people. Cara quotes them and
// never adds to them — it does not work out why a child does what they do, and
// this page says so, out loud, at the top.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTraumaTree } from "@/hooks/use-trauma-tree";
import { Sprout, TreeDeciduous, Stethoscope, CheckCircle2, HelpCircle, Loader2, ArrowUpRight } from "lucide-react";

export default function TraumaTreePage() {
  const q = useTraumaTree();
  const d = q.data;

  return (
    <PageShell
      title="Leaves & Roots"
      subtitle="Is the thinking about each child written down, when was it last looked at, and what feeds the tree"
    >
      <div className="space-y-6 animate-fade-in">
        {q.isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading what&rsquo;s on record…
          </div>
        )}

        {q.isError && (
          <Card>
            <CardContent className="pt-5 text-sm text-[var(--cs-text-secondary,#475569)]">
              This view is a manager&rsquo;s — formulation review is theirs to convene.
            </CardContent>
          </Card>
        )}

        {d && (
          <>
            <Card>
              <CardContent className="flex items-start gap-3 pt-5">
                <TreeDeciduous className="mt-0.5 h-5 w-5 shrink-0 text-[var(--cs-cara-gold,#b45309)]" />
                <div>
                  <p className="text-sm leading-relaxed text-[var(--cs-text-secondary,#475569)]">{d.summary}</p>
                  <p className="mt-2 text-xs text-[var(--cs-text-muted,#64748b)]">{d.caveat}</p>
                </div>
              </CardContent>
            </Card>

            {d.children.map((c) => (
              <Card key={c.childId}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    <Sprout className="h-4 w-4 shrink-0 text-emerald-600" />
                    {c.childName}
                    <span className="rounded-full border border-[var(--cs-border,#e2e8f0)] px-2 py-0.5 text-[10px] font-semibold text-[var(--cs-text-secondary,#475569)]">
                      {c.leaves} recorded {c.leaves === 1 ? "response" : "responses"}
                    </span>
                    {c.roots ? (
                      <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        formulation v{c.roots.version} · {c.roots.daysOld}d old
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                        no formulation on record
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {c.roots && c.roots.hypotheses.length > 0 && (
                    <div className="rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-surface,#fff)] p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted,#64748b)]">
                        The roots, as the team wrote them
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {c.roots.hypotheses.map((h, i) => (
                          <li key={i} className="text-sm leading-relaxed text-[var(--cs-text,#0f172a)]">
                            &ldquo;{h}&rdquo;
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-[10px] text-[var(--cs-text-muted,#64748b)]">
                        Quoted from formulation v{c.roots.version}, written with {c.roots.participants.length} people
                        {c.roots.reviewDue ? ` · next review ${c.roots.reviewDue}` : " · no review date"}. Cara wrote
                        none of this.
                      </p>
                    </div>
                  )}

                  {c.findings.map((f, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-lg border px-3 py-2.5",
                        f.tone === "positive"
                          ? "border-emerald-200 bg-emerald-50"
                          : f.key === "leaf_only"
                            ? "border-amber-200 bg-amber-50"
                            : "border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-surface,#fff)]",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {f.tone === "positive" ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <HelpCircle className="h-4 w-4 shrink-0 text-amber-600" />
                        )}
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            f.tone === "positive" ? "text-emerald-900" : "text-[var(--cs-text,#0f172a)]",
                          )}
                        >
                          {f.headline}
                        </span>
                        {f.needsClinicalSupport && (
                          <span className="flex items-center gap-1 rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-900">
                            <Stethoscope className="h-3 w-3" /> with clinical support
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[var(--cs-text-secondary,#475569)]">{f.whyShown}</p>
                      {f.readings.length > 0 && (
                        <div className="mt-1.5 space-y-0.5 border-l-2 border-[var(--cs-border,#e2e8f0)] pl-2.5">
                          {f.readings.map((r, j) => (
                            <p key={j} className="text-xs italic text-[var(--cs-text-muted,#64748b)]">
                              {r}
                            </p>
                          ))}
                        </div>
                      )}
                      <p className="mt-1.5 text-xs font-medium text-[var(--cs-cara-gold,#b45309)]">{f.question}</p>
                      {f.key === "labelling_feeding_the_tree" && (
                        <Link
                          href={d.sources.labelling}
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--cs-cara-gold,#b45309)] hover:underline"
                        >
                          Care Language Audit <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {d.tooLittleToSay.length > 0 && (
              <Card className="border-dashed">
                <CardContent className="pt-5">
                  <p className="text-xs text-[var(--cs-text-muted,#64748b)]">
                    Not enough on record to say anything useful about {d.tooLittleToSay.join(", ")} — which is a fact
                    about the records, not about them.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
