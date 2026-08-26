"use client";

import { useState, useEffect } from "react";
import { above, formatRate } from "@/lib/metrics/rate";
import type { TherapeuticCrisisInterventionIntelligence } from "@/lib/therapeutic-crisis-intervention";

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
  const pctVal = (score / maxScore) * 100;
  const color = pctVal >= 80 ? "bg-green-500" : pctVal >= 60 ? "bg-blue-500" : pctVal >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-48 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pctVal, 100)}%` }} />
      </div>
      <span className="text-sm font-medium w-12 text-right">{score}/{maxScore}</span>
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

function Stat({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span>{" "}
      <span className={`font-medium ${warn ? "text-red-600" : ""}`}>{value}</span>
    </div>
  );
}

export function TherapeuticCrisisInterventionDashboardWidget() {
  const [data, setData] = useState<TherapeuticCrisisInterventionIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/therapeutic-crisis-intervention")
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
        <h3 className="text-lg font-semibold text-red-800">Therapeutic Crisis Intervention</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Therapeutic Crisis Intervention</h3>
          <p className="text-sm text-gray-500 mt-1">{data.periodStart} to {data.periodEnd}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{data.overallScore}</div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ratingColors[data.rating] || ""}`}>
            {ratingLabels[data.rating] || data.rating}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.childProfiles.reduce((s, c) => s + c.totalIncidents, 0)}</div>
          <div className="text-xs text-gray-500 mt-1">Incidents</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.deescalationEffectiveness.deescalationAttemptRate)}</div>
          <div className="text-xs text-gray-500 mt-1">De-escalated</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.deescalationEffectiveness.deescalationSuccessRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Resolved</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.postIncidentPractice.childDebriefRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Debriefed</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.staffCrisisReadiness.totalStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Trained Staff</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.deescalationEffectiveness.overallScore} label="De-escalation Effectiveness" maxScore={25} />
        <ScoreBar score={data.postIncidentPractice.overallScore} label="Post-Incident Practice" maxScore={25} />
        <ScoreBar score={data.crisisPolicy.overallScore} label="Crisis Policy" maxScore={25} />
        <ScoreBar score={data.staffCrisisReadiness.overallScore} label="Staff Crisis Readiness" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Crisis Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Incidents: <span className="font-medium">{child.totalIncidents}</span></div>
                    <div>Physical: <span className={`font-medium ${child.physicalInterventions > 0 ? "text-red-600" : "text-green-600"}`}>{child.physicalInterventions}</span></div>
                    <div>De-escalation: <span className="font-medium">{child.deescalationSuccessRate}%</span></div>
                    <div>Debriefed: <span className="font-medium">{child.debriefRate}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="De-escalation Effectiveness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Attempt Rate" value={`${formatRate(data.deescalationEffectiveness.deescalationAttemptRate)}`} />
            <Stat label="Success Rate" value={`${formatRate(data.deescalationEffectiveness.deescalationSuccessRate)}`} />
            <Stat label="Physical Rate" value={`${formatRate(data.deescalationEffectiveness.physicalInterventionRate)}`} warn={above(data.deescalationEffectiveness.physicalInterventionRate, 0)} />
            <Stat label="Low Severity" value={data.deescalationEffectiveness.severityDistribution.low} />
            <Stat label="Medium Severity" value={data.deescalationEffectiveness.severityDistribution.medium} />
            <Stat label="High Severity" value={data.deescalationEffectiveness.severityDistribution.high} warn={data.deescalationEffectiveness.severityDistribution.high > 0} />
            <Stat label="Critical Severity" value={data.deescalationEffectiveness.severityDistribution.critical} warn={data.deescalationEffectiveness.severityDistribution.critical > 0} />
          </div>
        </Section>

        <Section title="Post-Incident Practice">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Child Debrief" value={`${formatRate(data.postIncidentPractice.childDebriefRate)}`} />
            <Stat label="Staff Debrief" value={`${formatRate(data.postIncidentPractice.staffDebriefRate)}`} />
            <Stat label="Body Maps" value={`${formatRate(data.postIncidentPractice.bodyMapCompletionRate)}`} />
            <Stat label="Timely Recording" value={`${formatRate(data.postIncidentPractice.timelyRecordingRate)}`} />
            <Stat label="Lessons Learned" value={`${formatRate(data.postIncidentPractice.lessonsLearnedRate)}`} />
          </div>
        </Section>

        <Section title="Crisis Policy">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Therapeutic Approach" value={data.crisisPolicy.therapeuticApproachDocumented ? "Yes" : "No"} warn={!data.crisisPolicy.therapeuticApproachDocumented} />
            <Stat label="De-escalation Protocol" value={data.crisisPolicy.deescalationProtocol ? "Yes" : "No"} warn={!data.crisisPolicy.deescalationProtocol} />
            <Stat label="Physical Intervention" value={data.crisisPolicy.physicalInterventionPolicy ? "Yes" : "No"} warn={!data.crisisPolicy.physicalInterventionPolicy} />
            <Stat label="Post-Incident Process" value={data.crisisPolicy.postIncidentProcess ? "Yes" : "No"} warn={!data.crisisPolicy.postIncidentProcess} />
            <Stat label="Body Map Requirement" value={data.crisisPolicy.bodyMapRequirement ? "Yes" : "No"} warn={!data.crisisPolicy.bodyMapRequirement} />
            <Stat label="Notification Protocol" value={data.crisisPolicy.notificationProtocol ? "Yes" : "No"} warn={!data.crisisPolicy.notificationProtocol} />
            <Stat label="Review Schedule" value={data.crisisPolicy.reviewSchedule ? "Yes" : "No"} warn={!data.crisisPolicy.reviewSchedule} />
          </div>
        </Section>

        <Section title="Staff Crisis Readiness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Staff Trained" value={data.staffCrisisReadiness.totalStaff} />
            <Stat label="Therapeutic" value={`${formatRate(data.staffCrisisReadiness.therapeuticApproachRate)}`} />
            <Stat label="De-escalation" value={`${formatRate(data.staffCrisisReadiness.deescalationRate)}`} />
            <Stat label="Physical Intervention" value={`${formatRate(data.staffCrisisReadiness.physicalInterventionRate)}`} />
            <Stat label="Post-Incident" value={`${formatRate(data.staffCrisisReadiness.postIncidentSupportRate)}`} />
            <Stat label="Record Keeping" value={`${formatRate(data.staffCrisisReadiness.recordKeepingRate)}`} />
            <Stat label="Body Mapping" value={`${formatRate(data.staffCrisisReadiness.bodyMappingRate)}`} />
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

export default TherapeuticCrisisInterventionDashboardWidget;
