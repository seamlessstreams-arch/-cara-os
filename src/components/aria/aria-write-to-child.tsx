// ══════════════════════════════════════════════════════════════════════════════
// AriaWriteToChild — Trauma-informed "Writing to the Child" generator
//
// Creates child-understandable versions of management oversight, incident
// records, complaints, missing-from-care returns, and session summaries.
// Aligns with ARC (Attachment, Regulation, Competency), PACE (Playfulness,
// Acceptance, Curiosity, Empathy), relational safeguarding, and Ofsted
// readiness. Every output goes through a Child Lens Check before commit.
//
// Dual output mode: management version + child-friendly version
// Full audit trail for Reg 44, Reg 45, and internal QA
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useState, useCallback } from "react";
import {
  Sparkles, Heart, MessageCircle, Shield, AlertTriangle,
  CheckCircle2, Edit3, Eye, Copy, ChevronDown, ChevronUp,
  BookOpen, Users, FileText, Loader2, RotateCcw,
  ThumbsUp, ThumbsDown, Clock, Lightbulb,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export type WriteToChildSource =
  | "incident"
  | "complaint"
  | "missing_from_care"
  | "weekly_summary"
  | "direct_work"
  | "management_oversight"
  | "key_work_session";

export type WriteToChildMode = "live" | "post_save";

export interface ChildLensScore {
  overall: number;            // 0-100
  clarity: number;            // 0-100
  dignity: number;            // 0-100
  jargonRisk: number;         // 0-100 (higher = more jargon detected)
  blameRisk: number;          // 0-100 (higher = more blame language)
  explanationOfConcern: number; // 0-100 (how well adult concerns are explained)
  supportOffered: number;     // 0-100 (how clearly support is communicated)
  flags: ChildLensFlag[];
}

export interface ChildLensFlag {
  type: "jargon" | "blame" | "dignity" | "clarity" | "support" | "trauma_informed";
  severity: "high" | "medium" | "low";
  text: string;
  suggestion?: string;
}

interface WriteToChildOutput {
  id: string;
  managementVersion: string;
  childVersion: string;
  childLensScore: ChildLensScore;
  approachUsed: string[];     // e.g. ["PACE", "ARC", "Relational Safeguarding"]
  generatedAt: string;
  status: "draft" | "reviewed" | "approved" | "committed";
  reviewedBy?: string;
  approvedAt?: string;
}

interface WriteToChildProps {
  /** The source record type */
  source: WriteToChildSource;
  /** The raw text from the source record */
  sourceText: string;
  /** The source record ID for audit linking */
  sourceRecordId?: string;
  /** Child name for personalisation */
  childName: string;
  /** Child age for age-appropriate language */
  childAge?: number;
  /** Whether this is live editing or post-save improvement */
  mode: WriteToChildMode;
  /** Callback when the child-friendly version is approved */
  onApprove?: (output: WriteToChildOutput) => void;
  /** Optional className */
  className?: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<WriteToChildSource, { label: string; icon: React.ReactNode; colour: string }> = {
  incident:              { label: "Incident Record",          icon: <AlertTriangle className="h-3.5 w-3.5" />, colour: "text-red-600" },
  complaint:             { label: "Complaint",                icon: <MessageCircle className="h-3.5 w-3.5" />, colour: "text-amber-600" },
  missing_from_care:     { label: "Missing from Care Return", icon: <Shield className="h-3.5 w-3.5" />,       colour: "text-orange-600" },
  weekly_summary:        { label: "Weekly Summary",           icon: <FileText className="h-3.5 w-3.5" />,     colour: "text-blue-600" },
  direct_work:           { label: "Direct Work Summary",      icon: <Heart className="h-3.5 w-3.5" />,        colour: "text-purple-600" },
  management_oversight:  { label: "Management Oversight",     icon: <Eye className="h-3.5 w-3.5" />,          colour: "text-indigo-600" },
  key_work_session:      { label: "Key Work Session",         icon: <Users className="h-3.5 w-3.5" />,        colour: "text-emerald-600" },
};

const LENS_CATEGORY_CONFIG = {
  clarity:              { label: "Clarity",                 icon: <Eye className="h-3 w-3" />,              description: "Language is clear and understandable" },
  dignity:              { label: "Dignity",                 icon: <Heart className="h-3 w-3" />,            description: "Respects the child and avoids labelling" },
  jargonRisk:           { label: "Jargon Risk",             icon: <BookOpen className="h-3 w-3" />,         description: "Professional terms are translated" },
  blameRisk:            { label: "Blame Risk",              icon: <Shield className="h-3 w-3" />,           description: "Avoids blame and uses neutral language" },
  explanationOfConcern: { label: "Concern Explained",       icon: <Lightbulb className="h-3 w-3" />,        description: "Adult worries are explained honestly" },
  supportOffered:       { label: "Support Offered",         icon: <Users className="h-3 w-3" />,            description: "How help is available is made clear" },
} as const;

const APPROACH_LABELS: Record<string, { label: string; description: string }> = {
  PACE:                     { label: "PACE",                     description: "Playfulness, Acceptance, Curiosity, Empathy" },
  ARC:                      { label: "ARC",                      description: "Attachment, Regulation, Competency" },
  "Relational Safeguarding": { label: "Relational Safeguarding",  description: "Relationship-based approach to keeping safe" },
  "Trauma-Informed":        { label: "Trauma-Informed",          description: "Understanding behaviour through the lens of experience" },
};

// ── Demo generation ──────────────────────────────────────────────────────────

function generateDemoOutput(source: WriteToChildSource, sourceText: string, childName: string, childAge?: number): WriteToChildOutput {
  const firstName = childName.split(" ")[0];
  const ageAppropriate = (childAge ?? 12) >= 13;

  // Demo management version
  const managementVersion = sourceText.length > 0
    ? sourceText
    : "Management oversight has been completed. The incident has been reviewed and appropriate actions identified. Staff response was proportionate and in line with the behaviour support plan.";

  // Demo child-friendly version based on source
  const childVersions: Record<WriteToChildSource, string> = {
    incident: `Dear ${firstName},\n\nI wanted to talk to you about what happened on Tuesday. I know things were really difficult for you and I want you to know that we care about you and want to help.\n\nWhat happened:\nYou were feeling really frustrated and things got a bit much. That is completely understandable — everyone has moments like that, and it does not mean anything bad about you as a person.\n\nWhat we are doing:\nWe are going to think about what might help when things feel overwhelming. ${ageAppropriate ? "Your key worker will chat with you about what might work." : "The grown-ups here will think about how to help you when things feel too much."}\n\nYour rights:\nYou have every right to tell us how you feel about what happened. If you want to talk to someone outside of here, we can help arrange that too.\n\nYou are important to us, and we want things to feel better for you.\n\nWith care,\nThe team at Chamberlain House`,
    complaint: `Dear ${firstName},\n\nThank you for telling us how you feel. It takes courage to speak up, and we are glad you did.\n\nWe have looked into what you told us and we take it seriously. ${ageAppropriate ? "Here is what we found and what we are going to do about it:" : "Here is what the grown-ups have decided to do:"}\n\nWe want you to know that your voice matters. If you ever feel unhappy about something, you can always talk to us or to your ${ageAppropriate ? "advocate" : "special helper"}.\n\nWith care,\nThe team`,
    missing_from_care: `Dear ${firstName},\n\nWe are so glad you are back safe. We were worried about you and we want you to know that we care about where you are and how you are doing.\n\nWe are not cross with you. We just want to understand what happened so we can help make things better.\n\n${ageAppropriate ? "When you feel ready, we would like to have a chat about what was going on for you. There is no rush — we will wait until you are comfortable." : "When you feel ready, your key worker would like to have a chat with you. There is no rush."}\n\nYou are safe here and we are here for you.\n\nWith care,\nThe team`,
    weekly_summary: `Dear ${firstName},\n\nHere is a little update about your week:\n\n${ageAppropriate ? "It has been a good week overall." : "You have had a really good week!"} Some things that stood out:\n• You did really well at school this week\n• You joined in with activities and seemed to enjoy them\n• Your mood has been positive and the team noticed that\n\nIf there is anything you would like to change or try next week, just let us know.\n\nWith care,\nThe team`,
    direct_work: `Dear ${firstName},\n\nThank you for our chat today. It was really good to hear what you think and feel.\n\nI heard you say that ${ageAppropriate ? "you have been thinking about your future and what you want" : "you have some ideas about what you would like"}. That is really mature and we will do our best to support those wishes.\n\nRemember, these sessions are your space — you decide what we talk about.\n\nWith care,\nYour key worker`,
    management_oversight: `Dear ${firstName},\n\nI wanted to let you know that ${ageAppropriate ? "your Registered Manager has reviewed what happened" : "the person in charge has looked at what happened"} and we want to make sure you are OK.\n\nWhat this means for you:\n• We have made sure you are being looked after properly\n• We are thinking about what we can do to help\n• Your voice and feelings are important to us\n\n${ageAppropriate ? "If you want to know more about what we have decided, you can ask your key worker or me anytime." : "If you want to talk about anything, just ask one of the grown-ups here."}\n\nWith care,\nDarren (Registered Manager)`,
    key_work_session: `Dear ${firstName},\n\nThank you for spending time with your key worker today.\n\nWe talked about some important things and I wanted you to know that what you shared really matters to us. We will use what you told us to help make things better for you.\n\nRemember — you can always ask to have a chat whenever you need to.\n\nWith care,\nThe team`,
  };

  // Demo Child Lens Score
  const childLensScore: ChildLensScore = {
    overall: 84,
    clarity: 90,
    dignity: 92,
    jargonRisk: 12,
    blameRisk: 8,
    explanationOfConcern: 78,
    supportOffered: 85,
    flags: [
      {
        type: "clarity",
        severity: "low",
        text: "Consider simplifying 'proportionate' if including in any child-facing version.",
        suggestion: "Use 'the right amount of help' instead.",
      },
      {
        type: "support",
        severity: "low",
        text: "Could strengthen the offer of external advocacy.",
        suggestion: "Add: 'You can also speak to your Independent Visitor or Children's Commissioner.'",
      },
    ],
  };

  return {
    id: `wtc_${Date.now()}`,
    managementVersion,
    childVersion: childVersions[source],
    childLensScore,
    approachUsed: ["PACE", "ARC", "Trauma-Informed", "Relational Safeguarding"],
    generatedAt: new Date().toISOString(),
    status: "draft",
  };
}

// ── Subcomponents ────────────────────────────────────────────────────────────

function ChildLensScoreCard({ score }: { score: ChildLensScore }) {
  const [expanded, setExpanded] = useState(false);

  const overallColour =
    score.overall >= 80 ? "text-emerald-600" :
    score.overall >= 60 ? "text-amber-600" : "text-red-600";

  const overallBg =
    score.overall >= 80 ? "bg-emerald-50 border-emerald-200" :
    score.overall >= 60 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  const circumference = 2 * Math.PI * 24;
  const offset = circumference - (score.overall / 100) * circumference;
  const ringColour =
    score.overall >= 80 ? "stroke-emerald-500" :
    score.overall >= 60 ? "stroke-amber-500" : "stroke-red-500";

  function scoreBar(value: number, inverted = false) {
    const display = inverted ? 100 - value : value;
    const colour =
      display >= 80 ? "bg-emerald-400" :
      display >= 60 ? "bg-amber-400" : "bg-red-400";
    return (
      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${colour} transition-all`} style={{ width: `${display}%` }} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      <button
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Score ring */}
        <div className="relative shrink-0">
          <svg width="56" height="56" className="-rotate-90">
            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--cs-border)" strokeWidth="4" />
            <circle cx="28" cy="28" r="24" fill="none" className={ringColour} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.6s ease" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-sm font-bold tabular-nums ${overallColour}`}>{score.overall}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-[var(--cs-aria-gold)]" />
            <span className="text-xs font-semibold text-[var(--cs-navy)]">Child Lens Check</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${overallBg} ${overallColour}`}>
              {score.overall >= 80 ? "Good" : score.overall >= 60 ? "Needs Work" : "Concerns"}
            </span>
          </div>
          <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">
            {score.flags.length === 0
              ? "No issues detected — ready for review"
              : `${score.flags.length} suggestion${score.flags.length !== 1 ? "s" : ""} to improve`}
          </p>
        </div>

        <span className="text-[var(--cs-text-muted)] shrink-0">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in border-t border-[var(--cs-border)]">
          {/* Score breakdown */}
          <div className="grid grid-cols-2 gap-2 pt-3">
            {(Object.entries(LENS_CATEGORY_CONFIG) as [keyof typeof LENS_CATEGORY_CONFIG, typeof LENS_CATEGORY_CONFIG[keyof typeof LENS_CATEGORY_CONFIG]][]).map(([key, cfg]) => {
              const value = score[key as keyof ChildLensScore] as number;
              const isInverted = key === "jargonRisk" || key === "blameRisk";
              return (
                <div key={key} className="rounded-lg border border-[var(--cs-border)] p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[var(--cs-text-muted)]">{cfg.icon}</span>
                    <span className="text-[10px] font-medium text-[var(--cs-navy)]">{cfg.label}</span>
                    <span className={`ml-auto text-[10px] font-bold tabular-nums ${isInverted ? (100 - value >= 80 ? "text-emerald-600" : "text-amber-600") : (value >= 80 ? "text-emerald-600" : "text-amber-600")}`}>
                      {isInverted ? 100 - value : value}%
                    </span>
                  </div>
                  {scoreBar(value, isInverted)}
                  <p className="text-[9px] text-[var(--cs-text-gentle)] mt-1">{cfg.description}</p>
                </div>
              );
            })}
          </div>

          {/* Flags */}
          {score.flags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-[var(--cs-navy)]">Suggestions</span>
              {score.flags.map((flag, i) => (
                <div key={i} className={`rounded-lg p-2.5 border ${flag.severity === "high" ? "bg-red-50 border-red-200" : flag.severity === "medium" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}>
                  <p className="text-[11px] text-[var(--cs-text-secondary)]">{flag.text}</p>
                  {flag.suggestion && (
                    <p className="text-[10px] text-[var(--cs-text-gentle)] mt-1 italic">{flag.suggestion}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function AriaWriteToChild({
  source,
  sourceText,
  sourceRecordId,
  childName,
  childAge,
  mode,
  onApprove,
  className = "",
}: WriteToChildProps) {
  const [output, setOutput] = useState<WriteToChildOutput | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"child" | "management">("child");
  const [editingChild, setEditingChild] = useState(false);
  const [editedChildText, setEditedChildText] = useState("");
  const [showApproaches, setShowApproaches] = useState(false);

  const srcCfg = SOURCE_CONFIG[source];

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    // Simulate API call — in production this calls POST /api/aria/write-to-child
    await new Promise((r) => setTimeout(r, 1500));
    const result = generateDemoOutput(source, sourceText, childName, childAge);
    setOutput(result);
    setEditedChildText(result.childVersion);
    setGenerating(false);
  }, [source, sourceText, childName, childAge]);

  const handleApprove = useCallback(() => {
    if (!output) return;
    const approved: WriteToChildOutput = {
      ...output,
      childVersion: editedChildText,
      status: "approved",
      reviewedBy: "Current User",
      approvedAt: new Date().toISOString(),
    };
    setOutput(approved);
    onApprove?.(approved);
  }, [output, editedChildText, onApprove]);

  const handleRegenerate = useCallback(() => {
    setOutput(null);
    setEditingChild(false);
    handleGenerate();
  }, [handleGenerate]);

  return (
    <div className={`rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-[var(--cs-aria-gold-bg)] to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[var(--cs-aria-gold-soft)] rounded-xl" style={{ boxShadow: "var(--cs-shadow-glow-gold)" }}>
              <Heart className="h-4 w-4 text-[var(--cs-aria-gold)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Writing to the Child</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`flex items-center gap-1 text-[10px] ${srcCfg.colour}`}>
                  {srcCfg.icon} {srcCfg.label}
                </span>
                <span className="text-[10px] text-[var(--cs-text-gentle)]">·</span>
                <span className="text-[10px] text-[var(--cs-text-muted)]">
                  {mode === "live" ? "Live editing" : "Post-save improvement"}
                </span>
              </div>
            </div>
          </div>
          {output?.status === "approved" && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3 w-3" /> Approved
            </span>
          )}
        </div>
      </div>

      {/* Guidance */}
      <div className="px-4 py-3 border-b border-[var(--cs-border)] bg-[var(--cs-surface)]">
        <div className="flex items-start gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[var(--cs-aria-gold)] mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] text-[var(--cs-text-secondary)]">
              ARIA creates a child-understandable version using trauma-informed language (PACE, ARC).
              The child version avoids jargon, blame, and labelling. You must review and approve before sharing.
            </p>
            <p className="text-[10px] text-[var(--cs-text-gentle)] mt-1">
              Reg 6 — Children must be enabled to express views about their care. Reg 45 — Evidence of child-centred practice.
            </p>
          </div>
        </div>
      </div>

      {/* Generate or display */}
      {!output && !generating && (
        <div className="px-5 py-8 text-center">
          <div className="inline-flex p-3 bg-[var(--cs-aria-gold-bg)] rounded-2xl mb-3" style={{ boxShadow: "var(--cs-shadow-glow-gold)" }}>
            <Heart className="h-6 w-6 text-[var(--cs-aria-gold)]" />
          </div>
          <h4 className="text-sm font-semibold text-[var(--cs-navy)] mb-1">
            Create a child-friendly version
          </h4>
          <p className="text-xs text-[var(--cs-text-muted)] mb-4 max-w-md mx-auto">
            ARIA will create both a management version and a version written directly to {childName.split(" ")[0]},
            using age-appropriate, trauma-informed language.
          </p>
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--cs-navy)] text-white text-sm font-medium hover:bg-[var(--cs-navy-soft)] transition-colors"
            style={{ boxShadow: "var(--cs-shadow-soft)" }}
            onClick={handleGenerate}
          >
            <Sparkles className="h-4 w-4" />
            Generate Writing to the Child
          </button>
        </div>
      )}

      {generating && (
        <div className="px-5 py-10 text-center">
          <div className="inline-flex p-3 bg-[var(--cs-aria-gold-bg)] rounded-2xl mb-3 animate-pulse" style={{ boxShadow: "var(--cs-shadow-glow-gold)" }}>
            <Sparkles className="h-6 w-6 text-[var(--cs-aria-gold)]" />
          </div>
          <p className="text-sm font-medium text-[var(--cs-navy)] mb-1">Generating with care...</p>
          <p className="text-xs text-[var(--cs-text-muted)]">
            Applying PACE, ARC, and trauma-informed approaches
          </p>
          <Loader2 className="h-4 w-4 text-[var(--cs-aria-gold)] animate-spin mx-auto mt-3" />
        </div>
      )}

      {output && !generating && (
        <>
          {/* Approaches used */}
          <div className="px-4 py-2 border-b border-[var(--cs-border)]">
            <button
              className="flex items-center gap-1.5 text-xs text-[var(--cs-text-secondary)] hover:text-[var(--cs-navy)] transition-colors w-full"
              onClick={() => setShowApproaches(!showApproaches)}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="font-medium">Approaches used</span>
              <div className="flex items-center gap-1 ml-1">
                {output.approachUsed.map((a) => (
                  <span key={a} className="px-1.5 py-0.5 rounded bg-[var(--cs-aria-gold-bg)] text-[9px] font-medium text-[var(--cs-navy)] border border-[var(--cs-aria-gold-soft)]">
                    {a}
                  </span>
                ))}
              </div>
              {showApproaches ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
            </button>
            {showApproaches && (
              <div className="mt-2 space-y-1 animate-fade-in pb-1">
                {output.approachUsed.map((a) => {
                  const info = APPROACH_LABELS[a];
                  return info ? (
                    <div key={a} className="text-[10px] text-[var(--cs-text-muted)]">
                      <strong className="text-[var(--cs-navy)]">{info.label}:</strong> {info.description}
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Tab switcher */}
          <div className="flex border-b border-[var(--cs-border)]">
            {(["child", "management"] as const).map((tab) => (
              <button
                key={tab}
                className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${activeTab === tab ? "text-[var(--cs-navy)] border-[var(--cs-aria-gold)]" : "text-[var(--cs-text-muted)] border-transparent hover:text-[var(--cs-text-secondary)]"}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "child" ? (
                  <span className="flex items-center gap-1.5 justify-center">
                    <Heart className="h-3 w-3" /> Child Version
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 justify-center">
                    <Eye className="h-3 w-3" /> Management Version
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="px-4 py-4">
            {activeTab === "child" ? (
              <div>
                {editingChild ? (
                  <textarea
                    className="w-full min-h-[200px] text-sm text-[var(--cs-text)] bg-[var(--cs-surface)] border border-[var(--cs-border)] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)] focus:border-[var(--cs-aria-gold)] resize-y"
                    value={editedChildText}
                    onChange={(e) => setEditedChildText(e.target.value)}
                  />
                ) : (
                  <div className="rounded-xl bg-[var(--cs-surface)] border border-[var(--cs-border)] p-4">
                    <div className="text-sm text-[var(--cs-text)] whitespace-pre-wrap leading-relaxed">
                      {editedChildText}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <button
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${editingChild ? "bg-[var(--cs-navy)] text-white" : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"}`}
                    onClick={() => setEditingChild(!editingChild)}
                  >
                    <Edit3 className="h-3 w-3" />
                    {editingChild ? "Done Editing" : "Edit"}
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200 transition-colors"
                    onClick={() => navigator.clipboard?.writeText(editedChildText)}
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-[var(--cs-surface)] border border-[var(--cs-border)] p-4">
                <div className="text-sm text-[var(--cs-text)] whitespace-pre-wrap leading-relaxed">
                  {output.managementVersion}
                </div>
              </div>
            )}
          </div>

          {/* Child Lens Check */}
          <div className="px-4 pb-4">
            <ChildLensScoreCard score={output.childLensScore} />
          </div>

          {/* Audit info */}
          <div className="px-4 pb-3">
            <div className="rounded-lg bg-slate-50 border border-[var(--cs-border-subtle)] p-2.5 flex items-center gap-3 text-[10px] text-[var(--cs-text-gentle)]">
              <Clock className="h-3 w-3 shrink-0" />
              <span>Generated {new Date(output.generatedAt).toLocaleString("en-GB")}</span>
              <span>· Record: {sourceRecordId}</span>
              <span>· Status: <strong className="text-[var(--cs-text-secondary)]">{output.status}</strong></span>
            </div>
          </div>

          {/* Action buttons */}
          {output.status === "draft" && (
            <div className="px-4 pb-4 flex items-center gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--cs-navy)] text-white text-sm font-medium hover:bg-[var(--cs-navy-soft)] transition-colors"
                style={{ boxShadow: "var(--cs-shadow-soft)" }}
                onClick={handleApprove}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve &amp; Save
              </button>
              <button
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 text-[var(--cs-text-secondary)] text-sm font-medium hover:bg-slate-200 transition-colors"
                onClick={handleRegenerate}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Regenerate
              </button>
            </div>
          )}

          {output.status === "approved" && (
            <div className="px-4 pb-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-emerald-800">Approved and saved to record</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">
                    Available for Reg 44 visits, Reg 45 reports, and internal QA review.
                    {output.approvedAt && ` Approved ${new Date(output.approvedAt).toLocaleString("en-GB")}`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--cs-border)] bg-slate-50/50">
        <p className="text-[10px] text-[var(--cs-text-muted)] text-center">
          All child-facing content must be human-reviewed and approved before sharing. Full audit trail maintained for Reg 44 &amp; Reg 45.
        </p>
      </div>
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────

export const _testing = {
  SOURCE_CONFIG,
  LENS_CATEGORY_CONFIG,
  APPROACH_LABELS,
  generateDemoOutput,
};
