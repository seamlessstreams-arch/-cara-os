"use client";

import {
  usePracticeFlagIntelligence,
  type PracticeFlagEntry,
  type ThresholdConsultationEntry,
  type StaffWellbeingSignalEntry,
  type FlagSeverity,
  type OverallSignal,
} from "@/hooks/use-practice-flag-intelligence";

const SEVERITY_CONFIG: Record<FlagSeverity, { label: string; bg: string; border: string; text: string; dot: string }> = {
  high: { label: "High", bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" },
  medium: { label: "Medium", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  low: { label: "Low", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-400" },
};

const SIGNAL_CONFIG: Record<OverallSignal, { label: string; bg: string; border: string; text: string }> = {
  urgent: { label: "Urgent manager action required", bg: "bg-red-50", border: "border-red-300", text: "text-red-800" },
  attention: { label: "Manager attention needed", bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800" },
  good: { label: "No urgent practice flags", bg: "bg-green-50", border: "border-green-300", text: "text-green-800" },
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  daily_record: "Daily log",
  care_plan: "Care plan",
  key_work: "Key work",
  risk_assessment: "Risk assessment",
  safeguarding_concern: "Safeguarding concern",
  supervision: "Supervision",
};

function SeverityBadge({ severity }: { severity: FlagSeverity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function FlagCard({ flag }: { flag: PracticeFlagEntry }) {
  const sev = SEVERITY_CONFIG[flag.severity];
  return (
    <div className={`rounded-lg border p-4 space-y-2.5 ${sev.bg} ${sev.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{flag.title}</p>
          {flag.childName && (
            <p className="text-xs text-gray-500 mt-0.5">
              {flag.childName} · {SOURCE_TYPE_LABELS[flag.sourceType] ?? flag.sourceType}
            </p>
          )}
          {!flag.childName && flag.staffId && (
            <p className="text-xs text-gray-500 mt-0.5">
              Staff · {SOURCE_TYPE_LABELS[flag.sourceType] ?? flag.sourceType}
            </p>
          )}
        </div>
        <SeverityBadge severity={flag.severity} />
      </div>

      <p className="text-xs text-gray-700">{flag.description}</p>

      {flag.evidence && (
        <div className="text-xs text-gray-600 italic border-l-2 border-gray-300 pl-2">
          Evidence: {flag.evidence}
        </div>
      )}

      <div className="text-xs text-gray-800 bg-white bg-opacity-60 rounded p-2 border border-gray-200">
        <span className="font-semibold">Cara advises: </span>{flag.recommendedAction}
      </div>

      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {flag.requiresManagerReview && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-medium">
            Manager review required
          </span>
        )}
        {flag.requiresRiReview && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-medium">
            RI review required
          </span>
        )}
      </div>
    </div>
  );
}

function ThresholdCard({ consult }: { consult: ThresholdConsultationEntry }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-red-900 text-sm">Threshold consultation — {consult.concernType}</p>
          {consult.childName && (
            <p className="text-xs text-red-700 mt-0.5">{consult.childName}</p>
          )}
        </div>
        {consult.emergencyActionRecommended && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white font-semibold whitespace-nowrap">
            Emergency action
          </span>
        )}
      </div>

      <p className="text-xs text-red-800">{consult.summary}</p>

      <div className="text-xs text-red-900 bg-white bg-opacity-60 rounded p-2 border border-red-200">
        <span className="font-semibold">Recommended next step: </span>{consult.recommendedNextStep}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {consult.strategyDiscussionRecommended && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
            Strategy discussion
          </span>
        )}
        {consult.ladoConsultationRecommended && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
            LADO consultation
          </span>
        )}
        {!consult.managerDecision && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            Awaiting manager decision
          </span>
        )}
      </div>
    </div>
  );
}

function WellbeingSignalCard({ signal }: { signal: StaffWellbeingSignalEntry }) {
  const sev = SEVERITY_CONFIG[signal.severity];
  return (
    <div className={`rounded-lg border p-4 space-y-2.5 ${sev.bg} ${sev.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{signal.staffName}</p>
          <p className="text-xs text-gray-500 mt-0.5 capitalize">{signal.signalType.replace(/_/g, " ")} signal</p>
        </div>
        <SeverityBadge severity={signal.severity} />
      </div>

      <p className="text-xs text-gray-700 italic border-l-2 border-gray-300 pl-2">{signal.evidence}</p>

      <div className="text-xs text-gray-800 bg-white bg-opacity-60 rounded p-2 border border-gray-200">
        <span className="font-semibold">Support recommendation: </span>{signal.supportRecommendation}
      </div>
    </div>
  );
}

export default function PracticeFlagIntelligencePage() {
  const { data, isLoading, error } = usePracticeFlagIntelligence();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-8 w-80 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="p-6 text-red-600">Failed to load practice flag intelligence.</div>
    );
  }

  const { priorityFlags, allFlags, thresholdConsultations, staffWellbeingSignals, summary } = data.data;
  const signalCfg = SIGNAL_CONFIG[summary.overallSignal];
  const otherFlags = allFlags.filter((f) => !priorityFlags.find((p) => p.id === f.id));

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Practice Flag Intelligence</h1>
        <p className="text-sm text-gray-500 mt-1">
          Unresolved Cara practice flags, safeguarding threshold consultations, and staff
          wellbeing signals — requiring manager review or action.
        </p>
      </div>

      {/* Overall signal */}
      <div className={`rounded-lg border px-5 py-4 ${signalCfg.bg} ${signalCfg.border}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className={`font-semibold ${signalCfg.text}`}>{signalCfg.label}</p>
          <div className="flex gap-5 text-sm">
            <div className="text-center">
              <p className={`font-bold text-xl ${summary.highSeverityCount > 0 ? "text-red-700" : "text-gray-900"}`}>
                {summary.highSeverityCount}
              </p>
              <p className="text-gray-500 text-xs">High severity</p>
            </div>
            <div className="text-center">
              <p className={`font-bold text-xl ${summary.managerReviewRequiredCount > 0 ? "text-amber-700" : "text-gray-900"}`}>
                {summary.managerReviewRequiredCount}
              </p>
              <p className="text-gray-500 text-xs">Manager review</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-gray-900">{summary.unresolvedFlags}</p>
              <p className="text-gray-500 text-xs">Unresolved flags</p>
            </div>
          </div>
        </div>
      </div>

      {/* Children with flags summary */}
      {summary.childrenWithFlags.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Children with unresolved flags</h2>
          <div className="flex flex-wrap gap-3">
            {summary.childrenWithFlags.map(({ childId, childName, flagCount, highSeverityCount: hc }) => (
              <div key={childId} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50">
                <span className="text-sm font-medium text-gray-900">{childName}</span>
                <span className="text-xs text-gray-500">{flagCount} flag{flagCount !== 1 ? "s" : ""}</span>
                {hc > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                    {hc} high
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flag type breakdown */}
      {summary.flagTypeBreakdown.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Flag types</h2>
          <div className="flex flex-wrap gap-2">
            {summary.flagTypeBreakdown.map(({ type, count }) => (
              <div key={type} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 border border-gray-200">
                <span className="text-xs text-gray-700">{type}</span>
                <span className="text-xs font-bold text-gray-900">×{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Threshold consultations */}
      {thresholdConsultations.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Threshold consultations — awaiting manager decision ({thresholdConsultations.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {thresholdConsultations.map((c) => (
              <ThresholdCard key={c.id} consult={c} />
            ))}
          </div>
        </section>
      )}

      {/* Priority flags */}
      {priorityFlags.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Priority flags — high severity or manager review required ({priorityFlags.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {priorityFlags.map((flag) => (
              <FlagCard key={flag.id} flag={flag} />
            ))}
          </div>
        </section>
      )}

      {/* Staff wellbeing signals */}
      {staffWellbeingSignals.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Staff wellbeing signals ({staffWellbeingSignals.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {staffWellbeingSignals.map((s) => (
              <WellbeingSignalCard key={s.id} signal={s} />
            ))}
          </div>
        </section>
      )}

      {/* Other flags */}
      {otherFlags.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Other unresolved flags ({otherFlags.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {otherFlags.map((flag) => (
              <FlagCard key={flag.id} flag={flag} />
            ))}
          </div>
        </section>
      )}

      {allFlags.length === 0 && thresholdConsultations.length === 0 && staffWellbeingSignals.length === 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-6 text-center">
          <p className="text-green-700 font-medium">No unresolved practice flags</p>
          <p className="text-sm text-green-600 mt-1">Cara has not flagged any unresolved practice quality issues.</p>
        </div>
      )}

      {/* Regulatory callout */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 text-xs text-gray-600 space-y-1">
        <p className="font-semibold text-gray-700">Regulatory basis</p>
        <p>
          <strong>CHR 2015 Reg 28:</strong> The registered person must ensure all incidents,
          allegations, and safeguarding concerns are appropriately responded to and recorded.
        </p>
        <p>
          <strong>SCCIF — Practice quality:</strong> Cara flags vague recording, activity-over-impact,
          and developmental gaps as quality indicators. These are advisory — the manager determines
          the response and any escalation.
        </p>
        <p>
          <strong>NRM / extra-familial harm:</strong> Cara advises on potential NRM referral and
          contextual safeguarding indicators. The manager / DSL makes all statutory decisions.
          Cara does not make referrals.
        </p>
      </div>
    </div>
  );
}
