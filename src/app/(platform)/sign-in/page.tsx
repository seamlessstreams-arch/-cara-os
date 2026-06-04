"use client";

import { PageShell } from "@/components/layout/page-shell";
import { SmartSignIn } from "@/components/attendance/smart-sign-in";

export default function SmartSignInPage() {
  return (
    <PageShell
      title="Shift Sign-In"
      subtitle="Clock in and out of your shift in one tap. Makes your on-shift status real across the platform."
    >
      <SmartSignIn />
    </PageShell>
  );
}
