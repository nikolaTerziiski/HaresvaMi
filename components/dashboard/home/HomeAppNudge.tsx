"use client";

import { useEffect, useRef, useState } from "react";
import { Info, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "home_app_nudge_dismissed";

function isDismissed(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(DISMISSED_KEY) === "1";
}

function markDismissed(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // ignore storage errors
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

export function HomeAppNudge() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Read dismissal and iOS state on client only
    const alreadyDismissed = isDismissed();
    setDismissed(alreadyDismissed);
    setIsIos(isIosSafari());

    if (alreadyDismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferredPromptRef.current = null;

    if (outcome === "dismissed") {
      markDismissed();
    }
    setVisible(false);
    setDismissed(true);
  };

  const handleDismiss = () => {
    markDismissed();
    setVisible(false);
    setDismissed(true);
  };

  // iOS Safari: beforeinstallprompt never fires — show manual hint instead
  const showIosHint = isIos && !dismissed;

  // Show the nudge row when: (a) PWA prompt is available, or (b) iOS hint applies
  const showNudge = visible || showIosHint;

  return (
    <div className="mt-5">
      {showNudge && (
        <div className="flex items-center gap-5 rounded-xl border border-dashed border-[var(--rule)] bg-transparent px-[26px] py-5 max-md:flex-wrap">
          {/* Icon */}
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--bg-2)] text-[var(--ink-2)]">
            <Smartphone size={20} strokeWidth={1.75} />
          </div>

          {/* Body */}
          <div className="min-w-0 flex-1">
            <h4 className="m-0 mb-[3px] font-[var(--f-ui)] text-[15px] font-semibold text-[var(--ink)]">
              Получавай HaresvaMi на телефона си
            </h4>
            <p className="m-0 max-w-[460px] text-[13.5px] leading-[1.5] text-[var(--ink-mute)]">
              Добави приложението и включи седмични обобщения — ще е по-полезно
              щом влязат първите отзиви.
            </p>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {showIosHint ? (
              <span className="max-w-[260px] text-[13px] leading-[1.5] text-[var(--ink-2)]">
                В Safari натисни Сподели →{" "}
                <span className="font-medium text-[var(--ink)]">
                  &lsquo;Добави към началния екран&rsquo;
                </span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleInstall}
                className="rounded-lg bg-[var(--bg-2)] px-4 py-2.5 text-[13.5px] font-medium text-[var(--ink)] transition-colors hover:bg-[color-mix(in_oklab,var(--bg-2)_80%,var(--ink)_20%)]"
              >
                Добави на телефона
              </button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              className="px-2.5 py-2.5 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.06em] text-[var(--ink-mute)] transition-colors hover:text-[var(--ink)]"
            >
              По-късно
            </button>
          </div>
        </div>
      )}

      {/* Note — always visible (nudge row or not), since it's informational */}
      <p className="mt-3.5 flex items-center gap-2 px-1 text-[12.5px] text-[var(--ink-mute)]">
        <Info size={13} strokeWidth={1.75} className="shrink-0" />
        Седмичните обобщения се включват автоматично с добавянето на
        приложението. Можеш да ги спреш по всяко време от Настройки.
      </p>
    </div>
  );
}
