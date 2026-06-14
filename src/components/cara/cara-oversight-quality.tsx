"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — MANAGEMENT OVERSIGHT QUALITY CHECKER
// Scores management oversight entries against Ofsted's quality dimensions:
// Reflective Analysis, Child Focus, Professional Challenge, Decision Clarity,
// and Action Specificity.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import {
  Brain, ChevronDown, ChevronUp, Sparkles, Shield,
  AlertTriangle, CheckCircle2, Target, Eye, Gavel,
  MessageSquare, ListChecks, TrendingUp, Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type OversightDimension =
  | "reflectiveAnalysis"
  | "childFocus"
  | "professionalChallenge"
  | "decisionClarity"
  | "actionSpecificity";

interface OversightScore {
  overall: number;
  reflectiveAnalysis: number;
  childFocus: number;
  professionalChallenge: number;
  decisionClarity: number;
  actionSpecificity: number;
  flags: OversightFlag[];
}

interface OversightFlag {
  dimension: OversightDimension;
  severity: "critical" | "warning" | "suggestion";
  message: string;
}

interface OversightSuggestion {
  dimension: OversightDimension;
  text: string;
  priority: "high" | "medium" | "low";
}

interface OversightQualityProps {
  /** The oversight text to analyse */
  oversightText: string;
  /** Context about what the oversight relates to */
  recordType?: "incident" | "daily_log" | "safeguarding" | "complaint" | "missing" | "general";
  /** The record reference for display */
  recordReference?: string;
  /** Callback when user requests Cara improvement */
  onRequestImprovement?: (suggestions: OversightSuggestion[]) => void;
  /** Optional className */
  className?: string;
}

// ── Dimension config ─────────────────────────────────────────────────────────

