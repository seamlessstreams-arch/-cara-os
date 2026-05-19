"use client";

import { useState, useEffect } from "react";
import type { DentalHealthMonitoringIntelligence } from "@/lib/dental-health-monitoring";

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

const hygieneRatingColors: Record<string, string> = {
  excellent: "text-green-600",
  good: "text-blue-600",
  fair: "text-amber-600",
  poor: "text-red-600",
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

export default function DentalHealthMonitoringDashboardWidget() {
  const [data, setData] = useState<DentalHealthMonitoringIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dental-health-monitoring")
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
        <h3 className="text-lg font-semibold text-red-800">Dental Health Monitoring</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Dental Health Monitoring</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.appointmentCompliance.totalAppointments}</div>
          <div className="text-xs text-gray-500 mt-1">Appointments</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.appointmentCompliance.attendanceRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Attendance</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.oralHygieneSupport.totalRecords}</div>
          <div className="text-xs text-gray-500 mt-1">Hygiene Records</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.staffDentalReadiness.totalStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff Trained</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.appointmentCompliance.overallScore} label="Appointment Compliance" maxScore={25} />
        <ScoreBar score={data.oralHygieneSupport.overallScore} label="Oral Hygiene Support" maxScore={25} />
        <ScoreBar score={data.treatmentCompliance.overallScore} label="Treatment Compliance" maxScore={25} />
        <ScoreBar score={data.staffDentalReadiness.overallScore} label="Staff Dental Readiness" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childDentalSummaries.length > 0 && (
          <Section title="Child Dental Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childDentalSummaries.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Appointments: <span className="font-medium">{child.appointmentCount}</span></div>
                    <div>Attendance: <span className="font-medium">{child.attendanceRate}%</span></div>
                    <div>Hygiene: <span className={`font-medium ${child.latestHygieneRating ? (hygieneRatingColors[child.latestHygieneRating] || "") : "text-gray-400"}`}>{child.latestHygieneRating ? child.latestHygieneRating.charAt(0).toUpperCase() + child.latestHygieneRating.slice(1) : "N/A"}</span></div>
                    <div>Active Treatments: <span className={`font-medium ${child.activeTreatments > 0 ? "text-amber-600" : "text-green-600"}`}>{child.activeTreatments}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Appointment Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Total:</span> <span className="font-medium">{data.appointmentCompliance.totalAppointments}</span></div>
            <div><span className="text-gray-500">Attended:</span> <span className="font-medium">{data.appointmentCompliance.attendanceRate}%</span></div>
            <div><span className="text-gray-500">Next Booked:</span> <span className="font-medium">{data.appointmentCompliance.nextAppointmentBookedRate}%</span></div>
            <div><span className="text-gray-500">Consent:</span> <span className="font-medium">{data.appointmentCompliance.consentRate}%</span></div>
            <div><span className="text-gray-500">Routine:</span> <span className="font-medium">{data.appointmentCompliance.routineCount}</span></div>
            <div><span className="text-gray-500">Emergency:</span> <span className={`font-medium ${data.appointmentCompliance.emergencyCount > 0 ? "text-amber-600" : "text-green-600"}`}>{data.appointmentCompliance.emergencyCount}</span></div>
            <div><span className="text-gray-500">Ratio (R:E):</span> <span className="font-medium">{data.appointmentCompliance.routineToEmergencyRatio}</span></div>
          </div>
        </Section>

        <Section title="Oral Hygiene Support">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Records:</span> <span className="font-medium">{data.oralHygieneSupport.totalRecords}</span></div>
            <div><span className="text-gray-500">Excellent/Good:</span> <span className="font-medium">{data.oralHygieneSupport.excellentGoodRate}%</span></div>
            <div><span className="text-gray-500">Twice Daily:</span> <span className="font-medium">{data.oralHygieneSupport.twiceDailyBrushingRate}%</span></div>
            <div><span className="text-gray-500">Dietary Advice:</span> <span className="font-medium">{data.oralHygieneSupport.dietaryAdviceRate}%</span></div>
            <div><span className="text-gray-500">Mouthwash:</span> <span className="font-medium">{data.oralHygieneSupport.mouthwashUsageRate}%</span></div>
          </div>
        </Section>

        <Section title="Treatment Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Plans:</span> <span className="font-medium">{data.treatmentCompliance.totalPlans}</span></div>
            <div><span className="text-gray-500">Completion:</span> <span className="font-medium">{data.treatmentCompliance.completionRate}%</span></div>
            <div><span className="text-gray-500">Parent Consent:</span> <span className="font-medium">{data.treatmentCompliance.parentConsentRate}%</span></div>
            <div><span className="text-gray-500">SW Notified:</span> <span className="font-medium">{data.treatmentCompliance.socialWorkerNotifiedRate}%</span></div>
            <div><span className="text-gray-500">Active Progress:</span> <span className="font-medium">{data.treatmentCompliance.activeTreatmentProgressRate}%</span></div>
          </div>
        </Section>

        <Section title="Staff Dental Readiness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Staff:</span> <span className="font-medium">{data.staffDentalReadiness.totalStaff}</span></div>
            <div><span className="text-gray-500">Awareness:</span> <span className="font-medium">{data.staffDentalReadiness.dentalHealthAwarenessRate}%</span></div>
            <div><span className="text-gray-500">Hygiene Support:</span> <span className="font-medium">{data.staffDentalReadiness.oralHygieneSupportRate}%</span></div>
            <div><span className="text-gray-500">Appointments:</span> <span className="font-medium">{data.staffDentalReadiness.appointmentManagementRate}%</span></div>
            <div><span className="text-gray-500">Consent Process:</span> <span className="font-medium">{data.staffDentalReadiness.consentProcessTrainedRate}%</span></div>
            <div><span className="text-gray-500">Emergency:</span> <span className="font-medium">{data.staffDentalReadiness.emergencyDentalKnowledgeRate}%</span></div>
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
