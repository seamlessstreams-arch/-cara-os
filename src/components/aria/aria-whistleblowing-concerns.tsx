// ══════════════════════════════════════════════════════════════════════════════
// AriaWhistleblowingConcerns — Whistleblowing & Professional Concerns Widget
//
// Displays intelligence on whistleblowing culture, concern handling quality,
// staff protection, and outcomes/learning. Maps to CHR 2015 Reg 34, PIDA 1998,
// SCCIF leadership and management expectations.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useState } from "react";
import {
  Shield, AlertTriangle, CheckCircle2, Eye, TrendingUp,
  ChevronDown, ChevronUp, Users, Scale, FileText, Megaphone,
  BookOpen,
} from "lucide-react";
import {
  generateWhistleblowingConcernsIntelligence,
  getDemoWhistleblowingConcernsData,
  getConcernCategoryLabel,
  getConcernSeverityLabel,
} from "@/lib/whistleblowing-concerns";
import type {
  Rating,
  WhistleblowingConcernsIntelligenceResult,
} from "@/lib/whistleblowing-concerns";

// ── Config ──────────────────────────────────────────────────────────────────

const RATING_CONFIG: Record<Rating, { label: string; colour: string; bg: string }> = {
  outstanding:          { label: "Outstanding",          colour: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  good:                 { label: "Good",                 colour: "text-blue-700",    bg: "bg-blue-50 border-blue-200" },
  requires_improvement: { label: "Requires Improvement", colour: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
  inadequate:           { label: "Inadequate",           colour: "text-red-700",     bg: "bg-red-50 border-red-200" },
};

const SEVERITY_COLOUR: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high:     "bg-orange-100 text-orange-700",
  medium:   "bg-amber-100 text-amber-700",
  low:      "bg-slate-100 text-slate-600",
};

// ── Demo data loader ────────────────────────────────────────────────────────

function loadIntelligence(): WhistleblowingConcernsIntelligenceResult {
  const demo = getDemoWhistleblowingConcernsData();
  return generateWhistleblowingConcernsIntelligence(
    demo.concerns,
    demo.protections,
    demo.policy,
    demo.culture,
    "home-demo",
    "2026-01-01",
    "2026-05-18",
  );
}

// ── Component ───────────────────────────────────────────────────────────────

export function AriaWhistleblowingConcerns() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const intel = loadIntelligence();

  const ratingCfg = RATING_CONFIG[intel.rating];

  function toggle(section: string) {
    setExpandedSection((prev) => (prev === section ? null : section));
  }

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-[var(--cs-aria-gold-bg)] to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[var(--cs-aria-gold)]" />
            <h3 className="text-sm font-semibold text-[var(--cs-fg)]">
              Whistleblowing & Professional Concerns
            </h3>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${ratingCfg.bg} ${ratingCfg.colour}`}>
            {ratingCfg.label} — {intel.overallScore}/100
          </div>
        </div>
        <p className="text-xs text-[var(--cs-muted)] mt-1">
          CHR 2015 Reg 34 | PIDA 1998 | SCCIF
        </p>
      </div>

      {/* Score Breakdown */}
      <div className="px-5 py-3 grid grid-cols-4 gap-3 border-b border-[var(--cs-border)]">
        <ScoreBlock
          label="Reporting Culture"
          score={intel.reportingCulture.score}
          max={25}
          icon={<Users className="h-3.5 w-3.5" />}
        />
        <ScoreBlock
          label="Response Quality"
          score={intel.responseQuality.score}
          max={30}
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
        />
        <ScoreBlock
          label="Staff Protection"
          score={intel.staffProtection.score}
          max={25}
          icon={<Shield className="h-3.5 w-3.5" />}
        />
        <ScoreBlock
          label="Outcomes"
          score={intel.outcomesLearning.score}
          max={20}
          icon={<BookOpen className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Concerns Summary */}
      {intel.responseQuality.totalConcerns > 0 && (
        <div className="px-5 py-3 border-b border-[var(--cs-border)]">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-3.5 w-3.5 text-[var(--cs-muted)]" />
            <span className="text-xs font-medium text-[var(--cs-fg)]">
              {intel.responseQuality.totalConcerns} Concern{intel.responseQuality.totalConcerns !== 1 ? "s" : ""} This Period
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <MetricPill
              label="Ack &lt;48hrs"
              value={`${intel.responseQuality.acknowledgedWithin48HrsRate}%`}
              good={intel.responseQuality.acknowledgedWithin48HrsRate >= 90}
            />
            <MetricPill
              label="Inv &lt;7d"
              value={`${intel.responseQuality.investigationStartedRate}%`}
              good={intel.responseQuality.investigationStartedRate >= 90}
            />
            <MetricPill
              label="Res &lt;30d"
              value={`${intel.responseQuality.resolvedWithin30DaysRate}%`}
              good={intel.responseQuality.resolvedWithin30DaysRate >= 80}
            />
          </div>
        </div>
      )}

      {/* Expandable Sections */}
      <ExpandableSection
        id="strengths"
        title="Strengths"
        items={intel.strengths}
        icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
        expanded={expandedSection === "strengths"}
        onToggle={() => toggle("strengths")}
        variant="positive"
      />

      <ExpandableSection
        id="concerns"
        title="Concerns"
        items={intel.concerns}
        icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
        expanded={expandedSection === "concerns"}
        onToggle={() => toggle("concerns")}
        variant="warning"
      />

      <ExpandableSection
        id="actions"
        title="Immediate Actions"
        items={intel.immediateActions}
        icon={<Eye className="h-3.5 w-3.5 text-red-500" />}
        expanded={expandedSection === "actions"}
        onToggle={() => toggle("actions")}
        variant="action"
      />

      <ExpandableSection
        id="regulatory"
        title="Regulatory Links"
        items={intel.regulatoryLinks}
        icon={<Scale className="h-3.5 w-3.5 text-blue-500" />}
        expanded={expandedSection === "regulatory"}
        onToggle={() => toggle("regulatory")}
        variant="neutral"
      />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ScoreBlock({
  label,
  score,
  max,
  icon,
}: {
  label: string;
  score: number;
  max: number;
  icon: React.ReactNode;
}) {
  const pct = Math.round((score / max) * 100);
  const colour =
    pct >= 80 ? "text-emerald-600" :
    pct >= 60 ? "text-blue-600" :
    pct >= 40 ? "text-amber-600" :
    "text-red-600";

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-1 text-[var(--cs-muted)]">
        {icon}
      </div>
      <div className={`text-sm font-semibold ${colour}`}>
        {score}/{max}
      </div>
      <div className="text-[10px] text-[var(--cs-muted)] leading-tight mt-0.5">
        {label}
      </div>
    </div>
  );
}

function MetricPill({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <div
      className={`px-2 py-1 rounded text-center border ${
        good
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-red-50 border-red-200 text-red-700"
      }`}
    >
      <div className="font-medium">{value}</div>
      <div className="text-[10px] opacity-75">{label}</div>
    </div>
  );
}

function ExpandableSection({
  id,
  title,
  items,
  icon,
  expanded,
  onToggle,
  variant,
}: {
  id: string;
  title: string;
  items: string[];
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  variant: "positive" | "warning" | "action" | "neutral";
}) {
  if (items.length === 0) return null;

  const dotColour = {
    positive: "bg-emerald-400",
    warning: "bg-amber-400",
    action: "bg-red-400",
    neutral: "bg-blue-400",
  }[variant];

  return (
    <div className="border-b border-[var(--cs-border)] last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full px-5 py-2.5 flex items-center justify-between hover:bg-[var(--cs-hover)] transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium text-[var(--cs-fg)]">{title}</span>
          <span className="text-[10px] text-[var(--cs-muted)]">({items.length})</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-[var(--cs-muted)]" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-[var(--cs-muted)]" />
        )}
      </button>
      {expanded && (
        <ul className="px-5 pb-3 space-y-1.5">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-[var(--cs-fg)]">
              <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${dotColour}`} />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
