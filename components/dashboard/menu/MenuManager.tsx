"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Plus, RotateCcw, Search, Trash2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MenuEmptyState } from "./MenuEmptyState";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const MIN_MENU_ITEMS_FOR_NEXT_STEP = 5;
const MAX_MENU_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const CATEGORY_COLORS = [
  "#7A9B5A",
  "#C24D2C",
  "#D98F3E",
  "#5B2A2A",
  "#B88FA0",
  "#3F6B4E",
  "#8A7A68",
  "#E89A3C",
];

export interface InitialMenuItem {
  id: string;
  name_bg: string;
  category: string | null;
  price: number | null;
  description_bg: string | null;
  sort_order: number;
}

export interface MenuItemRow {
  id: string;
  persistedId?: string;
  name_bg: string;
  category: string;
  price: string;
  description_bg: string;
}

type RowError = Partial<Record<"name_bg" | "category" | "price", string>>;

type ValidatedMenuItem = {
  persistedId?: string;
  name_bg: string;
  category: string | null;
  price: number | null;
  description_bg: string | null;
};

type ValidationResult = {
  validItems: ValidatedMenuItem[];
  rowErrors: Record<string, RowError>;
  hasErrors: boolean;
};

type CategoryGroup = {
  key: string;
  displayName: string;
  color: string;
  items: MenuItemRow[];
};

interface MenuManagerProps {
  restaurantId: string;
  initialItems: InitialMenuItem[];
}

function createEmptyRow(category = ""): MenuItemRow {
  return {
    id: crypto.randomUUID(),
    name_bg: "",
    category,
    price: "",
    description_bg: "",
  };
}

function formatPrice(price: number | null) {
  if (price === null) {
    return "";
  }

  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}

function createRowsFromInitialItems(items: InitialMenuItem[]): MenuItemRow[] {
  return items.map((item) => ({
    id: item.id,
    persistedId: item.id,
    name_bg: item.name_bg,
    category: item.category ?? "",
    price: formatPrice(item.price),
    description_bg: item.description_bg ?? "",
  }));
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function parsePrice(value: string): { value: number | null; valid: boolean } {
  const trimmed = value.trim();

  if (!trimmed) {
    return { value: null, valid: true };
  }

  const normalized = trimmed
    .replace(/\s/g, "")
    .replace(/лв\.?$/i, "")
    .replace(",", ".");

  if (!/^\d{1,6}(\.\d{1,2})?$/.test(normalized)) {
    return { value: null, valid: false };
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 999999.99) {
    return { value: null, valid: false };
  }

  return { value: Math.round(parsed * 100) / 100, valid: true };
}

function isBlankNewRow(row: MenuItemRow) {
  return (
    !row.persistedId &&
    !row.name_bg.trim() &&
    !row.category.trim() &&
    !row.price.trim() &&
    !row.description_bg.trim()
  );
}

function validateRows(
  rows: MenuItemRow[],
  messages: {
    nameRequired: string;
    invalidPrice: string;
    duplicateName: string;
  },
): ValidationResult {
  const rowErrors: Record<string, RowError> = {};
  const validItems: ValidatedMenuItem[] = [];
  const seenNames = new Map<string, string>();

  for (const row of rows) {
    if (isBlankNewRow(row)) {
      continue;
    }

    const name = normalizeText(row.name_bg);
    const category = normalizeText(row.category);
    const description = normalizeText(row.description_bg);
    const parsedPrice = parsePrice(row.price);
    const errors: RowError = {};

    if (!name) {
      errors.name_bg = messages.nameRequired;
    }

    if (!parsedPrice.valid) {
      errors.price = messages.invalidPrice;
    }

    if (name) {
      const normalizedName = name.toLocaleLowerCase("bg-BG");
      const firstRowId = seenNames.get(normalizedName);

      if (firstRowId) {
        errors.name_bg = messages.duplicateName;
        rowErrors[firstRowId] = {
          ...rowErrors[firstRowId],
          name_bg: messages.duplicateName,
        };
      } else {
        seenNames.set(normalizedName, row.id);
      }
    }

    if (Object.keys(errors).length > 0) {
      rowErrors[row.id] = { ...rowErrors[row.id], ...errors };
      continue;
    }

    validItems.push({
      persistedId: row.persistedId,
      name_bg: name,
      category: category || null,
      price: parsedPrice.value,
      description_bg: description || null,
    });
  }

  return {
    validItems,
    rowErrors,
    hasErrors: Object.keys(rowErrors).length > 0,
  };
}

function categoryKey(name: string): string {
  return name.trim().toLocaleLowerCase("bg-BG");
}

function categoryColorFor(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "#8A7A68";
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) | 0;
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

function rowsDifferFromInitial(
  items: MenuItemRow[],
  initial: InitialMenuItem[],
): boolean {
  const initialById = new Map(initial.map((i) => [i.id, i]));
  let seenPersisted = 0;
  for (const row of items) {
    if (!row.persistedId) {
      if (!isBlankNewRow(row)) return true;
      continue;
    }
    seenPersisted++;
    const init = initialById.get(row.persistedId);
    if (!init) return true;
    if (row.name_bg !== init.name_bg) return true;
    if ((row.category || null) !== init.category) return true;
    if (row.price !== formatPrice(init.price)) return true;
    if ((row.description_bg || null) !== init.description_bg) return true;
  }
  if (seenPersisted !== initial.length) return true;
  return false;
}

function chipClass(active: boolean) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition";
  if (active) {
    return `${base} border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]`;
  }
  return `${base} border-[var(--rule)] bg-[var(--paper)] text-[var(--ink-2)] hover:border-[var(--ink-mute)] hover:text-[var(--ink)]`;
}

