"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Inline Cara Heart Panel
// Surfaces the Cara Heart practice intelligence engine at the point of recording.
// Debounced analysis fires as the practitioner fills in the form — prompts,
// safeguarding flags, rubric, repair, and staff support signals appear inline
// before the record is submitted. No AI calls; deterministic.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { CaraPracticeRecord, CaraPracticeIntelligenceOutput } from "@/lib/cara-heart/types";
import {
  Heart, AlertTriangle, ChevronDown, ChevronUp, Loader2,
  ShieldAlert, MessageSquare, CheckCircle2, XCircle,
  AlertCircle, Users,
} from "lucide-react";

// ─── Inlined from the former use-cara-heart-check hook ───────────────────────
// Debounced check that POSTs to /api/v1/cara-heart as the user fills in a
// recording form. Returns live practice intelligence without a page reload.
//
// Only fires when the record has enough data (childId + description ≥ 30 chars
// + type + dateTime). Cancels in-flight requests on new input, discards stale
// responses. Deterministic — no LLM calls from the server.

const CARA_HEART_MIN_DESCRIPTION_LENGTH = 30;
const CARA_HEART_DEBOUNCE_MS = 2000;

interface CaraHeartCheckState {
  data: CaraPracticeIntelligenceOutput | null;
  isLoading: boolean;
  error: string | null;
}

function useCaraHeartCheck(
  record: CaraPracticeRecord | null,
): CaraHeartCheckState {
  const [data, setData] = useState<CaraPracticeIntelligenceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);

  const runCheck = useCallback(async (r: CaraPracticeRecord) => {
    const seq = ++seqRef.current;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/cara-heart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(r),
        signal: abortRef.current.signal,
      });
      if (seq !== seqRef.current) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData((json as { data: CaraPracticeIntelligenceOutput }).data ?? null);
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      if (seq !== seqRef.current) return;
      setError((e as Error)?.message ?? "Analysis failed");
    } finally {
      if (seq === seqRef.current) setIsLoading(false);
    }
  }, []);

  // Key the debounce off a serialization of the WHOLE record. The request POSTs
  // the entire record, but a hand-curated dep list silently omitted ~19 of its
  // fields (childVoice, weaponConcern, repairRecorded, managerConsulted, …) — so a
  // form wiring any of those to an editable input would show stale analysis until
  // some *other* tracked field changed. recordKey re-fires on ANY field change and
  // is content-stable (no re-fire when an unmemoised record keeps the same values).
  const recordKey = record ? JSON.stringify(record) : null;

  useEffect(() => {
    if (
      !record ||
      !record.childId ||
      !record.description ||
      record.description.length < CARA_HEART_MIN_DESCRIPTION_LENGTH
    ) {
      setData(null);
      setError(null);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runCheck(record), CARA_HEART_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordKey, runCheck]);

  return { data, isLoading, error };
}

interface Props {
  record: CaraPracticeRecord | null;
  className?: string;
}

