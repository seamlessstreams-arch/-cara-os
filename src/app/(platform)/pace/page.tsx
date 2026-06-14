"use client";

// CARA INTELLIGENCE — PACE Intelligence page.
// Playfulness · Acceptance · Curiosity · Empathy (Dr Dan Hughes / DDP).
// Check a record's PACE quality, get per-context guidance, micro-learning, and
// each child's "what works for me" profile. Cara advises; staff decide.

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DictationButton } from "@/components/common/dictation-button";
import { useYoungPeople } from "@/hooks/use-young-people";
import {
  useAnalyzePACE, usePACERecordingAssist, usePACEGuidance, usePACETraining,
  useChildPaceProfile, useUpdateChildPaceProfile,
} from "@/hooks/use-pace";
import type { PACEContext } from "@/lib/cara-intelligence/pace";
import { Heart, Sparkles, AlertTriangle, CheckCircle2, ListChecks, BookOpen, Baby, ShieldAlert, Lightbulb } from "lucide-react";

const CONTEXTS: { v: PACEContext; label: string }[] = [
  { v: "DAILY_LOG", label: "Daily log" }, { v: "INCIDENT", label: "Incident" },
  { v: "MISSING_FROM_CARE", label: "Missing from care" }, { v: "KEY_WORK", label: "Key work" },
  { v: "DEBRIEF", label: "Debrief" }, { v: "SANCTION", label: "Sanction / consequence" },
  { v: "PHYSICAL_INTERVENTION", label: "Physical intervention" }, { v: "COMPLAINT", label: "Complaint" },
  { v: "ROOM_SEARCH", label: "Room search" }, { v: "FAMILY_CONTACT", label: "Family contact" },
  { v: "EDUCATION", label: "Education" }, { v: "HEALTH", label: "Health" },
  { v: "SESSION_PLAN", label: "Session plan" }, { v: "STAFF_SUPERVISION", label: "Staff supervision" },
];

function scoreColor(n: number): string {
  return n >= 80 ? "text-[var(--cs-success)]" : n >= 60 ? "text-[var(--cs-teal)]" : n >= 40 ? "text-[var(--cs-warning)]" : "text-[var(--cs-risk)]";
}
const SEV: Record<string, string> = {
  critical: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]", high: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",
  medium: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]", low: "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]",
};

