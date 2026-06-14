"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — DAILY INTELLIGENCE BRIEF
// Synthesises the day's activity across all modules into an intelligent brief
// for the Registered Manager: incidents, mood trends, medication, key events,
// staffing, and compliance gaps.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import {
  Sparkles, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
  Activity, Heart, Pill, Shield, Users, Clock, TrendingUp,
  TrendingDown, Minus, Sun, Moon, Eye, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type BriefPriority = "critical" | "high" | "routine" | "positive";
type ShiftPeriod = "day" | "evening" | "night" | "waking_night";

interface DailyEvent {
  id: string;
  time: string;
  category: "incident" | "mood" | "medication" | "behaviour" | "health" | "safeguarding" | "missing" | "positive" | "contact" | "education" | "activity";
  priority: BriefPriority;
  summary: string;
  childName?: string;
  staffName?: string;
  requiresFollowUp: boolean;
}

interface MoodSnapshot {
  childName: string;
  morningMood: number | null;
  afternoonMood: number | null;
  eveningMood: number | null;
  trend: "improving" | "declining" | "stable" | "unknown";
}

interface StaffingNote {
  shift: ShiftPeriod;
  planned: number;
  actual: number;
  notes?: string;
}

interface ComplianceGap {
  area: string;
  detail: string;
  severity: "critical" | "warning";
  regulation?: string;
}

interface DailyBrief {
  date: string;
  shiftPeriod: ShiftPeriod;
  events: DailyEvent[];
  moodSnapshots: MoodSnapshot[];
  staffing: StaffingNote[];
  complianceGaps: ComplianceGap[];
  headline: string;
  overallRag: "red" | "amber" | "green";
}

