"use client";

// ═════════════��══════════════════════════���═════════════════════════════════════
// DASHBOARD WIDGET — Contact & Relationships Intelligence
//
// Shows at a glance:
//   - Overall score + rating
//   - Sessions occurred/planned + missed rate
//   - Positive/distressing rates
//   - Sub-scores (frequency, quality, consistency, voice)
//   - Per-person contact summaries
//   - Concerns + regulatory status
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Users, AlertTriangle, CheckCircle2, Heart,
  PhoneOff, Calendar,
} from "lucide-react";

interface ContactData {
  childName: string;
  overallScore: number;
  overallRating: string;
  frequencyScore: number;
  qualityScore: number;
  consistencyScore: number;
  voiceScore: number;
  totalSessions: number;
  occurredSessions: number;
  missedSessions: number;
  missedRate: number;
  positiveRate: number;
  distressingRate: number;
  contactByPerson: Array<{
    person: string;
    personName: string;
    sessionsPlanned: number;
    sessionsOccurred: number;
    complianceRate: number;
    avgOutcome: number;
    childWantsContact: boolean;
  }>;
  cancellationPatterns: Array<{ pattern: string; count: number; description: string }>;
  concerns: Array<{ severity: string; category: string; description: string }>;
  strengths: Array<{ category: string; description: string }>;
  regulatoryFlags: Array<{ regulation: string; area: string; status: string; detail: string }>;
  recommendations: string[];
  summary: string;
}

interface ContactIntelligenceCardProps {
  childId: string;
}

const RATING_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  excellent: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  good: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  adequate: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  requires_improvement: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  inadequate: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

export function ContactIntelligenceCard({ childId }: ContactIntelligenceCardProps) {
  const [data, setData] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/aria/contact?childId=${childId}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Failed to fetch contact intelligence:", err);
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
        <p className="text-sm text-[var(--cs-text-muted)]">Unable to load contact intelligence.</p>
      </div>
    );
  }

  const ratingStyle = RATING_STYLES[data.overallRating] ?? RATING_STYLES.adequate;

  return (
    <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--cs-border)] px-5 py-3 bg-[var(--cs-surface)]">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-pink-500" />
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Contact</h3>
        </div>
        <Badge className={cn("text-[10px]", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
          {data.overallRating.replace(/_/g, " ")} ({data.overallScore}%)
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-lg bg-gray-50 p-2">
            <span className="text-xs font-bold text-[var(--cs-navy)]">
              {data.occurredSessions}/{data.totalSessions}
            </span>
            <p className="text-[9px] text-[var(--cs-text-muted)]">Occurred</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-2">
            <span className={cn("text-xs font-bold", data.missedRate > 0.3 ? "text-red-600" : data.missedRate > 0.1 ? "text-amber-600" : "text-emerald-600")}>
              {Math.round(data.missedRate * 100)}%
            </span>
            <p className="text-[9px] text-[var(--cs-text-muted)]">Missed</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-2">
            <span className={cn("text-xs font-bold", data.positiveRate >= 0.8 ? "text-emerald-600" : data.positiveRate >= 0.5 ? "text-amber-600" : "text-red-600")}>
              {Math.round(data.positiveRate * 100)}%
            </span>
            <p className="text-[9px] text-[var(--cs-text-muted)]">Positive</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-2">
            <span className="text-xs font-bold text-[var(--cs-navy)]">{data.contactByPerson.length}</span>
            <p className="text-[9px] text-[var(--cs-text-muted)]">People</p>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="grid grid-cols-4 gap-2">
          <MiniScore label="Frequency" score={data.frequencyScore} />
          <MiniScore label="Quality" score={data.qualityScore} />
          <MiniScore label="Consistent" score={data.consistencyScore} />
          <MiniScore label="Voice" score={data.voiceScore} />
        </div>

        {/* Per-person summaries */}
        {data.contactByPerson.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.contactByPerson.slice(0, 4).map((p, i) => {
              const compColor = p.complianceRate >= 0.8 ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                p.complianceRate >= 0.5 ? "bg-amber-100 text-amber-700 border-amber-200" :
                "bg-red-100 text-red-700 border-red-200";
              return (
                <Badge key={i} className={cn("text-[9px]", compColor)}>
                  {p.personName} ({p.sessionsOccurred}/{p.sessionsPlanned})
                </Badge>
              );
            })}
          </div>
        )}

        {/* Cancellation patterns */}
        {data.cancellationPatterns.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-xs">
            <PhoneOff className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
            <span className="text-amber-700">
              {data.cancellationPatterns[0].description}
            </span>
          </div>
        )}

        {/* Top concerns */}
        {data.concerns.length > 0 && (
          <div className="space-y-1.5">
            {data.concerns.slice(0, 2).map((concern, i) => {
              const isHigh = concern.severity === "critical" || concern.severity === "significant";
              return (
                <div key={i} className={cn(
                  "flex items-start gap-2 rounded-lg p-2 text-xs",
                  isHigh ? "bg-red-50" : "bg-amber-50",
                )}>
                  <AlertTriangle className={cn(
                    "h-3.5 w-3.5 shrink-0 mt-0.5",
                    isHigh ? "text-red-600" : "text-amber-600",
                  )} />
                  <span className={isHigh ? "text-red-700" : "text-amber-700"}>
                    {concern.description}
                  </span>
                </div>
              );
            })}
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
        {data.concerns.length === 0 && data.totalSessions > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-emerald-700">
              Contact arrangements working well. Relationships being maintained.
            </span>
          </div>
        )}

        {/* No data state */}
        {data.totalSessions === 0 && data.concerns.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2.5">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-600">
              No contact sessions recorded in assessment period.
            </span>
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
