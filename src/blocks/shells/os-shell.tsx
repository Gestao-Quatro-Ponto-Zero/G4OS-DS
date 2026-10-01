import { Bot, CircleHelp, FolderOpen, Inbox, LayoutGrid, Settings, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell, IconRail, notify, ProductMark, Tooltip, type NavItem, type RailItem } from "@g4ai/ds";
import { frameHref } from "./frame-route";

/*
 * Casca do "G4 OS" (app desktop de sessões com agente). Trilho de ícones à
 * esquerda; a coluna de sessões e a conversa ficam no bloco. Celular: pílula
 * com os destinos principais na lista; dentro de uma conversa a pílula some
 * (`hideTabbar`) para dar espaço ao campo de mensagem.
 */

export const osRoutes = {
  sessions: frameHref("ai-sessions"),
  home: frameHref("ai-sessions-empty"),
  agents: frameHref("ai-workspace"),
  files: frameHref("app-file-manager"),
  settings: frameHref("settings-profile"),
} as const;

const rail: RailItem[][] = [
  [
    { href: osRoutes.sessions, label: "Sessões", icon: Inbox, dot: true },
    { href: osRoutes.home, label: "Nova sessão", icon: LayoutGrid },
    { href: osRoutes.agents, label: "Agentes e relatórios", icon: Bot },
    { href: osRoutes.files, label: "Arquivos", icon: FolderOpen },
  ],
];

const tabs: NavItem[] = [
  { href: osRoutes.sessions, label: "Sessões", icon: Inbox },
  { href: osRoutes.home, label: "Nova", icon: Sparkles },
  { href: osRoutes.agents, label: "Agentes", icon: Bot },
  { href: osRoutes.files, label: "Arquivos", icon: FolderOpen },
];

export function OsShell({ current, children, hideTabbar = false }: { current: string; children: ReactNode; hideTabbar?: boolean }) {
  return (
    <AppShell
      product="G4 OS"
      workspace="João Vitor"
      mobileNav={hideTabbar ? "drawer" : "tabbar"}
      tabs={hideTabbar ? undefined : tabs}
      currentPath={current}
      sidebar={({ mobileOpen }) => (
        <IconRail
          groups={rail}
          currentPath={current}
          mobileOpen={mobileOpen}
          mark={<ProductMark size={30} />}
          footer={
            <div className="flex flex-col items-center gap-2">
              <Tooltip content="Configurações" side="right">
                <a href={osRoutes.settings} aria-label="Configurações" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-ink/[0.05] hover:text-ink">
                  <Settings className="h-[17px] w-[17px]" />
                </a>
              </Tooltip>
              <Tooltip content="Ajuda" side="right">
                <button type="button" aria-label="Ajuda" onClick={() => notify("Exemplo: abriria a central de ajuda do G4 OS", undefined, "info")} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-ink/[0.05] hover:text-ink">
                  <CircleHelp className="h-[17px] w-[17px]" />
                </button>
              </Tooltip>
            </div>
          }
        />
      )}
    >
      {children}
    </AppShell>
  );
}
