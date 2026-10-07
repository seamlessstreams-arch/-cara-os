"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useStaff } from "@/components/staff/staff-select";
import { useChildren } from "@/components/young-people/child-select";
import { setStaffCache, setChildCache } from "@/lib/people/people-cache";

/**
 * Loads the home's staff and children once and publishes them to the live
 * people cache, so the name helpers in seed-data (getStaffName / getYPName /
 * getStaffById / getYPById) resolve a stored id to a real name instead of
 * "Unknown" on a live tenant — everywhere, with no per-page change.
 *
 * Why the cache is written DURING render, not in a useEffect: an effect runs
 * after commit, so the children would render once against an empty cache and
 * the wrong name would stick (the callers do not re-render when a later effect
 * fills the cache). Writing a module Map from render is an idempotent
 * external-store publish — children in this same commit then read the data.
 *
 * First paint is gated on the two lists so names do not flash "Unknown". A
 * safety timeout releases the gate so a slow or failed request degrades to the
 * seed fallback rather than blocking the app. Mounted once in the platform
 * layout, so the gate is paid only on a cold load, never on in-app navigation
 * (React Query serves both lists warm thereafter).
 */
export function PeopleCacheProvider({ children }: { children: React.ReactNode }) {
  const { staff, isLoading: staffLoading } = useStaff();
  const { children: kids, isLoading: kidsLoading } = useChildren({ includeFormer: true });

  // Publish during render, before the children render in this same commit.
  setStaffCache(staff);
  setChildCache(kids);

  const loaded = !staffLoading && !kidsLoading;
  const [released, setReleased] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReleased(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!loaded && !released) {
    return (
      <div className="flex items-center justify-center py-24" role="status" aria-label="Loading people">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
      </div>
    );
  }

  return <>{children}</>;
}
