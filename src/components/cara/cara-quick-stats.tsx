"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraQuickStats
//
// Compact inline stats bar for embedding in dashboards and page headers.
// Shows key Cara metrics in a single row: requests, approved, pending, rate.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { cn } from "@/lib/utils";
import { useCaraActivity } from "@/hooks/use-cara-activity";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  TrendingUp,
  Loader2,
} from "lucide-react";

interface CaraQuickStatsProps {
  homeId?: string;
  days?: number;
  className?: string;
}

export function CaraQuickStats({
  homeId,
  days = 30,
  className,
}: CaraQuickStatsProps) {
  const { data: stats, isLoading } = useCaraActivity({ homeId, days });

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className="h-3 w-3 animate-spin text-[var(--cs-cara-gold)]" />
        <span className="text-[10px] text-[var(--cs-text-muted)]">
          Loading Cara stats...
        </span>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-full border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] px-3 py-1.5",
        className,
      )}
    >
      <Sparkles className="h-3 w-3 text-[var(--cs-cara-gold)]" />

      <StatItem
        icon={Sparkles}
        value={stats.totalRequests}
        label="requests"
        color="text-[var(--cs-navy)]"
      />

      <span className="text-gray-300">·</span>

      <StatItem
        icon={CheckCircle2}
        value={stats.approvedOutputs}
        label="approved"
        color="text-green-600"
      />

      {stats.pendingOutputs > 0 && (
        <>
          <span className="text-gray-300">·</span>
          <StatItem
            icon={Clock}
            value={stats.pendingOutputs}
            label="pending"
            color="text-amber-600"
          />
        </>
      )}

      <span className="text-gray-300">·</span>

      <StatItem
        icon={TrendingUp}
        value={`${stats.approvalRate}%`}
        label="rate"
        color={
          stats.approvalRate >= 80
            ? "text-green-600"
            : stats.approvalRate >= 50
              ? "text-amber-600"
              : "text-red-500"
        }
      />
    </div>
  );
}

function StatItem({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <Icon className={cn("h-2.5 w-2.5", color)} />
      <span className={cn("text-[10px] font-bold", color)}>{value}</span>
      <span className="text-[10px] text-[var(--cs-text-muted)]">{label}</span>
    </div>
  );
}
