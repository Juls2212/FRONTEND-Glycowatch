import type { Metadata } from "next";
import { ReactNode } from "react";
import "@/app/globals.css";
import { AppBootstrap } from "@/components/auth/app-bootstrap";

export const metadata: Metadata = {
  title: "GlycoWatch Dashboard",
  description: "Frontend dashboard for GlycoWatch."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppBootstrap>{children}</AppBootstrap>
      </body>
    </html>
  );
}
