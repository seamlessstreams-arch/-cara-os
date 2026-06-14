"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraReg45Evidence
//
// Regulation 45 requires Registered Managers to produce a monthly report
// covering safeguarding, complaints, significant events, medication errors,
// staffing, education, and quality of care. This widget shows Cara's
// automatic evidence collection progress for the current month.
//
// Usage:
//   <CaraReg45Evidence homeId="demo-home" />
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Shield,
  Users,
  GraduationCap,
  Heart,
  Pill,
  MessageSquare,
  Activity,
  ChevronRight,
  Sparkles,
  Loader2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type EvidenceStatus = "complete" | "partial" | "missing" | "not_applicable";

interface EvidenceCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  regulation: string;
  description: string;
  status: EvidenceStatus;
  itemCount: number;
  requiredCount: number;
  gaps: string[];
  lastUpdated: string | null;
}

interface Reg45Summary {
  monthLabel: string;
  dueDate: string;
  daysUntilDue: number;
  totalCategories: number;
  completeCategories: number;
  overallProgress: number;
  categories: EvidenceCategory[];
}

// ── Config ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<EvidenceStatus, { label: string; colour: string; bg: string; dot: string }> = {
  complete:       { label: "Complete",       colour: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  partial:        { label: "Partial",        colour: "text-amber-700",   bg: "bg-amber-50",   dot: "bg-amber-500" },
  missing:        { label: "Missing",        colour: "text-red-700",     bg: "bg-red-50",     dot: "bg-red-500" },
  not_applicable: { label: "N/A",            colour: "text-slate-500",   bg: "bg-slate-50",   dot: "bg-slate-400" },
};

// ── Demo data ──────────────────────────────────────────────────────────────

function getDemoReg45(): Reg45Summary {
  const now = new Date();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysLeft = Math.max(0, Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    monthLabel: now.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    dueDate: monthEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    daysUntilDue: daysLeft,
    totalCategories: 9,
    completeCategories: 5,
    overallProgress: 72,
    categories: [
      {
        id: "safeguarding",
        label: "Safeguarding",
        icon: Shield,
        regulation: "Reg 45(2)(a)",
        description: "Any safeguarding incidents, referrals, or concerns during the period.",
        status: "complete",
        itemCount: 4,
        requiredCount: 1,
        gaps: [],
        lastUpdated: "2026-05-10T14:00:00Z",
      },
      {
        id: "complaints",
        label: "Complaints & Representations",
        icon: MessageSquare,
        regulation: "Reg 45(2)(b)",
        description: "Any complaints received and how they were resolved.",
        status: "complete",
        itemCount: 1,
        requiredCount: 1,
        gaps: [],
        lastUpdated: "2026-05-08T10:00:00Z",
      },
      {
        id: "significant_events",
        label: "Significant Events",
        icon: AlertTriangle,
        regulation: "Reg 45(2)(c)",
        description: "Significant events including incidents, absences, restraints.",
        status: "complete",
        itemCount: 7,
        requiredCount: 1,
        gaps: [],
        lastUpdated: "2026-05-11T16:00:00Z",
      },
      {
        id: "medication",
        label: "Medication Errors",
        icon: Pill,
        regulation: "Reg 45(2)(d)",
        description: "Any medication errors, near-misses, or administration issues.",
        status: "complete",
        itemCount: 0,
        requiredCount: 0,
        gaps: [],
        lastUpdated: null,
      },
      {
        id: "staffing",
        label: "Staffing & Training",
        icon: Users,
        regulation: "Reg 45(2)(e)",
        description: "Staffing levels, vacancies, training compliance, and development.",
        status: "partial",
        itemCount: 3,
        requiredCount: 5,
        gaps: ["Training compliance summary not yet generated", "Vacancy status not recorded"],
        lastUpdated: "2026-05-09T12:00:00Z",
      },
      {
        id: "education",
        label: "Education & Activities",
        icon: GraduationCap,
        regulation: "Reg 45(2)(f)",
        description: "Education attendance, achievement, and enrichment activities.",
        status: "complete",
        itemCount: 12,
        requiredCount: 3,
        gaps: [],
        lastUpdated: "2026-05-11T09:00:00Z",
      },
      {
        id: "health",
        label: "Health & Wellbeing",
        icon: Heart,
        regulation: "Reg 45(2)(g)",
        description: "Health appointments, wellbeing indicators, and therapeutic progress.",
        status: "partial",
        itemCount: 2,
        requiredCount: 3,
        gaps: ["Missing wellbeing check for Jordan M"],
        lastUpdated: "2026-05-07T15:00:00Z",
      },
      {
        id: "quality",
        label: "Quality of Care",
        icon: Activity,
        regulation: "Reg 45(2)(h)",
        description: "Overall quality indicators, child voice, outcomes progress.",
        status: "partial",
        itemCount: 5,
        requiredCount: 8,
        gaps: ["Child voice not captured for 1 young person this month", "Missing key work session for Jordan M", "Outcomes tracker not updated"],
        lastUpdated: "2026-05-10T11:00:00Z",
      },
      {
        id: "development",
        label: "Home Development",
        icon: FileText,
        regulation: "Reg 45(2)(i)",
        description: "Plans for development, improvement actions, and maintenance.",
        status: "missing",
        itemCount: 0,
        requiredCount: 1,
        gaps: ["Monthly development plan not yet drafted"],
        lastUpdated: null,
      },
    ],
  };
}

