export const locales = ["ru"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

export const localeNames: Record<Locale, string> = {
  ru: "Русский",
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
