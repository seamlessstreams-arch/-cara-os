"use client";

// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — SESSION BUILDER
//
// Generate, browse, and manage therapeutic session plans across 35+ types.
// Sessions are grouped by category, generated with AI, reviewed, approved,
// delivered, and recorded with follow-up actions.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Sparkles, CheckCircle2, Clock, Eye, Target, Users,
  Heart, Shield, BookOpen, GraduationCap, Palette,
  MessageCircle, ChevronDown, ChevronRight,
} from "lucide-react";
import { demoSeed } from "@/lib/demo/demo-seed";

// ── Session type groups ────────────────────────────────────────────────────

interface SessionTypeGroup { group: string; icon: React.ElementType; types: { type: string; label: string }[] }

const SESSION_GROUPS: SessionTypeGroup[] = [
  { group: "Therapeutic Work", icon: Heart, types: [
    { type: "keywork_session", label: "Key Work Session" }, { type: "direct_work_session", label: "Direct Work Session" },
    { type: "life_story_work", label: "Life Story Work" }, { type: "identity_work", label: "Identity Work" }, { type: "feelings_exploration", label: "Feelings Exploration" },
  ]},
  { group: "Emotional Support", icon: Heart, types: [
    { type: "anger_management", label: "Anger Management" }, { type: "anxiety_support", label: "Anxiety Support" },
    { type: "bereavement_grief", label: "Bereavement & Grief" }, { type: "self_esteem_building", label: "Self-Esteem Building" },
    { type: "emotional_regulation", label: "Emotional Regulation" }, { type: "mindfulness_grounding", label: "Mindfulness & Grounding" },
    { type: "resilience_building", label: "Resilience Building" },
  ]},
  { group: "Relationships & Social", icon: Users, types: [
    { type: "social_skills", label: "Social Skills" }, { type: "healthy_relationships", label: "Healthy Relationships" }, { type: "consent_boundaries", label: "Consent & Boundaries" },
  ]},
  { group: "Contact & Family", icon: MessageCircle, types: [
    { type: "contact_preparation", label: "Contact Preparation" }, { type: "contact_debrief", label: "Contact Debrief" }, { type: "family_work", label: "Family Work" },
  ]},
  { group: "Safety & Wellbeing", icon: Shield, types: [
    { type: "safety_planning", label: "Safety Planning" }, { type: "return_from_missing", label: "Return from Missing" },
    { type: "exploitation_awareness", label: "Exploitation Awareness" }, { type: "online_safety", label: "Online Safety" }, { type: "substance_awareness", label: "Substance Awareness" },
  ]},
  { group: "Transitions & Independence", icon: Target, types: [
    { type: "transition_preparation", label: "Transition Preparation" }, { type: "independence_skills", label: "Independence Skills" }, { type: "leaving_care_prep", label: "Leaving Care Preparation" },
  ]},
  { group: "Education & Aspiration", icon: GraduationCap, types: [
    { type: "education_motivation", label: "Education Motivation" }, { type: "aspiration_building", label: "Aspiration Building" }, { type: "career_exploration", label: "Career Exploration" },
  ]},
  { group: "Identity", icon: Palette, types: [
    { type: "cultural_identity", label: "Cultural Identity" }, { type: "gender_identity_support", label: "Gender Identity Support" }, { type: "faith_spirituality", label: "Faith & Spirituality" },
  ]},
  { group: "Staff & Team", icon: BookOpen, types: [
    { type: "reflective_practice", label: "Reflective Practice" }, { type: "team_formulation", label: "Team Formulation" }, { type: "debrief_session", label: "Debrief Session" },
  ]},
];

// ── Demo sessions ──────────────────────────────────────────────────────────

interface DemoSession {
  id: string; title: string; session_type: string; child_name: string | null; framework: string;
  status: "draft" | "approved" | "delivered" | "recorded"; created_at: string; scheduled_date: string | null;
  content: { purpose: string; therapeutic_rationale: string; opening: string; reflective_questions: string[] };
}

const DEMO_SESSIONS: DemoSession[] = [
  {
    id: "s1", title: "Feelings Exploration — Jayden", session_type: "feelings_exploration", child_name: "Jayden", framework: "PACE",
    status: "approved", created_at: "2026-05-10T09:00:00Z", scheduled_date: "2026-05-12",
    content: {
      purpose: "Help Jayden explore and name his feelings following a cancelled family contact visit.",
      therapeutic_rationale: "Jayden's therapeutic profile indicates he struggles to express difficult emotions verbally. PACE provides a non-threatening framework for exploration.",
      opening: "Start with a feelings weather forecast: 'If your feelings were weather today, what would the forecast be?'",
      reflective_questions: ["What was that like for you?", "If you could tell the adults anything, what would it be?", "On a scale of 1-10, how big do those feelings feel right now?"],
    },
  },
  {
    id: "s2", title: "Contact Debrief — Amara", session_type: "contact_debrief", child_name: "Amara", framework: "DDP",
    status: "delivered", created_at: "2026-05-08T16:00:00Z", scheduled_date: "2026-05-09",
    content: {
      purpose: "Support Amara to process her feelings following family contact.",
      therapeutic_rationale: "Amara finds family contact emotionally intense. DDP's focus on intersubjectivity supports her to process complex feelings.",
      opening: "Offer art materials: 'Sometimes it's easier to draw what we're feeling. Want to show me?'",
      reflective_questions: ["What was the best bit?", "Was there anything hard?", "What would you like to happen next time?"],
    },
  },
  {
    id: "s3", title: "Team Reflective Practice — Contact Support", session_type: "reflective_practice", child_name: null, framework: "Psychologically Informed",
    status: "draft", created_at: "2026-05-12T08:00:00Z", scheduled_date: "2026-05-14",
    content: {
      purpose: "Team session to reflect on how we support children through family contact.",
      therapeutic_rationale: "Several children showing distress around family contact. Reflective session to share approaches and learn from each other.",
      opening: "Start with a scaling question: 'How confident are you in supporting a child before, during, and after a difficult contact visit? 1-10.'",
      reflective_questions: ["What do you find hardest about supporting contact?", "What have you noticed works well?", "What do you wish you'd been taught earlier?"],
    },
  },
];

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  delivered: "bg-blue-50 text-blue-600 border-blue-200",
  recorded: "bg-purple-50 text-purple-600 border-purple-200",
};

