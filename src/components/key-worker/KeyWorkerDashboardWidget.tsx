// ══════════════════════════════════════════════════════════════════════════════
// KeyWorkerDashboardWidget — Key Worker Relationship Quality Intelligence card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

// ── Local types mirroring engine output ──────────────────────────────────

interface SessionConsistency {
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  cancellationRate: number;
  cancelledByChild: number;
  cancelledByStaff: number;
  rescheduled: number;
  missed: number;
  averageDuration: number;
  sessionsPerChildPerMonth: Record<string, number>;
  sessionTypeBreakdown: Record<string, number>;
  sessionTypeVariety: number;
  childrenBelowMinimum: string[];
}

interface ChildVoice {
  totalVoiceIndicators: number;
  voiceIndicatorFrequency: Record<string, number>;
  perChildVoicePresence: Record<string, number>;
  indicatorsDrivingPlanChanges: number;
  planInfluenceRate: number;
  childrenWithLowVoice: string[];
  averageVoiceScore: number;
}

interface RelationshipQuality {
  totalIndicators: number;
  indicatorFrequency: Record<string, number>;
  perChildQualityScore: Record<string, number>;
  traumaInformedRate: number;
  culturallyResponsiveRate: number;
  averageQualityScore: number;
}

interface GoalProgress {
  totalGoals: number;
  achievedGoals: number;
  achievementRate: number;
  partiallyAchieved: number;
  notAchieved: number;
  deferred: number;
  deferredRate: number;
  activeGoals: number;
  activeGoalsPerChild: Record<string, number>;
  categoryBreakdown: Record<string, { total: number; achieved: number; rate: number }>;
}

interface ChildProfile {
  childId: string;
  childName: string;
  primaryKeyWorkerName: string;
  secondaryKeyWorkerName?: string;
  totalSessions: number;
  completedSessions: number;
  voiceScore: number;
  relationshipScore: number;
  goalProgress: number;
  activeGoals: number;
  consistencyRating: string;
  lastSessionDate: string | null;
  sessionTypes: string[];
}

interface RegulatoryLink {
  regulation: string;
  description: string;
  status: "met" | "partially_met" | "not_met";
  evidence: string;
}

interface Scoring {
  sessionConsistencyScore: number;
  childVoiceScore: number;
  relationshipQualityScore: number;
  goalProgressScore: number;
}

interface IntelligenceData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  overallScore: number;
  overallRating: string;
  sessionConsistency: SessionConsistency;
  childVoice: ChildVoice;
  relationshipQuality: RelationshipQuality;
  goalProgress: GoalProgress;
  childProfiles: ChildProfile[];
  scoring: Scoring;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: RegulatoryLink[];
}

// ── Helpers ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  outstanding: { label: "Outstanding", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  good: { label: "Good", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  requires_improvement: { label: "Requires Improvement", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
  inadequate: { label: "Inadequate", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
};

const REG_STATUS_STYLES: Record<string, { label: string; color: string }> = {
  met: { label: "Met", color: "text-emerald-600 dark:text-emerald-400" },
  partially_met: { label: "Partially Met", color: "text-amber-600 dark:text-amber-400" },
  not_met: { label: "Not Met", color: "text-red-600 dark:text-red-400" },
};

