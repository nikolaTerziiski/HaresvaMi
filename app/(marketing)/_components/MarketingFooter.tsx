"use client";

import styles from "../page.module.css";

export function MarketingFooter() {
  return (
    <footer>
      <div className={`${styles.wrap} ${styles.ftRow}`}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <span>h</span>
          </span>
          HaresvaMi
        </div>
        <div>
          <p style={{ margin: "0 0 4px" }}>
            Построено в България. Направено за български механи.
          </p>
          <p className={styles.ftMeta}>support@haresvami.bg · София · © 2026</p>
        </div>
      </div>
    </footer>
  );
}
