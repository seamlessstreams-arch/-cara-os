"use client";

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD WIDGET — Health Appointments Intelligence
//
// Shows at a glance:
//   - Overall score + rating
//   - Statutory checks status (IHA, RHA, Dental, Optical, SDQ, Immunisations)
//   - Overdue items with severity
//   - DNA rate
//   - Upcoming appointments
//   - Top concerns
//   - Regulatory status badges
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Stethoscope, AlertTriangle, CheckCircle2, XCircle,
  Clock, Calendar, TrendingDown, TrendingUp, Minus,
} from "lucide-react";

interface StatutoryCheck {
  type: string;
  description: string;
  status: "met" | "overdue" | "not_applicable" | "due_soon";
  lastDate?: string;
  nextDue?: string;
  daysOverdue?: number;
}

interface HealthData {
  childName: string;
  overallScore: number;
  overallRating: string;
  statutoryComplianceScore: number;
  attendanceScore: number;
  timelinessScore: number;
  coverageScore: number;
  statutoryChecks: StatutoryCheck[];
  overdueAppointments: Array<{ type: string; description: string; daysOverdue: number; severity: string }>;
  upcomingAppointments: Array<{ type: string; date: string; provider?: string; daysUntil: number }>;
  dnaPattern: { totalAppointments: number; dnaCount: number; dnaRate: number; trend: string };
  concerns: Array<{ severity: string; category: string; description: string }>;
  regulatoryFlags: Array<{ regulation: string; area: string; status: string; detail: string }>;
  summary: string;
}

interface HealthAppointmentsIntelligenceCardProps {
  childId: string;
}

const RATING_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  excellent: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  good: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  adequate: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  requires_improvement: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  inadequate: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const CHECK_STATUS_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  met: { icon: CheckCircle2, color: "text-emerald-500" },
  overdue: { icon: XCircle, color: "text-red-500" },
  due_soon: { icon: Clock, color: "text-amber-500" },
  not_applicable: { icon: Minus, color: "text-gray-400" },
};

export function HealthAppointmentsIntelligenceCard({ childId }: HealthAppointmentsIntelligenceCardProps) {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/cara/health-appointments?childId=${childId}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Failed to fetch health appointments intelligence:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [childId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--cs-border)] bg-white p-5 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-48 mb-4" />
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-[var(--cs-border)] bg-white p-5">
        <p className="text-sm text-[var(--cs-text-muted)]">Unable to load health appointments intelligence.</p>
      </div>
    );
  }

  const ratingStyle = RATING_STYLES[data.overallRating] ?? RATING_STYLES.adequate;

  return (
    <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--cs-border)] px-5 py-3 bg-[var(--cs-surface)]">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-teal-600" />
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Health Appointments</h3>
        </div>
        <Badge className={cn("text-[10px]", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
          {data.overallRating.replace(/_/g, " ")} ({data.overallScore}%)
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {/* Statutory checks grid */}
        <div className="grid grid-cols-3 gap-2">
          {data.statutoryChecks.slice(0, 6).map((check) => {
            const statusInfo = CHECK_STATUS_ICON[check.status] ?? CHECK_STATUS_ICON.met;
            const Icon = statusInfo.icon;
            return (
              <div key={check.type} className="flex items-center gap-1.5 py-1">
                <Icon className={cn("h-3.5 w-3.5", statusInfo.color)} />
                <span className="text-[10px] text-[var(--cs-navy)] font-medium">{check.type}</span>
              </div>
            );
          })}
        </div>

        {/* DNA rate + sub-scores */}
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-4 gap-2 flex-1">
            <MiniScore label="Statutory" score={data.statutoryComplianceScore} />
            <MiniScore label="Attend." score={data.attendanceScore} />
            <MiniScore label="Timely" score={data.timelinessScore} />
            <MiniScore label="Coverage" score={data.coverageScore} />
          </div>
        </div>

        {/* Overdue items */}
        {data.overdueAppointments.length > 0 && (
          <div className="space-y-1.5">
            {data.overdueAppointments.slice(0, 2).map((item, i) => {
              const isHigh = item.severity === "critical" || item.severity === "significant";
              return (
                <div key={i} className={cn(
                  "flex items-start gap-2 rounded-lg p-2 text-xs",
                  isHigh ? "bg-red-50" : "bg-amber-50",
                )}>
                  <AlertTriangle className={cn(
                    "h-3.5 w-3.5 shrink-0 mt-0.5",
                    isHigh ? "text-red-600" : "text-amber-600",
                  )} />
                  <div className="flex-1">
                    <span className={isHigh ? "text-red-700" : "text-amber-700"}>
                      {item.description}
                    </span>
                    {item.daysOverdue > 0 && (
                      <span className="text-[10px] ml-1 opacity-70">({item.daysOverdue}d overdue)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upcoming appointments */}
        {data.upcomingAppointments.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">
              Upcoming
            </h4>
            {data.upcomingAppointments.slice(0, 2).map((appt, i) => (
              <div key={i} className="flex items-center justify-between py-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-[var(--cs-navy)] capitalize">{appt.type.replace(/_/g, " ")}</span>
                </div>
                <span className="text-[10px] text-[var(--cs-text-muted)]">
                  in {appt.daysUntil}d{appt.provider ? ` · ${appt.provider}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Regulatory flags */}
        {data.regulatoryFlags.some(f => f.status !== "met") && (
          <div className="flex flex-wrap gap-1.5">
            {data.regulatoryFlags.filter(f => f.status !== "met").slice(0, 3).map((flag, i) => (
              <Badge
                key={i}
                className={cn(
                  "text-[9px]",
                  flag.status === "not_met" ? "bg-red-100 text-red-700 border-red-200" :
                  "bg-amber-100 text-amber-700 border-amber-200",
                )}
                title={flag.detail}
              >
                {flag.area}
              </Badge>
            ))}
          </div>
        )}

        {/* All clear */}
        {data.concerns.length === 0 && data.overdueAppointments.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-emerald-700">All health appointments on track. Statutory requirements met.</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-component ───────────────────────────────────────────────────────────

function MiniScore({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  return (
    <div className="text-center">
      <span className={cn("text-sm font-bold", color)}>{score}</span>
      <p className="text-[9px] text-[var(--cs-text-muted)] mt-0.5">{label}</p>
    </div>
  );
}
