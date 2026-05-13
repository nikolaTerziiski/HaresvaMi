import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentOwnerState, getOwnerDestination } from "@/lib/auth/owner";
import {
  KIOSK_SESSION_COOKIE,
  verifyKioskToken,
} from "@/lib/kiosk/session-token";

async function hasValidKioskSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(KIOSK_SESSION_COOKIE)?.value;

  if (!token) return false;

  try {
    const verification = await verifyKioskToken(token);

    return verification.valid;
  } catch (error) {
    console.error("Unable to verify kiosk session on landing:", error);
    return false;
  }
}

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await hasValidKioskSession()) {
    redirect("/kiosk/scan");
  }

  const { user, restaurant } = await getCurrentOwnerState();

  if (user) {
    redirect(getOwnerDestination(restaurant));
  }

  return <>{children}</>;
}
