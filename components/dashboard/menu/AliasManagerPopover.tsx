"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { PopoverContent } from "@/components/ui/popover";

type AliasRow = {
  id: string;
  alias_text: string;
  confidence: string;
  created_at: string;
};

type AliasManagerPopoverProps = {
  menuItemId: string;
  menuItemName: string;
};

export function AliasManagerPopover({
  menuItemId,
  menuItemName,
}: AliasManagerPopoverProps) {
  const t = useTranslations("dashboard.menu");

  const [aliases, setAliases] = useState<AliasRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load aliases when the popover mounts
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `/api/receipt-aliases?menu_item_id=${encodeURIComponent(menuItemId)}`,
        );
        if (!res.ok) throw new Error("fetch failed");
        const data = (await res.json()) as { aliases: AliasRow[] };
        if (!cancelled) setAliases(data.aliases);
      } catch {
        if (!cancelled) setErrorMessage(t("aliasesLoadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [menuItemId]);

  async function handleAdd() {
    const trimmed = inputValue.trim();
    if (!trimmed || adding) return;

    setAdding(true);
    setDuplicateError(false);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/receipt-aliases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menu_item_id: menuItemId,
          alias_text: trimmed,
        }),
      });

      if (res.status === 409) {
        setDuplicateError(true);
        return;
      }

      if (!res.ok) throw new Error("post failed");

      const data = (await res.json()) as { alias: AliasRow };
      setAliases((prev) => [...prev, data.alias]);
      setInputValue("");
    } catch {
      setErrorMessage(t("aliasesSaveError"));
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(aliasId: string) {
    setErrorMessage(null);

    try {
      const res = await fetch(
        `/api/receipt-aliases/${encodeURIComponent(aliasId)}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        setErrorMessage(t("aliasesDeleteError"));
        return;
      }

      setAliases((prev) => prev.filter((a) => a.id !== aliasId));
    } catch {
      setErrorMessage(t("aliasesDeleteError"));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleAdd();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    if (duplicateError) setDuplicateError(false);
    if (errorMessage) setErrorMessage(null);
  }

  return (
    <PopoverContent className="w-[280px] p-0">
      {/* Title */}
      <p className="border-b border-[var(--rule)] px-3 py-2.5 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.12em] text-[var(--ink-mute)]">
        {t("aliasesTitle", { name: menuItemName })}
      </p>

      {/* Alias list */}
      <div className="max-h-[200px] overflow-y-auto">
        {loading ? (
          <p className="px-3 py-3 font-[var(--f-ui)] text-[12px] text-[var(--ink-mute)]">
            {t("aliasesLoading")}
          </p>
        ) : aliases.length === 0 ? (
          <p className="px-3 py-3 font-[var(--f-ui)] text-[12px] text-[var(--ink-mute)]">
            {t("aliasesEmpty")}
          </p>
        ) : (
          <ul>
            {aliases.map((alias) => (
              <li
                key={alias.id}
                className="flex items-center gap-2 px-3 py-1.5"
              >
                <span className="min-w-0 flex-1 truncate font-[var(--f-mono)] text-[13px] text-[var(--ink)]">
                  {alias.alias_text}
                </span>
                {alias.confidence !== "manual" ? (
                  <span className="shrink-0 rounded font-[var(--f-ui)] text-[10px] text-[var(--ink-mute)]">
                    {t("aliasesLearnedLabel")}
                  </span>
                ) : null}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    void handleDelete(alias.id);
                  }}
                  className="grid size-5 shrink-0 place-items-center rounded text-[var(--ink-mute)] hover:bg-[var(--bg-2)] hover:text-[var(--bad)]"
                >
                  <X size={12} strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add input */}
      <div className="border-t border-[var(--rule)] p-2.5">
        <div className="flex gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t("aliasesAddPlaceholder")}
            maxLength={64}
            className="min-w-0 flex-1 rounded border border-[var(--rule)] bg-[var(--bg)] px-2 py-1.5 font-[var(--f-ui)] text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)] focus:border-[var(--accent)]"
          />
          <button
            type="button"
            disabled={adding || !inputValue.trim()}
            onMouseDown={(e) => {
              e.preventDefault();
              void handleAdd();
            }}
            className="shrink-0 rounded border border-[var(--accent)] px-2.5 py-1.5 font-[var(--f-ui)] text-[12px] text-[var(--accent)] transition-colors hover:bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] disabled:pointer-events-none disabled:opacity-50"
          >
            {t("aliasesAddButton")}
          </button>
        </div>
        {duplicateError ? (
          <p className="mt-1 font-[var(--f-ui)] text-[11px] text-[var(--bad)]">
            {t("aliasesDuplicateError")}
          </p>
        ) : null}
        {errorMessage ? (
          <p
            role="alert"
            className="mt-1 font-[var(--f-ui)] text-[11px] leading-[1.4] text-[var(--bad)]"
          >
            {errorMessage}
          </p>
        ) : null}
      </div>
    </PopoverContent>
  );
}
