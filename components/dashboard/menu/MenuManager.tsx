"use client";

import { MenuEmptyPanel } from "@/components/dashboard/menu/MenuEmptyPanel";
import { MenuReviewPanel } from "@/components/dashboard/menu/MenuReviewPanel";
import { MenuUploadingState } from "@/components/dashboard/menu/MenuUploadingState";
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
    return (
      <MenuEmptyPanel
        error={flow.error}
        onFileSelect={flow.handleFileSelect}
        onManualEntry={flow.handleManualEntry}
      />
    );
  }

  if (flow.mode === "uploading") {
    return <MenuUploadingState />;
  }

  return <MenuReviewPanel flow={flow} />;
}
