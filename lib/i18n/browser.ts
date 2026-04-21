import { localeCookieName, type Locale } from "@/lib/i18n/config";

export function persistLocale(locale: Locale) {
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;
}
