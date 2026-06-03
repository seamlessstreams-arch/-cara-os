"use client";
import { RoleDashboard } from "@/components/dashboards/role-dashboard";
import { ShieldAlert } from "lucide-react";
import { ChildPriority, PlacementForecast, ComplaintsCorrelation, BehaviourTriggers, EventIntelligence, ManagerInbox } from "@/components/dashboards/cards";

export default function RiskSafeguardingDashboardPage() {
  return (
    <RoleDashboard
      title="Risk & Safeguarding Dashboard"
      subtitle="Where the risk is concentrating, why, and what's been escalated to keep children safe"
      icon={<ShieldAlert className="h-5 w-5" />}
      intro="The safeguarding picture, computed from the event spine: which children are most at risk right now, where placements are at risk of breaking down, how complaints and incidents correlate as early warnings, the behaviour triggers behind incidents, and the safeguarding items escalated for decision."
    >
      <ChildPriority />
      <PlacementForecast />
      <ComplaintsCorrelation />
      <BehaviourTriggers />
      <EventIntelligence />
      <ManagerInbox />
    </RoleDashboard>
  );
}
