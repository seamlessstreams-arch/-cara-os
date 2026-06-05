"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * A prominent banner shown whenever the device is offline. Critical for a care
 * platform: staff must always KNOW when they're disconnected, so they never trust
 * a screen as showing current safeguarding / medication / staffing information.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(typeof navigator !== "undefined" && navigator.onLine === false);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed top-0 inset-x-0 z-[300] flex items-center justify-center gap-1.5 bg-[var(--cs-avisaar-coral)] px-3 py-1.5 text-center text-xs font-semibold text-white"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      You're offline — live care information may not be up to date.
    </div>
  );
}
