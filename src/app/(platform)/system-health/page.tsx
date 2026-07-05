"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Continuous Health Check page
// A deterministic integrity scan of the home's live records for managers.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { PageShell } from "@/components/layout/page-shell";
import { SystemHealthPanel } from "@/components/system-health/system-health-panel";
import { ShieldCheck } from "lucide-react";

export default function SystemHealthPage() {
  return (
    <PageShell
      title="Continuous Health Check"
      subtitle="Deterministic integrity scan across the home's live records · detection only"
      caraContext={{ pageTitle: "Continuous Health Check", sourceType: "general" }}
    >
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 p-4">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-teal-600" />
        <div>
          <p className="font-semibold text-teal-900">Cara watches the whole record — so nothing quietly slips.</p>
          <p className="mt-0.5 text-sm text-teal-800">
            Overdue actions, missing management oversight, restraint repair gaps, missing return interviews, overdue reviews and recording
            gaps — surfaced continuously. Cara detects and prompts; it never changes a safeguarding record for you.
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <SystemHealthPanel />
      </div>
    </PageShell>
  );
}
