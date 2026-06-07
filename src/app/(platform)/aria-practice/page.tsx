"use client";

import { PageShell } from "@/components/layout/page-shell";
import { AriaPracticeDashboard } from "@/components/aria-practice/aria-practice-dashboard";
import { AriaPracticePanel } from "@/components/aria-practice/aria-practice-panel";
import { AriaDraftAssistant } from "@/components/aria-practice/aria-draft-assistant";
import { Sparkles } from "lucide-react";

export default function AriaPracticePage() {
  return (
    <PageShell
      title="ARIA Practice Intelligence"
      subtitle="ARIA drafts, advises and recognises — managers decide, and the child's lived experience remains the measure of quality."
      icon={<Sparkles className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <AriaPracticeDashboard homeId="home_oak" />
        <div className="grid lg:grid-cols-2 gap-6">
          <AriaPracticePanel
            sourceType="daily_record"
            homeId="home_oak"
            title="Run ARIA on a record"
            text="Staff completed key work. Child engaged well. No concerns."
          />
          <AriaDraftAssistant
            sourceType="daily_record"
            homeId="home_oak"
            content="Staff completed key work. Child engaged well. No concerns."
          />
        </div>
      </div>
    </PageShell>
  );
}
