import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { PracticePage } from "@/components/marketing/PracticePage";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Practice",
  description: `IELTS, Digital SAT, and General English practice at ${siteConfig.name}. Timed exams, auto scoring, teacher feedback, and progress analytics.`,
};

export default function PracticeRoute() {
  return (
    <>
      <PracticePage />
      <Footer />
    </>
  );
}
