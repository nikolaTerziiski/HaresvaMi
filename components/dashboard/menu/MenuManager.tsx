"use client";

import { MenuEmptyPanel } from "@/components/dashboard/menu/MenuEmptyPanel";
import { MenuManualStarter } from "@/components/dashboard/menu/MenuManualStarter";
import { MenuReviewPanel } from "@/components/dashboard/menu/MenuReviewPanel";
import { useMenuManagerFlow } from "@/hooks/useMenuManagerFlow";
import type { InitialMenuItem } from "@/lib/menu/types";

export type { InitialMenuItem, MenuItemRow } from "@/lib/menu/types";

interface MenuManagerProps {
  restaurantId: string;
  initialItems: InitialMenuItem[];
}

export function MenuManager({ restaurantId, initialItems }: MenuManagerProps) {
  const flow = useMenuManagerFlow({ restaurantId, initialItems });

  if (flow.mode === "empty") {
    return <MenuEmptyPanel onManualEntry={flow.handleManualEntry} />;
  }

  if (flow.mode === "manual_starter") {
    return (
      <MenuManualStarter
        onContinue={flow.handleManualStart}
        onBack={flow.handleManualBack}
      />
    );
  }

  return <MenuReviewPanel flow={flow} />;
}
