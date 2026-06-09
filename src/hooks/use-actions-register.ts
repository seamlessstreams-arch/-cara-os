"use client";

import { useQuery } from "@tanstack/react-query";
import type { ActionsRegisterResult } from "@/lib/engines/actions-register-engine";

export function useActionsRegister() {
  return useQuery<ActionsRegisterResult>({
    queryKey: ["actions-register"],
    queryFn: async () => {
      const res = await fetch("/api/v1/actions-register");
      if (!res.ok) throw new Error("Failed to fetch actions register");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 120_000,
  });
}
