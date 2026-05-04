"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CAREER PATHWAY LADDER
// Five-stage progression framework from Inductee to RI. Combines stage
// definitions, staff placement, readiness scoring, gap analysis, and
// development tracking into a single view for workforce planning.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PrintButton } from "@/components/common/print-button";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName as seedGetStaffName } from "@/lib/seed-data";
import {
  ChevronRight, ChevronDown, ChevronUp, Milestone, ArrowRight,
  CheckCircle2, Clock, User, TrendingUp, Star, Target,
  ArrowUpDown, Shield, Sparkles, GraduationCap, BarChart3, Users, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useCompetencyProfiles } from "@/hooks/use-workforce";
import { useStaff } from "@/hooks/use-staff";
import {
  PATHWAY_STAGE_LABELS, PATHWAY_STAGE_ORDER,
  COMPETENCY_DOMAIN_LABELS, ALL_COMPETENCY_DOMAINS,
  type PathwayStage, type StaffCompetencyProfile,
} from "@/types/extended";

// ── Stage Config ─────────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<PathwayStage, {
  colour: string; bgColour: string; borderColour: string; dotColour: string;
  min_score: number; description: string; requirements: string[];
}> = {
  inductee: {
    colour: "text-slate-700", bgColour: "bg-slate-100", borderColour: "border-slate-200", dotColour: "bg-slate-400",
    min_score: 0,
    description: "New starters within the first 90 days. Completing mandatory induction and supervised shifts.",
    requirements: ["DBS cleared", "Day 1 H&S induction", "YP profiles read", "Supervised shifts (min. 5)"],
  },
  rsw: {
    colour: "text-blue-700", bgColour: "bg-blue-50", borderColour: "border-blue-200", dotColour: "bg-blue-500",
    min_score: 30,
    description: "Core residential support worker role. Independent shifts, keywork, medication competent.",
    requirements: ["Induction complete", "Probation passed", "Level 3 Diploma enrolled (within 12m)", "Medication trained"],
  },
  senior_rsw: {
    colour: "text-sky-700", bgColour: "bg-sky-50", borderColour: "border-sky-200", dotColour: "bg-sky-500",
    min_score: 50,
    description: "Senior practice lead on shift. Mentors RSWs, takes lead on keywork and risk documentation.",
    requirements: ["Level 3 Diploma completed", "Avg competency ≥ 3 all domains", "2+ years experience", "Practice observation: Outstanding/Meets"],
  },
  team_leader: {
    colour: "text-violet-700", bgColour: "bg-violet-50", borderColour: "border-violet-200", dotColour: "bg-violet-500",
    min_score: 60,
    description: "Shift leader responsible for operational oversight, staff support, and quality assurance.",
    requirements: ["Level 3 Diploma (or Level 5 enrolled)", "Leadership competency ≥ 3", "Supervision delivered to ≥ 2 staff", "Appraisal: Good/Outstanding"],
  },
  deputy_manager: {
    colour: "text-amber-700", bgColour: "bg-amber-50", borderColour: "border-amber-200", dotColour: "bg-amber-500",
    min_score: 70,
    description: "Second in command. Deputises for RM, oversight of compliance, safeguarding lead.",
    requirements: ["Level 5 Diploma enrolled", "All domains ≥ 3", "Safeguarding Level 3", "Reg 44/45 experience", "RI readiness: 70%+"],
  },
  registered_manager: {
    colour: "text-emerald-700", bgColour: "bg-emerald-50", borderColour: "border-emerald-200", dotColour: "bg-emerald-500",
    min_score: 80,
    description: "Registered with Ofsted. Full regulatory and operational accountability for the home.",
    requirements: ["Level 5 Diploma completed", "All domains ≥ 4", "Ofsted registration", "RI readiness: 85%+"],
  },
  ri: {
    colour: "text-rose-700", bgColour: "bg-rose-50", borderColour: "border-rose-200", dotColour: "bg-rose-500",
    min_score: 90,
    description: "Responsible Individual with strategic oversight of the registered home.",
    requirements: ["Level 5 or above", "All domains ≥ 4", "Provider-level governance experience"],
  },
};

// ── Export columns ────────────────────────────────────────────────────────────

const PATHWAY_EXPORT_COLS: ExportColumn<StaffCompetencyProfile>[] = [
  { header: "Staff", accessor: (r) => seedGetStaffName(r.staff_id) },
  { header: "Current Stage", accessor: (r) => PATHWAY_STAGE_LABELS[r.current_stage] },
  { header: "Target Stage", accessor: (r) => r.target_stage ? PATHWAY_STAGE_LABELS[r.target_stage] : "" },
  { header: "Readiness Score", accessor: (r) => `${r.overall_readiness_score}%` },
  { header: "Strengths", accessor: (r) => r.strengths.join("; ") },
  { header: "Development Areas", accessor: (r) => r.development_areas.join("; ") },
  { header: "Last Assessed", accessor: (r) => r.last_assessed_at?.split("T")[0] ?? "" },
  { header: "Next Review", accessor: (r) => r.next_review_date ?? "" },
];

