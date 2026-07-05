"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Knowledge Evolution page
// The knowledge base reflecting on itself against what practice actually does.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { PageShell } from "@/components/layout/page-shell";
import { KnowledgeEvolutionPanel } from "@/components/knowledge-evolution/knowledge-evolution-panel";
import { BookMarked } from "lucide-react";

export default function KnowledgeEvolutionPage() {
  return (
    <PageShell
      title="Knowledge Evolution"
      subtitle="Is the knowledge base keeping pace with practice? · Cara proposes, a practice lead decides"
      caraContext={{ pageTitle: "Knowledge Evolution", sourceType: "general" }}
    >
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 p-4">
        <BookMarked className="mt-0.5 h-6 w-6 shrink-0 text-teal-600" />
        <div>
          <p className="font-semibold text-teal-900">Knowledge that doesn&apos;t move with practice goes stale.</p>
          <p className="mt-0.5 text-sm text-teal-800">
            Cara reads every knowledge-base entry against the home&apos;s live records: which ideas are genuinely shaping practice, which
            sit dormant, which are due a review — and, crucially, which recurring themes in practice have <em>no</em> knowledge behind
            them yet. It proposes how the base should evolve. It never edits practice knowledge — that&apos;s an expert&apos;s call.
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <KnowledgeEvolutionPanel />
      </div>
    </PageShell>
  );
}
