import { cn } from "@/lib/utils/cn";

type DishMarkProps = {
  imageUrl: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "size-12 rounded-lg text-[24px]",
  md: "size-14 rounded-xl text-[28px]",
  lg: "size-24 rounded-xl text-[44px]",
};

const tones = [
  "bg-[var(--plum)]",
  "bg-[var(--accent)]",
  "bg-[var(--good)]",
  "bg-[var(--accent-2)]",
  "bg-[var(--ink-2)]",
];

function getInitial(name: string) {
  return name.trim().charAt(0).toLocaleUpperCase("bg-BG") || "H";
}

function getTone(name: string) {
  const code = Array.from(name).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );

  return tones[code % tones.length];
}

export function DishMark({ imageUrl, name, size = "md" }: DishMarkProps) {
  const className = cn(
    "relative grid shrink-0 place-items-center overflow-hidden font-[var(--f-display)] italic leading-none text-[var(--paper)]",
    sizeClasses[size],
    getTone(name),
  );

  if (imageUrl) {
    return (
      <span className={className}>
        <img src={imageUrl} alt="" className="size-full object-cover" />
      </span>
    );
  }

  return <span className={className}>{getInitial(name)}</span>;
}
