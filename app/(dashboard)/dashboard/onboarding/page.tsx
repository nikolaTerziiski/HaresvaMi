import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { RestaurantSetupForm } from "@/components/dashboard/RestaurantSetupForm";
import { getCurrentOwnerState, getOwnerLanguage } from "@/lib/auth/owner";

export default async function DashboardOnboardingPage() {
  const { user, restaurant } = await getCurrentOwnerState();

  if (!user) {
    redirect("/login");
  }

  if (restaurant) {
    redirect("/dashboard");
  }

  const t = await getTranslations("dashboard.onboarding");

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-10">
      <section className="w-full max-w-2xl rounded-[28px] border border-[var(--rule)] bg-[var(--paper)] p-8 shadow-[0_30px_60px_-30px_rgba(26,21,18,0.18)] md:p-10">
        <div className="mb-8">
          <p className="mb-4 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--accent)]">
            {t("eyebrow")}
          </p>
          <h1 className="font-[var(--f-display)] text-4xl leading-none tracking-[-0.02em] text-[var(--ink)] md:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-xl text-[15px] text-[var(--ink-2)]">
            {t("description")}
          </p>
        </div>

        <RestaurantSetupForm
          ownerId={user.id}
          ownerLanguage={getOwnerLanguage(user)}
        />
      </section>
    </main>
  );
}
