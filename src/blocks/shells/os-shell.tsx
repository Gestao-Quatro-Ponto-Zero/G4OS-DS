import { Bot, CircleHelp, FolderOpen, Inbox, LayoutGrid, Settings, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell, IconRail, ProductMark, Tooltip, type NavItem, type RailItem } from "@g4ai/ds";
import { frameHref } from "./frame-route";

/*
 * Casca do "G4 OS" (app desktop de sessões com agente). Trilho de ícones à
 * esquerda; a coluna de sessões e a conversa ficam no bloco. Celular: pílula
 * com os destinos principais na lista; dentro de uma conversa a pílula some
 * (`hideTabbar`) para dar espaço ao campo de mensagem.
 *
 * Telas com layout próprio (AgentAppLayout: sessões com artefatos, Codex)
 * usam o MESMO trilho e a mesma pílula por `OsRail` e `osTabs`, passando o
 * endereço da própria tela como "Sessões".
 */

export const osRoutes = {
  sessions: frameHref("ai-sessions"),
  home: frameHref("ai-sessions-empty"),
  agents: frameHref("ai-agents"),
  files: frameHref("app-file-manager"),
  settings: frameHref("settings-profile"),
  help: frameHref("app-help-center"),
} as const;

const railOf = (sessions: string): RailItem[][] => [
  [
    { href: sessions, label: "Sessões", icon: Inbox, dot: true },
    { href: osRoutes.home, label: "Nova sessão", icon: LayoutGrid },
    { href: osRoutes.agents, label: "Agentes", icon: Bot },
    { href: osRoutes.files, label: "Arquivos", icon: FolderOpen },
  ],
];

/** Pílula do celular. `sessions` = tela de sessões em uso (padrão: ai-sessions). */
export const osTabs = (sessions: string = osRoutes.sessions): NavItem[] => [
  { href: sessions, label: "Sessões", icon: Inbox },
  { href: osRoutes.home, label: "Nova", icon: Sparkles },
  { href: osRoutes.agents, label: "Agentes", icon: Bot },
  { href: osRoutes.files, label: "Arquivos", icon: FolderOpen },
];

const railLink = "grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-ink/[0.05] hover:text-ink";

/** Trilho do G4 OS. Use direto em layouts próprios (AgentAppLayout `rail`). */
export function OsRail({ current, sessions = osRoutes.sessions, mobileOpen = false }: { current: string; sessions?: string; mobileOpen?: boolean }) {
  return (
    <IconRail
      groups={railOf(sessions)}
      currentPath={current}
      mobileOpen={mobileOpen}
      mark={<ProductMark size={30} />}
      footer={
        <div className="flex flex-col items-center gap-2">
          <Tooltip content="Configurações" side="right">
            <a href={osRoutes.settings} aria-label="Configurações" className={railLink}>
              <Settings className="h-[17px] w-[17px]" />
            </a>
          </Tooltip>
          <Tooltip content="Central de ajuda" side="right">
            <a href={osRoutes.help} aria-label="Central de ajuda" className={railLink}>
              <CircleHelp className="h-[17px] w-[17px]" />
            </a>
          </Tooltip>
        </div>
      }
    />
  );
}

export function OsShell({ current, children, hideTabbar = false }: { current: string; children: ReactNode; hideTabbar?: boolean }) {
  return (
    <AppShell
      product="G4 OS"
      workspace="João Vitor"
      mobileNav={hideTabbar ? "drawer" : "tabbar"}
      tabs={hideTabbar ? undefined : osTabs()}
      currentPath={current}
      sidebar={({ mobileOpen }) => <OsRail current={current} mobileOpen={mobileOpen} />}
    >
      {children}
    </AppShell>
  );
}
