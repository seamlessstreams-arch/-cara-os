"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BarChart2, Search, Users, TrendingUp, AlertTriangle,
  ShieldAlert, Award, Target, CheckCircle2, ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { useCompetencyProfiles } from "@/hooks/use-workforce";
import { useStaff } from "@/hooks/use-staff";
import {
  ALL_COMPETENCY_DOMAINS, COMPETENCY_DOMAIN_LABELS,
  COMPETENCY_LEVEL_LABELS, PATHWAY_STAGE_LABELS,
  PATHWAY_STAGE_ORDER,
  type CompetencyDomain, type CompetencyLevel, type PathwayStage,
} from "@/types/extended";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName as seedGetStaffName } from "@/lib/seed-data";
import type { StaffCompetencyProfile } from "@/types/extended";

const LEVEL_COLOUR: Record<CompetencyLevel, string> = {
  0: "bg-slate-100 text-[var(--cs-text-muted)]",
  1: "bg-red-100 text-red-600",
  2: "bg-amber-100 text-amber-700",
  3: "bg-blue-100 text-blue-700",
  4: "bg-indigo-100 text-indigo-700",
  5: "bg-emerald-100 text-emerald-700",
};

const LEVEL_BAR: Record<CompetencyLevel, string> = {
  0: "bg-slate-200",
  1: "bg-red-400",
  2: "bg-amber-400",
  3: "bg-blue-500",
  4: "bg-indigo-500",
  5: "bg-emerald-500",
};

// Minimum score required at each stage for each domain (simplified)
const DOMAIN_MINIMUMS: Record<string, Record<string, number>> = {
  inductee:           { default: 1 },
  rsw:                { default: 2 },
  senior_rsw:         { default: 3 },
  team_leader:        { default: 3, leadership_and_supervision: 3 },
  deputy_manager:     { default: 3, leadership_and_supervision: 4, safeguarding_and_child_protection: 4 },
  registered_manager: { default: 4 },
  ri:                 { default: 4 },
};

function getMinimumForStage(stage: PathwayStage, domain: CompetencyDomain): number {
  const mins = DOMAIN_MINIMUMS[stage];
  if (!mins) return 2;
  return mins[domain] ?? mins.default ?? 2;
}

const COMPETENCY_EXPORT_COLS: ExportColumn<StaffCompetencyProfile>[] = [
  { header: "Staff", accessor: (p) => seedGetStaffName(p.staff_id) },
  { header: "Current Stage", accessor: (p) => PATHWAY_STAGE_LABELS[p.current_stage] },
  { header: "Readiness Score", accessor: (p) => String(p.overall_readiness_score) },
  { header: "Strengths", accessor: (p) => (p.strengths ?? []).join("; ") },
  { header: "Development Areas", accessor: (p) => p.development_areas.join("; ") },
  { header: "Last Assessed", accessor: (p) => p.last_assessed_at ?? "" },
  { header: "Next Review", accessor: (p) => p.next_review_date ?? "" },
];

type StageFilter = "all" | PathwayStage;

