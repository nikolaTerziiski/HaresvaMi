import type { LandingCopy } from "../landing-copy";
import styles from "../page.module.css";

type ProblemSectionProps = {
  copy: LandingCopy;
};

export function ProblemSection({ copy }: ProblemSectionProps) {
  const cells = [
    { icon: "QR", title: copy.prob1t, body: copy.prob1p, tag: "~2% response" },
    {
      icon: "★",
      title: copy.prob2t,
      body: copy.prob2p,
      tag: "bias → extremes",
    },
    { icon: "?", title: copy.prob3t, body: copy.prob3p, tag: "polite lies" },
    { icon: "$", title: copy.prob4t, body: copy.prob4p, tag: "sales ≠ love" },
  ];

  return (
    <section className={styles.problem} id="problem">
      <div className={styles.wrap}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionIndex}>01 / Проблем</div>
          <h2 className={styles.sectionTitle}>{copy.probTitle}</h2>
        </div>
        <div className={styles.problemGrid}>
          {cells.map((cell) => (
            <div key={cell.icon} className={styles.problemCell}>
              <div className={styles.pcIcon}>{cell.icon}</div>
              <h4>{cell.title}</h4>
              <p>{cell.body}</p>
              <div className={styles.pcTag}>{cell.tag}</div>
            </div>
          ))}
        </div>
        <div className={styles.problemVerdict}>
          <div className={styles.verdictNum}>
            2<em>%</em>
          </div>
          <div className={styles.verdictArrow} />
          <div className={styles.verdictCopy}>{copy.probVerdict}</div>
        </div>
      </div>
    </section>
  );
}
