"use client";

import { TabletSessionList } from "@/components/dashboard/tablet/TabletSessionList";
import { useTabletSetup } from "@/hooks/useTabletSetup";
import type { KioskSession } from "@/lib/kiosk/session-types";

type TabletSetupActionsProps = {
  initialSessions: KioskSession[];
  initialLoadError?: string | null;
};

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

  return (
    <div className="grid gap-5">
      {initialLoadError ? (
        <div className="rounded-xl border border-[var(--accent)] bg-[var(--paper)] p-4 text-[14px] leading-[1.5] text-[var(--ink-2)]">
          {initialLoadError}
        </div>
      ) : null}

      <section className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-5">
        <h2 className="m-0 font-[var(--f-display)] text-[28px] font-normal leading-tight text-[var(--ink)]">
          Нова връзка за таблет
        </h2>
        <p className="mt-3 mb-4 text-[14px] leading-[1.55] text-[var(--ink-2)]">
          Връзката се показва само веднъж. След като я отвориш на таблета,
          устройството ще остане свързано, докато връзката е валидна.
        </p>

        <label className="grid gap-2 text-[13px] font-medium text-[var(--ink)]">
          Име на устройството
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Напр. Таблет на бара"
            className="min-h-11 rounded-lg border border-[var(--rule)] bg-[var(--bg)] px-3 text-[14px] outline-none focus:border-[var(--accent)]"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCreateSession}
            disabled={isCreating || isStarting}
            className="min-h-11 rounded-lg bg-[var(--accent)] px-4 text-[14px] font-semibold text-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Създаваме..." : "Създай връзка"}
          </button>
          <button
            type="button"
            onClick={handleStartThisDevice}
            disabled={isCreating || isStarting}
            className="min-h-11 rounded-lg border border-[var(--ink)] px-4 text-[14px] font-semibold text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStarting
              ? "Стартираме..."
              : "Стартирай режим таблет на това устройство"}
          </button>
        </div>

        <p className="mt-3 mb-0 text-[12px] leading-[1.5] text-[var(--ink-mute)]">
          При старт на това устройство ще излезеш от таблото в този браузър и ще
          бъдеш прехвърлен към режима за таблет.
        </p>

        {setupUrl ? (
          <div className="mt-4 rounded-lg border border-[var(--rule)] bg-[var(--bg)] p-3">
            <div className="break-all font-[var(--f-mono)] text-[12px] text-[var(--ink)]">
              {setupUrl}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopySetupUrl}
                className="rounded-md border border-[var(--rule)] px-3 py-2 text-[12px] font-medium text-[var(--ink)]"
              >
                Копирай
              </button>
              <button
                type="button"
                onClick={handleOpenSetupUrl}
                className="rounded-md border border-[var(--rule)] px-3 py-2 text-[12px] font-medium text-[var(--ink)]"
              >
                Отвори
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
        emptyText="Няма свързани устройства."
        sessions={activeSessions}
        revokingId={revokingId}
        onRevoke={handleRevokeSession}
      />

      <TabletSessionList
        title="История"
        emptyText="Няма отменени или изтекли връзки."
        sessions={inactiveSessions}
        revokingId={revokingId}
        onRevoke={handleRevokeSession}
      />
    </div>
  );
}
