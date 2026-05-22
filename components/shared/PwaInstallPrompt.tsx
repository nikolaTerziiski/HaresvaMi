"use client";

import { useEffect, useRef, useState } from "react";

type Surface = "tablet" | "dashboard";

type PwaInstallPromptProps = {
  /** Controls which copy variant is shown. */
  surface: Surface;
  /**
   * Controlled visibility signal from the parent.
   * The parent decides whether the feature gate is met (e.g. has kiosk session,
   * or has completed feedback). The prompt applies its own dismissed check.
   */
  show: boolean;
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const COPY: Record<Surface, { title: string; body: string; dismiss: string }> =
  {
    tablet: {
      title: "Запази таблета на началния екран",
      body: "Така ще се отваря като приложение и винаги ще си готов за бона.",
      dismiss: "Не сега",
    },
    dashboard: {
      title: "Добави HaresvaMi на телефона си",
      body: "Получавай седмични обобщения и не пропускай нищо важно.",
      dismiss: "Не сега",
    },
  };

function dismissedKey(surface: Surface): string {
  return `pwa_prompt_dismissed_${surface}`;
}

function isDismissed(surface: Surface): boolean {
  if (typeof localStorage === "undefined") return false;

  return localStorage.getItem(dismissedKey(surface)) === "1";
}

function markDismissed(surface: Surface): void {
  try {
    localStorage.setItem(dismissedKey(surface), "1");
  } catch {
    // Ignore storage errors
  }
}

/** Detect iOS Safari where beforeinstallprompt never fires. */
function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua);

  return isIos && isSafari;
}

export function PwaInstallPrompt({ surface, show }: PwaInstallPromptProps) {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsIos(isIosSafari());
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;

      if (show && !isDismissed(surface)) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [show, surface]);

  // Re-evaluate visibility when `show` changes (e.g. parent gates become true)
  useEffect(() => {
    if (show && deferredPromptRef.current && !isDismissed(surface)) {
      setIsVisible(true);
    }
  }, [show, surface]);

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current;

    if (!prompt) return;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferredPromptRef.current = null;

    if (outcome === "dismissed") {
      markDismissed(surface);
    }

    setIsVisible(false);
  };

  const handleDismiss = () => {
    markDismissed(surface);
    setIsVisible(false);
  };

  const copy = COPY[surface];

  // iOS Safari: beforeinstallprompt never fires — show manual hint on dashboard only
  if (isIos && surface === "dashboard" && show && !isDismissed(surface)) {
    return (
      <div className="rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-4 text-[14px] leading-[1.5] text-[var(--ink-2)]">
        <p className="m-0">
          На iPhone отвори в Safari → бутон Сподели →{" "}
          <span className="font-medium text-[var(--ink)]">
            &lsquo;Добави към началния екран&rsquo;
          </span>
        </p>
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <div className="rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-5 shadow-[0_4px_16px_-6px_rgba(26,21,18,0.12)]">
      <h3 className="m-0 text-[16px] font-medium text-[var(--ink)]">
        {copy.title}
      </h3>
      <p className="mt-1 mb-4 text-[14px] leading-[1.5] text-[var(--ink-2)]">
        {copy.body}
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleInstall}
          className="rounded-md bg-[var(--accent)] px-5 py-2 text-[14px] font-medium text-[var(--paper)] transition-colors hover:bg-[var(--ink)]"
        >
          Инсталирай
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-md border border-[var(--rule)] bg-transparent px-5 py-2 text-[14px] font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--ink)]"
        >
          {copy.dismiss}
        </button>
      </div>
    </div>
  );
}
