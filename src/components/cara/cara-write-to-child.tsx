// ══════════════════════════════════════════════════════════════════════════════
// CaraWriteToChild — Trauma-informed "Writing to the Child" helper
//
// Helps a practitioner write a child-understandable version of a management
// oversight, incident record, complaint, missing-from-care return, or session
// summary. The MANAGEMENT version is the real source record; the CHILD version
// is written by the practitioner. On save, Cara scores the child version against
// the Child Lens (clarity, dignity, jargon, blame …) server-side and stores it
// with a full audit trail for Reg 44 / Reg 45 / internal QA.
//
// NB: this component previously fabricated the child's letter AND its Child Lens
// score with a hardcoded `generateDemoOutput` (one variant even signed off in a
// named manager's voice). On a live record that is an invented record — Cara
// must never put words it did not write into a real child's file. The demo
// generator has been removed: the practitioner writes, Cara only scores + stores.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useState, useCallback } from "react";
import {
  Sparkles,
  Heart,
  MessageCircle,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Eye,
  Copy,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Users,
  FileText,
  Loader2,
  RotateCcw,
  Clock,
  Lightbulb,
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
  /** Null until the practitioner saves and Cara scores the real text. */
  childLensScore: ChildLensScore | null;
  generatedAt: string;
  status: "draft" | "reviewed" | "approved" | "committed";
  /** Whether the save was persisted to durable storage (false in demo mode). */
  persisted?: boolean;
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
  PACE:                      { label: "PACE",                     description: "Playfulness, Acceptance, Curiosity, Empathy" },
  ARC:                       { label: "ARC",                      description: "Attachment, Regulation, Competency" },
  "Relational Safeguarding": { label: "Relational Safeguarding",  description: "Relationship-based approach to keeping safe" },
  "Trauma-Informed":         { label: "Trauma-Informed",          description: "Understanding behaviour through the lens of experience" },
};

// ── Child Lens score card (renders a REAL score computed on save) ─────────────

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
            <Shield className="h-3.5 w-3.5 text-[var(--cs-cara-gold)]" />
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

