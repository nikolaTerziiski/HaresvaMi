"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

type MenuSaveBannerProps = {
  show: boolean;
};

export function MenuSaveBanner({ show }: MenuSaveBannerProps) {
  const t = useTranslations("dashboard.menu");
  // Track whether we're in the exit animation phase
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setExiting(false);
      setVisible(true);
    } else if (visible) {
      setExiting(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [show, visible]);

  if (!visible) return null;

  return (
    <div
      className={[
        "w-full bg-[var(--good)] px-10 py-3 max-md:px-6",
        exiting ? "banner-exit" : "banner-enter",
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-[var(--paper)]">
        <Check size={16} strokeWidth={2} />
        <span className="text-[14px] font-medium">{t("savedBanner")}</span>
      </div>
    </div>
  );
}
