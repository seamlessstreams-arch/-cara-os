"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraTodayBriefing
//
// Dashboard widget showing the Cara morning briefing. Displays prioritised
// signals across the home: critical items needing immediate action, high
// priority tasks, compliance deadlines, and positive developments to celebrate.
//
// Fetches from /api/cara/today-briefing on mount.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import {
  Sparkles, AlertTriangle, AlertCircle, Clock, CheckCircle2,
  Shield, Loader2, ChevronDown, ChevronUp, Star,
  ArrowRight, Bell, Users, BookOpen, Heart, GraduationCap,
  Calendar, Briefcase, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type SignalSeverity = "critical" | "high" | "medium" | "low" | "positive";
type SignalCategory =
  | "safeguarding"
  | "incident"
  | "compliance"
  | "oversight"
  | "staffing"
  | "health"
  | "education"
  | "wellbeing"
  | "deadline"
  | "positive";

interface TodaySignal {
  id: string;
  severity: SignalSeverity;
  category: SignalCategory;
  title: string;
  detail: string;
  actionRequired?: string;
  childName?: string;
  dueDate?: string;
  sourceModule: string;
  sourceId?: string;
}

interface TodayBriefing {
  date: string;
  homeId: string;
  homeName: string;
  generatedAt: string;
  signalCount: number;
  criticalCount: number;
  highCount: number;
  positiveCount: number;
  signals: TodaySignal[];
  summary: string;
  topPriorities: string[];
}

// ── Severity config ──────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<SignalSeverity, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  critical: {
    label: "Critical",
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
    icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
  },
  high: {
    label: "High",
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-200",
    icon: <AlertCircle className="h-4 w-4 text-orange-600" />,
  },
  medium: {
    label: "Medium",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    icon: <Clock className="h-4 w-4 text-amber-600" />,
  },
  low: {
    label: "Low",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    icon: <Bell className="h-4 w-4 text-blue-600" />,
  },
  positive: {
    label: "Positive",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    icon: <Star className="h-4 w-4 text-emerald-600" />,
  },
};

const CATEGORY_ICONS: Record<SignalCategory, React.ReactNode> = {
  safeguarding: <Shield className="h-3.5 w-3.5" />,
  incident: <AlertTriangle className="h-3.5 w-3.5" />,
  compliance: <BookOpen className="h-3.5 w-3.5" />,
  oversight: <Briefcase className="h-3.5 w-3.5" />,
  staffing: <Users className="h-3.5 w-3.5" />,
  health: <Heart className="h-3.5 w-3.5" />,
  education: <GraduationCap className="h-3.5 w-3.5" />,
  wellbeing: <Heart className="h-3.5 w-3.5" />,
  deadline: <Calendar className="h-3.5 w-3.5" />,
  positive: <CheckCircle2 className="h-3.5 w-3.5" />,
};

// ── Component ────────────────────────────────────────────────────────────────

export function CaraTodayBriefing({ homeId = "home_oak" }: { homeId?: string }) {
  const [briefing, setBriefing] = useState<TodayBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  async function fetchBriefing() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cara/today-briefing?homeId=${homeId}`);
      const json = await res.json();
      if (json.ok && json.data) {
        setBriefing(json.data);
      } else {
        setError(json.error ?? "Failed to load briefing");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBriefing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-cara-gold)]" />
          <span className="text-sm text-[var(--cs-text-secondary)]">Loading Cara morning briefing...</span>
        </div>
      </div>
    );
  }

  if (error || !briefing) {
    return (
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-6">
        <div className="flex items-center gap-3 text-sm text-[var(--cs-text-muted)]">
          <AlertCircle className="h-4 w-4" />
          <span>{error ?? "Unable to load briefing"}</span>
          <Button variant="ghost" size="sm" onClick={fetchBriefing} className="gap-1.5 ml-auto">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const displayedSignals = showAll ? briefing.signals : briefing.signals.slice(0, 6);
  const hasMore = briefing.signals.length > 6;

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div
        className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[var(--cs-cara-gold-soft)] rounded-lg">
              <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Cara Today Briefing</h3>
              <p className="text-[10px] text-[var(--cs-text-muted)]">{briefing.homeName} — {new Date(briefing.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {briefing.criticalCount > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                {briefing.criticalCount} critical
              </Badge>
            )}
            {briefing.highCount > 0 && (
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px]">
                {briefing.highCount} high
              </Badge>
            )}
            {briefing.positiveCount > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                {briefing.positiveCount} positive
              </Badge>
            )}
            {expanded ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />}
          </div>
        </div>
      </div>

      {expanded && (
        <>
          {/* Summary */}
          <div className="px-5 py-3 border-b border-[var(--cs-border)] bg-slate-50/50">
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{briefing.summary}</p>
            {briefing.topPriorities.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {briefing.topPriorities.map((p, i) => (
                  <li key={i} className="text-[11px] text-[var(--cs-text-muted)] flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-[var(--cs-cara-gold)]" />
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Signals */}
          <div className="divide-y divide-[var(--cs-border)]">
            {displayedSignals.map((signal) => {
              const cfg = SEVERITY_CONFIG[signal.severity];
              return (
                <div key={signal.id} className="px-5 py-3 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-[var(--cs-navy)]">{signal.title}</span>
                        <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium border", cfg.bg, cfg.text, cfg.border)}>
                          {cfg.label}
                        </span>
                        {signal.childName && (
                          <span className="text-[10px] text-[var(--cs-text-muted)] bg-slate-100 px-1.5 py-0.5 rounded">
                            {signal.childName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--cs-text-secondary)] mt-0.5 leading-relaxed">
                        {signal.detail}
                      </p>
                      {signal.actionRequired && (
                        <div className="mt-1.5 flex items-start gap-1.5 rounded bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] px-2 py-1.5">
                          <Sparkles className="h-3 w-3 text-[var(--cs-cara-gold)] mt-0.5 shrink-0" />
                          <span className="text-[10px] text-[var(--cs-navy)]">{signal.actionRequired}</span>
                        </div>
                      )}
                      {signal.dueDate && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-[var(--cs-text-gentle)]">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(signal.dueDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                    <span className="text-[var(--cs-text-muted)] shrink-0 mt-0.5">
                      {CATEGORY_ICONS[signal.category]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show more / footer */}
          <div className="px-5 py-2.5 border-t border-[var(--cs-border)] bg-slate-50/50 flex items-center justify-between">
            {hasMore && (
              <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)} className="text-[11px] gap-1">
                {showAll ? (
                  <>Show less <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>Show all {briefing.signals.length} signals <ChevronDown className="h-3 w-3" /></>
                )}
              </Button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="ghost" size="sm" onClick={fetchBriefing} className="text-[11px] gap-1">
                <RefreshCw className="h-3 w-3" /> Refresh
              </Button>
              <span className="text-[9px] text-[var(--cs-text-gentle)]">
                Generated {new Date(briefing.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
