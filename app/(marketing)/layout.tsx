import Logo from "@/components/shared/Logo";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream-50">
      <header className="sticky top-0 z-10 border-b border-ink-100 bg-cream-50">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-6 sm:px-8 lg:px-12">
          <a
            href="/"
            className="rounded-sm outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-coral-500"
            aria-label="HaresvaMi — начало"
          >
            <Logo />
          </a>

          <a
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md px-4 font-medium text-sm text-ink-700 transition-colors hover:bg-cream-100 hover:text-ink-900"
          >
            Вход
          </a>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
