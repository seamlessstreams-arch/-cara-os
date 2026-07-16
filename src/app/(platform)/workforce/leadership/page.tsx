"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import {
  Telescope, Sparkles, ChevronRight, ArrowUpRight,
  CheckCircle2, AlertTriangle, Clock, Search,
  Users, TrendingUp, Target, Award,
} from "lucide-react";
import Link from "next/link";
import { getStaffName as seedGetStaffName } from "@/lib/seed-data";
import { useCompetencyProfiles } from "@/hooks/use-workforce";
import { useDevelopmentPlans } from "@/hooks/use-workforce";
import { useStaff } from "@/hooks/use-staff";
import { PATHWAY_STAGE_LABELS, PATHWAY_STAGE_ORDER, type PathwayStage } from "@/types/extended";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import type { StaffCompetencyProfile } from "@/types/extended";

const READINESS_COLOUR = (score: number) =>
  score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600";
const READINESS_BG = (score: number) =>
  score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
const READINESS_BORDER = (score: number) =>
  score >= 80 ? "border-emerald-200 bg-emerald-50/30" : score >= 60 ? "border-amber-200 bg-amber-50/30" : "border-red-200 bg-red-50/30";

// Leadership pathway stages only
const LEADERSHIP_STAGES: PathwayStage[] = ["team_leader", "deputy_manager", "registered_manager", "ri"];

// ── Export columns ────────────────────────────────────────────────────────────

const LEADERSHIP_EXPORT_COLS: ExportColumn<StaffCompetencyProfile>[] = [
  { header: "Staff", accessor: (r) => seedGetStaffName(r.staff_id) },
  { header: "Current Stage", accessor: (r) => PATHWAY_STAGE_LABELS[r.current_stage] },
  { header: "Target Stage", accessor: (r) => r.target_stage ? PATHWAY_STAGE_LABELS[r.target_stage] : "" },
  { header: "Readiness Score", accessor: (r) => `${r.overall_readiness_score}%` },
  { header: "Strengths", accessor: (r) => r.strengths.join("; ") },
  { header: "Development Areas", accessor: (r) => r.development_areas.join("; ") },
  { header: "Last Assessed", accessor: (r) => r.last_assessed_at?.split("T")[0] ?? "" },
  { header: "Next Review", accessor: (r) => r.next_review_date ?? "" },
];

