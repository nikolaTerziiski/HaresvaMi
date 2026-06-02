"use client";

import type { RefObject } from "react";

import type { LandingCopy } from "../landing-copy";
import styles from "../page.module.css";

type HowSectionProps = {
  activeStep: number;
  copy: LandingCopy;
  sectionRef: RefObject<HTMLElement | null>;
  onStepChange: (step: number) => void;
};

export function HowSection({
  activeStep,
  copy,
  sectionRef,
  onStepChange,
}: HowSectionProps) {
  return (
    <section className={styles.how} id="how" ref={sectionRef}>
      <div className={styles.wrap}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionIndex}>02 / Как работи</div>
          <h2 className={styles.sectionTitle}>{copy.howTitle}</h2>
        </div>
        <div className={styles.howStage}>
          <div className={styles.howSteps}>
            {copy.steps.map((step, i) => (
              <div
                key={i}
                className={`${styles.howStep} ${activeStep === i ? styles.howStepActive : ""}`}
                onClick={() => onStepChange(i)}
              >
                <div className={styles.howStepNum}>{step.n}</div>
                <h3>{step.t}</h3>
                <p>{step.p}</p>
              </div>
            ))}
          </div>

          <HowVisual activeStep={activeStep} />
        </div>
      </div>
    </section>
  );
}

function HowVisual({ activeStep }: { activeStep: number }) {
  return (
    <div className={styles.howVisual}>
      <div className={styles.tabletBig}>
        <div className={styles.screenStack}>
          <StandbyScreen active={activeStep === 0} />
          <ScanningScreen active={activeStep === 1} />
          <RateScreen active={activeStep === 2} />
          <FinalHeartScreen active={activeStep === 3} />
          <ThanksScreen active={activeStep === 4} />
        </div>
      </div>

      <div className={styles.howRail}>
        {[0, 1, 2, 3, 4].map((step) => (
          <i
            key={step}
            className={activeStep === step ? styles.howRailOn : ""}
          />
        ))}
      </div>
    </div>
  );
}

function StandbyScreen({ active }: { active: boolean }) {
  return (
    <div className={`${styles.screen} ${active ? styles.screenOn : ""}`}>
      <div className={styles.scStatus}>
        <span>19:42</span>
        <span>HaresvaMi · Kiosk</span>
      </div>
      <div className={`${styles.scBody} ${styles.scStandby}`}>
        <div className={styles.logoBig}>h</div>
        <h4>Добре дошли</h4>
        <p>Натисни, за да сканираш бон</p>
        <button className={styles.scanBtn}>Сканирай бон →</button>
      </div>
    </div>
  );
}

function ScanningScreen({ active }: { active: boolean }) {
  return (
    <div className={`${styles.screen} ${active ? styles.screenOn : ""}`}>
      <div className={styles.scStatus}>
        <span>19:42</span>
        <span>Сканиране...</span>
      </div>
      <div className={`${styles.scBody} ${styles.scScan}`}>
        <div className={styles.viewfinder}>
          <span className={styles.viewfinderCorners} />
          <div className={styles.miniReceipt}>
            <div style={{ textAlign: "center", fontWeight: 600 }}>МЕХАНА</div>
            {[
              ["Шопска", "8.90"],
              ["Кеб x2", "7.80"],
              ["PK", "4.50"],
            ].map(([name, price]) => (
              <div
                key={name}
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span>{name}</span>
                <span>{price}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px dashed #ccc", margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b>СУМА</b>
              <b>27.20</b>
            </div>
          </div>
          <div className={styles.scanLaser} />
        </div>
        <div className={styles.scScanLabel}>Разпознавам ястия...</div>
      </div>
    </div>
  );
}

function RateScreen({ active }: { active: boolean }) {
  return (
    <div className={`${styles.screen} ${active ? styles.screenOn : ""}`}>
      <div className={styles.scStatus}>
        <span>19:42</span>
        <span>1 / 2</span>
      </div>
      <div className={`${styles.scBody} ${styles.scRate}`}>
        <h4>Какво поръча днес?</h4>
        {[
          { name: "Шопска салата", score: 5 },
          { name: "Кебапче ×2", score: 3 },
          { name: "Пържени картофи", score: 4 },
        ].map((dish) => (
          <div key={dish.name} className={styles.rateRow}>
            <div className={styles.rateRowTop}>
              <b>{dish.name}</b>
              <span>{dish.score} / 5</span>
            </div>
            <div className={styles.rateBar}>
              {Array.from({ length: 5 }, (_, i) => (
                <i key={i} className={i < dish.score ? styles.on : ""} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinalHeartScreen({ active }: { active: boolean }) {
  return (
    <div className={`${styles.screen} ${active ? styles.screenOn : ""}`}>
      <div className={styles.scStatus}>
        <span>19:42</span>
        <span>Финал</span>
      </div>
      <div className={`${styles.scBody} ${styles.scFinal}`}>
        <h4>Общо впечатление?</h4>
        <p style={{ fontSize: 12, color: "var(--ink-mute)", margin: 0 }}>
          Избери с един тап
        </p>
        <div className={styles.heartRow}>
          <button className={`${styles.heartBtn} ${styles.heartBtnMeh}`}>
            Не ми харесва
          </button>
          <button className={`${styles.heartBtn} ${styles.heartBtnLove}`}>
            ❤ Харесва ми
          </button>
        </div>
      </div>
    </div>
  );
}

function ThanksScreen({ active }: { active: boolean }) {
  return (
    <div className={`${styles.screen} ${active ? styles.screenOn : ""}`}>
      <div className={styles.scStatus}>
        <span>19:42</span>
        <span>Край</span>
      </div>
      <div className={`${styles.scBody} ${styles.scThanks}`}>
        <div className={styles.ty}>Благодарим!</div>
        <p>Отзивът ти отиде при собственика. До нови срещи.</p>
      </div>
    </div>
  );
}
