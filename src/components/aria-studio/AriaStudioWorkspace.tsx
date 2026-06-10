"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — Workspace Component
//
// Main generation workspace. Handles:
//   - Generation type selection
//   - Brief/title input
//   - Tone/audience configuration
//   - Trigger generation
//   - Display output preview + safety panel
//   - Approval/commit workflow buttons
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Sparkles, Loader2, Shield, AlertTriangle, CheckCircle2,
  FileText, Heart, Play, Palette, Brain, Target, GraduationCap,
  Layers, Users, BarChart3, BookOpen, Activity, Lightbulb,
  MessageCircle, ClipboardCheck, Home,
} from "lucide-react";
import { GENERATION_TYPES, TONES, AUDIENCES, GENERATION_CATEGORIES } from "@/lib/aria-studio/types";
import type { GenerationType, Tone, Audience, GenerationOutput, SafetyAssessment } from "@/lib/aria-studio/types";
import { ChildProfilePanel } from "./ChildProfilePanel";
import { StudioOutputPreview } from "./StudioOutputPreview";
import { StudioSafetyPanel } from "./StudioSafetyPanel";

// ── Type icons ──────────────────────────────────────────────────────────────

const TYPE_ICONS: Partial<Record<GenerationType, React.ElementType>> = {
  KEYWORK_SESSION: Heart,
  DIRECT_WORK_SESSION: Play,
  LIFE_STORY_SESSION: BookOpen,
  MISSING_RETURN_HOME_SUPPORT: Home,
  STAFF_BRIEFING: Users,
  FLASHCARDS: Layers,
  YOUNG_PERSON_EXPLAINER: MessageCircle,
  BEHAVIOUR_SUPPORT_IDEAS: Lightbulb,
  PLACEMENT_PLAN_DRAFT: FileText,
  RISK_ASSESSMENT_DRAFT: Shield,
  CARE_PLAN_DRAFT: Target,
  STAFF_MICRO_TRAINING: GraduationCap,
  TEAM_MEETING_PACK: Users,
  TEAM_DISCUSSION_GUIDE: Users,
  REG44_EVIDENCE_PREP: ClipboardCheck,
  REG45_EVIDENCE_PREP: BarChart3,
  EDUCATION_SUPPORT_SESSION: GraduationCap,
  INDEPENDENCE_SESSION: Activity,
  FAMILY_TIME_PREPARATION: Heart,
  EMOTIONAL_REGULATION_SESSION: Brain,
  RELATIONSHIP_REPAIR_SESSION: Heart,
  MANAGER_OVERSIGHT_PROMPTS: Shield,
};

// ── Type labels ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<GenerationType, string> = {
  KEYWORK_SESSION: "Key Work Session",
  DIRECT_WORK_SESSION: "Direct Work Session",
  LIFE_STORY_SESSION: "Life Story Work",
  MISSING_RETURN_HOME_SUPPORT: "Missing Return Home",
  STAFF_BRIEFING: "Staff Briefing",
  FLASHCARDS: "Flashcards",
  YOUNG_PERSON_EXPLAINER: "Young Person Explainer",
  BEHAVIOUR_SUPPORT_IDEAS: "Behaviour Support",
  PLACEMENT_PLAN_DRAFT: "Placement Plan Draft",
  RISK_ASSESSMENT_DRAFT: "Risk Assessment Draft",
  CARE_PLAN_DRAFT: "Care Plan Draft",
  STAFF_MICRO_TRAINING: "Staff Micro-Training",
  TEAM_MEETING_PACK: "Team Meeting Pack",
  TEAM_DISCUSSION_GUIDE: "Team Discussion Guide",
  REG44_EVIDENCE_PREP: "Reg 44 Evidence",
  REG45_EVIDENCE_PREP: "Reg 45 Evidence",
  EDUCATION_SUPPORT_SESSION: "Education Support",
  INDEPENDENCE_SESSION: "Independence Session",
  FAMILY_TIME_PREPARATION: "Family Time Prep",
  EMOTIONAL_REGULATION_SESSION: "Emotional Regulation",
  RELATIONSHIP_REPAIR_SESSION: "Relationship Repair",
  MANAGER_OVERSIGHT_PROMPTS: "Manager Oversight",
};

const TONE_LABELS: Record<Tone, string> = {
  warm_professional: "Warm Professional",
  playful: "Playful",
  calm_reassuring: "Calm & Reassuring",
  direct: "Direct",
  nurturing: "Nurturing",
  coaching: "Coaching",
  formal: "Formal",
};

const AUDIENCE_LABELS: Record<Audience, string> = {
  staff: "Staff",
  young_person: "Young Person",
  social_worker: "Social Worker",
  manager: "Manager",
  multi_agency: "Multi-Agency",
  family: "Family",
};

// ── Props ───────────────────────────────────────────────────────────────────

interface AriaStudioWorkspaceProps {
  childId?: string;
  childName?: string;
  currentUserId: string;
  currentRole: string;
  onGenerationComplete?: (generationId: string) => void;
}

