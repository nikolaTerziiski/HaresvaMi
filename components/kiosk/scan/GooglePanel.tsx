"use client";

import { useEffect } from "react";

import type { KioskScanCopy } from "@/lib/kiosk/types";

const AUTO_ADVANCE_MS = 45_000;

type GooglePanelProps = {
  copy: KioskScanCopy;
  qrSvg: string | null;
  reviewUrl: string | null;
  onDone: () => void;
};

export function GooglePanel({ copy, qrSvg, reviewUrl, onDone }: GooglePanelProps) {
  // Defensive: if no QR was generated, skip straight through
  useEffect(() => {
    if (!qrSvg) {
      onDone();
    }
  }, [qrSvg, onDone]);

  // Auto-advance after 45 s so the diner is never stranded
  useEffect(() => {
    const t = window.setTimeout(onDone, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [onDone]);

  if (!qrSvg) {
    return null;
  }

  return (
    <div className="grid min-h-[calc(100dvh-56px)] place-items-center px-6 text-center">
      <section className="w-full max-w-[640px]">
        <h2 className="m-0 font-[var(--f-display)] text-[48px] font-normal leading-none text-[var(--ink)] max-md:text-[36px]">
          {copy.googleTitle}
        </h2>
        <p className="mt-4 mb-8 text-[18px] leading-[1.55] text-[var(--ink-2)]">
          {copy.googleBody}
        </p>

        {/* QR card — white background so the QR scans reliably against any theme */}
        <div className="mx-auto mb-5 flex w-[300px] items-center justify-center rounded-3xl bg-white p-6 shadow-[0_2px_24px_rgba(0,0,0,0.08)]">
          {/* SVG is server-generated from a validated URL — dangerouslySetInnerHTML is safe here */}
          <div
            className="h-[280px] w-[280px]"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>

        <p className="mb-8 text-[15px] leading-[1.5] text-[var(--ink-mute)]">
          {copy.googleScanHint}
        </p>

        {reviewUrl ? (
          <p className="mb-6 text-[14px] text-[var(--ink-mute)]">
            <a
              href={reviewUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-[var(--ink)]"
            >
              {reviewUrl}
            </a>
          </p>
        ) : null}

        <button
          type="button"
          className="inline-flex min-h-14 min-w-[200px] items-center justify-center rounded-[20px] bg-[var(--accent)] px-7 py-3.5 text-[18px] font-semibold text-[var(--paper)]"
          onClick={onDone}
        >
          {copy.googleDone}
        </button>
      </section>
    </div>
  );
}
