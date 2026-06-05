"use client";

import { PageShell } from "@/components/layout/page-shell";
import { ActionCenterView } from "@/components/action-center/action-center-view";

export default function ActionCenterPage() {
  return (
    <PageShell
      title="Action Centre"
      subtitle="Everything that needs you right now — emergencies, acknowledgements, staffing alerts and sign-offs, in one place."
    >
      <ActionCenterView />
    </PageShell>
  );
}
