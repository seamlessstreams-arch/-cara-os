"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Self-Healing Integrity page
// Resting-state structural integrity scan + safe, reversible auto-repair.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { PageShell } from "@/components/layout/page-shell";
import { SelfHealingPanel } from "@/components/self-healing/self-healing-panel";
import { Wrench } from "lucide-react";

export default function SelfHealingPage() {
  return (
    <PageShell
      title="Self-Healing Integrity"
      subtitle="Structural integrity scan + safe, reversible auto-repair · never changes a practice record"
      caraContext={{ pageTitle: "Self-Healing Integrity", sourceType: "general" }}
    >
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 p-4">
        <Wrench className="mt-0.5 h-6 w-6 shrink-0 text-teal-600" />
        <div>
          <p className="font-semibold text-teal-900">Cara repairs the plumbing — never the practice.</p>
          <p className="mt-0.5 text-sm text-teal-800">
            The capture gate stops duplicates as records are written; this is its resting-state complement — a scan of the reference
            graph for links that have drifted. Cara auto-heals only a missing mirror in a derived index (reversible, logged, no content
            changed). Conflicts, dangling child references and id collisions are always left for a person.
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <SelfHealingPanel />
      </div>
    </PageShell>
  );
}
