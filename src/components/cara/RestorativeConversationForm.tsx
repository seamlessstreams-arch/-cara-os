"use client";

// Cara Practice Assistant — restorative conversation, at the child's pace.
// Shows the completed record when one exists; otherwise the readiness checks +
// the restorative question template. Saving writes a restorative_action timeline
// entry (satisfying the quality gate) and flags manager review when needed.

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2, HeartHandshake, Check, Sparkles } from "lucide-react";
import { usePostIncident, useSavePostIncident } from "@/hooks/use-cara-incident";

const inputCls = "w-full rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2 text-sm focus:border-[var(--cs-teal)] focus:outline-none focus:ring-1 focus:ring-[var(--cs-teal)]";

export function RestorativeConversationForm({ sessionId, childName }: { sessionId: string; childName: string }) {
  const { data, isLoading } = usePostIncident(sessionId);
  const save = useSavePostIncident(sessionId);
  const [ready, setReady] = useState(true);
  const [followUp, setFollowUp] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setFields((f) => ({ ...f, [k]: v }));

  if (isLoading || !data) return null;
  const existing = data.restorative[0];

  return (
    <Card className="border-l-4 border-l-[var(--cs-teal)]">
      <CardContent className="py-4">
        <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--cs-navy)]"><HeartHandshake className="h-4 w-4 text-[var(--cs-teal-strong)]" /> Restorative conversation</p>
        <p className="mt-0.5 text-xs text-[var(--cs-text-muted)]">{data.disclaimers.restorative}</p>

        {existing ? (
          <div className="mt-3 space-y-2">
            <p className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold", existing.child_ready_to_engage ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800")}>
              <Check className="h-3 w-3" /> {existing.child_ready_to_engage ? "Completed" : "Offered — child not ready (respected)"}
              {existing.manager_review_required ? " · manager review" : ""}
            </p>
            {[["What happened", existing.what_happened], ["Who was affected", existing.who_was_affected], [`${childName}'s voice`, existing.child_voice], ["What helped", existing.what_helped], ["What made it worse", existing.what_made_it_worse], ["Repair agreed", existing.repair_actions]]
              .filter(([, v]) => v)
              .map(([label, v]) => (
                <div key={label as string}>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--cs-teal-strong)]">{label}</p>
                  <p className="text-sm text-[var(--cs-text-secondary)]">{v}</p>
                </div>
              ))}
            {existing.ai_summary && (
              <div className="rounded-xl border border-[var(--cs-cara-gold)]/30 bg-[var(--cs-cara-gold-bg)]/40 px-3 py-2">
                <p className="flex items-center gap-1 text-[11px] font-bold text-[var(--cs-navy)]"><Sparkles className="h-3 w-3 text-[var(--cs-cara-gold)]" /> Cara summary (AI-assisted draft)</p>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{existing.ai_summary}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="rounded-xl bg-[var(--cs-bg)] px-3 py-2">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Before you start</p>
              <ul className="space-y-0.5">{data.templates.readiness_checks.map((c, i) => <li key={i} className="text-xs text-[var(--cs-text-secondary)]">• {c}</li>)}</ul>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setReady(true)} className={cn("flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-bold", ready ? "border-[var(--cs-teal)] bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]" : "border-[var(--cs-border)] bg-white text-[var(--cs-text-muted)]")}>
                {childName} is ready to talk
              </button>
              <button onClick={() => setReady(false)} className={cn("flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-bold", !ready ? "border-amber-400 bg-amber-50 text-amber-800" : "border-[var(--cs-border)] bg-white text-[var(--cs-text-muted)]")}>
                Not ready yet
              </button>
            </div>

            {ready ? (
              data.templates.restorative_questions.map((q) => (
                <label key={q.key} className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">{q.label}</span>
                  <textarea rows={2} className={cn(inputCls, "mt-1")} value={fields[q.key] ?? ""} onChange={(e) => set(q.key, e.target.value)} />
                </label>
              ))
            ) : (
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">How was the decision respected, and when will staff revisit?</span>
                <textarea rows={2} className={cn(inputCls, "mt-1")} value={fields.repair_actions ?? ""} onChange={(e) => set("repair_actions", e.target.value)} />
              </label>
            )}

            <label className="flex items-center gap-2 text-sm text-[var(--cs-text)]">
              <input type="checkbox" checked={followUp} onChange={(e) => setFollowUp(e.target.checked)} className="h-4 w-4 accent-[var(--cs-teal-strong)]" />
              Key-work follow-up needed
            </label>

            <button
              disabled={save.isPending}
              onClick={() => save.mutate({ kind: "restorative", child_ready_to_engage: ready, follow_up_required: followUp, ...fields })}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--cs-teal-strong)] px-4 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save restorative record
            </button>
            {save.isError && <p className="text-sm font-medium text-red-700">{(save.error as Error).message}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
