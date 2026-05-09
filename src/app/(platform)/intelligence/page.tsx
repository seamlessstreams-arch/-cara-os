"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INTELLIGENCE HUB
// Command-centre view for managers: home climate, pattern alerts,
// active interventions, children's voice coverage.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useHomeClimate,
  usePatternAlerts,
  useInterventions,
  useAllInterventions,
  useVoiceRecords,
  useAcknowledgePattern,
  useActionOutcomes,
  useCreatePatternAlert,
  useCreateHomeClimate,
} from "@/hooks/use-intelligence";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import type { HomeClimateSnapshot, PatternAlert, Intervention, VoiceRecord, ActionOutcome } from "@/types/extended";
import {
  Users, AlertTriangle, TrendingUp, TrendingDown, Minus,
  CheckCircle2, Activity, MessageSquareQuote, Brain,
  ChevronRight, Loader2, AlertCircle, Shield, Zap, Layers,
  GraduationCap, ClipboardList, Target, ScanSearch, Plus, Cpu,
  Sparkles, X,
} from "lucide-react";
import { ActionOutcomeAddModal } from "@/components/intelligence/action-outcome-add-modal";
import { ActionOutcomeUpdateModal } from "@/components/intelligence/action-outcome-update-modal";
import { useAuthContext } from "@/contexts/auth-context";
import { api } from "@/hooks/use-api";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-100", className)} />;
}

function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-44" />
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

function ClimateCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-10" />
      <Skeleton className="h-2 w-full" />
    </div>
  );
}

// ─── Score colour helpers ──────────────────────────────────────────────────────

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

// ─── Delta arrow ──────────────────────────────────────────────────────────────

function DeltaArrow({ delta }: { delta: number | null }) {
  if (delta === null || delta === 0) return <Minus className="h-3.5 w-3.5 text-slate-400" />;
  if (delta > 0) return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
  return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
}

// ─── Climate Score Card ───────────────────────────────────────────────────────

