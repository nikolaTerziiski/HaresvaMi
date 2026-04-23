"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MenuEmptyState } from "./MenuEmptyState";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface MenuItemRow {
  id: string; // temporary local id
  name_bg: string;
  category: string;
  price: string;
  description_bg?: string;
}

interface MenuManagerProps {
  restaurantId: string;
  initialItemsCount: number;
}

export function MenuManager({ restaurantId, initialItemsCount }: MenuManagerProps) {
  const router = useRouter();
  const t = useTranslations("dashboard.menu");
  
  const [mode, setMode] = useState<"empty" | "uploading" | "review">(
    initialItemsCount === 0 ? "empty" : "review"
  );
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileSelect = async (file: File) => {
    setMode("uploading");
    setError(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/extract-menu", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(t("errors.upload"));
      }

      const data = await response.json();
      const newItems: MenuItemRow[] = data.items.map((item: any) => ({
        id: crypto.randomUUID(),
        name_bg: item.name_bg || "",
        category: item.category || "",
        price: item.price ? String(item.price) : "",
        description_bg: item.description_bg || "",
      }));

      setItems(newItems);
      setMode("review");
    } catch (err: any) {
      console.error(err);
      setError(err.message || t("errors.upload"));
      setMode("empty");
    }
  };

  const handleManualEntry = () => {
    setItems([{ id: crypto.randomUUID(), name_bg: "", category: "", price: "" }]);
    setMode("review");
  };

  const handleItemChange = (id: string, field: keyof MenuItemRow, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleAddItem = () => {
    setItems([...items, { id: crypto.randomUUID(), name_bg: "", category: "", price: "" }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    
    const validItems = items.filter(item => item.name_bg.trim() !== "").map((item, index) => ({
      restaurant_id: restaurantId,
      name_bg: item.name_bg,
      category: item.category,
      price: item.price ? parseFloat(item.price) : null,
      description_bg: item.description_bg || null,
      sort_order: index,
      is_active: true
    }));

    if (validItems.length === 0) {
      setIsSaving(false);
      return;
    }

    const { error: dbError } = await supabase
      .from("menu_items")
      .insert(validItems);

    if (dbError) {
      setError(dbError.message);
      setIsSaving(false);
      return;
    }

    // Refresh the router to update the dashboard checklist state
    router.refresh();
    router.push("/dashboard");
  };

  if (mode === "empty") {
    return (
      <div className="w-full">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
        <MenuEmptyState onFileSelect={handleFileSelect} onManualEntry={handleManualEntry} />
      </div>
    );
  }

  if (mode === "uploading") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-[var(--accent)]" />
        <h2 className="text-xl font-medium text-[var(--ink)]">{t("uploading")}</h2>
      </div>
    );
  }

  // mode === "review"
  return (
    <div className="mx-auto w-full max-w-4xl py-10 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-[var(--f-display)] text-3xl leading-none tracking-[-0.02em] text-[var(--ink)]">
            {t("reviewTitle")}
          </h1>
          <p className="mt-2 text-[15px] text-[var(--ink-2)]">
            {t("reviewDesc")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            {t("common.actions.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving || items.length === 0}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("common.actions.save")}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--rule)]/30 text-[var(--ink-mute)]">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("table.name")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.category")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.price")}</th>
                  <th className="px-4 py-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]">
                {items.map((item) => (
                  <tr key={item.id} className="group hover:bg-[var(--rule)]/10">
                    <td className="px-4 py-2">
                      <Input
                        value={item.name_bg}
                        onChange={(e) => handleItemChange(item.id, "name_bg", e.target.value)}
                        placeholder="Кебапче..."
                        className="border-transparent bg-transparent px-2 shadow-none focus-visible:bg-[var(--paper)] focus-visible:ring-1"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        value={item.category}
                        onChange={(e) => handleItemChange(item.id, "category", e.target.value)}
                        placeholder="Основни..."
                        className="border-transparent bg-transparent px-2 shadow-none focus-visible:bg-[var(--paper)] focus-visible:ring-1"
                      />
                    </td>
                    <td className="px-4 py-2 w-32">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleItemChange(item.id, "price", e.target.value)}
                        placeholder="2.50"
                        className="border-transparent bg-transparent px-2 shadow-none focus-visible:bg-[var(--paper)] focus-visible:ring-1"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-8 w-8 text-red-500 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100"
                        title={t("table.remove")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="border-t border-[var(--rule)] p-4 text-center">
            <Button variant="ghost" onClick={handleAddItem} className="gap-2 text-[var(--ink-2)]">
              <Plus className="h-4 w-4" />
              {t("table.add")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
