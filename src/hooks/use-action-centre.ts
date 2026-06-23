"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { ActionCentre } from "@/lib/action-centre/action-centre-engine";

/**
 * The unified Action Centre — every action and attention item from across the
 * practice modules in one place.
 */
export function useActionCentre() {
  return useQuery({
    queryKey: ["action-centre"],
    queryFn: async () => (await api.get<{ data: ActionCentre }>(`/action-centre`)).data,
  });
}
