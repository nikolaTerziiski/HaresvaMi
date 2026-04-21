import Hero from "@/components/marketing/Hero";
import HowItWorks from "@/components/marketing/HowItWorks";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import PricingTeaser from "@/components/marketing/PricingTeaser";
import WhyPerItem from "@/components/marketing/WhyPerItem";

export default function MarketingHome() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <WhyPerItem />
      <PricingTeaser />
      <MarketingFooter />
    </>
  );
}
