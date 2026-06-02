import { z } from "zod";

/**
 * Allowed Google hostnames for review URLs.
 *
 * Accepts:
 *   - g.page            (short Google links)
 *   - maps.app.goo.gl   (Google Maps app short links)
 *   - goo.gl            (legacy Google short links)
 *   - *.google.com      (search.google.com, www.google.com, etc.)
 *
 * Requires https — plain http is rejected.
 */
function isGoogleReviewUrl(v: string): boolean {
  if (v === "") return true;

  let url: URL;
  try {
    url = new URL(v);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") return false;

  const { hostname } = url;
  return (
    hostname === "g.page" ||
    hostname === "maps.app.goo.gl" ||
    hostname === "goo.gl" ||
    hostname.endsWith(".google.com")
  );
}

export const googleReviewUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(isGoogleReviewUrl, {
    message: "invalid",
  });

export type GoogleReviewUrl = z.infer<typeof googleReviewUrlSchema>;
