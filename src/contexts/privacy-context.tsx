"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_IDLE_LOCK_SECONDS } from "@/lib/privacy/screen-protection";
import { useClientValue } from "@/hooks/use-client-value";

// ══════════════════════════════════════════════════════════════════════════════
// Privacy / screen-protection context (Phase 6) — defence-in-depth UI only.
//
//   • screenLocked  — a full-screen privacy overlay (panic button / idle / tab-blur).
//   • privacyMode   — opt-in: obscure sensitive content until tapped (for public
//                     spaces). Off by default; idle/blur lock still protects everyone.
//   • revealedIds   — items the user explicitly revealed this view; cleared on lock /
//                     privacy-mode change so reveals never persist.
//
// This never changes what the SERVER returns — it only governs on-screen display.
// ══════════════════════════════════════════════════════════════════════════════

interface PrivacyContextValue {
  privacyMode: boolean;
  screenLocked: boolean;
  idleSeconds: number;
  autoObscureOnBlur: boolean;
  setPrivacyMode: (v: boolean) => void;
  togglePrivacyMode: () => void;
  lockScreen: () => void;
  unlockScreen: () => void;
  reveal: (id: string) => void;
  isRevealed: (id: string) => boolean;
  setIdleSeconds: (s: number) => void;
  setAutoObscureOnBlur: (v: boolean) => void;
  /** Should a protected item with this id currently be obscured? */
  isObscured: (id: string, protect: boolean) => boolean;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

const LS_MODE = "cs_privacy_mode";
const LS_IDLE = "cs_privacy_idle_seconds";
const LS_BLUR = "cs_privacy_auto_blur";

function readPref(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  // Preferences live in localStorage — an external store. The stored value is
  // read via useSyncExternalStore (null on the server, so SSR and hydration
  // agree on the defaults), and in-session changes land in an override that
  // the derivation prefers. The setters below write both.
  const storedMode = useClientValue(() => readPref(LS_MODE), null);
  const storedIdle = useClientValue(() => readPref(LS_IDLE), null);
  const storedBlur = useClientValue(() => readPref(LS_BLUR), null);
  const [modeOverride, setModeOverride] = useState<boolean | null>(null);
  const [idleOverride, setIdleOverride] = useState<number | null>(null);
  const [blurOverride, setBlurOverride] = useState<boolean | null>(null);

  const privacyMode = modeOverride ?? (storedMode === "1");
  const storedIdleNum = Number(storedIdle);
  const idleSeconds = idleOverride ??
    (storedIdle !== null && Number.isFinite(storedIdleNum) && storedIdleNum >= 0
      ? storedIdleNum
      : DEFAULT_IDLE_LOCK_SECONDS);
  const autoObscureOnBlur = blurOverride ?? (storedBlur !== "0");

  const [screenLocked, setScreenLocked] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearReveals = useCallback(() => setRevealed((prev) => (prev.size ? new Set() : prev)), []);

  const lockScreen = useCallback(() => {
    setScreenLocked(true);
    clearReveals();
  }, [clearReveals]);
  const unlockScreen = useCallback(() => setScreenLocked(false), []);

  const setPrivacyMode = useCallback(
    (v: boolean) => {
      setModeOverride(v);
      try { localStorage.setItem(LS_MODE, v ? "1" : "0"); } catch { /* ignore */ }
      if (v) clearReveals();
    },
    [clearReveals],
  );
  const togglePrivacyMode = useCallback(() => setPrivacyMode(!privacyMode), [privacyMode, setPrivacyMode]);

  const setIdleSeconds = useCallback((s: number) => {
    setIdleOverride(s);
    try { localStorage.setItem(LS_IDLE, String(s)); } catch { /* ignore */ }
  }, []);
  const setAutoObscureOnBlur = useCallback((v: boolean) => {
    setBlurOverride(v);
    try { localStorage.setItem(LS_BLUR, v ? "1" : "0"); } catch { /* ignore */ }
  }, []);

  const reveal = useCallback((id: string) => setRevealed((prev) => new Set(prev).add(id)), []);
  const isRevealed = useCallback((id: string) => revealed.has(id), [revealed]);

  const isObscured = useCallback(
    (id: string, protect: boolean) => protect && privacyMode && !revealed.has(id),
    [privacyMode, revealed],
  );

  // ── Idle auto-lock ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (idleSeconds <= 0 || screenLocked) return;
    const reset = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => lockScreen(), idleSeconds * 1000);
    };
    const events: (keyof DocumentEventMap)[] = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => document.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => document.removeEventListener(e, reset));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [idleSeconds, screenLocked, lockScreen]);

  // ── Auto-obscure when the tab is hidden / switched away ─────────────────────
  useEffect(() => {
    if (!autoObscureOnBlur) return;
    const onHidden = () => { if (document.visibilityState === "hidden") lockScreen(); };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, [autoObscureOnBlur, lockScreen]);

  const value = useMemo<PrivacyContextValue>(
    () => ({
      privacyMode, screenLocked, idleSeconds, autoObscureOnBlur,
      setPrivacyMode, togglePrivacyMode, lockScreen, unlockScreen,
      reveal, isRevealed, setIdleSeconds, setAutoObscureOnBlur, isObscured,
    }),
    [privacyMode, screenLocked, idleSeconds, autoObscureOnBlur, setPrivacyMode, togglePrivacyMode,
      lockScreen, unlockScreen, reveal, isRevealed, setIdleSeconds, setAutoObscureOnBlur, isObscured],
  );

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy(): PrivacyContextValue {
  const ctx = useContext(PrivacyContext);
  if (!ctx) {
    // Safe no-op fallback so components work outside the provider (e.g. tests).
    return {
      privacyMode: false, screenLocked: false, idleSeconds: 0, autoObscureOnBlur: false,
      setPrivacyMode: () => {}, togglePrivacyMode: () => {}, lockScreen: () => {}, unlockScreen: () => {},
      reveal: () => {}, isRevealed: () => false, setIdleSeconds: () => {}, setAutoObscureOnBlur: () => {},
      isObscured: () => false,
    };
  }
  return ctx;
}
