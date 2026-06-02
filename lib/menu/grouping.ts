import {
  categoryColorFor,
  categoryKey,
  isBlankNewRow,
} from "@/lib/menu/format";
import { hasEnteredDishData } from "@/lib/menu/row-state";
import type {
  CategoryFilter,
  CategoryGroup,
  MenuItemRow,
} from "@/lib/menu/types";

function sortByCategoryName<
  T extends {
    displayName: string;
  },
>(left: T, right: T) {
  if (!left.displayName && right.displayName) return 1;
  if (left.displayName && !right.displayName) return -1;

  return left.displayName.localeCompare(right.displayName, "bg-BG");
}

export function buildCategoryFilters(items: MenuItemRow[]): CategoryFilter[] {
  const map = new Map<string, CategoryFilter>();

  for (const item of items) {
    if (isBlankNewRow(item)) continue;

    const name = item.category.trim();
    const key = categoryKey(name);
    const dishCount = hasEnteredDishData(item) ? 1 : 0;
    const existing = map.get(key);

    if (existing) {
      existing.count += dishCount;
    } else {
      map.set(key, {
        key,
        displayName: name,
        color: categoryColorFor(name),
        count: dishCount,
      });
    }
  }

  return Array.from(map.values()).sort(sortByCategoryName);
}

export function buildGroupedItems({
  items,
  searchQuery,
  selectedCategoryKeys,
}: {
  items: MenuItemRow[];
  searchQuery: string;
  selectedCategoryKeys: string[] | null;
}): CategoryGroup[] {
  const query = searchQuery.trim().toLocaleLowerCase("bg-BG");
  const filtered = items.filter((item) => {
    if (isBlankNewRow(item)) return false;

    const key = categoryKey(item.category);

    if (selectedCategoryKeys !== null && !selectedCategoryKeys.includes(key)) {
      return false;
    }

    if (!query) return true;

    return (
      item.name_bg.toLocaleLowerCase("bg-BG").includes(query) ||
      item.category.toLocaleLowerCase("bg-BG").includes(query)
    );
  });

  const groups = new Map<string, CategoryGroup>();

  for (const item of filtered) {
    const name = item.category.trim();
    const key = categoryKey(name);
    let group = groups.get(key);

    if (!group) {
      group = {
        key,
        displayName: name,
        color: categoryColorFor(name),
        items: [],
      };
      groups.set(key, group);
    }

    group.items.push(item);
  }

  return Array.from(groups.values()).sort(sortByCategoryName);
}
