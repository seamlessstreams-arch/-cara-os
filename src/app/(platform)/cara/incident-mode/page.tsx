"use client";

import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Loader2, Play, Square, Bell, BellRing, Sparkles, HeartHandshake, ShieldAlert,
  CheckCircle2, Circle, AlertTriangle, Plus, MessageCircle, FileText, Check, ArrowLeft,
} from "lucide-react";
import {
  useCaraIncidentList, useCaraIncidentSession, useStartIncident, usePatchIncident,
  useAddTimelineEntry, useGenerateDraft, useAcceptDraft, type DraftResponse,
} from "@/hooks/use-cara-incident";
import { RestorativeConversationForm } from "@/components/cara/RestorativeConversationForm";
import { PostIncidentReflectionForm } from "@/components/cara/PostIncidentReflectionForm";
import { EntryAssist } from "@/components/forms/entry-assist";

const RISK_META: Record<string, { label: string; on: string; off: string }> = {
  low: { label: "Low", on: "bg-green-600 text-white", off: "bg-green-50 text-green-700 border-green-200" },
  medium: { label: "Medium", on: "bg-amber-500 text-white", off: "bg-amber-50 text-amber-700 border-amber-200" },
  high: { label: "High", on: "bg-red-600 text-white", off: "bg-red-50 text-red-700 border-red-200" },
};

const QUICK_NOTES: { label: string; entry_type: string; text: string }[] = [
  { label: "Space offered", entry_type: "deescalation_attempt", text: "Staff offered space to regulate." },
  { label: "Reassurance given", entry_type: "deescalation_attempt", text: "Staff offered calm reassurance." },
  { label: "Demands reduced", entry_type: "staff_action", text: "Staff reduced demands." },
  { label: "Second staff supporting", entry_type: "staff_action", text: "A second staff member is supporting." },
  { label: "Other children safe", entry_type: "safety_update", text: "Other children are safe and supported." },
];

const hhmm = (iso: string) => (iso && iso.includes("T") ? iso.slice(11, 16) : iso);

function Disclaimer({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-[var(--cs-cara-gold)]/40 bg-[var(--cs-cara-gold-bg)]/50 px-4 py-3">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-cara-gold)]" />
      <p className="text-xs font-medium leading-relaxed text-[var(--cs-navy)]">{text}</p>
    </div>
  );
}

