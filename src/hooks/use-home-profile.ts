"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";

export interface HomeProfile {
  id: string;
  name: string;
  address: string;
  ofsted_urn: string | null;
}

export interface HomeProfileResult {
  provisioned: boolean;
  home: HomeProfile | null;
}

/**
 * The identity of the home this deployment serves — the single source for the
 * name that ~180 screens used to hardcode as "Chamberlain House".
 *
 * Cached hard: a home's name and address do not change within a session, and
 * every page shell reads this, so refetching it per navigation is waste.
 */
export function useHomeProfile() {
  return useQuery({
    queryKey: ["home-profile"],
    queryFn: () => api.get<HomeProfileResult>("/home-profile"),
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  });
}

/**
 * Just the display name, with a neutral fallback for a live tenant that has not
 * been provisioned yet — never the seeded demo name. Pass a `fallback` when a
 * screen wants its own wording (e.g. "this home").
 */
export function useHomeName(fallback = "This home"): string {
  const { data } = useHomeProfile();
  return data?.home?.name?.trim() || fallback;
}
