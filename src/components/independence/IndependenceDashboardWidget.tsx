// ══════════════════════════════════════════════════════════════════════════════
// IndependenceDashboardWidget — Independence & Life Skills dashboard card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface ChildResult {
  childId: string;
  childName: string;
  ageYears: number;
  overallReadiness: number;
  pathwayPlanCompliant: boolean;
  pathwayPlanStatus: string;
  milestonesAchieved: number;
  milestonesActive: number;
  documentReadiness: number;
  readinessForAge: string;
  issues: string[];
}

interface Metrics {
  childCount: number;
  averageReadiness: number;
  pathwayPlanComplianceRate: number;
  activitiesPerChildPerMonth: number;
  averageDocumentReadiness: number;
  milestoneAchievementRate: number;
  childrenRequiringPathwayPlan: number;
  childrenWithPathwayPlan: number;
  domainAverages: { domain: string; average: number }[];
  behindChildren: { childName: string; readiness: number }[];
  strongestDomains: string[];
  weakestDomains: string[];
}

interface DashboardData {
  metrics: Metrics;
  children: ChildResult[];
}

interface Props {
  homeId?: string;
}

const DOMAIN_SHORT: Record<string, string> = {
  daily_living: "Daily Living",
  cooking_nutrition: "Cooking",
  money_management: "Money",
  health_self_care: "Health",
  education_employment: "Education",
  relationships_social: "Social",
  housing_tenancy: "Housing",
  digital_skills: "Digital",
  identity_documents: "Identity",
  travel_transport: "Travel",
};

const READINESS_STYLES: Record<string, string> = {
  ahead: "text-emerald-600 dark:text-emerald-400",
  on_track: "text-blue-600 dark:text-blue-400",
  behind: "text-amber-600 dark:text-amber-400",
  significantly_behind: "text-red-600 dark:text-red-400",
};

const READINESS_LABELS: Record<string, string> = {
  ahead: "Ahead",
  on_track: "On Track",
  behind: "Behind",
  significantly_behind: "Behind",
};

export function IndependenceDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/independence?homeId=${homeId}&mode=dashboard`);
      const json = await res.json();
      setData(json);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-36 bg-muted rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, children } = data;
  const behindCount = children.filter(c => c.readinessForAge === "behind" || c.readinessForAge === "significantly_behind").length;

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-500 to-lime-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Independence & Life Skills</h3>
              <p className="text-xs text-muted-foreground">Preparing for adulthood</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{metrics.averageReadiness}%</p>
            <p className="text-[10px] text-muted-foreground">readiness</p>
          </div>
        </div>
      </div>

      {/* Behind children alert */}
      {behindCount > 0 && (
        <div className="px-4 py-2.5 border-b border-border bg-amber-50/50 dark:bg-amber-900/10">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {behindCount} child{behindCount > 1 ? "ren" : ""} below age expectations
            </span>
          </div>
          {metrics.behindChildren[0] && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400">
              {metrics.behindChildren[0].childName} — {metrics.behindChildren[0].readiness}% readiness
            </p>
          )}
        </div>
      )}

      {/* Key stats */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="p-3 text-center">
          <p className="text-lg font-bold">{metrics.milestoneAchievementRate}%</p>
          <p className="text-[10px] text-muted-foreground">Milestones</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold">{metrics.activitiesPerChildPerMonth}</p>
          <p className="text-[10px] text-muted-foreground">Activities/child</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${metrics.averageDocumentReadiness >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {metrics.averageDocumentReadiness}%
          </p>
          <p className="text-[10px] text-muted-foreground">Documents</p>
        </div>
      </div>

      {/* Per-child readiness */}
      <div className="border-b border-border">
        <div className="px-4 py-2 bg-muted/30">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Children</p>
        </div>
        <div className="divide-y divide-border">
          {children.map(child => (
            <div key={child.childId} className="px-4 py-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium">{child.childName}</p>
                  <span className="text-[9px] text-muted-foreground">({child.ageYears}y)</span>
                </div>
                <span className={`text-[10px] font-medium ${READINESS_STYLES[child.readinessForAge] ?? ""}`}>
                  {READINESS_LABELS[child.readinessForAge] ?? child.readinessForAge}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    child.overallReadiness >= 60 ? "bg-emerald-500" :
                    child.overallReadiness >= 40 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${child.overallReadiness}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pathway Plan + domains */}
      <div className="px-4 py-2.5 border-b border-border">
        {metrics.childrenRequiringPathwayPlan > 0 && (
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-muted-foreground">Pathway Plans</span>
            <span className={`font-medium ${metrics.pathwayPlanComplianceRate >= 100 ? "text-emerald-600" : "text-amber-600"}`}>
              {metrics.childrenWithPathwayPlan}/{metrics.childrenRequiringPathwayPlan}
            </span>
          </div>
        )}
        {metrics.weakestDomains.length > 0 && (
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Weakest areas</span>
            <span className="font-medium text-foreground">
              {metrics.weakestDomains.slice(0, 2).map(d => DOMAIN_SHORT[d] ?? d).join(", ")}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 text-center">
        <a href="/independence" className="text-xs text-primary font-medium hover:underline">
          View independence dashboard →
        </a>
      </div>
    </div>
  );
}
