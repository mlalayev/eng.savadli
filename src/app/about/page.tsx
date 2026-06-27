import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { AboutPage } from "@/components/marketing/AboutPage";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `Learn about ${siteConfig.name} — a modern platform for IELTS, Digital SAT, and General English preparation.`,
};

export default function AboutRoute() {
  return (
    <>
      <AboutPage />
      <Footer />
    </>
  );
}
