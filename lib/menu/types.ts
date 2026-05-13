export interface InitialMenuItem {
  id: string;
  name_bg: string;
  category: string | null;
  price: number | null;
  description_bg: string | null;
  sort_order: number;
}

export type MenuItemAlias = {
  id: string;
  alias: string;
  menu_item_id: string;
  confidence: "manual" | "ai_suggested";
  times_seen: number;
};

export interface MenuItemRow {
  id: string;
  persistedId?: string;
  name_bg: string;
  category: string;
  price: string;
  description_bg: string;
}

export type MenuItemField = "name_bg" | "category" | "price" | "description_bg";

export type MenuAliasTarget = {
  id: string;
  name_bg: string;
  category: string;
  price: string;
};

export type RowError = Partial<
  Record<"name_bg" | "category" | "price", string>
>;

export type ValidatedMenuItem = {
  persistedId?: string;
  name_bg: string;
  category: string | null;
  price: number | null;
  description_bg: string | null;
};

export type ValidationResult = {
  validItems: ValidatedMenuItem[];
  rowErrors: Record<string, RowError>;
  hasErrors: boolean;
};

export type CategoryGroup = {
  key: string;
  displayName: string;
  color: string;
  items: MenuItemRow[];
};

export type CategoryFilter = {
  key: string;
  displayName: string;
  color: string;
  count: number;
};
