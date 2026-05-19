"use client";

import { useState, useEffect } from "react";
import type { PhysicalHealthWellbeingIntelligence } from "@/lib/physical-health-wellbeing";

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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span>{" "}
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function PhysicalHealthWellbeingDashboardWidget() {
  const [data, setData] = useState<PhysicalHealthWellbeingIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/physical-health-wellbeing")
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
        <h3 className="text-lg font-semibold text-red-800">Physical Health & Wellbeing</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Physical Health & Wellbeing</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.healthQuality.totalRecords}</div>
          <div className="text-xs text-gray-500 mt-1">Health Records</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.healthQuality.appointmentAttendedRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Attendance</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.healthQuality.outcomeRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Good+ Outcomes</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.staffHealthReadiness.totalStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff Trained</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.healthQuality.overallScore} label="Health Quality" maxScore={25} />
        <ScoreBar score={data.healthCompliance.overallScore} label="Health Compliance" maxScore={25} />
        <ScoreBar score={data.healthPolicy.overallScore} label="Health Policy" maxScore={25} />
        <ScoreBar score={data.staffHealthReadiness.overallScore} label="Staff Readiness" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childHealthProfiles.length > 0 && (
          <Section title="Child Health Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childHealthProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <Stat label="Records" value={child.recordCount} />
                    <Stat label="Outcomes" value={`${child.outcomeRate}%`} />
                    <Stat label="Attendance" value={`${child.appointmentRate}%`} />
                    <Stat label="Areas Covered" value={child.uniqueAreas} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Health Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Records" value={data.healthQuality.totalRecords} />
            <Stat label="Good+ Outcomes" value={`${data.healthQuality.outcomeRate}%`} />
            <Stat label="Attended" value={`${data.healthQuality.appointmentAttendedRate}%`} />
            <Stat label="Plans Updated" value={`${data.healthQuality.healthPlanRate}%`} />
            <Stat label="Consent" value={`${data.healthQuality.consentRate}%`} />
          </div>
        </Section>

        <Section title="Health Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Staff Accompanied" value={`${data.healthCompliance.staffAccompaniedRate}%`} />
            <Stat label="Documented" value={`${data.healthCompliance.documentedRate}%`} />
            <Stat label="Follow-up" value={`${data.healthCompliance.followUpRate}%`} />
            <Stat label="Area Diversity" value={data.healthCompliance.areaDiversity.toFixed(2)} />
          </div>
        </Section>

        <Section title="Health Policy">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Assessment Framework" value={data.healthPolicy.healthAssessmentFramework ? "Yes" : "No"} />
            <Stat label="Appointment Mgmt" value={data.healthPolicy.appointmentManagement ? "Yes" : "No"} />
            <Stat label="Consent Protocol" value={data.healthPolicy.consentProtocol ? "Yes" : "No"} />
            <Stat label="Health Passport" value={data.healthPolicy.healthPassportScheme ? "Yes" : "No"} />
            <Stat label="Activity Plan" value={data.healthPolicy.physicalActivityPlan ? "Yes" : "No"} />
            <Stat label="Nutrition" value={data.healthPolicy.nutritionGuidelines ? "Yes" : "No"} />
            <Stat label="Regular Review" value={data.healthPolicy.regularReview ? "Yes" : "No"} />
          </div>
        </Section>

        <Section title="Staff Health Readiness">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <Stat label="Staff" value={data.staffHealthReadiness.totalStaff} />
            <Stat label="Health Awareness" value={`${data.staffHealthReadiness.healthAwarenessRate}%`} />
            <Stat label="MH First Aid" value={`${data.staffHealthReadiness.mentalHealthFirstAidRate}%`} />
            <Stat label="Consent & Capacity" value={`${data.staffHealthReadiness.consentAndCapacityRate}%`} />
            <Stat label="Medication Mgmt" value={`${data.staffHealthReadiness.medicationManagementRate}%`} />
            <Stat label="Appointment Support" value={`${data.staffHealthReadiness.appointmentSupportRate}%`} />
            <Stat label="Documentation" value={`${data.staffHealthReadiness.healthDocumentationRate}%`} />
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
