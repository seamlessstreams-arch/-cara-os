"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — CONTEXTUAL QUICK ACTIONS
//
// A collapsible card that sits alongside the existing CaraQuickActions on
// record pages. Pre-fills Cara Studio with the correct artifact type,
// child context, and framework for the current page context.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import type { CaraStudioArtifactType, CaraStudioFramework, CaraStudioTone } from "@/types/cara-studio";

// ── Types ───────────────────────────────────────────────────────────────────

interface StudioAction {
  label: string;
  artifactType: CaraStudioArtifactType;
  framework?: CaraStudioFramework;
  tone?: CaraStudioTone;
  context?: string;
}

interface StudioQuickActionsProps {
  childId?: string;
  childName?: string;
  sourceType: "young_person" | "incident" | "daily_log" | "handover" | "staff" | "dashboard" | "supervision";
  sourceId?: string;
  defaultOpen?: boolean;
  className?: string;
}

// ── Context-specific action configs ─────────────────────────────────────────

function getActions(sourceType: string, childName?: string): StudioAction[] {
  switch (sourceType) {
    case "young_person":
      return [
        { label: "Key Work Session", artifactType: "keywork_session", framework: "pace", context: childName ? `Key work session for ${childName}` : undefined },
        { label: "Direct Work Activity", artifactType: "direct_work_session", framework: "therapeutic_parenting" },
        { label: "Child-Friendly Explanation", artifactType: "child_friendly_explanation", tone: "child_friendly" },
        { label: "Visual Formulation", artifactType: "visual_formulation", framework: "psychologically_informed" },
        { label: "Risk Review", artifactType: "risk_review", framework: "trauma_informed" },
        { label: "Care Plan Update", artifactType: "care_plan_update" },
        { label: "Social Worker Update", artifactType: "social_worker_update", tone: "legal_careful" },
      ];
    case "incident":
      return [
        { label: "Incident Learning Review", artifactType: "incident_learning_review", framework: "trauma_informed" },
        { label: "Safeguarding Review", artifactType: "safeguarding_review", framework: "safeguarding_led" },
        { label: "Staff Training from Incident", artifactType: "staff_training", tone: "plain_english" },
        { label: "Action Plan", artifactType: "action_plan" },
        { label: "Scenario Simulation", artifactType: "scenario_simulation", tone: "plain_english" },
      ];
    case "daily_log":
      return [
        { label: "Key Work Session", artifactType: "keywork_session", framework: "pace" },
        { label: "Risk Review", artifactType: "risk_review" },
        { label: "Management Oversight", artifactType: "management_oversight" },
      ];
    case "handover":
      return [
        { label: "Management Oversight", artifactType: "management_oversight" },
        { label: "Team Meeting Discussion", artifactType: "team_meeting_discussion" },
        { label: "Action Plan", artifactType: "action_plan" },
      ];
    case "staff":
      return [
        { label: "Staff Training Session", artifactType: "staff_training", tone: "plain_english" },
        { label: "Supervision Prompts", artifactType: "supervision_prompt", tone: "therapeutic" },
        { label: "Scenario Simulation", artifactType: "scenario_simulation", tone: "plain_english" },
        { label: "Reflective Workbook", artifactType: "reflective_workbook", tone: "therapeutic" },
      ];
    case "supervision":
      return [
        { label: "Supervision Prompts", artifactType: "supervision_prompt", tone: "therapeutic" },
        { label: "Reflective Workbook", artifactType: "reflective_workbook", tone: "therapeutic" },
        { label: "Staff Training", artifactType: "staff_training", tone: "plain_english" },
      ];
    case "dashboard":
      return [
        { label: "Management Oversight", artifactType: "management_oversight", tone: "formal" },
        { label: "Team Meeting Discussion", artifactType: "team_meeting_discussion" },
        { label: "Reg 45 Summary", artifactType: "reg45_summary", tone: "formal" },
        { label: "RI Briefing", artifactType: "ri_briefing" },
      ];
    default:
      return [
        { label: "Management Oversight", artifactType: "management_oversight" },
      ];
  }
}

// ── Build URL ───────────────────────────────────────────────────────────────

function buildUrl(action: StudioAction, childId?: string): string {
  const params = new URLSearchParams();
  params.set("type", action.artifactType);
  if (childId) params.set("childId", childId);
  if (action.framework) params.set("framework", action.framework);
  if (action.tone) params.set("tone", action.tone);
  if (action.context) params.set("context", action.context);
  return `/cara-studio?${params.toString()}`;
}

// ── Component ───────────────────────────────────────────────────────────────

export function StudioQuickActions({
  childId,
  childName,
  sourceType,
  sourceId,
  defaultOpen = false,
  className,
}: StudioQuickActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const actions = getActions(sourceType, childName);

  return (
    <div className={cn("rounded-xl border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)]/40 overflow-hidden", className)}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-[var(--cs-cara-gold-bg)] transition-colors"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--cs-navy)]">
          <Sparkles className="h-3 w-3 text-[var(--cs-cara-gold)]" />
        </div>
        <span className="text-xs font-semibold text-[var(--cs-navy)] flex-1 text-left">Cara Studio</span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
        )}
      </button>

      {/* Actions */}
      {open && (
        <div className="px-3 pb-3 grid grid-cols-2 gap-1.5">
          {actions.map((action) => (
            <button
              key={action.artifactType}
              onClick={() => router.push(buildUrl(action, childId))}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--cs-cara-gold-soft)] bg-white px-2.5 py-2 text-[11px] font-medium text-[var(--cs-navy)] transition-all hover:border-[var(--cs-cara-gold)] hover:bg-[var(--cs-cara-gold-bg)] hover:shadow-sm"
            >
              <Sparkles className="h-2.5 w-2.5 text-[var(--cs-cara-gold)] shrink-0" />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
