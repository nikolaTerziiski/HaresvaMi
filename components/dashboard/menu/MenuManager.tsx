"use client";

import { MenuEmptyPanel } from "@/components/dashboard/menu/MenuEmptyPanel";
import { MenuReviewPanel } from "@/components/dashboard/menu/MenuReviewPanel";
import { MenuUploadingState } from "@/components/dashboard/menu/MenuUploadingState";
import { useMenuAliasManager } from "@/hooks/useMenuAliasManager";
import { useMenuManagerFlow } from "@/hooks/useMenuManagerFlow";
import type { InitialMenuItem, MenuItemAlias } from "@/lib/menu/types";

export type {
  InitialMenuItem,
  MenuItemAlias,
  MenuItemRow,
} from "@/lib/menu/types";

interface MenuManagerProps {
  restaurantId: string;
  initialItems: InitialMenuItem[];
  initialAliases: MenuItemAlias[];
}

export function MenuManager({
  restaurantId,
  initialItems,
  initialAliases,
}: MenuManagerProps) {
  const flow = useMenuManagerFlow({ restaurantId, initialItems });
  const aliasFlow = useMenuAliasManager({ initialAliases });

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

  return <MenuReviewPanel flow={flow} aliasFlow={aliasFlow} />;
}
