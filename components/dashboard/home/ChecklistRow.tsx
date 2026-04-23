import { Check, ChevronRight, Lock } from "lucide-react";
import type { ReactNode } from "react";

import type { ChecklistStatus } from "@/lib/dashboard/home";

type ChecklistRowProps = {
  index: number;
  status: ChecklistStatus;
  title: string;
  description: string;
  indicator?: ReactNode;
  action?: ReactNode;
};

const rowTintByStatus: Record<ChecklistStatus, string> = {
  done: "",
  current: "bg-[color-mix(in_oklab,var(--accent)_4%,transparent)]",
  locked: "",
};

const titleToneByStatus: Record<ChecklistStatus, string> = {
  done: "text-[var(--ink)]",
  current: "text-[var(--ink)]",
  locked: "text-[var(--ink-mute)]",
};

const bodyToneByStatus: Record<ChecklistStatus, string> = {
  done: "text-[var(--ink-2)]",
  current: "text-[var(--ink-2)]",
  locked: "text-[color-mix(in_oklab,var(--ink-mute)_90%,transparent)]",
};

const railToneByStatus: Record<ChecklistStatus, string> = {
  done: "text-[var(--ink-mute)]",
  current: "text-[var(--ink-mute)]",
  locked: "text-[color-mix(in_oklab,var(--ink-mute)_60%,transparent)]",
};

function StatusCircle({ status }: { status: ChecklistStatus }) {
  if (status === "done") {
    return (
      <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--ink)] text-[var(--paper)]">
        <Check className="h-[15px] w-[15px]" strokeWidth={2.5} />
      </div>
    );
  }
  if (status === "current") {
    return (
      <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent)] text-[var(--paper)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_15%,transparent)]">
        <ChevronRight className="h-[15px] w-[15px]" strokeWidth={2.25} />
      </div>
    );
  }
  return (
    <div className="grid h-8 w-8 place-items-center rounded-full border border-[var(--rule)] bg-[var(--bg)] text-[var(--ink-mute)]">
      <Lock className="h-[13px] w-[13px]" strokeWidth={1.75} />
    </div>
  );
}

export function ChecklistRow({
  index,
  status,
  title,
  description,
  indicator,
  action,
}: ChecklistRowProps) {
  return (
    <div
      className={[
        "flex items-start gap-[18px] border-b border-[var(--rule)] px-8 py-6 last:border-b-0",
        "max-md:flex-wrap max-md:px-5",
        rowTintByStatus[status],
      ].join(" ")}
    >
      <div className="flex flex-col items-center gap-2 pt-[2px]">
        <span
          className={[
            "font-[var(--f-mono)] text-[10px] tracking-[0.08em]",
            railToneByStatus[status],
          ].join(" ")}
        >
          0{index + 1}
        </span>
        <StatusCircle status={status} />
      </div>

      <div className="min-w-0 flex-1 pt-1">
        <h3
          className={[
            "m-0 inline-flex flex-wrap items-center gap-[10px] font-[var(--f-display)] text-[21px] font-normal leading-[1.4] tracking-[-0.01em]",
            titleToneByStatus[status],
          ].join(" ")}
        >
          {title}
          {indicator}
        </h3>
        <p
          className={[
            "mt-[14px] max-w-[540px] text-[14px] leading-[1.55]",
            bodyToneByStatus[status],
          ].join(" ")}
        >
          {description}
        </p>
      </div>

      {action ? (
        <div className="shrink-0 self-center max-md:mt-[10px] max-md:w-full">
          {action}
        </div>
      ) : null}
    </div>
  );
}
