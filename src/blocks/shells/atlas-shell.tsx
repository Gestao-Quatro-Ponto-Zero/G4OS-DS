import { Bell, Database, FileText, FolderOpen, Home, Inbox, Presentation, Search, Settings, Sparkles, Activity } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell, IconButton, Sidebar, type NavGroup, type NavItem } from "@g4os/ds";
import { me, org } from "../data/workspace";
import { frameHref, goTo } from "./frame-route";

/*
 * Casca do produto de exemplo "Atlas" (workspace interno da Acme): usada por
 * Aplicação, Configurações e Onboarding. Um lugar só para a navegação — toda
 * tela do produto aponta para uma tela real.
 *
 * Celular: pílula embaixo com os 4 destinos do dia a dia; o resto fica em "Mais".
 */

export const atlasRoutes = {
  home: frameHref("onboarding-checklist"),
  notifications: frameHref("app-notifications"),
  tickets: frameHref("app-filtered-list"),
  files: frameHref("app-file-manager"),
  presentations: frameHref("app-presentation"),
  tracker: frameHref("app-record-tracker"),
  collab: frameHref("app-collab-doc"),
  search: frameHref("app-global-search"),
  commands: frameHref("app-command-palette"),
  assistant: frameHref("ai-chat"),
  settings: frameHref("settings-profile"),
  status: frameHref("app-error-pages"),
} as const;

/** Contador de não lidas mostrado no menu (o mesmo da central de notificações). */
export const atlasUnread = 4;

const main: NavItem[] = [
  { href: atlasRoutes.home, label: "Início", icon: Home },
  { href: atlasRoutes.notifications, label: "Notificações", icon: Bell, badge: atlasUnread },
  { href: atlasRoutes.tickets, label: "Chamados", icon: Inbox },
  { href: atlasRoutes.files, label: "Arquivos", icon: FolderOpen },
];

/** Pílula do celular: os mesmos destinos, com rótulos curtos (cabem em ~70px). */
const tabs: NavItem[] = main.map((it) => (it.href === atlasRoutes.notifications ? { ...it, label: "Avisos" } : it));

const groups: NavGroup[] = [
  {
    label: "Trabalho",
    items: [
      ...main,
      { href: atlasRoutes.tracker, label: "Rastreador de QA", icon: Database },
      { href: atlasRoutes.collab, label: "Documentos", icon: FileText },
      { href: atlasRoutes.presentations, label: "Apresentações", icon: Presentation },
    ],
  },
  {
    label: "Ferramentas",
    items: [
      { href: atlasRoutes.search, label: "Busca", icon: Search },
      { href: atlasRoutes.assistant, label: "Assistente G4", icon: Sparkles },
    ],
  },
  {
    label: "Conta",
    items: [
      { href: atlasRoutes.settings, label: "Configurações", icon: Settings },
      { href: atlasRoutes.status, label: "Status do sistema", icon: Activity },
    ],
  },
];

export function AtlasShell({
  current,
  children,
  banner,
  onSearch,
}: {
  current: string;
  children: ReactNode;
  banner?: ReactNode;
  /** Busca da sidebar/cabeçalho. Padrão: abre a paleta de comandos. */
  onSearch?: () => void;
}) {
  const search = onSearch ?? (() => goTo(atlasRoutes.commands));
  return (
    <AppShell
      product={org.product}
      workspace={org.name}
      mobileNav="tabbar"
      tabs={tabs}
      currentPath={current}
      banner={banner}
      headerActions={
        <>
          <IconButton label="Buscar" onClick={search}>
            <Search />
          </IconButton>
          <IconButton label="Notificações" onClick={() => goTo(atlasRoutes.notifications)}>
            <Bell />
          </IconButton>
        </>
      }
      sidebar={({ mobileOpen }) => (
        <Sidebar
          product={org.product}
          workspace={org.name}
          currentPath={current}
          mobileOpen={mobileOpen}
          onSearch={search}
          groups={groups}
          user={{ name: me.name, initials: me.initials, role: me.title, href: frameHref("settings-profile") }}
        />
      )}
    >
      {children}
    </AppShell>
  );
}
