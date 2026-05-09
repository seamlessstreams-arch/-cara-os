"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRiChallengeLogs, useRiAlerts, useRiReg45Evidence, useTrainingNeeds } from "@/hooks/use-ri-learning";
import { useIncidents } from "@/hooks/use-incidents";
import { useSupervisions } from "@/hooks/use-supervision";
import { useTraining } from "@/hooks/use-training";
import { useAudits } from "@/hooks/use-audits";
import { useForms } from "@/hooks/use-forms";
import { useDailyLog } from "@/hooks/use-daily-log";
import { useRecruitment } from "@/hooks/use-recruitment";
import { useYoungPeople } from "@/hooks/use-young-people";
import { computeRiScores } from "@/lib/ri/compute-scores";
import { Sparkles, TrendingUp, TrendingDown, Minus, BarChart3, Zap, CircleDot, Shield, Users, Heart, Building2, FileCheck } from "lucide-react";
import { api } from "@/hooks/use-api";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";


type StrategicResult = {
  overall_governance_narrative: string;
  safeguarding_analysis: string;
  outcome_evidence: string;
  management_effectiveness: string;
  compliance_position: string;
  key_strengths: string[];
  areas_requiring_attention: string[];
  immediate_ri_actions: string[];
  challenge_questions_for_manager: string[];
  ofsted_readiness_summary: string;
  risk_level: string;
};

