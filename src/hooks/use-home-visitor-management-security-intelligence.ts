"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeVisitorManagementSecurityIntelligence() {
  return useQuery({
    queryKey: ["home-visitor-management-security-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-visitor-management-security-intelligence");
      if (!res.ok) throw new Error("Failed to fetch visitor management security intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
