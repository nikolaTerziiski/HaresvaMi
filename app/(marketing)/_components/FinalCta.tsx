import type { LandingCopy } from "../landing-copy";
import styles from "../page.module.css";
import { MarketingButton } from "./MarketingButton";

type FinalCtaProps = {
  copy: LandingCopy;
};

export function FinalCta({ copy }: FinalCtaProps) {
  const ctaStyle = { padding: "16px 28px", fontSize: 16 };

  return (
    <section className={styles.final} id="signup">
      <div className={styles.wrap}>
        <h2>{copy.finalTitle}</h2>
        <p>{copy.finalSub}</p>
        <div className={styles.heroCta}>
          <MarketingButton href="/register" variant="primary" style={ctaStyle}>
            Започни безплатно →
          </MarketingButton>
          <MarketingButton href="#" variant="ghost" style={ctaStyle}>
            Виж демо видео
          </MarketingButton>
        </div>
        <p className={styles.finalNote}>
          · Без карта · Без договор · 30-минутна настройка · Поддръжка на
          български ·
        </p>
      </div>
    </section>
  );
}
