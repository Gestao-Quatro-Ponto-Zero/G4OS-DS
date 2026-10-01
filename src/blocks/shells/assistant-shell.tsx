import { ArrowLeft, Coins, History, KanbanSquare, MessagesSquare, Plug, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell, Sidebar, type NavGroup, type NavItem } from "@g4ai/ds";
import { me, org } from "../data/workspace";
import { atlasRoutes } from "./atlas-shell";
import { frameHref } from "./frame-route";

/*
 * Casca do "Assistente G4": conversas, execuções de agentes e o assistente
 * dentro do CRM. Mesmo workspace (Acme) e mesma pessoa do Atlas.
 * Celular: pílula com Conversas · Execuções · No CRM; o resto em "Mais".
 */

export const assistantRoutes = {
  chat: frameHref("ai-chat"),
  runs: frameHref("ai-agent-run"),
  inCrm: frameHref("ai-assistant"),
  models: frameHref("settings-integrations", { id: "claude" }),
  usage: frameHref("settings-billing"),
} as const;

const main: NavItem[] = [
  { href: assistantRoutes.chat, label: "Conversas", icon: MessagesSquare },
  { href: assistantRoutes.runs, label: "Execuções", icon: History, badge: 1 },
  { href: assistantRoutes.inCrm, label: "No CRM", icon: KanbanSquare },
];

const groups: NavGroup[] = [
  { label: "Assistente", items: main },
  {
    label: "Conta",
    items: [
      { href: assistantRoutes.models, label: "Modelos e fontes", icon: Plug },
      { href: assistantRoutes.usage, label: "Uso e plano", icon: Coins },
      { href: atlasRoutes.home, label: "Voltar ao Atlas", icon: ArrowLeft },
    ],
  },
];

export function AssistantShell({ current, children, collapsed = false }: { current: string; children: ReactNode; collapsed?: boolean }) {
  return (
    <AppShell
      product="Assistente G4"
      workspace={org.name}
      mobileNav="tabbar"
      tabs={main}
      currentPath={current}
      sidebar={({ mobileOpen }) => (
        <Sidebar
          product="Assistente G4"
          workspace={org.name}
          currentPath={current}
          mobileOpen={mobileOpen}
          collapsed={collapsed}
          mark={
            <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-primary text-on-primary">
              <Sparkles className="h-4 w-4" />
            </span>
          }
          groups={groups}
          user={{ name: me.name, initials: me.initials, role: me.title, href: frameHref("settings-profile") }}
        />
      )}
    >
      {children}
    </AppShell>
  );
}

