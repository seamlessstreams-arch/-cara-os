"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Inline Practice Reasoning (the engine heart at the point of work).
// Surfaces the reasoning engine's read of THIS child wherever a decision is being
// made (e.g. management oversight) — condensed by default, expandable to the full
// reasoning. Not a separate page; the brain shows up where it's needed.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Loader2, ChevronDown, ChevronUp, Eye, MessageCircleHeart, HelpCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { PracticeReasoning, ReasoningSignalsInput } from "@/lib/cara-reasoning/types";
import { ConfidencePill } from "./confidence-pill";
import { PracticeReasoningPanel } from "./practice-reasoning-panel";

interface PracticeReasoningPayload {
  child: { id: string; name: string };
  children: Array<{ id: string; name: string }>;
  signals: ReasoningSignalsInput;
  reasoning: PracticeReasoning;
}
interface PracticeReasoningResponse {
  data: PracticeReasoningPayload;
}

function usePracticeReasoning(childId?: string) {
  return useQuery({
    queryKey: ["practice-reasoning", childId ?? "default"],
    queryFn: () =>
      api.get<PracticeReasoningResponse>(
        `/practice-reasoning${childId ? `?childId=${encodeURIComponent(childId)}` : ""}`,
      ),
    staleTime: 60 * 1000,
  });
}

function MiniSection({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
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

export function InlinePracticeReasoning({ childId, childName }: { childId: string; childName?: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading, isError } = usePracticeReasoning(childId);
  const r = data?.data.reasoning;

  const unknownMissing = (r?.uncertaintyRegister ?? []).filter((u) => u.status !== "known").slice(0, 4);
  const who = childName ?? "the child";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Brain className="h-4 w-4 text-[var(--cs-teal,#0d9488)]" />
          Practice Reasoning{childName ? ` — ${childName}` : ""}
          {r && <ConfidencePill level={r.overallConfidence} />}
        </CardTitle>
        <CardDescription>The reasoning engine&apos;s read of this child, surfaced here to inform your oversight.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Reasoning over {who}&apos;s records…
          </div>
        )}
        {isError && <p className="text-sm text-[var(--cs-text-muted)]">Practice reasoning is not available for this child.</p>}

        {r && (
          <div className="space-y-3">
            <MiniSection icon={Eye} label="What we're noticing">
              <ul className="space-y-1">
                {r.noticing.slice(0, 3).map((f, i) => (
                  <li key={i} className="flex items-start justify-between gap-3">
                    <span className="text-sm text-[var(--cs-text)]">{f.statement}</span>
                    <ConfidencePill level={f.confidence} short />
                  </li>
                ))}
              </ul>
            </MiniSection>

            <MiniSection icon={MessageCircleHeart} label={`What ${who} may be communicating`}>
              <ul className="space-y-1">
                {r.childMayBeCommunicating.slice(0, 2).map((t, i) => (
                  <li key={i} className="text-sm leading-relaxed text-[var(--cs-text)]">
                    {t}
                  </li>
                ))}
              </ul>
            </MiniSection>

            {unknownMissing.length > 0 && (
              <MiniSection icon={HelpCircle} label="What's unknown or missing">
                <ul className="space-y-1">
                  {unknownMissing.map((u, i) => (
                    <li key={i} className="text-sm text-[var(--cs-text)]">
                      <span className="font-medium text-[var(--cs-navy)]">{u.area}:</span> {u.detail}
                    </li>
                  ))}
                </ul>
              </MiniSection>
            )}

            <button
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--cs-teal,#0d9488)] hover:underline"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? "Hide full reasoning" : "Show full reasoning"}
            </button>

            {expanded && (
              <div className="mt-2 border-t border-[var(--cs-border-subtle)] pt-4">
                <PracticeReasoningPanel reasoning={r} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
