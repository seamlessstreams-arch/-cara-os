"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LIFE SKILLS & INDEPENDENCE INTELLIGENCE CARD
// Dashboard card powered by the Life Skills Intelligence Engine.
// Reg 8, Reg 9, Reg 14, SCCIF Experiences & Progress.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Compass, ChevronRight, AlertTriangle,
  Brain, Target, Star, MapPin, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLifeSkillsIntelligence } from "@/hooks/use-life-skills-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high:     "border-red-200 bg-red-50 text-red-800",
  medium:   "border-amber-200 bg-amber-50 text-amber-800",
  low:      "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning:  "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

// ── Component ───────────────────────────────────────────────────────────────

export function LifeSkillsCard() {
  const { data, isLoading } = useLifeSkillsIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Compass className="h-4 w-4 text-brand" />
            Life Skills & Independence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const o = intel.overview;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Compass className="h-4 w-4 text-brand" />
            Life Skills & Independence
          </CardTitle>
          <Link href="/independence-skills" className="text-xs text-brand hover:underline flex items-center gap-1">
            Skills <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.avg_readiness >= 60 ? "bg-green-50" : o.avg_readiness >= 40 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.avg_readiness >= 60 ? "text-green-600" : o.avg_readiness >= 40 ? "text-amber-600" : "text-red-600",
            )}>
              {o.avg_readiness}%
            </p>
            <p className="text-[10px] text-muted-foreground">Readiness</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.children_assessed}
            </p>
            <p className="text-[10px] text-muted-foreground">Assessed</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-green-600">
              {o.pathway_plans_active}
            </p>
            <p className="text-[10px] text-muted-foreground">Pathways</p>
          </div>
          <div className="text-center rounded-lg bg-purple-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-purple-600">
              {o.domains_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Domains</p>
          </div>
        </div>

        {/* ── Child readiness profiles ─────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Independence Readiness
            </p>
            {intel.child_profiles.slice(0, 4).map((child) => (
              <div key={child.child_id} className="rounded-lg border p-2.5 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{child.child_name}</span>
                    {child.pathway_plan_linked && (
                      <Badge className="text-[10px] bg-purple-100 text-purple-700">
                        <MapPin className="h-2.5 w-2.5 mr-0.5" />
                        Pathway
                      </Badge>
                    )}
                  </div>
                  <Badge className={cn(
                    "text-[10px]",
                    child.readiness >= 60 ? "bg-green-100 text-green-700"
                      : child.readiness >= 40 ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700",
                  )}>
                    {child.readiness}%
                  </Badge>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      child.readiness >= 60 ? "bg-green-400"
                        : child.readiness >= 40 ? "bg-amber-400"
                        : "bg-red-400",
                    )}
                    style={{ width: `${child.readiness}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                  <span>
                    <Star className="h-2.5 w-2.5 inline mr-0.5 text-green-500" />
                    {child.strongest_domain}
                  </span>
                  <span>
                    <AlertTriangle className="h-2.5 w-2.5 inline mr-0.5 text-amber-500" />
                    {child.weakest_domain}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Domain averages ──────────────────────────────────────────── */}

        {intel.domain_averages.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Skill Domains (Home Average)</p>
            <div className="space-y-1">
              {intel.domain_averages.map((d) => (
                <div key={d.domain} className="flex items-center gap-2 text-xs">
                  <span className="w-36 text-muted-foreground truncate">{d.domain}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        d.avg_pct >= 60 ? "bg-green-400" : d.avg_pct >= 40 ? "bg-amber-400" : "bg-red-400",
                      )}
                      style={{ width: `${d.avg_pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right tabular-nums font-medium">{d.avg_pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Key metrics ──────────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-green-600 tabular-nums">{o.children_on_track}</p>
            <p className="text-[10px] text-muted-foreground">On Track</p>
          </div>
          <div>
            <p className={cn(
              "font-bold tabular-nums",
              o.children_attention_needed > 0 ? "text-amber-600" : "text-green-600",
            )}>
              {o.children_attention_needed}
            </p>
            <p className="text-[10px] text-muted-foreground">Need Attention</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.total_children}</p>
            <p className="text-[10px] text-muted-foreground">Total Children</p>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Independence Alerts
            </p>
            {intel.alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium,
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA Independence Intelligence ──────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Independence Intelligence
            </p>
            {intel.insights.slice(0, 3).map((insight, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive,
                )}
              >
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
