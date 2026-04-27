import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { DashboardHomeData } from "@/lib/dashboard/home";

import { ChecklistRow } from "./ChecklistRow";
import { ListeningIndicator } from "./ListeningIndicator";

type GetStartedChecklistProps = {
  data: DashboardHomeData;
};

const PRIMARY_BTN =
  "inline-flex items-center gap-[6px] rounded-lg bg-[var(--accent)] px-[18px] py-[10px] text-[14px] font-medium text-[var(--paper)] shadow-[0_6px_20px_-8px_rgba(194,77,44,0.6)] transition hover:bg-[var(--plum)] active:translate-y-[1px]";

const DISABLED_BTN =
  "inline-flex cursor-not-allowed items-center gap-[6px] rounded-lg border border-[var(--rule)] bg-transparent px-[18px] py-[10px] text-[12px] text-[var(--ink-mute)]";

const GHOST_BTN =
  "inline-flex items-center gap-[6px] rounded-md px-3 py-2 text-[13px] text-[var(--ink-2)] transition hover:bg-[color-mix(in_oklab,var(--paper)_60%,transparent)] hover:text-[var(--ink)]";

export async function GetStartedChecklist({ data }: GetStartedChecklistProps) {
  const t = await getTranslations("dashboard.home.checklist");

  const { steps, restaurant, menuCount } = data;

  const doneCount = Object.values(steps).filter((s) => s === "done").length;
  const totalCount = 4;

  const restaurantRow = {
    status: steps.restaurant,
    title: t("restaurant.titleDone"),
    description: t("restaurant.descDone", { name: restaurant.name }),
    action: (
      <Link href="/dashboard/settings" className={GHOST_BTN}>
        {t("edit")}
      </Link>
    ),
  } as const;

  const menuRow =
    steps.menu === "done"
      ? {
          status: steps.menu,
          title: t("menu.titleDone"),
          description: t("menu.descDone", { count: menuCount }),
          action: (
            <Link href="/dashboard/menu" className={GHOST_BTN}>
              {t("edit")}
            </Link>
          ),
        }
      : {
          status: steps.menu,
          title: t("menu.titleTodo"),
          description: t("menu.descTodo"),
          action: (
            <Link href="/dashboard/menu" className={PRIMARY_BTN}>
              {t("menu.ctaTodo")}
              <ChevronRight className="h-[15px] w-[15px]" strokeWidth={2.25} />
            </Link>
          ),
        };

  let tabletRow: {
    status: typeof steps.tablet;
    title: string;
    description: string;
    action?: React.ReactNode;
  } | null = null;

  if (steps.tablet === "done") {
    tabletRow = {
      status: steps.tablet,
      title: t("tablet.titleDone"),
      description: t("tablet.descDone"),
    };
  } else if (steps.tablet === "current") {
    tabletRow = {
      status: steps.tablet,
      title: t("tablet.titleTodo"),
      description: t("tablet.descTodo"),
      action: (
        <Link href="/dashboard/tablet" className={PRIMARY_BTN}>
          {t("tablet.ctaTodo")}
          <ChevronRight className="h-[15px] w-[15px]" strokeWidth={2.25} />
        </Link>
      ),
    };
  } else {
    tabletRow = {
      status: steps.tablet,
      title: t("tablet.titleTodo"),
      description: t("tablet.descTodo"),
      action: (
        <button type="button" disabled className={DISABLED_BTN}>
          {t("tablet.lockedCta")}
        </button>
      ),
    };
  }

  const feedbackRow = {
    status: steps.feedback,
    title: t("feedback.title"),
    description:
      steps.feedback === "current"
        ? t("feedback.descWaiting")
        : t("feedback.descLocked"),
    indicator:
      steps.feedback === "current" ? (
        <ListeningIndicator label={t("feedback.listening")} />
      ) : null,
  } as const;

  const rows = [restaurantRow, menuRow, tabletRow, feedbackRow];

  return (
    <section className="mt-10 overflow-hidden rounded-[14px] border border-[var(--rule)] bg-[var(--paper)] shadow-[0_30px_60px_-40px_rgba(26,21,18,0.2)]">
      <header className="flex items-center border-b border-[var(--rule)] px-8 py-[14px] font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--ink-mute)] max-md:px-5 max-md:py-3">
        {t("eyebrow")}
        <span className="ml-auto font-[var(--f-ui)] text-[12px] normal-case tracking-normal text-[var(--ink-mute)]">
          {t("progress", { done: doneCount, total: totalCount })}
        </span>
      </header>

      {rows.map((row, idx) => (
        <ChecklistRow
          key={idx}
          index={idx}
          status={row.status}
          title={row.title}
          description={row.description}
          indicator={"indicator" in row ? row.indicator : undefined}
          action={"action" in row ? row.action : undefined}
        />
      ))}
    </section>
  );
}
