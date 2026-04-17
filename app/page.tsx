export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-12 px-6 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="inline-block rounded-full bg-coral-100 px-4 py-1 text-sm font-medium text-coral-700">
          Phase 0 · Scaffold
        </span>
        <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">
          Харесва ми
        </h1>
        <p className="max-w-md text-base text-ink-700">
          Обратна връзка за ресторанта — какво наистина харесват клиентите ти.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button className="rounded-md bg-coral-500 px-6 py-3 text-base font-medium text-cream-50 transition-colors hover:bg-coral-600">
          Сканирай бона
        </button>
        <button className="rounded-md bg-ink-100 px-6 py-3 text-base font-medium text-ink-900 transition-colors hover:bg-ink-300">
          Откажи
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2 rounded-lg border border-ink-100 p-4">
        {(["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"] as const).map(
          (shade) => (
            <div key={shade} className="flex flex-col items-center gap-1">
              <div
                className="h-10 w-10 rounded-md border border-ink-100"
                style={{ background: `var(--color-coral-${shade})` }}
              />
              <span className="text-xs text-ink-500">{shade}</span>
            </div>
          ),
        )}
      </div>
    </main>
  );
}
