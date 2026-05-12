"use client";

import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";

import type { KioskScanCopy } from "@/lib/kiosk/types";

type ThanksPanelProps = {
  copy: KioskScanCopy;
  onReset: () => void;
};

export function ThanksPanel({ copy, onReset }: ThanksPanelProps) {
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    const countdown = window.setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    const reset = window.setTimeout(onReset, 5200);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(reset);
    };
  }, [onReset]);

  return (
    <div className="grid min-h-[calc(100dvh-56px)] place-items-center px-6 text-center">
      <section className="max-w-[720px]">
        <div className="mx-auto mb-6 grid size-24 place-items-center rounded-full border border-[var(--accent)] bg-[var(--paper)] font-[var(--f-display)] text-[72px] leading-none text-[var(--accent)]">
          ♥
        </div>
        <h2 className="m-0 font-[var(--f-display)] text-[72px] font-normal leading-none text-[var(--ink)] max-md:text-[48px]">
          {copy.thanksTitle}
        </h2>
        <p className="mx-auto mt-5 mb-7 max-w-[640px] text-[22px] leading-[1.55] text-[var(--ink-2)]">
          {copy.thanksBody}
        </p>
        <p className="mb-6 inline-flex rounded-full border border-[var(--rule)] bg-[var(--paper)] px-5 py-3 font-[var(--f-mono)] text-[12px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
          {copy.thanksResettingIn}{" "}
          <b className="mx-1 text-[var(--ink)]">{seconds}</b>
          {copy.thanksSecondsSuffix}
        </p>
        <div>
          <button
            type="button"
            className="inline-flex min-h-16 min-w-[260px] items-center justify-center gap-3 rounded-[24px] bg-[var(--ink)] px-8 py-5 text-[22px] font-semibold text-[var(--paper)]"
            onClick={onReset}
          >
            <RefreshCcw aria-hidden="true" size={22} strokeWidth={1.5} />
            {copy.thanksNewReviewNow}
          </button>
        </div>
      </section>
    </div>
  );
}
