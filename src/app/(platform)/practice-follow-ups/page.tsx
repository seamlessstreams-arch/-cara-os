"use client";

import React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { usePracticeFollowUps } from "@/hooks/use-practice-follow-ups";
import { cn } from "@/lib/utils";
import { Loader2, Brain, ArrowRight, Sparkles } from "lucide-react";

const PRIORITY: Record<string, { label: string; cls: string }> = {
  urgent: { label: "Urgent", cls: "bg-red-100 text-red-800 border-red-200" },
  high: { label: "High", cls: "bg-orange-100 text-orange-800 border-orange-200" },
  medium: { label: "Medium", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  low: { label: "Low", cls: "bg-slate-100 text-slate-700 border-slate-200" },
};

export default function PracticeFollowUpsPage() {
  const { data, isLoading } = usePracticeFollowUps();
  const followUps = data?.follow_ups ?? [];

  return (
    <PageShell
      title="Practice Follow-ups"
      subtitle="What each recent incident, missing episode and concern suggests should happen next — ready to draft in Cara Studio"
    >
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-start gap-2 rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-cara-gold-bg,#fffbeb)] px-3 py-2 text-xs text-[var(--cs-text-secondary,#475569)]">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-cara-gold,#b45309)]" />
          <span>
            Cara turns each significant event into the follow-up work that should come next — oversight,
            debriefs, return-home interviews, risk reviews. These are <span className="font-semibold">suggestions
            to action or dismiss</span>, never automatic actions. Click <span className="font-semibold">Draft in
            Cara Studio</span> to write any of them, grounded in that child&apos;s records.
          </span>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Finding follow-ups…
          </div>
        )}

        {!isLoading && followUps.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-[var(--cs-text-muted,#64748b)]">
              No outstanding follow-ups from recent records — nothing needs actioning right now.
            </CardContent>
          </Card>
        )}

        {followUps.length > 0 && (
          <>
            <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">{followUps.length} suggested follow-up{followUps.length === 1 ? "" : "s"} from the last 30 days.</p>
            <div className="space-y-2">
              {followUps.map((f) => {
                const p = PRIORITY[f.priority] ?? PRIORITY.low;
                return (
                  <div
                    key={f.id}
                    className={cn(
                      "rounded-xl border bg-white p-3",
                      f.priority === "urgent" && "border-l-4 border-l-red-400",
                      f.priority === "high" && "border-l-4 border-l-orange-400",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", p.cls)}>{p.label}</span>
                      <h3 className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">{f.title}</h3>
                    </div>
                    <p className="mt-1 text-xs text-[var(--cs-text-secondary,#475569)]">{f.description}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--cs-text-muted,#64748b)]">
                      {f.child_name && <span>Child: <span className="font-medium text-[var(--cs-text-secondary,#475569)]">{f.child_name}</span></span>}
                      <span>From: {f.source_label}</span>
                      <span>{f.source_date}</span>
                    </div>
                    {f.studio_link && (
                      <Link
                        href={f.studio_link}
                        className="mt-2 inline-flex items-center gap-1 rounded-md border border-[var(--cs-cara-gold,#b45309)] bg-[var(--cs-cara-gold-bg,#fffbeb)] px-2 py-1 text-[11px] font-semibold text-[var(--cs-cara-gold,#b45309)] transition-colors hover:bg-[var(--cs-cara-gold,#b45309)] hover:text-white"
                      >
                        <Brain className="h-3 w-3" /> Draft in Cara Studio <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
