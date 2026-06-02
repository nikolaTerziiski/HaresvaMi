import Link from "next/link";

type FeedbackEmptyStateProps = {
  restaurantName: string;
};

function GhostBar({ name, pct }: { name: string; pct: number }) {
  return (
    <div className="flex items-center gap-3 border-t border-[var(--rule)] py-2.5 first:border-t-0">
      <span className="flex-1 text-[13px] text-[var(--ink-2)]">{name}</span>
      <span className="h-[7px] flex-[0_0_90px] overflow-hidden rounded bg-[var(--bg-2)]">
        <span
          className="block h-full rounded bg-[var(--good)]"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="w-9 text-right font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
        {pct}%
      </span>
    </div>
  );
}

export function FeedbackEmptyState({
  restaurantName: _restaurantName,
}: FeedbackEmptyStateProps) {
  return (
    <>
      {/* ── Hero ── */}
      <div className="relative mx-auto max-w-[980px] overflow-hidden rounded-2xl border border-[var(--rule)] bg-[var(--paper)] p-12 shadow-[0_30px_70px_-50px_rgba(26,21,18,0.35)] max-md:p-8">
        {/* Decorative accent glow top-right */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-[120px] -right-[120px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--accent)_14%,transparent),transparent_70%)]"
        />

        {/* Live pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--good)_30%,var(--rule))] bg-[color-mix(in_oklab,var(--good)_12%,var(--paper))] px-3 py-1.5 font-[var(--f-mono)] text-[10.5px] uppercase tracking-[0.08em] text-[var(--good)]">
          <span className="size-[7px] animate-pulse rounded-full bg-[var(--good)]" />
          Готови · слушаме за първия отзив
        </div>

        {/* Headline */}
        <h2 className="mb-3.5 mt-[22px] max-w-[600px] font-[var(--f-display)] text-[46px] font-normal leading-[1.04] tracking-[-0.02em] max-md:text-[34px]">
          Чакаме <em className="italic text-[var(--accent)]">първия отзив</em>{" "}
          от твой клиент.
        </h2>

        {/* Lede */}
        <p className="m-0 max-w-[540px] text-[16px] leading-[1.6] text-[var(--ink-2)]">
          Всичко е настроено. Щом келнер сканира бон и клиент оцени ястията на
          таблета, тук ще се появят оценките, любимите ястия и коментарите —
          автоматично.
        </p>

        {/* Flow strip */}
        <div className="mt-[30px] flex max-w-[640px] items-stretch overflow-hidden rounded-xl border border-[var(--rule)] bg-[var(--bg)] max-md:flex-col">
          {[
            { n: "1", label: "Келнерът сканира", sub: "касовия бон" },
            { n: "2", label: "Клиентът оценява", sub: "всяко ястие" },
            { n: "3", label: "Ти виждаш", sub: "резултатите тук" },
          ].map((step, i) => (
            <div
              key={step.n}
              className={`flex flex-1 items-center gap-3 px-[18px] py-3.5 border-[var(--rule)] max-md:border-r-0 max-md:border-b last:border-b-0 ${
                i < 2 ? "border-r max-md:border-r-0" : ""
              }`}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-[var(--rule)] bg-[var(--paper)] font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
                {step.n}
              </span>
              <span className="text-[12.5px] leading-[1.3] text-[var(--ink-2)]">
                <b className="block font-medium text-[var(--ink)]">
                  {step.label}
                </b>
                {step.sub}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-[30px]">
          <Link
            href="/dashboard/tablet"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-3 text-[14px] font-medium text-[var(--paper)] shadow-[0_10px_24px_-10px_rgba(194,77,44,0.55)] transition-colors hover:bg-[var(--plum)]"
          >
            Провери таблета
          </Link>
        </div>
      </div>

      {/* ── Ghost preview ── */}
      <div className="mt-10 mx-auto max-w-[980px]">
        {/* Label row */}
        <div className="mb-4 flex items-center gap-3 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
          <span>Преглед · така ще изглежда след първите отзиви</span>
          <span className="h-px flex-1 bg-[var(--rule)]" />
        </div>

        {/* Ghost container */}
        <div
          className="pointer-events-none opacity-50 saturate-50"
          style={{
            maskImage:
              "linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)",
          }}
        >
          {/* Fake stat cards */}
          <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
            <div className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-5">
              <div className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
                Завършени отзиви
              </div>
              <div className="mt-2.5 font-[var(--f-display)] text-[40px] leading-none">
                128
              </div>
              <div className="mt-1.5 text-[12px] text-[var(--ink-mute)]">
                Всички приключени сесии
              </div>
            </div>
            <div className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-5">
              <div className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
                Харесва ми
              </div>
              <div className="mt-2.5 font-[var(--f-display)] text-[40px] leading-none text-[var(--good)]">
                86%
              </div>
              <div className="mt-1.5 text-[12px] text-[var(--ink-mute)]">
                Положителна обща оценка
              </div>
            </div>
            <div className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-5">
              <div className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
                Не ми харесва
              </div>
              <div className="mt-2.5 font-[var(--f-display)] text-[40px] leading-none text-[var(--bad)]">
                14%
              </div>
              <div className="mt-1.5 text-[12px] text-[var(--ink-mute)]">
                Отрицателна обща оценка
              </div>
            </div>
          </div>

          {/* Fake 2-col panels */}
          <div className="mt-4 grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
            {/* Fake top 5 */}
            <div className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-5">
              <h4 className="m-0 mb-3 font-[var(--f-display)] text-[20px] font-normal">
                Топ 5 най-харесвани
              </h4>
              <GhostBar name="Сач Механата" pct={96} />
              <GhostBar name="Шопска салата" pct={91} />
              <GhostBar name="Кебапчета" pct={88} />
            </div>

            {/* Fake comments */}
            <div className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-5">
              <h4 className="m-0 mb-3 font-[var(--f-display)] text-[20px] font-normal">
                Последни коментари
              </h4>
              <div className="py-2.5 text-[13px] text-[var(--ink-2)]">
                Най-добрият сач в Пловдив
              </div>
              <div className="border-t border-[var(--rule)] py-2.5 text-[13px] text-[var(--ink-2)]">
                Таратора беше малко солен
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
