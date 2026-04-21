import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getCurrentOwnerState } from "@/lib/auth/owner";

export default async function DashboardPage() {
  const { user, restaurant } = await getCurrentOwnerState();

  if (!user) {
    redirect("/login");
  }

  if (!restaurant) {
    redirect("/dashboard/onboarding");
  }

  const t = await getTranslations("dashboard.placeholder");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl items-center px-6 py-10">
      <section className="w-full rounded-[32px] border border-[var(--rule)] bg-[var(--paper)] p-8 shadow-[0_30px_60px_-30px_rgba(26,21,18,0.18)] md:p-12">
        <p className="mb-4 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--accent)]">
          {t("eyebrow")}
        </p>
        <h1 className="max-w-3xl font-[var(--f-display)] text-4xl leading-none tracking-[-0.02em] text-[var(--ink)] md:text-5xl">
          {t("title", { restaurantName: restaurant.name })}
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] text-[var(--ink-2)]">
          {t("description")}
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[var(--rule)] bg-[var(--bg)] p-5">
            <p className="font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
              {t("restaurantLabel")}
            </p>
            <p className="mt-3 font-[var(--f-display)] text-3xl leading-none text-[var(--ink)]">
              {restaurant.name}
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--rule)] bg-[var(--bg)] p-5">
            <p className="font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
              {t("slugLabel")}
            </p>
            <p className="mt-3 font-[var(--f-mono)] text-sm uppercase tracking-[0.08em] text-[var(--ink)]">
              /{restaurant.slug}
            </p>
          </article>
        </div>

        <p className="mt-8 text-sm text-[var(--ink-mute)]">{t("note")}</p>
      </section>
    </main>
  );
}
