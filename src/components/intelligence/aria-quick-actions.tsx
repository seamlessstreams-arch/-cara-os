"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA QUICK ACTIONS
// A collapsible card of ARIA shortcut buttons that can be embedded on any
// record page. Each button navigates to the relevant ARIA Intelligence page
// with context pre-loaded via query params.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sparkles, ScrollText, ListChecks, Puzzle, Radar,
  Heart, FileText, Shield, Brain, CheckSquare,
  ChevronDown, ChevronUp,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AriaQuickActionsProps {
  /** The young person this record belongs to */
  childId: string;
  /** The type of parent record (incident, daily_log, etc.) */
  sourceType?: string;
  /** The ID of the parent record */
  sourceId?: string;
  /** Show expanded by default */
  defaultOpen?: boolean;
  className?: string;
}

// ── Actions config ────────────────────────────────────────────────────────────

interface ActionConfig {
  label: string;
  description: string;
  icon: React.ElementType;
  colour: string;
  href: (childId: string, sourceType: string, sourceId: string) => string;
}

const ACTIONS: ActionConfig[] = [
  {
    label: "Ask ARIA to Review",
    description: "Run a structured situation analysis on this record",
    icon: Sparkles,
    colour: "text-[var(--cs-aria-gold)] bg-[var(--cs-aria-gold-bg)] border-[var(--cs-aria-gold-soft)] hover:bg-[var(--cs-aria-gold-bg)]",
    href: (c, t, s) => `/intelligence/aria/situation?child_id=${c}&source_type=${t}&source_id=${s}`,
  },
  {
    label: "Generate Oversight",
    description: "Draft a management oversight record from this",
    icon: ScrollText,
    colour: "text-[var(--cs-text-secondary)] bg-white border-[var(--cs-border)] hover:bg-[var(--cs-surface)]",
    href: (c, t, s) => `/intelligence/aria/oversight?child_id=${c}&source_type=${t}&source_id=${s}`,
  },
  {
    label: "Create Key Work Session",
    description: "Build a key work session plan linked to this",
    icon: ListChecks,
    colour: "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100",
    href: (c) => `/intelligence/aria/keywork?child_id=${c}`,
  },
  {
    label: "Create Child Resource",
    description: "Generate a child-friendly resource or activity",
    icon: Puzzle,
    colour: "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
    href: (c) => `/intelligence/aria/resources?child_id=${c}`,
  },
  {
    label: "Check What's Missing",
    description: "Scan for missing evidence or compliance gaps",
    icon: Radar,
    colour: "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100",
    href: (c) => `/intelligence/aria/oversight-radar?child_id=${c}`,
  },
  {
    label: "Child-Friendly Version",
    description: "Convert this record into child-friendly language",
    icon: Heart,
    colour: "text-pink-700 bg-pink-50 border-pink-200 hover:bg-pink-100",
    href: (c, t, s) => `/intelligence/aria/resources?child_id=${c}&source_type=convert&source_id=${s}`,
  },
  {
    label: "Social Worker Update",
    description: "Draft an update letter for the social worker",
    icon: FileText,
    colour: "text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
    href: (c, t, s) => `/intelligence/aria/oversight?child_id=${c}&style=social_worker&source_id=${s}`,
  },
  {
    label: "Regulation 45 Evidence",
    description: "Extract Reg 45 evidence from this record",
    icon: Shield,
    colour: "text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100",
    href: (c, t, s) => `/intelligence/aria/oversight?child_id=${c}&style=regulation_45&source_id=${s}`,
  },
  {
    label: "Reflective Debrief",
    description: "Create a staff reflective practice debrief",
    icon: Brain,
    colour: "text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100",
    href: (c, t, s) => `/intelligence/aria/oversight?child_id=${c}&style=reflective&source_id=${s}`,
  },
  {
    label: "Create Follow-Up Task",
    description: "Add a follow-up task linked to this record",
    icon: CheckSquare,
    colour: "text-[var(--cs-text-secondary)] bg-white border-[var(--cs-border)] hover:bg-[var(--cs-surface)]",
    href: (c, t, s) => `/tasks?new=1&child_id=${c}&linked_id=${s}&source_type=${t}`,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function AriaQuickActions({
  childId,
  sourceType = "free_text",
  sourceId = "",
  defaultOpen = false,
  className,
}: AriaQuickActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("rounded-2xl border border-[var(--cs-aria-gold-soft)] bg-gradient-to-br from-[var(--cs-aria-gold-bg)] to-white", className)}>
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-[var(--cs-navy)] shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--cs-navy)]">ARIA Quick Actions</p>
          <p className="text-[10px] text-[var(--cs-aria-gold)] leading-tight">
            AI-powered actions for this record — all outputs require human review
          </p>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0" />
          : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0" />
        }
      </button>

      {/* Actions grid */}
      {open && (
        <div className="px-4 pb-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              const href = action.href(childId, sourceType, sourceId);
              return (
                <button
                  key={action.label}
                  onClick={() => router.push(href)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    action.colour
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-tight">{action.label}</p>
                    <p className="text-[10px] opacity-70 leading-snug mt-0.5">{action.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[var(--cs-aria-gold)] italic pt-1 border-t border-[var(--cs-aria-gold-soft)]">
            All ARIA-generated content is a draft and requires professional review before use.
          </p>
        </div>
      )}
    </div>
  );
}
