import { useQuery } from "@tanstack/react-query";

export type IncidentOversightSignal = "urgent" | "overdue" | "pending" | "compliant";
export type HomeOversightSignal = "urgent" | "attention" | "monitoring" | "good";

export interface IncidentOversightProfile {
  incidentId: string;
  reference: string;
  type: string;
  severity: string;
  childId: string;
  childName: string;
  date: string;
  daysOpen: number;
  status: string;
  oversightGap: boolean;
  oversightAt: string | null;
  oversightHours: number | null;
  bodyMapGap: boolean;
  unacknowledgedNotifications: string[];
  lessonsLearnedMissed: boolean;
  signal: IncidentOversightSignal;
}

export interface IncidentOversightSummary {
  totalIncidents: number;
  openIncidents: number;
  oversightGapsCount: number;
  criticalWithoutOversight: number;
  physicalInterventionsWithoutOversight: number;
  avgHoursToOversight: number | null;
  lessonsLearnedRate: number | null;
  notificationAcknowledgementRate: number | null;
  signal: HomeOversightSignal;
}

export interface IncidentOversightQualityResponse {
  data: {
    incidents: IncidentOversightProfile[];
    summary: IncidentOversightSummary;
  };
}

export function useIncidentOversightQualityIntelligence() {
  return useQuery<IncidentOversightQualityResponse>({
    queryKey: ["incident-oversight-quality-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/incident-oversight-quality-intelligence");
      if (!res.ok) throw new Error("Failed to fetch incident oversight quality intelligence");
      return res.json();
    },
    staleTime: 120_000,
  });
}