// ── Generation Response ─────────────────────────────────────────────────────

interface GenerationResponse {
  success: boolean;
  generationId?: string;
  output?: GenerationOutput;
  safety?: SafetyAssessment;
  profile?: {
    childName: string;
    age: number;
    strengths: string[];
    needs: string[];
    riskFlags: string[];
  };
  model?: string;
  error?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export function AriaStudioWorkspace({
  childId,
  childName,
  currentUserId,
  currentRole,
  onGenerationComplete,
}: AriaStudioWorkspaceProps) {
  // ── State ─────────────────────────────────────────────────────────────────
  const [selectedType, setSelectedType] = useState<GenerationType | null>(null);
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState<Tone>("warm_professional");
  const [audience, setAudience] = useState<Audience>("staff");
  const [additionalContext, setAdditionalContext] = useState("");

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!selectedType || !title || !brief) return;

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/aria-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: childId || undefined,
          generationType: selectedType,
          title,
          brief,
          tone,
          audience,
          additionalContext: additionalContext || undefined,
        }),
      });

      const data: GenerationResponse = await res.json();
      setResult(data);

      if (data.success && data.generationId) {
        onGenerationComplete?.(data.generationId);
      }

      if (!data.success) {
        setError(data.error ?? "Generation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setGenerating(false);
    }
  }, [selectedType, title, brief, tone, audience, additionalContext, childId, onGenerationComplete]);

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApprove = useCallback(async () => {
    if (!result?.generationId) return;
    try {
      const res = await fetch("/api/aria-studio/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId: result.generationId, action: "approve" }),
      });
      const data = await res.json();
      if (data.success) {
        setResult((prev) => prev ? { ...prev, success: true } : prev);
      }
    } catch (err) {
      console.error("Approval failed:", err);
    }
  }, [result?.generationId]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setSelectedType(null);
    setTitle("");
    setBrief("");
    setTone("warm_professional");
    setAudience("staff");
    setAdditionalContext("");
    setResult(null);
    setError(null);
  };

  // ── If we have a result, show the output ──────────────────────────────────
  if (result?.output) {
    return (
      <div className="space-y-6">
        {/* Safety panel */}
        {result.safety && (
          <StudioSafetyPanel safety={result.safety} />
        )}

        {/* Profile summary */}
        {result.profile && (
          <ChildProfilePanel profile={result.profile} />
        )}

        {/* Output preview */}
        <StudioOutputPreview output={result.output} />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button onClick={handleReset} variant="outline" size="sm">
            New Generation
          </Button>
          {result.success && currentRole !== "residential_care_worker" && (
            <Button onClick={handleApprove} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Approve
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Main workspace form ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Type selector */}
      <div className="space-y-4">
        {GENERATION_CATEGORIES.map((category) => (
          <div key={category.label}>
            <h3 className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2">
              {category.label}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {category.types.map((type) => {
                const Icon = TYPE_ICONS[type] ?? FileText;
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(isSelected ? null : type)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all text-xs",
                      isSelected
                        ? "border-[var(--cs-aria-gold)] bg-[var(--cs-aria-gold-bg)] ring-1 ring-[var(--cs-aria-gold-soft)]"
                        : "border-[var(--cs-border)] bg-white hover:border-[var(--cs-aria-gold-soft)]",
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-[var(--cs-aria-gold)]" : "text-[var(--cs-text-muted)]")} />
                    <span className={cn("font-medium", isSelected ? "text-[var(--cs-navy)]" : "text-[var(--cs-text-secondary)]")}>
                      {TYPE_LABELS[type]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Configuration */}
      {selectedType && (
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">
            Configure — {TYPE_LABELS[selectedType]}
          </h3>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly keywork session — emotional regulation focus"
              className="w-full rounded-lg border border-[var(--cs-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)]"
            />
          </div>

          {/* Brief */}
          <div>
            <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Brief *</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={3}
              placeholder="Describe what you need. Be specific about the focus, any objectives to link to, and anything to avoid..."
              className="w-full rounded-lg border border-[var(--cs-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)] resize-none"
            />
          </div>

          {/* Tone + Audience row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
                className="w-full rounded-lg border border-[var(--cs-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)]"
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>{TONE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as Audience)}
                className="w-full rounded-lg border border-[var(--cs-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)]"
              >
                {AUDIENCES.map((a) => (
                  <option key={a} value={a}>{AUDIENCE_LABELS[a]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional context */}
          <div>
            <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Additional Context (optional)</label>
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={2}
              placeholder="Any extra information, recent events, or specific things to include..."
              className="w-full rounded-lg border border-[var(--cs-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)] resize-none"
            />
          </div>

          {/* Child context badge */}
          {childId && childName && (
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                Child: {childName}
              </Badge>
              <span className="text-[10px] text-[var(--cs-text-muted)]">Profile will be compiled automatically</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !title || brief.length < 10}
            className="w-full bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Content
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