// ══════════════════════════════════════════════════════════════════════════════

export default function SessionBuilderPage() {
  const [sessions] = useState(demoSeed(DEMO_SESSIONS));
  const [selectedSession, setSelectedSession] = useState<string | null>(DEMO_SESSIONS[0].id);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set<string>(["Therapeutic Work"]));
  const [view, setView] = useState<"sessions" | "builder">("sessions");

  const current = sessions.find((s) => s.id === selectedSession);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  };

  return (
    <PageShell title="Session Builder" subtitle="Generate therapeutic session plans">
      <div className="space-y-6 pb-12">

        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <Sparkles className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Therapeutic Session Builder</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Generate evidence-informed session plans across 35+ types. Cara builds from the child&apos;s therapeutic profile, recent evidence, and chosen framework.
              </p>
            </div>
          </div>
        </div>

        {/* ── View toggle ────────────────────────────────────────────────── */}
        <div className="flex gap-2">
          <button onClick={() => setView("sessions")} className={cn("px-4 py-2 rounded-lg text-xs font-medium transition-all", view === "sessions" ? "bg-[var(--cs-navy)] text-white" : "bg-white border border-[var(--cs-border)] text-[var(--cs-navy)] hover:bg-[var(--cs-surface)]")}>
            Recent Sessions
          </button>
          <button onClick={() => setView("builder")} className={cn("px-4 py-2 rounded-lg text-xs font-medium transition-all", view === "builder" ? "bg-[var(--cs-navy)] text-white" : "bg-white border border-[var(--cs-border)] text-[var(--cs-navy)] hover:bg-[var(--cs-surface)]")}>
            Session Types
          </button>
        </div>

        {view === "builder" ? (
          /* ── Session Type Browser ──────────────────────────────────────── */
          <div className="space-y-3">
            {SESSION_GROUPS.map((group) => {
              const isExpanded = expandedGroups.has(group.group);
              const Icon = group.icon;
              return (
                <div key={group.group} className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
                  <button onClick={() => toggleGroup(group.group)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--cs-surface)] transition-colors">
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" /> : <ChevronRight className="h-4 w-4 text-[var(--cs-text-muted)]" />}
                    <Icon className="h-4 w-4 text-[var(--cs-cara-gold)]" />
                    <span className="text-sm font-semibold text-[var(--cs-navy)]">{group.group}</span>
                    <Badge className="text-[9px] bg-[var(--cs-surface)] text-[var(--cs-text-muted)] border-[var(--cs-border)] ml-auto">{group.types.length} types</Badge>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-3 border-t border-[var(--cs-border)]">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-3">
                        {group.types.map((t) => (
                          <button key={t.type} className="rounded-lg border border-[var(--cs-border)] p-3 text-left hover:border-[var(--cs-cara-gold-soft)] hover:bg-[var(--cs-cara-gold-bg)] transition-all group">
                            <span className="text-xs font-medium text-[var(--cs-navy)] group-hover:text-[var(--cs-navy)]">{t.label}</span>
                            <div className="flex items-center gap-1 mt-1">
                              <Sparkles className="h-3 w-3 text-[var(--cs-cara-gold)]" />
                              <span className="text-[10px] text-[var(--cs-text-muted)]">Generate</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Sessions List & Detail ────────────────────────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* List */}
            <div className="space-y-2">
              {sessions.map((s) => (
                <button key={s.id} onClick={() => setSelectedSession(s.id)}
                  className={cn("w-full rounded-xl border p-4 text-left transition-all", selectedSession === s.id ? "border-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)] ring-1 ring-[var(--cs-cara-gold-soft)]" : "border-[var(--cs-border)] bg-white hover:border-[var(--cs-cara-gold-soft)]")}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[var(--cs-navy)]">{s.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn("text-[9px] border", STATUS_STYLES[s.status])}>{s.status}</Badge>
                    <Badge className="text-[9px] bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] border-[var(--cs-cara-gold-soft)]">{s.framework}</Badge>
                    {s.scheduled_date && <span className="text-[10px] text-[var(--cs-text-muted)]">{new Date(s.scheduled_date).toLocaleDateString("en-GB")}</span>}
                  </div>
                </button>
              ))}
            </div>

            {/* Detail */}
            {current && (
              <div className="lg:col-span-2 rounded-xl border border-[var(--cs-border)] bg-white p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[var(--cs-navy)]">{current.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className={cn("text-[9px] border", STATUS_STYLES[current.status])}>{current.status}</Badge>
                    <Badge className="text-[9px] bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] border-[var(--cs-cara-gold-soft)]">{current.framework}</Badge>
                    {current.child_name && <span className="text-[10px] text-[var(--cs-text-muted)]">{current.child_name}</span>}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Purpose</p>
                    <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{current.content.purpose}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Therapeutic Rationale</p>
                    <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{current.content.therapeutic_rationale}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Opening</p>
                    <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{current.content.opening}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Reflective Questions</p>
                    {current.content.reflective_questions.map((q, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--cs-cara-gold)] mt-1.5 shrink-0" />
                        <p className="text-xs text-[var(--cs-text-secondary)]">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
