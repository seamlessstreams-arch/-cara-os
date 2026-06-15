"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Practice Reasoning (OS Layer 3, made visible)
//
// The practitioner's reasoning view for a child: what we're noticing, what it
// might mean, what the child may be communicating, risks, strengths, competing
// explanations, options, next steps, how we'll know — with explicit confidence
// and an uncertainty register. Deterministic; no model calls.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Loader2, Lock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePracticeReasoning } from "@/hooks/use-practice-reasoning";
import { PracticeReasoningPanel } from "@/components/cara-reasoning/practice-reasoning-panel";

export default function PracticeReasoningPage() {
  const [childId, setChildId] = useState<string | undefined>(undefined);
  const { data, isLoading, isError, error } = usePracticeReasoning(childId);
  const payload = data?.data;
  const activeId = payload?.child.id;

  return (
    <PageShell
      title="Practice Reasoning"
      subtitle="What we're noticing, what it means, what we're missing, and what should happen next — with confidence made explicit"
      icon={<Brain className="h-5 w-5" />}
    >
      {/* Child picker */}
      {payload && payload.children.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-[var(--cs-teal,#0d9488)]" />
              Choose a child
            </CardTitle>
            <CardDescription>Reasoning is assembled deterministically from this child's records.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {payload.children.map((c) => {
                const selected = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setChildId(c.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      selected
                        ? "border-[var(--cs-teal,#0d9488)] bg-[var(--cs-teal,#0d9488)]/10 font-medium text-[var(--cs-navy)]"
                        : "border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] text-[var(--cs-text)] hover:bg-[var(--cs-surface-elevated)]",
                    )}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 py-12 text-[var(--cs-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Reasoning over the records…
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <p className="text-sm font-medium text-amber-900">Practice reasoning is not available</p>
            <p className="text-sm text-amber-800">
              {(error as Error)?.message ?? "You need the view-Cara-intelligence permission to see this."}
            </p>
          </div>
        </div>
      )}

      {payload && (
        <div className="space-y-1">
          <p className="px-1 text-sm font-medium text-[var(--cs-navy)]">Reasoning for {payload.child.name}</p>
          <PracticeReasoningPanel key={activeId} reasoning={payload.reasoning} />
        </div>
      )}
    </PageShell>
  );
}
