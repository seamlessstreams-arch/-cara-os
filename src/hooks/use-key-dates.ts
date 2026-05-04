"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";

export interface KeyDate {
  id: string;
  type: "birthday" | "training_expiry" | "supervision" | "probation_end" | "placement_review" | "document_expiry" | "care_review";
  title: string;
  date: string;
  entity_type: "young_person" | "staff" | "document" | "home";
  entity_id: string;
  entity_name: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  href: string;
  notes?: string;
}

export function useKeyDates() {
  return useQuery({
    queryKey: ["key-dates"],
    queryFn: () =>
      api.get<{ data: KeyDate[]; meta: { total: number; today: string } }>("/key-dates"),
    refetchInterval: 60_000,
  });
}
