"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Moon, Shield, Phone, Clock, AlertTriangle, CheckCircle2, Flame, Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNightStaffGuidance } from "@/hooks/use-night-staff-guidance";
import type { NightStaffGuidanceSection, GuidancePriority, GuidanceSectionKey } from "@/types/extended";
import { GUIDANCE_PRIORITY_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const PRI_CLR: Record<GuidancePriority, string> = {
  essential: "bg-red-100 text-red-800",
  important: "bg-amber-100 text-amber-800",
  reference: "bg-blue-100 text-blue-800",
};
const BORDER_PRI: Record<GuidancePriority, string> = {
  essential: "border-l-red-500",
  important: "border-l-amber-400",
  reference: "border-l-blue-400",
};

const SECTION_ICON: Record<GuidanceSectionKey, React.ElementType> = {
  night_check_schedule: Moon,
  emergency_procedures: AlertTriangle,
  medication_night: Heart,
  lone_working: Shield,
  contact_numbers: Phone,
  night_shift_handover: Clock,
  night_tasks_checklist: CheckCircle2,
  fire_evacuation_night: Flame,
};

export default function NightStaffGuidancePage() {
  const { data: res, isLoading } = useNightStaffGuidance();
  const sections: NightStaffGuidanceSection[] = res?.data ?? [];

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  if (isLoading) return <PageShell title="Night Staff Guidance" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell title="Night Staff Guidance" subtitle="Waking Night & Sleep-In Procedures — Chamberlain House" 
      caraContext={{ pageTitle: "Night Staff Guidance", sourceType: "staff" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Night Staff Guidance" />
          <CaraStudioQuickActionButton context={{ record_type: "handover", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }>
      <div id="print-area">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <p className="font-semibold text-indigo-800 mb-1">For All Night Staff — Please Read Before Every Shift</p>
          <p className="text-indigo-700 text-sm">This guidance contains essential information for waking night and sleep-in staff. All sections marked &quot;Essential&quot; must be read and understood before commencing duty. If you are unsure about any procedure, contact the on-call manager before the situation arises.</p>
        </div>

        <div className="space-y-4">
          {sections.map((s) => {
            const open = !!expanded[s.id];
            const Icon = SECTION_ICON[s.section_key] || Moon;
            return (
              <Card key={s.id} className={cn("border-l-4", BORDER_PRI[s.priority])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(s.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon className="h-4 w-4 text-indigo-600" />
                        {s.title}
                        <Badge variant="outline" className={PRI_CLR[s.priority]}>{GUIDANCE_PRIORITY_LABEL[s.priority]}</Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Last updated: {s.last_updated}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-2 text-sm">
                    {s.content.map((line: string, i: number) => (
                      <p key={i} className={cn("text-muted-foreground", line.startsWith("•") ? "pl-4" : "", line.match(/^\d+\./) ? "pl-4" : "")}>{line}</p>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Document Control</p>
          <p>This guidance document is reviewed monthly by the Registered Manager. Staff must sign to confirm they have read and understood updated guidance. This document supports compliance with Children&apos;s Homes (England) Regulations 2015 (Reg 12, 13, 23), Working Time Regulations 1998, and Lone Working Policy.</p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Sleep & Wellbeing"
        category={["sleep", "health", "medication"]}
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Night Staff Guidance — waking night procedures, sleep-in, night-time checks, lone working, medication, emergency procedures, fire evacuation"
        recordType="handover"
        userRole="staff"
        className="mt-6"
      />
    </PageShell>
  );
}
