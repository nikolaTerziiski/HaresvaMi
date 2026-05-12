import { redirect } from "next/navigation";

import { TabletSetupActions } from "@/components/dashboard/tablet/TabletSetupActions";
import { getCurrentOwnerState } from "@/lib/auth/owner";
import { listKioskSessions } from "@/lib/kiosk/session-token";

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

  const { sessions, error } = await loadTabletSessions(restaurant.id, user.id);

  return (
    <div className="mx-auto max-w-6xl px-10 py-10 pb-20 max-md:px-6 max-md:py-8">
      <section className="max-w-[680px]">
        <p className="mb-3 mt-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
          Режим таблет
        </p>
        <h1 className="m-0 font-[var(--f-display)] text-[44px] font-normal leading-[1.02] text-[var(--ink)] max-md:text-[34px]">
          Таблет за {restaurant.name}
        </h1>
        <p className="m-0 mt-4 text-[16px] leading-[1.6] text-[var(--ink-2)]">
          Режимът за таблет е екранът, който стои при касата. Келнерът сканира
          бона или избира ястията ръчно, после клиентът оставя оценка за всяко
          ястие. Всяко свързано устройство има отделна връзка и достъпът му може
          да бъде отменен по всяко време.
        </p>
      </section>

      <div className="mt-8 grid grid-cols-[0.95fr_1.05fr] gap-5 max-[1050px]:grid-cols-1">
        <aside className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-5">
          <h2 className="m-0 font-[var(--f-display)] text-[28px] font-normal leading-tight text-[var(--ink)]">
            Как се настройва
          </h2>
          <ol className="mt-4 grid gap-3 pl-5 text-[14px] leading-[1.55] text-[var(--ink-2)]">
            <li>Създай връзка за таблет.</li>
            <li>Отвори връзката на устройството, което ще стои при касата.</li>
            <li>
              Таблетът е свързан и готов за работа. Връзката е валидна за
              ограничено време.
            </li>
          </ol>
          <p className="mb-0 mt-4 text-[13px] leading-[1.55] text-[var(--ink-mute)]">
            QR код ще добавим по-късно. Засега връзката може да се копира или
            отвори директно.
          </p>
        </aside>

        <TabletSetupActions
          initialSessions={sessions}
          initialLoadError={error}
        />
      </div>
    </div>
  );
}
