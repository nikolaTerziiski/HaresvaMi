// Standard dashboard pages: a CENTERED column (max-w-5xl ≈ 1024px) with balanced
// margins on both sides. The Topbar's inner row is centered to the SAME width so
// the section title lines up with the content (no detached/misaligned header).
// Sparse focal content (e.g. an empty-state hero) may further center itself.
export const DASHBOARD_PAGE_FRAME_CLASS =
  "mx-auto w-full max-w-5xl px-10 py-10 pb-20 max-md:px-6 max-md:py-8";

export const DASHBOARD_PAGE_X_CLASS =
  "mx-auto w-full max-w-6xl px-10 max-md:px-6";

// Full-bleed pages (e.g. the menu category board) that deliberately use the
// whole content width instead of the centered max-w-6xl frame.
export const DASHBOARD_PAGE_FULL_CLASS = "flex h-full w-full";
