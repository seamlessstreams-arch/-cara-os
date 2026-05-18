"use client";

import { useState, useEffect } from "react";
import type { PhysicalHealthMonitoringIntelligence } from "@/lib/physical-health-monitoring";

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

function ScoreBar({ score, label, maxScore = 100 }: { score: number; label: string; maxScore?: number }) {
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

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

export function PhysicalHealthMonitoringDashboardWidget() {
  const [data, setData] = useState<PhysicalHealthMonitoringIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/physical-health-monitoring")
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(setData)
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
        <h3 className="text-lg font-semibold text-red-800">Physical Health Monitoring</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Physical Health Monitoring</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}>
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.appointments.attendanceRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Attendance</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.assessments.assessmentCoverageRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Assessment Coverage</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.healthNeeds.activeNeeds}</div>
          <div className="text-xs text-gray-500 mt-1">Active Needs</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.immunisations.upToDateRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Immunisations</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${data.immunisations.overdueCount > 0 ? "text-red-600" : "text-green-600"}`}>
            {data.immunisations.overdueCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">Overdue Jabs</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.appointments.overallScore} label="Appointments" />
        <ScoreBar score={data.assessments.overallScore} label="Assessments" />
        <ScoreBar score={data.healthNeeds.overallScore} label="Health Needs" />
        <ScoreBar score={data.healthPromotion.overallScore} label="Health Promotion" />
        <ScoreBar score={data.immunisations.overallScore} label="Immunisations" />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <Section title="Child Health Profiles" defaultOpen>
          <div className="space-y-3">
            {data.childProfiles.map((child) => (
              <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{child.childName}</span>
                  <span className="text-sm text-gray-500">{child.overallHealthScore}/10</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <StatusBadge ok={child.gpRegistered} label="GP" />
                  <StatusBadge ok={child.dentalCheckCurrent} label="Dental" />
                  <StatusBadge ok={child.opticiansCheckCurrent} label="Optician" />
                  <StatusBadge ok={child.healthAssessmentCurrent} label="Assessment" />
                  <StatusBadge ok={child.immunisationsUpToDate} label="Immunisations" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Active Needs: <span className="font-medium">{child.activeHealthNeeds}</span></div>
                  <div>Managed: <span className="font-medium">{child.managedHealthNeeds}/{child.activeHealthNeeds}</span></div>
                  <div>Attendance: <span className="font-medium">{child.appointmentAttendance}%</span></div>
                  <div>HP Engagement: <span className="font-medium">{child.healthPromotionEngagement}/10</span></div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Health Appointments">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.appointments.totalAppointments}</span></div>
            <div><span className="text-gray-500">Attended:</span> <span className="font-medium text-green-600">{data.appointments.attendanceRate}%</span></div>
            <div><span className="text-gray-500">Missed:</span> <span className={`font-medium ${data.appointments.missedRate > 10 ? "text-red-600" : "text-gray-900"}`}>{data.appointments.missedRate}%</span></div>
            <div><span className="text-gray-500">Refused:</span> <span className={`font-medium ${data.appointments.childRefusedRate > 10 ? "text-amber-600" : "text-gray-900"}`}>{data.appointments.childRefusedRate}%</span></div>
            <div><span className="text-gray-500">Follow-up Booked:</span> <span className="font-medium">{data.appointments.followUpBookedRate}%</span></div>
            <div><span className="text-gray-500">Plan Updated:</span> <span className="font-medium">{data.appointments.healthPlanUpdatedRate}%</span></div>
          </div>
        </Section>

        <Section title="Health Assessments">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.assessments.totalAssessments}</span></div>
            <div><span className="text-gray-500">Coverage:</span> <span className="font-medium">{data.assessments.assessmentCoverageRate}%</span></div>
            <div><span className="text-gray-500">On Time:</span> <span className="font-medium">{data.assessments.completedOnTimeRate}%</span></div>
            <div><span className="text-gray-500">Action Plan:</span> <span className="font-medium">{data.assessments.actionPlanRate}%</span></div>
            <div><span className="text-gray-500">Child Participated:</span> <span className="font-medium">{data.assessments.childParticipationRate}%</span></div>
            <div><span className="text-gray-500">Shared:</span> <span className="font-medium">{data.assessments.sharedWithCarersRate}%</span></div>
          </div>
        </Section>

        <Section title="Health Needs Management">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.healthNeeds.totalNeeds}</span></div>
            <div><span className="text-gray-500">Active:</span> <span className="font-medium">{data.healthNeeds.activeNeeds}</span></div>
            <div><span className="text-gray-500">With Plan:</span> <span className="font-medium">{data.healthNeeds.managementPlanRate}%</span></div>
            <div><span className="text-gray-500">Managed:</span> <span className="font-medium">{data.healthNeeds.currentlyManagedRate}%</span></div>
            <div><span className="text-gray-500">Specialist:</span> <span className="font-medium">{data.healthNeeds.specialistInvolvedRate}%</span></div>
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
                {data.actions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
        </Section>

        <Section title="Regulatory Framework">
          <ul className="text-sm text-gray-600 space-y-1">
            {data.regulatoryLinks.map((link, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">§</span>
                <span>{link}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
