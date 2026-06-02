"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD INDEPENDENCE & LIFE SKILLS INTELLIGENCE CARD
// Per-child independence analysis: life skills proficiency, pathway plan
// compliance, transition readiness, and leaving care preparation.
// Children (Leaving Care) Act 2000, CSWA 2017, CHR 2015 Reg 5, 14.
// SCCIF: "Outcomes for children" — preparation for adulthood.
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, Rocket, MapPin,
  AlertCircle, Sparkles, Users, GraduationCap, Home,
  FileText, Target, Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChildIndependenceIntelligence } from "@/hooks/use-child-independence-intelligence";
import type { ReadinessStatus, SkillProficiency } from "@/lib/engines/child-independence-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ReadinessStatus, { bg: string; text: string; border: string; label: string }> = {
  well_prepared:     { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "WELL PREPARED" },
  on_track:          { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "ON TRACK" },
  developing:        { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "DEVELOPING" },
  behind:            { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300", label: "BEHIND" },
  at_risk:           { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "AT RISK" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-600",  border: "border-slate-300",  label: "NO DATA" },
};

const PROF_COLORS: Record<SkillProficiency, string> = {
  independent: "bg-green-500",
  competent: "bg-blue-500",
  developing: "bg-amber-500",
  emerging: "bg-orange-400",
  not_started: "bg-slate-300",
};

const PROF_TEXT: Record<SkillProficiency, string> = {
  independent: "text-green-700",
  competent: "text-blue-700",
  developing: "text-amber-700",
  emerging: "text-orange-700",
  not_started: "text-slate-500",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-red-200 bg-red-50 text-red-800",
  soon: "border-amber-200 bg-amber-50 text-amber-800",
  planned: "border-blue-200 bg-blue-50 text-blue-800",
};

// ── Component ───────────────────────────────────────────────────────────────

export function ChildIndependenceIntelligenceCard({ childId }: { childId: string }) {
  const { data, isLoading } = useChildIndependenceIntelligence(childId);

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const statusStyle = STATUS_STYLES[d.readiness_status] ?? STATUS_STYLES.insufficient_data;
  const so = d.skills_overview;
  const pc = d.pathway_compliance;

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Rocket className="h-4 w-4 text-violet-500" />
            <span className="text-slate-900">Independence & Life Skills</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", statusStyle.bg, statusStyle.text, statusStyle.border)}>
              {statusStyle.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-600">{d.readiness_score}%</span>
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Skills Proficiency Overview */}
        {so.total_skills > 0 && (
          <>
            <div className="grid grid-cols-5 gap-2">
              <div className="text-center rounded-lg bg-green-50 p-2">
                <p className="text-lg font-bold tabular-nums text-green-600">{so.independent_count}</p>
                <p className="text-[10px] text-muted-foreground">Independent</p>
              </div>
              <div className="text-center rounded-lg bg-blue-50 p-2">
                <p className="text-lg font-bold tabular-nums text-blue-600">{so.competent_count}</p>
                <p className="text-[10px] text-muted-foreground">Competent</p>
              </div>
              <div className="text-center rounded-lg bg-amber-50 p-2">
                <p className="text-lg font-bold tabular-nums text-amber-600">{so.developing_count}</p>
                <p className="text-[10px] text-muted-foreground">Developing</p>
              </div>
              <div className="text-center rounded-lg bg-orange-50 p-2">
                <p className="text-lg font-bold tabular-nums text-orange-600">{so.emerging_count}</p>
                <p className="text-[10px] text-muted-foreground">Emerging</p>
              </div>
              <div className={cn("text-center rounded-lg p-2", so.not_started_count > 0 ? "bg-red-50" : "bg-slate-50")}>
                <p className={cn("text-lg font-bold tabular-nums", so.not_started_count > 0 ? "text-red-600" : "text-slate-400")}>{so.not_started_count}</p>
                <p className="text-[10px] text-muted-foreground">Not Started</p>
              </div>
            </div>

            {/* Per-Skill Bars */}
            <div className="space-y-1.5">
              {(so.skills_by_category ?? []).map((skill, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-24 text-slate-700 font-medium truncate capitalize">{skill.category}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", PROF_COLORS[skill.proficiency])}
                      style={{ width: `${skill.proficiency === "independent" ? 100 : skill.proficiency === "competent" ? 75 : skill.proficiency === "developing" ? 50 : skill.proficiency === "emerging" ? 25 : 5}%` }}
                    />
                  </div>
                  <span className={cn("w-20 text-[10px] capitalize", PROF_TEXT[skill.proficiency])}>
                    {skill.proficiency.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pathway Plan Status */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <FileText className={cn("h-3.5 w-3.5 shrink-0", pc.has_plan && pc.plan_current ? "text-green-500" : pc.has_plan ? "text-amber-500" : "text-red-500")} />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">Pathway Plan</p>
              <p className="text-[10px] text-muted-foreground">
                {pc.has_plan ? (
                  <>
                    <span className={pc.plan_current ? "text-green-600" : "text-amber-600"}>
                      {pc.plan_current ? "Current" : "Review overdue"}
                    </span>
                    {pc.last_review_date && <span> · Last: {pc.last_review_date}</span>}
                  </>
                ) : (
                  <span className="text-red-600 font-medium">No plan</span>
                )}
              </p>
            </div>
          </div>
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <Users className={cn("h-3.5 w-3.5 shrink-0", pc.support_network_size >= 3 ? "text-green-500" : pc.support_network_size >= 1 ? "text-amber-500" : "text-red-500")} />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">Support Network</p>
              <p className="text-[10px] text-muted-foreground">
                {pc.support_network_size} contact{pc.support_network_size !== 1 ? "s" : ""}
                {pc.personal_advisor_assigned && <span className="text-green-600"> · PA assigned</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Accommodation & EET */}
        {pc.has_plan && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 flex items-center gap-2 text-xs">
              <Home className={cn("h-3.5 w-3.5 shrink-0", pc.accommodation_identified ? "text-green-500" : "text-amber-500")} />
              <div className="min-w-0">
                <p className="font-medium text-slate-700">Accommodation</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {pc.accommodation_identified ? (
                    <span className="text-green-600">Identified</span>
                  ) : (
                    <span className="text-amber-600">Not yet confirmed</span>
                  )}
                </p>
              </div>
            </div>
            {pc.eet_plan && (
              <div className="rounded border p-2 flex items-center gap-2 text-xs">
                <GraduationCap className={cn("h-3.5 w-3.5 shrink-0", pc.eet_plan.toLowerCase().includes("disengaged") ? "text-red-500" : "text-green-500")} />
                <div className="min-w-0">
                  <p className="font-medium text-slate-700">EET</p>
                  <p className="text-[10px] text-muted-foreground truncate">{pc.eet_plan}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Aspirations */}
        {pc.aspirations.length > 0 && (
          <div className="rounded border border-violet-200 bg-violet-50 p-2 text-xs">
            <p className="font-medium text-violet-700 flex items-center gap-1 mb-1">
              <Target className="h-3 w-3" />
              Aspirations
            </p>
            {(pc.aspirations ?? []).map((a, i) => (
              <p key={i} className="text-[10px] text-violet-800">• {a}</p>
            ))}
          </div>
        )}

        {/* Child Voice */}
        {d.child_voice && (
          <div className="rounded border border-blue-200 bg-blue-50 p-2.5 text-xs text-blue-800 leading-relaxed">
            <p className="flex items-center gap-1 font-medium text-blue-700 mb-1">
              <Quote className="h-3 w-3" />
              {d.child_name}&apos;s Voice
            </p>
            <p className="italic text-[11px]">&ldquo;{d.child_voice}&rdquo;</p>
          </div>
        )}

        {/* Strengths */}
        {d.strengths.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Strengths ({d.strengths.length})
            </p>
            {d.strengths.slice(0, 3).map((s, i) => (
              <div key={i} className="rounded border border-green-200 bg-green-50 p-2.5 text-xs text-green-800 leading-relaxed">
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Concerns */}
        {d.concerns.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Concerns ({d.concerns.length})
            </p>
            {d.concerns.slice(0, 3).map((c, i) => (
              <div key={i} className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 leading-relaxed">
                {c}
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {d.recommendations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              Recommendations ({d.recommendations.length})
            </p>
            {d.recommendations.slice(0, 3).map((rec) => (
              <div key={rec.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", REC_STYLES[rec.urgency] ?? REC_STYLES.planned)}>
                <div className="flex items-start justify-between gap-2">
                  <span>{rec.recommendation}</span>
                  {rec.regulatory_ref && (
                    <span className="text-[10px] font-mono shrink-0 opacity-60">{rec.regulatory_ref}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ARIA Independence Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Independence Intelligence
            </p>
            {d.insights.slice(0, 3).map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
