"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUpHidden, fadeUpTransition, fadeUpVisible, scrollViewport } from "@/lib/motion";
import { cn } from "@/lib/cn";

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Use for hero load — animates on mount instead of scroll */
  immediate?: boolean;
  as?: "div" | "section" | "li" | "article";
};

export function FadeIn({
  children,
  className,
  delay = 0,
  immediate = false,
  as = "div",
}: FadeInProps) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as];

  if (reduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Component
      className={cn(className)}
      initial={fadeUpHidden}
      animate={immediate ? fadeUpVisible : undefined}
      whileInView={immediate ? undefined : fadeUpVisible}
      viewport={immediate ? undefined : scrollViewport}
      transition={fadeUpTransition(delay)}
    >
      {children}
    </Component>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  immediate?: boolean;
};

export function Stagger({ children, className, immediate = false }: StaggerProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate={immediate ? "visible" : undefined}
      whileInView={immediate ? undefined : "visible"}
      viewport={immediate ? undefined : scrollViewport}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: fadeUpHidden,
        visible: { ...fadeUpVisible, transition: fadeUpTransition(0) },
      }}
    >
      {children}
    </motion.div>
  );
}