const DIMENSION_CONFIG: Record<OversightDimension, {
  label: string;
  icon: React.ElementType;
  description: string;
  colour: string;
  bg: string;
}> = {
  reflectiveAnalysis: {
    label: "Reflective Analysis",
    icon: Brain,
    description: "Does the oversight go beyond surface-level description to analyse why events occurred and what they mean for the child?",
    colour: "text-purple-600",
    bg: "bg-purple-50",
  },
  childFocus: {
    label: "Child Focus",
    icon: Eye,
    description: "Is the child at the centre of the oversight? Does it reference the child's voice, experience, and impact?",
    colour: "text-blue-600",
    bg: "bg-blue-50",
  },
  professionalChallenge: {
    label: "Professional Challenge",
    icon: Gavel,
    description: "Does the oversight constructively challenge practice, question decisions, and identify what could be done differently?",
    colour: "text-amber-600",
    bg: "bg-amber-50",
  },
  decisionClarity: {
    label: "Decision Clarity",
    icon: Target,
    description: "Are management decisions clearly stated with rationale? Can the reader understand what was decided and why?",
    colour: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  actionSpecificity: {
    label: "Action Specificity",
    icon: ListChecks,
    description: "Are follow-up actions specific, measurable, assigned to someone, and time-bound (SMART)?",
    colour: "text-rose-600",
    bg: "bg-rose-50",
  },
};

const DIMENSION_ORDER: OversightDimension[] = [
  "reflectiveAnalysis",
  "childFocus",
  "professionalChallenge",
  "decisionClarity",
  "actionSpecificity",
];

// ── Detection patterns ───────────────────────────────────────────────────────

const REFLECTIVE_PHRASES = [
  "this suggests", "this indicates", "on reflection", "looking at this more broadly",
  "the pattern here", "what this tells us", "in my assessment", "having considered",
  "the significance of", "this raises questions about", "i am satisfied that",
  "my analysis", "i have reflected on", "it is important to note",
  "upon review", "critically", "the evidence suggests",
];

const CHILD_FOCUS_PHRASES = [
  "child's voice", "child's experience", "child's perspective", "impact on",
  "how this affects", "what this means for", "the child felt", "the child said",
  "the child's wishes", "the child expressed", "child's wellbeing", "child's safety",
  "the young person", "their needs", "their feelings", "their views",
  "in their best interest", "child-centred", "from the child's point of view",
];

const CHALLENGE_PHRASES = [
  "i have challenged", "i questioned", "i am not satisfied", "this needs to improve",
  "i expect", "this is not acceptable", "the standard required", "i have asked",
  "what could have been done differently", "the gap here is", "this falls short",
  "i need to see", "improvement is required", "i have directed", "my expectation",
  "further action is needed", "this does not meet", "i am concerned that",
];

const DECISION_PHRASES = [
  "i have decided", "my decision is", "the decision was", "it was agreed",
  "the rationale for", "because", "the reason for this", "on balance",
  "having weighed", "the most appropriate course", "i am directing",
  "i have authorised", "i have approved", "the plan is to", "i have concluded",
];

const ACTION_PATTERNS = [
  /(?:by|before|within|deadline|due)\s+\d/i,
  /\b(?:action|task|step)\b.*\b(?:assigned|given|for)\b/i,
  /\bwill\s+(?:complete|ensure|carry out|arrange|review|update|submit)\b/i,
  /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/,
  /\b(?:immediately|within \d+ (?:day|hour|week))/i,
  /\b(?:named|responsible|accountable|lead)\b/i,
];

// ── Scoring functions ────────────────────────────────────────────────────────

function countPhraseMatches(text: string, phrases: string[]): number {
  const lower = text.toLowerCase();
  return phrases.filter((p) => lower.includes(p)).length;
}

function countPatternMatches(text: string, patterns: RegExp[]): number {
  return patterns.filter((p) => p.test(text)).length;
}

function computeOversightScore(text: string): OversightScore {
  if (!text || text.trim().length < 10) {
    return {
      overall: 0,
      reflectiveAnalysis: 0,
      childFocus: 0,
      professionalChallenge: 0,
      decisionClarity: 0,
      actionSpecificity: 0,
      flags: [{ dimension: "reflectiveAnalysis", severity: "critical", message: "Oversight text is too short to be meaningful." }],
    };
  }

  const wordCount = text.split(/\s+/).length;
  const sentenceCount = Math.max(1, text.split(/[.!?]+/).filter(Boolean).length);

  // Reflective Analysis: phrase matches + depth indicators
  const reflectiveMatches = countPhraseMatches(text, REFLECTIVE_PHRASES);
  const reflectiveRatio = Math.min(reflectiveMatches / 3, 1);
  const hasDepth = wordCount > 80;
  const reflectiveAnalysis = Math.min(100, Math.round(
    reflectiveRatio * 60 + (hasDepth ? 25 : wordCount > 40 ? 15 : 5) + (sentenceCount > 3 ? 15 : 5)
  ));

  // Child Focus: child-related phrases
  const childMatches = countPhraseMatches(text, CHILD_FOCUS_PHRASES);
  const childRatio = Math.min(childMatches / 3, 1);
  const childFocus = Math.min(100, Math.round(
    childRatio * 70 + (childMatches > 0 ? 20 : 0) + (wordCount > 60 ? 10 : 0)
  ));

  // Professional Challenge: challenge phrases
  const challengeMatches = countPhraseMatches(text, CHALLENGE_PHRASES);
  const challengeRatio = Math.min(challengeMatches / 2, 1);
  const professionalChallenge = Math.min(100, Math.round(
    challengeRatio * 70 + (challengeMatches > 0 ? 20 : 0) + (hasDepth ? 10 : 0)
  ));

  // Decision Clarity: decision-related phrases
  const decisionMatches = countPhraseMatches(text, DECISION_PHRASES);
  const decisionRatio = Math.min(decisionMatches / 2, 1);
  const decisionClarity = Math.min(100, Math.round(
    decisionRatio * 70 + (decisionMatches > 0 ? 20 : 0) + (sentenceCount > 2 ? 10 : 0)
  ));

  // Action Specificity: SMART-like patterns
  const actionMatches = countPatternMatches(text, ACTION_PATTERNS);
  const actionRatio = Math.min(actionMatches / 3, 1);
  const actionSpecificity = Math.min(100, Math.round(
    actionRatio * 70 + (actionMatches > 0 ? 20 : 0) + (actionMatches >= 3 ? 10 : 0)
  ));

  // Flags
  const flags: OversightFlag[] = [];

  if (wordCount < 30) {
    flags.push({ dimension: "reflectiveAnalysis", severity: "critical", message: "Oversight is very brief — unlikely to demonstrate sufficient analysis." });
  }
  if (childMatches === 0) {
    flags.push({ dimension: "childFocus", severity: "warning", message: "No reference to the child's voice, experience, or impact found." });
  }
  if (challengeMatches === 0 && wordCount > 30) {
    flags.push({ dimension: "professionalChallenge", severity: "warning", message: "No evidence of professional challenge or questioning of practice." });
  }
  if (decisionMatches === 0 && wordCount > 30) {
    flags.push({ dimension: "decisionClarity", severity: "warning", message: "No clear management decision or rationale identified." });
  }
  if (actionMatches === 0) {
    flags.push({ dimension: "actionSpecificity", severity: "warning", message: "No specific, time-bound actions identified." });
  }

  // Weighted overall (Ofsted weight: child focus and reflective analysis highest)
  const overall = Math.round(
    reflectiveAnalysis * 0.25 +
    childFocus * 0.25 +
    professionalChallenge * 0.20 +
    decisionClarity * 0.15 +
    actionSpecificity * 0.15
  );

  return {
    overall,
    reflectiveAnalysis,
    childFocus,
    professionalChallenge,
    decisionClarity,
    actionSpecificity,
    flags,
  };
}

function generateSuggestions(score: OversightScore): OversightSuggestion[] {
  const suggestions: OversightSuggestion[] = [];

  if (score.reflectiveAnalysis < 50) {
    suggestions.push({
      dimension: "reflectiveAnalysis",
      text: "Add reflective analysis — explain what the events mean for the child and what patterns or themes you observe.",
      priority: "high",
    });
  }
  if (score.childFocus < 50) {
    suggestions.push({
      dimension: "childFocus",
      text: "Include the child's voice — reference what the child said, felt, or experienced. Show the oversight is child-centred.",
      priority: "high",
    });
  }
  if (score.professionalChallenge < 50) {
    suggestions.push({
      dimension: "professionalChallenge",
      text: "Add professional challenge — note what could have been done differently or where practice needs to improve.",
      priority: "medium",
    });
  }
  if (score.decisionClarity < 50) {
    suggestions.push({
      dimension: "decisionClarity",
      text: "State your decision clearly with rationale — explain what you have decided and why.",
      priority: "medium",
    });
  }
  if (score.actionSpecificity < 50) {
    suggestions.push({
      dimension: "actionSpecificity",
      text: "Make actions SMART — assign each action to a named person with a specific deadline.",
      priority: "high",
    });
  }

  return suggestions.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return p[a.priority] - p[b.priority];
  });
}

