"use client";

import { PageShell } from "@/components/layout/page-shell";
import { CaraPracticeDashboard } from "@/components/cara-practice/cara-practice-dashboard";
import { CaraPracticePanel } from "@/components/cara-practice/cara-practice-panel";
import { CaraDraftAssistant } from "@/components/cara-practice/cara-draft-assistant";
import { ThresholdConsultationPanel } from "@/components/cara-practice/threshold-consultation-panel";
import { LadoConsultationPanel } from "@/components/cara-practice/lado-consultation-panel";
import { Sparkles } from "lucide-react";

export default function CaraPracticePage() {
  return (
    <PageShell
      title="Cara Practice Intelligence"
      subtitle="Cara drafts, advises and recognises — managers decide, and the child's lived experience remains the measure of quality."
      icon={<Sparkles className="h-5 w-5" />}
    >
      <div className="space-y-6">
        <CaraPracticeDashboard homeId="home_oak" />
        <div className="grid lg:grid-cols-2 gap-6">
          <CaraPracticePanel
            sourceType="daily_record"
            homeId="home_oak"
            title="Run Cara on a record"
            text="Staff completed key work. Child engaged well. No concerns."
          />
          <CaraDraftAssistant
            sourceType="daily_record"
            homeId="home_oak"
            content="Staff completed key work. Child engaged well. No concerns."
          />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <ThresholdConsultationPanel childId="yp_alex" homeId="home_oak" />
          <LadoConsultationPanel homeId="home_oak" />
        </div>
      </div>
    </PageShell>
  );
}
