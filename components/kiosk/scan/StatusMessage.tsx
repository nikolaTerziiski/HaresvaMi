type StatusMessageProps = {
  message: string | null;
};

export function StatusMessage({ message }: StatusMessageProps) {
  if (!message) return null;

  return (
    <p
      className="mt-5 max-w-[560px] rounded-lg border border-[var(--rule)] bg-[var(--paper)] px-4 py-3 text-[15px] text-[var(--ink-2)]"
      aria-live="polite"
    >
      {message}
    </p>
  );
}
