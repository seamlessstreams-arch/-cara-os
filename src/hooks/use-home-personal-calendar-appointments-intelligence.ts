"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomePersonalCalendarAppointmentsIntelligence() {
  return useQuery({
    queryKey: ["home-personal-calendar-appointments-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-personal-calendar-appointments-intelligence");
      if (!res.ok) throw new Error("Failed to fetch personal calendar appointments intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
