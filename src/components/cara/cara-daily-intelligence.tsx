"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — DAILY INTELLIGENCE BRIEF
//
// The Registered Manager's brief for the day, built from REAL recorded signals
// via /api/cara/today-briefing. It shows nothing it cannot evidence: when the
// home has no recorded signals yet, it says so plainly rather than inventing a
// day's events.
//
// NB: this component previously rendered a hardcoded demo day (fictional
// children and events) unconditionally — which surfaced on the live tenant as
// "children who are not living in the home". Fabricated records must never
// appear on a live care-record system, so the demo generator has been removed
// and replaced with the real feed + an honest empty state.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Shield,
  Users,
  Heart,
  GraduationCap,
  Calendar,
  Bell,
  Loader2,
  RefreshCw,
  Eye,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types (mirror /api/cara/today-briefing) ───────────────────────────────────

type Severity = "critical" | "high" | "medium" | "low" | "positive";
type Category =
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
  severity: Severity;
  category: Category;
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

interface DailyIntelligenceProps {
  /** Reserved — the brief is always generated server-side for "today". */
  date?: string;
  /**
   * Optional explicit tenant id. When omitted (the usual case) no homeId param
   * is sent, so the server resolves the live tenant itself. We never default to
   * a literal like "home_oak", which on a live tenant would query the wrong
   * home and strip the brief to nothing.
   */
  homeId?: string;
  className?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, { label: string; colour: string; bg: string; border: string; icon: React.ElementType }> = {
  critical: { label: "Critical", colour: "text-red-700",                     bg: "bg-red-50",     border: "border-l-red-500",    icon: AlertTriangle },
  high:     { label: "High",     colour: "text-orange-700",                  bg: "bg-orange-50",  border: "border-l-orange-400", icon: AlertCircle },
  medium:   { label: "Medium",   colour: "text-amber-700",                   bg: "bg-amber-50",   border: "border-l-amber-400",  icon: Clock },
  low:      { label: "Low",      colour: "text-[var(--cs-text-secondary)]",  bg: "bg-slate-50",   border: "border-l-slate-300",  icon: Clock },
  positive: { label: "Positive", colour: "text-emerald-700",                 bg: "bg-emerald-50", border: "border-l-emerald-400", icon: CheckCircle2 },
};

const CATEGORY_CONFIG: Record<Category, { label: string; icon: React.ElementType; colour: string }> = {
  safeguarding: { label: "Safeguarding", icon: Shield,        colour: "text-purple-600" },
  incident:     { label: "Incident",     icon: AlertTriangle, colour: "text-red-600" },
  compliance:   { label: "Compliance",   icon: Scale,         colour: "text-blue-600" },
  oversight:    { label: "Oversight",    icon: Eye,           colour: "text-indigo-600" },
  staffing:     { label: "Staffing",     icon: Users,         colour: "text-sky-600" },
  health:       { label: "Health",       icon: Heart,         colour: "text-emerald-600" },
  education:    { label: "Education",    icon: GraduationCap, colour: "text-teal-600" },
  wellbeing:    { label: "Wellbeing",    icon: Heart,         colour: "text-rose-500" },
  deadline:     { label: "Deadline",     icon: Calendar,      colour: "text-amber-600" },
  positive:     { label: "Positive",     icon: CheckCircle2,  colour: "text-emerald-600" },
};

const RAG_CONFIG = {
  red:   { label: "Escalated", colour: "text-red-700",     bg: "bg-red-50",     ring: "ring-red-200" },
  amber: { label: "Attention", colour: "text-amber-700",   bg: "bg-amber-50",   ring: "ring-amber-200" },
  green: { label: "Stable",    colour: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200" },
} as const;

/** RAG is DERIVED from the real counts — never asserted independently. */
function ragFor(b: Pick<TodayBriefing, "criticalCount" | "highCount">): keyof typeof RAG_CONFIG {
  if (b.criticalCount > 0) return "red";
  if (b.highCount > 0) return "amber";
  return "green";
}

// ── Component ────────────────────────────────────────────────────────────────

export function CaraDailyIntelligence({ homeId, className }: DailyIntelligenceProps) {
  const [briefing, setBriefing] = useState<TodayBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = homeId ? `?homeId=${encodeURIComponent(homeId)}` : "";
      const res = await fetch(`/api/cara/today-briefing${qs}`);
      const json = await res.json();
      if (res.ok && json.ok && json.data) {
        setBriefing(json.data as TodayBriefing);
      } else {
        setError(json.error ?? "Unable to load the daily brief");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId]);

  if (loading) {
    return (
      <div className={cn("rounded-2xl border border-[var(--cs-border)] bg-white p-6", className)}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-cara-gold)]" />
          <span className="text-sm text-[var(--cs-text-secondary)]">Loading today&apos;s brief…</span>
        </div>
      </div>
    );
  }

  if (error || !briefing) {
    return (
      <div className={cn("rounded-2xl border border-[var(--cs-border)] bg-white p-6", className)}>
        <div className="flex items-center gap-3 text-sm text-[var(--cs-text-muted)]">
          <AlertCircle className="h-4 w-4" />
          <span>{error ?? "Unable to load the daily brief"}</span>
          <Button variant="ghost" size="sm" onClick={load} className="gap-1.5 ml-auto">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const rag = RAG_CONFIG[ragFor(briefing)];
  const dateLabel = new Date(briefing.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const displayed = showAll ? briefing.signals : briefing.signals.slice(0, 8);
  const hasMore = briefing.signals.length > 8;

  return (
    <div className={cn("rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden", className)}>
      {/* Header */}
      <div
        className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-[var(--cs-cara-gold-soft)] rounded-lg shrink-0">
              <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Daily Intelligence Brief</h3>
              <p className="text-[10px] text-[var(--cs-text-muted)] truncate">{briefing.homeName} — {dateLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1", rag.bg, rag.colour, rag.ring)}>{rag.label}</span>
            {expanded ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-5 space-y-4">
          {/* Summary strip — all values come straight from the real feed */}
          <div className="grid grid-cols-4 gap-2">
            <Stat label="Signals" value={briefing.signalCount} />
            <Stat label="Critical" value={briefing.criticalCount} tone={briefing.criticalCount > 0 ? "red" : "muted"} />
            <Stat label="High" value={briefing.highCount} tone={briefing.highCount > 0 ? "amber" : "muted"} />
            <Stat label="Positive" value={briefing.positiveCount} tone={briefing.positiveCount > 0 ? "green" : "muted"} />
          </div>

          {briefing.summary && (
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{briefing.summary}</p>
          )}

          {briefing.signals.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--cs-border)] bg-slate-50 p-6 text-center">
              <CheckCircle2 className="h-5 w-5 text-[var(--cs-text-muted)] mx-auto mb-2" />
              <p className="text-sm font-medium text-[var(--cs-text-secondary)]">No signals recorded for today yet</p>
              <p className="text-[11px] text-[var(--cs-text-muted)] mt-1">
                As records are logged across the home, Cara surfaces anything needing attention here.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {displayed.map((s) => {
                const sev = SEVERITY_CONFIG[s.severity] ?? SEVERITY_CONFIG.low;
                const cat = CATEGORY_CONFIG[s.category] ?? CATEGORY_CONFIG.oversight;
                const Icon = cat.icon;
                return (
                  <div key={s.id} className={cn("rounded-lg border border-l-4 p-3 text-xs", sev.bg, sev.border)}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={cn("h-3.5 w-3.5 shrink-0", cat.colour)} />
                        <span className="font-medium truncate">{s.title}</span>
                      </div>
                      <span className={cn("text-[10px] font-semibold shrink-0", sev.colour)}>{sev.label}</span>
                    </div>
                    {s.detail && <p className="text-[11px] text-[var(--cs-text-secondary)] mt-1">{s.detail}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-[var(--cs-text-muted)]">
                      <span>{cat.label}</span>
                      {s.childName && <span>• {s.childName}</span>}
                      {s.dueDate && <span>• due {s.dueDate}</span>}
                      {s.sourceModule && <span>• {s.sourceModule}</span>}
                    </div>
                    {s.actionRequired && <p className="text-[11px] text-[var(--cs-navy)] mt-1">→ {s.actionRequired}</p>}
                  </div>
                );
              })}
              {hasMore && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-[11px] text-[var(--cs-cara-gold)] hover:underline"
                >
                  {showAll ? "Show fewer" : `Show all ${briefing.signals.length} signals`}
                </button>
              )}
            </div>
          )}

          {briefing.topPriorities.length > 0 && (
            <div className="rounded-lg bg-[var(--cs-cara-gold-bg)] p-3">
              <p className="text-[11px] font-semibold text-[var(--cs-navy)] mb-1.5 flex items-center gap-1">
                <Bell className="h-3 w-3" /> Top priorities
              </p>
              <ul className="space-y-1">
                {briefing.topPriorities.map((p, i) => (
                  <li key={i} className="text-[11px] text-[var(--cs-text-secondary)]">• {p}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[10px] text-[var(--cs-text-muted)] text-right">
            Generated {new Date(briefing.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "muted" }: { label: string; value: number; tone?: "red" | "amber" | "green" | "muted" }) {
  const toneCls =
    tone === "red" ? "text-[--cs-risk]" : tone === "amber" ? "text-[--cs-warning]" : tone === "green" ? "text-[--cs-success]" : "text-[var(--cs-text-secondary)]";
  const bgCls = tone === "red" ? "bg-red-50" : tone === "amber" ? "bg-amber-50" : tone === "green" ? "bg-emerald-50" : "bg-slate-50";
  return (
    <div className={cn("text-center rounded-lg p-2.5", bgCls)}>
      <p className={cn("text-lg font-bold tabular-nums", toneCls)}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────

export const _testing = {
  SEVERITY_CONFIG,
  CATEGORY_CONFIG,
  RAG_CONFIG,
  ragFor,
};
