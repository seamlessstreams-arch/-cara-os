"use client";

import { PageShell } from "@/components/layout/page-shell";
import { Reg32DeploymentPanel } from "@/components/staffing/reg32-deployment-panel";

export default function Reg32DeploymentPage() {
  return (
    <PageShell
      title="Deployment Suitability · Reg 32"
      description="Every person on the rota, checked against their compliance record before they step onto a shift — expired mandatory training, DBS overdue for renewal, or an employment status that bars deployment. Read-only: it advises, it never changes the rota."
    >
      <div className="max-w-3xl">
        <Reg32DeploymentPanel />
      </div>
    </PageShell>
  );
}
