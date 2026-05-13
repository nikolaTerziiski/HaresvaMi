import { Loader2 } from "lucide-react";

type ProcessingOverlayProps = {
  message: string;
};

export function ProcessingOverlay({ message }: ProcessingOverlayProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 grid place-items-center bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] backdrop-blur"
    >
      <div className="mx-6 flex max-w-[420px] flex-col items-center gap-5 rounded-2xl border border-[var(--rule)] bg-[var(--paper)] px-8 py-10 text-center">
        <Loader2
          className="h-10 w-10 animate-spin text-[var(--accent)]"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <p className="m-0 font-[var(--f-display)] text-[24px] font-normal leading-tight text-[var(--ink)]">
          {message}
        </p>
      </div>
    </div>
  );
}
