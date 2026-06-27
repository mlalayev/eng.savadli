export const NAV_LINKS = [
  { label: "Programs", href: "/programs" },
  { label: "Practice", href: "/practice" },
  { label: "Resources", href: "/resources" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: "Company",
    links: [
      { label: "About Savadli", href: "/about" },
      { label: "Our approach", href: "/approach" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Programs",
    links: [
      { label: "IELTS", href: "/programs#ielts" },
      { label: "Digital SAT", href: "/programs#digital-sat" },
      { label: "General English", href: "/programs#general-english" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Practice exams", href: "/#features" },
      { label: "FAQ", href: "/#faq" },
      { label: "Blog", href: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help center", href: "/contact" },
      { label: "Privacy", href: "/contact" },
      { label: "Terms", href: "/contact" },
    ],
  },
] as const;

export const TRUSTED_BY = [
  "ADA University",
  "Baku State University",
  "UNEC",
  "Khazar University",
  "Western Caspian",
] as const;

export const STATS = [
  { value: "500+", label: "Students" },
  { value: "25+", label: "Teachers" },
  { value: "1,200+", label: "Lessons" },
  { value: "94%", label: "Success rate" },
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
      "Create an account or ask your teacher for an invite link. You can also reach us from the contact page.",
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

export const WHY_FEATURES = [
  {
    title: "Experienced teachers",
    description: "Instructors who know IELTS, Digital SAT, and General English inside out.",
  },
  {
    title: "Interactive lessons",
    description: "Structured content designed for focus — not passive video watching.",
  },
  {
    title: "Homework",
    description: "Assignments between classes that reinforce what you learned.",
  },
  {
    title: "Practice exams",
    description: "Full and sectional mocks under real timing and conditions.",
  },
  {
    title: "Analytics",
    description: "See accuracy by skill and topic — know exactly what to study next.",
  },
  {
    title: "Study plans",
    description: "Weekly paths that connect lessons, homework, and mock tests.",
  },
  {
    title: "Teacher feedback",
    description: "Writing and speaking reviewed with clear, actionable comments.",
  },
] as const;

export const LEARNING_STEPS = [
  { step: "Join", description: "Create your account and set your target score or band." },
  { step: "Learn", description: "Work through guided lessons matched to your level." },
  { step: "Practice", description: "Complete homework and timed drills between sessions." },
  { step: "Mock exams", description: "Sit full practice tests under real exam conditions." },
  { step: "Real exam", description: "Walk in prepared — format, timing, and stamina feel familiar." },
  { step: "Success", description: "Review results, close gaps, and reach your goal." },
] as const;

export const PLATFORM_FEATURES = [
  { title: "Practice exams", description: "IELTS and Digital SAT mocks with realistic navigation." },
  { title: "Assignments", description: "Teacher-assigned tasks with due dates and tracking." },
  { title: "Vocabulary", description: "Curated word lists tied to your program and level." },
  { title: "AI support", description: "Hints and explanations when you are stuck — not a replacement for teachers." },
  { title: "Reports", description: "Clear score breakdowns and progress over time." },
  { title: "Progress", description: "Track completion across lessons, homework, and exams." },
  { title: "Achievements", description: "Milestones that reflect real preparation — not gamification noise." },
  { title: "Certificates", description: "Recognition when you complete programs and key milestones." },
] as const;
