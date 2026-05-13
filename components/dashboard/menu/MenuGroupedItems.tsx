"use client";

import { MenuGroupCard } from "@/components/dashboard/menu/MenuGroupCard";
import { MenuNoItemsState } from "@/components/dashboard/menu/MenuNoItemsState";
import type {
  CategoryGroup,
  MenuItemAlias,
  MenuItemField,
  ValidationResult,
} from "@/lib/menu/types";

type MenuGroupedItemsProps = {
  groupedItems: CategoryGroup[];
  isFiltering: boolean;
  validation: ValidationResult;
  aliasesByMenuItem: Map<string, MenuItemAlias[]>;
  onAddItemInCategory: (categoryName: string) => void;
  onItemChange: (id: string, field: MenuItemField, value: string) => void;
  onRemoveItem: (id: string) => void;
  onAddAliasClick: (menuItemId?: string) => void;
};

export function MenuGroupedItems({
  groupedItems,
  isFiltering,
  validation,
  aliasesByMenuItem,
  onAddItemInCategory,
  onItemChange,
  onRemoveItem,
  onAddAliasClick,
}: MenuGroupedItemsProps) {
  return (
    <div className="px-9 pt-5 max-md:px-5">
      {groupedItems.length === 0 ? (
        <MenuNoItemsState
          isFiltering={isFiltering}
          onAddItem={() => onAddItemInCategory("")}
        />
      ) : (
        <div className="space-y-6">
          {groupedItems.map((group) => (
            <MenuGroupCard
              key={group.key || "__uncategorized"}
              group={group}
              validation={validation}
              aliasesByMenuItem={aliasesByMenuItem}
              onAddItemInCategory={onAddItemInCategory}
              onItemChange={onItemChange}
              onRemoveItem={onRemoveItem}
              onAddAliasClick={onAddAliasClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
