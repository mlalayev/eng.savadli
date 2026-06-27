import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { PricingPage } from "@/components/marketing/PricingPage";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: `Simple, transparent pricing for IELTS, Digital SAT, and General English at ${siteConfig.name}. Free, Standard, and Premium plans.`,
};

export default function PricingRoute() {
  return (
    <>
      <PricingPage />
      <Footer />
    </>
  );
}
