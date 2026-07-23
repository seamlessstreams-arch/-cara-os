// ══════════════════════════════════════════════════════════════════════════════
// EducationOutcomesDashboardWidget — Attendance & Achievement Intelligence
//
// "use client" component. Fetches from /api/education-outcomes.
// Loading/error states. Key metrics row. Expandable sections.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

/** Rates are null when nothing was recorded — show the gap, never a fabricated number. */
function pct(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value}%` : "—";
}

function meets(value: number | null | undefined, threshold: number): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= threshold;
}

// ── Local types mirroring engine output ────────────────────────────────────

interface ChildProfile {
  childId: string;
  childName: string;
  attendanceRate: number | null;
  pepStatus: string;
  exclusionDays: number;
  achievementCount: number;
  sendCategory: string;
}

interface PerChildAttendance {
  childId: string;
  childName: string;
  attendanceRate: number | null;
  unauthorisedRate: number | null;
  latenessRate: number | null;
  eotasDays: number;
  totalDays: number;
  trend: string;
}

interface PerChildExclusion {
  childId: string;
  childName: string;
  exclusionCount: number;
  totalDays: number;
  types: string[];
  challengedByHome: boolean;
}

interface PerChildPEP {
  childId: string;
  childName: string;
  pepStatus: string;
  virtualSchoolInvolved: boolean;
  childAttended: boolean;
  childVoiceRecorded: boolean;
  targetsSet: number;
  targetsAchieved: number;
  nextReviewDate: string;
}

interface PerChildSEND {
  childId: string;
  childName: string;
  sendCategory: string;
  ehcpInPlace: boolean;
  ehcpCurrent: boolean;
  hoursPerWeek: number;
  effectivenessRating: string;
  hasChildView: boolean;
}

interface PerChildAchievement {
  childId: string;
  childName: string;
  achievementCount: number;
  types: string[];
  celebrationRate: number;
}

interface RegulatoryLink {
  regulation: string;
  description: string;
  status: "met" | "partially_met" | "not_met";
}

interface IntelligenceData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  overallRating: string;
  breakdown: {
    attendance: { score: number; maxScore: number };
    exclusionManagement: { score: number; maxScore: number };
    pepQuality: { score: number; maxScore: number };
    sendSupport: { score: number; maxScore: number };
    achievements: { score: number; maxScore: number };
  };
  attendance: {
    overallAttendanceRate: number | null;
    unauthorisedAbsenceRate: number | null;
    latenessRate: number | null;
    eotasDays: number;
    totalSchoolDays: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalUnauthorised: number;
    perChild: PerChildAttendance[];
  };
  exclusions: {
    totalExclusions: number;
    totalDaysLost: number;
    fixedTermCount: number;
    permanentCount: number;
    internalCount: number;
    informalCount: number;
    alternativeProvisionRate: number | null;
    reintegrationRate: number | null;
    homeChallengeRate: number | null;
    perChild: PerChildExclusion[];
  };
  pepQuality: {
    pepCurrencyRate: number | null;
    virtualSchoolInvolvementRate: number;
    childAttendanceRate: number;
    childVoiceRate: number;
    targetAchievementRate: number;
    totalTargetsSet: number;
    totalTargetsAchieved: number;
    overduePEPs: number;
    draftPEPs: number;
    notInPlacePEPs: number;
    perChild: PerChildPEP[];
  };
  sendSupport: {
    childrenWithSEND: number;
    sendCoverageRate: number | null;
    ehcpCount: number;
    ehcpCurrencyRate: number | null;
    averageHoursPerWeek: number;
    effectivenessBreakdown: Record<string, number>;
    childVoiceCapturedRate: number;
    perChild: PerChildSEND[];
  };
  achievements: {
    totalAchievements: number;
    achievementTypeBreakdown: Record<string, number>;
    typeVarietyScore: number;
    celebrationRate: number;
    evidenceRecordingRate: number;
    perChild: PerChildAchievement[];
  };
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: RegulatoryLink[];
}

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  homeId?: string;
}

// ── Styling helpers ────────────────────────────────────────────────────────

const RATING_COLORS: Record<string, string> = {
  outstanding: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  good: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  requires_improvement: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  inadequate: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const RATING_LABELS: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

const STATUS_COLORS: Record<string, string> = {
  met: "text-emerald-700 dark:text-emerald-400",
  partially_met: "text-amber-700 dark:text-amber-400",
  not_met: "text-red-700 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  met: "Met",
  partially_met: "Partially Met",
  not_met: "Not Met",
};

const PEP_COLORS: Record<string, string> = {
  current: "text-emerald-700 dark:text-emerald-400",
  overdue: "text-red-700 dark:text-red-400",
  draft: "text-amber-700 dark:text-amber-400",
  not_in_place: "text-red-700 dark:text-red-400",
};

const TREND_DISPLAY: Record<string, { icon: string; color: string }> = {
  improving: { icon: "↑", color: "text-emerald-600 dark:text-emerald-400" },
  stable: { icon: "→", color: "text-muted-foreground" },
  declining: { icon: "↓", color: "text-red-600 dark:text-red-400" },
};

// ── Component ──────────────────────────────────────────────────────────────

export function EducationOutcomesDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/education-outcomes?homeId=${homeId}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load education outcomes data.");
    } finally {
      setLoading(false);
    }
  }

  function toggleSection(section: string) {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  // ── Loading ──

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-48 bg-muted rounded mb-4" />
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // ── Error ──

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
        <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
          Education Outcomes — Error
        </h3>
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        <button
          onClick={fetchData}
          className="mt-3 text-xs font-medium text-red-800 dark:text-red-300 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const isExpanded = (s: string) => expandedSections.has(s);

  // ── Render ──

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Education Attendance & Achievement Intelligence
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data.periodStart} to {data.periodEnd}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">{data.overallScore}/100</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RATING_COLORS[data.overallRating] ?? ""}`}>
            {RATING_LABELS[data.overallRating] ?? data.overallRating}
          </span>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-border">
        <MetricCard
          label="Attendance Rate"
          value={pct(data.attendance.overallAttendanceRate)}
          sub={data.attendance.overallAttendanceRate === null ? "No attendance recorded" : meets(data.attendance.overallAttendanceRate, 95) ? "On target" : "Below 95% target"}
          accent={meets(data.attendance.overallAttendanceRate, 95) ? "emerald" : "amber"}
        />
        <MetricCard
          label="PEP Currency"
          value={pct(data.pepQuality.pepCurrencyRate)}
          sub={`${data.pepQuality.overduePEPs} overdue`}
          accent={meets(data.pepQuality.pepCurrencyRate, 100) ? "emerald" : "amber"}
        />
        <MetricCard
          label="Exclusion Days"
          value={String(data.exclusions.totalDaysLost)}
          sub={`${data.exclusions.totalExclusions} exclusion(s)`}
          accent={data.exclusions.totalExclusions === 0 ? "emerald" : "red"}
        />
        <MetricCard
          label="Achievements"
          value={String(data.achievements.totalAchievements)}
          sub={`${data.achievements.celebrationRate}% celebrated`}
          accent={data.achievements.totalAchievements > 0 ? "emerald" : "slate"}
        />
      </div>

      {/* Score Breakdown */}
      <div className="p-4 border-b border-border">
        <p className="text-xs font-medium text-muted-foreground mb-2">Score Breakdown</p>
        <div className="space-y-1.5">
          <ScoreBar label="Attendance" score={data.breakdown.attendance.score} max={data.breakdown.attendance.maxScore} />
          <ScoreBar label="Exclusion Mgmt" score={data.breakdown.exclusionManagement.score} max={data.breakdown.exclusionManagement.maxScore} />
          <ScoreBar label="PEP Quality" score={data.breakdown.pepQuality.score} max={data.breakdown.pepQuality.maxScore} />
          <ScoreBar label="SEND Support" score={data.breakdown.sendSupport.score} max={data.breakdown.sendSupport.maxScore} />
          <ScoreBar label="Achievements" score={data.breakdown.achievements.score} max={data.breakdown.achievements.maxScore} />
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="divide-y divide-border">
        {/* Child Education Profiles */}
        <ExpandableSection
          title="Child Education Profiles"
          count={data.childProfiles.length}
          expanded={isExpanded("profiles")}
          onToggle={() => toggleSection("profiles")}
        >
          <div className="space-y-2">
            {data.childProfiles.map(c => (
              <div key={c.childId} className="flex items-center justify-between text-xs border border-border rounded p-2">
                <div>
                  <span className="font-medium text-foreground">{c.childName}</span>
                  {c.sendCategory !== "none" && (
                    <span className="ml-2 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-[10px]">
                      {c.sendCategory}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>Att: {pct(c.attendanceRate)}</span>
                  <span className={PEP_COLORS[c.pepStatus] ?? ""}>PEP: {c.pepStatus}</span>
                  <span>Excl: {c.exclusionDays}d</span>
                  <span>Ach: {c.achievementCount}</span>
                </div>
              </div>
            ))}
          </div>
        </ExpandableSection>

        {/* Attendance Analysis */}
        <ExpandableSection
          title="Attendance Analysis"
          count={null}
          expanded={isExpanded("attendance")}
          onToggle={() => toggleSection("attendance")}
        >
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Unauthorised Rate" value={pct(data.attendance.unauthorisedAbsenceRate)} />
              <Stat label="Lateness Rate" value={pct(data.attendance.latenessRate)} />
              <Stat label="EOTAS Days" value={String(data.attendance.eotasDays)} />
            </div>
            <div className="mt-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">Per Child</p>
              {data.attendance.perChild.map(c => {
                const trend = TREND_DISPLAY[c.trend] ?? TREND_DISPLAY.stable;
                return (
                  <div key={c.childId} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                    <span className="text-foreground">{c.childName}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{pct(c.attendanceRate)}</span>
                      <span className={trend.color}>{trend.icon}</span>
                      <span>Unauth: {pct(c.unauthorisedRate)}</span>
                      <span>Late: {pct(c.latenessRate)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ExpandableSection>

        {/* Exclusion Management */}
        <ExpandableSection
          title="Exclusion Management"
          count={data.exclusions.totalExclusions}
          expanded={isExpanded("exclusions")}
          onToggle={() => toggleSection("exclusions")}
        >
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Fixed-Term" value={String(data.exclusions.fixedTermCount)} />
              <Stat label="Informal" value={String(data.exclusions.informalCount)} warn={data.exclusions.informalCount > 0} />
              <Stat label="Days Lost" value={String(data.exclusions.totalDaysLost)} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <Stat label="Alt Provision" value={pct(data.exclusions.alternativeProvisionRate)} />
              <Stat label="Reintegration" value={pct(data.exclusions.reintegrationRate)} />
              <Stat label="Home Challenge" value={pct(data.exclusions.homeChallengeRate)} />
            </div>
            {data.exclusions.perChild.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">Per Child</p>
                {data.exclusions.perChild.map(c => (
                  <div key={c.childId} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                    <span className="text-foreground">{c.childName}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{c.exclusionCount} excl ({c.totalDays}d)</span>
                      <span>{c.types.join(", ")}</span>
                      {c.challengedByHome && <span className="text-emerald-600 dark:text-emerald-400">Challenged</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ExpandableSection>

        {/* PEP Quality */}
        <ExpandableSection
          title="PEP Quality"
          count={null}
          expanded={isExpanded("pep")}
          onToggle={() => toggleSection("pep")}
        >
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat label="Currency" value={pct(data.pepQuality.pepCurrencyRate)} />
              <Stat label="VS Involved" value={pct(data.pepQuality.virtualSchoolInvolvementRate)} />
              <Stat label="Child Attended" value={pct(data.pepQuality.childAttendanceRate)} />
              <Stat label="Child Voice" value={pct(data.pepQuality.childVoiceRate)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Targets Set" value={String(data.pepQuality.totalTargetsSet)} />
              <Stat label="Targets Achieved" value={String(data.pepQuality.totalTargetsAchieved)} />
              <Stat label="Achievement Rate" value={pct(data.pepQuality.targetAchievementRate)} />
            </div>
            <div className="mt-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">Per Child</p>
              {data.pepQuality.perChild.map(c => (
                <div key={c.childId} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                  <span className="text-foreground">{c.childName}</span>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className={PEP_COLORS[c.pepStatus] ?? ""}>{c.pepStatus}</span>
                    <span>{c.targetsAchieved}/{c.targetsSet} targets</span>
                    {c.childVoiceRecorded && <span className="text-emerald-600 dark:text-emerald-400">Voice</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ExpandableSection>

        {/* SEND Support */}
        <ExpandableSection
          title="SEND Support"
          count={data.sendSupport.childrenWithSEND}
          expanded={isExpanded("send")}
          onToggle={() => toggleSection("send")}
        >
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Coverage" value={pct(data.sendSupport.sendCoverageRate)} />
              <Stat label="EHCPs" value={String(data.sendSupport.ehcpCount)} />
              <Stat label="EHCP Currency" value={pct(data.sendSupport.ehcpCurrencyRate)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Avg Hours/Week" value={String(data.sendSupport.averageHoursPerWeek)} />
              <Stat label="Child Voice" value={pct(data.sendSupport.childVoiceCapturedRate)} />
            </div>
            {data.sendSupport.perChild.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">Per Child</p>
                {data.sendSupport.perChild.map(c => (
                  <div key={c.childId} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                    <div>
                      <span className="text-foreground">{c.childName}</span>
                      <span className="ml-2 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-[10px]">
                        {c.sendCategory}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{c.hoursPerWeek}h/wk</span>
                      <span>{c.effectivenessRating}</span>
                      {c.ehcpInPlace && (
                        <span className={c.ehcpCurrent ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                          EHCP {c.ehcpCurrent ? "current" : "overdue"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ExpandableSection>

        {/* Achievements & Recognition */}
        <ExpandableSection
          title="Achievements & Recognition"
          count={data.achievements.totalAchievements}
          expanded={isExpanded("achievements")}
          onToggle={() => toggleSection("achievements")}
        >
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Variety Score" value={`${data.achievements.typeVarietyScore}%`} />
              <Stat label="Celebration Rate" value={pct(data.achievements.celebrationRate)} />
              <Stat label="Evidence Rate" value={pct(data.achievements.evidenceRecordingRate)} />
            </div>
            <div className="mt-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">By Type</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.achievements.achievementTypeBreakdown).map(([type, count]) => (
                  <span
                    key={type}
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      (count as number) > 0
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {type.replace("_", " ")}: {count as number}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">Per Child</p>
              {data.achievements.perChild.map(c => (
                <div key={c.childId} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                  <span className="text-foreground">{c.childName}</span>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{c.achievementCount} achievements</span>
                    <span>{c.celebrationRate}% celebrated</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ExpandableSection>

        {/* Strengths / Areas / Actions */}
        <ExpandableSection
          title="Strengths, Areas & Actions"
          count={null}
          expanded={isExpanded("analysis")}
          onToggle={() => toggleSection("analysis")}
        >
          <div className="space-y-3 text-xs">
            {data.strengths.length > 0 && (
              <div>
                <p className="font-medium text-emerald-700 dark:text-emerald-400 mb-1">Strengths</p>
                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                  {data.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {data.areasForImprovement.length > 0 && (
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400 mb-1">Areas for Improvement</p>
                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                  {data.areasForImprovement.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
            {data.actions.length > 0 && (
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">Recommended Actions</p>
                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                  {data.actions.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </div>
        </ExpandableSection>

        {/* Regulatory Framework */}
        <ExpandableSection
          title="Regulatory Framework"
          count={data.regulatoryLinks.length}
          expanded={isExpanded("regulatory")}
          onToggle={() => toggleSection("regulatory")}
        >
          <div className="space-y-1.5 text-xs">
            {data.regulatoryLinks.map((r, i) => (
              <div key={i} className="flex items-start justify-between gap-2 py-1 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-foreground">{r.regulation}</p>
                  <p className="text-muted-foreground mt-0.5">{r.description}</p>
                </div>
                <span className={`shrink-0 font-medium ${STATUS_COLORS[r.status] ?? ""}`}>
                  {STATUS_LABELS[r.status] ?? r.status}
                </span>
              </div>
            ))}
          </div>
        </ExpandableSection>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, accent }: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  const colors: Record<string, string> = {
    emerald: "border-emerald-200 dark:border-emerald-800",
    amber: "border-amber-200 dark:border-amber-800",
    red: "border-red-200 dark:border-red-800",
    slate: "border-border",
  };
  return (
    <div className={`rounded-md border p-2.5 ${colors[accent] ?? colors.slate}`}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const barColor = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-foreground font-medium">{score}/{max}</span>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="bg-muted/50 rounded px-2 py-1.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${warn ? "text-red-700 dark:text-red-400" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function ExpandableSection({ title, count, expanded, onToggle, children }: {
  title: string;
  count: number | null;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        <span>
          {title}
          {count !== null && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full text-[10px]">
              {count}
            </span>
          )}
        </span>
        <span className="text-muted-foreground">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}
