"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { HTMLAttributes, ReactNode } from "react";
import { cardLift } from "@/lib/motion";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  padding?: "sm" | "md" | "lg";
};

const paddingStyles = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  interactive = false,
  padding = "md",
  className,
  children,
  ...rest
}: CardProps) {
  const reduceMotion = useReducedMotion();
  const classes = cn(
    "rounded-xl border border-[var(--border)] bg-[var(--surface)]",
    paddingStyles[padding],
    interactive &&
      !reduceMotion &&
      "transition-[border-color] duration-150 hover:border-[var(--border-strong)]",
    interactive &&
      reduceMotion &&
      "transition-[border-color,box-shadow] duration-150 hover:border-[var(--border-strong)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
    className,
  );

  if (interactive && !reduceMotion) {
    const { onClick, onKeyDown, role, tabIndex, id, "aria-label": ariaLabel } = rest;
    return (
      <motion.div
        className={classes}
        whileHover={cardLift}
        onClick={onClick}
        onKeyDown={onKeyDown}
        role={role}
        tabIndex={tabIndex}
        id={id}
        aria-label={ariaLabel}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

export function CardIcon({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-lg font-semibold tracking-tight text-[var(--text)]", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("mt-2 text-sm leading-relaxed text-[var(--muted)]", className)}>{children}</p>
  );
}
