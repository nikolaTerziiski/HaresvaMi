import { Ear } from "lucide-react";

type ListeningIndicatorProps = {
  label: string;
};

export function ListeningIndicator({ label }: ListeningIndicatorProps) {
  return (
    <span className="inline-flex items-center gap-[6px] rounded-full border border-[var(--rule)] bg-[var(--bg)] px-[10px] py-[3px] font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
      <span className="block h-[6px] w-[6px] animate-pulse rounded-full bg-[var(--accent)]" />
      <Ear className="h-[11px] w-[11px]" strokeWidth={1.75} />
      {label}
    </span>
  );
}
