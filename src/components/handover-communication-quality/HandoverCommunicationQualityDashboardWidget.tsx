"use client";

import { useState, useEffect } from "react";
import type { HandoverCommunicationQualityIntelligence } from "@/lib/handover-communication-quality";

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

function ScoreBar({ score, label, max = 25 }: { score: number; label: string; max?: number }) {
  const pctValue = Math.round((score / max) * 100);
  const color =
    pctValue >= 80 ? "bg-green-500" : pctValue >= 60 ? "bg-blue-500" : pctValue >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-52 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pctValue, 100)}%` }} />
      </div>
      <span className="text-sm font-medium w-14 text-right">{score}/{max}</span>
    </div>
  );
}

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
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

export function HandoverCommunicationQualityDashboardWidget() {
  const [data, setData] = useState<HandoverCommunicationQualityIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/handover-communication-quality")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
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
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800">
          Handover &amp; Communication Quality Intelligence
        </h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const ratingClass = ratingColors[data.rating] || ratingColors.inadequate;
  const ratingLabel = ratingLabels[data.rating] || data.rating;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Handover &amp; Communication Quality Intelligence
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {data.periodStart} to {data.periodEnd}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingClass}`}>
            {ratingLabel}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.handoverQuality.totalHandovers}
          </div>
          <div className="text-xs text-gray-500 mt-1">Total Handovers</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.communicationEffectiveness.totalCommunications}
          </div>
          <div className="text-xs text-gray-500 mt-1">Communications</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.teamMeetingQuality.totalMeetings}
          </div>
          <div className="text-xs text-gray-500 mt-1">Team Meetings</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.handoverQuality.thoroughRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Thorough Handovers</div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-2">
        <ScoreBar score={data.handoverQuality.overallScore} label="Handover Quality" />
        <ScoreBar score={data.communicationEffectiveness.overallScore} label="Communication Effectiveness" />
        <ScoreBar score={data.teamMeetingQuality.overallScore} label="Team Meeting Quality" />
        <ScoreBar score={data.informationGovernance.overallScore} label="Information Governance" />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {/* Staff Profiles */}
        <Section title="Staff Communication Profiles" defaultOpen>
          <div className="space-y-3">
            {data.staffProfiles.map((profile) => (
              <div key={profile.staffId} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{profile.staffName}</span>
                  <span className="text-sm font-medium text-gray-600">
                    Score: {profile.overallScore}/10
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400">Handovers Given:</span>{" "}
                    <span className="font-medium">{profile.handoversGiven}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Thorough Rate:</span>{" "}
                    <span className="font-medium">{profile.thoroughRate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Comms Sent:</span>{" "}
                    <span className="font-medium">{profile.communicationsSent}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Acknowledged:</span>{" "}
                    <span className="font-medium">{profile.acknowledgedRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Handover Quality */}
        <Section title="Handover Quality">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Handovers:</span>{" "}
              <span className="font-medium">{data.handoverQuality.totalHandovers}</span>
            </div>
            <div>
              <span className="text-gray-500">Thorough Rate:</span>{" "}
              <span className="font-medium">{data.handoverQuality.thoroughRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Child Updates:</span>{" "}
              <span className="font-medium">{data.handoverQuality.childUpdatesRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Risk Updates:</span>{" "}
              <span className="font-medium">{data.handoverQuality.riskUpdatesRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Medication Updates:</span>{" "}
              <span className="font-medium">{data.handoverQuality.medicationUpdatesRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Timeliness:</span>{" "}
              <span className="font-medium">{data.handoverQuality.timelinessRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Avg Duration:</span>{" "}
              <span className="font-medium">{data.handoverQuality.averageDuration} min</span>
            </div>
          </div>
        </Section>

        {/* Communication Effectiveness */}
        <Section title="Communication Effectiveness">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Communications:</span>{" "}
              <span className="font-medium">{data.communicationEffectiveness.totalCommunications}</span>
            </div>
            <div>
              <span className="text-gray-500">Acknowledged:</span>{" "}
              <span className="font-medium">{data.communicationEffectiveness.acknowledgedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Action Completion:</span>{" "}
              <span className="font-medium">{data.communicationEffectiveness.actionCompletionRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Critical Acknowledged:</span>{" "}
              <span className="font-medium">{data.communicationEffectiveness.criticalAcknowledgedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Avg Response Time:</span>{" "}
              <span className="font-medium">
                {data.communicationEffectiveness.averageResponseTime !== null
                  ? `${data.communicationEffectiveness.averageResponseTime} min`
                  : "N/A"}
              </span>
            </div>
          </div>
        </Section>

        {/* Team Meeting Quality */}
        <Section title="Team Meeting Quality">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Total Meetings:</span>{" "}
              <span className="font-medium">{data.teamMeetingQuality.totalMeetings}</span>
            </div>
            <div>
              <span className="text-gray-500">Avg Attendance:</span>{" "}
              <span className="font-medium">{data.teamMeetingQuality.averageAttendance}%</span>
            </div>
            <div>
              <span className="text-gray-500">Agenda Used:</span>{" "}
              <span className="font-medium">{data.teamMeetingQuality.agendaUsedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Minutes Taken:</span>{" "}
              <span className="font-medium">{data.teamMeetingQuality.minutesTakenRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Action Completion:</span>{" "}
              <span className="font-medium">{data.teamMeetingQuality.actionCompletionRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Children Discussed:</span>{" "}
              <span className="font-medium">{data.teamMeetingQuality.childrenDiscussedRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Safeguarding:</span>{" "}
              <span className="font-medium">{data.teamMeetingQuality.safeguardingRate}%</span>
            </div>
          </div>
        </Section>

        {/* Information Governance */}
        <Section title="Information Governance">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Assessments:</span>{" "}
              <span className="font-medium">{data.informationGovernance.totalAssessments}</span>
            </div>
            <div>
              <span className="text-gray-500">Data Protection:</span>{" "}
              <span className={`font-medium ${data.informationGovernance.dataProtectionRate === 100 ? "text-green-600" : "text-amber-600"}`}>
                {data.informationGovernance.dataProtectionRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Secure Storage:</span>{" "}
              <span className={`font-medium ${data.informationGovernance.secureStorageRate === 100 ? "text-green-600" : "text-amber-600"}`}>
                {data.informationGovernance.secureStorageRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Need-to-Know:</span>{" "}
              <span className={`font-medium ${data.informationGovernance.needToKnowRate === 100 ? "text-green-600" : "text-amber-600"}`}>
                {data.informationGovernance.needToKnowRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Consent Recorded:</span>{" "}
              <span className={`font-medium ${data.informationGovernance.consentRate === 100 ? "text-green-600" : "text-amber-600"}`}>
                {data.informationGovernance.consentRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Staff Trained:</span>{" "}
              <span className={`font-medium ${data.informationGovernance.staffTrainedRate === 100 ? "text-green-600" : "text-amber-600"}`}>
                {data.informationGovernance.staffTrainedRate}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Breach Process:</span>{" "}
              <span className={`font-medium ${data.informationGovernance.breachProcessRate === 100 ? "text-green-600" : "text-amber-600"}`}>
                {data.informationGovernance.breachProcessRate}%
              </span>
            </div>
          </div>
        </Section>

        {/* Strengths / Areas / Actions */}
        <Section title="Strengths, Areas &amp; Actions">
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-1">Strengths</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {data.areasForImprovement.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-700 mb-1">Areas for Improvement</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.areasForImprovement.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {data.actions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-1">Recommended Actions</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {data.actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        {/* Regulatory Framework */}
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
