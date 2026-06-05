"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker (production only). The SW caches the app
 * shell + static assets but NEVER caches /api data, so live care information is
 * always fetched fresh. Renders nothing.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration is best-effort — the app works fine without it */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
