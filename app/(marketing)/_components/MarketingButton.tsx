"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import styles from "../page.module.css";

type MarketingButtonProps = {
  children: ReactNode;
  href: string;
  variant: "primary" | "ghost";
  className?: string;
  style?: CSSProperties;
};

export function MarketingButton({
  children,
  href,
  variant,
  className,
  style,
}: MarketingButtonProps) {
  const variantClass =
    variant === "primary" ? styles.btnPrimary : styles.btnGhost;
  const buttonStyle =
    variant === "primary" ? { ...style, color: "var(--paper)" } : style;

  return (
    <Link
      href={href}
      className={[styles.btn, variantClass, className]
        .filter(Boolean)
        .join(" ")}
      style={buttonStyle}
    >
      {children}
    </Link>
  );
}
