"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScanLine, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { api } from "@/hooks/use-api";

/** The rotating kiosk code a home displays for presence-verified sign-in. */
function useKioskCode(enabled = true) {
  return useQuery({
    queryKey: ["sign-in", "kiosk-code"],
    queryFn: async () =>
      (await api.get<{ data: { home_id: string; code: string; window_minutes: number; valid_for_seconds: number } }>(
        "/sign-in/kiosk-code",
      )).data,
    enabled,
    staleTime: 30_000,
  });
}

/**
 * Sign-in kiosk display. Mount this on a tablet AT the home; staff read the rotating
 * code and enter it when they clock in, proving they're physically present. The code
 * rotates so it can't be shared usefully. (In production this page would be locked to
 * the home's on-site device; it's directly reachable here for demo/setup and is
 * intentionally NOT in the navigation so the code isn't trivially read remotely.)
 */
export default function KioskPage() {
  const { data, refetch, isLoading } = useKioskCode();

  // Refresh shortly after the current code is due to rotate.
  useEffect(() => {
    if (!data) return;
    const ms = Math.max(5, data.valid_for_seconds) * 1000 + 1500;
    const t = setTimeout(() => refetch(), ms);
    return () => clearTimeout(t);
  }, [data, refetch]);

  return (
    <PageShell title="Sign-In Kiosk" subtitle="Read this code and enter it when you clock in.">
      <div className="max-w-xl mx-auto">
        <div className="rounded-3xl border border-[var(--cs-border)] bg-white p-10 text-center">
          <div className="inline-flex items-center gap-2 text-[var(--cs-teal)] mb-6">
            <ScanLine className="h-6 w-6" />
            <span className="text-sm font-semibold uppercase tracking-wider">Sign-in code</span>
          </div>
          {isLoading || !data ? (
            <p className="text-[var(--cs-text-muted)] py-8">Loading…</p>
          ) : (
            <>
              <p className="text-6xl sm:text-7xl font-mono font-bold tracking-[0.2em] text-[var(--cs-navy)] select-all">
                {data.code}
              </p>
              <p className="text-sm text-[var(--cs-text-muted)] mt-6">
                Rotates every {data.window_minutes} minutes · refreshes automatically
              </p>
            </>
          )}
        </div>
        <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--cs-text-muted)] mt-4">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--cs-teal)]" />
          Presence is confirmed by reading this code on site — no location tracking, no biometrics.
        </p>
      </div>
    </PageShell>
  );
}
