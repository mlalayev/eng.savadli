export type ResourceItem = {
  title: string;
  description: string;
};

export const IELTS_RESOURCES: readonly ResourceItem[] = [
  {
    title: "Writing Templates",
    description: "Task 1 and Task 2 structures with cohesive linking and clear paragraphs.",
  },
  {
    title: "Speaking Questions",
    description: "Common Part 1–3 prompts with model answer frameworks.",
  },
  {
    title: "Band Descriptors",
    description: "What examiners look for at each band — explained in plain language.",
  },
  {
    title: "Listening Tips",
    description: "Strategies for prediction, note-taking, and avoiding common traps.",
  },
  {
    title: "Reading Strategies",
    description: "Skimming, scanning, and time management for all passage types.",
  },
] as const;

export const DSAT_RESOURCES: readonly ResourceItem[] = [
  {
    title: "Grammar",
    description: "Rules and patterns tested in Reading & Writing modules.",
  },
  {
    title: "Math Formulas",
    description: "Essential formulas and when to apply them on test day.",
  },
  {
    title: "Reading Tips",
    description: "Evidence-based approaches for main idea and detail questions.",
  },
  {
    title: "Time Management",
    description: "Pacing strategies for adaptive modules and full exams.",
  },
  {
    title: "Score Guide",
    description: "How Digital SAT scores work and what your target means.",
  },
] as const;

export const GENERAL_ENGLISH_RESOURCES: readonly ResourceItem[] = [
  {
    title: "Grammar",
    description: "Foundations from tenses to complex sentences, level by level.",
  },
  {
    title: "Vocabulary",
    description: "Themed word lists with examples in real context.",
  },
  {
    title: "Reading",
    description: "Graded passages with comprehension and inference practice.",
  },
  {
    title: "Writing",
    description: "Emails, essays, and short responses with structure guides.",
  },
  {
    title: "Listening",
    description: "Audio at varied speeds with transcripts and key phrases.",
  },
  {
    title: "Speaking",
    description: "Conversation prompts, fillers, and natural expression tips.",
  },
] as const;

export type Article = {
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
};

export const FEATURED_ARTICLES: readonly Article[] = [
  {
    title: "How to structure IELTS Writing Task 2",
    excerpt:
      "A clear four-paragraph framework that helps you stay on topic, develop ideas, and hit band descriptors.",
    category: "IELTS",
    readTime: "6 min read",
  },
  {
    title: "Digital SAT timing strategies that work",
    excerpt:
      "Module pacing, when to skip, and how to recover time without rushing through the final questions.",
    category: "Digital SAT",
    readTime: "5 min read",
  },
  {
    title: "Building vocabulary that actually sticks",
    excerpt:
      "Spaced review, context-based learning, and habits that move words from passive to active use.",
    category: "General English",
    readTime: "4 min read",
  },
] as const;

export type StudyGuide = {
  title: string;
  description: string;
  program: string;
};

export const STUDY_GUIDES: readonly StudyGuide[] = [
  {
    title: "IELTS Band 7+ Roadmap",
    description: "A week-by-week plan covering all four sections with milestones.",
    program: "IELTS",
  },
  {
    title: "Digital SAT Math Essentials",
    description: "Core topics, practice priorities, and common mistake patterns.",
    program: "Digital SAT",
  },
  {
    title: "Grammar Foundations",
    description: "From basic structures to complex sentences — built for daily use.",
    program: "General English",
  },
  {
    title: "Reading Comprehension Mastery",
    description: "Techniques for speed, accuracy, and inference across text types.",
    program: "All programs",
  },
] as const;

export type DownloadItem = {
  title: string;
  description: string;
  format: string;
  size: string;
};

export const DOWNLOADS: readonly DownloadItem[] = [
  {
    title: "IELTS Writing Task 1 Templates",
    description: "Graph, chart, and process description frameworks with sample language.",
    format: "PDF",
    size: "1.2 MB",
  },
  {
    title: "IELTS Speaking Cue Card Guide",
    description: "Part 2 structure, timing tips, and vocabulary for common topics.",
    format: "PDF",
    size: "890 KB",
  },
  {
    title: "Digital SAT Formula Sheet",
    description: "Math formulas and reference notes for quick review before test day.",
    format: "PDF",
    size: "540 KB",
  },
  {
    title: "Grammar Quick Reference",
    description: "Tenses, conditionals, and common errors — one-page summaries.",
    format: "PDF",
    size: "720 KB",
  },
] as const;

export const RESOURCES_FAQ = [
  {
    question: "Are these resources free?",
    answer:
      "Study guides, articles, and selected downloads are available to all registered students. Some materials unlock with program enrollment.",
  },
  {
    question: "Can I use these without a teacher?",
    answer:
      "Yes. Articles, guides, and downloads are designed for self-study. Teacher feedback is available when enrolled in a Savadli program.",
  },
  {
    question: "How often is content updated?",
    answer:
      "We update resources when exam formats change or when students consistently ask for new topics. Check back monthly for new articles.",
  },
  {
    question: "Do downloads work on mobile?",
    answer:
      "PDFs open on any device. For the best reading experience, we recommend a tablet or laptop.",
  },
  {
    question: "Where should I start?",
    answer:
      "Pick your program category above, read a featured article, then download the guide that matches your current goal.",
  },
] as const;
