"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const t = useTranslations("dashboard.shell");
  const router = useRouter();
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-label={t("logout")}
      className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-[12px] text-[var(--ink-mute)] transition hover:text-[var(--ink)] disabled:opacity-60"
    >
      <LogOut className="h-[14px] w-[14px]" strokeWidth={1.75} />
      {t("logout")}
    </button>
  );
}
