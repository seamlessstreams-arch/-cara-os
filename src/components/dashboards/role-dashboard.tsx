"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ROLE DASHBOARD SHELL
// Common shell for the named role dashboards: PageShell + an "all computed from
// the event spine" note + a responsive grid of spine-derived cards.
// ══════════════════════════════════════════════════════════════════════════════

import type { ReactNode } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Info } from "lucide-react";

export function RoleDashboard({
  title, subtitle, icon, intro, children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  intro: string;
  children: ReactNode;
}) {
  return (
    <PageShell title={title} subtitle={subtitle} icon={icon} showQuickCreate={false} ariaContext={{ pageTitle: title, sourceType: "general" }}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 flex gap-3">
          <Info className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{intro}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">{children}</div>
      </div>
    </PageShell>
  );
}
