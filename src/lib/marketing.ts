export const NAV_LINKS = [
  { label: "Programs", href: "/#programs" },
  { label: "Practice", href: "/#practice" },
  { label: "Resources", href: "/#features" },
  { label: "About", href: "/#faq" },
  { label: "Pricing", href: "/#cta" },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: "About",
    links: [
      { label: "About Savadli", href: "/approach" },
      { label: "Our approach", href: "/approach" },
      { label: "Teachers", href: "/contact" },
    ],
  },
  {
    title: "Programs",
    links: [
      { label: "IELTS", href: "/programs#ielts" },
      { label: "Digital SAT", href: "/programs#digital-sat" },
      { label: "General English", href: "/programs#general-english" },
      { label: "Pricing", href: "/#cta" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Practice exams", href: "/#features" },
      { label: "FAQ", href: "/#faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help center", href: "/contact" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/contact" },
      { label: "Terms", href: "/contact" },
    ],
  },
] as const;

export const STATS = [
  { value: "500+", label: "Students" },
  { value: "25+", label: "Teachers" },
  { value: "1,200+", label: "Lessons & tasks" },
  { value: "94%", label: "Improved confidence" },
] as const;

export const FAQ_ITEMS = [
  {
    question: "Who is Savadli for?",
    answer:
      "High school students, university applicants, and adults preparing for IELTS, Digital SAT, or general English improvement.",
  },
  {
    question: "Do I need a teacher to use Savadli?",
    answer:
      "Many features support self-study. Teacher feedback and class assignments require enrollment through a Savadli instructor or center.",
  },
  {
    question: "Are the practice exams realistic?",
    answer:
      "Yes — timed sections, question types, and interfaces modeled after official IELTS and Digital SAT formats.",
  },
  {
    question: "How is Digital SAT practice different from PDFs?",
    answer:
      "You practice in a Bluebook-style environment with module timing, on-screen tools, and score breakdowns.",
  },
  {
    question: "What devices are supported?",
    answer:
      "Desktop and laptop are recommended for full exams. Homework and lessons work on tablet and mobile.",
  },
  {
    question: "How do I get started?",
    answer:
      "Create an account or ask your teacher for an invite link. You can also book a consultation from our contact page.",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "The mock exams felt like the real thing. I knew exactly what to expect on test day.",
    name: "Aysel M.",
    meta: "IELTS · Band 7.5",
    initials: "AM",
  },
  {
    quote:
      "I finally understood my weak topics from the analytics — not just my overall score.",
    name: "Murad K.",
    meta: "Digital SAT · 1410",
    initials: "MK",
  },
  {
    quote: "It's calm. No distractions. I could sit for two hours and actually focus.",
    name: "Leyla H.",
    meta: "General English",
    initials: "LH",
  },
] as const;
