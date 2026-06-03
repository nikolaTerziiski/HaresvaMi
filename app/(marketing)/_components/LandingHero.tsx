import type { LandingCopy } from "../landing-copy";
import heroStyles from "./LandingHero.module.css";
import styles from "../page.module.css";
import { MarketingButton } from "./MarketingButton";

type LandingHeroProps = {
  copy: LandingCopy;
};

export function LandingHero({ copy }: LandingHeroProps) {
  return (
    <header className={styles.hero}>
      <div className={`${styles.wrap} ${styles.heroGrid}`}>
        <div className={heroStyles.heroCopy}>
          <div className={styles.eyebrow}>{copy.eyebrow}</div>
          <h1 className={styles.heroTitle}>{copy.heroTitle}</h1>
          <p className={`${styles.heroSub} ${heroStyles.mobileHeroSub}`}>
            {copy.heroSub}
          </p>
          <div className={styles.heroCta}>
            <MarketingButton href="/register" variant="primary">
              {copy.ctaTrial}
            </MarketingButton>
            <MarketingButton href="#how" variant="ghost">
              {copy.ctaHow}
            </MarketingButton>
          </div>
          <HeroStats copy={copy} />
        </div>

        <HeroVisual />
      </div>

      <HeroStrip pills={copy.pills} />
    </header>
  );
}

function HeroStats({ copy }: LandingHeroProps) {
  return (
    <div className={`${styles.heroStats} ${heroStyles.mobileStats}`}>
      <div>
        <div className={styles.statN}>
          30
          <em style={{ fontStyle: "italic", color: "var(--accent)" }}>%+</em>
        </div>
        <div className={styles.statL}>{copy.stat1}</div>
      </div>
      <div>
        <div className={styles.statN}>
          2
          <em
            style={{
              fontStyle: "italic",
              color: "var(--ink-mute)",
              fontSize: ".7em",
            }}
          >
            %
          </em>
        </div>
        <div className={styles.statL}>{copy.stat2}</div>
      </div>
      <div>
        <div className={styles.statN}>
          ~30
          <em
            style={{
              fontStyle: "italic",
              color: "var(--ink-mute)",
              fontSize: ".7em",
            }}
          >
            сек
          </em>
        </div>
        <div className={styles.statL}>{copy.stat3}</div>
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className={styles.heroVisual} inert>
      <div className={styles.tableSurface} />
      <div className={styles.receipt}>
        <div className={styles.receiptHead}>МЕХАНА КЪЩАТА</div>
        <div className={styles.receiptRow}>
          <span>Шопска</span>
          <span>8.90</span>
        </div>
        <div className={styles.receiptRow}>
          <span>Кебапче x2</span>
          <span>7.80</span>
        </div>
        <div className={styles.receiptRow}>
          <span>PK</span>
          <span>4.50</span>
        </div>
        <div className={styles.receiptRow}>
          <span>Ракия 50</span>
          <span>6.00</span>
        </div>
        <hr />
        <div className={styles.receiptRow}>
          <b>СУМА</b>
          <b>27.20</b>
        </div>
        <div className={styles.receiptScanLine} />
      </div>
      <div className={styles.tablet}>
        <div className={styles.tabletScreen}>
          <div className={styles.tabletStatus}>
            <span>19:42</span>
            <span>HaresvaMi</span>
            <div className={styles.dots}>
              <i className={styles.dot} />
              <i className={styles.dot} />
              <i className={styles.dot} />
            </div>
          </div>
          <div className={styles.tabletBody}>
            <div className={styles.tabletQ}>Какво поръча днес?</div>
            {[
              { name: "Шопска салата", s: 5 },
              { name: "Кебапче (×2)", s: 3 },
              { name: "Пържени картофи", s: 4 },
            ].map((dish) => (
              <div key={dish.name} className={styles.tabletDish}>
                <b>{dish.name}</b>
                <div className={styles.tabletScale}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <i key={i} className={i < dish.s ? styles.on : ""} />
                  ))}
                </div>
              </div>
            ))}
            <div className={styles.tabletCta}>
              <button className={styles.no}>Не ми харесва</button>
              <button className={styles.yes}>❤ Харесва ми</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroStrip({ pills }: { pills: readonly string[] }) {
  const stripItems = [...pills, ...pills];

  return (
    <div className={styles.wrap}>
      <div className={styles.strip}>
        <div className={styles.stripTrack}>
          {stripItems.map((item, index) => (
            <span key={index}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
