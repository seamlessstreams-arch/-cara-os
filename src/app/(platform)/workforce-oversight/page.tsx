"use client";

import { PageShell } from "@/components/layout/page-shell";
import { WorkforceOversightView } from "@/components/oversight/workforce-oversight-view";

export default function WorkforceOversightPage() {
  return (
    <PageShell
      title="Workforce Oversight"
      subtitle="A read-only management view of sign-in, message governance, emergencies and safe staffing — with an audit-ready evidence pack."
    >
      <WorkforceOversightView />
    </PageShell>
  );
}
