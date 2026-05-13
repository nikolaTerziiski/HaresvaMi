import { redirect } from "next/navigation";

import { MobileTopbar } from "@/components/dashboard/shell/MobileTopbar";
import { Sidebar } from "@/components/dashboard/shell/Sidebar";
import { Topbar } from "@/components/dashboard/shell/Topbar";
import { getDashboardHomeData } from "@/lib/dashboard/home";

export default async function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getDashboardHomeData();

  if (!data) {
    redirect("/dashboard/onboarding");
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar restaurantName={data.restaurant.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopbar
          restaurantName={data.restaurant.name}
          ownerFirstName={data.ownerFirstName}
        />
        <Topbar
          ownerFirstName={data.ownerFirstName}
          greetingKey={data.greetingKey}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
