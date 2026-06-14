"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Loader2, RefreshCw, MessageSquare, CheckCircle2, AlertTriangle,
  HeartPulse, GraduationCap, Sparkles, Plus, Save, ShieldAlert,
} from "lucide-react";
import { useReflectiveSupervision, useCreateSupervision } from "@/hooks/use-reflective-supervision";
import type { SupervisionStatus, ReflectiveSupervisionRecord } from "@/lib/engines/supervision-engine";

const STATUS_META: Record<SupervisionStatus, { label: string; chip: string; dot: string }> = {
  current: { label: "Current", chip: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
  due_soon: { label: "Due soon", chip: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  overdue: { label: "Overdue", chip: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
  never: { label: "No record", chip: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
};

const inputCls = "w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm focus:border-[var(--cs-teal)] focus:outline-none focus:ring-1 focus:ring-[var(--cs-teal)]";

const SECTION_FIELDS: { key: keyof ReflectiveSupervisionRecord; label: string }[] = [
  { key: "emotional_wellbeing", label: "Emotional wellbeing" },
  { key: "workload", label: "Workload" },
  { key: "safeguarding_concerns", label: "Safeguarding concerns" },
  { key: "relationships_with_children", label: "Relationships with children" },
  { key: "reflective_practice", label: "Reflective practice" },
  { key: "pace_examples", label: "PACE & co-regulation examples" },
  { key: "professional_boundaries", label: "Professional boundaries" },
  { key: "manager_feedback", label: "Manager feedback" },
];

function Stat({ value, label, tone }: { value: number | string; label: string; tone: string }) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3", tone)}>
      <div className="text-xl font-extrabold tabular-nums leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</div>
    </div>
  );
}

export default function ReflectiveSupervisionPage() {
  const { data, isLoading, isFetching, refetch } = useReflectiveSupervision();
  const create = useCreateSupervision();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ staff_id: "", supervisor_id: "staff_darren", date: "", type: "1:1", wellbeing_score: "4", confidence_level: "4", training_needs: "", follow_up_date: "" });
  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  const [formError, setFormError] = useState<string | null>(null);

  // Cara reflective prompts
  const [aiState, setAiState] = useState<"idle" | "loading" | "done">("idle");
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiContext, setAiContext] = useState("");

  const ov = data?.overview;

  function submit() {
    setFormError(null);
    if (!form.staff_id || !form.date) { setFormError("Choose a staff member and a date."); return; }
    create.mutate(
      {
        ...form,
        wellbeing_score: Number(form.wellbeing_score),
        confidence_level: Number(form.confidence_level),
        training_needs: String(form.training_needs).split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
      },
      { onSuccess: () => { setShowForm(false); setForm({ staff_id: "", supervisor_id: "staff_darren", date: "", type: "1:1", wellbeing_score: "4", confidence_level: "4", training_needs: "", follow_up_date: "" }); } },
    );
  }

  async function suggestPrompts() {
    setAiState("loading"); setAiMessage(null); setAiPrompts([]);
    try {
      const res = await fetch("/api/v1/reflective-supervision/ai-prompts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: aiContext }),
      });
      const j = (await res.json()).data;
      setAiPrompts(j.prompts || []); setAiMessage(j.message || null);
    } catch { setAiMessage("Couldn't reach Cara. Use the section structure to guide the conversation."); }
    setAiState("done");
  }

  return (
    <PageShell
      title="Reflective Supervision"
      subtitle="Supervision that's more than tick-box — wellbeing, workload, safeguarding, relationships, reflective & PACE practice, boundaries, confidence and development, with a clear view of who's due and where to offer support."
      caraContext={{ pageTitle: "Reflective Supervision", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setShowForm((s) => !s)} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cs-navy)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--cs-navy-soft)] print:hidden"><Plus className="h-3.5 w-3.5" /> Record supervision</button>
          <button onClick={() => refetch()} className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 print:hidden"><RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh</button>
          <PrintButton title="Reflective Supervision" />
        </div>
      }
    >
      <div className="cs-print-color mx-auto max-w-4xl space-y-5">
        {isLoading && <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {!isLoading && data && ov && (
          <>
            {/* summary */}
            <Card>
              <CardContent className="py-5">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><MessageSquare className="h-4 w-4 text-[var(--cs-teal-strong)]" /> Supervision across the team</div>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary)]">{ov.headline}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat value={`${ov.summary.supervision_rate}%`} label="Current" tone="bg-green-50 border-green-200 text-green-800" />
                  <Stat value={ov.summary.overdue} label="Overdue / none" tone="bg-red-50 border-red-200 text-red-800" />
                  <Stat value={ov.summary.wellbeing_concerns} label="Wellbeing indicators" tone="bg-amber-50 border-amber-200 text-amber-800" />
                  <Stat value={ov.summary.outstanding_actions} label="Open actions" tone="bg-[var(--cs-bg)] border-[var(--cs-border)] text-[var(--cs-navy)]" />
                </div>
              </CardContent>
            </Card>

            {/* create form */}
            {showForm && (
              <Card className="border-l-4 border-l-[var(--cs-teal)] print:hidden">
                <CardContent className="space-y-4 py-5">
                  <p className="text-sm font-bold text-[var(--cs-navy)]">Record a reflective supervision</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block"><span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Staff member *</span>
                      <select className={cn(inputCls, "mt-1")} value={form.staff_id} onChange={(e) => set("staff_id", e.target.value)}>
                        <option value="">Select…</option>
                        {data.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select></label>
                    <label className="block"><span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Date *</span>
                      <input type="date" className={cn(inputCls, "mt-1")} value={form.date} onChange={(e) => set("date", e.target.value)} /></label>
                    <label className="block"><span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Wellbeing (1–5)</span>
                      <select className={cn(inputCls, "mt-1")} value={form.wellbeing_score} onChange={(e) => set("wellbeing_score", e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
                    <label className="block"><span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Confidence (1–5)</span>
                      <select className={cn(inputCls, "mt-1")} value={form.confidence_level} onChange={(e) => set("confidence_level", e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
                  </div>
                  {SECTION_FIELDS.map((f) => (
                    <label key={f.key} className="block"><span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">{f.label}</span>
                      <textarea className={cn(inputCls, "mt-1 min-h-[60px]")} value={form[f.key] ?? ""} onChange={(e) => set(f.key as string, e.target.value)} /></label>
                  ))}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block"><span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Training needs (comma/line separated)</span>
                      <input className={cn(inputCls, "mt-1")} value={form.training_needs} onChange={(e) => set("training_needs", e.target.value)} /></label>
                    <label className="block"><span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Follow-up date</span>
                      <input type="date" className={cn(inputCls, "mt-1")} value={form.follow_up_date} onChange={(e) => set("follow_up_date", e.target.value)} /></label>
                  </div>
                  {formError && <p className="text-sm font-medium text-red-700">{formError}</p>}
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowForm(false)} className="rounded-lg border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button onClick={submit} disabled={create.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cs-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--cs-navy-soft)] disabled:opacity-50">{create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* per-staff board */}
            <Card>
              <CardContent className="py-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Who&rsquo;s due — and who needs support</p>
                <div className="space-y-1.5">
                  {ov.by_staff.map((s) => {
                    const m = STATUS_META[s.status];
                    return (
                      <div key={s.staff_id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-[var(--cs-border)]/60 bg-white px-3 py-2 text-sm">
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", m.dot)} />
                        <span className="min-w-0 flex-1 font-semibold text-[var(--cs-navy)]">{s.staff_name}</span>
                        {s.wellbeing_flag && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800"><HeartPulse className="h-3 w-3" /> wellbeing</span>}
                        {s.confidence_flag && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">low confidence</span>}
                        {s.outstanding_actions > 0 && <span className="text-[11px] text-[var(--cs-text-muted)]">{s.outstanding_actions} action{s.outstanding_actions === 1 ? "" : "s"}</span>}
                        <span className="text-[11px] tabular-nums text-[var(--cs-text-muted)]">{s.last_date ? `${s.days_since}d ago` : "—"}</span>
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", m.chip)}>{m.label}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* recurring training needs */}
            {ov.recurring_training_needs.length > 0 && (
              <Card>
                <CardContent className="py-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]"><GraduationCap className="h-3.5 w-3.5" /> Recurring training needs (from supervision)</p>
                  <div className="flex flex-wrap gap-2">
                    {ov.recurring_training_needs.map((n) => (
                      <span key={n.need} className="rounded-full border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-1 text-xs font-semibold text-[var(--cs-navy)]">{n.need} <span className="text-[var(--cs-text-muted)]">×{n.count}</span></span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cara reflective prompts */}
            <Card className="print:hidden">
              <CardContent className="py-4">
                <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--cs-navy)]"><Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" /> Reflective prompts (Cara)</p>
                <p className="mt-0.5 text-xs text-[var(--cs-text-muted)]">Prepare a conversation. Cara suggests prompts only — it never writes the record or its conclusions.</p>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <input className={cn(inputCls, "max-w-md flex-1")} placeholder="Optional: anything you've noticed to focus on…" value={aiContext} onChange={(e) => setAiContext(e.target.value)} />
                  <button onClick={suggestPrompts} disabled={aiState === "loading"} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cs-navy)] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[var(--cs-navy-soft)] disabled:opacity-50">{aiState === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Suggest prompts</button>
                </div>
                {aiState === "done" && aiPrompts.length > 0 && (
                  <>
                    <ul className="mt-3 space-y-1.5">{aiPrompts.map((p, i) => <li key={i} className="rounded-lg border border-[var(--cs-cara-gold)]/30 bg-[var(--cs-cara-gold-bg)]/40 px-3 py-2 text-sm">{p}</li>)}</ul>
                    <p className="mt-2 text-[11px] italic text-[var(--cs-text-muted)]">AI suggests reflective prompts only — the manager leads the conversation and records it. Requires professional judgement and manager approval.</p>
                  </>
                )}
                {aiState === "done" && aiMessage && <p className="mt-3 text-sm text-[var(--cs-text-secondary)]">{aiMessage}</p>}
              </CardContent>
            </Card>

            {/* records */}
            <div>
              <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Supervision records</p>
              <div className="space-y-3">
                {data.records.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="py-4">
                      <details className="group">
                        <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-[var(--cs-navy)]">{r.staff_name}</span>
                            <span className="ml-2 text-xs text-[var(--cs-text-muted)]">{r.date} · {r.type} · with {r.supervisor_name ?? r.supervisor_id}</span>
                          </div>
                          <span className="shrink-0 text-[11px] text-[var(--cs-text-muted)]">wellbeing {r.wellbeing_score}/5 · confidence {r.confidence_level}/5</span>
                          <span className="shrink-0 text-xs font-medium text-[var(--cs-teal-strong)] group-open:hidden">Open ▾</span>
                          <span className="hidden shrink-0 text-xs font-medium text-[var(--cs-teal-strong)] group-open:inline">Close ▴</span>
                        </summary>
                        <div className="mt-3 space-y-2.5 border-t border-[var(--cs-border)] pt-3">
                          {SECTION_FIELDS.map((f) => (r[f.key] ? (
                            <div key={f.key}>
                              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--cs-teal-strong)]">{f.label}</p>
                              <p className="text-sm text-[var(--cs-text-secondary)]">{String(r[f.key])}</p>
                            </div>
                          ) : null))}
                          {r.training_needs.length > 0 && <p className="text-sm text-[var(--cs-text-secondary)]"><span className="text-[11px] font-bold uppercase tracking-wide text-[var(--cs-teal-strong)]">Training needs:</span> {r.training_needs.join(", ")}</p>}
                          {r.actions.length > 0 && (
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--cs-teal-strong)]">Actions</p>
                              <ul className="mt-0.5 space-y-0.5">{r.actions.map((a, i) => <li key={i} className="flex items-center gap-1.5 text-sm text-[var(--cs-text-secondary)]">{a.done ? <CheckCircle2 className="h-3.5 w-3.5 text-[var(--cs-teal)]" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />} {a.action}{a.due ? ` (due ${String(a.due).slice(0, 10)})` : ""}</li>)}</ul>
                            </div>
                          )}
                          {r.follow_up_date && <p className="text-xs text-[var(--cs-text-muted)]">Follow-up: {r.follow_up_date}</p>}
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                ))}
                {data.records.length === 0 && <Card><CardContent className="py-8 text-center text-sm text-[var(--cs-text-secondary)]">No supervision records yet.</CardContent></Card>}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] px-4 py-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--cs-teal-strong)]" />
              <p className="text-sm text-[var(--cs-text-secondary)]">Wellbeing and confidence are <span className="font-semibold text-[var(--cs-navy)]">support indicators</span> to help you offer the right support — not a diagnosis or a performance verdict. Supervision conclusions are always the manager&rsquo;s, recorded with professional judgement.</p>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
