"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";

export interface FeedItem {
  id: string;
  type: "incident" | "task" | "daily_log" | "medication" | "handover" | "safeguarding" | "training" | "document" | "shift" | "form";
  action: string;
  title: string;
  description: string;
  timestamp: string;
  actor_id?: string;
  child_id?: string;
  severity?: "critical" | "high" | "medium" | "low" | "info";
  href: string;
}

export function useActivityFeed() {
  return useQuery({
    queryKey: ["activity-feed"],
    queryFn: () => api.get<{ data: FeedItem[]; meta: { total: number } }>("/activity-feed"),
    refetchInterval: 30_000, // Live refresh every 30s
  });
}
