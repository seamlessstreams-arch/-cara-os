"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeBoilerHeatingSystemServicingIntelligence() {
  return useQuery({
    queryKey: ["home-boiler-heating-system-servicing-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-boiler-heating-system-servicing-intelligence");
      if (!res.ok) throw new Error("Failed to fetch boiler heating system servicing intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
