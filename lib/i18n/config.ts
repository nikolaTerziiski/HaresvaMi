export const locales = ["bg", "en"] as const;
export const defaultLocale = "bg";
export const localeCookieName = "haresvami-locale";

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  bg: "Български",
  en: "English",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