export function MenuManager({ restaurantId, initialItems }: MenuManagerProps) {
  const router = useRouter();
  const t = useTranslations("dashboard.menu");
  const commonActions = useTranslations("common.actions");

  const [mode, setMode] = useState<"empty" | "uploading" | "review">(
    initialItems.length === 0 ? "empty" : "review",
  );
  const [items, setItems] = useState<MenuItemRow[]>(() =>
    createRowsFromInitialItems(initialItems),
  );
  const [removedExistingIds, setRemovedExistingIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmStartOverOpen, setConfirmStartOverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(
    null,
  );

  const validationMessages = useMemo(
    () => ({
      nameRequired: t("errors.nameRequired"),
      invalidPrice: t("errors.invalidPrice"),
      duplicateName: t("errors.duplicateName"),
    }),
    [t],
  );

  const validation = useMemo(
    () => validateRows(items, validationMessages),
    [items, validationMessages],
  );

  const canSave =
    !isSaving &&
    !validation.hasErrors &&
    validation.validItems.length >= MIN_MENU_ITEMS_FOR_NEXT_STEP;

  const hasUnsavedChanges = useMemo(
    () =>
      removedExistingIds.length > 0 ||
      rowsDifferFromInitial(items, initialItems),
    [items, removedExistingIds, initialItems],
  );

  const totalItems = useMemo(
    () => items.filter((item) => !isBlankNewRow(item)).length,
    [items],
  );

  const allCategories = useMemo(() => {
    const map = new Map<
      string,
      { key: string; displayName: string; color: string; count: number }
    >();
    for (const item of items) {
      if (isBlankNewRow(item)) continue;
      const name = item.category.trim();
      const key = categoryKey(name);
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          key,
          displayName: name,
          color: categoryColorFor(name),
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (!a.displayName && b.displayName) return 1;
      if (a.displayName && !b.displayName) return -1;
      return a.displayName.localeCompare(b.displayName, "bg-BG");
    });
  }, [items]);

  const groupedItems = useMemo<CategoryGroup[]>(() => {
    const query = searchQuery.trim().toLocaleLowerCase("bg-BG");
    const filtered = items.filter((item) => {
      const key = categoryKey(item.category);
      if (selectedCategoryKey !== null && key !== selectedCategoryKey) {
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
    return Array.from(groups.values()).sort((a, b) => {
      if (!a.displayName && b.displayName) return 1;
      if (a.displayName && !b.displayName) return -1;
      return a.displayName.localeCompare(b.displayName, "bg-BG");
    });
  }, [items, searchQuery, selectedCategoryKey]);

  const isFiltering =
    searchQuery.trim().length > 0 || selectedCategoryKey !== null;

  const handleFileSelect = async (file: File) => {
    if (file.size > MAX_MENU_FILE_SIZE_BYTES) {
      setError(t("errors.fileTooLarge"));
      return;
    }

    setMode("uploading");
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/extract-menu", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || t("errors.upload"));
      }

      const newItems: MenuItemRow[] = (data.items || [])
        .map((item: Partial<InitialMenuItem>) => ({
          id: crypto.randomUUID(),
          name_bg: item.name_bg || "",
          category: item.category || "",
          price: typeof item.price === "number" ? formatPrice(item.price) : "",
          description_bg: item.description_bg || "",
        }))
        .filter((item: MenuItemRow) => item.name_bg.trim().length > 0);

      if (newItems.length === 0) {
        throw new Error(t("errors.emptyExtraction"));
      }

      setItems(newItems);
      setMode("review");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : t("errors.upload"));
      setMode("empty");
    }
  };

  const handleManualEntry = () => {
    setItems([
      createEmptyRow(),
      createEmptyRow(),
      createEmptyRow(),
      createEmptyRow(),
      createEmptyRow(),
    ]);
    setMode("review");
  };

  const handleStartOver = () => {
    setRemovedExistingIds((currentIds) => {
      const idsToRemove = items
        .map((item) => item.persistedId)
        .filter((id): id is string => Boolean(id));
      return Array.from(new Set([...currentIds, ...idsToRemove]));
    });
    setItems([]);
    setError(null);
    setSearchQuery("");
    setSelectedCategoryKey(null);
    setMode("empty");
    setConfirmStartOverOpen(false);
  };

  const handleUndo = () => {
    setItems(createRowsFromInitialItems(initialItems));
    setRemovedExistingIds([]);
    setError(null);
  };

  const handleItemChange = (
    id: string,
    field: keyof Pick<
      MenuItemRow,
      "name_bg" | "category" | "price" | "description_bg"
    >,
    value: string,
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleAddItemInCategory = (categoryName: string) => {
    setItems((currentItems) => [...currentItems, createEmptyRow(categoryName)]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((currentItems) => {
      const removedItem = currentItems.find((item) => item.id === id);

      if (removedItem?.persistedId) {
        setRemovedExistingIds((currentIds) =>
          currentIds.includes(removedItem.persistedId!)
            ? currentIds
            : [...currentIds, removedItem.persistedId!],
        );
      }

      return currentItems.filter((item) => item.id !== id);
    });
  };

  const handleSave = async () => {
    const currentValidation = validateRows(items, validationMessages);

    if (currentValidation.hasErrors) {
      setError(t("errors.fixBeforeSave"));
      return;
    }

    if (currentValidation.validItems.length < MIN_MENU_ITEMS_FOR_NEXT_STEP) {
      setError(
        t("errors.needMoreItems", {
          count: MIN_MENU_ITEMS_FOR_NEXT_STEP,
        }),
      );
      return;
    }

    setIsSaving(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();

    try {
      const rowsWithIndex = currentValidation.validItems.map((item, index) => ({
        item,
        index,
      }));
      const existingRows = rowsWithIndex.filter(({ item }) => item.persistedId);
      const newRows = rowsWithIndex.filter(({ item }) => !item.persistedId);
      const uniqueRemovedIds = [...new Set(removedExistingIds)];

      if (uniqueRemovedIds.length > 0) {
        const { error: removeError } = await supabase
          .from("menu_items")
          .update({
            is_active: false,
            deleted_at: new Date().toISOString(),
          })
          .eq("restaurant_id", restaurantId)
          .in("id", uniqueRemovedIds);

        if (removeError) {
          throw removeError;
        }
      }

      for (const { item, index } of existingRows) {
        const { error: updateError } = await supabase
          .from("menu_items")
          .update({
            name_bg: item.name_bg,
            category: item.category,
            price: item.price,
            description_bg: item.description_bg,
            sort_order: index,
            is_active: true,
            deleted_at: null,
          })
          .eq("restaurant_id", restaurantId)
          .eq("id", item.persistedId!);

        if (updateError) {
          throw updateError;
        }
      }

      if (newRows.length > 0) {
        const { error: insertError } = await supabase.from("menu_items").insert(
          newRows.map(({ item, index }) => ({
            restaurant_id: restaurantId,
            name_bg: item.name_bg,
            category: item.category,
            price: item.price,
            description_bg: item.description_bg,
            sort_order: index,
            is_active: true,
          })),
        );

        if (insertError) {
          throw insertError;
        }
      }

      router.push("/dashboard");
    } catch (saveError) {
      console.error(saveError);
      setError(t("errors.save"));
      setIsSaving(false);
    }
  };

  if (mode === "empty") {
    return (
      <div className="w-full">
        {error ? (
          <div className="mx-auto mt-8 max-w-3xl rounded-lg border border-[color-mix(in_oklab,var(--bad)_20%,transparent)] bg-[color-mix(in_oklab,var(--bad)_7%,var(--paper))] px-4 py-3 text-sm text-[var(--bad)]">
            {error}
          </div>
        ) : null}
        <MenuEmptyState
          onFileSelect={handleFileSelect}
          onManualEntry={handleManualEntry}
        />
      </div>
    );
  }

  if (mode === "uploading") {
    return (
      <div className="flex min-h-[520px] w-full flex-col items-center justify-center px-6 text-center">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-[var(--accent)]" />
        <h2 className="text-xl font-medium text-[var(--ink)]">
          {t("uploading")}
        </h2>
      </div>
    );
  }

  return (
    <div className="w-full pb-[120px]">
      <section className="grid items-end gap-10 border-b border-[var(--rule-soft,var(--rule))] px-9 pt-9 pb-6 md:grid-cols-[1fr_auto] max-md:px-5">
        <div>
          <span className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
            {t("reviewStepper")}
          </span>
          <h1 className="mt-2 font-[var(--f-display)] text-[44px] font-normal leading-[1.02] tracking-[-0.02em] text-[var(--ink)] max-md:text-[32px]">
            {t.rich("reviewTitle", {
              em: (chunks) => (
                <em className="italic text-[var(--accent)]">{chunks}</em>
              ),
            })}
          </h1>
          <p className="mt-2 max-w-[560px] text-[15px] leading-[1.55] text-[var(--ink-2)]">
            {t("reviewDesc")}
          </p>
        </div>
        <div className="flex items-end gap-7 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
          <div>
            <span className="block font-[var(--f-display)] text-[40px] italic leading-[0.9] tracking-[-0.02em] text-[var(--ink)]">
              {totalItems}
            </span>
            {t("statProducts")}
          </div>
          <div>
            <span className="block font-[var(--f-display)] text-[40px] italic leading-[0.9] tracking-[-0.02em] text-[var(--ink)]">
              {allCategories.length}
            </span>
            {t("statCategories")}
          </div>
        </div>
      </section>

      {error ? (
        <div className="mx-9 mt-5 rounded-lg border border-[color-mix(in_oklab,var(--bad)_20%,transparent)] bg-[color-mix(in_oklab,var(--bad)_7%,var(--paper))] px-4 py-3 text-sm text-[var(--bad)] max-md:mx-5">
          {error}
        </div>
      ) : null}

      <div className="sticky top-[56px] z-30 border-b border-[var(--rule)] bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] px-9 py-2.5 backdrop-blur-sm max-md:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex w-[280px] items-center gap-2 rounded-lg border border-[var(--rule)] bg-[var(--paper)] px-3 py-1.5 text-[var(--ink-mute)] max-md:w-full">
            <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
            />
          </div>

          <div className="ml-1 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryKey(null)}
              className={chipClass(selectedCategoryKey === null)}
            >
              {t("chipAll")}
              <span className="font-[var(--f-mono)] text-[10px] opacity-70">
                {totalItems}
              </span>
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat.key || "__uncategorized"}
                type="button"
                onClick={() => setSelectedCategoryKey(cat.key)}
                className={chipClass(selectedCategoryKey === cat.key)}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: cat.color }}
                />
                {cat.displayName || t("uncategorized")}
                <span className="font-[var(--f-mono)] text-[10px] opacity-70">
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <Button
            variant="outline"
            onClick={() => setConfirmStartOverOpen(true)}
            disabled={isSaving}
            className="h-8 gap-1.5 px-3 text-[13px]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("startOver")}
          </Button>
        </div>
      </div>

      <div className="px-9 pt-5 max-md:px-5">
        {groupedItems.length === 0 ? (
          <div className="mx-auto max-w-[560px] rounded-lg border border-dashed border-[var(--rule)] bg-[var(--paper)] px-6 py-10 text-center">
            <h2 className="text-[20px] font-medium text-[var(--ink)]">
              {isFiltering ? t("noMatchTitle") : t("reviewEmptyTitle")}
            </h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[14px] leading-[1.55] text-[var(--ink-2)]">
              {isFiltering ? t("noMatchDesc") : t("reviewEmptyDesc")}
            </p>
            {!isFiltering ? (
              <Button
                variant="outline"
                onClick={() => handleAddItemInCategory("")}
                className="mt-5 h-10 px-4"
              >
                <Plus className="h-4 w-4" />
                {t("table.add")}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedItems.map((group) => {
              const groupLabel = group.displayName || t("uncategorized");
              return (
                <div key={group.key || "__uncategorized"}>
                  <div className="sticky top-[104px] z-10 flex items-center gap-3 bg-[color-mix(in_oklab,var(--bg)_96%,transparent)] py-2.5 backdrop-blur-sm">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: group.color }}
                    />
                    <h3 className="font-[var(--f-display)] text-[22px] font-normal leading-none tracking-[-0.01em] text-[var(--ink)]">
                      {groupLabel}
                    </h3>
                    <span className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
                      {String(group.items.length).padStart(2, "0")} ·{" "}
                      {groupLabel.toLocaleLowerCase("bg-BG")}
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[var(--rule)] bg-[var(--paper)]">
                    <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,1.4fr)_120px_52px] gap-0 border-b border-[var(--rule)] bg-[var(--bg)] px-4 py-2.5 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
                      <div className="px-2">{t("fields.name")}</div>
                      <div className="px-2">{t("fields.category")}</div>
                      <div className="px-2 text-right">{t("fields.price")}</div>
                      <div />
                    </div>

                    {group.items.map((item) => {
                      const rowErrors = validation.rowErrors[item.id] || {};
                      return (
                        <div
                          key={item.id}
                          className="group/row grid grid-cols-[minmax(0,3fr)_minmax(0,1.4fr)_120px_52px] gap-0 border-b border-[var(--rule-soft,var(--rule))] px-4 py-1 transition last:border-b-0 hover:bg-[color-mix(in_oklab,var(--accent)_4%,var(--paper))]"
                        >
                          <div className="px-2">
                            <input
                              value={item.name_bg}
                              onChange={(event) =>
                                handleItemChange(
                                  item.id,
                                  "name_bg",
                                  event.target.value,
                                )
                              }
                              placeholder={t("placeholders.name")}
                              aria-invalid={Boolean(rowErrors.name_bg)}
                              className="w-full rounded-md border border-transparent bg-transparent px-2.5 py-2 text-[14px] font-medium text-[var(--ink)] outline-none transition hover:bg-[var(--bg)] focus:border-[var(--accent)] focus:bg-[var(--bg)]"
                            />
                            {rowErrors.name_bg ? (
                              <p className="px-2.5 pt-1 text-[11px] text-[var(--bad)]">
                                {rowErrors.name_bg}
                              </p>
                            ) : null}
                          </div>

                          <div className="px-2 py-1">
                            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--rule)] bg-transparent py-1 pr-3 pl-2 transition hover:border-[var(--ink-mute)] hover:bg-[var(--bg)] has-[input:focus]:border-[var(--accent)] has-[input:focus]:bg-[var(--bg)]">
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{
                                  background: categoryColorFor(item.category),
                                }}
                              />
                              <input
                                value={item.category}
                                onChange={(event) =>
                                  handleItemChange(
                                    item.id,
                                    "category",
                                    event.target.value,
                                  )
                                }
                                placeholder={t("placeholders.category")}
                                className="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--ink-2)] outline-none placeholder:text-[var(--ink-mute)]"
                              />
                            </div>
                          </div>

                          <div className="px-2">
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={item.price}
                                onChange={(event) =>
                                  handleItemChange(
                                    item.id,
                                    "price",
                                    event.target.value,
                                  )
                                }
                                placeholder={t("placeholders.price")}
                                aria-invalid={Boolean(rowErrors.price)}
                                className="w-full rounded-md border border-transparent bg-transparent px-2.5 py-2 text-right font-[var(--f-mono)] text-[13px] text-[var(--ink)] outline-none transition hover:bg-[var(--bg)] focus:border-[var(--accent)] focus:bg-[var(--bg)]"
                              />
                              <span className="font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
                                лв
                              </span>
                            </div>
                            {rowErrors.price ? (
                              <p className="px-2.5 pt-1 text-right text-[11px] text-[var(--bad)]">
                                {rowErrors.price}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              title={t("table.remove")}
                              aria-label={t("table.remove")}
                              className="grid h-9 w-9 place-items-center rounded-md text-[var(--ink-mute)] opacity-0 transition hover:bg-[color-mix(in_oklab,var(--bad)_8%,transparent)] hover:text-[var(--bad)] group-hover/row:opacity-100 focus:opacity-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex items-center gap-2.5 border-t border-[var(--rule)] bg-[var(--bg)] px-4 py-2.5 font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
                      <button
                        type="button"
                        onClick={() =>
                          handleAddItemInCategory(group.displayName)
                        }
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] uppercase tracking-[0.06em] text-[var(--ink-2)] transition hover:bg-[var(--paper)] hover:text-[var(--accent)]"
                      >
                        <Plus className="h-3 w-3" />
                        {t("addInCategory", {
                          category: groupLabel.toLocaleLowerCase("bg-BG"),
                        })}
                      </button>
                      <div className="flex-1" />
                      <span className="inline-flex items-center gap-1.5">
                        <span className="rounded border border-[var(--rule)] bg-[color-mix(in_oklab,var(--rule)_40%,transparent)] px-1 py-0.5 text-[10px]">
                          ↵
                        </span>
                        {t("newRowHint")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasUnsavedChanges ? (
        <div className="sticky bottom-5 z-[60] mx-9 mt-8 flex items-center gap-4 rounded-xl bg-[var(--ink)] px-5 py-3.5 text-[var(--paper)] shadow-[0_20px_40px_-10px_rgba(26,21,18,0.4)] max-md:mx-5 max-md:flex-wrap">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent-2,var(--accent))]" />
          <div className="min-w-0 flex-1 text-[13px]">
            <b className="text-[var(--paper)]">{t("unsavedTitle")}</b>
            {validation.validItems.length < MIN_MENU_ITEMS_FOR_NEXT_STEP ? (
              <span className="ml-1 text-[color-mix(in_oklab,var(--paper)_60%,transparent)]">
                ·{" "}
                {t("errors.needMoreItems", {
                  count: MIN_MENU_ITEMS_FOR_NEXT_STEP,
                })}
              </span>
            ) : validation.hasErrors ? (
              <span className="ml-1 text-[color-mix(in_oklab,var(--paper)_60%,transparent)]">
                · {t("errors.fixBeforeSave")}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleUndo}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] text-[color-mix(in_oklab,var(--paper)_70%,transparent)] transition hover:text-[var(--paper)] disabled:opacity-50"
          >
            <Undo2 className="h-3.5 w-3.5" />
            {t("unsavedUndo")}
          </button>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="h-9 bg-[var(--accent)] px-4 text-[var(--paper)] hover:bg-[var(--plum)] disabled:bg-[color-mix(in_oklab,var(--paper)_20%,transparent)] disabled:text-[color-mix(in_oklab,var(--paper)_50%,transparent)]"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : null}
            {isSaving ? t("saving") : t("saveMenu")}
          </Button>
        </div>
      ) : null}

      <Dialog
        open={confirmStartOverOpen}
        onOpenChange={setConfirmStartOverOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("startOverConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("startOverConfirmDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmStartOverOpen(false)}
            >
              {commonActions("cancel")}
            </Button>
            <Button
              onClick={handleStartOver}
              className="bg-[var(--accent)] text-[var(--paper)] hover:bg-[var(--plum)]"
            >
              {t("startOverConfirmCta")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
