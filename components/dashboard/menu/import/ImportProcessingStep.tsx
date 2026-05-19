"use client";

import { useTranslations } from "next-intl";

type ImportProcessingStepProps = {
  files: File[];
  onCancel: () => void;
};

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.5 2.5M16 16l2.5 2.5M5.5 18.5l2.5-2.5M16 8l2.5-2.5" />
      <path d="M12 8a4 4 0 014 4 4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 014-4z" />
    </svg>
  );
}

const IMG_GRADIENTS = [
  "linear-gradient(160deg,#D4C5A8,#5B3F2B)",
  "linear-gradient(160deg,#E8D4B5,#7C5430)",
  "linear-gradient(160deg,#C8B89A,#4A3525)",
  "linear-gradient(135deg,#C9BDA8,#B9A88E)",
] as const;

function fileSizeMb(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

/*
 * The `glow` keyframe is declared in the global CSS (or injected inline below).
 * It is safe to reference via style.animation because Next.js bundles the
 * globals.css where this keyframe lives — or we inline it via a <style> tag
 * that is scoped to this subtree.
 */
const GLOW_STYLE = `
@keyframes glow {
  0%, 100% { box-shadow: 0 0 0 6px color-mix(in oklab, var(--accent) 12%, transparent); }
  50% { box-shadow: 0 0 0 14px color-mix(in oklab, var(--accent) 4%, transparent); }
}
`;

export function ImportProcessingStep({
  files,
  onCancel,
}: ImportProcessingStepProps) {
  const t = useTranslations("dashboard.menu.import");

  return (
    <div className="w-full">
      {/* Inject the glow keyframe once */}
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: GLOW_STYLE }} />

      {/* Intro */}
      <div>
        <p className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
          {t("processing.eyebrow")}
        </p>
        <h2 className="mt-2 mb-3.5 font-[var(--f-display)] text-[42px] font-normal leading-[1.02] tracking-[-0.02em] text-[var(--ink)] max-md:text-[32px]">
          <em className="italic text-[var(--accent)]">AI</em> чете менюто ти.
        </h2>
        <p className="m-0 max-w-[620px] text-[15.5px] leading-[1.55] text-[var(--ink-mute)]">
          {t("processing.subtitle")}
        </p>
      </div>

      {/* Two-column layout — stacks on narrow viewports */}
      <div
        className="mt-8 grid items-start gap-7 max-[960px]:grid-cols-1"
        style={{ gridTemplateColumns: "1.2fr 1fr" }}
      >
        {/* Left: processing card */}
        <div className="relative overflow-hidden rounded-2xl border border-[var(--rule)] bg-[var(--paper)] px-9 pt-9 pb-7">
          {/* Top gradient accent bar */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{
              background:
                "linear-gradient(90deg, var(--accent) 0%, var(--accent) 64%, var(--rule) 64%, var(--rule) 100%)",
            }}
            aria-hidden="true"
          />

          {/* Pulse icon + headline */}
          <div className="flex items-start gap-[18px]">
            <div
              className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-[14px] text-[var(--paper)]"
              style={{
                background: "linear-gradient(140deg, var(--accent), #D17A2A)",
                animation: "glow 1.8s ease-in-out infinite",
              }}
              aria-hidden="true"
            >
              <SparklesIcon />
            </div>
            <div>
              <h3 className="mb-1 font-[var(--f-display)] text-[30px] font-normal leading-[1.05] tracking-[-0.01em] text-[var(--ink)]">
                <em className="italic text-[var(--accent)]">AI</em>{" "}
                {t("processing.body")}
              </h3>
              <p className="m-0 max-w-[480px] text-[14px] leading-[1.55] text-[var(--ink-mute)]">
                {t("processing.subtitle")}
              </p>
            </div>
          </div>

          {/* Footer with cancel */}
          <div className="mt-[18px] flex items-center gap-2.5 text-[12.5px] leading-[1.55] text-[var(--ink-mute)]">
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8h.01" />
              <path d="M11 12h1v5h1" />
            </svg>
            <span>Не затваряй раздела за по-бързо.</span>
            <button
              type="button"
              onClick={onCancel}
              className="ml-auto rounded-[6px] border border-[var(--rule)] px-3 py-1.5 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.06em] text-[var(--ink-mute)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {t("processing.cancel")}
            </button>
          </div>
        </div>

        {/* Right: file list — no per-file status theater */}
        {files.length > 0 && (
          <aside className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] px-5 py-[18px]">
            <p className="mb-3.5 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
              Файлове в обработка
            </p>
            <ul className="m-0 list-none p-0">
              {files.map((file, i) => {
                const isPdf = file.type === "application/pdf";
                const thumbStyle: React.CSSProperties = isPdf
                  ? { background: "linear-gradient(135deg,#5B2A2A,#8B3F3F)" }
                  : { background: IMG_GRADIENTS[i % IMG_GRADIENTS.length] };

                return (
                  <li
                    key={`${file.name}-${file.size}`}
                    className="grid items-center gap-3 border-t border-[var(--rule-soft)] py-2.5 text-[13px] first:border-t-0"
                    style={{ gridTemplateColumns: "36px 1fr" }}
                  >
                    <span
                      className="h-11 w-9 flex-shrink-0 rounded-[5px]"
                      style={thumbStyle}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <b className="block truncate font-medium text-[var(--ink)]">
                        {file.name}
                      </b>
                      <span className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.05em] text-[var(--ink-mute)]">
                        {isPdf ? "PDF" : "снимка"} · {fileSizeMb(file.size)} MB
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
