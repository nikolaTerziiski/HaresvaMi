"use client";

import { useEffect } from "react";

/**
 * Registers the HaresvaMi service worker once on mount.
 * Rendered in the root layout so it runs on every page.
 * Does nothing in environments that don't support service workers.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      // Non-fatal: the app works fine without push notifications.
      console.warn("[SW] Registration failed:", err);
    });
  }, []);

  return null;
}
