import type { Metadata } from "next";
import Script from "next/script";
import { ReactNode } from "react";
import "@/app/globals.css";
import { AppBootstrap } from "@/components/auth/app-bootstrap";
import {
  DEFAULT_ACCENT_THEME,
  DEFAULT_COLOR_MODE,
  getThemeBootstrapScript
} from "@/lib/theme/config";

export const metadata: Metadata = {
  title: " GlycoWatch Dashboard ",
  description: "Frontend panel for GlycoWatch",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      data-color-mode={DEFAULT_COLOR_MODE}
      data-accent-theme={DEFAULT_ACCENT_THEME}
      suppressHydrationWarning
    >
      <head>
        <Script id="glycowatch-theme-bootstrap" strategy="beforeInteractive">
          {getThemeBootstrapScript()}
        </Script>
      </head>
      <body>
        <AppBootstrap>{children}</AppBootstrap>
      </body>
    </html>
  );
}
