"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonHover, buttonTap } from "@/lib/motion";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

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

function MotionWrap({
  children,
  className,
  disabled,
}: {
  children: ReactNode;
  className: string;
  disabled?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  if (disabled || reduceMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <motion.span
      className={cn("inline-flex", className)}
      whileHover={buttonHover}
      whileTap={buttonTap}
    >
      {children}
    </motion.span>
  );
}

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(base, variantStyles[variant], sizeStyles[size], className);

  if ("href" in props && props.href) {
    const { href, disabled } = props;
    if (disabled) {
      return (
        <span className={cn(classes, "pointer-events-none opacity-40")} aria-disabled>
          {children}
        </span>
      );
    }
    return (
      <MotionWrap className={classes}>
        <Link href={href} className="inline-flex h-full w-full items-center justify-center gap-2">
          {children}
        </Link>
      </MotionWrap>
    );
  }

  const { type = "button", disabled, ...rest } = props;

  if (disabled) {
    return (
      <button type={type} disabled className={classes} {...rest}>
        {children}
      </button>
    );
  }

  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return (
      <button type={type} className={classes} {...rest}>
        {children}
      </button>
    );
  }

  return (
    <motion.button
      type={type}
      className={classes}
      whileHover={buttonHover}
      whileTap={buttonTap}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

type IconButtonProps = B