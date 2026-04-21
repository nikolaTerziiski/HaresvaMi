import { redirect } from "next/navigation";

import { getCurrentOwnerState } from "@/lib/auth/owner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getCurrentOwnerState();

  if (!user) {
    redirect("/login");
  }

  return <div className="min-h-dvh bg-[var(--bg)] text-[var(--ink)]">{children}</div>;
}
