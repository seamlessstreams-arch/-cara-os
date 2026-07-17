"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type {
  SilentStruggleOverview,
  WithdrawalRead,
} from "@/lib/silent-struggle/silent-struggle-engine";

/** Whole-home withdrawal rollup — who is going quiet. */
export function useSilentStruggle() {
  return useQuery({
    queryKey: ["silent-struggle", "home"],
    queryFn: async () => (await api.get<{ data: SilentStruggleOverview }>(`/silent-struggle`)).data,
  });
}

/** One child's withdrawal read. */
export function useChildSilentStruggle(childId: string | undefined) {
  return useQuery({
    queryKey: ["silent-struggle", "child", childId],
    enabled: !!childId,
    queryFn: async () =>
      (await api.get<{ data: WithdrawalRead }>(`/silent-struggle?child_id=${encodeURIComponent(childId!)}`)).data,
  });
}
