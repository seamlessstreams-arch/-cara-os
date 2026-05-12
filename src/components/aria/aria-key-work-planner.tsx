// ══════════════════════════════════════════════════════════════════════════════
// AriaKeyWorkPlanner — AI-suggested key work session planning
//
// Generates session topic suggestions based on recent care events, risk
// levels, and voice-of-child requirements. Includes age-appropriate
// questions, regulatory evidence mapping, and session prep checklists.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useState } from "react";
import {
  Sparkles, MessageCircle, Heart, Shield, BookOpen,
  AlertTriangle, CheckCircle2, Star, Users, Home,
  ChevronDown, ChevronUp, Lightbulb, Target,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type TopicPriority = "essential" | "recommended" | "optional";
type TopicSource = "risk_assessment" | "incident" | "care_plan" | "regulation" | "positive_practice" | "voice_of_child";

interface SessionTopic {
  id: string;
  title: string;
  description: string;
  priority: TopicPriority;
  source: TopicSource;
  suggestedQuestions: string[];
  evidenceFor: string[];
  timeEstimate: number; // minutes
}

interface KeyWorkPlan {
  childName: string;
  childId: string;
  lastSessionDate: string;
  daysSinceLastSession: number;
  suggestedTopics: SessionTopic[];
  prepChecklist: string[];
  regulatoryContext: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<TopicPriority, { label: string; colour: string; bg: string; dot: string }> = {
  essential:    { label: "Essential",    colour: "text-red-700",     bg: "bg-red-50 border-red-200",     dot: "bg-red-500" },
  recommended:  { label: "Recommended",  colour: "text-amber-700",   bg: "bg-amber-50 border-amber-200", dot: "bg-amber-400" },
  optional:     { label: "Optional",     colour: "text-blue-700",    bg: "bg-blue-50 border-blue-200",   dot: "bg-blue-400" },
};

const SOURCE_CONFIG: Record<TopicSource, { label: string; icon: React.ReactNode }> = {
  risk_assessment:  { label: "Risk Assessment", icon: <Shield className="h-3 w-3" /> },
  incident:         { label: "Incident",        icon: <AlertTriangle className="h-3 w-3" /> },
  care_plan:        { label: "Care Plan",       icon: <Target className="h-3 w-3" /> },
  regulation:       { label: "Regulation",      icon: <BookOpen className="h-3 w-3" /> },
  positive_practice:{ label: "Good Practice",   icon: <Star className="h-3 w-3" /> },
  voice_of_child:   { label: "Voice of Child",  icon: <MessageCircle className="h-3 w-3" /> },
};

// ── Demo data ────────────────────────────────────────────────────────────────

function getDemoKeyWorkPlan(): KeyWorkPlan {
  return {
    childName: "Alex W",
    childId: "yp_001",
    lastSessionDate: "2026-04-28",
    daysSinceLastSession: 14,
    regulatoryContext: "Reg 6 requires children are enabled to express views about their care. Reg 14 requires key work to evidence care plan progress. ARIA has identified 3 priority topics based on recent events.",
    prepChecklist: [
      "Review recent incident reports (3 in last 14 days)",
      "Check current behaviour support plan targets",
      "Read last LAC review outcomes",
      "Prepare activity-based engagement options",
      "Ensure private, comfortable space is available",
      "Allow 45-60 minutes for session",
    ],
    suggestedTopics: [
      {
        id: "kt_001",
        title: "Recent behaviour and feelings",
        description: "Explore what has been happening from the young person's perspective following 3 recent incidents.",
        priority: "essential",
        source: "incident",
        suggestedQuestions: [
          "Things have been a bit tricky recently — what has been going on for you?",
          "When you feel frustrated, what helps you feel calmer?",
          "Is there anything about living here that is making things harder for you right now?",
          "What could staff do differently to help when things feel tough?",
        ],
        evidenceFor: ["Reg 6 — voice of child", "Reg 12 — protection", "Behaviour support plan"],
        timeEstimate: 15,
      },
      {
        id: "kt_002",
        title: "Upcoming LAC review preparation",
        description: "Key worker session identified anxiety about the upcoming LAC review as a potential trigger for recent behaviour.",
        priority: "essential",
        source: "care_plan",
        suggestedQuestions: [
          "Your review meeting is coming up — how are you feeling about it?",
          "Is there anything you would like to say at your review?",
          "Would you like to attend the meeting, or would you prefer someone to share your views?",
          "What would you like to change about your care plan?",
        ],
        evidenceFor: ["Reg 6 — views and wishes", "Reg 14 — care planning", "LAC review preparation"],
        timeEstimate: 10,
      },
      {
        id: "kt_003",
        title: "School and education",
        description: "Attendance has dropped from 86% to 72% this month. Explore what is happening at school.",
        priority: "recommended",
        source: "risk_assessment",
        suggestedQuestions: [
          "How are things going at school at the moment?",
          "Is there anything making it harder to go to school?",
          "What do you enjoy most about school?",
          "Is there anything we can do to help with school?",
        ],
        evidenceFor: ["Reg 7 — education standard", "Care plan target: school engagement"],
        timeEstimate: 10,
      },
      {
        id: "kt_004",
        title: "Relationships and friendships",
        description: "Recent peer conflict suggests exploration of friendship dynamics may be valuable.",
        priority: "recommended",
        source: "incident",
        suggestedQuestions: [
          "How are you getting on with the other young people here?",
          "Do you have friends outside of here that you see?",
          "Is there anyone you find it difficult to get along with?",
          "What makes a good friendship?",
        ],
        evidenceFor: ["Reg 10 — positive relationships", "Reg 8 — enjoyment and achievement"],
        timeEstimate: 10,
      },
      {
        id: "kt_005",
        title: "Wishes and feelings update",
        description: "Monthly wishes-and-feelings record due. Last recorded 28 Apr.",
        priority: "recommended",
        source: "voice_of_child",
        suggestedQuestions: [
          "If you could change one thing about living here, what would it be?",
          "What are you most looking forward to?",
          "Is there anything you are worried about?",
          "What do you think is going really well for you right now?",
        ],
        evidenceFor: ["Reg 6 — voice of child", "Reg 45 — quality of care review"],
        timeEstimate: 10,
      },
      {
        id: "kt_006",
        title: "Achievements and strengths",
        description: "Positive practice: discuss recent achievements to build self-esteem and placement positivity.",
        priority: "optional",
        source: "positive_practice",
        suggestedQuestions: [
          "What are you most proud of recently?",
          "What are you really good at?",
          "Is there something new you would like to try?",
        ],
        evidenceFor: ["Reg 8 — enjoyment and achievement", "Positive reinforcement"],
        timeEstimate: 5,
      },
    ],
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export function AriaKeyWorkPlanner() {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const plan = getDemoKeyWorkPlan();

  const totalTime = plan.suggestedTopics.reduce((sum, t) => sum + t.timeEstimate, 0);
  const essentialCount = plan.suggestedTopics.filter((t) => t.priority === "essential").length;

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
              <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Key Work Session Planner — {plan.childName}</h3>
              <p className="text-[10px] text-[var(--cs-text-muted)]">
                Last session: {plan.daysSinceLastSession} days ago · Est. {totalTime} mins
              </p>
            </div>
          </div>
          {plan.daysSinceLastSession > 14 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
              Overdue
            </span>
          )}
        </div>
      </div>

      {/* ARIA context */}
      <div className="px-4 py-3 border-b border-[var(--cs-border)] bg-[var(--cs-aria-gold-bg)]/30">
        <div className="flex items-start gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[var(--cs-aria-gold)] mt-0.5 shrink-0" />
          <p className="text-[11px] text-[var(--cs-text-secondary)]">{plan.regulatoryContext}</p>
        </div>
      </div>

      {/* Prep checklist toggle */}
      <button
        className="w-full px-4 py-2.5 flex items-center gap-1.5 text-xs text-[var(--cs-text-secondary)] hover:text-[var(--cs-navy)] transition-colors border-b border-[var(--cs-border)]"
        onClick={() => setShowChecklist(!showChecklist)}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className="font-medium">Session Prep Checklist</span>
        <span className="text-[var(--cs-text-muted)]">({plan.prepChecklist.length} items)</span>
        {showChecklist ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
      </button>

      {showChecklist && (
        <div className="px-4 py-3 border-b border-[var(--cs-border)] bg-slate-50/50 space-y-1.5 animate-fade-in">
          {plan.prepChecklist.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] text-[var(--cs-text-secondary)]">
              <div className="w-4 h-4 rounded border border-[var(--cs-border)] bg-white shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* Topics */}
      <div className="divide-y divide-[var(--cs-border)]">
        {plan.suggestedTopics.map((topic) => {
          const pCfg = PRIORITY_CONFIG[topic.priority];
          const sCfg = SOURCE_CONFIG[topic.source];
          const isOpen = expandedTopic === topic.id;

          return (
            <div key={topic.id}>
              <button
                className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-slate-50/50 transition-colors"
                onClick={() => setExpandedTopic(isOpen ? null : topic.id)}
              >
                <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${pCfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-[var(--cs-navy)]">{topic.title}</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${pCfg.bg} ${pCfg.colour}`}>
                      {pCfg.label}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] text-[var(--cs-text-gentle)]">
                      {sCfg.icon} {sCfg.label}
                    </span>
                  </div>
                  {!isOpen && (
                    <p className="text-[11px] text-[var(--cs-text-muted)] line-clamp-1 mt-0.5">{topic.description}</p>
                  )}
                </div>
                <span className="text-[10px] text-[var(--cs-text-gentle)] shrink-0 tabular-nums">{topic.timeEstimate}m</span>
                <span className="text-[var(--cs-text-muted)] shrink-0">
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-3 pl-9 space-y-2.5 animate-fade-in">
                  <p className="text-[11px] text-[var(--cs-text-secondary)]">{topic.description}</p>

                  {/* Suggested questions */}
                  <div>
                    <div className="flex items-center gap-1 mb-1.5">
                      <Lightbulb className="h-3 w-3 text-[var(--cs-aria-gold)]" />
                      <span className="text-[10px] font-semibold text-[var(--cs-navy)]">Suggested Questions</span>
                    </div>
                    <div className="space-y-1">
                      {topic.suggestedQuestions.map((q, i) => (
                        <div key={i} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-[var(--cs-text-secondary)] border border-[var(--cs-border-subtle)]">
                          {q}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Evidence mapping */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] text-[var(--cs-text-gentle)]">Evidence for:</span>
                    {topic.evidenceFor.map((ef, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-blue-50 text-[9px] text-blue-700 border border-blue-100">
                        {ef}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--cs-border)] bg-slate-50/50">
        <p className="text-[10px] text-[var(--cs-text-muted)] text-center">
          Topics suggested based on recent events, risk assessments, and care plan targets. Adapt questions to the session flow.
        </p>
      </div>
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────

export const _testing = { PRIORITY_CONFIG, SOURCE_CONFIG, getDemoKeyWorkPlan };
