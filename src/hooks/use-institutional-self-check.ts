"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { InstitutionalSelfCheck, SelfCheckStrand } from "@/lib/theory-lens/institutional-self-check-engine";

export interface InstitutionalSelfCheckData extends InstitutionalSelfCheck {
  sources: Record<SelfCheckStrand, string>;
}

/** Our own response pattern, seen from where a child sits. Read-only by design. */
export function useInstitutionalSelfCheck() {
  return useQuery({
    queryKey: ["institutional-self-check"],
    queryFn: async () =>
      (await api.get<{ data: InstitutionalSelfCheckData }>("/institutional-self-check")).data,
  });
}
