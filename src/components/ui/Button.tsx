"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonHover, buttonTap } from "@/lib/motion";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const MotionLink = motion.create(Link);

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-[var(--accent)] text-[var(--on-accent)] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-pressed)]",
  secondary:
    "border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--text)] hover:bg-[var(--hover-strong)]",
  outline:
    "border border-[var(--border-strong)] bg-transparent text-[var(--text)] hover:border-[var(--accent-soft)] hover:bg-[var(--accent-subtle)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-10 px-5 text-[15px]",
  lg: "h-12 px-6 text-[15px]",
};

type ButtonBaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = ButtonBaseProps & {
  href: string;
  disabled?: boolean;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,border-color,color] duration-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]/25 disabled:pointer-events-none disabled:opacity-40";

const motionProps = {
  whileHover: buttonHover,
  whileTap: buttonTap,
};

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(base, variantStyles[variant], sizeStyles[size], className);
  const reduceMotion = useReducedMotion();

  if ("href" in props && props.href) {
    const { href, disabled } = props;
    if (disabled) {
      return (
        <span className={cn(classes, "pointer-events-none opacity-40")} aria-disabled>
          {children}
        </span>
      );
    }
    if (reduceMotion) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }
    return (
      <MotionLink href={href} className={classes} {...motionProps}>
        {children}
      </MotionLink>
    );
  }

  const buttonProps = props as ButtonAsButton;
  const { type = "button", disabled, ...rest } = buttonProps;

  if (disabled || reduceMotion) {
    return (
      <button type={type} disabled={disabled} className={classes} {...rest}>
        {children}
      </button>
    );
  }

  return (
    <motion.span className="inline-flex" whileHover={buttonHover} whileTap={buttonTap}>
      <button type={type} className={classes} disabled={disabled} {...rest}>
        {children}
      </button>
    </motion.span>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  size?: "sm" | "md";
};

const iconSizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
};

export function IconButton({ label, size = "md", className, children, ...rest }: IconButtonProps) {
  const reduceMotion = useReducedMotion();
  const classes = cn(
    "inline-flex items-center justify-center rounded-lg border border-transparent text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]/25",
    iconSizes[size],
    className,
  );

  if (reduceMotion) {
    return (
      <button type="button" aria-label={label} className={classes} {...rest}>
        {children}
      </button>
    );
  }

  return (
    <motion.span className="inline-flex" whileHover={buttonHover} whileTap={buttonTap}>
      <button type="button" aria-label={label} className={classes} {...rest}>
        {children}
      </button>
    </motion.span>
  );
}

export function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
