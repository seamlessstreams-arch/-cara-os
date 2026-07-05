"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Redaction Tool page
// Stable, readable, document-set-consistent pseudonyms for anything shared out.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { PageShell } from "@/components/layout/page-shell";
import { RedactionToolPanel } from "@/components/entity-redaction/redaction-tool-panel";
import { ShieldOff } from "lucide-react";

export default function RedactionToolPage() {
  return (
    <PageShell
      title="Redaction Tool"
      subtitle="Stable, readable pseudonyms (Child A, Staff 1) for anything that leaves the building"
      caraContext={{ pageTitle: "Redaction Tool", sourceType: "general" }}
    >
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 p-4">
        <ShieldOff className="mt-0.5 h-6 w-6 shrink-0 text-teal-600" />
        <div>
          <p className="font-semibold text-teal-900">A redacted pack should still read like a story.</p>
          <p className="mt-0.5 text-sm text-teal-800">
            Opaque tokens make an external report unreadable. Cara gives each child and staff member a stable, human-readable code —
            &ldquo;Child A&rdquo; is the same child in every document of a set — so a Reg 44 pack, inspection pack or complaint response
            reads naturally without identifying anyone. An authorised person can rehydrate. The codebook that reverses it is sensitive.
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <RedactionToolPanel />
      </div>
    </PageShell>
  );
}
