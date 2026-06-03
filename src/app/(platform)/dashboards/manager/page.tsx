"use client";
import { RoleDashboard } from "@/components/dashboards/role-dashboard";
import { LayoutDashboard } from "lucide-react";
import { ManagerInbox, EventIntelligence, ChildPriority, WorkflowOrchestration, ComplianceRules, EvidenceBank } from "@/components/dashboards/cards";

export default function ManagerDashboardPage() {
  return (
    <RoleDashboard
      title="Manager Dashboard"
      subtitle="Your command centre — what needs a decision, what's at risk, and what the platform has done automatically"
      icon={<LayoutDashboard className="h-5 w-5" />}
      intro="Everything here is calculated live from the event spine — no manually duplicated summaries. Start with the action inbox, then the risk and compliance picture, then the work the automation has generated."
    >
      <ManagerInbox />
      <EventIntelligence />
      <ChildPriority />
      <WorkflowOrchestration />
      <ComplianceRules />
      <EvidenceBank />
    </RoleDashboard>
  );
}
