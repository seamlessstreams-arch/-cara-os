"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Quality Gates page
// The enforcement counterpart to the Health Check: what can't be finalised yet.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { PageShell } from "@/components/layout/page-shell";
import { QualityGatePanel } from "@/components/quality-gates/quality-gate-panel";
import { Lock } from "lucide-react";

export default function QualityGatesPage() {
  return (
    <PageShell
      title="Quality Gates"
      subtitle="Records can't be closed, signed or completed until the elements that make them safe are recorded"
      caraContext={{ pageTitle: "Quality Gates", sourceType: "general" }}
    >
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 p-4">
        <Lock className="mt-0.5 h-6 w-6 shrink-0 text-teal-600" />
        <div>
          <p className="font-semibold text-teal-900">The gap can't be closed over.</p>
          <p className="mt-0.5 text-sm text-teal-800">
            Where the Health Check <em>detects</em> what's missing, a quality gate <em>enforces</em> it: an oversight-required incident
            can't be closed without oversight, a restraint can't be signed off without the child's debrief, a missing episode can't be
            closed without a return home interview. A gate never judges the practice — it refuses an unsafe finalising step and names
            exactly what's needed. Complete the requirement and the gate clears.
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <QualityGatePanel />
      </div>
    </PageShell>
  );
}
