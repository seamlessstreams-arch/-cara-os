"use client";

// ══════════════════════════════════════════════════════════════════════════════
// DIGITAL LITERACY & ONLINE ENGAGEMENT DASHBOARD WIDGET
//
// Displays digital literacy intelligence:
// - Overall score and rating
// - Digital skills assessment coverage
// - Device access equity
// - Online learning engagement
// - Digital citizenship demonstrations
// - Per-child digital profiles
// - Strengths / areas / actions
// - Regulatory framework links
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

// ── Data interfaces (mirroring engine output) ─────────────────────────────

interface ChildDigitalProfileData {
  childId: string;
  childName: string;
  hasAssessment: boolean;
  overallSkillLevel?: string;
  skillLevelNumeric?: number;
  deviceAccessCount: number;
  agreementsSigned: number;
  learningSessionCount: number;
  learningMinutes: number;
  positiveOutcomes: number;
  citizenshipScore: number;
  citizenshipPositiveRate: number;
  strengths: string[];
  developmentAreas: string[];
}

interface DigitalLiteracyData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  digitalSkills: {
    totalChildren: number;
    childrenWithAssessment: number;
    assessmentRate: number;
    averageSkillLevel: number;
    skillLevelDistribution: { level: string; count: number }[];
    skillGaps: string[];
    developmentGoalCount: number;
    overdueReviews: number;
  };
  deviceAccess: {
    totalChildren: number;
    childrenWithAccess: number;
    accessRate: number;
    agreementComplianceRate: number;
    ageAppropriateRate: number;
    deviceTypeBreakdown: { deviceType: string; count: number }[];
    accessLevelBreakdown: { accessLevel: string; count: number }[];
    overdueReviews: number;
    childrenWithoutAccess: string[];
  };
  onlineLearning: {
    totalSessions: number;
    sessionsPerChild: number;
    activityTypeBreakdown: { activityType: string; count: number }[];
    activityTypeCount: number;
    positiveOutcomeRate: number;
    supervisedRate: number;
    averageDuration: number;
    totalLearningMinutes: number;
    childrenWithNoLearning: string[];
  };
  digitalCitizenship: {
    totalRecords: number;
    positiveRate: number;
    areaCoverage: number;
    totalAreas: number;
    areaBreakdown: { area: string; positiveCount: number; totalCount: number }[];
    childrenWithRecords: number;
    childrenWithNoRecords: string[];
  };
  childProfiles: ChildDigitalProfileData[];
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Rating Badge ───────────────────────────────────────────────────────────

function RatingBadge({ score, rating }: { score: number; rating: string }) {
  const colorClass =
    rating === "outstanding"
      ? "bg-green-100 text-green-800 border-green-300"
      : rating === "good"
        ? "bg-blue-100 text-blue-800 border-blue-300"
        : rating === "requires_improvement"
          ? "bg-orange-100 text-orange-800 border-orange-300"
          : "bg-red-100 text-red-800 border-red-300";
  const label =
    rating === "outstanding"
      ? "Outstanding"
      : rating === "good"
        ? "Good"
        : rating === "requires_improvement"
          ? "Requires Improvement"
          : "Inadequate";

  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colorClass}`}>
      <div className="text-3xl font-bold">{score}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  );
}

// ── Skill Level Badge ─────────────────────────────────────────────────────

function SkillBadge({ level }: { level?: string }) {
  const color =
    level === "advanced"
      ? "bg-purple-100 text-purple-700"
      : level === "proficient"
        ? "bg-green-100 text-green-700"
        : level === "competent"
          ? "bg-blue-100 text-blue-700"
          : level === "developing"
            ? "bg-yellow-100 text-yellow-700"
            : level === "beginner"
              ? "bg-gray-100 text-gray-600"
              : "bg-gray-100 text-gray-400";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${color}`}>
      {level ?? "N/A"}
    </span>
  );
}

// ── Child Digital Profile Card ────────────────────────────────────────────

