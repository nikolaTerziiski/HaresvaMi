"use client";

import { MenuGroupCard } from "@/components/dashboard/menu/MenuGroupCard";
import { MenuNoItemsState } from "@/components/dashboard/menu/MenuNoItemsState";
import type {
  CategoryGroup,
  MenuItemField,
  ValidationResult,
} from "@/lib/menu/types";

type MenuGroupedItemsProps = {
  groupedItems: CategoryGroup[];
  isFiltering: boolean;
  validation: ValidationResult;
  categories: string[];
  onAddItemInCategory: (categoryName: string) => void;
  onAddCategory: () => void;
  onItemChange: (id: string, field: MenuItemField, value: string) => void;
  onRemoveItem: (id: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
};

export function MenuGroupedItems({
  groupedItems,
  isFiltering,
  validation,
  categories,
  onAddItemInCategory,
  onAddCategory,
  onItemChange,
  onRemoveItem,
  onRenameCategory,
}: MenuGroupedItemsProps) {
  return (
    <div className="mt-8 grid gap-6">
      {groupedItems.length === 0 ? (
        <MenuNoItemsState
          isFiltering={isFiltering}
          onAddItem={() => onAddItemInCategory("")}
        />
      ) : (
        groupedItems.map((group) => (
          <MenuGroupCard
            key={group.key || "__uncategorized"}
            group={group}
            validation={validation}
            categories={categories}
            onAddItemInCategory={onAddItemInCategory}
            onAddCategory={onAddCategory}
            onItemChange={onItemChange}
            onRemoveItem={onRemoveItem}
            onRenameCategory={onRenameCategory}
          />
        ))
      )}
    </div>
  );
}
