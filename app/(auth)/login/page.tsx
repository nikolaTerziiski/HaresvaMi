"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { persistLocale } from "@/lib/i18n/browser";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";

import styles from "./page.module.css";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width={18} height={18}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const COPY = {
  bg: {
    topRightLead: "Нямаш акаунт?",
    topRightLink: "Регистрирай се →",
    eyebrow: "Вход в акаунта",
    title: (
      <>
        Добре <em>дошъл</em> обратно.
      </>
    ),
    subtitle: "Въведи имейла и паролата си, за да видиш последните отзиви.",
    emailLabel: "Имейл",
    passwordLabel: "Парола",
    forgotPassword: "Забравена?",
    passwordPlaceholder: "Въведи паролата си",
    rememberMe: "Запомни ме на това устройство",
    submit: "Влез →",
    submitting: "Влизаме...",
    divider: "или",
    continueWithGoogle: "Продължи с Google",
    registerLead: "Все още не си клиент?",
    registerLink: "Регистрирай ресторанта си →",
    footer: "Построено в България",
    resetSuccess: "Паролата е обновена. Влез с новата си парола.",
    invalidCredentials: "Имейлът или паролата не съвпадат.",
    genericError: "Не успяхме да те впишем. Опитай пак.",
    missingSession: "Влизането мина, но няма активна сесия. Опитай отново.",
    show: "Покажи",
    hide: "Скрий",
  },
  en: {
    topRightLead: "No account yet?",
    topRightLink: "Sign up →",
    eyebrow: "Account login",
    title: (
      <>
        Welcome <em>back</em>.
      </>
    ),
    subtitle: "Enter your email and password to see recent feedback.",
    emailLabel: "Email",
    passwordLabel: "Password",
    forgotPassword: "Forgot?",
    passwordPlaceholder: "Enter your password",
    rememberMe: "Remember me on this device",
    submit: "Sign in →",
    submitting: "Signing in...",
    divider: "or",
    continueWithGoogle: "Continue with Google",
    registerLead: "Not a customer yet?",
    registerLink: "Register your restaurant →",
    footer: "Built in Bulgaria",
    resetSuccess: "Your password is updated. Sign in with the new password.",
    invalidCredentials: "The email or password is incorrect.",
    genericError: "We couldn't sign you in. Please try again.",
    missingSession: "Login completed, but there is no active session. Please try again.",
    show: "Show",
    hide: "Hide",
  },
} as const;

function getLoginErrorMessage(message: string, locale: Locale) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return COPY[locale].invalidCredentials;
  }

  return COPY[locale].genericError;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState<Locale>("bg");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const copy = COPY[lang];
  const showResetSuccess = searchParams.get("reset") === "success";

  const onSubmit = handleSubmit(async (values) => {
    persistLocale(lang);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email.trim(),
      password: values.password,
    });

    if (error) {
      setError("root", {
        message: getLoginErrorMessage(error.message, lang),
      });
      return;
    }

    if (!data.session) {
      setError("root", {
        message: copy.missingSession,
      });
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  });

  const toggleLanguage = (nextLanguage: Locale) => {
    setLang(nextLanguage);
    persistLocale(nextLanguage);
  };

  return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}><span>h</span></span>
          HaresvaMi
        </Link>
        <div className={styles.topRight}>
          <div className={styles.lang}>
            <button
              type="button"
              className={`${styles.langBtn} ${lang === "bg" ? styles.langBtnActive : ""}`}
              onClick={() => toggleLanguage("bg")}
            >
              BG
            </button>
            <span style={{ color: "var(--ink-mute)" }}>/</span>
            <button
              type="button"
              className={`${styles.langBtn} ${lang === "en" ? styles.langBtnActive : ""}`}
              onClick={() => toggleLanguage("en")}
            >
              EN
            </button>
          </div>
          <span>{copy.topRightLead}</span>
          <Link href="/register">{copy.topRightLink}</Link>
        </div>
      </div>

      <div className={styles.shell}>
        <div className={styles.card}>
          <div className={styles.eyebrow}>{copy.eyebrow}</div>
          <h1>{copy.title}</h1>
          <p className={styles.sub}>{copy.subtitle}</p>

          {showResetSuccess ? (
            <div className={styles.notice}>{copy.resetSuccess}</div>
          ) : null}

          <form noValidate onSubmit={onSubmit}>
            <div className={`${styles.field} ${errors.email ? styles.fieldError : ""}`}>
              <label htmlFor="email">{copy.emailLabel}</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="dani@mehana.bg"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email?.message ? (
                <div className={styles.hint}>{errors.email.message}</div>
              ) : null}
            </div>

            <div className={`${styles.field} ${errors.password ? styles.fieldError : ""}`}>
              <div className={styles.fieldHead}>
                <label htmlFor="password">{copy.passwordLabel}</label>
                <Link href="/forgot-password">{copy.forgotPassword}</Link>
              </div>
              <div className={styles.pwWrap}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={copy.passwordPlaceholder}
                  aria-invalid={Boolean(errors.password)}
                  {...register("password")}
                />
                <button
                  type="button"
                  className={styles.pwToggle}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? copy.hide : copy.show}
                </button>
              </div>
              {errors.password?.message ? (
                <div className={styles.hint}>{errors.password.message}</div>
              ) : null}
            </div>

            <label className={styles.check}>
              <input type="checkbox" defaultChecked />
              <span>{copy.rememberMe}</span>
            </label>

            <button type="submit" className={styles.submit} disabled={isSubmitting}>
              {isSubmitting ? copy.submitting : copy.submit}
            </button>

            {errors.root?.message ? (
              <div className={styles.formError}>{errors.root.message}</div>
            ) : null}

            <div className={styles.divider}>{copy.divider}</div>

            <button type="button" className={styles.gbtn}>
              <GoogleIcon />
              {copy.continueWithGoogle}
            </button>
          </form>

          <div className={styles.footAlt}>
            {copy.registerLead} <Link href="/register">{copy.registerLink}</Link>
          </div>
        </div>
      </div>

      <footer>© 2026 HaresvaMi · {copy.footer} · support@haresvami.bg</footer>
    </div>
  );
}