// ── Score grade helpers ──────────────────────────────────────────────────────

function getGrade(score: number): { label: string; colour: string; bg: string } {
  if (score >= 80) return { label: "Outstanding", colour: "text-emerald-700", bg: "bg-emerald-50" };
  if (score >= 60) return { label: "Good", colour: "text-blue-700", bg: "bg-blue-50" };
  if (score >= 40) return { label: "Requires Improvement", colour: "text-amber-700", bg: "bg-amber-50" };
  return { label: "Inadequate", colour: "text-red-700", bg: "bg-red-50" };
}

function getBarColour(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

// ── Component ────────────────────────────────────────────────────────────────

export function CaraOversightQuality({
  oversightText,
  recordType = "general",
  recordReference,
  onRequestImprovement,
  className,
}: OversightQualityProps) {
  const [expanded, setExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const score = useMemo(() => computeOversightScore(oversightText), [oversightText]);
  const suggestions = useMemo(() => generateSuggestions(score), [score]);
  const grade = getGrade(score.overall);

  if (!oversightText || oversightText.trim().length < 5) return null;

  const criticalFlags = score.flags.filter((f) => f.severity === "critical");
  const warningFlags = score.flags.filter((f) => f.severity === "warning");

  return (
    <div className={cn("rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden cara-magic-in", className)}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 cs-transition-fast"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--cs-cara-gold-bg)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--cs-cara-gold)]" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--cs-navy)]">
                Oversight Quality Check
              </span>
              {recordReference && (
                <span className="text-[10px] text-[var(--cs-text-muted)]">· {recordReference}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", grade.bg, grade.colour)}>
                {grade.label}
              </span>
              <span className="text-[10px] text-[var(--cs-text-muted)]">
                Overall: {score.overall}/100
              </span>
              {criticalFlags.length > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-red-600">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {criticalFlags.length} critical
                </span>
              )}
              {warningFlags.length > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {warningFlags.length} warning{warningFlags.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mini bar chart */}
          <div className="hidden sm:flex items-end gap-0.5 h-5">
            {DIMENSION_ORDER.map((dim) => (
              <div key={dim} className="w-1.5 bg-slate-100 rounded-full overflow-hidden" style={{ height: 20 }}>
                <div
                  className={cn("w-full rounded-full cs-transition", getBarColour(score[dim]))}
                  style={{ height: `${score[dim]}%`, marginTop: `${100 - score[dim]}%` }}
                />
              </div>
            ))}
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[var(--cs-border-subtle)] px-4 py-3 space-y-3">
          {/* Overall ring + grade */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
                  strokeDasharray={`${score.overall * 0.974} 100`}
                  strokeLinecap="round"
                  className={score.overall >= 80 ? "text-emerald-500" : score.overall >= 60 ? "text-blue-500" : score.overall >= 40 ? "text-amber-500" : "text-red-500"}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-[var(--cs-navy)]">{score.overall}</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-[var(--cs-navy)]">
                {grade.label} — aligned to Ofsted judgement descriptors
              </p>
              <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5 leading-relaxed">
                Scored against 5 dimensions: reflective analysis, child focus, professional challenge, decision clarity, and action specificity. Weights reflect Ofsted inspection priorities.
              </p>
            </div>
          </div>

          {/* Dimension breakdown */}
          <div className="space-y-2">
            {DIMENSION_ORDER.map((dim) => {
              const cfg = DIMENSION_CONFIG[dim];
              const dimScore = score[dim];
              const Icon = cfg.icon;
              const dimGrade = getGrade(dimScore);
              const dimFlags = score.flags.filter((f) => f.dimension === dim);

              return (
                <div key={dim} className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50/50 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={cn("flex items-center justify-center w-5 h-5 rounded-md", cfg.bg)}>
                        <Icon className={cn("h-3 w-3", cfg.colour)} />
                      </div>
                      <span className="text-xs font-semibold text-[var(--cs-navy)]">{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", dimGrade.bg, dimGrade.colour)}>
                        {dimScore}/100
                      </span>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={cn("h-full rounded-full cara-score-reveal", getBarColour(dimScore))}
                      style={{ width: `${dimScore}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-[var(--cs-text-muted)] leading-relaxed">{cfg.description}</p>

                  {/* Dimension flags */}
                  {dimFlags.map((flag, i) => (
                    <div key={i} className={cn(
                      "mt-1.5 flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-[10px]",
                      flag.severity === "critical" ? "bg-red-50 text-red-700" :
                      flag.severity === "warning" ? "bg-amber-50 text-amber-700" :
                      "bg-blue-50 text-blue-700"
                    )}>
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>{flag.message}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[var(--cs-cara-gold)] hover:text-[var(--cs-cara-gold)]/80 cs-transition-fast"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                {showSuggestions ? "Hide" : "Show"} {suggestions.length} improvement suggestion{suggestions.length > 1 ? "s" : ""}
              </button>

              {showSuggestions && (
                <div className="mt-2 space-y-1.5">
                  {suggestions.map((s, i) => {
                    const cfg = DIMENSION_CONFIG[s.dimension];
                    return (
                      <div key={i} className="flex items-start gap-2 rounded-lg border border-[var(--cs-border-subtle)] bg-white p-2.5">
                        <div className={cn("flex items-center justify-center w-4 h-4 rounded shrink-0 mt-0.5", cfg.bg)}>
                          <cfg.icon className={cn("h-2.5 w-2.5", cfg.colour)} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-semibold text-[var(--cs-navy)]">{cfg.label}</span>
                            <span className={cn(
                              "text-[9px] font-medium px-1 py-0.5 rounded-full",
                              s.priority === "high" ? "bg-red-100 text-red-700" :
                              s.priority === "medium" ? "bg-amber-100 text-amber-700" :
                              "bg-slate-100 text-[var(--cs-text-secondary)]"
                            )}>
                              {s.priority}
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--cs-text-secondary)] leading-relaxed">{s.text}</p>
                        </div>
                      </div>
                    );
                  })}

                  {onRequestImprovement && (
                    <button
                      onClick={() => onRequestImprovement(suggestions)}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--cs-cara-gold)] hover:bg-[var(--cs-cara-gold-soft)] cs-transition-fast"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Ask Cara to improve this oversight
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Ofsted alignment note */}
          <div className="rounded-xl border border-[var(--cs-border)] bg-slate-50 p-3 flex items-start gap-2">
            <Shield className="h-3.5 w-3.5 text-[var(--cs-text-muted)] mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-0.5">
                Ofsted Alignment
              </p>
              <p className="text-[10px] text-[var(--cs-text-muted)] leading-relaxed">
                Scored against the Social Care Common Inspection Framework (SCCIF). Outstanding oversight demonstrates reflective analysis, keeps the child at the centre, includes professional challenge, makes clear decisions with rationale, and sets specific actions with deadlines.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────

export const _testing = {
  DIMENSION_CONFIG,
  DIMENSION_ORDER,
  computeOversightScore,
  generateSuggestions,
  getGrade,
  REFLECTIVE_PHRASES,
  CHILD_FOCUS_PHRASES,
  CHALLENGE_PHRASES,
  DECISION_PHRASES,
  ACTION_PATTERNS,
};
