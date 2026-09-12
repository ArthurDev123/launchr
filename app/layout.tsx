import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Launchr — Landings que convierten", description: "El marketplace de landing pages para lanzar mejores ideas.", icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" } };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="es"><body>{children}</body></html>;
}