function ClimateScoreCard({
  label, score, delta, icon: Icon,
}: {
  label: string;
  score: number;
  delta?: number | null;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        </div>
        {delta !== undefined && <DeltaArrow delta={delta ?? null} />}
      </div>
      <div className={cn("text-3xl font-bold tabular-nums", scoreColor(score))}>{score}</div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div
          className={cn("h-2 rounded-full transition-all duration-500", scoreBarColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ─── Home Climate Section ─────────────────────────────────────────────────────

function HomeClimateSection() {
  const { data, isLoading, isError } = useHomeClimate();
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const climate: HomeClimateSnapshot | null = data?.data?.latest ?? null;

  const { data: alertsData }     = usePatternAlerts({ status: "active" });
  const { data: intData }        = useAllInterventions();
  const { data: actionsData }    = useActionOutcomes();
  const { data: voiceCasey }     = useVoiceRecords("yp_casey");
  const { data: voiceAlex }      = useVoiceRecords("yp_alex");
  const { data: voiceJordan }    = useVoiceRecords("yp_jordan");

  const createClimate = useCreateHomeClimate();
  const [computeState, setComputeState] = useState<"idle" | "computing" | "success" | "error">("idle");
  const [computeError, setComputeError] = useState<string | null>(null);

  async function handleComputeClimate() {
    setComputeState("computing");
    setComputeError(null);

    try {
      const alerts      = alertsData?.data ?? [];
      const interventions = intData?.data ?? [];
      const actions     = actionsData?.data ?? [];
      const allVoice    = [
        ...(voiceCasey?.data ?? []),
        ...(voiceAlex?.data ?? []),
        ...(voiceJordan?.data ?? []),
      ];

      const now        = new Date();
      const lines: string[] = [
        `## Oak House Home Climate Context`,
        `Assessment date: ${now.toISOString()}`,
        `Children: Casey (yp_casey), Alex (yp_alex), Jordan (yp_jordan)`,
        "",
      ];

      if (climate) {
        lines.push(`## Previous climate score: ${climate.overall_climate_score}`);
        if (climate.narrative) lines.push(`Previous narrative: ${climate.narrative}`);
        lines.push("");
      }

      if (alerts.length > 0) {
        lines.push(`## Active Pattern Alerts (${alerts.length})`);
        alerts.forEach((a) => lines.push(`- [${a.severity}] ${a.title}`));
        const critical = alerts.filter((a) => a.severity === "critical").length;
        const high     = alerts.filter((a) => a.severity === "high").length;
        lines.push(`Critical: ${critical}, High: ${high}`);
        lines.push("");
      } else {
        lines.push("## Pattern Alerts: None active");
        lines.push("");
      }

      if (interventions.length > 0) {
        const active = interventions.filter((i) => i.status === "active");
        lines.push(`## Interventions: ${interventions.length} total, ${active.length} active`);
        interventions.forEach((i) => {
          lines.push(`- ${i.title} (${i.status}, outcome: ${i.outcome})`);
        });
        lines.push("");
      }

      if (actions.length > 0) {
        const overdue = actions.filter((a) => a.status === "overdue");
        lines.push(`## Action Outcomes: ${actions.length} total, ${overdue.length} overdue`);
        overdue.forEach((a) => lines.push(`- OVERDUE: ${a.title}`));
        lines.push("");
      }

      if (allVoice.length > 0) {
        const heeded     = allVoice.filter((v) => v.voice_heeded === true).length;
        const notHeeded  = allVoice.filter((v) => v.voice_heeded === false).length;
        lines.push(`## Children's Voice: ${allVoice.length} records, ${heeded} heeded, ${notHeeded} not heeded`);
        lines.push("");
      }

      const context = lines.join("\n");

      const res = await fetch("/api/v1/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "compute_home_climate",
          stream: false,
          source_content: context,
          prompt: "Compute the current home climate scores for Oak House based on the provided intelligence data.",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `ARIA returned ${res.status}`);
      }

      const json = await res.json();
      const parsed = json?.data?.parsed;
      if (!parsed || typeof parsed !== "object") {
        throw new Error("ARIA did not return valid JSON");
      }

      const periodEnd   = now.toISOString();
      const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const prevScore   = climate?.overall_climate_score ?? null;
      const newScore    = Number(parsed.overall_climate_score ?? 75);

      await createClimate.mutateAsync({
        home_id:                     homeId,
        period_start:                periodStart,
        period_end:                  periodEnd,
        staffing_consistency_score:  Number(parsed.staffing_consistency_score  ?? 75),
        incident_frequency_score:    Number(parsed.incident_frequency_score    ?? 75),
        missing_episode_score:       Number(parsed.missing_episode_score       ?? 75),
        complaints_score:            Number(parsed.complaints_score            ?? 90),
        safeguarding_score:          Number(parsed.safeguarding_score          ?? 80),
        peer_tension_score:          Number(parsed.peer_tension_score          ?? 70),
        training_compliance_score:   Number(parsed.training_compliance_score   ?? 82),
        maintenance_score:           Number(parsed.maintenance_score           ?? 78),
        overall_climate_score:       newScore,
        climate_delta:               prevScore !== null ? newScore - prevScore : null,
        narrative:                   parsed.narrative ?? "ARIA climate assessment complete.",
        hotspot_times:               Array.isArray(parsed.hotspot_times) ? parsed.hotspot_times : [],
        risk_flags:                  Array.isArray(parsed.risk_flags)    ? parsed.risk_flags    : [],
        computed_by:                 "aria",
      });

      setComputeState("success");
      setTimeout(() => setComputeState("idle"), 3000);
    } catch (err) {
      setComputeError(err instanceof Error ? err.message : "Unknown error");
      setComputeState("error");
      setTimeout(() => setComputeState("idle"), 5000);
    }
  }

  if (isLoading) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-400" />Home Climate
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <ClimateCardSkeleton key={i} />)}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-400" />Home Climate
        </h2>
        <Button
          size="sm"
          onClick={handleComputeClimate}
          disabled={computeState === "computing"}
          className={cn(
            "gap-1.5 text-xs h-8",
            computeState === "success" ? "bg-emerald-600 hover:bg-emerald-700 text-white" :
            computeState === "error"   ? "bg-red-600 hover:bg-red-700 text-white" :
            "bg-violet-600 hover:bg-violet-700 text-white"
          )}
        >
          {computeState === "computing" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {computeState === "success"   && <CheckCircle2 className="h-3.5 w-3.5" />}
          {computeState === "error"     && <AlertTriangle className="h-3.5 w-3.5" />}
          {computeState === "idle"      && <Cpu className="h-3.5 w-3.5" />}
          {computeState === "computing" ? "Computing…"
           : computeState === "success" ? "Updated!"
           : computeState === "error"   ? "Error"
           : "Compute Climate"}
        </Button>
      </div>

      {isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />Unable to load climate data
        </div>
      )}

      {computeState === "error" && computeError && (
        <p className="text-[10px] text-red-600">{computeError}</p>
      )}

      {climate && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <ClimateScoreCard label="Staffing Consistency" score={climate.staffing_consistency_score} delta={climate.climate_delta} icon={Users} />
            <ClimateScoreCard label="Incident Frequency"   score={climate.incident_frequency_score}  icon={AlertTriangle} />
            <ClimateScoreCard label="Missing Episodes"     score={climate.missing_episode_score}     icon={Shield} />
            <ClimateScoreCard label="Training Compliance"  score={climate.training_compliance_score} icon={GraduationCap} />
            <ClimateScoreCard label="Overall Climate"      score={climate.overall_climate_score}     delta={climate.climate_delta} icon={Activity} />
          </div>

          {climate.narrative && (
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
              <div className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider mb-1">ARIA Analysis</div>
              <p className="text-xs text-slate-700 leading-relaxed">{climate.narrative}</p>
            </div>
          )}

          {climate.risk_flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {climate.risk_flags.map((flag, i) => (
                <Badge key={i} variant="warning" className="text-[10px] rounded-full gap-0.5">
                  <AlertTriangle className="h-2.5 w-2.5" />{flag}
                </Badge>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ─── Severity badge class ────────────────────────────────────────────────────

const SEV_CLASSES: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high:     "bg-orange-100 text-orange-800",
  medium:   "bg-amber-100 text-amber-800",
  low:      "bg-slate-100 text-slate-700",
};

const SEV_BORDER: Record<string, string> = {
  critical: "border-l-red-400",
  high:     "border-l-orange-400",
  medium:   "border-l-amber-400",
  low:      "border-l-slate-300",
};

// ─── Pattern Alerts Section ───────────────────────────────────────────────────

function PatternAlertsSection() {
  const { data, isLoading, isError } = usePatternAlerts({});
  const acknowledge = useAcknowledgePattern();
  const { currentUser } = useAuthContext();

  // Per-alert resolve state
  const [resolvingId, setResolvingId] = React.useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = React.useState<Record<string, string>>({});

  const alerts: PatternAlert[] = useMemo(
    () => (data?.data ?? []).filter((a: PatternAlert) => a.status === "active" || a.status === "acknowledged"),
    [data]
  );

  function handleAcknowledge(id: string) {
    acknowledge.mutate({ id, status: "acknowledged", acknowledged_by: currentUser?.id ?? "staff_darren" });
  }

  function handleResolve(id: string) {
    acknowledge.mutate({
      id,
      status: "resolved",
      resolved_by: currentUser?.id ?? "staff_darren",
      resolution_notes: resolveNotes[id] ?? "",
    } as Parameters<typeof acknowledge.mutate>[0], {
      onSuccess: () => setResolvingId(null),
    });
  }

  if (isLoading) return <CardSkeleton rows={3} />;

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-amber-500" />Active Pattern Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-xs text-red-500 py-4">
            <AlertCircle className="h-4 w-4 shrink-0" />Unable to load pattern alerts
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Brain className="h-4 w-4 text-amber-500" />
          Active Pattern Alerts
          {alerts.length > 0 && (
            <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              {alerts.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-slate-200" />
            <p className="text-sm text-slate-500">No active pattern alerts</p>
            <p className="text-xs text-slate-400">ARIA is monitoring for emerging patterns</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "rounded-xl border-l-4 border border-slate-100 bg-slate-50 p-4 space-y-2",
                  SEV_BORDER[alert.severity]
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize shrink-0",
                        SEV_CLASSES[alert.severity]
                      )}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">{alert.title}</span>
                    </div>
                    {alert.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">{alert.description}</p>
                    )}
                    {alert.reflective_prompt && (
                      <p className="text-[11px] text-slate-500 italic leading-relaxed">
                        Reflect: "{alert.reflective_prompt}"
                      </p>
                    )}
                    <div className="text-[10px] text-slate-400">{formatDate(alert.detected_at)}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {alert.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
                        disabled={acknowledge.isPending}
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => setResolvingId(resolvingId === alert.id ? null : alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
                {resolvingId === alert.id && (
                  <div className="pt-2 space-y-2 border-t border-slate-200 mt-2">
                    <textarea
                      value={resolveNotes[alert.id] ?? ""}
                      onChange={(e) => setResolveNotes((prev) => ({ ...prev, [alert.id]: e.target.value }))}
                      rows={2}
                      placeholder="Describe how this was resolved..."
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setResolvingId(null)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={acknowledge.isPending}
                        onClick={() => handleResolve(alert.id)}
                      >
                        {acknowledge.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm Resolve"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Hardcoded child IDs for cross-child hooks ────────────────────────────────
// In production these would come from the home's children list

const CHILD_IDS = ["yp_casey", "yp_alex", "yp_jordan"];

// ─── Recent Interventions Section ─────────────────────────────────────────────

function RecentInterventionsSection() {
  const q1 = useInterventions(CHILD_IDS[0]);
  const q2 = useInterventions(CHILD_IDS[1]);
  const q3 = useInterventions(CHILD_IDS[2]);

  const isLoading = q1.isLoading || q2.isLoading || q3.isLoading;

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<string | null>(null);
  const [reviewTitle, setReviewTitle] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);

  const allInterventions: Intervention[] = useMemo(() => {
    const combined = [
      ...(q1.data?.data ?? []),
      ...(q2.data?.data ?? []),
      ...(q3.data?.data ?? []),
    ] as Intervention[];
    return combined
      .filter((i) => i.status === "active")
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .slice(0, 8);
  }, [q1.data, q2.data, q3.data]);

  const INT_STATUS: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    paused: "bg-amber-100 text-amber-800",
    under_review: "bg-violet-100 text-violet-800",
  };

  async function handleReview(e: React.MouseEvent, intervention: Intervention) {
    e.preventDefault();
    e.stopPropagation();
    setReviewingId(intervention.id);
    setReviewTitle(intervention.title);
    try {
      const sourceContent = [
        `Intervention: ${intervention.title}`,
        `Description: ${intervention.description}`,
        `Rationale: ${intervention.rationale}`,
        `Intended outcome: ${intervention.intended_outcome}`,
        intervention.outcome_notes ? `Outcome notes: ${intervention.outcome_notes}` : null,
        `Status: ${intervention.status}`,
        `Started: ${intervention.started_at}`,
        intervention.review_date ? `Review date: ${intervention.review_date}` : null,
        intervention.ended_at ? `Ended: ${intervention.ended_at}` : null,
      ].filter(Boolean).join("\n");

      const res = await api.post<{ data: { response?: string; text?: string } }>("/aria", {
        mode: "intervention_review",
        source_content: sourceContent,
      });
      const content = res.data?.response || res.data?.text || "";
      if (content) {
        setReviewResult(content);
        setShowReviewModal(true);
      }
    } catch (err) {
      console.error("Failed to review intervention:", err);
    } finally {
      setReviewingId(null);
    }
  }

  if (isLoading) return <CardSkeleton rows={4} />;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-blue-500" />
              Active Interventions
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {allInterventions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <ClipboardList className="h-10 w-10 text-slate-200" />
              <p className="text-sm text-slate-500">No active interventions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allInterventions.map((intervention) => (
                <div
                  key={intervention.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 hover:shadow-sm hover:-translate-y-0.5 transition-all group"
                >
                  <Link
                    href={`/young-people/${intervention.child_id}?tab=intelligence`}
                    className="flex-1 min-w-0"
                  >
                    <div className="text-xs font-semibold text-slate-900 truncate">{intervention.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{formatRelative(intervention.started_at)}</div>
                  </Link>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {INT_STATUS[intervention.status] && (
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                        INT_STATUS[intervention.status]
                      )}>
                        {intervention.status.replace("_", " ")}
                      </span>
                    )}
                    <button
                      onClick={(e) => handleReview(e, intervention)}
                      disabled={reviewingId === intervention.id}
                      title="Review with ARIA"
                      className="flex items-center gap-1 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 px-2 py-1 text-[10px] font-semibold transition-colors disabled:opacity-50"
                    >
                      {reviewingId === intervention.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      Review
                    </button>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showReviewModal && reviewResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowReviewModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-violet-600" />
                <div>
                  <div className="text-sm font-bold text-slate-900">ARIA — Intervention Review</div>
                  <div className="text-xs text-slate-500 truncate max-w-sm">{reviewTitle}</div>
                </div>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {reviewResult}
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-4">
              <Button onClick={() => setShowReviewModal(false)} className="w-full">Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Voice Coverage Section ───────────────────────────────────────────────────

function VoiceCoverageSection() {
  const q1 = useVoiceRecords(CHILD_IDS[0]);
  const q2 = useVoiceRecords(CHILD_IDS[1]);
  const q3 = useVoiceRecords(CHILD_IDS[2]);

  const isLoading = q1.isLoading || q2.isLoading || q3.isLoading;

  const recentVoice: VoiceRecord[] = useMemo(() => {
    const combined = [
      ...(q1.data?.data ?? []),
      ...(q2.data?.data ?? []),
      ...(q3.data?.data ?? []),
    ] as VoiceRecord[];
    return combined
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
      .slice(0, 6);
  }, [q1.data, q2.data, q3.data]);

  if (isLoading) return <CardSkeleton rows={3} />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <MessageSquareQuote className="h-4 w-4 text-violet-500" />
          Children's Voice
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentVoice.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <MessageSquareQuote className="h-10 w-10 text-slate-200" />
            <p className="text-sm text-slate-500">No voice records captured recently</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentVoice.map((record) => (
              <div key={record.id} className="rounded-xl border border-violet-100 bg-violet-50/40 p-3 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 capitalize">
                    {record.theme.replace("_", " ")}
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
                        : "Not heeded"
                      }
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-slate-400">{formatRelative(record.recorded_at)}</span>
                </div>
                {(record.direct_quote ?? record.paraphrase) && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 italic">
                    "{record.direct_quote ?? record.paraphrase}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Action Outcomes Section ──────────────────────────────────────────────────

const CHILD_NAMES: Record<string, string> = {
  yp_casey: "Casey",
  yp_alex:  "Alex",
  yp_jordan:    "Jordan",
};

const OWNER_NAMES: Record<string, string> = {
  staff_darren:    "Darren (RM)",
  staff_ryan:      "Ryan",
  staff_chervelle: "Chervelle",
  staff_lackson:   "Lackson",
};

const STATUS_CLASSES: Record<string, string> = {
  open:        "bg-blue-100 text-blue-800",
  in_progress: "bg-violet-100 text-violet-800",
  completed:   "bg-emerald-100 text-emerald-800",
  overdue:     "bg-red-100 text-red-800",
  stalled:     "bg-amber-100 text-amber-800",
  cancelled:   "bg-slate-100 text-slate-500",
};

function ActionOutcomeRow({ action }: { action: ActionOutcome }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="text-xs font-semibold text-slate-900 truncate">{action.title}</div>
        <div className="flex items-center gap-2 flex-wrap">
          {action.child_id && CHILD_NAMES[action.child_id] && (
            <span className="text-[10px] text-slate-500">{CHILD_NAMES[action.child_id]}</span>
          )}
          {action.due_date && (
            <span className="text-[10px] text-slate-400">Due {formatDate(action.due_date)}</span>
          )}
          {action.owner_id && OWNER_NAMES[action.owner_id] && (
            <span className="text-[10px] text-slate-400">{OWNER_NAMES[action.owner_id]}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
          STATUS_CLASSES[action.status] ?? "bg-slate-100 text-slate-600"
        )}>
          {action.status.replace("_", " ")}
        </span>
        <ActionOutcomeUpdateModal outcome={action} />
      </div>
    </div>
  );
}

function ActionOutcomesSection() {
  const overdueQuery = useActionOutcomes({ status: "overdue" });
  const allQuery     = useActionOutcomes();

  const overdueActions: ActionOutcome[] = useMemo(
    () => (overdueQuery.data?.data ?? []) as ActionOutcome[],
    [overdueQuery.data]
  );

  const openActions: ActionOutcome[] = useMemo(() => {
    const all = (allQuery.data?.data ?? []) as ActionOutcome[];
    return all.filter((a) => a.status === "open" || a.status === "in_progress");
  }, [allQuery.data]);

  const isLoading = overdueQuery.isLoading || allQuery.isLoading;

  if (isLoading) return <CardSkeleton rows={4} />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-violet-500" />
            Action Outcomes
            {overdueActions.length > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                {overdueActions.length} overdue
              </span>
            )}
          </CardTitle>
          <ActionOutcomeAddModal />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overdue group */}
        {overdueActions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-600">
                Overdue
              </span>
            </div>
            {overdueActions.map((a) => (
              <ActionOutcomeRow key={a.id} action={a} />
            ))}
          </div>
        )}

        {/* Open / In Progress group */}
        {openActions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Open / In Progress
              </span>
            </div>
            {openActions.map((a) => (
              <ActionOutcomeRow key={a.id} action={a} />
            ))}
          </div>
        )}

        {overdueActions.length === 0 && openActions.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Target className="h-10 w-10 text-slate-200" />
            <p className="text-sm text-slate-500">No open action outcomes</p>
            <p className="text-xs text-slate-400">Log agreed actions to track progress here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── ARIA Pattern Scanner ─────────────────────────────────────────────────────

const SEV_CLASSES_SCAN: Record<string, string> = {
  critical: "border-red-300 bg-red-50 text-red-800",
  high:     "border-orange-300 bg-orange-50 text-orange-800",
  medium:   "border-amber-300 bg-amber-50 text-amber-800",
  low:      "border-slate-300 bg-slate-50 text-slate-700",
};

const CHILD_NAME_MAP_SCAN: Record<string, string> = {
  yp_casey: "Casey", yp_alex: "Alex", yp_jordan: "Jordan",
};

interface ScannedPattern {
  alert_type: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  child_id: string | null;
  reflective_prompt: string;
  period_start: string;
  period_end: string;
}

function AriaPatternScanSection() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [scanning, setScanning]           = useState(false);
  const [patterns, setPatterns]           = useState<ScannedPattern[] | null>(null);
  const [saveStates, setSaveStates]       = useState<Record<number, "idle" | "saving" | "saved">>({});
  const [scanError, setScanError]         = useState<string | null>(null);

  // Pull current data to build context
  const { data: alertsData }         = usePatternAlerts({ status: "active" });
  const { data: interventionsData }  = useAllInterventions();
  const { data: voiceCaseyData }     = useVoiceRecords("yp_casey");
  const { data: voiceAlexData }      = useVoiceRecords("yp_alex");
  const { data: voiceJordanData }    = useVoiceRecords("yp_jordan");
  const { data: actionsData }        = useActionOutcomes();

  const createAlert = useCreatePatternAlert();

  async function handleScan() {
    setScanning(true);
    setPatterns(null);
    setScanError(null);
    setSaveStates({});

    try {
      // Build aggregate context for ARIA
      const existingAlerts = alertsData?.data ?? [];
      const interventions  = interventionsData?.data ?? [];
      const actions        = actionsData?.data ?? [];
      const voices         = [
        ...(voiceCaseyData?.data ?? []).map(v => ({ ...v, child: "Casey (yp_casey)" })),
        ...(voiceAlexData?.data ?? []).map(v => ({ ...v, child: "Alex (yp_alex)" })),
        ...(voiceJordanData?.data ?? []).map(v => ({ ...v, child: "Jordan (yp_jordan)" })),
      ];

      const now = new Date();
      const lines: string[] = [
        `## Oak House Intelligence Context`,
        `Scan date: ${now.toISOString()}`,
        `Home: Oak House (home_oak)`,
        `Children: Casey (yp_casey), Alex (yp_alex), Jordan (yp_jordan)`,
        "",
      ];

      if (existingAlerts.length > 0) {
        lines.push("## Existing Active Pattern Alerts (do not duplicate these)");
        existingAlerts.forEach((a) => {
          lines.push(`- [${a.severity}] ${a.title}`);
        });
        lines.push("");
      }

      if (interventions.length > 0) {
        lines.push("## Current Interventions Across Home");
        interventions.forEach((i) => {
          lines.push(`- ${i.title} for ${i.child_id} (status: ${i.status}, outcome: ${i.outcome})`);
        });
        lines.push("");
      }

      if (voices.length > 0) {
        lines.push("## Recent Voice Records (all children)");
        voices.slice(0, 12).forEach((v) => {
          const content = v.direct_quote ?? v.paraphrase ?? "";
          if (content) lines.push(`- [${v.child}] Theme: ${v.theme} — "${content.slice(0, 120)}"`);
        });
        lines.push("");
      }

      if (actions.length > 0) {
        lines.push("## Action Outcomes");
        actions.forEach((a) => {
          lines.push(`- [${a.status}] ${a.title}${a.child_id ? ` (${CHILD_NAME_MAP_SCAN[a.child_id] ?? a.child_id})` : ""}`);
        });
        lines.push("");
      }

      const context = lines.join("\n");

      const res = await fetch("/api/v1/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "pattern_scan",
          stream: false,
          source_content: context,
          prompt: "Scan the provided home intelligence data and identify any significant patterns, themes, or concerns that require attention.",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `ARIA returned ${res.status}`);
      }

      const json = await res.json();
      const parsed = json?.data?.parsed;

      if (!Array.isArray(parsed)) {
        throw new Error("ARIA returned unexpected data — expected an array of patterns");
      }

      setPatterns(parsed as ScannedPattern[]);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Unknown error during scan");
    } finally {
      setScanning(false);
    }
  }

  async function handleSavePattern(p: ScannedPattern, idx: number) {
    setSaveStates((prev) => ({ ...prev, [idx]: "saving" }));
    try {
      await createAlert.mutateAsync({
        alert_type:       p.alert_type,
        title:            p.title,
        description:      p.description,
        severity:         p.severity,
        child_id:         p.child_id ?? undefined,
        reflective_prompt: p.reflective_prompt,
        period_start:     p.period_start,
        period_end:       p.period_end,
        home_id:          homeId,
        status:           "active",
        detected_at:      new Date().toISOString(),
        evidence_refs:    [],
      });
      setSaveStates((prev) => ({ ...prev, [idx]: "saved" }));
    } catch {
      setSaveStates((prev) => ({ ...prev, [idx]: "idle" }));
    }
  }

  return (
    <Card className="border-violet-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ScanSearch className="h-4 w-4 text-violet-500" />
            ARIA Pattern Scanner
          </CardTitle>
          <Button
            size="sm"
            className={cn(
              "gap-1.5 text-xs",
              scanning ? "bg-violet-400" : "bg-violet-600 hover:bg-violet-700 text-white"
            )}
            onClick={handleScan}
            disabled={scanning}
          >
            {scanning ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />Scanning…</>
            ) : (
              <><ScanSearch className="h-3.5 w-3.5" />{patterns !== null ? "Re-scan" : "Scan Now"}</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!patterns && !scanning && !scanError && (
          <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-xs text-violet-700 leading-relaxed">
            ARIA will analyse all available intelligence data across the home — voice records,
            interventions, action outcomes, and existing alerts — and identify significant
            patterns, emerging themes, or concerns requiring manager attention.
          </div>
        )}

        {scanError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {scanError}
          </div>
        )}

        {scanning && (
          <div className="flex items-center gap-3 py-6 text-xs text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
            ARIA is scanning intelligence data across all children…
          </div>
        )}

        {patterns !== null && !scanning && (
          patterns.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-300" />
              <p className="text-sm font-semibold text-slate-700">No significant patterns detected</p>
              <p className="text-xs text-slate-400">ARIA found no new patterns requiring attention at this time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500">
                ARIA identified <strong>{patterns.length}</strong> pattern{patterns.length !== 1 ? "s" : ""}.
                Review each and save any that are accurate to add them to active alerts.
              </p>
              {patterns.map((p, idx) => {
                const saveState = saveStates[idx] ?? "idle";
                return (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-xl border p-4 space-y-2",
                      SEV_CLASSES_SCAN[p.severity] ?? "border-slate-200 bg-slate-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                            p.severity === "critical" ? "bg-red-200 text-red-800" :
                            p.severity === "high"     ? "bg-orange-200 text-orange-800" :
                            p.severity === "medium"   ? "bg-amber-200 text-amber-700" :
                            "bg-slate-200 text-slate-600"
                          )}>
                            {p.severity}
                          </span>
                          {p.child_id && (
                            <span className="rounded-full bg-white/60 border border-current/30 px-2 py-0.5 text-[9px] font-semibold">
                              {CHILD_NAME_MAP_SCAN[p.child_id] ?? p.child_id}
                            </span>
                          )}
                          <span className="text-xs font-bold">{p.title}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed opacity-90">{p.description}</p>
                        {p.reflective_prompt && (
                          <p className="text-[11px] italic opacity-75 border-l-2 border-current/30 pl-2">
                            💭 {p.reflective_prompt}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0">
                        {saveState === "saved" ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />Saved
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-[10px] gap-1 bg-white/70 hover:bg-white border-current/30"
                            onClick={() => handleSavePattern(p, idx)}
                            disabled={saveState === "saving"}
                          >
                            {saveState === "saving"
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <><Plus className="h-3 w-3" />Save</>
                            }
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntelligenceHubPage() {
  return (
    <PageShell
      title="Intelligence Hub"
      subtitle="Home climate · Patterns · Insights"
      showQuickCreate={false}
      actions={<SmartUploadButton variant="inline" label="Upload Intelligence Document" uploadContext="Intelligence Hub — intelligence or evidence document upload" />}
    >
      <div className="space-y-8 animate-fade-in">
        <HomeClimateSection />

        <div className="grid gap-5 lg:grid-cols-2">
          <PatternAlertsSection />
          <RecentInterventionsSection />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <VoiceCoverageSection />
          <ActionOutcomesSection />
        </div>

        {/* ARIA Pattern Scanner — full width */}
        <AriaPatternScanSection />
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
