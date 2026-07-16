"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SUCCESSION PLANNING BOARD
// Role coverage analysis, internal readiness scoring, candidate comparison,
// risk assessment, and Cara-powered gap analysis. Critical for demonstrating
// organisational resilience to Ofsted.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/common/print-button";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { cn } from "@/lib/utils";
import {
  GitBranch, Sparkles, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, ChevronDown, ChevronUp, User, Calendar,
  Users, TrendingUp, Shield, BarChart3, Star, Target, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useSuccessionPlans, useCompetencyProfiles } from "@/hooks/use-workforce";
import { useStaff } from "@/hooks/use-staff";
import { PATHWAY_STAGE_LABELS, type PathwayStage } from "@/types/extended";

const URGENCY_CONFIG: Record<string, { label: string; colour: string; order: number }> = {
  immediate:     { label: "Immediate",   colour: "text-red-700 bg-red-50 border-red-200",       order: 0 },
  six_months:    { label: "6 Months",    colour: "text-amber-700 bg-amber-50 border-amber-200", order: 1 },
  twelve_months: { label: "12 Months",   colour: "text-blue-700 bg-blue-50 border-blue-200",    order: 2 },
  long_term:     { label: "Long Term",   colour: "text-slate-700 bg-slate-50 border-slate-200", order: 3 },
};

const READINESS_COLOUR = (score: number) =>
  score >= 80 ? "text-emerald-600" : score >= 60 ? "text-blue-600" : score >= 40 ? "text-amber-600" : "text-red-600";
const READINESS_BG = (score: number) =>
  score >= 80 ? "bg-emerald-400" : score >= 60 ? "bg-blue-400" : score >= 40 ? "bg-amber-400" : "bg-red-400";

// ── Readiness Summary Chart ──────────────────────────────────────────────────

