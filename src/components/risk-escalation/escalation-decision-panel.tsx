"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Risk Escalation Decision Panel
//
// The 4-level suggest → confirm/amend/reject workflow at the point of work:
// staff record the evidence flags, Cara suggests a level (with the evidence
// lines, required actions and timeframe), and a NAMED manager decides. Nothing
// escalates until the human decision is recorded; every decision carries its
// audit trail.
//
// Progressive disclosure: a compact assess button; the suggestion and decision
// blocks appear only when there is something to decide.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ChevronDown, ChevronUp, Loader2, ShieldAlert } from "lucide-react";
import {
  useDecideEscalation,
  useEscalationDecisions,
  useSuggestEscalation,
} from "@/hooks/use-escalation-decisions";
import type { EscalationDecision, EscalationLevel } from "@/lib/risk-escalation/types";
import { cn } from "@/lib/utils";

const LEVEL_STYLES: Record<EscalationLevel, string> = {
  low_concern: "border-[var(--cs-border,#e2e8ec)] bg-[var(--cs-surface-subtle,#f5f8f9)] text-[var(--cs-text,#14202a)]",
  emerging_concern: "border-amber-200 bg-amber-50 text-amber-900",
  high_concern: "border-orange-200 bg-orange-50 text-orange-900",
  immediate_safeguarding: "border-red-200 bg-red-50 text-red-900",
};

const FLAGS: Array<{ key: string; label: string; tier: "immediate" | "high" | "emerging" }> = [
  { key: "disclosureOfAbuse", label: "Disclosure of abuse or assault", tier: "immediate" },
  { key: "immediateDanger", label: "Immediate danger", tier: "immediate" },
  { key: "seriousAssault", label: "Serious assault", tier: "immediate" },
  { key: "missingNow", label: "Missing now", tier: "immediate" },
  { key: "whereaboutsUnknown", label: "Whereabouts unknown", tier: "immediate" },
  { key: "significantHarmIndicators", label: "Significant-harm indicators", tier: "high" },
  { key: "exploitationIndicators", label: "Exploitation indicators", tier: "high" },
  { key: "persistentOrEscalating", label: "Persistent or escalating", tier: "high" },
  { key: "patternDeveloping", label: "Pattern developing", tier: "emerging" },
  { key: "riskFactorsIncreasing", label: "Risk factors increasing", tier: "emerging" },
  { key: "presentationChanges", label: "Behaviour/mood/presentation changes", tier: "emerging" },
];

