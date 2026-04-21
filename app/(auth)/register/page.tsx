"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { persistLocale } from "@/lib/i18n/browser";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";

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

function scorePassword(value: string) {
  if (!value) return 0;

  let score = 0;

  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;

  return Math.min(4, score);
}

const PW_LABELS_BG = ["Въведи парола", "Слаба", "Добра", "Силна", "Много силна"];
const PW_LABELS_EN = ["Enter password", "Weak", "Good", "Strong", "Very strong"];

const COPY = {
  bg: {
    eyebrow: "14 дни Pro · без карта",
    title: (
      <>
        Създай акаунт за <em>под минута</em>.
      </>
    ),
    subtitle:
      "Ще те преведем през настройката на меню и таблет след това — под 30 минути общо.",
    back: "Назад към сайта",
    emailLabel: "Имейл за вход",
    passwordLabel: "Парола",
    passwordPlaceholder: "Поне 8 символа",
    confirmPasswordLabel: "Потвърди паролата",
    confirmPasswordPlaceholder: "Повтори паролата",
    termsLead: "Приемам ",
    termsLink: "Условията за ползване",
    privacyLink: "Политиката за поверителност",
    newsletter:
      "Изпращайте ми ежемесечни съвети за ресторантьори. Без спам, лесен отказ.",
    submit: "Създай акаунт — започни 14 дни Pro →",
    submitting: "Създаваме акаунта...",
    continueWithGoogle: "Продължи с Google",
    alreadyHaveAccount: "Влез тук →",
    alreadyHaveAccountSuffix: "ако вече имаш акаунт.",
    passwordsMatch: "✓ Паролите съвпадат",
    passwordsMismatch: "Паролите не съвпадат",
    noSessionError:
      "Акаунтът беше създаден, но няма активна сесия. Провери дали Email confirmation е изключен в Supabase.",
    duplicateEmailError: "Този имейл вече има акаунт.",
    genericError: "Не успяхме да създадем акаунт. Опитай пак.",
    builtInBulgaria: "Построено в България"
  },
  en: {
    eyebrow: "14 days Pro · no card",
    title: (
      <>
        Create an account in <em>under a minute</em>.
      </>
    ),
    subtitle:
      "We’ll walk you through menu and tablet setup afterwards — under 30 minutes total.",
    back: "Back to site",
    emailLabel: "Login email",
    passwordLabel: "Password",
    passwordPlaceholder: "At least 8 characters",
    confirmPasswordLabel: "Confirm password",
    confirmPasswordPlaceholder: "Repeat password",
    termsLead: "I accept the ",
    termsLink: "Terms of Service",
    privacyLink: "Privacy Policy",
    newsletter: "Send me monthly restaurant tips. No spam, easy to unsubscribe.",
    submit: "Create account — start 14 days Pro →",
    submitting: "Creating your account...",
    continueWithGoogle: "Continue with Google",
    alreadyHaveAccount: "Sign in →",
    alreadyHaveAccountSuffix: "if you already have an account.",
    passwordsMatch: "✓ Passwords match",
    passwordsMismatch: "Passwords do not match",
    noSessionError:
      "The account was created, but there is no active session. Check that Email confirmation is disabled in Supabase.",
    duplicateEmailError: "This email already has an account.",
    genericError: "We couldn’t create your account. Please try again.",
    builtInBulgaria: "Built in Bulgaria"
  }
} as const;

function getSignupErrorMessage(message: string, locale: Locale) {
  const normalized = message.toLowerCase();

  if (normalized.includes("user already registered")) {
    return COPY[locale].duplicateEmailError;
  }

  return COPY[locale].genericError;
}

