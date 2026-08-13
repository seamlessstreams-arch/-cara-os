"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD IMPACT VIEW
// Beautiful, warm, child-centred impact view across 10 care domains.
// Hero card with overall progress, domain cards in a responsive grid,
// achievements, actions, risks, goals, and a narrative "story mode" flow.
//
// CHR 2015 Reg 5, Reg 6, Reg 7, Reg 9, Reg 13, Reg 14, Reg 16.
// SCCIF: "Progress and experiences of children and young people."
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import type { ChildImpactDomain, ChildImpactView as ChildImpactViewType } from "@/lib/impact/types";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  GraduationCap,
  Handshake,
  Heart,
  Home,
  Loader2,
  MessageCircle,
  Minus,
  Shield,
  Sparkles,
  Stethoscope,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { api } from "@/hooks/use-api";
// ── Data (inlined from the former use-child-impact hook) ────────────────────

function useChildImpact(childId: string) {
  return useQuery<{ data: ChildImpactViewType }>({
    queryKey: ["child-impact", childId],
    queryFn: () =>
      api.get<{ data: ChildImpactViewType }>(`/api/v1/child-impact/${childId}`),
    enabled: !!childId,
    refetchInterval: 60_000,
  });
}

// ── Style Maps ──────────────────────────────────────────────────────────────

const PROGRESS_STYLES: Record<
  ChildImpactViewType["overall_progress"],
  { bg: string; text: string; border: string; label: string; color: string }
> = {
  significant: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", label: "Significant Progress", color: "bg-emerald-500" },
  good:        { bg: "bg-blue-50",    text: "text-blue-800",    border: "border-blue-200",    label: "Good Progress",        color: "bg-blue-500" },
  some:        { bg: "bg-amber-50",   text: "text-amber-800",   border: "border-amber-200",   label: "Some Progress",        color: "bg-amber-500" },
  limited:     { bg: "bg-red-50",     text: "text-red-800",     border: "border-red-200",     label: "Limited Progress",     color: "bg-red-500" },
  not_assessed: { bg: "bg-slate-50",  text: "text-slate-600",   border: "border-slate-200",   label: "Not Yet Assessed",     color: "bg-slate-400" },
};

const STATUS_STYLES: Record<
  ChildImpactDomain["current_status"],
  { bg: string; text: string; label: string }
> = {
  improving:     { bg: "bg-emerald-100", text: "text-emerald-800", label: "Improving" },
  stable:        { bg: "bg-blue-100",    text: "text-blue-800",    label: "Stable" },
  declining:     { bg: "bg-red-100",     text: "text-red-800",     label: "Declining" },
  not_assessed:  { bg: "bg-slate-100",   text: "text-slate-600",   label: "Not Assessed" },
};

const SCORE_COLOR = (score: number): string => {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  if (score > 0)   return "bg-red-500";
  return "bg-slate-300";
};

const DOMAIN_ICONS: Record<string, typeof Activity> = {
  risk_reduction:       Shield,
  care_plan_progress:   Target,
  behaviour_wellbeing:  Heart,
  education:            GraduationCap,
  health:               Stethoscope,
  relationships:        Users,
  direct_work:          Handshake,
  independence:         Compass,
  voice_participation:  MessageCircle,
  safety_stability:     Home,
};

// ── Sub-components ──────────────────────────────────────────────────────────

function TrendArrow({ trend }: { trend: "up" | "flat" | "down" }) {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-600" />;
  return <Minus className="h-3.5 w-3.5 text-slate-400" />;
}