function DecisionRow({ decision }: { decision: EscalationDecision }) {
  const [open, setOpen] = useState(false);
  const decide = useDecideEscalation();
  const [decisionMaker, setDecisionMaker] = useState("");
  const [agreement, setAgreement] = useState<"confirmed" | "amended" | "rejected">("confirmed");
  const [amendedLevel, setAmendedLevel] = useState<EscalationLevel>("high_concern");
  const [reason, setReason] = useState("");

  const awaiting = decision.status === "awaiting_decision";
  const level = decision.confirmedLevel ?? decision.suggestedLevel;

  return (
    <div className={cn("rounded-lg border p-3", LEVEL_STYLES[level])}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-start justify-between gap-3 text-left" aria-expanded={open}>
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {decision.childName ? `${decision.childName} — ` : ""}
            {decision.concernSummary}
          </p>
          <p className="mt-0.5 text-xs opacity-80">
            Cara suggested <b>{decision.suggestedLevel.replace(/_/g, " ")}</b>
            {decision.status === "decided"
              ? ` · ${decision.agreement} by ${decision.decisionMaker}${decision.confirmedLevel ? ` → ${decision.confirmedLevel.replace(/_/g, " ")}` : ""}`
              : " · awaiting a manager decision"}
          </p>
        </div>
        {open ? <ChevronUp className="mt-0.5 h-4 w-4 shrink-0" /> : <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-current/10 pt-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Evidence Cara used</p>
            <ul className="mt-1 space-y-0.5 text-xs">
              {decision.suggestionEvidence.map((e) => (
                <li key={e.rule}>• {e.because}</li>
              ))}
            </ul>
          </div>

          {decision.actionsTriggered.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Required actions (triggered)</p>
              <ul className="mt-1 space-y-0.5 text-xs">
                {decision.actionsTriggered.map((a) => (
                  <li key={a}>• {a}</li>
                ))}
              </ul>
            </div>
          )}

          {decision.decisionReason && (
            <p className="text-xs">
              <b>Manager's reason:</b> {decision.decisionReason}
            </p>
          )}

          {awaiting && (
            <div className="space-y-2 rounded-md bg-white/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Manager decision</p>
              <input
                value={decisionMaker}
                onChange={(e) => setDecisionMaker(e.target.value)}
                placeholder="Your name (the decision maker)"
                className="w-full rounded-md border border-[var(--cs-border,#e2e8ec)] px-2 py-1.5 text-sm"
              />
              <div className="flex flex-wrap gap-3 text-sm">
                {(["confirmed", "amended", "rejected"] as const).map((a) => (
                  <label key={a} className="flex items-center gap-1.5">
                    <input type="radio" name={`agreement-${decision.id}`} checked={agreement === a} onChange={() => setAgreement(a)} />
                    {a === "confirmed" ? "Confirm" : a === "amended" ? "Amend" : "Reject"}
                  </label>
                ))}
              </div>
              {agreement === "amended" && (
                <select
                  value={amendedLevel}
                  onChange={(e) => setAmendedLevel(e.target.value as EscalationLevel)}
                  className="w-full rounded-md border border-[var(--cs-border,#e2e8ec)] px-2 py-1.5 text-sm"
                >
                  <option value="low_concern">Low concern</option>
                  <option value="emerging_concern">Emerging concern</option>
                  <option value="high_concern">High concern</option>
                  <option value="immediate_safeguarding">Immediate safeguarding</option>
                </select>
              )}
              {agreement !== "confirmed" && (
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Your reason — required, becomes part of the audit trail"
                  rows={2}
                  className="w-full rounded-md border border-[var(--cs-border,#e2e8ec)] px-2 py-1.5 text-sm"
                />
              )}
              {decide.isError && <p className="text-xs text-red-700">{(decide.error as Error).message}</p>}
              <button
                type="button"
                disabled={decide.isPending}
                onClick={() =>
                  decide.mutate({
                    decisionId: decision.id,
                    decisionMaker,
                    agreement,
                    amendedLevel: agreement === "amended" ? amendedLevel : undefined,
                    reason: reason || undefined,
                  })
                }
                className="rounded-md bg-[var(--cs-teal,#0d9488)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {decide.isPending ? "Recording…" : "Record decision"}
              </button>
            </div>
          )}

          <p className="text-[11px] opacity-70">
            {decision.auditTrail.length} audit entries · traced to {decision.sourceRecords.map((s) => `${s.recordType}/${s.recordId}`).join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}

export function EscalationDecisionPanel({ childId, childName }: { childId?: string; childName?: string }) {
  const { data, isLoading } = useEscalationDecisions({ childId });
  const suggest = useSuggestEscalation();
  const [assessing, setAssessing] = useState(false);
  const [summary, setSummary] = useState("");
  const [sourceType, setSourceType] = useState("incidents");
  const [sourceId, setSourceId] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  const decisions = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-[var(--cs-teal,#0d9488)]" />
          Risk escalation — Cara suggests, a manager decides
        </CardTitle>
        <CardDescription>
          Four levels with required actions and timeframes. A suggestion has no effect until a named manager confirms,
          amends or rejects it — every decision is logged with its evidence and reason.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!assessing ? (
          <button
            type="button"
            onClick={() => setAssessing(true)}
            className="rounded-md border border-[var(--cs-border,#e2e8ec)] px-3 py-1.5 text-sm font-medium text-[var(--cs-text,#14202a)] hover:bg-[var(--cs-surface-subtle,#f5f8f9)]"
          >
            New escalation assessment
          </button>
        ) : (
          <div className="space-y-2 rounded-lg border border-[var(--cs-border,#e2e8ec)] p-3">
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe the concern being assessed…"
              rows={2}
              className="w-full rounded-md border border-[var(--cs-border,#e2e8ec)] px-2 py-1.5 text-sm"
            />
            <div className="grid gap-1 sm:grid-cols-2">
              {FLAGS.map((f) => (
                <label key={f.key} className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={!!flags[f.key]}
                    onChange={(e) => setFlags((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                  />
                  {f.label}
                  {f.tier === "immediate" && <AlertTriangle className="h-3 w-3 text-red-500" />}
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[var(--cs-text-muted,#6c7a83)]">This assessment grew from:</span>
              <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className="rounded-md border border-[var(--cs-border,#e2e8ec)] px-2 py-1 text-xs">
                <option value="incidents">Incident</option>
                <option value="dailyLog">Daily log</option>
                <option value="safeguardingConcerns">Safeguarding concern</option>
                <option value="missingEpisodes">Missing episode</option>
                <option value="behaviourLog">Behaviour log</option>
              </select>
              <input
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                placeholder="record id (required — traceability)"
                className="rounded-md border border-[var(--cs-border,#e2e8ec)] px-2 py-1 text-xs"
              />
            </div>
            {suggest.isError && <p className="text-xs text-red-700">{(suggest.error as Error).message}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={suggest.isPending}
                onClick={() =>
                  suggest.mutate(
                    {
                      childId,
                      childName,
                      summary,
                      ...flags,
                      sourceRecords: [{ recordType: sourceType, recordId: sourceId }],
                    },
                    { onSuccess: () => { setAssessing(false); setSummary(""); setFlags({}); setSourceId(""); } },
                  )
                }
                className="rounded-md bg-[var(--cs-teal,#0d9488)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {suggest.isPending ? "Assessing…" : "Get Cara's suggestion"}
              </button>
              <button type="button" onClick={() => setAssessing(false)} className="rounded-md px-3 py-1.5 text-sm text-[var(--cs-text-muted,#6c7a83)]">
                Cancel
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#6c7a83)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading escalation decisions…
          </p>
        ) : decisions.length === 0 ? (
          <p className="text-sm text-[var(--cs-text-muted,#6c7a83)]">
            No escalation assessments yet. Each one is traced to the record it grew from — never fabricated.
          </p>
        ) : (
          <div className="space-y-2">
            {decisions.map((d) => (
              <DecisionRow key={d.id} decision={d} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
