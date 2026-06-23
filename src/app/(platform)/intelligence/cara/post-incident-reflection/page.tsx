"use client";

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import {
  useReflectionOverview,
  useStartReflection,
  useUpdateReflection,
  type ReflectionResult,
} from "@/hooks/use-post-incident-reflection";
import { STAGE_DEFS, type StageKey, type StageStatus } from "@/lib/post-incident-reflection/types";
import type {
  ReflectionFlag,
  IncidentNeedingReflection,
} from "@/lib/post-incident-reflection/post-incident-reflection-engine";
import { cn } from "@/lib/utils";
import {
  GitBranch,
  Loader2,
  AlertTriangle,
  Lightbulb,
  Info,
  CheckCircle2,
  Circle,
  ShieldAlert,
  Repeat,
  Plus,
  X,
  MessageCircle,
  ClipboardCheck,
} from "lucide-react";

const HOME_STATUS: Record<string, { label: string; badge: string }> = {
  settled: { label: "Settled", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  monitor: { label: "Monitor", badge: "bg-amber-100 text-amber-800 border-amber-200" },
  action_needed: { label: "Action needed", badge: "bg-red-100 text-red-800 border-red-200" },
};

const FLAG_TONE: Record<ReflectionFlag["severity"], { icon: React.ElementType; cls: string }> = {
  high: { icon: AlertTriangle, cls: "text-red-700 bg-red-50 border-red-100" },
  advisory: { icon: Lightbulb, cls: "text-amber-700 bg-amber-50 border-amber-100" },
  info: { icon: Info, cls: "text-slate-600 bg-slate-50 border-slate-200" },
};

const STAGE_DONE = new Set<StageStatus>(["completed", "signed_off"]);

function Flags({ flags }: { flags: ReflectionFlag[] }) {
  if (flags.length === 0) return <p className="flex items-center gap-1.5 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> No issues detected.</p>;
  return (
    <ul className="space-y-1.5">
      {flags.map((f) => {
        const t = FLAG_TONE[f.severity];
        const Icon = t.icon;
        return (
          <li key={f.key} className={cn("flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-xs", t.cls)}>
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span><span className="font-semibold">{f.message}</span> <span className="opacity-80">{f.why}</span></span>
          </li>
        );
      })}
    </ul>
  );
}

const inputCls = "w-full rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-white px-3 py-2 text-sm text-[var(--cs-navy,#1e293b)] focus:outline-none focus:ring-2 focus:ring-amber-300";

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="text-xs font-semibold text-[var(--cs-navy,#1e293b)]">{label}</span>{children}</label>;
}

// ── Guided reflection form (started from an incident) ───────────────────────────

