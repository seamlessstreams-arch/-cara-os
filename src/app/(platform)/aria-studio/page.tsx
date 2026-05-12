"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — Therapeutic Care Intelligence Studio
// The creative, evidence-based generation hub for children's residential care.
// ARIA drafts. Humans decide. Only authorised humans approve and commit.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { useStaff } from "@/hooks/use-staff";
import {
  Sparkles, FileText, Brain, Shield, AlertTriangle, CheckCircle2,
  ChevronDown, Loader2, Send, Download, Archive, History, Eye,
  AlertCircle, Users, Home, Calendar, Palette, Lightbulb,
  ClipboardCheck, BookOpen, Heart, Activity, Target, Wand2,
  GraduationCap, BarChart3, Mic, Video, Layers, Clock, Map,
  Scale, ListChecks, Play, MessageCircle, Settings,
} from "lucide-react";
import {
  ARIA_STUDIO_ARTIFACT_TYPES,
  ARTIFACT_TYPE_LABELS,
  ARIA_STUDIO_FRAMEWORKS,
  FRAMEWORK_LABELS,
  ARIA_STUDIO_TONES,
  TONE_LABELS,
  ARIA_STUDIO_SOURCE_TYPES,
  SOURCE_TYPE_LABELS,
  STATUS_LABELS,
  type AriaStudioArtifactType,
  type AriaStudioFramework,
  type AriaStudioTone,
  type AriaStudioArtifact,
  type AriaStudioQualityCheck,
  type AriaStudioGap,
} from "@/types/aria-studio";

// ── Artifact type icons ──────────────────────────────────────────────────────

const ARTIFACT_ICONS: Partial<Record<AriaStudioArtifactType, React.ElementType>> = {
  keywork_session: Heart,
  direct_work_session: Play,
  child_friendly_worksheet: Palette,
  child_friendly_explanation: MessageCircle,
  staff_training: GraduationCap,
  quiz: ClipboardCheck,
  flashcards: Layers,
  management_oversight: Shield,
  incident_learning_review: Lightbulb,
  risk_review: AlertTriangle,
  safeguarding_review: Shield,
  child_plan: Target,
  placement_plan_update: FileText,
  care_plan_update: FileText,
  reg45_summary: BarChart3,
  annex_a_update: FileText,
  ofsted_readiness_summary: Eye,
  ri_briefing: Brain,
  social_worker_update: Users,
  supervision_prompt: BookOpen,
  audio_briefing_script: Mic,
  video_briefing_script: Video,
  action_plan: ListChecks,
  timeline: Clock,
  mind_map: Map,
  visual_formulation: Activity,
  scenario_simulation: Play,
  slide_deck_outline: Layers,
  reflective_workbook: BookOpen,
  team_meeting_discussion: Users,
  parent_professional_letter: FileText,
};

// ── Artifact type groups ─────────────────────────────────────────────────────

const ARTIFACT_GROUPS = [
  {
    label: "Children & Care",
    types: ["keywork_session", "direct_work_session", "child_friendly_worksheet", "child_friendly_explanation", "child_plan", "placement_plan_update", "care_plan_update", "visual_formulation"] as AriaStudioArtifactType[],
  },
  {
    label: "Safeguarding & Risk",
    types: ["incident_learning_review", "risk_review", "safeguarding_review", "action_plan"] as AriaStudioArtifactType[],
  },
  {
    label: "Management & Oversight",
    types: ["management_oversight", "supervision_prompt", "team_meeting_discussion", "social_worker_update", "parent_professional_letter"] as AriaStudioArtifactType[],
  },
  {
    label: "Compliance & QA",
    types: ["reg45_summary", "annex_a_update", "ofsted_readiness_summary", "ri_briefing", "timeline"] as AriaStudioArtifactType[],
  },
  {
    label: "Learning & Training",
    types: ["staff_training", "quiz", "flashcards", "reflective_workbook", "scenario_simulation"] as AriaStudioArtifactType[],
  },
  {
    label: "Creative & Media",
    types: ["audio_briefing_script", "video_briefing_script", "slide_deck_outline", "mind_map"] as AriaStudioArtifactType[],
  },
];

