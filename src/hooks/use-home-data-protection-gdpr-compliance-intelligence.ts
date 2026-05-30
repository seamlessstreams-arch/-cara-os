"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeDataProtectionGdprComplianceIntelligence() {
  return useQuery({
    queryKey: ["home-data-protection-gdpr-compliance-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-data-protection-gdpr-compliance-intelligence");
      if (!res.ok) throw new Error("Failed to fetch data protection GDPR compliance intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