// ── Component ──────────────────────────────────────────────────────────────

interface CaraReg45EvidenceProps {
  homeId?: string;
  className?: string;
}

export function CaraReg45Evidence({
  homeId,
  className,
}: CaraReg45EvidenceProps) {
  const [data, setData] = useState<Reg45Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(getDemoReg45());
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [homeId]);

  if (loading || !data) {
    return (
      <div className={cn("rounded-2xl border border-[var(--cs-border)] bg-white p-5 animate-pulse h-80", className)} />
    );
  }

  const urgencyColour =
    data.daysUntilDue <= 5 ? "text-red-700 bg-red-50" :
    data.daysUntilDue <= 14 ? "text-amber-700 bg-amber-50" :
    "text-[var(--cs-text-secondary)] bg-slate-50";

  return (
    <div className={cn("rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden", className)}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-violet-600" />
          <h3 className="text-sm font-bold text-[var(--cs-navy)]">
            Reg 45 Evidence — {data.monthLabel}
          </h3>
        </div>
        <Link
          href="/cara/reg45"
          className="text-[10px] font-medium text-[var(--cs-cara-gold)] hover:text-[var(--cs-navy)] transition-colors flex items-center gap-0.5"
        >
          Full report <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Progress bar & due date */}
      <div className="px-5 pb-3 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[var(--cs-text-muted)]">
              {data.completeCategories}/{data.totalCategories} categories complete
            </span>
            <span className="text-[10px] font-semibold text-[var(--cs-text-secondary)]">
              {data.overallProgress}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                data.overallProgress >= 80 ? "bg-emerald-500" :
                data.overallProgress >= 50 ? "bg-amber-500" : "bg-red-500",
              )}
              style={{ width: `${data.overallProgress}%` }}
            />
          </div>
        </div>
        <div className={cn("rounded-lg px-2.5 py-1 text-center shrink-0", urgencyColour)}>
          <div className="text-sm font-bold tabular-nums">{data.daysUntilDue}</div>
          <div className="text-[8px] font-medium">days left</div>
        </div>
      </div>

      {/* Categories */}
      <div className="divide-y divide-[var(--cs-border-subtle)]">
        {data.categories.map((cat) => {
          const Icon = cat.icon;
          const statusCfg = STATUS_CONFIG[cat.status];

          return (
            <div key={cat.id} className="px-5 py-2.5 flex items-center gap-3">
              <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", statusCfg.bg)}>
                <Icon className={cn("h-3.5 w-3.5", statusCfg.colour)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-[var(--cs-navy)]">{cat.label}</span>
                  <span className="text-[8px] text-[var(--cs-text-muted)]">{cat.regulation}</span>
                </div>
                {cat.gaps.length > 0 && (
                  <p className="text-[9px] text-amber-700 mt-0.5 line-clamp-1">
                    {cat.gaps[0]}
                    {cat.gaps.length > 1 && ` (+${cat.gaps.length - 1} more)`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[9px] text-[var(--cs-text-muted)] tabular-nums">
                  {cat.itemCount}/{cat.requiredCount}
                </span>
                <span className={cn("h-2 w-2 rounded-full", statusCfg.dot)} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Cara note */}
      <div className="px-5 py-2 bg-[var(--cs-cara-gold-bg)] text-[9px] text-[var(--cs-text-muted)] flex items-center gap-1">
        <Sparkles className="h-2.5 w-2.5 text-[var(--cs-cara-gold)]" />
        Cara automatically collects evidence from daily operations. Gaps flagged above need manual review.
      </div>
    </div>
  );
}

// Expose for testing
export const _testing = { STATUS_CONFIG, getDemoReg45 };
