"use client";

import { PageShell } from "@/components/layout/page-shell";
import { SafeStaffingCard } from "@/components/staffing/safe-staffing-card";
import { EmergencyButton, ActiveEmergencyBanner } from "@/components/staffing/emergency-controls";
import { Reg32DeploymentPanel } from "@/components/staffing/reg32-deployment-panel";
import { InOutBoardPanel } from "@/components/home-ops/in-out-board-panel";

export default function SafeStaffingPage() {
  return (
    <PageShell
      title="Safe Staffing & Emergency"
      subtitle="Real-time staffing from who's actually on shift, plus a fast way to raise an emergency."
    >
      <div className="max-w-2xl mx-auto space-y-4">
        <ActiveEmergencyBanner />
        <SafeStaffingCard />
        <InOutBoardPanel compact />
        <Reg32DeploymentPanel compact />
        <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
          <p className="text-sm font-semibold text-[var(--cs-navy)] mb-1">Need help right now?</p>
          <p className="text-xs text-[var(--cs-text-muted)] mb-3">
            Raise an emergency to alert on-shift staff and managers immediately. The alert is generic — no child or
            sensitive details are shared.
          </p>
          <EmergencyButton />
        </div>
      </div>
    </PageShell>
  );
}