type ViewMode = "ladder" | "people";

// ── Staff Readiness Card ─────────────────────────────────────────────────────

function StaffReadinessCard({
  profile,
  staffName,
}: {
  profile: StaffCompetencyProfile;
  staffName: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const currentCfg = STAGE_CONFIG[profile.current_stage];
  const targetCfg  = profile.target_stage ? STAGE_CONFIG[profile.target_stage] : null;
  const score      = profile.overall_readiness_score;

  const scoreColour = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-blue-600" : score >= 40 ? "text-amber-600" : "text-red-600";
  const barColour   = score >= 80 ? "bg-emerald-400" : score >= 60 ? "bg-blue-400" : score >= 40 ? "bg-amber-400" : "bg-red-400";

  return (
    <Card className="border">
      <CardContent className="p-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 w-full text-left"
        >
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", currentCfg.bgColour)}>
            <User className={cn("h-4 w-4", currentCfg.colour)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <p className="text-sm font-bold text-slate-800">{staffName}</p>
              <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 border", currentCfg.borderColour, currentCfg.colour)}>
                {PATHWAY_STAGE_LABELS[profile.current_stage]}
              </Badge>
              {profile.target_stage && (
                <span className="flex items-center gap-0.5 text-[9px] text-slate-400">
                  <ArrowRight className="h-2.5 w-2.5" />
                  <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 border border-dashed", targetCfg?.borderColour, targetCfg?.colour)}>
                    {PATHWAY_STAGE_LABELS[profile.target_stage]}
                  </Badge>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden max-w-[200px]">
                <div className={cn("h-full rounded-full transition-all duration-500", barColour)} style={{ width: `${score}%` }} />
              </div>
              <span className={cn("text-[11px] font-bold tabular-nums", scoreColour)}>{score}%</span>
            </div>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
            {/* Strengths & Development */}
            {profile.strengths.length > 0 && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                <p className="text-[10px] font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Strengths
                </p>
                <ul className="space-y-0.5">
                  {profile.strengths.map((s, i) => (
                    <li key={i} className="text-[11px] text-emerald-800 flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {profile.development_areas.length > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                <p className="text-[10px] font-semibold text-amber-700 mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Development Areas
                </p>
                <ul className="space-y-0.5">
                  {profile.development_areas.map((d, i) => (
                    <li key={i} className="text-[11px] text-amber-800 flex items-start gap-1.5">
                      <Target className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ARIA Narrative */}
            {profile.aria_narrative && (
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2">
                <p className="text-[10px] font-semibold text-indigo-700 mb-0.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  ARIA Analysis
                </p>
                <p className="text-[11px] text-indigo-800 leading-relaxed">{profile.aria_narrative}</p>
              </div>
            )}

            {/* Footer info */}
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              {profile.last_assessed_at && (
                <span className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  Assessed: {profile.last_assessed_at.split("T")[0]}
                </span>
              )}
              {profile.next_review_date && (
                <span className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  Next review: {profile.next_review_date}
                </span>
              )}
              <Link href={`/workforce/staff/${profile.staff_id}`} className="text-indigo-600 hover:underline ml-auto">
                Full profile →
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Stage Summary Snapshot ───────────────────────────────────────────────────

function StageDistributionBar({ profiles }: { profiles: StaffCompetencyProfile[] }) {
  const stageCounts: Record<PathwayStage, number> = {} as any;
  PATHWAY_STAGE_ORDER.forEach((s) => { stageCounts[s] = 0; });
  profiles.forEach((p) => { stageCounts[p.current_stage]++; });
  const total = profiles.length || 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[13px] flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-500" />
          Stage Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="flex h-4 rounded-full overflow-hidden bg-slate-100">
          {PATHWAY_STAGE_ORDER.map((stage) => {
            const count = stageCounts[stage];
            if (count === 0) return null;
            const pct = (count / total) * 100;
            return (
              <div
                key={stage}
                className={cn("transition-all duration-500", STAGE_CONFIG[stage].dotColour)}
                style={{ width: `${pct}%` }}
                title={`${PATHWAY_STAGE_LABELS[stage]}: ${count}`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {PATHWAY_STAGE_ORDER.map((stage) => {
            const count = stageCounts[stage];
            if (count === 0) return null;
            return (
              <div key={stage} className="flex items-center gap-1 text-[10px] text-slate-500">
                <div className={cn("w-2 h-2 rounded-full", STAGE_CONFIG[stage].dotColour)} />
                <span>{PATHWAY_STAGE_LABELS[stage]}</span>
                <span className="font-semibold text-slate-700">{count}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Readiness Overview Card ──────────────────────────────────────────────────

function ReadinessOverview({ profiles, getStaffName }: { profiles: StaffCompetencyProfile[]; getStaffName: (id: string) => string }) {
  const sorted = [...profiles].sort((a, b) => b.overall_readiness_score - a.overall_readiness_score);
  const teamAvg = profiles.length > 0
    ? Math.round(profiles.reduce((s, p) => s + p.overall_readiness_score, 0) / profiles.length)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[13px] flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            Readiness Scores
          </CardTitle>
          <span className="text-[11px] text-indigo-600 font-semibold">Team avg: {teamAvg}%</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {sorted.map((p) => {
          const score = p.overall_readiness_score;
          const barCol = score >= 80 ? "bg-emerald-400" : score >= 60 ? "bg-blue-400" : score >= 40 ? "bg-amber-400" : "bg-red-400";
          const textCol = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-blue-600" : score >= 40 ? "text-amber-600" : "text-red-600";
          return (
            <div key={p.id} className="flex items-center gap-2">
              <p className="text-[10px] text-slate-600 w-20 truncate shrink-0 font-medium">
                {getStaffName(p.staff_id).split(" ")[0]}
              </p>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", barCol)} style={{ width: `${score}%` }} />
              </div>
              <span className={cn("text-[11px] font-bold tabular-nums w-8 text-right", textCol)}>{score}%</span>
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

export default function CareerPathwayPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("ladder");
  const [search, setSearch] = useState("");

  const profilesQuery = useCompetencyProfiles({ homeId: "home_oak" });
  const staffQuery    = useStaff();

  const profiles = profilesQuery.data?.data ?? [];
  const staff    = staffQuery.data?.data ?? [];

  const getStaffName = (id: string) => staff.find((s) => s.id === id)?.full_name ?? id;

  const filteredProfiles = useMemo(() => {
    if (!search.trim()) return profiles;
    const q = search.toLowerCase();
    return profiles.filter((p) => {
      const hay = [
        getStaffName(p.staff_id),
        PATHWAY_STAGE_LABELS[p.current_stage],
        p.target_stage ? PATHWAY_STAGE_LABELS[p.target_stage] : "",
        ...p.strengths,
        ...p.development_areas,
        p.aria_narrative || "",
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [profiles, search, staff]);

  const staffAtStage = (stage: PathwayStage) =>
    filteredProfiles.filter((p) => p.current_stage === stage);

  const targeting = (stage: PathwayStage) =>
    filteredProfiles.filter((p) => p.target_stage === stage && p.current_stage !== stage);

  // Team metrics
  const teamAvg = profiles.length > 0
    ? Math.round(profiles.reduce((s, p) => s + p.overall_readiness_score, 0) / profiles.length)
    : 0;
  const progressingCount = profiles.filter((p) => p.target_stage).length;

  return (
    <PageShell
      title="Career Pathway Ladder"
      subtitle="Seven-stage progression framework — from Inductee to RI"
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            filename="career-pathway"
            columns={PATHWAY_EXPORT_COLS}
            data={filteredProfiles}
            label="Export"
          />
          <PrintButton title="Career Pathway Report" subtitle="Oak House Workforce" targetId="pathway-content" />
          <SmartUploadButton variant="inline" label="Upload Evidence" uploadContext="Workforce Intelligence — career pathway evidence or portfolio document upload" />
          <Link href="/workforce">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <Milestone className="h-3.5 w-3.5" />
              Workforce Hub
            </button>
          </Link>
        </div>
      }
    >
      <div id="pathway-content" className="space-y-4 animate-fade-in">

        {/* ── KPI Banner ──────────────────────────────────────────────────── */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {[
            { label: "Team Members", value: profiles.length, colour: "text-indigo-700", icon: <Users className="h-4 w-4 text-indigo-500" /> },
            { label: "Team Avg Readiness", value: `${teamAvg}%`, colour: teamAvg >= 70 ? "text-emerald-700" : "text-amber-700", icon: <BarChart3 className="h-4 w-4 text-indigo-500" /> },
            { label: "Actively Progressing", value: progressingCount, colour: "text-blue-700", icon: <TrendingUp className="h-4 w-4 text-blue-500" /> },
            { label: "Stages Covered", value: `${new Set(profiles.map((p) => p.current_stage)).size}/7`, colour: "text-violet-700", icon: <Milestone className="h-4 w-4 text-violet-500" /> },
          ].map(({ label, value, colour, icon }) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-white p-3 text-center">
              <div className="flex justify-center mb-1">{icon}</div>
              <div className={cn("text-xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Analysis Row ────────────────────────────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-2">
          <StageDistributionBar profiles={profiles} />
          <ReadinessOverview profiles={profiles} getStaffName={getStaffName} />
        </div>

        {/* ── View Toggle + Search ────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="relative w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search staff…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          {search.trim() && (
            <span className="text-xs text-slate-400">{filteredProfiles.length} of {profiles.length} staff</span>
          )}
          <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden ml-auto">
            {([
              { mode: "ladder" as ViewMode, icon: Milestone, label: "Ladder" },
              { mode: "people" as ViewMode, icon: Users, label: "People" },
            ]).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium transition-all",
                  viewMode === mode ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50",
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Ladder View ─────────────────────────────────────────────────── */}
        {viewMode === "ladder" && (
          <div className="space-y-3">
            {PATHWAY_STAGE_ORDER.map((stage, idx) => {
              const cfg    = STAGE_CONFIG[stage];
              const people = staffAtStage(stage);
              const targetingThis = targeting(stage);
              const isLast = idx === PATHWAY_STAGE_ORDER.length - 1;

              return (
                <div key={stage}>
                  <div className={cn("rounded-2xl border p-5", cfg.bgColour, cfg.borderColour)}>
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border",
                        cfg.bgColour, cfg.colour, cfg.borderColour,
                      )}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className={cn("text-sm font-bold", cfg.colour)}>
                            {PATHWAY_STAGE_LABELS[stage]}
                          </h3>
                          {people.length > 0 && (
                            <Badge variant="outline" className={cn("text-[10px] border", cfg.borderColour, cfg.colour)}>
                              {people.length} staff
                            </Badge>
                          )}
                          <span className="text-[9px] text-slate-400 ml-auto">Min score: {cfg.min_score}%</span>
                        </div>
                        <p className="text-xs text-slate-600 mb-3">{cfg.description}</p>

                        {/* Requirements grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
                          {cfg.requirements.map((req) => (
                            <div key={req} className="flex items-start gap-1.5 text-xs text-slate-700">
                              <CheckCircle2 className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", cfg.colour)} />
                              <span>{req}</span>
                            </div>
                          ))}
                        </div>

                        {/* People chips */}
                        {people.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {people.map((profile) => {
                              const score = profile.overall_readiness_score;
                              const scoreCol = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-blue-600" : "text-amber-600";
                              return (
                                <Link key={profile.id} href={`/workforce/staff/${profile.staff_id}`}>
                                  <div className={cn(
                                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:opacity-80 transition-opacity",
                                    cfg.bgColour, cfg.borderColour, cfg.colour,
                                  )}>
                                    <User className="h-3 w-3" />
                                    <span>{getStaffName(profile.staff_id)}</span>
                                    <span className="opacity-40">·</span>
                                    <span className={cn("font-bold", scoreCol)}>{score}%</span>
                                    {profile.target_stage && (
                                      <>
                                        <ArrowRight className="h-2.5 w-2.5 opacity-40" />
                                        <span className="opacity-60 text-[9px]">
                                          {PATHWAY_STAGE_LABELS[profile.target_stage]}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        )}

                        {/* Targeting candidates */}
                        {targetingThis.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {targetingThis.map((p) => (
                              <Link key={p.id} href={`/workforce/staff/${p.staff_id}`}>
                                <div className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white/60 px-2.5 py-1 text-xs text-slate-500 hover:opacity-80 transition-opacity">
                                  <TrendingUp className="h-3 w-3" />
                                  {getStaffName(p.staff_id)} targeting
                                  <span className="font-semibold">{p.overall_readiness_score}%</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isLast && (
                    <div className="flex justify-center py-1">
                      <ArrowRight className="h-4 w-4 text-slate-300 rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── People View ─────────────────────────────────────────────────── */}
        {viewMode === "people" && (
          <div className="space-y-3">
            {[...filteredProfiles]
              .sort((a, b) => b.overall_readiness_score - a.overall_readiness_score)
              .map((profile) => (
                <StaffReadinessCard
                  key={profile.id}
                  profile={profile}
                  staffName={getStaffName(profile.staff_id)}
                />
              ))}
          </div>
        )}

        {/* ── Regulatory Footer ───────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Regulatory Basis — </span>
          Children&apos;s Homes Regulations 2015: Reg 29 (RM must hold Level 5 or equivalent),
          Reg 32 (residential staff must hold or be working towards Level 3 within 2 years of appointment).
          ILACS Quality of Care — workforce capability assessed against this progression framework.
        </div>
      </div>
    </PageShell>
  );
}
