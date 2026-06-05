"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { ActionCenter } from "@/lib/action-center/action-center";

export type { ActionCenter, ActionItem } from "@/lib/action-center/action-center";

export function useActionCenter() {
  return useQuery({
    queryKey: ["action-center"],
    queryFn: async () => (await api.get<{ data: ActionCenter }>("/action-center")).data,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}
