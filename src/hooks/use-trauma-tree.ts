"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { TraumaTreeView } from "@/lib/trauma-tree/trauma-tree-engine";

export interface TraumaTreeData extends TraumaTreeView {
  sources: { labelling: string };
}

/** Per child: is the thinking written down, when was it last looked at, and
 *  what feeds the tree. Read-only — Cara never authors a formulation. */
export function useTraumaTree() {
  return useQuery({
    queryKey: ["trauma-tree"],
    queryFn: async () => (await api.get<{ data: TraumaTreeData }>("/trauma-tree")).data,
  });
}
