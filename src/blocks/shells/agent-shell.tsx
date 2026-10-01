import { Bot, FolderKanban, History, ListChecks, MessagesSquare, Network, Settings, Sparkles, SquareTerminal } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell, Avatar, IconRail, Tooltip, type NavItem, type RailItem } from "@g4ai/ds";
import { me, org } from "../data/workspace";
import { frameHref } from "./frame-route";

/*
 * Casca do "Agente G4" (workspace de análise). Trilho de ícones à esquerda:
 * a área útil fica para conversa + artefatos. Celular: pílula com os mesmos
 * destinos (a conversa ocupa a tela; artefato abre por cima).
 */

export const agentRoutes = {
  workspace: frameHref("ai-workspace"),
  projects: frameHref("ai-projects"),
  trace: frameHref("ai-trace"),
  conversation: frameHref("ai-conversation"),
  chat: frameHref("ai-chat"),
  builder: frameHref("ai-agent-builder"),
  tasks: frameHref("ai-task-proposals"),
  runs: frameHref("ai-agent-run"),
  settings: frameHref("settings-integrations", { id: "claude" }),
} as const;

const rail: RailItem[][] = [
  [
    { href: agentRoutes.workspace, label: "Workspace", icon: Sparkles },
    { href: agentRoutes.projects, label: "Projetos", icon: FolderKanban, dot: true },
    { href: agentRoutes.conversation, label: "Conversa com aprovação", icon: MessagesSquare },
    { href: agentRoutes.tasks, label: "Tarefas propostas", icon: ListChecks },
  ],
  [
    { href: agentRoutes.builder, label: "Agentes", icon: Bot },
    { href: agentRoutes.trace, label: "Inspetor de execução", icon: Network },
    { href: agentRoutes.runs, label: "Execuções", icon: History },
    { href: agentRoutes.chat, label: "Chat livre", icon: SquareTerminal },
  ],
  [{ href: agentRoutes.settings, label: "Modelos e fontes", icon: Settings }],
];

const tabs: NavItem[] = [
  { href: agentRoutes.workspace, label: "Workspace", icon: Sparkles },
  { href: agentRoutes.projects, label: "Projetos", icon: FolderKanban },
  { href: agentRoutes.trace, label: "Execução", icon: Network },
  { href: agentRoutes.conversation, label: "Conversa", icon: MessagesSquare },
];

export function AgentShell({ current, children }: { current: string; children: ReactNode }) {
  return (
    <AppShell
      product="Agente G4"
      workspace={org.name}
      mobileNav="tabbar"
      tabs={tabs}
      currentPath={current}
      sidebar={({ mobileOpen }) => (
        <IconRail
          groups={rail}
          currentPath={current}
          mobileOpen={mobileOpen}
          mark={
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-on-primary" aria-label="Agente G4">
              <Sparkles className="h-4 w-4" />
            </span>
          }
          footer={
            <Tooltip content={`${me.name} · ${me.title}`} side="right">
              <a href={frameHref("settings-profile")} aria-label="Seu perfil" className="rounded-full">
                <Avatar initials={me.initials} tint={me.tint} size="sm" name={me.name} />
              </a>
            </Tooltip>
          }
        />
      )}
    >
      {children}
    </AppShell>
  );
}
