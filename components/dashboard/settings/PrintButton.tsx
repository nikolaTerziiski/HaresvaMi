"use client";

type PrintButtonProps = {
  label: string;
};

export function PrintButton({ label }: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex rounded-lg border border-[var(--rule)] bg-[var(--paper)] px-5 py-2.5 text-[14px] font-medium text-[var(--ink-2)] transition hover:border-[var(--ink)] hover:text-[var(--ink)]"
    >
      {label}
    </button>
  );
}
