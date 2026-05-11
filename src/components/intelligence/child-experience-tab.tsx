"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD EXPERIENCE TAB
// Full intelligence view for one child: scores, patterns, interventions,
// practice bank, voice records, and trusted adult map.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useChildExperienceLatest,
  usePatternAlerts,
  useInterventions,
  usePracticeBank,
  useVoiceRecords,
  useRelationalRecords,
  useCreateChildExperienceSnapshot,
  useUpdatePracticeBankEntry,
} from "@/hooks/use-intelligence";
import { cn, formatDate } from "@/lib/utils";
import {
  Shield, Heart, Brain, Zap, Users, Mic, Activity, GraduationCap,
  Layers, Trophy, TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle2, XCircle, MessageSquareQuote, Star,
  BookOpen, Wrench, Languages, Compass, RefreshCw, Sparkles,
  ChevronRight, Copy, RotateCcw, Loader2, Cpu, ToggleLeft, ToggleRight,
} from "lucide-react";
import type {
  ChildExperienceSnapshot, PatternAlert, Intervention, PracticeBankEntry,
  VoiceRecord, RelationalRecord,
} from "@/types/extended";
import { VoiceCaptureModal } from "@/components/intelligence/voice-capture-modal";
import { InterventionAddModal } from "@/components/intelligence/intervention-add-modal";
import { InterventionUpdateModal } from "@/components/intelligence/intervention-update-modal";
import { PracticeBankAddModal } from "@/components/intelligence/practice-bank-add-modal";
import { RelationalRecordAddModal } from "@/components/intelligence/relational-record-add-modal";
import { DictationButton } from "@/components/common/dictation-button";

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-[var(--cs-surface)]", className)} />;
}

function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Score colour helpers ───────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score < 40) return "text-red-600";
  if (score < 60) return "text-amber-600";
  if (score < 80) return "text-teal-600";
  return "text-emerald-600";
}

function scoreBarColor(score: number): string {
  if (score < 40) return "bg-red-500";
  if (score < 60) return "bg-amber-500";
  if (score < 80) return "bg-teal-500";
  return "bg-emerald-500";
}

function scoreBg(score: number): string {
  if (score < 40) return "bg-red-50";
  if (score < 60) return "bg-amber-50";
  if (score < 80) return "bg-teal-50";
  return "bg-emerald-50";
}

// ── Delta arrow ───────────────────────────────────────────────────────────────

function DeltaArrow({ delta }: { delta: number | null }) {
  if (delta === null || delta === 0) {
    return <Minus className="h-3 w-3 text-[var(--cs-text-muted)]" />;
  }
  if (delta > 0) {
    return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  }
  return <TrendingDown className="h-3 w-3 text-red-500" />;
}

// ── Score indicators config ───────────────────────────────────────────────────

const SCORE_INDICATORS: {
  key: keyof ChildExperienceSnapshot;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "safety_score",        label: "Safety",        icon: Shield },
  { key: "belonging_score",     label: "Belonging",     icon: Heart },
  { key: "regulation_score",    label: "Regulation",    icon: Brain },
  { key: "engagement_score",    label: "Engagement",    icon: Zap },
  { key: "relationships_score", label: "Relationships", icon: Users },
  { key: "participation_score", label: "Participation", icon: Mic },
  { key: "health_score",        label: "Health",        icon: Activity },
  { key: "education_score",     label: "Education",     icon: GraduationCap },
  { key: "stability_score",     label: "Stability",     icon: Layers },
  { key: "achievement_score",   label: "Achievement",   icon: Trophy },
];

// ── Severity badge ────────────────────────────────────────────────────────────

const SEV_CLASSES: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high:     "bg-orange-100 text-orange-800",
  medium:   "bg-amber-100 text-amber-800",
  low:      "bg-[var(--cs-surface)] text-[var(--cs-text-secondary)]",
};

// ── Intervention status badge ─────────────────────────────────────────────────

const INT_STATUS_CLASSES: Record<string, string> = {
  active:       "bg-emerald-100 text-emerald-800",
  paused:       "bg-amber-100 text-amber-800",
  completed:    "bg-blue-100 text-blue-800",
  stopped:      "bg-[var(--cs-surface)] text-[var(--cs-text-secondary)]",
  under_review: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-navy)]",
};

