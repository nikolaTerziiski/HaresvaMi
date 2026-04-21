"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const I18N = {
  bg: {
    navProblem: "Проблемът", navHow: "Как работи", navDash: "Табло", navPricing: "Цени", navFaq: "Въпроси",
    ctaStart: "Започни безплатно",
    eyebrow: "За български ресторанти · v1.0",
    heroTitle: <>Разбери <em>кое ястие</em> харесват и кое — не.</>,
    heroSub: "Сервитьорът сканира бона. AI разпознава ястията. Клиентът оценява всяко едно на таблет, докато още седи на масата. Ти виждаш истината — по ястие, всяка седмица, на телефона си.",
    ctaTrial: "Започни — 14 дни Pro безплатно",
    ctaHow: "Виж как работи →",
    stat1: "Отговори с таблет", stat2: "Отговори с QR код", stat3: "От бон до оценка",
    probTitle: <>В момента <em>летиш на сляпо</em>. Не защото не те е грижа — а защото <em>никой не ти казва</em>.</>,
    prob1t: "QR на касовата", prob1p: "Никой не го сканира. Клиентът излиза, забравя, продължава с деня си.",
    prob2t: "Google reviews", prob2p: "Пишат само мотивираните — обикновено ядосани. Получаваш крайности, не истина.",
    prob3t: '„Всичко наред ли беше?"', prob3p: 'Клиентът казва „да, благодаря" от учтивост. И повече не се връща.',
    prob4t: "POS продажби", prob4p: "Знаеш какво се продава — но не знаеш дали им харесва. Ястие може да се продава добре и да се мрази.",
    probVerdict: <><b>HaresvaMi сваля триенето до нула.</b> Клиентът е още на масата, току-що е платил, още има вкуса в устата. Това е единственият момент, в който ще ти каже истината — без да лъже от учтивост.</>,
    howTitle: <>От бон до оценка за <em>30 секунди</em>.</>,
    steps: [
      { n: "Стъпка 01", t: "Таблет в режим киоск", p: "Слагаш стария таблет на касата. Отваряш HaresvaMi, влизаш в режим киоск веднъж за деня. Сервитьорът не може да излезе случайно." },
      { n: "Стъпка 02", t: "Сервитьорът сканира бона", p: 'Един тап. Камерата снима касовата бележка. AI чете ястията — включително „PK", „кеб", „шоп" — и ги сверява с менюто ти.' },
      { n: "Стъпка 03", t: "Клиентът оценява", p: "Подаваш таблета. Той вижда точно какво е поръчал, дава оценка на всяко ястие от 1 до 10. Без акаунти, без имейли, без приложение." },
      { n: "Стъпка 04", t: "Харесва / Не харесва", p: "Един финален тап за цялостното впечатление. Голям бутон. Невъзможно да бъде сбъркан." },
      { n: "Стъпка 05", t: "Благодарим. Готово.", p: "Таблетът се рестартира в режим готовност. Данните се появяват в таблото ти — в момента, в който са записани." },
    ],
    dashTitle: <>Истината за кухнята ти — на <em>един екран</em>.</>,
    prTitle: <>Една тарифа. Без изненади. <em>Първите 14 дни — Pro безплатно</em>.</>,
    finalTitle: <>Престани <em>да гадаеш</em>.<br />Започни <em>да знаеш</em>.</>,
    finalSub: "14 дни Pro без карта. Ако след това не виждаш стойност — просто не плащаш. Без номера.",
  },
  en: {
    navProblem: "Problem", navHow: "How it works", navDash: "Dashboard", navPricing: "Pricing", navFaq: "FAQ",
    ctaStart: "Start free",
    eyebrow: "For Bulgarian restaurants · v1.0",
    heroTitle: <>Know <em>which dish</em> they love — and which they don&apos;t.</>,
    heroSub: "Your waiter scans the receipt. AI reads the dishes. The customer rates each one on a tablet, while still at the table. You see the truth — per dish, every week, on your phone.",
    ctaTrial: "Start — 14 days Pro free",
    ctaHow: "See how it works →",
    stat1: "Response rate (tablet)", stat2: "Response rate (QR)", stat3: "Receipt → rating",
    probTitle: <>Right now you&apos;re <em>flying blind</em>. Not because you don&apos;t care — because <em>nobody tells you</em>.</>,
    prob1t: "QR on receipts", prob1p: "Nobody scans it. They leave, forget, move on with their day.",
    prob2t: "Google reviews", prob2p: "Only the motivated (usually angry) write. You get extremes, not truth.",
    prob3t: '"Was everything ok?"', prob3p: "They say \"yes, thanks\" out of politeness. Then never return.",
    prob4t: "POS sales", prob4p: "You know what sells — but not if they loved it. A dish can sell well and still be hated.",
    probVerdict: <><b>HaresvaMi cuts friction to zero.</b> The customer is still at the table, just paid, still tasting the food. This is the only moment they&apos;ll tell you the truth — without a polite lie.</>,
    howTitle: <>From receipt to rating in <em>30 seconds</em>.</>,
    steps: [
      { n: "Step 01", t: "Tablet in kiosk mode", p: "Put an old tablet on the counter. Open HaresvaMi, enter kiosk mode once per day. Waiters can't exit by accident." },
      { n: "Step 02", t: "Waiter scans the receipt", p: "One tap. The camera photographs the receipt. AI reads the dishes — including \"PK\", \"keb\", \"shop\" — and matches your menu." },
      { n: "Step 03", t: "Customer rates", p: "You hand the tablet over. They see exactly what they ordered and rate each dish 1–10. No accounts, no emails, no app." },
      { n: "Step 04", t: "Love / don't love", p: "One final tap for the overall feeling. Big button. Impossible to misclick." },
      { n: "Step 05", t: "Thank you. Done.", p: "The tablet resets to standby. Data shows up in your dashboard — the moment it's written." },
    ],
    dashTitle: <>The truth about your kitchen — on <em>one screen</em>.</>,
    prTitle: <>One tariff. No surprises. <em>First 14 days — Pro free</em>.</>,
    finalTitle: <>Stop <em>guessing</em>.<br />Start <em>knowing</em>.</>,
    finalSub: "14 days Pro no card. If you don't see value after — just don't pay. No strings.",
  },
} as const;

