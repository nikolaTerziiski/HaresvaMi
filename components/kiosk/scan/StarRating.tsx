import { Star } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type StarRatingProps = {
  disabled: boolean;
  itemName: string;
  value: number;
  onChange: (rating: number) => void;
};

export function StarRating({
  disabled,
  itemName,
  value,
  onChange,
}: StarRatingProps) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={itemName}>
      {Array.from({ length: 5 }, (_, index) => index + 1).map((score) => (
        <button
          key={score}
          type="button"
          aria-checked={value === score}
          aria-label={`${score} / 5`}
          className={cn(
            "grid size-11 place-items-center rounded-lg text-[var(--rule)] transition disabled:cursor-not-allowed disabled:opacity-60",
            "hover:bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] hover:text-[var(--accent-2)]",
            score <= value && "text-[var(--accent-2)]",
          )}
          disabled={disabled}
          role="radio"
          onClick={() => onChange(score)}
        >
          <Star
            aria-hidden="true"
            className={cn("size-7", score <= value && "fill-current")}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
