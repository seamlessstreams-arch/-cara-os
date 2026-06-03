"use client";
import { RoleDashboard } from "@/components/dashboards/role-dashboard";
import { FileCheck2 } from "lucide-react";
import { EvidenceBank, ComplianceRules, RecordingQualityTrend, EventIntelligence, WorkflowOrchestration } from "@/components/dashboards/cards";

export default function Reg45DashboardPage() {
  return (
    <RoleDashboard
      title="Regulation 45 Dashboard"
      subtitle="The independent monitoring picture — evidence, quality and improvement the visitor needs to test"
      icon={<FileCheck2 className="h-5 w-5" />}
      intro="What the Regulation 45 visit needs, computed from the event spine: how well-evidenced each area is, which fixed compliance rules are met, whether record quality is improving over time, the live event picture, and the automated actions and follow-ups the home has generated since the last visit."
    >
      <EvidenceBank />
      <ComplianceRules />
      <RecordingQualityTrend />
      <EventIntelligence />
      <WorkflowOrchestration />
    </RoleDashboard>
  );
}
