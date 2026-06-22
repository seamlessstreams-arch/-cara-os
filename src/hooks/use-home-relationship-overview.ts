"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { HomeRelationshipOverview } from "@/lib/relationship-intelligence/home-overview";

/** Fetch the home-level relationship overview — every child ranked by who needs us most. */
export function useHomeRelationshipOverview() {
  return useQuery({
    queryKey: ["relationship-intelligence-home"],
    queryFn: async () =>
      (await api.get<{ data: HomeRelationshipOverview }>("/relationship-intelligence/home")).data,
  });
}
