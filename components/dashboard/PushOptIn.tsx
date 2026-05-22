"use client";

import { useEffect, useState } from "react";

import {
  getCurrentSubscription,
  getNotificationPermission,
  isPushSupported,
  requestNotificationPermission,
  subscribePush,
} from "@/lib/push/client";

type PushOptInProps = {
  /**
   * Controlled signal from the parent — true when the restaurant has at least
   * one completed feedback session, meaning push insights are meaningful.
   */
  show: boolean;
};

const SNOOZE_KEY = "push_optin_snoozed_until";
const SNOOZE_DAYS = 14;

function isSnoozed(): boolean {
  if (typeof localStorage === "undefined") return false;

  const raw = localStorage.getItem(SNOOZE_KEY);

  if (!raw) return false;

  return Date.now() < Number(raw);
}

function snooze(): void {
  try {
    const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(SNOOZE_KEY, String(until));
  } catch {
    // Ignore storage errors
  }
}

type Status = "idle" | "loading" | "success" | "denied" | "error";

export function PushOptIn({ show }: PushOptInProps) {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (!show || !isPushSupported() || isSnoozed()) {
      setReady(true);
      return;
    }

    (async () => {
      const permission = getNotificationPermission();

      // Already granted and subscribed — nothing to show
      if (permission === "granted") {
        const sub = await getCurrentSubscription();

        if (sub) {
          setReady(true);
          return;
        }
      }

      // Permission already denied — can't prompt again
      if (permission === "denied") {
        setReady(true);
        return;
      }

      setVisible(true);
      setReady(true);
    })();
  }, [show]);

  const handleEnable = async () => {
    setStatus("loading");

    const permission = await requestNotificationPermission();

    if (permission !== "granted") {
      setStatus("denied");
      snooze();
      return;
    }

    const result = await subscribePush();

    if (result.ok) {
      setStatus("success");
      setTimeout(() => setVisible(false), 2000);
    } else {
      setStatus("error");
    }
  };

  const handleLater = () => {
    snooze();
    setVisible(false);
  };

  if (!ready || !visible) return null;

  return (
    <div className="rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-5 shadow-[0_4px_16px_-6px_rgba(26,21,18,0.12)]">
      {status === "success" ? (
        <p className="m-0 text-[14px] text-[var(--good)]">
          Включено! Ще получаваш седмични обобщения.
        </p>
      ) : status === "denied" ? (
        <p className="m-0 text-[14px] text-[var(--ink-2)]">
          Известията са блокирани. Разреши ги от настройките на браузъра.
        </p>
      ) : (
        <>
          <h3 className="m-0 text-[16px] font-medium text-[var(--ink)]">
            Седмични обобщения на телефона?
          </h3>
          <p className="mt-1 mb-4 text-[14px] leading-[1.5] text-[var(--ink-2)]">
            Искаш ли да получаваш седмични обобщения на телефона си?
          </p>
          {status === "error" && (
            <p className="mb-3 text-[13px] text-[var(--bad)]">
              Не успяхме да включим известията. Опитай пак.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={status === "loading"}
              onClick={handleEnable}
              className="rounded-md bg-[var(--accent)] px-5 py-2 text-[14px] font-medium text-[var(--paper)] transition-colors hover:bg-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? "Включваме..." : "Включи"}
            </button>
            <button
              type="button"
              disabled={status === "loading"}
              onClick={handleLater}
              className="rounded-md border border-[var(--rule)] bg-transparent px-5 py-2 text-[14px] font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              По-късно
            </button>
          </div>
        </>
      )}
    </div>
  );
}
