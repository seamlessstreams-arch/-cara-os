"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RI COMMAND CENTRE HUB
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useRiChallengeLogs,
  useRiAlerts,
  useRiReg45Evidence,
  useRiGovernanceReports,
  useTrainingNeeds,
} from "@/hooks/use-ri-learning";
import { useIncidents } from "@/hooks/use-incidents";
import { useSupervisions } from "@/hooks/use-supervision";
import { useTraining } from "@/hooks/use-training";
import { useAudits } from "@/hooks/use-audits";
import { computeRiScores } from "@/lib/ri/compute-scores";
import { useAuthContext } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import {
  Shield, BarChart3, FileText, ClipboardCheck, AlertTriangle,
  CheckCircle2, ChevronRight, TrendingUp, BookOpen, Gavel,
  Building2, Sparkles, Eye, Award, Zap,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";


// ── Score pill ─────────────────────────────────────────────────────────────────
function ScorePill({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const colour =
    score >= 80 ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : score >= 65 ? "bg-amber-100 text-amber-700 border-amber-200"
    : score >= 50 ? "bg-orange-100 text-orange-700 border-orange-200"
    : "bg-red-100 text-red-700 border-red-200";
  const sizes = { sm: "text-xs px-2 py-0.5", md: "text-sm px-2.5 py-1 font-semibold", lg: "text-xl px-3 py-1.5 font-bold" };
  return (
    <span className={cn("rounded-full border tabular-nums", colour, sizes[size])}>
      {score}
    </span>
  );
}

// ── Governance metric row ──────────────────────────────────────────────────────
function MetricBar({ label, score, max = 100 }: { label: string; score: number; max?: number }) {
  const pct = Math.round((score / max) * 100);
  const barColour = score >= 80 ? "bg-emerald-500" : score >= 65 ? "bg-amber-400" : score >= 50 ? "bg-orange-400" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--cs-text-secondary)]">{label}</span>
        <ScorePill score={score} size="sm" />
      </div>
      <div className="h-1.5 rounded-full bg-slate-100">
        <div className={cn("h-1.5 rounded-full transition-all", barColour)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({
  href, title, description, icon: Icon, colour, bg, badge,
}: {
  href: string; title: string; description: string;
  icon: React.ElementType; colour: string; bg: string; badge?: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="border border-[var(--cs-border-subtle)] transition-all hover:shadow-md hover:-translate-y-0.5 h-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", bg)}>
              <Icon className={cn("h-4.5 w-4.5", colour)} style={{ width: "1.125rem", height: "1.125rem" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--cs-navy)]">{title}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {badge && (
                    <Badge variant="destructive" className="text-[10px] h-4 px-1.5">{badge}</Badge>
                  )}
                  <ChevronRight className="h-4 w-4 text-[var(--cs-text-gentle)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <p className="text-xs text-[var(--cs-text-muted)] mt-0.5 leading-relaxed">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RiHubPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const { data: challengeData } = useRiChallengeLogs({ homeId: homeId });
  const { data: alertData } = useRiAlerts({ homeId: homeId });
  const { data: reg45Data } = useRiReg45Evidence({ homeId: homeId });
  const { data: reportsData } = useRiGovernanceReports({ homeId: homeId });
  const { data: trainingData } = useTrainingNeeds({ homeId: homeId });
  const { data: incidentsData } = useIncidents();
  const { data: supervisionData } = useSupervisions();
  const { data: trainingRecordsData } = useTraining();
  const { data: auditsData } = useAudits();
  const { data: medicationAuditsData } = useAudits({ category: "medication" });

  const scores = useMemo(() => computeRiScores({
    trainingNeeds: trainingData?.data ?? [],
    trainingRecords: trainingRecordsData?.data ?? [],
    alerts: alertData?.data ?? [],
    incidents: incidentsData?.data ?? [],
    supervisionsMeta: supervisionData?.meta as { overdue?: number } | undefined,
    auditsMeta: auditsData?.meta as { overdue?: number } | undefined,
    audits: auditsData?.data ?? [],
    medicationAudits: medicationAuditsData?.data ?? [],
    reg45Items: reg45Data?.data ?? [],
    challenges: challengeData?.data ?? [],
  }), [trainingData, trainingRecordsData, alertData, incidentsData, supervisionData, auditsData, medicationAuditsData, reg45Data, challengeData]);

  const openChallenges = useMemo(() =>
    (challengeData?.data ?? []).filter((c) => c.status === "open" || c.status === "action_pending"),
    [challengeData]);
  const criticalAlerts = useMemo(() =>
    (alertData?.data ?? []).filter((a) => !a.is_resolved && a.severity === "critical"),
    [alertData]);
  const unresolvedAlerts = useMemo(() =>
    (alertData?.data ?? []).filter((a) => !a.is_resolved),
    [alertData]);
  const latestReg45 = (reg45Data?.data ?? [])[0];
  const urgentTraining = useMemo(() =>
    (trainingData?.data ?? []).filter((n) => n.priority === "urgent" && !["completed","no_action"].includes(n.status)),
    [trainingData]);

  const hasCritical = criticalAlerts.length > 0;
  const overallScore = scores.overall_governance_score;
  const riskLevel = overallScore >= 80 ? "LOW RISK" : overallScore >= 65 ? "MEDIUM RISK" : overallScore >= 50 ? "HIGH RISK" : "CRITICAL";
  const riskColour = overallScore >= 80 ? "bg-emerald-500/20 text-emerald-200" : overallScore >= 65 ? "bg-amber-500/20 text-amber-200" : overallScore >= 50 ? "bg-orange-500/20 text-orange-200" : "bg-red-500/20 text-red-200";

  return (
    <PageShell
      title="RI Command Centre"
      subtitle="Responsible Individual governance dashboard — Chamberlain House"
      ariaContext={{ pageTitle: "RI Oversight Dashboard", sourceType: "general" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Responsible Individual" subtitle="Chamberlain House — RI Oversight Dashboard" targetId="ri-content" />
          <SmartUploadButton variant="inline" label="Upload Document" uploadContext="RI — governance document upload" />
          <Link href="/ri/scorecard">
            <Button variant="outline" size="sm" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Full Scorecard
            </Button>
          </Link>
          <AriaStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="ri-content" className="space-y-6 animate-fade-in">

        {/* Critical banner */}
        {hasCritical && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-300 bg-red-50 p-4">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm font-semibold text-red-700">
              {criticalAlerts.length} critical RI alert{criticalAlerts.length !== 1 ? "s" : ""} require immediate attention.
            </p>
            <Link href="/ri/alerts" className="ml-auto shrink-0">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-8">
                Review Alerts
              </Button>
            </Link>
          </div>
        )}

        {/* Header banner */}
        <div className="rounded-2xl bg-slate-900 p-6 text-white space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
                <Gavel className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">RI Command Centre</h2>
                <p className="text-sm text-[var(--cs-text-gentle)]">Strategic governance for Chamberlain House</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-2 justify-end">
                <div className="text-3xl font-bold text-white tabular-nums">{overallScore}</div>
                <span className={cn("text-[10px] font-semibold rounded-full px-2 py-0.5", riskColour)}>{riskLevel}</span>
              </div>
              <div className="flex items-center gap-1 justify-end mt-1">
                <Zap className="h-3 w-3 text-indigo-400" />
                <span className="text-[10px] text-[var(--cs-text-muted)]">live governance score</span>
              </div>
            </div>
          </div>
          {/* Governance bar chart */}
          <div className="grid gap-2 sm:grid-cols-2">
            <MetricBar label="Safeguarding Oversight" score={scores.safeguarding_oversight_score} />
            <MetricBar label="Incident Management" score={scores.incident_management_score} />
            <MetricBar label="Reg 45 Compliance" score={scores.reg45_compliance_score} />
            <MetricBar label="Staff Supervision" score={scores.staff_supervision_score} />
            <MetricBar label="Training Compliance" score={scores.training_compliance_score} />
            <MetricBar label="Oversight Quality" score={scores.oversight_quality_score} />
            <MetricBar label="Challenge Log" score={scores.challenge_log_score} />
            <MetricBar label="Child Voice" score={scores.child_voice_score} />
          </div>
          <div className="flex flex-wrap gap-2 pt-1 border-t border-white/10">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-[var(--cs-text-gentle)]">Chamberlain House</span>
            <span className="rounded-full bg-[var(--cs-navy)]/40 px-3 py-1 text-xs text-indigo-200">Reg 17 / Reg 44 / Reg 45</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-[var(--cs-text-gentle)]">ILACS Framework</span>
          </div>
        </div>

        {/* Stat row */}
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Open Challenges", value: openChallenges.length, icon: Gavel, colour: openChallenges.length > 0 ? "text-amber-600" : "text-emerald-600", bg: openChallenges.length > 0 ? "bg-amber-50" : "bg-emerald-50", href: "/ri/challenge-log" },
            { label: "Active Alerts", value: unresolvedAlerts.length, icon: AlertTriangle, colour: unresolvedAlerts.length > 0 ? "text-red-600" : "text-emerald-600", bg: unresolvedAlerts.length > 0 ? "bg-red-50" : "bg-emerald-50", href: "/ri/alerts" },
            { label: "Reg 45 Status", value: latestReg45?.status ?? "None", icon: FileText, colour: "text-blue-600", bg: "bg-blue-50", href: "/ri/reg45" },
            { label: "Urgent Training", value: urgentTraining.length, icon: BookOpen, colour: urgentTraining.length > 0 ? "text-orange-600" : "text-emerald-600", bg: urgentTraining.length > 0 ? "bg-orange-50" : "bg-emerald-50", href: "/learning/training-needs" },
          ].map(({ label, value, icon: Icon, colour, bg, href }) => (
            <Link key={label} href={href} className="group">
              <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-white p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", bg)}>
                  <Icon className={cn("h-4.5 w-4.5", colour)} style={{ width: "1.125rem", height: "1.125rem" }} />
                </div>
                <div>
                  <div className="text-lg font-bold text-[var(--cs-navy)]">{value}</div>
                  <div className="text-[10px] text-[var(--cs-text-muted)]">{label}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Feature grid */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--cs-text-secondary)] mb-4">RI Tools</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard
              href="/ri/scorecard"
              title="Governance Scorecard"
              description="15 live governance metrics with trend analysis and ARIA commentary"
              icon={BarChart3}
              colour="text-indigo-600"
              bg="bg-indigo-50"
            />
            <FeatureCard
              href="/ri/reg45"
              title="Regulation 45 Engine"
              description="Pull evidence, draft Reg 45 reports, track submissions"
              icon={FileText}
              colour="text-blue-600"
              bg="bg-blue-50"
              badge={latestReg45?.status === "draft" || !latestReg45 ? "Due" : undefined}
            />
            <FeatureCard
              href="/ri/ofsted"
              title="Ofsted Readiness"
              description="Mock inspection review, ILACS checklist, question preparation"
              icon={Award}
              colour="text-[var(--cs-aria-gold)]"
              bg="bg-[var(--cs-aria-gold-bg)]"
            />
            <FeatureCard
              href="/ri/challenge-log"
              title="Challenge Log"
              description="Record, track and escalate RI challenges to the management team"
              icon={Gavel}
              colour="text-amber-600"
              bg="bg-amber-50"
              badge={openChallenges.length > 0 ? String(openChallenges.length) : undefined}
            />
            <FeatureCard
              href="/ri/alerts"
              title="RI Alerts"
              description="Automatically detected governance risks and compliance alerts"
              icon={AlertTriangle}
              colour="text-red-600"
              bg="bg-red-50"
              badge={unresolvedAlerts.length > 0 ? String(unresolvedAlerts.length) : undefined}
            />
            <FeatureCard
              href="/learning/training-needs"
              title="Training Intelligence"
              description="ARIA-identified training needs linked to governance evidence"
              icon={TrendingUp}
              colour="text-teal-600"
              bg="bg-teal-50"
              badge={urgentTraining.length > 0 ? `${urgentTraining.length} urgent` : undefined}
            />
          </div>
        </div>

        {/* ARIA RI intelligence prompt */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-semibold text-indigo-900">Ask ARIA for a Strategic Summary</p>
            <p className="text-xs text-indigo-700 leading-relaxed">
              ARIA can analyse all current data and generate a strategic governance summary, challenge questions for the manager, or a full Ofsted readiness review.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/ri/scorecard?mode=strategic">
                <Button size="sm" className="bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white text-xs h-8 gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Strategic Analysis
                </Button>
              </Link>
              <Link href="/ri/ofsted?mode=readiness">
                <Button size="sm" variant="outline" className="border-indigo-300 text-indigo-700 text-xs h-8 gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  Ofsted Readiness
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Governance notice */}
        <div className="rounded-2xl border border-[var(--cs-border)] bg-slate-50 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[var(--cs-text-secondary)]">RI Independent Oversight</p>
            <p className="text-xs text-[var(--cs-text-muted)] leading-relaxed mt-0.5">
              This Command Centre supports the RI role under Regulation 15 and Schedule 2 of the Children's Homes (England) Regulations 2015.
              All AI-generated analysis requires RI review and professional judgement before any governance action is taken.
            </p>
          </div>
        </div>

      </div>
      <CareEventsPanel
        title="Care Events — Compliance Evidence"
        category="general"
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="RI Oversight Dashboard — responsible individual oversight, governance alerts, compliance status, quality standards, safeguarding indicators, regulation compliance, Reg 44/45 evidence, Ofsted readiness"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}