const INT_OUTCOME_CLASSES: Record<string, string> = {
  working:           "bg-emerald-100 text-emerald-800",
  not_working:       "bg-red-100 text-red-800",
  partially_working: "bg-amber-100 text-amber-800",
  too_early:         "bg-[var(--cs-surface)] text-[var(--cs-text-secondary)]",
  unknown:           "",
};

// ── Practice bank category labels ─────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  what_works:  { label: "What Works",     icon: CheckCircle2 },
  what_to_avoid: { label: "What to Avoid", icon: XCircle },
  language:    { label: "Language",       icon: Languages },
  preparation: { label: "Preparation",    icon: Compass },
  repair:      { label: "Repair",         icon: RefreshCw },
  regulation:  { label: "Regulation",     icon: Brain },
  engagement:  { label: "Engagement",     icon: Zap },
  education:   { label: "Education",      icon: GraduationCap },
  general:     { label: "General",        icon: BookOpen },
};

// ── Voice theme label ─────────────────────────────────────────────────────────

function voiceThemeLabel(theme: string): string {
  return theme.charAt(0).toUpperCase() + theme.slice(1).replace("_", " ");
}

// ── Experience Scores Panel ───────────────────────────────────────────────────

function ExperienceScoresPanel({ childId }: { childId: string }) {
  const { data, isLoading, isError } = useChildExperienceLatest(childId);
  const snapshot = data?.data ?? null;

  // Supporting data used to build ARIA context
  const { data: alertsData }        = usePatternAlerts({ childId });
  const { data: interventionsData } = useInterventions(childId);
  const { data: voiceData }         = useVoiceRecords(childId);
  const { data: practiceData }      = usePracticeBank(childId);

  const createSnapshot = useCreateChildExperienceSnapshot();
  const [computeState, setComputeState] = useState<"idle" | "computing" | "success" | "error">("idle");
  const [computeError, setComputeError] = useState<string | null>(null);

  async function handleComputeSnapshot() {
    setComputeState("computing");
    setComputeError(null);

    try {
      // Build rich child context from all available intelligence data
      const alerts       = alertsData?.data ?? [];
      const interventions = interventionsData?.data ?? [];
      const voices       = voiceData?.data ?? [];
      const practices    = practiceData?.data ?? [];

      const lines: string[] = [
        `## Child Intelligence Context`,
        `Child ID: ${childId}`,
        `Context generated: ${new Date().toISOString()}`,
        "",
      ];

      if (snapshot) {
        lines.push(`## Previous Snapshot (${formatDate(snapshot.period_start)} – ${formatDate(snapshot.period_end)})`);
        lines.push(`Overall score: ${snapshot.overall_score}`);
        lines.push(`Trend: ${snapshot.trend ?? "unknown"}`);
        if (snapshot.narrative) lines.push(`Narrative: ${snapshot.narrative}`);
        lines.push("");
      }

      if (alerts.length > 0) {
        lines.push("## Active Pattern Alerts");
        alerts.forEach((a) => {
          lines.push(`- [${a.severity.toUpperCase()}] ${a.title}: ${a.description}`);
          if (a.reflective_prompt) lines.push(`  Prompt: ${a.reflective_prompt}`);
        });
        lines.push("");
      }

      if (interventions.length > 0) {
        lines.push("## Current Interventions");
        interventions.forEach((i) => {
          lines.push(`- ${i.title} (status: ${i.status}, outcome: ${i.outcome ?? "unknown"})`);
          if (i.description) lines.push(`  ${i.description}`);
        });
        lines.push("");
      }

      if (voices.length > 0) {
        lines.push("## Recent Voice Records (child's own words)");
        voices.slice(0, 6).forEach((v) => {
          lines.push(`- [${v.capture_method}] Theme: ${v.theme ?? "unspecified"}`);
          const quote = v.direct_quote ?? v.paraphrase;
          if (quote) lines.push(`  "${quote}"`);
          lines.push(`  Voice heeded: ${v.voice_heeded ? "Yes" : "No"} | Date: ${formatDate(v.recorded_at)}`);
        });
        lines.push("");
      }

      if (practices.length > 0) {
        lines.push("## Practice Bank (what works for this child)");
        practices.slice(0, 8).forEach((p) => {
          lines.push(`- [${p.category}] ${p.title}: ${p.description}`);
          if (p.evidence) lines.push(`  Evidence: ${p.evidence}`);
        });
        lines.push("");
      }

      const childContext = lines.join("\n");

      // Call ARIA in compute_experience_snapshot mode (non-streaming JSON mode)
      const res = await fetch("/api/v1/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "compute_experience_snapshot",
          stream: false,
          source_content: childContext,
          prompt: `Analyse all available intelligence data for child ${childId} and compute their current experience scores.`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `ARIA returned ${res.status}`);
      }

      const json = await res.json();
      const parsed = json?.data?.parsed;

      if (!parsed || typeof parsed !== "object") {
        throw new Error("ARIA did not return a valid JSON snapshot");
      }

      // Build period dates: last 30 days
      const now        = new Date();
      const periodEnd  = now.toISOString();
      const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      await createSnapshot.mutateAsync({
        child_id:              childId,
        home_id:               "home_oak",
        period_start:          periodStart,
        period_end:            periodEnd,
        safety_score:          Number(parsed.safety_score        ?? 50),
        belonging_score:       Number(parsed.belonging_score     ?? 50),
        regulation_score:      Number(parsed.regulation_score    ?? 50),
        engagement_score:      Number(parsed.engagement_score    ?? 50),
        relationships_score:   Number(parsed.relationships_score ?? 50),
        participation_score:   Number(parsed.participation_score ?? 50),
        health_score:          Number(parsed.health_score        ?? 50),
        education_score:       Number(parsed.education_score     ?? 50),
        stability_score:       Number(parsed.stability_score     ?? 50),
        achievement_score:     Number(parsed.achievement_score   ?? 50),
        overall_score:         Number(parsed.overall_score       ?? 50),
        narrative:             parsed.narrative ?? "ARIA analysis complete.",
        trend:                 parsed.trend ?? "stable",
        strengths:             Array.isArray(parsed.strengths) ? parsed.strengths : [],
        concerns:              Array.isArray(parsed.concerns)  ? parsed.concerns  : [],
        computed_by:           "aria",
      });

      setComputeState("success");
      setTimeout(() => setComputeState("idle"), 2500);
    } catch (err: unknown) {
      console.error("[ExperienceScoresPanel] compute snapshot error:", err);
      setComputeError(err instanceof Error ? err.message : "Unknown error");
      setComputeState("error");
      setTimeout(() => setComputeState("idle"), 4000);
    }
  }

  if (isLoading) return <PanelSkeleton rows={5} />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)]" />
            Experience Scores
          </CardTitle>

          <div className="flex items-center gap-3">
            {snapshot && (
              <div className="flex items-center gap-2">
                <span className={cn("text-2xl font-bold tabular-nums", scoreColor(snapshot.overall_score))}>
                  {snapshot.overall_score}
                </span>
                <div className="flex items-center gap-0.5">
                  <DeltaArrow delta={snapshot.score_delta} />
                  {snapshot.score_delta !== null && snapshot.score_delta !== 0 && (
                    <span className={cn("text-[10px] font-semibold tabular-nums", snapshot.score_delta > 0 ? "text-emerald-600" : "text-red-600")}>
                      {snapshot.score_delta > 0 ? "+" : ""}{snapshot.score_delta}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[var(--cs-text-muted)]">overall</span>
              </div>
            )}

            {/* Compute New Snapshot button */}
            <Button
              size="sm"
              variant={computeState === "success" ? "outline" : "default"}
              className={cn(
                "h-7 text-xs gap-1.5 shrink-0",
                computeState === "success"
                  ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                  : computeState === "error"
                  ? "border-red-300 text-red-700 bg-red-50"
                  : "bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white"
              )}
              onClick={handleComputeSnapshot}
              disabled={computeState === "computing"}
            >
              {computeState === "computing" && <Loader2 className="h-3 w-3 animate-spin" />}
              {computeState === "success"   && <CheckCircle2 className="h-3 w-3" />}
              {computeState === "error"     && <AlertTriangle className="h-3 w-3" />}
              {computeState === "idle"      && <Cpu className="h-3 w-3" />}
              {computeState === "computing" ? "Computing…"
               : computeState === "success" ? "Updated!"
               : computeState === "error"   ? "Error"
               : "Compute Snapshot"}
            </Button>
          </div>
        </div>

        {computeState === "error" && computeError && (
          <p className="text-[10px] text-red-600 mt-1">{computeError}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {!snapshot && !isError ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Cpu className="h-10 w-10 text-[var(--cs-text-gentle)]" />
            <p className="text-xs text-[var(--cs-text-muted)] italic">No experience snapshot yet</p>
            <p className="text-[10px] text-[var(--cs-text-muted)]">
              Click <strong>Compute Snapshot</strong> to have ARIA analyse all available data for this child.
            </p>
          </div>
        ) : isError ? (
          <p className="text-xs text-red-500 italic py-4 text-center">Failed to load scores</p>
        ) : snapshot ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {SCORE_INDICATORS.map(({ key, label, icon: Icon }) => {
                const score = snapshot[key] as number;
                return (
                  <div key={key} className={cn("rounded-xl p-3 space-y-2", scoreBg(score))}>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <Icon className={cn("h-3.5 w-3.5 shrink-0", scoreColor(score))} />
                        <span className="text-[11px] font-semibold text-[var(--cs-text-secondary)]">{label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={cn("text-sm font-bold tabular-nums", scoreColor(score))}>{score}</span>
                        <DeltaArrow delta={snapshot.score_delta} />
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/60">
                      <div
                        className={cn("h-1.5 rounded-full transition-all", scoreBarColor(score))}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {snapshot.narrative && (
              <div className="rounded-xl border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)] p-3">
                <div className="text-[10px] font-semibold text-[var(--cs-aria-gold)] uppercase tracking-wider mb-1">
                  ARIA Narrative
                </div>
                <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{snapshot.narrative}</p>
              </div>
            )}

            {/* Strengths & Concerns */}
            {((snapshot.strengths ?? []).length > 0 || (snapshot.concerns ?? []).length > 0) && (
              <div className="grid grid-cols-2 gap-3">
                {(snapshot.strengths ?? []).length > 0 && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                    <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-1.5">
                      Strengths
                    </div>
                    <ul className="space-y-1">
                      {(snapshot.strengths ?? []).map((s: string, i: number) => (
                        <li key={i} className="text-[11px] text-[var(--cs-text-secondary)] flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(snapshot.concerns ?? []).length > 0 && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                    <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-1.5">
                      Concerns
                    </div>
                    <ul className="space-y-1">
                      {(snapshot.concerns ?? []).map((c: string, i: number) => (
                        <li key={i} className="text-[11px] text-[var(--cs-text-secondary)] flex items-start gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="text-[10px] text-[var(--cs-text-muted)] text-right">
              Period: {formatDate(snapshot.period_start)} – {formatDate(snapshot.period_end)}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ── Pattern Alerts Panel ──────────────────────────────────────────────────────

function PatternAlertsPanel({ childId }: { childId: string }) {
  const { data, isLoading, isError } = usePatternAlerts({ childId });
  const alerts: PatternAlert[] = data?.data ?? [];

  if (isLoading) return <PanelSkeleton rows={2} />;
  if (isError) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Pattern Alerts
          {alerts.length > 0 && (
            <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              {alerts.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-[var(--cs-text-gentle)]" />
            <p className="text-xs text-[var(--cs-text-muted)] italic">No patterns currently detected for this child</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] p-3 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", SEV_CLASSES[alert.severity])}>
                    {alert.severity}
                  </span>
                  <span className="text-xs font-semibold text-[var(--cs-navy)]">{alert.title}</span>
                </div>
                {alert.reflective_prompt && (
                  <p className="text-[11px] text-[var(--cs-text-muted)] italic leading-relaxed">
                    "{alert.reflective_prompt}"
                  </p>
                )}
                <div className="text-[10px] text-[var(--cs-text-muted)]">{formatDate(alert.detected_at)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Interventions Panel ───────────────────────────────────────────────────────

function InterventionsPanel({ childId, childName }: { childId: string; childName: string }) {
  const { data, isLoading, isError } = useInterventions(childId);
  const interventions: Intervention[] = data?.data ?? [];

  if (isLoading) return <PanelSkeleton rows={3} />;
  if (isError) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Wrench className="h-4 w-4 text-blue-500" />
            Interventions
          </CardTitle>
          <InterventionAddModal childId={childId} childName={childName} />
        </div>
      </CardHeader>
      <CardContent>
        {interventions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Wrench className="h-8 w-8 text-[var(--cs-text-gentle)]" />
            <p className="text-xs text-[var(--cs-text-muted)] italic">No interventions recorded</p>
          </div>
        ) : (
          <div className="space-y-2">
            {interventions.map((intervention) => (
              <div key={intervention.id} className={cn(
                "rounded-xl border p-3 space-y-1.5",
                intervention.status === "stopped" || intervention.status === "completed"
                  ? "border-[var(--cs-border-subtle)] bg-[var(--cs-surface)]/50 opacity-70"
                  : "border-[var(--cs-border-subtle)] bg-white"
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-xs font-semibold text-[var(--cs-navy)] leading-snug block">{intervention.title}</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", INT_STATUS_CLASSES[intervention.status])}>
                        {intervention.status.replace("_", " ")}
                      </span>
                      {intervention.outcome !== "unknown" && INT_OUTCOME_CLASSES[intervention.outcome] && (
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", INT_OUTCOME_CLASSES[intervention.outcome])}>
                          {intervention.outcome.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <InterventionUpdateModal intervention={intervention} />
                </div>
                {intervention.outcome_notes && (
                  <p className="text-[11px] text-[var(--cs-text-secondary)] leading-relaxed border-l-2 border-blue-200 pl-2">
                    {intervention.outcome_notes}
                  </p>
                )}
                {!intervention.outcome_notes && intervention.intended_outcome && (
                  <p className="text-[11px] text-[var(--cs-text-muted)] leading-relaxed">{intervention.intended_outcome}</p>
                )}
                <div className="text-[10px] text-[var(--cs-text-muted)]">
                  Started {formatDate(intervention.started_at)}
                  {intervention.review_date && ` · Review ${formatDate(intervention.review_date)}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Practice Bank Panel ───────────────────────────────────────────────────────

function PracticeBankPanel({ childId, childName }: { childId: string; childName: string }) {
  const { data, isLoading, isError } = usePracticeBank(childId, false); // all entries, active + inactive
  const entries: PracticeBankEntry[] = data?.data ?? [];
  const updateEntry = useUpdatePracticeBankEntry();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, PracticeBankEntry[]>();
    for (const entry of entries) {
      const existing = map.get(entry.category) ?? [];
      existing.push(entry);
      map.set(entry.category, existing);
    }
    return map;
  }, [entries]);

  function handleToggle(entry: PracticeBankEntry) {
    if (togglingId) return; // debounce
    setTogglingId(entry.id);
    updateEntry.mutate(
      { id: entry.id, childId, is_active: !entry.is_active },
      { onSettled: () => setTogglingId(null) }
    );
  }

  if (isLoading) return <PanelSkeleton rows={4} />;
  if (isError) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            Practice Bank
          </CardTitle>
          <PracticeBankAddModal childId={childId} childName={childName} />
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Star className="h-8 w-8 text-[var(--cs-text-gentle)]" />
            <p className="text-xs text-[var(--cs-text-muted)] italic">No practice bank entries yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([category, categoryEntries]) => {
              const config = CATEGORY_LABELS[category] ?? { label: category, icon: BookOpen };
              const CatIcon = config.icon;
              return (
                <div key={category}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <CatIcon className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                    <span className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">
                      {config.label}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {categoryEntries.map((entry) => {
                      const isToggling = togglingId === entry.id;
                      return (
                        <div
                          key={entry.id}
                          className={cn(
                            "rounded-xl border p-3 flex items-start gap-2 transition-opacity",
                            entry.is_active
                              ? "border-[var(--cs-border-subtle)] bg-[var(--cs-surface)]"
                              : "border-[var(--cs-border-subtle)] bg-[var(--cs-surface)]/40 opacity-60"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn(
                                "text-xs font-semibold",
                                entry.is_active ? "text-[var(--cs-navy)]" : "text-[var(--cs-text-muted)]"
                              )}>
                                {entry.title}
                              </span>
                            </div>
                            {entry.description && (
                              <p className="text-[11px] text-[var(--cs-text-muted)] mt-1 leading-relaxed">{entry.description}</p>
                            )}
                            {entry.evidence && (
                              <p className="text-[10px] text-[var(--cs-text-muted)] mt-1 italic">Evidence: {entry.evidence}</p>
                            )}
                          </div>

                          {/* Active/Inactive toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggle(entry)}
                            disabled={isToggling}
                            title={entry.is_active ? "Mark as inactive" : "Mark as active"}
                            className={cn(
                              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold shrink-0 transition-all",
                              "disabled:opacity-50 disabled:cursor-wait",
                              entry.is_active
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)]"
                            )}
                          >
                            {isToggling ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            ) : entry.is_active ? (
                              <ToggleRight className="h-2.5 w-2.5" />
                            ) : (
                              <ToggleLeft className="h-2.5 w-2.5" />
                            )}
                            {entry.is_active ? "Active" : "Inactive"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Children's Voice Panel ────────────────────────────────────────────────────

function VoiceRecordsPanel({ childId, childName }: { childId: string; childName: string }) {
  const { data, isLoading, isError } = useVoiceRecords(childId);
  const records: VoiceRecord[] = data?.data ?? [];

  if (isLoading) return <PanelSkeleton rows={3} />;
  if (isError) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4 text-[var(--cs-aria-gold)]" />
            Children&apos;s Voice
          </CardTitle>
          <VoiceCaptureModal childId={childId} childName={childName} />
        </div>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <MessageSquareQuote className="h-8 w-8 text-[var(--cs-text-gentle)]" />
            <p className="text-xs text-[var(--cs-text-muted)] italic">No voice records captured yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div key={record.id} className="rounded-xl border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)]/50 p-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-full bg-[var(--cs-aria-gold-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--cs-aria-gold)] capitalize">
                    {voiceThemeLabel(record.theme)}
                  </span>
                  {record.voice_heeded !== null && (
                    <span className={cn(
                      "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                      record.voice_heeded
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-600"
                    )}>
                      {record.voice_heeded
                        ? <><CheckCircle2 className="h-2.5 w-2.5" />Heeded</>
                        : <><XCircle className="h-2.5 w-2.5" />Not heeded</>
                      }
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-[var(--cs-text-muted)]">{formatDate(record.recorded_at)}</span>
                </div>
                {record.direct_quote ? (
                  <blockquote className="text-xs text-[var(--cs-text-secondary)] italic border-l-2 border-[var(--cs-aria-gold-soft)] pl-2 leading-relaxed">
                    "{record.direct_quote}"
                  </blockquote>
                ) : record.paraphrase ? (
                  <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{record.paraphrase}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Trusted Adult Map Panel ───────────────────────────────────────────────────

function TrustedAdultMapPanel({ childId, childName }: { childId: string; childName: string }) {
  const { data, isLoading, isError } = useRelationalRecords(childId);
  const records: RelationalRecord[] = data?.data ?? [];

  const trustedAdults = records.filter((r) => r.record_type === "preferred_adult");
  const whatHelps     = records.filter((r) => r.record_type === "what_helps");
  const whatToAvoid   = records.filter((r) => r.record_type === "what_to_avoid");
  const strategies    = records.filter((r) => r.record_type === "regulation_strategy" || r.record_type === "de_escalation");

  if (isLoading) return <PanelSkeleton rows={2} />;
  if (isError) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-500" />
            Trusted Adults & Relationships
          </CardTitle>
          <RelationalRecordAddModal childId={childId} childName={childName} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trusted adults */}
        <div>
          <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">
            Preferred Adults
          </div>
          {trustedAdults.length === 0 ? (
            <p className="text-xs text-[var(--cs-text-muted)] italic">No preferred adults recorded</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {trustedAdults.map((record) => (
                <div key={record.id} className={cn(
                  "rounded-xl border p-3 space-y-1",
                  record.is_positive ? "border-teal-100 bg-teal-50/50" : "border-[var(--cs-border-subtle)] bg-[var(--cs-surface)]"
                )}>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      record.is_positive ? "bg-teal-500" : "bg-[var(--cs-text-muted)]"
                    )} />
                    <span className="text-xs font-semibold text-[var(--cs-navy)]">{record.title}</span>
                  </div>
                  {record.description && (
                    <p className="text-[11px] text-[var(--cs-text-muted)] leading-relaxed pl-3.5">{record.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* What helps */}
        {whatHelps.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">
              What Helps
            </div>
            <div className="space-y-2">
              {whatHelps.map((record) => (
                <div key={record.id} className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--cs-navy)]">{record.title}</div>
                    {record.description && (
                      <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5 leading-relaxed">{record.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What to avoid */}
        {whatToAvoid.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-2">
              What to Avoid
            </div>
            <div className="space-y-2">
              {whatToAvoid.map((record) => (
                <div key={record.id} className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--cs-navy)]">{record.title}</div>
                    {record.description && (
                      <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5 leading-relaxed">{record.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regulation strategies */}
        {strategies.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">
              Regulation Strategies
            </div>
            <div className="space-y-2">
              {strategies.map((record) => (
                <div key={record.id} className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 flex items-start gap-2">
                  <Brain className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--cs-navy)]">{record.title}</div>
                    {record.description && (
                      <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5 leading-relaxed">{record.description}</p>
                    )}
                    <span className="text-[9px] text-[var(--cs-text-muted)] capitalize">{record.confidence} confidence</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {records.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Users className="h-8 w-8 text-[var(--cs-text-gentle)]" />
            <p className="text-xs text-[var(--cs-text-muted)] italic">No relational records yet</p>
            <p className="text-[10px] text-[var(--cs-text-muted)]">Use <strong>Add Record</strong> to log trusted adults, what helps, or regulation strategies.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── ARIA Child Panel ──────────────────────────────────────────────────────────

interface AriaChildPanelProps {
  childId: string;
  childName: string;
}

type AriaMode =
  | "experience_summary"
  | "practice_bank"
  | "pattern_analysis"
  | "voice_summary"
  | "assist";

interface PresetPrompt {
  label: string;
  mode: AriaMode;
  question?: string;
}

const PRESET_PROMPTS: PresetPrompt[] = [
  { label: "Summarise their experience", mode: "experience_summary" },
  {
    label: "What's been working?",
    mode: "practice_bank",
    question:
      "What approaches have been working for this young person? What should we continue and what should we try?",
  },
  { label: "Review pattern alerts", mode: "pattern_analysis" },
  { label: "Children's voice summary", mode: "voice_summary" },
];

function AriaChildPanel({ childId, childName }: AriaChildPanelProps) {
  const [customQuestion, setCustomQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<AriaMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Gather child context from hooks ─────────────────────────────────────────
  const { data: experienceData } = useChildExperienceLatest(childId);
  const { data: alertsData } = usePatternAlerts({ childId });
  const { data: interventionsData } = useInterventions(childId);
  const { data: voiceData } = useVoiceRecords(childId);
  const { data: practiceData } = usePracticeBank(childId);

  function buildChildContext(): string {
    const snapshot = experienceData?.data ?? null;
    const alerts: PatternAlert[] = alertsData?.data ?? [];
    const interventions: Intervention[] = interventionsData?.data ?? [];
    const voiceRecords: VoiceRecord[] = voiceData?.data ?? [];
    const practiceEntries: PracticeBankEntry[] = practiceData?.data ?? [];

    const scoreStr = snapshot
      ? `${snapshot.overall_score} (narrative: ${snapshot.narrative ?? "none"})`
      : "Not available";

    const alertTitles =
      alerts.length > 0 ? alerts.map((a) => a.title).join(", ") : "None";

    const activeInterventions = interventions.filter(
      (i) => i.status === "active"
    );
    const interventionTitles =
      activeInterventions.length > 0
        ? activeInterventions.map((i) => i.title).join(", ")
        : "None";

    const recentVoice = voiceRecords.slice(0, 2);
    const voiceStr =
      recentVoice.length > 0
        ? recentVoice
            .map((r) => r.direct_quote ?? r.paraphrase ?? "")
            .filter(Boolean)
            .join(" | ")
        : "No recent records";

    const activeEntries = practiceEntries.filter((e) => e.is_active);
    const practiceStr =
      activeEntries.length > 0
        ? activeEntries.map((e) => e.title).join(", ")
        : "No entries";

    return [
      `CHILD: ${childName}`,
      `LATEST EXPERIENCE SCORE: ${scoreStr}`,
      `ACTIVE PATTERN ALERTS: ${alertTitles}`,
      `ACTIVE INTERVENTIONS: ${interventionTitles}`,
      `RECENT VOICE: ${voiceStr}`,
      `PRACTICE BANK: ${practiceStr}`,
    ].join("\n");
  }

  async function callAria(mode: AriaMode, question?: string) {
    setIsLoading(true);
    setResponse(null);
    setError(null);
    setActiveMode(mode);

    try {
      const childContext = buildChildContext();
      const payload = {
        mode,
        style: "relational_practice",
        stream: false,
        page_context: `child-profile:${childId}`,
        user_role: "registered_manager",
        question: question ?? undefined,
        source_content: childContext,
      };

      const res = await fetch("/api/v1/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          (errJson as { error?: string }).error ?? `HTTP ${res.status}`
        );
      }

      const json = (await res.json()) as {
        data: { response: string; mode: string };
      };
      setResponse(json.data.response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handlePreset(preset: PresetPrompt) {
    callAria(preset.mode, preset.question);
  }

  function handleCustomSubmit() {
    if (!customQuestion.trim()) return;
    callAria("assist", customQuestion.trim());
  }

  function handleCopy() {
    if (!response) return;
    navigator.clipboard.writeText(response).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleClear() {
    setResponse(null);
    setActiveMode(null);
    setError(null);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Brain className="h-4 w-4 text-[var(--cs-aria-gold)]" />
          Ask ARIA about {childName}
        </CardTitle>
        <p className="text-[11px] text-[var(--cs-text-muted)] leading-relaxed mt-0.5">
          ARIA can analyse {childName}&apos;s records, suggest approaches,
          review what&apos;s working, and support your reflective practice.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preset prompt buttons */}
        <div className="flex flex-wrap gap-2">
          {PRESET_PROMPTS.map((preset) => (
            <button
              key={preset.mode + preset.label}
              onClick={() => handlePreset(preset)}
              disabled={isLoading}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors",
                "border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)]",
                "hover:bg-[var(--cs-aria-gold-bg)] hover:border-[var(--cs-aria-gold-soft)]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom question */}
        <div className="space-y-2">
          <div className="relative">
            <textarea
              rows={3}
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="Ask ARIA a custom question about this young person…"
              disabled={isLoading}
              className={cn(
                "w-full rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2.5",
                "text-xs text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)]",
                "resize-none focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold-soft)] focus:border-transparent",
                "disabled:opacity-50"
              )}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <DictationButton
              onTranscript={(text) =>
                setCustomQuestion((prev) =>
                  prev ? `${prev} ${text}` : text
                )
              }
              size="sm"
              disabled={isLoading}
            />
            <Button
              size="sm"
              onClick={handleCustomSubmit}
              disabled={isLoading || !customQuestion.trim()}
              className="bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white text-xs px-4"
            >
              Ask ARIA
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)] p-4">
            <Brain className="h-5 w-5 text-[var(--cs-text-muted)] animate-pulse shrink-0" />
            <span className="text-xs text-[var(--cs-aria-gold)] font-medium">
              ARIA is thinking…
            </span>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Response output */}
        {response && !isLoading && (
          <div className="space-y-2">
            <div className="rounded-xl border border-[var(--cs-aria-gold-soft)] bg-white p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="rounded-full bg-[var(--cs-aria-gold-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--cs-aria-gold)] uppercase tracking-wider">
                  MODE: {activeMode}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)] transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1 rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)] transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Clear
                  </button>
                </div>
              </div>

              {/* Response text */}
              <div className="text-xs text-[var(--cs-navy)] leading-relaxed whitespace-pre-wrap">
                {response}
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-[var(--cs-text-muted)] leading-relaxed">
              AI-generated content. Always subject to professional judgement —
              ARIA does not replace practitioner decision-making.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

interface ChildExperienceTabProps {
  childId: string;
  childName: string;
}

export function ChildExperienceTab({ childId, childName }: ChildExperienceTabProps) {
  return (
    <div className="space-y-4">
      <ExperienceScoresPanel childId={childId} />
      <PatternAlertsPanel childId={childId} />
      <InterventionsPanel childId={childId} childName={childName} />
      <PracticeBankPanel childId={childId} childName={childName} />
      <VoiceRecordsPanel childId={childId} childName={childName} />
      <TrustedAdultMapPanel childId={childId} childName={childName} />
      <AriaChildPanel childId={childId} childName={childName} />
    </div>
  );
}
