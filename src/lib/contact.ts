/** Copy for the contact page — edit freely */
export const CONTACT_CHECKLIST: readonly { title: string; text: string }[] = [
  {
    title: "Your goal",
    text: "Exam name and target score, school milestone, or the skill you want to improve first.",
  },
  {
    title: "Your timeline",
    text: "Test date, application deadline, or how many weeks you want to commit to lessons.",
  },
  {
    title: "Your level",
    text: "Recent scores, self-assessment, or a sample of writing/speaking you are proud or unsure of.",
  },
] as const;

export const CONTACT_FAQ: readonly { q: string; a: string }[] = [
  {
    q: "Do you offer a trial or consultation?",
    a: "Yes — the first step is a short conversation to align on goals and schedule before we lock a plan.",
  },
  {
    q: "Are lessons online only?",
    a: "Sessions are online unless we agree otherwise. Time zones can usually be accommodated.",
  },
  {
    q: "How soon will you reply?",
    a: "Typically within one to two business days. If you are close to a deadline, say so in the subject line.",
  },
] as const;
