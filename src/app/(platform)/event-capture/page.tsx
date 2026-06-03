"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EVENT CAPTURE (write path) detail page
// "Capture once, validate once, route everywhere" — the pre-submission preview.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilePlus2, Brain, Loader2, Info, CheckCircle2, XCircle, Copy, Route, Archive, AlertTriangle, Send, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEventCapture } from "@/hooks/use-event-capture";
import { useCaptureEvent } from "@/hooks/use-capture-event";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800", warning: "border-amber-200 bg-amber-50 text-amber-800", positive: "border-green-200 bg-green-50 text-green-800",
};

export default function EventCapturePage() {
  const { data, isLoading } = useEventCapture();
  const intel = data?.data;

  return (
    <PageShell
      title="Event Capture — Write Path"
      subtitle="Capture once, validate once, route everywhere — what happens to a record the moment it's submitted, previewed before it saves"
      icon={<FilePlus2 className="h-5 w-5" />}
      showQuickCreate={false}
      ariaContext={{ pageTitle: "Event Capture", sourceType: "general" }}
    >
      {isLoading || !intel ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" /></div>
      ) : (
        <div className="space-y-6">

          <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 flex gap-3">
            <Info className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
              A form is just a way to capture an event <strong>once</strong>. The moment it's submitted, the orchestrator
              validates it against fixed rules, checks it isn't a duplicate, decides which workflows it routes to and which
              evidence it builds — so one entry surfaces everywhere it's needed, nothing is re-typed, and nothing
              externally-facing fires without approval. This is that preview, shown on a representative draft.
            </p>
          </div>

          {/* The real capture-once write path — a form is a thin view over the spine. */}
          <CaptureEventForm />

          <div className={cn("rounded-2xl border p-4 flex items-center gap-3", intel.ready_to_submit ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50")}>
            {intel.ready_to_submit ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
            <div>
              <p className={cn("text-sm font-semibold", intel.ready_to_submit ? "text-green-700" : "text-amber-700")}>{intel.ready_to_submit ? "Ready to submit" : "Held for review before submission"}</p>
              {intel.blocks.length > 0 && <ul className="text-xs text-amber-800 mt-1 list-disc ml-4">{intel.blocks.map((b, i) => <li key={i}>{b}</li>)}</ul>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {/* Validation */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">{intel.validation.passed ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} Validation</CardTitle></CardHeader>
              <CardContent className="text-xs space-y-1">
                {intel.validation.issues.length === 0 && <p className="text-green-700">All mandatory fields present.</p>}
                {intel.validation.issues.map((iss, i) => (
                  <p key={i} className={cn("flex items-start gap-1", iss.severity === "error" ? "text-red-700" : "text-amber-700")}>
                    <span className="font-medium">{iss.field}:</span> {iss.message}
                  </p>
                ))}
              </CardContent>
            </Card>

            {/* Duplicates */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Copy className="h-4 w-4 text-brand" /> Duplicate check</CardTitle></CardHeader>
              <CardContent className="text-xs space-y-1">
                {!intel.duplicates.suspected && <p className="text-green-700">No existing event matches — safe to create.</p>}
                {intel.duplicates.matches.map((m, i) => (
                  <p key={i} className="text-amber-700">Matches <span className="font-mono">{m.event_id}</span> ({Math.round(m.similarity * 100)}%) — {m.reason}</p>
                ))}
              </CardContent>
            </Card>

            {/* Routing */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Route className="h-4 w-4 text-brand" /> Will route to</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {intel.routing.destinations.map((d, i) => <Badge key={i} className="text-[10px] bg-gray-50 text-gray-600 border">{d}</Badge>)}
                  {intel.routing.external_apis.map((a, i) => <Badge key={`e${i}`} className="text-[10px] bg-red-50 text-red-700 border-red-200">{a} (gated)</Badge>)}
                </div>
                {intel.routing.requires_human_approval && <p className="text-[10px] text-amber-700 mt-1.5">Requires human approval before external notifications send.</p>}
              </CardContent>
            </Card>

            {/* Evidence */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Archive className="h-4 w-4 text-brand" /> Builds evidence</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {intel.evidence_categories.map((c, i) => <Badge key={i} className="text-[10px] bg-green-50 text-green-700 border-green-200">{c}</Badge>)}
                </div>
              </CardContent>
            </Card>
          </div>

          {(intel.insights ?? []).map((i, idx) => (
            <div key={idx} className={cn("rounded-xl border p-3 text-sm leading-relaxed", INSIGHT_STYLES[i.severity] ?? INSIGHT_STYLES.positive)}>{i.text}</div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

// ── The real capture-once write path: a form is a thin view over the spine ──────

const EVENT_TYPES = ["daily_log", "keywork", "incident", "safeguarding", "medication", "education", "health", "physical_intervention"] as const;
const CHILDREN = [{ id: "yp_alex", name: "Alex" }, { id: "yp_jordan", name: "Jordan" }, { id: "yp_casey", name: "Casey" }];
const RISKS = ["low", "medium", "high", "critical"] as const;

function CaptureEventForm() {
  const capture = useCaptureEvent();
  const [eventType, setEventType] = useState<string>("daily_log");
  const [childId, setChildId] = useState<string>("yp_alex");
  const [riskLevel, setRiskLevel] = useState<string>("low");
  const [summary, setSummary] = useState<string>("");

  const outcome = capture.data?.data as any;
  const fieldCls = "w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm";

  const submit = (force = false) =>
    capture.mutate({ draft: { eventType: eventType as any, childId, riskLevel: riskLevel as any, summary }, force });

  return (
    <Card className="overflow-hidden border-brand/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand" /> Capture a new event</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[11px] text-[var(--cs-text-muted)]">Submit once. The event is validated, de-duplicated and routed, then persisted to the canonical spine — and immediately appears in the timeline and intelligence. No re-keying.</p>

        <div className="grid sm:grid-cols-3 gap-2">
          <label className="text-xs space-y-1 block"><span className="text-[var(--cs-text-muted)]">Event type</span>
            <select className={fieldCls} value={eventType} onChange={(e) => setEventType(e.target.value)}>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <label className="text-xs space-y-1 block"><span className="text-[var(--cs-text-muted)]">Child</span>
            <select className={fieldCls} value={childId} onChange={(e) => setChildId(e.target.value)}>
              {CHILDREN.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-xs space-y-1 block"><span className="text-[var(--cs-text-muted)]">Risk level</span>
            <select className={fieldCls} value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
              {RISKS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        </div>

        <label className="text-xs space-y-1 block"><span className="text-[var(--cs-text-muted)]">Summary</span>
          <textarea className={cn(fieldCls, "min-h-[72px]")} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What happened? A clear sentence or two." />
        </label>

        <div className="flex items-center gap-2">
          <button onClick={() => submit(false)} disabled={capture.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
            {capture.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Capture event
          </button>
          {capture.isError && <span className="text-xs text-red-600">{(capture.error as Error)?.message ?? "Capture failed"}</span>}
        </div>

        {outcome && <CaptureOutcomeView outcome={outcome} onForce={() => submit(true)} forcing={capture.isPending} />}
      </CardContent>
    </Card>
  );
}

function CaptureOutcomeView({ outcome, onForce, forcing }: { outcome: any; onForce: () => void; forcing: boolean }) {
  const c = outcome.capture;
  return (
    <div className="space-y-2 pt-1">
      {outcome.persisted ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800 space-y-1">
          <p className="font-semibold flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Captured once — persisted to the spine as <span className="font-mono">{outcome.event?.id}</span></p>
          <p>It now surfaces across the timeline, intelligence, evidence and duplicate/conflict checks — nothing re-typed.</p>
          <Link href="/event-stream" className="inline-flex items-center gap-1 text-brand hover:underline">See it in the event stream <ArrowRight className="h-3 w-3" /></Link>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1.5">
          <p className="font-semibold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Held — not captured</p>
          <p>{outcome.hold_reason}</p>
          {c.duplicates?.suspected && c.validation?.passed && (
            <button onClick={onForce} disabled={forcing}
              className="inline-flex items-center gap-1 rounded border border-amber-300 bg-white px-2 py-1 text-[11px] font-medium text-amber-800 disabled:opacity-60">
              {forcing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />} Capture anyway (genuinely new)
            </button>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
        <div className={cn("rounded-lg border p-2.5 flex items-center gap-2", c.validation?.passed ? "text-green-700" : "text-red-700")}>
          {c.validation?.passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {c.validation?.passed ? "Validated" : `${c.validation?.issues?.length ?? 0} validation issue(s)`}
        </div>
        <div className={cn("rounded-lg border p-2.5 flex items-center gap-2", c.duplicates?.suspected ? "text-amber-700" : "text-green-700")}>
          <Copy className="h-3.5 w-3.5" /> {c.duplicates?.suspected ? `${c.duplicates.matches.length} possible duplicate(s)` : "No duplicates"}
        </div>
        <div className="rounded-lg border p-2.5 flex items-center gap-2 text-[var(--cs-text-secondary)]">
          <Route className="h-3.5 w-3.5 text-brand" /> Routes to {c.routing?.destinations?.length ?? 0}{c.routing?.external_apis?.length ? ` (+${c.routing.external_apis.length} gated)` : ""}
        </div>
        <div className="rounded-lg border p-2.5 flex items-center gap-2 text-[var(--cs-text-secondary)]">
          <Archive className="h-3.5 w-3.5 text-brand" /> Builds {c.evidence_categories?.length ?? 0} evidence categor{(c.evidence_categories?.length ?? 0) === 1 ? "y" : "ies"}
        </div>
      </div>
    </div>
  );
}