export default function CaraIncidentModePage() {
  const list = useCaraIncidentList();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bundle = useCaraIncidentSession(sessionId);

  // auto-open the active session
  useEffect(() => {
    if (!sessionId && list.data?.active) setSessionId(list.data.active.id);
  }, [list.data?.active, sessionId]);

  return (
    <PageShell
      title="Cara Incident Mode"
      subtitle="Calm, live support during an incident — co-regulation prompts, a timestamped timeline, the right workflow, and an audit-safe draft record afterwards. Cara suggests; staff decide; the manager reviews."
      caraContext={{ pageTitle: "Cara Incident Mode", sourceType: "incident" }}
    >
      <div className="mx-auto max-w-3xl space-y-4 pb-10">
        {list.isLoading && <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {!sessionId && list.data && <StartView data={list.data} onOpen={setSessionId} />}
        {sessionId && bundle.isLoading && <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
        {sessionId && bundle.data && (
          <SessionView
            sessionId={sessionId}
            bundle={bundle.data}
            onBack={() => setSessionId(null)}
          />
        )}
      </div>
    </PageShell>
  );
}

// ── Start view ─────────────────────────────────────────────────────────────────
function StartView({ data, onOpen }: { data: NonNullable<ReturnType<typeof useCaraIncidentList>["data"]>; onOpen: (id: string) => void }) {
  const start = useStartIncident();
  const [childId, setChildId] = useState("");
  const [type, setType] = useState("");
  const [risk, setRisk] = useState("medium");
  const canStart = !!childId && !!type && !start.isPending;

  return (
    <>
      <Disclaimer text={data.disclaimer} />

      <Card>
        <CardContent className="space-y-5 py-5">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">1 · Who is this about?</p>
            <div className="grid grid-cols-3 gap-2">
              {data.children.map((c) => (
                <button key={c.id} onClick={() => setChildId(c.id)}
                  className={cn("rounded-xl border-2 px-3 py-4 text-sm font-bold transition-colors", childId === c.id ? "border-[var(--cs-teal)] bg-[var(--cs-teal-bg)] text-[var(--cs-teal-strong)]" : "border-[var(--cs-border)] bg-white text-[var(--cs-navy)] hover:bg-[var(--cs-bg)]")}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">2 · What's happening?</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {data.incident_types.map((t) => (
                <button key={t.key} onClick={() => setType(t.key)}
                  className={cn("rounded-xl border-2 px-2.5 py-3 text-xs font-semibold leading-tight transition-colors", type === t.key ? "border-[var(--cs-navy)] bg-[var(--cs-navy)] text-white" : "border-[var(--cs-border)] bg-white text-[var(--cs-text)] hover:bg-[var(--cs-bg)]")}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">3 · Immediate risk right now</p>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as const).map((r) => (
                <button key={r} onClick={() => setRisk(r)}
                  className={cn("rounded-xl border px-3 py-3 text-sm font-bold transition-colors", risk === r ? RISK_META[r].on : RISK_META[r].off)}>
                  {RISK_META[r].label}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!canStart}
            onClick={() => start.mutate({ child_id: childId, incident_type: type, immediate_risk_level: risk }, { onSuccess: (s: any) => onOpen(s.id) })}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cs-navy)] px-6 py-4 text-base font-bold text-white transition-all hover:bg-[var(--cs-navy-soft)] disabled:opacity-40"
          >
            {start.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />} Start incident support
          </button>
          {start.isError && <p className="text-sm font-medium text-red-700">{(start.error as Error).message}</p>}
        </CardContent>
      </Card>

      {data.sessions.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Recent incident sessions</p>
            <div className="space-y-1.5">
              {data.sessions.slice(0, 6).map((s) => (
                <button key={s.id} onClick={() => onOpen(s.id)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--cs-bg)]">
                  <span className="min-w-0">
                    <span className="font-semibold text-[var(--cs-navy)]">{s.type_label}</span>
                    <span className="ml-2 text-[var(--cs-text-muted)]">{s.child_name} · {String(s.started_at).slice(0, 10)} {hhmm(s.started_at)}</span>
                  </span>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    s.incident_status === "active" ? "bg-red-100 text-red-700" : s.incident_status === "record_created" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                    {s.incident_status === "active" ? "Live" : s.incident_status === "record_created" ? "Record saved" : "Needs record"}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// ── Live + post-incident view ──────────────────────────────────────────────────
function SessionView({ sessionId, bundle, onBack }: { sessionId: string; bundle: NonNullable<ReturnType<typeof useCaraIncidentSession>["data"]>; onBack: () => void }) {
  const { session } = bundle;
  const patch = usePatchIncident(sessionId);
  const addEntry = useAddTimelineEntry(sessionId);
  const live = session.incident_status === "active";

  const [note, setNote] = useState("");
  const [entryType, setEntryType] = useState("observation");
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 30_000); return () => clearInterval(t); }, []);
  const elapsed = useMemo(() => {
    const end = session.ended_at ? Date.parse(session.ended_at) : Date.now();
    const mins = Math.max(0, Math.round((end - Date.parse(session.started_at)) / 60_000));
    return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }, [session.started_at, session.ended_at, bundle]);

  const submitNote = () => {
    const text = note.trim();
    if (!text) return;
    addEntry.mutate({ entry_type: entryType, raw_text: text }, { onSuccess: () => setNote("") });
  };

  return (
    <>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--cs-text-muted)] hover:text-[var(--cs-navy)]"><ArrowLeft className="h-3.5 w-3.5" /> All sessions</button>

      {/* header */}
      <Card className={cn("border-l-4", live ? "border-l-red-500" : "border-l-[var(--cs-teal)]")}>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[var(--cs-navy)]">{bundle.incident_types.find((t) => t.key === session.incident_type)?.label} — {bundle.child_name}</p>
              <p className="text-xs text-[var(--cs-text-muted)]">{live ? "Live" : "Ended"} · started {hhmm(session.started_at)} · {elapsed}{session.manager_notified ? " · manager notified" : ""}</p>
            </div>
            {live && (
              <div className="flex gap-1.5">
                {(["low", "medium", "high"] as const).map((r) => (
                  <button key={r} onClick={() => patch.mutate({ action: "set_risk", risk: r })}
                    className={cn("rounded-lg border px-2.5 py-1.5 text-xs font-bold", session.immediate_risk_level === r ? RISK_META[r].on : RISK_META[r].off)}>
                    {RISK_META[r].label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {live && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => patch.mutate({ action: "notify_manager" })} disabled={session.manager_notified}
                className={cn("flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold", session.manager_notified ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-500 text-white hover:bg-amber-600")}>
                {session.manager_notified ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />} {session.manager_notified ? "Manager notified" : "Notify manager"}
              </button>
              <button onClick={() => patch.mutate({ action: "end" })}
                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--cs-navy)] px-4 py-3 text-sm font-bold text-white hover:bg-[var(--cs-navy-soft)]">
                <Square className="h-4 w-4" /> End incident
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* co-regulation panel (live only) */}
      {live && (
        <Card className="border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)]/30">
          <CardContent className="py-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-teal-strong)]"><HeartHandshake className="h-3.5 w-3.5" /> Right now</p>
            <ul className="space-y-1.5">
              {bundle.prompts.immediate.map((p, i) => (
                <li key={i} className="text-sm font-medium text-[var(--cs-navy)]">• {p}</li>
              ))}
            </ul>
            <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-sm italic text-[var(--cs-navy)]">{bundle.prompts.suggested_phrase}</p>
            <p className="mt-2 text-[11px] text-[var(--cs-text-muted)]">{bundle.prompts.recording_reminder}</p>
          </CardContent>
        </Card>
      )}

      {/* timeline */}
      <Card>
        <CardContent className="py-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Timeline</p>
          <div className="space-y-1.5">
            {bundle.timeline.map((e) => (
              <div key={e.id} className="flex items-start gap-2.5 rounded-lg border border-[var(--cs-border)]/60 bg-white px-3 py-2 text-sm">
                <span className="shrink-0 font-mono text-xs font-bold text-[var(--cs-text-muted)]">{hhmm(String(e.timestamp))}</span>
                <span className="min-w-0">
                  <span className="mr-1.5 rounded bg-[var(--cs-bg)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--cs-text-muted)]">{bundle.entry_types.find((t) => t.key === e.entry_type)?.label ?? e.entry_type}</span>
                  <span className="text-[var(--cs-text)]">{e.raw_text}</span>
                </span>
              </div>
            ))}
            {bundle.timeline.length === 0 && <p className="py-3 text-center text-sm text-[var(--cs-text-muted)]">No entries yet — short notes are enough.</p>}
          </div>

          {live && (
            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_NOTES.map((q) => (
                  <button key={q.label} onClick={() => addEntry.mutate({ entry_type: q.entry_type, raw_text: q.text })}
                    className="rounded-full border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--cs-navy)] hover:bg-white">
                    + {q.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {bundle.entry_types.filter((t) => t.key !== "manager_notification").map((t) => (
                  <button key={t.key} onClick={() => setEntryType(t.key)}
                    className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", entryType === t.key ? "bg-[var(--cs-navy)] text-white" : "bg-[var(--cs-bg)] text-[var(--cs-text-muted)] hover:text-[var(--cs-navy)]")}>
                    {t.label}
                  </button>
                ))}
              </div>
              <EntryAssist value={note} onChange={setNote} sourceModule="cara_incident_mode" sourceField="timeline_note" childId={session.child_id} className="justify-end" />
              <div className="flex gap-2">
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Brief note — speak it or type it…"
                  className="min-h-[52px] flex-1 rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2 text-sm focus:border-[var(--cs-teal)] focus:outline-none focus:ring-1 focus:ring-[var(--cs-teal)]" />
                <button onClick={submitNote} disabled={addEntry.isPending || !note.trim()}
                  className="flex items-center gap-1.5 self-stretch rounded-xl bg-[var(--cs-teal-strong)] px-4 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40">
                  {addEntry.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* workflow checklist */}
      <Card>
        <CardContent className="py-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Workflow — {bundle.incident_types.find((t) => t.key === session.incident_type)?.label}</p>
          <div className="space-y-1">
            {bundle.checklist.map((s) => (
              <button key={s.key} onClick={() => patch.mutate({ action: "toggle_step", step: s.key })}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-[var(--cs-bg)]">
                {s.completed ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--cs-teal)]" /> : <Circle className="h-5 w-5 shrink-0 text-[var(--cs-border)]" />}
                <span className={cn("min-w-0 flex-1", s.completed ? "text-[var(--cs-text-muted)] line-through" : "text-[var(--cs-text)]")}>{s.title}</span>
                {s.regulation_related && <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-purple-700">Reg</span>}
                {s.manager_review_required && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700">Manager</span>}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* post-incident: quality gate + child voice + draft */}
      {!live && <PostIncidentPanel sessionId={sessionId} bundle={bundle} />}

      <Disclaimer text={bundle.disclaimer} />
    </>
  );
}

function PostIncidentPanel({ sessionId, bundle }: { sessionId: string; bundle: NonNullable<ReturnType<typeof useCaraIncidentSession>["data"]> }) {
  const gen = useGenerateDraft(sessionId);
  const accept = useAcceptDraft(sessionId);
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [finalText, setFinalText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const recordDone = bundle.session.final_record_created;

  const generate = () => gen.mutate(undefined, {
    onSuccess: (d) => { setDraft(d); setFinalText(d.ai_draft ?? d.deterministic_draft); },
  });

  return (
    <>
      {/* quality gate */}
      <Card>
        <CardContent className="py-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]"><ShieldAlert className="h-3.5 w-3.5" /> Before the record is saved</p>
          <div className="grid gap-1 sm:grid-cols-2">
            {bundle.gate.checks.map((c) => (
              <div key={c.key} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm">
                {c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal)]" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
                <span className={cn("min-w-0", c.ok ? "text-[var(--cs-text-muted)]" : "font-medium text-[var(--cs-text)]")}>
                  {c.label}
                  {!c.ok && c.detail && <span className="block text-xs text-[var(--cs-text-muted)]">{c.detail}</span>}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* child voice prompts */}
      <Card>
        <CardContent className="py-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]"><MessageCircle className="h-3.5 w-3.5" /> The child&rsquo;s voice</p>
          <ul className="grid gap-1 sm:grid-cols-2">
            {bundle.child_voice_prompts.map((p, i) => <li key={i} className="text-sm text-[var(--cs-text-secondary)]">• {p}</li>)}
          </ul>
          <p className="mt-2 rounded-lg bg-[var(--cs-bg)] px-3 py-2 text-xs text-[var(--cs-text-muted)]">If the child declines: {bundle.child_declined_prompts.join(" ")}</p>
        </CardContent>
      </Card>

      {/* restorative conversation + reflection (slice B) */}
      <RestorativeConversationForm sessionId={sessionId} childName={bundle.child_name} />
      <PostIncidentReflectionForm sessionId={sessionId} />

      {/* draft record */}
      <Card className="border-l-4 border-l-[var(--cs-cara-gold)]">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--cs-navy)]"><FileText className="h-4 w-4 text-[var(--cs-cara-gold)]" /> Draft incident record</p>
            {!recordDone && (
              <button onClick={generate} disabled={gen.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cs-navy)] px-3.5 py-2 text-xs font-bold text-white hover:bg-[var(--cs-navy-soft)] disabled:opacity-50">
                {gen.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} {draft ? "Regenerate draft" : "Generate draft record"}
              </button>
            )}
          </div>

          {recordDone && (
            <p className="mt-3 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm font-medium text-green-800">
              <Check className="h-4 w-4" /> Record saved — original notes, the AI suggestion and your final version are all preserved. Awaiting manager review.
            </p>
          )}

          {!recordDone && draft && (
            <div className="mt-3 space-y-3">
              {draft.llm_message && <p className="rounded-lg bg-[var(--cs-bg)] px-3 py-2 text-xs text-[var(--cs-text-muted)]">{draft.llm_message}</p>}
              {draft.ai_draft && (
                <details className="rounded-xl border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2">
                  <summary className="cursor-pointer text-xs font-bold text-[var(--cs-text-muted)]">View Cara&rsquo;s suggested rewrite (AI-assisted)</summary>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-[var(--cs-text-secondary)]">{draft.ai_draft}</pre>
                </details>
              )}
              <details className="rounded-xl border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3 py-2">
                <summary className="cursor-pointer text-xs font-bold text-[var(--cs-text-muted)]">View the factual timeline draft</summary>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-[var(--cs-text-secondary)]">{draft.deterministic_draft}</pre>
              </details>

              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Your final record — review and edit before accepting</p>
                <textarea value={finalText} onChange={(e) => setFinalText(e.target.value)} rows={12}
                  className="w-full rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2 font-mono text-xs focus:border-[var(--cs-teal)] focus:outline-none focus:ring-1 focus:ring-[var(--cs-teal)]" />
              </div>

              <label className="flex items-start gap-2.5 rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2.5 text-sm">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--cs-teal-strong)]" />
                <span className="text-[var(--cs-text)]">I confirm this record is accurate, reflects what happened, and is my own account. I understand it is AI-assisted and will go to the manager for review.</span>
              </label>

              <button
                disabled={!confirmed || !finalText.trim() || accept.isPending}
                onClick={() => accept.mutate({ final_text: finalText, ai_suggested_text: draft.ai_draft })}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cs-teal-strong)] px-6 py-3.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
              >
                {accept.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Accept &amp; save for manager review
              </button>
              {accept.isError && <p className="text-sm font-medium text-red-700">{(accept.error as Error).message}</p>}
            </div>
          )}

          {!recordDone && !draft && (
            <p className="mt-2 text-sm text-[var(--cs-text-secondary)]">Generate a draft assembled from your timeline. Cara can suggest a professional rewrite — you review, edit and confirm before anything is saved.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
