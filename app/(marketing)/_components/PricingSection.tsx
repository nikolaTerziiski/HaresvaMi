import type { LandingCopy } from "../landing-copy";
import styles from "../page.module.css";
import { MarketingButton } from "./MarketingButton";

type PricingSectionProps = {
  copy: LandingCopy;
};

export function PricingSection({ copy }: PricingSectionProps) {
  return (
    <section className={styles.pricing} id="pricing">
      <div className={styles.wrap}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionIndex}>04 / Цена</div>
          <h2 className={styles.sectionTitle}>{copy.prTitle}</h2>
        </div>
        <div className={styles.priceGrid}>
          <PriceCard
            tier="Безплатен"
            subtitle="Завинаги. За един ресторант."
            price="€0"
            features={[
              "1 локация",
              "Ръчно избиране на ястия",
              "До 50 отзива / месец",
              "Базово табло",
              "Български интерфейс",
            ]}
            action="Започни безплатно"
          />
          <PriceCard
            tier="Стартер"
            subtitle="За растящи ресторанти."
            price="—"
            features={[
              "1 локация",
              <span key="ai">
                <b>AI сканиране на бон</b> — 150 / месец
              </span>,
              "500 отзива / месец",
              "Базово табло",
              "Български интерфейс",
            ]}
            action="Започни безплатно"
          />
          <PriceCard
            featured
            tier="Pro"
            subtitle="За сериозни ресторантьори. 14 дни безплатно."
            price="€10"
            features={[
              "1 локация",
              <span key="ai">
                <b>AI сканиране на бон</b> — 1000 / месец
              </span>,
              "10000 отзива / месец",
              "Тенденции по ястие",
              "Седмични сигнали на прост български",
              "BG + EN интерфейс за клиента",
              "Push известия",
            ]}
            action="Пробвай 14 дни безплатно →"
            actionVariant="primary"
          />
        </div>
        <p className={styles.pricingNote}>
          Всички цени са без ДДС. Можеш да отмениш по всяко време. Данните ти
          остават твои, експорт в CSV с един клик.
        </p>
      </div>
    </section>
  );
}

function PriceCard({
  action,
  actionVariant = "ghost",
  featured = false,
  features,
  price,
  subtitle,
  tier,
}: {
  action: string;
  actionVariant?: "primary" | "ghost";
  featured?: boolean;
  features: Array<React.ReactNode>;
  price: string;
  subtitle: string;
  tier: string;
}) {
  return (
    <div
      className={`${styles.priceCard} ${featured ? styles.priceCardFeatured : ""}`}
    >
      {featured ? <span className={styles.priceTag}>Препоръчано</span> : null}
      <h3 className={styles.pcTier}>{tier}</h3>
      <p className={styles.pcSub}>{subtitle}</p>
      <div className={styles.pcN}>
        {price}
        <em>/месец</em>
      </div>
      <ul className={styles.pcFeat}>
        {features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
      <MarketingButton href="/register" variant={actionVariant}>
        {action}
      </MarketingButton>
    </div>
  );
}