export function InlineCaraHeartPanel({ record, className }: Props) {
  const { data, isLoading, error } = useCaraHeartCheck(record);
  const [expanded, setExpanded] = useState(false);

  const hasEnoughData =
    !!record?.childId && !!record?.description && record.description.length >= 30;

  if (!hasEnoughData) return null;

  if (isLoading && !data) {
    return (
      <div className={cn("rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 flex items-center gap-2 text-xs text-[var(--cs-text-muted)]", className)}>
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--cs-oversight)]" />
        <span>Cara Heart — analysing practice…</span>
      </div>
    );
  }

  if (error || !data) return null;

  return (
    <div className={cn("rounded-2xl border border-[var(--cs-oversight)]/30 bg-[var(--cs-bg)] overflow-hidden", className)}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-[var(--cs-oversight)]/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-[var(--cs-oversight)]" />
          <span className="text-xs font-bold text-[var(--cs-navy)]">Cara Heart — practice reflection</span>
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-[var(--cs-text-muted)]" />}
          <HeartToneBadge tone={data.heartCard.tone} />
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />
        )}
      </div>

      {/* Safeguarding override — always visible if triggered */}
      {data.safeguardingOverride.triggered && (
        <SafeguardingAlert override={data.safeguardingOverride} />
      )}

      {/* Collapsed summary: top 2 prompts + rubric strip */}
      {!expanded && (
        <div className="px-4 pb-4 space-y-3">
          {data.heartCard.prompts.slice(0, 2).map((p, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]">
              <MessageSquare className="h-3.5 w-3.5 text-[var(--cs-oversight)] shrink-0 mt-0.5" />
              <span>{p}</span>
            </div>
          ))}
          <QuickRubric check={data.heartCheck} />
          <button
            onClick={() => setExpanded(true)}
            className="text-[10px] text-[var(--cs-oversight)] hover:underline"
          >
            See full reflection →
          </button>
        </div>
      )}

      {/* Expanded: full content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[var(--cs-border)]">

          {/* All prompts */}
          {data.heartCard.prompts.length > 0 && (
            <div className="space-y-2 pt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-muted)]">Reflective prompts</div>
              {data.heartCard.prompts.map((p, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]">
                  <MessageSquare className="h-3.5 w-3.5 text-[var(--cs-oversight)] shrink-0 mt-0.5" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          )}

          {/* Missing information */}
          {data.heartCard.missingInformation.length > 0 && (
            <div className="rounded-xl border border-[var(--cs-warning)]/40 bg-[var(--cs-warning)]/10 p-3 space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-warning)]">Consider adding</div>
              {data.heartCard.missingInformation.map((m, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]">
                  <AlertCircle className="h-3.5 w-3.5 text-[var(--cs-warning)] shrink-0 mt-0.5" />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          )}

          {/* Heart check rubric */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-muted)] mb-2">Heart check</div>
            <FullRubric check={data.heartCheck} />
          </div>

          {/* Staff support signals */}
          {data.staffSupportSignals && data.staffSupportSignals.length > 0 && (
            <div className="rounded-xl border border-[var(--cs-info)]/30 bg-[var(--cs-info)]/10 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-info)]">
                <Users className="h-3.5 w-3.5" />
                Staff support
              </div>
              {data.staffSupportSignals.map((sig, i) => (
                <div key={i} className="space-y-1">
                  {sig.stressIndicators.map((ind, j) => (
                    <div key={j} className="text-xs text-[var(--cs-text-secondary)] flex items-start gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-[var(--cs-info)] shrink-0 mt-0.5" />
                      {ind}
                    </div>
                  ))}
                  {sig.recommendedAction.map((act, j) => (
                    <div key={j} className="text-xs font-medium text-[var(--cs-info)]">→ {act}</div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Repair plan */}
          {data.repairPlan && (
            <div className="rounded-xl border border-[var(--cs-success)]/30 bg-[var(--cs-success)]/10 p-3 space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-success)]">Repair plan</div>
              <div className="text-xs text-[var(--cs-text-secondary)]">
                Rupture: {data.repairPlan.ruptureType.replace(/_/g, " ")} —
                Suggested timing: {data.repairPlan.suggestedTiming.replace(/_/g, " ")}
              </div>
              {data.repairPlan.repairQuestions.slice(0, 2).map((q, i) => (
                <div key={i} className="text-xs text-[var(--cs-text-secondary)]">• {q}</div>
              ))}
            </div>
          )}

          {/* Suggested actions */}
          {data.heartCard.suggestedActions.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-muted)]">Suggested actions</div>
              {data.heartCard.suggestedActions.map((a, i) => (
                <div key={i} className="text-xs text-[var(--cs-text-secondary)]">• {a}</div>
              ))}
            </div>
          )}

          {/* Professional reminder */}
          <div className="rounded-xl border border-[var(--cs-border)] bg-slate-50 px-3 py-2 text-[10px] text-[var(--cs-text-muted)] leading-relaxed">
            {data.heartCard.professionalReminder}
          </div>

        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function HeartToneBadge({ tone }: { tone: string }) {
  const styles: Record<string, string> = {
    urgent: "bg-red-100 text-red-700 border-red-200",
    managerial: "bg-purple-100 text-purple-700 border-purple-200",
    reflective: "bg-blue-100 text-blue-700 border-blue-200",
    supportive: "bg-green-100 text-green-700 border-green-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide", styles[tone] ?? styles.supportive)}>
      {tone}
    </span>
  );
}

function SafeguardingAlert({ override }: { override: CaraPracticeIntelligenceOutput["safeguardingOverride"] }) {
  const isImmediate = override.urgency === "immediate";
  return (
    <div className={cn(
      "mx-4 mb-3 rounded-xl border p-3 space-y-2",
      isImmediate
        ? "border-red-200 bg-red-50"
        : "border-amber-200 bg-amber-50",
    )}>
      <div className={cn("flex items-center gap-2 text-xs font-bold", isImmediate ? "text-red-700" : "text-amber-700")}>
        <ShieldAlert className="h-4 w-4" />
        {isImmediate ? "Immediate safeguarding action required" : "Same-day safeguarding action required"}
      </div>
      {override.reason.map((r, i) => (
        <div key={i} className={cn("text-xs", isImmediate ? "text-red-700" : "text-amber-700")}>• {r}</div>
      ))}
      {override.requiredAction.map((a, i) => (
        <div key={i} className={cn("text-xs font-medium", isImmediate ? "text-red-800" : "text-amber-800")}>→ {a}</div>
      ))}
    </div>
  );
}

const RUBRIC_LABELS: Partial<Record<keyof CaraPracticeIntelligenceOutput["heartCheck"], string>> = {
  childVoiceIncluded: "Child's voice",
  relationalRepairConsidered: "Repair considered",
  staffSupportConsidered: "Staff support",
  traumaContextConsidered: "Trauma context",
  adultReflectionIncluded: "Adult reflection",
};

function QuickRubric({ check }: { check: CaraPracticeIntelligenceOutput["heartCheck"] }) {
  const keys = ["childVoiceIncluded", "relationalRepairConsidered", "staffSupportConsidered"] as const;
  return (
    <div className="flex flex-wrap gap-1.5">
      {keys.map((k) => {
        const val = check[k] as boolean;
        return (
          <span key={k} className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
            val
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-[var(--cs-warning)]/40 bg-[var(--cs-warning)]/10 text-[var(--cs-warning)]",
          )}>
            {val
              ? <CheckCircle2 className="h-3 w-3" />
              : <XCircle className="h-3 w-3" />
            }
            {RUBRIC_LABELS[k]}
          </span>
        );
      })}
    </div>
  );
}

const ALL_RUBRIC_KEYS = [
  "childDignityProtected",
  "childVoiceIncluded",
  "adultReflectionIncluded",
  "traumaContextConsidered",
  "relationalRepairConsidered",
  "rightsConsidered",
  "antiCriminalisationConsidered",
  "proportionalityConsidered",
  "staffSupportConsidered",
] as const;

const RUBRIC_FULL_LABELS: Record<string, string> = {
  childDignityProtected: "Child's dignity protected",
  childVoiceIncluded: "Child's voice included",
  adultReflectionIncluded: "Adult reflection",
  traumaContextConsidered: "Trauma context",
  relationalRepairConsidered: "Repair considered",
  rightsConsidered: "Rights considered",
  antiCriminalisationConsidered: "Anti-criminalisation",
  proportionalityConsidered: "Proportionality",
  staffSupportConsidered: "Staff support",
};

function FullRubric({ check }: { check: CaraPracticeIntelligenceOutput["heartCheck"] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
      {ALL_RUBRIC_KEYS.map((k) => {
        const val = check[k] as boolean;
        return (
          <div key={k} className={cn(
            "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px]",
            val
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-[var(--cs-warning)]/40 bg-[var(--cs-warning)]/10 text-[var(--cs-warning)]",
          )}>
            {val
              ? <CheckCircle2 className="h-3 w-3 shrink-0" />
              : <AlertTriangle className="h-3 w-3 shrink-0" />
            }
            <span>{RUBRIC_FULL_LABELS[k]}</span>
          </div>
        );
      })}
    </div>
  );
}
