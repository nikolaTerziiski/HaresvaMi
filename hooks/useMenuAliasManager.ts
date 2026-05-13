"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type { MenuItemAlias } from "@/lib/menu/types";
import { saveManualReceiptAlias } from "@/lib/receipt-aliases/client-actions";
import type { ManualReceiptAliasFormValues } from "@/lib/receipt-aliases/manual-alias-form";

type UseMenuAliasManagerInput = {
  initialAliases: MenuItemAlias[];
};

export function useMenuAliasManager({
  initialAliases,
}: UseMenuAliasManagerInput) {
  const t = useTranslations("dashboard.menu.aliases");
  const [aliases, setAliases] = useState<MenuItemAlias[]>(initialAliases);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState("");
  const [isSavingAlias, setIsSavingAlias] = useState(false);
  const [aliasError, setAliasError] = useState<string | null>(null);

  const aliasesByMenuItem = useMemo(() => {
    const map = new Map<string, MenuItemAlias[]>();

    for (const alias of aliases) {
      const current = map.get(alias.menu_item_id) ?? [];
      current.push(alias);
      map.set(alias.menu_item_id, current);
    }

    for (const currentAliases of map.values()) {
      currentAliases.sort((left, right) =>
        left.alias.localeCompare(right.alias, "bg-BG"),
      );
    }

    return map;
  }, [aliases]);

  function openAliasDrawer(menuItemId?: string) {
    if (menuItemId) {
      setSelectedMenuItemId(menuItemId);
    }

    setAliasError(null);
    setIsDrawerOpen(true);
  }

  async function saveAlias(values: ManualReceiptAliasFormValues) {
    setIsSavingAlias(true);
    setAliasError(null);

    try {
      const savedAlias = await saveManualReceiptAlias({
        rawText: values.rawText,
        menuItemId: values.menuItemId,
        errorMessage: t("saveError"),
      });

      setAliases((currentAliases) => [
        ...currentAliases.filter((alias) => alias.alias !== savedAlias.alias),
        savedAlias,
      ]);
      setSelectedMenuItemId(savedAlias.menu_item_id);

      return true;
    } catch (error) {
      setAliasError(error instanceof Error ? error.message : t("saveError"));
      return false;
    } finally {
      setIsSavingAlias(false);
    }
  }

  return {
    aliases,
    aliasesByMenuItem,
    isDrawerOpen,
    selectedMenuItemId,
    isSavingAlias,
    aliasError,
    setIsDrawerOpen,
    setSelectedMenuItemId,
    openAliasDrawer,
    saveAlias,
  };
}

export type MenuAliasManager = ReturnType<typeof useMenuAliasManager>;
