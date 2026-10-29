"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="light"
      storageKey="om-theme-v2"
      enableSystem={false}
      themes={["light", "dark"]}
    >
      {children}
    </NextThemeProvider>
  );
}
