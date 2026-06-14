"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — WORKFORCE INTELLIGENCE HUB
// Staff Development, Competency & Succession Dashboard
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import {
  Network, Sparkles, Users, TrendingUp, GitBranch, Milestone,
  BarChart2, UserCheck, ShieldCheck, Award, Microscope, Briefcase,
  GraduationCap, MessageSquare, AlertTriangle, CheckCircle2,
  ChevronRight, ArrowUpRight, Telescope, Clock,
} from "lucide-react";
import { useCompetencyProfiles } from "@/hooks/use-workforce";
import { useAppraisals } from "@/hooks/use-workforce";
import { useSuccessionPlans } from "@/hooks/use-workforce";
import { useQualifications } from "@/hooks/use-workforce";
import { useInductionRecords } from "@/hooks/use-workforce";
import { useStaff } from "@/hooks/use-staff";
import {
  PATHWAY_STAGE_LABELS,
  COMPETENCY_DOMAIN_LABELS,
  type PathwayStage,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const STAGE_COLOURS: Record<PathwayStage, string> = {
  inductee:           "bg-slate-100 text-slate-700 border-slate-200",
  rsw:                "bg-blue-50 text-blue-700 border-blue-200",
  senior_rsw:         "bg-sky-50 text-sky-700 border-sky-200",
  team_leader:        "bg-violet-50 text-violet-700 border-violet-200",
  deputy_manager:     "bg-amber-50 text-amber-700 border-amber-200",
  registered_manager: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ri:                 "bg-rose-50 text-rose-700 border-rose-200",
};

const READINESS_COLOUR = (score: number) =>
  score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600";

const READINESS_BG = (score: number) =>
  score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";

const MODULE_TILES = [
  { href: "/workforce/pathway",         icon: Milestone,      label: "Career Pathway",        desc: "5-stage progression ladder",         colour: "text-violet-600 bg-violet-50 border-violet-100" },
  { href: "/workforce/competency",      icon: BarChart2,      label: "Competency Framework",  desc: "10-domain scoring matrix",           colour: "text-blue-600 bg-blue-50 border-blue-100" },
  { href: "/workforce/cara-planner",    icon: Sparkles,       label: "Cara Dev Planner",      desc: "Cara-generated development plans",   colour: "text-indigo-600 bg-indigo-50 border-indigo-100" },
  { href: "/workforce/succession",      icon: GitBranch,      label: "Succession Board",      desc: "Role coverage & readiness",          colour: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  { href: "/workforce/leadership",      icon: Telescope,      label: "Leadership Readiness",  desc: "Cara leadership gap analysis",       colour: "text-amber-600 bg-amber-50 border-amber-100" },
  { href: "/workforce/appraisals",      icon: UserCheck,      label: "Appraisals",            desc: "Annual & probation reviews",         colour: "text-teal-600 bg-teal-50 border-teal-100" },
  { href: "/workforce/induction",       icon: ShieldCheck,    label: "Induction Tracker",     desc: "Day 1 to probation completion",      colour: "text-rose-600 bg-rose-50 border-rose-100" },
  { href: "/workforce/training-matrix", icon: GraduationCap,  label: "Training Matrix",       desc: "Team training coverage overview",    colour: "text-sky-600 bg-sky-50 border-sky-100" },
  { href: "/workforce/observations",    icon: Microscope,     label: "Practice Observations", desc: "Direct practice observation log",    colour: "text-purple-600 bg-purple-50 border-purple-100" },
  { href: "/workforce/supervision",     icon: MessageSquare,  label: "Supervision Hub",       desc: "Reflective supervision records",     colour: "text-slate-600 bg-slate-50 border-slate-100" },
  { href: "/workforce/evidence",        icon: Briefcase,      label: "Evidence Portfolio",    desc: "CPD & practice evidence store",      colour: "text-orange-600 bg-orange-50 border-orange-100" },
  { href: "/workforce/qualifications",  icon: Award,          label: "Qualifications",        desc: "Regulatory fitness tracker",         colour: "text-green-600 bg-green-50 border-green-100" },
  { href: "/workforce/staff",           icon: Users,          label: "Staff Profiles",        desc: "Individual competency deep-dives",   colour: "text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100" },
];

export default function WorkforceHubPage() {
  const [showCara, setShowCara] = useState(false);

  const profilesQuery  = useCompetencyProfiles({ homeId: "home_oak" });
  const appraisalsQuery = useAppraisals();
  const successionQuery = useSuccessionPlans({ homeId: "home_oak" });
  const qualsQuery     = useQualifications();
  const inductionQuery = useInductionRecords();
  const staffQuery     = useStaff();

  const profiles   = profilesQuery.data?.data ?? [];
  const appraisals = appraisalsQuery.data?.data ?? [];
  const succession = successionQuery.data?.data ?? [];
  const quals      = qualsQuery.data?.data ?? [];
  const inductions = inductionQuery.data?.data ?? [];
  const staff      = staffQuery.data?.data ?? [];

  const avgReadiness = profiles.length
    ? Math.round(profiles.reduce((s, p) => s + p.overall_readiness_score, 0) / profiles.length)
    : 0;

  const overdueAppraisals = appraisals.filter((a) => a.status === "overdue").length;
  const activeInductions  = inductions.filter((r) => r.overall_status === "in_progress").length;
  const qualGaps = quals.filter((q) => q.mandatory && q.status === "not_started").length;
  const activePlansCount = succession.length;

  const getStaffName = (id: string) => {
    const s = staff.find((m) => m.id === id);
    return s ? s.full_name : id;
  };

  return (
    <PageShell
      title="Workforce Intelligence"
      subtitle="Staff development, competency & succession — powered by Cara"
      caraContext={{ pageTitle: "Workforce Intelligence", sourceType: "staff" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Workforce Hub" subtitle="Chamberlain House — Workforce Intelligence" targetId="workforce-content" />
          <SmartUploadButton variant="inline" label="Upload Evidence" uploadContext="Workforce Hub — staff evidence or qualification upload" />
          <Button
            size="sm"
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => setShowCara((p) => !p)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Cara Workforce Analysis
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* Cara Panel */}
      {showCara && (
        <div className="relative">
          <button onClick={() => setShowCara(false)} className="absolute top-3 right-3 z-10 text-slate-400 hover:text-slate-600 text-xs">✕ Close</button>
          <CaraPanel
            mode="staff_development_summary"
            pageContext={`Workforce hub: ${profiles.length} staff profiles, avg readiness ${avgReadiness}/100. ${overdueAppraisals} overdue appraisals. ${qualGaps} mandatory qualification gaps. Succession plans: ${activePlansCount} active.`}
          />
        </div>
      )}

      {/* KPI Banner */}
      <div id="workforce-content" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Avg Team Readiness",
            value: `${avgReadiness}%`,
            icon: TrendingUp,
            colour: READINESS_COLOUR(avgReadiness),
            bg: avgReadiness >= 80 ? "border-emerald-200 bg-emerald-50/40" : avgReadiness >= 60 ? "border-amber-200 bg-amber-50/40" : "border-red-200 bg-red-50/40",
          },
          {
            label: "Overdue Appraisals",
            value: overdueAppraisals,
            icon: Clock,
            colour: overdueAppraisals > 0 ? "text-red-600" : "text-emerald-600",
            bg: overdueAppraisals > 0 ? "border-red-200 bg-red-50/40" : "border-emerald-200 bg-emerald-50/40",
          },
          {
            label: "Active Inductions",
            value: activeInductions,
            icon: ShieldCheck,
            colour: "text-sky-600",
            bg: "border-sky-200 bg-sky-50/40",
          },
          {
            label: "Mandatory Qual Gaps",
            value: qualGaps,
            icon: AlertTriangle,
            colour: qualGaps > 0 ? "text-amber-600" : "text-emerald-600",
            bg: qualGaps > 0 ? "border-amber-200 bg-amber-50/40" : "border-emerald-200 bg-emerald-50/40",
          },
        ].map((kpi) => (
          <div key={kpi.label} className={cn("rounded-2xl border p-4", kpi.bg)}>
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon className={cn("h-4 w-4", kpi.colour)} />
              <span className="text-xs text-slate-500">{kpi.label}</span>
            </div>
            <p className={cn("text-2xl font-bold", kpi.colour)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Staff Readiness Snapshot */}
      {profiles.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-semibold text-slate-800">Staff Readiness Snapshot</span>
            </div>
            <Link href="/workforce/staff">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-indigo-600 hover:text-indigo-800">
                View all <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/workforce/staff/${profile.staff_id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-indigo-700">
                    {getStaffName(profile.staff_id).split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{getStaffName(profile.staff_id)}</p>
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", STAGE_COLOURS[profile.current_stage])}>
                    {PATHWAY_STAGE_LABELS[profile.current_stage]}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Readiness</span>
                      <span className={cn("text-xs font-bold", READINESS_COLOUR(profile.overall_readiness_score))}>
                        {profile.overall_readiness_score}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", READINESS_BG(profile.overall_readiness_score))}
                        style={{ width: `${profile.overall_readiness_score}%` }}
                      />
                    </div>
                  </div>
                  {profile.target_stage && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <ArrowUpRight className="h-3 w-3" />
                      <span className="hidden sm:inline">{PATHWAY_STAGE_LABELS[profile.target_stage]}</span>
                    </div>
                  )}
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Succession Snapshot */}
      {succession.length > 0 && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-900">Succession Coverage</span>
            </div>
            <Link href="/workforce/succession">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-emerald-700 hover:text-emerald-900">
                Full board <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-emerald-50">
            {succession.map((plan) => {
              const urgencyColour =
                plan.urgency === "immediate" ? "text-red-600 bg-red-50 border-red-200"
                : plan.urgency === "six_months" ? "text-amber-600 bg-amber-50 border-amber-200"
                : "text-slate-600 bg-slate-50 border-slate-200";
              return (
                <div key={plan.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-semibold text-slate-800">{plan.role_title}</p>
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 border capitalize", urgencyColour)}>
                      {plan.urgency.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {plan.candidates.map((c) => (
                      <div key={c.staff_id} className="flex items-center gap-1.5 text-xs text-slate-600">
                        {c.ready_now ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Clock className="h-3 w-3 text-amber-500" />
                        )}
                        <span>{getStaffName(c.staff_id)}</span>
                        <span className={cn("font-semibold", READINESS_COLOUR(c.readiness_score))}>
                          {c.readiness_score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Module Tiles */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">All Modules</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULE_TILES.map((tile) => (
            <Link key={tile.href} href={tile.href}>
              <div className={cn(
                "rounded-2xl border p-4 hover:shadow-sm transition-all cursor-pointer",
                tile.colour,
              )}>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/60 shrink-0">
                    <tile.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{tile.label}</p>
                    <p className="text-xs opacity-70 truncate">{tile.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-40 shrink-0 mt-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Regulatory Note */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Regulatory Basis — </span>
        Children&apos;s Homes (England) Regulations 2015: Reg 29 (RM qualifications), Reg 32 (staff qualifications),
        Reg 33 (induction), Reg 34 (supervision). ILACS Framework — Quality of Care theme: workforce capabilities
        and succession. Reg 44/45 — evidence of staff development activity.
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
