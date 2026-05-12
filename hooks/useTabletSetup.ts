"use client";

import { useMemo, useState, useTransition } from "react";

import { isExpired } from "@/components/dashboard/tablet/TabletSessionList";
import type { KioskSession } from "@/lib/kiosk/session-types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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

export function useTabletSetup(initialSessions: KioskSession[]) {
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
        setMessage("Връзката е готова. Копирай я или я отвори на таблета.");
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
      setMessage("Връзката за таблет е копирана.");
    } catch {
      setMessage(
        "Не успяхме да копираме автоматично. Маркирай връзката и я копирай ръчно.",
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
          throw new Error("Не успяхме да отменим достъпа.");
        }

        setSessions((current) =>
          current.map((item) => (item.id === session.id ? session : item)),
        );
        setMessage("Достъпът е отменен.");
      })
      .catch((error) => {
        setMessage(
          error instanceof Error
            ? error.message
            : "Не успяхме да отменим достъпа.",
        );
      })
      .finally(() => setRevokingId(null));
  }

  return {
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
  };
}
