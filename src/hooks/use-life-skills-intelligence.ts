"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LIFE SKILLS & INDEPENDENCE INTELLIGENCE HOOK
// React Query wrapper for /api/v1/life-skills-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { LifeSkillsIntelligenceResult } from "@/lib/engines/life-skills-intelligence-engine";

interface LifeSkillsIntelligenceResponse {
  data: LifeSkillsIntelligenceResult;
}

export function useLifeSkillsIntelligence() {
  return useQuery({
    queryKey: ["life-skills-intelligence"],
    queryFn: () => api.get<LifeSkillsIntelligenceResponse>("/life-skills-intelligence"),
    refetchInterval: 60_000,
  });
}
