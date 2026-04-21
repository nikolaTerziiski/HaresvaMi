import Logo from "@/components/shared/Logo";

const links: Array<{ label: string; href: string }> = [
  { label: "Условия", href: "#" },
  { label: "Поверителност", href: "#" },
  { label: "Контакт", href: "#" },
];

export default function MarketingFooter() {
  return (
    <footer className="border-t border-ink-100 px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <Logo />
            <p className="text-sm text-ink-500">
              Обратна връзка за ресторанта, на всяко ядене.
            </p>
          </div>

          <nav className="flex flex-wrap gap-6">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-medium text-sm text-ink-700 transition-colors hover:text-ink-900"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t border-ink-100 pt-6 text-xs text-ink-500">
          © 2026 HaresvaMi · Made in Bulgaria
        </div>
      </div>
    </footer>
  );
}
