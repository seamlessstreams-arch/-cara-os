"use client";

// Cara Practice Assistant — post-incident reflection (learning, not blame).
// Reflective questions + contributing-factor and outcome flags; suggested
// follow-up actions are derived deterministically by the engine. Manager review
// is flagged automatically for statutory-plan or supervision outcomes.

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2, Brain, Check, Sparkles, ListChecks } from "lucide-react";
import { usePostIncident, useSavePostIncident } from "@/hooks/use-cara-incident";
import { EntryAssist } from "@/components/forms/entry-assist";

const inputCls = "w-full rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2 text-sm focus:border-[var(--cs-teal)] focus:outline-none focus:ring-1 focus:ring-[var(--cs-teal)]";

export function PostIncidentReflectionForm({ sessionId }: { sessionId: string }) {
  const { data, isLoading } = usePostIncident(sessionId);
  const save = useSavePostIncident(sessionId);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [factors, setFactors] = useState<string[]>([]);
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const set = (k: string, v: string) => setFields((f) => ({ ...f, [k]: v }));
  const toggle = (list: string[], setList: (v: string[]) => void, key: string) =>
    setList(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  if (isLoading || !data) return null;
  const existing = data.reflections[0];

  return (
    <Card className="border-l-4 border-l-[var(--cs-navy)]">
      <CardContent className="py-4">
        <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--cs-navy)]"><Brain className="h-4 w-4 text-[var(--cs-teal-strong)]" /> Post-incident reflection</p>
        <p className="mt-0.5 text-xs text-[var(--cs-text-muted)]">{data.disclaimers.reflection}</p>

        {existing ? (
          <div className="mt-3 space-y-2">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-800">
              <Check className="h-3 w-3" /> Completed{existing.manager_review_required ? " · manager review" : ""}
            </p>
            {data.templates.reflection_questions
              .map((q) => [q.label, existing[q.key]] as const)
              .filter(([, v]) => v)
              .map(([label, v]) => (
                <div key={label}>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--cs-teal-strong)]">{label}</p>
                  <p className="text-sm text-[var(--cs-text-secondary)]">{v}</p>
                </div>
              ))}
            {existing.follow_up_actions?.length > 0 && (
              <div className="rounded-xl border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)]/40 px-3 py-2">
                <p className="flex items-center gap-1 text-[11px] font-bold text-[var(--cs-teal-strong)]"><ListChecks className="h-3 w-3" /> Suggested follow-up actions</p>
                <ul className="mt-1 space-y-0.5">{existing.follow_up_actions.map((a: string, i: number) => <li key={i} className="text-sm text-[var(--cs-text-secondary)]">• {a}</li>)}</ul>
              </div>
            )}
            {existing.ai_reflective_summary && (
              <div className="rounded-xl border border-[var(--cs-cara-gold)]/30 bg-[var(--cs-cara-gold-bg)]/40 px-3 py-2">
                <p className="flex items-center gap-1 text-[11px] font-bold text-[var(--cs-navy)]"><Sparkles className="h-3 w-3 text-[var(--cs-cara-gold)]" /> Cara reflective summary (AI-assisted draft)</p>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{existing.ai_reflective_summary}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {data.templates.reflection_questions.map((q) => (
              <div key={q.key}>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">{q.label}</span>
                  <textarea rows={2} className={cn(inputCls, "mt-1")} value={fields[q.key] ?? ""} onChange={(e) => set(q.key, e.target.value)} />
                </label>
                <EntryAssist value={fields[q.key] ?? ""} onChange={(v) => set(q.key, v)} sourceRecordType="post_incident_reflection" className="mt-1" />
              </div>
            ))}

            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Possible contributing factors</p>
              <div className="flex flex-wrap gap-1.5">
                {data.templates.reflection_factors.map((f) => (
                  <button key={f.key} onClick={() => toggle(factors, setFactors, f.key)} title={f.suggestion}
                    className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold", factors.includes(f.key) ? "border-[var(--cs-navy)] bg-[var(--cs-navy)] text-white" : "border-[var(--cs-border)] bg-white text-[var(--cs-text)]")}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">What needs to happen next?</p>
              <div className="flex flex-wrap gap-1.5">
                {data.templates.reflection_outcomes.map((o) => (
                  <button key={o.key} onClick={() => toggle(outcomes, setOutcomes, o.key)} title={o.suggestion}
                    className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold", outcomes.includes(o.key) ? "border-[var(--cs-teal-strong)] bg-[var(--cs-teal-strong)] text-white" : "border-[var(--cs-border)] bg-white text-[var(--cs-text)]")}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={save.isPending}
              onClick={() => save.mutate({ kind: "reflection", factors, outcomes, ...fields })}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-4 py-3 text-sm font-bold text-white hover:bg-[var(--cs-navy-soft)] disabled:opacity-40"
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save reflection
            </button>
            {save.isError && <p className="text-sm font-medium text-red-700">{(save.error as Error).message}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
