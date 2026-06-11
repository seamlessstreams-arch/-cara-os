"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export interface IssuedReferenceLink {
  link: string;
  expires_at: string;
  referee_name: string;
  note: string;
}

export function useIssueReferenceLink() {
  const qc = useQueryClient();
  return useMutation<IssuedReferenceLink, Error, string>({
    mutationFn: async (referenceId: string) => {
      const res = await fetch(`/api/v1/safer-recruitment-command/references/${referenceId}/link`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't issue the reference link");
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["safer-recruitment-command"] });
    },
  });
}
