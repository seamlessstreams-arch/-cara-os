"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeDampMouldManagementIntelligence() {
  return useQuery({
    queryKey: ["home-damp-mould-management-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-damp-mould-management-intelligence");
      if (!res.ok) throw new Error("Failed to fetch damp and mould management intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
