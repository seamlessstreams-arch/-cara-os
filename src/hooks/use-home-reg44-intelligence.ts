"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeReg44Result } from "@/lib/engines/home-reg44-intelligence-engine";

interface HomeReg44Response {
  data: HomeReg44Result;
}

export function useHomeReg44Intelligence() {
  return useQuery<HomeReg44Response>({
    queryKey: ["home-reg44-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-reg44-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home Reg 44 intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
