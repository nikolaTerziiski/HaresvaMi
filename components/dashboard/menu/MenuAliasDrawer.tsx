"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MenuAliasTarget, MenuItemAlias } from "@/lib/menu/types";
import {
  manualReceiptAliasSchema,
  type ManualReceiptAliasFormValues,
} from "@/lib/receipt-aliases/manual-alias-form";

type MenuAliasDrawerProps = {
  open: boolean;
  menuItems: MenuAliasTarget[];
  aliasesByMenuItem: Map<string, MenuItemAlias[]>;
  selectedMenuItemId: string;
  isSaving: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSelectedMenuItemChange: (menuItemId: string) => void;
  onSaveAlias: (values: ManualReceiptAliasFormValues) => Promise<boolean>;
};

export function MenuAliasDrawer({
  open,
  menuItems,
  aliasesByMenuItem,
  selectedMenuItemId,
  isSaving,
  error,
  onOpenChange,
  onSelectedMenuItemChange,
  onSaveAlias,
}: MenuAliasDrawerProps) {
  const t = useTranslations("dashboard.menu.aliases");
  const form = useForm<ManualReceiptAliasFormValues>({
    resolver: zodResolver(manualReceiptAliasSchema),
    defaultValues: {
      rawText: "",
      menuItemId: selectedMenuItemId,
    },
  });
  const aliasGroups = useMemo(
    () =>
      menuItems
        .map((item) => ({
          item,
          aliases: aliasesByMenuItem.get(item.id) ?? [],
        }))
        .filter((group) => group.aliases.length > 0),
    [aliasesByMenuItem, menuItems],
  );

  useEffect(() => {
    form.setValue("menuItemId", selectedMenuItemId, {
      shouldValidate: false,
    });
  }, [form, selectedMenuItemId]);

  useEffect(() => {
    if (!open) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onOpenChange, open]);

  async function handleSubmit(values: ManualReceiptAliasFormValues) {
    const saved = await onSaveAlias(values);

    if (saved) {
      form.reset({
        rawText: "",
        menuItemId: values.menuItemId,
      });
    }
  }

  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label={t("close")}
        onClick={() => onOpenChange(false)}
        className="fixed inset-0 z-40 bg-[rgba(26,21,18,0.22)]"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-alias-drawer-title"
        className="fixed top-0 right-0 z-50 flex h-dvh w-full max-w-[520px] flex-col border-l border-[var(--rule)] bg-[var(--paper)]"
      >
        <div className="flex items-start gap-4 border-b border-[var(--rule)] px-6 py-5">
          <div className="min-w-0 flex-1">
            <p className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
              {t("eyebrow")}
            </p>
            <h2
              id="menu-alias-drawer-title"
              className="mt-2 font-[var(--f-display)] text-[30px] font-normal leading-none tracking-[-0.01em] text-[var(--ink)]"
            >
              {t("title")}
            </h2>
            <p className="mt-3 text-[14px] leading-[1.55] text-[var(--ink-2)]">
              {t("description")}
            </p>
            <p className="mt-2 font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
              {t("example")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t("close")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[var(--ink-mute)] transition hover:bg-[var(--bg)] hover:text-[var(--ink)]"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="border-b border-[var(--rule)] bg-[color-mix(in_oklab,var(--accent)_4%,var(--paper))] px-6 py-5"
        >
          <p className="mb-4 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
            {t("addTitle")}
          </p>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label
                htmlFor="receipt-alias-text"
                className="text-[13px] text-[var(--ink-2)]"
              >
                {t("aliasLabel")}
              </Label>
              <Input
                id="receipt-alias-text"
                placeholder={t("aliasPlaceholder")}
                aria-invalid={Boolean(form.formState.errors.rawText)}
                className="h-10 border-[var(--rule)] bg-[var(--paper)] font-[var(--f-mono)] text-[13px] uppercase text-[var(--ink)] focus-visible:border-[var(--accent)] focus-visible:ring-0"
                {...form.register("rawText")}
              />
              {form.formState.errors.rawText ? (
                <p className="text-[12px] text-[var(--bad)]">
                  {t("aliasRequired")}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="receipt-alias-menu-item"
                className="text-[13px] text-[var(--ink-2)]"
              >
                {t("menuItemLabel")}
              </Label>
              <select
                id="receipt-alias-menu-item"
                disabled={menuItems.length === 0}
                aria-invalid={Boolean(form.formState.errors.menuItemId)}
                className="h-10 w-full rounded-lg border border-[var(--rule)] bg-[var(--paper)] px-3 text-[13px] text-[var(--ink)] outline-none transition focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                {...form.register("menuItemId", {
                  onChange: (event) =>
                    onSelectedMenuItemChange(event.target.value),
                })}
              >
                <option value="">{t("menuItemPlaceholder")}</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name_bg}
                  </option>
                ))}
              </select>
              {form.formState.errors.menuItemId ? (
                <p className="text-[12px] text-[var(--bad)]">
                  {t("menuItemRequired")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button
              type="submit"
              disabled={isSaving || menuItems.length === 0}
              className="bg-[var(--accent)] text-[var(--paper)] hover:bg-[var(--plum)]"
            >
              {isSaving ? t("saving") : t("save")}
            </Button>
            <p className="text-[12px] leading-[1.45] text-[var(--ink-mute)]">
              {menuItems.length === 0 ? t("saveMenuFirst") : t("hint")}
            </p>
          </div>

          {error ? (
            <p className="mt-3 rounded-md border border-[color-mix(in_oklab,var(--bad)_25%,var(--rule))] bg-[color-mix(in_oklab,var(--bad)_6%,var(--paper))] px-3 py-2 text-[12px] text-[var(--bad)]">
              {error}
            </p>
          ) : null}
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <p className="mb-3 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
            {t("currentTitle")}
          </p>
          {aliasGroups.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--rule)] bg-[var(--bg)] px-4 py-5 text-[14px] leading-[1.5] text-[var(--ink-mute)]">
              {t("empty")}
            </div>
          ) : (
            <div className="space-y-4">
              {aliasGroups.map((group) => (
                <div
                  key={group.item.id}
                  className="border-b border-[var(--rule-soft,var(--rule))] pb-4 last:border-b-0"
                >
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-[14px] font-medium text-[var(--ink)]">
                      {group.item.name_bg}
                    </h3>
                    {group.item.category ? (
                      <span className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.06em] text-[var(--ink-mute)]">
                        {group.item.category}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {group.aliases.map((alias) => (
                      <span
                        key={alias.id}
                        className="rounded-md bg-[var(--bg-2)] px-2 py-1 font-[var(--f-mono)] text-[11px] text-[var(--ink-2)]"
                      >
                        {alias.alias}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
