"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraWeeklyDigest
//
// Compact weekly overview card for the staff dashboard. Shows key stats,
// outstanding items, and top Cara recommendations for the coming week.
// Refreshes every Monday or on demand.
//
// Usage:
//   <CaraWeeklyDigest homeId="demo-home" userId="staff_darren" />
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Shield,
  TrendingUp,
  ChevronRight,
  Users,
  FileText,
  Loader2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface DigestItem {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionUrl?: string;
}

interface WeeklyDigest {
  weekLabel: string;
  stats: {
    incidentsThisWeek: number;
    pendingOversight: number;
    supervisionsDue: number;
    caraOutputsGenerated: number;
    caraOutputsApproved: number;
  };
  topActions: DigestItem[];
  achievements: string[];
}

// ── Demo data ──────────────────────────────────────────────────────────────

function getDemoDigest(): WeeklyDigest {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    weekLabel: `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — ${weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
    stats: {
      incidentsThisWeek: 2,
      pendingOversight: 3,
      supervisionsDue: 2,
      caraOutputsGenerated: 14,
      caraOutputsApproved: 11,
    },
    topActions: [
      {
        id: "da_001",
        icon: Shield,
        label: "3 incidents awaiting management oversight",
        description: "Review and add oversight notes to maintain Regulation 40 compliance.",
        priority: "high",
        actionUrl: "/cara/review",
      },
      {
        id: "da_002",
        icon: Users,
        label: "2 supervisions due this week",
        description: "Sarah Johnson (overdue by 3 days) and Mark Thompson (due Friday).",
        priority: "high",
        actionUrl: "/supervision",
      },
      {
        id: "da_003",
        icon: FileText,
        label: "Reg 45 report due in 18 days",
        description: "Cara has collected 34 evidence items. 3 gaps identified for review.",
        priority: "medium",
        actionUrl: "/cara/reg45",
      },
      {
        id: "da_004",
        icon: AlertTriangle,
        label: "Risk assessment review recommended",
        description: "Alex W's risk assessment may need updating following the recent incident pattern.",
        priority: "medium",
        actionUrl: "/cara/review",
      },
    ],
    achievements: [
      "11 of 14 Cara outputs approved — 79% acceptance rate",
      "All daily logs completed on time this week",
      "Positive trend noted for Casey T — 3 weeks incident-free",
    ],
  };
}

// ── Config ─────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  high:   { dot: "bg-red-500",    colour: "text-red-700" },
  medium: { dot: "bg-amber-500",  colour: "text-amber-700" },
  low:    { dot: "bg-slate-400",  colour: "text-[var(--cs-text-secondary)]" },
};

// ── Component ──────────────────────────────────────────────────────────────

interface CaraWeeklyDigestProps {
  homeId?: string;
  userId?: string;
  className?: string;
}

export function CaraWeeklyDigest({
  homeId,
  userId,
  className,
}: CaraWeeklyDigestProps) {
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDigest(getDemoDigest());
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [homeId, userId]);

  if (loading || !digest) {
    return (
      <div className={cn("rounded-2xl border border-[var(--cs-border)] bg-white p-5 animate-pulse h-48", className)} />
    );
  }

  return (
    <div className={cn("rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-[var(--cs-cara-gold-bg)] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
          <h3 className="text-xs font-bold text-[var(--cs-navy)]">
            Weekly Digest
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--cs-text-muted)]">
          <Calendar className="h-3 w-3" />
          {digest.weekLabel}
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-5 py-3 grid grid-cols-5 gap-2 border-b border-[var(--cs-border-subtle)]">
        <MiniStat label="Incidents" value={digest.stats.incidentsThisWeek} colour={digest.stats.incidentsThisWeek > 0 ? "text-red-700" : "text-[var(--cs-text-secondary)]"} />
        <MiniStat label="Pending" value={digest.stats.pendingOversight} colour={digest.stats.pendingOversight > 0 ? "text-amber-700" : "text-[var(--cs-text-secondary)]"} />
        <MiniStat label="Sups due" value={digest.stats.supervisionsDue} colour={digest.stats.supervisionsDue > 0 ? "text-amber-700" : "text-[var(--cs-text-secondary)]"} />
        <MiniStat label="Generated" value={digest.stats.caraOutputsGenerated} colour="text-[var(--cs-text-secondary)]" />
        <MiniStat label="Approved" value={digest.stats.caraOutputsApproved} colour="text-emerald-700" />
      </div>

      {/* Top actions */}
      <div className="px-5 py-3">
        <p className="text-[9px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">
          This week's priorities
        </p>
        <div className="space-y-2">
          {digest.topActions.map((action) => {
            const Icon = action.icon;
            const priority = PRIORITY_CONFIG[action.priority];
            return (
              <div key={action.id} className="flex items-start gap-2.5">
                <span className={cn("h-1.5 w-1.5 rounded-full mt-1.5 shrink-0", priority.dot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-[var(--cs-navy)]">{action.label}</p>
                  <p className="text-[9px] text-[var(--cs-text-muted)] leading-relaxed">{action.description}</p>
                </div>
                {action.actionUrl && (
                  <Link
                    href={action.actionUrl}
                    className="text-[var(--cs-text-muted)] hover:text-[var(--cs-cara-gold)] transition-colors shrink-0 mt-0.5"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      {digest.achievements.length > 0 && (
        <div className="px-5 py-3 bg-emerald-50/50 border-t border-emerald-100">
          <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> This week's wins
          </p>
          <ul className="space-y-0.5">
            {digest.achievements.map((a, i) => (
              <li key={i} className="text-[10px] text-emerald-800">· {a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, colour }: { label: string; value: number; colour: string }) {
  return (
    <div className="text-center">
      <div className={cn("text-lg font-bold tabular-nums", colour)}>{value}</div>
      <div className="text-[8px] text-[var(--cs-text-muted)] font-medium">{label}</div>
    </div>
  );
}

// Expose for testing
export const _testing = { PRIORITY_CONFIG, getDemoDigest };
