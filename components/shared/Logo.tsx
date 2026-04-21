import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
};

export default function Logo({ className }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-bold tracking-tight text-ink-900 text-lg",
        className,
      )}
    >
      <span>Haresva</span>
      <span className="text-coral-500">Mi</span>
    </span>
  );
}
