"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeTaskActionCompletionIntelligence() {
  return useQuery({
    queryKey: ["home-task-action-completion-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-task-action-completion-intelligence");
      if (!res.ok) throw new Error("Failed to fetch task action completion intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
