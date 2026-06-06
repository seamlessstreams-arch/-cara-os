"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ENABLE PUSH — opt this device into Web Push notifications.
// Requests permission, subscribes via the service worker, and registers the
// subscription server-side. Self-hides when push isn't supported by the browser or
// isn't configured (VAPID keys unset) — so there's no broken UI while dormant.
// ══════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function userId(): string {
  if (typeof window === "undefined") return "staff_darren";
  try { return localStorage.getItem("cs_user_id") ?? "staff_darren"; } catch { return "staff_darren"; }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type State = "loading" | "hidden" | "default" | "granted" | "denied" | "subscribing";

export function EnablePushButton({ className }: { className?: string }) {
  const [state, setState] = useState<State>("loading");
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) { setState("hidden"); return; }
    fetch("/api/v1/push/subscribe")
      .then((r) => r.json())
      .then((d) => {
        if (!d.configured || !d.publicKey) { setState("hidden"); return; }
        setPublicKey(d.publicKey);
        setState(Notification.permission === "granted" ? "granted" : Notification.permission === "denied" ? "denied" : "default");
      })
      .catch(() => setState("hidden"));
  }, []);

  async function enable() {
    if (!publicKey) return;
    setState("subscribing");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState(perm === "denied" ? "denied" : "default"); return; }
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));
      await fetch("/api/v1/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": userId() },
        body: JSON.stringify(sub.toJSON()),
      });
      setState("granted");
    } catch {
      setState("default");
    }
  }

  if (state === "loading" || state === "hidden") return null;

  if (state === "granted") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-[var(--cs-teal)]", className)}>
        <BellRing className="h-3.5 w-3.5" /> Device alerts on
      </span>
    );
  }
  if (state === "denied") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)]", className)}>
        <BellOff className="h-3.5 w-3.5" /> Alerts blocked — enable in your browser settings
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={enable}
      disabled={state === "subscribing"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border border-[var(--cs-teal)] bg-[var(--cs-teal-bg)] px-3 min-h-[36px] text-xs font-medium text-[var(--cs-navy)] transition-colors hover:bg-[var(--cs-teal-bg)]/70 disabled:opacity-50",
        className,
      )}
    >
      {state === "subscribing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5 text-[var(--cs-teal)]" />}
      Enable device alerts
    </button>
  );
}
