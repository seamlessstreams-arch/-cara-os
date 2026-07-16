"use client";

import React, { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { PrintButton } from "@/components/ui/print-button";
import { useYoungPeople } from "@/hooks/use-young-people";
import {
  useRelationshipsOverview,
  useChildRelationships,
  useAddRelationship,
} from "@/hooks/use-protective-relationships";
import {
  CATEGORY_META,
  type RelationshipEntry,
  type RelationshipRating,
  type RelationshipCategory,
} from "@/lib/protective-relationships/types";
import type { RelationshipFlag } from "@/lib/protective-relationships/protective-relationships-engine";
import { cn } from "@/lib/utils";
import {
  Network, Loader2, AlertTriangle, Lightbulb, Info, ShieldCheck, ShieldAlert, Plus, X,
  Users, Briefcase, Baby, Lock,
} from "lucide-react";

const HOME_STATUS: Record<string, { label: string; badge: string }> = {
  settled: { label: "Settled", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  monitor: { label: "Monitor", badge: "bg-amber-100 text-amber-800 border-amber-200" },
  action_needed: { label: "Action needed", badge: "bg-red-100 text-red-800 border-red-200" },
};
const STATUS_META: Record<string, { label: string; badge: string }> = {
  secure: { label: "Secure network", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  developing: { label: "Developing", badge: "bg-amber-100 text-amber-800 border-amber-200" },
  fragile: { label: "Fragile", badge: "bg-red-100 text-red-800 border-red-200" },
};
const RATING_STYLE: Record<RelationshipRating, { border: string; chip: string; label: string }> = {
  protective: { border: "border-l-emerald-400", chip: "bg-emerald-50 text-emerald-700", label: "Protective" },
  neutral: { border: "border-l-slate-300", chip: "bg-slate-100 text-slate-600", label: "Neutral" },
  risk: { border: "border-l-red-400", chip: "bg-red-50 text-red-700", label: "Risk" },
};
const FLAG_TONE: Record<RelationshipFlag["severity"], { icon: React.ElementType; cls: string }> = {
  high: { icon: AlertTriangle, cls: "text-red-700 bg-red-50 border-red-100" },
  advisory: { icon: Lightbulb, cls: "text-amber-700 bg-amber-50 border-amber-100" },
  info: { icon: Info, cls: "text-slate-600 bg-slate-50 border-slate-200" },
};
const inputCls = "w-full rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-white px-3 py-2 text-sm text-[var(--cs-navy,#1e293b)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-warning-soft)]";

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="text-xs font-semibold text-[var(--cs-navy,#1e293b)]">{label}</span>{children}</label>;
}

function RelationshipCard({ e, childFriendly }: { e: RelationshipEntry; childFriendly: boolean }) {
  const r = RATING_STYLE[e.rating];
  return (
    <div className={cn("rounded-lg border border-l-4 bg-white p-3", r.border)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">{e.name}</span>
        <span className="text-xs text-[var(--cs-text-muted,#64748b)]">{e.relationship_to_child}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", r.chip)}>{r.label}</span>
        {!childFriendly && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{CATEGORY_META[e.category].label}</span>}
      </div>
      {e.child_view && <p className="mt-1 text-xs text-[var(--cs-text-secondary,#475569)]">“{e.child_view}”</p>}
      {!childFriendly && (
        <div className="mt-1.5 space-y-0.5 text-xs">
          {e.known_strengths && <p className="text-emerald-700"><span className="font-semibold">Strengths:</span> {e.known_strengths}</p>}
          {e.known_concerns && <p className="text-red-700"><span className="font-semibold">Concerns:</span> {e.known_concerns}</p>}
          {e.restrictions && <p className="flex items-center gap-1 text-rose-700"><Lock className="h-3 w-3" /> {e.restrictions}</p>}
          {e.contact_arrangements && <p className="text-[var(--cs-text-muted,#64748b)]"><span className="font-semibold">Contact:</span> {e.contact_arrangements}</p>}
        </div>
      )}
    </div>
  );
}

function AddRelationshipForm({ childId, onDone }: { childId: string; onDone: () => void }) {
  const add = useAddRelationship();
  const [f, setF] = useState<Record<string, string>>({ category: "safe_adult", rating: "protective" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  async function submit() {
    if (!f.name?.trim()) return;
    await add.mutateAsync({ child_id: childId, name: f.name, ...f, review_date: f.review_date || null } as never);
    onDone();
  }
  return (
    <Card><CardContent className="p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">Add a relationship</h3>
        <button onClick={onDone} className="text-[var(--cs-text-muted,#64748b)] hover:text-[var(--cs-navy)]"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Labelled label="Name / identifier"><input value={f.name ?? ""} onChange={set("name")} className={inputCls} /></Labelled>
        <Labelled label="Relationship to the child"><input value={f.relationship_to_child ?? ""} onChange={set("relationship_to_child")} className={inputCls} /></Labelled>
        <Labelled label="Category">
          <select value={f.category} onChange={set("category")} className={inputCls}>
            {(Object.keys(CATEGORY_META) as RelationshipCategory[]).map((k) => <option key={k} value={k}>{CATEGORY_META[k].label}</option>)}
          </select>
        </Labelled>
        <Labelled label="Protective or risk?">
          <select value={f.rating} onChange={set("rating")} className={inputCls}>
            <option value="protective">Protective</option><option value="neutral">Neutral</option><option value="risk">Risk</option>
          </select>
        </Labelled>
      </div>
      <Labelled label="The child's view"><textarea value={f.child_view ?? ""} onChange={set("child_view")} rows={2} className={inputCls} /></Labelled>
      <div className="grid gap-3 sm:grid-cols-2">
        <Labelled label="Known strengths"><textarea value={f.known_strengths ?? ""} onChange={set("known_strengths")} rows={2} className={inputCls} /></Labelled>
        <Labelled label="Known concerns"><textarea value={f.known_concerns ?? ""} onChange={set("known_concerns")} rows={2} className={inputCls} /></Labelled>
        <Labelled label="Contact arrangements"><input value={f.contact_arrangements ?? ""} onChange={set("contact_arrangements")} className={inputCls} /></Labelled>
        <Labelled label="Restrictions"><input value={f.restrictions ?? ""} onChange={set("restrictions")} className={inputCls} /></Labelled>
      </div>
      <Labelled label="Review date"><input type="date" value={f.review_date ?? ""} onChange={set("review_date")} className={inputCls} /></Labelled>
      <div className="flex justify-end">
        <button onClick={submit} disabled={add.isPending} className="rounded-lg bg-[var(--cs-cara-gold,#b45309)] px-4 py-2 text-sm font-semibold text-white">{add.isPending ? "Saving…" : "Add to map"}</button>
      </div>
    </CardContent></Card>
  );
}

export default function ProtectiveRelationshipsPage() {
  const overview = useRelationshipsOverview();
  const ypQuery = useYoungPeople("current");
  const youngPeople = useMemo(() => (ypQuery.data?.data ?? []).map((yp) => ({ id: yp.id, name: yp.preferred_name || yp.first_name || "Child" })), [ypQuery.data]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const childId = selectedChildId || youngPeople[0]?.id || "";
  const child = useChildRelationships(childId);
  const [adding, setAdding] = useState(false);
  const [childFriendly, setChildFriendly] = useState(false);

  const o = overview.data;
  const status = o ? HOME_STATUS[o.homeStatus] : null;
  const entries = child.data?.entries ?? [];
  const analysis = child.data?.analysis;
  const convoy = child.data?.convoy;
  const cs = analysis ? STATUS_META[analysis.status] : null;

  const protective = entries.filter((e) => e.rating === "protective" && e.status !== "archived");
  const risk = entries.filter((e) => e.rating === "risk" && e.status !== "archived");
  const neutral = entries.filter((e) => e.rating === "neutral" && e.status !== "archived");

  return (
    <PageShell title="Protective Relationships Map" subtitle="Who keeps this child safe, who poses a risk, and where the network needs strengthening">
      <div className="space-y-6 animate-fade-in">
        {overview.isLoading && <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading maps…</div>}

        {o && status && (
          <Card><CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-[var(--cs-cara-gold,#b45309)]" />
              <h2 className="text-base font-bold text-[var(--cs-navy,#1e293b)]">Relationships across the home</h2>
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
          </CardContent></Card>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select value={childId} onChange={(e) => { setSelectedChildId(e.target.value); setAdding(false); }} className={cn(inputCls, "w-auto")}>
            {youngPeople.map((yp) => <option key={yp.id} value={yp.id}>{yp.name}</option>)}
          </select>
          {cs && <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase", cs.badge)}>{cs.label}</span>}
          <div className="inline-flex overflow-hidden rounded-lg border border-[var(--cs-border,#e2e8f0)]">
            <button onClick={() => setChildFriendly(false)} className={cn("inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium", !childFriendly ? "bg-[var(--cs-cara-gold,#b45309)] text-white" : "bg-white text-[var(--cs-text-secondary)]")}><Briefcase className="h-3.5 w-3.5" /> Professional</button>
            <button onClick={() => setChildFriendly(true)} className={cn("inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium", childFriendly ? "bg-[var(--cs-cara-gold,#b45309)] text-white" : "bg-white text-[var(--cs-text-secondary)]")}><Baby className="h-3.5 w-3.5" /> Child-friendly</button>
          </div>
          {!adding && <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 rounded-lg bg-[var(--cs-cara-gold,#b45309)] px-3 py-1.5 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Add relationship</button>}
          <PrintButton title={`Relationship Map — ${child.data?.childName ?? ""}`} />
        </div>

        {adding && <AddRelationshipForm childId={childId} onDone={() => setAdding(false)} />}

        {child.isLoading && <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading map…</div>}

        {analysis && !childFriendly && analysis.flags.length > 0 && (
          <Card><CardContent className="p-4">
            <ul className="space-y-1.5">
              {analysis.flags.map((f) => { const t = FLAG_TONE[f.severity]; const Icon = t.icon; return <li key={f.key} className={cn("flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-xs", t.cls)}><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span><span className="font-semibold">{f.message}</span> <span className="opacity-80">{f.why}</span></span></li>; })}
            </ul>
          </CardContent></Card>
        )}

        {convoy && entries.length > 0 && (
          <Card><CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--cs-cara-gold,#b45309)]" />
              <h2 className="text-base font-bold text-[var(--cs-navy,#1e293b)]">
                {childFriendly ? "My circles" : "Social convoy"}
              </h2>
              {!childFriendly && (
                <span className="text-xs text-[var(--cs-text-muted,#64748b)]">
                  who is emotionally close, who supports, who is professional
                </span>
              )}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {([
                ["inner", childFriendly ? "Closest to me" : "Inner circle", convoy.inner],
                ["middle", childFriendly ? "Important to me" : "Middle circle", convoy.middle],
                ["outer", childFriendly ? "People who help" : "Outer circle", convoy.outer],
              ] as const).map(([key, label, members]) => (
                <div key={key} className="rounded-xl border border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-surface,#fff)] p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-secondary,#475569)]">
                    {label} <span className="font-normal opacity-70">({members.length})</span>
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {members.map((m) => (
                      <li key={m.entryId} className="text-sm text-[var(--cs-text,#0f172a)]">
                        <span className="font-medium">{m.name}</span>
                        <span className="ml-1 text-xs text-[var(--cs-text-muted,#64748b)]">{m.relationship}</span>
                        {!childFriendly && m.basis === "derived" && (
                          <span className="mt-0.5 block text-[11px] text-[var(--cs-text-muted,#64748b)]" title={m.derivedBecause}>
                            derived — {m.derivedBecause}
                          </span>
                        )}
                      </li>
                    ))}
                    {members.length === 0 && <li className="text-xs text-[var(--cs-text-muted,#64748b)]">Nobody mapped here yet.</li>}
                  </ul>
                </div>
              ))}
            </div>

            {!childFriendly && convoy.detections.length > 0 && (
              <div className="mt-4 space-y-2">
                {convoy.detections.map((d) => (
                  <div
                    key={d.key}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm",
                      d.tone === "positive" ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50",
                    )}
                  >
                    <p className={cn("font-semibold", d.tone === "positive" ? "text-emerald-900" : "text-amber-900")}>{d.headline}</p>
                    <p className={cn("mt-0.5 text-xs", d.tone === "positive" ? "text-emerald-800" : "text-amber-800")}>
                      <span className="font-semibold">Why Cara is showing this:</span> {d.whyShown}
                    </p>
                    {d.suggestedQuestions.length > 0 && (
                      <ul className={cn("mt-1 list-disc pl-4 text-xs", d.tone === "positive" ? "text-emerald-800" : "text-amber-800")}>
                        {d.suggestedQuestions.map((q) => <li key={q}>{q}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!childFriendly && convoy.insufficientInformation && (
              <p className="mt-3 text-xs text-[var(--cs-text-muted,#64748b)]">
                Too little of the network is mapped to reason about its shape — that is a recording gap, not a finding about the child.
              </p>
            )}
          </CardContent></Card>
        )}

        {!child.isLoading && entries.length === 0 && childId && (
          <Card><CardContent className="p-6 text-center">
            <p className="mb-3 text-sm text-[var(--cs-text-secondary,#475569)]">{child.data?.childName ?? "This child"} has no relationships mapped yet.</p>
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cs-cara-gold,#b45309)] px-3 py-1.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Add the first relationship</button>
          </CardContent></Card>
        )}

        {entries.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-emerald-700"><ShieldCheck className="h-4 w-4" /> {childFriendly ? "People who keep me safe" : "Protective"} ({protective.length})</div>
              <div className="space-y-2">{protective.map((e) => <RelationshipCard key={e.id} e={e} childFriendly={childFriendly} />)}{protective.length === 0 && <p className="text-xs text-[var(--cs-text-muted,#64748b)]">None recorded yet.</p>}</div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-red-700"><ShieldAlert className="h-4 w-4" /> {childFriendly ? "People to be careful around" : "Risk"} ({risk.length})</div>
              <div className="space-y-2">{risk.map((e) => <RelationshipCard key={e.id} e={e} childFriendly={childFriendly} />)}{risk.length === 0 && <p className="text-xs text-[var(--cs-text-muted,#64748b)]">None recorded.</p>}</div>
              {!childFriendly && neutral.length > 0 && (
                <>
                  <div className="mb-2 mt-4 flex items-center gap-1.5 text-sm font-bold text-slate-600"><Users className="h-4 w-4" /> Neutral ({neutral.length})</div>
                  <div className="space-y-2">{neutral.map((e) => <RelationshipCard key={e.id} e={e} childFriendly={childFriendly} />)}</div>
                </>
              )}
            </div>
          </div>
        )}

        <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
          Cara maps a child's network and surfaces where the risks and protective factors are. It informs safeguarding and
          relationship work — it never replaces professional judgement.
        </p>
      </div>
    </PageShell>
  );
}
