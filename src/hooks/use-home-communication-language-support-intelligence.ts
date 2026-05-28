"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeCommunicationLanguageSupportIntelligence() {
  return useQuery({
    queryKey: ["home-communication-language-support-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-communication-language-support-intelligence");
      if (!res.ok) throw new Error("Failed to fetch communication language support intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
