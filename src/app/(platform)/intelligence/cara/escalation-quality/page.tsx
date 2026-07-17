"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — ESCALATION QUALITY (2.2.11 / doctrine 1.10)
//
// Cara auditing Cara's home: are escalation decisions made inside the windows
// the level demands, is anything aging while nobody decides, is the urgency
// mix still carrying information. Findings are supervision prompts — an
// amend-down pattern always carries BOTH readings, never a verdict.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEscalationQuality } from "@/hooks/use-escalation-quality";
import { DECISION_WINDOW_HOURS } from "@/lib/risk-escalation/escalation-quality-engine";
import { Gauge, AlertTriangle, Loader2 } from "lucide-react";

const LEVEL_LABEL: Record<string, string> = {
  low_concern: "Low",
  emerging_concern: "Emerging",
  high_concern: "High",
  immediate_safeguarding: "Immediate",
};

const DIRECTION_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  amended_up: "Amended up",
  amended_down: "Amended down",
  rejected: "Rejected",
  awaiting: "Awaiting decision",
};

export default function EscalationQualityPage() {
  const q = useEscalationQuality();
  const d = q.data;

  return (
    <PageShell
      title="Escalation Quality"
      subtitle="Are decisions made inside their windows, is anything aging unheard, and does urgency still carry information"
    >
      <div className="space-y-6 animate-fade-in">
        {q.isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading the decision record…
          </div>
        )}

        {d && (
          <>
            <div className="grid gap-3 sm:grid-cols-4">
              {([
                ["Decisions", d.counts.total, "text-[var(--cs-navy,#1e293b)]"],
                ["Awaiting", d.counts.awaiting, d.counts.awaiting > 0 ? "text-amber-700" : "text-[var(--cs-navy,#1e293b)]"],
                ["Within window", d.counts.withinWindow, "text-emerald-700"],
                ["Outside window", d.counts.exceededWindow, d.counts.exceededWindow > 0 ? "text-rose-700" : "text-[var(--cs-navy,#1e293b)]"],
              ] as const).map(([label, value, cls]) => (
                <Card key={label}><CardContent className="pt-5">
                  <p className={cn("text-2xl font-extrabold tabular-nums", cls)}>{value}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[var(--cs-text-secondary,#475569)]">{label}</p>
                </CardContent></Card>
              ))}
            </div>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Gauge className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" /> The windows this measures against</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(DECISION_WINDOW_HOURS).map(([level, hours]) => (
                    <span key={level} className="rounded-full border border-[var(--cs-border,#e2e8f0)] px-3 py-1 text-xs text-[var(--cs-text-secondary,#475569)]">
                      <span className="font-bold text-[var(--cs-navy,#1e293b)]">{LEVEL_LABEL[level]}</span>
                      {" "}decide within {hours < 1 ? `${hours * 60} min` : `${hours}h`}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[var(--cs-text-muted,#64748b)]">
                  From the escalation discipline: when in doubt, escalate — ambiguity defaults upward, and the clock runs from Cara&rsquo;s suggestion.
                </p>
              </CardContent>
            </Card>

            {d.findings.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-amber-600" /> Findings</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {d.findings.map((f) => (
                    <div key={f.key + f.evidenceIds.join(",")} className={cn("rounded-lg border px-3 py-2 text-sm", f.tone === "positive" ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50")}>
                      <p className={cn("font-semibold", f.tone === "positive" ? "text-emerald-900" : "text-amber-900")}>{f.headline}</p>
                      <p className={cn("mt-0.5 text-xs", f.tone === "positive" ? "text-emerald-800" : "text-amber-800")}>
                        <span className="font-semibold">Why Cara is showing this:</span> {f.whyShown}
                      </p>
                      {f.suggestedQuestions.length > 0 && (
                        <ul className="mt-1 list-disc pl-4 text-xs text-amber-800">{f.suggestedQuestions.map((qq) => <li key={qq}>{qq}</li>)}</ul>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="text-base">Each decision, against its window</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-[var(--cs-border,#e2e8f0)] text-left text-[11px] uppercase tracking-wide text-[var(--cs-text-muted,#64748b)]">
                      <th className="py-2 pr-4 font-bold">Concern</th>
                      <th className="py-2 pr-4 font-bold">Suggested → decided</th>
                      <th className="py-2 pr-4 font-bold">Outcome</th>
                      <th className="py-2 pr-4 font-bold">Time vs window</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.reads.map((r) => (
                      <tr key={r.id} className="border-b border-[var(--cs-border-subtle,#f1f5f9)] last:border-0">
                        <td className="max-w-[220px] truncate py-2 pr-4 text-[var(--cs-text,#0f172a)]" title={r.concernSummary}>{r.concernSummary}</td>
                        <td className="py-2 pr-4 text-[var(--cs-text-secondary,#475569)]">
                          {LEVEL_LABEL[r.suggestedLevel]}{r.confirmedLevel && r.confirmedLevel !== r.suggestedLevel ? ` → ${LEVEL_LABEL[r.confirmedLevel]}` : ""}
                        </td>
                        <td className="py-2 pr-4 text-[var(--cs-text-secondary,#475569)]">{DIRECTION_LABEL[r.direction]}</td>
                        <td className={cn("py-2 pr-4 tabular-nums", r.withinWindow ? "text-emerald-700" : "text-rose-700 font-semibold")}>
                          {Math.round(r.hours * 10) / 10}h / {r.windowHours}h {r.withinWindow ? "· within" : "· outside"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {d.reads.length === 0 && <p className="text-sm text-[var(--cs-text-muted,#64748b)]">No escalation decisions recorded yet.</p>}
              </CardContent>
            </Card>

            <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              Findings are supervision prompts about the system, not verdicts about people. An amend-down pattern always
              carries both readings — Cara&rsquo;s rules may need calibrating, or risk may be being minimised — and the
              manager&rsquo;s recorded reasons come first.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
