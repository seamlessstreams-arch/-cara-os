"use client";

import { useState, useEffect } from "react";
import type { EducationAchievementIntelligence } from "@/lib/education-achievement";

const ratingColors: Record<string, string> = {
  outstanding: "bg-green-100 text-green-800 border-green-300",
  good: "bg-blue-100 text-blue-800 border-blue-300",
  requires_improvement: "bg-amber-100 text-amber-800 border-amber-300",
  inadequate: "bg-red-100 text-red-800 border-red-300",
};

const ratingLabels: Record<string, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

function ScoreBar({ score, label, maxScore = 100 }: { score: number | null; label: string; maxScore?: number }) {
  if (score === null) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
        <div className="flex-1 bg-gray-100 rounded-full h-2.5" />
        <span className="text-sm font-medium w-12 text-right text-gray-400">—</span>
      </div>
    );
  }
  const pct = (score / maxScore) * 100;
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-44 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-sm font-medium w-12 text-right">{score}</span>
    </div>
  );
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
        <span className="font-medium text-gray-900">{title}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

function attendanceColor(rate: number): string {
  if (rate >= 95) return "text-green-600";
  if (rate >= 90) return "text-amber-600";
  return "text-red-600";
}

export function EducationAchievementDashboardWidget() {
  const [data, setData] = useState<EducationAchievementIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/education-achievement")
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then((json) => setData(json.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-200 rounded" />)}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">Education Achievement</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Education Achievement</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}>
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${attendanceColor((data.attendance.attendanceRate ?? 0))}`}>{data.attendance.attendanceRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Attendance</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${(data.pepQuality.currentRate ?? 0) >= 100 ? "text-green-600" : "text-amber-600"}`}>{data.pepQuality.currentRate}%</div>
          <div className="text-xs text-gray-500 mt-1">PEPs Current</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{data.academicProgress.exceedingExpectedRate}%</div>
          <div className="text-xs text-gray-500 mt-1">On Track</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${data.schoolStability.notInEducationCount === 0 ? "text-green-600" : "text-red-600"}`}>{data.schoolStability.notInEducationCount}</div>
          <div className="text-xs text-gray-500 mt-1">NEET</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.attendance.overallScore} label="Attendance" maxScore={25} />
        <ScoreBar score={data.pepQuality.overallScore} label="PEP Quality" maxScore={25} />
        <ScoreBar score={data.academicProgress.overallScore} label="Academic Progress" maxScore={25} />
        <ScoreBar score={data.schoolStability.overallScore} label="School Stability" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Education Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className={`text-sm font-medium ${attendanceColor((child.attendanceRate ?? 0))}`}>{child.attendanceRate}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Type: <span className="font-medium">{String(child.schoolType).replace(/_/g, " ")}</span></div>
                    <div>PEP: <span className={`font-medium ${child.pepStatus === "current" || child.pepStatus === "completed" ? "text-green-600" : child.pepStatus === "overdue" ? "text-red-600" : "text-amber-600"}`}>{String(child.pepStatus).replace(/_/g, " ")}</span></div>
                    <div>Progress: <span className={`font-medium ${child.academicProgress === "exceeding" ? "text-green-600" : child.academicProgress === "expected" ? "text-blue-600" : child.academicProgress === "below_expected" ? "text-amber-600" : "text-red-600"}`}>{String(child.academicProgress).replace(/_/g, " ")}</span></div>
                    {child.exclusionCount > 0 && <div>Exclusions: <span className="font-medium text-red-600">{child.exclusionCount}</span></div>}
                    {child.daysOutOfEducation > 0 && <div>Days out: <span className="font-medium text-amber-600">{child.daysOutOfEducation}</span></div>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Attendance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Rate:</span> <span className="font-medium">{data.attendance.attendanceRate}%</span></div>
            <div><span className="text-gray-500">Records:</span> <span className="font-medium">{data.attendance.totalRecords}</span></div>
            <div><span className="text-gray-500">Unauthorised:</span> <span className="font-medium">{data.attendance.unauthorisedAbsenceRate}%</span></div>
            <div><span className="text-gray-500">Persistent Absent:</span> <span className="font-medium">{data.attendance.persistentAbsenceChildren}</span></div>
            <div><span className="text-gray-500">Late:</span> <span className="font-medium">{data.attendance.lateRate}%</span></div>
            <div><span className="text-gray-500">Exclusion Days:</span> <span className="font-medium">{data.attendance.exclusionDays}</span></div>
          </div>
        </Section>

        <Section title="PEP Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.pepQuality.totalPEPs}</span></div>
            <div><span className="text-gray-500">Current:</span> <span className="font-medium">{data.pepQuality.currentRate}%</span></div>
            <div><span className="text-gray-500">Child Views:</span> <span className="font-medium">{data.pepQuality.childViewsRate}%</span></div>
            <div><span className="text-gray-500">SMART Targets:</span> <span className="font-medium">{data.pepQuality.smartTargetsRate}%</span></div>
            <div><span className="text-gray-500">VS Involved:</span> <span className="font-medium">{data.pepQuality.virtualSchoolInvolvedRate}%</span></div>
            <div><span className="text-gray-500">PP Funding:</span> <span className="font-medium">{data.pepQuality.ppFundingUsedRate}%</span></div>
          </div>
        </Section>

        <Section title="Academic Progress">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Assessments:</span> <span className="font-medium">{data.academicProgress.totalOutcomes}</span></div>
            <div><span className="text-gray-500">Exceeding+Expected:</span> <span className="font-medium">{data.academicProgress.exceedingExpectedRate}%</span></div>
            <div><span className="text-gray-500">Below Expected:</span> <span className="font-medium">{data.academicProgress.belowExpectedRate}%</span></div>
            <div><span className="text-gray-500">Subjects:</span> <span className="font-medium">{data.academicProgress.subjectCoverage}</span></div>
          </div>
        </Section>

        <Section title="School Stability">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Children:</span> <span className="font-medium">{data.schoolStability.totalChildren}</span></div>
            <div><span className="text-gray-500">Changes:</span> <span className="font-medium">{data.schoolStability.totalSchoolChanges}</span></div>
            <div><span className="text-gray-500">Days Out:</span> <span className="font-medium">{data.schoolStability.totalDaysOutOfEducation}</span></div>
            <div><span className="text-gray-500">NEET:</span> <span className={`font-medium ${data.schoolStability.notInEducationCount > 0 ? "text-red-600" : "text-green-600"}`}>{data.schoolStability.notInEducationCount}</span></div>
          </div>
        </Section>

        <Section title="Strengths, Areas & Actions">
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-1">Strengths</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-700 mb-1">Areas for Improvement</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.areasForImprovement.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          {data.actions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-1">Recommended Actions</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.actions.map((a, i) => (
                  <li key={i} className={a.startsWith("URGENT") ? "text-red-700 font-medium" : ""}>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        <Section title="Regulatory Framework">
          <ul className="text-sm text-gray-600 space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">&sect;</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