interface DailyIntelligenceProps {
  /** The date to generate the brief for */
  date?: string;
  /** Home ID for context */
  homeId?: string;
  /** Optional className */
  className?: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

const EVENT_CATEGORY_CONFIG: Record<DailyEvent["category"], {
  label: string;
  icon: React.ElementType;
  colour: string;
  bg: string;
}> = {
  incident:     { label: "Incident",      icon: AlertTriangle,  colour: "text-red-600",     bg: "bg-red-50" },
  mood:         { label: "Mood",          icon: Heart,          colour: "text-rose-500",    bg: "bg-rose-50" },
  medication:   { label: "Medication",    icon: Pill,           colour: "text-blue-600",    bg: "bg-blue-50" },
  behaviour:    { label: "Behaviour",     icon: Activity,       colour: "text-orange-600",  bg: "bg-orange-50" },
  health:       { label: "Health",        icon: Heart,          colour: "text-emerald-600", bg: "bg-emerald-50" },
  safeguarding: { label: "Safeguarding",  icon: Shield,         colour: "text-purple-600",  bg: "bg-purple-50" },
  missing:      { label: "Missing",       icon: Eye,            colour: "text-red-700",     bg: "bg-red-50" },
  positive:     { label: "Positive",      icon: CheckCircle2,   colour: "text-emerald-600", bg: "bg-emerald-50" },
  contact:      { label: "Contact",       icon: Users,          colour: "text-sky-600",     bg: "bg-sky-50" },
  education:    { label: "Education",     icon: MessageSquare,  colour: "text-teal-600",    bg: "bg-teal-50" },
  activity:     { label: "Activity",      icon: Activity,       colour: "text-[var(--cs-cara-gold)]", bg: "bg-[var(--cs-cara-gold-bg)]" },
};

const PRIORITY_CONFIG: Record<BriefPriority, {
  label: string;
  colour: string;
  bg: string;
  border: string;
}> = {
  critical: { label: "Critical",  colour: "text-red-700",     bg: "bg-red-50",     border: "border-l-red-500" },
  high:     { label: "High",      colour: "text-orange-700",  bg: "bg-orange-50",  border: "border-l-orange-400" },
  routine:  { label: "Routine",   colour: "text-[var(--cs-text-secondary)]",  bg: "bg-slate-50",   border: "border-l-slate-300" },
  positive: { label: "Positive",  colour: "text-emerald-700", bg: "bg-emerald-50", border: "border-l-emerald-400" },
};

const SHIFT_CONFIG: Record<ShiftPeriod, {
  label: string;
  icon: React.ElementType;
  hours: string;
}> = {
  day:          { label: "Day Shift",       icon: Sun,  hours: "07:00–15:00" },
  evening:      { label: "Evening Shift",   icon: Moon, hours: "15:00–22:00" },
  night:        { label: "Night Shift",     icon: Moon, hours: "22:00–07:00" },
  waking_night: { label: "Waking Night",    icon: Moon, hours: "22:00–07:00" },
};

const RAG_CONFIG: Record<DailyBrief["overallRag"], {
  label: string;
  colour: string;
  bg: string;
  ring: string;
}> = {
  red:    { label: "Escalated",  colour: "text-red-700",     bg: "bg-red-50",     ring: "ring-red-200" },
  amber:  { label: "Attention",  colour: "text-amber-700",   bg: "bg-amber-50",   ring: "ring-amber-200" },
  green:  { label: "Stable",     colour: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200" },
};

// ── Demo brief generator ─────────────────────────────────────────────────────

function generateDemoBrief(date: string): DailyBrief {
  const events: DailyEvent[] = [
    {
      id: "evt_1", time: "07:45", category: "medication",
      priority: "routine", summary: "Morning medication round completed — all YP received prescribed medication on time.",
      staffName: "Maria K", requiresFollowUp: false,
    },
    {
      id: "evt_2", time: "08:30", category: "mood",
      priority: "routine", summary: "Alex W presented with low mood this morning. Did not want breakfast. Key worker notified.",
      childName: "Alex W", requiresFollowUp: true,
    },
    {
      id: "evt_3", time: "10:15", category: "positive",
      priority: "positive", summary: "Jordan M completed their maths assessment independently — first time achieving this without support.",
      childName: "Jordan M", requiresFollowUp: false,
    },
    {
      id: "evt_4", time: "11:00", category: "education",
      priority: "routine", summary: "School reported Casey T had an excellent day. Engaged in all lessons. Received a merit award.",
      childName: "Casey T", requiresFollowUp: false,
    },
    {
      id: "evt_5", time: "13:30", category: "incident",
      priority: "high", summary: "Physical altercation between Alex W and Riley P in the lounge. De-escalated by staff using PACE approach. No injuries. Both YP separated and spoken to individually.",
      childName: "Alex W", staffName: "Darren L", requiresFollowUp: true,
    },
    {
      id: "evt_6", time: "14:00", category: "contact",
      priority: "routine", summary: "Social worker visit for Jordan M — LAC review preparation discussed. Next review date confirmed as 28th.",
      childName: "Jordan M", requiresFollowUp: false,
    },
    {
      id: "evt_7", time: "15:30", category: "behaviour",
      priority: "high", summary: "Alex W refused evening meal and became verbally aggressive when asked about the earlier incident. Retreat to room. Keyworker attempted check-in at 16:00.",
      childName: "Alex W", requiresFollowUp: true,
    },
    {
      id: "evt_8", time: "17:00", category: "activity",
      priority: "positive", summary: "Group cooking session — Casey T and Riley P made pasta together. Good interaction and teamwork observed.",
      childName: "Casey T", requiresFollowUp: false,
    },
    {
      id: "evt_9", time: "19:00", category: "medication",
      priority: "routine", summary: "Evening medication round completed. Alex W initially refused but accepted after keyworker discussion.",
      staffName: "Sarah M", requiresFollowUp: false,
    },
  ];

  const moodSnapshots: MoodSnapshot[] = [
    { childName: "Alex W",    morningMood: 3, afternoonMood: 2, eveningMood: 4, trend: "declining" },
    { childName: "Jordan M",  morningMood: 7, afternoonMood: 8, eveningMood: 8, trend: "improving" },
    { childName: "Casey T",   morningMood: 6, afternoonMood: 7, eveningMood: 7, trend: "stable" },
    { childName: "Riley P",   morningMood: 5, afternoonMood: 4, eveningMood: 6, trend: "stable" },
  ];

  const staffing: StaffingNote[] = [
    { shift: "day",     planned: 3, actual: 3 },
    { shift: "evening", planned: 3, actual: 2, notes: "1 staff called in sick — agency cover arranged for tomorrow" },
  ];

  const complianceGaps: ComplianceGap[] = [
    {
      area: "Incident follow-up",
      detail: "Physical altercation between Alex W and Riley P requires management oversight within 24 hours.",
      severity: "warning",
      regulation: "Reg 40(4)(b)",
    },
  ];

  const criticalCount = events.filter((e) => e.priority === "critical").length;
  const highCount = events.filter((e) => e.priority === "high").length;
  const overallRag: DailyBrief["overallRag"] = criticalCount > 0 ? "red" : highCount >= 2 ? "amber" : "green";

  return {
    date,
    shiftPeriod: "day",
    events,
    moodSnapshots,
    staffing,
    complianceGaps,
    headline: highCount > 0
      ? `${highCount} elevated event${highCount > 1 ? "s" : ""} today — oversight required for the physical altercation. ${events.filter((e) => e.priority === "positive").length} positive outcomes recorded.`
      : `Settled day with ${events.length} logged events and no concerns requiring escalation.`,
    overallRag,
  };
}

// ── Mood trend icon helper ───────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: MoodSnapshot["trend"] }) {
  if (trend === "improving") return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (trend === "declining") return <TrendingDown className="h-3 w-3 text-red-500" />;
  if (trend === "stable") return <Minus className="h-3 w-3 text-[var(--cs-text-muted)]" />;
  return <Minus className="h-3 w-3 text-[var(--cs-text-muted)]" />;
}

function MoodDot({ score }: { score: number | null }) {
  if (score === null) return <span className="w-5 text-center text-[10px] text-[var(--cs-text-muted)]">—</span>;
  const colour = score >= 7 ? "bg-emerald-400" : score >= 5 ? "bg-amber-400" : score >= 3 ? "bg-orange-400" : "bg-red-400";
  return (
    <span className="flex items-center gap-1">
      <span className={cn("w-2 h-2 rounded-full", colour)} />
      <span className="text-[10px] text-[var(--cs-text-secondary)]">{score}</span>
    </span>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function CaraDailyIntelligence({
  date,
  homeId,
  className,
}: DailyIntelligenceProps) {
  const today = date ?? new Date().toISOString().slice(0, 10);
  const [expanded, setExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState<"events" | "moods" | "staffing" | "compliance">("events");

  const brief = useMemo(() => generateDemoBrief(today), [today]);
  const rag = RAG_CONFIG[brief.overallRag];

  const criticalEvents = brief.events.filter((e) => e.priority === "critical");
  const highEvents = brief.events.filter((e) => e.priority === "high");
  const followUps = brief.events.filter((e) => e.requiresFollowUp);

  const sections = [
    { id: "events" as const, label: "Timeline", count: brief.events.length },
    { id: "moods" as const, label: "Mood Tracker", count: brief.moodSnapshots.length },
    { id: "staffing" as const, label: "Staffing", count: brief.staffing.length },
    { id: "compliance" as const, label: "Compliance", count: brief.complianceGaps.length },
  ];

  return (
    <div className={cn("rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden cara-magic-in", className)}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--cs-cara-gold-bg)] shadow-sm">
            <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--cs-navy)]">Daily Intelligence Brief</span>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1", rag.bg, rag.colour, rag.ring)}>
                {rag.label}
              </span>
            </div>
            <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">
              {new Date(today).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="cs-transition-fast">
          {expanded ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />}
        </button>
      </div>

      {/* Headline */}
      <div className="px-4 pb-3">
        <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{brief.headline}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 border-t border-[var(--cs-border-subtle)]">
        {[
          { label: "Events",    value: brief.events.length,     colour: "text-[var(--cs-navy)]" },
          { label: "Critical",  value: criticalEvents.length,   colour: criticalEvents.length > 0 ? "text-red-600" : "text-[var(--cs-text-muted)]" },
          { label: "Elevated",  value: highEvents.length,       colour: highEvents.length > 0 ? "text-orange-600" : "text-[var(--cs-text-muted)]" },
          { label: "Follow-ups", value: followUps.length,       colour: followUps.length > 0 ? "text-amber-600" : "text-[var(--cs-text-muted)]" },
        ].map(({ label, value, colour }) => (
          <div key={label} className="px-3 py-2 text-center border-r last:border-r-0 border-[var(--cs-border-subtle)]">
            <div className={cn("text-base font-bold", colour)}>{value}</div>
            <div className="text-[9px] text-[var(--cs-text-muted)] uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[var(--cs-border-subtle)]">
          {/* Section tabs */}
          <div className="flex border-b border-[var(--cs-border-subtle)]">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "flex-1 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider cs-transition-fast",
                  activeSection === s.id
                    ? "text-[var(--cs-cara-gold)] border-b-2 border-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)]/30"
                    : "text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]"
                )}
              >
                {s.label}
                {s.count > 0 && (
                  <span className={cn(
                    "ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px]",
                    activeSection === s.id ? "bg-[var(--cs-cara-gold)] text-white" : "bg-slate-200 text-[var(--cs-text-secondary)]"
                  )}>
                    {s.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* Events timeline */}
            {activeSection === "events" && (
              <div className="space-y-2">
                {brief.events.map((evt) => {
                  const catCfg = EVENT_CATEGORY_CONFIG[evt.category];
                  const priCfg = PRIORITY_CONFIG[evt.priority];
                  const Icon = catCfg.icon;
                  return (
                    <div key={evt.id} className={cn("rounded-xl border border-l-4 p-3", priCfg.border)}>
                      <div className="flex items-start gap-2.5">
                        <div className={cn("flex items-center justify-center w-6 h-6 rounded-lg shrink-0 mt-0.5", catCfg.bg)}>
                          <Icon className={cn("h-3 w-3", catCfg.colour)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono text-[var(--cs-text-muted)]">{evt.time}</span>
                            <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full", catCfg.bg, catCfg.colour)}>
                              {catCfg.label}
                            </span>
                            {evt.childName && (
                              <span className="text-[10px] font-semibold text-[var(--cs-navy)]">{evt.childName}</span>
                            )}
                            {evt.requiresFollowUp && (
                              <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                Follow-up
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed mt-1">{evt.summary}</p>
                          {evt.staffName && (
                            <span className="text-[10px] text-[var(--cs-text-muted)] mt-1 block">Staff: {evt.staffName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mood snapshots */}
            {activeSection === "moods" && (
              <div className="space-y-2">
                <div className="grid grid-cols-6 gap-2 text-[9px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider px-2">
                  <span className="col-span-2">Young Person</span>
                  <span className="text-center">AM</span>
                  <span className="text-center">PM</span>
                  <span className="text-center">Eve</span>
                  <span className="text-center">Trend</span>
                </div>
                {brief.moodSnapshots.map((ms) => (
                  <div key={ms.childName} className="grid grid-cols-6 gap-2 items-center rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50/50 px-2 py-2">
                    <span className="col-span-2 text-xs font-semibold text-[var(--cs-navy)] truncate">{ms.childName}</span>
                    <div className="flex justify-center"><MoodDot score={ms.morningMood} /></div>
                    <div className="flex justify-center"><MoodDot score={ms.afternoonMood} /></div>
                    <div className="flex justify-center"><MoodDot score={ms.eveningMood} /></div>
                    <div className="flex justify-center"><TrendIcon trend={ms.trend} /></div>
                  </div>
                ))}
                <p className="text-[10px] text-[var(--cs-text-muted)] mt-2">
                  Mood scores are self-reported (1–10) or staff-observed. Trends compare against the previous 7-day rolling average.
                </p>
              </div>
            )}

            {/* Staffing */}
            {activeSection === "staffing" && (
              <div className="space-y-2">
                {brief.staffing.map((s, i) => {
                  const sCfg = SHIFT_CONFIG[s.shift];
                  const ShiftIcon = sCfg.icon;
                  const gap = s.planned - s.actual;
                  return (
                    <div key={i} className={cn(
                      "rounded-xl border p-3",
                      gap > 0 ? "border-amber-200 bg-amber-50/50" : "border-[var(--cs-border-subtle)] bg-slate-50/50"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <ShiftIcon className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                        <span className="text-xs font-semibold text-[var(--cs-navy)]">{sCfg.label}</span>
                        <span className="text-[10px] text-[var(--cs-text-muted)]">{sCfg.hours}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-[var(--cs-text-secondary)]">
                          Planned: <strong>{s.planned}</strong>
                        </span>
                        <span className={gap > 0 ? "text-amber-700 font-semibold" : "text-[var(--cs-text-secondary)]"}>
                          Actual: <strong>{s.actual}</strong>
                        </span>
                        {gap > 0 && (
                          <span className="text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full font-semibold">
                            -{gap} staff
                          </span>
                        )}
                      </div>
                      {s.notes && <p className="text-[10px] text-[var(--cs-text-muted)] mt-1.5">{s.notes}</p>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Compliance gaps */}
            {activeSection === "compliance" && (
              <div className="space-y-2">
                {brief.complianceGaps.length === 0 ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-emerald-700">No compliance gaps identified today</p>
                  </div>
                ) : (
                  brief.complianceGaps.map((gap, i) => (
                    <div key={i} className={cn(
                      "rounded-xl border border-l-4 p-3",
                      gap.severity === "critical" ? "border-l-red-500 bg-red-50/50" : "border-l-amber-400 bg-amber-50/50"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={cn(
                          "h-3.5 w-3.5",
                          gap.severity === "critical" ? "text-red-600" : "text-amber-600"
                        )} />
                        <span className="text-xs font-semibold text-[var(--cs-navy)]">{gap.area}</span>
                        {gap.regulation && (
                          <span className="text-[9px] text-[var(--cs-text-muted)] bg-slate-100 px-1.5 py-0.5 rounded-full">{gap.regulation}</span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{gap.detail}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────

export const _testing = {
  EVENT_CATEGORY_CONFIG,
  PRIORITY_CONFIG,
  SHIFT_CONFIG,
  RAG_CONFIG,
  generateDemoBrief,
};
