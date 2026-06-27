export type BillingInterval = "monthly" | "yearly";

export type PricingPlan = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: readonly string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
};

export const PRICING_PLANS: readonly PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Get started and explore the platform at your own pace.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ["Limited lessons", "Limited practice", "Community access"],
    ctaLabel: "Get Started",
    ctaHref: "/login",
  },
  {
    id: "standard",
    name: "Standard",
    description: "Everything you need for structured preparation with teacher support.",
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      "Full lessons",
      "Homework",
      "Practice",
      "Teacher feedback",
      "Progress tracking",
    ],
    ctaLabel: "Choose Standard",
    ctaHref: "/login",
    highlighted: true,
  },
  {
    id: "premium",
    name: "Premium",
    description: "The complete experience for students who want maximum results.",
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: [
      "Everything included",
      "Mock exams",
      "Analytics",
      "Study plan",
      "Priority feedback",
      "Certificates",
    ],
    ctaLabel: "Choose Premium",
    ctaHref: "/login",
  },
] as const;

export type PricingFeatureValue = "yes" | "no" | "limited";

export type PricingComparisonRow = {
  feature: string;
  free: PricingFeatureValue;
  standard: PricingFeatureValue;
  premium: PricingFeatureValue;
};

export const PRICING_COMPARISON: readonly PricingComparisonRow[] = [
  { feature: "Lessons", free: "limited", standard: "yes", premium: "yes" },
  { feature: "Practice", free: "limited", standard: "yes", premium: "yes" },
  { feature: "Community access", free: "yes", standard: "yes", premium: "yes" },
  { feature: "Homework", free: "no", standard: "yes", premium: "yes" },
  { feature: "Teacher feedback", free: "no", standard: "yes", premium: "yes" },
  { feature: "Progress tracking", free: "no", standard: "yes", premium: "yes" },
  { feature: "Mock exams", free: "no", standard: "no", premium: "yes" },
  { feature: "Analytics", free: "no", standard: "no", premium: "yes" },
  { feature: "Study plan", free: "no", standard: "no", premium: "yes" },
  { feature: "Priority feedback", free: "no", standard: "no", premium: "yes" },
  { feature: "Certificates", free: "no", standard: "no", premium: "yes" },
] as const;

export const PRICING_FAQ = [
  {
    question: "Can I switch plans later?",
    answer:
      "Yes. Upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    question: "Is there a free trial for paid plans?",
    answer:
      "The Free plan lets you explore the platform. Paid plans can be started anytime — contact us if you need a trial period.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept major credit and debit cards. Bank transfer may be available for annual plans — reach out for details.",
  },
  {
    question: "Do yearly plans save money?",
    answer:
      "Yes. Yearly billing gives you two months free compared to paying monthly.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. Cancel from your account settings. You keep access until the end of your current billing period.",
  },
  {
    question: "Do teachers need a separate plan?",
    answer:
      "Teacher and center accounts are managed separately. Contact us for institutional pricing.",
  },
] as const;
