"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { LandingCopy, Lang } from "../landing-copy";
import navStyles from "./LandingNav.module.css";
import styles from "../page.module.css";
import { MarketingButton } from "./MarketingButton";

type LandingNavProps = {
  copy: LandingCopy;
  lang: Lang;
};

export function LandingNav({ copy, lang }: LandingNavProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const selectLang = (next: Lang) => {
    if (next === lang) return;
    document.cookie = `landing-lang=${next};path=/;max-age=31536000;samesite=lax`;
    router.refresh();
  };

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
      <div className={`${styles.wrap} ${styles.navInner}`}>
        <a href="/" className={styles.brand}>
          <span className={styles.brandMark}>
            <span>h</span>
          </span>
          HaresvaMi
        </a>
        <div className={styles.navLinks}>
          <a href="#problem">{copy.navProblem}</a>
          <a href="#how">{copy.navHow}</a>
          <a href="#dashboard">{copy.navDash}</a>
          <a href="#pricing">{copy.navPricing}</a>
          <a href="#faq">{copy.navFaq}</a>
        </div>
        <div className={styles.navRight}>
          <div
            className={styles.lang}
            role="group"
            aria-label="Език / Language"
          >
            <button
              type="button"
              aria-pressed={lang === "bg"}
              className={`${styles.langBtn} ${lang === "bg" ? styles.langBtnActive : ""}`}
              onClick={() => selectLang("bg")}
            >
              BG
            </button>
            <button
              type="button"
              aria-pressed={lang === "en"}
              className={`${styles.langBtn} ${lang === "en" ? styles.langBtnActive : ""}`}
              onClick={() => selectLang("en")}
            >
              EN
            </button>
          </div>
          <Link href="/login" className={styles.navSignin}>
            Вход
          </Link>
          <MarketingButton
            href="/register"
            variant="primary"
            className={navStyles.navCta}
          >
            {copy.ctaStart}
          </MarketingButton>
        </div>
      </div>
    </nav>
  );
}
