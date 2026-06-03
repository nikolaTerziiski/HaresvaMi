import type { LandingCopy } from "../landing-copy";
import styles from "../page.module.css";

type FaqSectionProps = {
  copy: LandingCopy;
};

export function FaqSection({ copy }: FaqSectionProps) {
  return (
    <section className={styles.objections} id="faq">
      <div className={styles.wrap}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionIndex}>05 / Отговори</div>
          <h2 className={styles.sectionTitle}>{copy.faqTitle}</h2>
        </div>
        <div className={styles.objGrid}>
          {copy.faq.map((item) => (
            <div key={item.q} className={styles.objItem}>
              <h3 className={styles.objQ}>{item.q}</h3>
              <p className={styles.objA}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
