import type { EntitlementResult, KioskRestaurant } from "@/lib/kiosk/types";
import { cn } from "@/lib/utils/cn";

type ScanHeaderProps = {
  audience: "staff" | "customer" | "thanks";
  entitlement: EntitlementResult;
  remainingLabel: string;
  restaurant: KioskRestaurant;
  scanEyebrow: string;
  exhaustedTitle: string;
};

export function ScanHeader({
  audience,
  entitlement,
  remainingLabel,
  restaurant,
  scanEyebrow,
  exhaustedTitle,
}: ScanHeaderProps) {
  const isStaff = audience === "staff";

  return (
    <header
      className={cn(
        "flex items-center justify-between gap-6 border-b border-[var(--rule)] px-8 py-4 max-md:px-5",
        isStaff ? "bg-[var(--paper)]" : "bg-[var(--bg)]",
      )}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-[var(--accent)] font-[var(--f-display)] text-[20px] italic leading-none text-[var(--paper)]">
          h
        </span>
        <div>
          <p className="m-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.12em] text-[var(--ink-mute)]">
            {scanEyebrow}
          </p>
          <h1 className="mt-0.5 mb-0 text-[16px] font-medium leading-tight text-[var(--ink)]">
            {restaurant.name}
          </h1>
        </div>
      </div>
      {isStaff ? (
        <div
          className={[
            "rounded-full border px-4 py-2 text-right font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] max-sm:hidden",
            entitlement.remaining > 0
              ? "border-[var(--rule)] text-[var(--ink-mute)]"
              : "border-[var(--accent)] text-[var(--accent)]",
          ].join(" ")}
        >
          {entitlement.remaining > 0
            ? `${entitlement.remaining} / ${entitlement.limit} ${remainingLabel}`
            : exhaustedTitle}
        </div>
      ) : null}
    </header>
  );
}
