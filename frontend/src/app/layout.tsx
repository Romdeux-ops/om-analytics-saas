import type { Metadata } from "next";
import { Big_Shoulders, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/src/components/ui/ThemeProvider";
import { AppProviders } from "@/src/components/auth/AppProviders";
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
  title: "OM Analytics — Le programme de match",
  description: "Simulation, données et culture de virage autour de l'Olympique de Marseille",
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