type Lang = "bg" | "en";

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("bg");
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const howRef = useRef<HTMLElement>(null);
  const t = I18N[lang];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const section = howRef.current;
    if (!section) return;

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const passed = Math.max(0, Math.min(total, -rect.top));
      const pct = total > 0 ? passed / total : 0;
      setActiveStep(Math.min(4, Math.floor(pct * 5)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        let idx = 0;
        const timer = setInterval(() => {
          idx = (idx + 1) % 5;
          setActiveStep(idx);
        }, 2600);
        return () => clearInterval(timer);
      },
      { threshold: 0.35 }
    );
    io.observe(section);

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <div className={styles.root}>
      {/* ===== NAV ===== */}
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        <div className={`${styles.wrap} ${styles.navInner}`}>
          <a href="#" className={styles.brand}>
            <span className={styles.brandMark}><span>h</span></span>
            HaresvaMi
          </a>
          <div className={styles.navLinks}>
            <a href="#problem">{t.navProblem}</a>
            <a href="#how">{t.navHow}</a>
            <a href="#dashboard">{t.navDash}</a>
            <a href="#pricing">{t.navPricing}</a>
            <a href="#faq">{t.navFaq}</a>
          </div>
          <div className={styles.navRight}>
            <div className={styles.lang} role="group">
              <button className={`${styles.langBtn} ${lang === "bg" ? styles.langBtnActive : ""}`} onClick={() => setLang("bg")}>BG</button>
              <button className={`${styles.langBtn} ${lang === "en" ? styles.langBtnActive : ""}`} onClick={() => setLang("en")}>EN</button>
            </div>
            <Link href="/login" className={styles.navSignin}>Вход</Link>
            <Link href="/register" className={`${styles.btn} ${styles.btnPrimary}`}>{t.ctaStart}</Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <header className={styles.hero}>
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div>
            <div className={styles.eyebrow}>{t.eyebrow}</div>
            <h1 className={styles.heroTitle}>{t.heroTitle}</h1>
            <p className={styles.heroSub}>{t.heroSub}</p>
            <div className={styles.heroCta}>
              <Link href="/register" className={`${styles.btn} ${styles.btnPrimary}`}>{t.ctaTrial}</Link>
              <a href="#how" className={`${styles.btn} ${styles.btnGhost}`}>{t.ctaHow}</a>
            </div>
            <div className={styles.heroStats}>
              <div>
                <div className={styles.statN}>30<em style={{ fontStyle: "italic", color: "var(--accent)" }}>%+</em></div>
                <div className={styles.statL}>{t.stat1}</div>
              </div>
              <div>
                <div className={styles.statN}>2<em style={{ fontStyle: "italic", color: "var(--ink-mute)", fontSize: ".7em" }}>%</em></div>
                <div className={styles.statL}>{t.stat2}</div>
              </div>
              <div>
                <div className={styles.statN}>~30<em style={{ fontStyle: "italic", color: "var(--ink-mute)", fontSize: ".7em" }}>сек</em></div>
                <div className={styles.statL}>{t.stat3}</div>
              </div>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.tableSurface} />
            <div className={styles.receipt}>
              <div className={styles.receiptHead}>МЕХАНА КЪЩАТА</div>
              <div className={styles.receiptRow}><span>Шопска</span><span>8.90</span></div>
              <div className={styles.receiptRow}><span>Кебапче x2</span><span>7.80</span></div>
              <div className={styles.receiptRow}><span>PK</span><span>4.50</span></div>
              <div className={styles.receiptRow}><span>Ракия 50</span><span>6.00</span></div>
              <hr />
              <div className={styles.receiptRow}><b>СУМА</b><b>27.20</b></div>
              <div className={styles.receiptScanLine} />
            </div>
            <div className={styles.tablet}>
              <div className={styles.tabletScreen}>
                <div className={styles.tabletStatus}>
                  <span>19:42</span>
                  <span>HaresvaMi</span>
                  <div className={styles.dots}><i className={styles.dot} /><i className={styles.dot} /><i className={styles.dot} /></div>
                </div>
                <div className={styles.tabletBody}>
                  <div className={styles.tabletQ}>Какво поръча днес?</div>
                  {[{ name: "Шопска салата", s: 9 }, { name: "Кебапче (×2)", s: 5 }, { name: "Пържени картофи", s: 7 }].map((d) => (
                    <div key={d.name} className={styles.tabletDish}>
                      <b>{d.name}</b>
                      <div className={styles.tabletScale}>{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < d.s ? styles.on : ""} />)}</div>
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
        </div>

        <div className={styles.wrap}>
          <div className={styles.strip}>
            <div className={styles.stripTrack}>
              {["Работи с всеки Android таблет", "Инсталация под 30 минути", "Без промяна на POS-а", "Български интерфейс, разбира абревиатури", "Данните остават твои",
                "Работи с всеки Android таблет", "Инсталация под 30 минути", "Без промяна на POS-а", "Български интерфейс, разбира абревиатури", "Данните остават твои"].map((s, i) => (
                <span key={i}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ===== PROBLEM ===== */}
      <section className={styles.problem} id="problem">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionIndex}>01 / Проблем</div>
            <h2 className={styles.sectionTitle}>{t.probTitle}</h2>
          </div>
          <div className={styles.problemGrid}>
            {[
              { icon: "QR", t: t.prob1t, p: t.prob1p, tag: "~2% response" },
              { icon: "★", t: t.prob2t, p: t.prob2p, tag: "bias → extremes" },
              { icon: "?", t: t.prob3t, p: t.prob3p, tag: "polite lies" },
              { icon: "$", t: t.prob4t, p: t.prob4p, tag: "sales ≠ love" },
            ].map((cell) => (
              <div key={cell.icon} className={styles.problemCell}>
                <div className={styles.pcIcon}>{cell.icon}</div>
                <h4>{cell.t}</h4>
                <p>{cell.p}</p>
                <div className={styles.pcTag}>{cell.tag}</div>
              </div>
            ))}
          </div>
          <div className={styles.problemVerdict}>
            <div className={styles.verdictNum}>2<em>%</em></div>
            <div className={styles.verdictArrow} />
            <div className={styles.verdictCopy}>{t.probVerdict}</div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className={styles.how} id="how" ref={howRef}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionIndex}>02 / Как работи</div>
            <h2 className={styles.sectionTitle}>{t.howTitle}</h2>
          </div>
          <div className={styles.howStage}>
            <div className={styles.howSteps}>
              {t.steps.map((step, i) => (
                <div
                  key={i}
                  className={`${styles.howStep} ${activeStep === i ? styles.howStepActive : ""}`}
                  onClick={() => setActiveStep(i)}
                >
                  <div className={styles.howStepNum}>{step.n}</div>
                  <h3>{step.t}</h3>
                  <p>{step.p}</p>
                </div>
              ))}
            </div>

            <div className={styles.howVisual}>
              <div className={styles.tabletBig}>
                <div className={styles.screenStack}>
                  {/* Screen 0: Standby */}
                  <div className={`${styles.screen} ${activeStep === 0 ? styles.screenOn : ""}`}>
                    <div className={styles.scStatus}><span>19:42</span><span>HaresvaMi · Kiosk</span></div>
                    <div className={`${styles.scBody} ${styles.scStandby}`}>
                      <div className={styles.logoBig}>h</div>
                      <h4>Добре дошли</h4>
                      <p>Натисни, за да сканираш бон</p>
                      <button className={styles.scanBtn}>Сканирай бон →</button>
                    </div>
                  </div>

                  {/* Screen 1: Scanning */}
                  <div className={`${styles.screen} ${activeStep === 1 ? styles.screenOn : ""}`}>
                    <div className={styles.scStatus}><span>19:42</span><span>Сканиране...</span></div>
                    <div className={`${styles.scBody} ${styles.scScan}`}>
                      <div className={styles.viewfinder}>
                        <span className={styles.viewfinderCorners} />
                        <div className={styles.miniReceipt}>
                          <div style={{ textAlign: "center", fontWeight: 600 }}>МЕХАНА</div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Шопска</span><span>8.90</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Кеб x2</span><span>7.80</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span>PK</span><span>4.50</span></div>
                          <div style={{ borderTop: "1px dashed #ccc", margin: "4px 0" }} />
                          <div style={{ display: "flex", justifyContent: "space-between" }}><b>СУМА</b><b>27.20</b></div>
                        </div>
                        <div className={styles.scanLaser} />
                      </div>
                      <div className={styles.scScanLabel}>Разпознавам ястия...</div>
                    </div>
                  </div>

                  {/* Screen 2: Rate */}
                  <div className={`${styles.screen} ${activeStep === 2 ? styles.screenOn : ""}`}>
                    <div className={styles.scStatus}><span>19:42</span><span>1 / 2</span></div>
                    <div className={`${styles.scBody} ${styles.scRate}`}>
                      <h4>Какво поръча днес?</h4>
                      {[{ name: "Шопска салата", score: 9 }, { name: "Кебапче ×2", score: 5 }, { name: "Пържени картофи", score: 7 }].map((d) => (
                        <div key={d.name} className={styles.rateRow}>
                          <div className={styles.rateRowTop}><b>{d.name}</b><span>{d.score} / 10</span></div>
                          <div className={styles.rateBar}>{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < d.score ? styles.on : ""} />)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Screen 3: Final heart */}
                  <div className={`${styles.screen} ${activeStep === 3 ? styles.screenOn : ""}`}>
                    <div className={styles.scStatus}><span>19:42</span><span>Финал</span></div>
                    <div className={`${styles.scBody} ${styles.scFinal}`}>
                      <h4>Общо впечатление?</h4>
                      <p style={{ fontSize: 12, color: "var(--ink-mute)", margin: 0 }}>Избери с един тап</p>
                      <div className={styles.heartRow}>
                        <button className={`${styles.heartBtn} ${styles.heartBtnMeh}`}>Не ми харесва</button>
                        <button className={`${styles.heartBtn} ${styles.heartBtnLove}`}>❤ Харесва ми</button>
                      </div>
                    </div>
                  </div>

                  {/* Screen 4: Thanks */}
                  <div className={`${styles.screen} ${activeStep === 4 ? styles.screenOn : ""}`}>
                    <div className={styles.scStatus}><span>19:42</span><span>Край</span></div>
                    <div className={`${styles.scBody} ${styles.scThanks}`}>
                      <div className={styles.ty}>Благодарим!</div>
                      <p>Отзивът ти отиде при собственика. До нови срещи.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.howRail}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <i key={i} className={activeStep === i ? styles.howRailOn : ""} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DASHBOARD ===== */}
      <section className={styles.dash} id="dashboard">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionIndex}>03 / Таблото</div>
            <h2 className={styles.sectionTitle}>{t.dashTitle}</h2>
          </div>
          <div className={styles.dashFrame}>
            <div className={styles.dashTopbar}>
              <div className={styles.dashDots}><i /><i /><i /></div>
              <span>HaresvaMi · Dashboard</span>
              <div className={styles.dashUrl}>haresvami.bg/dashboard/mehana-kashtata</div>
            </div>
            <div className={styles.dashBody}>
              <aside className={styles.dashSide}>
                <div className={styles.dwUser}>
                  <div className={styles.av}>Д</div>
                  <div><b>Механа Къщата</b><span>Пловдив</span></div>
                </div>
                <nav className={styles.dashNav}>
                  {["Преглед", "Ястия", "Отзиви", "Меню", "Персонал", "Настройки"].map((item, i) => (
                    <a key={item} href="#" style={i === 0 ? { background: "#3A2F26", color: "var(--paper)" } : {}}>
                      <i className={styles.navDot} />{item}
                    </a>
                  ))}
                </nav>
              </aside>
              <div className={styles.dashMain}>
                <div className={styles.dwHead}>
                  <div>
                    <h3>Добро утро, Дани</h3>
                    <p>Ето какво се случи миналата седмица в Механа Къщата.</p>
                  </div>
                  <div className={styles.dwRange}>
                    <button>7 дни</button>
                    <button style={{ background: "#3A2F26", color: "var(--paper)" }}>30 дни</button>
                    <button>90 дни</button>
                  </div>
                </div>
                <div className={styles.kpiRow}>
                  {[
                    { l: "Отзиви", n: "284", d: "↑ 42 vs. предишни 30", bad: false },
                    { l: "Харесва ми", n: "78%", d: "↑ 3% vs. предишни 30", bad: false },
                    { l: "Средна оценка", n: "7.4/10", d: "— без промяна", bad: false },
                    { l: "Внимание", n: "2", d: "ястия падат", bad: true },
                  ].map((kpi) => (
                    <div key={kpi.l} className={styles.kpi}>
                      <div className={styles.kpiL}>{kpi.l}</div>
                      <div className={styles.kpiN}>{kpi.n}</div>
                      <div className={`${styles.kpiD} ${kpi.bad ? styles.kpiDanger : ""}`}>{kpi.d}</div>
                    </div>
                  ))}
                </div>
                <div className={styles.dwSplit}>
                  <div className={styles.dwCard}>
                    <h5>Най-оценявани ястия</h5>
                    <p style={{ fontSize: 12, color: "rgba(253,249,241,0.5)", margin: "0 0 18px", fontFamily: "var(--f-mono)" }}>30-ДНЕВНА ТЕНДЕНЦИЯ</p>
                    {[
                      { name: "Шопска салата", score: 8.9, up: true, path: "0,16 15,14 30,12 45,10 60,8 75,6 90,4 100,3" },
                      { name: "Пържени картофи", score: 8.2, up: true, path: "0,12 15,11 30,12 45,10 60,9 75,8 90,7 100,6" },
                      { name: "Свински ребра", score: 7.8, up: true, path: "0,14 15,13 30,11 45,10 60,9 75,10 90,8 100,7" },
                      { name: "Кебапче", score: 5.2, up: false, path: "0,6 15,7 30,9 45,11 60,13 75,15 90,18 100,20" },
                      { name: "Таратор", score: 6.1, up: false, path: "0,10 15,11 30,12 45,12 60,14 75,15 90,16 100,17" },
                    ].map((d) => (
                      <div key={d.name} className={styles.dishRow}>
                        <span className={styles.dishName}>{d.name}</span>
                        <span className={`${styles.dishScore} ${d.up ? styles.dishScoreUp : styles.dishScoreDown}`}>{d.score}</span>
                        <svg className={styles.dishSpark} viewBox="0 0 100 24" preserveAspectRatio="none">
                          <polyline fill="none" stroke={d.up ? "#7FC99B" : "#E89A3C"} strokeWidth="1.5" points={d.path} />
                        </svg>
                      </div>
                    ))}
                  </div>
                  <div className={styles.dwCard}>
                    <h5>Сигнали за тази седмица</h5>
                    <p style={{ fontSize: 12, color: "rgba(253,249,241,0.5)", margin: "0 0 18px", fontFamily: "var(--f-mono)" }}>НА ПРОСТ БЪЛГАРСКИ</p>
                    <div className={styles.alert}>
                      <div className={styles.alK}>⚠ Внимание</div>
                      <div className={styles.alT}><b>Кебапчето</b> падна на <b>5.2/10</b> — от 7.1 преди 3 седмици. 14 от последните 20 клиента го оценяват под 6.</div>
                      <a href="#">Виж 8-те коментара →</a>
                    </div>
                    <div className={styles.alert} style={{ borderColor: "rgba(127,201,155,0.35)", background: "linear-gradient(180deg,rgba(127,201,155,0.07),transparent)" }}>
                      <div className={styles.alK} style={{ color: "#7FC99B" }}>✓ Добра новина</div>
                      <div className={styles.alT}><b>Новият десерт „Тиквеник"</b> дебютира с <b>9.1/10</b>. 11 отзива. 9 от тях казват „като на баба".</div>
                      <a href="#" style={{ color: "#7FC99B" }}>Виж отзивите →</a>
                    </div>
                    <div className={styles.alert} style={{ borderColor: "rgba(232,154,60,0.2)", background: "linear-gradient(180deg,rgba(232,154,60,0.04),transparent)" }}>
                      <div className={styles.alK}>i Наблюдение</div>
                      <div className={styles.alT}>В петък вечер оценките за <b>скарата</b> падат с 0.8 точки. Може би готвачът е различен?</div>
                      <a href="#">Разгледай →</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className={styles.pricing} id="pricing">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionIndex}>04 / Цена</div>
            <h2 className={styles.sectionTitle}>{t.prTitle}</h2>
          </div>
          <div className={styles.priceGrid}>
            <div className={styles.priceCard}>
              <h3 className={styles.pcTier}>Безплатен</h3>
              <p className={styles.pcSub}>Завинаги. За един ресторант.</p>
              <div className={styles.pcN}>€0<em>/месец</em></div>
              <ul className={styles.pcFeat}>
                <li>1 локация</li><li>Ръчно избиране на ястия</li>
                <li>До 50 отзива / месец</li><li>Базово табло</li>
                <li>Български интерфейс</li>
              </ul>
              <Link href="/register" className={`${styles.btn} ${styles.btnGhost}`}>Започни безплатно</Link>
            </div>

            <div className={`${styles.priceCard} ${styles.priceCardFeatured}`}>
              <span className={styles.priceTag}>Препоръчано</span>
              <h3 className={styles.pcTier}>Pro</h3>
              <p className={styles.pcSub}>За сериозни ресторантьори. 14 дни безплатно.</p>
              <div className={styles.pcN}>€10<em>/месец</em></div>
              <ul className={styles.pcFeat}>
                <li>1 локация</li><li><b>AI сканиране на бон</b> — неограничено</li>
                <li>Неограничени отзиви</li><li>Тенденции по ястие</li>
                <li>Седмични сигнали на прост български</li>
                <li>BG + EN интерфейс за клиента</li><li>Push известия</li>
              </ul>
              <Link href="/register" className={`${styles.btn} ${styles.btnPrimary}`}>Пробвай 14 дни безплатно →</Link>
            </div>

            <div className={styles.priceCard}>
              <h3 className={styles.pcTier}>Верига</h3>
              <p className={styles.pcSub}>За 2+ локации. Скоро.</p>
              <div className={styles.pcN}>€40<em>/месец</em></div>
              <ul className={styles.pcFeat}>
                <li>Неограничени локации</li><li>Сравнения между обекти</li>
                <li>Представяне на персонал</li><li>API достъп</li>
                <li>Приоритетна поддръжка</li>
              </ul>
              <a href="#" className={`${styles.btn} ${styles.btnGhost}`}>Напиши ни →</a>
            </div>
          </div>
          <p className={styles.pricingNote}>
            Всички цени са без ДДС. Можеш да отмениш по всяко време. Данните ти остават твои, експорт в CSV с един клик.
          </p>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className={styles.objections} id="faq">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionIndex}>05 / Отговори</div>
            <h2 className={styles.sectionTitle}>Това, което <em>сигурно</em> се питаш.</h2>
          </div>
          <div className={styles.objGrid}>
            {[
              { q: '„Нямам таблет."', a: "Всеки Android таблет от последните 5 години работи. Ако нямаш, стар таблет от 100-120 лв от Ozone също става. Не продаваме хардуер — не искаме да си заключен." },
              { q: '„Сервитьорите ми са заети."', a: "Един тап на касата. Средно 4 секунди допълнително време при плащане. Всеки сервитьор го научава за 90 секунди. Промяна на навика — под седмица." },
              { q: '„Клиентите ще се дразнят."', a: "В реални тестове 7 от 10 клиенти попълват. Защо — защото им отнема 30 секунди, вижда се кое харесват конкретно, и го правят, докато все още чакат рестото." },
              { q: '„Чете ли абревиатури като PK, кеб, шоп?"', a: "Да. И с всяка касова бележка, която сканираш, AI-ят научава твоите абревиатури конкретно. След 20-30 бона — почти 100% точност за твоето меню." },
              { q: '„Не искам да сменям POS-а си."', a: "Не се налага. HaresvaMi работи с печатния бон, който вече принтираш. Не се свързваме с касовия апарат, не трябва интеграция, не сме POS." },
              { q: '„Чий собственост са данните?"', a: "Твои. Напълно. Експорт в CSV по всяко време. Нулеви проблеми с GDPR — клиентът не оставя имейл, телефон или име. Само оценки." },
            ].map((item) => (
              <div key={item.q} className={styles.objItem}>
                <h3 className={styles.objQ}>{item.q}</h3>
                <p className={styles.objA}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className={styles.final} id="signup">
        <div className={styles.wrap}>
          <h2>{t.finalTitle}</h2>
          <p>{t.finalSub}</p>
          <div className={styles.heroCta}>
            <Link href="/register" className={`${styles.btn} ${styles.btnPrimary}`} style={{ padding: "16px 28px", fontSize: 16 }}>Започни безплатно →</Link>
            <a href="#" className={`${styles.btn} ${styles.btnGhost}`} style={{ padding: "16px 28px", fontSize: 16 }}>Виж демо видео</a>
          </div>
          <p className={styles.finalNote}>· Без карта · Без договор · 30-минутна настройка · Поддръжка на български ·</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer>
        <div className={`${styles.wrap} ${styles.ftRow}`}>
          <div className={styles.brand}><span className={styles.brandMark}><span>h</span></span>HaresvaMi</div>
          <div>
            <p style={{ margin: "0 0 4px" }}>Построено в България. Направено за български механи.</p>
            <p className={styles.ftMeta}>support@haresvami.bg · София · © 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