export default function LeadershipReadinessPage() {
  const [showCara, setShowCara] = useState(false);
  const [search, setSearch] = useState("");

  const profilesQuery = useCompetencyProfiles({ homeId: "home_oak" });
  const plansQuery    = useDevelopmentPlans({ status: "active" });
  const staffQuery    = useStaff();

  const profiles = profilesQuery.data?.data ?? [];
  const plans    = plansQuery.data?.data ?? [];
  const staff    = staffQuery.data?.data ?? [];

  const getStaffName = (id: string) => staff.find((s) => s.id === id)?.full_name ?? id;

  // Filter to profiles that are targeting leadership stages or are already there
  const leadershipProfiles = profiles.filter((p) =>
    LEADERSHIP_STAGES.includes(p.current_stage) ||
    (p.target_stage && LEADERSHIP_STAGES.includes(p.target_stage)),
  );

  const getActivePlan = (staffId: string) => plans.find((p) => p.staff_id === staffId);

  // Summary stats
  const stats = useMemo(() => {
    const onTrack = leadershipProfiles.filter((p) => p.overall_readiness_score >= 80).length;
    const inDevelopment = leadershipProfiles.filter((p) =>
      p.target_stage && LEADERSHIP_STAGES.includes(p.target_stage) && p.current_stage !== p.target_stage,
    ).length;
    const avgReadiness = leadershipProfiles.length > 0
      ? Math.round(leadershipProfiles.reduce((s, p) => s + p.overall_readiness_score, 0) / leadershipProfiles.length)
      : 0;
    const withPlans = leadershipProfiles.filter((p) => plans.some((pl) => pl.staff_id === p.staff_id)).length;

    return {
      total: leadershipProfiles.length,
      onTrack,
      inDevelopment,
      avgReadiness,
      withPlans,
    };
  }, [leadershipProfiles, plans]);

  // Readiness by stage (filtered by search)
  const stageData = useMemo(() => {
    const q = search.toLowerCase().trim();
    const matchesSearch = (profileStaffId: string) => {
      if (!q) return true;
      return getStaffName(profileStaffId).toLowerCase().includes(q);
    };

    return LEADERSHIP_STAGES.map((stage) => ({
      stage,
      current: profiles.filter((p) => p.current_stage === stage && matchesSearch(p.staff_id)),
      targeting: profiles.filter((p) => p.target_stage === stage && p.current_stage !== stage && matchesSearch(p.staff_id)),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, staff, search]);

  return (
    <PageShell
      title="Leadership Readiness Panel"
      subtitle="Cara gap analysis for Team Leader → RM → RI succession track"
      caraContext={{ pageTitle: "Leadership Readiness Panel", sourceType: "staff" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            filename="leadership-readiness"
            columns={LEADERSHIP_EXPORT_COLS}
            data={leadershipProfiles}
            label="Export"
          />
          <PrintButton title="Leadership Readiness" subtitle="Succession Planning" targetId="leadership-content" />
          <SmartUploadButton variant="inline" label="Upload Leadership Evidence" uploadContext="Workforce Intelligence — leadership readiness evidence or qualification upload" />
          <Button
            size="sm"
            className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => setShowCara((p) => !p)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Cara Leadership Analysis
          </Button>
          <Link href="/workforce/succession">
            <Button variant="outline" size="sm">Succession Board</Button>
          </Link>
          <CaraStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="leadership-content" className="space-y-0">
      {showCara && (
        <div className="relative">
          <button onClick={() => setShowCara(false)} className="absolute top-3 right-3 z-10 text-slate-400 hover:text-slate-600 text-xs">✕ Close</button>
          <CaraPanel
            mode="staff_development_summary"
            pageContext={`Leadership readiness: ${leadershipProfiles.length} staff on leadership track. Profiles: ${leadershipProfiles.map((p) => `${getStaffName(p.staff_id)} (${p.overall_readiness_score}% towards ${p.target_stage ? PATHWAY_STAGE_LABELS[p.target_stage] : "current stage"})`).join(", ")}`}
          />
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <Users className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-slate-800 tabular-nums">{stats.total}</div>
          <div className="text-[10px] text-slate-500">On Track</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <Target className="h-4 w-4 text-indigo-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-indigo-700 tabular-nums">{stats.inDevelopment}</div>
          <div className="text-[10px] text-slate-500">In Development</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <TrendingUp className={cn("h-4 w-4 mx-auto mb-1", stats.avgReadiness >= 70 ? "text-emerald-500" : stats.avgReadiness >= 50 ? "text-amber-500" : "text-red-500")} />
          <div className={cn("text-lg font-bold tabular-nums", stats.avgReadiness >= 70 ? "text-emerald-700" : stats.avgReadiness >= 50 ? "text-amber-700" : "text-red-700")}>
            {stats.avgReadiness}%
          </div>
          <div className="text-[10px] text-slate-500">Avg Readiness</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <Award className={cn("h-4 w-4 mx-auto mb-1", stats.onTrack > 0 ? "text-emerald-500" : "text-slate-300")} />
          <div className={cn("text-lg font-bold tabular-nums", stats.onTrack > 0 ? "text-emerald-700" : "text-slate-400")}>{stats.onTrack}</div>
          <div className="text-[10px] text-slate-500">Ready (80%+)</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <CheckCircle2 className={cn("h-4 w-4 mx-auto mb-1", stats.withPlans > 0 ? "text-blue-500" : "text-slate-300")} />
          <div className={cn("text-lg font-bold tabular-nums", stats.withPlans > 0 ? "text-blue-700" : "text-slate-400")}>{stats.withPlans}</div>
          <div className="text-[10px] text-slate-500">With Dev Plans</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by staff name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[var(--cs-warning-soft)] focus:ring-1 focus:ring-[var(--cs-warning-soft)] outline-none transition-all"
        />
      </div>

      {/* Leadership stage panels */}
      <div className="space-y-4">
        {stageData.map(({ stage, current, targeting }) => {
          if (current.length === 0 && targeting.length === 0) return null;

          return (
            <div key={stage} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                <Telescope className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-bold text-slate-800">{PATHWAY_STAGE_LABELS[stage]}</p>
                  <p className="text-xs text-slate-500">
                    {current.length} current · {targeting.length} in development
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* Current holders */}
                {current.map((profile) => {
                  const plan = getActivePlan(profile.staff_id);
                  return (
                    <div key={profile.id} className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-slate-800">{getStaffName(profile.staff_id)}</p>
                            <Badge className="text-[10px] bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                              Role holder
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={cn("h-full rounded-full", READINESS_BG(profile.overall_readiness_score))}
                                style={{ width: `${profile.overall_readiness_score}%` }}
                              />
                            </div>
                            <span className={cn("text-xs font-bold", READINESS_COLOUR(profile.overall_readiness_score))}>
                              {profile.overall_readiness_score}%
                            </span>
                          </div>
                          {profile.cara_narrative && (
                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{profile.cara_narrative}</p>
                          )}
                        </div>
                        <Link href={`/workforce/staff/${profile.staff_id}`}>
                          <ChevronRight className="h-4 w-4 text-slate-300 hover:text-slate-500 transition-colors" />
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {/* Targeting this stage */}
                {targeting.map((profile) => {
                  const plan = getActivePlan(profile.staff_id);
                  const completedActions = plan ? plan.actions.filter((a) => a.completed).length : 0;
                  const totalActions = plan ? plan.actions.length : 0;

                  return (
                    <div key={profile.id} className={cn("rounded-xl border p-3", READINESS_BORDER(profile.overall_readiness_score))}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-semibold text-slate-800">{getStaffName(profile.staff_id)}</p>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <ArrowUpRight className="h-3 w-3" />
                              <span>Targeting {PATHWAY_STAGE_LABELS[stage]}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={cn("h-full rounded-full", READINESS_BG(profile.overall_readiness_score))}
                                style={{ width: `${profile.overall_readiness_score}%` }}
                              />
                            </div>
                            <span className={cn("text-xs font-bold", READINESS_COLOUR(profile.overall_readiness_score))}>
                              {profile.overall_readiness_score}%
                            </span>
                          </div>

                          {/* Development areas */}
                          {profile.development_areas.length > 0 && (
                            <div className="space-y-1 mb-2">
                              {profile.development_areas.slice(0, 2).map((area) => (
                                <div key={area} className="flex items-start gap-1.5 text-xs text-slate-600">
                                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                                  <span>{area}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Active plan progress */}
                          {plan && totalActions > 0 && (
                            <div className="text-xs text-indigo-600">
                              <span className="font-medium">Dev plan:</span> {completedActions}/{totalActions} actions complete
                            </div>
                          )}
                        </div>
                        <Link href={`/workforce/staff/${profile.staff_id}`}>
                          <ChevronRight className="h-4 w-4 text-slate-300 hover:text-slate-500 transition-colors" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {leadershipProfiles.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Telescope className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No staff on the leadership readiness track yet</p>
          <p className="text-xs mt-1">Add target stages to staff competency profiles to activate this panel</p>
        </div>
      )}

      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">ILACS Inspection Note — </span>
        Ofsted evaluates provider resilience, succession planning, and leadership capability.
        This panel provides real-time evidence of structured leadership development in line with ILACS Quality of Management theme.
      </div>
      </div>{/* close #leadership-content */}
    </PageShell>
  );
}