function List({ items, icon }: { items: string[]; icon?: React.ReactNode }) {
  return (
    <ul className="space-y-1">
      {items.map((t, i) => <li key={i} className="flex items-start gap-1.5 text-sm text-[var(--cs-text-secondary)]">{icon ?? <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--cs-text-gentle)]" />}<span>{t}</span></li>)}
    </ul>
  );
}

// ── Tab: Check a record ───────────────────────────────────────────────────────
function CheckTab() {
  const [context, setContext] = useState<PACEContext>("DAILY_LOG");
  const [text, setText] = useState("");
  const analyze = useAnalyzePACE();
  const assist = usePACERecordingAssist();
  const a = analyze.data?.data;
  const rec = assist.data?.data;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 pt-5">
          <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
            <div>
              <Label className="text-xs">Context</Label>
              <Select value={context} onValueChange={(v) => setContext(v as PACEContext)}>
                <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{CONTEXTS.map((c) => <SelectItem key={c.v} value={c.v}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between"><Label className="text-xs">Record / response text</Label><DictationButton mode="append" size="sm" onTranscript={(t) => setText((p) => (p.trim() ? `${p}\n${t}` : t))} /></div>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Paste the daily log, incident note or debrief. Cara recognises PACE, scores quality and suggests improvements — it never invents events." className="mt-1 text-sm" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => { assist.reset(); analyze.mutate({ text, context }); }} disabled={text.trim().length < 5 || analyze.isPending} className="gap-1.5"><Sparkles className="h-4 w-4" />{analyze.isPending ? "Analysing…" : "Analyse PACE"}</Button>
            <Button variant="outline" size="sm" onClick={() => { analyze.reset(); assist.mutate({ text, context }); }} disabled={text.trim().length < 5 || assist.isPending} className="gap-1.5"><ListChecks className="h-4 w-4" />{assist.isPending ? "…" : "Recording help"}</Button>
          </div>
        </CardContent>
      </Card>

      {a && (
        <CardErrorBoundary>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">PACE quality</CardTitle>
              <span className={`text-3xl font-extrabold tabular-nums ${scoreColor(a.score.overall)}`}>{a.score.overall}<span className="text-sm font-medium text-[var(--cs-text-muted)]">/100</span></span>
            </CardHeader>
            <CardContent className="space-y-4">
              {a.managerReviewRequired && <p className="flex items-center gap-2 rounded-lg bg-[var(--cs-warning-bg)] px-3 py-2 text-xs font-semibold text-[var(--cs-warning)]"><AlertTriangle className="h-4 w-4" /> Needs manager review / reflective supervision</p>}
              {a.professionalJudgementRequired && <p className="flex items-center gap-2 rounded-lg bg-[var(--cs-risk-bg)] px-3 py-2 text-xs font-semibold text-[var(--cs-risk)]"><ShieldAlert className="h-4 w-4" /> Risk present — professional judgement required</p>}
              <p className="text-sm text-[var(--cs-text-secondary)]">{a.summary}</p>

              {/* Element evidence */}
              <div className="flex flex-wrap gap-1.5">
                {a.elements.map((e) => <span key={e.element} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${e.present ? "bg-[var(--cs-success-bg)] text-[var(--cs-success)]" : "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]"}`}>{e.present ? "✓" : "—"} {e.element.toLowerCase()}</span>)}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${a.connectBeforeCorrect ? "bg-[var(--cs-success-bg)] text-[var(--cs-success)]" : "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]"}`}>{a.connectBeforeCorrect ? "✓" : "—"} connect-before-correct</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${a.childVoicePresent ? "bg-[var(--cs-success-bg)] text-[var(--cs-success)]" : "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]"}`}>{a.childVoicePresent ? "✓" : "—"} child's voice</span>
              </div>

              {/* Dimensions */}
              <div className="grid gap-1.5 sm:grid-cols-2">
                {a.score.dimensions.map((d) => (
                  <div key={d.key} className="flex items-center gap-2">
                    <span className="w-40 shrink-0 text-[11px] text-[var(--cs-text-muted)]">{d.label}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-[var(--cs-surface)]"><div className={`h-1.5 rounded-full ${d.score >= 60 ? "bg-[var(--cs-teal)]" : d.score >= 40 ? "bg-[var(--cs-warning)]" : "bg-[var(--cs-risk)]"}`} style={{ width: `${d.score}%` }} /></div>
                    <span className="w-7 shrink-0 text-right text-[10px] tabular-nums text-[var(--cs-text-gentle)]">{d.score}</span>
                  </div>
                ))}
              </div>

              {a.flags.length > 0 && (
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Flags</p>
                  <div className="space-y-1.5">
                    {a.flags.map((f, i) => (
                      <div key={i} className="rounded-lg border border-[var(--cs-border-subtle)] p-2">
                        <div className="flex items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${SEV[f.severity]}`}>{f.severity}</span><span className="text-xs font-semibold text-[var(--cs-navy)]">{f.title}</span></div>
                        <p className="mt-0.5 text-[11px] text-[var(--cs-text-secondary)]">{f.recommendedAction}</p>
                        {f.evidence.length > 0 && <p className="mt-0.5 text-[10px] italic text-[var(--cs-text-gentle)]">Evidence: {f.evidence.join("; ")}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {a.prompts.length > 0 && (
                <div><p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Reflective prompts</p><List items={a.prompts.map((p) => p.prompt)} icon={<Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-[var(--cs-cara-gold)]" />} /></div>
              )}
              <p className="border-t border-[var(--cs-border-subtle)] pt-2 text-[11px] text-[var(--cs-text-gentle)]">{a.disclaimer}</p>
            </CardContent>
          </Card>
        </CardErrorBoundary>
      )}

      {rec && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Recording help</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {rec.managerNotificationRequired && <p className="text-xs font-semibold text-[var(--cs-warning)]">Manager notification required.</p>}
            {rec.improvements.length === 0 ? <p className="text-sm text-[var(--cs-text-muted)]">No suggestions — this reads well.</p> : (
              <div className="space-y-1.5">
                {rec.improvements.map((im, i) => (
                  <div key={i} className="rounded-lg bg-[var(--cs-surface)] p-2">
                    <p className="text-[11px] font-semibold text-[var(--cs-navy)]">{im.label}</p>
                    <p className="text-xs text-[var(--cs-text-secondary)]">{im.suggestion}</p>
                  </div>
                ))}
              </div>
            )}
            <details className="text-xs"><summary className="cursor-pointer font-semibold text-[var(--cs-teal)]">Draft skeleton (your text + prompts to fill)</summary><pre className="mt-1 whitespace-pre-wrap rounded-lg bg-[var(--cs-surface)] p-2 text-[11px] text-[var(--cs-text-secondary)]">{rec.draftSkeleton}</pre></details>
            <p className="text-[11px] text-[var(--cs-text-gentle)]">{rec.disclaimer}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Tab: Guidance ─────────────────────────────────────────────────────────────
function GuidanceTab() {
  const [context, setContext] = useState<PACEContext>("INCIDENT");
  const { data } = usePACEGuidance(context);
  const g = data?.data;
  const Section = ({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) => (
    <div><p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">{icon}{title}</p><List items={items} /></div>
  );
  return (
    <div className="space-y-4">
      <div className="max-w-xs"><Label className="text-xs">Context</Label>
        <Select value={context} onValueChange={(v) => setContext(v as PACEContext)}><SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger><SelectContent>{CONTEXTS.map((c) => <SelectItem key={c.v} value={c.v}>{c.label}</SelectItem>)}</SelectContent></Select>
      </div>
      {g && (
        <Card><CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          <Section title="What may be underneath" items={g.whatMayBeUnderneath} icon={<Lightbulb className="h-3.5 w-3.5" />} />
          <Section title="How to respond" items={g.howToRespond} icon={<Heart className="h-3.5 w-3.5" />} />
          <Section title="What to say" items={g.whatToSay} icon={<CheckCircle2 className="h-3.5 w-3.5 text-[var(--cs-success)]" />} />
          <Section title="What not to say" items={g.whatNotToSay} icon={<AlertTriangle className="h-3.5 w-3.5 text-[var(--cs-risk)]" />} />
          <Section title="Hold the boundary safely" items={g.holdBoundarySafely} icon={<ShieldAlert className="h-3.5 w-3.5" />} />
          <Section title="How to record" items={g.howToRecord} icon={<ListChecks className="h-3.5 w-3.5" />} />
          <Section title="Manager should check" items={g.managerShouldCheck} icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
          <Section title="When to escalate" items={g.whenToEscalate} icon={<ShieldAlert className="h-3.5 w-3.5 text-[var(--cs-risk)]" />} />
          <p className="sm:col-span-2 border-t border-[var(--cs-border-subtle)] pt-2 text-[11px] text-[var(--cs-text-gentle)]">{g.disclaimer}</p>
        </CardContent></Card>
      )}
    </div>
  );
}

// ── Tab: Training ─────────────────────────────────────────────────────────────
function TrainingTab() {
  const { data } = usePACETraining();
  const mods = data?.data.modules ?? [];
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {mods.map((m) => (
        <Card key={m.id}>
          <CardHeader><CardTitle className="text-sm">{m.title}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-xs text-[var(--cs-text-secondary)]">
            <p>{m.explanation}</p>
            <p><span className="font-semibold text-[var(--cs-navy)]">Scenario:</span> {m.scenario}</p>
            <p className="rounded bg-[var(--cs-success-bg)] p-1.5 text-[var(--cs-success)]"><span className="font-semibold">Good:</span> {m.goodResponse}</p>
            <p className="rounded bg-[var(--cs-risk-bg)] p-1.5 text-[var(--cs-risk)]"><span className="font-semibold">Poor:</span> {m.poorResponse}</p>
            <p><span className="font-semibold text-[var(--cs-navy)]">Reflect:</span> {m.reflectionQuestion}</p>
            <p className="text-[var(--cs-text-gentle)]"><span className="font-semibold">Manager discussion:</span> {m.managerDiscussionPrompt}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Tab: Child profile ────────────────────────────────────────────────────────
const PROFILE_FIELDS: { key: keyof EditState; label: string }[] = [
  { key: "knownTriggers", label: "Known triggers" }, { key: "calmingApproaches", label: "Calming approaches" },
  { key: "trustedAdults", label: "Trusted adults" }, { key: "phrasesThatHelp", label: "Phrases that help" },
  { key: "phrasesThatEscalate", label: "Phrases that escalate" }, { key: "sensoryNeeds", label: "Sensory needs" },
  { key: "repairApproaches", label: "Repair approaches" }, { key: "traumaInformedStrategies", label: "Trauma-informed strategies" },
  { key: "riskLinkedEscalationRules", label: "Risk-linked escalation rules" },
];
interface EditState {
  knownTriggers: string; calmingApproaches: string; trustedAdults: string; phrasesThatHelp: string;
  phrasesThatEscalate: string; sensoryNeeds: string; repairApproaches: string; traumaInformedStrategies: string;
  riskLinkedEscalationRules: string; preferredDebriefStyle: string;
}
function ChildTab() {
  const { data: ypResp } = useYoungPeople();
  const children = ypResp?.data ?? [];
  const [childId, setChildId] = useState<string>("");
  const { data: profResp } = useChildPaceProfile(childId || null);
  const update = useUpdateChildPaceProfile();
  const profile = profResp?.data.profile;
  const [edit, setEdit] = useState<EditState | null>(null);

  const startEdit = () => setEdit({
    knownTriggers: (profile?.knownTriggers ?? []).join("\n"), calmingApproaches: (profile?.calmingApproaches ?? []).join("\n"),
    trustedAdults: (profile?.trustedAdults ?? []).join("\n"), phrasesThatHelp: (profile?.phrasesThatHelp ?? []).join("\n"),
    phrasesThatEscalate: (profile?.phrasesThatEscalate ?? []).join("\n"), sensoryNeeds: (profile?.sensoryNeeds ?? []).join("\n"),
    repairApproaches: (profile?.repairApproaches ?? []).join("\n"), traumaInformedStrategies: (profile?.traumaInformedStrategies ?? []).join("\n"),
    riskLinkedEscalationRules: (profile?.riskLinkedEscalationRules ?? []).join("\n"), preferredDebriefStyle: profile?.preferredDebriefStyle ?? "",
  });
  const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
  const save = () => {
    if (!edit || !childId) return;
    update.mutate({
      childId, knownTriggers: lines(edit.knownTriggers), calmingApproaches: lines(edit.calmingApproaches),
      trustedAdults: lines(edit.trustedAdults), phrasesThatHelp: lines(edit.phrasesThatHelp), phrasesThatEscalate: lines(edit.phrasesThatEscalate),
      sensoryNeeds: lines(edit.sensoryNeeds), repairApproaches: lines(edit.repairApproaches), traumaInformedStrategies: lines(edit.traumaInformedStrategies),
      riskLinkedEscalationRules: lines(edit.riskLinkedEscalationRules), preferredDebriefStyle: edit.preferredDebriefStyle || null,
    }, { onSuccess: () => setEdit(null) });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="max-w-xs flex-1"><Label className="text-xs">Child</Label>
          <Select value={childId} onValueChange={(v) => { setChildId(v); setEdit(null); }}>
            <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Choose a child…" /></SelectTrigger>
            <SelectContent>{children.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.preferred_name || c.first_name || c.id}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {childId && !edit && <Button size="sm" variant="outline" onClick={startEdit}>{profile ? "Edit" : "Create profile"}</Button>}
      </div>

      {childId && !edit && (
        <Card><CardContent className="space-y-3 pt-5">
          {!profile ? <p className="text-sm text-[var(--cs-text-muted)]">No PACE profile yet for this child. Use Create profile to capture what works.</p> : (
            <>
              {PROFILE_FIELDS.map((f) => {
                const vals = (profile as any)[f.key] as string[] | undefined;
                return vals && vals.length ? <div key={f.key as string}><p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">{f.label}</p><List items={vals} /></div> : null;
              })}
              {profile.preferredDebriefStyle && <div><p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Preferred debrief style</p><p className="text-sm text-[var(--cs-text-secondary)]">{profile.preferredDebriefStyle}</p></div>}
              <p className="text-[11px] text-[var(--cs-text-gentle)]">Updated by {profile.updatedBy} · {new Date(profile.updatedAt).toLocaleDateString("en-GB")}</p>
            </>
          )}
        </CardContent></Card>
      )}

      {edit && (
        <Card><CardContent className="space-y-3 pt-5">
          {PROFILE_FIELDS.map((f) => (
            <div key={f.key as string}><Label className="text-xs">{f.label} <span className="text-[var(--cs-text-gentle)]">(one per line)</span></Label>
              <Textarea value={edit[f.key]} onChange={(e) => setEdit({ ...edit, [f.key]: e.target.value })} rows={2} className="mt-1 text-sm" /></div>
          ))}
          <div><Label className="text-xs">Preferred debrief style</Label><Input value={edit.preferredDebriefStyle} onChange={(e) => setEdit({ ...edit, preferredDebriefStyle: e.target.value })} className="mt-1 h-9" /></div>
          <div className="flex items-center gap-2"><Button onClick={save} disabled={update.isPending}>{update.isPending ? "Saving…" : "Save profile"}</Button><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button></div>
        </CardContent></Card>
      )}
    </div>
  );
}

export default function PACEPage() {
  return (
    <PageShell title="PACE Intelligence" subtitle="Playfulness · Acceptance · Curiosity · Empathy — trauma-informed practice (Dr Dan Hughes / DDP). Cara advises; you decide." showQuickCreate={false}>
      <Tabs defaultValue="check">
        <TabsList>
          <TabsTrigger value="check"><Sparkles className="mr-1.5 h-4 w-4" />Check a record</TabsTrigger>
          <TabsTrigger value="guidance"><Heart className="mr-1.5 h-4 w-4" />Guidance</TabsTrigger>
          <TabsTrigger value="training"><BookOpen className="mr-1.5 h-4 w-4" />Training</TabsTrigger>
          <TabsTrigger value="child"><Baby className="mr-1.5 h-4 w-4" />Child profile</TabsTrigger>
        </TabsList>
        <TabsContent value="check" className="mt-4"><CheckTab /></TabsContent>
        <TabsContent value="guidance" className="mt-4"><GuidanceTab /></TabsContent>
        <TabsContent value="training" className="mt-4"><TrainingTab /></TabsContent>
        <TabsContent value="child" className="mt-4"><ChildTab /></TabsContent>
      </Tabs>
    </PageShell>
  );
}
