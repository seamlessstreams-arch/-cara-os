"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Inline Neurodiversity Profile (point-of-work)
//
// Drops into a recording form. Given a child + a context (incident / restraint /
// behaviour / key work), it surfaces the FEW things the person recording most
// needs to see right now — known triggers, what helps, what makes it worse, the
// signs of shutdown — pulled from the child's unified neurodiversity profile.
// Collapsed by default; nothing shows if there's no profile beyond a quiet
// pointer to the gap. Cara informs judgement; it never diagnoses.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Brain, AlertTriangle, Info } from "lucide-react";
import { useNeurodiversityProfile } from "@/hooks/use-neurodiversity-profile";
import type { NeuroPromptPriority, NeuroRecordingContext } from "@/lib/neurodiversity-profile/types";

const PRIORITY_STYLE: Record<NeuroPromptPriority, { border: string; bg: string; fg: string }> = {
  critical: { border: "#f0b8b2", bg: "#fdeceb", fg: "#c0392b" },
  important: { border: "#f0dcb0", bg: "#fdf4e3", fg: "#b7791f" },
  helpful: { border: "#b6e4d7", bg: "#f0faf7", fg: "#0d9488" },
};

export function InlineNeuroProfilePanel({
  childId,
  context = "overview",
}: {
  childId: string;
  context?: NeuroRecordingContext;
}) {
  const { data, isLoading } = useNeurodiversityProfile(childId, context);
  const [open, setOpen] = useState(false);
  const res = data?.data;
  const profile = res?.profile;
  const prompts = res?.prompts ?? [];

  if (isLoading || !profile) return null;

  // No profile: a single quiet pointer, never alarming.
  if (!profile.hasProfile) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--cs-border,#e2e8ec)] bg-[var(--cs-surface,#fff)] px-3 py-2">
        <p className="flex items-center gap-2 text-xs text-[var(--cs-text-muted,#6c7a83)]">
          <Brain className="h-3.5 w-3.5" /> No neurodiversity profile on file for {profile.childName}. If needs are emerging, consider an assessment.
        </p>
      </div>
    );
  }

  const criticalCount = prompts.filter((p) => p.priority === "critical").length;

  return (
    <div className="rounded-lg border border-[var(--cs-border,#e2e8ec)] bg-[var(--cs-surface,#fff)]">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left">
        <span className="flex items-center gap-2">
          <Brain className="h-4 w-4" style={{ color: "var(--cs-teal,#0d9488)" }} />
          <span className="text-sm font-medium text-[var(--cs-text,#14202a)]">
            {profile.childName}&apos;s neurodiversity — what to know now
          </span>
          <span className="flex gap-1">
            {profile.conditions.slice(0, 3).map((c) => (
              <span key={c.label} className="rounded-full bg-[var(--cs-surface-subtle,#f0faf7)] px-2 py-0.5 text-[10px] font-medium" style={{ color: "var(--cs-teal,#0d9488)" }}>
                {c.label}
              </span>
            ))}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {criticalCount > 0 && !open && (
            <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#c0392b" }}>
              <AlertTriangle className="h-3.5 w-3.5" /> {criticalCount}
            </span>
          )}
          {open ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted,#6c7a83)]" /> : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted,#6c7a83)]" />}
        </span>
      </button>

      {open && (
        <div className="space-y-2 border-t border-[var(--cs-border,#e2e8ec)] px-3 py-2.5">
          {prompts.length === 0 && (
            <p className="text-xs text-[var(--cs-text-muted,#6c7a83)]">A profile is on file but has no specific guidance recorded for this context yet.</p>
          )}
          {prompts.map((p) => {
            const s = PRIORITY_STYLE[p.priority];
            return (
              <div key={p.id} className="rounded-md border px-2.5 py-1.5" style={{ borderColor: s.border, backgroundColor: s.bg }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: s.fg }}>
                  {p.label}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {p.items.map((it, i) => (
                    <li key={i} className="text-xs leading-snug text-[var(--cs-text,#14202a)]">
                      · {it}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {profile.reviewGaps.length > 0 && (
            <div className="rounded-md bg-[var(--cs-surface-subtle,#f6f8f9)] px-2.5 py-1.5">
              {profile.reviewGaps.map((g) => (
                <p key={g.id} className="text-[11px] text-[var(--cs-text-muted,#6c7a83)]">
                  · {g.message}
                </p>
              ))}
            </div>
          )}

          <p className="flex items-start gap-1.5 pt-0.5 text-[11px] italic leading-relaxed text-[var(--cs-text-muted,#6c7a83)]">
            <Info className="mt-0.5 h-3 w-3 shrink-0" /> {profile.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}

export default InlineNeuroProfilePanel;
