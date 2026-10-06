"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";

// Stable per-browser id so the server can tell visitors apart without cookies.
// localStorage (not a cookie) keeps this outside the consent banner's scope —
// it carries no personal data, just a random token.
const CLIENT_KEY = "edurank_client_id";
const INTERVAL_MS = 30_000;

function getClientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/-/g, "");
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch {
    // Private mode / storage disabled: fall back to a per-tab id.
    return "ephemeral";
  }
}

/**
 * Fires a heartbeat every 30s while the tab is visible so the owner control
 * room can show a live "on the site now" count. Silent by design — never
 * surfaces errors and never blocks rendering.
 */
export function PresenceHeartbeat() {
  useEffect(() => {
    const ping = () => {
      if (document.visibilityState !== "visible") return;
      void api.heartbeat(getClientId(), window.location.pathname).catch(() => {});
    };

    ping();
    const timer = window.setInterval(ping, INTERVAL_MS);

    // Returning to the tab should count immediately, not up to 30s later.
    const onVisible = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
