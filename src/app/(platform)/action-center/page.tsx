"use client";

import { PageShell } from "@/components/layout/page-shell";
import { ActionCenterView } from "@/components/action-center/action-center-view";
import { EnablePushButton } from "@/components/pwa/enable-push-button";

export default function ActionCenterPage() {
  return (
    <PageShell
      title="Action Centre"
      subtitle="Everything that needs you right now — emergencies, acknowledgements, staffing alerts and sign-offs, in one place."
      actions={<EnablePushButton />}
    >
      <ActionCenterView />
    </PageShell>
  );
}
