import Link from "next/link";

type EmptyStateKind = "no-menu" | "no-feedback" | "not-enough-weekly-data";

type InsightsEmptyStateProps = {
  kind: EmptyStateKind;
};

const copy = {
  "no-menu": {
    title: "Първо ти трябва меню",
    body: "Прозренията се правят ястие по ястие. Добави менюто си, за да знаем кое точно оценяват клиентите.",
    href: "/dashboard/menu",
    action: "Добави меню",
  },
  "no-feedback": {
    title: "Още чакаме първите отзиви",
    body: "Когато клиент завърши оценяване от таблета, тук ще се появят седмичните изводи за ястията.",
    href: "/dashboard/tablet",
    action: "Отвори таблета",
  },
  "not-enough-weekly-data": {
    title: "Има отзиви, но седмицата е още тиха",
    body: "Трябват поне няколко оценки от последните 7 дни, преди да покажем победители, спадове или подобрения.",
    href: "/dashboard/feedback",
    action: "Виж суровите отзиви",
  },
} satisfies Record<
  EmptyStateKind,
  { title: string; body: string; href: string; action: string }
>;

export function InsightsEmptyState({ kind }: InsightsEmptyStateProps) {
  const state = copy[kind];

  return (
    <section className="mt-8 rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-6">
      <div className="max-w-[560px]">
        <h2 className="m-0 font-[var(--f-display)] text-[30px] font-normal leading-tight text-[var(--ink)]">
          {state.title}
        </h2>
        <p className="mb-0 mt-3 text-[15px] leading-[1.6] text-[var(--ink-2)]">
          {state.body}
        </p>
        <Link
          href={state.href}
          className="mt-6 inline-flex min-h-11 items-center rounded-md border border-[var(--rule)] bg-[var(--paper)] px-5 text-[14px] font-medium text-[var(--ink)] transition hover:bg-[var(--bg-2)]"
        >
          {state.action}
        </Link>
      </div>
    </section>
  );
}
