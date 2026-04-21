import { redirect } from "next/navigation";

import { getCurrentOwnerState, getOwnerDestination } from "@/lib/auth/owner";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, restaurant } = await getCurrentOwnerState();

  if (user) {
    redirect(getOwnerDestination(restaurant));
  }

  return <>{children}</>;
}