function ReadinessChart({
  plans,
  getStaffName,
}: {
  plans: Array<{ role_title: string; candidates: Array<{ staff_id: string; readiness_score: number; ready_now: boolean }> }>;
  getStaffName: (id: string) => string;
}) {
  const allCandidates = plans.flatMap((p) =>
    p.candidates.map((c) => ({
      ...c,
      role: p.role_title,
      name: getStaffName(c.staff_id),
    })),
  ).sort((a, b) => b.readiness_score - a.readiness_score);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[13px] flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-500" />
          Candidate Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {allCandidates.map((c) => (
          <div key={`${c.staff_id}-${c.role}`} className="flex items-center gap-2">
            <p className="text-[10px] text-slate-600 w-16 truncate shrink-0 font-medium">
              {c.name.split(" ")[0]}
            </p>
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", READINESS_BG(c.readiness_score))}
                style={{ width: `${c.readiness_score}%` }}
              />
            </div>
            <span className={cn("text-[10px] font-bold tabular-nums w-8 text-right", READINESS_COLOUR(c.readiness_score))}>
              {c.readiness_score}%
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Coverage Risk Assessment ─────────────────────────────────────────────────

function CoverageRisk({
  plans,
}: {
  plans: Array<{ role_title: string; urgency: string; candidates: Array<{ readiness_score: number; ready_now: boolean }> }>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[13px] flex items-center gap-2">
          <Shield className="h-4 w-4 text-indigo-500" />
          Coverage Risk
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {plans.map((plan) => {
          const readyNow = plan.candidates.filter((c) => c.ready_now).length;
          const bestScore = Math.max(...plan.candidates.map((c) => c.readiness_score), 0);
          const urgencyCfg = URGENCY_CONFIG[plan.urgency];
          const riskLevel = readyNow > 0 ? "covered" : bestScore >= 70 ? "developing" : "at risk";
          const riskColour = riskLevel === "covered" ? "text-emerald-600" : riskLevel === "developing" ? "text-amber-600" : "text-red-600";
          const riskBg = riskLevel === "covered" ? "bg-emerald-50 border-emerald-200" : riskLevel === "developing" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

          return (
            <div key={plan.role_title} className={cn("rounded-lg border p-2.5", riskBg)}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-semibold text-slate-800">{plan.role_title}</p>
                <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 border", urgencyCfg.colour)}>
                  {urgencyCfg.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-[10px] font-bold capitalize", riskColour)}>
                  {riskLevel === "at risk" ? "At Risk" : riskLevel === "developing" ? "Developing" : "Covered"}
                </span>
                <span className="text-[9px] text-slate-400">
                  {plan.candidates.length} candidate{plan.candidates.length !== 1 ? "s" : ""} · Best: {bestScore}%
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function SuccessionBoardPage() {
  const [showCara, setShowCara] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const successionQuery = useSuccessionPlans({ homeId: "home_oak" });
  const profilesQuery   = useCompetencyProfiles({ homeId: "home_oak" });
  const staffQuery      = useStaff();

  const plans    = successionQuery.data?.data ?? [];
  const profiles = profilesQuery.data?.data ?? [];
  const staff    = staffQuery.data?.data ?? [];

  const getStaffName = (id: string) => staff.find((s) => s.id === id)?.full_name ?? id;
  const getProfile   = (staffId: string) => profiles.find((p) => p.staff_id === staffId);

  // ── Export data ────────────────────────────────────────────────────────────
  type SuccExportRow = { role: string; urgency: string; stage: string; candidate: string; readiness: string; ready_now: string; est_ready: string; notes: string };

  const succExportCols: ExportColumn<SuccExportRow>[] = [
    { header: "Role", accessor: (r) => r.role },
    { header: "Urgency", accessor: (r) => r.urgency },
    { header: "Target Stage", accessor: (r) => r.stage },
    { header: "Candidate", accessor: (r) => r.candidate },
    { header: "Readiness", accessor: (r) => r.readiness },
    { header: "Ready Now", accessor: (r) => r.ready_now },
    { header: "Est. Ready Date", accessor: (r) => r.est_ready },
    { header: "Notes", accessor: (r) => r.notes },
  ];

  const succExportData = useMemo((): SuccExportRow[] =>
    plans.flatMap((plan) =>
      plan.candidates.map((c) => ({
        role: plan.role_title,
        urgency: URGENCY_CONFIG[plan.urgency]?.label ?? plan.urgency,
        stage: PATHWAY_STAGE_LABELS[plan.target_stage],
        candidate: getStaffName(c.staff_id),
        readiness: `${c.readiness_score}%`,
        ready_now: c.ready_now ? "Yes" : "No",
        est_ready: c.estimated_ready_date ?? "",
        notes: c.notes ?? "",
      })),
    ),
  [plans, staff]);

  const filteredPlans = useMemo(() => {
    if (!search.trim()) return plans;
    const q = search.toLowerCase();
    return plans.filter((p) => {
      const candidateNames = p.candidates.map((c) => getStaffName(c.staff_id)).join(" ");
      const hay = [p.role_title, p.urgency, candidateNames, p.cara_narrative || ""].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [plans, search, staff]);

  // Stats
  const totalCandidates = plans.reduce((s, p) => s + p.candidates.length, 0);
  const readyNowCount   = plans.reduce((s, p) => s + p.candidates.filter((c) => c.ready_now).length, 0);
  const rolesAtRisk     = plans.filter((p) => !p.candidates.some((c) => c.ready_now) && !p.candidates.some((c) => c.readiness_score >= 70)).length;
  const avgReadiness    = totalCandidates > 0
    ? Math.round(plans.flatMap((p) => p.candidates).reduce((s, c) => s + c.readiness_score, 0) / totalCandidates)
    : 0;

  return (
    <PageShell
      title="Succession Planning Board"
      subtitle="Role coverage, internal readiness & Cara gap analysis"
      caraContext={{ pageTitle: "Succession Planning Board", sourceType: "staff" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            filename="succession-planning"
            columns={succExportCols}
            data={succExportData}
            label="Export"
          />
          <PrintButton title="Succession Planning Report" subtitle="Workforce" targetId="succession-content" />
          <SmartUploadButton variant="inline" label="Upload Evidence" uploadContext="Workforce Intelligence — succession plan or leadership evidence document upload" />
          <Button
            size="sm"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setShowCara((p) => !p)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Cara Analysis
          </Button>
          <Link href="/workforce">
            <Button variant="outline" size="sm">Workforce Hub</Button>
          </Link>
          <CaraStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="succession-content" className="space-y-4 animate-fade-in">

        {/* ── Cara Panel ──────────────────────────────────────────────────── */}
        {showCara && (
          <div className="relative">
            <button onClick={() => setShowCara(false)} className="absolute top-3 right-3 z-10 text-slate-400 hover:text-slate-600 text-xs">✕ Close</button>
            <CaraPanel
              mode="staff_development_summary"
              pageContext={`Succession board: ${plans.length} active succession plans. ${plans.map((p) => `${p.role_title}: ${p.candidates.length} candidates, urgency ${p.urgency}`).join(". ")}`}
            />
          </div>
        )}

        {/* ── KPI Banner ──────────────────────────────────────────────────── */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {[
            {
              label: "Roles Planned", value: plans.length,
              colour: "text-indigo-700",
              icon: <GitBranch className="h-4 w-4 text-indigo-500" />,
            },
            {
              label: "Total Candidates", value: totalCandidates,
              colour: "text-blue-700",
              icon: <Users className="h-4 w-4 text-blue-500" />,
            },
            {
              label: "Ready Now", value: readyNowCount,
              colour: readyNowCount > 0 ? "text-emerald-700" : "text-amber-700",
              icon: <CheckCircle2 className={cn("h-4 w-4", readyNowCount > 0 ? "text-emerald-500" : "text-amber-500")} />,
            },
            {
              label: "Roles at Risk", value: rolesAtRisk,
              colour: rolesAtRisk > 0 ? "text-red-700" : "text-emerald-700",
              bg: rolesAtRisk > 0 ? "border-red-200 bg-red-50" : "",
              icon: <AlertTriangle className={cn("h-4 w-4", rolesAtRisk > 0 ? "text-red-500" : "text-emerald-500")} />,
            },
          ].map(({ label, value, colour, bg, icon }) => (
            <div key={label} className={cn("rounded-xl border border-slate-100 bg-white p-3 text-center", bg)}>
              <div className="flex justify-center mb-1">{icon}</div>
              <div className={cn("text-xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Analysis Row ────────────────────────────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-2">
          <CoverageRisk plans={plans} />
          <ReadinessChart plans={plans} getStaffName={getStaffName} />
        </div>

        {/* ── Search ──────────────────────────────────────────────────────── */}
        {plans.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search plans or candidates…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            {search.trim() && (
              <span className="text-xs text-slate-400">{filteredPlans.length} of {plans.length} plans</span>
            )}
          </div>
        )}

        {/* ── Succession Plans ────────────────────────────────────────────── */}
        {filteredPlans.length === 0 && !search.trim() ? (
          <div className="text-center py-16 text-slate-500">
            <GitBranch className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No succession plans configured</p>
            <p className="text-xs mt-1">Use Cara to generate initial succession recommendations</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Search className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No plans match your search</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPlans.map((plan) => {
              const urgency = URGENCY_CONFIG[plan.urgency] ?? URGENCY_CONFIG.long_term;
              const isExpanded = expandedPlan === plan.id;

              return (
                <div key={plan.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  {/* Header */}
                  <button
                    onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100 text-left hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <GitBranch className="h-4 w-4 text-slate-500" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-800">{plan.role_title}</p>
                          <Badge variant="outline" className={cn("text-[10px] border", urgency.colour)}>
                            {urgency.label}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {PATHWAY_STAGE_LABELS[plan.target_stage]} · {plan.candidates.length} candidate{plan.candidates.length !== 1 ? "s" : ""}
                          {plan.review_date && ` · Review: ${plan.review_date}`}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>

                  {/* Candidates — always visible */}
                  <div className="p-4 space-y-3">
                    {plan.candidates.map((candidate, cidx) => {
                      const profile = getProfile(candidate.staff_id);
                      return (
                        <div key={candidate.staff_id} className={cn(
                          "rounded-xl border p-3",
                          candidate.ready_now ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-white",
                        )}>
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                              candidate.ready_now ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700",
                            )}>
                              #{cidx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <Link href={`/workforce/staff/${candidate.staff_id}`} className="text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors">
                                  {getStaffName(candidate.staff_id)}
                                </Link>
                                {candidate.ready_now ? (
                                  <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">
                                    <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                    Ready Now
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-200 bg-amber-50">
                                    <Clock className="h-2.5 w-2.5 mr-1" />
                                    In Development
                                  </Badge>
                                )}
                              </div>

                              {/* Readiness bar */}
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className={cn("h-full rounded-full transition-all", READINESS_BG(candidate.readiness_score))}
                                    style={{ width: `${candidate.readiness_score}%` }}
                                  />
                                </div>
                                <span className={cn("text-xs font-bold shrink-0 tabular-nums", READINESS_COLOUR(candidate.readiness_score))}>
                                  {candidate.readiness_score}%
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-[10px] text-slate-400 flex-wrap">
                                {profile && (
                                  <span className="flex items-center gap-0.5">
                                    <Target className="h-2.5 w-2.5" />
                                    Current: {PATHWAY_STAGE_LABELS[profile.current_stage]}
                                  </span>
                                )}
                                {candidate.estimated_ready_date && (
                                  <span className="flex items-center gap-0.5">
                                    <Calendar className="h-2.5 w-2.5" />
                                    Est. ready: {candidate.estimated_ready_date}
                                  </span>
                                )}
                                {candidate.development_plan_id && (
                                  <Link href="/workforce/cara-planner" className="text-indigo-600 hover:underline flex items-center gap-0.5">
                                    <TrendingUp className="h-2.5 w-2.5" />
                                    Dev plan →
                                  </Link>
                                )}
                              </div>

                              {candidate.notes && (
                                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{candidate.notes}</p>
                              )}
                            </div>
                            <Link href={`/workforce/staff/${candidate.staff_id}`}>
                              <ChevronRight className="h-4 w-4 text-slate-300 hover:text-slate-500 transition-colors shrink-0" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cara Narrative — in expanded mode */}
                  {isExpanded && plan.cara_narrative && (
                    <div className="mx-4 mb-4 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5">
                      <p className="text-[10px] font-semibold text-indigo-600 mb-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Cara Succession Intelligence
                      </p>
                      <p className="text-xs text-indigo-800 leading-relaxed">{plan.cara_narrative}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Regulatory Footer ───────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Regulatory Basis — </span>
          Children&apos;s Homes Regulations 2015: Reg 5 (fit and proper person), Reg 29 (RM qualifications).
          Providers must evidence organisational resilience and succession planning to Ofsted (ILACS).
        </div>
      </div>
    </PageShell>
  );
}
