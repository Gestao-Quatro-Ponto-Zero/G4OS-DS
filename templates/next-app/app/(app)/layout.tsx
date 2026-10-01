"use client";

import { Handshake, Home, Settings, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell, Sidebar, ThemeToggle } from "@g4ai/ds";

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  return (
    <AppShell
      product="Meu app"
      workspace="Minha empresa"
      sidebar={({ mobileOpen }) => (
        <Sidebar
          product="Meu app"
          workspace="Minha empresa"
          currentPath={pathname}
          mobileOpen={mobileOpen}
          groups={[
            {
              label: "Trabalho",
              items: [
                { href: "/", label: "Início", icon: Home },
                { href: "/negocios", label: "Negócios", icon: Handshake },
                { href: "/contatos", label: "Contatos", icon: Users },
              ],
            },
            { label: "Conta", items: [{ href: "/configuracoes", label: "Configurações", icon: Settings }] },
          ]}
          user={{ name: "Ana Lopes", initials: "AL", role: "Administradora" }}
          footer={<ThemeToggle compact className="mx-3 mb-3" />}
        />
      )}
    >
      {children}
    </AppShell>
  );
}
