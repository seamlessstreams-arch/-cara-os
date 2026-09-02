"use client";

import { useState, useEffect } from "react";
import type { BodyMapProtocolIntelligence } from "@/lib/body-map-protocol";
import { formatRate } from "@/lib/metrics/rate";

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

export function BodyMapProtocolDashboardWidget() {
  const [data, setData] = useState<BodyMapProtocolIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/body-map-protocol")
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
        <h3 className="text-lg font-semibold text-red-800">Body Map Protocol</h3>
        <p className="text-red-600 mt-2">Failed to load: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Body Map Protocol</h3>
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
          <div className="text-2xl font-bold text-gray-900">{data.recordingQuality.totalRecords}</div>
          <div className="text-xs text-gray-500 mt-1">Body Maps</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.recordingQuality.thoroughRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Thorough</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.auditCompliance.totalAudits}</div>
          <div className="text-xs text-gray-500 mt-1">Audits</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatRate(data.staffCompetence.bodyMapTrainedRate)}</div>
          <div className="text-xs text-gray-500 mt-1">Staff Trained</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.escalationEffectiveness.totalEscalations}</div>
          <div className="text-xs text-gray-500 mt-1">Escalations</div>
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar score={data.recordingQuality.overallScore} label="Recording Quality" maxScore={25} />
        <ScoreBar score={data.auditCompliance.overallScore} label="Audit Compliance" maxScore={25} />
        <ScoreBar score={data.staffCompetence.overallScore} label="Staff Competence" maxScore={25} />
        <ScoreBar score={data.escalationEffectiveness.overallScore} label="Escalation Effectiveness" maxScore={25} />
      </div>

      <div className="space-y-3">
        {data.childProfiles.length > 0 && (
          <Section title="Child Body Map Profiles" defaultOpen>
            <div className="space-y-3">
              {data.childProfiles.map((child) => (
                <div key={child.childId} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{child.childName}</span>
                    <span className="text-sm font-medium text-gray-600">{child.overallScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Total Records: <span className="font-medium">{child.totalRecords}</span></div>
                    <div>Thorough: <span className="font-medium">{formatRate(child.thoroughRate)}</span></div>
                    <div>Unexplained: <span className={`font-medium ${child.unexplainedCount > 0 ? "text-amber-600" : "text-green-600"}`}>{child.unexplainedCount}</span></div>
                    <div>Escalations: <span className="font-medium">{child.escalationCount}</span></div>
                  </div>
                  {child.commonRegions.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Common areas: {child.commonRegions.join(", ").replace(/_/g, " ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Recording Quality">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Records:</span> <span className="font-medium">{data.recordingQuality.totalRecords}</span></div>
            <div><span className="text-gray-500">Thorough:</span> <span className="font-medium">{formatRate(data.recordingQuality.thoroughRate)}</span></div>
            <div><span className="text-gray-500">Child Explanation:</span> <span className="font-medium">{formatRate(data.recordingQuality.childExplanationRate)}</span></div>
            <div><span className="text-gray-500">Timely:</span> <span className="font-medium">{formatRate(data.recordingQuality.timelyRecordingRate)}</span></div>
            <div><span className="text-gray-500">Photographed:</span> <span className="font-medium">{formatRate(data.recordingQuality.photographRate)}</span></div>
            <div><span className="text-gray-500">Manager Informed:</span> <span className="font-medium">{formatRate(data.recordingQuality.managerInformedRate)}</span></div>
            <div><span className="text-gray-500">Follow-up Done:</span> <span className="font-medium">{formatRate(data.recordingQuality.followUpCompletedRate)}</span></div>
          </div>
        </Section>

        <Section title="Audit Compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Audits:</span> <span className="font-medium">{data.auditCompliance.totalAudits}</span></div>
            <div><span className="text-gray-500">Compliant:</span> <span className="font-medium">{formatRate(data.auditCompliance.overallCompliantRate)}</span></div>
            <div><span className="text-gray-500">Secure Storage:</span> <span className="font-medium">{formatRate(data.auditCompliance.storageSecureRate)}</span></div>
            <div><span className="text-gray-500">Protocol Accessible:</span> <span className="font-medium">{formatRate(data.auditCompliance.protocolAccessibleRate)}</span></div>
            <div><span className="text-gray-500">Cross Referenced:</span> <span className="font-medium">{formatRate(data.auditCompliance.crossReferencedRate)}</span></div>
            <div><span className="text-gray-500">Staff Trained:</span> <span className="font-medium">{formatRate(data.auditCompliance.staffTrainedRate)}</span></div>
          </div>
        </Section>

        <Section title="Staff Competence">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Staff:</span> <span className="font-medium">{data.staffCompetence.totalStaff}</span></div>
            <div><span className="text-gray-500">Body Map:</span> <span className="font-medium">{formatRate(data.staffCompetence.bodyMapTrainedRate)}</span></div>
            <div><span className="text-gray-500">Safeguarding:</span> <span className="font-medium">{formatRate(data.staffCompetence.safeguardingRate)}</span></div>
            <div><span className="text-gray-500">Photography:</span> <span className="font-medium">{formatRate(data.staffCompetence.photographyRate)}</span></div>
            <div><span className="text-gray-500">Documentation:</span> <span className="font-medium">{formatRate(data.staffCompetence.documentationRate)}</span></div>
            <div><span className="text-gray-500">Escalation:</span> <span className="font-medium">{formatRate(data.staffCompetence.escalationRate)}</span></div>
          </div>
        </Section>

        <Section title="Escalation Effectiveness">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Escalations:</span> <span className="font-medium">{data.escalationEffectiveness.totalEscalations}</span></div>
            <div><span className="text-gray-500">Timely:</span> <span className="font-medium">{formatRate(data.escalationEffectiveness.timelyRate)}</span></div>
            <div><span className="text-gray-500">Appropriate:</span> <span className="font-medium">{formatRate(data.escalationEffectiveness.appropriateRate)}</span></div>
            <div><span className="text-gray-500">Referral Made:</span> <span className="font-medium">{formatRate(data.escalationEffectiveness.referralMadeRate)}</span></div>
            <div><span className="text-gray-500">Outcome Recorded:</span> <span className="font-medium">{formatRate(data.escalationEffectiveness.outcomeRecordedRate)}</span></div>
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
