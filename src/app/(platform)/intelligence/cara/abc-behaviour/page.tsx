"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — ABC Behaviour Patterns page · §16
// Antecedent → Behaviour → Consequence, visualised over the behaviour log.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ABCBehaviourPanel } from "@/components/abc-behaviour/abc-behaviour-panel";
import { GitBranch } from "lucide-react";

export default function ABCBehaviourPage() {
  return (
    <PageShell
      title="ABC Behaviour Patterns"
      subtitle="Antecedent → Behaviour → Consequence, visualised · a lens for reflection, never a prediction"
      caraContext={{ pageTitle: "ABC Behaviour Patterns", sourceType: "general" }}
    >
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 p-4">
        <GitBranch className="mt-0.5 h-6 w-6 shrink-0 text-teal-600" />
        <div>
          <p className="font-semibold text-teal-900">See the pattern before the incident.</p>
          <p className="mt-0.5 text-sm text-teal-800">
            ABC is the oldest lens in behaviour support: what came before (antecedent), what happened (behaviour), what followed
            (consequence). Cara links the behaviour log into recurring A→B→C chains per child, and shows which responses tend to keep a
            behaviour contained. It&apos;s a lens for reflection and planning — never a judgement, never a prediction. What contains one
            child may not another; human judgement decides.
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        <ABCBehaviourPanel />
      </div>
    </PageShell>
  );
}
