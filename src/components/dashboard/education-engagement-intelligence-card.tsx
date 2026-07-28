"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, AlertTriangle, Brain, Loader2, Users, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { EducationIntelligenceResult } from "@/lib/engines/education-intelligence-engine";

interface EducationIntelligenceResponse {
  data: EducationIntelligenceResult;
}

function useEducationIntelligence() {
  return useQuery({
    queryKey: ["education-intelligence"],
    queryFn: () => api.get<EducationIntelligenceResponse>("/education-intelligence"),
    refetchInterval: 60_000, // 60 second refresh
  });
}

const ALERT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  high: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  medium: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  low: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function EducationEngagementIntelligenceCard() {
  const { data, isLoading } = useEducationIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const intel = data?.data;
  if (!intel) return null;

  const overview = intel.overview;
  const childProfiles = intel.child_profiles ?? [];
  const activityCategories = intel.activities?.categories ?? [];
  const alerts = intel.alerts ?? [];
  const insights = intel.insights ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand" />
            Education Engagement
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              overview.neet_count === 0
                ? "text-green-700 bg-green-50 border-green-200"
                : "text-red-700 bg-red-50 border-red-200"
            )}
          >
            {overview.neet_count === 0 ? "All in EET" : `${overview.neet_count} NEET`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary strip */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg p-2 bg-green-50">
            <p className="text-lg font-bold tabular-nums text-green-600">
              {overview.in_education}
            </p>
            <p className="text-[10px] text-muted-foreground">In Education</p>
          </div>

          <div
            className={cn(
              "text-center rounded-lg p-2",
              overview.neet_count === 0 ? "bg-green-50" : "bg-red-50"
            )}
          >
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                overview.neet_count === 0 ? "text-[--cs-success]" : "text-[--cs-risk]"
              )}
            >
              {overview.neet_count}
            </p>
            <p className="text-[10px] text-muted-foreground">NEET</p>
          </div>

          <div
            className={cn(
              "text-center rounded-lg p-2",
              overview.pep_overdue_count === 0 ? "bg-green-50" : "bg-amber-50"
            )}
          >
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                overview.pep_overdue_count === 0 ? "text-[--cs-success]" : "text-[--cs-warning]"
              )}
            >
              {overview.pep_current_count}
            </p>
            <p className="text-[10px] text-muted-foreground">PEP Current</p>
          </div>

          <div className="text-center rounded-lg p-2 bg-blue-50">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {overview.total_children}
            </p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
        </div>

        {/* Child profiles */}
        {childProfiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Child Profiles
            </p>
            <div className="space-y-1">
              {childProfiles.map((child, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded border p-2 text-xs"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <BookOpen className="h-3 w-3 text-teal-500 shrink-0" />
                    <span className="font-medium">{child.child_name}</span>
                    {child.school && (
                      <span className="text-muted-foreground truncate">{child.school}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        child.pep_current
                          ? "text-green-700 bg-green-50 border-green-200"
                          : "text-amber-700 bg-amber-50 border-amber-200"
                      )}
                    >
                      PEP {child.pep_current ? "current" : "overdue"}
                    </Badge>
                    {child.attendance_trend !== "unknown" && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-blue-700 bg-blue-50 border-blue-200"
                      >
                        {child.attendance_trend}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activities */}
        {activityCategories.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              Activities &amp; Engagement
            </p>
            <div className="space-y-1">
              {activityCategories.map((cat, i) => (
                <div key={i} className="rounded border p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{cat.label}</span>
                    <span className="text-muted-foreground text-[10px] tabular-nums">{cat.count} in 30d</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Education Alerts
            </p>
            {alerts.map((a: { severity: string; message: string }, i: number) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  ALERT_STYLES[a.severity] ?? ALERT_STYLES.medium
                )}
              >
                {a.message}
              </div>
            ))}
          </div>
        )}

        {/* Cara Insights */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Engagement Intelligence
            </p>
            {insights.map((insight: { severity: string; text: string }, i: number) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive
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
