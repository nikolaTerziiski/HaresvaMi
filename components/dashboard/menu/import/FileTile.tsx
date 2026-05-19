import { ImgIcon, XIcon } from "@/components/dashboard/menu/import/ImportIcons";

const IMG_GRADIENTS = [
  "linear-gradient(160deg,#D4C5A8 0%,#9B7E5C 50%,#5B3F2B 100%)",
  "linear-gradient(160deg,#E8D4B5 0%,#B89764 50%,#7C5430 100%)",
  "linear-gradient(160deg,#C8B89A 0%,#8C7456 50%,#4A3525 100%)",
  "linear-gradient(135deg,#C9BDA8,#B9A88E)",
] as const;

function fileSizeMb(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export function FileTile({
  file,
  index,
  onRemove,
}: {
  file: File;
  index: number;
  onRemove: (i: number) => void;
}) {
  const isPdf = file.type === "application/pdf";
  const thumbStyle: React.CSSProperties = isPdf
    ? { background: "linear-gradient(135deg,#5B2A2A,#8B3F3F)" }
    : { background: IMG_GRADIENTS[index % IMG_GRADIENTS.length] };

  return (
    <div className="group relative flex flex-col gap-2 rounded-[10px] border border-[var(--rule)] bg-[var(--bg)] p-2.5">
      <div
        className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-[6px]"
        style={{ ...thumbStyle, color: "rgba(255,255,255,0.7)" }}
      >
        {isPdf ? (
          <span
            className="font-[var(--f-mono)] text-[22px] font-semibold tracking-[0.06em] text-[var(--paper)]"
            aria-label="PDF"
          >
            PDF
          </span>
        ) : (
          <ImgIcon />
        )}
      </div>

      <div className="text-[11.5px] leading-[1.3] text-[var(--ink-2)]">
        <b className="block break-all text-[12px] font-medium text-[var(--ink)]">
          {file.name}
        </b>
        <span className="mt-0.5 block font-[var(--f-mono)] text-[10px] uppercase tracking-[0.04em] text-[var(--ink-mute)]">
          {isPdf ? "PDF" : "снимка"} · {fileSizeMb(file.size)} MB
        </span>
      </div>

      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute right-1.5 top-1.5 grid h-[22px] w-[22px] place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: "rgba(26,21,18,0.65)", color: "var(--paper)" }}
        aria-label={`Премахни ${file.name}`}
      >
        <XIcon />
      </button>
    </div>
  );
}
