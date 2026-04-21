"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { persistLocale } from "@/lib/i18n/browser";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth";

const COPY = {
  bg: {
    eyebrow: "Нова парола",
    title: "Избери нова парола за акаунта си.",
    description:
      "Отвори линка от имейла и запази нова парола. След това ще влезеш отново с нея.",
    checking: "Проверяваме линка за възстановяване...",
    invalidTitle: "Линкът е изтекъл или е невалиден.",
    invalidDescription:
      "Поискай нов линк за смяна на паролата и опитай отново.",
    requestNewLink: "Поискай нов линк →",
    backToLogin: "Към входа →",
    passwordLabel: "Нова парола",
    confirmPasswordLabel: "Потвърди новата парола",
    passwordPlaceholder: "Поне 8 символа",
    confirmPasswordPlaceholder: "Повтори новата парола",
    submit: "Запази новата парола →",
    submitting: "Запазваме...",
    genericError: "Не успяхме да обновим паролата. Опитай пак.",
    show: "Покажи",
    hide: "Скрий",
    footer: "Построено в България",
    toggleBg: "BG",
    toggleEn: "EN",
  },
  en: {
    eyebrow: "New password",
    title: "Choose a new password for your account.",
    description:
      "Open the email link and save a new password. After that, sign in again with it.",
    checking: "Checking your recovery link...",
    invalidTitle: "This link has expired or is invalid.",
    invalidDescription:
      "Request a fresh password reset link and try again.",
    requestNewLink: "Request a new link →",
    backToLogin: "Back to login →",
    passwordLabel: "New password",
    confirmPasswordLabel: "Confirm new password",
    passwordPlaceholder: "At least 8 characters",
    confirmPasswordPlaceholder: "Repeat the new password",
    submit: "Save new password →",
    submitting: "Saving...",
    genericError: "We couldn't update your password. Please try again.",
    show: "Show",
    hide: "Hide",
    footer: "Built in Bulgaria",
    toggleBg: "BG",
    toggleEn: "EN",
  },
} as const;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [lang, setLang] = useState<Locale>("bg");
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const copy = COPY[lang];

  useEffect(() => {
    let isActive = true;
    let timeoutId: number | null = null;

    const markReady = () => {
      if (!isActive) {
        return;
      }

      setStatus("ready");
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };

    const markInvalid = () => {
      if (!isActive) {
        return;
      }

      setStatus((current) => (current === "checking" ? "invalid" : current));
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        markReady();
        return;
      }

      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        markReady();
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isActive) {
        return;
      }

      if (error) {
        markInvalid();
        return;
      }

      if (data.session) {
        markReady();
        return;
      }

      timeoutId = window.setTimeout(markInvalid, 1500);
    });

    return () => {
      isActive = false;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const onSubmit = handleSubmit(async (values) => {
    persistLocale(lang);

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      setError("root", {
        message: copy.genericError,
      });
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login?reset=success");
    router.refresh();
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

        {status === "checking" ? (
          <>
            <h1
              className="text-4xl leading-none tracking-[-0.02em] md:text-5xl"
              style={{ fontFamily: "var(--f-display)" }}
            >
              {copy.title}
            </h1>
            <p className="mt-4 text-[15px] text-[var(--ink-2)]">{copy.checking}</p>
          </>
        ) : null}

        {status === "invalid" ? (
          <>
            <h1
              className="text-4xl leading-none tracking-[-0.02em] md:text-5xl"
              style={{ fontFamily: "var(--f-display)" }}
            >
              {copy.invalidTitle}
            </h1>
            <p className="mt-4 text-[15px] text-[var(--ink-2)]">{copy.invalidDescription}</p>
            <div className="mt-8 flex flex-col gap-3 text-sm text-[var(--ink-2)]">
              <Link
                href="/forgot-password"
                className="text-[var(--accent)] no-underline hover:underline"
              >
                {copy.requestNewLink}
              </Link>
              <Link href="/login" className="text-[var(--accent)] no-underline hover:underline">
                {copy.backToLogin}
              </Link>
            </div>
          </>
        ) : null}

        {status === "ready" ? (
          <>
            <h1
              className="text-4xl leading-none tracking-[-0.02em] md:text-5xl"
              style={{ fontFamily: "var(--f-display)" }}
            >
              {copy.title}
            </h1>
            <p className="mt-4 max-w-lg text-[15px] text-[var(--ink-2)]">{copy.description}</p>

            <form className="mt-8 space-y-5" noValidate onSubmit={onSubmit}>
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]"
                  style={{ fontFamily: "var(--f-mono)" }}
                >
                  {copy.passwordLabel}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={copy.passwordPlaceholder}
                    className="w-full rounded-xl border border-[var(--rule)] bg-[var(--bg)] px-4 py-3 pr-20 text-[15px] text-[var(--ink)] outline-none transition focus:border-[var(--ink)] focus:bg-white"
                    aria-invalid={Boolean(errors.password)}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.06em] text-[var(--ink-mute)]"
                    style={{ fontFamily: "var(--f-mono)" }}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? copy.hide : copy.show}
                  </button>
                </div>
                {errors.password?.message ? (
                  <p className="mt-2 text-sm text-[var(--bad)]">{errors.password.message}</p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]"
                  style={{ fontFamily: "var(--f-mono)" }}
                >
                  {copy.confirmPasswordLabel}
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={copy.confirmPasswordPlaceholder}
                    className="w-full rounded-xl border border-[var(--rule)] bg-[var(--bg)] px-4 py-3 pr-20 text-[15px] text-[var(--ink)] outline-none transition focus:border-[var(--ink)] focus:bg-white"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.06em] text-[var(--ink-mute)]"
                    style={{ fontFamily: "var(--f-mono)" }}
                    onClick={() => setShowConfirmPassword((current) => !current)}
                  >
                    {showConfirmPassword ? copy.hide : copy.show}
                  </button>
                </div>
                {errors.confirmPassword?.message ? (
                  <p className="mt-2 text-sm text-[var(--bad)]">{errors.confirmPassword.message}</p>
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
          </>
        ) : null}
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
