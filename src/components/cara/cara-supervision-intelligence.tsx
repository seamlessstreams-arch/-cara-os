"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraSupervisionIntelligence
//
// Dashboard widget showing supervision compliance and intelligence.
// Surfaces overdue supervisions, wellbeing concerns, action completion,
// and training needs for the RM.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import {
  Loader2, Users2, AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, RefreshCw, Sparkles, Heart,
  TrendingDown, TrendingUp, Minus, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface StaffProfile {
  staffId: string;
  staffName: string;
  daysSinceLast: number;
  isOverdue: boolean;
  averageWellbeing: number | null;
  wellbeingTrend: string;
  actionCompletionRate: number;
  overdueActions: number;
}

interface SupervisionData {
  homeId: string;
  analysisDate: string;
  totalStaff: number;
  overdueCount: number;
  overdueStaff: StaffProfile[];
  upcomingDue: StaffProfile[];
  teamActionCompletionRate: number;
  teamWellbeingAverage: number | null;
  commonThemes: { theme: string; count: number; trend: string }[];
  trainingNeeds: { area: string; staffCount: number; staffNames: string[] }[];
  wellbeingConcerns: { staffName: string; score: number; trend: string }[];
  strengths: string[];
  concerns: string[];
  regulatoryStatus: { reg33Compliant: boolean; compliancePercent: number; detail: string };
}

// ── Component ────────────────────────────────────────────────────────────────

export function CaraSupervisionIntelligence({ homeId = "home_oak" }: { homeId?: string }) {
  const [data, setData] = useState<SupervisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cara/supervision-intelligence?homeId=${homeId}`);
      const json = await res.json();
      if (json.ok && json.data) setData(json.data);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--cs-cara-gold)]" />
          <span className="text-xs text-[var(--cs-text-muted)]">Analysing supervision data...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const reg33Cfg = data.regulatoryStatus.reg33Compliant
    ? { bg: "bg-emerald-50", text: "text-emerald-700", icon: <CheckCircle2 className="h-3.5 w-3.5" /> }
    : { bg: "bg-red-50", text: "text-red-700", icon: <AlertTriangle className="h-3.5 w-3.5" /> };

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-100 rounded-lg">
              <Users2 className="h-4 w-4 text-[var(--cs-navy)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Supervision Intelligence</h3>
              <p className="text-[10px] text-[var(--cs-text-muted)]">{data.totalStaff} staff — Reg 33 compliance</p>
            </div>
          </div>
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", reg33Cfg.bg, reg33Cfg.text)}>
            {reg33Cfg.icon}
            {data.regulatoryStatus.compliancePercent}%
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="px-5 py-3 border-b border-[var(--cs-border)] grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className={cn("text-sm font-bold", data.overdueCount > 0 ? "text-red-600" : "text-emerald-600")}>
            {data.overdueCount}
          </div>
          <div className="text-[9px] text-[var(--cs-text-muted)]">Overdue</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-[var(--cs-navy)]">
            {data.teamActionCompletionRate}%
          </div>
          <div className="text-[9px] text-[var(--cs-text-muted)]">Actions done</div>
        </div>
        <div className="text-center">
          <div className={cn("text-sm font-bold", data.teamWellbeingAverage && data.teamWellbeingAverage >= 3.5 ? "text-emerald-600" : data.teamWellbeingAverage && data.teamWellbeingAverage < 3 ? "text-red-600" : "text-[var(--cs-navy)]")}>
            {data.teamWellbeingAverage ?? "—"}
          </div>
          <div className="text-[9px] text-[var(--cs-text-muted)]">Wellbeing avg</div>
        </div>
      </div>

      {/* Overdue staff */}
      {data.overdueStaff.length > 0 && (
        <div className="px-5 py-2.5 border-b border-[var(--cs-border)]">
          <div className="text-[10px] font-semibold text-red-600 uppercase mb-1.5">Overdue</div>
          {data.overdueStaff.slice(0, 3).map((staff) => (
            <div key={staff.staffId} className="flex items-center gap-2 mt-1 text-[10px]">
              <Clock className="h-3 w-3 text-red-500" />
              <span className="text-[var(--cs-text-secondary)]">{staff.staffName}</span>
              <span className="ml-auto font-medium text-red-600 tabular-nums">{staff.daysSinceLast}d ago</span>
            </div>
          ))}
        </div>
      )}

      {/* Wellbeing concerns */}
      {data.wellbeingConcerns.length > 0 && (
        <div className="px-5 py-2.5 border-b border-[var(--cs-border)]">
          <div className="text-[10px] font-semibold text-amber-600 uppercase mb-1.5">Wellbeing concerns</div>
          {data.wellbeingConcerns.slice(0, 3).map((concern, i) => (
            <div key={i} className="flex items-center gap-2 mt-1 text-[10px]">
              <Heart className="h-3 w-3 text-amber-500" />
              <span className="text-[var(--cs-text-secondary)]">{concern.staffName}</span>
              <span className="ml-auto flex items-center gap-1">
                <span className="font-medium text-amber-600 tabular-nums">{concern.score}/5</span>
                {concern.trend === "declining" && <TrendingDown className="h-3 w-3 text-red-500" />}
                {concern.trend === "improving" && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                {concern.trend === "stable" && <Minus className="h-3 w-3 text-slate-400" />}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Expanded: themes + training needs */}
      {expanded && (
        <>
          {data.commonThemes.length > 0 && (
            <div className="px-5 py-2.5 border-b border-[var(--cs-border)]">
              <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase mb-1.5">Common themes</div>
              <div className="flex flex-wrap gap-1.5">
                {data.commonThemes.slice(0, 5).map((theme, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 rounded-full text-[9px] text-[var(--cs-text-secondary)]">
                    {theme.theme} ({theme.count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.trainingNeeds.length > 0 && (
            <div className="px-5 py-2.5 border-b border-[var(--cs-border)]">
              <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase mb-1.5">Training needs</div>
              {data.trainingNeeds.slice(0, 3).map((need, i) => (
                <div key={i} className="flex items-center gap-2 mt-1 text-[10px]">
                  <BookOpen className="h-3 w-3 text-blue-500" />
                  <span className="text-[var(--cs-text-secondary)]">{need.area}</span>
                  <span className="ml-auto text-[var(--cs-text-muted)]">{need.staffCount} staff</span>
                </div>
              ))}
            </div>
          )}

          {/* Cara suggestions */}
          {data.concerns.length > 0 && (
            <div className="px-5 py-2.5 border-b border-[var(--cs-border)]">
              {data.concerns.map((concern, i) => (
                <div key={i} className="flex items-start gap-1.5 mt-1">
                  <Sparkles className="h-3 w-3 text-[var(--cs-cara-gold)] mt-0.5 shrink-0" />
                  <span className="text-[10px] text-[var(--cs-text-secondary)]">{concern}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="px-5 py-2 border-t border-[var(--cs-border)] flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-[10px] gap-1 h-7">
          {expanded ? <>Show less <ChevronUp className="h-3 w-3" /></> : <>Details <ChevronDown className="h-3 w-3" /></>}
        </Button>
        <Button variant="ghost" size="sm" onClick={fetchData} className="text-[10px] gap-1 h-7">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>
    </div>
  );
}
