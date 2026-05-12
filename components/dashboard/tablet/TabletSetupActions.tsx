"use client";

import { TabletSessionList } from "@/components/dashboard/tablet/TabletSessionList";
import { useTabletSetup } from "@/hooks/useTabletSetup";
import type { KioskSession } from "@/lib/kiosk/session-types";

type TabletSetupActionsProps = {
  initialSessions: KioskSession[];
  initialLoadError?: string | null;
};

type SetupStep = {
  number: string;
  title: string;
  description: string;
};

const SETUP_STEPS: SetupStep[] = [
  {
    number: "1",
    title: "Назови устройството",
    description: "Например “Таблет на бара”.",
  },
  {
    number: "2",
    title: "Създай връзка",
    description: "Връзката се показва само веднъж.",
  },
  {
    number: "3",
    title: "Отвори на таблета",
    description: "Копирай я или я отвори директно.",
  },
  {
    number: "4",
    title: "Таблетът е свързан",
    description: "Готов е за сканиране и оценки.",
  },
];

function SetupStepStrip({ currentStep }: { currentStep: number }) {
  return (
    <section className="mt-7 rounded-xl border border-[var(--rule)] bg-[var(--paper)]">
      <div className="grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {SETUP_STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isDone = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={step.title}
              className="border-r border-[var(--rule)] p-4 last:border-r-0 max-lg:border-r-0 max-lg:border-b max-lg:last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <span
                  className={[
                    "grid size-8 shrink-0 place-items-center rounded-full border font-[var(--f-mono)] text-[12px]",
                    isDone
                      ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                      : "",
                    isCurrent
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--paper)]"
                      : "",
                    !isDone && !isCurrent
                      ? "border-[var(--rule)] bg-[var(--bg)] text-[var(--ink-mute)]"
                      : "",
                  ].join(" ")}
                >
                  {isDone ? "✓" : step.number}
                </span>
                <div>
                  <h2 className="m-0 text-[14px] font-medium leading-tight text-[var(--ink)]">
                    {step.title}
                  </h2>
                  <p className="m-0 mt-1 text-[12px] leading-[1.4] text-[var(--ink-mute)]">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function TabletSetupActions({
  initialSessions,
  initialLoadError,
}: TabletSetupActionsProps) {
  const {
    activeSessions,
    inactiveSessions,
    label,
    setLabel,
    setupUrl,
    message,
    revokingId,
    isCreating,
    isStarting,
    handleCreateSession,
    handleStartThisDevice,
    handleCopySetupUrl,
    handleOpenSetupUrl,
    handleRevokeSession,
  } = useTabletSetup(initialSessions);

  const hasConnectedDevice = activeSessions.some((session) =>
    Boolean(session.last_used_at),
  );
  const currentStep = hasConnectedDevice
    ? 4
    : setupUrl
      ? 3
      : label.trim()
        ? 2
        : 1;
  const setupTitle = hasConnectedDevice
    ? "Добави друг таблет"
    : "Нова връзка за таблет";
  const setupDescription = hasConnectedDevice
    ? "Ако имаш още едно устройство при касата или на терасата, създай отделна връзка за него."
    : "Дай име на устройството, създай връзка и я отвори на таблета при касата. След това таблетът остава готов за оценки.";

  return (
    <div className="mt-7 grid gap-5">
      <SetupStepStrip currentStep={currentStep} />

      {initialLoadError ? (
        <div className="rounded-xl border border-[var(--accent)] bg-[var(--paper)] p-4 text-[14px] leading-[1.5] text-[var(--ink-2)]">
          {initialLoadError}
        </div>
      ) : null}

      <div className="grid grid-cols-[1.05fr_0.95fr] gap-5 max-[1050px]:grid-cols-1">
        <section className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-5">
          <h2 className="m-0 font-[var(--f-display)] text-[28px] font-normal leading-tight text-[var(--ink)]">
            {setupTitle}
          </h2>
          <p className="mt-2 mb-4 max-w-[560px] text-[14px] leading-[1.5] text-[var(--ink-2)]">
            {setupDescription}
          </p>

          <label className="grid gap-2 text-[13px] font-medium text-[var(--ink)]">
            Име на устройството
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Напр. Таблет на бара"
              className="min-h-11 rounded-lg border border-[var(--rule)] bg-[var(--bg)] px-3 text-[14px] outline-none transition-colors focus:border-[var(--accent)] focus:bg-[var(--paper)]"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCreateSession}
              disabled={isCreating || isStarting}
              className="min-h-11 rounded-lg bg-[var(--accent)] px-5 text-[14px] font-medium text-[var(--paper)] transition-colors hover:bg-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? "Създаваме..." : "Създай връзка за таблет"}
            </button>
            <button
              type="button"
              onClick={handleStartThisDevice}
              disabled={isCreating || isStarting}
              className="min-h-11 rounded-lg border border-[var(--ink)] px-5 text-[14px] font-medium text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isStarting ? "Стартираме..." : "Стартирай на това устройство"}
            </button>
          </div>

          <p className="mt-3 mb-0 max-w-[520px] text-[12px] leading-[1.45] text-[var(--ink-mute)]">
            Ако стартираш тук, този браузър ще се превърне в таблет за оценки.
            Таблото ще се отвори отново след нов вход.
          </p>

          {setupUrl ? (
            <div className="mt-5 rounded-lg border border-dashed border-[var(--rule)] bg-[var(--bg)] p-4">
              <div className="text-[12px] font-medium text-[var(--ink-2)]">
                Отвори тази връзка на таблета:
              </div>
              <div className="mt-2 break-all font-[var(--f-mono)] text-[12px] leading-[1.5] text-[var(--ink)]">
                {setupUrl}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopySetupUrl}
                  className="rounded-md border border-[var(--rule)] bg-[var(--paper)] px-3 py-2 text-[12px] font-medium text-[var(--ink)] transition-colors hover:border-[var(--ink)]"
                >
                  Копирай връзката
                </button>
                <button
                  type="button"
                  onClick={handleOpenSetupUrl}
                  className="rounded-md border border-[var(--rule)] bg-[var(--paper)] px-3 py-2 text-[12px] font-medium text-[var(--ink)] transition-colors hover:border-[var(--ink)]"
                >
                  Отвори връзката
                </button>
              </div>
            </div>
          ) : null}

          {message ? (
            <p className="mt-4 mb-0 text-[13px] leading-[1.5] text-[var(--ink-2)]">
              {message}
            </p>
          ) : null}
        </section>

        <TabletSessionList
          title="Свързани устройства"
          emptyText="Все още няма свързано устройство."
          sessions={activeSessions}
          revokingId={revokingId}
          onRevoke={handleRevokeSession}
          variant="active"
        />
      </div>

      <TabletSessionList
        title="История"
        emptyText="Няма отменени или изтекли връзки."
        sessions={inactiveSessions}
        revokingId={revokingId}
        onRevoke={handleRevokeSession}
        variant="history"
      />
    </div>
  );
}
