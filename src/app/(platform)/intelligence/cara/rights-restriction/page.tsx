"use client";

import React, { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useYoungPeople } from "@/hooks/use-young-people";
import {
  useRightsRestrictionOverview,
  useCreateRestrictionReview,
} from "@/hooks/use-rights-restriction";
import type {
  RestrictionAnalysis,
  RestrictionFlag,
} from "@/lib/rights-restriction/rights-restriction-engine";
import { RESTRICTION_KIND_LABEL } from "@/lib/rights-restriction/types";
import type { RestrictionKind, YesNoUnknown } from "@/lib/rights-restriction/types";
import { cn } from "@/lib/utils";
import {
  Scale,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  Info,
  Lightbulb,
  CheckCircle2,
  Plus,
  X,
  MessageCircle,
} from "lucide-react";

const HOME_STATUS: Record<string, { label: string; badge: string }> = {
  settled: { label: "Settled", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  monitor: { label: "Monitor", badge: "bg-amber-100 text-amber-800 border-amber-200" },
  action_needed: { label: "Action needed", badge: "bg-red-100 text-red-800 border-red-200" },
};

const FLAG_TONE: Record<RestrictionFlag["severity"], { icon: React.ElementType; cls: string }> = {
  high: { icon: AlertTriangle, cls: "text-red-700 bg-red-50 border-red-100" },
  advisory: { icon: Lightbulb, cls: "text-amber-700 bg-amber-50 border-amber-100" },
  info: { icon: Info, cls: "text-slate-600 bg-slate-50 border-slate-200" },
};

function CompletenessRing({ pct }: { pct: number }) {
  const tone = pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-600";
  return <span className={cn("text-sm font-bold tabular-nums", tone)}>{pct}%</span>;
}

function FlagList({ flags }: { flags: RestrictionFlag[] }) {
  if (flags.length === 0) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> No issues detected — reasoning looks complete.
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {flags.map((f) => {
        const tone = FLAG_TONE[f.severity];
        const Icon = tone.icon;
        return (
          <li key={f.key} className={cn("flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-xs", tone.cls)}>
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="font-semibold">{f.message}</span>{" "}
              <span className="opacity-80">{f.why}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ── Recording pathway form ─────────────────────────────────────────────────────

function Labelled({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-[var(--cs-navy,#1e293b)]">{label}</span>
      {hint && <span className="block text-[11px] text-[var(--cs-text-muted,#64748b)]">{hint}</span>}
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-white px-3 py-2 text-sm text-[var(--cs-navy,#1e293b)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-warning-soft)]";

type FormState = Record<string, string>;

function RecordPathway({ onDone }: { onDone: () => void }) {
  const ypQuery = useYoungPeople("current");
  const youngPeople = useMemo(
    () => (ypQuery.data?.data ?? []).map((yp) => ({ id: yp.id, name: yp.preferred_name || yp.first_name || "Child" })),
    [ypQuery.data],
  );
  const create = useCreateRestrictionReview();
  const [f, setF] = useState<FormState>({ child_understands: "unknown", child_objects: "unknown", legal_advice_required: "unknown" });
  const [result, setResult] = useState<RestrictionAnalysis | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const canSubmit = !!f.child_id && !!f.restriction_description?.trim() && !!f.reason?.trim();

  async function submit() {
    if (!canSubmit) return;
    const out = await create.mutateAsync({
      ...f,
      child_understands: f.child_understands as YesNoUnknown,
      child_objects: f.child_objects as YesNoUnknown,
      legal_advice_required: f.legal_advice_required as YesNoUnknown,
      restriction_kind: (f.restriction_kind as RestrictionKind) || "other",
      next_review_date: f.next_review_date || null,
    } as never);
    setResult(out.analysis);
  }

  if (result) {
    return (
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy,#1e293b)]">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Review recorded — Cara's read
            </h3>
            <CompletenessRing pct={result.completenessPct} />
          </div>
          <p className="text-xs text-[var(--cs-text-muted,#64748b)]">
            Cara has reviewed the record and flagged anything worth a second look. Use professional judgement — these are
            prompts, not decisions.
          </p>
          <FlagList flags={result.flags} />
          <button onClick={onDone} className="mt-2 rounded-lg bg-[var(--cs-navy,#1e293b)] px-3 py-1.5 text-xs font-semibold text-white">
            Done
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">Record a restriction review</h3>
          <button onClick={onDone} className="text-[var(--cs-text-muted,#64748b)] hover:text-[var(--cs-navy)]"><X className="h-4 w-4" /></button>
        </div>

        {/* The decision */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Labelled label="Child / young person">
            <select value={f.child_id ?? ""} onChange={set("child_id")} className={inputCls}>
              <option value="">Select…</option>
              {youngPeople.map((yp) => <option key={yp.id} value={yp.id}>{yp.name}</option>)}
            </select>
          </Labelled>
          <Labelled label="Type of restriction">
            <select value={f.restriction_kind ?? ""} onChange={set("restriction_kind")} className={inputCls}>
              <option value="">Select…</option>
              {(Object.keys(RESTRICTION_KIND_LABEL) as RestrictionKind[]).map((k) => (
                <option key={k} value={k}>{RESTRICTION_KIND_LABEL[k]}</option>
              ))}
            </select>
          </Labelled>
        </div>
        <Labelled label="The arrangement being reviewed" hint="In plain words — what is actually happening for the child?">
          <textarea value={f.restriction_description ?? ""} onChange={set("restriction_description")} rows={2} className={inputCls} />
        </Labelled>

        {/* Why */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Labelled label="Reason for the restriction"><textarea value={f.reason ?? ""} onChange={set("reason")} rows={2} className={inputCls} /></Labelled>
          <Labelled label="Risk being managed"><textarea value={f.risk_being_managed ?? ""} onChange={set("risk_being_managed")} rows={2} className={inputCls} /></Labelled>
        </div>
        <Labelled label="Immediate safety concern"><textarea value={f.immediate_safety_concern ?? ""} onChange={set("immediate_safety_concern")} rows={2} className={inputCls} /></Labelled>

        {/* The child — emphasised */}
        <div className="rounded-lg border border-[var(--cs-cara-gold-soft,#fde68a)] bg-[var(--cs-cara-gold-bg,#fffbeb)] p-3 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-cara-gold,#b45309)]">
            <MessageCircle className="h-3.5 w-3.5" /> The child's voice
          </div>
          <Labelled label="Child's wishes & feelings" hint="In their words where possible. This is central to the decision.">
            <textarea value={f.child_wishes_feelings ?? ""} onChange={set("child_wishes_feelings")} rows={2} className={inputCls} />
          </Labelled>
          <div className="grid gap-3 sm:grid-cols-3">
            <Labelled label="Does the child understand?">
              <select value={f.child_understands} onChange={set("child_understands")} className={inputCls}>
                <option value="yes">Yes</option><option value="no">No</option><option value="unknown">Not yet known</option>
              </select>
            </Labelled>
            <Labelled label="Does the child object?">
              <select value={f.child_objects} onChange={set("child_objects")} className={inputCls}>
                <option value="yes">Yes</option><option value="no">No</option><option value="unknown">Not yet known</option>
              </select>
            </Labelled>
            <Labelled label="Understanding / competence notes">
              <input value={f.capacity_competence_notes ?? ""} onChange={set("capacity_competence_notes")} className={inputCls} />
            </Labelled>
          </div>
        </div>

        {/* Reasoning */}
        <Labelled label="Best-interests reasoning"><textarea value={f.best_interests_reasoning ?? ""} onChange={set("best_interests_reasoning")} rows={2} className={inputCls} /></Labelled>
        <div className="grid gap-3 sm:grid-cols-2">
          <Labelled label="Least-restrictive alternatives considered"><textarea value={f.least_restrictive_alternatives ?? ""} onChange={set("least_restrictive_alternatives")} rows={2} className={inputCls} /></Labelled>
          <Labelled label="Why alternatives were accepted/rejected"><textarea value={f.alternatives_outcome ?? ""} onChange={set("alternatives_outcome")} rows={2} className={inputCls} /></Labelled>
        </div>
        <Labelled label="Proportionality reasoning" hint="Is the restriction proportionate to the harm being prevented?"><textarea value={f.proportionality_reasoning ?? ""} onChange={set("proportionality_reasoning")} rows={2} className={inputCls} /></Labelled>
        <Labelled label="Parent / social worker / placing authority views"><textarea value={f.parental_social_worker_views ?? ""} onChange={set("parental_social_worker_views")} rows={2} className={inputCls} /></Labelled>

        {/* Time, escalation & decision */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Labelled label="Duration"><input value={f.duration ?? ""} onChange={set("duration")} className={inputCls} placeholder="e.g. overnight, until review" /></Labelled>
          <Labelled label="Review date"><input type="date" value={f.next_review_date ?? ""} onChange={set("next_review_date")} className={inputCls} /></Labelled>
          <Labelled label="Legal / LA advice needed?">
            <select value={f.legal_advice_required} onChange={set("legal_advice_required")} className={inputCls}>
              <option value="yes">Yes</option><option value="no">No</option><option value="unknown">Not yet known</option>
            </select>
          </Labelled>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Labelled label="Manager decision">
            <select value={f.manager_decision ?? "pending"} onChange={set("manager_decision")} className={inputCls}>
              <option value="pending">Pending</option><option value="approved">Approved</option>
              <option value="approved_with_conditions">Approved with conditions</option>
              <option value="not_approved">Not approved</option><option value="escalated">Escalated</option>
            </select>
          </Labelled>
          <Labelled label="Responsible person"><input value={f.responsible_person ?? ""} onChange={set("responsible_person")} className={inputCls} /></Labelled>
        </div>
        <Labelled label="Evidence relied upon"><textarea value={f.evidence_relied_upon ?? ""} onChange={set("evidence_relied_upon")} rows={2} className={inputCls} /></Labelled>

        <div className="flex items-center justify-end gap-2">
          {create.isError && <span className="text-xs text-red-600">Could not save — please try again.</span>}
          <button
            onClick={submit}
            disabled={!canSubmit || create.isPending}
            className={cn("rounded-lg px-4 py-2 text-sm font-semibold text-white", canSubmit ? "bg-[var(--cs-cara-gold,#b45309)]" : "bg-slate-300")}
          >
            {create.isPending ? "Saving…" : "Save review & check with Cara"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function RightsRestrictionPage() {
  const { data, isLoading } = useRightsRestrictionOverview();
  const [recording, setRecording] = useState(false);
  const status = data ? HOME_STATUS[data.homeStatus] : null;

  return (
    <PageShell
      title="Rights, Liberty & Restriction"
      subtitle="Decision support for restrictive arrangements — child-centred, rights-respecting, and reviewable"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Not legal advice banner */}
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <Scale className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Cara is a <span className="font-semibold">decision-support and evidence tool — not legal advice</span>. It helps you
            consider the whole picture (the arrangement, its impact, the child's wishes and objection, proportionality and
            less-restrictive options). Where there is uncertainty, escalate and seek advice from your manager, the local
            authority or a legal adviser.
          </span>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Reviewing restrictions…
          </div>
        )}

        {data && status && (
          <>
            {/* Overview */}
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-[var(--cs-cara-gold,#b45309)]" />
                    <h2 className="text-base font-bold text-[var(--cs-navy,#1e293b)]">Restrictions across the home</h2>
                    <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase", status.badge)}>{status.label}</span>
                  </div>
                  {!recording && (
                    <button onClick={() => setRecording(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cs-cara-gold,#b45309)] px-3 py-1.5 text-xs font-semibold text-white">
                      <Plus className="h-3.5 w-3.5" /> Record a restriction review
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-[var(--cs-text-secondary,#475569)]">{data.headline}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{data.activeCount} active</span>
                  {data.needingAttention > 0 && (
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">{data.needingAttention} need attention</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {recording && <RecordPathway onDone={() => setRecording(false)} />}

            {/* Dashboard alerts */}
            {data.alerts.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--cs-navy,#1e293b)]">
                    <ShieldAlert className="h-4 w-4 text-rose-500" /> Restriction alerts
                  </h3>
                  <div className="space-y-2">
                    {data.alerts.map((a) => (
                      <div key={a.key} className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                        <span>
                          <span className="font-semibold text-rose-800">{a.label}</span>
                          <span className="ml-1 rounded-full bg-white/70 px-1.5 py-0.5 text-[11px] font-medium text-rose-700">{a.childNames.join(", ")}</span>
                          <span className="mt-0.5 block text-xs text-rose-700">{a.why}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <div className="space-y-3">
              <h3 className="px-1 text-sm font-bold text-[var(--cs-navy,#1e293b)]">Restriction reviews</h3>
              {data.reviews.length === 0 && (
                <p className="px-1 text-sm text-[var(--cs-text-muted,#64748b)]">No restriction reviews recorded yet.</p>
              )}
              {data.reviews.map(({ review, childName, analysis }) => (
                <Card key={review.id} className={cn(analysis.needsManagerAttention && "border-l-4 border-l-red-400")}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">{childName}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{RESTRICTION_KIND_LABEL[review.restriction_kind]}</span>
                        <span className="text-[11px] text-[var(--cs-text-muted,#64748b)]">reviewed {review.review_date}</span>
                      </div>
                      <CompletenessRing pct={analysis.completenessPct} />
                    </div>
                    <p className="text-sm text-[var(--cs-text-secondary,#475569)]">{review.restriction_description}</p>
                    <FlagList flags={analysis.flags} />
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              Cara surfaces gaps and prompts to support rights-respecting, proportionate decisions. It informs practice and
              evidences your reasoning — it never replaces professional judgement or legal advice.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