function ReflectionForm({ incident, onDone }: { incident: IncidentNeedingReflection; onDone: () => void }) {
  const start = useStartReflection();
  const [f, setF] = useState<Record<string, string>>({ response_helped: "unknown", response_escalated: "unknown", child_debrief_done: "unknown", staff_debrief_done: "unknown" });
  const [plans, setPlans] = useState<Record<string, boolean>>({});
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const togglePlan = (k: string) => setPlans((p) => ({ ...p, [k]: !p[k] }));

  async function submit() {
    await start.mutateAsync({
      incident_id: incident.incidentId,
      child_id: incident.childId,
      severity: incident.severity,
      incident_date: incident.date,
      ...f,
      ...plans,
    } as never);
    onDone();
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">Reflect on {incident.childName}'s incident — {incident.date}</h3>
          <button onClick={onDone} className="text-[var(--cs-text-muted,#64748b)] hover:text-[var(--cs-navy)]"><X className="h-4 w-4" /></button>
        </div>

        <Labelled label="What happened"><textarea value={f.what_happened ?? ""} onChange={set("what_happened")} rows={2} className={inputCls} /></Labelled>
        <div className="grid gap-3 sm:grid-cols-2">
          <Labelled label="Impact on the child"><textarea value={f.impact_on_child ?? ""} onChange={set("impact_on_child")} rows={2} className={inputCls} /></Labelled>
          <Labelled label="Likely triggers"><textarea value={f.likely_triggers ?? ""} onChange={set("likely_triggers")} rows={2} className={inputCls} /></Labelled>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Labelled label="Staff response"><textarea value={f.staff_response ?? ""} onChange={set("staff_response")} rows={2} className={inputCls} /></Labelled>
          <Labelled label="Did it help?"><select value={f.response_helped} onChange={set("response_helped")} className={inputCls}><option value="yes">Yes</option><option value="no">No</option><option value="unknown">Not sure</option></select></Labelled>
          <Labelled label="Did it escalate?"><select value={f.response_escalated} onChange={set("response_escalated")} className={inputCls}><option value="yes">Yes</option><option value="no">No</option><option value="unknown">Not sure</option></select></Labelled>
        </div>

        {/* Child voice — emphasised */}
        <div className="rounded-lg border border-[var(--cs-cara-gold-soft,#fde68a)] bg-[var(--cs-cara-gold-bg,#fffbeb)] p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-cara-gold,#b45309)]"><MessageCircle className="h-3.5 w-3.5" /> The child's view</div>
          <textarea value={f.child_view ?? ""} onChange={set("child_view")} rows={2} className={inputCls} placeholder="How does the child see what happened?" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Labelled label="Child debrief done?"><select value={f.child_debrief_done} onChange={set("child_debrief_done")} className={inputCls}><option value="yes">Yes</option><option value="no">No / not yet</option><option value="unknown">Not sure</option></select></Labelled>
            <Labelled label="Staff debrief done?"><select value={f.staff_debrief_done} onChange={set("staff_debrief_done")} className={inputCls}><option value="yes">Yes</option><option value="no">No / not needed</option><option value="unknown">Not sure</option></select></Labelled>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Labelled label="What went well"><textarea value={f.what_went_well ?? ""} onChange={set("what_went_well")} rows={2} className={inputCls} /></Labelled>
          <Labelled label="What could be different"><textarea value={f.what_could_be_different ?? ""} onChange={set("what_could_be_different")} rows={2} className={inputCls} /></Labelled>
        </div>
        <Labelled label="Learning points"><textarea value={f.learning_points ?? ""} onChange={set("learning_points")} rows={2} className={inputCls} /></Labelled>

        {/* Plan reviews */}
        <div>
          <div className="mb-1.5 text-xs font-semibold text-[var(--cs-navy,#1e293b)]">Does a plan need reviewing?</div>
          <div className="flex flex-wrap gap-2">
            {[
              ["staying_safe_plan_review", "Staying Safe Plan"],
              ["risk_assessment_review", "Risk assessment"],
              ["behaviour_support_review", "Behaviour support"],
              ["relationship_map_review", "Relationship map"],
              ["restrictive_practice_review", "Restrictive practice"],
            ].map(([k, label]) => (
              <button key={k} type="button" onClick={() => togglePlan(k)} className={cn("rounded-full border px-3 py-1 text-xs font-medium", plans[k] ? "border-[var(--cs-cara-gold,#b45309)] bg-amber-50 text-[var(--cs-cara-gold,#b45309)]" : "border-[var(--cs-border,#e2e8f0)] bg-white text-[var(--cs-text-secondary,#475569)]")}>
                {plans[k] ? "✓ " : ""}{label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          {start.isError && <span className="text-xs text-red-600">Could not save — try again.</span>}
          <button onClick={submit} disabled={start.isPending} className="rounded-lg bg-[var(--cs-cara-gold,#b45309)] px-4 py-2 text-sm font-semibold text-white">
            {start.isPending ? "Saving…" : "Save reflection"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Stage tracker ──────────────────────────────────────────────────────────────

function StageTracker({ item }: { item: ReflectionResult }) {
  const update = useUpdateReflection();
  const stages = item.reflection.stages;

  function markStage(key: StageKey) {
    const next = stages.map((s) => (s.key === key ? { ...s, status: "completed" as StageStatus, updated_at: new Date().toISOString() } : s));
    update.mutate({ id: item.reflection.id, stages: next } as never);
  }
  function signOff() {
    const next = stages.map((s) => (["final_sign_off", "learning_captured"].includes(s.key) ? { ...s, status: "signed_off" as StageStatus } : s));
    update.mutate({ id: item.reflection.id, stages: next, sign_off: true } as never);
  }

  const signedOff = item.reflection.status === "signed_off";

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {STAGE_DEFS.map((d) => {
          const st = stages.find((s) => s.key === d.key);
          const done = st && STAGE_DONE.has(st.status);
          return (
            <div key={d.key} className="flex items-center gap-2 text-sm">
              {done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <Circle className="h-4 w-4 shrink-0 text-slate-300" />}
              <span className={cn("flex-1", done ? "text-[var(--cs-text-muted,#64748b)] line-through" : "text-[var(--cs-navy,#1e293b)]")}>{d.label}</span>
              {!done && !signedOff && d.key !== "final_sign_off" && (
                <button onClick={() => markStage(d.key)} disabled={update.isPending} className="rounded-md border border-[var(--cs-border,#e2e8f0)] px-2 py-0.5 text-[11px] font-medium text-[var(--cs-cara-gold,#b45309)] hover:bg-amber-50">Mark done</button>
              )}
            </div>
          );
        })}
      </div>
      {!signedOff ? (
        <button onClick={signOff} disabled={update.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cs-navy,#1e293b)] px-3 py-1.5 text-xs font-semibold text-white">
          <ClipboardCheck className="h-3.5 w-3.5" /> Manager sign-off
        </button>
      ) : (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Signed off{item.reflection.signed_off_by ? ` by ${item.reflection.signed_off_by}` : ""}</p>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function PostIncidentReflectionPage() {
  const { data, isLoading } = useReflectionOverview();
  const [reflectingOn, setReflectingOn] = useState<IncidentNeedingReflection | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const status = data ? HOME_STATUS[data.homeStatus] : null;

  return (
    <PageShell
      title="Post-Incident Reflection & Learning"
      subtitle="Turn incidents into reflection, repair and safer practice — with a clear workflow and manager oversight"
    >
      <div className="space-y-6 animate-fade-in">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]"><Loader2 className="h-4 w-4 animate-spin" /> Reviewing reflections…</div>
        )}

        {data && status && (
          <>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-[var(--cs-cara-gold,#b45309)]" />
                  <h2 className="text-base font-bold text-[var(--cs-navy,#1e293b)]">Reflection & learning across the home</h2>
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase", status.badge)}>{status.label}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary,#475569)]">{data.headline}</p>
              </CardContent>
            </Card>

            {/* Incidents needing reflection — automation surfacing */}
            {data.incidentsNeedingReflection.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--cs-navy,#1e293b)]"><ShieldAlert className="h-4 w-4 text-rose-500" /> Incidents needing a reflection</h3>
                  <div className="space-y-2">
                    {data.incidentsNeedingReflection.map((inc) => (
                      <div key={inc.incidentId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2">
                        <span className="text-sm text-rose-800"><span className="font-semibold">{inc.childName}</span> · {inc.date} · {inc.severity}</span>
                        <button onClick={() => setReflectingOn(inc)} className="inline-flex items-center gap-1 rounded-lg bg-[var(--cs-cara-gold,#b45309)] px-2.5 py-1 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Start reflection</button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {reflectingOn && <ReflectionForm incident={reflectingOn} onDone={() => setReflectingOn(null)} />}

            {/* Alerts */}
            {data.alerts.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="mb-3 text-sm font-bold text-[var(--cs-navy,#1e293b)]">Learning alerts</h3>
                  <div className="space-y-2">
                    {data.alerts.map((a) => (
                      <div key={a.key} className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm">
                        {a.key === "repeated_triggers" ? <Repeat className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
                        <span>
                          <span className="font-semibold text-amber-900">{a.label}</span>
                          <span className="ml-1 rounded-full bg-white/70 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">{a.items.join(", ")}</span>
                          <span className="mt-0.5 block text-xs text-amber-800">{a.why}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reflections */}
            <div className="space-y-3">
              <h3 className="px-1 text-sm font-bold text-[var(--cs-navy,#1e293b)]">Reflections</h3>
              {data.reflections.length === 0 && <p className="px-1 text-sm text-[var(--cs-text-muted,#64748b)]">No reflections recorded yet.</p>}
              {data.reflections.map((item) => {
                const open = expanded === item.reflection.id;
                return (
                  <Card key={item.reflection.id} className={cn(item.analysis.needsManagerAttention && "border-l-4 border-l-red-400")}>
                    <CardContent className="p-4 space-y-2">
                      <button onClick={() => setExpanded(open ? null : item.reflection.id)} className="flex w-full flex-wrap items-center justify-between gap-2 text-left">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">{item.childName}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{item.reflection.severity}</span>
                          <span className="text-[11px] text-[var(--cs-text-muted,#64748b)]">{item.reflection.incident_date}</span>
                        </span>
                        <span className="text-xs font-bold tabular-nums text-[var(--cs-cara-gold,#b45309)]">{item.analysis.stagesComplete}/{item.analysis.stagesTotal} stages · {item.analysis.progressPct}%</span>
                      </button>
                      <Flags flags={item.analysis.flags} />
                      {open && (
                        <div className="mt-3 grid gap-4 border-t pt-3 lg:grid-cols-2">
                          <div>
                            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted,#64748b)]">Workflow</div>
                            <StageTracker item={item} />
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted,#64748b)]">What happened</div>
                            <p className="text-[var(--cs-text-secondary,#475569)]">{item.reflection.what_happened || "—"}</p>
                            {item.reflection.child_view && (
                              <p className="rounded-lg bg-[var(--cs-cara-gold-bg,#fffbeb)] px-2.5 py-1.5 text-xs text-[var(--cs-navy,#1e293b)]"><span className="font-semibold">Child's view:</span> {item.reflection.child_view}</p>
                            )}
                            {item.reflection.learning_points && (
                              <p className="text-xs text-[var(--cs-text-secondary,#475569)]"><span className="font-semibold">Learning:</span> {item.reflection.learning_points}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              Cara guides reflection and surfaces patterns to support learning and repair. It informs practice — it never
              replaces professional judgement or a manager's decision.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
