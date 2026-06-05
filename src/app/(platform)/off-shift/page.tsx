"use client";

import { PageShell } from "@/components/layout/page-shell";
import { OffShiftPortal } from "@/components/attendance/off-shift-portal";
import { ActiveEmergencyBanner } from "@/components/staffing/emergency-controls";

export default function OffShiftPage() {
  return (
    <PageShell
      title="Off-Shift Home"
      subtitle="What you can do while you're clocked out — and how to get your full access back."
    >
      <div className="max-w-2xl mx-auto mb-4">
        <ActiveEmergencyBanner />
      </div>
      <OffShiftPortal />
    </PageShell>
  );
}