function ChildDigitalCard({ child }: { child: ChildDigitalProfileData }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{child.childName}</span>
        <SkillBadge level={child.overallSkillLevel} />
      </div>
      <div className="grid grid-cols-4 gap-1 text-center">
        <div>
          <div className="text-xs text-gray-500">Devices</div>
          <div className="text-sm font-bold text-gray-800">{child.deviceAccessCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Learning</div>
          <div className="text-sm font-bold text-blue-700">{child.learningSessionCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Positive</div>
          <div className="text-sm font-bold text-green-700">{child.positiveOutcomes}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Citizen</div>
          <div className={`text-sm font-bold ${child.citizenshipPositiveRate >= 80 ? "text-green-700" : child.citizenshipPositiveRate >= 50 ? "text-yellow-700" : "text-red-700"}`}>
            {child.citizenshipPositiveRate}%
          </div>
        </div>
      </div>
      {(child.strengths?.length ?? 0) > 0 && (
        <div className="mt-2">
          {(child.strengths ?? []).map((s, i) => (
            <div key={i} className="text-[10px] text-green-700 bg-green-50 rounded px-2 py-0.5 mt-0.5">
              {s}
            </div>
          ))}
        </div>
      )}
      {child.developmentAreas.length > 0 && (
        <div className="mt-1">
          {child.developmentAreas.map((d, i) => (
            <div key={i} className="text-[10px] text-orange-700 bg-orange-50 rounded px-2 py-0.5 mt-0.5">
              {d}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Expandable Section ────────────────────────────────────────────────────

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-100 pt-3 mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <span className="text-xs text-gray-400">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

// ── Format helpers ────────────────────────────────────────────────────────

function formatLabel(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function DigitalLiteracyDashboardWidget() {
  const [data, setData] = useState<DigitalLiteracyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/digital-literacy");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-800">Digital Literacy Intelligence</h3>
        <p className="text-sm text-red-600 mt-1">{error ?? "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            Digital Literacy & Online Engagement
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Reg 8 & 9 | {data.onlineLearning.totalSessions} learning sessions |{" "}
            {data.digitalCitizenship.totalRecords} citizenship observations
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-700">
            {data.digitalSkills.assessmentRate}%
          </div>
          <div className="text-[10px] text-gray-500 uppercase">Skills Assessed</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-700">
            {data.deviceAccess.accessRate}%
          </div>
          <div className="text-[10px] text-gray-500 uppercase">Device Access</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-700">
            {data.onlineLearning.positiveOutcomeRate}%
          </div>
          <div className="text-[10px] text-gray-500 uppercase">Positive Outcomes</div>
        </div>
        <div className="text-center p-2 bg-teal-50 rounded-lg">
          <div className="text-xl font-bold text-teal-700">
            {data.digitalCitizenship.positiveRate}%
          </div>
          <div className="text-[10px] text-gray-500 uppercase">Citizenship</div>
        </div>
      </div>

      {/* Immediate Actions */}
      {data.immediateActions.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-red-800 mb-1">
            Immediate Actions Required
          </div>
          <ul className="space-y-1">
            {data.immediateActions.map((action, i) => (
              <li key={i} className="text-xs text-red-700 flex items-start gap-1">
                <span className="mt-0.5">&#x2022;</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Child Digital Profiles */}
      <Section title="Child Digital Profiles" defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.childProfiles.map((child) => (
            <ChildDigitalCard key={child.childId} child={child} />
          ))}
        </div>
      </Section>

      {/* Digital Skills */}
      <Section title="Digital Skills Assessment">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center mb-3">
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-gray-800">
              {data.digitalSkills.childrenWithAssessment}/{data.digitalSkills.totalChildren}
            </div>
            <div className="text-[10px] text-gray-500">Assessed</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-blue-700">
              {data.digitalSkills.averageSkillLevel.toFixed(1)}
            </div>
            <div className="text-[10px] text-gray-500">Avg Level (1-5)</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-green-700">
              {data.digitalSkills.developmentGoalCount}
            </div>
            <div className="text-[10px] text-gray-500">Dev Goals</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className={`text-lg font-bold ${data.digitalSkills.overdueReviews > 0 ? "text-red-700" : "text-green-700"}`}>
              {data.digitalSkills.overdueReviews}
            </div>
            <div className="text-[10px] text-gray-500">Overdue Reviews</div>
          </div>
        </div>
        {data.digitalSkills.skillGaps.length > 0 && (
          <div className="text-xs text-orange-700 bg-orange-50 rounded px-2 py-1">
            Skill gaps: {data.digitalSkills.skillGaps.map(formatLabel).join(", ")}
          </div>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          {data.digitalSkills.skillLevelDistribution
            .filter((d) => d.count > 0)
            .map((d) => (
              <span key={d.level} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {formatLabel(d.level)}: {d.count}
              </span>
            ))}
        </div>
      </Section>

      {/* Device Access */}
      <Section title="Device Access & Equity">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center mb-3">
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-green-700">
              {data.deviceAccess.accessRate}%
            </div>
            <div className="text-[10px] text-gray-500">Access Rate</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-blue-700">
              {data.deviceAccess.agreementComplianceRate}%
            </div>
            <div className="text-[10px] text-gray-500">Agreements Signed</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-green-700">
              {data.deviceAccess.ageAppropriateRate}%
            </div>
            <div className="text-[10px] text-gray-500">Age Appropriate</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className={`text-lg font-bold ${data.deviceAccess.overdueReviews > 0 ? "text-red-700" : "text-green-700"}`}>
              {data.deviceAccess.overdueReviews}
            </div>
            <div className="text-[10px] text-gray-500">Overdue Reviews</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {data.deviceAccess.deviceTypeBreakdown.map((d) => (
            <span key={d.deviceType} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
              {formatLabel(d.deviceType)}: {d.count}
            </span>
          ))}
        </div>
        {data.deviceAccess.childrenWithoutAccess.length > 0 && (
          <div className="mt-2 text-xs text-red-700 bg-red-50 rounded px-2 py-1">
            No device access: {data.deviceAccess.childrenWithoutAccess.join(", ")}
          </div>
        )}
      </Section>

      {/* Online Learning */}
      <Section title="Online Learning Engagement">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center mb-3">
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-purple-700">
              {data.onlineLearning.totalSessions}
            </div>
            <div className="text-[10px] text-gray-500">Sessions</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-blue-700">
              {data.onlineLearning.sessionsPerChild}
            </div>
            <div className="text-[10px] text-gray-500">Per Child</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-green-700">
              {data.onlineLearning.positiveOutcomeRate}%
            </div>
            <div className="text-[10px] text-gray-500">Positive Outcomes</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-gray-700">
              {Math.round(data.onlineLearning.totalLearningMinutes / 60)}h
            </div>
            <div className="text-[10px] text-gray-500">Total Hours</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {data.onlineLearning.activityTypeBreakdown.map((d) => (
            <span key={d.activityType} className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
              {formatLabel(d.activityType)}: {d.count}
            </span>
          ))}
        </div>
        {data.onlineLearning.childrenWithNoLearning.length > 0 && (
          <div className="mt-2 text-xs text-red-700 bg-red-50 rounded px-2 py-1">
            No learning activity: {data.onlineLearning.childrenWithNoLearning.join(", ")}
          </div>
        )}
      </Section>

      {/* Digital Citizenship */}
      <Section title="Digital Citizenship">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-center mb-3">
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-teal-700">
              {data.digitalCitizenship.totalRecords}
            </div>
            <div className="text-[10px] text-gray-500">Observations</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className={`text-lg font-bold ${data.digitalCitizenship.positiveRate >= 80 ? "text-green-700" : "text-orange-700"}`}>
              {data.digitalCitizenship.positiveRate}%
            </div>
            <div className="text-[10px] text-gray-500">Positive Rate</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-blue-700">
              {data.digitalCitizenship.areaCoverage}/{data.digitalCitizenship.totalAreas}
            </div>
            <div className="text-[10px] text-gray-500">Areas Covered</div>
          </div>
        </div>
        <div className="space-y-1">
          {data.digitalCitizenship.areaBreakdown
            .filter((a) => a.totalCount > 0)
            .map((a) => (
              <div key={a.area} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{formatLabel(a.area)}</span>
                <span className={a.positiveCount === a.totalCount ? "text-green-700" : "text-orange-700"}>
                  {a.positiveCount}/{a.totalCount} positive
                </span>
              </div>
            ))}
        </div>
      </Section>

      {/* Strengths / Areas / Actions */}
      <Section title="Strengths & Development Areas">
        {data.strengths.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-semibold text-green-800 mb-1">Strengths</div>
            <ul className="space-y-0.5">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                  <span className="mt-0.5">&#x2713;</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.areasForDevelopment.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-orange-800 mb-1">
              Areas for Development
            </div>
            <ul className="space-y-0.5">
              {data.areasForDevelopment.map((a, i) => (
                <li key={i} className="text-xs text-orange-700 flex items-start gap-1">
                  <span className="mt-0.5">&#x2022;</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {/* Regulatory Framework */}
      <Section title="Regulatory Framework">
        <ul className="space-y-1">
          {data.regulatoryLinks.map((link, i) => (
            <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
              <span className="text-gray-400 mt-0.5">&#x25B8;</span>
              <span>{link}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
