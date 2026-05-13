import { Info } from "lucide-react";

type StatusMessageProps = {
  message: string | null;
};

export function StatusMessage({ message }: StatusMessageProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-5 flex max-w-[560px] items-start gap-3 rounded-lg border border-[var(--accent)] bg-[var(--paper)] px-4 py-3 text-[15px] leading-[1.45] text-[var(--ink-2)]"
    >
      <Info
        className="mt-[2px] h-4 w-4 shrink-0 text-[var(--accent)]"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <span>{message}</span>
    </div>
  );
}
