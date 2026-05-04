"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AriaPanel } from "@/components/aria/aria-panel";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import {
  Sparkles, ArrowLeft, Network, TrendingUp, BarChart2,
  CheckCircle2, Clock, AlertTriangle, ArrowUpRight,
  ThumbsUp, Star, ChevronRight, Calendar, User,
  Microscope, GitMerge, Award, MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useStaff } from "@/hooks/use-staff";
import {
  useStaffCompetencyProfile,
  useDevelopmentPlans,
  usePracticeObservations,
  useAppraisals,
  useQualifications,
} from "@/hooks/use-workforce";
import {
  PATHWAY_STAGE_LABELS, PATHWAY_STAGE_ORDER,
  ALL_COMPETENCY_DOMAINS, COMPETENCY_DOMAIN_LABELS,
  COMPETENCY_LEVEL_LABELS,
  type CompetencyLevel, type PathwayStage,
} from "@/types/extended";

const LEVEL_COLOUR: Record<CompetencyLevel, string> = {
  0: "bg-slate-100 text-slate-400 border-slate-200",
  1: "bg-red-50 text-red-600 border-red-200",
  2: "bg-amber-50 text-amber-700 border-amber-200",
  3: "bg-blue-50 text-blue-700 border-blue-200",
  4: "bg-indigo-50 text-indigo-700 border-indigo-200",
  5: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const LEVEL_BAR: Record<CompetencyLevel, string> = {
  0: "bg-slate-200", 1: "bg-red-400", 2: "bg-amber-400",
  3: "bg-blue-500",  4: "bg-indigo-500", 5: "bg-emerald-500",
};

const STAGE_COLOURS: Record<PathwayStage, string> = {
  inductee:           "bg-slate-100 text-slate-700 border-slate-200",
  rsw:                "bg-blue-50 text-blue-700 border-blue-200",
  senior_rsw:         "bg-sky-50 text-sky-700 border-sky-200",
  team_leader:        "bg-violet-50 text-violet-700 border-violet-200",
  deputy_manager:     "bg-amber-50 text-amber-700 border-amber-200",
  registered_manager: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ri:                 "bg-rose-50 text-rose-700 border-rose-200",
};

const READINESS_COLOUR = (s: number) =>
  s >= 80 ? "text-emerald-600" : s >= 60 ? "text-amber-600" : "text-red-600";
const READINESS_BG = (s: number) =>
  s >= 80 ? "bg-emerald-500" : s >= 60 ? "bg-amber-500" : "bg-red-500";

type ProfileTab = "overview" | "competency" | "plans" | "observations" | "appraisals" | "qualifications";

// Heuristic per-domain score from profile (until db stores CompetencyScore rows)
function inferDomainScore(profile: { overall_readiness_score: number; strengths: string[]; development_areas: string[] }, domain: string): CompetencyLevel {
  const base = Math.round(profile.overall_readiness_score / 20) as CompetencyLevel;
  const isDev = profile.development_areas.some((a) =>
    a.toLowerCase().includes(domain.replace(/_/g, " ").slice(0, 8).toLowerCase()),
  );
  const isStr = profile.strengths.some((s) =>
    s.toLowerCase().includes(domain.replace(/_/g, " ").slice(0, 8).toLowerCase()),
  );
  const adjusted = isDev ? Math.max(0, base - 1) : isStr ? Math.min(5, base + 1) : base;
  return Math.max(0, Math.min(5, adjusted)) as CompetencyLevel;
}

export default function StaffCompetencyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();
  const [tab, setTab]       = useState<ProfileTab>("overview");
  const [showAria, setShowAria] = useState(false);

  const staffQuery     = useStaff();
  const profileQuery   = useStaffCompetencyProfile(id);
  const plansQuery     = useDevelopmentPlans({ staffId: id });
  const obsQuery       = usePracticeObservations({ staffId: id });
  const appraisalsQuery = useAppraisals({ staffId: id });
  const qualsQuery     = useQualifications({ staffId: id });

  const staff      = staffQuery.data?.data ?? [];
  const member     = staff.find((s) => s.id === id);
  const profile    = profileQuery.data?.data ?? null;
  const plans      = plansQuery.data?.data ?? [];
  const obs        = obsQuery.data?.data ?? [];
  const appraisals = appraisalsQuery.data?.data ?? [];
  const quals      = qualsQuery.data?.data ?? [];

  const activePlan = plans.find((p) => p.status === "active");
  const latestObs  = obs[0] ?? null;

  const stageIndex = profile ? PATHWAY_STAGE_ORDER.indexOf(profile.current_stage) : -1;
  const nextStage  = stageIndex >= 0 && stageIndex < PATHWAY_STAGE_ORDER.length - 1
    ? PATHWAY_STAGE_ORDER[stageIndex + 1]
    : null;

  const TABS: { id: ProfileTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "overview",       label: "Overview",       icon: Network },
    { id: "competency",     label: "Competency",     icon: BarChart2 },
    { id: "plans",          label: "Dev Plans",      icon: GitMerge,   count: plans.length },
    { id: "observations",   label: "Observations",   icon: Microscope, count: obs.length },
    { id: "appraisals",     label: "Appraisals",     icon: Star,       count: appraisals.length },
    { id: "qualifications", label: "Qualifications", icon: Award,      count: quals.length },
  ];

  if (!member) {
    return (
      <PageShell title="Staff Profile" showQuickCreate={false}>
        <div className="text-center py-16 text-slate-400">
          <User className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p>Staff member not found</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/workforce/staff")}>
            Back to profiles
          </Button>
        </div>
      </PageShell>
    );
  }

  const initials = member.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <PageShell
      title={member.full_name}
      subtitle={member.job_title}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title={member.full_name} subtitle={`Oak House — ${member.job_title} Staff Profile`} targetId="staff-profile-content" />
          <SmartUploadButton
            variant="icon"
            linkedStaffId={id}
            uploadContext={`Staff Profile — ${member.full_name} CPD evidence or certificate upload`}
          />
          <Button
            size="sm"
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => setShowAria((p) => !p)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            ARIA Profile Analysis
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/workforce/staff")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            All Profiles
          </Button>
        </div>
      }
    >
      <div id="staff-profile-content" className="space-y-0">
      {showAria && profile && (
        <div className="relative">
          <button onClick={() => setShowAria(false)} className="absolute top-3 right-3 z-10 text-slate-400 hover:text-slate-600 text-xs">✕ Close</button>
          <AriaPanel
            mode="staff_development_summary"
            pageContext={`Staff: ${member.full_name} (${member.job_title}). Current stage: ${PATHWAY_STAGE_LABELS[profile.current_stage]}. Readiness: ${profile.overall_readiness_score}%. Target: ${profile.target_stage ? PATHWAY_STAGE_LABELS[profile.target_stage] : "none"}. Strengths: ${profile.strengths.join("; ")}. Development areas: ${profile.development_areas.join("; ")}. Active plan: ${activePlan ? activePlan.title : "none"}. Observations: ${obs.length}.`}
          />
        </div>
      )}

      {/* Profile header card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-indigo-700">{initials}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h2 className="text-lg font-bold text-slate-900">{member.full_name}</h2>
              {profile && (
                <Badge variant="outline" className={cn("text-xs border", STAGE_COLOURS[profile.current_stage])}>
                  {PATHWAY_STAGE_LABELS[profile.current_stage]}
                </Badge>
              )}
              {profile?.target_stage && (
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>→ {PATHWAY_STAGE_LABELS[profile.target_stage]}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span>{member.employment_type === "permanent" ? "Permanent" : "Bank"} · {member.contracted_hours}h/wk</span>
              <span>Started {member.start_date}</span>
              {member.next_supervision_due && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  Supervision: {member.next_supervision_due}
                </span>
              )}
            </div>
          </div>

          {/* Readiness gauge */}
          {profile && (
            <div className="shrink-0 text-center">
              <div className="text-3xl font-black tracking-tighter mb-0.5">
                <span className={READINESS_COLOUR(profile.overall_readiness_score)}>
                  {profile.overall_readiness_score}
                </span>
                <span className="text-slate-300 text-lg">%</span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Readiness</p>
              {nextStage && (
                <p className="text-[9px] text-slate-400 mt-0.5">
                  towards {PATHWAY_STAGE_LABELS[nextStage].split(" ")[0]}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Readiness bar */}
        {profile && (
          <div className="mt-4 h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", READINESS_BG(profile.overall_readiness_score))}
              style={{ width: `${profile.overall_readiness_score}%` }}
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap",
                tab === t.id
                  ? "border-indigo-500 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-0.5 bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Overview tab ─────────────────────────────────────────────── */}
      {tab === "overview" && profile && (
        <div className="space-y-4">
          {/* ARIA narrative */}
          {profile.aria_narrative && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="text-[10px] font-semibold text-indigo-600 mb-2 uppercase tracking-widest">ARIA Profile Intelligence</p>
              <p className="text-sm text-indigo-900 leading-relaxed">{profile.aria_narrative}</p>
              {profile.last_assessed_at && (
                <p className="text-[10px] text-indigo-400 mt-2">
                  Assessed {profile.last_assessed_at.slice(0, 10)}
                  {profile.next_review_date && ` · Next review ${profile.next_review_date}`}
                </p>
              )}
            </div>
          )}

          {/* Strengths & development areas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
              <p className="text-xs font-bold text-emerald-800 mb-3 flex items-center gap-1.5">
                <ThumbsUp className="h-3.5 w-3.5" /> Strengths
              </p>
              <ul className="space-y-2">
                {profile.strengths.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-xs text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
              <p className="text-xs font-bold text-amber-800 mb-3 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Development Areas
              </p>
              <ul className="space-y-2">
                {profile.development_areas.map((a) => (
                  <li key={a} className="flex items-start gap-2 text-xs text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Active plan snapshot */}
          {activePlan && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <GitMerge className="h-3.5 w-3.5 text-indigo-500" /> Active Development Plan
                </p>
                <button onClick={() => setTab("plans")} className="text-[10px] text-indigo-600 hover:underline">
                  View full plan →
                </button>
              </div>
              <p className="text-sm font-semibold text-slate-800 mb-2">{activePlan.title}</p>
              <div className="space-y-1.5">
                {activePlan.actions.slice(0, 3).map((action) => (
                  <div key={action.id} className="flex items-center gap-2 text-xs">
                    {action.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className={action.completed ? "line-through text-slate-400" : "text-slate-700"}>
                      {action.title}
                    </span>
                  </div>
                ))}
                {activePlan.actions.length > 3 && (
                  <p className="text-[10px] text-slate-400 pl-5">+{activePlan.actions.length - 3} more actions</p>
                )}
              </div>
            </div>
          )}

          {/* Latest observation */}
          {latestObs && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Microscope className="h-3.5 w-3.5 text-purple-500" /> Latest Practice Observation
                </p>
                <span className="text-[10px] text-slate-400">{latestObs.observation_date}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">{latestObs.narrative}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Competency tab ────────────────────────────────────────────── */}
      {tab === "competency" && profile && (
        <div className="space-y-2.5">
          {ALL_COMPETENCY_DOMAINS.map((domain) => {
            const score = inferDomainScore(profile, domain);
            return (
              <div key={domain} className="rounded-xl border border-slate-100 bg-white px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-700">{COMPETENCY_DOMAIN_LABELS[domain]}</p>
                  <Badge variant="outline" className={cn("text-[10px] border", LEVEL_COLOUR[score])}>
                    {score} — {COMPETENCY_LEVEL_LABELS[score]}
                  </Badge>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", LEVEL_BAR[score])}
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 text-xs text-indigo-700">
            Scores are derived from competency profile assessment, practice observations, and appraisal records.
            <Link href="/workforce/aria-planner" className="ml-1 underline hover:text-indigo-900">
              Generate ARIA development plan →
            </Link>
          </div>
        </div>
      )}

      {/* ── Dev Plans tab ─────────────────────────────────────────────── */}
      {tab === "plans" && (
        <div className="space-y-4">
          {plans.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <GitMerge className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No development plans yet</p>
              <Link href="/workforce/aria-planner">
                <Button size="sm" className="mt-3 gap-1.5 bg-indigo-600 text-white">
                  <Sparkles className="h-3.5 w-3.5" /> Generate with ARIA
                </Button>
              </Link>
            </div>
          ) : (
            plans.map((plan) => {
              const completed = plan.actions.filter((a) => a.completed).length;
              const total     = plan.actions.length;
              return (
                <div key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800 mb-0.5">{plan.title}</p>
                      <p className="text-xs text-slate-500">
                        {PATHWAY_STAGE_LABELS[plan.from_stage]} → {PATHWAY_STAGE_LABELS[plan.to_stage]}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[10px] border",
                      plan.status === "active" ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : "text-slate-600 bg-slate-50 border-slate-200",
                    )}>
                      {plan.status}
                    </Badge>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{ width: total > 0 ? `${(completed / total) * 100}%` : "0%" }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{completed}/{total} actions complete</p>
                  <div className="space-y-1.5">
                    {plan.actions.map((action) => (
                      <div key={action.id} className="flex items-start gap-2 text-xs">
                        {action.completed
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          : <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />}
                        <div>
                          <span className={action.completed ? "line-through text-slate-400" : "text-slate-700"}>{action.title}</span>
                          <span className="ml-2 text-[10px] text-slate-400">{COMPETENCY_DOMAIN_LABELS[action.domain]}</span>
                          {action.target_date && !action.completed && (
                            <span className="ml-2 text-[10px] text-slate-400">· {action.target_date}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {plan.aria_rationale && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5">
                      <p className="text-[10px] font-semibold text-indigo-600 mb-0.5">ARIA Rationale</p>
                      <p className="text-xs text-indigo-800 leading-relaxed">{plan.aria_rationale}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Observations tab ──────────────────────────────────────────── */}
      {tab === "observations" && (
        <div className="space-y-3">
          {obs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Microscope className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No practice observations recorded</p>
            </div>
          ) : (
            obs.map((o) => (
              <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{o.context}</p>
                    <p className="text-xs text-slate-500">{o.observation_date}</p>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[10px] border",
                    o.outcome === "outstanding" ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : o.outcome === "meets_standard" ? "text-blue-700 bg-blue-50 border-blue-200"
                    : "text-amber-700 bg-amber-50 border-amber-200",
                  )}>
                    {o.outcome.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{o.narrative}</p>
                {o.strengths_noted.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-700 mb-1">Strengths</p>
                    <ul className="space-y-0.5">
                      {o.strengths_noted.map((s) => <li key={s} className="text-xs text-emerald-800">· {s}</li>)}
                    </ul>
                  </div>
                )}
                {o.aria_summary && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2">
                    <p className="text-[10px] font-semibold text-indigo-600 mb-0.5">ARIA</p>
                    <p className="text-xs text-indigo-800">{o.aria_summary}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Appraisals tab ────────────────────────────────────────────── */}
      {tab === "appraisals" && (
        <div className="space-y-3">
          {appraisals.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Star className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No appraisals on record</p>
            </div>
          ) : (
            appraisals.map((appraisal) => (
              <div key={appraisal.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {appraisal.appraisal_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-slate-500">{appraisal.appraisal_date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                      "text-[10px] border",
                      appraisal.status === "completed" ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : appraisal.status === "overdue" ? "text-red-700 bg-red-50 border-red-200"
                      : "text-amber-700 bg-amber-50 border-amber-200",
                    )}>
                      {appraisal.status}
                    </Badge>
                    {appraisal.overall_rating && (
                      <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-700 bg-blue-50">
                        {appraisal.overall_rating.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                </div>
                {appraisal.key_achievements && (
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-700 mb-0.5">Achievements</p>
                    <p className="text-xs text-slate-700">{appraisal.key_achievements}</p>
                  </div>
                )}
                {appraisal.aria_insights && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2">
                    <p className="text-[10px] font-semibold text-indigo-600 mb-0.5">ARIA Insights</p>
                    <p className="text-xs text-indigo-800">{appraisal.aria_insights}</p>
                  </div>
                )}
                <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                  {appraisal.signed_by_staff && (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> Signed by staff
                    </span>
                  )}
                  {appraisal.next_review_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Next: {appraisal.next_review_date}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Qualifications tab ────────────────────────────────────────── */}
      {tab === "qualifications" && (
        <div className="space-y-2">
          {quals.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Award className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No qualifications recorded</p>
            </div>
          ) : (
            quals.map((qual) => (
              <div key={qual.id} className={cn(
                "rounded-xl border bg-white p-3",
                qual.status === "expired" || (qual.mandatory && qual.status === "not_started")
                  ? "border-red-200"
                  : "border-slate-200",
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-xs font-semibold text-slate-800">{qual.qualification_name}</p>
                      {qual.mandatory && (
                        <Badge variant="outline" className="text-[9px] border-rose-200 text-rose-700">Mandatory</Badge>
                      )}
                    </div>
                    {qual.awarding_body && <p className="text-[10px] text-slate-400">{qual.awarding_body}{qual.level ? ` · ${qual.level}` : ""}</p>}
                    {qual.regulatory_requirement && <p className="text-[9px] text-slate-400 mt-0.5">{qual.regulatory_requirement}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline" className={cn(
                      "text-[10px] border",
                      qual.status === "completed" ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : qual.status === "in_progress" ? "text-amber-700 bg-amber-50 border-amber-200"
                      : qual.status === "expired" ? "text-red-700 bg-red-50 border-red-200"
                      : "text-slate-600 bg-slate-50 border-slate-200",
                    )}>
                      {qual.status.replace(/_/g, " ")}
                    </Badge>
                    {qual.expiry_date && (
                      <p className="text-[9px] text-slate-400 mt-0.5">Exp: {qual.expiry_date}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      </div>{/* close #staff-profile-content */}
    </PageShell>
  );
}