function ScoreBar({ label, score, prev }: { label: string; score: number; prev?: number }) {
  const colour = score >= 80 ? "bg-emerald-500" : score >= 65 ? "bg-amber-400" : score >= 50 ? "bg-orange-400" : "bg-red-500";
  const textColour = score >= 80 ? "text-emerald-700" : score >= 65 ? "text-amber-700" : score >= 50 ? "text-orange-700" : "text-red-700";
  const delta = prev !== undefined ? score - prev : undefined;

  return (
    <div className="group space-y-1.5 p-3 rounded-xl hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 font-medium">{label}</span>
        <div className="flex items-center gap-1.5">
          {delta !== undefined && (
            <span className={cn("text-[10px]", delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-600" : "text-slate-400")}>
              {delta > 0 ? <TrendingUp className="h-3 w-3 inline" /> : delta < 0 ? <TrendingDown className="h-3 w-3 inline" /> : <Minus className="h-3 w-3 inline" />}
              {delta !== 0 && ` ${Math.abs(delta)}`}
            </span>
          )}
          <span className={cn("font-bold tabular-nums", textColour)}>{score}</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={cn("h-2 rounded-full transition-all", colour)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

interface MetricDef { key: string; label: string; live: boolean }
interface MetricGroup { label: string; icon: React.ElementType; colour: string; metrics: MetricDef[] }

const METRIC_GROUPS: MetricGroup[] = [
  {
    label: "Safeguarding & Children", icon: Shield, colour: "text-red-600",
    metrics: [
      { key: "safeguarding_oversight_score", label: "Safeguarding Oversight", live: true },
      { key: "incident_management_score",    label: "Incident Management",    live: true },
      { key: "missing_episodes_score",       label: "Missing Episodes",       live: true },
      { key: "child_voice_score",            label: "Child Voice",            live: true },
      { key: "outcome_evidence_score",       label: "Outcome Evidence",       live: true },
    ],
  },
  {
    label: "Workforce & Supervision", icon: Users, colour: "text-blue-600",
    metrics: [
      { key: "staff_supervision_score",     label: "Staff Supervision",     live: true },
      { key: "training_compliance_score",   label: "Training Compliance",   live: true },
      { key: "recruitment_compliance_score", label: "Recruitment Compliance", live: true },
    ],
  },
  {
    label: "Care Quality", icon: Heart, colour: "text-violet-600",
    metrics: [
      { key: "medication_governance_score", label: "Medication Governance", live: true },
      { key: "care_planning_score",         label: "Care Planning",         live: true },
      { key: "complaint_management_score",  label: "Complaint Management",  live: true },
    ],
  },
  {
    label: "Governance & Compliance", icon: FileCheck, colour: "text-emerald-600",
    metrics: [
      { key: "reg45_compliance_score",  label: "Reg 45 Compliance",  live: true },
      { key: "oversight_quality_score", label: "Oversight Quality",  live: true },
      { key: "challenge_log_score",     label: "Challenge Log",      live: true },
      { key: "building_safety_score",   label: "Building Safety",    live: true },
    ],
  },
];

const ALL_METRICS = METRIC_GROUPS.flatMap((g) => g.metrics);

function clamp(v: number, min: number, max: number) { return Math.min(max, Math.max(min, Math.round(v))); }

export default function ScorecardPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [aria, setAria] = useState<StrategicResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: trainingNeedsData } = useTrainingNeeds({ homeId: homeId });
  const { data: challengeData } = useRiChallengeLogs({ homeId: homeId });
  const { data: alertData } = useRiAlerts({ homeId: homeId });
  const { data: reg45Data } = useRiReg45Evidence({ homeId: homeId });
  const { data: incidentsData } = useIncidents();
  const { data: supervisionData } = useSupervisions();
  const { data: trainingRecordsData } = useTraining();
  const { data: auditsData } = useAudits();
  const { data: medicationAuditsData } = useAudits({ category: "medication" });
  const { data: formsData } = useForms();
  const { data: dailyLogData } = useDailyLog({ days: 30 });
  const { data: recruitmentData } = useRecruitment();
  const { data: ypData } = useYoungPeople("current");

  const scores = useMemo(() => computeRiScores({
    trainingNeeds: trainingNeedsData?.data ?? [],
    trainingRecords: trainingRecordsData?.data ?? [],
    alerts: alertData?.data ?? [],
    incidents: incidentsData?.data ?? [],
    supervisionsMeta: supervisionData?.meta as { overdue?: number } | undefined,
    auditsMeta: auditsData?.meta as { overdue?: number } | undefined,
    audits: auditsData?.data ?? [],
    medicationAudits: medicationAuditsData?.data ?? [],
    reg45Items: reg45Data?.data ?? [],
    challenges: challengeData?.data ?? [],
    careForms: formsData?.data ?? [],
    dailyLogs: dailyLogData?.data ?? [],
    activeCandidates: recruitmentData?.candidates ?? [],
    ypCount: (ypData?.data ?? []).length,
  }), [trainingNeedsData, trainingRecordsData, alertData, incidentsData, supervisionData, auditsData, medicationAuditsData, reg45Data, challengeData, formsData, dailyLogData, recruitmentData, ypData]);

  const urgentNeeds = (trainingNeedsData?.data ?? []).filter((n) => n.priority === "urgent" && !["completed", "no_action"].includes(n.status)).length;
  const overallScore = scores.overall_governance_score;
  const riskLevel = overallScore >= 80 ? "low" : overallScore >= 65 ? "medium" : overallScore >= 50 ? "high" : "critical";
  const riskColour = riskLevel === "low" ? "text-emerald-700 bg-emerald-100" : riskLevel === "medium" ? "text-amber-700 bg-amber-100" : riskLevel === "high" ? "text-orange-700 bg-orange-100" : "text-red-700 bg-red-100";
  const liveMetricCount = ALL_METRICS.filter((m) => m.live).length;

  const generateStrategic = async () => {
    setLoading(true);
    try {
      const res = await api.post<{ data: { parsed?: StrategicResult } }>(
        "/aria",
        {
          mode: "ri_strategic_analysis",
          style: "provider_summary",
          source_content: `Oak House governance scorecard (live data). Overall: ${overallScore}/100. Risk level: ${riskLevel}. ${urgentNeeds} urgent training needs. Metrics: ${ALL_METRICS.map((m) => `${m.label}: ${(scores as unknown as Record<string, number>)[m.key]}`).join(", ")}.`,
          page_context: "RI Governance Scorecard",
          record_type: "governance_analysis",
          user_role: "responsible_individual",
        }
      );
      const parsed = res.data?.parsed;
      if (parsed) setAria(parsed);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Governance Scorecard"
      subtitle="15 live governance metrics — Oak House"
      ariaContext={{ pageTitle: "Oak House — RI Report", sourceType: "child_record" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Governance Scorecard" subtitle="Oak House — RI Report" targetId="scorecard-content" />
          <SmartUploadButton variant="inline" label="Upload Evidence" uploadContext="RI Scorecard — governance evidence upload" />
          <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={generateStrategic} disabled={loading}>
            <Sparkles className="h-3.5 w-3.5" />
            {loading ? "Analysing…" : "ARIA Strategic Analysis"}
          </Button>
        </div>
      }
    >
      <div id="scorecard-content" className="space-y-6 animate-fade-in">
        {/* Overall */}
        <div className="rounded-2xl bg-slate-900 p-6 text-white flex items-center gap-6">
          <div className="text-center shrink-0">
            <div className="text-6xl font-bold tabular-nums">{overallScore}</div>
            <div className="text-xs text-slate-400 mt-1">Overall Score</div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-400 shrink-0" />
              <span className="text-sm font-semibold text-white">Oak House Governance</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold ml-auto", riskColour)}>
                {riskLevel.toUpperCase()} RISK
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] text-slate-400">{liveMetricCount} of {ALL_METRICS.length} metrics computed from live data</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div
                className={cn("h-2 rounded-full transition-all", overallScore >= 80 ? "bg-emerald-400" : overallScore >= 65 ? "bg-amber-400" : "bg-red-500")}
                style={{ width: `${overallScore}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">Composite of 15 governance indicators. Safeguarding weighted 2×.</p>
          </div>
        </div>

        {/* Traffic light summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Green (80+)", count: ALL_METRICS.filter((m) => ((scores as unknown as Record<string, number>)[m.key] ?? 0) >= 80).length, colour: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-400" },
            { label: "Amber (65-79)", count: ALL_METRICS.filter((m) => { const s = (scores as unknown as Record<string, number>)[m.key] ?? 0; return s >= 65 && s < 80; }).length, colour: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-400" },
            { label: "Red (<65)", count: ALL_METRICS.filter((m) => ((scores as unknown as Record<string, number>)[m.key] ?? 0) < 65).length, colour: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-400" },
          ].map((t) => (
            <div key={t.label} className={cn("rounded-xl border p-3 text-center", t.bg)}>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <div className={cn("w-3 h-3 rounded-full", t.dot)} />
              </div>
              <div className={cn("text-xl font-bold tabular-nums", t.colour)}>{t.count}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{t.label}</div>
            </div>
          ))}
        </div>

        {/* Grouped metrics */}
        <div className="grid gap-4 md:grid-cols-2">
          {METRIC_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            const avgScore = Math.round(
              group.metrics.reduce((s, m) => s + ((scores as unknown as Record<string, number>)[m.key] ?? 0), 0) / group.metrics.length,
            );
            return (
              <Card key={group.label}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[13px] flex items-center gap-2">
                      <GroupIcon className={cn("h-4 w-4", group.colour)} />
                      {group.label}
                    </CardTitle>
                    <span className={cn(
                      "text-sm font-bold tabular-nums",
                      avgScore >= 80 ? "text-emerald-700" : avgScore >= 65 ? "text-amber-700" : "text-red-700",
                    )}>
                      {avgScore}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 divide-y divide-slate-50">
                  {group.metrics.map((m) => (
                    <div key={m.key} className="flex items-center gap-2">
                      <div className="flex-1">
                        <ScoreBar label={m.label} score={(scores as unknown as Record<string, number>)[m.key] ?? 0} />
                      </div>
                      <span className={cn("shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border",
                        m.live
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : "text-slate-400 bg-slate-50 border-slate-200"
                      )}>
                        {m.live ? "LIVE" : "EST"}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ARIA strategic analysis */}
        {aria && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <p className="text-sm font-semibold text-indigo-900">ARIA Strategic Analysis</p>
              </div>
              <p className="text-sm text-indigo-800 leading-relaxed">{aria.overall_governance_narrative}</p>
            </div>
            {[
              { label: "Safeguarding", content: aria.safeguarding_analysis },
              { label: "Outcome Evidence", content: aria.outcome_evidence },
              { label: "Management Effectiveness", content: aria.management_effectiveness },
              { label: "Compliance Position", content: aria.compliance_position },
            ].map(({ label, content }) => content && (
              <div key={label}>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-sm text-slate-700 leading-relaxed">{content}</p>
                </div>
              </div>
            ))}
            {aria.challenge_questions_for_manager?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Challenge Questions for Manager</p>
                <div className="space-y-2">
                  {aria.challenge_questions_for_manager.map((q, i) => (
                    <div key={i} className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                      <p className="text-sm text-amber-900 leading-relaxed">
                        <span className="font-bold mr-2">{i + 1}.</span>{q}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