export default function RegisterPage() {
  const router = useRouter();
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [lang, setLang] = useState<Locale>("bg");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const copy = COPY[lang];
  const password = watch("password") ?? "";
  const confirmPassword = watch("confirmPassword") ?? "";
  const passwordScore = scorePassword(password);
  const passwordLabels = lang === "bg" ? PW_LABELS_BG : PW_LABELS_EN;
  const passwordStrengthClasses = [
    "",
    styles.strengthWeak,
    styles.strengthFair,
    styles.strengthStrong,
    styles.strengthStrong,
  ];
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;
  const passwordsMismatch =
    confirmPassword.length > 0 && confirmPassword !== password;

  const onSubmit = handleSubmit(async (values) => {
    persistLocale(lang);

    const { data, error } = await supabase.auth.signUp({
      email: values.email.trim(),
      password: values.password,
      options: {
        data: {
          language: lang,
        },
      },
    });

    if (error) {
      setError("root", {
        message: getSignupErrorMessage(error.message, lang),
      });
      return;
    }

    if (!data.session) {
      setError("root", {
        message: copy.noSessionError,
      });
      return;
    }

    router.replace("/dashboard/onboarding");
    router.refresh();
  });

  const toggleLanguage = (nextLanguage: Locale) => {
    setLang(nextLanguage);
    persistLocale(nextLanguage);
  };

  return (
    <div className={styles.root}>
      <div className={styles.left}>
        <div className={styles.topbar}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}><span>h</span></span>
            HaresvaMi
          </Link>
          <Link href="/" className={styles.back}>← {copy.back}</Link>
        </div>

        <div className={styles.formWrap}>
          <div className={styles.eyebrow}>{copy.eyebrow}</div>
          <h1>{copy.title}</h1>
          <p className={styles.sub}>{copy.subtitle}</p>

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
                <div className={styles.hint} style={{ color: "var(--bad)" }}>
                  {errors.email.message}
                </div>
              ) : null}
            </div>

            <div className={`${styles.field} ${errors.password ? styles.fieldError : ""}`}>
              <label htmlFor="password">{copy.passwordLabel}</label>
              <div className={styles.pwWrap}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={copy.passwordPlaceholder}
                  aria-invalid={Boolean(errors.password)}
                  {...register("password")}
                />
                <button
                  type="button"
                  className={styles.pwToggle}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? (lang === "bg" ? "Скрий" : "Hide") : (lang === "bg" ? "Покажи" : "Show")}
                </button>
              </div>
              <div className={styles.pwMeter} aria-hidden="true">
                {[0, 1, 2, 3].map((segment) => (
                  <i
                    key={segment}
                    className={segment < passwordScore ? passwordStrengthClasses[passwordScore] : ""}
                  />
                ))}
              </div>
              <div className={styles.pwLabel}>{passwordLabels[passwordScore]}</div>
              {errors.password?.message ? (
                <div className={styles.hint} style={{ color: "var(--bad)" }}>
                  {errors.password.message}
                </div>
              ) : null}
            </div>

            <div
              className={`${styles.field} ${errors.confirmPassword ? styles.fieldError : ""}`}
            >
              <label htmlFor="confirmPassword">{copy.confirmPasswordLabel}</label>
              <div className={styles.pwWrap}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={copy.confirmPasswordPlaceholder}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  className={styles.pwToggle}
                  onClick={() => setShowConfirmPassword((current) => !current)}
                >
                  {showConfirmPassword
                    ? (lang === "bg" ? "Скрий" : "Hide")
                    : (lang === "bg" ? "Покажи" : "Show")}
                </button>
              </div>
              {passwordsMatch && !errors.confirmPassword ? (
                <div className={styles.hint} style={{ color: "var(--good)" }}>
                  {copy.passwordsMatch}
                </div>
              ) : null}
              {errors.confirmPassword?.message || passwordsMismatch ? (
                <div className={styles.hint} style={{ color: "var(--bad)" }}>
                  {errors.confirmPassword?.message ?? copy.passwordsMismatch}
                </div>
              ) : null}
            </div>

            <label className={`${styles.check} ${errors.acceptTerms ? styles.checkError : ""}`}>
              <input type="checkbox" {...register("acceptTerms")} />
              <span>
                {copy.termsLead}
                <a href="#">{copy.termsLink}</a>
                {lang === "bg" ? " и " : " and "}
                <a href="#">{copy.privacyLink}</a>.
              </span>
            </label>
            {errors.acceptTerms?.message ? (
              <div className={styles.hint} style={{ color: "var(--bad)" }}>
                {errors.acceptTerms.message}
              </div>
            ) : null}

            <label className={styles.check}>
              <input type="checkbox" />
              <span>{copy.newsletter}</span>
            </label>

            <button type="submit" className={styles.submit} disabled={isSubmitting}>
              {isSubmitting ? copy.submitting : copy.submit}
            </button>

            {errors.root?.message ? (
              <div className={styles.formError}>{errors.root.message}</div>
            ) : null}

            <div className={styles.divider}>{lang === "bg" ? "или" : "or"}</div>

            <button type="button" className={styles.gbtn}>
              <GoogleIcon />
              {copy.continueWithGoogle}
            </button>
          </form>

          <p className={styles.footAlt}>
            <Link href="/login">{copy.alreadyHaveAccount}</Link>{" "}
            {copy.alreadyHaveAccountSuffix}
          </p>
        </div>

        <div className={styles.leftFoot}>
          <div className={styles.lang}>
            <button
              type="button"
              className={`${styles.langBtn} ${lang === "bg" ? styles.langBtnActive : ""}`}
              onClick={() => toggleLanguage("bg")}
            >BG</button>
            <span style={{ color: "var(--ink-mute)" }}>/</span>
            <button
              type="button"
              className={`${styles.langBtn} ${lang === "en" ? styles.langBtnActive : ""}`}
              onClick={() => toggleLanguage("en")}
            >EN</button>
          </div>
          {" "}· © 2026 HaresvaMi · {copy.builtInBulgaria}
        </div>
      </div>

      <aside className={styles.right}>
        <div>
          <div className={styles.quote}>
            Престани да гадаеш кое ястие харесват.
            Започни да <em style={{ color: "var(--accent)", fontStyle: "italic" }}>знаеш</em>.
          </div>
          <div className={styles.quoteCite}>— HaresvaMi за български механи</div>
        </div>

        <div className={styles.scene}>
          <div className={styles.sceneInner}>
            <div className={styles.tableSurface} />

            <div className={styles.metricCard}>
              <div className={styles.metricK}>Response rate</div>
              <div className={styles.metricN}>30<em>%+</em></div>
            </div>

            <div className={styles.receipt}>
              <div className={styles.receiptHead}>МЕХАНА КЪЩАТА</div>
              <div className={styles.receiptRow}><span>Шопска</span><span>8.90</span></div>
              <div className={styles.receiptRow}><span>Кебапче ×2</span><span>7.80</span></div>
              <div className={styles.receiptRow}><span>PK</span><span>4.50</span></div>
              <div className={styles.receiptRow}><span>Ракия 50</span><span>6.00</span></div>
              <hr />
              <div className={styles.receiptRow}><b>СУМА</b><b>27.20</b></div>
            </div>

            <div className={styles.tablet}>
              <div className={styles.tabletScreen}>
                <div className={styles.tsStatus}><span>19:42</span><span>HaresvaMi</span></div>
                <div className={styles.tsBody}>
                  <div className={styles.tsQ}>Какво поръча днес?</div>
                  {[
                    { name: "Шопска салата", score: 9 },
                    { name: "Кебапче", score: 5 },
                    { name: "Пържени картофи", score: 7 },
                  ].map((dish) => (
                    <div key={dish.name} className={styles.tsDish}>
                      <b>{dish.name}</b>
                      <div className={styles.tsScale}>
                        {Array.from({ length: 10 }, (_, index) => (
                          <i key={index} className={index < dish.score ? styles.on : ""} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightFoot}>
          <div className={styles.pips}>
            <span className={styles.pip}>{lang === "bg" ? "Без карта" : "No card"}</span>
            <span className={styles.pip}>{lang === "bg" ? "Без договор" : "No contract"}</span>
            <span className={styles.pip}>{lang === "bg" ? "30 мин. настройка" : "30 min setup"}</span>
          </div>
          <div>v1.0</div>
        </div>
      </aside>
    </div>
  );
}
