"use client";

import { useQuery } from "@tanstack/react-query";
import type { SaferRecruitmentCommandResult } from "@/lib/engines/safer-recruitment-command-engine";

export function useSaferRecruitmentCommand() {
  return useQuery<SaferRecruitmentCommandResult>({
    queryKey: ["safer-recruitment-command"],
    queryFn: async () => {
      const res = await fetch("/api/v1/safer-recruitment-command");
      if (!res.ok) throw new Error("Failed to fetch safer recruitment command centre");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 120_000,
  });
}
