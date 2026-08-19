"use client";

import { useState } from "react";
import { LogIn, MapPin, ScanLine, ShieldOff, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PresenceVerificationInput } from "@/lib/attendance/sign-in-service";

type Choice = null | "kiosk" | "geofence" | "manual";

/**
 * Presence-verified clock-in controls. Offers three opt-in methods and calls
 * onClockIn with the chosen verification. Crucially it does NOT fetch the kiosk code
 * — staff must read it from the device at the home (that's what proves presence).
 * Geolocation is requested only on an explicit tap, used once, and never stored
 * client-side.
 */
export function PresenceClockIn({
  onClockIn,
  pending,
}: {
  onClockIn: (verification?: PresenceVerificationInput) => void;
  pending: boolean;
}) {
  const [choice, setChoice] = useState<Choice>(null);
  const [code, setCode] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const useLocation = () => {
    setGeoError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Location isn't available on this device. Use the kiosk code instead.");
      return;
    }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoBusy(false);
        // Coordinates are sent once for the check and never stored.
        onClockIn({ method: "geofence", coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
      },
      () => {
        setGeoBusy(false);
        setGeoError("Couldn't confirm your location. Try the kiosk code or sign in without verification.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // Method chooser
  if (choice === null) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Confirm you&apos;re at the home</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => setChoice("kiosk")}
            className="flex flex-col items-center gap-1 rounded-xl border border-[var(--cs-border)] p-3 hover:border-[var(--cs-teal)] hover:bg-[var(--cs-teal-bg)] transition-colors"
          >
            <ScanLine className="h-5 w-5 text-[var(--cs-teal)]" />
            <span className="text-xs font-medium text-[var(--cs-navy)]">Kiosk code</span>
            <span className="text-[10px] text-[var(--cs-text-muted)] text-center">Enter the code shown at the home</span>
          </button>
          <button
            onClick={() => setChoice("geofence")}
            className="flex flex-col items-center gap-1 rounded-xl border border-[var(--cs-border)] p-3 hover:border-[var(--cs-teal)] hover:bg-[var(--cs-teal-bg)] transition-colors"
          >
            <MapPin className="h-5 w-5 text-[var(--cs-teal)]" />
            <span className="text-xs font-medium text-[var(--cs-navy)]">Use my location</span>
            <span className="text-[10px] text-[var(--cs-text-muted)] text-center">One-time check, never stored</span>
          </button>
          <button
            onClick={() => setChoice("manual")}
            className="flex flex-col items-center gap-1 rounded-xl border border-[var(--cs-border)] p-3 hover:border-[var(--cs-border-strong)] transition-colors"
          >
            <ShieldOff className="h-5 w-5 text-[var(--cs-text-muted)]" />
            <span className="text-xs font-medium text-[var(--cs-navy)]">Without verification</span>
            <span className="text-[10px] text-[var(--cs-text-muted)] text-center">Flagged as unverified</span>
          </button>
        </div>
      </div>
    );
  }

  const back = (
    <button onClick={() => { setChoice(null); setGeoError(null); }} className="inline-flex items-center gap-0.5 text-[11px] text-[var(--cs-text-muted)] hover:text-[var(--cs-teal)]">
      <ArrowLeft className="h-3 w-3" />Back
    </button>
  );

  if (choice === "kiosk") {
    return (
      <div className="space-y-2">
        {back}
        <p className="text-xs text-[var(--cs-text-secondary)]">Enter the code currently shown on the sign-in screen at the home.</p>
        <div className="flex items-center gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. 7K4Q9P"
            maxLength={8}
            className="flex-1 rounded-lg border border-[var(--cs-border)] px-3 py-2 text-sm font-mono tracking-widest uppercase"
          />
          <Button onClick={() => onClockIn({ method: "kiosk", code })} disabled={pending || code.trim().length < 4} className="gap-1.5">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}Clock in
          </Button>
        </div>
      </div>
    );
  }

  if (choice === "geofence") {
    return (
      <div className="space-y-2">
        {back}
        <p className="text-xs text-[var(--cs-text-secondary)] flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--cs-teal)]" />Your location is checked once, on this tap, and never stored or tracked.
        </p>
        <Button onClick={useLocation} disabled={pending || geoBusy} className="gap-1.5">
          {pending || geoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          {geoBusy ? "Checking location…" : "Confirm location & clock in"}
        </Button>
        {geoError && <p className="text-xs text-amber-700">{geoError}</p>}
      </div>
    );
  }

  // manual
  return (
    <div className="space-y-2">
      {back}
      <p className="text-xs text-[var(--cs-text-secondary)]">
        This sign-in will be recorded as <span className="font-semibold">unverified</span> (no presence check). Use a verified
        method where you can.
      </p>
      <Button
        onClick={() => onClockIn({ method: "manual" })}
        disabled={pending}
        variant="outline"
        className={cn("gap-1.5")}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}Clock in without verification
      </Button>
    </div>
  );
}
