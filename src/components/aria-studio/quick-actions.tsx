"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — QUICK ACTION BUTTONS
//
// Contextual action buttons that surface across existing Cornerstone pages.
// Each button deep-links into ARIA Studio with the right artifact type,
// child context, and framework pre-selected.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AriaStudioArtifactType, AriaStudioFramework, AriaStudioTone } from "@/types/aria-studio";

// ── Quick action definition ─────────────────────────────────────────────────

export interface QuickAction {
  label: string;
  artifactType: AriaStudioArtifactType;
  childId?: string;
  framework?: AriaStudioFramework;
  tone?: AriaStudioTone;
  additionalContext?: string;
}

// ── Pre-defined action sets for different pages ──────────────────────────────

export function getChildProfileActions(childId: string, childName: string): QuickAction[] {
  return [
    { label: "Key Work Session", artifactType: "keywork_session", childId, framework: "pace", additionalContext: `Key work session for ${childName}` },
    { label: "Direct Work Session", artifactType: "direct_work_session", childId, framework: "therapeutic_parenting" },
    { label: "Child-Friendly Explanation", artifactType: "child_friendly_explanation", childId, tone: "child_friendly" },
    { label: "Risk Review", artifactType: "risk_review", childId, framework: "trauma_informed" },
    { label: "Social Worker Update", artifactType: "social_worker_update", childId, tone: "professional_legal" },
    { label: "Visual Formulation", artifactType: "visual_formulation", childId, framework: "psychologically_informed" },
    { label: "Care Plan Update", artifactType: "care_plan_update", childId },
  ];
}

export function getIncidentActions(childId?: string): QuickAction[] {
  return [
    { label: "Incident Learning Review", artifactType: "incident_learning_review", childId, framework: "trauma_informed" },
    { label: "Safeguarding Review", artifactType: "safeguarding_review", childId, framework: "safeguarding_led" },
    { label: "Staff Training from Incident", artifactType: "staff_training", tone: "training_focused" },
    { label: "Action Plan", artifactType: "action_plan", childId },
  ];
}

export function getDashboardActions(): QuickAction[] {
  return [
    { label: "Management Oversight", artifactType: "management_oversight", tone: "inspection_ready" },
    { label: "Team Meeting Discussion", artifactType: "team_meeting_discussion" },
    { label: "Supervision Prompts", artifactType: "supervision_prompt", tone: "reflective" },
    { label: "Reg 45 Summary", artifactType: "reg45_summary", tone: "inspection_ready" },
    { label: "RI Briefing", artifactType: "ri_briefing", tone: "inspection_ready" },
  ];
}

export function getStaffActions(): QuickAction[] {
  return [
    { label: "Staff Training Session", artifactType: "staff_training", tone: "training_focused" },
    { label: "Scenario Simulation", artifactType: "scenario_simulation", tone: "training_focused" },
    { label: "Reflective Workbook", artifactType: "reflective_workbook", tone: "reflective" },
    { label: "Quiz", artifactType: "quiz", tone: "training_focused" },
    { label: "Flashcards", artifactType: "flashcards" },
  ];
}

export function getComplianceActions(): QuickAction[] {
  return [
    { label: "Ofsted Readiness Summary", artifactType: "ofsted_readiness_summary", tone: "inspection_ready" },
    { label: "Reg 45 Summary", artifactType: "reg45_summary", tone: "inspection_ready" },
    { label: "Annex A Update", artifactType: "annex_a_update", tone: "inspection_ready" },
    { label: "RI Briefing", artifactType: "ri_briefing" },
  ];
}

// ── Build ARIA Studio URL with pre-filled params ─────────────────────────────

function buildStudioUrl(action: QuickAction): string {
  const params = new URLSearchParams();
  params.set("type", action.artifactType);
  if (action.childId) params.set("childId", action.childId);
  if (action.framework) params.set("framework", action.framework);
  if (action.tone) params.set("tone", action.tone);
  if (action.additionalContext) params.set("context", action.additionalContext);
  return `/aria-studio?${params.toString()}`;
}

// ── Quick Action Button ──────────────────────────────────────────────────────

export function AriaQuickActionButton({
  action,
  variant = "outline",
  size = "sm",
  className,
}: {
  action: QuickAction;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const router = useRouter();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => router.push(buildStudioUrl(action))}
      className={cn(
        "gap-1.5 text-xs border-[var(--cs-aria-gold-soft)] text-[var(--cs-navy)] hover:bg-[var(--cs-aria-gold-bg)] hover:border-[var(--cs-aria-gold)]",
        className,
      )}
    >
      <Sparkles className="h-3 w-3 text-[var(--cs-aria-gold)]" />
      {action.label}
    </Button>
  );
}

// ── Quick Action Bar (horizontal row) ────────────────────────────────────────

export function AriaQuickActionBar({
  actions,
  title = "ARIA Studio",
  className,
}: {
  actions: QuickAction[];
  title?: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <div className={cn("rounded-xl border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)]/50 p-3", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-[var(--cs-aria-gold)]" />
        <span className="text-[10px] font-semibold text-[var(--cs-navy)] uppercase tracking-wide">{title}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={`${action.artifactType}-${action.childId ?? ""}`}
            onClick={() => router.push(buildStudioUrl(action))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cs-aria-gold-soft)] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[var(--cs-navy)] transition-all hover:border-[var(--cs-aria-gold)] hover:bg-[var(--cs-aria-gold-bg)] hover:shadow-sm"
          >
            <Sparkles className="h-2.5 w-2.5 text-[var(--cs-aria-gold)]" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Quick Action Grid (card layout) ──────────────────────────────────────────

export function AriaQuickActionGrid({
  actions,
  title = "Generate with ARIA Studio",
  columns = 3,
  className,
}: {
  actions: QuickAction[];
  title?: string;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const router = useRouter();
  const gridCols = columns === 2 ? "grid-cols-2" : columns === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--cs-navy)]">
          <Sparkles className="h-3 w-3 text-[var(--cs-aria-gold)]" />
        </div>
        <span className="text-xs font-semibold text-[var(--cs-navy)]">{title}</span>
      </div>
      <div className={cn("grid gap-2", gridCols)}>
        {actions.map((action) => (
          <button
            key={`${action.artifactType}-${action.childId ?? ""}`}
            onClick={() => router.push(buildStudioUrl(action))}
            className="flex items-center gap-2 rounded-xl border border-[var(--cs-border)] bg-white p-3 text-left transition-all hover:border-[var(--cs-aria-gold-soft)] hover:bg-[var(--cs-aria-gold-bg)]/30 hover:shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--cs-aria-gold)] shrink-0" />
            <span className="text-xs font-medium text-[var(--cs-text-secondary)]">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