export default function CompetencyFrameworkPage() {
  const [selectedDomain, setSelectedDomain] = useState<CompetencyDomain | "all">("all");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"readiness" | "name" | "stage">("readiness");

  const profilesQuery = useCompetencyProfiles({ homeId: "home_oak" });
  const staffQuery    = useStaff();

  const profiles = profilesQuery.data?.data ?? [];
  const staff    = staffQuery.data?.data ?? [];

  const getStaffName = (id: string) => staff.find((s) => s.id === id)?.full_name ?? id;
  const getStaffRole = (id: string) => staff.find((s) => s.id === id)?.job_title ?? "";

  // Build a synthetic score grid — use profile-level strengths/areas to infer per-domain scores
  const getScoreForDomain = (profileIdx: number, domain: CompetencyDomain): CompetencyLevel => {
    const profile = profiles[profileIdx];
    if (!profile) return 0;
    const base = Math.round(profile.overall_readiness_score / 20) as CompetencyLevel;
    const isDevelopmentArea = profile.development_areas.some((a) =>
      a.toLowerCase().includes(domain.replace(/_/g, " ").toLowerCase().slice(0, 8)),
    );
    const isStrength = profile.strengths.some((s) =>
      s.toLowerCase().includes(domain.replace(/_/g, " ").toLowerCase().slice(0, 8)),
    );
    const adjusted = isDevelopmentArea ? Math.max(0, base - 1) as CompetencyLevel
      : isStrength ? Math.min(5, base + 1) as CompetencyLevel
      : base;
    return Math.max(0, Math.min(5, adjusted)) as CompetencyLevel;
  };

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    let result = profiles.map((p, idx) => ({ profile: p, idx }));

    if (stageFilter !== "all") {
      result = result.filter(({ profile }) => profile.current_stage === stageFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(({ profile }) => {
        const name = getStaffName(profile.staff_id).toLowerCase();
        const role = getStaffRole(profile.staff_id).toLowerCase();
        const stage = PATHWAY_STAGE_LABELS[profile.current_stage].toLowerCase();
        return name.includes(q) || role.includes(q) || stage.includes(q);
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return getStaffName(a.profile.staff_id).localeCompare(getStaffName(b.profile.staff_id));
        case "stage": {
          const ai = PATHWAY_STAGE_ORDER.indexOf(a.profile.current_stage);
          const bi = PATHWAY_STAGE_ORDER.indexOf(b.profile.current_stage);
          return ai - bi;
        }
        case "readiness":
        default:
          return a.profile.overall_readiness_score - b.profile.overall_readiness_score;
      }
    });

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, staff, stageFilter, search, sortBy]);

  // Summary stats
  const stats = useMemo(() => {
    if (!profiles.length) return {
      profiled: 0, avgReadiness: 0, gapCount: 0,
      strongestDomain: null as CompetencyDomain | null,
      weakestDomain: null as CompetencyDomain | null,
      belowThreshold: 0,
    };

    const avgReadiness = profiles.reduce((s, p) => s + p.overall_readiness_score, 0) / profiles.length;

    // Count total gaps (score < minimum for stage)
    let gapCount = 0;
    profiles.forEach((profile, idx) => {
      ALL_COMPETENCY_DOMAINS.forEach((domain) => {
        const score = getScoreForDomain(idx, domain);
        const min = getMinimumForStage(profile.current_stage, domain);
        if (score < min) gapCount++;
      });
    });

    // Strongest and weakest domain
    const domainAvgs = ALL_COMPETENCY_DOMAINS.map((domain) => {
      const total = profiles.reduce((sum, _, idx) => sum + getScoreForDomain(idx, domain), 0);
      return { domain, avg: total / profiles.length };
    }).sort((a, b) => b.avg - a.avg);

    // Staff below threshold in any domain
    const belowThreshold = profiles.filter((profile, idx) =>
      ALL_COMPETENCY_DOMAINS.some((domain) => {
        const score = getScoreForDomain(idx, domain);
        const min = getMinimumForStage(profile.current_stage, domain);
        return score < min;
      }),
    ).length;

    return {
      profiled: profiles.length,
      avgReadiness: Math.round(avgReadiness),
      gapCount,
      strongestDomain: domainAvgs[0]?.domain ?? null,
      weakestDomain: domainAvgs[domainAvgs.length - 1]?.domain ?? null,
      belowThreshold,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles]);

  // Team averages per domain
  const domainAverages = useMemo(() =>
    ALL_COMPETENCY_DOMAINS.map((domain) => {
      if (!profiles.length) return { domain, avg: 0 };
      const total = profiles.reduce((sum, _, idx) => sum + getScoreForDomain(idx, domain), 0);
      return { domain, avg: total / profiles.length };
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [profiles]);

  // Stage counts for filter tabs
  const stageCounts = useMemo(() => {
    const counts: Partial<Record<PathwayStage, number>> = {};
    profiles.forEach((p) => {
      counts[p.current_stage] = (counts[p.current_stage] ?? 0) + 1;
    });
    return counts;
  }, [profiles]);

  return (
    <PageShell
      title="Competency Framework"
      subtitle="10-domain scoring matrix across all staff — gaps, strengths & team averages"
      caraContext={{ pageTitle: "Staff Competency Matrix", sourceType: "staff" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filteredProfiles.map((fp) => fp.profile)} columns={COMPETENCY_EXPORT_COLS} filename="competency-profiles" />
          <PrintButton title="Competency Framework" subtitle="Staff Competency Matrix" targetId="competency-content" />
          <SmartUploadButton variant="inline" label="Upload Competency Evidence" uploadContext="Workforce Intelligence — competency evidence or assessment document upload" />
          <Link href="/workforce">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cs-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)] transition-colors">
              <BarChart2 className="h-3.5 w-3.5" />
              Workforce Hub
            </button>
          </Link>
          <CaraStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="competency-content" className="space-y-0">

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3 text-center">
          <Users className="h-4 w-4 text-indigo-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-[var(--cs-navy)] tabular-nums">{stats.profiled}</div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">Staff Profiled</div>
        </div>
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3 text-center">
          <TrendingUp className={cn("h-4 w-4 mx-auto mb-1", stats.avgReadiness >= 70 ? "text-emerald-500" : stats.avgReadiness >= 50 ? "text-amber-500" : "text-red-500")} />
          <div className={cn("text-lg font-bold tabular-nums", stats.avgReadiness >= 70 ? "text-emerald-700" : stats.avgReadiness >= 50 ? "text-amber-700" : "text-red-700")}>
            {stats.avgReadiness}%
          </div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">Avg Readiness</div>
        </div>
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3 text-center">
          <ShieldAlert className={cn("h-4 w-4 mx-auto mb-1", stats.gapCount > 0 ? "text-red-500" : "text-emerald-500")} />
          <div className={cn("text-lg font-bold tabular-nums", stats.gapCount > 0 ? "text-red-700" : "text-emerald-700")}>{stats.gapCount}</div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">Competency Gaps</div>
        </div>
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3 text-center">
          <AlertTriangle className={cn("h-4 w-4 mx-auto mb-1", stats.belowThreshold > 0 ? "text-amber-500" : "text-emerald-500")} />
          <div className={cn("text-lg font-bold tabular-nums", stats.belowThreshold > 0 ? "text-amber-700" : "text-emerald-700")}>{stats.belowThreshold}</div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">Below Threshold</div>
        </div>
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3 text-center">
          <Award className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
          <div className="text-xs font-bold text-emerald-700 truncate">
            {stats.strongestDomain ? COMPETENCY_DOMAIN_LABELS[stats.strongestDomain].split(" ")[0] : "—"}
          </div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">Strongest</div>
        </div>
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3 text-center">
          <Target className="h-4 w-4 text-red-500 mx-auto mb-1" />
          <div className="text-xs font-bold text-red-700 truncate">
            {stats.weakestDomain ? COMPETENCY_DOMAIN_LABELS[stats.weakestDomain].split(" ")[0] : "—"}
          </div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">Weakest</div>
        </div>
      </div>

      {/* Search + Stage filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
          <input
            type="text"
            placeholder="Search by name, role or stage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--cs-border)] bg-white py-1.5 pl-9 pr-3 text-xs text-[var(--cs-text-secondary)] placeholder:text-[var(--cs-text-muted)] focus:border-[var(--cs-cara-gold)] focus:ring-1 focus:ring-[var(--cs-cara-gold)]/30 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)] shrink-0">
          <ArrowUpDown className="h-3.5 w-3.5" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-white border rounded-md px-2 py-1.5 text-xs">
            <option value="readiness">Readiness (lowest first)</option>
            <option value="name">Name A–Z</option>
            <option value="stage">Pathway stage</option>
          </select>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setStageFilter("all")}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
              stageFilter === "all"
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-[var(--cs-text-secondary)] border-[var(--cs-border)] hover:border-slate-400",
            )}
          >
            All Stages ({profiles.length})
          </button>
          {PATHWAY_STAGE_ORDER.filter((s) => stageCounts[s]).map((stage) => (
            <button
              key={stage}
              onClick={() => setStageFilter(stage)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                stageFilter === stage
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-[var(--cs-text-secondary)] border-[var(--cs-border)] hover:border-slate-400",
              )}
            >
              {PATHWAY_STAGE_LABELS[stage].split(" ")[0]} ({stageCounts[stage]})
            </button>
          ))}
        </div>
      </div>

      {/* Domain filter */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setSelectedDomain("all")}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border transition-all",
            selectedDomain === "all"
              ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]"
              : "bg-white text-[var(--cs-text-secondary)] border-[var(--cs-border)] hover:border-indigo-300",
          )}
        >
          All Domains
        </button>
        {ALL_COMPETENCY_DOMAINS.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDomain(d)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-all",
              selectedDomain === d
                ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]"
                : "bg-white text-[var(--cs-text-secondary)] border-[var(--cs-border)] hover:border-indigo-300",
            )}
          >
            {COMPETENCY_DOMAIN_LABELS[d].split(" ").slice(0, 2).join(" ")}
          </button>
        ))}
      </div>

      {/* Team average bars */}
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
        <p className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-3">Team Averages</p>
        <div className="space-y-2.5">
          {domainAverages
            .filter((d) => selectedDomain === "all" || d.domain === selectedDomain)
            .map(({ domain, avg }) => {
              const level = Math.round(avg) as CompetencyLevel;
              return (
                <div key={domain}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--cs-text-secondary)]">{COMPETENCY_DOMAIN_LABELS[domain]}</span>
                    <span className={cn("text-xs font-bold px-1.5 rounded", LEVEL_COLOUR[level])}>
                      {avg.toFixed(1)} — {COMPETENCY_LEVEL_LABELS[level]}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", LEVEL_BAR[level])}
                      style={{ width: `${(avg / 5) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Per-staff grid */}
      {filteredProfiles.length > 0 && (
        <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--cs-border-subtle)]">
            <p className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest">
              Individual Scores
            </p>
            <span className="text-[10px] text-[var(--cs-text-muted)]">
              {filteredProfiles.length} staff · Cells below stage threshold shown with warning ring
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--cs-border-subtle)] bg-slate-50">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-[var(--cs-text-muted)] min-w-[160px]">Staff Member</th>
                  {(selectedDomain === "all" ? ALL_COMPETENCY_DOMAINS : [selectedDomain]).map((d) => (
                    <th key={d} className="px-2 py-2 text-center text-[10px] font-semibold text-[var(--cs-text-muted)] min-w-[52px]">
                      {COMPETENCY_DOMAIN_LABELS[d].split(" ")[0]}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center text-[10px] font-semibold text-[var(--cs-text-muted)]">Stage</th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold text-[var(--cs-text-muted)]">Readiness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProfiles.map(({ profile, idx }) => {
                  const hasGap = ALL_COMPETENCY_DOMAINS.some((d) => {
                    const score = getScoreForDomain(idx, d);
                    return score < getMinimumForStage(profile.current_stage, d);
                  });
                  return (
                    <tr key={profile.id} className={cn("hover:bg-[var(--cs-surface)] transition-colors", hasGap && "bg-red-50/30")}>
                      <td className="px-4 py-2.5">
                        <Link href={`/workforce/staff/${profile.staff_id}`} className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0">
                            {getStaffName(profile.staff_id).split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-[var(--cs-text-secondary)] text-xs block truncate">{getStaffName(profile.staff_id)}</span>
                            <span className="text-[10px] text-[var(--cs-text-muted)] block truncate">{getStaffRole(profile.staff_id)}</span>
                          </div>
                        </Link>
                      </td>
                      {(selectedDomain === "all" ? ALL_COMPETENCY_DOMAINS : [selectedDomain]).map((d) => {
                        const score = getScoreForDomain(idx, d);
                        const minRequired = getMinimumForStage(profile.current_stage, d);
                        const isBelowMin = score < minRequired;
                        return (
                          <td key={d} className="px-2 py-2.5 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold",
                                LEVEL_COLOUR[score],
                                isBelowMin && "ring-2 ring-[var(--cs-risk)] ring-offset-1",
                              )}
                              title={isBelowMin ? `Below threshold (needs ${minRequired})` : COMPETENCY_LEVEL_LABELS[score]}
                            >
                              {score}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-center">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {PATHWAY_STAGE_LABELS[profile.current_stage].split(" ")[0]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                profile.overall_readiness_score >= 80 ? "bg-emerald-500"
                                : profile.overall_readiness_score >= 60 ? "bg-amber-400"
                                : "bg-red-400",
                              )}
                              style={{ width: `${profile.overall_readiness_score}%` }}
                            />
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold tabular-nums",
                            profile.overall_readiness_score >= 80 ? "text-emerald-600"
                            : profile.overall_readiness_score >= 60 ? "text-amber-600"
                            : "text-red-600",
                          )}>
                            {profile.overall_readiness_score}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredProfiles.length === 0 && profiles.length > 0 && (
        <div className="text-center py-8 text-[var(--cs-text-muted)]">
          <Search className="h-6 w-6 mx-auto mb-2 text-[var(--cs-text-gentle)]" />
          <p className="text-sm">No profiles match your filters</p>
          <p className="text-xs mt-1">Try adjusting the search or stage filter</p>
        </div>
      )}

      {/* Gap analysis alert */}
      {stats.gapCount > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-xs font-semibold text-red-700">
              Gap Analysis: {stats.gapCount} competency gap{stats.gapCount !== 1 ? "s" : ""} across {stats.belowThreshold} staff
            </p>
          </div>
          <p className="text-[11px] text-red-600 ml-6">
            Staff members have domain scores below the minimum threshold for their current stage.
            Cells with a red ring in the matrix above indicate gaps requiring development action.
          </p>
        </div>
      )}

      {stats.gapCount === 0 && stats.profiled > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-emerald-700">All staff meet stage competency thresholds</p>
            <p className="text-[10px] text-emerald-600">No domain gaps identified against current stage requirements</p>
          </div>
        </div>
      )}

      {/* Score legend */}
      <div className="flex flex-wrap gap-2">
        {([0, 1, 2, 3, 4, 5] as CompetencyLevel[]).map((l) => (
          <div key={l} className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", LEVEL_COLOUR[l])}>
            <span className="font-bold">{l}</span> — {COMPETENCY_LEVEL_LABELS[l]}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 px-4 py-3 text-xs text-[var(--cs-text-muted)]">
        <span className="font-semibold text-[var(--cs-text-secondary)]">Regulatory Basis — </span>
        Children&apos;s Homes Regulations 2015: Reg 34 (managers must assess and develop staff competency through
        regular supervision). ILACS — Quality of Care: workforce capability and competency directly assessed by inspectors.
      </div>
      </div>{/* close #competency-content */}
      <CaraPanel
        mode="assist"
        pageContext="Staff Competency Matrix — competency assessments, skills frameworks, Reg 34 development, ILACS workforce quality, competency gaps, professional development, Ofsted inspection evidence"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
