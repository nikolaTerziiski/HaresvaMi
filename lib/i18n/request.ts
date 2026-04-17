import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

const LOCALE_COOKIE = "haresvami-locale";

/**
 * Resolves the active locale for the request.
 * Reads the `haresvami-locale` cookie (set by the owner's language toggle),
 * falls back to the Bulgarian default otherwise.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale =
    cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
