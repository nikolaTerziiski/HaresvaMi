"use client";

import Link from "next/link";

import type { LandingCopy, Lang } from "../landing-copy";
import navStyles from "./LandingNav.module.css";
import styles from "../page.module.css";
import { MarketingButton } from "./MarketingButton";

type LandingNavProps = {
  copy: LandingCopy;
  lang: Lang;
  scrolled: boolean;
  onLanguageChange: (lang: Lang) => void;
};

export function LandingNav({
  copy,
  lang,
  scrolled,
  onLanguageChange,
}: LandingNavProps) {
  return (
    <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
      <div className={`${styles.wrap} ${styles.navInner}`}>
        <a href="#" className={styles.brand}>
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
          <div className={styles.lang} role="group">
            <button
              className={`${styles.langBtn} ${lang === "bg" ? styles.langBtnActive : ""}`}
              onClick={() => onLanguageChange("bg")}
            >
              BG
            </button>
            <button
              className={`${styles.langBtn} ${lang === "en" ? styles.langBtnActive : ""}`}
              onClick={() => onLanguageChange("en")}
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
