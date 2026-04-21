export default function PricingTeaser() {
  return (
    <section className="border-t border-ink-100 px-6 py-16 sm:px-8 sm:py-24 lg:px-12">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex flex-col items-start gap-8 rounded-lg border border-ink-100 bg-cream-100 p-8 sm:p-12 md:flex-row md:items-center md:justify-between md:gap-12">
          <div className="max-w-xl">
            <p className="mb-4 font-medium text-sm text-ink-500">Цена</p>
            <p className="font-bold tracking-tight text-2xl text-ink-900 sm:text-3xl">
              14 дни безплатно. След това 10 €/месец.
            </p>
            <p className="mt-4 leading-relaxed text-base text-ink-700">
              Без обвързване. Спри когато искаш. Един ресторант, неограничени
              отзиви.
            </p>
          </div>

          <a
            href="/register"
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-md bg-coral-500 px-7 font-medium text-base text-cream-50 transition-colors hover:bg-coral-600"
          >
            Започни безплатно
          </a>
        </div>
      </div>
    </section>
  );
}
