import { cookies } from "next/headers";

import { DashboardPreview } from "./_components/DashboardPreview";
import { FaqSection } from "./_components/FaqSection";
import { FinalCta } from "./_components/FinalCta";
import { HowSection } from "./_components/HowSection";
import { LandingHero } from "./_components/LandingHero";
import { LandingNav } from "./_components/LandingNav";
import { MarketingFooter } from "./_components/MarketingFooter";
import { PricingSection } from "./_components/PricingSection";
import { ProblemSection } from "./_components/ProblemSection";
import { I18N, type Lang } from "./landing-copy";
import styles from "./page.module.css";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const lang: Lang =
    cookieStore.get("landing-lang")?.value === "en" ? "en" : "bg";
  const copy = I18N[lang];

  return (
    <div className={styles.root}>
      <LandingNav copy={copy} lang={lang} />
      <LandingHero copy={copy} />
      <ProblemSection copy={copy} />
      <HowSection copy={copy} />
      <DashboardPreview copy={copy} />
      <PricingSection copy={copy} />
      <FaqSection copy={copy} />
      <FinalCta copy={copy} />
      <MarketingFooter />
    </div>
  );
}
