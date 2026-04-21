"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { persistLocale } from "@/lib/i18n/browser";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validations/auth";

const COPY = {
  bg: {
    eyebrow: "Смяна на парола",
    title: "Ще ти изпратим нов линк за достъп.",
    description:
      "Въведи имейла, с който влизаш в HaresvaMi. Ако имаш акаунт, ще получиш линк за нова парола.",
    emailLabel: "Имейл",
    submit: "Изпрати линк →",
    submitting: "Изпращаме...",
    success:
      "Ако има акаунт с този имейл, изпратихме линк за смяна на паролата. Провери пощата си.",
    genericError: "Не успяхме да изпратим линка. Опитай пак.",
    backToLogin: "Към входа →",
    createAccount: "Нямаш акаунт? Регистрирай се →",
    footer: "Построено в България",
    toggleBg: "BG",
    toggleEn: "EN",
  },
  en: {
    eyebrow: "Password reset",
    title: "We'll send you a fresh sign-in link.",
    description:
      "Enter the email you use for HaresvaMi. If an account exists, you'll receive a link to set a new password.",
    emailLabel: "Email",
    submit: "Send link →",
    submitting: "Sending...",
    success:
      "If an account exists for this email, we sent a password reset link. Please check your inbox.",
    genericError: "We couldn't send the link. Please try again.",
    backToLogin: "Back to login →",
    createAccount: "No account yet? Sign up →",
    footer: "Built in Bulgaria",
    toggleBg: "BG",
    toggleEn: "EN",
  },
} as const;

export default function ForgotPasswordPage() {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [lang, setLang] = useState<Locale>("bg");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const copy = COPY[lang];

  const onSubmit = handleSubmit(async (values) => {
    persistLocale(lang);
    setSuccessMessage(null);

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? window.location.origin;
    const redirectTo = new URL("/reset-password", appUrl).toString();

    const { error } = await supabase.auth.resetPasswordForEmail(values.email.trim(), {
      redirectTo,
    });

    if (error) {
      setError("root", {
        message: copy.genericError,
      });
      return;
    }

    setSuccessMessage(copy.success);
  });

  const toggleLanguage = (nextLanguage: Locale) => {
    setLang(nextLanguage);
    persistLocale(nextLanguage);
  };

  return (
    <main className="min-h-dvh bg-[var(--bg)] px-6 py-8 text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl tracking-[-0.01em] text-[var(--ink)] no-underline"
          style={{ fontFamily: "var(--f-display)" }}
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--accent)] text-[20px] italic text-[var(--paper)]">
            <span className="-translate-y-px">h</span>
          </span>
          HaresvaMi
        </Link>

        <div
          className="inline-flex items-center gap-2 text-[11px] text-[var(--ink-mute)]"
          style={{ fontFamily: "var(--f-mono)" }}
        >
          <button
            type="button"
            className={`border-b px-2 py-1 ${lang === "bg" ? "border-[var(--accent)] text-[var(--ink)]" : "border-transparent"}`}
            onClick={() => toggleLanguage("bg")}
          >
            {copy.toggleBg}
          </button>
          <span>/</span>
          <button
            type="button"
            className={`border-b px-2 py-1 ${lang === "en" ? "border-[var(--accent)] text-[var(--ink)]" : "border-transparent"}`}
            onClick={() => toggleLanguage("en")}
          >
            {copy.toggleEn}
          </button>
        </div>
      </div>

      <section className="mx-auto mt-16 w-full max-w-xl rounded-[28px] border border-[var(--rule)] bg-[var(--paper)] p-8 shadow-[0_30px_60px_-30px_rgba(26,21,18,0.18)] md:p-10">
        <p
          className="mb-4 text-[11px] uppercase tracking-[0.08em] text-[var(--accent)]"
          style={{ fontFamily: "var(--f-mono)" }}
        >
          {copy.eyebrow}
        </p>
        <h1
          className="text-4xl leading-none tracking-[-0.02em] md:text-5xl"
          style={{ fontFamily: "var(--f-display)" }}
        >
          {copy.title}
        </h1>
        <p className="mt-4 max-w-lg text-[15px] text-[var(--ink-2)]">{copy.description}</p>

        {successMessage ? (
          <div className="mt-6 rounded-2xl border border-[color:color-mix(in_srgb,var(--good)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--good)_8%,var(--paper))] px-4 py-3 text-sm text-[color:color-mix(in_srgb,var(--good)_75%,var(--ink))]">
            {successMessage}
          </div>
        ) : null}

        <form className="mt-8 space-y-5" noValidate onSubmit={onSubmit}>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]"
              style={{ fontFamily: "var(--f-mono)" }}
            >
              {copy.emailLabel}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="dani@mehana.bg"
              className="w-full rounded-xl border border-[var(--rule)] bg-[var(--bg)] px-4 py-3 text-[15px] text-[var(--ink)] outline-none transition focus:border-[var(--ink)] focus:bg-white"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email?.message ? (
              <p className="mt-2 text-sm text-[var(--bad)]">{errors.email.message}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[var(--ink)] px-5 py-3 text-[15px] font-medium text-[var(--paper)] transition hover:bg-[var(--accent)] disabled:cursor-wait disabled:opacity-80"
          >
            {isSubmitting ? copy.submitting : copy.submit}
          </button>

          {errors.root?.message ? (
            <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--bad)_20%,transparent)] bg-[color:color-mix(in_srgb,var(--bad)_8%,var(--paper))] px-4 py-3 text-sm text-[var(--bad)]">
              {errors.root.message}
            </div>
          ) : null}
        </form>

        <div className="mt-8 flex flex-col gap-3 text-sm text-[var(--ink-2)]">
          <Link href="/login" className="text-[var(--accent)] no-underline hover:underline">
            {copy.backToLogin}
          </Link>
          <Link href="/register" className="text-[var(--accent)] no-underline hover:underline">
            {copy.createAccount}
          </Link>
        </div>
      </section>

      <p
        className="mt-10 text-center text-[11px] text-[var(--ink-mute)]"
        style={{ fontFamily: "var(--f-mono)" }}
      >
        © 2026 HaresvaMi · {copy.footer}
      </p>
    </main>
  );
}
