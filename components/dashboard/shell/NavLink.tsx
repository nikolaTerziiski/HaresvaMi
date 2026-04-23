"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  icon: ReactNode;
  children: ReactNode;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLink({ href, icon, children }: NavLinkProps) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "flex items-center gap-[10px] rounded-md px-[10px] py-2 text-sm transition",
        active
          ? "bg-[var(--paper)] font-medium text-[var(--ink)]"
          : "text-[var(--ink-2)] hover:bg-[color-mix(in_oklab,var(--paper)_60%,transparent)] hover:text-[var(--ink)]",
      ].join(" ")}
    >
      <span
        className={[
          "inline-grid h-4 w-4 place-items-center",
          active ? "text-[var(--accent)] opacity-100" : "opacity-75",
        ].join(" ")}
      >
        {icon}
      </span>
      {children}
    </Link>
  );
}
