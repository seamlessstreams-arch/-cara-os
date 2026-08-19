"use client";

import { Lock, ShieldCheck } from "lucide-react";
import { usePrivacy } from "@/contexts/privacy-context";
import { useAuthContext } from "@/contexts/auth-context";

/**
 * Full-screen privacy overlay shown when the screen is locked (panic button, idle,
 * or tab switched away). Heavily blurs everything behind it; tap anywhere to return.
 * Defence-in-depth against shoulder-surfing — not an authentication step.
 */
export function PrivacyScreenOverlay() {
  const { screenLocked, unlockScreen } = usePrivacy();
  const { currentUser } = useAuthContext();
  if (!screenLocked) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Screen hidden for privacy — tap to continue"
      onClick={unlockScreen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") unlockScreen(); }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--cs-navy)]/80 backdrop-blur-xl cursor-pointer"
    >
      <div className="text-center px-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
          <Lock className="h-7 w-7 text-white" />
        </div>
        <p className="text-xl font-bold text-white">Screen hidden for privacy</p>
        <p className="text-sm text-white/70 mt-1">
          {currentUser?.first_name ? `Welcome back, ${currentUser.first_name}. ` : ""}Tap anywhere to continue.
        </p>
        <p className="mt-6 inline-flex items-center gap-1.5 text-[11px] text-white/50">
          <ShieldCheck className="h-3.5 w-3.5" />Sensitive information is kept off screen while you&apos;re away.
        </p>
      </div>
    </div>
  );
}
