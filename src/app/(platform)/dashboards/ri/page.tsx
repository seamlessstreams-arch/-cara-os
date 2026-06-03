"use client";
import { RoleDashboard } from "@/components/dashboards/role-dashboard";
import { Building2 } from "lucide-react";
import { EvidenceBank, ComplianceRules, ManagerInbox, RecordingQualityTrend, EventIntelligence, IntegrationHub } from "@/components/dashboards/cards";

export default function RIDashboardPage() {
  return (
    <RoleDashboard
      title="Responsible Individual Dashboard"
      subtitle="Organisational oversight — evidence, compliance posture, improvement trajectory and the items escalated to RI level"
      icon={<Building2 className="h-5 w-5" />}
      intro="The RI's governance view, computed from the event spine: how well-evidenced the home is, where fixed compliance rules are failing, whether recording quality is improving, and the approvals and escalations that have reached RI level."
    >
      <EvidenceBank />
      <ComplianceRules />
      <ManagerInbox />
      <RecordingQualityTrend />
      <EventIntelligence />
      <IntegrationHub />
    </RoleDashboard>
  );
}
