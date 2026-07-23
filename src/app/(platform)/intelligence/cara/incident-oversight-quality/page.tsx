"use client";

import { formatRate } from "@/lib/metrics/rate";
import {
  useIncidentOversightQualityIntelligence,
  type IncidentOversightProfile,
  type HomeOversightSignal,
  type IncidentOversightSignal,
} from "@/hooks/use-incident-oversight-quality-intelligence";

const SIGNAL_CONFIG: Record<
  IncidentOversightSignal,
  { label: string; bg: string; text: string; dot: string }
> = {
  urgent: {
    label: "Urgent",
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  overdue: {
    label: "Overdue",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  pending: {
    label: "Pending",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  compliant: {
    label: "Compliant",
    bg: "bg-green-50 border-green-200",
    text: "text-green-700",
    dot: "bg-green-500",
  },
};

const HOME_SIGNAL_CONFIG: Record<
  HomeOversightSignal,
  { label: string; bg: string; border: string; text: string }
> = {
  urgent: {
    label: "Urgent action required",
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-800",
  },
  attention: {
    label: "Attention needed",
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-800",
  },
  monitoring: {
    label: "Monitoring",
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-800",
  },
  good: {
    label: "All oversight complete",
    bg: "bg-green-50",
    border: "border-green-300",
    text: "text-green-800",
  },
};

function typeLabel(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function SeverityBadge({ severity }: { severity: string }) {
  const colours: Record<string, string> = {
    critical: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colours[severity] ?? "bg-gray-100 text-gray-700"}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

function IncidentCard({ inc }: { inc: IncidentOversightProfile }) {
  const cfg = SIGNAL_CONFIG[inc.signal];
  return (
    <div className={`rounded-lg border p-4 ${cfg.bg} space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-gray-500 font-mono">{inc.reference}</p>
          <p className="font-semibold text-gray-900 text-sm">{typeLabel(inc.type)}</p>
          <p className="text-xs text-gray-600">{inc.childName} · {inc.date}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.text} border ${cfg.bg}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`} />
            {cfg.label}
          </span>
          <SeverityBadge severity={inc.severity} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div>
          <span className="text-gray-500">Status:</span>{" "}
          <span className="font-medium capitalize">{inc.status.replace("_", " ")}</span>
        </div>
        <div>
          <span className="text-gray-500">Open for:</span>{" "}
          <span className="font-medium">{inc.daysOpen}d</span>
        </div>
      </div>

      <div className="space-y-1 text-xs">
        {inc.oversightGap && (
          <div className="flex items-start gap-1.5">
            <span className="text-red-500 mt-0.5">●</span>
            <span className="text-red-700 font-medium">Oversight note not completed</span>
          </div>
        )}
        {!inc.oversightGap && inc.oversightHours !== null && (
          <div className="flex items-start gap-1.5">
            <span className="text-green-500 mt-0.5">●</span>
            <span className="text-green-700">
              Oversight completed in {inc.oversightHours}h
            </span>
          </div>
        )}
        {inc.bodyMapGap && (
          <div className="flex items-start gap-1.5">
            <span className="text-amber-500 mt-0.5">●</span>
            <span className="text-amber-700 font-medium">Body map required but not completed</span>
          </div>
        )}
        {inc.unacknowledgedNotifications.length > 0 && (
          <div className="flex items-start gap-1.5">
            <span className="text-amber-500 mt-0.5">●</span>
            <span className="text-amber-700">
              Unacknowledged notification: {inc.unacknowledgedNotifications.join(", ")}
            </span>
          </div>
        )}
        {inc.lessonsLearnedMissed && (
          <div className="flex items-start gap-1.5">
            <span className="text-gray-400 mt-0.5">●</span>
            <span className="text-gray-600">Incident closed — no lessons learned recorded</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IncidentOversightQualityPage() {
  const { data, isLoading, error } = useIncidentOversightQualityIntelligence();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-8 w-64 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="p-6 text-red-600">Failed to load incident oversight intelligence.</div>
    );
  }

  const { incidents, summary } = data.data;
  const homeCfg = HOME_SIGNAL_CONFIG[summary.signal];

  const urgentIncidents = incidents.filter((i) => i.signal === "urgent");
  const nonUrgent = incidents.filter((i) => i.signal !== "urgent");

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Incident Oversight Quality</h1>
        <p className="text-sm text-gray-500 mt-1">
          Oversight completeness, notification acknowledgement, and lessons-learned tracking
          across all recorded incidents.
        </p>
      </div>

      {/* Home signal */}
      <div className={`rounded-lg border px-5 py-4 ${homeCfg.bg} ${homeCfg.border}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className={`font-semibold ${homeCfg.text}`}>{homeCfg.label}</p>
            <p className="text-sm text-gray-600 mt-0.5">
              {summary.oversightGapsCount} of {summary.totalIncidents} incidents missing oversight
              {summary.criticalWithoutOversight > 0 && (
                <span className="text-red-700 font-medium">
                  {" "}— {summary.criticalWithoutOversight} critical
                </span>
              )}
              {summary.physicalInterventionsWithoutOversight > 0 && (
                <span className="text-red-700 font-medium">
                  , {summary.physicalInterventionsWithoutOversight} physical intervention{summary.physicalInterventionsWithoutOversight !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <p className="font-bold text-gray-900 text-xl">{summary.openIncidents}</p>
              <p className="text-gray-500 text-xs">Open incidents</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-xl">
                {summary.avgHoursToOversight !== null ? `${summary.avgHoursToOversight}h` : "—"}
              </p>
              <p className="text-gray-500 text-xs">Avg. time to oversight</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-xl">
                {formatRate(summary.lessonsLearnedRate)}
              </p>
              <p className="text-gray-500 text-xs">Lessons learned</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-xl">
                {formatRate(summary.notificationAcknowledgementRate)}
              </p>
              <p className="text-gray-500 text-xs">Notifications ack.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent group */}
      {urgentIncidents.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wide">
            Urgent — Immediate oversight required
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {urgentIncidents.map((inc) => (
              <IncidentCard key={inc.incidentId} inc={inc} />
            ))}
          </div>
        </section>
      )}

      {/* Non-urgent group */}
      {nonUrgent.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            All other incidents
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {nonUrgent.map((inc) => (
              <IncidentCard key={inc.incidentId} inc={inc} />
            ))}
          </div>
        </section>
      )}

      {/* Reg callout */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 text-xs text-gray-600 space-y-1">
        <p className="font-semibold text-gray-700">Regulatory basis</p>
        <p>
          <strong>CHR 2015 Reg 36:</strong> The registered person must maintain a record of every
          incident and review it. Oversight must be completed by the RM or nominated deputy.
        </p>
        <p>
          <strong>CHR 2015 Reg 40 / Reg 28:</strong> Physical interventions require immediate
          notification to the placing authority and Ofsted where applicable; the RM must review
          all PI records within a defined timeframe.
        </p>
        <p>
          <strong>Reg 40 — manager discretion:</strong> The manager should consider whether
          statutory notification is required for each incident; Cara surfaces the gap but the
          decision is yours.
        </p>
      </div>
    </div>
  );
}