export function CaraWriteToChild({
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"child" | "management">("child");
  const [editingChild, setEditingChild] = useState(false);
  const [editedChildText, setEditedChildText] = useState("");

  const srcCfg = SOURCE_CONFIG[source];
  const firstName = childName.split(" ")[0] || childName;

  // Start an EMPTY draft — Cara does not write the child's letter. The
  // management version is the real source record; the practitioner writes the
  // child version, and Cara scores it against the Child Lens when it is saved.
  const handleStartDraft = useCallback(() => {
    setError(null);
    setOutput({
      id: `wtc_draft_${Date.now()}`,
      managementVersion: sourceText,
      childVersion: "",
      childLensScore: null,
      generatedAt: new Date().toISOString(),
      status: "draft",
    });
    setEditedChildText("");
    setEditingChild(true);
    setActiveTab("child");
  }, [sourceText]);

  const handleApprove = useCallback(async () => {
    if (!output) return;
    if (!editedChildText.trim()) {
      setError(`Write the version for ${firstName} before saving.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/cara/write-to-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          sourceText,
          sourceRecordId,
          childName,
          childAge,
          childVersion: editedChildText,
          managementVersion: output.managementVersion,
          status: "approved",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Couldn't save — storage isn't available for this record yet.");
        return;
      }
      const saved: WriteToChildOutput = {
        ...output,
        childVersion: editedChildText,
        childLensScore: (json.data?.child_lens_score ?? null) as ChildLensScore | null,
        status: "approved",
        persisted: json.persisted !== false,
        approvedAt: json.data?.created_at ?? new Date().toISOString(),
      };
      setOutput(saved);
      setEditingChild(false);
      onApprove?.(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error while saving.");
    } finally {
      setSaving(false);
    }
  }, [output, editedChildText, firstName, source, sourceText, sourceRecordId, childName, childAge, onApprove]);

  const handleStartOver = useCallback(() => {
    setOutput(null);
    setEditingChild(false);
    setEditedChildText("");
    setError(null);
  }, []);

  return (
    <div className={`rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[var(--cs-cara-gold-soft)] rounded-xl" style={{ boxShadow: "var(--cs-shadow-glow-gold)" }}>
              <Heart className="h-4 w-4 text-[var(--cs-cara-gold)]" />
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
              <CheckCircle2 className="h-3 w-3" /> Saved
            </span>
          )}
        </div>
      </div>

      {/* Guidance */}
      <div className="px-4 py-3 border-b border-[var(--cs-border)] bg-[var(--cs-surface)]">
        <div className="flex items-start gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[var(--cs-cara-gold)] mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] text-[var(--cs-text-secondary)]">
              You write the version for {firstName}. Cara checks it against the Child Lens — jargon, blame, dignity,
              clarity — when you save. Avoid jargon, blame, and labelling. Review before sharing.
            </p>
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              <span className="text-[10px] text-[var(--cs-text-gentle)]">Approaches to draw on:</span>
              {Object.values(APPROACH_LABELS).map((a) => (
                <span key={a.label} title={a.description} className="px-1.5 py-0.5 rounded bg-[var(--cs-cara-gold-bg)] text-[9px] font-medium text-[var(--cs-navy)] border border-[var(--cs-cara-gold-soft)]">
                  {a.label}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-[var(--cs-text-gentle)] mt-1.5">
              Reg 6 — Children must be enabled to express views about their care. Reg 45 — Evidence of child-centred practice.
            </p>
          </div>
        </div>
      </div>

      {/* Start a draft */}
      {!output && (
        <div className="px-5 py-8 text-center">
          <div className="inline-flex p-3 bg-[var(--cs-cara-gold-bg)] rounded-2xl mb-3" style={{ boxShadow: "var(--cs-shadow-glow-gold)" }}>
            <Heart className="h-6 w-6 text-[var(--cs-cara-gold)]" />
          </div>
          <h4 className="text-sm font-semibold text-[var(--cs-navy)] mb-1">
            Write a child-friendly version
          </h4>
          <p className="text-xs text-[var(--cs-text-muted)] mb-4 max-w-md mx-auto">
            Start a draft written directly to {firstName}, in age-appropriate, trauma-informed language.
            The management version is taken from this record.
          </p>
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--cs-navy)] text-white text-sm font-medium hover:bg-[var(--cs-navy-soft)] transition-colors"
            style={{ boxShadow: "var(--cs-shadow-soft)" }}
            onClick={handleStartDraft}
          >
            <Edit3 className="h-4 w-4" />
            Start a draft
          </button>
        </div>
      )}

      {output && (
        <>
          {/* Tab switcher */}
          <div className="flex border-b border-[var(--cs-border)]">
            {(["child", "management"] as const).map((tab) => (
              <button
                key={tab}
                className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${activeTab === tab ? "text-[var(--cs-navy)] border-[var(--cs-cara-gold)]" : "text-[var(--cs-text-muted)] border-transparent hover:text-[var(--cs-text-secondary)]"}`}
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
                    className="w-full min-h-[200px] text-sm text-[var(--cs-text)] bg-[var(--cs-surface)] border border-[var(--cs-border)] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)] focus:border-[var(--cs-cara-gold)] resize-y"
                    placeholder={`Write directly to ${firstName}…`}
                    value={editedChildText}
                    onChange={(e) => setEditedChildText(e.target.value)}
                  />
                ) : editedChildText ? (
                  <div className="rounded-xl bg-[var(--cs-surface)] border border-[var(--cs-border)] p-4">
                    <div className="text-sm text-[var(--cs-text)] whitespace-pre-wrap leading-relaxed">
                      {editedChildText}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--cs-border)] bg-slate-50 p-6 text-center text-xs text-[var(--cs-text-muted)]">
                    Nothing written yet. Use Edit to write the version for {firstName}.
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200 transition-colors disabled:opacity-50"
                    disabled={!editedChildText}
                    onClick={() => navigator.clipboard?.writeText(editedChildText)}
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-[var(--cs-surface)] border border-[var(--cs-border)] p-4">
                <div className="text-sm text-[var(--cs-text)] whitespace-pre-wrap leading-relaxed">
                  {output.managementVersion || <span className="text-[var(--cs-text-muted)]">No source text on this record.</span>}
                </div>
              </div>
            )}
          </div>

          {/* Child Lens Check — only a REAL score, computed on save */}
          <div className="px-4 pb-4">
            {output.childLensScore ? (
              <ChildLensScoreCard score={output.childLensScore} />
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--cs-border)] bg-slate-50 p-3 flex items-center gap-2 text-[11px] text-[var(--cs-text-muted)]">
                <Shield className="h-3.5 w-3.5 shrink-0" />
                <span>Cara runs the Child Lens check on your text when you save.</span>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 pb-3">
              <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-[11px] text-red-700">{error}</div>
            </div>
          )}

          {/* Audit info */}
          <div className="px-4 pb-3">
            <div className="rounded-lg bg-slate-50 border border-[var(--cs-border-subtle)] p-2.5 flex flex-wrap items-center gap-3 text-[10px] text-[var(--cs-text-gentle)]">
              <Clock className="h-3 w-3 shrink-0" />
              <span>{output.status === "approved" ? "Saved" : "Draft started"} {new Date(output.approvedAt ?? output.generatedAt).toLocaleString("en-GB")}</span>
              {sourceRecordId && <span>· Record: {sourceRecordId}</span>}
              <span>· Status: <strong className="text-[var(--cs-text-secondary)]">{output.status}</strong></span>
            </div>
          </div>

          {/* Action buttons */}
          {output.status === "draft" && (
            <div className="px-4 pb-4 flex items-center gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--cs-navy)] text-white text-sm font-medium hover:bg-[var(--cs-navy-soft)] transition-colors disabled:opacity-60"
                style={{ boxShadow: "var(--cs-shadow-soft)" }}
                disabled={saving}
                onClick={handleApprove}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {saving ? "Saving…" : "Approve & Save"}
              </button>
              <button
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 text-[var(--cs-text-secondary)] text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
                disabled={saving}
                onClick={handleStartOver}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Start over
              </button>
            </div>
          )}

          {output.status === "approved" && (
            <div className="px-4 pb-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-emerald-800">
                    {output.persisted ? "Approved and saved to record" : "Checked with Cara"}
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">
                    {output.persisted
                      ? "Available for Reg 44 visits, Reg 45 reports, and internal QA review."
                      : "Not stored on this tenant yet — persistence isn't enabled for this record type."}
                    {output.approvedAt && ` ${new Date(output.approvedAt).toLocaleString("en-GB")}`}
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
};
