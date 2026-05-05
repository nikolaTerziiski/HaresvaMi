"use client";

import type { KioskSession } from "@/lib/kiosk/session-types";

type TabletSessionListProps = {
  title: string;
  emptyText: string;
  sessions: KioskSession[];
  revokingId: string | null;
  onRevoke: (sessionId: string) => void;
};

const dateFormatter = new Intl.DateTimeFormat("bg-BG", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Sofia",
});

export function isExpired(session: KioskSession) {
  return Date.parse(session.expires_at) <= Date.now();
}

function sessionStateLabel(session: KioskSession) {
  if (session.status === "revoked") return "Достъпът е отменен";
  if (isExpired(session)) return "Изтекла";
  return "Таблетът е свързан";
}

export function TabletSessionList({
  title,
  emptyText,
  sessions,
  revokingId,
  onRevoke,
}: TabletSessionListProps) {
  return (
    <section className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-5">
      <h2 className="m-0 font-[var(--f-display)] text-[26px] font-normal leading-tight text-[var(--ink)]">
        {title}
      </h2>

      {sessions.length === 0 ? (
        <p className="mt-4 mb-0 text-[14px] leading-[1.55] text-[var(--ink-2)]">
          {emptyText}
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          {sessions.map((session) => (
            <article
              key={session.id}
              className="rounded-lg border border-[var(--rule)] bg-[var(--bg)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[15px] font-semibold text-[var(--ink)]">
                    {session.label ?? "Таблет без име"}
                  </div>
                  <div className="mt-1 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.06em] text-[var(--ink-mute)]">
                    {sessionStateLabel(session)}
                  </div>
                </div>

                {session.status === "active" && !isExpired(session) ? (
                  <button
                    type="button"
                    onClick={() => onRevoke(session.id)}
                    disabled={revokingId === session.id}
                    className="rounded-md border border-[var(--rule)] px-3 py-2 text-[12px] font-medium text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {revokingId === session.id
                      ? "Отменяме достъпа..."
                      : "Отмени достъпа"}
                  </button>
                ) : null}
              </div>

              <dl className="mt-3 grid gap-1 text-[12px] text-[var(--ink-2)]">
                <div>
                  <dt className="inline text-[var(--ink-mute)]">
                    Създадена връзка:{" "}
                  </dt>
                  <dd className="inline">
                    {dateFormatter.format(new Date(session.created_at))}
                  </dd>
                </div>
                <div>
                  <dt className="inline text-[var(--ink-mute)]">
                    Валидна до:{" "}
                  </dt>
                  <dd className="inline">
                    {dateFormatter.format(new Date(session.expires_at))}
                  </dd>
                </div>
                <div>
                  <dt className="inline text-[var(--ink-mute)]">
                    Последно ползване:{" "}
                  </dt>
                  <dd className="inline">
                    {session.last_used_at
                      ? dateFormatter.format(new Date(session.last_used_at))
                      : "още няма"}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
