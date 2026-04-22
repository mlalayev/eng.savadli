import { redirect } from "next/navigation";

/** Legacy route — use /dashboard/lessons */
export default function LearningPage() {
  redirect("/dashboard/lessons");
}
