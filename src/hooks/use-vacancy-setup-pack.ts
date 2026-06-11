"use client";

import { useQuery } from "@tanstack/react-query";
import type { VacancySetupPack } from "@/lib/engines/vacancy-setup-engine";

export interface VacancySetupResponse {
  vacancies: { id: string; title: string; status: string; approval_status: string }[];
  pack: VacancySetupPack | null;
}

export function useVacancySetupPack(vacancyId: string | null) {
  return useQuery<VacancySetupResponse>({
    queryKey: ["vacancy-setup-pack", vacancyId],
    queryFn: async () => {
      const qs = vacancyId ? `?vacancyId=${encodeURIComponent(vacancyId)}` : "";
      const res = await fetch(`/api/v1/vacancy-setup-pack${qs}`);
      if (!res.ok) throw new Error("Failed to fetch the vacancy setup pack");
      const json = await res.json();
      return json.data;
    },
  });
}