function scoreColor(value: number, good: number, warn: number): string {
  if (value >= good) return "text-emerald-600 dark:text-emerald-400";
  if (value >= warn) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function formatLabel(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Props ────────────────────────────────────────────────────────────────

interface Props {
  homeId?: string;
}

// ── Component ────────────────────────────────────────────────────────────

export function KeyWorkerDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/key-worker?homeId=${homeId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function toggleSection(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ── Loading state ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-48 bg-muted rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
          <div className="h-3 w-1/2 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-6">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-red-700 dark:text-red-400">
            Failed to load Key Worker data
          </span>
        </div>
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 text-xs text-red-700 dark:text-red-400 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const rating = RATING_STYLES[data.overallRating] ?? RATING_STYLES.good;

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Key Worker Relationships</h3>
              <p className="text-xs text-muted-foreground">Reg 10/14 — Quality Intelligence</p>
            </div>
          </div>
          <div className={`px-2 py-0.5 rounded text-xs font-medium ${rating.color} ${rating.bg}`}>
            {rating.label}
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Overall Score</span>
          <span className={`text-lg font-bold ${scoreColor(data.overallScore, 80, 60)}`}>
            {data.overallScore}/100
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              data.overallScore >= 80
                ? "bg-emerald-500"
                : data.overallScore >= 60
                  ? "bg-blue-500"
                  : data.overallScore >= 40
                    ? "bg-amber-500"
                    : "bg-red-500"
            }`}
            style={{ width: `${data.overallScore}%` }}
          />
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${scoreColor(data.sessionConsistency.completionRate, 85, 70)}`}>
            {data.sessionConsistency.completionRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">Session Completion</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${scoreColor(data.childVoice.averageVoiceScore, 80, 60)}`}>
            {data.childVoice.averageVoiceScore}%
          </p>
          <p className="text-[10px] text-muted-foreground">Child Voice</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${scoreColor(data.relationshipQuality.averageQualityScore, 70, 50)}`}>
            {data.relationshipQuality.averageQualityScore}%
          </p>
          <p className="text-[10px] text-muted-foreground">Relationship Quality</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${scoreColor(data.goalProgress.achievementRate, 70, 50)}`}>
            {data.goalProgress.achievementRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">Goal Achievement</p>
        </div>
      </div>

      {/* ── Expandable Sections ──────────────────────────────────────── */}

      {/* Child-Key Worker Profiles */}
      <ExpandableSection
        title="Child-Key Worker Profiles"
        sectionKey="profiles"
        expanded={expanded}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          {data.childProfiles.map((profile) => (
            <div key={profile.childId} className="rounded border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-semibold">{profile.childName}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">
                    KW: {profile.primaryKeyWorkerName}
                  </span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  profile.consistencyRating === "excellent"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : profile.consistencyRating === "good"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : profile.consistencyRating === "fair"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {formatLabel(profile.consistencyRating)}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px]">
                <div>
                  <span className="text-muted-foreground block">Sessions</span>
                  <span className="font-medium">{profile.completedSessions}/{profile.totalSessions}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Voice</span>
                  <span className={`font-medium ${scoreColor(profile.voiceScore, 80, 60)}`}>{profile.voiceScore}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Quality</span>
                  <span className={`font-medium ${scoreColor(profile.relationshipScore, 70, 50)}`}>{profile.relationshipScore}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Goals</span>
                  <span className="font-medium">{profile.activeGoals} active</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ExpandableSection>

      {/* Session Analysis */}
      <ExpandableSection
        title="Session Analysis"
        sectionKey="sessions"
        expanded={expanded}
        onToggle={toggleSection}
      >
        <div className="space-y-2 text-[10px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Sessions</span>
            <span className="font-medium">{data.sessionConsistency.totalSessions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Completed</span>
            <span className="font-medium">{data.sessionConsistency.completedSessions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cancellation Rate</span>
            <span className={`font-medium ${data.sessionConsistency.cancellationRate > 20 ? "text-red-600" : "text-muted-foreground"}`}>
              {data.sessionConsistency.cancellationRate}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg Duration</span>
            <span className="font-medium">{data.sessionConsistency.averageDuration} mins</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Session Type Variety</span>
            <span className="font-medium">{data.sessionConsistency.sessionTypeVariety}/6 types</span>
          </div>
          <div className="mt-2">
            <span className="text-muted-foreground block mb-1">Type Breakdown:</span>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(data.sessionConsistency.sessionTypeBreakdown)
                .filter(([, count]) => count > 0)
                .map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span className="text-muted-foreground">{formatLabel(type)}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </ExpandableSection>

      {/* Child Voice Tracking */}
      <ExpandableSection
        title="Child Voice Tracking"
        sectionKey="voice"
        expanded={expanded}
        onToggle={toggleSection}
      >
        <div className="space-y-2 text-[10px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Average Voice Score</span>
            <span className={`font-medium ${scoreColor(data.childVoice.averageVoiceScore, 80, 60)}`}>
              {data.childVoice.averageVoiceScore}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan Influence Rate</span>
            <span className={`font-medium ${scoreColor(data.childVoice.planInfluenceRate, 40, 20)}`}>
              {data.childVoice.planInfluenceRate}%
            </span>
          </div>
          {data.childVoice.childrenWithLowVoice.length > 0 && (
            <div className="mt-1 p-1.5 rounded bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400">
              {data.childVoice.childrenWithLowVoice.length} child(ren) with low voice representation
            </div>
          )}
          <div className="mt-2">
            <span className="text-muted-foreground block mb-1">Indicator Frequency:</span>
            {Object.entries(data.childVoice.voiceIndicatorFrequency).map(([indicator, count]) => (
              <div key={indicator} className="flex justify-between mb-0.5">
                <span className="text-muted-foreground">{formatLabel(indicator)}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </ExpandableSection>

      {/* Relationship Quality Indicators */}
      <ExpandableSection
        title="Relationship Quality Indicators"
        sectionKey="quality"
        expanded={expanded}
        onToggle={toggleSection}
      >
        <div className="space-y-2 text-[10px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Average Quality Score</span>
            <span className={`font-medium ${scoreColor(data.relationshipQuality.averageQualityScore, 70, 50)}`}>
              {data.relationshipQuality.averageQualityScore}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Trauma-Informed Rate</span>
            <span className={`font-medium ${scoreColor(data.relationshipQuality.traumaInformedRate, 60, 40)}`}>
              {data.relationshipQuality.traumaInformedRate}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Culturally Responsive Rate</span>
            <span className={`font-medium ${scoreColor(data.relationshipQuality.culturallyResponsiveRate, 40, 20)}`}>
              {data.relationshipQuality.culturallyResponsiveRate}%
            </span>
          </div>
          <div className="mt-2">
            <span className="text-muted-foreground block mb-1">Indicator Frequency:</span>
            {Object.entries(data.relationshipQuality.indicatorFrequency).map(([indicator, count]) => (
              <div key={indicator} className="flex justify-between mb-0.5">
                <span className="text-muted-foreground">{formatLabel(indicator)}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </ExpandableSection>

      {/* Goal Progress */}
      <ExpandableSection
        title="Goal Progress"
        sectionKey="goals"
        expanded={expanded}
        onToggle={toggleSection}
      >
        <div className="space-y-2 text-[10px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Goals</span>
            <span className="font-medium">{data.goalProgress.totalGoals}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Achieved</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{data.goalProgress.achievedGoals}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Partially Achieved</span>
            <span className="font-medium text-amber-600 dark:text-amber-400">{data.goalProgress.partiallyAchieved}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Active</span>
            <span className="font-medium">{data.goalProgress.activeGoals}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deferred</span>
            <span className={`font-medium ${data.goalProgress.deferredRate > 25 ? "text-red-600" : "text-muted-foreground"}`}>
              {data.goalProgress.deferred} ({data.goalProgress.deferredRate}%)
            </span>
          </div>
          <div className="mt-2">
            <span className="text-muted-foreground block mb-1">By Category:</span>
            {Object.entries(data.goalProgress.categoryBreakdown).map(([cat, info]) => (
              <div key={cat} className="flex justify-between mb-0.5">
                <span className="text-muted-foreground">{formatLabel(cat)}</span>
                <span className="font-medium">{info.achieved}/{info.total} ({info.rate}%)</span>
              </div>
            ))}
          </div>
        </div>
      </ExpandableSection>

      {/* Strengths / Areas / Actions */}
      <ExpandableSection
        title="Strengths / Areas / Actions"
        sectionKey="insights"
        expanded={expanded}
        onToggle={toggleSection}
      >
        <div className="space-y-3 text-[10px]">
          {data.strengths.length > 0 && (
            <div>
              <span className="text-emerald-700 dark:text-emerald-400 font-medium block mb-1">Strengths</span>
              <ul className="space-y-0.5">
                {data.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-emerald-500 mt-0.5 shrink-0">+</span>
                    <span className="text-muted-foreground">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.areasForImprovement.length > 0 && (
            <div>
              <span className="text-amber-700 dark:text-amber-400 font-medium block mb-1">Areas for Improvement</span>
              <ul className="space-y-0.5">
                {data.areasForImprovement.map((a, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-amber-500 mt-0.5 shrink-0">!</span>
                    <span className="text-muted-foreground">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.actions.length > 0 && (
            <div>
              <span className="text-blue-700 dark:text-blue-400 font-medium block mb-1">Actions</span>
              <ul className="space-y-0.5">
                {data.actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-blue-500 mt-0.5 shrink-0">&gt;</span>
                    <span className="text-muted-foreground">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ExpandableSection>

      {/* Regulatory Framework */}
      <ExpandableSection
        title="Regulatory Framework"
        sectionKey="regulatory"
        expanded={expanded}
        onToggle={toggleSection}
        isLast
      >
        <div className="space-y-2">
          {data.regulatoryLinks.map((link) => {
            const statusStyle = REG_STATUS_STYLES[link.status] ?? REG_STATUS_STYLES.not_met;
            return (
              <div key={link.regulation} className="text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{link.regulation}</span>
                  <span className={`font-medium ${statusStyle.color}`}>{statusStyle.label}</span>
                </div>
                <p className="text-muted-foreground">{link.description}</p>
                <p className="text-muted-foreground italic mt-0.5">{link.evidence}</p>
              </div>
            );
          })}
        </div>
      </ExpandableSection>
    </div>
  );
}

// ── Expandable Section sub-component ────────────────────────────────────

function ExpandableSection({
  title,
  sectionKey,
  expanded,
  onToggle,
  children,
  isLast = false,
}: {
  title: string;
  sectionKey: string;
  expanded: Record<string, boolean>;
  onToggle: (key: string) => void;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  const isExpanded = expanded[sectionKey] ?? false;

  return (
    <div className={isLast ? "" : "border-b border-border"}>
      <button
        onClick={() => onToggle(sectionKey)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors"
      >
        <span className="text-xs font-medium">{title}</span>
        <svg
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}
