"use client";

import React, { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { PrintButton } from "@/components/ui/print-button";
import { useYoungPeople } from "@/hooks/use-young-people";
import {
  useStayingSafePlanOverview,
  useChildStayingSafePlan,
  useCreateStayingSafePlan,
  useUpdateStayingSafePlan,
} from "@/hooks/use-staying-safe-plan";
import { ZONE_META, type StayingSafePlan, type ZonePlan } from "@/lib/staying-safe-plan/types";
import type { SafePlanFlag } from "@/lib/staying-safe-plan/staying-safe-plan-engine";
import { cn } from "@/lib/utils";
import {
  ShieldCheck, Loader2, AlertTriangle, Lightbulb, Info, CheckCircle2, Plus, X,
  Heart, Users, Sparkles, BookOpen, Baby, Briefcase,
} from "lucide-react";

const HOME_STATUS: Record<string, { label: string; badge: string }> = {
  settled: { label: "Settled", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  monitor: { label: "Monitor", badge: "bg-amber-100 text-amber-800 border-amber-200" },
  action_needed: { label: "Action needed", badge: "bg-red-100 text-red-800 border-red-200" },
};
const FLAG_TONE: Record<SafePlanFlag["severity"], { icon: React.ElementType; cls: string }> = {
  high: { icon: AlertTriangle, cls: "text-red-700 bg-red-50 border-red-100" },
  advisory: { icon: Lightbulb, cls: "text-amber-700 bg-amber-50 border-amber-100" },
  info: { icon: Info, cls: "text-slate-600 bg-slate-50 border-slate-200" },
};
const ZONE_STYLE = {
  green: "border-emerald-200 bg-emerald-50",
  amber: "border-amber-200 bg-amber-50",
  red: "border-red-200 bg-red-50",
} as const;

const inputCls = "w-full rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-white px-3 py-2 text-sm text-[var(--cs-navy,#1e293b)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-warning-soft)]";
function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="text-xs font-semibold text-[var(--cs-navy,#1e293b)]">{label}</span>{children}</label>;
}

function Flags({ flags }: { flags: SafePlanFlag[] }) {
  if (flags.length === 0) return <p className="flex items-center gap-1.5 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> No issues detected — this plan looks complete.</p>;
  return (
    <ul className="space-y-1.5">
      {flags.map((f) => {
        const t = FLAG_TONE[f.severity]; const Icon = t.icon;
        return <li key={f.key} className={cn("flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-xs", t.cls)}><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span><span className="font-semibold">{f.message}</span> <span className="opacity-80">{f.why}</span></span></li>;
      })}
    </ul>
  );
}

// ── Zone display ───────────────────────────────────────────────────────────────

function ZoneCard({ zone, data, childFriendly }: { zone: "green" | "amber" | "red"; data: ZonePlan; childFriendly: boolean }) {
  const meta = ZONE_META[zone];
  return (
    <div className={cn("rounded-xl border p-4", ZONE_STYLE[zone])}>
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--cs-navy,#1e293b)]"><span className="text-lg">{meta.emoji}</span> {meta.label}</div>
      {data.signs && <p className="mb-2 text-sm text-[var(--cs-navy,#1e293b)]">{data.signs}</p>}
      <div className="space-y-1.5 text-xs">
        {data.staff_do && <p><span className="font-semibold text-emerald-700">{childFriendly ? "What helps me:" : "Staff do:"}</span> {data.staff_do}</p>}
        {data.staff_dont && <p><span className="font-semibold text-red-700">{childFriendly ? "Please don't:" : "Staff don't:"}</span> {data.staff_dont}</p>}
      </div>
    </div>
  );
}

function PlanView({ plan, childFriendly }: { plan: StayingSafePlan; childFriendly: boolean }) {
  const Section = ({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) =>
    body ? (
      <div className="rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-white p-3">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-[var(--cs-navy,#1e293b)]"><Icon className="h-3.5 w-3.5 text-[var(--cs-cara-gold,#b45309)]" /> {title}</div>
        <p className="text-sm text-[var(--cs-text-secondary,#475569)]">{body}</p>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      {plan.when_to_use && <p className="rounded-lg bg-[var(--cs-cara-gold-bg,#fffbeb)] px-3 py-2 text-sm text-[var(--cs-navy,#1e293b)]">{plan.when_to_use}</p>}
      {plan.early_warning_signs && <Section icon={Sparkles} title="My early warning signs" body={plan.early_warning_signs} />}
      <div className="grid gap-3 md:grid-cols-3">
        <ZoneCard zone="green" data={plan.green} childFriendly={childFriendly} />
        <ZoneCard zone="amber" data={plan.amber} childFriendly={childFriendly} />
        <ZoneCard zone="red" data={plan.red} childFriendly={childFriendly} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Section icon={Heart} title={childFriendly ? "Things that calm me" : "Calming tools"} body={plan.calming_tools} />
        <Section icon={Users} title={childFriendly ? "People I trust" : "Trusted people"} body={plan.trusted_people} />
        <Section icon={ShieldCheck} title={childFriendly ? "My safe places" : "Safe spaces"} body={plan.safe_spaces} />
        <Section icon={Sparkles} title="Helpful words" body={plan.helpful_words} />
        <Section icon={X} title={childFriendly ? "Words that make it worse" : "Unhelpful words / actions"} body={plan.unhelpful_words} />
        <Section icon={Heart} title="What helps me feel safe again" body={plan.what_helps_feel_safe_again} />
        <Section icon={BookOpen} title="Repair & recovery" body={plan.repair_recovery} />
        <Section icon={Users} title="My choices" body={plan.my_choices} />
      </div>
      {!childFriendly && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Section icon={Sparkles} title="Sensory needs" body={plan.sensory_needs} />
          <Section icon={Users} title="Contact preferences" body={plan.contact_preferences} />
        </div>
      )}
      {plan.child_contribution && (
        <div className="rounded-lg border border-[var(--cs-cara-gold-soft,#fde68a)] bg-[var(--cs-cara-gold-bg,#fffbeb)] p-3">
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--cs-cara-gold,#b45309)]">In my words</div>
          <p className="text-sm text-[var(--cs-navy,#1e293b)]">{plan.child_contribution}</p>
        </div>
      )}
    </div>
  );
}

// ── Create / edit form ─────────────────────────────────────────────────────────

function PlanForm({ childId, existing, onDone }: { childId: string; existing: StayingSafePlan | null; onDone: () => void }) {
  const create = useCreateStayingSafePlan();
  const update = useUpdateStayingSafePlan();
  const [f, setF] = useState<Record<string, string>>(() => {
    if (!existing) return {};
    const { green, amber, red, ...rest } = existing;
    return {
      ...Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, typeof v === "string" ? v : ""])),
      green_signs: green.signs, green_do: green.staff_do, green_dont: green.staff_dont,
      amber_signs: amber.signs, amber_do: amber.staff_do, amber_dont: amber.staff_dont,
      red_signs: red.signs, red_do: red.staff_do, red_dont: red.staff_dont,
    };
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit() {
    const payload = {
      child_id: childId,
      when_to_use: f.when_to_use, early_warning_signs: f.early_warning_signs,
      green: { signs: f.green_signs ?? "", staff_do: f.green_do ?? "", staff_dont: f.green_dont ?? "" },
      amber: { signs: f.amber_signs ?? "", staff_do: f.amber_do ?? "", staff_dont: f.amber_dont ?? "" },
      red: { signs: f.red_signs ?? "", staff_do: f.red_do ?? "", staff_dont: f.red_dont ?? "" },
      calming_tools: f.calming_tools, trusted_people: f.trusted_people, safe_spaces: f.safe_spaces,
      helpful_words: f.helpful_words, unhelpful_words: f.unhelpful_words, sensory_needs: f.sensory_needs,
      contact_preferences: f.contact_preferences, repair_recovery: f.repair_recovery,
      what_helps_feel_safe_again: f.what_helps_feel_safe_again, my_choices: f.my_choices,
      child_contribution: f.child_contribution, communication_style: f.communication_style, review_date: f.review_date || null,
    };
    if (existing) await update.mutateAsync({ id: existing.id, ...payload } as never);
    else await create.mutateAsync(payload as never);
    onDone();
  }

  const ZoneFields = ({ zone, label }: { zone: string; label: string }) => (
    <div className="rounded-lg border border-[var(--cs-border,#e2e8f0)] p-3 space-y-2">
      <div className="text-xs font-bold text-[var(--cs-navy,#1e293b)]">{label}</div>
      <Labelled label="How the child looks / feels"><input value={f[`${zone}_signs`] ?? ""} onChange={set(`${zone}_signs`)} className={inputCls} /></Labelled>
      <Labelled label="What helps / staff do"><input value={f[`${zone}_do`] ?? ""} onChange={set(`${zone}_do`)} className={inputCls} /></Labelled>
      <Labelled label="What makes it worse / staff don't"><input value={f[`${zone}_dont`] ?? ""} onChange={set(`${zone}_dont`)} className={inputCls} /></Labelled>
    </div>
  );

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">{existing ? "Edit" : "Create"} Staying Safe Plan</h3>
          <button onClick={onDone} className="text-[var(--cs-text-muted,#64748b)] hover:text-[var(--cs-navy)]"><X className="h-4 w-4" /></button>
        </div>
        <Labelled label="When to use this plan"><textarea value={f.when_to_use ?? ""} onChange={set("when_to_use")} rows={2} className={inputCls} /></Labelled>
        <Labelled label="Early warning signs"><textarea value={f.early_warning_signs ?? ""} onChange={set("early_warning_signs")} rows={2} className={inputCls} /></Labelled>
        <div className="grid gap-3 md:grid-cols-3">
          <ZoneFields zone="green" label="🟢 When I'm okay" />
          <ZoneFields zone="amber" label="🟠 When I'm struggling" />
          <ZoneFields zone="red" label="🔴 When I need urgent help" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Labelled label="Calming tools"><textarea value={f.calming_tools ?? ""} onChange={set("calming_tools")} rows={2} className={inputCls} /></Labelled>
          <Labelled label="Trusted people"><textarea value={f.trusted_people ?? ""} onChange={set("trusted_people")} rows={2} className={inputCls} /></Labelled>
          <Labelled label="Helpful words"><input value={f.helpful_words ?? ""} onChange={set("helpful_words")} className={inputCls} /></Labelled>
          <Labelled label="Unhelpful words / actions"><input value={f.unhelpful_words ?? ""} onChange={set("unhelpful_words")} className={inputCls} /></Labelled>
          <Labelled label="Safe spaces"><input value={f.safe_spaces ?? ""} onChange={set("safe_spaces")} className={inputCls} /></Labelled>
          <Labelled label="Sensory needs"><input value={f.sensory_needs ?? ""} onChange={set("sensory_needs")} className={inputCls} /></Labelled>
          <Labelled label="Repair & recovery"><textarea value={f.repair_recovery ?? ""} onChange={set("repair_recovery")} rows={2} className={inputCls} /></Labelled>
          <Labelled label="What helps me feel safe again"><textarea value={f.what_helps_feel_safe_again ?? ""} onChange={set("what_helps_feel_safe_again")} rows={2} className={inputCls} /></Labelled>
        </div>
        <div className="rounded-lg border border-[var(--cs-cara-gold-soft,#fde68a)] bg-[var(--cs-cara-gold-bg,#fffbeb)] p-3">
          <Labelled label="The child's own words (co-produced)"><textarea value={f.child_contribution ?? ""} onChange={set("child_contribution")} rows={2} className={inputCls} /></Labelled>
        </div>
        <Labelled label="Review date"><input type="date" value={f.review_date ?? ""} onChange={set("review_date")} className={inputCls} /></Labelled>
        <div className="flex justify-end">
          <button onClick={submit} disabled={create.isPending || update.isPending} className="rounded-lg bg-[var(--cs-cara-gold,#b45309)] px-4 py-2 text-sm font-semibold text-white">
            {create.isPending || update.isPending ? "Saving…" : "Save plan"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function StayingSafePlansPage() {
  const overview = useStayingSafePlanOverview();
  const ypQuery = useYoungPeople("current");
  const youngPeople = useMemo(() => (ypQuery.data?.data ?? []).map((yp) => ({ id: yp.id, name: yp.preferred_name || yp.first_name || "Child" })), [ypQuery.data]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const childId = selectedChildId || youngPeople[0]?.id || "";
  const child = useChildStayingSafePlan(childId);
  const [editing, setEditing] = useState(false);
  const [childFriendly, setChildFriendly] = useState(false);
  const update = useUpdateStayingSafePlan();

  const o = overview.data;
  const status = o ? HOME_STATUS[o.homeStatus] : null;
  const plan = child.data?.plan ?? null;
  const analysis = child.data?.analysis ?? null;

  return (
    <PageShell title="Staying Safe Plans" subtitle="Child-centred safety plans — green, amber, red — that tell staff what helps and how to repair">
      <div className="space-y-6 animate-fade-in">
        {overview.isLoading && <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading plans…</div>}

        {o && status && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[var(--cs-cara-gold,#b45309)]" />
                <h2 className="text-base font-bold text-[var(--cs-navy,#1e293b)]">Staying Safe Plans across the home</h2>
                <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase", status.badge)}>{status.label}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--cs-text-secondary,#475569)]">{o.headline}</p>
              {o.alerts.length > 0 && (
                <div className="mt-3 space-y-2">
                  {o.alerts.map((a) => (
                    <div key={a.key} className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <span><span className="font-semibold text-amber-900">{a.label}</span> <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">{a.items.join(", ")}</span><span className="mt-0.5 block text-xs text-amber-800">{a.why}</span></span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Child selector + view controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select value={childId} onChange={(e) => { setSelectedChildId(e.target.value); setEditing(false); }} className={cn(inputCls, "w-auto")}>
            {youngPeople.map((yp) => <option key={yp.id} value={yp.id}>{yp.name}</option>)}
          </select>
          {plan && !editing && (
            <>
              <div className="inline-flex overflow-hidden rounded-lg border border-[var(--cs-border,#e2e8f0)]">
                <button onClick={() => setChildFriendly(false)} className={cn("inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium", !childFriendly ? "bg-[var(--cs-cara-gold,#b45309)] text-white" : "bg-white text-[var(--cs-text-secondary)]")}><Briefcase className="h-3.5 w-3.5" /> Professional</button>
                <button onClick={() => setChildFriendly(true)} className={cn("inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium", childFriendly ? "bg-[var(--cs-cara-gold,#b45309)] text-white" : "bg-white text-[var(--cs-text-secondary)]")}><Baby className="h-3.5 w-3.5" /> Child-friendly</button>
              </div>
              <button onClick={() => setEditing(true)} className="rounded-lg border border-[var(--cs-border,#e2e8f0)] px-3 py-1.5 text-xs font-medium text-[var(--cs-navy,#1e293b)]">Edit</button>
              <PrintButton title={`Staying Safe Plan — ${child.data?.childName ?? ""}`} />
            </>
          )}
        </div>

        {child.isLoading && <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading plan…</div>}

        {editing && <PlanForm childId={childId} existing={plan} onDone={() => setEditing(false)} />}

        {!editing && !child.isLoading && !plan && childId && (
          <Card><CardContent className="p-6 text-center">
            <p className="mb-3 text-sm text-[var(--cs-text-secondary,#475569)]">{child.data?.childName ?? "This child"} doesn't have a Staying Safe Plan yet.</p>
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cs-cara-gold,#b45309)] px-3 py-1.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Create a plan</button>
          </CardContent></Card>
        )}

        {!editing && plan && analysis && (
          <div id="staying-safe-plan-content" className="space-y-4">
            {!childFriendly && (
              <Card><CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">Cara's check · {analysis.completenessPct}% complete</h3>
                  {!plan.manager_approved ? (
                    <button onClick={() => update.mutate({ id: plan.id, approve: true } as never)} disabled={update.isPending} className="rounded-lg bg-[var(--cs-navy,#1e293b)] px-3 py-1.5 text-xs font-semibold text-white">Manager approve</button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Approved</span>
                  )}
                </div>
                <Flags flags={analysis.flags} />
              </CardContent></Card>
            )}
            <PlanView plan={plan} childFriendly={childFriendly} />
          </div>
        )}

        <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
          Cara helps build and keep Staying Safe Plans current and co-produced with the child. It supports practice — it never
          replaces the relationship or professional judgement.
        </p>
      </div>
    </PageShell>
  );
}
