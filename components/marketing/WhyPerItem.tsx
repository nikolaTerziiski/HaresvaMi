export default function WhyPerItem() {
  return (
    <section className="border-t border-ink-100 px-6 py-16 sm:px-8 sm:py-24 lg:px-12">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-12 max-w-2xl sm:mb-16">
          <p className="mb-4 font-medium text-sm text-ink-500">
            Защо оценка на всяко ядене
          </p>
          <h2 className="font-bold tracking-tight text-2xl text-ink-900">
            Защото „беше чудесно" не ти казва нищо за кебапчето
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <article className="flex flex-col rounded-lg border border-ink-100 bg-cream-100 p-8">
            <p className="font-medium text-sm text-ink-500">
              Обикновена обратна връзка
            </p>
            <p className="mt-4 font-bold text-lg text-ink-700">
              Как беше всичко?
            </p>
            <p
              aria-label="Четири от пет звезди"
              className="mt-4 tabular-nums text-2xl text-ink-500"
            >
              ★★★★☆
            </p>
            <p className="mt-8 leading-relaxed text-base text-ink-500">
              Не знаеш какво точно харесаха. Не знаеш какво да промениш.
            </p>
          </article>

          <article className="flex flex-col rounded-lg border border-coral-200 bg-cream-50 p-8">
            <p className="font-medium text-sm text-coral-700">С HaresvaMi</p>
            <p className="mt-4 font-bold text-lg text-ink-900">
              Как беше всяко ядене?
            </p>
            <ul className="mt-4 flex flex-col gap-2 tabular-nums">
              {[
                { name: "Шопска салата", score: "9/10" },
                { name: "Кебапче", score: "7/10" },
                { name: "Баклава", score: "10/10" },
              ].map((row) => (
                <li
                  key={row.name}
                  className="flex items-baseline gap-2 text-base"
                >
                  <span className="text-ink-900">{row.name}</span>
                  <span
                    aria-hidden="true"
                    className="flex-1 translate-y-[-4px] border-b border-dotted border-ink-300"
                  />
                  <span className="font-medium text-ink-900">{row.score}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 leading-relaxed text-base text-ink-700">
              Виждаш точно кое работи. Знаеш кое ястие да запазиш, кое да
              поправиш.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
