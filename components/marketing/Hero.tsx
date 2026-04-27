export default function Hero() {
  return (
    <section className="px-6 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20 lg:px-12">
      <div className="mx-auto grid max-w-[1100px] items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <p className="mb-6 font-medium text-sm text-ink-500">
            За ресторанти в България
          </p>

          <h1 className="font-bold tracking-tight text-4xl text-ink-900">
            Научи кое ядене{" "}
            <span className="border-b-[3px] border-coral-500 pb-1">
              харесват
            </span>{" "}
            най-много
          </h1>

          <p className="mt-6 max-w-lg leading-relaxed text-lg text-ink-700">
            След като клиентът плати, сервитьорът сканира бона с таблета. Гостът
            оценява всяко ядене поотделно — ти виждаш кое работи и кое не.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <a
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-md bg-coral-500 px-7 font-medium text-base text-cream-50 transition-colors hover:bg-coral-600"
            >
              Започни безплатно
            </a>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-md px-5 font-medium text-base text-ink-700 transition-colors hover:bg-cream-100 hover:text-ink-900"
            >
              Как работи
            </a>
          </div>

          <p className="mt-5 text-xs text-ink-500">
            14 дни безплатно · без карта · отмени по всяко време
          </p>
        </div>

        <ReceiptCard />
      </div>
    </section>
  );
}

function ReceiptCard() {
  const items: Array<{ name: string; score: string }> = [
    { name: "Шопска салата", score: "9.1" },
    { name: "Кебапче", score: "7.8" },
    { name: "Мусака", score: "8.4" },
    { name: "Баклава", score: "9.6" },
  ];

  return (
    <div className="mx-auto w-full max-w-sm rounded-lg border border-ink-100 bg-cream-50 p-7">
      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>Механа „Люляк"</span>
        <span>Днес</span>
      </div>

      <div className="my-5 border-t border-dashed border-ink-200" />

      <ul className="flex flex-col gap-3 tabular-nums">
        {items.map((item) => (
          <li key={item.name} className="flex items-baseline gap-2 text-base">
            <span className="text-ink-900">{item.name}</span>
            <span
              aria-hidden="true"
              className="flex-1 translate-y-[-4px] border-b border-dotted border-ink-300"
            />
            <span className="font-medium text-ink-900">{item.score}</span>
          </li>
        ))}
      </ul>

      <div className="my-5 border-t border-dashed border-ink-200" />

      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>12 оценки · 4 ястия</span>
        <span>Благодарим!</span>
      </div>
    </div>
  );
}
