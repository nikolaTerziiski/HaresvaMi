"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { saveGoogleReviewUrl } from "@/app/(dashboard)/dashboard/(shell)/settings/actions";

type GoogleReviewUrlFormProps = {
  initialUrl: string | null;
};

type SaveState = "idle" | "saving" | "saved" | "error" | "invalid";

export function GoogleReviewUrlForm({ initialUrl }: GoogleReviewUrlFormProps) {
  const t = useTranslations("dashboard.settings.reputation");
  const [url, setUrl] = useState(initialUrl ?? "");
  const [state, setState] = useState<SaveState>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("saving");

    try {
      const result = await saveGoogleReviewUrl({ url });

      if (!result.ok) {
        if (result.error === "invalid") {
          setState("invalid");
        } else {
          setState("error");
        }
        return;
      }

      setState("saved");
    } catch {
      setState("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label
          htmlFor="googleReviewUrl"
          className="mb-2 block font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]"
        >
          {t("urlLabel")}
        </label>
        <input
          id="googleReviewUrl"
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (state !== "idle") setState("idle");
          }}
          placeholder={t("urlPlaceholder")}
          className="w-full rounded-xl border border-[var(--rule)] bg-[var(--paper)] px-4 py-3 text-[15px] text-[var(--ink)] transition focus:border-[var(--ink)] focus:outline-none"
        />
        <p className="mt-2 text-[13px] leading-[1.5] text-[var(--ink-mute)]">
          {t("urlHelp")}
        </p>
      </div>

      {state === "invalid" ? (
        <p
          role="alert"
          className="rounded-lg px-4 py-3 text-[13px] leading-[1.5] text-[var(--bad)]"
          style={{
            border: "1px solid color-mix(in srgb, var(--bad) 20%, transparent)",
            background: "color-mix(in srgb, var(--bad) 8%, var(--paper))",
          }}
        >
          {t("invalidUrl")}
        </p>
      ) : state === "error" ? (
        <p
          role="alert"
          className="rounded-lg px-4 py-3 text-[13px] leading-[1.5] text-[var(--bad)]"
          style={{
            border: "1px solid color-mix(in srgb, var(--bad) 20%, transparent)",
            background: "color-mix(in srgb, var(--bad) 8%, var(--paper))",
          }}
        >
          {t("error")}
        </p>
      ) : state === "saved" ? (
        <p
          role="status"
          className="text-[13px] leading-[1.5] text-[var(--ink-mute)]"
        >
          {t("saved")}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={state === "saving"}
        className="inline-flex rounded-lg bg-[var(--accent)] px-5 py-3 text-[14px] font-medium text-white transition hover:brightness-95 disabled:pointer-events-none disabled:opacity-60"
      >
        {state === "saving" ? t("saving") : t("save")}
      </button>
    </form>
  );
}
