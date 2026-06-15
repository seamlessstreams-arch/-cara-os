"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Workflow Assurance (Management Oversight Engine)
//
// A manager's single view of the whole professional response to an event:
// deterministic professional oversight, a safe child-addressed version, complete
// workflow visibility, Cara Intelligence, actions and role-gated sign-off.
// Loads a deterministic worked example so it works in any environment.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ShieldCheck, Loader2, Lock, Info } from "lucide-react";
import { useOversightWorkflowExample } from "@/hooks/use-oversight-workflow";
import { OversightWorkflowPanel } from "@/components/oversight/oversight-workflow-panel";

export default function OversightWorkflowPage() {
  const { data, isLoading, isError, error } = useOversightWorkflowExample();
  const payload = data?.data;

  return (
    <PageShell
      title="Workflow Assurance"
      subtitle="Management oversight across the whole workflow — deterministic, inspection-ready"
      icon={<ShieldCheck className="h-5 w-5" />}
    >
      {isLoading && (
        <div className="flex items-center gap-2 py-12 text-[var(--cs-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing the oversight workflow…
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <p className="text-sm font-medium text-amber-900">Management oversight is not available for your role</p>
            <p className="text-sm text-amber-800">
              {(error as Error)?.message ??
                "You need the add-oversight permission to view workflow assurance."}
            </p>
          </div>
        </div>
      )}

      {payload && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal,#0d9488)]" aria-hidden />
            <p className="text-xs leading-relaxed text-[var(--cs-text-muted)]">{payload.disclaimer}</p>
          </div>
          <OversightWorkflowPanel input={payload.input} result={payload.result} />
        </div>
      )}
    </PageShell>
  );
}
