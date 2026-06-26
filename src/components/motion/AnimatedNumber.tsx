"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

function parseStatValue(value: string) {
  const match = value.match(/^([^0-9]*)([0-9][0-9,]*\.?[0-9]*)(.*)$/);
  if (!match) return { prefix: "", number: 0, suffix: value, decimals: 0 };

  const [, prefix, numStr, suffix] = match;
  const normalized = numStr.replace(/,/g, "");
  const decimals = normalized.includes(".") ? (normalized.split(".")[1]?.length ?? 0) : 0;
  return {
    prefix,
    number: Number(normalized),
    suffix,
    decimals,
  };
}

function formatNumber(n: number, decimals: number) {
  if (decimals > 0) return n.toFixed(decimals);
  return Math.round(n).toLocaleString("en-US");
}

type AnimatedNumberProps = {
  value: string;
  className?: string;
};

export function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const { prefix, number, suffix, decimals } = parseStatValue(value);

  const display = useTransform(count, (v) => `${prefix}${formatNumber(v, decimals)}${suffix}`);

  useEffect(() => {
    if (!isInView) return;
    if (reduceMotion) {
      count.set(number);
      return;
    }
    const controls = animate(count, number, {
      duration: 1.2,
      ease: [0, 0, 0.2, 1],
    });
    return () => controls.stop();
  }, [count, isInView, number, reduceMotion]);

  return (
    <motion.p ref={ref} className={cn(className)}>
      {reduceMotion ? value : display}
    </motion.p>
  );
}
