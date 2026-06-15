"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Inline Practice Learning (Layer 5 at the point of work).
// The retrospective companion to the reasoning heart: what we've LEARNED about
// this child from past events — recurring themes, what's helped / to do
// differently, and what Cara should watch for. Condensed by default, expandable.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Loader2, ChevronDown, ChevronUp, Repeat, Lightbulb, Eye } from "lucide-react";
import { usePracticeLearning } from "@/hooks/use-practice-learning";
import { ConfidencePill } from "@/components/cara-reasoning/confidence-pill";

function Mini({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">
        <Icon className="h-3.5 w-3.5 text-[var(--cs-teal,#0d9488)]" />
        {label}
      </p>
      {children}
    </div>
  );
}

export function InlinePracticeLearning({ childId, childName }: { childId: string; childName?: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading, isError } = usePracticeLearning(childId);
  const L = data?.data.learning;

  const helped = [...(L?.whatWorked ?? []), ...(L?.doDifferently ?? [])];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <BookOpen className="h-4 w-4 text-[var(--cs-teal,#0d9488)]" />
          Practice Learning{childName ? ` — ${childName}` : ""}
          {L && <ConfidencePill level={L.confidence} />}
        </CardTitle>
        <CardDescription>What we&apos;ve learned from past events — to carry into this one.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Reviewing what we&apos;ve learned…
          </div>
        )}
        {isError && <p className="text-sm text-[var(--cs-text-muted)]">Practice learning is not available for this child.</p>}

        {L && (
          <div className="space-y-3">
            {L.learningThemes.length > 0 && (
              <Mini icon={Repeat} label="Recurring themes">
                <div className="flex flex-wrap gap-1.5">
                  {L.learningThemes.slice(0, 4).map((t, i) => (
                    <span key={i} className="inline-flex items-center rounded-full border border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] px-2.5 py-0.5 text-xs text-[var(--cs-text)]">
                      {t.theme} · {t.frequency}×
                    </span>
                  ))}
                </div>
              </Mini>
            )}

            {helped.length > 0 && (
              <Mini icon={Lightbulb} label="What's helped / to do differently">
                <ul className="space-y-1">
                  {helped.slice(0, 3).map((s, i) => (
                    <li key={i} className="text-sm text-[var(--cs-text)]">{s}</li>
                  ))}
                </ul>
              </Mini>
            )}

            {L.whatCaraShouldLearn.length > 0 && (
              <Mini icon={Eye} label="What to watch for">
                <ul className="space-y-1">
                  {L.whatCaraShouldLearn.slice(0, 2).map((w, i) => (
                    <li key={i} className="text-sm text-[var(--cs-text)]">
                      <span className="font-medium text-[var(--cs-navy)]">{w.trigger}:</span> {w.suggestion}
                    </li>
                  ))}
                </ul>
              </Mini>
            )}

            {!L.learningThemes.length && !helped.length && !L.whatCaraShouldLearn.length && (
              <p className="text-sm text-[var(--cs-text-muted)]">
                No strong learning pattern yet — keep capturing debrief learning so themes can emerge.
              </p>
            )}

            <button
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--cs-teal,#0d9488)] hover:underline"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? "Hide organisational memory" : "Show organisational memory"}
            </button>

            {expanded && (
              <div className="mt-2 space-y-1 border-t border-[var(--cs-border-subtle)] pt-3">
                {L.organisationalMemory.map((m, i) => (
                  <p key={i} className="text-sm leading-relaxed text-[var(--cs-text)]">{m}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
