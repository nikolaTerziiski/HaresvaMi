import { redirect } from "next/navigation";

import { PwaInstallPrompt } from "@/components/shared/PwaInstallPrompt";
import { TabletSetupActions } from "@/components/dashboard/tablet/TabletSetupActions";
import { getCurrentOwnerState } from "@/lib/auth/owner";
import { listKioskSessions } from "@/lib/kiosk/session-token";
import { hasKioskSession } from "@/lib/dashboard/signals";

async function loadTabletSessions(restaurantId: string, ownerId: string) {
  try {
    const sessions = await listKioskSessions({
      restaurantId,
      ownerId,
    });

    return {
      sessions,
      error: null,
    };
  } catch (error) {
    console.error("Unable to load kiosk sessions:", error);

    const message = error instanceof Error ? error.message : "";
    const isInvalidSupabaseKey = message.includes("Invalid API key");

    return {
      sessions: [],
      error: isInvalidSupabaseKey
        ? "Не успяхме да заредим връзките за таблет. Провери дали SUPABASE_SERVICE_ROLE_KEY е от същия Supabase проект като NEXT_PUBLIC_SUPABASE_URL."
        : "Не успяхме да заредим връзките за таблет. Провери Supabase настройките и дали миграцията за kiosk_sessions е приложена.",
    };
  }
}

export default async function TabletPage() {
  const { user, restaurant } = await getCurrentOwnerState();

  if (!user || !restaurant) {
    redirect("/dashboard/onboarding");
  }

  const [{ sessions, error }, kioskSessionExists] = await Promise.all([
    loadTabletSessions(restaurant.id, user.id),
    hasKioskSession(restaurant.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-10 py-8 pb-20 max-md:px-6 max-md:py-7">
      <section className="max-w-[680px]">
        <p className="mb-3 mt-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
          Режим таблет
        </p>
        <h1 className="m-0 font-[var(--f-display)] text-[40px] font-normal leading-[1.02] text-[var(--ink)] max-md:text-[34px]">
          Таблет за {restaurant.name}
        </h1>
        <p className="m-0 mt-3 text-[16px] leading-[1.55] text-[var(--ink-2)]">
          Режимът за таблет е екранът, който стои при касата. Келнерът сканира
          бона или избира ястията ръчно, после клиентът оставя оценка за всяко
          ястие. Създай връзка за таблет, отвори я на устройството при касата и
          си готов за работа.
        </p>
      </section>

      <TabletSetupActions initialSessions={sessions} initialLoadError={error} />
      <div className="mt-6">
        <PwaInstallPrompt surface="tablet" show={kioskSessionExists} />
      </div>
    </div>
  );
}