function DomainCard({ domain }: { domain: ChildImpactDomain }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = DOMAIN_ICONS[domain.domain] ?? Activity;
  const statusStyle = STATUS_STYLES[domain.current_status];

  return (
    <Card className="overflow-hidden border-slate-200 hover:border-slate-300 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
        aria-expanded={expanded}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-slate-100">
                <Icon className="h-4 w-4 text-slate-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-900">
                {domain.label}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <TrendArrow trend={domain.trend} />
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", statusStyle.bg, statusStyle.text)}>
                {statusStyle.label}
              </span>
              {expanded
                ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          {/* Score bar */}
          <div className="flex items-center gap-3">
            <Progress
              value={domain.score}
              color={SCORE_COLOR(domain.score)}
              className="flex-1 h-2"
            />
            <span className="text-xs font-bold text-slate-700 tabular-nums w-8 text-right">
              {domain.score}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">
              {domain.evidence_count} evidence item{domain.evidence_count !== 1 ? "s" : ""}
            </span>
          </div>
        </CardContent>
      </button>

      {/* Expandable highlights & concerns */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {domain.highlights.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">
                Highlights
              </p>
              {domain.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 rounded-lg px-2.5 py-1.5">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          )}
          {domain.concerns.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
                Concerns
              </p>
              {domain.concerns.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 rounded-lg px-2.5 py-1.5">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          )}
          {domain.highlights.length === 0 && domain.concerns.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No specific highlights or concerns at this time.</p>
          )}
        </div>
      )}
    </Card>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: typeof Activity; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-slate-500" />
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function ChildImpactViewComponent({ childId }: { childId: string }) {
  const { data, isLoading, error } = useChildImpact(childId);

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <p className="text-sm text-muted-foreground">Building impact view...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.data) {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Unable to load impact view. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const d = data.data;
  const progressStyle = PROGRESS_STYLES[d.overall_progress];

  return (
    <div className="space-y-6" id="child-impact-content">
      {/* ── Hero Card ──────────────────────────────────────────────────────── */}
      <Card className={cn("overflow-hidden border-2", progressStyle.border)}>
        <div className={cn("px-6 py-5", progressStyle.bg)}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-bold text-slate-900">
                  {d.child_name}
                </h2>
                <span className={cn("text-xs font-bold px-3 py-1 rounded-full border", progressStyle.bg, progressStyle.text, progressStyle.border)}>
                  {progressStyle.label}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Impact assessment as of {new Date(d.assessment_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <PrintButton
              title={`Impact View — ${d.child_name}`}
              subtitle={`Assessment date: ${d.assessment_date}`}
              targetId="child-impact-content"
            />
          </div>

          {/* Key stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            <div className="bg-white/70 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{d.overall_score}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Overall Score</p>
            </div>
            <div className="bg-white/70 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{d.placement_duration_days}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Days in Placement</p>
            </div>
            <div className="bg-white/70 rounded-xl px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <p className="text-2xl font-bold text-slate-900">{d.total_incidents}</p>
                <TrendArrow trend={d.incidents_trend} />
              </div>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Total Incidents</p>
            </div>
            <div className="bg-white/70 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{d.total_direct_work_hours}h</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Direct Work Hours</p>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="mt-4">
            <Progress value={d.overall_score} color={progressStyle.color} className="h-3" />
          </div>
        </div>
      </Card>

      {/* ── Domain Cards Grid ──────────────────────────────────────────────── */}
      <div>
        <SectionHeader icon={Activity} title="Care Domains" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {d.domains.map((domain) => (
            <DomainCard key={domain.domain} domain={domain} />
          ))}
        </div>
      </div>

      {/* ── Key Achievements ───────────────────────────────────────────────── */}
      {d.key_achievements.length > 0 && (
        <Card className="overflow-hidden border-emerald-200 bg-emerald-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-emerald-800">
              <Sparkles className="h-4 w-4" />
              Key Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.key_achievements.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-100/60 rounded-lg px-3 py-2">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-600" />
                <span>{a}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Outstanding Actions ────────────────────────────────────────────── */}
      {d.outstanding_actions.length > 0 && (
        <Card className="overflow-hidden border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Outstanding Actions
              <Badge variant="warning" className="ml-auto">
                {d.outstanding_actions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.outstanding_actions.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-800 bg-amber-100/60 rounded-lg px-3 py-2">
                <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
                <span>{a}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Risks Reduced & Goals Progressed ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {d.risks_reduced.length > 0 && (
          <Card className="overflow-hidden border-emerald-200 bg-emerald-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-emerald-800">
                <Shield className="h-4 w-4" />
                Risks Reduced
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {d.risks_reduced.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-emerald-800">
                  <ArrowDown className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{r}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {d.goals_progressed.length > 0 && (
          <Card className="overflow-hidden border-emerald-200 bg-emerald-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-emerald-800">
                <Target className="h-4 w-4" />
                Goals Progressed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {d.goals_progressed.map((g, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-emerald-800">
                  <ArrowUp className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{g}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Relationships Supported ────────────────────────────────────────── */}
      {d.relationships_supported.length > 0 && (
        <Card className="overflow-hidden border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
              <Users className="h-4 w-4" />
              Relationships Supported
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {d.relationships_supported.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-blue-800 bg-blue-100/50 rounded-lg px-3 py-2">
                <Heart className="h-3 w-3 mt-0.5 shrink-0 text-blue-600" />
                <span>{r}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Story Mode: The Narrative ──────────────────────────────────────── */}
      <Card className="overflow-hidden border-slate-200 bg-slate-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-slate-800">
            <BookOpen className="h-4 w-4" />
            The Story So Far
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-slate-700 leading-relaxed space-y-3">
            <p>
              <strong>{d.child_name}</strong> has been in placement for{" "}
              <strong>
                {d.placement_duration_days >= 365
                  ? `${Math.floor(d.placement_duration_days / 365)} year${Math.floor(d.placement_duration_days / 365) > 1 ? "s" : ""} and ${Math.floor((d.placement_duration_days % 365) / 30)} months`
                  : d.placement_duration_days >= 30
                    ? `${Math.floor(d.placement_duration_days / 30)} months`
                    : `${d.placement_duration_days} days`}
              </strong>.
              Overall, {d.child_name.split(" ")[0]} is making{" "}
              <strong className={progressStyle.text}>
                {progressStyle.label.toLowerCase()}
              </strong>{" "}
              across the assessed care domains, with an overall impact score of{" "}
              <strong>{d.overall_score} out of 100</strong>.
            </p>

            {d.key_achievements.length > 0 && (
              <p>
                Key achievements include:{" "}
                {d.key_achievements.slice(0, 3).join("; ")}.
                {d.key_achievements.length > 3 && ` And ${d.key_achievements.length - 3} more.`}
              </p>
            )}

            {(() => {
              const strongDomains = d.domains.filter((dm) => dm.score >= 70);
              const weakDomains = d.domains.filter((dm) => dm.score > 0 && dm.score < 40);
              return (
                <>
                  {strongDomains.length > 0 && (
                    <p>
                      {d.child_name.split(" ")[0]} is doing particularly well in{" "}
                      <strong>{strongDomains.map((dm) => dm.label.toLowerCase()).join(", ")}</strong>.
                    </p>
                  )}
                  {weakDomains.length > 0 && (
                    <p>
                      Areas that need more focus include{" "}
                      <strong>{weakDomains.map((dm) => dm.label.toLowerCase()).join(", ")}</strong>.
                      The team will continue to prioritise support in these areas.
                    </p>
                  )}
                </>
              );
            })()}

            {d.total_direct_work_hours > 0 && (
              <p>
                Staff have invested <strong>{d.total_direct_work_hours} hours</strong> of
                direct work with {d.child_name.split(" ")[0]}, demonstrating the team&apos;s
                commitment to building meaningful relationships and supporting progress.
              </p>
            )}

            {d.total_incidents > 0 && (
              <p>
                There have been <strong>{d.total_incidents} incident{d.total_incidents > 1 ? "s" : ""}</strong> recorded.
                {d.incidents_trend === "down"
                  ? " Encouragingly, the trend is downward, reflecting the impact of the team's work."
                  : d.incidents_trend === "up"
                    ? " The team is aware of the upward trend and has put additional support in place."
                    : " The team continues to monitor and respond proactively."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Next Steps ─────────────────────────────────────────────────────── */}
      {d.next_steps.length > 0 && (
        <Card className="overflow-hidden border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-800">
              <ArrowRight className="h-4 w-4" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {d.next_steps.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-100/60 rounded-lg px-3 py-2">
                <ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-slate-500" />
                <span>{s}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Lessons Learned ────────────────────────────────────────────────── */}
      {d.lessons_learned.length > 0 && (
        <Card className="overflow-hidden border-violet-200 bg-violet-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-violet-800">
              <BookOpen className="h-4 w-4" />
              Lessons Learned
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {d.lessons_learned.map((l, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-violet-800 bg-violet-100/50 rounded-lg px-3 py-2">
                <Sparkles className="h-3 w-3 mt-0.5 shrink-0 text-violet-600" />
                <span>{l}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
