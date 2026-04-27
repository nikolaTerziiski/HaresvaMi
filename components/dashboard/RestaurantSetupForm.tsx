"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import type { Locale } from "@/lib/i18n/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { reserveUniqueRestaurantSlug } from "@/lib/utils/restaurant-slug";
import {
  restaurantSetupSchema,
  type RestaurantSetupFormValues,
} from "@/lib/validations/auth";

type RestaurantSetupFormProps = {
  ownerId: string;
  ownerLanguage: Locale;
};

function isSlugConflict(error: {
  code?: string | null;
  message?: string | null;
}) {
  return (
    error.code === "23505" &&
    (error.message ?? "").toLowerCase().includes("slug")
  );
}

export function RestaurantSetupForm({
  ownerId,
  ownerLanguage,
}: RestaurantSetupFormProps) {
  const t = useTranslations("dashboard.onboarding");
  const router = useRouter();
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RestaurantSetupFormValues>({
    resolver: zodResolver(restaurantSetupSchema),
    defaultValues: {
      restaurantName: "",
    },
  });

  const onSubmit = handleSubmit(async ({ restaurantName }) => {
    const trimmedName = restaurantName.trim();

    const { data: existingRestaurant, error: existingRestaurantError } =
      await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", ownerId)
        .limit(1)
        .maybeSingle();

    if (existingRestaurantError) {
      setError("root", {
        message: t("error"),
      });
      return;
    }

    if (existingRestaurant) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    try {
      await reserveUniqueRestaurantSlug(trimmedName, async (slug) => {
        const { error } = await supabase.from("restaurants").insert({
          owner_id: ownerId,
          name: trimmedName,
          slug,
          language_default: ownerLanguage,
          customer_languages: [ownerLanguage],
        });

        if (!error) {
          return true;
        }

        if (isSlugConflict(error)) {
          return false;
        }

        throw error;
      });
    } catch (error) {
      const message =
        error instanceof Error &&
        error.message === "Unable to reserve a unique restaurant slug."
          ? t("slugError")
          : t("error");

      setError("root", {
        message,
      });
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  });

  return (
    <form noValidate onSubmit={onSubmit} className="mt-8 space-y-5">
      <div>
        <label
          htmlFor="restaurantName"
          className="mb-2 block font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]"
        >
          {t("nameLabel")}
        </label>
        <input
          id="restaurantName"
          type="text"
          placeholder={t("namePlaceholder")}
          aria-invalid={Boolean(errors.restaurantName)}
          className="w-full rounded-xl border border-[var(--rule)] bg-[var(--paper)] px-4 py-3 text-[15px] text-[var(--ink)] transition focus:border-[var(--ink)] focus:outline-none"
          {...register("restaurantName")}
        />
        {errors.restaurantName?.message ? (
          <p className="mt-2 text-sm text-[var(--bad)]">
            {errors.restaurantName.message}
          </p>
        ) : null}
      </div>

      <p className="text-sm text-[var(--ink-mute)]">{t("helper")}</p>

      {errors.root?.message ? (
        <div
          className="rounded-2xl px-4 py-3 text-sm text-[var(--bad)]"
          style={{
            border: "1px solid color-mix(in srgb, var(--bad) 20%, transparent)",
            background: "color-mix(in srgb, var(--bad) 8%, var(--paper))",
          }}
        >
          {errors.root.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-[var(--ink)] px-5 py-3 text-[15px] font-medium text-[var(--paper)] transition hover:bg-[var(--accent)] disabled:cursor-wait disabled:opacity-80"
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
