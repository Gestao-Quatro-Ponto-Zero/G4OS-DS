import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { themeScript } from "@g4ai/ds";
import { DsSetup } from "../lib/ds";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-manrope" });

export const metadata: Metadata = { title: "Meu app G4 OS" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // ds-app: o documento não rola; cada área de trabalho tem a própria rolagem.
    // data-theme: light | dark | system (ThemeToggle troca e salva). data-brand="…" para marca de cliente.
    <html lang="pt-BR" className={`ds-app ${manrope.variable}`} data-theme="system" suppressHydrationWarning>
      <head>
        {/* Aplica o tema salvo antes da primeira pintura (sem piscar). */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <DsSetup />
        {children}
      </body>
    </html>
  );
}
