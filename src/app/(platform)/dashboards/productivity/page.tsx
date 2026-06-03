"use client";
import { RoleDashboard } from "@/components/dashboards/role-dashboard";
import { Gauge } from "lucide-react";
import { ManagerInbox, WorkflowOrchestration, EventIntelligence, ComplianceRules } from "@/components/dashboards/cards";

export default function ProductivityDashboardPage() {
  return (
    <RoleDashboard
      title="Productivity & Overdue Actions Dashboard"
      subtitle="What's outstanding, what's overdue, and where the bottlenecks are"
      icon={<Gauge className="h-5 w-5" />}
      intro="The throughput picture, computed from the event spine: the action inbox with deadlines and overdue flags, the tasks the orchestrator has generated and their owners, the approval and notification backlog, and the fixed-rule checks still failing — so nothing falls through the cracks."
    >
      <ManagerInbox />
      <WorkflowOrchestration />
      <EventIntelligence />
      <ComplianceRules />
    </RoleDashboard>
  );
}
