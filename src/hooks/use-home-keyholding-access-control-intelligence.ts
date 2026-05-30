"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeKeyholdingAccessControlIntelligence() {
  return useQuery({
    queryKey: ["home-keyholding-access-control-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-keyholding-access-control-intelligence");
      if (!res.ok) throw new Error("Failed to fetch keyholding access control intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
