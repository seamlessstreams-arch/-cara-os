"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type {
  EducationDisruptionOverview,
  EducationDisruptionRead,
  STATUTORY_BASIS,
} from "@/lib/education-disruption/education-disruption-engine";

export type EducationDisruptionData = EducationDisruptionOverview & {
  statutoryBasis: typeof STATUTORY_BASIS;
};

/** Whole-home education-disruption rollup with triggers. */
export function useEducationDisruption() {
  return useQuery({
    queryKey: ["education-disruption", "home"],
    queryFn: async () =>
      (await api.get<{ data: EducationDisruptionData }>(`/education-disruption`)).data,
  });
}

/** One child's disruption read. */
export function useChildEducationDisruption(childId: string | undefined) {
  return useQuery({
    queryKey: ["education-disruption", "child", childId],
    enabled: !!childId,
    queryFn: async () =>
      (await api.get<{ data: EducationDisruptionRead & { statutoryBasis: typeof STATUTORY_BASIS } }>(
        `/education-disruption?child_id=${encodeURIComponent(childId!)}`,
      )).data,
  });
}
