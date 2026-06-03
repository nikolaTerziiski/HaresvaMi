import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { ServiceWorkerRegistrar } from "@/components/shared/ServiceWorkerRegistrar";

import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://haresvami.bg";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HaresvaMi — обратна връзка за ресторанта ти",
    template: "%s · HaresvaMi",
  },
  description:
    "Обратна връзка за ресторанта — какво наистина харесват клиентите ти. Дискретни оценки на ястията от всеки таблет, без смяна на POS-а.",
  applicationName: "HaresvaMi",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "HaresvaMi",
    title: "HaresvaMi — обратна връзка за ресторанта ти",
    description:
      "Какво наистина харесват клиентите ти — дискретни оценки на ястията от всеки таблет.",
    url: siteUrl,
    locale: "bg_BG",
  },
  twitter: {
    card: "summary_large_image",
    title: "HaresvaMi — обратна връзка за ресторанта ти",
    description:
      "Какво наистина харесват клиентите ти — дискретни оценки на ястията от всеки таблет.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#C24D2C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${instrumentSerif.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ServiceWorkerRegistrar />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
