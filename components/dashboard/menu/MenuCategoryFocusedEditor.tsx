"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

import { MenuGroupCard } from "@/components/dashboard/menu/MenuGroupCard";
import type {
  CategoryGroup,
  MenuItemField,
  ValidationResult,
} from "@/lib/menu/types";

type MenuCategoryFocusedEditorProps = {
  group: CategoryGroup;
  validation: ValidationResult;
  categories: string[];
  focusItemId?: string;
  readOnly: boolean;
  onBack: () => void;
  onAddItemInCategory: (categoryName: string) => void;
  onAddCategory: () => void;
  onItemChange: (id: string, field: MenuItemField, value: string) => void;
  onRemoveItem: (id: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
};

export function MenuCategoryFocusedEditor({
  group,
  validation,
  categories,
  focusItemId,
  readOnly,
  onBack,
  onAddItemInCategory,
  onAddCategory,
  onItemChange,
  onRemoveItem,
  onRenameCategory,
}: MenuCategoryFocusedEditorProps) {
  const t = useTranslations("dashboard.menu");

  return (
    <div className="mx-auto mt-8 max-w-5xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 rounded border border-[var(--rule)] bg-[var(--paper)] px-3 py-2 font-[var(--f-ui)] text-[13px] text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
      >
        <ArrowLeft size={15} strokeWidth={1.5} />
        {t("categoryBoard.back")}
      </button>

      <MenuGroupCard
        group={group}
        validation={validation}
        categories={categories}
        focusItemId={focusItemId}
        readOnly={readOnly}
        expanded
        showCollapseToggle={false}
        onAddItemInCategory={onAddItemInCategory}
        onAddCategory={onAddCategory}
        onItemChange={onItemChange}
        onRemoveItem={onRemoveItem}
        onRenameCategory={onRenameCategory}
      />
    </div>
  );
}
