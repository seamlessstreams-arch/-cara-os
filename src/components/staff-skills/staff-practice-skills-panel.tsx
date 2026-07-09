"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Staff Practice Skills Panel
//
// A practitioner's practice picture for supervision: five lenses (competency,
// observed practice, recording quality, reflective supervision, relational
// practice), the strengths to build on, the growing edges, and a few supportive
// prompts to bring to the next session. Developmental, never a rank — wellbeing
// is held with care.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, GraduationCap, Loader2, Sparkles, Compass, Heart } from "lucide-react";
import { useStaffPracticeSkills } from "@/hooks/use-staff-practice-skills";
import type { SkillSignal, StaffSupervisionPrompt } from "@/lib/staff-practice-skills/types";

const SIGNAL_STYLE: Record<SkillSignal, { label: string; cls: string }> = {
  strong: { label: "Strong", cls: "bg-[var(--cs-success-bg)] text-[var(--cs-success)]" },
  developing: { label: "Developing", cls: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]" },
  needs_support: { label: "Needs support", cls: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]" },
  no_data: { label: "No data yet", cls: "bg-[var(--cs-surface-subtle)] text-[var(--cs-text-muted)]" },
};

const PICTURE_LABEL: Record<string, string> = {
  well_established: "Well established",
  developing_well: "Developing well",
  emerging: "Emerging",
  insufficient_data: "Not enough recorded yet",
};

const PROMPT_ICON = { development: Compass, strength: Sparkles, wellbeing: Heart } as const;

function PromptRow({ p }: { p: StaffSupervisionPrompt }) {
  const Icon = PROMPT_ICON[p.kind];
  const iconCls = p.kind === "wellbeing" ? "text-[var(--cs-risk)]" : p.kind === "strength" ? "text-[var(--cs-success)]" : "text-[var(--cs-warning)]";
  return (
    <li className="flex items-start gap-2 text-xs leading-relaxed text-[var(--cs-text,#14202a)]">
      <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", iconCls)} />
      {p.prompt}
    </li>
  );
}

export function StaffPracticeSkillsPanel({ staffId }: { staffId: string; staffName?: string }) {
  const { data, isLoading, isError } = useStaffPracticeSkills(staffId);
  const [open, setOpen] = useState(true);
  const p = data?.data;

  return (
    <Card className="border-[var(--cs-border,#e2e8ec)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-4 w-4" style={{ color: "var(--cs-teal,#0d9488)" }} />
          Practice Skills
          {p?.hasData && (
            <span className="rounded-full bg-[var(--cs-surface-subtle,#f0faf7)] px-2 py-0.5 text-[11px] font-medium" style={{ color: "var(--cs-teal,#0d9488)" }}>
              {PICTURE_LABEL[p.overallPicture] ?? p.overallPicture}
            </span>
          )}
        </CardTitle>
        <CardDescription>A developmental picture for supervision — never a rank or a grade.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="flex items-center gap-2 py-4 text-sm text-[var(--cs-text-muted,#6c7a83)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Bringing the signals together…
          </div>
        )}
        {isError && <p className="py-3 text-sm text-[var(--cs-text-muted,#6c7a83)]">Couldn&apos;t load practice skills right now.</p>}

        {p && !p.hasData && (
          <p className="rounded-lg border border-dashed border-[var(--cs-border,#e2e8ec)] p-3 text-sm text-[var(--cs-text-muted,#6c7a83)]">
            No practice signals recorded for {p.staffName} in the last {p.windowDays} days yet — competency scores,
            observations, supervision, recording and key-work will build this picture over time.
          </p>
        )}

        {p && p.hasData && (
          <>
            <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#6c7a83)]">Practice lenses</span>
              {open ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted,#6c7a83)]" /> : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted,#6c7a83)]" />}
            </button>
            {open && (
              <div className="space-y-1.5">
                {p.lenses.map((l) => {
                  const s = SIGNAL_STYLE[l.signal];
                  return (
                    <div key={l.key} className="flex items-start justify-between gap-2 rounded-lg border border-[var(--cs-border,#e2e8ec)] px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--cs-text,#14202a)]">{l.label}</p>
                        <p className="text-xs text-[var(--cs-text-muted,#6c7a83)]">{l.detail}</p>
                      </div>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", s.cls)}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {p.strengths.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#6c7a83)]">Strengths to build on</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {p.strengths.map((s, i) => (
                    <span key={i} className="rounded-full bg-[var(--cs-success-bg)] px-2 py-0.5 text-[11px] text-[var(--cs-success)]">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {p.developmentAreas.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#6c7a83)]">Growing edges</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {p.developmentAreas.map((s, i) => (
                    <span key={i} className="rounded-full bg-[var(--cs-warning-bg)] px-2 py-0.5 text-[11px] text-[var(--cs-warning)]">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {p.supervisionPrompts.length > 0 && (
              <div className="rounded-lg bg-[var(--cs-surface-subtle,#f6f8f9)] p-3">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#6c7a83)]">For the next supervision</p>
                <ul className="space-y-1.5">
                  {p.supervisionPrompts.map((pr) => (
                    <PromptRow key={pr.id} p={pr} />
                  ))}
                </ul>
              </div>
            )}
            <p className="text-[11px] italic leading-relaxed text-[var(--cs-text-muted,#6c7a83)]">{p.disclaimer}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default StaffPracticeSkillsPanel;
