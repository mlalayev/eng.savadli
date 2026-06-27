import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { ProgramsPage } from "@/components/marketing/ProgramsPage";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Programs",
  description: `IELTS, Digital SAT, and General English programs at ${siteConfig.name}. Structured lessons, practice exams, and teacher feedback.`,
};

export default function ProgramsRoute() {
  return (
    <>
      <ProgramsPage />
      <Footer />
    </>
  );
}
