// ══════════════════════════════════════════════════════════════════════════════
// AriaPlacementTimeline — AI-curated placement event timeline
//
// Displays a chronological timeline of significant placement events for a
// young person: placement starts, LAC reviews, incidents, achievements,
// risk assessment changes, care plan updates, and key milestones. ARIA
// highlights patterns and adds contextual annotations.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useState } from "react";
import {
  Sparkles, Calendar, Home, AlertTriangle, Star, Shield,
  ClipboardCheck, Heart, BookOpen, TrendingUp, Users,
  ChevronDown, ChevronUp, MessageCircle, Award,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type EventType =
  | "placement_start"
  | "lac_review"
  | "incident"
  | "achievement"
  | "risk_change"
  | "care_plan_update"
  | "key_work"
  | "health_update"
  | "education_update"
  | "family_contact"
  | "milestone";

type EventSignificance = "high" | "medium" | "low";

interface PlacementEvent {
  id: string;
  type: EventType;
  date: string;
  title: string;
  detail: string;
  significance: EventSignificance;
  ariaNarrative?: string;
  linkedRecordType?: string;
  linkedRecordId?: string;
}

interface PlacementTimelineData {
  childName: string;
  childId: string;
  placementStart: string;
  placementDays: number;
  events: PlacementEvent[];
  ariaOverview: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; icon: React.ReactNode; colour: string; dotColour: string }> = {
  placement_start:  { label: "Placement",     icon: <Home className="h-3.5 w-3.5" />,           colour: "text-[var(--cs-navy)]",  dotColour: "bg-[var(--cs-navy)]" },
  lac_review:       { label: "LAC Review",     icon: <ClipboardCheck className="h-3.5 w-3.5" />, colour: "text-indigo-600",        dotColour: "bg-indigo-500" },
  incident:         { label: "Incident",       icon: <AlertTriangle className="h-3.5 w-3.5" />,  colour: "text-red-600",           dotColour: "bg-red-500" },
  achievement:      { label: "Achievement",    icon: <Award className="h-3.5 w-3.5" />,          colour: "text-emerald-600",       dotColour: "bg-emerald-500" },
  risk_change:      { label: "Risk Change",    icon: <Shield className="h-3.5 w-3.5" />,         colour: "text-amber-600",         dotColour: "bg-amber-500" },
  care_plan_update: { label: "Care Plan",      icon: <ClipboardCheck className="h-3.5 w-3.5" />, colour: "text-blue-600",          dotColour: "bg-blue-500" },
  key_work:         { label: "Key Work",       icon: <MessageCircle className="h-3.5 w-3.5" />,  colour: "text-purple-600",        dotColour: "bg-purple-500" },
  health_update:    { label: "Health",         icon: <Heart className="h-3.5 w-3.5" />,          colour: "text-pink-600",          dotColour: "bg-pink-500" },
  education_update: { label: "Education",      icon: <BookOpen className="h-3.5 w-3.5" />,       colour: "text-sky-600",           dotColour: "bg-sky-500" },
  family_contact:   { label: "Family Contact", icon: <Users className="h-3.5 w-3.5" />,          colour: "text-orange-600",        dotColour: "bg-orange-400" },
  milestone:        { label: "Milestone",      icon: <Star className="h-3.5 w-3.5" />,           colour: "text-[var(--cs-aria-gold)]", dotColour: "bg-[var(--cs-aria-gold)]" },
};

const SIGNIFICANCE_CONFIG: Record<EventSignificance, { ring: string }> = {
  high:   { ring: "ring-2 ring-amber-200" },
  medium: { ring: "ring-1 ring-[var(--cs-border)]" },
  low:    { ring: "" },
};

// ── Demo data ────────────────────────────────────────────────────────────────

function getDemoPlacementTimeline(): PlacementTimelineData {
  return {
    childName: "Alex W",
    childId: "yp_001",
    placementStart: "2025-09-15",
    placementDays: 239,
    ariaOverview: "Overall trajectory shows early settling followed by a behaviour escalation pattern emerging in the last 6 weeks. Key worker engagement is strong and education attendance is improving. Risk assessment review is recommended based on the recent incident pattern.",
    events: [
      {
        id: "pe_001", type: "placement_start", date: "2025-09-15",
        title: "Placement commenced at Oak House",
        detail: "Admitted following placement breakdown. Initial risk assessment completed.",
        significance: "high",
      },
      {
        id: "pe_002", type: "care_plan_update", date: "2025-09-22",
        title: "Initial care plan created",
        detail: "Care plan developed with social worker. Key targets: school re-engagement, behaviour support, family contact.",
        significance: "medium",
      },
      {
        id: "pe_003", type: "key_work", date: "2025-10-10",
        title: "First key work session",
        detail: "Positive engagement. Expressed wishes about school and contact with mother.",
        significance: "medium",
        ariaNarrative: "Early engagement with key worker is a positive indicator for placement stability.",
      },
      {
        id: "pe_004", type: "lac_review", date: "2025-11-20",
        title: "First LAC review",
        detail: "Care plan progressing. Education placement secured. Good settling period noted by all professionals.",
        significance: "high",
      },
      {
        id: "pe_005", type: "education_update", date: "2025-12-05",
        title: "Started attending new school",
        detail: "Enrolled at Meadow Park Academy. Initial settling week went well.",
        significance: "medium",
      },
      {
        id: "pe_006", type: "achievement", date: "2026-01-15",
        title: "Completed first full term at school",
        detail: "86% attendance in first term. Positive report from school.",
        significance: "medium",
        ariaNarrative: "Strong educational engagement in first term — positive evidence for Reg 45 report.",
      },
      {
        id: "pe_007", type: "milestone", date: "2026-02-15",
        title: "6-month placement milestone",
        detail: "Successfully completed 6 months in placement. No disruptions.",
        significance: "high",
        ariaNarrative: "6-month milestone with no placement disruptions is strong evidence of stability.",
      },
      {
        id: "pe_008", type: "incident", date: "2026-04-28",
        title: "Incident — verbal altercation with peer",
        detail: "Argument with Casey T over shared space. De-escalated by staff. No physical intervention.",
        significance: "medium",
      },
      {
        id: "pe_009", type: "incident", date: "2026-05-05",
        title: "Incident — refusal and property damage",
        detail: "Refused to attend school. Kicked bedroom door causing minor damage.",
        significance: "high",
        ariaNarrative: "Second incident within 7 days — ARIA flags escalation pattern for risk review.",
      },
      {
        id: "pe_010", type: "risk_change", date: "2026-05-06",
        title: "Risk level increased: Behaviour",
        detail: "Behaviour risk increased from Low to Medium following incident pattern.",
        significance: "high",
      },
      {
        id: "pe_011", type: "incident", date: "2026-05-10",
        title: "Incident — peer conflict escalation",
        detail: "Physical altercation with peer. Brief restraint used (2 minutes). No injuries.",
        significance: "high",
        ariaNarrative: "Third incident in 12 days with physical intervention. Behaviour support plan review urgently recommended.",
      },
      {
        id: "pe_012", type: "key_work", date: "2026-05-12",
        title: "Key work session — exploring triggers",
        detail: "Discussed recent incidents. Identified anxiety about upcoming LAC review as potential trigger.",
        significance: "medium",
        ariaNarrative: "Key worker has identified a potential underlying trigger — this is important context for the behaviour support plan update.",
      },
    ],
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export function AriaPlacementTimeline() {
  const [showAll, setShowAll] = useState(false);
  const data = getDemoPlacementTimeline();

  const displayEvents = showAll ? data.events : data.events.slice(-8);
  const hiddenCount = data.events.length - 8;

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-[var(--cs-aria-gold-bg)] to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[var(--cs-aria-gold-soft)] rounded-lg">
              <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Placement Timeline — {data.childName}</h3>
              <p className="text-[10px] text-[var(--cs-text-muted)]">
                Placed {new Date(data.placementStart + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {data.placementDays} days
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--cs-text-muted)]">
            <Calendar className="h-3 w-3" />
            {data.events.length} events
          </div>
        </div>
      </div>

      {/* ARIA overview */}
      <div className="px-4 py-3 border-b border-[var(--cs-border)] bg-[var(--cs-aria-gold-bg)]/30">
        <div className="flex items-start gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[var(--cs-aria-gold)] mt-0.5 shrink-0" />
          <p className="text-[11px] text-[var(--cs-text-secondary)]">{data.ariaOverview}</p>
        </div>
      </div>

      {/* Show earlier events toggle */}
      {hiddenCount > 0 && !showAll && (
        <button
          className="w-full px-4 py-2 text-xs text-[var(--cs-text-secondary)] hover:text-[var(--cs-navy)] transition-colors border-b border-[var(--cs-border)] flex items-center justify-center gap-1"
          onClick={() => setShowAll(true)}
        >
          <ChevronUp className="h-3.5 w-3.5" />
          Show {hiddenCount} earlier events
        </button>
      )}

      {/* Timeline */}
      <div className="relative px-4 py-3">
        {/* Vertical line */}
        <div className="absolute left-[27px] top-3 bottom-3 w-px bg-[var(--cs-border)]" />

        <div className="space-y-0">
          {displayEvents.map((event, idx) => {
            const cfg = EVENT_TYPE_CONFIG[event.type];
            const sigCfg = SIGNIFICANCE_CONFIG[event.significance];
            const isLast = idx === displayEvents.length - 1;

            return (
              <div key={event.id} className={`relative flex items-start gap-3 ${isLast ? "" : "pb-4"}`}>
                {/* Dot */}
                <div className={`relative z-10 w-3 h-3 rounded-full ${cfg.dotColour} shrink-0 mt-1 ${sigCfg.ring}`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`${cfg.colour}`}>{cfg.icon}</span>
                    <span className="text-xs font-medium text-[var(--cs-navy)]">{event.title}</span>
                    <span className="text-[9px] text-[var(--cs-text-gentle)] tabular-nums">
                      {new Date(event.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">{event.detail}</p>

                  {event.ariaNarrative && (
                    <div className="mt-1.5 rounded-lg bg-[var(--cs-aria-gold-bg)] border border-[var(--cs-aria-gold-soft)] px-2.5 py-1.5">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Sparkles className="h-2.5 w-2.5 text-[var(--cs-aria-gold)]" />
                        <span className="text-[9px] font-semibold text-[var(--cs-navy)]">ARIA</span>
                      </div>
                      <p className="text-[10px] text-[var(--cs-text-secondary)]">{event.ariaNarrative}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Collapse */}
      {showAll && hiddenCount > 0 && (
        <button
          className="w-full px-4 py-2 text-xs text-[var(--cs-text-secondary)] hover:text-[var(--cs-navy)] transition-colors border-t border-[var(--cs-border)] flex items-center justify-center gap-1"
          onClick={() => setShowAll(false)}
        >
          <ChevronDown className="h-3.5 w-3.5" />
          Show recent only
        </button>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--cs-border)] bg-slate-50/50">
        <p className="text-[10px] text-[var(--cs-text-muted)] text-center">
          Timeline curated from care records. ARIA annotations highlight patterns — always verify with professional judgement.
        </p>
      </div>
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────

export const _testing = { EVENT_TYPE_CONFIG, SIGNIFICANCE_CONFIG, getDemoPlacementTimeline };
