"use client";

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD WIDGET — Family Contact Intelligence
//
// Displays family contact assessment at a glance:
//   - Overall score with rating badge
//   - Compliance, quality, and emotional impact sub-scores
//   - Per-member breakdown (occurred vs planned)
//   - Top patterns and concerns
//   - Regulatory flags
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Heart, AlertTriangle, CheckCircle2, TrendingDown,
  TrendingUp, Minus, Users, Phone, Video, Mail,
  Shield, XCircle, Clock,
} from "lucide-react";

interface MemberAnalysis {
  familyMember: string;
  relation: string;
  plannedCount: number;
  occurredCount: number;
  cancelledCount: number;
  cancelledByFamily: number;
  cancelledByChild: number;
  compliancePercent: number;
  averageQuality: number;
  averageMoodChange: number;
  trend: "improving" | "stable" | "declining" | "insufficient_data";
  contactTypes: string[];
}

interface ContactConcern {
  severity: "critical" | "significant" | "moderate" | "low";
  category: string;
  description: string;
}

interface RegulatoryFlag {
  regulation: string;
  description: string;
  status: "met" | "partially_met" | "not_met";
}

interface ContactPattern {
  type: string;
  description: string;
  significance: "high" | "medium" | "low";
}

interface FamilyContactData {
  childName: string;
  overallScore: number;
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate";
  complianceScore: number;
  qualityScore: number;
  emotionalImpactScore: number;
  memberAnalysis: MemberAnalysis[];
  patterns: ContactPattern[];
  concerns: ContactConcern[];
  regulatoryFlags: RegulatoryFlag[];
  summary: string;
}

interface FamilyContactIntelligenceCardProps {
  childId: string;
}

const RATING_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  excellent: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  good: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  adequate: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  requires_improvement: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  inadequate: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const TREND_ICONS = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
  insufficient_data: Clock,
};

const CONTACT_TYPE_ICONS: Record<string, React.ElementType> = {
  face_to_face: Users,
  phone: Phone,
  video: Video,
  letter: Mail,
  supervised: Shield,
  unsupervised: Users,
};

export function FamilyContactIntelligenceCard({ childId }: FamilyContactIntelligenceCardProps) {
  const [data, setData] = useState<FamilyContactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_data() {
      try {
        const res = await fetch(`/api/aria/family-contact?childId=${childId}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Failed to fetch family contact intelligence:", err);
      } finally {
        setLoading(false);
      }
    }
    fetch_data();
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
        <p className="text-sm text-[var(--cs-text-muted)]">Unable to load family contact intelligence.</p>
      </div>
    );
  }

  const ratingStyle = RATING_STYLES[data.overallRating] ?? RATING_STYLES.adequate;

  return (
    <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--cs-border)] px-5 py-3 bg-[var(--cs-surface)]">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-pink-500" />
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Family Contact</h3>
        </div>
        <Badge className={cn("text-[10px]", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
          {data.overallRating.replace(/_/g, " ")} ({data.overallScore}%)
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {/* Sub-scores */}
        <div className="grid grid-cols-3 gap-3">
          <ScoreBar label="Compliance" score={data.complianceScore} />
          <ScoreBar label="Quality" score={data.qualityScore} />
          <ScoreBar label="Emotional" score={data.emotionalImpactScore} />
        </div>

        {/* Member breakdown */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">
            Family Members
          </h4>
          {data.memberAnalysis.map((member) => {
            const TrendIcon = TREND_ICONS[member.trend];
            const trendColor = member.trend === "improving" ? "text-emerald-500" :
                              member.trend === "declining" ? "text-red-500" : "text-gray-400";
            return (
              <div key={member.familyMember} className="flex items-center justify-between py-1.5 border-b border-[var(--cs-border)] last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--cs-navy)]">{member.familyMember}</span>
                  <span className="text-[10px] text-[var(--cs-text-muted)]">({member.relation})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[var(--cs-text-secondary)]">
                    {member.occurredCount}/{member.plannedCount || member.occurredCount}
                  </span>
                  {member.cancelledCount > 0 && (
                    <span className="text-[10px] text-red-600">
                      <XCircle className="h-3 w-3 inline mr-0.5" />
                      {member.cancelledCount}
                    </span>
                  )}
                  <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Top concerns */}
        {data.concerns.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">
              Concerns
            </h4>
            {data.concerns.slice(0, 3).map((concern, i) => {
              const isHighSeverity = concern.severity === "critical" || concern.severity === "significant";
              return (
                <div key={i} className={cn(
                  "flex items-start gap-2 rounded-lg p-2 text-xs",
                  isHighSeverity ? "bg-red-50" : "bg-amber-50",
                )}>
                  <AlertTriangle className={cn(
                    "h-3.5 w-3.5 shrink-0 mt-0.5",
                    isHighSeverity ? "text-red-600" : "text-amber-600",
                  )} />
                  <span className={isHighSeverity ? "text-red-700" : "text-amber-700"}>
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
            {data.regulatoryFlags.filter(f => f.status !== "met").map((flag, i) => (
              <Badge
                key={i}
                className={cn(
                  "text-[9px]",
                  flag.status === "not_met" ? "bg-red-100 text-red-700 border-red-200" :
                  "bg-amber-100 text-amber-700 border-amber-200",
                )}
                title={flag.description}
              >
                {flag.regulation}: {flag.status.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        )}

        {/* All clear */}
        {data.concerns.length === 0 && data.regulatoryFlags.every(f => f.status === "met") && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-emerald-700">Family contact arrangements working well. All regulatory requirements met.</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-component: Score Bar ────────────────────────────────────────────────

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-[var(--cs-text-muted)]">{label}</span>
        <span className="text-[10px] font-medium text-[var(--cs-navy)]">{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
