import type { EntitlementResult, KioskRestaurant } from "@/lib/kiosk/types";

type ScanHeaderProps = {
  entitlement: EntitlementResult;
  remainingLabel: string;
  restaurant: KioskRestaurant;
  scanEyebrow: string;
  exhaustedTitle: string;
};

export function ScanHeader({
  entitlement,
  remainingLabel,
  restaurant,
  scanEyebrow,
  exhaustedTitle,
}: ScanHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-6">
      <div>
        <p className="m-0 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.12em] text-[var(--accent)]">
          {scanEyebrow}
        </p>
        <h1 className="mt-2 mb-0 font-[var(--f-display)] text-[48px] font-normal leading-none max-md:text-[36px]">
          {restaurant.name}
        </h1>
      </div>
      <div
        className={[
          "rounded-full border px-4 py-2 text-right font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em]",
          entitlement.remaining > 0
            ? "border-[var(--rule)] text-[var(--ink-mute)]"
            : "border-[var(--accent)] text-[var(--accent)]",
        ].join(" ")}
      >
        {entitlement.remaining > 0
          ? `${entitlement.remaining} / ${entitlement.limit} ${remainingLabel}`
          : exhaustedTitle}
      </div>
    </header>
  );
}
