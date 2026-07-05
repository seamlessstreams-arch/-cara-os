"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Ask Cara page
// The full-screen AI-interface surface for the deterministic record chat: dark
// gradient, centred greeting, floating pill composer. Same engine as the drawer.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraChat } from "@/components/cara/cara-chat";

export default function AskCaraPage() {
  return (
    <PageShell
      title="Ask Cara"
      subtitle="Ask anything from this home's records — answered deterministically, scoped to your role"
    >
      <div
        className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-800/80 shadow-2xl shadow-slate-950/40"
        style={{ height: "calc(100dvh - 240px)", minHeight: 520 }}
      >
        <CaraChat context={{ pageTitle: "Ask Cara", sourceType: "general" }} />
      </div>
    </PageShell>
  );
}
