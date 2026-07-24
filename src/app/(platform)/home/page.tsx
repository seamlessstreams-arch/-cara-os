"use client";

import { PageShell } from "@/components/layout/page-shell";
import { HomeLanding } from "@/components/domain/home-landing";

export default function HomePage() {
  return (
    <PageShell title="Home" subtitle="The heartbeat of the home">
      <div className="space-y-6">
        <HomeLanding />
      </div>
    </PageShell>
  );
}
