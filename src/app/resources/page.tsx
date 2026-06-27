import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { ResourcesPage } from "@/components/marketing/ResourcesPage";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Resources",
  description: `Study guides, templates, and exam tips for IELTS, Digital SAT, and General English at ${siteConfig.name}.`,
};

export default function ResourcesRoute() {
  return (
    <>
      <ResourcesPage />
      <Footer />
    </>
  );
}