// ── Status badge colours ─────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-[var(--cs-surface)] text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
  in_review: "bg-amber-50 text-amber-700 border-amber-200",
  changes_requested: "bg-orange-50 text-orange-700 border-orange-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  committed: "bg-blue-50 text-blue-700 border-blue-200",
  archived: "bg-[var(--cs-surface)] text-[var(--cs-text-muted)] border-[var(--cs-border)]",
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function AriaStudioPage() {
  const { currentUser, currentRole } = useAuthContext();
  const staffQuery = useStaff();
  const allStaff = staffQuery.data?.data ?? [];
  const searchParams = useSearchParams();

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedArtifactType, setSelectedArtifactType] = useState<AriaStudioArtifactType | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<AriaStudioFramework | undefined>();
  const [selectedTone, setSelectedTone] = useState<AriaStudioTone>("balanced");
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [additionalContext, setAdditionalContext] = useState("");

  // ── Read URL params from quick action deep-links ──────────────────────────
  useEffect(() => {
    const type = searchParams.get("type") as AriaStudioArtifactType | null;
    const childId = searchParams.get("childId");
    const framework = searchParams.get("framework") as AriaStudioFramework | null;
    const tone = searchParams.get("tone") as AriaStudioTone | null;
    const context = searchParams.get("context");

    if (type && ARIA_STUDIO_ARTIFACT_TYPES.includes(type)) {
      setSelectedArtifactType(type);
      setShowTypeSelector(true);
    }
    if (childId) setSelectedChildId(childId);
    if (framework) setSelectedFramework(framework);
    if (tone) setSelectedTone(tone);
    if (context) setAdditionalContext(context);
  }, [searchParams]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [generating, setGenerating] = useState(false);
  const [generatedArtifact, setGeneratedArtifact] = useState<AriaStudioArtifact | null>(null);
  const [qualityCheck, setQualityCheck] = useState<AriaStudioQualityCheck | null>(null);
  const [gaps, setGaps] = useState<AriaStudioGap[]>([]);
  const [editableContent, setEditableContent] = useState("");
  const [showTypeSelector, setShowTypeSelector] = useState(true);

  // ── Children from staff query (demo) ───────────────────────────────────────
  const children = [
    { id: "child_1", name: "Jayden" },
    { id: "child_2", name: "Amara" },
    { id: "child_3", name: "Reuben" },
  ];

  // ── Generate artifact ──────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!selectedArtifactType) return;
    setGenerating(true);
    setShowTypeSelector(false);

    try {
      const res = await fetch("/api/aria-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artifact_type: selectedArtifactType,
          child_id: selectedChildId || undefined,
          framework: selectedFramework,
          tone: selectedTone,
          additional_context: additionalContext || undefined,
          date_range: dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined,
        }),
      });

      const data = await res.json();
      if (data.artifact) {
        setGeneratedArtifact(data.artifact);
        setEditableContent(data.artifact.generated_content ?? "");
        setQualityCheck(data.quality_check ?? null);
        setGaps(data.gaps_found ?? []);
      }
    } catch (err) {
      console.error("Generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }, [selectedArtifactType, selectedChildId, selectedFramework, selectedTone, additionalContext, dateFrom, dateTo]);

  // ── Workflow actions ───────────────────────────────────────────────────────
  const handleWorkflowAction = useCallback(async (action: string) => {
    if (!generatedArtifact) return;
    try {
      await fetch(`/api/aria-studio/artifacts/${generatedArtifact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setGeneratedArtifact(prev => prev ? { ...prev, status: action === "submit_for_review" ? "in_review" : action === "approve" ? "approved" : action === "commit" ? "committed" : prev.status } as AriaStudioArtifact : null);
    } catch (err) {
      console.error("Workflow action failed:", err);
    }
  }, [generatedArtifact]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleNewArtifact = () => {
    setGeneratedArtifact(null);
    setEditableContent("");
    setQualityCheck(null);
    setGaps([]);
    setSelectedArtifactType(null);
    setShowTypeSelector(true);
    setAdditionalContext("");
  };

  return (
    <PageShell title="ARIA Studio" subtitle="Therapeutic Care Intelligence Studio">
      <div className="space-y-6 pb-12">

        {/* ── Hero banner ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--cs-aria-gold-soft)] bg-gradient-to-r from-[var(--cs-aria-gold-bg)] to-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <Sparkles className="h-6 w-6 text-[var(--cs-aria-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-[var(--cs-navy)]">ARIA Studio</h2>
              <p className="text-sm text-[var(--cs-text-secondary)] mt-1">
                Create evidence-based key work sessions, management oversight, risk reviews, staff training, child-friendly resources, Ofsted evidence and more — all grounded in your care records.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <Badge className="text-[10px] bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)] border-[var(--cs-aria-gold-soft)]">
                  ARIA drafts · Humans decide
                </Badge>
                <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                  Evidence-grounded
                </Badge>
                <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                  {currentUser?.full_name ?? "Staff"} · {currentRole.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* ── Type selector grid ───────────────────────────────────────────── */}
        {showTypeSelector && !generatedArtifact && (
          <div className="space-y-6">
            {ARTIFACT_GROUPS.map((group) => (
              <div key={group.label}>
                <h3 className="text-sm font-semibold text-[var(--cs-navy)] mb-3">{group.label}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {group.types.map((type) => {
                    const Icon = ARTIFACT_ICONS[type] ?? FileText;
                    const isSelected = selectedArtifactType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedArtifactType(isSelected ? null : type)}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
                          isSelected
                            ? "border-[var(--cs-aria-gold)] bg-[var(--cs-aria-gold-bg)] ring-2 ring-[var(--cs-aria-gold-soft)]"
                            : "border-[var(--cs-border)] bg-white hover:border-[var(--cs-aria-gold-soft)] hover:bg-[var(--cs-aria-gold-bg)]/30",
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", isSelected ? "text-[var(--cs-aria-gold)]" : "text-[var(--cs-text-muted)]")} />
                        <span className={cn("text-xs font-medium leading-tight", isSelected ? "text-[var(--cs-navy)]" : "text-[var(--cs-text-secondary)]")}>
                          {ARTIFACT_TYPE_LABELS[type]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* ── Configuration panel ──────────────────────────────────────── */}
            {selectedArtifactType && (
              <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 space-y-5">
                <h3 className="text-sm font-semibold text-[var(--cs-navy)] flex items-center gap-2">
                  <Settings className="h-4 w-4 text-[var(--cs-text-muted)]" />
                  Configure Generation — {ARTIFACT_TYPE_LABELS[selectedArtifactType]}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Child selector */}
                  <div>
                    <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1.5 block">Child (optional)</label>
                    <select
                      value={selectedChildId}
                      onChange={(e) => setSelectedChildId(e.target.value)}
                      className="w-full rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)]"
                    >
                      <option value="">All children / Not child-specific</option>
                      {children.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Framework selector */}
                  <div>
                    <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1.5 block">Therapeutic Framework</label>
                    <select
                      value={selectedFramework ?? ""}
                      onChange={(e) => setSelectedFramework(e.target.value as AriaStudioFramework || undefined)}
                      className="w-full rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)]"
                    >
                      <option value="">Auto-select framework</option>
                      {ARIA_STUDIO_FRAMEWORKS.map((f) => (
                        <option key={f} value={f}>{FRAMEWORK_LABELS[f]}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tone selector */}
                  <div>
                    <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1.5 block">Tone</label>
                    <select
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value as AriaStudioTone)}
                      className="w-full rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)]"
                    >
                      {ARIA_STUDIO_TONES.map((t) => (
                        <option key={t} value={t}>{TONE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date range */}
                  <div>
                    <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1.5 block">Date From</label>
                    <input
                      type="date" value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1.5 block">Date To</label>
                    <input
                      type="date" value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)]"
                    />
                  </div>
                </div>

                {/* Additional context */}
                <div>
                  <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1.5 block">Additional Context (optional)</label>
                  <textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Add any specific focus, theme, or context for this generation..."
                    rows={3}
                    className="w-full rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2.5 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)] resize-none"
                  />
                </div>

                {/* Generate button */}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-[var(--cs-text-muted)] flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    ARIA will generate a draft for human review. No content is committed automatically.
                  </p>
                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 gap-2"
                  >
                    {generating ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
                    ) : (
                      <><Sparkles className="h-4 w-4" />Generate Draft</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Loading state ────────────────────────────────────────────────── */}
        {generating && (
          <div className="rounded-2xl border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)] p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--cs-aria-gold)] mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--cs-navy)]">ARIA is generating your {selectedArtifactType ? ARTIFACT_TYPE_LABELS[selectedArtifactType] : "draft"}...</p>
            <p className="text-xs text-[var(--cs-text-muted)] mt-1">Reviewing evidence, applying framework, checking quality</p>
          </div>
        )}

        {/* ── Generated artifact view ──────────────────────────────────────── */}
        {generatedArtifact && !generating && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-[var(--cs-navy)]">{generatedArtifact.title}</h3>
                <Badge className={cn("text-[10px] border", STATUS_STYLES[generatedArtifact.status])}>
                  {STATUS_LABELS[generatedArtifact.status as keyof typeof STATUS_LABELS] ?? generatedArtifact.status}
                </Badge>
                {generatedArtifact.status === "draft" && (
                  <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                    ⚠️ DRAFT — Not approved
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleNewArtifact} className="gap-1.5 text-xs">
                  <Wand2 className="h-3.5 w-3.5" />New
                </Button>
                {generatedArtifact.status === "draft" && (
                  <Button size="sm" onClick={() => handleWorkflowAction("submit_for_review")} className="gap-1.5 text-xs bg-[var(--cs-navy)]">
                    <Send className="h-3.5 w-3.5" />Submit for Review
                  </Button>
                )}
                {generatedArtifact.status === "in_review" && (
                  <Button size="sm" onClick={() => handleWorkflowAction("approve")} className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />Approve
                  </Button>
                )}
                {generatedArtifact.status === "approved" && (
                  <Button size="sm" onClick={() => handleWorkflowAction("commit")} className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700">
                    <ClipboardCheck className="h-3.5 w-3.5" />Commit to Record
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main content editor */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
                  {/* Draft watermark */}
                  {generatedArtifact.status === "draft" && (
                    <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">
                        ARIA-generated draft — requires human review and approval before use
                      </span>
                    </div>
                  )}
                  {generatedArtifact.status === "committed" && (
                    <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">
                        Committed to official record — locked
                      </span>
                    </div>
                  )}
                  <div className="p-5">
                    <textarea
                      value={editableContent}
                      onChange={(e) => setEditableContent(e.target.value)}
                      readOnly={generatedArtifact.status === "committed"}
                      rows={24}
                      className="w-full text-sm text-[var(--cs-text)] leading-relaxed resize-none focus:outline-none bg-transparent font-[family-name:var(--font-sans)]"
                    />
                  </div>
                </div>
              </div>

              {/* Right sidebar — Quality, Evidence, Gaps */}
              <div className="space-y-4">
                {/* Quality check panel */}
                {qualityCheck && (
                  <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--cs-aria-gold)]" />
                      Quality Check
                    </h4>
                    <div className="space-y-2">
                      {[
                        { label: "Evidence cited", passed: qualityCheck.evidence_cited },
                        { label: "Child voice considered", passed: qualityCheck.child_voice_considered },
                        { label: "Risk addressed", passed: qualityCheck.risk_considered },
                        { label: "Safeguarding considered", passed: qualityCheck.safeguarding_considered },
                        { label: "Actions clear", passed: qualityCheck.actions_clear },
                        { label: "Dignity language", passed: qualityCheck.dignity_language_passed },
                        { label: "No AI filler", passed: qualityCheck.no_ai_style_filler },
                        { label: "No unsupported claims", passed: qualityCheck.no_unsupported_claims },
                      ].map(({ label, passed }) => (
                        <div key={label} className="flex items-center justify-between text-xs">
                          <span className="text-[var(--cs-text-secondary)]">{label}</span>
                          {passed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        </div>
                      ))}
                    </div>
                    {qualityCheck.issues.length > 0 && (
                      <div className="border-t border-[var(--cs-border-subtle)] pt-3 space-y-1.5">
                        <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Issues</p>
                        {qualityCheck.issues.map((issue, i) => (
                          <p key={i} className="text-xs text-amber-600 leading-relaxed">{issue}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Gap warnings */}
                {gaps.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Evidence Gaps ({gaps.length})
                    </h4>
                    {gaps.map((gap) => (
                      <div key={gap.id} className="text-xs space-y-0.5">
                        <p className="font-medium text-amber-900">{gap.title}</p>
                        <p className="text-amber-700">{gap.description}</p>
                        {gap.recommended_action && (
                          <p className="text-amber-600 italic">{gap.recommended_action}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Confidence panel */}
                <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-[var(--cs-aria-gold)]" />
                    Evidence Confidence
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[var(--cs-surface)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--cs-aria-gold)] rounded-full" style={{ width: `${generatedArtifact.evidence_confidence_score ?? 65}%` }} />
                      </div>
                      <span className="text-xs font-medium text-[var(--cs-text-secondary)]">{generatedArtifact.evidence_confidence_score ?? 65}%</span>
                    </div>
                    <p className="text-xs text-[var(--cs-text-muted)]">
                      {(generatedArtifact.evidence_confidence_score ?? 65) >= 80
                        ? "High confidence — well-supported by approved evidence."
                        : (generatedArtifact.evidence_confidence_score ?? 65) >= 60
                          ? "Medium confidence — some evidence gaps may exist."
                          : "Low confidence — additional evidence recommended before approval."}
                    </p>
                  </div>
                </div>

                {/* Regulation mapping */}
                <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5 text-[var(--cs-aria-gold)]" />
                    Regulation Relevance
                  </h4>
                  <div className="space-y-1.5">
                    {(generatedArtifact.regulation_relevance as string[] ?? []).length > 0
                      ? (generatedArtifact.regulation_relevance as string[]).map((reg, i) => (
                          <Badge key={i} className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 mr-1">
                            {String(reg)}
                          </Badge>
                        ))
                      : <p className="text-xs text-[var(--cs-text-muted)]">Regulation mapping will be shown once the artifact is reviewed.</p>}
                  </div>
                </div>

                {/* Audit trail */}
                <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
                  <h4 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide flex items-center gap-1.5 mb-3">
                    <History className="h-3.5 w-3.5 text-[var(--cs-aria-gold)]" />
                    Audit Trail
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[var(--cs-text-secondary)]">
                        Created by {currentUser?.full_name} · {new Date().toLocaleDateString("en-GB")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-[var(--cs-aria-gold)]" />
                      <span className="text-[var(--cs-text-secondary)]">
                        Status: {STATUS_LABELS[generatedArtifact.status as keyof typeof STATUS_LABELS] ?? generatedArtifact.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {!generatedArtifact && !generating && !selectedArtifactType && (
          <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-8 text-center">
            <Sparkles className="h-10 w-10 text-[var(--cs-aria-gold)] mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--cs-navy)]">Select an output type above to begin</p>
            <p className="text-xs text-[var(--cs-text-muted)] mt-1 max-w-md mx-auto">
              ARIA Studio creates evidence-based drafts from your care records. Choose what you need, configure the settings, and ARIA will generate a professional draft for your review.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
