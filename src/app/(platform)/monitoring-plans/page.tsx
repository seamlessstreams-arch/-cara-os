"use client";

import { PageShell } from "@/components/layout/page-shell";
import { MonitoringPlansPanel } from "@/components/home-ops/monitoring-plans-panel";

export default function MonitoringPlansPage() {
  return (
    <PageShell
      title="Individual Monitoring Plans"
      description="Each child's standing observation level — what it is, why, who agreed it, the child's views, and when it must be reviewed. Any level above general is a restriction and is validator-guarded; children without a plan follow the normal home routine."
    >
      <div className="max-w-2xl">
        <MonitoringPlansPanel />
      </div>
    </PageShell>
  );
}
