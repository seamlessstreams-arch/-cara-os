"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MULTI-HOME OVERVIEW (Responsible Individual view)
//
// Portfolio-level dashboard showing all homes at a glance.
// Each home card displays key metrics with traffic light indicators.
// Clicking a card switches to that home's dashboard.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import {
  Building2,
  Users,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  BedDouble,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeContext } from "@/contexts/home-context";
import type { CornerstoneHome } from "@/lib/homes/home-registry";

// ── Simulated per-home summary stats ─────────────────────────────────────────
// In production these would come from a real API aggregation.

interface HomeSummaryStats {
  compliance_score: number;
  open_incidents: number;
  overdue_tasks: number;
  staff_count: number;
}

const DEMO_STATS: Record<string, HomeSummaryStats> = {
  home_oak: {
    compliance_score: 94,
    open_incidents: 1,
    overdue_tasks: 2,
    staff_count: 12,
  },
  home_willow: {
    compliance_score: 87,
    open_incidents: 3,
    overdue_tasks: 5,
    staff_count: 9,
  },
  home_cedar: {
    compliance_score: 72,
    open_incidents: 5,
    overdue_tasks: 11,
    staff_count: 16,
  },
};

function getStats(homeId: string): HomeSummaryStats {
  return (
    DEMO_STATS[homeId] ?? {
      compliance_score: 0,
      open_incidents: 0,
      overdue_tasks: 0,
      staff_count: 0,
    }
  );
}

// ── Portfolio totals ─────────────────────────────────────────────────────────

function computePortfolioSummary(homes: CornerstoneHome[]) {
  let totalChildren = 0;
  let totalStaff = 0;
  let totalCompliance = 0;

  for (const h of homes) {
    const s = getStats(h.id);
    totalChildren += h.current_occupancy;
    totalStaff += s.staff_count;
    totalCompliance += s.compliance_score;
  }

  return {
    totalChildren,
    totalStaff,
    averageCompliance:
      homes.length > 0 ? Math.round(totalCompliance / homes.length) : 0,
    totalHomes: homes.length,
  };
}

// ── Traffic light colour ────────────────────────────────────────────────────

function trafficLight(score: number): {
  dot: string;
  bg: string;
  ring: string;
} {
  if (score >= 85)
    return {
      dot: "bg-emerald-500",
      bg: "bg-emerald-50",
      ring: "ring-emerald-200",
    };
  if (score >= 70)
    return {
      dot: "bg-amber-500",
      bg: "bg-amber-50",
      ring: "ring-amber-200",
    };
  return { dot: "bg-red-500", bg: "bg-red-50", ring: "ring-red-200" };
}

function ratingColour(
  rating: CornerstoneHome["last_inspection_rating"],
): string {
  switch (rating) {
    case "outstanding":
      return "text-emerald-600";
    case "good":
      return "text-blue-600";
    case "adequate":
      return "text-amber-600";
    case "inadequate":
      return "text-red-600";
    default:
      return "text-slate-400";
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export function MultiHomeOverview() {
  const { availableHomes, setCurrentHome } = useHomeContext();
  const portfolio = computePortfolioSummary(availableHomes);

  return (
    <div className="space-y-6">
      {/* ── Portfolio Summary ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Portfolio Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard
            icon={<Building2 className="h-4 w-4" />}
            label="Homes"
            value={portfolio.totalHomes}
          />
          <SummaryCard
            icon={<Users className="h-4 w-4" />}
            label="Children"
            value={portfolio.totalChildren}
          />
          <SummaryCard
            icon={<UserCheck className="h-4 w-4" />}
            label="Staff"
            value={portfolio.totalStaff}
          />
          <SummaryCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Avg Compliance"
            value={`${portfolio.averageCompliance}%`}
            highlight={portfolio.averageCompliance < 80}
          />
        </div>
      </div>

      {/* ── Home Cards Grid ──────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-3">All Homes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {availableHomes.map((home) => (
            <HomeCard
              key={home.id}
              home={home}
              stats={getStats(home.id)}
              onSelect={() => setCurrentHome(home.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Summary stat card ───────────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-500 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p
        className={cn(
          "text-2xl font-bold",
          highlight ? "text-amber-600" : "text-slate-800",
        )}
      >
        {value}
      </p>
    </div>
  );
}

// ── Individual home card ────────────────────────────────────────────────────

function HomeCard({
  home,
  stats,
  onSelect,
}: {
  home: CornerstoneHome;
  stats: HomeSummaryStats;
  onSelect: () => void;
}) {
  const tl = trafficLight(stats.compliance_score);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-xl border border-slate-200 bg-white p-5 transition-all",
        "hover:shadow-md hover:border-slate-300 active:scale-[0.99]",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              tl.bg,
              "ring-1",
              tl.ring,
            )}
          >
            <Building2 className="h-4.5 w-4.5 text-slate-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              {home.name}
            </h4>
            <p className="text-[11px] text-slate-500">
              RM: {home.registered_manager}
            </p>
          </div>
        </div>

        {/* Traffic light dot */}
        <div className="flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-full", tl.dot)} />
          <span className="text-xs font-semibold text-slate-600">
            {stats.compliance_score}%
          </span>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <Metric
          icon={<BedDouble className="h-3 w-3" />}
          label="Occupancy"
          value={`${home.current_occupancy}/${home.capacity}`}
        />
        <Metric
          icon={<ShieldCheck className="h-3 w-3" />}
          label="Inspection"
          value={home.last_inspection_rating ?? "N/A"}
          className={ratingColour(home.last_inspection_rating)}
        />
        <Metric
          icon={<AlertTriangle className="h-3 w-3" />}
          label="Incidents"
          value={stats.open_incidents}
          className={stats.open_incidents > 2 ? "text-red-600" : undefined}
        />
        <Metric
          icon={<ClipboardList className="h-3 w-3" />}
          label="Overdue"
          value={stats.overdue_tasks}
          className={stats.overdue_tasks > 5 ? "text-amber-600" : undefined}
        />
      </div>

      {/* Footer */}
      <p className="text-[11px] text-slate-400">
        {home.address} &middot; {home.postcode}
      </p>
    </button>
  );
}

// ── Small metric ────────────────────────────────────────────────────────────

function Metric({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
        {icon}
      </div>
      <p
        className={cn(
          "text-xs font-semibold",
          className ?? "text-slate-700",
        )}
      >
        {value}
      </p>
      <p className="text-[9px] text-slate-400 leading-tight">{label}</p>
    </div>
  );
}
