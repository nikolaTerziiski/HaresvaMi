"use client";

import { useTranslations } from "next-intl";

type StepperProps = {
  current: 1 | 2 | 3;
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="10" height="10" aria-hidden="true">
      <polyline
        points="5 12 10 17 20 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ImportStepper({ current }: StepperProps) {
  const t = useTranslations("dashboard.menu.import.stepper");

  const steps = [
    { n: 1 as const, label: t("upload") },
    { n: 2 as const, label: t("ai") },
    { n: 3 as const, label: t("review") },
  ];

  return (
    <div
      className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-[var(--rule)] bg-[var(--paper)] px-3.5 py-2 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.06em]"
      aria-label="Стъпки на импорта"
    >
      {steps.map((step, i) => {
        const isDone = step.n < current;
        const isActive = step.n === current;

        const numClass = isDone
          ? "bg-[var(--good)] border-[var(--good)] text-[var(--paper)]"
          : isActive
            ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--paper)]"
            : "bg-[var(--bg)] border-[var(--rule)] text-[var(--ink-mute)]";

        const textClass = isDone
          ? "text-[var(--good)]"
          : isActive
            ? "text-[var(--accent)]"
            : "text-[var(--ink-mute)]";

        return (
          <span key={step.n} className="inline-flex items-center gap-1.5">
            <span
              className={`inline-grid h-[18px] w-[18px] flex-shrink-0 place-items-center rounded-full border text-[10px] font-semibold ${numClass}`}
              aria-current={isActive ? "step" : undefined}
            >
              {isDone ? <CheckIcon /> : step.n}
            </span>
            <span className={textClass}>{step.label}</span>

            {i < steps.length - 1 && (
              <span
                className="mx-0.5 h-px w-[18px] bg-[var(--rule)]"
                aria-hidden="true"
              />
            )}
          </span>
        );
      })}
    </div>
  );
}
