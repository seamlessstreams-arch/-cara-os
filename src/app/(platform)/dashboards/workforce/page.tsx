"use client";
import { RoleDashboard } from "@/components/dashboards/role-dashboard";
import { Users } from "lucide-react";
import { Continuity, StaffRecordingPractice, RecordingQualityTrend, WorkflowOrchestration } from "@/components/dashboards/cards";

export default function WorkforceDashboardPage() {
  return (
    <RoleDashboard
      title="Staff Workforce Dashboard"
      subtitle="Team continuity, recording practice and the work the platform is asking staff to do"
      icon={<Users className="h-5 w-5" />}
      intro="The workforce picture derived from events: which children have stable key relationships, how each staff member's recording practice compares, whether quality is trending up, and the tasks the orchestrator has assigned to roles."
    >
      <Continuity />
      <StaffRecordingPractice />
      <RecordingQualityTrend />
      <WorkflowOrchestration />
    </RoleDashboard>
  );
}
