import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/src/components/ui/ThemeProvider";
import { AppProviders } from "@/src/components/auth/AppProviders";
import { BRAND_COLORS, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/src/lib/site";
import "./globals.css";

const display = Big_Shoulders({
  weight: ["700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-display-face",
  display: "swap",
  adjustFontFallback: false,
});

const mono = JetBrains_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-mono-face",
  display: "swap",
});

const serif = Instrument_Serif({
  weight: "400",
  style: ["italic", "normal"],
  subsets: ["latin"],
  variable: "--font-serif-face",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Le programme de match`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["OM", "Olympique de Marseille", "Ligue 1", "Europa League", "calendrier", "classement", "effectif"],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Le programme de match`,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Le programme de match`,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND_COLORS.paper },
    { media: "(prefers-color-scheme: dark)", color: BRAND_COLORS.ink },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${display.variable} ${mono.variable} ${serif.variable} antialiased`}>
        <ThemeProvider>
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
