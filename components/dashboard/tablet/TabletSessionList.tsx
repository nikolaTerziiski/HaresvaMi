"use client";

import type { KioskSession } from "@/lib/kiosk/session-types";

type TabletSessionListProps = {
  title: string;
  emptyText: string;
  sessions: KioskSession[];
  revokingId: string | null;
  onRevoke: (sessionId: string) => void;
  variant?: "active" | "history";
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
  if (!session.last_used_at) return "Чака отваряне";
  return "Таблетът е свързан";
}

function sessionStatusClass(session: KioskSession) {
  if (
    session.status === "active" &&
    !isExpired(session) &&
    session.last_used_at
  ) {
    return "text-[var(--good)]";
  }

  return "text-[var(--ink-mute)]";
}

export function TabletSessionList({
  title,
  emptyText,
  sessions,
  revokingId,
  onRevoke,
  variant = "active",
}: TabletSessionListProps) {
  const isHistory = variant === "history";

  return (
    <section className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="m-0 font-[var(--f-display)] text-[26px] font-normal leading-tight text-[var(--ink)]">
          {title}
        </h2>
        {sessions.length > 0 ? (
          <span className="rounded-full border border-[var(--rule)] px-2 py-1 font-[var(--f-mono)] text-[10px] text-[var(--ink-mute)]">
            {sessions.length} {sessions.length === 1 ? "запис" : "записа"}
          </span>
        ) : null}
      </div>

      {sessions.length === 0 ? (
        <p className="mt-4 mb-0 text-[14px] leading-[1.55] text-[var(--ink-2)]">
          {emptyText}
        </p>
      ) : (
        <div
          className={
            isHistory ? "mt-3 divide-y divide-[var(--rule)]" : "mt-4 grid gap-3"
          }
        >
          {sessions.map((session) => (
            <article
              key={session.id}
              className={
                isHistory
                  ? "grid gap-3 py-4 text-[13px] text-[var(--ink-2)] sm:grid-cols-[1fr_auto]"
                  : "rounded-lg border border-[var(--rule)] bg-[var(--bg)] p-4"
              }
            >
              <div
                className={
                  isHistory
                    ? "min-w-0"
                    : "flex flex-wrap items-start justify-between gap-3"
                }
              >
                <div className={isHistory ? "" : "flex min-w-0 gap-4"}>
                  {!isHistory ? (
                    <div
                      aria-hidden="true"
                      className="mt-1 grid h-14 w-10 shrink-0 place-items-end rounded-md border border-[var(--ink)] pb-1"
                    >
                      <span className="size-1 rounded-full bg-[var(--ink)]" />
                    </div>
                  ) : null}

                  <div className="min-w-0">
                    <div className="text-[15px] font-medium text-[var(--ink)]">
                      {session.label ?? "Таблет без име"}
                    </div>
                    <div
                      className={[
                        "mt-1 flex items-center gap-2 text-[12px] font-medium",
                        sessionStatusClass(session),
                      ].join(" ")}
                    >
                      {session.status === "active" &&
                      !isExpired(session) &&
                      session.last_used_at ? (
                        <span className="size-1.5 rounded-full bg-[var(--good)]" />
                      ) : null}
                      {sessionStateLabel(session)}
                    </div>
                  </div>
                </div>

                {!isHistory &&
                session.status === "active" &&
                !isExpired(session) ? (
                  <button
                    type="button"
                    onClick={() => onRevoke(session.id)}
                    disabled={revokingId === session.id}
                    className="rounded-md border border-[var(--rule)] bg-[var(--paper)] px-3 py-2 text-[12px] font-medium text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {revokingId === session.id
                      ? "Отменяме достъпа..."
                      : "Отмени достъпа"}
                  </button>
                ) : null}
              </div>

              <dl
                className={
                  isHistory
                    ? "grid gap-1 text-[12px] text-[var(--ink-2)] sm:text-right"
                    : "mt-4 grid gap-3 text-[12px] text-[var(--ink-2)] sm:grid-cols-3"
                }
              >
                <div>
                  <dt
                    className={
                      isHistory
                        ? "inline text-[var(--ink-mute)]"
                        : "block font-[var(--f-mono)] text-[10px] text-[var(--ink-mute)]"
                    }
                  >
                    Създадена{isHistory ? ": " : ""}
                  </dt>
                  <dd className={isHistory ? "inline" : "mt-1"}>
                    {dateFormatter.format(new Date(session.created_at))}
                  </dd>
                </div>
                <div>
                  <dt
                    className={
                      isHistory
                        ? "inline text-[var(--ink-mute)]"
                        : "block font-[var(--f-mono)] text-[10px] text-[var(--ink-mute)]"
                    }
                  >
                    Валидна до{isHistory ? ": " : ""}
                  </dt>
                  <dd className={isHistory ? "inline" : "mt-1"}>
                    {dateFormatter.format(new Date(session.expires_at))}
                  </dd>
                </div>
                <div>
                  <dt
                    className={
                      isHistory
                        ? "inline text-[var(--ink-mute)]"
                        : "block font-[var(--f-mono)] text-[10px] text-[var(--ink-mute)]"
                    }
                  >
                    Последно ползване{isHistory ? ": " : ""}
                  </dt>
                  <dd className={isHistory ? "inline" : "mt-1"}>
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
