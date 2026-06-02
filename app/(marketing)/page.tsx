"use client";

import { useEffect, useRef, useState } from "react";

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

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("bg");
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const howRef = useRef<HTMLElement>(null);
  const copy = I18N[lang];

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
        const timer = window.setInterval(() => {
          idx = (idx + 1) % 5;
          setActiveStep(idx);
        }, 2600);
        return () => window.clearInterval(timer);
      },
      { threshold: 0.35 },
    );
    io.observe(section);

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <div className={styles.root}>
      <LandingNav
        copy={copy}
        lang={lang}
        scrolled={scrolled}
        onLanguageChange={setLang}
      />
      <LandingHero copy={copy} />
      <ProblemSection copy={copy} />
      <HowSection
        activeStep={activeStep}
        copy={copy}
        sectionRef={howRef}
        onStepChange={setActiveStep}
      />
      <DashboardPreview copy={copy} />
      <PricingSection copy={copy} />
      <FaqSection />
      <FinalCta copy={copy} />
      <MarketingFooter />
    </div>
  );
}
