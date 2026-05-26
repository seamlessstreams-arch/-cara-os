import { useQuery } from "@tanstack/react-query";
import type { ChildVoiceParticipationResult } from "@/lib/engines/child-voice-participation-engine";

export function useChildVoiceParticipation() {
  return useQuery<{ data: ChildVoiceParticipationResult }>({
    queryKey: ["child-voice-participation"],
    queryFn: () =>
      fetch("/api/v1/child-voice-participation").then((r) => r.json()),
    refetchInterval: 60_000,
  });
}
