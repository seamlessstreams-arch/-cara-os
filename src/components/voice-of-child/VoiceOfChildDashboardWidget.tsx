"use client";

// ══════════════════════════════════════════════════════════════════════════════
// VOICE OF THE CHILD DASHBOARD WIDGET
//
// Displays cross-cutting voice capture intelligence:
// - Overall voice capture & influence rating
// - Per-domain capture rates
// - Per-child voice profiles
// - Advocacy & independent visitor access
// - Participation rates in reviews/meetings
// - Voice method diversity
// - Tokenistic practice detection
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

interface DomainCaptureData {
  domain: string;
  domainLabel?: string;
  totalEntries: number;
  voiceRecordedCount: number;
  captureRate: number;
  influencedCount: number;
  influenceRate: number;
}

interface MethodData {
  method: string;
  methodLabel?: string;
  count: number;
}

interface ChildVoiceData {
  childId: string;
  childName: string;
  totalEntries: number;
  voiceRecordedRate: number;
  influenceRate: number;
  preferredMethods: string[];
  domainsWithGaps: string[];
  hasAdvocate: boolean;
  hasIndependentVisitor: boolean;
  participationRate: number;
  concerns: string[];
}

interface VoiceData {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: string;
  totalVoiceEntries: number;
  overallCaptureRate: number;
  overallInfluenceRate: number;
  domainCapture: DomainCaptureData[];
  weakestDomains: string[];
  strongestDomains: string[];
  childResults: ChildVoiceData[];
  advocacyAccessRate: number;
  independentVisitorRate: number;
  averageParticipationRate: number;
  childrenAwareOfRights: number;
  methodBreakdown: MethodData[];
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Rating Badge ───────────────────────────────────────────────────────────

function RatingBadge({ score, rating }: { score: number; rating: string }) {
  const colorClass =
    rating === "outstanding" ? "bg-green-100 text-green-800 border-green-300"
      : rating === "good" ? "bg-blue-100 text-blue-800 border-blue-300"
        : rating === "requires_improvement" ? "bg-orange-100 text-orange-800 border-orange-300"
          : "bg-red-100 text-red-800 border-red-300";

  const label =
    rating === "outstanding" ? "Outstanding"
      : rating === "good" ? "Good"
        : rating === "requires_improvement" ? "Requires Improvement"
          : "Inadequate";

  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colorClass}`}>
      <div className="text-3xl font-bold">{score}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  );
}

// ── Domain Bar ─────────────────────────────────────────────────────────────

function DomainBar({ domain }: { domain: DomainCaptureData }) {
  const barColor =
    domain.captureRate >= 90 ? "bg-green-500"
      : domain.captureRate >= 70 ? "bg-blue-500"
        : domain.captureRate >= 50 ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 truncate">{domain.domainLabel ?? domain.domain.replace(/_/g, " ")}</span>
        <span className="font-semibold ml-2">{domain.captureRate}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${domain.captureRate}%` }} />
      </div>
    </div>
  );
}

// ── Child Voice Card ──────────────────────────────────────────────────────

function ChildVoiceCard({ child }: { child: ChildVoiceData }) {
  const hasConcerns = (child.concerns?.length ?? 0) > 0;
  const rateColor = (r: number) =>
    r >= 80 ? "text-green-700" : r >= 60 ? "text-blue-700" : r >= 40 ? "text-orange-700" : "text-red-700";

  return (
    <div className={`rounded-lg border p-3 ${hasConcerns ? "border-orange-200 bg-orange-50" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{child.childName}</span>
        <span className="text-xs text-gray-500">{child.totalEntries} entries</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center mb-2">
        <div>
          <div className="text-xs text-gray-500">Captured</div>
          <div className={`text-sm font-bold ${rateColor(child.voiceRecordedRate)}`}>{child.voiceRecordedRate}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Influenced</div>
          <div className={`text-sm font-bold ${rateColor(child.influenceRate)}`}>{child.influenceRate}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Participation</div>
          <div className={`text-sm font-bold ${rateColor(child.participationRate)}`}>{child.participationRate}%</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {child.hasAdvocate && (
          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Advocate</span>
        )}
        {child.hasIndependentVisitor && (
          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">IV</span>
        )}
        {!child.hasAdvocate && (
          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">No Advocate</span>
        )}
      </div>
      {hasConcerns && (child.concerns?.length ?? 0) > 0 && (
        <div className="mt-2 text-[10px] text-orange-600">
          {child.concerns[0]}
        </div>
      )}
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function VoiceOfChildDashboardWidget() {
  const [data, setData] = useState<VoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/voice-of-child");
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
        <h3 className="font-semibold text-red-800">Voice of the Child</h3>
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
            Voice of the Child
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.totalVoiceEntries} voice entries | {data.childResults.length} children | Reg 7 compliance
          </p>
        </div>
        <RatingBadge score={data.overallScore} rating={data.rating} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-700">{data.overallCaptureRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Voice Captured</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-700">{data.overallInfluenceRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Influenced Decisions</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-xl font-bold text-purple-700">{data.advocacyAccessRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Advocacy Access</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-xl font-bold text-orange-700">{data.averageParticipationRate}%</div>
          <div className="text-[10px] text-gray-500 uppercase">Participation Rate</div>
        </div>
      </div>

      {/* Domain Capture Bars */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Voice Capture by Domain</h4>
        <div className="space-y-2">
          {data.domainCapture.slice(0, 6).map((domain) => (
            <DomainBar key={domain.domain} domain={domain} />
          ))}
        </div>
      </div>

      {/* Child Voice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {data.childResults.map((child) => (
          <ChildVoiceCard key={child.childId} child={child} />
        ))}
      </div>

      {/* Voice Methods */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">Voice Capture Methods</h4>
        <div className="flex flex-wrap gap-1.5">
          {data.methodBreakdown.map((m, i) => (
            <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
              {m.methodLabel ?? m.method.replace(/_/g, " ")} ({m.count})
            </span>
          ))}
        </div>
      </div>

      {/* Immediate Actions */}
      {data.immediateActions.length > 0 &&
        !data.immediateActions[0].startsWith("No immediate actions") && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">Required Actions</h4>
            <ul className="space-y-1">
              {data.immediateActions.map((action, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    {action.startsWith("HIGH") ? "🟠" : "🟡"}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Rights Awareness */}
      <div className="flex items-center gap-2 mb-4 p-2 bg-green-50 border border-green-200 rounded-lg">
        <span className="text-green-600 text-lg">📢</span>
        <span className="text-xs text-green-700 font-medium">
          {data.childrenAwareOfRights} of {data.childResults.length} children recorded as aware of their rights | {data.independentVisitorRate}% have independent visitor access
        </span>
      </div>

      {/* Expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-left"
      >
        {expanded ? "Hide details ▲" : "Show strengths, development areas & regulatory links ▼"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Extended Domain Bars */}
          {data.domainCapture.length > 6 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">All Domains</h4>
              <div className="space-y-2">
                {data.domainCapture.slice(6).map((domain) => (
                  <DomainBar key={domain.domain} domain={domain} />
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {data.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-green-700">+ {s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Development */}
          {data.areasForDevelopment.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Areas for Development</h4>
              <ul className="space-y-1">
                {data.areasForDevelopment.map((area, i) => (
                  <li key={i} className="text-xs text-orange-700">- {area}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Regulatory Links */}
          {data.regulatoryLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Regulatory References</h4>
              <ul className="space-y-1">
                {data.regulatoryLinks.map((link, i) => (
                  <li key={i} className="text-xs text-gray-600">{link}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
