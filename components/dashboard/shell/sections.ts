// Shared dashboard section resolution, used by both the desktop Topbar and the
// MobileTopbar so nested-page breadcrumbs stay in sync across both shells.

export const SECTION_KEYS = [
  { prefix: "/dashboard/menu/import-ai", key: "menuImport" },
  { prefix: "/dashboard/insights", key: "insights" },
  { prefix: "/dashboard/feedback", key: "feedback" },
  { prefix: "/dashboard/menu", key: "menu" },
  { prefix: "/dashboard/tablet", key: "tablet" },
  { prefix: "/dashboard/settings", key: "settings" },
] as const;

export function getSectionKey(pathname: string): string {
  const match = SECTION_KEYS.find((section) =>
    pathname.startsWith(section.prefix),
  );

  return match?.key ?? "home";
}

// Nested pages that should show a "back to parent" breadcrumb. Adding an entry
// here lights up the breadcrumb on BOTH desktop and mobile automatically.
export const PARENT_SECTIONS: Partial<
  Record<string, { key: string; href: string }>
> = {
  menuImport: { key: "menu", href: "/dashboard/menu" },
};
