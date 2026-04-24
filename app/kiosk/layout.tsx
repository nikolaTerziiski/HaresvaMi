export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="min-h-dvh bg-[var(--bg)]">{children}</main>;
}
