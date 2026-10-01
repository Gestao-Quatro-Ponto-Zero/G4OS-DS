import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import type { ReactNode } from "react";
import { themeScript } from "@g4ai/ds";
import { DsSetup } from "../lib/ds";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-figtree" });

export const metadata: Metadata = { title: "Meu app G4 OS" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // ds-app: o documento não rola; cada área de trabalho tem a própria rolagem.
    // data-theme: light | dark | system (ThemeToggle troca e salva). data-brand="…" para marca de cliente.
    <html lang="pt-BR" className={`ds-app ${figtree.variable}`} data-theme="system" suppressHydrationWarning>
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
