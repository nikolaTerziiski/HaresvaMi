import type { LandingCopy } from "../landing-copy";
import styles from "../page.module.css";

type DashboardPreviewProps = {
  copy: LandingCopy;
};

export function DashboardPreview({ copy }: DashboardPreviewProps) {
  return (
    <section className={styles.dash} id="dashboard">
      <div className={styles.wrap}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionIndex}>03 / Таблото</div>
          <h2 className={styles.sectionTitle}>{copy.dashTitle}</h2>
        </div>
        <div className={styles.dashFrame} inert>
          <DashboardTopbar />
          <div className={styles.dashBody}>
            <DashboardSidebar />
            <DashboardMain />
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardTopbar() {
  return (
    <div className={styles.dashTopbar}>
      <div className={styles.dashDots}>
        <i />
        <i />
        <i />
      </div>
      <span>HaresvaMi · Dashboard</span>
      <div className={styles.dashUrl}>
        haresvami.bg/dashboard/mehana-kashtata
      </div>
    </div>
  );
}

function DashboardSidebar() {
  return (
    <aside className={styles.dashSide}>
      <div className={styles.dwUser}>
        <div className={styles.av}>Д</div>
        <div>
          <b>Механа Къщата</b>
          <span>Пловдив</span>
        </div>
      </div>
      <nav className={styles.dashNav}>
        {["Преглед", "Ястия", "Отзиви", "Меню", "Персонал", "Настройки"].map(
          (item, i) => (
            <a
              key={item}
              href="#"
              style={
                i === 0 ? { background: "#3A2F26", color: "var(--paper)" } : {}
              }
            >
              <i className={styles.navDot} />
              {item}
            </a>
          ),
        )}
      </nav>
    </aside>
  );
}

function DashboardMain() {
  return (
    <div className={styles.dashMain}>
      <div className={styles.dwHead}>
        <div>
          <h3>Добро утро, Дани</h3>
          <p>Ето какво се случи миналата седмица в Механа Къщата.</p>
        </div>
        <div className={styles.dwRange}>
          <button>7 дни</button>
          <button style={{ background: "#3A2F26", color: "var(--paper)" }}>
            30 дни
          </button>
          <button>90 дни</button>
        </div>
      </div>
      <KpiRow />
      <div className={styles.dwSplit}>
        <DishRanking />
        <WeeklySignals />
      </div>
    </div>
  );
}

function KpiRow() {
  const kpis = [
    { label: "Отзиви", number: "284", delta: "↑ 42 vs. предишни 30" },
    { label: "Харесва ми", number: "78%", delta: "↑ 3% vs. предишни 30" },
    { label: "Средна оценка", number: "3.7/5", delta: "— без промяна" },
    { label: "Внимание", number: "2", delta: "ястия падат", bad: true },
  ];

  return (
    <div className={styles.kpiRow}>
      {kpis.map((kpi) => (
        <div key={kpi.label} className={styles.kpi}>
          <div className={styles.kpiL}>{kpi.label}</div>
          <div className={styles.kpiN}>{kpi.number}</div>
          <div className={`${styles.kpiD} ${kpi.bad ? styles.kpiDanger : ""}`}>
            {kpi.delta}
          </div>
        </div>
      ))}
    </div>
  );
}

function DishRanking() {
  const dishes = [
    {
      name: "Шопска салата",
      score: 8.9,
      up: true,
      path: "0,16 15,14 30,12 45,10 60,8 75,6 90,4 100,3",
    },
    {
      name: "Пържени картофи",
      score: 8.2,
      up: true,
      path: "0,12 15,11 30,12 45,10 60,9 75,8 90,7 100,6",
    },
    {
      name: "Свински ребра",
      score: 7.8,
      up: true,
      path: "0,14 15,13 30,11 45,10 60,9 75,10 90,8 100,7",
    },
    {
      name: "Кебапче",
      score: 5.2,
      up: false,
      path: "0,6 15,7 30,9 45,11 60,13 75,15 90,18 100,20",
    },
    {
      name: "Таратор",
      score: 6.1,
      up: false,
      path: "0,10 15,11 30,12 45,12 60,14 75,15 90,16 100,17",
    },
  ];

  return (
    <div className={styles.dwCard}>
      <h5>Най-оценявани ястия</h5>
      <p
        style={{
          fontSize: 12,
          color: "rgba(253,249,241,0.5)",
          margin: "0 0 18px",
          fontFamily: "var(--f-mono)",
        }}
      >
        30-ДНЕВНА ТЕНДЕНЦИЯ
      </p>
      {dishes.map((dish) => (
        <div key={dish.name} className={styles.dishRow}>
          <span className={styles.dishName}>{dish.name}</span>
          <span
            className={`${styles.dishScore} ${
              dish.up ? styles.dishScoreUp : styles.dishScoreDown
            }`}
          >
            {dish.score}
          </span>
          <svg
            className={styles.dishSpark}
            viewBox="0 0 100 24"
            preserveAspectRatio="none"
          >
            <polyline
              fill="none"
              stroke={dish.up ? "#7FC99B" : "#E89A3C"}
              strokeWidth="1.5"
              points={dish.path}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

function WeeklySignals() {
  return (
    <div className={styles.dwCard}>
      <h5>Сигнали за тази седмица</h5>
      <p
        style={{
          fontSize: 12,
          color: "rgba(253,249,241,0.5)",
          margin: "0 0 18px",
          fontFamily: "var(--f-mono)",
        }}
      >
        НА ПРОСТ БЪЛГАРСКИ
      </p>
      <div className={styles.alert}>
        <div className={styles.alK}>⚠ Внимание</div>
        <div className={styles.alT}>
          <b>Кебапчето</b> падна на <b>2.6/5</b> — от 3.6 преди 3 седмици. 14 от
          последните 20 клиента го оценяват под 3.
        </div>
        <a href="#">Виж 8-те коментара →</a>
      </div>
      <div
        className={styles.alert}
        style={{
          borderColor: "rgba(127,201,155,0.35)",
          background:
            "linear-gradient(180deg,rgba(127,201,155,0.07),transparent)",
        }}
      >
        <div className={styles.alK} style={{ color: "#7FC99B" }}>
          ✓ Добра новина
        </div>
        <div className={styles.alT}>
          <b>Новият десерт „Тиквеник"</b> дебютира с <b>4.6/5</b>. 11 отзива. 9
          от тях казват „като на баба".
        </div>
        <a href="#" style={{ color: "#7FC99B" }}>
          Виж отзивите →
        </a>
      </div>
      <div
        className={styles.alert}
        style={{
          borderColor: "rgba(232,154,60,0.2)",
          background:
            "linear-gradient(180deg,rgba(232,154,60,0.04),transparent)",
        }}
      >
        <div className={styles.alK}>i Наблюдение</div>
        <div className={styles.alT}>
          В петък вечер оценките за <b>скарата</b> падат с 0.8 точки. Може би
          готвачът е различен?
        </div>
        <a href="#">Разгледай →</a>
      </div>
    </div>
  );
}
