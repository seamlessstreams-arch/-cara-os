"use client";
import { RoleDashboard } from "@/components/dashboards/role-dashboard";
import { HeartHandshake } from "lucide-react";
import { ChildPriority, PlacementForecast, BehaviourTriggers, Continuity, ComplaintsCorrelation, RecordingQuality } from "@/components/dashboards/cards";

export default function ChildProgressDashboardPage() {
  return (
    <RoleDashboard
      title="Child Progress Dashboard"
      subtitle="Each child's outcomes, risks and relationships — the joined-up picture of how children are doing"
      icon={<HeartHandshake className="h-5 w-5" />}
      intro="Children's progress and protection, computed from their events: unified priority, placement-stability forecast, behaviour triggers, relationship continuity, complaints-as-early-warning, and the quality (and child's voice) of their records."
    >
      <ChildPriority />
      <PlacementForecast />
      <BehaviourTriggers />
      <Continuity />
      <ComplaintsCorrelation />
      <RecordingQuality />
    </RoleDashboard>
  );
}
