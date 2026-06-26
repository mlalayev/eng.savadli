"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { floatTransition } from "@/lib/motion";
import { cn } from "@/lib/cn";

type FloatingProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function Floating({ children, className, delay = 0 }: FloatingProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      animate={{ y: [0, -4, 0] }}
      transition={floatTransition(delay)}
    >
      {children}
    </motion.div>
  );
}
