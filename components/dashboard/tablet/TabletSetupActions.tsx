"use client";

import { useMemo, useState, useTransition } from "react";

import {
  isExpired,
  TabletSessionList,
} from "@/components/dashboard/tablet/TabletSessionList";
import type { KioskSession } from "@/lib/kiosk/session-types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type TabletSetupActionsProps = {
  initialSessions: KioskSession[];
};

type CreateSessionResponse = {
  session: KioskSession;
  setupUrl: string;
};

function toAbsoluteSetupUrl(setupUrl: string) {
  return new URL(setupUrl, window.location.origin).toString();
}

async function parseSessionResponse(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as Partial<{
    error: string;
    message: string;
  }>;

  if (!response.ok) {
    throw new Error(
      payload.message ?? payload.error ?? "Не успяхме да изпълним действието.",
    );
  }

  return payload;
}

export function TabletSetupActions({
  initialSessions,
}: TabletSetupActionsProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [label, setLabel] = useState("");
  const [setupUrl, setSetupUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isCreating, startCreateTransition] = useTransition();
  const [isStarting, startTabletTransition] = useTransition();
  const [supabase] = useState(() => createSupabaseBrowserClient());

  const activeSessions = useMemo(
    () =>
      sessions.filter(
        (session) => session.status === "active" && !isExpired(session),
      ),
    [sessions],
  );
  const inactiveSessions = useMemo(
    () =>
      sessions.filter(
        (session) => session.status === "revoked" || isExpired(session),
      ),
    [sessions],
  );

  function rememberCreatedSession(payload: CreateSessionResponse) {
    setSessions((current) => [
      payload.session,
      ...current.filter((session) => session.id !== payload.session.id),
    ]);
    setSetupUrl(toAbsoluteSetupUrl(payload.setupUrl));
  }

  async function createSession(defaultLabel?: string) {
    const response = await fetch("/api/kiosk/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        label: defaultLabel ?? label,
      }),
    });
    const payload = (await parseSessionResponse(
      response,
    )) as Partial<CreateSessionResponse>;

    if (!payload.session || !payload.setupUrl) {
      throw new Error("Липсва връзка за настройка на таблета.");
    }

    rememberCreatedSession({
      session: payload.session,
      setupUrl: payload.setupUrl,
    });

    return payload.setupUrl;
  }

  function handleCreateSession() {
    startCreateTransition(async () => {
      setMessage(null);

      try {
        await createSession();
        setMessage("Връзката е създадена. Копирай я или я отвори на таблета.");
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Не успяхме да създадем връзка за таблет.",
        );
      }
    });
  }

  function handleStartThisDevice() {
    startTabletTransition(async () => {
      setMessage(null);

      try {
        const nextSetupUrl = await createSession("Този браузър");
        await supabase.auth.signOut();
        window.location.assign(toAbsoluteSetupUrl(nextSetupUrl));
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Не успяхме да стартираме режим таблет.",
        );
      }
    });
  }

  async function handleCopySetupUrl() {
    if (!setupUrl) return;

    try {
      await navigator.clipboard.writeText(setupUrl);
      setMessage("Връзката е копирана.");
    } catch {
      setMessage(
        "Не успяхме да копираме автоматично. Маркирай връзката ръчно.",
      );
    }
  }

  function handleOpenSetupUrl() {
    if (!setupUrl) return;

    window.open(setupUrl, "_blank", "noopener,noreferrer");
  }

  function handleRevokeSession(sessionId: string) {
    setRevokingId(sessionId);
    setMessage(null);

    fetch(`/api/kiosk/sessions/${sessionId}`, {
      method: "PATCH",
    })
      .then(parseSessionResponse)
      .then((payload) => {
        const session = (payload as { session?: KioskSession }).session;

        if (!session) {
          throw new Error("Не успяхме да отменим сесията.");
        }

        setSessions((current) =>
          current.map((item) => (item.id === session.id ? session : item)),
        );
        setMessage("Сесията е отменена.");
      })
      .catch((error) => {
        setMessage(
          error instanceof Error
            ? error.message
            : "Не успяхме да отменим сесията.",
        );
      })
      .finally(() => setRevokingId(null));
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-5">
        <h2 className="m-0 font-[var(--f-display)] text-[28px] font-normal leading-tight text-[var(--ink)]">
          Нова връзка за таблет
        </h2>
        <p className="mt-3 mb-4 text-[14px] leading-[1.55] text-[var(--ink-2)]">
          Връзката се показва само веднъж. След като я отвориш на таблета,
          устройството ще запомни защитена сесия чрез HttpOnly cookie.
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
          При старт на това устройство ще излезеш от dashboard сесията в този
          браузър и ще бъдеш прехвърлен към режима за таблет.
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
        title="Активни таблети"
        emptyText="Няма активни таблети."
        sessions={activeSessions}
        revokingId={revokingId}
        onRevoke={handleRevokeSession}
      />

      <TabletSessionList
        title="История"
        emptyText="Няма отменени или изтекли сесии."
        sessions={inactiveSessions}
        revokingId={revokingId}
        onRevoke={handleRevokeSession}
      />
    </div>
  );
}
