"use client";

import { PageShell } from "@/components/layout/page-shell";
import { SmartSignIn } from "@/components/attendance/smart-sign-in";
import { OffShiftBanner } from "@/components/attendance/off-shift-banner";
import { SafeStaffingCard } from "@/components/staffing/safe-staffing-card";
import { ActiveEmergencyBanner } from "@/components/staffing/emergency-controls";

export default function SmartSignInPage() {
  return (
    <PageShell
      title="Shift Sign-In"
      subtitle="Clock in and out of your shift in one tap. Makes your on-shift status real across the platform."
    >
      <div className="max-w-2xl mx-auto mb-4 space-y-4">
        <ActiveEmergencyBanner />
        <OffShiftBanner />
      </div>
      <SmartSignIn />
      <div className="max-w-2xl mx-auto mt-4">
        <SafeStaffingCard />
      </div>
    </PageShell>
  );
}
