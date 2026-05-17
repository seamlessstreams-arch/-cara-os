// ══════════════════════════════════════════════════════════════════════════════
// SafeguardingEscalationPanel — Real-time escalation guidance for new concerns
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import type { ConcernCategory, ConcernSeverity, EscalationDecision } from "@/lib/safeguarding";

interface Props {
  childId?: string;
  childName?: string;
  homeId?: string;
  onConcernRaised?: (escalation: EscalationDecision) => void;
}

const CATEGORY_OPTIONS: { value: ConcernCategory; label: string; group: string }[] = [
  { value: "disclosure", label: "Child Disclosure", group: "Disclosure" },
  { value: "physical_abuse", label: "Physical Abuse", group: "Abuse" },
  { value: "emotional_abuse", label: "Emotional Abuse", group: "Abuse" },
  { value: "sexual_abuse", label: "Sexual Abuse", group: "Abuse" },
  { value: "neglect", label: "Neglect", group: "Abuse" },
  { value: "child_sexual_exploitation", label: "CSE", group: "Exploitation" },
  { value: "child_criminal_exploitation", label: "CCE / County Lines", group: "Exploitation" },
  { value: "trafficking", label: "Trafficking / Modern Slavery", group: "Exploitation" },
  { value: "online_harm", label: "Online Harm / Grooming", group: "Exploitation" },
  { value: "self_harm", label: "Self-Harm", group: "Wellbeing" },
  { value: "peer_on_peer_abuse", label: "Peer-on-Peer Abuse", group: "Wellbeing" },
  { value: "allegation_against_staff", label: "Allegation Against Staff", group: "Staff" },
  { value: "radicalisation", label: "Radicalisation / Prevent", group: "Contextual" },
  { value: "honour_based_abuse", label: "HBA / FGM / Forced Marriage", group: "Contextual" },
  { value: "contextual_safeguarding", label: "Contextual Safeguarding", group: "Contextual" },
  { value: "missing_linked", label: "Missing (Safeguarding Concern)", group: "Missing" },
  { value: "domestic_abuse", label: "Domestic Abuse (Family)", group: "Family" },
  { value: "fabricated_illness", label: "Fabricated / Induced Illness", group: "Other" },
  { value: "other", label: "Other Concern", group: "Other" },
];

const SEVERITY_OPTIONS: { value: ConcernSeverity; label: string; description: string; colour: string }[] = [
  { value: "immediate", label: "Immediate", description: "Child in danger now — requires immediate protection", colour: "border-red-500 bg-red-50 dark:bg-red-900/20" },
  { value: "high", label: "High", description: "Significant risk — external referral needed today", colour: "border-orange-500 bg-orange-50 dark:bg-orange-900/20" },
  { value: "medium", label: "Medium", description: "Concern requiring investigation and DSL consultation", colour: "border-amber-500 bg-amber-50 dark:bg-amber-900/20" },
  { value: "low", label: "Low", description: "Record and monitor — may form part of a pattern", colour: "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" },
];

const LEVEL_LABELS: Record<number, { label: string; colour: string }> = {
  1: { label: "Level 1 — Record & Monitor", colour: "bg-emerald-600" },
  2: { label: "Level 2 — DSL Consultation", colour: "bg-amber-600" },
  3: { label: "Level 3 — External Referral", colour: "bg-orange-600" },
  4: { label: "Level 4 — Strategy Discussion", colour: "bg-red-600" },
  5: { label: "Level 5 — Immediate Protection", colour: "bg-red-800" },
};

export function SafeguardingEscalationPanel({
  childId,
  childName,
  homeId,
  onConcernRaised,
}: Props) {
  const [category, setCategory] = useState<ConcernCategory | "">("");
  const [severity, setSeverity] = useState<ConcernSeverity | "">("");
  const [description, setDescription] = useState("");
  const [escalation, setEscalation] = useState<EscalationDecision | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    if (!category || !severity) return;

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/safeguarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "escalate",
          category,
          severity,
          childId,
          childName,
          homeId,
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Escalation assessment failed");
      } else {
        setEscalation(data.escalation);
        onConcernRaised?.(data.escalation);
      }
    } catch {
      setError("Network error — could not assess escalation");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border bg-red-50 dark:bg-red-900/10">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">Raise Safeguarding Concern</h3>
            <p className="text-xs text-red-600 dark:text-red-400">
              {childName ? `For ${childName}` : "Select concern type for escalation guidance"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      {!escalation && (
        <div className="p-4 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Type of Concern
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ConcernCategory)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select concern type...</option>
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Severity
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SEVERITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSeverity(opt.value)}
                  className={`p-2.5 rounded-lg border-l-4 text-left transition-all ${opt.colour} ${
                    severity === opt.value ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Description of Concern
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you have observed, heard, or been told. Include dates, times, and exact words where possible."
              className="w-full rounded-md border border-border bg-background p-2.5 text-sm resize-none"
              rows={4}
            />
          </div>

          <button
            onClick={handleEvaluate}
            disabled={!category || !severity || isProcessing}
            className="w-full py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-red-700 transition-colors"
          >
            {isProcessing ? "Assessing escalation..." : "Get Escalation Guidance"}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mb-4 p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Escalation Result */}
      {escalation && (
        <div className="p-4 space-y-4">
          {/* Level Banner */}
          <div className={`rounded-lg p-4 text-white ${LEVEL_LABELS[escalation.recommendedLevel]?.colour ?? "bg-gray-600"}`}>
            <p className="text-lg font-bold">
              {LEVEL_LABELS[escalation.recommendedLevel]?.label}
            </p>
            <p className="text-sm opacity-90 mt-1">
              Timeframe: {escalation.timeframe.replace(/_/g, " ")}
            </p>
          </div>

          {/* Notifications Required */}
          {(escalation.notifyRM || escalation.notifyOfsted || escalation.notifyPolice) && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3">
              <p className="text-xs font-semibold text-red-800 dark:text-red-300 mb-1">Must Notify</p>
              <div className="flex flex-wrap gap-2">
                {escalation.notifyRM && (
                  <span className="px-2 py-0.5 rounded bg-red-200 text-red-800 text-xs font-medium">Registered Manager</span>
                )}
                {escalation.notifyOfsted && (
                  <span className="px-2 py-0.5 rounded bg-red-200 text-red-800 text-xs font-medium">Ofsted</span>
                )}
                {escalation.notifyPolice && (
                  <span className="px-2 py-0.5 rounded bg-red-200 text-red-800 text-xs font-medium">Police</span>
                )}
              </div>
            </div>
          )}

          {/* Immediate Actions */}
          {escalation.immediateActions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">Immediate Actions Required</h4>
              <ul className="space-y-1">
                {escalation.immediateActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Referrals Required */}
          {escalation.referralsRequired.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">Referrals Required</h4>
              <div className="flex flex-wrap gap-1.5">
                {escalation.referralsRequired.map(ref => (
                  <span key={ref} className="px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium">
                    {ref.replace(/_/g, " ").toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reasons */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-1">Assessment Basis</h4>
            <ul className="space-y-0.5">
              {escalation.reasons.map((reason, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {reason}</li>
              ))}
            </ul>
          </div>

          {/* Reset */}
          <button
            onClick={() => { setEscalation(null); setCategory(""); setSeverity(""); setDescription(""); }}
            className="w-full py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Raise Another Concern
          </button>
        </div>
      )}
    </div>
  );
}
